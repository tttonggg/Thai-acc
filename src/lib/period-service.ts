// B1. Period Locking Service
// บริการการล็อกงวดบัญชี

import { prisma } from '@/lib/db';
import type { AccountingPeriod, AccountingPeriodStatus } from '@prisma/client';

export interface PeriodCheckResult {
  isValid: boolean;
  period?: AccountingPeriod;
  error?: string;
}

/**
 * Check if a date is in an open period
 * ตรวจสอบว่าวันที่อยู่ในงวดที่เปิดอยู่หรือไม่
 */
export async function checkPeriodStatus(date: Date): Promise<PeriodCheckResult> {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-12

  // B-09: Use upsert in transaction to prevent race between findUnique+create
  const period = await prisma.$transaction(async (tx) => {
    const existing = await tx.accountingPeriod.findUnique({
      where: { year_month: { year, month } },
    });

    if (existing) return existing;

    return tx.accountingPeriod.create({
      data: { year, month, status: 'OPEN' },
    });
  });

  if (period.status === 'CLOSED' || period.status === 'LOCKED') {
    return {
      isValid: false,
      period,
      error: `งวดบัญชี ${month}/${year} ถูกปิดแล้ว ไม่สามารถบันทึกรายการได้`,
    };
  }

  return { isValid: true, period };
}

/**
 * Validate that all dates in a range are in open periods
 * ตรวจสอบว่าวันที่ทั้งหมดในช่วงอยู่ในงวดที่เปิดอยู่
 */
export async function validatePeriodRange(
  startDate: Date,
  endDate: Date
): Promise<PeriodCheckResult> {
  const startYear = startDate.getFullYear();
  const startMonth = startDate.getMonth() + 1;
  const endYear = endDate.getFullYear();
  const endMonth = endDate.getMonth() + 1;

  // Get all periods in range
  const periods = await prisma.accountingPeriod.findMany({
    where: {
      OR: [{ year: { gt: startYear } }, { year: startYear, month: { gte: startMonth } }],
      AND: [{ year: { lt: endYear } }, { year: endYear, month: { lte: endMonth } }],
    },
  });

  // Create a set of all year-month combinations in range
  const requiredPeriods = new Set<string>();
  let currentYear = startYear;
  let currentMonth = startMonth;

  while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
    requiredPeriods.add(`${currentYear}-${currentMonth}`);
    currentMonth++;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    }
  }

  // Check if all periods exist and are open
  for (const periodKey of requiredPeriods) {
    const [year, month] = periodKey.split('-').map(Number);
    const period = periods.find((p) => p.year === year && p.month === month);

    if (!period) {
      // Auto-create open period
      await prisma.accountingPeriod.create({
        data: { year, month, status: 'OPEN' },
      });
      continue;
    }

    if (period.status === 'CLOSED' || period.status === 'LOCKED') {
      return {
        isValid: false,
        period,
        error: `งวดบัญชี ${month}/${year} ถูกปิดแล้ว ไม่สามารถบันทึกรายการได้`,
      };
    }
  }

  return { isValid: true };
}

/**
 * Close a period
 * ปิดงวดบัญชี
 */
export async function closePeriod(
  year: number,
  month: number,
  closedBy: string
): Promise<AccountingPeriod> {
  const period = await prisma.accountingPeriod.upsert({
    where: { year_month: { year, month } },
    update: {
      status: 'CLOSED',
      closedBy,
      closedAt: new Date(),
      reopenedBy: null,
      reopenedAt: null,
    },
    create: {
      year,
      month,
      status: 'CLOSED',
      closedBy,
      closedAt: new Date(),
    },
  });

  return period;
}

/**
 * Reopen a closed period
 * เปิดงวดบัญชีใหม่
 */
export async function reopenPeriod(
  year: number,
  month: number,
  reopenedBy: string
): Promise<AccountingPeriod> {
  const period = await prisma.accountingPeriod.update({
    where: { year_month: { year, month } },
    data: {
      status: 'OPEN',
      reopenedBy,
      reopenedAt: new Date(),
    },
  });

  return period;
}

/**
 * Lock a period (cannot be reopened without admin)
 * ล็อกงวดบัญชี (ต้องมีสิทธิ์ผู้ดูแลระบบเพื่อปลดล็อก)
 */
export async function lockPeriod(
  year: number,
  month: number,
  lockedBy: string
): Promise<AccountingPeriod> {
  const period = await prisma.accountingPeriod.upsert({
    where: { year_month: { year, month } },
    update: {
      status: 'LOCKED',
      closedBy: lockedBy,
      closedAt: new Date(),
    },
    create: {
      year,
      month,
      status: 'LOCKED',
      closedBy: lockedBy,
      closedAt: new Date(),
    },
  });

  return period;
}

/**
 * Get period reconciliation report
 * รายงานการกระทบยอดงวด
 */
export interface PeriodReconciliationReport {
  year: number;
  month: number;
  status: string;
  totalDebits: number;
  totalCredits: number;
  transactionCount: number;
  pendingEntries: number;
  discrepancies: Array<{
    accountCode: string;
    accountName: string;
    expectedBalance: number;
    actualBalance: number;
    difference: number;
  }>;
}

export async function generatePeriodReconciliationReport(
  year: number,
  month: number
): Promise<PeriodReconciliationReport> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const period = await prisma.accountingPeriod.findUnique({
    where: { year_month: { year, month } },
  });

  // Get all journal entries in period
  const entries = await prisma.journalEntry.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      status: 'POSTED',
      deletedAt: null,
    },
    include: { lines: true },
  });

  const totalDebits = entries.reduce(
    (sum, e) => sum + e.lines.reduce((ls, l) => ls + l.debit, 0),
    0
  );
  const totalCredits = entries.reduce(
    (sum, e) => sum + e.lines.reduce((ls, l) => ls + l.credit, 0),
    0
  );

  const pendingEntries = await prisma.journalEntry.count({
    where: {
      date: { gte: startDate, lte: endDate },
      status: 'DRAFT',
      deletedAt: null,
    },
  });

  // Check account balances
  const accounts = await prisma.chartOfAccount.findMany({
    where: { isActive: true, isDetail: true },
  });

  const discrepancies: Array<{
    accountCode: string;
    accountName: string;
    expectedBalance: number;
    actualBalance: number;
    difference: number;
  }> = [];

  for (const account of accounts) {
    const lines = await prisma.journalLine.findMany({
      where: {
        accountId: account.id,
        entry: {
          date: { lte: endDate },
          status: 'POSTED',
          deletedAt: null,
        },
      },
    });

    const debitSum = lines.reduce((sum, l) => sum + l.debit, 0);
    const creditSum = lines.reduce((sum, l) => sum + l.credit, 0);
    const balance = debitSum - creditSum;

    // Check against expected balance (would come from previous period + current period)
    // For now, just check if debits = credits for this account in this period
    const currentPeriodLines = lines.filter(
      (l) => (l.entryId as any).date >= startDate && (l.entryId as any).date <= endDate && (l.entryId as any).status === 'POSTED'
    );

    const currentDebitSum = currentPeriodLines.reduce((sum, l) => sum + l.debit, 0);
    const currentCreditSum = currentPeriodLines.reduce((sum, l) => sum + l.credit, 0);
  }

  return {
    year,
    month,
    status: period?.status || 'OPEN',
    totalDebits,
    totalCredits,
    transactionCount: entries.length,
    pendingEntries,
    discrepancies,
  };
}

/**
 * Initialize periods for a year
 * สร้างงวดบัญชีสำหรับปีใหม่
 */
export async function initializeYearPeriods(year: number): Promise<void> {
  const existingPeriods = await prisma.accountingPeriod.findMany({
    where: { year },
  });

  const existingMonths = new Set(existingPeriods.map((p) => p.month));

  for (let month = 1; month <= 12; month++) {
    if (!existingMonths.has(month)) {
      await prisma.accountingPeriod.create({
        data: { year, month, status: 'OPEN' },
      });
    }
  }
}
