// ============================================
// Recurring Document Service
// บริการเอกสารที่เกิดซ้ำอัตโนมัติ (Recurring Document Engine)
// ============================================

import prisma from '@/lib/db';
import { addMonths, addQuarters, addYears, startOfDay, isBefore, isAfter, setDate } from 'date-fns';

// ============================================
// Type Definitions
// ============================================

export type RecurringType = 'INVOICE' | 'EXPENSE' | 'RECEIPT';
export type RecurringFrequency = 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
export type RecurringRunStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface RecurringDocumentInput {
  type: RecurringType;
  referenceId?: string;
  title: string;
  description?: string;
  frequency: RecurringFrequency;
  dayOfMonth: number;
  startDate: Date;
  endDate?: Date;
  isActive?: boolean;
  createdBy: string;
}

export interface RecurringDocumentRunInput {
  recurringId: string;
  runAt: Date;
  status: RecurringRunStatus;
  documentId?: string;
  error?: string;
}

// ============================================
// Custom Error Classes
// ============================================

export class RecurringDocumentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RecurringDocumentValidationError';
  }
}

export class RecurringDocumentNotFoundError extends Error {
  constructor(id: string) {
    super(`Recurring document not found: ${id}`);
    this.name = 'RecurringDocumentNotFoundError';
  }
}

export class RecurringDocumentInactiveError extends Error {
  constructor(id: string) {
    super(`Recurring document is inactive: ${id}`);
    this.name = 'RecurringDocumentInactiveError';
  }
}

// ============================================
// Number Generation Functions
// ============================================

function pad(num: number, size: number = 4): string {
  return String(num).padStart(size, '0');
}

function getPrefixForType(type: RecurringType): string {
  switch (type) {
    case 'INVOICE':
      return 'INV';
    case 'EXPENSE':
      return 'EXP';
    case 'RECEIPT':
      return 'RC';
    default:
      return 'RD';
  }
}

// ============================================
// Core Functions
// ============================================

/**
 * Calculate next run date based on frequency and last run
 */
export function calculateNextRun(
  lastRunAt: Date,
  frequency: RecurringFrequency,
  dayOfMonth: number
): Date {
  let nextDate: Date;

  switch (frequency) {
    case 'MONTHLY':
      nextDate = addMonths(lastRunAt, 1);
      break;
    case 'QUARTERLY':
      nextDate = addQuarters(lastRunAt, 1);
      break;
    case 'YEARLY':
      nextDate = addYears(lastRunAt, 1);
      break;
    default:
      nextDate = addMonths(lastRunAt, 1);
  }

  // Handle dayOfMonth edge case (e.g., 31st in February/April/June/Sept/Nov)
  const maxDayInMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
  const targetDay = Math.min(dayOfMonth, maxDayInMonth);

  return setDate(nextDate, targetDay);
}

/**
 * Get all recurring documents that are due to run
 */
export async function getDueDocuments(): Promise<any[]> {
  const now = new Date();

  return prisma.recurringDocument.findMany({
    where: {
      isActive: true,
      nextRunAt: { lte: now },
      OR: [{ endDate: null }, { endDate: { gte: now } }],
    },
    orderBy: { nextRunAt: 'asc' },
  });
}

/**
 * Process a single recurring document - creates the actual document
 */
export async function processSingleDocument(
  recurring: any
): Promise<{ documentId: string | null; error: string | null }> {
  try {
    switch (recurring.type) {
      case 'INVOICE':
        return await createInvoiceFromRecurring(recurring);
      case 'EXPENSE':
        return await createExpenseFromRecurring(recurring);
      case 'RECEIPT':
        return await createReceiptFromRecurring(recurring);
      default:
        return { documentId: null, error: `Unknown type: ${recurring.type}` };
    }
  } catch (error: any) {
    return { documentId: null, error: error.message };
  }
}

/**
 * Create invoice from recurring template
 */
async function createInvoiceFromRecurring(
  recurring: any
): Promise<{ documentId: string; error: string | null }> {
  // Get the template invoice if referenceId is provided
  let templateInvoice = null;
  if (recurring.referenceId) {
    templateInvoice = await prisma.invoice.findUnique({
      where: { id: recurring.referenceId },
      include: { lines: true, customer: true },
    });
  }

  if (!templateInvoice) {
    return { documentId: null, error: 'Template invoice not found' };
  }

  // Generate invoice number
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `INV-${year}${month}`;

  const lastInvoice = await prisma.invoice.findFirst({
    where: { invoiceNo: { startsWith: prefix } },
    orderBy: { invoiceNo: 'desc' },
  });

  let nextNum = 1;
  if (lastInvoice) {
    const parts = lastInvoice.invoiceNo.split('-');
    const lastNum = parseInt(parts[parts.length - 1] || '0');
    nextNum = lastNum + 1;
  }

  const invoiceNo = `${prefix}-${pad(nextNum)}`;

  // Create new invoice based on template
  const newInvoice = await prisma.invoice.create({
    data: {
      invoiceNo,
      invoiceDate: now,
      dueDate: templateInvoice.dueDate && templateInvoice.invoiceDate
        ? new Date(now.getTime() + (templateInvoice.dueDate.getTime() - templateInvoice.invoiceDate.getTime()))
        : undefined,
      customerId: templateInvoice.customerId,
      type: 'TAX_INVOICE',
      reference: `Recurring: ${recurring.title} (${recurring.id})`,
      subtotal: templateInvoice.subtotal,
      vatRate: templateInvoice.vatRate,
      vatAmount: templateInvoice.vatAmount,
      totalAmount: templateInvoice.totalAmount,
      discountAmount: templateInvoice.discountAmount,
      discountPercent: templateInvoice.discountPercent,
      netAmount: templateInvoice.netAmount,
      paidAmount: 0,
      status: 'DRAFT',
      notes: templateInvoice.notes,
      internalNotes: `Auto-generated from recurring document: ${recurring.title}`,
      terms: templateInvoice.terms,
      lines: {
        create: templateInvoice.lines.map((line, index) => ({
          lineNo: index + 1,
          productId: line.productId,
          description: line.description,
          quantity: line.quantity,
          unit: line.unit,
          unitPrice: line.unitPrice,
          discount: line.discount,
          amount: line.amount,
          vatRate: line.vatRate,
          vatAmount: line.vatAmount,
        })),
      },
    },
  });

  return { documentId: newInvoice.id, error: null };
}

/**
 * Create expense/purchase invoice from recurring template
 */
async function createExpenseFromRecurring(
  recurring: any
): Promise<{ documentId: string; error: string | null }> {
  // Get the template purchase invoice if referenceId is provided
  let templateExpense = null;
  if (recurring.referenceId) {
    templateExpense = await prisma.purchaseInvoice.findUnique({
      where: { id: recurring.referenceId },
      include: { lines: true, vendor: true },
    });
  }

  if (!templateExpense) {
    return { documentId: null, error: 'Template expense not found' };
  }

  // Generate invoice number
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `EXP-${year}${month}`;

  const lastExpense = await prisma.purchaseInvoice.findFirst({
    where: { invoiceNo: { startsWith: prefix } },
    orderBy: { invoiceNo: 'desc' },
  });

  let nextNum = 1;
  if (lastExpense) {
    const parts = lastExpense.invoiceNo.split('-');
    const lastNum = parseInt(parts[parts.length - 1] || '0');
    nextNum = lastNum + 1;
  }

  const invoiceNo = `${prefix}-${pad(nextNum)}`;

  // Create new purchase invoice based on template
  const newExpense = await prisma.purchaseInvoice.create({
    data: {
      invoiceNo,
      invoiceDate: now,
      dueDate: templateExpense.dueDate && templateExpense.invoiceDate
        ? new Date(now.getTime() + (templateExpense.dueDate.getTime() - templateExpense.invoiceDate.getTime()))
        : undefined,
      vendorId: templateExpense.vendorId,
      reference: `Recurring: ${recurring.title} (${recurring.id})`,
      subtotal: templateExpense.subtotal,
      vatRate: templateExpense.vatRate,
      vatAmount: templateExpense.vatAmount,
      totalAmount: templateExpense.totalAmount,
      discountAmount: templateExpense.discountAmount,
      netAmount: templateExpense.netAmount,
      paidAmount: 0,
      status: 'DRAFT',
      notes: templateExpense.notes,
      internalNotes: `Auto-generated from recurring document: ${recurring.title}`,
    },
  });

  return { documentId: newExpense.id, error: null };
}

/**
 * Create receipt from recurring template
 */
async function createReceiptFromRecurring(
  recurring: any
): Promise<{ documentId: string; error: string | null }> {
  // Get the template receipt if referenceId is provided
  let templateReceipt = null;
  if (recurring.referenceId) {
    templateReceipt = await prisma.receipt.findUnique({
      where: { id: recurring.referenceId },
      include: { allocations: true },
    });
  }

  if (!templateReceipt) {
    return { documentId: null, error: 'Template receipt not found' };
  }

  // Generate receipt number
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `RC-${year}${month}`;

  const lastReceipt = await prisma.receipt.findFirst({
    where: { receiptNo: { startsWith: prefix } },
    orderBy: { receiptNo: 'desc' },
  });

  let nextNum = 1;
  if (lastReceipt) {
    const parts = lastReceipt.receiptNo.split('-');
    const lastNum = parseInt(parts[parts.length - 1] || '0');
    nextNum = lastNum + 1;
  }

  const receiptNo = `${prefix}-${pad(nextNum)}`;

  // Create new receipt based on template
  const newReceipt = await prisma.receipt.create({
    data: {
      receiptNo,
      receiptDate: now,
      customerId: templateReceipt.customerId,
      reference: `Recurring: ${recurring.title} (${recurring.id})`,
      amount: templateReceipt.amount,
      totalAmount: templateReceipt.totalAmount,
      depositAmount: templateReceipt.depositAmount,
      status: 'DRAFT',
      notes: templateReceipt.notes,
      internalNotes: `Auto-generated from recurring document: ${recurring.title}`,
    },
  });

  return { documentId: newReceipt.id, error: null };
}

// ============================================
// CRUD Operations
// ============================================

/**
 * Create a new recurring document pattern
 */
export async function createRecurringDocument(input: RecurringDocumentInput): Promise<any> {
  // Validate dayOfMonth
  if (input.dayOfMonth < 1 || input.dayOfMonth > 28) {
    throw new RecurringDocumentValidationError('dayOfMonth must be between 1 and 28');
  }

  // Calculate first nextRunAt from startDate
  const startDate = startOfDay(input.startDate);
  let nextRunAt = setDate(startDate, input.dayOfMonth);

  // If the calculated date is before startDate, move to next period
  if (isBefore(nextRunAt, startDate)) {
    nextRunAt = calculateNextRun(nextRunAt, input.frequency, input.dayOfMonth);
  }

  return prisma.recurringDocument.create({
    data: {
      type: input.type,
      referenceId: input.referenceId,
      title: input.title,
      description: input.description,
      frequency: input.frequency,
      dayOfMonth: input.dayOfMonth,
      startDate: input.startDate,
      endDate: input.endDate,
      nextRunAt,
      isActive: input.isActive ?? true,
      createdBy: input.createdBy,
    },
  });
}

/**
 * Get a recurring document by ID
 */
export async function getRecurringDocument(id: string): Promise<any> {
  const recurring = await prisma.recurringDocument.findUnique({
    where: { id },
    include: { runs: { orderBy: { createdAt: 'desc' } } },
  });

  if (!recurring) {
    throw new RecurringDocumentNotFoundError(id);
  }

  return recurring;
}

/**
 * List all recurring documents with optional filtering
 */
export async function listRecurringDocuments(
  options: {
    type?: RecurringType;
    isActive?: boolean;
    page?: number;
    limit?: number;
  } = {}
): Promise<{ data: any[]; total: number }> {
  const { type, isActive, page = 1, limit = 50 } = options;

  const where: any = {};
  if (type) where.type = type;
  if (typeof isActive === 'boolean') where.isActive = isActive;

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.recurringDocument.findMany({
      where,
      include: {
        _count: { select: { runs: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.recurringDocument.count({ where }),
  ]);

  return { data, total };
}

/**
 * Update a recurring document
 */
export async function updateRecurringDocument(
  id: string,
  input: Partial<RecurringDocumentInput>
): Promise<any> {
  const existing = await prisma.recurringDocument.findUnique({ where: { id } });

  if (!existing) {
    throw new RecurringDocumentNotFoundError(id);
  }

  // Validate dayOfMonth if provided
  if (input.dayOfMonth !== undefined && (input.dayOfMonth < 1 || input.dayOfMonth > 28)) {
    throw new RecurringDocumentValidationError('dayOfMonth must be between 1 and 28');
  }

  const updateData: any = { ...input };

  // If frequency or dayOfMonth changed, recalculate nextRunAt
  if (input.frequency !== undefined || input.dayOfMonth !== undefined) {
    const newFrequency = input.frequency ?? existing.frequency;
    const newDayOfMonth = input.dayOfMonth ?? existing.dayOfMonth;
    const lastRun = existing.lastRunAt ?? existing.startDate;
    updateData.nextRunAt = calculateNextRun(lastRun, newFrequency, newDayOfMonth);
  }

  return prisma.recurringDocument.update({
    where: { id },
    data: updateData,
  });
}

/**
 * Delete (deactivate) a recurring document
 */
export async function deleteRecurringDocument(id: string): Promise<void> {
  const existing = await prisma.recurringDocument.findUnique({ where: { id } });

  if (!existing) {
    throw new RecurringDocumentNotFoundError(id);
  }

  // Soft delete by deactivating
  await prisma.recurringDocument.update({
    where: { id },
    data: { isActive: false },
  });
}

/**
 * Hard delete a recurring document (for admin cleanup)
 */
export async function hardDeleteRecurringDocument(id: string): Promise<void> {
  await prisma.recurringDocument.delete({ where: { id } });
}

// ============================================
// Processing Functions
// ============================================

/**
 * Process all due recurring documents
 * Returns array of results for each document processed
 */
export async function processRecurringDocuments(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
  results: Array<{ id: string; documentId: string | null; error: string | null }>;
}> {
  const dueDocuments = await getDueDocuments();

  const results: Array<{ id: string; documentId: string | null; error: string | null }> = [];
  let succeeded = 0;
  let failed = 0;

  for (const recurring of dueDocuments) {
    // Check if already ran today (idempotency)
    const today = startOfDay(new Date());
    const alreadyRanToday = await prisma.recurringDocumentRun.findFirst({
      where: {
        recurringId: recurring.id,
        runAt: { gte: today },
      },
    });

    if (alreadyRanToday) {
      console.log(`Recurring document ${recurring.id} already ran today, skipping`);
      continue;
    }

    // Create run record
    const run = await prisma.recurringDocumentRun.create({
      data: {
        recurringId: recurring.id,
        runAt: new Date(),
        status: 'PENDING',
      },
    });

    // Process the document
    const result = await processSingleDocument(recurring);

    // Update run record
    await prisma.recurringDocumentRun.update({
      where: { id: run.id },
      data: {
        status: result.error ? 'FAILED' : 'COMPLETED',
        documentId: result.documentId,
        error: result.error,
      },
    });

    // Update recurring document with new lastRunAt and nextRunAt
    if (!result.error) {
      await prisma.recurringDocument.update({
        where: { id: recurring.id },
        data: {
          lastRunAt: new Date(),
          nextRunAt: calculateNextRun(new Date(), recurring.frequency, recurring.dayOfMonth),
        },
      });
    }

    results.push({ id: recurring.id, ...result });
    if (result.error) {
      failed++;
    } else {
      succeeded++;
    }
  }

  return {
    processed: dueDocuments.length,
    succeeded,
    failed,
    results,
  };
}

/**
 * Get run history for a recurring document
 */
export async function getRecurringRuns(
  recurringId: string,
  options: { page?: number; limit?: number } = {}
): Promise<{ data: any[]; total: number }> {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.recurringDocumentRun.findMany({
      where: { recurringId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.recurringDocumentRun.count({ where: { recurringId } }),
  ]);

  return { data, total };
}
