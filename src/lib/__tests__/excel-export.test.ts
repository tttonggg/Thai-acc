/**
 * Excel Export Service Tests
 * Tests for Excel export functionality
 */

import { describe, it, expect } from 'vitest'
import {
  generateTrialBalanceExcel,
  generateIncomeStatementExcel,
  generateBalanceSheetExcel,
  generateARAgingExcel,
  generateAPAgingExcel,
  generateVATReportExcel,
  generateWHTReportExcel,
} from '../excel-export'

describe('Excel Export Service', () => {
  describe('Trial Balance Export', () => {
    it('should generate Excel buffer for trial balance', async () => {
      const mockData = {
        accounts: [
          {
            code: '1001',
            name: 'เงินสด',
            nameEn: 'Cash',
            type: 'ASSET',
            debit: 50000,
            credit: 0,
            balance: 50000,
          },
          {
            code: '2001',
            name: 'เจ้าหนี้พาณิชย์',
            nameEn: 'Accounts Payable',
            type: 'LIABILITY',
            debit: 0,
            credit: 30000,
            balance: 30000,
          },
        ],
        totals: {
          debit: 50000,
          credit: 30000,
          isBalanced: false,
        },
        asOfDate: new Date().toISOString(),
      }

      const buffer = await generateTrialBalanceExcel(mockData)

      expect(buffer).toBeInstanceOf(Buffer)
      expect(buffer.length).toBeGreaterThan(0)
      // Excel files should start with ZIP signature (PK)
      expect(buffer[0]).toBe(0x50) // P
      expect(buffer[1]).toBe(0x4b) // K
    })
  })

  describe('Income Statement Export', () => {
    it('should generate Excel buffer for income statement', async () => {
      const mockData = {
        revenue: [
          {
            code: '4001',
            name: 'รายได้จากการขาย',
            amount: 100000,
          },
        ],
        expenses: [
          {
            code: '5001',
            name: 'ค่าใช้จ่ายในการขาย',
            amount: 30000,
          },
        ],
        totalRevenue: 100000,
        totalExpenses: 30000,
        netIncome: 70000,
      }

      const buffer = await generateIncomeStatementExcel(mockData)

      expect(buffer).toBeInstanceOf(Buffer)
      expect(buffer.length).toBeGreaterThan(0)
      expect(buffer[0]).toBe(0x50) // P
      expect(buffer[1]).toBe(0x4b) // K
    })
  })

  describe('Balance Sheet Export', () => {
    it('should generate Excel buffer for balance sheet', async () => {
      const mockData = {
        assets: [
          {
            code: '1001',
            name: 'เงินสด',
            amount: 50000,
          },
        ],
        liabilities: [
          {
            code: '2001',
            name: 'เจ้าหนี้พาณิชย์',
            amount: 30000,
          },
        ],
        equity: [
          {
            code: '3001',
            name: 'ทุนจดทะเบียน',
            amount: 20000,
          },
        ],
        totalAssets: 50000,
        totalLiabilities: 30000,
        totalEquity: 20000,
        isBalanced: true,
      }

      const buffer = await generateBalanceSheetExcel(mockData)

      expect(buffer).toBeInstanceOf(Buffer)
      expect(buffer.length).toBeGreaterThan(0)
      expect(buffer[0]).toBe(0x50) // P
      expect(buffer[1]).toBe(0x4b) // K
    })
  })

  describe('AR Aging Export', () => {
    it('should generate Excel buffer for AR aging', async () => {
      const mockData = {
        customers: [
          {
            customerId: '1',
            customerCode: 'C001',
            customerName: 'บริษัท ทดสอบ จำกัด',
            current: 10000,
            days30: 5000,
            days60: 2000,
            days90: 1000,
            over90: 500,
            total: 18500,
          },
        ],
        totals: {
          current: 10000,
          days30: 5000,
          days60: 2000,
          days90: 1000,
          over90: 500,
          total: 18500,
        },
        asOfDate: new Date().toISOString(),
      }

      const buffer = await generateARAgingExcel(mockData)

      expect(buffer).toBeInstanceOf(Buffer)
      expect(buffer.length).toBeGreaterThan(0)
      expect(buffer[0]).toBe(0x50) // P
      expect(buffer[1]).toBe(0x4b) // K
    })
  })

  describe('AP Aging Export', () => {
    it('should generate Excel buffer for AP aging', async () => {
      const mockData = {
        vendors: [
          {
            vendorId: '1',
            vendorCode: 'V001',
            vendorName: 'บริษัท ผู้ขาย จำกัด',
            current: 8000,
            days30: 4000,
            days60: 1500,
            days90: 800,
            over90: 400,
            total: 14700,
          },
        ],
        totals: {
          current: 8000,
          days30: 4000,
          days60: 1500,
          days90: 800,
          over90: 400,
          total: 14700,
        },
        asOfDate: new Date().toISOString(),
      }

      const buffer = await generateAPAgingExcel(mockData)

      expect(buffer).toBeInstanceOf(Buffer)
      expect(buffer.length).toBeGreaterThan(0)
      expect(buffer[0]).toBe(0x50) // P
      expect(buffer[1]).toBe(0x4b) // K
    })
  })

  describe('VAT Report Export', () => {
    it('should generate Excel buffer for VAT report', async () => {
      const mockData = {
        monthlyData: [
          {
            month: '01',
            monthNameTh: 'มกราคม',
            salesVat: 7000,
            purchaseVat: 3000,
            payableVat: 4000,
          },
          {
            month: '02',
            monthNameTh: 'กุมภาพันธ์',
            salesVat: 8000,
            purchaseVat: 3500,
            payableVat: 4500,
          },
        ],
        ytdTotals: {
          salesVat: 15000,
          purchaseVat: 6500,
          payableVat: 8500,
        },
        year: 2025,
      }

      const buffer = await generateVATReportExcel(mockData)

      expect(buffer).toBeInstanceOf(Buffer)
      expect(buffer.length).toBeGreaterThan(0)
      expect(buffer[0]).toBe(0x50) // P
      expect(buffer[1]).toBe(0x4b) // K
    })
  })

  describe('WHT Report Export', () => {
    it('should generate Excel buffer for WHT report (PND3)', async () => {
      const mockData = {
        formType: 'PND3' as const,
        month: '01',
        year: 2025,
        entries: [
          {
            date: '2025-01-15',
            description: 'เงินเดือน มกราคม',
            taxId: '1234567890123',
            amount: 50000,
            taxRate: 5,
            withholdingTax: 2500,
            netPayment: 47500,
          },
        ],
        totals: {
          grossAmount: 50000,
          withholdingTax: 2500,
          netPayment: 47500,
        },
      }

      const buffer = await generateWHTReportExcel(mockData)

      expect(buffer).toBeInstanceOf(Buffer)
      expect(buffer.length).toBeGreaterThan(0)
      expect(buffer[0]).toBe(0x50) // P
      expect(buffer[1]).toBe(0x4b) // K
    })

    it('should generate Excel buffer for WHT report (PND53)', async () => {
      const mockData = {
        formType: 'PND53' as const,
        month: '01',
        year: 2025,
        entries: [
          {
            date: '2025-01-20',
            description: 'ค่าบริการทำสำนักงาน',
            taxId: '9876543210987',
            amount: 100000,
            taxRate: 3,
            withholdingTax: 3000,
            netPayment: 97000,
          },
        ],
        totals: {
          grossAmount: 100000,
          withholdingTax: 3000,
          netPayment: 97000,
        },
      }

      const buffer = await generateWHTReportExcel(mockData)

      expect(buffer).toBeInstanceOf(Buffer)
      expect(buffer.length).toBeGreaterThan(0)
      expect(buffer[0]).toBe(0x50) // P
      expect(buffer[1]).toBe(0x4b) // K
    })
  })
})
