import { db } from '@/lib/db';
import { bahtToSatang, satangToBaht } from '@/lib/currency';

export interface PaymentLineInput {
  lineNo: number;
  purchaseInvoiceId?: string | null;
  amount: number;
  whtRate?: number;
  whtAmount?: number;
  notes?: string;
}

export interface PaymentLineOutput {
  id: string;
  lineNo: number;
  purchaseInvoiceId: string | null;
  amount: number;
  whtRate: number;
  whtAmount: number;
  notes: string | null;
  createdAt: Date;
}

/**
 * Calculate payment totals from lines (if lines exist, use them; otherwise use flat amount)
 * Backwards compatible: if no lines, falls back to using payment.amount directly
 */
export function calculatePaymentTotalsFromLines(
  lines: PaymentLineOutput[] | undefined,
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
 * Create payment with optional line-based amounts
 * Falls back to flat amount if no lines provided
 */
export async function createPaymentWithLines(
  data: {
    vendorId: string;
    paymentDate: Date;
    paymentMethod: string;
    bankAccountId?: string;
    chequeNo?: string;
    chequeDate?: Date;
    amount: number; // Baht input
    notes?: string;
    lines?: PaymentLineInput[];
    status?: 'DRAFT' | 'POSTED' | 'CANCELLED';
    createdById?: string;
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

  // Generate payment number
  const paymentNo = options?.generateDocNumber
    ? await options.generateDocNumber('PAYMENT', 'PAY')
    : `PAY-${Date.now()}`;

  const payment = await db.payment.create({
    data: {
      paymentNo,
      paymentDate: flatData.paymentDate,
      vendorId: flatData.vendorId,
      paymentMethod: flatData.paymentMethod as any,
      bankAccountId: flatData.bankAccountId,
      chequeNo: flatData.chequeNo,
      chequeDate: flatData.chequeDate,
      amount: totalAmount,
      whtAmount: totalWhtAmount,
      unallocated,
      notes: flatData.notes,
      status: flatData.status || 'DRAFT',
      createdById: flatData.createdById,
      ...(hasLines
        ? {
            lines: {
              create: lines!.map((line) => ({
                lineNo: line.lineNo,
                purchaseInvoiceId: line.purchaseInvoiceId,
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
      vendor: true,
      bankAccount: true,
      lines: {
        include: {
          purchaseInvoice: {
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
      allocations: true,
    },
  });

  return payment;
}

/**
 * Get payment with lines (backwards compatible - returns flat amount if no lines)
 */
export async function getPaymentWithLines(paymentId: string) {
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: {
      vendor: true,
      bankAccount: true,
      lines: {
        include: {
          purchaseInvoice: {
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

  if (!payment) return null;

  // Convert Satang to Baht
  return {
    ...payment,
    amount: satangToBaht(payment.amount),
    whtAmount: satangToBaht(payment.whtAmount),
    unallocated: satangToBaht(payment.unallocated),
    totalAllocated: satangToBaht(payment.allocations.reduce((sum, a) => sum + a.amount, 0)),
    totalLineAmount:
      payment.lines.length > 0
        ? satangToBaht(payment.lines.reduce((sum, l) => sum + l.amount, 0))
        : satangToBaht(payment.amount),
    lines: payment.lines.map((line) => ({
      ...line,
      amount: satangToBaht(line.amount),
      whtAmount: satangToBaht(line.whtAmount),
      purchaseInvoice: line.purchaseInvoice
        ? { ...line.purchaseInvoice, totalAmount: satangToBaht(line.purchaseInvoice.totalAmount) }
        : null,
    })),
    allocations: payment.allocations.map((alloc) => ({
      ...alloc,
      amount: satangToBaht(alloc.amount),
      whtAmount: satangToBaht(alloc.whtAmount),
      invoice: alloc.invoice
        ? { ...alloc.invoice, totalAmount: satangToBaht(alloc.invoice.totalAmount) }
        : null,
    })),
  };
}
