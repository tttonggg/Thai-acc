// ============================================
// 💼 Sales Order Service
// บริการใบสั่งขาย (Sales Order)
// ============================================

import prisma from '@/lib/db';
import { calculatePercent } from '@/lib/currency';
import { Prisma } from '@prisma/client';

// ============================================
// Custom Error Classes
// ============================================

export class SalesOrderValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SalesOrderValidationError';
  }
}

export class SalesOrderWorkflowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SalesOrderWorkflowError';
  }
}

export class SalesOrderNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SalesOrderNotFoundError';
  }
}

// ============================================
// Type Definitions
// ============================================

export type SalesOrderStatusType =
  | 'DRAFT'
  | 'PENDING'
  | 'APPROVED'
  | 'SENT'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'COMPLETED';

export interface SalesOrderLineInput {
  lineNo: number;
  productId?: string;
  description: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  discount?: number;
  vatRate?: number;
  shippedQty?: number;
  notes?: string;
}

export interface SalesOrderCreateInput {
  orderNo?: string;
  orderDate?: Date;
  customerId: string;
  quotationId?: string;
  expectedDate?: Date;
  customerContact?: string;
  customerEmail?: string;
  customerPhone?: string;
  shippingAddress?: string;
  shippingTerms?: string;
  paymentTerms?: string;
  vatRate?: number;
  discountAmount?: number;
  notes?: string;
  internalNotes?: string;
  createdById: string;
  lines: SalesOrderLineInput[];
}

export interface SalesOrderUpdateInput {
  orderDate?: Date;
  customerId?: string;
  quotationId?: string;
  expectedDate?: Date;
  customerContact?: string;
  customerEmail?: string;
  customerPhone?: string;
  shippingAddress?: string;
  shippingTerms?: string;
  paymentTerms?: string;
  vatRate?: number;
  discountAmount?: number;
  status?: SalesOrderStatusType;
  notes?: string;
  internalNotes?: string;
  updatedById?: string;
  lines?: SalesOrderLineInput[];
}

export interface SalesOrderWhereInput {
  id?: string;
  orderNo?: string;
  customerId?: string;
  status?: SalesOrderStatusType;
  isActive?: boolean;
  deletedAt?: any;
}

// ============================================
// Valid Status Transitions
// ============================================

const VALID_TRANSITIONS: Record<SalesOrderStatusType, SalesOrderStatusType[]> = {
  DRAFT: ['PENDING', 'CANCELLED'],
  PENDING: ['APPROVED', 'CANCELLED'],
  APPROVED: ['SENT', 'CANCELLED'],
  SENT: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: ['COMPLETED'],
  CANCELLED: [],
  COMPLETED: [],
};

// Status rank for immutability check
const STATUS_RANK: Record<SalesOrderStatusType, number> = {
  DRAFT: 0,
  PENDING: 1,
  APPROVED: 2,
  SENT: 3,
  CONFIRMED: 4,
  PROCESSING: 5,
  SHIPPED: 6,
  DELIVERED: 7,
  CANCELLED: 8,
  COMPLETED: 9,
};

// ============================================
// Number Generation
// ============================================

/**
 * Generate Sales Order Number
 * Format: SO{yyyy}{mm}-{sequence}
 * Example: SO202603-0001
 */
export async function generateSalesOrderNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `SO${year}${month}`;

  const lastOrder = await prisma.salesOrder.findFirst({
    where: { orderNo: { startsWith: prefix } },
    orderBy: { orderNo: 'desc' },
    select: { orderNo: true },
  });

  let sequence = 1;
  if (lastOrder) {
    const match = lastOrder.orderNo.match(/SO\d{6}-(\d{4})/);
    if (match) {
      sequence = parseInt(match[1]) + 1;
    }
  }

  return `${prefix}-${String(sequence).padStart(4, '0')}`;
}

// ============================================
// Calculation Functions
// ============================================

/**
 * Calculate line amounts in Satang
 */
export function calculateLineAmounts(line: SalesOrderLineInput): {
  subtotal: number;
  discount: number;
  afterDiscount: number;
  vatAmount: number;
  amount: number;
} {
  const subtotal = Math.round(line.quantity * line.unitPrice);
  const discount = Math.round(line.discount || 0);
  const afterDiscount = subtotal - discount;
  const vatRate = line.vatRate ?? 7;
  const vatAmount = Math.round(calculatePercent(afterDiscount, vatRate));
  const amount = afterDiscount + vatAmount;

  return { subtotal, discount, afterDiscount, vatAmount, amount };
}

/**
 * Calculate sales order totals from lines
 */
export function calculateSalesOrderTotals(
  lines: SalesOrderLineInput[],
  discountAmount: number = 0,
  vatRate: number = 7
): {
  subtotal: number;
  totalDiscount: number;
  afterDiscount: number;
  vatAmount: number;
  totalAmount: number;
} {
  const subtotal = lines.reduce((sum, line) => sum + Math.round(line.quantity * line.unitPrice), 0);
  const totalDiscount = discountAmount;
  const afterDiscount = subtotal - totalDiscount;
  const vatAmount = Math.round(calculatePercent(afterDiscount, vatRate));
  const totalAmount = afterDiscount + vatAmount;

  return { subtotal, totalDiscount, afterDiscount, vatAmount, totalAmount };
}

// ============================================
// Status Transition Validation
// ============================================

/**
 * Validate if a status transition is allowed
 */
export function validateStatusTransition(
  currentStatus: SalesOrderStatusType,
  newStatus: SalesOrderStatusType
): boolean {
  return VALID_TRANSITIONS[currentStatus]?.includes(newStatus) || false;
}

/**
 * Check if status is at or beyond confirmed (immutability check)
 */
export function isConfirmedOrBeyond(status: SalesOrderStatusType): boolean {
  return STATUS_RANK[status] >= STATUS_RANK['CONFIRMED'];
}

// ============================================
// CRUD Operations
// ============================================

/**
 * Create a new sales order with lines
 */
export async function createSalesOrder(data: SalesOrderCreateInput): Promise<any> {
  // Validate customer exists
  const customer = await prisma.customer.findUnique({
    where: { id: data.customerId },
  });
  if (!customer) {
    throw new SalesOrderValidationError('ไม่พบข้อมูลลูกค้า');
  }

  // Validate quotation if provided
  if (data.quotationId) {
    const quotation = await prisma.quotation.findUnique({
      where: { id: data.quotationId },
    });
    if (!quotation) {
      throw new SalesOrderValidationError('ไม่พบใบเสนอราคาที่อ้างอิง');
    }
    if (quotation.status !== 'APPROVED') {
      throw new SalesOrderValidationError(
        'ใบเสนอราคาต้องมีสถานะ APPROVED ก่อนจึงจะสามารถอ้างอิงได้'
      );
    }
  }

  // Generate order number if not provided
  const orderNo = data.orderNo || (await generateSalesOrderNumber());

  // Calculate totals from lines
  const totals = calculateSalesOrderTotals(data.lines, data.discountAmount || 0, data.vatRate || 7);

  return await prisma.salesOrder.create({
    data: {
      orderNo,
      orderDate: data.orderDate || new Date(),
      customerId: data.customerId,
      expectedDate: data.expectedDate,
      customerContact: data.customerContact,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      shippingAddress: data.shippingAddress,
      shippingTerms: data.shippingTerms,
      paymentTerms: data.paymentTerms,
      subtotal: totals.subtotal,
      vatRate: data.vatRate || 7,
      vatAmount: totals.vatAmount,
      totalAmount: totals.totalAmount,
      discountAmount: totals.totalDiscount,
      status: 'DRAFT',
      notes: data.notes,
      internalNotes: data.internalNotes,
      createdById: data.createdById,
      lines: {
        create: data.lines.map((line, index) => {
          const amounts = calculateLineAmounts(line);
          return {
            lineNo: line.lineNo || index + 1,
            productId: line.productId,
            description: line.description,
            quantity: line.quantity,
            shippedQty: line.shippedQty || 0,
            unit: line.unit || 'ชิ้น',
            unitPrice: line.unitPrice,
            discount: amounts.discount,
            amount: amounts.subtotal,
            vatRate: line.vatRate || 7,
            notes: line.notes,
          };
        }),
      },
    },
    include: {
      customer: true,
      lines: {
        orderBy: { lineNo: 'asc' },
      },
    },
  });
}

/**
 * Find a sales order by ID with lines, customer, and quotation
 */
export async function getSalesOrder(id: string): Promise<any> {
  const order = await prisma.salesOrder.findUnique({
    where: { id },
    include: {
      customer: true,
      lines: {
        orderBy: { lineNo: 'asc' },
        include: { product: true },
      },
    },
  });

  if (!order) {
    throw new SalesOrderNotFoundError('ไม่พบใบสั่งขาย');
  }

  return order;
}

/**
 * Find a sales order by order number
 */
export async function getSalesOrderByNo(orderNo: string): Promise<any> {
  const order = await prisma.salesOrder.findUnique({
    where: { orderNo },
    include: {
      customer: true,
      lines: {
        orderBy: { lineNo: 'asc' },
        include: { product: true },
      },
    },
  });

  if (!order) {
    throw new SalesOrderNotFoundError('ไม่พบใบสั่งขาย');
  }

  return order;
}

/**
 * List sales orders with filters and pagination
 */
export async function listSalesOrders(params: {
  status?: SalesOrderStatusType;
  customerId?: string;
  page?: number;
  limit?: number;
  orderBy?: any;
}): Promise<{ orders: any[]; total: number; page: number; limit: number }> {
  const { status, customerId, page = 1, limit = 20, orderBy = { orderDate: 'desc' } } = params;

  const skip = (page - 1) * limit;

  // Build filter
  const where: any = { deletedAt: null };
  if (status) where.status = status;
  if (customerId) where.customerId = customerId;

  const [orders, total] = await Promise.all([
    prisma.salesOrder.findMany({
      where,
      include: {
        customer: true,
        lines: { select: { id: true } },
      },
      skip,
      take: limit,
      orderBy,
    }),
    prisma.salesOrder.count({ where }),
  ]);

  return { orders, total, page, limit };
}

/**
 * Update a sales order
 * IMMUTABILITY: Cannot modify if status >= CONFIRMED
 */
export async function updateSalesOrder(id: string, data: SalesOrderUpdateInput): Promise<any> {
  const existing = await prisma.salesOrder.findUnique({ where: { id } });
  if (!existing) {
    throw new SalesOrderNotFoundError('ไม่พบใบสั่งขาย');
  }

  const currentStatus = existing.status as SalesOrderStatusType;

  // IMMUTABILITY: Cannot modify if status >= CONFIRMED
  if (isConfirmedOrBeyond(currentStatus)) {
    throw new SalesOrderWorkflowError('ไม่สามารถแก้ไขใบสั่งขายที่ยืนยันแล้ว');
  }

  // Validate status transition if status is being changed
  if (data.status && data.status !== currentStatus) {
    if (!validateStatusTransition(currentStatus, data.status)) {
      throw new SalesOrderWorkflowError(
        `ไม่สามารถเปลี่ยนสถานะจาก ${currentStatus} เป็น ${data.status}`
      );
    }
  }

  // Validate quotation if provided
  if (data.quotationId) {
    const quotation = await prisma.quotation.findUnique({
      where: { id: data.quotationId },
    });
    if (!quotation) {
      throw new SalesOrderValidationError('ไม่พบใบเสนอราคาที่อ้างอิง');
    }
    if (quotation.status !== 'APPROVED') {
      throw new SalesOrderValidationError(
        'ใบเสนอราคาต้องมีสถานะ APPROVED ก่อนจึงจะสามารถอ้างอิงได้'
      );
    }
  }

  // Build update data
  const updateData: any = {};

  if (data.orderDate) updateData.orderDate = data.orderDate;
  if (data.customerId) updateData.customerId = data.customerId;
  if (data.quotationId !== undefined) updateData.quotationId = data.quotationId;
  if (data.expectedDate !== undefined) updateData.expectedDate = data.expectedDate;
  if (data.customerContact !== undefined) updateData.customerContact = data.customerContact;
  if (data.customerEmail !== undefined) updateData.customerEmail = data.customerEmail;
  if (data.customerPhone !== undefined) updateData.customerPhone = data.customerPhone;
  if (data.shippingAddress !== undefined) updateData.shippingAddress = data.shippingAddress;
  if (data.shippingTerms !== undefined) updateData.shippingTerms = data.shippingTerms;
  if (data.paymentTerms !== undefined) updateData.paymentTerms = data.paymentTerms;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.internalNotes !== undefined) updateData.internalNotes = data.internalNotes;
  if (data.updatedById) updateData.updatedById = data.updatedById;

  // Handle status change with timestamps
  if (data.status && data.status !== currentStatus) {
    updateData.status = data.status;
    switch (data.status) {
      case 'APPROVED':
        updateData.approvedAt = new Date();
        break;
      case 'SENT':
        updateData.sentAt = new Date();
        break;
      case 'CONFIRMED':
        updateData.confirmedAt = new Date();
        break;
      case 'SHIPPED':
        updateData.shippedAt = new Date();
        break;
      case 'DELIVERED':
        updateData.deliveredAt = new Date();
        break;
    }
  }

  // Recalculate totals if lines provided
  if (data.lines) {
    const totals = calculateSalesOrderTotals(
      data.lines,
      data.discountAmount || 0,
      data.vatRate || existing.vatRate
    );
    updateData.subtotal = totals.subtotal;
    updateData.discountAmount = totals.totalDiscount;
    updateData.vatAmount = totals.vatAmount;
    updateData.totalAmount = totals.totalAmount;
    if (data.vatRate !== undefined) updateData.vatRate = data.vatRate;

    // Update lines
    updateData.lines = {
      deleteMany: { orderId: id },
      create: data.lines.map((line, index) => {
        const amounts = calculateLineAmounts(line);
        return {
          lineNo: line.lineNo || index + 1,
          productId: line.productId,
          description: line.description,
          quantity: line.quantity,
          shippedQty: line.shippedQty || 0,
          unit: line.unit || 'ชิ้น',
          unitPrice: line.unitPrice,
          discount: amounts.discount,
          amount: amounts.subtotal,
          vatRate: line.vatRate || 7,
          notes: line.notes,
        };
      }),
    };
  } else if (data.vatRate !== undefined) {
    // Recalculate VAT if vatRate changed but lines not changed
    const lines = await prisma.salesOrderLine.findMany({
      where: { orderId: id },
    });
    const lineInputs: SalesOrderLineInput[] = lines.map((l) => ({
      lineNo: l.lineNo,
      productId: l.productId || undefined,
      description: l.description,
      quantity: l.quantity,
      unit: l.unit,
      unitPrice: l.unitPrice,
      discount: l.discount,
      vatRate: l.vatRate,
    }));
    const totals = calculateSalesOrderTotals(
      lineInputs,
      data.discountAmount || existing.discountAmount,
      data.vatRate
    );
    updateData.subtotal = totals.subtotal;
    updateData.vatAmount = totals.vatAmount;
    updateData.totalAmount = totals.totalAmount;
  }

  return await prisma.salesOrder.update({
    where: { id },
    data: updateData,
    include: {
      customer: true,
      lines: { orderBy: { lineNo: 'asc' } },
    },
  });
}

/**
 * Delete a sales order (soft delete - only DRAFT status)
 */
export async function deleteSalesOrder(id: string, deletedBy?: string): Promise<any> {
  const order = await prisma.salesOrder.findUnique({ where: { id } });

  if (!order) {
    throw new SalesOrderNotFoundError('ไม่พบใบสั่งขาย');
  }

  // Only allow delete in DRAFT status
  if (order.status !== 'DRAFT') {
    throw new SalesOrderWorkflowError('สามารถลบได้เฉพาะใบสั่งขายที่อยู่ในสถานะ ร่าง เท่านั้น');
  }

  return await prisma.salesOrder.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      deletedBy,
    },
  });
}

// ============================================
// Status Transition Functions
// ============================================

/**
 * Submit order for approval (DRAFT -> PENDING)
 */
export async function submitForApproval(id: string): Promise<any> {
  const order = await prisma.salesOrder.findUnique({ where: { id } });

  if (!order) {
    throw new SalesOrderNotFoundError('ไม่พบใบสั่งขาย');
  }

  if (!validateStatusTransition(order.status as SalesOrderStatusType, 'PENDING')) {
    throw new SalesOrderWorkflowError(
      `ไม่สามารถส่งอนุมัติได้: ไม่สามารถเปลี่ยนสถานะจาก ${order.status} เป็น PENDING`
    );
  }

  return await prisma.salesOrder.update({
    where: { id },
    data: {
      status: 'PENDING',
    },
    include: { customer: true, lines: true },
  });
}

/**
 * Approve order (PENDING -> APPROVED)
 */
export async function approveOrder(id: string): Promise<any> {
  const order = await prisma.salesOrder.findUnique({ where: { id } });

  if (!order) {
    throw new SalesOrderNotFoundError('ไม่พบใบสั่งขาย');
  }

  if (!validateStatusTransition(order.status as SalesOrderStatusType, 'APPROVED')) {
    throw new SalesOrderWorkflowError(
      `ไม่สามารถอนุมัติได้: ไม่สามารถเปลี่ยนสถานะจาก ${order.status} เป็น APPROVED`
    );
  }

  return await prisma.salesOrder.update({
    where: { id },
    data: {
      status: 'APPROVED',
      approvedAt: new Date(),
    },
    include: { customer: true, lines: true },
  });
}

/**
 * Send order to customer (APPROVED -> SENT)
 */
export async function sendOrder(id: string): Promise<any> {
  const order = await prisma.salesOrder.findUnique({ where: { id } });

  if (!order) {
    throw new SalesOrderNotFoundError('ไม่พบใบสั่งขาย');
  }

  if (!validateStatusTransition(order.status as SalesOrderStatusType, 'SENT')) {
    throw new SalesOrderWorkflowError(
      `ไม่สามารถส่งให้ลูกค้าได้: ไม่สามารถเปลี่ยนสถานะจาก ${order.status} เป็น SENT`
    );
  }

  return await prisma.salesOrder.update({
    where: { id },
    data: {
      status: 'SENT',
      sentAt: new Date(),
    },
    include: { customer: true, lines: true },
  });
}

/**
 * Confirm order (SENT -> CONFIRMED)
 */
export async function confirmOrder(id: string): Promise<any> {
  const order = await prisma.salesOrder.findUnique({ where: { id } });

  if (!order) {
    throw new SalesOrderNotFoundError('ไม่พบใบสั่งขาย');
  }

  if (!validateStatusTransition(order.status as SalesOrderStatusType, 'CONFIRMED')) {
    throw new SalesOrderWorkflowError(
      `ไม่สามารถยืนยันได้: ไม่สามารถเปลี่ยนสถานะจาก ${order.status} เป็น CONFIRMED`
    );
  }

  return await prisma.salesOrder.update({
    where: { id },
    data: {
      status: 'CONFIRMED',
      confirmedAt: new Date(),
    },
    include: { customer: true, lines: true },
  });
}

/**
 * Ship order (CONFIRMED -> SHIPPED)
 */
export async function shipOrder(id: string): Promise<any> {
  const order = await prisma.salesOrder.findUnique({ where: { id } });

  if (!order) {
    throw new SalesOrderNotFoundError('ไม่พบใบสั่งขาย');
  }

  if (!validateStatusTransition(order.status as SalesOrderStatusType, 'SHIPPED')) {
    throw new SalesOrderWorkflowError(
      `ไม่สามารถจัดส่งได้: ไม่สามารถเปลี่ยนสถานะจาก ${order.status} เป็น SHIPPED`
    );
  }

  return await prisma.salesOrder.update({
    where: { id },
    data: {
      status: 'SHIPPED',
      shippedAt: new Date(),
    },
    include: { customer: true, lines: true },
  });
}

/**
 * Deliver order (SHIPPED -> DELIVERED)
 */
export async function deliverOrder(id: string): Promise<any> {
  const order = await prisma.salesOrder.findUnique({ where: { id } });

  if (!order) {
    throw new SalesOrderNotFoundError('ไม่พบใบสั่งขาย');
  }

  if (!validateStatusTransition(order.status as SalesOrderStatusType, 'DELIVERED')) {
    throw new SalesOrderWorkflowError(
      `ไม่สามารถส่งมอบได้: ไม่สามารถเปลี่ยนสถานะจาก ${order.status} เป็น DELIVERED`
    );
  }

  return await prisma.salesOrder.update({
    where: { id },
    data: {
      status: 'DELIVERED',
      deliveredAt: new Date(),
    },
    include: { customer: true, lines: true },
  });
}

/**
 * Cancel order
 */
export async function cancelOrder(id: string): Promise<any> {
  const order = await prisma.salesOrder.findUnique({ where: { id } });

  if (!order) {
    throw new SalesOrderNotFoundError('ไม่พบใบสั่งขาย');
  }

  if (!validateStatusTransition(order.status as SalesOrderStatusType, 'CANCELLED')) {
    throw new SalesOrderWorkflowError(
      `ไม่สามารถยกเลิกได้: ไม่สามารถเปลี่ยนสถานะจาก ${order.status} เป็น CANCELLED`
    );
  }

  return await prisma.salesOrder.update({
    where: { id },
    data: {
      status: 'CANCELLED',
    },
    include: { customer: true, lines: true },
  });
}

// ============================================
// Convert to Invoice
// ============================================

/**
 * Generate Invoice Number
 * Format: INV{yyyy}{mm}-{sequence}
 */
async function generateInvoiceNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `INV${year}${month}`;

  const lastInvoice = await prisma.invoice.findFirst({
    where: { invoiceNo: { startsWith: prefix } },
    orderBy: { invoiceNo: 'desc' },
    select: { invoiceNo: true },
  });

  let sequence = 1;
  if (lastInvoice) {
    const match = lastInvoice.invoiceNo.match(/INV\d{6}-(\d{4})/);
    if (match) {
      sequence = parseInt(match[1]) + 1;
    }
  }

  return `${prefix}-${String(sequence).padStart(4, '0')}`;
}

/**
 * Convert Sales Order to Invoice
 * Status must be >= CONFIRMED
 * Creates Invoice with salesOrderId linked, copies customer/lines/amounts
 * Updates SO: status → COMPLETED
 */
export async function convertToInvoice(
  salesOrderId: string,
  data: { invoiceDate: Date; dueDate?: Date; createdById?: string }
): Promise<any> {
  const order = await prisma.salesOrder.findUnique({
    where: { id: salesOrderId },
    include: {
      customer: true,
      lines: {
        orderBy: { lineNo: 'asc' },
      },
    },
  });

  if (!order) {
    throw new SalesOrderNotFoundError('ไม่พบใบสั่งขาย');
  }

  // Check status >= CONFIRMED
  if (!isConfirmedOrBeyond(order.status as SalesOrderStatusType)) {
    throw new SalesOrderWorkflowError('ต้องยืนยันใบสั่งขายก่อนจึงจะสามารถออกใบกำกับภาษีได้');
  }

  // Check if already has invoice
  const existingInvoice = await prisma.invoice.findUnique({
    where: { salesOrderId },
  });
  if (existingInvoice) {
    throw new SalesOrderWorkflowError('ใบสั่งขายนี้มีใบกำกับภาษีแล้ว');
  }

  // Generate invoice number
  const invoiceNo = await generateInvoiceNumber();

  // Create invoice and update sales order in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create invoice
    const invoice = await tx.invoice.create({
      data: {
        invoiceNo,
        invoiceDate: data.invoiceDate,
        dueDate: data.dueDate,
        customerId: order.customerId,
        salesOrderId: order.id,
        subtotal: order.subtotal,
        vatRate: order.vatRate,
        vatAmount: order.vatAmount,
        totalAmount: order.totalAmount,
        discountAmount: order.discountAmount,
        status: 'DRAFT',
        createdById: data.createdById,
        lines: {
          create: order.lines.map((line) => ({
            lineNo: line.lineNo,
            productId: line.productId,
            description: line.description,
            quantity: line.quantity,
            unit: line.unit,
            unitPrice: line.unitPrice,
            discount: line.discount,
            amount: line.amount,
            vatRate: line.vatRate,
            vatAmount: Math.round(calculatePercent(line.amount - line.discount, line.vatRate)),
          })),
        },
      },
      include: {
        customer: true,
        lines: true,
      },
    });

    // Update sales order to COMPLETED
    await tx.salesOrder.update({
      where: { id: salesOrderId },
      data: {
        status: 'COMPLETED',
      },
    });

    return invoice;
  });

  return result;
}

// ============================================
// Get Available Transitions
// ============================================

/**
 * Get available status transitions for current status
 */
export function getAvailableTransitions(
  currentStatus: SalesOrderStatusType
): SalesOrderStatusType[] {
  return VALID_TRANSITIONS[currentStatus] || [];
}
