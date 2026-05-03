import { NextRequest, NextResponse } from 'next/server';
import { requireCanManageRoles, getClientIp } from '@/lib/api-utils';
import { logAudit } from '@/lib/audit-logger';
import { db } from '@/lib/db';

// GET /api/admin/employee-roles - List all employee role assignments
export async function GET(request: NextRequest) {
  try {
    await requireCanManageRoles();

    const employeeRoles = await db.employeeRole.findMany({
      include: {
        employee: true,
        role: true,
      },
      orderBy: { employeeId: 'asc' },
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
    const user = await requireCanManageRoles();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const ipAddress = getClientIp(request.headers);
    const userAgent = request.headers.get('user-agent') || 'unknown';

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

    // Audit log
    await logAudit({
      userId: user.id,
      action: 'CREATE',
      entityType: 'EmployeeRole',
      entityId: employeeRole.id,
      beforeState: null,
      afterState: { employeeId, departmentId, roleId, isPrimary },
      ipAddress,
      userAgent,
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
    const user = await requireCanManageRoles();
    const ipAddress = getClientIp(request.headers);
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'EmployeeRole ID is required' },
        { status: 400 }
      );
    }

    // Get current state for audit
    const current = await db.employeeRole.findUnique({ where: { id } });

    await db.employeeRole.delete({
      where: { id },
    });

    // Audit log
    await logAudit({
      userId: user.id,
      action: 'DELETE',
      entityType: 'EmployeeRole',
      entityId: id,
      beforeState: current ? { employeeId: current.employeeId, departmentId: current.departmentId, roleId: current.roleId } : null,
      afterState: null,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: 'Failed to remove role' }, { status: 500 });
  }
}
