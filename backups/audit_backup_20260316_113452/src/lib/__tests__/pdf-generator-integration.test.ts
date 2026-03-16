/**
 * PDF Generator Integration Tests (No Database Required)
 * ทดสอบการทำงานร่วมกันของ PDF Generator (ไม่ต้องการฐานข้อมูล)
 */

import { describe, it, expect, beforeAll, vi } from 'vitest'
import jsPDF from 'jspdf'

// Mock the database module
vi.mock('@/lib/db', () => ({
  prisma: {
    company: {
      findFirst: async () => ({
        id: 'test-company',
        name: 'Test Company Limited',
        nameEn: 'Test Company Limited',
        taxId: '1234567890123',
        address: '123 Test Street',
        subDistrict: 'Test Subdistrict',
        district: 'Test District',
        province: 'Bangkok',
        postalCode: '10110',
        phone: '02-123-4567',
        email: 'test@example.com',
        fiscalYearStart: 1
      })
    }
  }
}))

describe('PDF Generator Integration Tests', () => {
  describe('Utility Functions', () => {
    it('should import utility functions', async () => {
      const { formatCurrency, formatDateThai, formatAddress } = await import('../pdf-generator')

      expect(formatCurrency).toBeDefined()
      expect(formatDateThai).toBeDefined()
      expect(formatAddress).toBeDefined()
    })

    it('should format currency correctly', async () => {
      const { formatCurrency } = await import('../pdf-generator')

      expect(formatCurrency(1234.56)).toBe('฿1,234.56')
      expect(formatCurrency(0)).toBe('฿0.00')
      expect(formatCurrency(1000000)).toBe('฿1,000,000.00')
    })

    it('should format dates in Buddhist era', async () => {
      const { formatDateThai } = await import('../pdf-generator')

      const date = new Date('2024-01-15')
      expect(formatDateThai(date)).toBe('15/01/2567')
    })

    it('should format addresses correctly', async () => {
      const { formatAddress } = await import('../pdf-generator')

      const addr = {
        address: '123 Test St',
        district: 'Test District',
        province: 'Bangkok',
        postalCode: '10110'
      }

      expect(formatAddress(addr)).toBe('123 Test St Test District Bangkok 10110')
    })
  })

  describe('PDF Generation', () => {
    it('should generate a basic invoice PDF', async () => {
      const { generateInvoicePDF } = await import('../pdf-generator')

      const mockInvoice = {
        invoiceNo: 'TEST-001',
        invoiceDate: new Date('2024-01-15'),
        type: 'TAX_INVOICE' as const,
        customer: {
          name: 'Test Customer',
          taxId: '9876543210123'
        },
        lines: [
          {
            lineNo: 1,
            description: 'Test Product',
            quantity: 1,
            unit: 'pcs',
            unitPrice: 100,
            discount: 0,
            amount: 100
          }
        ],
        subtotal: 100,
        discountAmount: 0,
        vatRate: 7,
        vatAmount: 7,
        totalAmount: 107,
        netAmount: 107
      }

      const pdfBytes = await generateInvoicePDF(mockInvoice)

      expect(pdfBytes).toBeInstanceOf(Uint8Array)
      expect(pdfBytes.length).toBeGreaterThan(1000)

      // Check PDF signature
      const pdfString = new TextDecoder().decode(pdfBytes.slice(0, 10))
      expect(pdfString).toContain('%PDF')
    })

    it('should generate a basic receipt PDF', async () => {
      const { generateReceiptPDF } = await import('../pdf-generator')

      const mockReceipt = {
        receiptNo: 'RCP-001',
        receiptDate: new Date('2024-01-15'),
        customer: {
          name: 'Test Customer'
        },
        amount: 500,
        paymentMethod: 'CASH',
        withholding: 0,
        discount: 0,
        netAmount: 500
      }

      const pdfBytes = await generateReceiptPDF(mockReceipt)

      expect(pdfBytes).toBeInstanceOf(Uint8Array)
      expect(pdfBytes.length).toBeGreaterThan(1000)

      const pdfString = new TextDecoder().decode(pdfBytes.slice(0, 10))
      expect(pdfString).toContain('%PDF')
    })

    it('should generate a journal entry PDF', async () => {
      const { generateJournalEntryPDF } = await import('../pdf-generator')

      const mockEntry = {
        entryNo: 'JE-001',
        date: new Date('2024-01-15'),
        description: 'Test entry',
        totalDebit: 100,
        totalCredit: 100,
        lines: [
          {
            lineNo: 1,
            account: {
              code: '1000',
              name: 'Cash'
            },
            debit: 100,
            credit: 0
          },
          {
            lineNo: 2,
            account: {
              code: '5000',
              name: 'Expense'
            },
            debit: 0,
            credit: 100
          }
        ]
      }

      const pdfBytes = await generateJournalEntryPDF(mockEntry)

      expect(pdfBytes).toBeInstanceOf(Uint8Array)
      expect(pdfBytes.length).toBeGreaterThan(1000)

      const pdfString = new TextDecoder().decode(pdfBytes.slice(0, 10))
      expect(pdfString).toContain('%PDF')
    })

    it('should generate trial balance PDF', async () => {
      const { generateTrialBalancePDF } = await import('../pdf-generator')

      const mockData = {
        title: 'TRIAL BALANCE',
        titleTh: 'งบทดลอง',
        endDate: new Date('2024-12-31'),
        columns: ['Code', 'Account', 'Debit', 'Credit'],
        data: [
          { code: '1000', account: 'Cash', debit: 1000, credit: 0 }
        ],
        totals: {
          totalDebit: 1000,
          totalCredit: 1000
        }
      }

      const pdfBytes = await generateTrialBalancePDF(mockData)

      expect(pdfBytes).toBeInstanceOf(Uint8Array)
      expect(pdfBytes.length).toBeGreaterThan(1000)

      const pdfString = new TextDecoder().decode(pdfBytes.slice(0, 10))
      expect(pdfString).toContain('%PDF')
    })

    it('should generate income statement PDF', async () => {
      const { generateIncomeStatementPDF } = await import('../pdf-generator')

      const mockData = {
        title: 'INCOME STATEMENT',
        titleTh: 'งบกำไรขาดทุน',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        columns: ['Description', 'Amount'],
        data: [
          { account: 'Sales', amount: 5000 }
        ],
        totals: {
          totalRevenue: 5000,
          totalExpense: 0,
          netIncome: 5000
        }
      }

      const pdfBytes = await generateIncomeStatementPDF(mockData)

      expect(pdfBytes).toBeInstanceOf(Uint8Array)
      expect(pdfBytes.length).toBeGreaterThan(1000)

      const pdfString = new TextDecoder().decode(pdfBytes.slice(0, 10))
      expect(pdfString).toContain('%PDF')
    })

    it('should generate balance sheet PDF', async () => {
      const { generateBalanceSheetPDF } = await import('../pdf-generator')

      const mockData = {
        title: 'BALANCE SHEET',
        titleTh: 'งบดุล',
        endDate: new Date('2024-12-31'),
        columns: ['Code', 'Account', 'Amount'],
        data: [
          { type: 'ASSET', account: 'Cash', amount: 10000 }
        ],
        totals: {
          totalAssets: 10000,
          totalLiabilities: 0,
          totalEquity: 10000,
          totalLiabilitiesEquity: 10000
        }
      }

      const pdfBytes = await generateBalanceSheetPDF(mockData)

      expect(pdfBytes).toBeInstanceOf(Uint8Array)
      expect(pdfBytes.length).toBeGreaterThan(1000)

      const pdfString = new TextDecoder().decode(pdfBytes.slice(0, 10))
      expect(pdfString).toContain('%PDF')
    })
  })

  describe('jsPDF Configuration', () => {
    it('should create jsPDF instance with correct settings', () => {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      expect(doc).toBeDefined()
      expect(doc.internal.pageSize.getWidth()).toBe(210) // A4 width in mm
      expect(doc.internal.pageSize.getHeight()).toBe(297) // A4 height in mm
    })

    it('should create landscape PDF', () => {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      })

      expect(doc.internal.pageSize.getWidth()).toBe(297) // Swapped for landscape
      expect(doc.internal.pageSize.getHeight()).toBe(210)
    })
  })
})
