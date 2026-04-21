import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/admin/permissions/my - Get current user's permissions
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const userRole = session.user.role

    // ADMIN gets all permissions
    if (userRole === 'ADMIN') {
      const allPerms = await db.permission.findMany()
      return NextResponse.json({
        success: true,
        data: {
          permissions: allPerms.map(p => p.code),
          role: userRole,
        }
      })
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
                    permissions: {
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
    })

    if (!userEmployee) {
      return NextResponse.json({
        success: true,
        data: {
          permissions: [],
          role: userRole,
        }
      })
    }

    const perms = new Set<string>()
    for (const er of userEmployee.employee.employeeRoles) {
      for (const rp of er.role.permissions) {
        perms.add(rp.permission.code)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        permissions: Array.from(perms),
        role: userRole,
      }
    })
  } catch (error) {
    console.error('Failed to fetch permissions:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch permissions' }, { status: 500 })
  }
}