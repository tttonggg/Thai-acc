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
        role: true,
      },
      orderBy: { employeeId: 'asc' },
    });

    return NextResponse.json({ success: true, data: employeeRoles });
  } catch (error: unknown) {
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
    const { employeeId, roleId } = body;

    if (!employeeId || !roleId) {
      return NextResponse.json(
        { success: false, error: 'employeeId and roleId are required' },
        { status: 400 }
      );
    }

    // Check if assignment already exists
    const existing = await db.employeeRole.findFirst({
      where: { employeeId, roleId },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Employee already has this role' },
        { status: 400 }
      );
    }

    const employeeRole = await db.employeeRole.create({
      data: {
        employeeId,
        roleId,
      },
      include: {
        employee: true,
        role: true,
      },
    });

    return NextResponse.json({ success: true, data: employeeRole }, { status: 201 });
  } catch (error: unknown) {
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
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: 'Failed to remove role' }, { status: 500 });
  }
}
