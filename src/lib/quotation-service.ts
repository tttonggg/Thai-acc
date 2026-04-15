// ============================================
// 💼 Quotation Service
// บริการใบเสนอราคา (Quotation)
// ============================================

import prisma from '@/lib/db'
import { calculatePercent } from '@/lib/currency'

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

export class QuotationExpiredError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'QuotationExpiredError'
  }
}

// ============================================
// Type Definitions
// ============================================

export interface QuotationLineCalculation {
  subtotal: number
  discountAmount: number
  afterDiscount: number
  vatAmount: number
  amount: number
}

export interface QuotationTotalCalculation {
  subtotal: number
  totalDiscount: number
  afterDiscount: number
  vatAmount: number
  totalAmount: number
}

export interface QuotationStatusInfo {
  canSend: boolean
  canEdit: boolean
  canDelete: boolean
  canApprove: boolean
  canReject: boolean
  canConvert: boolean
  canCancel: boolean
  allowedTransitions: string[]
}

export interface QuotationLineInput {
  lineNo: number
  productId?: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
  discount: number
  vatRate: number
  notes?: string
}

export interface QuotationInput {
  customerId: string
  quotationDate?: Date
  validUntil: Date
  contactPerson?: string
  reference?: string
  discountAmount?: number
  discountPercent?: number
  vatRate?: number
  terms?: string
  notes?: string
  internalNotes?: string
  lines: QuotationLineInput[]
}

// ============================================
// Number Generation Functions
// ============================================

/**
 * Generate Quotation Number
 * สร้างเลขที่ใบเสนอราคา
 * Format: QT{yyyy}{mm}-{sequence}
 * Example: QT202603-0001
 */
export async function generateQuotationNumber(): Promise<string> {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const prefix = `QT${year}${month}`

  // Find the last quotation number for this month
  const lastQuotation = await prisma.quotation.findFirst({
    where: {
      quotationNo: {
        startsWith: prefix,
      },
    },
    orderBy: {
      quotationNo: 'desc',
    },
    select: {
      quotationNo: true,
    },
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
 * Calculate Quotation Line Amount
 * คำนวณยอดเงินรายการใบเสนอราคา
 *
 * CRITICAL: All inputs are in Satang, all outputs are in Satang
 */
export function calculateQuotationLine(line: QuotationLineInput): QuotationLineCalculation {
  // All inputs should be in Satang
  const subtotal = line.quantity * line.unitPrice
  const discountAmount = line.discount // Already in Satang
  const afterDiscount = subtotal - discountAmount
  const vatAmount = calculatePercent(afterDiscount, line.vatRate)
  const amount = afterDiscount + vatAmount

  return {
    subtotal: Math.round(subtotal),
    discountAmount: Math.round(discountAmount),
    afterDiscount: Math.round(afterDiscount),
    vatAmount: Math.round(vatAmount),
    amount: Math.round(amount),
  }
}

/**
 * Calculate Quotation Totals
 * คำนวณยอดรวมใบเสนอราคา
 *
 * CRITICAL: All inputs and outputs are in Satang
 */
export function calculateQuotationTotals(
  lines: QuotationLineInput[],
  discountAmount: number = 0,
  discountPercent: number = 0,
  vatRate: number = 7
): QuotationTotalCalculation {
  // Calculate subtotal from all lines (all in Satang)
  const subtotal = lines.reduce((sum, line) => {
    return sum + (line.quantity * line.unitPrice)
  }, 0)

  // Calculate total discount (using Satang throughout)
  const totalDiscount = discountAmount + calculatePercent(subtotal, discountPercent)

  // Calculate amount after discount
  const afterDiscount = subtotal - totalDiscount

  // Calculate VAT (using Satang throughout)
  const vatAmount = calculatePercent(afterDiscount, vatRate)

  // Calculate total amount
  const totalAmount = afterDiscount + vatAmount

  return {
    subtotal: Math.round(subtotal),
    totalDiscount: Math.round(totalDiscount),
    afterDiscount: Math.round(afterDiscount),
    vatAmount: Math.round(vatAmount),
    totalAmount: Math.round(totalAmount),
  }
}

// ============================================
// Validation Functions
// ============================================

/**
 * Validate Quotation Date Range
 * ตรวจสอบช่วงวันที่ใบเสนอราคา
 */
export function validateQuotationDateRange(
  quotationDate: Date,
  validUntil: Date
): { valid: boolean; error?: string } {
  if (validUntil <= quotationDate) {
    return {
      valid: false,
      error: 'วันหมดอายุต้องอยู่หลังวันที่ออกใบเสนอราคา',
    }
  }

  // Check if valid until is at least 1 day in the future
  const minValidDays = 1
  const daysDiff = Math.ceil((validUntil.getTime() - quotationDate.getTime()) / (1000 * 60 * 60 * 24))

  if (daysDiff < minValidDays) {
    return {
      valid: false,
      error: 'วันหมดอายุต้องมีอย่างน้อย 1 วันนับจากวันที่ออกใบเสนอราคา',
    }
  }

  return { valid: true }
}

/**
 * Validate Quotation Expiry
 * ตรวจสอบว่าใบเสนอราคาหมดอายุหรือไม่
 */
export function validateQuotationExpiry(validUntil: Date): { valid: boolean; expired: boolean } {
  const now = new Date()
  const expired = validUntil < now

  return {
    valid: !expired,
    expired,
  }
}

/**
 * Validate Customer Credit Limit
 * ตรวจสอบวงเงินเครดิตลูกค้า
 */
export async function validateCustomerCreditLimit(
  customerId: string,
  totalAmount: number
): Promise<{ valid: boolean; error?: string; creditLimit?: number; currentBalance?: number }> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      creditLimit: true,
    },
  })

  if (!customer) {
    return {
      valid: false,
      error: 'ไม่พบข้อมูลลูกค้า',
    }
  }

  // If no credit limit set, skip validation
  if (!customer.creditLimit || customer.creditLimit === 0) {
    return { valid: true }
  }

  // Calculate current outstanding balance (unpaid invoices)
  const outstandingBalance = await prisma.invoice.aggregate({
    where: {
      customerId,
      status: {
        in: ['POSTED', 'OVERDUE'],
      },
      paymentStatus: {
        in: ['UNPAID', 'PARTIAL'],
      },
    },
    _sum: {
      totalAmount: true,
    },
  })

  const currentBalance = outstandingBalance._sum.totalAmount || 0
  const newTotalBalance = currentBalance + totalAmount

  if (newTotalBalance > customer.creditLimit) {
    return {
      valid: false,
      error: `เกินวงเงินเครดิต (เครดิต: ฿${customer.creditLimit.toLocaleString()}, คงเหลือ: ฿${(customer.creditLimit - currentBalance).toLocaleString()})`,
      creditLimit: customer.creditLimit,
      currentBalance,
    }
  }

  return {
    valid: true,
    creditLimit: customer.creditLimit,
    currentBalance,
  }
}

// ============================================
// Status Management Functions
// ============================================

/**
 * Get Quotation Status Information
 * ดูข้อมูลสถานะใบเสนอราคา
 */
export function getQuotationStatusInfo(status: string): QuotationStatusInfo {
  const canSend = ['DRAFT', 'REVISED', 'REJECTED'].includes(status)
  const canEdit = ['DRAFT', 'REVISED', 'REJECTED'].includes(status)
  const canDelete = status === 'DRAFT'
  const canApprove = status === 'SENT'
  const canReject = status === 'SENT'
  const canConvert = status === 'APPROVED'
  const canCancel = ['DRAFT', 'SENT', 'REVISED'].includes(status)

  const allowedTransitions: string[] = []

  switch (status) {
    case 'DRAFT':
      allowedTransitions.push('SENT', 'CANCELLED')
      break
    case 'REVISED':
      allowedTransitions.push('SENT', 'CANCELLED')
      break
    case 'REJECTED':
      allowedTransitions.push('SENT', 'CANCELLED')
      break
    case 'SENT':
      allowedTransitions.push('APPROVED', 'REJECTED', 'REVISED', 'EXPIRED')
      break
    case 'APPROVED':
      allowedTransitions.push('CONVERTED', 'REVISED', 'EXPIRED')
      break
    default:
      break
  }

  return {
    canSend,
    canEdit,
    canDelete,
    canApprove,
    canReject,
    canConvert,
    canCancel,
    allowedTransitions,
  }
}

/**
 * Validate Status Transition
 * ตรวจสอบการเปลี่ยนสถานะใบเสนอราคา
 */
export function validateStatusTransition(
  currentStatus: string,
  newStatus: string
): { valid: boolean; error?: string } {
  const statusInfo = getQuotationStatusInfo(currentStatus)

  if (!statusInfo.allowedTransitions.includes(newStatus)) {
    return {
      valid: false,
      error: `ไม่สามารถเปลี่ยนสถานะจาก ${currentStatus} เป็น ${newStatus} ได้`,
    }
  }

  return { valid: true }
}

// ============================================
// Workflow Functions
// ============================================

/**
 * Send Quotation to Customer
 * ส่งใบเสนอราคาถึงลูกค้า
 */
export async function sendQuotation(
  quotationId: string,
  userId: string
): Promise<{ success: boolean; quotation?: any; error?: string }> {
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
  })

  if (!quotation) {
    return {
      success: false,
      error: 'ไม่พบใบเสนอราคา',
    }
  }

  // Validate status
  const statusValidation = validateStatusTransition(quotation.status, 'SENT')
  if (!statusValidation.valid) {
    return {
      success: false,
      error: statusValidation.error,
    }
  }

  // Validate expiry
  const expiryValidation = validateQuotationExpiry(quotation.validUntil)
  if (expiryValidation.expired) {
    return {
      success: false,
      error: 'ใบเสนอราคาหมดอายุแล้ว กรุณาตรวจสอบวันหมดอายุ',
    }
  }

  // Update status to SENT
  const updatedQuotation = await prisma.quotation.update({
    where: { id: quotationId },
    data: {
      status: 'SENT',
      sentAt: new Date(),
      updatedById: userId,
    },
  })

  return {
    success: true,
    quotation: updatedQuotation,
  }
}

/**
 * Approve Quotation
 * อนุมัติใบเสนอราคา (ลูกค้าอนุมัติ)
 */
export async function approveQuotation(
  quotationId: string,
  userId: string
): Promise<{ success: boolean; quotation?: any; error?: string }> {
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
  })

  if (!quotation) {
    return {
      success: false,
      error: 'ไม่พบใบเสนอราคา',
    }
  }

  // Validate status
  const statusValidation = validateStatusTransition(quotation.status, 'APPROVED')
  if (!statusValidation.valid) {
    return {
      success: false,
      error: statusValidation.error,
    }
  }

  // Validate expiry
  const expiryValidation = validateQuotationExpiry(quotation.validUntil)
  if (expiryValidation.expired) {
    return {
      success: false,
      error: 'ใบเสนอราคาหมดอายุแล้ว กรุณาตรวจสอบวันหมดอายุ',
    }
  }

  // Update status to APPROVED
  const updatedQuotation = await prisma.quotation.update({
    where: { id: quotationId },
    data: {
      status: 'APPROVED',
      approvedAt: new Date(),
      approvedById: userId,
      updatedById: userId,
    },
  })

  return {
    success: true,
    quotation: updatedQuotation,
  }
}

/**
 * Reject Quotation
 * ปฏิเสธใบเสนอราคา (ลูกค้าปฏิเสธ)
 */
export async function rejectQuotation(
  quotationId: string,
  userId: string,
  reason: string
): Promise<{ success: boolean; quotation?: any; error?: string }> {
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
  })

  if (!quotation) {
    return {
      success: false,
      error: 'ไม่พบใบเสนอราคา',
    }
  }

  // Validate status
  const statusValidation = validateStatusTransition(quotation.status, 'REJECTED')
  if (!statusValidation.valid) {
    return {
      success: false,
      error: statusValidation.error,
    }
  }

  // Update status to REJECTED
  const updatedQuotation = await prisma.quotation.update({
    where: { id: quotationId },
    data: {
      status: 'REJECTED',
      rejectionReason: reason,
      updatedById: userId,
    },
  })

  return {
    success: true,
    quotation: updatedQuotation,
  }
}

/**
 * Convert Quotation to Invoice
 * แปลงใบเสนอราคาเป็นใบกำกับภาษี
 */
export async function convertQuotationToInvoice(
  quotationId: string,
  userId: string
): Promise<{ success: boolean; invoice?: any; quotation?: any; error?: string }> {
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: {
      customer: true,
      lines: {
        include: {
          product: true,
        },
      },
    },
  })

  if (!quotation) {
    return {
      success: false,
      error: 'ไม่พบใบเสนอราคา',
    }
  }

  // Validate status
  const statusValidation = validateStatusTransition(quotation.status, 'CONVERTED')
  if (!statusValidation.valid) {
    return {
      success: false,
      error: statusValidation.error,
    }
  }

  // Check if already converted
  if (quotation.invoiceId) {
    return {
      success: false,
      error: 'ใบเสนอราคานี้ถูกแปลงเป็นใบกำกับภาษีแล้ว',
    }
  }

  // Validate expiry
  const expiryValidation = validateQuotationExpiry(quotation.validUntil)
  if (expiryValidation.expired) {
    return {
      success: false,
      error: 'ใบเสนอราคาหมดอายุแล้ว กรุณาตรวจสอบวันหมดอายุ',
    }
  }

  // Generate Invoice number
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')

  const latestInvoice = await prisma.invoice.findFirst({
    where: {
      invoiceNo: {
        startsWith: `INV${year}${month}`,
      },
    },
    orderBy: {
      invoiceNo: 'desc',
    },
  })

  let sequence = 1
  if (latestInvoice) {
    const match = latestInvoice.invoiceNo.match(/INV\d{6}-(\d{4})/)
    if (match) {
      sequence = parseInt(match[1]) + 1
    }
  }

  const invoiceNo = `INV${year}${month}-${String(sequence).padStart(4, '0')}`

  // Create Invoice from Quotation using transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create Invoice
    const invoice = await tx.invoice.create({
      data: {
        invoiceNo,
        invoiceDate: now,
        customerId: quotation.customerId,
        contactPerson: quotation.contactPerson,
        reference: `ใบเสนอราคา ${quotation.quotationNo}`,
        subtotal: quotation.subtotal,
        discountAmount: quotation.discountAmount,
        discountPercent: quotation.discountPercent,
        vatRate: quotation.vatRate,
        vatAmount: quotation.vatAmount,
        totalAmount: quotation.totalAmount,
        status: 'POSTED',
        type: 'TAX_INVOICE',
        terms: quotation.terms,
        notes: quotation.notes,
        internalNotes: quotation.internalNotes,
        createdById: userId,
        updatedById: userId,
        lines: {
          create: quotation.lines.map((line) => ({
            lineNo: line.lineNo,
            productId: line.productId,
            description: line.description,
            quantity: line.quantity,
            unit: line.unit,
            unitPrice: line.unitPrice,
            discount: line.discount,
            vatRate: line.vatRate,
            vatAmount: line.vatAmount,
            amount: line.amount,
            notes: line.notes,
          })),
        },
      },
    })

    // Update Quotation status
    const updatedQuotation = await tx.quotation.update({
      where: { id: quotationId },
      data: {
        status: 'CONVERTED',
        invoiceId: invoice.id,
        updatedById: userId,
      },
    })

    return { invoice, quotation: updatedQuotation }
  })

  return {
    success: true,
    invoice: result.invoice,
    quotation: result.quotation,
  }
}

/**
 * Cancel Quotation
 * ยกเลิกใบเสนอราคา
 */
export async function cancelQuotation(
  quotationId: string,
  userId: string,
  reason: string
): Promise<{ success: boolean; quotation?: any; error?: string }> {
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
  })

  if (!quotation) {
    return {
      success: false,
      error: 'ไม่พบใบเสนอราคา',
    }
  }

  // Can only cancel DRAFT, SENT, or REVISED quotations
  if (!['DRAFT', 'SENT', 'REVISED'].includes(quotation.status)) {
    return {
      success: false,
      error: 'สามารถยกเลิกเฉพาะใบเสนอราคาที่อยู่ในสถานะ ร่าง, ส่งแล้ว, หรือ แก้ไขแล้ว',
    }
  }

  // Update status to CANCELLED
  const updatedQuotation = await prisma.quotation.update({
    where: { id: quotationId },
    data: {
      status: 'CANCELLED',
      cancellationReason: reason,
      updatedById: userId,
    },
  })

  return {
    success: true,
    quotation: updatedQuotation,
  }
}

// ============================================
// Dashboard & Statistics Functions
// ============================================

/**
 * Get Quotation Statistics
 * ดูสถิติใบเสนอราคา
 */
export async function getQuotationStatistics(
  startDate?: Date,
  endDate?: Date
): Promise<{
  total: number
  draft: number
  sent: number
  approved: number
  rejected: number
  converted: number
  conversionRate: number
  totalValue: number
}> {
  const where: any = {}

  if (startDate || endDate) {
    where.quotationDate = {}
    if (startDate) where.quotationDate.gte = startDate
    if (endDate) where.quotationDate.lte = endDate
  }

  const [total, draft, sent, approved, rejected, converted, valueResult] = await Promise.all([
    prisma.quotation.count({ where }),
    prisma.quotation.count({ where: { ...where, status: 'DRAFT' } }),
    prisma.quotation.count({ where: { ...where, status: 'SENT' } }),
    prisma.quotation.count({ where: { ...where, status: 'APPROVED' } }),
    prisma.quotation.count({ where: { ...where, status: 'REJECTED' } }),
    prisma.quotation.count({ where: { ...where, status: 'CONVERTED' } }),
    prisma.quotation.aggregate({
      where,
      _sum: {
        totalAmount: true,
      },
    }),
  ])

  const conversionRate = sent > 0 ? (approved / sent) * 100 : 0
  const totalValue = valueResult._sum.totalAmount || 0

  return {
    total,
    draft,
    sent,
    approved,
    rejected,
    converted,
    conversionRate: Math.round(conversionRate * 10) / 10,
    totalValue,
  }
}
