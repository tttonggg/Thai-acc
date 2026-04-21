/**
 * Withholding Tax Service - Comprehensive Unit Tests
 * Tests for WHT generation from payments and receipts
 */

import { describe, it, expect, vi } from 'vitest'
import {
  generateWhtFromPayment,
  generateWhtFromReceipt,
} from '../wht-service'

// Mock the prisma client - use vi.hoisted to avoid hoisting issues
const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    payment: {
      findUnique: vi.fn(),
    },
    receipt: {
      findUnique: vi.fn(),
    },
    withholdingTax: {
      count: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock('@/lib/db', () => ({
  prisma: mockPrisma,
  default: mockPrisma,
}))

describe('WHT Service', () => {
  describe('generateWhtFromPayment', () => {
    it('should create WHT record from payment with withholding', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue({
        id: 'pay-1',
        paymentNo: 'PMT-001',
        paymentDate: new Date('2024-03-15'),
        allocations: [{
          invoice: {
            id: 'inv-1',
            invoiceNo: 'INV-001',
            subtotal: 100000,
            discountAmount: 0,
            withholdingAmount: 3000,
            withholdingRate: 3,
            vendor: {
              id: 'vendor-1',
              name: 'บริษัท ทดสอบ จำกัด',
              taxId: '0123456789012',
              address: '123 ถนนสุขุมวิท',
            },
            lines: [{
              product: {
                type: 'SERVICE',
                incomeType: 'ค่าบริการ 3%',
              },
            }],
          },
        }],
      })
      mockPrisma.withholdingTax.count.mockResolvedValue(5)
      mockPrisma.withholdingTax.create.mockImplementation((data: any) =>
        Promise.resolve({ id: 'wht-1', ...data.data })
      )

      const result = await generateWhtFromPayment('pay-1')

      expect(result).toBeDefined()
      expect(result.documentNo).toMatch(/^WHT/)
      expect(result.type).toBe('PND53') // Company
      expect(result.whtAmount).toBe(3000)
      expect(result.whtRate).toBe(3)
    })

    it('should determine PND3 for individuals', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue({
        id: 'pay-1',
        paymentNo: 'PMT-001',
        paymentDate: new Date('2024-03-15'),
        allocations: [{
          invoice: {
            id: 'inv-1',
            subtotal: 50000,
            discountAmount: 0,
            withholdingAmount: 2500,
            withholdingRate: 5,
            vendor: {
              id: 'vendor-1',
              name: 'สมชาย ใจดี',
              taxId: '1234567890123', // Doesn't start with 0
              address: '456 ถนนเพชรบุรี',
            },
            lines: [{
              product: {
                type: 'SERVICE',
                incomeType: 'ค่าจ้าง 5%',
              },
            }],
          },
        }],
      })
      mockPrisma.withholdingTax.count.mockResolvedValue(0)
      mockPrisma.withholdingTax.create.mockImplementation((data: any) =>
        Promise.resolve({ id: 'wht-1', ...data.data })
      )

      const result = await generateWhtFromPayment('pay-1')

      expect(result.type).toBe('PND3') // Individual
    })

    it('should return null when no withholding on invoice', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue({
        id: 'pay-1',
        allocations: [{
          invoice: {
            id: 'inv-1',
            withholdingAmount: 0,
            vendor: { id: 'vendor-1', name: 'Test' },
            lines: [],
          },
        }],
      })

      const result = await generateWhtFromPayment('pay-1')

      expect(result).toBeNull()
    })

    it('should return null when payment has no allocations', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue({
        id: 'pay-1',
        allocations: [],
      })

      const result = await generateWhtFromPayment('pay-1')

      expect(result).toBeNull()
    })

    it('should return null when payment not found', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue(null)

      const result = await generateWhtFromPayment('nonexistent')

      expect(result).toBeNull()
    })

    it('should determine PND53 for companies (name contains บริษัท)', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue({
        id: 'pay-1',
        paymentNo: 'PMT-001',
        paymentDate: new Date('2024-03-15'),
        allocations: [{
          invoice: {
            id: 'inv-1',
            subtotal: 100000,
            discountAmount: 0,
            withholdingAmount: 3000,
            withholdingRate: 3,
            vendor: {
              id: 'vendor-1',
              name: 'บริษัท เอบีซี จำกัด', // Contains บริษัท
              taxId: '1234567890123', // Doesn't start with 0 but has บริษัท in name
              address: '123 กรุงเทพ',
            },
            lines: [{
              product: {
                type: 'SERVICE',
                incomeType: 'ค่าบริการ 3%',
              },
            }],
          },
        }],
      })
      mockPrisma.withholdingTax.count.mockResolvedValue(0)
      mockPrisma.withholdingTax.create.mockImplementation((data: any) =>
        Promise.resolve({ id: 'wht-1', ...data.data })
      )

      const result = await generateWhtFromPayment('pay-1')

      expect(result.type).toBe('PND53')
    })

    it('should calculate income amount after discount', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue({
        id: 'pay-1',
        paymentNo: 'PMT-001',
        paymentDate: new Date('2024-03-15'),
        allocations: [{
          invoice: {
            id: 'inv-1',
            subtotal: 100000,
            discountAmount: 10000,
            withholdingAmount: 2700,
            withholdingRate: 3,
            vendor: {
              id: 'vendor-1',
              name: 'บริษัท ทดสอบ จำกัด',
              taxId: '0123456789012',
              address: '123 กรุงเทพ',
            },
            lines: [{
              product: {
                type: 'SERVICE',
                incomeType: 'ค่าบริการ 3%',
              },
            }],
          },
        }],
      })
      mockPrisma.withholdingTax.count.mockResolvedValue(0)
      mockPrisma.withholdingTax.create.mockImplementation((data: any) =>
        Promise.resolve({ id: 'wht-1', ...data.data })
      )

      const result = await generateWhtFromPayment('pay-1')

      expect(result.incomeAmount).toBe(90000) // 100000 - 10000
    })

    it('should handle missing product income type gracefully', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue({
        id: 'pay-1',
        paymentNo: 'PMT-001',
        paymentDate: new Date('2024-03-15'),
        allocations: [{
          invoice: {
            id: 'inv-1',
            subtotal: 100000,
            discountAmount: 0,
            withholdingAmount: 3000,
            withholdingRate: 3,
            vendor: {
              id: 'vendor-1',
              name: 'บริษัท ทดสอบ จำกัด',
              taxId: '0123456789012',
              address: '123 กรุงเทพ',
            },
            lines: [{
              product: {
                type: 'PRODUCT', // Not service
                incomeType: null,
              },
            }],
          },
        }],
      })
      mockPrisma.withholdingTax.count.mockResolvedValue(0)
      mockPrisma.withholdingTax.create.mockImplementation((data: any) =>
        Promise.resolve({ id: 'wht-1', ...data.data })
      )

      const result = await generateWhtFromPayment('pay-1')

      expect(result.incomeType).toBe('ค่าบริการ') // Default value
    })
  })

  describe('generateWhtFromReceipt', () => {
    it('should create WHT record from receipt with withholding', async () => {
      mockPrisma.receipt.findUnique.mockResolvedValue({
        id: 'rcpt-1',
        receiptNo: 'RCPT-001',
        receiptDate: new Date('2024-03-15'),
        allocations: [{
          invoice: {
            id: 'inv-1',
            invoiceNo: 'INV-001',
            subtotal: 100000,
            discountAmount: 0,
            withholdingAmount: 3000,
            withholdingRate: 3,
            customer: {
              id: 'cust-1',
              name: 'บริษัท ลูกค้า จำกัด',
              taxId: '0123456789012',
              address: '789 ถนนพระราม 9',
            },
            lines: [{
              product: {
                type: 'SERVICE',
                incomeType: 'ค่าบริการ 3%',
              },
            }],
          },
        }],
      })
      mockPrisma.withholdingTax.count.mockResolvedValue(5)
      mockPrisma.withholdingTax.create.mockImplementation((data: any) =>
        Promise.resolve({ id: 'wht-1', ...data.data })
      )

      const result = await generateWhtFromReceipt('rcpt-1')

      // Result is an array since generateWhtFromReceipt loops over allocations
      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(result[0].documentNo).toMatch(/^WHT-REC-/)
      expect(result[0].type).toBe('PND53')
      expect(result[0].whtAmount).toBe(3000)
    })

it('should determine PND3 for individual customers', async () => {
      const mockPrisma = (await import('@/lib/db')).default
      mockPrisma.receipt.findUnique.mockResolvedValue({
        id: 'rcpt-1',
        receiptNo: 'RCPT-001',
        receiptDate: new Date('2024-03-15'),
        allocations: [{
          invoice: {
            id: 'inv-1',
            subtotal: 50000,
            discountAmount: 0,
            withholdingAmount: 2500,
            withholdingRate: 5,
            customer: {
              id: 'cust-1',
              name: 'มานี มานะ',
              taxId: '1234567890123',
              address: '999 ถนนสีลม',
            },
            lines: [{
              product: {
                type: 'SERVICE',
                incomeType: 'ค่าจ้าง 5%',
              },
            }],
          },
        }],
      })
      mockPrisma.withholdingTax.count.mockResolvedValue(0)
      mockPrisma.withholdingTax.create.mockImplementation((data: any) => 
        Promise.resolve({ id: 'wht-1', ...data.data })
      )

      const result = await generateWhtFromReceipt('rcpt-1')

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(result[0].type).toBe('PND3')
    })
    })

    it('should return null when no withholding on invoice', async () => {
      mockPrisma.receipt.findUnique.mockResolvedValue({
        id: 'rcpt-1',
        invoice: {
          id: 'inv-1',
          withholdingAmount: 0,
          customer: { id: 'cust-1', name: 'Test' },
          lines: [],
        },
      })

      const result = await generateWhtFromReceipt('rcpt-1')

      expect(result).toBeNull()
    })

    it('should return null when receipt not found', async () => {
      mockPrisma.receipt.findUnique.mockResolvedValue(null)

      const result = await generateWhtFromReceipt('nonexistent')

      expect(result).toBeNull()
    })

    it('should return null when receipt has no invoice', async () => {
      mockPrisma.receipt.findUnique.mockResolvedValue({
        id: 'rcpt-1',
        invoice: null,
      })

      const result = await generateWhtFromReceipt('rcpt-1')

      expect(result).toBeNull()
    })

    it('should set correct tax month and year', async () => {
      mockPrisma.receipt.findUnique.mockResolvedValue({
        id: 'rcpt-1',
        receiptNo: 'RCPT-001',
        receiptDate: new Date('2024-03-15'), // March
        allocations: [{
          invoice: {
            id: 'inv-1',
            subtotal: 100000,
            discountAmount: 0,
            withholdingAmount: 3000,
            withholdingRate: 3,
            customer: {
              id: 'cust-1',
              name: 'บริษัท ลูกค้า จำกัด',
              taxId: '0123456789012',
              address: '789 ถนนพระราม 9',
            },
            lines: [{
              product: {
                type: 'SERVICE',
                incomeType: 'ค่าบริการ 3%',
              },
            }],
          },
        }],
      })
      mockPrisma.withholdingTax.count.mockResolvedValue(0)
      mockPrisma.withholdingTax.create.mockImplementation((data: any) =>
        Promise.resolve({ id: 'wht-1', ...data.data })
      )

      const result = await generateWhtFromReceipt('rcpt-1')

      expect(result[0].taxMonth).toBe(3)
      expect(result[0].taxYear).toBe(2024)
    })

    it('should default to status PENDING', async () => {
      mockPrisma.receipt.findUnique.mockResolvedValue({
        id: 'rcpt-1',
        receiptNo: 'RCPT-001',
        receiptDate: new Date('2024-03-15'),
        allocations: [{
          invoice: {
            id: 'inv-1',
            subtotal: 100000,
            discountAmount: 0,
            withholdingAmount: 3000,
            withholdingRate: 3,
            customer: {
              id: 'cust-1',
              name: 'บริษัท ลูกค้า จำกัด',
              taxId: '0123456789012',
              address: '789 ถนนพระราม 9',
            },
            lines: [{
              product: {
                type: 'SERVICE',
                incomeType: 'ค่าบริการ 3%',
              },
            }],
          },
        }],
      })
      mockPrisma.withholdingTax.count.mockResolvedValue(0)
      mockPrisma.withholdingTax.create.mockImplementation((data: any) =>
        Promise.resolve({ id: 'wht-1', ...data.data })
      )

      const result = await generateWhtFromReceipt('rcpt-1')

      expect(result[0].reportStatus).toBe('PENDING')
    })
  })
})