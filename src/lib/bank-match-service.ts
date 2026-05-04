/**
 * Bank Statement Matching Service
 *
 * Matches bank statement entries against journal entries and payments
 * by amount matching, date proximity (within 3 days), and reference number.
 *
 * Unmatched entries require manual review.
 */
import prisma from '@/lib/db';

const MATCH_DATE_WINDOW_DAYS = 3;

export interface MatchResult {
  entryId: string;
  matchedEntryId: string | null;
  matchedEntryType: 'JOURNAL_ENTRY' | 'PAYMENT' | 'RECEIPT' | null;
  matchConfidence: number; // 0-100
  matchReason: string;
}

export interface MatchedEntries {
  matched: MatchResult[];
  unmatched: Array<{
    id: string;
    description: string;
    amount: number;
    type: 'CREDIT' | 'DEBIT';
    valueDate: Date;
    reference: string | null;
  }>;
}

/**
 * Match bank statement entries for a specific bank account
 *
 * Strategy:
 * 1. For CREDIT entries (deposits): match against Receipts where amount matches
 * 2. For DEBIT entries (withdrawals): match against Payments where amount matches
 * 3. Also check journal entries for manual GL entries
 */
export async function matchBankEntries(
  bankAccountId: string,
  statementEntryIds?: string[]
): Promise<MatchedEntries> {
  // Fetch unmatched statement entries
  const whereClause: any = {
    bankAccountId,
    matched: false,
  };

  if (statementEntryIds) {
    whereClause.id = { in: statementEntryIds };
  }

  const statementEntries = await prisma.bankStatementEntry.findMany({
    where: whereClause,
    orderBy: { valueDate: 'asc' },
  });

  const results: MatchResult[] = [];
  const unmatched: MatchedEntries['unmatched'] = [];

  for (const entry of statementEntries) {
    const matchResult = await findMatch(entry);

    if (matchResult.matchedEntryId) {
      results.push({
        entryId: entry.id,
        matchedEntryId: matchResult.matchedEntryId,
        matchedEntryType: matchResult.matchedEntryType,
        matchConfidence: matchResult.matchConfidence,
        matchReason: matchResult.matchReason,
      });

      // Mark as matched
      await prisma.bankStatementEntry.update({
        where: { id: entry.id },
        data: {
          matched: true,
          matchedEntryId: matchResult.matchedEntryId,
          matchedEntryType: matchResult.matchedEntryType,
          matchConfidence: matchResult.matchConfidence,
        },
      });
    } else {
      unmatched.push({
        id: entry.id,
        description: entry.description,
        amount: entry.amount,
        type: entry.type as 'CREDIT' | 'DEBIT',
        valueDate: entry.valueDate,
        reference: entry.reference,
      });
    }
  }

  return { matched: results, unmatched };
}

/**
 * Find a match for a single bank statement entry
 */
async function findMatch(entry: {
  amount: number;
  type: string;
  valueDate: Date;
  reference: string | null;
  description: string;
}): Promise<{
  matchedEntryId: string | null;
  matchedEntryType: 'JOURNAL_ENTRY' | 'PAYMENT' | 'RECEIPT' | null;
  matchConfidence: number;
  matchReason: string;
}> {
  // Calculate date window
  const minDate = new Date(entry.valueDate);
  minDate.setDate(minDate.getDate() - MATCH_DATE_WINDOW_DAYS);
  const maxDate = new Date(entry.valueDate);
  maxDate.setDate(maxDate.getDate() + MATCH_DATE_WINDOW_DAYS);

  // Strategy 1: Exact amount + reference match (highest confidence)
  if (entry.reference) {
    const refMatch = await findMatchByReference(entry.amount, entry.type, entry.reference);
    if (refMatch) {
      return refMatch;
    }
  }

  // Strategy 2: Exact amount + date proximity
  const amountMatch = await findMatchByAmount(
    entry.amount,
    entry.type,
    minDate,
    maxDate,
    entry.valueDate
  );
  if (amountMatch) {
    return amountMatch;
  }

  // Strategy 3: Check description for keywords to help with matching
  const keywordMatch = await findMatchByDescription(
    entry.amount,
    entry.type,
    minDate,
    maxDate,
    entry.description
  );
  if (keywordMatch) {
    return keywordMatch;
  }

  // No match found
  return {
    matchedEntryId: null,
    matchedEntryType: null,
    matchConfidence: 0,
    matchReason: 'ไม่พบรายการที่ตรงกัน',
  };
}

/**
 * Find match by reference number
 */
async function findMatchByReference(
  amount: number,
  type: string,
  reference: string
): Promise<{
  matchedEntryId: string;
  matchedEntryType: 'JOURNAL_ENTRY' | 'PAYMENT' | 'RECEIPT';
  matchConfidence: number;
  matchReason: string;
} | null> {
  // For CREDIT entries, check Receipts by chequeNo
  if (type === 'CREDIT') {
    const receipt = await prisma.receipt.findFirst({
      where: {
        chequeNo: reference,
        amount: amount,
        deletedAt: null,
      },
    });
    if (receipt) {
      return {
        matchedEntryId: receipt.id,
        matchedEntryType: 'RECEIPT',
        matchConfidence: 100,
        matchReason: `ตรงกันตามเช็คเลขที่ ${reference}`,
      };
    }
  }

  // For DEBIT entries, check Payments by chequeNo
  if (type === 'DEBIT') {
    const payment = await prisma.payment.findFirst({
      where: {
        chequeNo: reference,
        amount: amount,
        deletedAt: null,
      },
    });
    if (payment) {
      return {
        matchedEntryId: payment.id,
        matchedEntryType: 'PAYMENT',
        matchConfidence: 100,
        matchReason: `ตรงกันตามเช็คเลขที่ ${reference}`,
      };
    }
  }

  return null;
}

/**
 * Find match by amount and date range
 */
async function findMatchByAmount(
  amount: number,
  type: string,
  minDate: Date,
  maxDate: Date,
  entryValueDate: Date
): Promise<{
  matchedEntryId: string;
  matchedEntryType: 'JOURNAL_ENTRY' | 'PAYMENT' | 'RECEIPT';
  matchConfidence: number;
  matchReason: string;
} | null> {
  // For CREDIT entries, check Receipts
  if (type === 'CREDIT') {
    const receipt = await prisma.receipt.findFirst({
      where: {
        amount: amount,
        receiptDate: {
          gte: minDate,
          lte: maxDate,
        },
        deletedAt: null,
      },
      orderBy: { receiptDate: 'desc' },
    });
    if (receipt) {
      // Calculate days difference between bank entry valueDate and receipt date
      const entryDate = new Date(entryValueDate);
      const receiptDate = new Date(receipt.receiptDate);
      const daysDiff =
        Math.abs(receiptDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24);

      // Confidence: 100% if same day, 80% within 1 day, 60% within 3 days
      let matchConfidence = 60;
      if (daysDiff === 0) {
        matchConfidence = 100;
      } else if (daysDiff <= 1) {
        matchConfidence = 80;
      } else if (daysDiff <= 3) {
        matchConfidence = 60;
      }

      return {
        matchedEntryId: receipt.id,
        matchedEntryType: 'RECEIPT',
        matchConfidence,
        matchReason:
          daysDiff === 0
            ? 'ตรงกันตามจำนวนเงินและวันที่ (วันเดียวกัน)'
            : `ตรงกันตามจำนวนเงินและวันที่ (${Math.round(daysDiff)} วัน)`,
      };
    }
  }

  // For DEBIT entries, check Payments
  if (type === 'DEBIT') {
    const payment = await prisma.payment.findFirst({
      where: {
        amount: amount,
        paymentDate: {
          gte: minDate,
          lte: maxDate,
        },
        deletedAt: null,
      },
      orderBy: { paymentDate: 'desc' },
    });
    if (payment) {
      // Calculate days difference between bank entry valueDate and payment date
      const entryDate = new Date(entryValueDate);
      const paymentDate = new Date(payment.paymentDate);
      const daysDiff =
        Math.abs(paymentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24);

      // Confidence: 100% if same day, 80% within 1 day, 60% within 3 days
      let matchConfidence = 60;
      if (daysDiff === 0) {
        matchConfidence = 100;
      } else if (daysDiff <= 1) {
        matchConfidence = 80;
      } else if (daysDiff <= 3) {
        matchConfidence = 60;
      }

      return {
        matchedEntryId: payment.id,
        matchedEntryType: 'PAYMENT',
        matchConfidence,
        matchReason:
          daysDiff === 0
            ? 'ตรงกันตามจำนวนเงินและวันที่ (วันเดียวกัน)'
            : `ตรงกันตามจำนวนเงินและวันที่ (${Math.round(daysDiff)} วัน)`,
      };
    }
  }

  // Check journal entries (can be either debit or credit)
  const journalEntry = await prisma.journalEntry.findFirst({
    where: {
      date: {
        gte: minDate,
        lte: maxDate,
      },
      // Journal entries have line items with debit/credit amounts
      journalLines: {
        some: {
          OR: [{ debit: amount }, { credit: amount }],
        },
      },
    },
    orderBy: { date: 'desc' },
  });

  if (journalEntry) {
    return {
      matchedEntryId: journalEntry.id,
      matchedEntryType: 'JOURNAL_ENTRY',
      matchConfidence: 60,
      matchReason: 'ตรงกันตามจำนวนเงินและวันที่ในสมุดบัญชี',
    };
  }

  return null;
}

/**
 * Find match by description keywords (lower confidence)
 */
async function findMatchByDescription(
  amount: number,
  type: string,
  minDate: Date,
  maxDate: Date,
  description: string
): Promise<{
  matchedEntryId: string;
  matchedEntryType: 'JOURNAL_ENTRY' | 'PAYMENT' | 'RECEIPT';
  matchConfidence: number;
  matchReason: string;
} | null> {
  // Extract potential reference numbers from description
  const refNumbers = description.match(/\d{6,}/g);

  if (!refNumbers || refNumbers.length === 0) {
    return null;
  }

  // Try each potential reference
  for (const ref of refNumbers) {
    const refMatch = await findMatchByReference(amount, type, ref);
    if (refMatch) {
      return {
        ...refMatch,
        matchConfidence: Math.min(refMatch.matchConfidence, 80),
        matchReason: `พบหมายเลขอ้างอิงในรายละเอียด: ${ref}`,
      };
    }
  }

  return null;
}

/**
 * Get bank statement entries for review
 */
export async function getUnmatchedEntries(bankAccountId: string) {
  return await prisma.bankStatementEntry.findMany({
    where: {
      bankAccountId,
      matched: false,
    },
    orderBy: { valueDate: 'asc' },
    select: {
      id: true,
      statementDate: true,
      valueDate: true,
      description: true,
      amount: true,
      type: true,
      reference: true,
      createdAt: true,
    },
  });
}

/**
 * Manually match a bank statement entry to a journal/payment/receipt
 */
export async function manualMatch(
  statementEntryId: string,
  matchedEntryId: string,
  matchedEntryType: 'JOURNAL_ENTRY' | 'PAYMENT' | 'RECEIPT'
) {
  const entry = await prisma.bankStatementEntry.findUnique({
    where: { id: statementEntryId },
  });

  if (!entry) {
    throw new Error('ไม่พบรายการแยกประปราย');
  }

  // Verify the matched entry exists
  if (matchedEntryType === 'RECEIPT') {
    const receipt = await prisma.receipt.findUnique({
      where: { id: matchedEntryId },
    });
    if (!receipt) throw new Error('ไม่พบใบเสร็จ');
  } else if (matchedEntryType === 'PAYMENT') {
    const payment = await prisma.payment.findUnique({
      where: { id: matchedEntryId },
    });
    if (!payment) throw new Error('ไม่พบใบจ่าย');
  } else if (matchedEntryType === 'JOURNAL_ENTRY') {
    const journal = await prisma.journalEntry.findUnique({
      where: { id: matchedEntryId },
    });
    if (!journal) throw new Error('ไม่พบบันทึกบัญชี');
  }

  return await prisma.bankStatementEntry.update({
    where: { id: statementEntryId },
    data: {
      matched: true,
      matchedEntryId,
    },
  });
}
