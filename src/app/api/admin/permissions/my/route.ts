import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/admin/permissions/my - Get current user's permissions
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = session.user.id;
    const userRole = session.user.role;

    // Check if RBAC system exists by testing Permission.count()
    // If this fails, RBAC tables don't exist
    let hasRBAC = false;
    try {
      await db.permission.count();
      hasRBAC = true;
    } catch {
      hasRBAC = false;
    }

    // ADMIN gets all permissions
    if (userRole === 'ADMIN') {
      if (!hasRBAC) {
        return NextResponse.json({
          success: true,
          data: {
            permissions: ['admin'],
            role: userRole,
          },
        });
      }
      const allPerms = await db.permission.findMany();
      return NextResponse.json({
        success: true,
        data: {
          permissions: allPerms.map((p) => p.code),
          role: userRole,
        },
      });
    }

    // Non-ADMIN users
    if (!hasRBAC) {
      return NextResponse.json({
        success: true,
        data: {
          permissions: [],
          role: userRole,
        },
      });
    }

    // RBAC is active - check for userEmployee and permissions
    let userPermissions: string[] = [];
    try {
      // First check if userEmployee table exists
      const employeeCount = await db.userEmployee.count().catch(() => 0);
      if (employeeCount === 0) {
        return NextResponse.json({
          success: true,
          data: {
            permissions: [],
            role: userRole,
          },
        });
      }

      const userEmployee = await db.userEmployee.findUnique({
        where: { userId },
        include: {
          employee: {
            include: {
              employeeRoles: {
                include: {
                  role: {
                    include: {
                      rolePermissions: {
                        include: {
                          permission: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (userEmployee) {
        const perms = new Set<string>();
        for (const er of userEmployee.employee.employeeRoles) {
          for (const rp of er.role.rolePermissions) {
            perms.add(rp.permission.code);
          }
        }
        userPermissions = Array.from(perms);
      }
    } catch {
      // RBAC tables exist but user has no special permissions
      userPermissions = [];
    }

    return NextResponse.json({
      success: true,
      data: {
        permissions: userPermissions,
        role: userRole,
      },
    });
  } catch (error: unknown) {
    console.error('Failed to fetch permissions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
}
