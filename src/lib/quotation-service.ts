// ============================================
// 💼 Quotation Service
// บริการใบเสนอราคา (Quotation)
// ============================================

import prisma from '@/lib/db'
import { calculatePercent } from '@/lib/currency'
import { Prisma } from '@prisma/client'

// ============================================
// Custom Error Classes
// ============================================

export class QuotationValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'QuotationValidationError'
  }
}

export class QuotationWorkflowError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'QuotationWorkflowError'
  }
}

export class QuotationNotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'QuotationNotFoundError'
  }
}

// ============================================
// Type Definitions
// ============================================

export type QuotationStatusType = 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'CONVERTED'

export interface QuotationLineInput {
  lineNo: number
  productId?: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
  discount?: number
  vatRate?: number
  notes?: string
}

export interface QuotationCreateInput {
  quotationNo?: string
  quotationDate?: Date
  customerId: string
  validUntil: Date
  subtotal?: number
  vatRate?: number
  vatAmount?: number
  totalAmount?: number
  discountAmount?: number
  status?: QuotationStatusType
  notes?: string
  terms?: string
  salesOrderId?: string
  createdById?: string
  lines: QuotationLineInput[]
}

export interface QuotationUpdateInput {
  quotationDate?: Date
  customerId?: string
  validUntil?: Date
  subtotal?: number
  vatRate?: number
  vatAmount?: number
  totalAmount?: number
  discountAmount?: number
  status?: QuotationStatusType
  notes?: string
  terms?: string
  lines?: QuotationLineInput[]
}

export interface QuotationWhereInput {
  id?: string
  quotationNo?: string
  customerId?: string
  status?: QuotationStatusType
  isActive?: boolean
  deletedAt?: any
}

// ============================================
// Valid Status Transitions
// ============================================

const VALID_TRANSITIONS: Record<QuotationStatusType, QuotationStatusType[]> = {
  DRAFT: ['SENT'],
  SENT: ['APPROVED', 'REJECTED', 'EXPIRED'],
  APPROVED: ['CONVERTED', 'EXPIRED'],
  REJECTED: [],
  EXPIRED: [],
  CONVERTED: [],
}

// ============================================
// Number Generation
// ============================================

/**
 * Generate Quotation Number
 * Format: QT{yyyy}{mm}-{sequence}
 * Example: QT202603-0001
 */
export async function generateQuotationNumber(): Promise<string> {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const prefix = `QT${year}${month}`

  const lastQuotation = await prisma.quotation.findFirst({
    where: { quotationNo: { startsWith: prefix } },
    orderBy: { quotationNo: 'desc' },
    select: { quotationNo: true },
  })

  let sequence = 1
  if (lastQuotation) {
    const match = lastQuotation.quotationNo.match(/QT\d{6}-(\d{4})/)
    if (match) {
      sequence = parseInt(match[1]) + 1
    }
  }

  return `${prefix}-${String(sequence).padStart(4, '0')}`
}

// ============================================
// Calculation Functions
// ============================================

/**
 * Calculate line amounts in Satang
 */
export function calculateLineAmounts(line: QuotationLineInput): {
  subtotal: number
  discount: number
  afterDiscount: number
  vatAmount: number
  amount: number
} {
  const subtotal = Math.round(line.quantity * line.unitPrice)
  const discount = Math.round(line.discount || 0)
  const afterDiscount = subtotal - discount
  const vatRate = line.vatRate ?? 7
  const vatAmount = Math.round(calculatePercent(afterDiscount, vatRate))
  const amount = afterDiscount + vatAmount

  return { subtotal, discount, afterDiscount, vatAmount, amount }
}

/**
 * Calculate quotation totals from lines
 */
export function calculateQuotationTotals(
  lines: QuotationLineInput[],
  discountAmount: number = 0
): {
  subtotal: number
  totalDiscount: number
  afterDiscount: number
  vatAmount: number
  totalAmount: number
} {
  const subtotal = lines.reduce((sum, line) => sum + Math.round(line.quantity * line.unitPrice), 0)
  const totalDiscount = discountAmount
  const afterDiscount = subtotal - totalDiscount
  const vatAmount = Math.round(calculatePercent(afterDiscount, 7))
  const totalAmount = afterDiscount + vatAmount

  return { subtotal, totalDiscount, afterDiscount, vatAmount, totalAmount }
}

// ============================================
// CRUD Operations
// ============================================

/**
 * Create a new quotation with lines
 */
export async function createQuotation(data: QuotationCreateInput): Promise<any> {
  // Validate customer exists
  const customer = await prisma.customer.findUnique({
    where: { id: data.customerId },
  })
  if (!customer) {
    throw new QuotationValidationError('ไม่พบข้อมูลลูกค้า')
  }

  // Generate quotation number if not provided
  const quotationNo = data.quotationNo || await generateQuotationNumber()

  // Calculate totals from lines
  const totals = calculateQuotationTotals(data.lines, data.discountAmount || 0)

  return await prisma.quotation.create({
    data: {
      quotationNo,
      quotationDate: data.quotationDate || new Date(),
      customerId: data.customerId,
      validUntil: data.validUntil,
      subtotal: totals.subtotal,
      vatRate: data.vatRate || 7,
      vatAmount: totals.vatAmount,
      totalAmount: totals.totalAmount,
      discountAmount: totals.totalDiscount,
      status: data.status || 'DRAFT',
      notes: data.notes,
      terms: data.terms,
      salesOrderId: data.salesOrderId,
      createdById: data.createdById,
      isActive: true,
      lines: {
        create: data.lines.map((line, index) => {
          const amounts = calculateLineAmounts(line)
          return {
            lineNo: line.lineNo || index + 1,
            productId: line.productId,
            description: line.description,
            quantity: line.quantity,
            unit: line.unit || 'ชิ้น',
            unitPrice: line.unitPrice,
            discount: amounts.discount,
            amount: amounts.subtotal,
            vatRate: line.vatRate || 7,
            vatAmount: amounts.vatAmount,
            notes: line.notes,
          }
        }),
      },
    },
    include: {
      customer: true,
      lines: {
        orderBy: { lineNo: 'asc' },
      },
    },
  })
}

/**
 * Find a quotation by ID
 */
export async function findQuotationById(id: string): Promise<any> {
  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: {
      customer: true,
      lines: {
        orderBy: { lineNo: 'asc' },
        include: { product: true },
      },
    },
  })

  if (!quotation) {
    throw new QuotationNotFoundError('ไม่พบใบเสนอราคา')
  }

  return quotation
}

/**
 * Find a quotation by quotation number
 */
export async function findQuotationByNo(quotationNo: string): Promise<any> {
  const quotation = await prisma.quotation.findUnique({
    where: { quotationNo },
    include: {
      customer: true,
      lines: {
        orderBy: { lineNo: 'asc' },
        include: { product: true },
      },
    },
  })

  if (!quotation) {
    throw new QuotationNotFoundError('ไม่พบใบเสนอราคา')
  }

  return quotation
}

/**
 * Find many quotations with filters
 */
export async function findManyQuotations(params: {
  where?: QuotationWhereInput
  skip?: number
  take?: number
  orderBy?: any
}): Promise<{ quotations: any[]; total: number }> {
  const { where = {}, skip = 0, take = 20, orderBy = { quotationDate: 'desc' } } = params

  // Default filter for active only
  const filter = { ...where, deletedAt: null }

  const [quotations, total] = await Promise.all([
    prisma.quotation.findMany({
      where: filter,
      include: {
        customer: true,
        lines: { select: { id: true } },
      },
      skip,
      take,
      orderBy,
    }),
    prisma.quotation.count({ where: filter }),
  ])

  return { quotations, total }
}

/**
 * Update a quotation
 */
export async function updateQuotation(
  id: string,
  data: QuotationUpdateInput
): Promise<any> {
  const existing = await prisma.quotation.findUnique({ where: { id } })
  if (!existing) {
    throw new QuotationNotFoundError('ไม่พบใบเสนอราคา')
  }

  // Build update data
  const updateData: any = {}

  if (data.quotationDate) updateData.quotationDate = data.quotationDate
  if (data.customerId) updateData.customerId = data.customerId
  if (data.validUntil) updateData.validUntil = data.validUntil
  if (data.notes !== undefined) updateData.notes = data.notes
  if (data.terms !== undefined) updateData.terms = data.terms
  if (data.status) updateData.status = data.status

  // Recalculate totals if lines provided
  if (data.lines) {
    const totals = calculateQuotationTotals(data.lines, data.discountAmount || 0)
    updateData.subtotal = totals.subtotal
    updateData.discountAmount = totals.totalDiscount
    updateData.vatAmount = totals.vatAmount
    updateData.totalAmount = totals.totalAmount
    if (data.vatRate !== undefined) updateData.vatRate = data.vatRate

    // Update lines
    updateData.lines = {
      deleteMany: { quotationId: id },
      create: data.lines.map((line, index) => {
        const amounts = calculateLineAmounts(line)
        return {
          lineNo: line.lineNo || index + 1,
          productId: line.productId,
          description: line.description,
          quantity: line.quantity,
          unit: line.unit || 'ชิ้น',
          unitPrice: line.unitPrice,
          discount: amounts.discount,
          amount: amounts.subtotal,
          vatRate: line.vatRate || 7,
          vatAmount: amounts.vatAmount,
          notes: line.notes,
        }
      }),
    }
  }

  return await prisma.quotation.update({
    where: { id },
    data: updateData,
    include: {
      customer: true,
      lines: { orderBy: { lineNo: 'asc' } },
    },
  })
}

/**
 * Delete a quotation (soft delete - only DRAFT status)
 */
export async function deleteQuotation(
  id: string,
  deletedBy?: string
): Promise<any> {
  const quotation = await prisma.quotation.findUnique({ where: { id } })

  if (!quotation) {
    throw new QuotationNotFoundError('ไม่พบใบเสนอราคา')
  }

  // Only allow delete in DRAFT status
  if (quotation.status !== 'DRAFT') {
    throw new QuotationWorkflowError('สามารถลบได้เฉพาะใบเสนอราคาที่อยู่ในสถานะ ร่าง เท่านั้น')
  }

  return await prisma.quotation.update({
    where: { id },
    data: {
      isActive: false,
      deletedAt: new Date(),
      deletedBy,
    },
  })
}

// ============================================
// Status Transition Functions
// ============================================

/**
 * Validate status transition
 */
export function canTransition(
  currentStatus: QuotationStatusType,
  newStatus: QuotationStatusType
): boolean {
  return VALID_TRANSITIONS[currentStatus]?.includes(newStatus) || false
}

/**
 * Send quotation to customer (DRAFT -> SENT)
 */
export async function sendQuotation(id: string): Promise<any> {
  const quotation = await prisma.quotation.findUnique({ where: { id } })

  if (!quotation) {
    throw new QuotationNotFoundError('ไม่พบใบเสนอราคา')
  }

  if (!canTransition(quotation.status as QuotationStatusType, 'SENT')) {
    throw new QuotationWorkflowError(
      `ไม่สามารถส่งใบเสนอราคาได้: ไม่สามารถเปลี่ยนสถานะจาก ${quotation.status} เป็น SENT`
    )
  }

  // Check if not expired
  if (quotation.validUntil < new Date()) {
    throw new QuotationWorkflowError('ใบเสนอราคาหมดอายุแล้ว')
  }

  return await prisma.quotation.update({
    where: { id },
    data: { status: 'SENT' },
    include: { customer: true, lines: true },
  })
}

/**
 * Approve quotation (SENT -> APPROVED)
 */
export async function approveQuotation(id: string): Promise<any> {
  const quotation = await prisma.quotation.findUnique({ where: { id } })

  if (!quotation) {
    throw new QuotationNotFoundError('ไม่พบใบเสนอราคา')
  }

  if (!canTransition(quotation.status as QuotationStatusType, 'APPROVED')) {
    throw new QuotationWorkflowError(
      `ไม่สามารถอนุมัติใบเสนอราคาได้: ไม่สามารถเปลี่ยนสถานะจาก ${quotation.status} เป็น APPROVED`
    )
  }

  return await prisma.quotation.update({
    where: { id },
    data: { status: 'APPROVED' },
    include: { customer: true, lines: true },
  })
}

/**
 * Reject quotation (SENT -> REJECTED)
 */
export async function rejectQuotation(id: string): Promise<any> {
  const quotation = await prisma.quotation.findUnique({ where: { id } })

  if (!quotation) {
    throw new QuotationNotFoundError('ไม่พบใบเสนอราคา')
  }

  if (!canTransition(quotation.status as QuotationStatusType, 'REJECTED')) {
    throw new QuotationWorkflowError(
      `ไม่สามารถปฏิเสธใบเสนอราคาได้: ไม่สามารถเปลี่ยนสถานะจาก ${quotation.status} เป็น REJECTED`
    )
  }

  return await prisma.quotation.update({
    where: { id },
    data: { status: 'REJECTED' },
    include: { customer: true, lines: true },
  })
}

/**
 * Mark quotation as expired
 */
export async function expireQuotation(id: string): Promise<any> {
  const quotation = await prisma.quotation.findUnique({ where: { id } })

  if (!quotation) {
    throw new QuotationNotFoundError('ไม่พบใบเสนอราคา')
  }

  if (!canTransition(quotation.status as QuotationStatusType, 'EXPIRED')) {
    throw new QuotationWorkflowError(
      `ไม่สามารถทำให้ใบเสนอราคาหมดอายุได้: ไม่สามารถเปลี่ยนสถานะจาก ${quotation.status} เป็น EXPIRED`
    )
  }

  return await prisma.quotation.update({
    where: { id },
    data: { status: 'EXPIRED' },
    include: { customer: true, lines: true },
  })
}

/**
 * Convert quotation to sales order (APPROVED -> CONVERTED)
 * Sets the salesOrderId link
 */
export async function convertToSalesOrder(
  id: string,
  salesOrderId: string
): Promise<any> {
  const quotation = await prisma.quotation.findUnique({ where: { id } })

  if (!quotation) {
    throw new QuotationNotFoundError('ไม่พบใบเสนอราคา')
  }

  if (!canTransition(quotation.status as QuotationStatusType, 'CONVERTED')) {
    throw new QuotationWorkflowError(
      `ไม่สามารถแปลงใบเสนอราคาได้: ไม่สามารถเปลี่ยนสถานะจาก ${quotation.status} เป็น CONVERTED`
    )
  }

  return await prisma.quotation.update({
    where: { id },
    data: {
      status: 'CONVERTED',
      salesOrderId,
    },
    include: { customer: true, lines: true },
  })
}

// ============================================
// Utility Functions
// ============================================

/**
 * Get status info for UI
 */
export function getQuotationStatusInfo(status: QuotationStatusType): {
  label: string
  color: string
  canEdit: boolean
  canDelete: boolean
  allowedTransitions: QuotationStatusType[]
} {
  const statusMap: Record<QuotationStatusType, { label: string; color: string }> = {
    DRAFT: { label: 'ร่าง', color: 'gray' },
    SENT: { label: 'ส่งแล้ว', color: 'blue' },
    APPROVED: { label: 'อนุมัติ', color: 'green' },
    REJECTED: { label: 'ปฏิเสธ', color: 'red' },
    EXPIRED: { label: 'หมดอายุ', color: 'orange' },
    CONVERTED: { label: 'แปลงแล้ว', color: 'purple' },
  }

  const info = statusMap[status]
  const allowed = VALID_TRANSITIONS[status] || []

  return {
    label: info.label,
    color: info.color,
    canEdit: status === 'DRAFT' || status === 'SENT',
    canDelete: status === 'DRAFT',
    allowedTransitions: allowed,
  }
}

/**
 * Check and update expired quotations (batch job)
 */
export async function markExpiredQuotations(): Promise<number> {
  const result = await prisma.quotation.updateMany({
    where: {
      status: { in: ['DRAFT', 'SENT'] },
      validUntil: { lt: new Date() },
      deletedAt: null,
    },
    data: { status: 'EXPIRED' },
  })

  return result.count
}

/**
 * Get quotation summary for dashboard
 */
export async function getQuotationSummary(): Promise<{
  total: number
  byStatus: Record<QuotationStatusType, number>
  totalValue: number
}> {
  const [quotations, stats] = await Promise.all([
    prisma.quotation.findMany({
      where: { deletedAt: null },
      select: { status: true, totalAmount: true },
    }),
    prisma.quotation.aggregate({
      where: { deletedAt: null },
      _sum: { totalAmount: true },
    }),
  ])

  const byStatus: Record<string, number> = {}
  quotations.forEach((q) => {
    byStatus[q.status] = (byStatus[q.status] || 0) + 1
  })

  return {
    total: quotations.length,
    byStatus: byStatus as Record<QuotationStatusType, number>,
    totalValue: stats._sum.totalAmount || 0,
  }
}