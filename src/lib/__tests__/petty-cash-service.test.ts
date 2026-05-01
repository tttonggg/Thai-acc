/**
 * Petty Cash Service Tests
 * Tests for petty cash voucher journal entry creation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createVoucherJournalEntry } from '../petty-cash-service';

// Mock the prisma client
// Path must match production import: import { db } from './db'
vi.mock('../db', () => ({
  db: {
    journalEntry: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    $transaction: vi.fn(),
  },
  default: {
    journalEntry: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe('Petty Cash Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create journal entry with double-entry bookkeeping', async () => {
    const mockDb = (await import('../db')).db;

    // Mock $transaction to execute the callback immediately
    mockDb.$transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => {
      return callback(mockDb);
    });

    // Mock journalEntry.findFirst (used in generateJournalEntryNumber)
    mockDb.journalEntry.findFirst.mockResolvedValue(null); // first entry of the month

    // Mock journalEntry.create to return a complete entry
    mockDb.journalEntry.create.mockResolvedValue({
      id: 'je-1',
      entryNo: 'JV-202401-0001',
      date: new Date('2024-01-15'),
      description: 'เบิกเงินสดย่อย PC-001 - Office supplies',
      reference: 'เบียกเงินสดย่อย PC-001',
      documentType: 'PETTY_CASH_VOUCHER',
      documentId: 'vc-1',
      totalDebit: 500,
      totalCredit: 500,
      status: 'POSTED',
      lines: [
        {
          id: 'line-1',
          lineNo: 1,
          accountId: 'acc-exp',
          description: 'Office supplies (ค่าใช้จ่าย)',
          debit: 500,
          credit: 0,
          reference: 'PC-001',
        },
        {
          id: 'line-2',
          lineNo: 2,
          accountId: 'acc-cash',
          description: 'เงินสดย่อย (John Doe)',
          debit: 0,
          credit: 500,
          reference: 'PC-001',
        },
      ],
    });

    const result = await createVoucherJournalEntry({
      voucherId: 'vc-1',
      voucherNo: 'PC-001',
      voucherDate: new Date('2024-01-15'),
      amount: 500,
      payee: 'John Doe',
      description: 'Office supplies',
      glExpenseAccountId: 'acc-exp',
      pettyCashFundAccountId: 'acc-cash',
    });

    // Verify journalEntry.create was called
    expect(mockDb.journalEntry.create).toHaveBeenCalled();

    // Verify double-entry: debit === credit
    const call = mockDb.journalEntry.create.mock.calls[0][0];
    expect(call.data.totalDebit).toBe(500);
    expect(call.data.totalCredit).toBe(500);
  });

  it('should call journalEntry.create with correct data', async () => {
    const mockDb = (await import('../db')).db;

    mockDb.$transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => {
      return callback(mockDb);
    });

    mockDb.journalEntry.findFirst.mockResolvedValue(null);

    mockDb.journalEntry.create.mockResolvedValue({
      id: 'je-2',
      entryNo: 'JV-202401-0001',
      totalDebit: 200,
      totalCredit: 200,
      lines: [],
    });

    await createVoucherJournalEntry({
      voucherId: 'vc-2',
      voucherNo: 'PC-002',
      voucherDate: new Date('2024-01-15'),
      amount: 200,
      payee: 'Jane Doe',
      description: 'Office supplies',
      glExpenseAccountId: 'acc-exp',
      pettyCashFundAccountId: 'acc-cash',
    });

    expect(mockDb.journalEntry.create).toHaveBeenCalledTimes(1);
    const [[callArgs]] = mockDb.journalEntry.create.mock.calls;
    expect(callArgs.data.description).toBe('เบิกเงินสดย่อย PC-002 - Office supplies');
    expect(callArgs.data.totalDebit).toBe(200);
    expect(callArgs.data.totalCredit).toBe(200);
  });
});
