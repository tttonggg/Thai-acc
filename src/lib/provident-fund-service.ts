// ============================================
// กองทุนสำรองเลี้ยงชีพ / Provident Fund Service
// ============================================

import prisma from './db';

export interface CreateProvidentFundInput {
  name: string;
  employeeRate: number;
  employerRate: number;
  maxMonthly?: number;
}

export interface AddContributionInput {
  providentFundId: string;
  employeeId: string;
  payrollRunId: string;
  employeePortion: number;
  employerPortion: number;
}

/**
 * Create a new provident fund
 */
export async function createProvidentFund(data: CreateProvidentFundInput) {
  return await prisma.providentFund.create({
    data: {
      name: data.name,
      employeeRate: data.employeeRate,
      employerRate: data.employerRate,
      maxMonthly: data.maxMonthly,
      isActive: true,
    },
  });
}

/**
 * List all provident funds
 */
export async function listProvidentFunds() {
  return await prisma.providentFund.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { contributions: true } },
    },
  });
}

/**
 * Calculate provident fund contribution from salary
 * @param salary - base salary in Satang
 * @param employeeRate - employee contribution rate (e.g., 5 for 5%)
 * @param employerRate - employer contribution rate (e.g., 5 for 5%)
 * @param maxMonthly - optional cap in Satang
 */
export function calculateContribution(
  salary: number,
  employeeRate: number,
  employerRate: number,
  maxMonthly?: number | null
): { employeePortion: number; employerPortion: number } {
  let employeePortion = Math.round(salary * (employeeRate / 100));
  let employerPortion = Math.round(salary * (employerRate / 100));

  // Apply monthly cap if specified
  if (maxMonthly) {
    employeePortion = Math.min(employeePortion, maxMonthly);
    employerPortion = Math.min(employerPortion, maxMonthly);
  }

  return { employeePortion, employerPortion };
}

/**
 * Add a provident fund contribution from payroll
 */
export async function addContribution(data: AddContributionInput) {
  return await prisma.providentFundContribution.create({
    data: {
      providentFundId: data.providentFundId,
      employeeId: data.employeeId,
      payrollRunId: data.payrollRunId,
      employeePortion: data.employeePortion,
      employerPortion: data.employerPortion,
    },
  });
}

/**
 * Get all contributions for an employee
 */
export async function getEmployeeContributions(employeeId: string) {
  return await prisma.providentFundContribution.findMany({
    where: { employeeId },
    include: {
      providentFund: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get contributions by payroll run
 */
export async function getContributionsByPayrollRun(payrollRunId: string) {
  return await prisma.providentFundContribution.findMany({
    where: { payrollRunId },
    include: {
      providentFund: true,
    },
  });
}
