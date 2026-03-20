import { z } from "zod"

// User validations
export const userSchema = z.object({
  email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง"),
  password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
  name: z.string().min(1, "กรุณากรอกชื่อ").optional(),
  role: z.enum(["ADMIN", "ACCOUNTANT", "USER", "VIEWER"]).default("USER"),
  isActive: z.boolean().default(true),
})

export const loginSchema = z.object({
  email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
})

// Account validations
export const accountSchema = z.object({
  code: z.string().min(1, "กรุณากรอกรหัสบัญชี"),
  name: z.string().min(1, "กรุณากรอกชื่อบัญชี"),
  nameEn: z.string().optional(),
  type: z.enum(["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"]),
  level: z.number().int().min(1).max(4).default(1),
  parentId: z.string().optional().nullable(),
  isDetail: z.boolean().default(true),
  isSystem: z.boolean().default(false),
  isActive: z.boolean().default(true),
  notes: z.string().optional(),
})

// Journal Entry validations
export const journalLineSchema = z.object({
  accountId: z.string().min(1, "กรุณาเลือกบัญชี"),
  description: z.string().optional(),
  debit: z.number().min(0).default(0),
  credit: z.number().min(0).default(0),
  reference: z.string().optional(),
})

export const journalEntrySchema = z.object({
  date: z.string().or(z.date()),
  description: z.string().optional(),
  reference: z.string().optional(),
  documentType: z.string().optional(),
  documentId: z.string().optional(),
  isAdjustment: z.boolean().default(false),
  notes: z.string().optional(),
  lines: z.array(journalLineSchema).min(2, "ต้องมีอย่างน้อย 2 รายการ"),
})

// Customer validations
export const customerSchema = z.object({
  code: z.string().min(1, "กรุณากรอกรหัสลูกค้า"),
  name: z.string().min(1, "กรุณากรอกชื่อลูกค้า"),
  nameEn: z.string().optional(),
  taxId: z.string().optional(),
  branchCode: z.string().optional(),
  address: z.string().optional(),
  subDistrict: z.string().optional(),
  district: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  phone: z.string().optional(),
  fax: z.string().optional(),
  email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง").optional().or(z.literal("")),
  website: z.string().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  creditLimit: z.number().min(0).default(0),
  creditDays: z.number().int().min(0).default(30),
  isActive: z.boolean().default(true),
  notes: z.string().optional(),
})

// Vendor validations
export const vendorSchema = z.object({
  code: z.string().min(1, "กรุณากรอกรหัสผู้ขาย"),
  name: z.string().min(1, "กรุณากรอกชื่อผู้ขาย"),
  nameEn: z.string().optional(),
  taxId: z.string().optional(),
  branchCode: z.string().optional(),
  address: z.string().optional(),
  subDistrict: z.string().optional(),
  district: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  phone: z.string().optional(),
  fax: z.string().optional(),
  email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง").optional().or(z.literal("")),
  website: z.string().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  bankAccountName: z.string().optional(),
  creditDays: z.number().int().min(0).default(30),
  isActive: z.boolean().default(true),
  notes: z.string().optional(),
})

// Product validations
export const productSchema = z.object({
  code: z.string().min(1, "กรุณากรอกรหัสสินค้า"),
  name: z.string().min(1, "กรุณากรอกชื่อสินค้า"),
  nameEn: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  unit: z.string().default("ชิ้น"),
  type: z.enum(["PRODUCT", "SERVICE"]).default("PRODUCT"),
  salePrice: z.number().min(0).default(0),
  costPrice: z.number().min(0).default(0),
  vatRate: z.number().min(0).max(100).default(7),
  vatType: z.enum(["EXCLUSIVE", "INCLUSIVE", "NONE"]).default("EXCLUSIVE"),
  isInventory: z.boolean().default(false),
  quantity: z.number().min(0).default(0),
  minQuantity: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
  notes: z.string().optional(),
})

// Invoice Line validations
export const invoiceLineSchema = z.object({
  productId: z.string().optional().nullable(),
  description: z.string().min(1, "กรุณากรอกรายการ"),
  quantity: z.number().min(0).default(1),
  unit: z.string().default("ชิ้น"),
  unitPrice: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  vatRate: z.number().min(0).max(100).default(7),
  notes: z.string().optional(),
})

// Invoice validations
export const invoiceSchema = z.object({
  invoiceDate: z.string().or(z.date()),
  dueDate: z.string().or(z.date()).optional().nullable(),
  customerId: z.string().min(1, "กรุณาเลือกลูกค้า"),
  type: z.enum(["TAX_INVOICE", "RECEIPT", "DELIVERY_NOTE", "CREDIT_NOTE", "DEBIT_NOTE"]).default("TAX_INVOICE"),
  reference: z.string().optional(),
  poNumber: z.string().optional(),
  discountAmount: z.number().min(0).default(0),
  discountPercent: z.number().min(0).max(100).default(0),
  withholdingRate: z.number().min(0).max(100).default(0),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  terms: z.string().optional(),
  lines: z.array(invoiceLineSchema).min(1, "ต้องมีอย่างน้อย 1 รายการ"),
})

// Purchase Invoice Line validations
export const purchaseLineSchema = z.object({
  productId: z.string().optional().nullable(),
  description: z.string().min(1, "กรุณากรอกรายการ"),
  quantity: z.number().min(0).default(1),
  unit: z.string().default("ชิ้น"),
  unitPrice: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  vatRate: z.number().min(0).max(100).default(7),
  notes: z.string().optional(),
})

// Purchase Invoice validations
export const purchaseInvoiceSchema = z.object({
  vendorInvoiceNo: z.string().optional(),
  invoiceDate: z.string().or(z.date()),
  dueDate: z.string().or(z.date()).optional().nullable(),
  vendorId: z.string().min(1, "กรุณาเลือกผู้ขาย"),
  type: z.enum(["TAX_INVOICE", "RECEIPT", "DELIVERY_NOTE", "CREDIT_NOTE", "DEBIT_NOTE"]).default("TAX_INVOICE"),
  reference: z.string().optional(),
  poNumber: z.string().optional(),
  discountAmount: z.number().min(0).default(0),
  withholdingRate: z.number().min(0).max(100).default(0),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  lines: z.array(purchaseLineSchema).min(1, "ต้องมีอย่างน้อย 1 รายการ"),
})

// WHT validations
export const whtSchema = z.object({
  type: z.enum(["PND3", "PND53"]),
  documentDate: z.string().or(z.date()),
  payeeId: z.string().optional(),
  payeeName: z.string().min(1, "กรุณากรอกชื่อผู้ถูกหักภาษี"),
  payeeTaxId: z.string().optional(),
  payeeAddress: z.string().optional(),
  description: z.string().optional(),
  incomeType: z.string().optional(),
  incomeAmount: z.number().min(0),
  whtRate: z.number().min(0).max(100),
  taxMonth: z.number().int().min(1).max(12),
  taxYear: z.number().int().min(2000),
  notes: z.string().optional(),
})

// Company validations
export const companySchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อบริษัท"),
  nameEn: z.string().optional(),
  taxId: z.string().optional(),
  branchCode: z.string().optional(),
  address: z.string().optional(),
  subDistrict: z.string().optional(),
  district: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  phone: z.string().optional(),
  fax: z.string().optional(),
  email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง").optional().or(z.literal("")),
  website: z.string().optional(),
  logo: z.string().optional(),
  fiscalYearStart: z.number().int().min(1).max(12).default(1),
})

// Credit Note Line validations
export const creditNoteLineSchema = z.object({
  productId: z.string().optional().nullable(),
  description: z.string().min(1, "กรุณากรอกรายการ"),
  quantity: z.number().positive("จำนวนต้องมากกว่า 0"),
  unit: z.string().default("ชิ้น"),
  unitPrice: z.number().min(0, "ราคาต้องไม่ติดลบ"),
  discount: z.number().min(0).default(0),
  vatRate: z.number().min(0).max(100).default(7),
  returnStock: z.boolean().default(false),
})

// Credit Note validations
export const creditNoteSchema = z.object({
  creditNoteDate: z.string().or(z.date()),
  customerId: z.string().min(1, "กรุณาเลือกลูกค้า"),
  invoiceId: z.string().optional().nullable(),
  reason: z.enum(["RETURN", "DISCOUNT", "ALLOWANCE", "CANCELLATION"]).default("RETURN"),
  notes: z.string().optional(),
  lines: z.array(creditNoteLineSchema).min(1, "ต้องมีอย่างน้อย 1 รายการ"),
})

// Debit Note Line validations
export const debitNoteLineSchema = z.object({
  productId: z.string().optional().nullable(),
  description: z.string().min(1, "กรุณากรอกรายการ"),
  quantity: z.number().positive("จำนวนต้องมากกว่า 0"),
  unit: z.string().default("ชิ้น"),
  unitPrice: z.number().min(0, "ราคาต้องไม่ติดลบ"),
  discount: z.number().min(0).default(0),
  vatRate: z.number().min(0).max(100).default(7),
})

// Debit Note validations
export const debitNoteSchema = z.object({
  debitNoteDate: z.string().or(z.date()),
  vendorId: z.string().min(1, "กรุณาเลือกผู้ขาย"),
  purchaseInvoiceId: z.string().optional().nullable(),
  reason: z.enum(["ADDITIONAL_CHARGES", "RETURNED_GOODS", "PRICE_ADJUSTMENT"]).default("ADDITIONAL_CHARGES"),
  notes: z.string().optional(),
  lines: z.array(debitNoteLineSchema).min(1, "ต้องมีอย่างน้อย 1 รายการ"),
})

// Types for API responses
export type UserInput = z.infer<typeof userSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type AccountInput = z.infer<typeof accountSchema>
export type JournalEntryInput = z.infer<typeof journalEntrySchema>
export type JournalLineInput = z.infer<typeof journalLineSchema>
export type CustomerInput = z.infer<typeof customerSchema>
export type VendorInput = z.infer<typeof vendorSchema>
export type ProductInput = z.infer<typeof productSchema>
export type InvoiceInput = z.infer<typeof invoiceSchema>
export type InvoiceLineInput = z.infer<typeof invoiceLineSchema>
export type PurchaseInvoiceInput = z.infer<typeof purchaseInvoiceSchema>
export type PurchaseLineInput = z.infer<typeof purchaseLineSchema>
export type CreditNoteInput = z.infer<typeof creditNoteSchema>
export type CreditNoteLineInput = z.infer<typeof creditNoteLineSchema>
export type DebitNoteInput = z.infer<typeof debitNoteSchema>
export type DebitNoteLineInput = z.infer<typeof debitNoteLineSchema>
export type WhtInput = z.infer<typeof whtSchema>
export type CompanyInput = z.infer<typeof companySchema>

// Payment Allocation validations
export const paymentAllocationSchema = z.object({
  invoiceId: z.string().min(1, "กรุณาเลือกใบซื้อ"),
  amount: z.number().min(0, "จำนวนเงินต้องไม่น้อยกว่า 0"),
  whtRate: z.number().min(0).max(100).default(0),
  whtAmount: z.number().min(0).default(0),
  notes: z.string().optional(),
})

// Payment validations
export const paymentSchema = z.object({
  vendorId: z.string().min(1, "กรุณาเลือกผู้ขาย"),
  paymentDate: z.string().or(z.date()),
  paymentMethod: z.enum(["CASH", "TRANSFER", "CHEQUE", "CREDIT", "OTHER"]),
  bankAccountId: z.string().optional(),
  chequeNo: z.string().optional(),
  chequeDate: z.string().or(z.date()).optional(),
  amount: z.number().min(0, "จำนวนเงินต้องไม่น้อยกว่า 0"),
  unallocated: z.number().min(0).default(0),
  notes: z.string().optional(),
  allocations: z.array(paymentAllocationSchema).min(1, "ต้องมีการจัดจ่ายอย่างน้อย 1 รายการ"),
  status: z.enum(["DRAFT", "POSTED"]).default("DRAFT"),
})

// Phase B Validations

// B1. Accounting Period validations
export const accountingPeriodSchema = z.object({
  action: z.enum(["init-year", "close", "reopen", "lock", "reconcile"]),
  year: z.number(),
  month: z.number().min(1).max(12).optional(),
})

// B2. Currency validations
export const currencySchema = z.object({
  code: z.string().length(3),
  name: z.string(),
  nameTh: z.string().optional(),
  symbol: z.string(),
  isBase: z.boolean().default(false),
  decimalPlaces: z.number().int().min(0).max(4).default(2),
})

export const exchangeRateSchema = z.object({
  fromCurrency: z.string().length(3),
  toCurrency: z.string().length(3),
  rate: z.number().positive(),
  date: z.string().or(z.date()).optional(),
  source: z.enum(["MANUAL", "API", "SYSTEM"]).default("MANUAL"),
})

// B3. Tax Form validations
export const taxFormSchema = z.object({
  formType: z.enum(["PND3", "PND53", "PP30"]),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000),
})

// B4. Budget validations
export const budgetSchema = z.object({
  year: z.number(),
  accountId: z.string(),
  amount: z.number().min(0),
  alertAt: z.number().min(0).max(100).default(80),
  notes: z.string().optional(),
})

// B5. Entity validations
export const entitySchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  nameEn: z.string().optional(),
  taxId: z.string().optional(),
  isPrimary: z.boolean().default(false),
})

export const interCompanyTransactionSchema = z.object({
  fromEntityId: z.string(),
  toEntityId: z.string(),
  documentType: z.string(),
  documentId: z.string(),
  documentNo: z.string(),
  amount: z.number().positive(),
  description: z.string().optional(),
})

// ============================================
// Invoice Commenting System Validations
// ============================================

// Invoice Comment validations
export const invoiceCommentSchema = z.object({
  content: z.string().min(1, "กรุณากรอกความคิดเห็น"),
  isInternal: z.boolean().default(false),
  parentId: z.string().optional().nullable(),
  mentions: z.array(z.string()).default([]),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    size: z.number().int().positive(),
    type: z.string(),
  })).optional(),
  resolved: z.boolean().default(false),
})

export const updateInvoiceCommentSchema = z.object({
  content: z.string().min(1, "กรุณากรอกความคิดเห็น").optional(),
  isInternal: z.boolean().optional(),
  resolved: z.boolean().optional(),
})

// Invoice Line Edit validations
export const invoiceLineEditSchema = z.object({
  description: z.string().min(1, "กรุณากรอกรายการ").optional(),
  quantity: z.number().positive("จำนวนต้องมากกว่า 0").optional(),
  unit: z.string().optional(),
  unitPrice: z.number().int().min(0, "ราคาต่อหน่วยต้องไม่ติดลบ").optional(),
  discount: z.number().int().min(0, "ส่วนลดต้องไม่ติดลบ").optional(),
  changeReason: z.string().optional(),
})

// Related Document validations
export const relatedDocumentSchema = z.object({
  relatedModule: z.enum(["invoice", "receipt", "credit_note", "debit_note", "payment"]),
  relatedId: z.string().min(1, "กรุณาระบุเอกสารที่เกี่ยวข้อง"),
  relationType: z.enum(["LINKS", "CANCELS", "REPLACES", "REFUNDS", "ADJUSTS"]),
  notes: z.string().optional(),
})

// Comment Query validations
export const commentQuerySchema = z.object({
  includeInternal: z.boolean().default(false),
  includeResolved: z.boolean().default(true),
  limit: z.number().int().positive().max(100).default(50),
  cursor: z.string().optional(),
})

// Audit Log Query validations
export const auditLogQuerySchema = z.object({
  limit: z.number().int().positive().max(100).default(50),
  cursor: z.string().optional(),
  action: z.string().optional(),
})

// Purchase Order validations
export const purchaseOrderLineSchema = z.object({
  productId: z.string().optional().nullable(),
  description: z.string().min(1, "กรุณากรอกรายการ"),
  quantity: z.number().positive("จำนวนต้องมากกว่า 0"),
  unit: z.string().default("ชิ้น"),
  unitPrice: z.number().min(0, "ราคาต่อหน่วยต้องไม่ติดลบ"),
  discount: z.number().min(0).default(0),
  vatRate: z.number().min(0).max(100).default(7),
  specUrl: z.string().optional(),
  notes: z.string().optional(),
})

export const purchaseOrderSchema = z.object({
  orderDate: z.string().or(z.date()).optional(),
  expectedDate: z.string().or(z.date()).optional().nullable(),
  vendorId: z.string().min(1, "กรุณาเลือกผู้ขาย"),
  vendorContact: z.string().optional(),
  vendorEmail: z.string().email("รูปแบบอีเมลไม่ถูกต้อง").optional().or(z.literal("")),
  vendorPhone: z.string().optional(),
  vendorAddress: z.string().optional(),
  shippingTerms: z.string().optional(),
  paymentTerms: z.string().optional(),
  deliveryAddress: z.string().optional(),
  budgetId: z.string().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  vendorNotes: z.string().optional(),
  lines: z.array(purchaseOrderLineSchema).min(1, "ต้องมีอย่างน้อย 1 รายการ"),
})

// Purchase Order update validations (only allow certain fields)
export const purchaseOrderUpdateSchema = z.object({
  orderDate: z.string().or(z.date()).optional(),
  expectedDate: z.string().or(z.date()).optional().nullable(),
  vendorContact: z.string().optional(),
  vendorEmail: z.string().email("รูปแบบอีเมลไม่ถูกต้อง").optional().or(z.literal("")),
  vendorPhone: z.string().optional(),
  vendorAddress: z.string().optional(),
  shippingTerms: z.string().optional(),
  paymentTerms: z.string().optional(),
  deliveryAddress: z.string().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  vendorNotes: z.string().optional(),
})

// Purchase Order ship validations
export const purchaseOrderShipSchema = z.object({
  trackingNumber: z.string().optional(),
  shippingMethod: z.string().optional(),
  estimatedDelivery: z.string().or(z.date()).optional().nullable(),
  notes: z.string().optional(),
})

// Purchase Order receive validations
export const purchaseOrderReceiveLineSchema = z.object({
  lineId: z.string().min(1, "กรุณาระบุรายการ"),
  receivedQty: z.number().min(0, "จำนวนที่รับต้องไม่ติดลบ"),
})

export const purchaseOrderReceiveSchema = z.object({
  lines: z.array(purchaseOrderReceiveLineSchema).min(1, "ต้องมีอย่างน้อย 1 รายการ"),
  notes: z.string().optional(),
})

// Purchase Order cancel validations
export const purchaseOrderCancelSchema = z.object({
  reason: z.string().min(1, "กรุณาระบุเหตุผลการยกเลิก"),
})

export type PurchaseOrderInput = z.infer<typeof purchaseOrderSchema>
export type PurchaseOrderLineInput = z.infer<typeof purchaseOrderLineSchema>
export type PurchaseOrderUpdateInput = z.infer<typeof purchaseOrderUpdateSchema>
export type PurchaseOrderShipInput = z.infer<typeof purchaseOrderShipSchema>
export type PurchaseOrderReceiveInput = z.infer<typeof purchaseOrderReceiveSchema>

// ============================================
// Quotation Validations
// รับรองข้อมูลใบเสนอราคา
// ============================================

// Quotation Line validations
export const quotationLineSchema = z.object({
  productId: z.string().optional().nullable(),
  description: z.string().min(1, "กรุณากรอกรายการ"),
  quantity: z.number().positive("จำนวนต้องมากกว่า 0"),
  unit: z.string().default("ชิ้น"),
  unitPrice: z.number().min(0, "ราคาต้องไม่ติดลบ"),
  discount: z.number().min(0).default(0),
  vatRate: z.number().min(0).max(100).default(7),
  notes: z.string().optional(),
})

// Quotation validations
export const quotationSchema = z.object({
  quotationNo: z.string().optional(),
  quotationDate: z.string().or(z.date()).optional(),
  validUntil: z.string().min(1, "วันหมดอายุต้องไม่ว่างเปล่า"),
  customerId: z.string().min(1, "กรุณาเลือกลูกค้า"),
  contactPerson: z.string().optional(),
  reference: z.string().optional(),
  discountAmount: z.number().min(0).default(0),
  discountPercent: z.number().min(0).max(100).default(0),
  vatRate: z.number().min(0).max(100).default(7),
  terms: z.string().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  lines: z.array(quotationLineSchema).min(1, "ต้องมีอย่างน้อย 1 รายการ"),
})

// Quotation update validations (only allow certain fields when editing)
export const quotationUpdateSchema = z.object({
  validUntil: z.string().optional(),
  contactPerson: z.string().optional(),
  reference: z.string().optional(),
  discountAmount: z.number().int().min(0).optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  vatRate: z.number().min(0).max(100).optional(),
  terms: z.string().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
})

// Quotation send validations
export const quotationSendSchema = z.object({
  // No additional fields required for sending
})

// Quotation approve validations
export const quotationApproveSchema = z.object({
  // No additional fields required for approval
})

// Quotation reject validations
export const quotationRejectSchema = z.object({
  reason: z.string().min(1, "กรุณาระบุเหตุผลการปฏิเสธ"),
})

// Quotation convert to invoice validations
export const quotationConvertSchema = z.object({
  // No additional fields required for conversion
})

// Quotation cancel validations
export const quotationCancelSchema = z.object({
  reason: z.string().min(1, "กรุณาระบุเหตุผลการยกเลิก"),
})

export type QuotationInput = z.infer<typeof quotationSchema>
export type QuotationLineInput = z.infer<typeof quotationLineSchema>
export type QuotationUpdateInput = z.infer<typeof quotationUpdateSchema>
export type QuotationRejectInput = z.infer<typeof quotationRejectSchema>
export type QuotationCancelInput = z.infer<typeof quotationCancelSchema>
export type PurchaseOrderCancelInput = z.infer<typeof purchaseOrderCancelSchema>
