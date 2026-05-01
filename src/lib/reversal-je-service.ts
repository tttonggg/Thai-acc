/**
 * Reversal Journal Entry Service
 *
 * Creates reversal Journal Entries for voiding posted documents.
 * All money values are in Int Satang (1/100 Baht).
 *
 * Logic:
 * 1. Fetch original JournalEntry via document's journalEntryId
 * 2. Validate: original JE.status !== 'REVERSED' && original doc status !== 'CANCELLED'
 * 3. Create reversal JE with swapped Dr/Cr lines
 * 4. Update original doc: status → 'CANCELLED', versionNo++
 * 5. Update original JE: status → 'REVERSED'
 * 6. Return reversal JE
 */

import { db } from '@/lib/db';

// ============================================================
// Types
// ============================================================

type DocumentType =
  | 'INVOICE'
  | 'RECEIPT'
  | 'PAYMENT'
  | 'PURCHASE_INVOICE'
  | 'CREDIT_NOTE'
  | 'DEBIT_NOTE';

interface VoidResult {
  success: boolean;
  reversalJournalEntry?: {
    id: string;
    entryNo: string;
    date: Date;
    description: string | null;
    totalDebit: number;
    totalCredit: number;
    lines: Array<{
      accountId: string;
      description: string | null;
      debit: number;
      credit: number;
    }>;
  };
  error?: string;
}

// ============================================================
// Helper: Generate Document Number
// ============================================================

async function generateJournalEntryNo(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `JE-REV-${year}`;

  // Find the highest sequence number for this year
  const lastEntry = await db.journalEntry.findFirst({
    where: {
      entryNo: { startsWith: prefix },
    },
    orderBy: { entryNo: 'desc' },
  });

  if (lastEntry) {
    const lastSeq = parseInt(lastEntry.entryNo.split('-').pop() || '0', 10);
    const nextSeq = lastSeq + 1;
    return `${prefix}-${nextSeq.toString().padStart(4, '0')}`;
  }

  return `${prefix}-0001`;
}

// ============================================================
// Helper: Get Document with JournalEntryId
// ============================================================

interface DocumentWithJournalEntry {
  id: string;
  documentNo: string;
  status: string;
  journalEntryId: string | null;
  journalEntry: {
    id: string;
    entryNo: string;
    status: string;
    date: Date;
    description: string | null;
    lines: Array<{
      id: string;
      accountId: string;
      description: string | null;
      debit: number;
      credit: number;
    }>;
  } | null;
}

async function getDocumentWithJournalEntry(
  type: DocumentType,
  id: string
): Promise<DocumentWithJournalEntry | null> {
  switch (type) {
    case 'INVOICE': {
      const result = await db.invoice.findUnique({
        where: { id },
        select: {
          id: true,
          invoiceNo: true,
          status: true,
          journalEntryId: true,
          journalEntry: {
            include: { lines: true },
          },
        },
      });
      if (!result) return null;
      return {
        id: result.id,
        documentNo: result.invoiceNo,
        status: result.status,
        journalEntryId: result.journalEntryId,
        journalEntry: result.journalEntry,
      };
    }
    case 'PURCHASE_INVOICE': {
      const result = await db.purchaseInvoice.findUnique({
        where: { id },
        select: {
          id: true,
          invoiceNo: true,
          status: true,
          journalEntryId: true,
          journalEntry: {
            include: { lines: true },
          },
        },
      });
      if (!result) return null;
      return {
        id: result.id,
        documentNo: result.invoiceNo,
        status: result.status,
        journalEntryId: result.journalEntryId,
        journalEntry: result.journalEntry,
      };
    }
    case 'RECEIPT': {
      const result = await db.receipt.findUnique({
        where: { id },
        select: {
          id: true,
          receiptNo: true,
          status: true,
          journalEntryId: true,
          journalEntry: {
            include: { lines: true },
          },
        },
      });
      if (!result) return null;
      return {
        id: result.id,
        documentNo: result.receiptNo,
        status: result.status,
        journalEntryId: result.journalEntryId,
        journalEntry: result.journalEntry,
      };
    }
    case 'PAYMENT': {
      const result = await db.payment.findUnique({
        where: { id },
        select: {
          id: true,
          paymentNo: true,
          status: true,
          journalEntryId: true,
          journalEntry: {
            include: { lines: true },
          },
        },
      });
      if (!result) return null;
      return {
        id: result.id,
        documentNo: result.paymentNo,
        status: result.status,
        journalEntryId: result.journalEntryId,
        journalEntry: result.journalEntry,
      };
    }
    case 'CREDIT_NOTE': {
      const result = await db.creditNote.findUnique({
        where: { id },
        select: {
          id: true,
          creditNoteNo: true,
          status: true,
          journalEntryId: true,
          journalEntry: {
            include: { lines: true },
          },
        },
      });
      if (!result) return null;
      return {
        id: result.id,
        documentNo: result.creditNoteNo,
        status: result.status,
        journalEntryId: result.journalEntryId,
        journalEntry: result.journalEntry,
      };
    }
    case 'DEBIT_NOTE': {
      const result = await db.debitNote.findUnique({
        where: { id },
        select: {
          id: true,
          debitNoteNo: true,
          status: true,
          journalEntryId: true,
          journalEntry: {
            include: { lines: true },
          },
        },
      });
      if (!result) return null;
      return {
        id: result.id,
        documentNo: result.debitNoteNo,
        status: result.status,
        journalEntryId: result.journalEntryId,
        journalEntry: result.journalEntry,
      };
    }
    default:
      return null;
  }
}

// ============================================================
// Helper: Update Document Status
// ============================================================

async function updateDocumentStatus(type: DocumentType, id: string, status: string): Promise<void> {
  const updateData: Record<string, unknown> = {
    status,
    updatedAt: new Date(),
  };

  // Add versionNo increment for models that have it
  switch (type) {
    case 'RECEIPT':
    case 'PAYMENT':
    case 'CREDIT_NOTE':
    case 'DEBIT_NOTE':
      updateData.versionNo = { increment: 1 };
      break;
    default:
      // INVOICE, PURCHASE_INVOICE don't have versionNo
      break;
  }

  switch (type) {
    case 'INVOICE':
      await db.invoice.update({ where: { id }, data: updateData });
      break;
    case 'PURCHASE_INVOICE':
      await db.purchaseInvoice.update({ where: { id }, data: updateData });
      break;
    case 'RECEIPT':
      await db.receipt.update({ where: { id }, data: updateData });
      break;
    case 'PAYMENT':
      await db.payment.update({ where: { id }, data: updateData });
      break;
    case 'CREDIT_NOTE':
      await db.creditNote.update({ where: { id }, data: updateData });
      break;
    case 'DEBIT_NOTE':
      await db.debitNote.update({ where: { id }, data: updateData });
      break;
  }
}

// ============================================================
// Helper: Validate Accounting Period is OPEN
// ============================================================

async function validatePeriodIsOpen(date: Date): Promise<void> {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-12

  const period = await db.accountingPeriod.findUnique({
    where: {
      year_month: {
        year,
        month,
      },
    },
  });

  if (!period) {
    throw new Error(`Accounting period for ${month}/${year} not found. Please create it first.`);
  }

  if (period.status !== 'OPEN') {
    throw new Error(
      `Accounting period for ${month}/${year} is ${period.status}. Cannot create entries in a ${period.status} period.`
    );
  }
}

// ============================================================
// Main: Void Document
// ============================================================

/**
 * Void a document by creating a reversal Journal Entry.
 *
 * @param type - Document type (INVOICE, RECEIPT, PAYMENT, PURCHASE_INVOICE, CREDIT_NOTE, DEBIT_NOTE)
 * @param id - Document ID
 * @param userId - User performing the void action
 * @returns VoidResult with reversal JE details
 */
export async function voidDocument(
  type: DocumentType,
  id: string,
  userId: string
): Promise<VoidResult> {
  // Step 1: Fetch original document with journal entry
  const doc = await getDocumentWithJournalEntry(type, id);

  if (!doc) {
    return {
      success: false,
      error: `${type} not found`,
    };
  }

  // Step 2: Validate original JE exists
  if (!doc.journalEntryId || !doc.journalEntry) {
    return {
      success: false,
      error: `${doc.documentNo} has no journal entry to reverse`,
    };
  }

  const originalJe = doc.journalEntry;

  // Step 3: Validate original JE is not already reversed
  if (originalJe.status === 'REVERSED') {
    return {
      success: false,
      error: `${doc.documentNo}: Journal entry ${originalJe.entryNo} is already reversed`,
    };
  }

  // Step 4: Validate original document is not already cancelled
  if (doc.status === 'CANCELLED') {
    return {
      success: false,
      error: `${doc.documentNo} is already cancelled`,
    };
  }

  // Step 5: Validate accounting period is OPEN
  const reversalDate = new Date();
  await validatePeriodIsOpen(reversalDate);

  // Step 6: Create reversal JE inside a transaction
  const reversalEntry = await db.$transaction(async (tx) => {
    // Create reversal journal entry
    // All Dr lines → Cr, all Cr lines → Dr
    const reversalLines = originalJe.lines.map((line, index) => ({
      lineNo: index + 1,
      accountId: line.accountId,
      description: line.description,
      // Swap debit and credit
      debit: line.credit,
      credit: line.debit,
    }));

    // Calculate totals (should be equal for valid JE)
    const totalDebit = reversalLines.reduce((sum, l) => sum + l.debit, 0);
    const totalCredit = reversalLines.reduce((sum, l) => sum + l.credit, 0);

    const entryNo = await generateJournalEntryNo();

    const reversalJe = await tx.journalEntry.create({
      data: {
        entryNo,
        date: reversalDate,
        description: `Void: ${originalJe.description || originalJe.entryNo}`,
        reference: `Reversal of ${originalJe.entryNo}`,
        documentType: type,
        documentId: id,
        totalDebit,
        totalCredit,
        status: 'POSTED',
        isReversing: true,
        reversingId: originalJe.id,
        createdById: userId,
        lines: {
          create: reversalLines,
        },
      },
      include: {
        lines: {
          select: {
            accountId: true,
            description: true,
            debit: true,
            credit: true,
          },
        },
      },
    });

    // Update original JE status to REVERSED
    await tx.journalEntry.update({
      where: { id: originalJe.id },
      data: {
        status: 'REVERSED',
        updatedAt: new Date(),
      },
    });

    // Update original document status to CANCELLED
    await updateDocumentStatus(type, id, 'CANCELLED');

    return reversalJe;
  });

  return {
    success: true,
    reversalJournalEntry: {
      id: reversalEntry.id,
      entryNo: reversalEntry.entryNo,
      date: reversalEntry.date,
      description: reversalEntry.description,
      totalDebit: reversalEntry.totalDebit,
      totalCredit: reversalEntry.totalCredit,
      lines: reversalEntry.lines,
    },
  };
}

// ============================================================
// Helper: Check if Document is Reversible
// ============================================================

/**
 * Check if a document can be voided (has a valid journal entry)
 */
export async function canVoidDocument(
  type: DocumentType,
  id: string
): Promise<{ canVoid: boolean; reason?: string }> {
  const doc = await getDocumentWithJournalEntry(type, id);

  if (!doc) {
    return { canVoid: false, reason: `${type} not found` };
  }

  if (!doc.journalEntryId || !doc.journalEntry) {
    return { canVoid: false, reason: `${doc.documentNo} has no journal entry to reverse` };
  }

  if (doc.journalEntry.status === 'REVERSED') {
    return { canVoid: false, reason: `${doc.documentNo}: Journal entry already reversed` };
  }

  if (doc.status === 'CANCELLED') {
    return { canVoid: false, reason: `${doc.documentNo} is already cancelled` };
  }

  return { canVoid: true };
}

// ============================================================
// Example Reversal Illustration
// ============================================================

/**
 * Example:
 * Original JE:
 *   DR Cash 10700
 *   CR Revenue 10000
 *   CR VAT 700
 *
 * Reversal JE:
 *   DR Revenue 10000
 *   DR VAT 700
 *   CR Cash 10700
 *
 * This effectively cancels out the original entry.
 */
export function illustrateReversal(): void {
  console.log(`
Original Journal Entry:
  DR Cash         10,700 (Satang)
  CR Revenue      10,000 (Satang)
  CR VAT           700 (Satang)

Reversal Journal Entry:
  DR Revenue      10,000 (Satang)
  DR VAT             700 (Satang)
  CR Cash         10,700 (Satang)

Net Effect: Zero (balanced cancellation)
  `);
}
