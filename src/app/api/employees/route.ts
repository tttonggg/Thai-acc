// Employees API (Agent 06: Payroll & HR Engineer)
// Schema-exact: no nickname, no phone — uses exact Employee model fields
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/api-utils';
import { AuthError } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = request.nextUrl;
    const isActive = searchParams.get('active');
    const where: any = {};
    if (isActive !== null) where.isActive = isActive !== 'false';

    const employees = await prisma.employee.findMany({
      where,
      orderBy: { employeeCode: 'asc' },
    });
    return NextResponse.json({ success: true, data: employees });
  } catch (error: any) {
    // Check for auth errors first
    if (error instanceof AuthError || error?.name === 'AuthError' || error?.statusCode === 401) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้รับอนุญาต - กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }
    console.error('Employees API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const body = await request.json();
    const {
      employeeCode,
      firstName,
      lastName,
      idCardNumber,
      position,
      department,
      hireDate,
      baseSalary,
      taxId,
      socialSecurityNo,
      bankAccountNo,
      bankName,
    } = body;

    if (!employeeCode || !firstName || !lastName || !hireDate || !baseSalary) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกข้อมูลพนักงานให้ครบถ้วน' },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.create({
      data: {
        employeeCode,
        firstName,
        lastName,
        idCardNumber,
        position,
        department,
        hireDate: new Date(hireDate),
        baseSalary: parseFloat(baseSalary),
        taxId,
        socialSecurityNo,
        bankAccountNo,
        bankName,
        isActive: true,
      },
    });
    return NextResponse.json({ success: true, data: employee }, { status: 201 });
  } catch (error: any) {
    // Check for auth errors first
    if (error instanceof AuthError || error?.name === 'AuthError' || error?.statusCode === 401) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้รับอนุญาต - กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }
    console.error('Create employee error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
