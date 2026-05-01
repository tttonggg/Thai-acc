// Payroll Runs API (Agent 06: Payroll & HR Engineer)
// Schema-exact field names: totalBaseSalary, totalSsc, totalTax, totalNetPay
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/api-utils';
import { calculateEmployeePayroll } from '@/lib/payroll-service';

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const runs = await prisma.payrollRun.findMany({
      include: { payrolls: true },
      orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
    });
    return NextResponse.json({ success: true, data: runs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const body = await request.json();
    const { periodMonth, periodYear, paymentDate } = body;

    if (!periodMonth || !periodYear || !paymentDate) {
      return NextResponse.json({ success: false, error: 'กรุณาระบุงวดเงินเดือน' }, { status: 400 });
    }

    const existing = await prisma.payrollRun.findFirst({
      where: { periodMonth: parseInt(periodMonth), periodYear: parseInt(periodYear) },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'มีการประมวลผลเงินเดือนในงวดนี้แล้ว' },
        { status: 400 }
      );
    }

    const employees = await prisma.employee.findMany({ where: { isActive: true } });
    const count = await prisma.payrollRun.count();
    const runNo = `PAY-${periodYear}${String(periodMonth).padStart(2, '0')}-${String(count + 1).padStart(3, '0')}`;

    const payrollData = employees.map((emp) => {
      const calc = calculateEmployeePayroll({ baseSalary: emp.baseSalary });
      return {
        employeeId: emp.id,
        baseSalary: calc.baseSalary,
        additions: calc.additions,
        deductions: calc.deductions,
        grossSalary: calc.grossSalary,
        socialSecurity: calc.socialSecurity,
        withholdingTax: calc.withholdingTax,
        netPay: calc.netPay,
      };
    });

    // Map to exact PayrollRun schema fields
    const totalBaseSalary = payrollData.reduce((s, p) => s + p.baseSalary, 0);
    const totalAdditions = payrollData.reduce((s, p) => s + p.additions, 0);
    const totalDeductions = payrollData.reduce((s, p) => s + p.deductions, 0);
    const totalSsc = payrollData.reduce((s, p) => s + p.socialSecurity, 0);
    const totalTax = payrollData.reduce((s, p) => s + p.withholdingTax, 0);
    const totalNetPay = payrollData.reduce((s, p) => s + p.netPay, 0);

    const payrollRun = await prisma.payrollRun.create({
      data: {
        runNo,
        periodMonth: parseInt(periodMonth),
        periodYear: parseInt(periodYear),
        paymentDate: new Date(paymentDate),
        totalBaseSalary,
        totalAdditions,
        totalDeductions,
        totalSsc,
        totalTax,
        totalNetPay,
        status: 'DRAFT',
        payrolls: {
          create: payrollData.map((p) => ({
            employeeId: p.employeeId,
            baseSalary: p.baseSalary,
            additions: p.additions,
            deductions: p.deductions,
            grossSalary: p.grossSalary,
            socialSecurity: p.socialSecurity,
            withholdingTax: p.withholdingTax,
            netPay: p.netPay,
          })),
        },
      },
      include: { payrolls: true },
    });

    return NextResponse.json({ success: true, data: payrollRun }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
