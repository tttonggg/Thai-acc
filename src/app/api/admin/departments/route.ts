import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/api-utils';
import { db } from '@/lib/db';

// GET /api/admin/departments - List all departments
export async function GET() {
  try {
    await requirePermission('admin', 'manage');

    const departments = await db.department.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, data: departments });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { success: false, error: 'Failed to fetch departments' },
      { status: 500 }
    );
  }
}
