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
export type WhtInput = z.infer<typeof whtSchema>
export type CompanyInput = z.infer<typeof companySchema>
