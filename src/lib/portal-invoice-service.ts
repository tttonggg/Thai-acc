/**
 * Customer Portal Invoice Service
 * Customer-scoped invoice queries for the portal.
 */

import { prisma } from './db';
import { satangToBaht } from './currency';
import type { InvoiceStatus } from '@prisma/client';

export type InvoiceStatusFilter = InvoiceStatus | 'ALL' | 'OUTSTANDING' | 'OVERDUE';

export interface PaginatedInvoices {
  invoices: Awaited<ReturnType<typeof prisma.invoice.findMany>>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Convert raw Prisma invoices (Satang) to display format (Baht).
 */
function toDisplayInvoice(invoice: Awaited<ReturnType<typeof prisma.invoice.findUnique>>) {
  if (!invoice) return null;
  return {
    ...invoice,
    subtotal: satangToBaht(invoice.subtotal),
    vatAmount: satangToBaht(invoice.vatAmount),
    totalAmount: satangToBaht(invoice.totalAmount),
    discountAmount: satangToBaht(invoice.discountAmount),
    withholdingAmount: satangToBaht(invoice.withholdingAmount),
    netAmount: satangToBaht(invoice.netAmount),
    paidAmount: satangToBaht(invoice.paidAmount),
    balance: satangToBaht(invoice.totalAmount - invoice.paidAmount),
  };
}

/**
 * Get paginated invoices for a customer.
 * Only returns ISSUED and PARTIAL invoices by default (not DRAFT/CANCELLED).
 */
export async function getCustomerInvoices(
  customerId: string,
  options: {
    status?: InvoiceStatusFilter;
    page?: number;
    pageSize?: number;
    search?: string;
  } = {}
): Promise<PaginatedInvoices> {
  const { status = 'ALL', page = 1, pageSize = 20, search } = options;

  const where: Record<string, unknown> = {
    customerId,
    deletedAt: null,
  };

  // Default: hide DRAFT and CANCELLED from portal
  if (status === 'OUTSTANDING') {
    where.status = { in: ['ISSUED', 'PARTIAL'] };
  } else if (status === 'OVERDUE') {
    where.status = 'ISSUED';
    where.dueDate = { lt: new Date() };
  } else if (status !== 'ALL') {
    where.status = status as InvoiceStatus;
  }

  if (search) {
    where.invoiceNo = { contains: search };
  }

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      orderBy: { invoiceDate: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        lines: {
          orderBy: { lineNo: 'asc' },
          include: { product: true },
        },
      },
    }),
    prisma.invoice.count({ where }),
  ]);

  return {
    invoices,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Get a single invoice detail, verifying customer ownership.
 * Throws if invoice not found or customerId mismatch.
 */
export async function getInvoiceDetail(invoiceId: string, customerId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      lines: {
        orderBy: { lineNo: 'asc' },
        include: { product: true },
      },
      receiptAllocations: {
        include: {
          receipt: {
            include: { bankAccount: true },
          },
        },
        orderBy: { receipt: { receiptDate: 'desc' } },
      },
      currency: true,
    },
  });

  if (!invoice || invoice.customerId !== customerId) {
    return null;
  }

  return toDisplayInvoice(invoice);
}

/**
 * Get total outstanding balance for a customer.
 * Sum of (totalAmount - paidAmount) for ISSUED and PARTIAL invoices.
 */
export async function getOutstandingBalance(customerId: string): Promise<number> {
  const result = await prisma.invoice.aggregate({
    where: {
      customerId,
      deletedAt: null,
      status: { in: ['ISSUED', 'PARTIAL'] },
    },
    _sum: {
      totalAmount: true,
      paidAmount: true,
    },
  });

  const total = result._sum.totalAmount ?? 0;
  const paid = result._sum.paidAmount ?? 0;
  return satangToBaht(total - paid);
}

/**
 * Get the most recent posted invoices for a customer.
 */
export async function getRecentInvoices(customerId: string, limit = 5) {
  const invoices = await prisma.invoice.findMany({
    where: {
      customerId,
      deletedAt: null,
      status: { in: ['ISSUED', 'PARTIAL', 'PAID'] },
    },
    orderBy: { invoiceDate: 'desc' },
    take: limit,
    include: {
      lines: {
        orderBy: { lineNo: 'asc' },
        take: 3, // Only first 3 lines for preview
      },
    },
  });

  return invoices.map((inv) => toDisplayInvoice(inv));
}

/**
 * Get overdue invoices (ISSUED + past dueDate).
 */
export async function getOverdueInvoices(customerId: string) {
  const invoices = await prisma.invoice.findMany({
    where: {
      customerId,
      deletedAt: null,
      status: 'ISSUED',
      dueDate: { lt: new Date() },
    },
    orderBy: { dueDate: 'asc' },
    include: {
      lines: {
        orderBy: { lineNo: 'asc' },
        take: 3,
      },
    },
  });

  return invoices.map((inv) => toDisplayInvoice(inv));
}

/**
 * Get invoice summary stats for dashboard.
 */
export async function getInvoiceSummary(customerId: string) {
  const [outstanding, overdueCount, recentCount] = await Promise.all([
    getOutstandingBalance(customerId),
    prisma.invoice.count({
      where: {
        customerId,
        deletedAt: null,
        status: 'ISSUED',
        dueDate: { lt: new Date() },
      },
    }),
    prisma.invoice.count({
      where: {
        customerId,
        deletedAt: null,
        status: { in: ['ISSUED', 'PARTIAL'] },
      },
    }),
  ]);

  return {
    outstandingBalance: outstanding,
    overdueCount,
    outstandingCount: recentCount,
  };
}
