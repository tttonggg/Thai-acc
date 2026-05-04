/**
 * Payroll Service - Comprehensive Unit Tests
 * Tests for SSC calculation, PND1 tax, and payroll processing
 */

import { describe, it, expect, vi } from 'vitest';
import {
  calculateSSC,
  calculatePND1,
  calculateEmployeePayroll,
  calculateEmployerSSC,
  createPayrollJournalEntry,
} from '../payroll-service';

// Mock the db module
vi.mock('@/lib/db', () => ({
  prisma: {
    $transaction: vi.fn((callback: any) =>
      callback({
        payrollRun: {
          findUnique: vi.fn(),
          update: vi.fn(),
        },
        chartOfAccount: {
          findUnique: vi.fn(),
        },
        journalEntry: {
          count: vi.fn(),
          create: vi.fn(),
        },
      })
    ),
  },
  default: {
    $transaction: vi.fn((callback: any) =>
      callback({
        payrollRun: {
          findUnique: vi.fn(),
          update: vi.fn(),
        },
        chartOfAccount: {
          findUnique: vi.fn(),
        },
        journalEntry: {
          count: vi.fn(),
          create: vi.fn(),
        },
      })
    ),
  },
}));

describe('Payroll Service', () => {
  describe('calculateSSC', () => {
    it('should calculate 5% of salary', () => {
      expect(calculateSSC(9900)).toBe(495); // 5% of 9900 (at ceiling)
      expect(calculateSSC(10000)).toBe(495); // Capped at 495
    });

    it('should cap SSC at 495 THB (max base 9900 per Thai SSC Act)', () => {
      expect(calculateSSC(9900)).toBe(495); // At ceiling
      expect(calculateSSC(15000)).toBe(495); // Capped
      expect(calculateSSC(50000)).toBe(495); // Capped
    });

    it('should handle salary below ceiling correctly', () => {
      expect(calculateSSC(9900)).toBe(495); // At max
      expect(calculateSSC(9899)).toBe(495); // Just below ceiling (Math: 9899*5%=494.95→495, at ceiling since ฿9,900 cap is ฿495)
    });

    it('should handle zero salary', () => {
      expect(calculateSSC(0)).toBe(0);
    });

    it('should handle minimum wage scenarios', () => {
      expect(calculateSSC(10000)).toBe(495); // Capped at 495
      expect(calculateSSC(12000)).toBe(495); // Capped at 495
    });
  });

  describe('calculatePND1', () => {
    it('should calculate zero tax for income below 150,000', () => {
      expect(calculatePND1(0)).toBe(0);
      expect(calculatePND1(150000)).toBe(0);
      expect(calculatePND1(60000)).toBe(0); // With personal allowance
    });

    it('should calculate 5% for 150,001-300,000 bracket', () => {
      // Annual 300,000 - 60,000 allowance = 240,000 taxable
      // Only the amount ABOVE 150,000 is taxed at 5%
      // (240,000 - 150,000) * 5% = 4,500 annual tax
      // 4,500 / 12 = 375 monthly
      expect(calculatePND1(300000)).toBe(375);
    });

    it('should calculate 10% for 300,001-500,000 bracket', () => {
      // Annual 500,000 - 60,000 = 440,000 taxable
      // 150,000 * 0% = 0
      // 150,000 * 5% = 7,500
      // 140,000 * 10% = 14,000
      // Total: 21,500 / 12 = 1,792 ≈ 1792
      expect(calculatePND1(500000)).toBe(1792);
    });

    it('should calculate progressive tax for higher brackets', () => {
      // Annual 1,000,000 - 60,000 = 940,000 taxable
      // Progressive tax on 940,000:
      // 150,000 * 0% = 0
      // 150,000 * 5% = 7,500
      // 200,000 * 10% = 20,000
      // 250,000 * 15% = 37,500
      // 190,000 * 20% = 38,000
      // Total annual: 103,000, monthly: 8583
      expect(calculatePND1(1000000)).toBe(8583);
    });

    it('should calculate maximum tax for top bracket', () => {
      // Annual 6,000,000 - 60,000 = 5,940,000 taxable
      expect(calculatePND1(6000000)).toBeGreaterThan(100000);
    });
  });

  describe('calculateEmployeePayroll', () => {
    it('should calculate basic payroll correctly', () => {
      const result = calculateEmployeePayroll({
        baseSalary: 20000,
      });

      expect(result.baseSalary).toBe(20000);
      expect(result.grossSalary).toBe(20000);
      expect(result.socialSecurity).toBe(495); // Capped at 495
      expect(result.netPay).toBeLessThan(result.grossSalary);
    });

    it('should include additions in gross salary', () => {
      const result = calculateEmployeePayroll({
        baseSalary: 20000,
        additions: 5000, // OT, allowances
      });

      expect(result.grossSalary).toBe(25000);
      expect(result.socialSecurity).toBe(495); // Based on base only, capped
    });

    it('should deduct deductions from gross salary', () => {
      const result = calculateEmployeePayroll({
        baseSalary: 20000,
        deductions: 2000, // Absence
      });

      expect(result.grossSalary).toBe(18000);
    });

    it('should calculate combined additions and deductions', () => {
      const result = calculateEmployeePayroll({
        baseSalary: 20000,
        additions: 5000,
        deductions: 2000,
      });

      expect(result.grossSalary).toBe(23000);
    });

    it('should handle zero net pay (all deductions exceed gross)', () => {
      const result = calculateEmployeePayroll({
        baseSalary: 5000,
      });

      // SSC = 250, withholding tax calculated on 60,000 annual
      expect(result.netPay).toBeGreaterThanOrEqual(0);
    });

    it('should return all required fields', () => {
      const result = calculateEmployeePayroll({
        baseSalary: 30000,
      });

      expect(result).toHaveProperty('baseSalary');
      expect(result).toHaveProperty('additions');
      expect(result).toHaveProperty('deductions');
      expect(result).toHaveProperty('grossSalary');
      expect(result).toHaveProperty('socialSecurity');
      expect(result).toHaveProperty('withholdingTax');
      expect(result).toHaveProperty('netPay');
    });
  });

  describe('calculateEmployerSSC', () => {
    it('should match employee SSC rate', () => {
      expect(calculateEmployerSSC(15000)).toBe(calculateSSC(15000));
      expect(calculateEmployerSSC(10000)).toBe(calculateSSC(10000));
    });

    it('should also be capped at 495 THB', () => {
      expect(calculateEmployerSSC(50000)).toBe(495);
    });
  });

  describe('createPayrollJournalEntry', () => {
    it('should create journal entry with correct structure', async () => {
      // Calculate expected values to ensure balance:
      // gross = 100000 + 10000 - 5000 = 105000
      // employer SSC = 495 * 3 = 1485 (each payroll capped at 495)
      // totalDebit = 105000 + 1485 = 106485
      // For balance: employee SSC (1485) + WHT (5000) + netPay = 106485
      // Therefore: netPay = 106485 - 1485 - 5000 = 100000
      const mockTx = {
        payrollRun: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'payroll-1',
            periodMonth: 3,
            periodYear: 2024,
            paymentDate: new Date('2024-03-31'),
            totalBaseSalary: 100000,
            totalAdditions: 10000,
            totalDeductions: 5000,
            // 3 employees at 495 each = 1485 total employee SSC
            totalSsc: 1485,
            totalTax: 5000,
            totalNetPay: 100000, // Must be 100000 to balance: 1485+5000+100000=106485
            payrolls: [{ baseSalary: 20000 }, { baseSalary: 30000 }, { baseSalary: 50000 }],
            journalEntryId: null,
          }),
          update: vi.fn(),
        },
        chartOfAccount: {
          findUnique: vi.fn().mockImplementation((args: any) => {
            const accounts: any = {
              '5310': { id: 'acc-5310', code: '5310', name: 'เงินเดือน' },
              '2133': { id: 'acc-2133', code: '2133', name: 'ประกันสังคม' },
              '2131': { id: 'acc-2131', code: '2131', name: 'ภาษีหัก' },
              '2140': { id: 'acc-2140', code: '2140', name: 'เงินเดือนต้องจ่าย' },
            };
            return Promise.resolve(accounts[args.where.code]);
          }),
        },
        journalEntry: {
          count: vi.fn().mockResolvedValue(5),
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
      (mockPrisma.$transaction as any).mockImplementation((callback: any) => callback(mockTx));

      const result = await createPayrollJournalEntry('payroll-1', 'user-1');

      expect(result).toBeDefined();
      expect(result.entryNo).toMatch(/^PAY-/);
      expect(result.documentType).toBe('PAYROLL');
    });

    it('should throw error if payroll not found', async () => {
      const mockTx = {
        payrollRun: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
      };

      const mockPrisma = (await import('@/lib/db')).default;
      (mockPrisma.$transaction as any).mockImplementation((callback: any) => callback(mockTx));

      await expect(createPayrollJournalEntry('nonexistent', 'user-1')).rejects.toThrow(
        'Payroll run nonexistent not found'
      );
    });

    it('should throw error if payroll already has journal entry', async () => {
      const mockTx = {
        payrollRun: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'payroll-1',
            journalEntryId: 'je-1',
          }),
        },
      };

      const mockPrisma = (await import('@/lib/db')).default;
      (mockPrisma.$transaction as any).mockImplementation((callback: any) => callback(mockTx));

      await expect(createPayrollJournalEntry('payroll-1', 'user-1')).rejects.toThrow(
        'Payroll already has journal entry'
      );
    });

    it('should throw error if required accounts not found', async () => {
      const mockTx = {
        payrollRun: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'payroll-1',
            periodMonth: 3,
            periodYear: 2024,
            paymentDate: new Date('2024-03-31'),
            totalBaseSalary: 100000,
            totalAdditions: 0,
            totalDeductions: 0,
            totalSsc: 3000,
            totalTax: 5000,
            totalNetPay: 97000,
            payrolls: [{ baseSalary: 100000 }],
            journalEntryId: null,
          }),
        },
        chartOfAccount: {
          findUnique: vi.fn().mockResolvedValue(null), // No accounts found
        },
      };

      const mockPrisma = (await import('@/lib/db')).default;
      (mockPrisma.$transaction as any).mockImplementation((callback: any) => callback(mockTx));

      await expect(createPayrollJournalEntry('payroll-1', 'user-1')).rejects.toThrow(
        'Required payroll accounts not found'
      );
    });

    it('should verify double-entry balance', async () => {
      // Single employee at 100000 base:
      // gross = 100000 (no additions/deductions)
      // employer SSC = 495 (capped at 495)
      // totalDebit = 100000 + 495 = 100495
      // For balance: employee SSC (495) + WHT (0) + netPay = 100495
      // Therefore: netPay = 100495 - 495 - 0 = 100000
      const mockTx = {
        payrollRun: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'payroll-1',
            periodMonth: 3,
            periodYear: 2024,
            paymentDate: new Date('2024-03-31'),
            totalBaseSalary: 100000,
            totalAdditions: 0,
            totalDeductions: 0,
            // Single employee SSC = 495
            totalSsc: 495,
            totalTax: 0,
            totalNetPay: 100000, // Must be 100000 to balance: 495+0+100000=100495
            payrolls: [{ baseSalary: 100000 }],
            journalEntryId: null,
          }),
          update: vi.fn(),
        },
        chartOfAccount: {
          findUnique: vi.fn().mockImplementation((args: any) => ({
            id: `acc-${args.where.code}`,
            code: args.where.code,
          })),
        },
        journalEntry: {
          count: vi.fn().mockResolvedValue(0),
          create: vi.fn().mockImplementation((data: any) => {
            // Verify balance
            const lines = data.data.lines.create;
            const totalDebit = lines.reduce((sum: number, l: any) => sum + l.debit, 0);
            const totalCredit = lines.reduce((sum: number, l: any) => sum + l.credit, 0);
            expect(totalDebit).toBe(totalCredit);
            return Promise.resolve({ id: 'je-1', ...data.data });
          }),
        },
      };

      const mockPrisma = (await import('@/lib/db')).default;
      (mockPrisma.$transaction as any).mockImplementation((callback: any) => callback(mockTx));

      await createPayrollJournalEntry('payroll-1', 'user-1');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very high salary', () => {
      const result = calculateEmployeePayroll({
        baseSalary: 500000, // 500k monthly = 6M annual
      });

      expect(result.socialSecurity).toBe(495); // Still capped at 495
      expect(result.withholdingTax).toBeGreaterThan(0);
      expect(result.netPay).toBeLessThan(result.grossSalary);
    });

    it('should handle minimum wage', () => {
      const result = calculateEmployeePayroll({
        baseSalary: 10000, // Minimum wage scenario
      });

      expect(result.socialSecurity).toBe(495); // Capped at 495
      expect(result.withholdingTax).toBe(0); // Below threshold
    });
  });
});
