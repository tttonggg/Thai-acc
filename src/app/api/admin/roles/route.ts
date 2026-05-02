import { NextRequest, NextResponse } from 'next/server';
import { requireCanManageRoles } from '@/lib/api-utils';
import { logAudit } from '@/lib/audit-logger';
import { db } from '@/lib/db';
import { getClientIp } from '@/lib/api-utils';

// GET /api/admin/roles - List all roles with permissions
export async function GET(request: NextRequest) {
  try {
    await requireCanManageRoles();

    const roles = await db.role.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            employeeRoles: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, data: roles });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: 'Failed to fetch roles' }, { status: 500 });
  }
}

// POST /api/admin/roles - Create a new custom role
export async function POST(request: NextRequest) {
  try {
    const user = await requireCanManageRoles();
    const ipAddress = getClientIp(request.headers);
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const body = await request.json();
    const { name, description, permissionIds } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: 'Role name is required' }, { status: 400 });
    }

    // Check if role name already exists
    const existing = await db.role.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Role name already exists' },
        { status: 400 }
      );
    }

    // Create role with permissions
    const role = await db.role.create({
      data: {
        name,
        description,
        rolePermissions: permissionIds?.length
          ? {
              create: permissionIds.map((permId: string) => ({
                permissionId: permId,
              })),
            }
          : undefined,
      },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    // Audit log
    await logAudit({
      userId: user.id,
      action: 'CREATE',
      entityType: 'Role',
      entityId: role.id,
      beforeState: null,
      afterState: { name, description, permissionIds },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: role }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: 'Failed to create role' }, { status: 500 });
  }
}
