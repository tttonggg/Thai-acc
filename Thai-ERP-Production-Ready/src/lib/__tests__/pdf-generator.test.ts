/**
 * PDF Generator Tests
 * ทดสอบการสร้างเอกสาร PDF
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  generateInvoicePDF,
  generateReceiptPDF,
  generateJournalEntryPDF,
  generateTrialBalancePDF,
  generateIncomeStatementPDF,
  generateBalanceSheetPDF,
  formatCurrency,
  formatDateThai,
  formatAddress
} from '../pdf-generator'

describe('PDF Generator', () => {
  describe('Utility Functions', () => {
    describe('formatCurrency', () => {
      it('should format positive numbers', () => {
        expect(formatCurrency(1234.56)).toBe('฿1,234.56')
      })

      it('should format zero', () => {
        expect(formatCurrency(0)).toBe('฿0.00')
      })

      it('should format large numbers', () => {
        expect(formatCurrency(1234567.89)).toBe('฿1,234,567.89')
      })

      it('should handle decimals correctly', () => {
        expect(formatCurrency(100)).toBe('฿100.00')
        expect(formatCurrency(100.5)).toBe('฿100.50')
      })
    })

    describe('formatDateThai', () => {
      it('should convert to Buddhist era', () => {
        const date = new Date('2024-01-15')
        const result = formatDateThai(date)
        expect(result).toBe('15/01/2567')
      })

      it('should pad single digits', () => {
        const date = new Date('2024-01-05')
        const result = formatDateThai(date)
        expect(result).toBe('05/01/2567')
      })

      it('should handle leap year', () => {
        const date = new Date('2024-02-29')
        const result = formatDateThai(date)
        expect(result).toBe('29/02/2567')
      })
    })

    describe('formatAddress', () => {
      it('should format complete address', () => {
        const addr = {
          address: '123 ถนนสุขุมวิท',
          subDistrict: 'คลองตันเหนือ',
          district: 'วัฒนา',
          province: 'กรุงเทพมหานคร',
          postalCode: '10110'
        }
        const result = formatAddress(addr)
        expect(result).toBe('123 ถนนสุขุมวิท คลองตันเหนือ วัฒนา กรุงเทพมหานคร 10110')
      })

      it('should handle partial address', () => {
        const addr = {
          address: '123 ถนนสุขุมวิท',
          province: 'กรุงเทพมหานคร'
        }
        const result = formatAddress(addr)
        expect(result).toBe('123 ถนนสุขุมวิท กรุงเทพมหานคร')
      })

      it('should handle empty address', () => {
        const addr = {}
        const result = formatAddress(addr)
        expect(result).toBe('')
      })
    })
  })

  describe('PDF Generation Functions', () => {
    describe('generateInvoicePDF', () => {
      it('should generate invoice PDF bytes', async () => {
        const mockInvoice = {
          invoiceNo: 'INV-2024-001',
          invoiceDate: new Date('2024-01-15'),
          dueDate: new Date('2024-02-14'),
          type: 'TAX_INVOICE',
          customer: {
            name: 'ABC Company Limited',
            taxId: '1234567890123',
            address: '456 Main Street',
            subDistrict: 'Bang Rak',
            district: 'Bang Rak',
            province: 'Bangkok',
            postalCode: '10500',
            branchCode: '00000'
          },
          lines: [
            {
              lineNo: 1,
              description: 'Product A',
              quantity: 10,
              unit: 'pcs',
              unitPrice: 100,
              discount: 0,
              amount: 1000
            },
            {
              lineNo: 2,
              description: 'Service B',
              quantity: 1,
              unit: 'job',
              unitPrice: 5000,
              discount: 500,
              amount: 4500
            }
          ],
          subtotal: 5500,
          discountAmount: 500,
          vatRate: 7,
          vatAmount: 385,
          totalAmount: 5885,
          netAmount: 5885,
          reference: 'PO-2024-001',
          notes: 'Thank you for your business'
        }

        const result = await generateInvoicePDF(mockInvoice)

        expect(result).toBeInstanceOf(Uint8Array)
        expect(result.length).toBeGreaterThan(1000) // PDF should be substantial
      })

      it('should handle invoice without due date', async () => {
        const mockInvoice = {
          invoiceNo: 'INV-2024-002',
          invoiceDate: new Date('2024-01-15'),
          type: 'RECEIPT',
          customer: {
            name: 'Walk-in Customer'
          },
          lines: [],
          subtotal: 0,
          discountAmount: 0,
          vatRate: 7,
          vatAmount: 0,
          totalAmount: 0,
          netAmount: 0
        }

        const result = await generateInvoicePDF(mockInvoice)
        expect(result).toBeInstanceOf(Uint8Array)
        expect(result.length).toBeGreaterThan(0)
      })
    })

    describe('generateReceiptPDF', () => {
      it('should generate receipt PDF bytes', async () => {
        const mockReceipt = {
          receiptNo: 'RCP-2024-001',
          receiptDate: new Date('2024-01-15'),
          customer: {
            name: 'Cash Customer',
            taxId: '1234567890123'
          },
          amount: 10000,
          paymentMethod: 'TRANSFER',
          bankName: 'Kasikorn Bank',
          bankAccount: '123-4-56789-0',
          withholding: 30,
          discount: 0,
          netAmount: 9970,
          notes: 'Payment for INV-2024-001'
        }

        const result = await generateReceiptPDF(mockReceipt)

        expect(result).toBeInstanceOf(Uint8Array)
        expect(result.length).toBeGreaterThan(1000)
      })

      it('should handle cash receipt', async () => {
        const mockReceipt = {
          receiptNo: 'RCP-2024-002',
          receiptDate: new Date('2024-01-15'),
          customer: {
            name: 'Walk-in Customer'
          },
          amount: 500,
          paymentMethod: 'CASH',
          withholding: 0,
          discount: 0,
          netAmount: 500
        }

        const result = await generateReceiptPDF(mockReceipt)
        expect(result).toBeInstanceOf(Uint8Array)
        expect(result.length).toBeGreaterThan(0)
      })
    })

    describe('generateJournalEntryPDF', () => {
      it('should generate journal entry PDF bytes', async () => {
        const mockEntry = {
          entryNo: 'JE-2024-001',
          date: new Date('2024-01-15'),
          description: 'Monthly rent payment',
          reference: 'LEASE-001',
          totalDebit: 10000,
          totalCredit: 10000,
          lines: [
            {
              lineNo: 1,
              account: {
                code: '5100',
                name: 'Rent Expense'
              },
              description: 'January 2024 rent',
              debit: 10000,
              credit: 0
            },
            {
              lineNo: 2,
              account: {
                code: '1100',
                name: 'Cash'
              },
              description: '',
              debit: 0,
              credit: 10000
            }
          ],
          notes: 'Approved by manager'
        }

        const result = await generateJournalEntryPDF(mockEntry)

        expect(result).toBeInstanceOf(Uint8Array)
        expect(result.length).toBeGreaterThan(1000)
      })

      it('should handle unbalanced entry', async () => {
        const mockEntry = {
          entryNo: 'JE-2024-002',
          date: new Date('2024-01-15'),
          totalDebit: 10000,
          totalCredit: 9000,
          lines: [
            {
              lineNo: 1,
              account: {
                code: '5100',
                name: 'Expense'
              },
              debit: 10000,
              credit: 0
            },
            {
              lineNo: 2,
              account: {
                code: '1100',
                name: 'Cash'
              },
              debit: 0,
              credit: 9000
            }
          ]
        }

        const result = await generateJournalEntryPDF(mockEntry)
        expect(result).toBeInstanceOf(Uint8Array)
      })
    })

    describe('generateTrialBalancePDF', () => {
      it('should generate trial balance PDF bytes', async () => {
        const mockData = {
          title: 'TRIAL BALANCE',
          titleTh: 'งบทดลอง',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          columns: ['Code', 'Account', 'Debit', 'Credit'],
          data: [
            { code: '1000', account: 'Cash', debit: 50000, credit: 0 },
            { code: '1200', account: 'Accounts Receivable', debit: 30000, credit: 0 },
            { code: '2000', account: 'Accounts Payable', debit: 0, credit: 20000 },
            { code: '3000', account: 'Capital', debit: 0, credit: 60000 }
          ],
          totals: {
            totalDebit: 80000,
            totalCredit: 80000
          }
        }

        const result = await generateTrialBalancePDF(mockData)

        expect(result).toBeInstanceOf(Uint8Array)
        expect(result.length).toBeGreaterThan(1000)
      })
    })

    describe('generateIncomeStatementPDF', () => {
      it('should generate income statement PDF bytes', async () => {
        const mockData = {
          title: 'INCOME STATEMENT',
          titleTh: 'งบกำไรขาดทุน',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          columns: ['Description', 'Amount'],
          data: [
            { account: 'Sales Revenue', amount: 500000 },
            { account: 'Service Revenue', amount: 200000 },
            { account: 'Cost of Goods Sold', amount: 300000 },
            { account: 'Operating Expenses', amount: 150000 }
          ],
          totals: {
            totalRevenue: 700000,
            totalExpense: 450000,
            netIncome: 250000
          }
        }

        const result = await generateIncomeStatementPDF(mockData)

        expect(result).toBeInstanceOf(Uint8Array)
        expect(result.length).toBeGreaterThan(1000)
      })
    })

    describe('generateBalanceSheetPDF', () => {
      it('should generate balance sheet PDF bytes', async () => {
        const mockData = {
          title: 'BALANCE SHEET',
          titleTh: 'งบดุล',
          endDate: new Date('2024-12-31'),
          columns: ['Code', 'Account', 'Amount'],
          data: [
            { type: 'ASSET', account: 'Cash', amount: 100000 },
            { type: 'ASSET', account: 'Accounts Receivable', amount: 50000 },
            { type: 'LIABILITY', account: 'Accounts Payable', amount: 30000 },
            { type: 'EQUITY', account: 'Capital', amount: 120000 }
          ],
          totals: {
            totalAssets: 150000,
            totalLiabilities: 30000,
            totalEquity: 120000,
            totalLiabilitiesEquity: 150000
          }
        }

        const result = await generateBalanceSheetPDF(mockData)

        expect(result).toBeInstanceOf(Uint8Array)
        expect(result.length).toBeGreaterThan(1000)
      })
    })
  })
})
