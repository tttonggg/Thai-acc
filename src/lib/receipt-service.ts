import { db } from '@/lib/db';
import { bahtToSatang, satangToBaht } from '@/lib/currency';

export interface ReceiptLineInput {
  lineNo: number;
  invoiceId?: string | null;
  amount: number;
  whtRate?: number;
  whtAmount?: number;
  notes?: string;
}

export interface ReceiptLineOutput {
  id: string;
  lineNo: number;
  invoiceId: string | null;
  amount: number;
  whtRate: number;
  whtAmount: number;
  notes: string | null;
  createdAt: Date;
}

/**
 * Calculate receipt totals from lines (if lines exist, use them; otherwise use flat amount)
 * Backwards compatible: if no lines, falls back to using receipt.amount directly
 */
export function calculateReceiptTotalsFromLines(
  lines: ReceiptLineOutput[] | undefined,
  flatAmount: number,
  flatWhtAmount: number
): { amount: number; whtAmount: number; unallocated: number } {
  if (!lines || lines.length === 0) {
    // Backwards compatible: use flat amounts
    return {
      amount: flatAmount,
      whtAmount: flatWhtAmount,
      unallocated: flatAmount,
    };
  }

  const amount = lines.reduce((sum, line) => sum + line.amount, 0);
  const whtAmount = lines.reduce((sum, line) => sum + line.whtAmount, 0);
  const unallocated = flatAmount - amount;

  return { amount, whtAmount, unallocated };
}

/**
 * Create receipt with optional line-based amounts
 * Falls back to flat amount if no lines provided
 */
export async function createReceiptWithLines(
  data: {
    receiptDate: Date;
    customerId: string;
    paymentMethod: string;
    bankAccountId?: string | null;
    chequeNo?: string;
    chequeDate?: Date;
    amount: number; // Baht input
    notes?: string;
    lines?: ReceiptLineInput[];
  },
  options?: { generateDocNumber?: (type: string, prefix: string) => Promise<string> }
) {
  const { lines, ...flatData } = data;
  const hasLines = lines && lines.length > 0;

  // Calculate totals
  let totalAmount = bahtToSatang(flatData.amount);
  let totalWhtAmount = 0;
  let unallocated = totalAmount;

  if (hasLines) {
    totalAmount = lines.reduce((sum, l) => sum + bahtToSatang(l.amount), 0);
    totalWhtAmount = lines.reduce((sum, l) => sum + bahtToSatang(l.whtAmount || 0), 0);
    unallocated = bahtToSatang(flatData.amount) - totalAmount;
  }

  // Generate receipt number
  const receiptNo = options?.generateDocNumber
    ? await options.generateDocNumber('RECEIPT', 'RCP')
    : `RCP-${Date.now()}`;

  const receipt = await db.receipt.create({
    data: {
      receiptNo,
      receiptDate: flatData.receiptDate,
      customerId: flatData.customerId,
      paymentMethod: flatData.paymentMethod as any,
      bankAccountId: flatData.bankAccountId,
      chequeNo: flatData.chequeNo,
      chequeDate: flatData.chequeDate,
      amount: totalAmount,
      whtAmount: totalWhtAmount,
      unallocated,
      notes: flatData.notes,
      status: 'DRAFT',
      ...(hasLines
        ? {
            lines: {
              create: lines!.map((line) => ({
                lineNo: line.lineNo,
                invoiceId: line.invoiceId,
                amount: bahtToSatang(line.amount),
                whtRate: line.whtRate || 0,
                whtAmount: bahtToSatang(line.whtAmount || 0),
                notes: line.notes,
              })),
            },
          }
        : {}),
    },
    include: {
      customer: true,
      bankAccount: true,
      lines: {
        include: {
          invoice: {
            select: {
              id: true,
              invoiceNo: true,
              invoiceDate: true,
              totalAmount: true,
            },
          },
        },
      },
      allocations: true,
    },
  });

  return receipt;
}

/**
 * Get receipt with lines (backwards compatible - returns flat amount if no lines)
 */
export async function getReceiptWithLines(receiptId: string) {
  const receipt = await db.receipt.findUnique({
    where: { id: receiptId },
    include: {
      customer: true,
      bankAccount: true,
      lines: {
        include: {
          invoice: {
            select: {
              id: true,
              invoiceNo: true,
              invoiceDate: true,
              totalAmount: true,
            },
          },
        },
        orderBy: { lineNo: 'asc' },
      },
      allocations: {
        include: {
          invoice: {
            select: {
              id: true,
              invoiceNo: true,
              invoiceDate: true,
              totalAmount: true,
            },
          },
        },
      },
      journalEntry: {
        select: { id: true, entryNo: true },
      },
    },
  });

  if (!receipt) return null;

  // Convert Satang to Baht
  return {
    ...receipt,
    amount: satangToBaht(receipt.amount),
    whtAmount: satangToBaht(receipt.whtAmount),
    unallocated: satangToBaht(receipt.unallocated),
    totalAllocated: satangToBaht(receipt.allocations.reduce((sum, a) => sum + a.amount, 0)),
    totalLineAmount:
      receipt.lines.length > 0
        ? satangToBaht(receipt.lines.reduce((sum, l) => sum + l.amount, 0))
        : satangToBaht(receipt.amount),
    lines: receipt.lines.map((line) => ({
      ...line,
      amount: satangToBaht(line.amount),
      whtAmount: satangToBaht(line.whtAmount),
      invoice: line.invoice
        ? { ...line.invoice, totalAmount: satangToBaht(line.invoice.totalAmount) }
        : null,
    })),
    allocations: receipt.allocations.map((alloc) => ({
      ...alloc,
      amount: satangToBaht(alloc.amount),
      whtAmount: satangToBaht(alloc.whtAmount),
      invoice: alloc.invoice
        ? { ...alloc.invoice, totalAmount: satangToBaht(alloc.invoice.totalAmount) }
        : null,
    })),
  };
}
