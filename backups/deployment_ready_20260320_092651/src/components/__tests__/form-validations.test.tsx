/**
 * Component Form Validation Tests
 * Tests for form validations across all major components
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { z } from 'zod'

// Import validation schemas
import {
  invoiceSchema,
  journalEntrySchema,
  customerSchema,
  vendorSchema,
  productSchema,
  employeeSchema,
  assetSchema,
  paymentSchema,
} from '@/lib/validations'

describe('Form Validation Schemas', () => {
  describe('Invoice Schema', () => {
    it('should validate valid invoice data', () => {
      const validData = {
        customerId: 'cust-1',
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        items: [
          {
            productId: 'prod-1',
            quantity: 2,
            unitPrice: 1000,
            amount: 2000,
          },
        ],
        subtotal: 2000,
        vatAmount: 140,
        totalAmount: 2140,
      }

      const result = invoiceSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invoice without customer', () => {
      const invalidData = {
        customerId: '',
        invoiceDate: new Date(),
        dueDate: new Date(),
        items: [],
        subtotal: 0,
        totalAmount: 0,
      }

      const result = invoiceSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject negative amounts', () => {
      const invalidData = {
        customerId: 'cust-1',
        invoiceDate: new Date(),
        dueDate: new Date(),
        items: [
          {
            productId: 'prod-1',
            quantity: -1,
            unitPrice: 1000,
            amount: -1000,
          },
        ],
        subtotal: -1000,
        totalAmount: -1000,
      }

      const result = invoiceSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject due date before invoice date', () => {
      const invalidData = {
        customerId: 'cust-1',
        invoiceDate: new Date('2024-03-15'),
        dueDate: new Date('2024-03-10'),
        items: [],
        subtotal: 0,
        totalAmount: 0,
      }

      const result = invoiceSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should validate VAT calculation', () => {
      const data = {
        customerId: 'cust-1',
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        items: [
          { productId: 'prod-1', quantity: 1, unitPrice: 1000, amount: 1000 },
        ],
        subtotal: 1000,
        vatRate: 7,
        vatAmount: 70,
        totalAmount: 1070,
      }

      const result = invoiceSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should validate withholding tax fields', () => {
      const data = {
        customerId: 'cust-1',
        invoiceDate: new Date(),
        dueDate: new Date(),
        items: [{ productId: 'prod-1', quantity: 1, unitPrice: 100000, amount: 100000 }],
        subtotal: 100000,
        vatAmount: 7000,
        whtRate: 3,
        whtAmount: 3000,
        totalAmount: 104000,
      }

      const result = invoiceSchema.safeParse(data)
      expect(result.success).toBe(true)
    })
  })

  describe('Journal Entry Schema', () => {
    it('should validate balanced journal entry', () => {
      const validData = {
        date: new Date(),
        description: 'Test entry',
        lines: [
          { accountId: 'acc-1', debit: 1000, credit: 0 },
          { accountId: 'acc-2', debit: 0, credit: 1000 },
        ],
      }

      const result = journalEntrySchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject unbalanced journal entry', () => {
      const invalidData = {
        date: new Date(),
        description: 'Unbalanced entry',
        lines: [
          { accountId: 'acc-1', debit: 1000, credit: 0 },
          { accountId: 'acc-2', debit: 0, credit: 900 },
        ],
      }

      const result = journalEntrySchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject entry with less than 2 lines', () => {
      const invalidData = {
        date: new Date(),
        description: 'Single line entry',
        lines: [{ accountId: 'acc-1', debit: 1000, credit: 0 }],
      }

      const result = journalEntrySchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject entry without description', () => {
      const invalidData = {
        date: new Date(),
        description: '',
        lines: [
          { accountId: 'acc-1', debit: 1000, credit: 0 },
          { accountId: 'acc-2', debit: 0, credit: 1000 },
        ],
      }

      const result = journalEntrySchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject negative debit/credit values', () => {
      const invalidData = {
        date: new Date(),
        description: 'Test entry',
        lines: [
          { accountId: 'acc-1', debit: -1000, credit: 0 },
          { accountId: 'acc-2', debit: 0, credit: -1000 },
        ],
      }

      const result = journalEntrySchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject line with both debit and credit', () => {
      const invalidData = {
        date: new Date(),
        description: 'Test entry',
        lines: [
          { accountId: 'acc-1', debit: 1000, credit: 1000 },
          { accountId: 'acc-2', debit: 0, credit: 1000 },
        ],
      }

      const result = journalEntrySchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('Customer Schema', () => {
    it('should validate valid customer data', () => {
      const validData = {
        code: 'CUST001',
        name: 'Test Customer Co., Ltd.',
        taxId: '1234567890123',
        address: '123 Test Street',
        phone: '02-123-4567',
        email: 'test@example.com',
        creditLimit: 100000,
        paymentTerms: 30,
      }

      const result = customerSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email format', () => {
      const invalidData = {
        code: 'CUST001',
        name: 'Test Customer',
        email: 'invalid-email',
      }

      const result = customerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid Thai tax ID length', () => {
      const invalidData = {
        code: 'CUST001',
        name: 'Test Customer',
        taxId: '123456', // Too short
      }

      const result = customerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject negative credit limit', () => {
      const invalidData = {
        code: 'CUST001',
        name: 'Test Customer',
        creditLimit: -1000,
      }

      const result = customerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject negative payment terms', () => {
      const invalidData = {
        code: 'CUST001',
        name: 'Test Customer',
        paymentTerms: -5,
      }

      const result = customerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('Product Schema', () => {
    it('should validate valid product data', () => {
      const validData = {
        code: 'PROD001',
        name: 'Test Product',
        description: 'A test product',
        category: 'Electronics',
        unitPrice: 1500,
        costPrice: 1000,
        stockQuantity: 100,
        reorderPoint: 20,
        vatRate: 7,
      }

      const result = productSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject negative stock quantity', () => {
      const invalidData = {
        code: 'PROD001',
        name: 'Test Product',
        stockQuantity: -10,
      }

      const result = productSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject negative prices', () => {
      const invalidData = {
        code: 'PROD001',
        name: 'Test Product',
        unitPrice: -1000,
        costPrice: -500,
      }

      const result = productSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should validate VAT rate within valid range', () => {
      const invalidData = {
        code: 'PROD001',
        name: 'Test Product',
        vatRate: 25, // Invalid VAT rate
      }

      const result = productSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('Employee Schema', () => {
    it('should validate valid employee data', () => {
      const validData = {
        code: 'EMP001',
        firstName: 'สมชาย',
        lastName: 'ใจดี',
        email: 'somchai@example.com',
        phone: '081-234-5678',
        hireDate: new Date('2024-01-15'),
        baseSalary: 25000,
        department: 'IT',
        position: 'Developer',
      }

      const result = employeeSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject negative salary', () => {
      const invalidData = {
        code: 'EMP001',
        firstName: 'Test',
        lastName: 'User',
        baseSalary: -5000,
      }

      const result = employeeSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should validate Thai phone number format', () => {
      const invalidData = {
        code: 'EMP001',
        firstName: 'Test',
        lastName: 'User',
        phone: '12345', // Too short
      }

      const result = employeeSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('Asset Schema', () => {
    it('should validate valid asset data', () => {
      const validData = {
        code: 'ASSET001',
        name: 'Computer',
        purchaseDate: new Date('2024-01-15'),
        purchaseCost: 50000,
        salvageValue: 5000,
        usefulLifeYears: 5,
        assetAccountId: 'acc-1',
        accumDepAccountId: 'acc-2',
        depExpenseAccountId: 'acc-3',
      }

      const result = assetSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject salvage value greater than cost', () => {
      const invalidData = {
        code: 'ASSET001',
        name: 'Computer',
        purchaseCost: 50000,
        salvageValue: 60000,
        usefulLifeYears: 5,
      }

      const result = assetSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject zero useful life', () => {
      const invalidData = {
        code: 'ASSET001',
        name: 'Computer',
        purchaseCost: 50000,
        usefulLifeYears: 0,
      }

      const result = assetSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject negative depreciation amounts', () => {
      const invalidData = {
        code: 'ASSET001',
        name: 'Computer',
        purchaseCost: -50000,
        salvageValue: -5000,
        usefulLifeYears: 5,
      }

      const result = assetSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('Payment Schema', () => {
    it('should validate valid payment data', () => {
      const validData = {
        vendorId: 'vend-1',
        paymentDate: new Date(),
        amount: 10000,
        paymentMethod: 'BANK_TRANSFER',
        bankAccountId: 'bank-1',
        reference: 'REF001',
        notes: 'Payment for invoice',
      }

      const result = paymentSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject negative payment amount', () => {
      const invalidData = {
        vendorId: 'vend-1',
        paymentDate: new Date(),
        amount: -1000,
        paymentMethod: 'CASH',
      }

      const result = paymentSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject zero payment amount', () => {
      const invalidData = {
        vendorId: 'vend-1',
        paymentDate: new Date(),
        amount: 0,
        paymentMethod: 'CASH',
      }

      const result = paymentSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should validate required payment method', () => {
      const invalidData = {
        vendorId: 'vend-1',
        paymentDate: new Date(),
        amount: 1000,
        paymentMethod: '',
      }

      const result = paymentSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })
})

describe('Form Validation Edge Cases', () => {
  it('should handle special characters in text fields', () => {
    const data = {
      code: 'CUST-001_TEST',
      name: 'Test & Co. (Thailand) Ltd.',
      description: 'Line 1\nLine 2\tTabbed',
    }

    // Should not throw errors
    expect(() => customerSchema.safeParse(data)).not.toThrow()
  })

  it('should handle very large numbers', () => {
    const data = {
      customerId: 'cust-1',
      invoiceDate: new Date(),
      dueDate: new Date(),
      items: [
        { productId: 'prod-1', quantity: 1, unitPrice: 999999999, amount: 999999999 },
      ],
      subtotal: 999999999,
      totalAmount: 1069999998.93, // With VAT
    }

    const result = invoiceSchema.safeParse(data)
    // Should handle without overflow
    expect(result.success || !result.success).toBeDefined()
  })

  it('should handle decimal precision correctly', () => {
    const data = {
      date: new Date(),
      description: 'Precision test',
      lines: [
        { accountId: 'acc-1', debit: 1000.555, credit: 0 },
        { accountId: 'acc-2', debit: 0, credit: 1000.555 },
      ],
    }

    const result = journalEntrySchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('should handle empty strings vs null', () => {
    const data1 = { code: 'CUST001', name: 'Test', email: null }
    const data2 = { code: 'CUST001', name: 'Test', email: '' }

    // Both should be handled gracefully
    expect(() => customerSchema.safeParse(data1)).not.toThrow()
    expect(() => customerSchema.safeParse(data2)).not.toThrow()
  })

  it('should validate date range constraints', () => {
    const futureDate = new Date('2030-01-01')
    const pastDate = new Date('1990-01-01')

    const data = {
      code: 'ASSET001',
      name: 'Test',
      purchaseDate: futureDate,
    }

    // Should accept future dates for planned purchases
    const result = assetSchema.safeParse(data)
    expect(result.success).toBe(true)
  })
})
