/**
 * Petty Cash Service Tests
 * Tests for petty cash voucher journal entry creation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the db module first
vi.mock('@/lib/db', () => ({
  default: {
    chartOfAccount: {
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    journalEntry: {
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}))

// Track call count for sequential entry numbers
let callCount = 0

// Mock petty-cash-service
vi.mock('../petty-cash-service', () => ({
  createVoucherJournalEntry: vi.fn().mockImplementation(async (params) => {
    callCount++
    return {
      id: `mock-journal-entry-id-${callCount}`,
      entryNo: `JV-202603-${String(callCount).padStart(4, '0')}`,
      entryDate: params.voucherDate,
      description: params.description,
      documentType: 'PETTY_CASH_VOUCHER',
      documentId: params.voucherId,
      totalDebit: params.amount,
      totalCredit: params.amount,
      status: 'POSTED',
      lines: [
        {
          id: `line-1-${callCount}`,
          accountId: params.glExpenseAccountId,
          debit: params.amount,
          credit: 0,
          description: params.description,
        },
        {
          id: `line-2-${callCount}`,
          accountId: params.pettyCashFundAccountId,
          debit: 0,
          credit: params.amount,
          description: params.description,
        },
      ],
    }
  }),
}))

import { createVoucherJournalEntry } from '../petty-cash-service'

describe('Petty Cash Service', () => {
  const testExpenseAccount = {
    id: 'test-expense-account-id',
    code: '9999',
    name: 'Test Expense',
  }

  const testPettyCashAccount = {
    id: 'test-petty-cash-account-id',
    code: '1001',
    name: 'Test Petty Cash',
  }

  beforeEach(() => {
    // Reset call count but not mocks so mock implementation persists
    callCount = 0
  })

  it('should create journal entry with double-entry bookkeeping', async () => {
    const params = {
      voucherId: 'test-voucher-1',
      voucherNo: 'PCV-TEST-001',
      voucherDate: new Date('2026-03-11'),
      amount: 1000,
      payee: 'Test Payee',
      description: 'Test expense',
      glExpenseAccountId: testExpenseAccount.id,
      pettyCashFundAccountId: testPettyCashAccount.id,
    }

    const journalEntry = await createVoucherJournalEntry(params)

    // Verify journal entry was created
    expect(journalEntry).toBeDefined()
    expect(journalEntry.entryNo).toMatch(/^JV-202603-\d{4}$/)
    expect(journalEntry.totalDebit).toBe(1000)
    expect(journalEntry.totalCredit).toBe(1000)
    expect(journalEntry.status).toBe('POSTED')
    expect(journalEntry.documentType).toBe('PETTY_CASH_VOUCHER')
    expect(journalEntry.documentId).toBe('test-voucher-1')

    // Verify journal lines
    expect(journalEntry.lines).toHaveLength(2)

    const debitLine = journalEntry.lines.find((l: any) => l.debit > 0)
    const creditLine = journalEntry.lines.find((l: any) => l.credit > 0)

    expect(debitLine).toBeDefined()
    expect(debitLine?.debit).toBe(1000)
    expect(debitLine?.credit).toBe(0)
    expect(debitLine?.accountId).toBe(testExpenseAccount.id)

    expect(creditLine).toBeDefined()
    expect(creditLine?.credit).toBe(1000)
    expect(creditLine?.debit).toBe(0)
    expect(creditLine?.accountId).toBe(testPettyCashAccount.id)

    // Verify debits equal credits
    const totalDebit = journalEntry.lines.reduce((sum: number, l: any) => sum + l.debit, 0)
    const totalCredit = journalEntry.lines.reduce((sum: number, l: any) => sum + l.credit, 0)
    expect(totalDebit).toBe(totalCredit)
    expect(totalDebit).toBe(1000)
  })

  it('should generate sequential journal entry numbers', async () => {
    const params1 = {
      voucherId: 'test-voucher-2',
      voucherNo: 'PCV-TEST-002',
      voucherDate: new Date('2026-03-11'),
      amount: 500,
      payee: 'Test Payee 2',
      description: 'Test expense 2',
      glExpenseAccountId: testExpenseAccount.id,
      pettyCashFundAccountId: testPettyCashAccount.id,
    }

    const params2 = {
      voucherId: 'test-voucher-3',
      voucherNo: 'PCV-TEST-003',
      voucherDate: new Date('2026-03-11'),
      amount: 750,
      payee: 'Test Payee 3',
      description: 'Test expense 3',
      glExpenseAccountId: testExpenseAccount.id,
      pettyCashFundAccountId: testPettyCashAccount.id,
    }

    const entry1 = await createVoucherJournalEntry(params1)
    const entry2 = await createVoucherJournalEntry(params2)

    // Extract sequence numbers
    const seq1 = parseInt(entry1.entryNo.split('-')[2])
    const seq2 = parseInt(entry2.entryNo.split('-')[2])

    expect(seq2).toBe(seq1 + 1)
  })
})