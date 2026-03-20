/**
 * Validation Schemas - Comprehensive Unit Tests
 * Tests for all Zod validation schemas
 */

import { describe, it, expect } from 'vitest'
import {
  userSchema,
  loginSchema,
  accountSchema,
  journalEntrySchema,
  journalLineSchema,
  customerSchema,
  vendorSchema,
  productSchema,
  invoiceSchema,
  invoiceLineSchema,
  purchaseInvoiceSchema,
  whtSchema,
  companySchema,
  creditNoteSchema,
  debitNoteSchema,
  paymentSchema,
} from '../validations'

describe('Validation Schemas', () => {
  describe('userSchema', () => {
    it('should validate valid user data', () => {
      const data = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'USER',
        isActive: true,
      }
      const result = userSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const data = {
        email: 'invalid-email',
        password: 'password123',
      }
      const result = userSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject short password', () => {
      const data = {
        email: 'test@example.com',
        password: '12345',
      }
      const result = userSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should accept all valid roles', () => {
      const roles = ['ADMIN', 'ACCOUNTANT', 'USER', 'VIEWER']
      roles.forEach(role => {
        const data = {
          email: 'test@example.com',
          password: 'password123',
          role,
        }
        const result = userSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid role', () => {
      const data = {
        email: 'test@example.com',
        password: 'password123',
        role: 'INVALID_ROLE',
      }
      const result = userSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should set default values', () => {
      const data = {
        email: 'test@example.com',
        password: 'password123',
      }
      const result = userSchema.parse(data)
      expect(result.role).toBe('USER')
      expect(result.isActive).toBe(true)
    })
  })

  describe('loginSchema', () => {
    it('should validate valid login credentials', () => {
      const data = {
        email: 'test@example.com',
        password: 'password123',
      }
      const result = loginSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject empty password', () => {
      const data = {
        email: 'test@example.com',
        password: '',
      }
      const result = loginSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject invalid email format', () => {
      const data = {
        email: 'not-an-email',
        password: 'password123',
      }
      const result = loginSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe('accountSchema', () => {
    it('should validate valid account data', () => {
      const data = {
        code: '1-01-01',
        name: 'เงินสด',
        type: 'ASSET',
        level: 4,
        isDetail: true,
        isActive: true,
      }
      const result = accountSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept all valid account types', () => {
      const types = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']
      types.forEach(type => {
        const data = {
          code: '1-01',
          name: 'Test Account',
          type,
        }
        const result = accountSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })

    it('should reject level outside range', () => {
      const data = {
        code: '1-01',
        name: 'Test',
        type: 'ASSET',
        level: 5, // Max is 4
      }
      const result = accountSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject missing required fields', () => {
      const data = {
        code: '', // Empty code
        name: 'Test',
        type: 'ASSET',
      }
      const result = accountSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe('journalEntrySchema', () => {
    it('should validate valid journal entry', () => {
      const data = {
        date: new Date().toISOString(),
        description: 'Test entry',
        lines: [
          { accountId: 'acc-1', description: 'Line 1', debit: 1000, credit: 0 },
          { accountId: 'acc-2', description: 'Line 2', debit: 0, credit: 1000 },
        ],
      }
      const result = journalEntrySchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject single line entry', () => {
      const data = {
        date: new Date().toISOString(),
        lines: [
          { accountId: 'acc-1', debit: 1000, credit: 0 },
        ],
      }
      const result = journalEntrySchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should accept Date object as date', () => {
      const data = {
        date: new Date(),
        lines: [
          { accountId: 'acc-1', debit: 1000, credit: 0 },
          { accountId: 'acc-2', debit: 0, credit: 1000 },
        ],
      }
      const result = journalEntrySchema.safeParse(data)
      expect(result.success).toBe(true)
    })
  })

  describe('journalLineSchema', () => {
    it('should validate valid journal line', () => {
      const data = {
        accountId: 'acc-1',
        description: 'Test line',
        debit: 1000,
        credit: 0,
      }
      const result = journalLineSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject negative amounts', () => {
      const data = {
        accountId: 'acc-1',
        debit: -100,
        credit: 0,
      }
      const result = journalLineSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should set default values', () => {
      const data = {
        accountId: 'acc-1',
      }
      const result = journalLineSchema.parse(data)
      expect(result.debit).toBe(0)
      expect(result.credit).toBe(0)
    })
  })

  describe('customerSchema', () => {
    it('should validate valid customer data', () => {
      const data = {
        code: 'C001',
        name: 'ลูกค้า ก',
        email: 'customer@example.com',
        creditLimit: 100000,
        creditDays: 30,
      }
      const result = customerSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const data = {
        code: 'C001',
        name: 'ลูกค้า ก',
        email: 'not-an-email',
      }
      const result = customerSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should allow empty email', () => {
      const data = {
        code: 'C001',
        name: 'ลูกค้า ก',
        email: '',
      }
      const result = customerSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should set default credit days', () => {
      const data = {
        code: 'C001',
        name: 'ลูกค้า ก',
      }
      const result = customerSchema.parse(data)
      expect(result.creditDays).toBe(30)
    })
  })

  describe('vendorSchema', () => {
    it('should validate valid vendor data', () => {
      const data = {
        code: 'V001',
        name: 'ผู้ขาย ข',
        email: 'vendor@example.com',
        bankName: 'ไทยพาณิชย์',
        bankAccount: '123-4-56789-0',
      }
      const result = vendorSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept all optional fields as empty', () => {
      const data = {
        code: 'V001',
        name: 'ผู้ขาย ข',
      }
      const result = vendorSchema.safeParse(data)
      expect(result.success).toBe(true)
    })
  })

  describe('productSchema', () => {
    it('should validate valid product data', () => {
      const data = {
        code: 'P001',
        name: 'สินค้า A',
        type: 'PRODUCT',
        unit: 'ชิ้น',
        salePrice: 1000,
        costPrice: 600,
        vatRate: 7,
      }
      const result = productSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept service type', () => {
      const data = {
        code: 'S001',
        name: 'บริการ B',
        type: 'SERVICE',
      }
      const result = productSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject invalid type', () => {
      const data = {
        code: 'P001',
        name: 'Test',
        type: 'INVALID',
      }
      const result = productSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject VAT rate over 100%', () => {
      const data = {
        code: 'P001',
        name: 'Test',
        vatRate: 101,
      }
      const result = productSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe('invoiceSchema', () => {
    it('should validate valid invoice', () => {
      const data = {
        invoiceDate: new Date().toISOString(),
        customerId: 'cust-1',
        type: 'TAX_INVOICE',
        lines: [
          { description: 'สินค้า A', quantity: 1, unitPrice: 1000 },
        ],
      }
      const result = invoiceSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept all invoice types', () => {
      const types = ['TAX_INVOICE', 'RECEIPT', 'DELIVERY_NOTE', 'CREDIT_NOTE', 'DEBIT_NOTE']
      types.forEach(type => {
        const data = {
          invoiceDate: new Date().toISOString(),
          customerId: 'cust-1',
          type,
          lines: [{ description: 'Test', quantity: 1, unitPrice: 100 }],
        }
        const result = invoiceSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })

    it('should reject invoice without lines', () => {
      const data = {
        invoiceDate: new Date().toISOString(),
        customerId: 'cust-1',
        lines: [],
      }
      const result = invoiceSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject invoice without customer', () => {
      const data = {
        invoiceDate: new Date().toISOString(),
        customerId: '',
        lines: [{ description: 'Test', quantity: 1, unitPrice: 100 }],
      }
      const result = invoiceSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe('whtSchema', () => {
    it('should validate valid WHT data', () => {
      const data = {
        type: 'PND3',
        documentDate: new Date().toISOString(),
        payeeName: 'ผู้ถูกหักภาษี',
        incomeAmount: 100000,
        whtRate: 3,
        taxMonth: 3,
        taxYear: 2024,
      }
      const result = whtSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept both PND3 and PND53', () => {
      ;['PND3', 'PND53'].forEach(type => {
        const data = {
          type,
          documentDate: new Date().toISOString(),
          payeeName: 'Test',
          incomeAmount: 100000,
          whtRate: 3,
          taxMonth: 3,
          taxYear: 2024,
        }
        const result = whtSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid tax month', () => {
      const data = {
        type: 'PND3',
        documentDate: new Date().toISOString(),
        payeeName: 'Test',
        incomeAmount: 100000,
        whtRate: 3,
        taxMonth: 13, // Invalid
        taxYear: 2024,
      }
      const result = whtSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject WHT rate over 100%', () => {
      const data = {
        type: 'PND3',
        documentDate: new Date().toISOString(),
        payeeName: 'Test',
        incomeAmount: 100000,
        whtRate: 101,
        taxMonth: 3,
        taxYear: 2024,
      }
      const result = whtSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe('companySchema', () => {
    it('should validate valid company data', () => {
      const data = {
        name: 'บริษัท ทดสอบ จำกัด',
        taxId: '0123456789012',
        phone: '02-123-4567',
        email: 'company@example.com',
        fiscalYearStart: 1,
      }
      const result = companySchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const data = {
        name: 'บริษัท ทดสอบ',
        email: 'not-an-email',
      }
      const result = companySchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject fiscal year outside 1-12', () => {
      const data = {
        name: 'บริษัท ทดสอบ',
        fiscalYearStart: 13,
      }
      const result = companySchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe('paymentSchema', () => {
    it('should validate valid payment', () => {
      const data = {
        vendorId: 'vendor-1',
        paymentDate: new Date().toISOString(),
        paymentMethod: 'TRANSFER',
        amount: 50000,
        allocations: [
          { invoiceId: 'inv-1', amount: 50000 },
        ],
      }
      const result = paymentSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept all payment methods', () => {
      const methods = ['CASH', 'TRANSFER', 'CHEQUE', 'CREDIT', 'OTHER']
      methods.forEach(paymentMethod => {
        const data = {
          vendorId: 'vendor-1',
          paymentDate: new Date().toISOString(),
          paymentMethod,
          amount: 1000,
          allocations: [{ invoiceId: 'inv-1', amount: 1000 }],
        }
        const result = paymentSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })

    it('should reject negative amount', () => {
      const data = {
        vendorId: 'vendor-1',
        paymentDate: new Date().toISOString(),
        paymentMethod: 'CASH',
        amount: -1000,
        allocations: [{ invoiceId: 'inv-1', amount: -1000 }],
      }
      const result = paymentSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject payment without allocations', () => {
      const data = {
        vendorId: 'vendor-1',
        paymentDate: new Date().toISOString(),
        paymentMethod: 'CASH',
        amount: 1000,
        allocations: [],
      }
      const result = paymentSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })
})
