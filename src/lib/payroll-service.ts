// ============================================
// 👥 Payroll Service (Agent 06: Payroll & HR Engineer)
// Thai SSC (ประกันสังคม) & PND1 Tax Calculator
// ============================================
import { calculateContribution } from './provident-fund-service';

/**
 * Calculates Social Security Contribution (ประกันสังคม)
 * Rate: 5% of salary, capped at ฿495/month (per Thai Social Security Act, ceiling = ฿9,900)
 * All monetary values in Satang (integers). Rate stored as basis points (500 = 5.00%).
 */
export function calculateSSC(baseSalary: number): number {
  // 5% = 500 basis points (out of 10000)
  const sscRateBps = 500;
  const sscCeiling = 9900_00; // ฿9,900 in Satang (9900 Baht × 100)
  const maxSSC = Math.round(sscCeiling * sscRateBps / 10000); // ฿495 in Satang
  // Multiply before divide to avoid floating-point errors
  return Math.min(Math.round(baseSalary * sscRateBps / 10000), maxSSC);
}

/**
 * Calculates PND1 (ภ.ง.ด.1) Withholding Tax on monthly income
 * Using annual progressive rates, converted to monthly
 * Thai Revenue Department 2024 rates
 * All monetary values in Satang (integers). Rates stored as basis points.
 */
export function calculatePND1(annualIncome: number): number {
  // Personal allowance: ฿60,000 in Satang
  const personalAllowance = 60_000_00; // 60,000 Baht × 100
  const taxableIncome = Math.max(0, annualIncome - personalAllowance);

  let tax = 0;
  // Progressive rates 2024 (Thailand) - stored as basis points (e.g., 500 = 5%)
  const brackets = [
    { limit: 150_000_00, rate: 0 },      // 0 - 150,000 = 0%
    { limit: 300_000_00, rate: 500 },     // 150,001 - 300,000 = 5%
    { limit: 500_000_00, rate: 1000 },    // 300,001 - 500,000 = 10%
    { limit: 750_000_00, rate: 1500 },    // 500,001 - 750,000 = 15%
    { limit: 1_000_000_00, rate: 2000 },  // 750,001 - 1,000,000 = 20%
    { limit: 2_000_000_00, rate: 2500 },  // 1,000,001 - 2,000,000 = 25%
    { limit: 5_000_000_00, rate: 3000 },  // 2,000,001 - 5,000,000 = 30%
    { limit: Infinity, rate: 3500 },     // > 5,000,000 = 35%
  ];

  let previousLimit = 0;
  for (const bracket of brackets) {
    if (taxableIncome <= previousLimit) break;
    const taxableInBracket = Math.min(taxableIncome, bracket.limit) - previousLimit;
    // Multiply before divide - use basis points math (divide by 10000)
    tax += Math.round(taxableInBracket * bracket.rate / 10000);
    previousLimit = bracket.limit;
  }

  // Return monthly PND1 (divide by 12, round result)
  return Math.round(tax / 12);
}

/**
 * Calculates full payroll for a single employee in a payroll run.
 * Returns breakdown of all components.
 * All monetary values in Satang (integers).
 */
export function calculateEmployeePayroll(params: {
  baseSalary: number;
  additions?: number; // OT, bonus, allowances (in Satang)
  deductions?: number; // absence deductions (in Satang)
  isYearEnd?: boolean; // if true, use December bonus income
}): {
  baseSalary: number;
  additions: number;
  deductions: number;
  grossSalary: number;
  socialSecurity: number; // employee portion (deducted from gross)
  withholdingTax: number; // PND1
  netPay: number;
} {
  const { baseSalary, additions = 0, deductions = 0 } = params;
  const grossSalary = baseSalary + additions - deductions;

  // SSC on base salary only (per Thai SSC regulations) - all in Satang
  const socialSecurity = calculateSSC(baseSalary);

  // PND1 on annual gross (simplified: monthly gross × 12) - all in Satang
  const annualGross = grossSalary * 12;
  const withholdingTax = calculatePND1(annualGross);

  const netPay = grossSalary - socialSecurity - withholdingTax;

  return {
    baseSalary,
    additions,
    deductions,
    grossSalary,
    socialSecurity,
    withholdingTax,
    netPay: Math.max(0, netPay),
  };
}

/**
 * Employer SSC contribution (also 5%, capped at ฿750)
 * This is an additional expense to the company
 * All monetary values in Satang (integers).
 */
export function calculateEmployerSSC(baseSalary: number): number {
  return calculateSSC(baseSalary);
}

/**
 * Creates GL journal entry for payroll when approved/posted
 * Journal entry breakdown:
 * - Debit: Salary Expense (5310) - Total gross salary + employer SSC
 * - Credit: SSC Payable (2133) - Employee SSC deducted
 * - Credit: WHT Payable (2131) - Income tax withheld (PND1)
 * - Credit: Wages Payable (2140) - Net salary payable
 */
export async function createPayrollJournalEntry(payrollRunId: string, userId?: string) {
  const prisma = (await import('@/lib/db')).default;

  return await prisma.$transaction(async (tx) => {
    const payrollRun = await tx.payrollRun.findUnique({
      where: { id: payrollRunId },
      include: { payrolls: true },
    });

    if (!payrollRun) {
      throw new Error(`Payroll run ${payrollRunId} not found`);
    }

    if (payrollRun.journalEntryId) {
      throw new Error('Payroll already has journal entry');
    }

    // Get required accounts
    const salaryExpenseAccount = await tx.chartOfAccount.findUnique({
      where: { code: '5310' }, // เงินเดือนและค่าจ้าง
    });
    const sscPayableAccount = await tx.chartOfAccount.findUnique({
      where: { code: '2133' }, // ประกันสังคมต้องจ่าย
    });
    const whtPayableAccount = await tx.chartOfAccount.findUnique({
      where: { code: '2131' }, // ภาษีเงินได้หัก ณ ที่จ่าย
    });
    const wagesPayableAccount = await tx.chartOfAccount.findUnique({
      where: { code: '2140' }, // เงินเดือนต้องจ่าย
    });

    if (!salaryExpenseAccount || !sscPayableAccount || !whtPayableAccount || !wagesPayableAccount) {
      throw new Error('Required payroll accounts not found in chart of accounts');
    }

    // Calculate totals
    const totalGrossSalary =
      payrollRun.totalBaseSalary + payrollRun.totalAdditions - payrollRun.totalDeductions;
    const totalEmployeeSSC = payrollRun.totalSsc;
    const totalEmployerSSC = payrollRun.payrolls.reduce((sum, p) => {
      const empSSC = calculateEmployerSSC(p.baseSalary);
      return sum + empSSC;
    }, 0);
    const totalWHT = payrollRun.totalTax;
    const totalNetPay = payrollRun.totalNetPay;

    // Calculate debit amount (gross salary + employer SSC)
    const totalDebit = totalGrossSalary + totalEmployerSSC;

    // Verify double-entry balance
    const totalCredit = totalEmployeeSSC + totalWHT + totalNetPay;
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(
        `Payroll journal entry not balanced: Debit=${totalDebit}, Credit=${totalCredit}`
      );
    }

    // Generate journal entry number
    const count = await tx.journalEntry.count();
    const entryNo = `PAY-${payrollRun.periodYear}${String(payrollRun.periodMonth).padStart(2, '0')}-${String(count + 1).padStart(4, '0')}`;

    // Create journal entry
    let lineNo = 1;
    const journalEntry = await tx.journalEntry.create({
      data: {
        entryNo,
        // @ts-ignore
        entryDate: payrollRun.paymentDate,
        description: `เงินเดือนเดือน ${payrollRun.periodMonth}/${payrollRun.periodYear}`,
        documentType: 'PAYROLL',
        documentId: payrollRunId,
        totalDebit,
        totalCredit,
        status: 'POSTED',
        createdById: userId,
        lines: {
          create: [
            {
              lineNo: lineNo++,
              accountId: salaryExpenseAccount.id,
              description: `เงินเดือนและค่าจ้าง ${payrollRun.periodMonth}/${payrollRun.periodYear}`,
              debit: totalGrossSalary,
              credit: 0,
            },
            {
              lineNo: lineNo++,
              accountId: salaryExpenseAccount.id,
              description: `ประกันสังคมส่วนนายจ้าง ${payrollRun.periodMonth}/${payrollRun.periodYear}`,
              debit: totalEmployerSSC,
              credit: 0,
            },
            {
              lineNo: lineNo++,
              accountId: sscPayableAccount.id,
              description: `ประกันสังคมส่วนลูกจ้าง ${payrollRun.periodMonth}/${payrollRun.periodYear}`,
              debit: 0,
              credit: totalEmployeeSSC,
            },
            {
              lineNo: lineNo++,
              accountId: whtPayableAccount.id,
              description: `ภาษีเงินได้หัก ณ ที่จ่าย (ภงด.1) ${payrollRun.periodMonth}/${payrollRun.periodYear}`,
              debit: 0,
              credit: totalWHT,
            },
            {
              lineNo: lineNo++,
              accountId: wagesPayableAccount.id,
              description: `เงินเดือนต้องจ่าย ${payrollRun.periodMonth}/${payrollRun.periodYear}`,
              debit: 0,
              credit: totalNetPay,
            },
          ],
        },
      },
    });

    // Update payroll run with journal entry ID
    await tx.payrollRun.update({
      where: { id: payrollRunId },
      data: { journalEntryId: journalEntry.id },
    });

    return journalEntry;
  });
}

/**
 * Add provident fund contributions to a payroll run
 * Called automatically when processing payroll with a provident fund
 */
export async function addProvidentFundContributions(payrollRunId: string, providentFundId: string) {
  const prisma = (await import('@/lib/db')).default;

  return await prisma.$transaction(async (tx) => {
    const payrollRun = await tx.payrollRun.findUnique({
      where: { id: payrollRunId },
      include: { payrolls: true },
    });

    if (!payrollRun) {
      throw new Error(`Payroll run ${payrollRunId} not found`);
    }

    const fund = await tx.providentFund.findUnique({
      where: { id: providentFundId },
    });

    if (!fund) {
      throw new Error(`Provident fund ${providentFundId} not found`);
    }

    // Create contributions for each employee
    const contributions = await Promise.all(
      payrollRun.payrolls.map(async (payroll) => {
        const { employeePortion, employerPortion } = calculateContribution(
          payroll.baseSalary,
          fund.employeeRate,
          fund.employerRate,
          fund.maxMonthly
        );

        return await tx.providentFundContribution.create({
          data: {
            providentFundId,
            employeeId: payroll.employeeId,
            payrollRunId,
            employeePortion,
            employerPortion,
          },
        });
      })
    );

    return contributions;
  });
}
