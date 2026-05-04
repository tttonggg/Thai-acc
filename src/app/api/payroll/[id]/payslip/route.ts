// Payslip PDF Generation API (Agent 06: Payroll & HR Engineer)
// Generates professional PDF payslips for individual payroll records
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-utils';
import prisma from '@/lib/db';
import { generatePayslipPDF } from '@/lib/pdf-generator';
import { handleApiError } from '@/lib/api-error-handler';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;

    // Fetch payroll record with employee and payroll run data
    const payroll = await prisma.payroll.findUnique({
      where: { id },
      include: {
        employee: true,
        payrollRun: true,
      },
    });

    if (!payroll) {
      return NextResponse.json({ success: false, error: 'ไม่พบข้อมูลเงินเดือน' }, { status: 404 });
    }

    // Fetch company information for the payslip
    const company = await prisma.company.findFirst();

    // Calculate gross salary
    const grossSalary = payroll.baseSalary + payroll.additions - payroll.deductions;

    // Prepare data for PDF generation
    const payslipData = {
      employee: {
        firstName: payroll.employee.firstName,
        lastName: payroll.employee.lastName,
        employeeCode: payroll.employee.employeeCode,
        position: payroll.employee.position || undefined,
        department: payroll.employee.department || undefined,
        idCardNumber: payroll.employee.idCardNumber || undefined,
        taxId: payroll.employee.taxId || undefined,
        bankAccountNo: payroll.employee.bankAccountNo || undefined,
        bankName: payroll.employee.bankName || undefined,
      },
      payroll: {
        baseSalary: payroll.baseSalary,
        additions: payroll.additions,
        deductions: payroll.deductions,
        grossSalary: grossSalary,
        socialSecurity: payroll.socialSecurity,
        withholdingTax: payroll.withholdingTax,
        netPay: payroll.netPay,
      },
      payrollRun: {
        runNo: payroll.payrollRun.runNo,
        periodMonth: payroll.payrollRun.periodMonth,
        periodYear: payroll.payrollRun.periodYear,
        paymentDate: payroll.payrollRun.paymentDate,
      },
      company: company
        ? {
            name: company.name,
            address: company.address || undefined,
            taxId: company.taxId || undefined,
            phone: company.phone || undefined,
          }
        : undefined,
    };

    // Generate PDF
    const pdfBuffer = await generatePayslipPDF(payslipData);

    // Create filename
    const employeeName = `${payroll.employee.firstName}-${payroll.employee.lastName}`;
    const month = String(payroll.payrollRun.periodMonth).padStart(2, '0');
    const filename = `payslip-${employeeName}-${month}-${payroll.payrollRun.periodYear}.pdf`;

    // Return PDF with appropriate headers
    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.byteLength.toString(),
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error.message || 'ไม่สามารถสร้างสลิปเงินเดือนได้' },
      { status: 500 }
    );
  }
}
