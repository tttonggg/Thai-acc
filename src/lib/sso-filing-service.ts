// ============================================
// SSO Filing Service (Agent 06: Payroll & HR Engineer)
// Thai Social Security (ประกันสังคม) Filing & 50 ทวิ Bank File Export
// ============================================

import prisma from '@/lib/db';
import { satangToBaht } from '@/lib/currency';

/**
 * SSC Rate: 5% of salary, capped at ฿750/month per Thai Social Security Act
 * Both employee and employer contribute 5% capped at ฿750
 */
const SSC_RATE = 0.05;
const MAX_SSC = 750; // Baht per month (cap)

// ============================================
// Types
// ============================================

export interface SSOCalculation {
  baseSalary: number; // Satang
  employeePortion: number; // Satang (deducted from employee)
  employerPortion: number; // Satang (company expense)
  totalPortion: number; // Satang (employee + employer)
  employeePortionBaht: number;
  employerPortionBaht: number;
  totalPortionBaht: number;
  cappedAtMaximum: boolean;
}

export interface EmployeeSSOData {
  employeeId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  socialSecurityNo: string | null;
  baseSalary: number; // Satang
  employeePortion: number; // Satang
  employerPortion: number; // Satang
}

export interface SSOFilingData {
  year: number;
  month: number;
  periodLabel: string;
  totalEmployees: number;
  totalEmployeePortion: number; // Satang
  totalEmployerPortion: number; // Satang
  totalSSC: number; // Satang
  employees: EmployeeSSOData[];
  generatedAt: Date;
}

// ============================================
// Core SSC Calculations
// ============================================

/**
 * Calculate monthly SSC with 750 Baht cap
 * All values in Satang for internal use, Baht for display
 */
export function calculateMonthlySSC(baseSalarySatang: number): SSOCalculation {
  // baseSalary is stored in Satang, convert to Baht for calculation
  const baseSalaryBaht = satangToBaht(baseSalarySatang);

  // Calculate uncapped SSC in Baht
  const uncappedBaht = baseSalaryBaht * SSC_RATE;
  const cappedBaht = Math.min(uncappedBaht, MAX_SSC);
  const cappedAtMaximum = uncappedBaht > MAX_SSC;

  // Convert back to Satang for storage
  const employeePortion = Math.round(cappedBaht * 100);
  const employerPortion = employeePortion; // Same rate for employer

  return {
    baseSalary: baseSalarySatang,
    employeePortion,
    employerPortion,
    totalPortion: employeePortion + employerPortion,
    employeePortionBaht: cappedBaht,
    employerPortionBaht: cappedBaht,
    totalPortionBaht: cappedBaht * 2,
    cappedAtMaximum,
  };
}

// ============================================
// SSO Filing Data Generation
// ============================================

/**
 * Generate SSO filing data for a specific month/year
 */
export async function generateSSOFilingData(year: number, month: number): Promise<SSOFilingData> {
  // Find payroll run for the period
  const payrollRun = await prisma.payrollRun.findFirst({
    where: {
      periodYear: year,
      periodMonth: month,
    },
    include: {
      payrolls: {
        include: {
          employee: true,
        },
      },
    },
  });

  if (!payrollRun) {
    throw new Error(`ไม่พบข้อมูลการประมวลผลเงินเดือนสำหรับ ${month}/${year}`);
  }

  // Calculate SSC for each employee
  const employees: EmployeeSSOData[] = payrollRun.payrolls.map((payroll) => {
    const calc = calculateMonthlySSC(payroll.baseSalary);
    return {
      employeeId: payroll.employeeId,
      employeeCode: payroll.employee.employeeCode,
      firstName: payroll.employee.firstName,
      lastName: payroll.employee.lastName,
      fullName: `${payroll.employee.firstName} ${payroll.employee.lastName}`,
      socialSecurityNo: payroll.employee.socialSecurityNo,
      baseSalary: payroll.baseSalary,
      employeePortion: calc.employeePortion,
      employerPortion: calc.employerPortion,
    };
  });

  const totalEmployeePortion = employees.reduce((sum, e) => sum + e.employeePortion, 0);
  const totalEmployerPortion = employees.reduce((sum, e) => sum + e.employerPortion, 0);

  return {
    year,
    month,
    periodLabel: `${month.toString().padStart(2, '0')}/${year}`,
    totalEmployees: employees.length,
    totalEmployeePortion,
    totalEmployerPortion,
    totalSSC: totalEmployeePortion + totalEmployerPortion,
    employees,
    generatedAt: new Date(),
  };
}

// ============================================
// 50 ทวิ Bank File Export
// ============================================

/**
 * Generate 50 ทวิ format file for bank batch disbursement
 * Format: ACCOUNT_NO\tAMOUNT\tNAME (tab-separated)
 *
 * Note: 50 ทวิ is used for employee SSC contributions that are
 * remitted to the Social Security Office via bank transfer
 */
export function export50TongFile(filingData: SSOFilingData): string {
  const lines: string[] = [];

  // Header
  lines.push('ACCOUNT_NO\tAMOUNT\tNAME');

  // Employee records - each employee has their SSC deducted from their bank account
  // The total employee portion is remitted to SSO
  for (const employee of filingData.employees) {
    const accountNo = employee.socialSecurityNo || '0000000000';
    const amount = satangToBaht(employee.employeePortion).toFixed(2);
    const name = employee.fullName;
    lines.push(`${accountNo}\t${amount}\t${name}`);
  }

  return lines.join('\n');
}

/**
 * Generate 50 ทวิ file content for a specific month/year
 * Returns both the content and filename
 */
export async function generate50TongFile(
  year: number,
  month: number
): Promise<{
  content: string;
  filename: string;
}> {
  const filingData = await generateSSOFilingData(year, month);
  const content = export50TongFile(filingData);
  const filename = `SSO_${year}${month.toString().padStart(2, '0')}_50Tong.txt`;

  return { content, filename };
}

// ============================================
// Summary Statistics
// ============================================

/**
 * Get SSO summary for a month (for display purposes)
 */
export function getSSOSummary(filingData: SSOFilingData): {
  totalEmployees: number;
  totalContribution: string; // Baht formatted
  employeePortion: string; // Baht formatted
  employerPortion: string; // Baht formatted
  averagePerEmployee: string; // Baht formatted
} {
  const total = filingData.totalSSC / 100;
  const employee = filingData.totalEmployeePortion / 100;
  const employer = filingData.totalEmployerPortion / 100;
  const avg =
    filingData.totalEmployees > 0 ? filingData.totalSSC / filingData.totalEmployees / 100 : 0;

  return {
    totalEmployees: filingData.totalEmployees,
    totalContribution: `฿${total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`,
    employeePortion: `฿${employee.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`,
    employerPortion: `฿${employer.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`,
    averagePerEmployee: `฿${avg.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`,
  };
}
