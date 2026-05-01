// B4. Budgeting Service
// บริการงบประมาณ

import { prisma } from '@/lib/db';
import type { Budget, BudgetAlert } from '@prisma/client';

/**
 * Create or update budget
 * สร้างหรืออัปเดตงบประมาณ
 */
export async function setBudget(
  year: number,
  accountId: string,
  amount: number,
  alertAt: number = 80,
  notes?: string
): Promise<Budget> {
  // Calculate current actual spending
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59);

  const actualSpending = await calculateActualSpending(accountId, startDate, endDate);

  const variance = amount - actualSpending;

  return prisma.budget.upsert({
    where: {
      year_accountId: { year, accountId },
    },
    update: {
      amount,
      actual: actualSpending,
      variance,
      alertAt,
      notes,
      updatedAt: new Date(),
    },
    create: {
      year,
      accountId,
      amount,
      actual: actualSpending,
      variance,
      alertAt,
      notes,
    },
  });
}

/**
 * Calculate actual spending for an account in a period
 * คำนวณยอดใช้จ่ายจริงสำหรับบัญชีในช่วงเวลา
 */
export async function calculateActualSpending(
  accountId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  // For expense accounts, sum debits minus credits
  // For revenue accounts, sum credits minus debits
  const account = await prisma.chartOfAccount.findUnique({
    where: { id: accountId },
  });

  if (!account) return 0;

  const lines = await prisma.journalLine.findMany({
    where: {
      accountId,
      entry: {
        date: { gte: startDate, lte: endDate },
        status: 'POSTED',
        deletedAt: null,
      },
    },
  });

  const totalDebit = lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredit = lines.reduce((sum, line) => sum + line.credit, 0);

  // For expense accounts, positive when debited
  // For revenue accounts, positive when credited
  if (account.type === 'EXPENSE') {
    return totalDebit - totalCredit;
  } else if (account.type === 'REVENUE') {
    return totalCredit - totalDebit;
  } else {
    // For assets and liabilities, consider absolute movement
    return Math.abs(totalDebit - totalCredit);
  }
}

/**
 * Update actual spending for all budgets in a year
 * อัปเดตยอดใช้จ่ายจริงสำหรับงบประมาณทั้งหมดในปี
 */
export async function updateAllBudgetActuals(year: number): Promise<void> {
  const budgets = await prisma.budget.findMany({
    where: { year },
  });

  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59);

  for (const budget of budgets) {
    const actual = await calculateActualSpending(budget.accountId, startDate, endDate);
    const variance = budget.amount - actual;

    await prisma.budget.update({
      where: { id: budget.id },
      data: { actual, variance },
    });

    // Check for alerts
    await checkBudgetAlert(budget.id);
  }
}

/**
 * Check and create budget alert if needed
 * ตรวจสอบและสร้างการแจ้งเตือนงบประมาณ
 */
export async function checkBudgetAlert(budgetId: string): Promise<void> {
  const budget = await prisma.budget.findUnique({
    where: { id: budgetId },
    include: { account: true },
  });

  if (!budget) return;

  const usagePercent = (budget.actual / budget.amount) * 100;

  // Check if we've hit the alert threshold
  if (usagePercent >= budget.alertAt && !budget.isAlerted) {
    // Create alert
    await prisma.budgetAlert.create({
      data: {
        budgetId: budget.id,
        alertType: 'APPROACHING_LIMIT',
        message: `งบประมาณ ${budget.account.name} ใช้ไปแล้ว ${usagePercent.toFixed(1)}% (แจ้งเตือนที่ ${budget.alertAt}%)`,
      },
    });

    await prisma.budget.update({
      where: { id: budgetId },
      data: { isAlerted: true },
    });
  }

  // Check if over budget
  if (budget.actual > budget.amount) {
    // Check if we already have an unacknowledged over budget alert
    const existingAlert = await prisma.budgetAlert.findFirst({
      where: {
        budgetId: budget.id,
        alertType: 'OVER_BUDGET',
        acknowledged: false,
      },
    });

    if (!existingAlert) {
      await prisma.budgetAlert.create({
        data: {
          budgetId: budget.id,
          alertType: 'OVER_BUDGET',
          message: `งบประมาณ ${budget.account.name} เกินงบประมาณแล้ว! ใช้ไป ${(budget.actual / 100).toLocaleString()} บาท จากงบ ${(budget.amount / 100).toLocaleString()} บาท`,
        },
      });
    }
  }
}

/**
 * Acknowledge budget alert
 * ยืนยันการรับทราบการแจ้งเตือน
 */
export async function acknowledgeBudgetAlert(
  alertId: string,
  userId: string
): Promise<BudgetAlert> {
  return prisma.budgetAlert.update({
    where: { id: alertId },
    data: {
      acknowledged: true,
      acknowledgedBy: userId,
      acknowledgedAt: new Date(),
    },
  });
}

/**
 * Get budget vs actual report
 * รายงานเปรียบเทียบงบประมาณกับผลการใช้จริง
 */
export interface BudgetVsActualReport {
  year: number;
  startDate: Date;
  endDate: Date;
  accounts: Array<{
    accountId: string;
    accountCode: string;
    accountName: string;
    accountType: string;
    budget: number;
    actual: number;
    variance: number;
    variancePercent: number;
    usagePercent: number;
    status: 'UNDER' | 'ON_TRACK' | 'OVER' | 'CRITICAL';
  }>;
  summary: {
    totalBudget: number;
    totalActual: number;
    totalVariance: number;
    overBudgetCount: number;
    criticalCount: number;
  };
}

export async function generateBudgetVsActualReport(
  year: number,
  accountType?: string
): Promise<BudgetVsActualReport> {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59);

  // Get all budgets for the year
  const budgets = await prisma.budget.findMany({
    where: { year },
    include: { account: true },
  });

  // Get all expense/revenue accounts
  const where: { isActive: boolean; isDetail: boolean; type?: string } = {
    isActive: true,
    isDetail: true,
  };
  if (accountType) where.type = accountType;

  const accounts = await prisma.chartOfAccount.findMany({ where });

  const report: BudgetVsActualReport = {
    year,
    startDate,
    endDate,
    accounts: [],
    summary: {
      totalBudget: 0,
      totalActual: 0,
      totalVariance: 0,
      overBudgetCount: 0,
      criticalCount: 0,
    },
  };

  for (const account of accounts) {
    const budget = budgets.find((b) => b.accountId === account.id);
    const budgetAmount = budget?.amount || 0;

    // Calculate actual
    const actual = await calculateActualSpending(account.id, startDate, endDate);
    const variance = budgetAmount - actual;
    const variancePercent = budgetAmount > 0 ? (variance / budgetAmount) * 100 : 0;
    const usagePercent = budgetAmount > 0 ? (actual / budgetAmount) * 100 : 0;

    let status: 'UNDER' | 'ON_TRACK' | 'OVER' | 'CRITICAL' = 'UNDER';
    if (usagePercent >= 100) {
      status = 'OVER';
      report.summary.overBudgetCount++;
    } else if (usagePercent >= 90) {
      status = 'CRITICAL';
      report.summary.criticalCount++;
    } else if (usagePercent >= 75) {
      status = 'ON_TRACK';
    }

    report.accounts.push({
      accountId: account.id,
      accountCode: account.code,
      accountName: account.name,
      accountType: account.type,
      budget: budgetAmount,
      actual,
      variance,
      variancePercent,
      usagePercent,
      status,
    });

    report.summary.totalBudget += budgetAmount;
    report.summary.totalActual += actual;
  }

  report.summary.totalVariance = report.summary.totalBudget - report.summary.totalActual;

  return report;
}

/**
 * Get variance analysis
 * วิเคราะห์ผลต่าง
 */
export interface VarianceAnalysis {
  favorable: Array<{
    accountId: string;
    accountName: string;
    budget: number;
    actual: number;
    savings: number;
    savingsPercent: number;
  }>;
  unfavorable: Array<{
    accountId: string;
    accountName: string;
    budget: number;
    actual: number;
    overrun: number;
    overrunPercent: number;
  }>;
  trends: Array<{
    accountId: string;
    accountName: string;
    monthData: Array<{
      month: number;
      budget: number;
      actual: number;
    }>;
  }>;
}

export async function generateVarianceAnalysis(year: number): Promise<VarianceAnalysis> {
  const budgets = await prisma.budget.findMany({
    where: { year },
    include: { account: true },
  });

  const analysis: VarianceAnalysis = {
    favorable: [],
    unfavorable: [],
    trends: [],
  };

  for (const budget of budgets) {
    const variance = budget.amount - budget.actual;
    const variancePercent = budget.amount > 0 ? (variance / budget.amount) * 100 : 0;

    if (variance > 0) {
      // Under budget (favorable for expenses)
      analysis.favorable.push({
        accountId: budget.accountId,
        accountName: budget.account.name,
        budget: budget.amount,
        actual: budget.actual,
        savings: variance,
        savingsPercent: variancePercent,
      });
    } else if (variance < 0) {
      // Over budget (unfavorable)
      analysis.unfavorable.push({
        accountId: budget.accountId,
        accountName: budget.account.name,
        budget: budget.amount,
        actual: budget.actual,
        overrun: Math.abs(variance),
        overrunPercent: Math.abs(variancePercent),
      });
    }

    // Calculate monthly trend
    const monthData = [];
    for (let month = 1; month <= 12; month++) {
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 0, 23, 59, 59);
      const actual = await calculateActualSpending(budget.accountId, monthStart, monthEnd);
      monthData.push({
        month,
        budget: Math.round(budget.amount / 12), // Assuming even distribution
        actual,
      });
    }

    analysis.trends.push({
      accountId: budget.accountId,
      accountName: budget.account.name,
      monthData,
    });
  }

  return analysis;
}

/**
 * Copy budgets from previous year
 * คัดลอกงบประมาณจากปีก่อน
 */
export async function copyBudgetsFromPreviousYear(
  sourceYear: number,
  targetYear: number,
  adjustmentPercent: number = 0
): Promise<number> {
  const sourceBudgets = await prisma.budget.findMany({
    where: { year: sourceYear },
  });

  let copiedCount = 0;
  for (const budget of sourceBudgets) {
    const adjustedAmount = Math.round(budget.amount * (1 + adjustmentPercent / 100));

    await setBudget(
      targetYear,
      budget.accountId,
      adjustedAmount,
      budget.alertAt,
      `คัดลอกจากปี ${sourceYear}${adjustmentPercent !== 0 ? ` (ปรับ ${adjustmentPercent > 0 ? '+' : ''}${adjustmentPercent}%)` : ''}`
    );
    copiedCount++;
  }

  return copiedCount;
}

/**
 * Get active budget alerts
 * ดึงการแจ้งเตือนงบประมาณที่ยังไม่ได้รับทราบ
 */
export async function getActiveAlerts(): Promise<
  Array<BudgetAlert & { budget: Budget & { account: { code: string; name: string } } }>
> {
  return prisma.budgetAlert.findMany({
    where: { acknowledged: false },
    include: {
      budget: {
        include: {
          account: {
            select: { code: true, name: true },
          },
        },
      },
    },
    orderBy: { triggeredAt: 'desc' },
  });
}

/**
 * Initialize budgets for a year
 * สร้างงบประมาณเริ่มต้นสำหรับปีใหม่
 */
export async function initializeYearBudgets(
  year: number,
  defaultBudget: number = 0
): Promise<number> {
  // Get all expense accounts
  const accounts = await prisma.chartOfAccount.findMany({
    where: {
      type: 'EXPENSE',
      isActive: true,
      isDetail: true,
    },
  });

  let createdCount = 0;
  for (const account of accounts) {
    const existing = await prisma.budget.findUnique({
      where: { year_accountId: { year, accountId: account.id } },
    });

    if (!existing) {
      await prisma.budget.create({
        data: {
          year,
          accountId: account.id,
          amount: defaultBudget,
          actual: 0,
          variance: defaultBudget,
        },
      });
      createdCount++;
    }
  }

  return createdCount;
}
