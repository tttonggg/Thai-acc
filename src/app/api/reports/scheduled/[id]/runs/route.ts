// Scheduled Reports API - Run History
// /api/reports/scheduled/[id]/runs - Get run history for a scheduled report
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/api-utils';
import { handleApiError } from '@/lib/api-error-handler';

// GET /api/reports/scheduled/[id]/runs - Get run history
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();

    const { id } = await params;
    const { searchParams } = request.nextUrl;

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status'); // success, failed

    const where: any = { scheduledReportId: id };
    if (status) where.status = status;

    const [runs, total] = await Promise.all([
      prisma.scheduledReportRun.findMany({
        where,
        orderBy: { runAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.scheduledReportRun.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: runs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching run history:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch run history' },
      { status: 500 }
    );
  }
}
