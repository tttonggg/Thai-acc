import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/api-utils';
import { db } from '@/lib/db';

// GET /api/admin/employee-roles - List all employee role assignments
export async function GET() {
  try {
    await requirePermission('admin', 'manage');

    const employeeRoles = await db.employeeRole.findMany({
      include: {
        employee: true,
        department: true,
        role: true,
      },
      orderBy: [{ departmentId: 'asc' }, { employeeId: 'asc' }],
    });

    return NextResponse.json({ success: true, data: employeeRoles });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { success: false, error: 'Failed to fetch employee roles' },
      { status: 500 }
    );
  }
}

// POST /api/admin/employee-roles - Assign a role to an employee in a department
export async function POST(request: NextRequest) {
  try {
    await requirePermission('admin', 'manage');

    const body = await request.json();
    const { employeeId, departmentId, roleId, isPrimary } = body;

    if (!employeeId || !departmentId || !roleId) {
      return NextResponse.json(
        { success: false, error: 'employeeId, departmentId, and roleId are required' },
        { status: 400 }
      );
    }

    // Check if assignment already exists
    const existing = await db.employeeRole.findFirst({
      where: { employeeId, departmentId, roleId },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Employee already has this role in this department' },
        { status: 400 }
      );
    }

    // If setting as primary, unset other primary roles for this employee
    if (isPrimary) {
      await db.employeeRole.updateMany({
        where: { employeeId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const employeeRole = await db.employeeRole.create({
      data: {
        employeeId,
        departmentId,
        roleId,
        isPrimary: isPrimary || false,
      },
      include: {
        employee: true,
        department: true,
        role: true,
      },
    });

    return NextResponse.json({ success: true, data: employeeRole }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: 'Failed to assign role' }, { status: 500 });
  }
}

// DELETE /api/admin/employee-roles - Remove a role from an employee
export async function DELETE(request: NextRequest) {
  try {
    await requirePermission('admin', 'manage');

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'EmployeeRole ID is required' },
        { status: 400 }
      );
    }

    await db.employeeRole.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: 'Failed to remove role' }, { status: 500 });
  }
}
