// ============================================
// Revenue Auto-Service
// บริการสร้างรายได้อัตโนมัติ
//
// Implements revenue GL journal entry creation for issued invoices.
// Replaces inline JE creation in src/app/api/invoices/[id]/issue/route.ts
// ============================================

import { PrismaClient } from '@prisma/client';
import { generateDocNumber } from './api-utils';

export interface RevenueJEContext {
  userId: string;
  invoiceId: string;
  invoiceNo: string;
  invoiceDate: Date;
  /** Total including VAT (Satang) */
  totalAmount: number;
  /** Subtotal before VAT (Satang) */
  subtotal: number;
  /** VAT amount (Satang) */
  vatAmount: number;
}

export interface RevenueJELine {
  accountCode: string;
  accountId: string;
  description: string;
  debit: number; // Satang
  credit: number; // Satang
}

export interface CreateRevenueJournalEntryResult {
  journalEntryId: string;
  entryNo: string;
  lines: RevenueJELine[];
}

/**
 * Create revenue GL journal entry for an issued invoice.
 *
 * Creates balanced double-entry:
 *   DR: Accounts Receivable (1120)    = totalAmount (incl. VAT)
 *   CR: Sales Revenue (4100)          = subtotal
 *   CR: VAT Output Payable (2132)     = vatAmount (if > 0)
 *
 * @param db      - PrismaClient (passed in so caller controls tx)
 * @param ctx     - Invoice context (already fetched by caller)
 * @returns       - Created JE ID, entryNo, and line details
 */
export async function createRevenueJournalEntry(
  db: PrismaClient,
  ctx: RevenueJEContext
): Promise<CreateRevenueJournalEntryResult> {
  // Look up required accounts
  const [arAccount, revenueAccount, vatOutputAccount] = await Promise.all([
    db.chartOfAccount.findUnique({ where: { code: '1120' } }),
    db.chartOfAccount.findUnique({ where: { code: '4100' } }),
    db.chartOfAccount.findUnique({ where: { code: '2132' } }),
  ]);

  if (!arAccount || !revenueAccount || !vatOutputAccount) {
    throw new Error(
      `ไม่พบบัญชี: AR (1120=${!!arAccount}), รายได้ (4100=${!!revenueAccount}), VAT ขาย (2132=${!!vatOutputAccount})`
    );
  }

  // Validate accounting equation
  if (ctx.subtotal + ctx.vatAmount !== ctx.totalAmount) {
    throw new Error(
      `ยอดไม่ถูกต้อง: subtotal(${ctx.subtotal}) + vat(${ctx.vatAmount}) != total(${ctx.totalAmount})`
    );
  }

  const entryNo = await generateDocNumber('JOURNAL_ENTRY', 'JE');

  // Build JE lines
  const lines: RevenueJELine[] = [
    {
      accountCode: '1120',
      accountId: arAccount.id,
      description: `ลูกหนี้การค้า ${ctx.invoiceNo}`,
      debit: ctx.totalAmount,
      credit: 0,
    },
    {
      accountCode: '4100',
      accountId: revenueAccount.id,
      description: `รายได้ขาย ${ctx.invoiceNo}`,
      debit: 0,
      credit: ctx.subtotal,
    },
  ];

  // Only create VAT line if there's actually VAT
  if (ctx.vatAmount > 0) {
    lines.push({
      accountCode: '2132',
      accountId: vatOutputAccount.id,
      description: `ภาษีมูลค่าเพิ่มขาย ${ctx.invoiceNo}`,
      debit: 0,
      credit: ctx.vatAmount,
    });
  }

  // Create journal entry
  const journalEntry = await db.journalEntry.create({
    data: {
      entryNo,
      date: ctx.invoiceDate,
      description: `รายได้ขาย ${ctx.invoiceNo}`,
      reference: ctx.invoiceNo,
      documentType: 'INVOICE_REVENUE',
      documentId: ctx.invoiceId,
      totalDebit: ctx.totalAmount,
      totalCredit: ctx.totalAmount,
      status: 'POSTED',
      createdById: ctx.userId,
      approvedById: ctx.userId,
      approvedAt: new Date(),
      lines: {
        create: lines.map((line, idx) => ({
          lineNo: idx + 1,
          accountId: line.accountId,
          description: line.description,
          debit: line.debit,
          credit: line.credit,
          reference: ctx.invoiceNo,
        })),
      },
    },
  });

  return {
    journalEntryId: journalEntry.id,
    entryNo: journalEntry.entryNo,
    lines,
  };
}

/**
 * Create COGS journal entry for inventory items on invoice issuance.
 *
 *   DR: Cost of Goods Sold (5110)    = totalCOGS
 *   CR: Inventory (1140)             = totalCOGS
 *
 * @param db       - PrismaClient (passed in so caller controls tx)
 * @param ctx      - Invoice + line context
 * @param lines    - Invoice lines with product info (already fetched by caller)
 * @param userId   - User issuing the invoice
 * @returns        - Created JE ID and entryNo (or null if no COGS)
 */
export async function createCogsJournalEntry(
  db: PrismaClient,
  ctx: { invoiceId: string; invoiceNo: string; invoiceDate: Date; userId: string },
  lines: Array<{ productId: string | null; quantity: number }>
): Promise<{ journalEntryId: string; entryNo: string; totalCOGS: number } | null> {
  const productIds = lines.map((l) => l.productId).filter((id): id is string => id !== null);

  if (productIds.length === 0) return null;

  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, costPrice: true, isInventory: true },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  let totalCOGS = 0;
  for (const line of lines) {
    if (!line.productId) continue;
    const product = productMap.get(line.productId);
    if (product && product.isInventory) {
      totalCOGS += product.costPrice * line.quantity;
    }
  }

  if (totalCOGS <= 0) return null;

  const [cogsAccount, inventoryAccount] = await Promise.all([
    db.chartOfAccount.findUnique({ where: { code: '5110' } }),
    db.chartOfAccount.findUnique({ where: { code: '1140' } }),
  ]);

  if (!cogsAccount || !inventoryAccount) {
    throw new Error(
      `ไม่พบบัญชี: COGS (5110=${!!cogsAccount}), สินค้าคงเหลือ (1140=${!!inventoryAccount})`
    );
  }

  const entryNo = await generateDocNumber('JOURNAL_ENTRY', 'JE');

  const journalEntry = await db.journalEntry.create({
    data: {
      entryNo,
      date: ctx.invoiceDate,
      description: `ต้นทุนขาย ${ctx.invoiceNo}`,
      reference: ctx.invoiceNo,
      documentType: 'INVOICE',
      documentId: ctx.invoiceId,
      totalDebit: totalCOGS,
      totalCredit: totalCOGS,
      status: 'POSTED',
      createdById: ctx.userId,
      approvedById: ctx.userId,
      approvedAt: new Date(),
      lines: {
        create: [
          {
            lineNo: 1,
            accountId: cogsAccount.id,
            description: 'ต้นทุนขาย',
            debit: totalCOGS,
            credit: 0,
            reference: ctx.invoiceNo,
          },
          {
            lineNo: 2,
            accountId: inventoryAccount.id,
            description: 'ลดสินค้าคงเหลือ',
            debit: 0,
            credit: totalCOGS,
            reference: ctx.invoiceNo,
          },
        ],
      },
    },
  });

  return {
    journalEntryId: journalEntry.id,
    entryNo: journalEntry.entryNo,
    totalCOGS,
  };
}
