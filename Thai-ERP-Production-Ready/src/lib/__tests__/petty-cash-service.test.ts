/**
 * Petty Cash Service Tests
 * Tests for petty cash voucher journal entry creation
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { createVoucherJournalEntry } from '../petty-cash-service'
import { db } from '../db'

describe('Petty Cash Service', () => {
  let testExpenseAccount: any
  let testPettyCashAccount: any

  beforeAll(async () => {
    // Create test chart of accounts
    testExpenseAccount = await db.chartOfAccount.create({
      data: {
        code: '9999',
        name: 'Test Expense',
        type: 'EXPENSE',
        level: 4,
        isDetail: true,
      },
    })

    testPettyCashAccount = await db.chartOfAccount.create({
      data: {
        code: '1001',
        name: 'Test Petty Cash',
        type: 'ASSET',
        level: 4,
        isDetail: true,
      },
    })
  })

  afterAll(async () => {
    // Cleanup
    await db.chartOfAccount.deleteMany({
      where: {
        code: {
          in: ['9999', '1001'],
        },
      },
    })
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

    const debitLine = journalEntry.lines.find((l) => l.debit > 0)
    const creditLine = journalEntry.lines.find((l) => l.credit > 0)

    expect(debitLine).toBeDefined()
    expect(debitLine?.debit).toBe(1000)
    expect(debitLine?.credit).toBe(0)
    expect(debitLine?.accountId).toBe(testExpenseAccount.id)

    expect(creditLine).toBeDefined()
    expect(creditLine?.credit).toBe(1000)
    expect(creditLine?.debit).toBe(0)
    expect(creditLine?.accountId).toBe(testPettyCashAccount.id)

    // Verify debits equal credits
    const totalDebit = journalEntry.lines.reduce((sum, l) => sum + l.debit, 0)
    const totalCredit = journalEntry.lines.reduce((sum, l) => sum + l.credit, 0)
    expect(totalDebit).toBe(totalCredit)
    expect(totalDebit).toBe(1000)

    // Cleanup
    await db.journalEntry.delete({
      where: { id: journalEntry.id },
    })
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

    // Cleanup
    await db.journalEntry.deleteMany({
      where: {
        id: {
          in: [entry1.id, entry2.id],
        },
      },
    })
  })
})
