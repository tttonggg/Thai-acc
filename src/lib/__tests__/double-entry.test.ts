import { describe, it, expect } from 'vitest';

describe('Double-Entry Bookkeeping', () => {
  type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  type DebitCredit = 'DEBIT' | 'CREDIT';

  interface JournalEntry {
    accountId: string;
    accountType: AccountType;
    debitCredit: DebitCredit;
    amount: number;
  }

  describe('Debit/Credit Rules', () => {
    const getNormalBalance = (accountType: AccountType): DebitCredit => {
      return ['ASSET', 'EXPENSE'].includes(accountType) ? 'DEBIT' : 'CREDIT';
    };

    it('should have DEBIT as normal balance for ASSET accounts', () => {
      expect(getNormalBalance('ASSET')).toBe('DEBIT');
    });

    it('should have DEBIT as normal balance for EXPENSE accounts', () => {
      expect(getNormalBalance('EXPENSE')).toBe('DEBIT');
    });

    it('should have CREDIT as normal balance for LIABILITY accounts', () => {
      expect(getNormalBalance('LIABILITY')).toBe('CREDIT');
    });

    it('should have CREDIT as normal balance for EQUITY accounts', () => {
      expect(getNormalBalance('EQUITY')).toBe('CREDIT');
    });

    it('should have CREDIT as normal balance for REVENUE accounts', () => {
      expect(getNormalBalance('REVENUE')).toBe('CREDIT');
    });
  });

  describe('Journal Entry Validation', () => {
    const validateJournalEntry = (entries: JournalEntry[]): { valid: boolean; error?: string } => {
      // Must have at least 2 entries
      if (entries.length < 2) {
        return { valid: false, error: 'Journal entry must have at least 2 lines' };
      }

      // Total debits must equal total credits
      const totalDebits = entries
        .filter((e) => e.debitCredit === 'DEBIT')
        .reduce((sum, e) => sum + e.amount, 0);

      const totalCredits = entries
        .filter((e) => e.debitCredit === 'CREDIT')
        .reduce((sum, e) => sum + e.amount, 0);

      if (totalDebits !== totalCredits) {
        return {
          valid: false,
          error: `Debits (${totalDebits}) must equal credits (${totalCredits})`,
        };
      }

      // Must have at least one debit and one credit
      const hasDebit = entries.some((e) => e.debitCredit === 'DEBIT');
      const hasCredit = entries.some((e) => e.debitCredit === 'CREDIT');

      if (!hasDebit || !hasCredit) {
        return { valid: false, error: 'Must have both debits and credits' };
      }

      return { valid: true };
    };

    it('should validate correct journal entry for cash sale', () => {
      const entries: JournalEntry[] = [
        {
          accountId: '1001',
          accountType: 'ASSET',
          debitCredit: 'DEBIT',
          amount: 107000, // Cash (including VAT)
        },
        {
          accountId: '4001',
          accountType: 'REVENUE',
          debitCredit: 'CREDIT',
          amount: 100000, // Sales revenue
        },
        {
          accountId: '2001',
          accountType: 'LIABILITY',
          debitCredit: 'CREDIT',
          amount: 7000, // VAT payable
        },
      ];

      const result = validateJournalEntry(entries);
      expect(result.valid).toBe(true);
    });

    it('should validate correct journal entry for expense payment', () => {
      const entries: JournalEntry[] = [
        {
          accountId: '5001',
          accountType: 'EXPENSE',
          debitCredit: 'DEBIT',
          amount: 10000, // Office expense
        },
        {
          accountId: '1001',
          accountType: 'ASSET',
          debitCredit: 'CREDIT',
          amount: 10000, // Cash
        },
      ];

      const result = validateJournalEntry(entries);
      expect(result.valid).toBe(true);
    });

    it('should reject journal entry with unequal debits and credits', () => {
      const entries: JournalEntry[] = [
        {
          accountId: '1001',
          accountType: 'ASSET',
          debitCredit: 'DEBIT',
          amount: 100000,
        },
        {
          accountId: '4001',
          accountType: 'REVENUE',
          debitCredit: 'CREDIT',
          amount: 90000, // Should be 100000
        },
      ];

      const result = validateJournalEntry(entries);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Debits');
    });

    it('should reject journal entry with only debits', () => {
      const entries: JournalEntry[] = [
        {
          accountId: '1001',
          accountType: 'ASSET',
          debitCredit: 'DEBIT',
          amount: 100000,
        },
      ];

      const result = validateJournalEntry(entries);
      expect(result.valid).toBe(false);
    });

    it('should validate complex journal entry with multiple lines', () => {
      const entries: JournalEntry[] = [
        {
          accountId: '1001', // Cash
          accountType: 'ASSET',
          debitCredit: 'DEBIT',
          amount: 50000,
        },
        {
          accountId: '1201', // Accounts Receivable
          accountType: 'ASSET',
          debitCredit: 'DEBIT',
          amount: 57000,
        },
        {
          accountId: '4001', // Sales
          accountType: 'REVENUE',
          debitCredit: 'CREDIT',
          amount: 100000,
        },
        {
          accountId: '2001', // VAT Payable
          accountType: 'LIABILITY',
          debitCredit: 'CREDIT',
          amount: 7000,
        },
      ];

      const result = validateJournalEntry(entries);
      expect(result.valid).toBe(true);
    });
  });

  describe('Accounting Equation', () => {
    it('should maintain Assets = Liabilities + Equity', () => {
      const assets = 1000000;
      const liabilities = 300000;
      const equity = 700000;

      expect(assets).toEqual(liabilities + equity);
    });

    it('should calculate equity from revenue and expenses', () => {
      const equity = 500000;
      const revenue = 200000;
      const expenses = 80000;
      const newEquity = equity + revenue - expenses;

      expect(newEquity).toBe(620000);
    });

    it('should handle net loss', () => {
      const equity = 500000;
      const revenue = 100000;
      const expenses = 150000;
      const newEquity = equity + revenue - expenses;

      expect(newEquity).toBe(450000);
    });
  });
});
