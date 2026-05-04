/**
 * GET /api/admin/audit-logs
 * Query audit logs with filtering (Admin only)
 * POST /api/admin/audit-logs/verify
 * Verify audit log integrity
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { getAuditLogs, verifyAuditIntegrity, AuditAction } from '@/lib/audit-logger';

// GET - Query audit logs
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    if (session.user.role !== 'ADMIN') {
      return Response.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);

    const filters = {
      userId: searchParams.get('userId') || undefined,
      action: (searchParams.get('action') as AuditAction) || undefined,
      entityType: searchParams.get('entityType') || undefined,
      entityId: searchParams.get('entityId') || undefined,
      startDate: searchParams.get('startDate')
        ? new Date(searchParams.get('startDate')!)
        : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    };

    const result = await getAuditLogs(filters);

    return Response.json({
      success: true,
      data: result.logs,
      meta: {
        total: result.total,
        limit: filters.limit,
        offset: filters.offset,
      },
    });
  } catch (error: unknown) {
    console.error('Audit logs query error:', error);
    return Response.json({ success: false, error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}

// POST - Verify audit integrity
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return Response.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const result = await verifyAuditIntegrity();

    return Response.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    console.error('Audit integrity check error:', error);
    return Response.json(
      { success: false, error: 'Failed to verify audit integrity' },
      { status: 500 }
    );
  }
}
