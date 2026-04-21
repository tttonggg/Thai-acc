import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/api-utils'
import { db } from '@/lib/db'

// GET /api/admin/permissions - List all permissions
export async function GET() {
  try {
    await requirePermission('admin', 'manage')

    const permissions = await db.permission.findMany({
      orderBy: [
        { module: 'asc' },
        { action: 'asc' },
      ],
    })

    // Group by module
    const grouped = permissions.reduce((acc, perm) => {
      if (!acc[perm.module]) {
        acc[perm.module] = []
      }
      acc[perm.module].push(perm)
      return acc
    }, {} as Record<string, typeof permissions>)

    return NextResponse.json({ success: true, data: { permissions, grouped } })
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 })
    }
    return NextResponse.json({ success: false, error: 'Failed to fetch permissions' }, { status: 500 })
  }
}