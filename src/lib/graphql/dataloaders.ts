/**
 * DataLoaders for GraphQL N+1 Prevention
 * Phase D: API Mastery - GraphQL Layer
 */

import DataLoader from 'dataloader';
import { prisma } from '@/lib/db';

// Batch loader function type
type BatchLoader<K, V> = (keys: K[]) => Promise<V[]>;

// Create a DataLoader with proper typing
function createLoader<K, V>(
  batchLoadFn: BatchLoader<K, V>,
  keyFn: (item: any) => K
): DataLoader<K, V, K> {
  return new DataLoader<K, V, K>(async (keys) => {
    const items = await batchLoadFn(keys as K[]);
    const itemMap = new Map<K, V>();

    for (const item of items) {
      const key = keyFn(item);
      itemMap.set(key, item);
    }

    return keys.map((key) => itemMap.get(key) as V);
  });
}

/**
 * Create all DataLoaders for GraphQL resolvers
 */
export function createDataLoaders() {
  return {
    // Customer loaders
    customerById: createLoader(
      (ids: string[]) => prisma.customer.findMany({ where: { id: { in: ids } } }),
      (c) => c.id
    ),

    // Vendor loaders
    vendorById: createLoader(
      (ids: string[]) => prisma.vendor.findMany({ where: { id: { in: ids } } }),
      (v) => v.id
    ),

    // Product loaders
    productById: createLoader(
      (ids: string[]) => prisma.product.findMany({ where: { id: { in: ids } } }),
      (p) => p.id
    ),

    // Chart of Account loaders
    accountById: createLoader(
      (ids: string[]) => prisma.chartOfAccount.findMany({ where: { id: { in: ids } } }),
      (a) => a.id
    ),

    // Invoice loaders
    invoiceById: createLoader(
      (ids: string[]) =>
        prisma.invoice.findMany({
          where: { id: { in: ids } },
          include: { lines: true, customer: true },
        }),
      (i) => i.id
    ),

    // Invoice lines by invoice ID
    invoiceLinesByInvoiceId: createLoader(
      (ids: string[]) =>
        prisma.invoiceLine.findMany({
          where: { invoiceId: { in: ids } },
          include: { product: true },
        }),
      (l) => l.invoiceId
    ),

    // Purchase Invoice loaders
    purchaseInvoiceById: createLoader(
      (ids: string[]) =>
        prisma.purchaseInvoice.findMany({
          where: { id: { in: ids } },
          include: { lines: true, vendor: true },
        }),
      (i) => i.id
    ),

    // Purchase invoice lines by purchase ID
    purchaseLinesByPurchaseId: createLoader(
      (ids: string[]) =>
        prisma.purchaseInvoiceLine.findMany({
          where: { purchaseId: { in: ids } },
          include: { product: true },
        }),
      (l) => l.purchaseId
    ),

    // Journal Entry loaders
    journalEntryById: createLoader(
      (ids: string[]) =>
        prisma.journalEntry.findMany({
          where: { id: { in: ids } },
          include: { lines: { include: { account: true } } },
        }),
      (j) => j.id
    ),

    // Journal lines by entry ID
    journalLinesByEntryId: createLoader(
      (ids: string[]) =>
        prisma.journalLine.findMany({
          where: { entryId: { in: ids } },
          include: { account: true },
        }),
      (l) => l.entryId
    ),

    // Receipt loaders
    receiptById: createLoader(
      (ids: string[]) =>
        prisma.receipt.findMany({
          where: { id: { in: ids } },
          include: { customer: true, bankAccount: true },
        }),
      (r) => r.id
    ),

    // Receipt allocations by receipt ID
    receiptAllocationsByReceiptId: createLoader(
      (ids: string[]) =>
        prisma.receiptAllocation.findMany({
          where: { receiptId: { in: ids } },
          include: { invoice: true },
        }),
      (a) => a.receiptId
    ),

    // Payment loaders
    paymentById: createLoader(
      (ids: string[]) =>
        prisma.payment.findMany({
          where: { id: { in: ids } },
          include: { vendor: true, bankAccount: true },
        }),
      (p) => p.id
    ),

    // Payment allocations by payment ID
    paymentAllocationsByPaymentId: createLoader(
      (ids: string[]) =>
        prisma.paymentAllocation.findMany({
          where: { paymentId: { in: ids } },
          include: { invoice: true },
        }),
      (a) => a.paymentId
    ),

    // Bank Account loaders
    bankAccountById: createLoader(
      (ids: string[]) => prisma.bankAccount.findMany({ where: { id: { in: ids } } }),
      (b) => b.id
    ),

    // Employee loaders
    employeeById: createLoader(
      (ids: string[]) => prisma.employee.findMany({ where: { id: { in: ids } } }),
      (e) => e.id
    ),

    // User loaders
    userById: createLoader(
      (ids: string[]) => prisma.user.findMany({ where: { id: { in: ids } } }),
      (u) => u.id
    ),

    // Invoices by customer ID
    invoicesByCustomerId: createLoader(
      (ids: string[]) =>
        prisma.invoice.findMany({
          where: { customerId: { in: ids } },
          orderBy: { invoiceDate: 'desc' },
        }),
      (i) => i.customerId
    ),

    // Purchase invoices by vendor ID
    purchaseInvoicesByVendorId: createLoader(
      (ids: string[]) =>
        prisma.purchaseInvoice.findMany({
          where: { vendorId: { in: ids } },
          orderBy: { invoiceDate: 'desc' },
        }),
      (i) => i.vendorId
    ),

    // Chart of Account children by parent ID
    accountChildrenByParentId: createLoader(
      (ids: string[]) =>
        prisma.chartOfAccount.findMany({
          where: { parentId: { in: ids } },
          orderBy: { code: 'asc' },
        }),
      (a) => a.parentId
    ),
  };
}

export type DataLoaders = ReturnType<typeof createDataLoaders>;
