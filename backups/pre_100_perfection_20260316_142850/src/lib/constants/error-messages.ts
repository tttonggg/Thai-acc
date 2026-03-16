/**
 * Standardized Error Messages
 *
 * This file contains all error messages used throughout the application.
 * Using constants ensures consistency and makes localization easier.
 *
 * Error Format:
 * - th: Thai message (primary language)
 * - en: English message (for debugging/internationalization)
 * - code: Error code for programmatic handling
 */

export const ERROR_MESSAGES = {
  // Authentication & Authorization Errors
  UNAUTHORIZED: {
    th: 'ไม่ได้รับอนุญาต กรุณาเข้าสู่ระบบ',
    en: 'Unauthorized - Please login',
    code: 'UNAUTHORIZED'
  },
  FORBIDDEN: {
    th: 'ไม่มีสิทธิ์เข้าถึง',
    en: 'Access denied',
    code: 'FORBIDDEN'
  },
  INSUFFICIENT_PERMISSIONS: {
    th: 'ไม่มีสิทธิ์ดำเนินการนี้',
    en: 'Insufficient permissions',
    code: 'INSUFFICIENT_PERMISSIONS'
  },

  // Resource Not Found Errors
  NOT_FOUND: {
    th: 'ไม่พบข้อมูล',
    en: 'Data not found',
    code: 'NOT_FOUND'
  },
  INVOICE_NOT_FOUND: {
    th: 'ไม่พบใบกำกับภาษี',
    en: 'Invoice not found',
    code: 'INVOICE_NOT_FOUND'
  },
  RECEIPT_NOT_FOUND: {
    th: 'ไม่พบใบเสร็จรับเงิน',
    en: 'Receipt not found',
    code: 'RECEIPT_NOT_FOUND'
  },
  PAYMENT_NOT_FOUND: {
    th: 'ไม่พบใบจ่ายเงิน',
    en: 'Payment not found',
    code: 'PAYMENT_NOT_FOUND'
  },
  CUSTOMER_NOT_FOUND: {
    th: 'ไม่พบลูกค้า',
    en: 'Customer not found',
    code: 'CUSTOMER_NOT_FOUND'
  },
  VENDOR_NOT_FOUND: {
    th: 'ไม่พบผู้ขาย',
    en: 'Vendor not found',
    code: 'VENDOR_NOT_FOUND'
  },
  PRODUCT_NOT_FOUND: {
    th: 'ไม่พบสินค้า',
    en: 'Product not found',
    code: 'PRODUCT_NOT_FOUND'
  },
  ACCOUNT_NOT_FOUND: {
    th: 'ไม่พบบัญชี',
    en: 'Account not found',
    code: 'ACCOUNT_NOT_FOUND'
  },
  BANK_ACCOUNT_NOT_FOUND: {
    th: 'ไม่พบบัญชีธนาคาร',
    en: 'Bank account not found',
    code: 'BANK_ACCOUNT_NOT_FOUND'
  },

  // Validation Errors
  VALIDATION_ERROR: {
    th: 'ข้อมูลไม่ถูกต้อง',
    en: 'Validation failed',
    code: 'VALIDATION_ERROR'
  },
  INVALID_EMAIL: {
    th: 'รูปแบบอีเมลไม่ถูกต้อง',
    en: 'Invalid email format',
    code: 'INVALID_EMAIL'
  },
  INVALID_DATE: {
    th: 'รูปแบบวันที่ไม่ถูกต้อง',
    en: 'Invalid date format',
    code: 'INVALID_DATE'
  },
  INVALID_AMOUNT: {
    th: 'จำนวนเงินไม่ถูกต้อง',
    en: 'Invalid amount',
    code: 'INVALID_AMOUNT'
  },
  REQUIRED_FIELD: {
    th: 'กรุณากรอกข้อมูลให้ครบถ้วน',
    en: 'Required field missing',
    code: 'REQUIRED_FIELD'
  },
  MIN_VALUE_ERROR: {
    th: 'ค่าต่ำกว่าค่าต่ำสุดที่กำหนด',
    en: 'Value below minimum',
    code: 'MIN_VALUE'
  },
  MAX_VALUE_ERROR: {
    th: 'ค่าเกินกว่าค่าสูงสุดที่กำหนด',
    en: 'Value exceeds maximum',
    code: 'MAX_VALUE'
  },

  // Business Logic Errors
  CANNOT_MODIFY_POSTED: {
    th: 'ไม่สามารถแก้ไขเอกสารที่ลงบัญชีแล้ว',
    en: 'Cannot modify posted document',
    code: 'CANNOT_MODIFY_POSTED'
  },
  CANNOT_DELETE_POSTED: {
    th: 'ไม่สามารถลบเอกสารที่ลงบัญชีแล้ว',
    en: 'Cannot delete posted document',
    code: 'CANNOT_DELETE_POSTED'
  },
  ALREADY_POSTED: {
    th: 'เอกสารนี้ถูกลงบัญชีแล้ว',
    en: 'Document already posted',
    code: 'ALREADY_POSTED'
  },
  ALREADY_CANCELLED: {
    th: 'เอกสารนี้ถูกยกเลิกแล้ว',
    en: 'Document already cancelled',
    code: 'ALREADY_CANCELLED'
  },
  HAS_PAYMENTS: {
    th: 'ไม่สามารถยกเลิกเอกสารที่มีการรับชำระแล้ว',
    en: 'Cannot cancel document with payments',
    code: 'HAS_PAYMENTS'
  },
  INSUFFICIENT_BALANCE: {
    th: 'ยอดเงินไม่เพียงพอ',
    en: 'Insufficient balance',
    code: 'INSUFFICIENT_BALANCE'
  },
  OVERALLOCATED: {
    th: 'ยอดจัดจ่ายเกินกว่ายอดรับเงิน',
    en: 'Allocation exceeds total amount',
    code: 'OVERALLOCATED'
  },
  DEBITS_CREDITS_MISMATCH: {
    th: 'ยอดเดบิตและเครดิตไม่เท่ากัน',
    en: 'Debits and credits do not match',
    code: 'DEBITS_CREDITS_MISMATCH'
  },

  // GL & Accounting Errors
  ACCOUNT_INACTIVE: {
    th: 'บัญชีถูกปิดใช้งาน',
    en: 'Account is inactive',
    code: 'ACCOUNT_INACTIVE'
  },
  CASH_ACCOUNT_NOT_FOUND: {
    th: 'ไม่พบบัญชีเงินสด/ธนาคาร',
    en: 'Cash/Bank account not found',
    code: 'CASH_ACCOUNT_NOT_FOUND'
  },
  AR_ACCOUNT_NOT_FOUND: {
    th: 'ไม่พบบัญชีลูกหนี้การค้า',
    en: 'Accounts Receivable account not found',
    code: 'AR_ACCOUNT_NOT_FOUND'
  },
  AP_ACCOUNT_NOT_FOUND: {
    th: 'ไม่พบบัญชีเจ้าหนี้การค้า',
    en: 'Accounts Payable account not found',
    code: 'AP_ACCOUNT_NOT_FOUND'
  },
  WHT_ACCOUNT_NOT_FOUND: {
    th: 'ไม่พบบัญชีภาษีหัก ณ ที่จ่าย',
    en: 'Withholding Tax account not found',
    code: 'WHT_ACCOUNT_NOT_FOUND'
  },

  // Transaction Errors
  TRANSACTION_FAILED: {
    th: 'ธุรกรรมล้มเหลว',
    en: 'Transaction failed',
    code: 'TRANSACTION_FAILED'
  },
  TRANSACTION_TIMEOUT: {
    th: 'ธุรกรรมใช้เวลานานเกินไป กรุณาลองใหม่',
    en: 'Transaction timeout, please try again',
    code: 'TRANSACTION_TIMEOUT'
  },
  CONFLICT_ERROR: {
    th: 'เกิดความขัดแย้ง กรุณาลองใหม่',
    en: 'Conflict detected, please retry',
    code: 'CONFLICT'
  },
  DUPLICATE_ENTRY: {
    th: 'ข้อมูลซ้ำ',
    en: 'Duplicate entry',
    code: 'DUPLICATE'
  },

  // Network & Server Errors
  SERVER_ERROR: {
    th: 'เกิดข้อผิดพลาดในระบบ',
    en: 'Internal server error',
    code: 'SERVER_ERROR'
  },
  NETWORK_ERROR: {
    th: 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
    en: 'Network error',
    code: 'NETWORK_ERROR'
  },
  TIMEOUT_ERROR: {
    th: 'การดำเนินการใช้เวลานานเกินไป',
    en: 'Request timeout',
    code: 'TIMEOUT'
  },
  SERVICE_UNAVAILABLE: {
    th: 'บริการไม่พร้อมใช้งาน',
    en: 'Service unavailable',
    code: 'SERVICE_UNAVAILABLE'
  },

  // File & Export Errors
  FILE_TOO_LARGE: {
    th: 'ไฟล์มีขนาดใหญ่เกินไป',
    en: 'File size exceeds limit',
    code: 'FILE_TOO_LARGE'
  },
  INVALID_FILE_TYPE: {
    th: 'ประเภทไฟล์ไม่ถูกต้อง',
    en: 'Invalid file type',
    code: 'INVALID_FILE_TYPE'
  },
  EXPORT_FAILED: {
    th: 'ส่งออกข้อมูลไม่สำเร็จ',
    en: 'Export failed',
    code: 'EXPORT_FAILED'
  },
  IMPORT_FAILED: {
    th: 'นำเข้าข้อมูลไม่สำเร็จ',
    en: 'Import failed',
    code: 'IMPORT_FAILED'
  },

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: {
    th: 'ส่งคำขั้อมากเกินไป กรุณารอสักครู่',
    en: 'Too many requests, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  },

  // Payment & Receipt Errors
  PAYMENT_METHOD_REQUIRED: {
    th: 'กรุณาระบุวิธีการชำระเงิน',
    en: 'Payment method required',
    code: 'PAYMENT_METHOD_REQUIRED'
  },
  BANK_ACCOUNT_REQUIRED: {
    th: 'กรุณาระบุบัญชีธนาคาร',
    en: 'Bank account required',
    code: 'BANK_ACCOUNT_REQUIRED'
  },
  CHEQUE_NUMBER_REQUIRED: {
    th: 'กรุณาระบุเลขที่เช็ค',
    en: 'Cheque number required',
    code: 'CHEQUE_NUMBER_REQUIRED'
  },
  ALLOCATION_REQUIRED: {
    th: 'กรุณาจัดจ่ายอย่างน้อย 1 รายการ',
    en: 'At least one allocation required',
    code: 'ALLOCATION_REQUIRED'
  },
} as const

// Type helper for error message objects
export type ErrorMessage = typeof ERROR_MESSAGES[keyof typeof ERROR_MESSAGES]

// Helper function to get Thai message (default)
export function getError(errorKey: keyof typeof ERROR_MESSAGES): string {
  return ERROR_MESSAGES[errorKey].th
}

// Helper function to get error by code
export function getErrorByCode(code: string): ErrorMessage | undefined {
  return Object.values(ERROR_MESSAGES).find(err => err.code === code)
}

// Helper function to format error response
export function formatErrorResponse(errorKey: keyof typeof ERROR_MESSAGES) {
  const error = ERROR_MESSAGES[errorKey]
  return {
    success: false,
    error: error.th,
    code: error.code,
  }
}
