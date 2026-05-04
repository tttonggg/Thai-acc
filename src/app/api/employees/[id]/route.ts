// Individual Employee API Operations (Agent 06: Payroll & HR Engineer)
// GET, PATCH, DELETE for individual employees
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/api-utils';
import { handleApiError } from '@/lib/api-error-handler';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;

    const employee = await prisma.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      return NextResponse.json({ success: false, error: 'ไม่พบพนักงาน' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: employee });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูลพนักงาน' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;

    const employee = await prisma.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      return NextResponse.json({ success: false, error: 'ไม่พบพนักงาน' }, { status: 404 });
    }

    const body = await request.json();
    const {
      employeeCode,
      firstName,
      lastName,
      position,
      department,
      hireDate,
      baseSalary,
      taxId,
      socialSecurityNo,
      bankAccountNo,
      bankName,
      isActive,
    } = body;

    if (!employeeCode || !firstName || !lastName || !hireDate || !baseSalary) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกข้อมูลพนักงานให้ครบถ้วน' },
        { status: 400 }
      );
    }

    const updated = await prisma.employee.update({
      where: { id },
      data: {
        employeeCode,
        firstName,
        lastName,
        position,
        department,
        hireDate: new Date(hireDate),
        baseSalary: parseFloat(baseSalary),
        taxId,
        socialSecurityNo,
        bankAccountNo,
        bankName,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: 'ไม่สามารถอัปเดตข้อมูลพนักงานได้' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    const employee = await prisma.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      return NextResponse.json({ success: false, error: 'ไม่พบพนักงาน' }, { status: 404 });
    }

    // Check if employee has payroll runs
    const payrollCount = await prisma.payroll.count({
      where: { employeeId: id },
    });

    if (payrollCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `ไม่สามารถลบพนักงานนี้ได้ เนื่องจากมีประวัติเงินเดือน ${payrollCount} รอบ`,
        },
        { status: 400 }
      );
    }

    await prisma.employee.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'ลบพนักงานสำเร็จ' });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: 'ไม่สามารถลบพนักงานได้' }, { status: 500 });
  }
}
