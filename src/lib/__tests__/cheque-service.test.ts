/**
 * Cheque Service - Comprehensive Unit Tests
 * Tests for cheque clearing, journal entries, and bounce handling
 */

import { describe, it, expect, vi } from 'vitest';
import {
  createReceivedChequeJournalEntry,
  createPaymentChequeJournalEntry,
  clearCheque,
  bounceCheque,
} from '../cheque-service';

// Mock the prisma client
vi.mock('@/lib/db', () => ({
  default: {
    $transaction: vi.fn((callback: any) =>
      callback({
        cheque: {
          findUnique: vi.fn(),
          update: vi.fn(),
        },
        chartOfAccount: {
          findFirst: vi.fn(),
        },
        journalEntry: {
          count: vi.fn(),
          create: vi.fn(),
          findUnique: vi.fn(),
          update: vi.fn(),
        },
      })
    ),
    cheque: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    journalEntry: {
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('Cheque Service', () => {
  describe('createReceivedChequeJournalEntry', () => {
    it('should create journal entry for received cheque clearing', async () => {
      const mockTx = {
        cheque: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'chq-1',
            chequeNo: 'CHQ001',
            type: 'RECEIVE',
            status: 'PENDING',
            amount: 50000,
            payeeName: 'ลูกค้า ก',
            bankAccount: {
              id: 'bank-1',
              bankName: 'ไทยพาณิชย์',
              glAccountId: 'acc-bank-123',
            },
            journalEntryId: null,
          }),
          update: vi.fn(),
        },
        chartOfAccount: {
          findFirst: vi.fn().mockResolvedValue({
            id: 'acc-ar-456',
            code: '1121',
            name: 'ลูกหนี้การค้า',
          }),
        },
        journalEntry: {
          count: vi.fn().mockResolvedValue(10),
          create: vi.fn().mockImplementation((data: any) =>
            Promise.resolve({
              id: 'je-1',
              ...data.data,
              lines: data.data.lines.create,
            })
          ),
        },
      };

      const mockPrisma = (await import('@/lib/db')).default;
      mockPrisma.$transaction.mockImplementation((callback: any) => callback(mockTx));

      const result = await createReceivedChequeJournalEntry(
        'chq-1',
        new Date('2024-03-15'),
        'user-1'
      );

      expect(result).toBeDefined();
      expect(result.entryNo).toMatch(/^CHQ-/);
      expect(result.documentType).toBe('CHEQUE_RECEIVE');
    });

    it('should debit bank account for received cheque', async () => {
      const mockTx = {
        cheque: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'chq-1',
            chequeNo: 'CHQ001',
            type: 'RECEIVE',
            status: 'PENDING',
            amount: 50000,
            payeeName: 'ลูกค้า ก',
            bankAccount: {
              id: 'bank-1',
              bankName: 'ไทยพาณิชย์',
              glAccountId: 'acc-bank-123',
            },
            journalEntryId: null,
          }),
          update: vi.fn(),
        },
        chartOfAccount: {
          findFirst: vi.fn().mockResolvedValue({
            id: 'acc-ar-456',
            code: '1121',
            name: 'ลูกหนี้การค้า',
          }),
        },
        journalEntry: {
          count: vi.fn().mockResolvedValue(0),
          create: vi.fn().mockImplementation((data: any) => {
            const lines = data.data.lines.create;
            const debitLine = lines.find((l: any) => l.debit > 0);
            expect(debitLine.accountId).toBe('acc-bank-123');
            expect(debitLine.debit).toBe(50000);
            return Promise.resolve({ id: 'je-1', ...data.data, lines });
          }),
        },
      };

      const mockPrisma = (await import('@/lib/db')).default;
      mockPrisma.$transaction.mockImplementation((callback: any) => callback(mockTx));

      await createReceivedChequeJournalEntry('chq-1', new Date('2024-03-15'));
    });

    it('should credit AR account for received cheque', async () => {
      const mockTx = {
        cheque: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'chq-1',
            chequeNo: 'CHQ001',
            type: 'RECEIVE',
            status: 'PENDING',
            amount: 50000,
            payeeName: 'ลูกค้า ก',
            bankAccount: {
              id: 'bank-1',
              bankName: 'ไทยพาณิชย์',
              glAccountId: 'acc-bank-123',
            },
            journalEntryId: null,
          }),
          update: vi.fn(),
        },
        chartOfAccount: {
          findFirst: vi.fn().mockResolvedValue({
            id: 'acc-ar-456',
            code: '1121',
            name: 'ลูกหนี้การค้า',
          }),
        },
        journalEntry: {
          count: vi.fn().mockResolvedValue(0),
          create: vi.fn().mockImplementation((data: any) => {
            const lines = data.data.lines.create;
            const creditLine = lines.find((l: any) => l.credit > 0);
            expect(creditLine.accountId).toBe('acc-ar-456');
            expect(creditLine.credit).toBe(50000);
            return Promise.resolve({ id: 'je-1', ...data.data, lines });
          }),
        },
      };

      const mockPrisma = (await import('@/lib/db')).default;
      mockPrisma.$transaction.mockImplementation((callback: any) => callback(mockTx));

      await createReceivedChequeJournalEntry('chq-1', new Date('2024-03-15'));
    });

    it('should throw error if cheque not found', async () => {
      const mockTx = {
        cheque: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
      };

      const mockPrisma = (await import('@/lib/db')).default;
      mockPrisma.$transaction.mockImplementation((callback: any) => callback(mockTx));

      await expect(createReceivedChequeJournalEntry('nonexistent', new Date())).rejects.toThrow(
        'Cheque not found'
      );
    });

    it('should throw error if not a received cheque', async () => {
      const mockTx = {
        cheque: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'chq-1',
            type: 'PAY',
          }),
        },
      };

      const mockPrisma = (await import('@/lib/db')).default;
      mockPrisma.$transaction.mockImplementation((callback: any) => callback(mockTx));

      await expect(createReceivedChequeJournalEntry('chq-1', new Date())).rejects.toThrow(
        'Not a received cheque'
      );
    });

    it('should throw error if already cleared', async () => {
      const mockTx = {
        cheque: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'chq-1',
            type: 'RECEIVE',
            status: 'CLEARED',
            journalEntryId: 'je-1',
          }),
        },
      };

      const mockPrisma = (await import('@/lib/db')).default;
      mockPrisma.$transaction.mockImplementation((callback: any) => callback(mockTx));

      await expect(createReceivedChequeJournalEntry('chq-1', new Date())).rejects.toThrow(
        'Cheque already cleared'
      );
    });

    it('should throw error if AR account not found', async () => {
      const mockTx = {
        cheque: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'chq-1',
            chequeNo: 'CHQ001',
            type: 'RECEIVE',
            status: 'PENDING',
            amount: 50000,
            payeeName: 'ลูกค้า ก',
            bankAccount: {
              id: 'bank-1',
              bankName: 'ไทยพาณิชย์',
              glAccountId: 'acc-bank-123',
            },
            journalEntryId: null,
          }),
        },
        chartOfAccount: {
          findFirst: vi.fn().mockResolvedValue(null),
        },
      };

      const mockPrisma = (await import('@/lib/db')).default;
      mockPrisma.$transaction.mockImplementation((callback: any) => callback(mockTx));

      await expect(createReceivedChequeJournalEntry('chq-1', new Date())).rejects.toThrow(
        'Accounts Receivable GL account not found'
      );
    });
  });

  describe('createPaymentChequeJournalEntry', () => {
    it('should create journal entry for payment cheque clearing', async () => {
      const mockTx = {
        cheque: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'chq-2',
            chequeNo: 'CHQ002',
            type: 'PAY',
            status: 'PENDING',
            amount: 30000,
            payeeName: 'ผู้ขาย ข',
            bankAccount: {
              id: 'bank-1',
              bankName: 'กรุงเทพ',
              glAccountId: 'acc-bank-123',
            },
            journalEntryId: null,
          }),
          update: vi.fn(),
        },
        chartOfAccount: {
          findFirst: vi.fn().mockResolvedValue({
            id: 'acc-ap-789',
            code: '2110',
            name: 'เจ้าหนี้การค้า',
          }),
        },
        journalEntry: {
          count: vi.fn().mockResolvedValue(5),
          create: vi.fn().mockImplementation((data: any) =>
            Promise.resolve({
              id: 'je-2',
              ...data.data,
              lines: data.data.lines.create,
            })
          ),
        },
      };

      const mockPrisma = (await import('@/lib/db')).default;
      mockPrisma.$transaction.mockImplementation((callback: any) => callback(mockTx));

      const result = await createPaymentChequeJournalEntry('chq-2', new Date('2024-03-15'));

      expect(result).toBeDefined();
      expect(result.documentType).toBe('CHEQUE_PAY');
    });

    it('should debit AP account for payment cheque', async () => {
      const mockTx = {
        cheque: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'chq-2',
            chequeNo: 'CHQ002',
            type: 'PAY',
            status: 'PENDING',
            amount: 30000,
            payeeName: 'ผู้ขาย ข',
            bankAccount: {
              id: 'bank-1',
              bankName: 'กรุงเทพ',
              glAccountId: 'acc-bank-123',
            },
            journalEntryId: null,
          }),
          update: vi.fn(),
        },
        chartOfAccount: {
          findFirst: vi.fn().mockResolvedValue({
            id: 'acc-ap-789',
            code: '2110',
            name: 'เจ้าหนี้การค้า',
          }),
        },
        journalEntry: {
          count: vi.fn().mockResolvedValue(0),
          create: vi.fn().mockImplementation((data: any) => {
            const lines = data.data.lines.create;
            const debitLine = lines.find((l: any) => l.debit > 0);
            expect(debitLine.accountId).toBe('acc-ap-789');
            return Promise.resolve({ id: 'je-2', ...data.data, lines });
          }),
        },
      };

      const mockPrisma = (await import('@/lib/db')).default;
      mockPrisma.$transaction.mockImplementation((callback: any) => callback(mockTx));

      await createPaymentChequeJournalEntry('chq-2', new Date('2024-03-15'));
    });

    it('should credit bank account for payment cheque', async () => {
      const mockTx = {
        cheque: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'chq-2',
            chequeNo: 'CHQ002',
            type: 'PAY',
            status: 'PENDING',
            amount: 30000,
            payeeName: 'ผู้ขาย ข',
            bankAccount: {
              id: 'bank-1',
              bankName: 'กรุงเทพ',
              glAccountId: 'acc-bank-123',
            },
            journalEntryId: null,
          }),
          update: vi.fn(),
        },
        chartOfAccount: {
          findFirst: vi.fn().mockResolvedValue({
            id: 'acc-ap-789',
            code: '2110',
            name: 'เจ้าหนี้การค้า',
          }),
        },
        journalEntry: {
          count: vi.fn().mockResolvedValue(0),
          create: vi.fn().mockImplementation((data: any) => {
            const lines = data.data.lines.create;
            const creditLine = lines.find((l: any) => l.credit > 0);
            expect(creditLine.accountId).toBe('acc-bank-123');
            return Promise.resolve({ id: 'je-2', ...data.data, lines });
          }),
        },
      };

      const mockPrisma = (await import('@/lib/db')).default;
      mockPrisma.$transaction.mockImplementation((callback: any) => callback(mockTx));

      await createPaymentChequeJournalEntry('chq-2', new Date('2024-03-15'));
    });
  });

  describe('clearCheque', () => {
    it('should route to received cheque function for RECEIVE type', async () => {
      const mockPrisma = (await import('@/lib/db')).default;
      mockPrisma.cheque.findUnique.mockResolvedValue({
        id: 'chq-1',
        type: 'RECEIVE',
        status: 'PENDING',
      });

      // Mock the transaction function
      const mockTx = {
        cheque: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'chq-1',
            type: 'RECEIVE',
            status: 'PENDING',
            amount: 50000,
            bankAccount: { glAccountId: 'acc-bank' },
            journalEntryId: null,
          }),
          update: vi.fn(),
        },
        chartOfAccount: {
          findFirst: vi.fn().mockResolvedValue({ id: 'acc-ar' }),
        },
        journalEntry: {
          count: vi.fn().mockResolvedValue(0),
          create: vi.fn().mockResolvedValue({ id: 'je-1' }),
        },
      };
      mockPrisma.$transaction.mockImplementation((callback: any) => callback(mockTx));

      const result = await clearCheque('chq-1', new Date('2024-03-15'));
      expect(result).toBeDefined();
    });

    it('should throw error if cheque already cleared', async () => {
      const mockPrisma = (await import('@/lib/db')).default;
      mockPrisma.cheque.findUnique.mockResolvedValue({
        id: 'chq-1',
        type: 'RECEIVE',
        status: 'CLEARED',
      });

      await expect(clearCheque('chq-1', new Date())).rejects.toThrow('Cheque already cleared');
    });

    it('should throw error if cheque is cancelled', async () => {
      const mockPrisma = (await import('@/lib/db')).default;
      mockPrisma.cheque.findUnique.mockResolvedValue({
        id: 'chq-1',
        type: 'PAY',
        status: 'CANCELLED',
      });

      await expect(clearCheque('chq-1', new Date())).rejects.toThrow(
        'Cannot clear cancelled cheque'
      );
    });

    it('should throw error if cheque is bounced', async () => {
      const mockPrisma = (await import('@/lib/db')).default;
      mockPrisma.cheque.findUnique.mockResolvedValue({
        id: 'chq-1',
        type: 'RECEIVE',
        status: 'BOUNCED',
      });

      await expect(clearCheque('chq-1', new Date())).rejects.toThrow('Cannot clear bounced cheque');
    });
  });

  describe('bounceCheque', () => {
    it('should create reversing journal entry', async () => {
      const mockPrisma = (await import('@/lib/db')).default;

      // Mock top-level prisma calls (bounceCheque does NOT use $transaction)
      mockPrisma.cheque.findUnique = vi.fn().mockResolvedValue({
        id: 'chq-1',
        chequeNo: 'CHQ001',
        type: 'RECEIVE',
        status: 'CLEARED',
        journalEntryId: 'je-original',
        bankAccount: {
          id: 'bank-1',
          bankName: 'ไทยพาณิชย์',
        },
      });
      mockPrisma.journalEntry.findUnique = vi.fn().mockResolvedValue({
        id: 'je-original',
        lines: [
          { accountId: 'acc-1', debit: 50000, credit: 0 },
          { accountId: 'acc-2', debit: 0, credit: 50000 },
        ],
      });
      mockPrisma.journalEntry.count = vi.fn().mockResolvedValue(10);
      mockPrisma.journalEntry.create = vi.fn().mockImplementation((data: any) =>
        Promise.resolve({
          id: 'je-reverse',
          ...data.data,
          lines: data.data.lines.create,
        })
      );
      mockPrisma.journalEntry.update = vi.fn();
      mockPrisma.cheque.update = vi.fn();

      const result = await bounceCheque('chq-1', new Date('2024-03-20'), 'เช็คเด้ง');

      expect(result).toBeDefined();
      expect(result.isReversing).toBe(true);
      expect(result.reversingId).toBe('je-original');
      expect(result.documentType).toBe('CHEQUE_BOUNCE');
    });

    it('should swap debit and credit in reversing entry', async () => {
      const mockPrisma = (await import('@/lib/db')).default;

      mockPrisma.cheque.findUnique = vi.fn().mockResolvedValue({
        id: 'chq-1',
        chequeNo: 'CHQ001',
        type: 'RECEIVE',
        status: 'CLEARED',
        journalEntryId: 'je-original',
        bankAccount: { id: 'bank-1' },
      });
      mockPrisma.journalEntry.findUnique = vi.fn().mockResolvedValue({
        id: 'je-original',
        lines: [
          { accountId: 'acc-bank', debit: 50000, credit: 0 },
          { accountId: 'acc-ar', debit: 0, credit: 50000 },
        ],
      });
      mockPrisma.journalEntry.count = vi.fn().mockResolvedValue(0);
      mockPrisma.journalEntry.create = vi.fn().mockImplementation((data: any) => {
        const lines = data.data.lines.create;
        // Original: Bank (debit 50000), AR (credit 50000)
        // Reversed: Bank (credit 50000), AR (debit 50000)
        const bankLine = lines.find((l: any) => l.accountId === 'acc-bank');
        const arLine = lines.find((l: any) => l.accountId === 'acc-ar');
        expect(bankLine.debit).toBe(0);
        expect(bankLine.credit).toBe(50000);
        expect(arLine.debit).toBe(50000);
        expect(arLine.credit).toBe(0);
        return Promise.resolve({ id: 'je-reverse', ...data.data, lines });
      });
      mockPrisma.journalEntry.update = vi.fn();
      mockPrisma.cheque.update = vi.fn();

      await bounceCheque('chq-1', new Date('2024-03-20'));
    });

    it('should throw error if cheque not found', async () => {
      const mockPrisma = (await import('@/lib/db')).default;
      mockPrisma.cheque.findUnique = vi.fn().mockResolvedValue(null);

      await expect(bounceCheque('nonexistent', new Date())).rejects.toThrow('Cheque not found');
    });

    it('should throw error if no journal entry to reverse', async () => {
      const mockPrisma = (await import('@/lib/db')).default;
      mockPrisma.cheque.findUnique = vi.fn().mockResolvedValue({
        id: 'chq-1',
        journalEntryId: null,
      });

      await expect(bounceCheque('chq-1', new Date())).rejects.toThrow(
        'No journal entry found for this cheque'
      );
    });

    it('should throw error if already bounced', async () => {
      const mockPrisma = (await import('@/lib/db')).default;
      mockPrisma.cheque.findUnique = vi.fn().mockResolvedValue({
        id: 'chq-1',
        status: 'BOUNCED',
        journalEntryId: 'je-original',
      });

      await expect(bounceCheque('chq-1', new Date())).rejects.toThrow(
        'Cheque already marked as bounced'
      );
    });

    it('should include reason in description', async () => {
      const mockPrisma = (await import('@/lib/db')).default;

      mockPrisma.cheque.findUnique = vi.fn().mockResolvedValue({
        id: 'chq-1',
        chequeNo: 'CHQ001',
        type: 'RECEIVE',
        status: 'CLEARED',
        journalEntryId: 'je-original',
        bankAccount: { id: 'bank-1' },
      });
      mockPrisma.journalEntry.findUnique = vi.fn().mockResolvedValue({
        id: 'je-original',
        lines: [
          { accountId: 'acc-1', debit: 50000, credit: 0 },
          { accountId: 'acc-2', debit: 0, credit: 50000 },
        ],
      });
      mockPrisma.journalEntry.count = vi.fn().mockResolvedValue(0);
      mockPrisma.journalEntry.create = vi.fn().mockImplementation((data: any) => {
        expect(data.data.description).toContain('เช็คเด้ง');
        expect(data.data.description).toContain('CHQ001');
        return Promise.resolve({ id: 'je-reverse', ...data.data });
      });
      mockPrisma.journalEntry.update = vi.fn();
      mockPrisma.cheque.update = vi.fn();

      await bounceCheque('chq-1', new Date('2024-03-20'), 'เช็คเด้ง');
    });
  });
});
