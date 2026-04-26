/**
 * Invoice Immutability Service
 * 
 * Enforces immutability on posted documents. Once a document reaches a blocked
 * status, it cannot be modified - must use Credit Note/Debit Note to correct.
 * 
 * All monetary values in Int Satang (1/100 Baht)
 */

import { db } from '@/lib/db'

// ============================================================
// Types
// ============================================================

type UpdateData = Record<string, unknown>

interface CanModifyResult {
  allowed: boolean
  reason?: string
  document?: {
    id: string
    documentNo: string
    status: string
  } | null
}

// ============================================================
// Blocked Statuses by Document Type
// ============================================================

const BLOCKED_INVOICE = ['ISSUED', 'PARTIAL', 'PAID', 'CANCELLED']
const BLOCKED_PURCHASE_INVOICE = ['ISSUED', 'PARTIAL', 'PAID', 'CANCELLED']
const BLOCKED_RECEIPT = ['POSTED', 'CANCELLED']
const BLOCKED_PAYMENT = ['POSTED', 'CANCELLED']
const BLOCKED_CREDIT_NOTE = ['ISSUED', 'CANCELLED']
const BLOCKED_DEBIT_NOTE = ['ISSUED', 'CANCELLED']
const BLOCKED_JOURNAL_ENTRY = ['POSTED', 'REVERSED']
const BLOCKED_GOODS_RECEIPT_NOTE = ['RECEIVED', 'INSPECTED', 'CANCELLED']

// ============================================================
// Invoice
// ============================================================

export async function canModifyInvoice(id: string): Promise<CanModifyResult> {
  const doc = await db.invoice.findUnique({
    where: { id },
    select: { id: true, invoiceNo: true, status: true }
  })
  
  if (!doc) {
    return { allowed: false, reason: 'Invoice not found' }
  }
  
  if (BLOCKED_INVOICE.includes(doc.status)) {
    return {
      allowed: false,
      reason: `Cannot modify ${doc.invoiceNo}: already ${doc.status}. Use Credit Note instead.`,
      document: { id: doc.id, documentNo: doc.invoiceNo, status: doc.status }
    }
  }
  
  return { allowed: true, document: { id: doc.id, documentNo: doc.invoiceNo, status: doc.status } }
}

export async function updateInvoiceIfAllowed(id: string, data: UpdateData): Promise<unknown> {
  const canModify = await canModifyInvoice(id)
  
  if (!canModify.allowed) {
    throw new Error(canModify.reason || 'Cannot modify invoice')
  }
  
  return db.invoice.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date()
      // Note: Invoice doesn't have versionNo in schema
    }
  })
}

// ============================================================
// PurchaseInvoice
// ============================================================

export async function canModifyPurchaseInvoice(id: string): Promise<CanModifyResult> {
  const doc = await db.purchaseInvoice.findUnique({
    where: { id },
    select: { id: true, invoiceNo: true, status: true }
  })
  
  if (!doc) {
    return { allowed: false, reason: 'Purchase Invoice not found' }
  }
  
  if (BLOCKED_PURCHASE_INVOICE.includes(doc.status)) {
    return {
      allowed: false,
      reason: `Cannot modify ${doc.invoiceNo}: already ${doc.status}. Use Debit Note instead.`,
      document: { id: doc.id, documentNo: doc.invoiceNo, status: doc.status }
    }
  }
  
  return { allowed: true, document: { id: doc.id, documentNo: doc.invoiceNo, status: doc.status } }
}

export async function updatePurchaseInvoiceIfAllowed(id: string, data: UpdateData): Promise<unknown> {
  const canModify = await canModifyPurchaseInvoice(id)
  
  if (!canModify.allowed) {
    throw new Error(canModify.reason || 'Cannot modify purchase invoice')
  }
  
  return db.purchaseInvoice.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date()
      // Note: PurchaseInvoice doesn't have versionNo in schema
    }
  })
}

// ============================================================
// Receipt
// ============================================================

export async function canModifyReceipt(id: string): Promise<CanModifyResult> {
  const doc = await db.receipt.findUnique({
    where: { id },
    select: { id: true, receiptNo: true, status: true }
  })
  
  if (!doc) {
    return { allowed: false, reason: 'Receipt not found' }
  }
  
  if (BLOCKED_RECEIPT.includes(doc.status)) {
    return {
      allowed: false,
      reason: `Cannot modify ${doc.receiptNo}: already ${doc.status}.`,
      document: { id: doc.id, documentNo: doc.receiptNo, status: doc.status }
    }
  }
  
  return { allowed: true, document: { id: doc.id, documentNo: doc.receiptNo, status: doc.status } }
}

export async function updateReceiptIfAllowed(id: string, data: UpdateData): Promise<unknown> {
  const canModify = await canModifyReceipt(id)
  
  if (!canModify.allowed) {
    throw new Error(canModify.reason || 'Cannot modify receipt')
  }
  
  return db.receipt.update({
    where: { id },
    data: {
      ...data,
      versionNo: { increment: 1 },
      updatedAt: new Date()
    }
  })
}

// ============================================================
// Payment
// ============================================================

export async function canModifyPayment(id: string): Promise<CanModifyResult> {
  const doc = await db.payment.findUnique({
    where: { id },
    select: { id: true, paymentNo: true, status: true }
  })
  
  if (!doc) {
    return { allowed: false, reason: 'Payment not found' }
  }
  
  if (BLOCKED_PAYMENT.includes(doc.status)) {
    return {
      allowed: false,
      reason: `Cannot modify ${doc.paymentNo}: already ${doc.status}.`,
      document: { id: doc.id, documentNo: doc.paymentNo, status: doc.status }
    }
  }
  
  return { allowed: true, document: { id: doc.id, documentNo: doc.paymentNo, status: doc.status } }
}

export async function updatePaymentIfAllowed(id: string, data: UpdateData): Promise<unknown> {
  const canModify = await canModifyPayment(id)
  
  if (!canModify.allowed) {
    throw new Error(canModify.reason || 'Cannot modify payment')
  }
  
  return db.payment.update({
    where: { id },
    data: {
      ...data,
      versionNo: { increment: 1 },
      updatedAt: new Date()
    }
  })
}

// ============================================================
// CreditNote
// ============================================================

export async function canModifyCreditNote(id: string): Promise<CanModifyResult> {
  const doc = await db.creditNote.findUnique({
    where: { id },
    select: { id: true, creditNoteNo: true, status: true }
  })
  
  if (!doc) {
    return { allowed: false, reason: 'Credit Note not found' }
  }
  
  if (BLOCKED_CREDIT_NOTE.includes(doc.status)) {
    return {
      allowed: false,
      reason: `Cannot modify ${doc.creditNoteNo}: already ${doc.status}.`,
      document: { id: doc.id, documentNo: doc.creditNoteNo, status: doc.status }
    }
  }
  
  return { allowed: true, document: { id: doc.id, documentNo: doc.creditNoteNo, status: doc.status } }
}

export async function updateCreditNoteIfAllowed(id: string, data: UpdateData): Promise<unknown> {
  const canModify = await canModifyCreditNote(id)
  
  if (!canModify.allowed) {
    throw new Error(canModify.reason || 'Cannot modify credit note')
  }
  
  return db.creditNote.update({
    where: { id },
    data: {
      ...data,
      versionNo: { increment: 1 },
      updatedAt: new Date()
    }
  })
}

// ============================================================
// DebitNote
// ============================================================

export async function canModifyDebitNote(id: string): Promise<CanModifyResult> {
  const doc = await db.debitNote.findUnique({
    where: { id },
    select: { id: true, debitNoteNo: true, status: true }
  })
  
  if (!doc) {
    return { allowed: false, reason: 'Debit Note not found' }
  }
  
  if (BLOCKED_DEBIT_NOTE.includes(doc.status)) {
    return {
      allowed: false,
      reason: `Cannot modify ${doc.debitNoteNo}: already ${doc.status}.`,
      document: { id: doc.id, documentNo: doc.debitNoteNo, status: doc.status }
    }
  }
  
  return { allowed: true, document: { id: doc.id, documentNo: doc.debitNoteNo, status: doc.status } }
}

export async function updateDebitNoteIfAllowed(id: string, data: UpdateData): Promise<unknown> {
  const canModify = await canModifyDebitNote(id)
  
  if (!canModify.allowed) {
    throw new Error(canModify.reason || 'Cannot modify debit note')
  }
  
  return db.debitNote.update({
    where: { id },
    data: {
      ...data,
      versionNo: { increment: 1 },
      updatedAt: new Date()
    }
  })
}

// ============================================================
// JournalEntry
// ============================================================

export async function canModifyJournalEntry(id: string): Promise<CanModifyResult> {
  const doc = await db.journalEntry.findUnique({
    where: { id },
    select: { id: true, entryNo: true, status: true }
  })
  
  if (!doc) {
    return { allowed: false, reason: 'Journal Entry not found' }
  }
  
  if (BLOCKED_JOURNAL_ENTRY.includes(doc.status)) {
    return {
      allowed: false,
      reason: `Cannot modify ${doc.entryNo}: already ${doc.status}.`,
      document: { id: doc.id, documentNo: doc.entryNo, status: doc.status }
    }
  }
  
  return { allowed: true, document: { id: doc.id, documentNo: doc.entryNo, status: doc.status } }
}

export async function updateJournalEntryIfAllowed(id: string, data: UpdateData): Promise<unknown> {
  const canModify = await canModifyJournalEntry(id)
  
  if (!canModify.allowed) {
    throw new Error(canModify.reason || 'Cannot modify journal entry')
  }
  
  return db.journalEntry.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date()
      // Note: JournalEntry doesn't have versionNo in schema
    }
  })
}

// ============================================================
// GoodsReceiptNote
// ============================================================

export async function canModifyGoodsReceiptNote(id: string): Promise<CanModifyResult> {
  const doc = await db.goodsReceiptNote.findUnique({
    where: { id },
    select: { id: true, grnNo: true, status: true }
  })
  
  if (!doc) {
    return { allowed: false, reason: 'Goods Receipt Note not found' }
  }
  
  if (BLOCKED_GOODS_RECEIPT_NOTE.includes(doc.status)) {
    return {
      allowed: false,
      reason: `Cannot modify ${doc.grnNo}: already ${doc.status}.`,
      document: { id: doc.id, documentNo: doc.grnNo, status: doc.status }
    }
  }
  
  return { allowed: true, document: { id: doc.id, documentNo: doc.grnNo, status: doc.status } }
}

export async function updateGoodsReceiptNoteIfAllowed(id: string, data: UpdateData): Promise<unknown> {
  const canModify = await canModifyGoodsReceiptNote(id)
  
  if (!canModify.allowed) {
    throw new Error(canModify.reason || 'Cannot modify goods receipt note')
  }
  
  return db.goodsReceiptNote.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date()
      // Note: GoodsReceiptNote doesn't have versionNo in schema
    }
  })
}

// ============================================================
// Utility Functions
// ============================================================

/**
 * Check if any document type can be modified
 */
export async function canModifyDocument(
  type: 'INVOICE' | 'PURCHASE_INVOICE' | 'RECEIPT' | 'PAYMENT' | 'CREDIT_NOTE' | 'DEBIT_NOTE' | 'JOURNAL_ENTRY' | 'GOODS_RECEIPT_NOTE',
  id: string
): Promise<CanModifyResult> {
  switch (type) {
    case 'INVOICE':
      return canModifyInvoice(id)
    case 'PURCHASE_INVOICE':
      return canModifyPurchaseInvoice(id)
    case 'RECEIPT':
      return canModifyReceipt(id)
    case 'PAYMENT':
      return canModifyPayment(id)
    case 'CREDIT_NOTE':
      return canModifyCreditNote(id)
    case 'DEBIT_NOTE':
      return canModifyDebitNote(id)
    case 'JOURNAL_ENTRY':
      return canModifyJournalEntry(id)
    case 'GOODS_RECEIPT_NOTE':
      return canModifyGoodsReceiptNote(id)
    default:
      return { allowed: false, reason: `Unknown document type: ${type}` }
  }
}

/**
 * Get list of blocked statuses for a document type
 */
export function getBlockedStatuses(
  type: 'INVOICE' | 'PURCHASE_INVOICE' | 'RECEIPT' | 'PAYMENT' | 'CREDIT_NOTE' | 'DEBIT_NOTE' | 'JOURNAL_ENTRY' | 'GOODS_RECEIPT_NOTE'
): string[] {
  switch (type) {
    case 'INVOICE':
      return [...BLOCKED_INVOICE]
    case 'PURCHASE_INVOICE':
      return [...BLOCKED_PURCHASE_INVOICE]
    case 'RECEIPT':
      return [...BLOCKED_RECEIPT]
    case 'PAYMENT':
      return [...BLOCKED_PAYMENT]
    case 'CREDIT_NOTE':
      return [...BLOCKED_CREDIT_NOTE]
    case 'DEBIT_NOTE':
      return [...BLOCKED_DEBIT_NOTE]
    case 'JOURNAL_ENTRY':
      return [...BLOCKED_JOURNAL_ENTRY]
    case 'GOODS_RECEIPT_NOTE':
      return [...BLOCKED_GOODS_RECEIPT_NOTE]
  }
}
