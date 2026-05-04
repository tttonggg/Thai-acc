import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireRole } from '@/lib/api-utils';
import { AuthError } from '@/lib/api-auth';
import { z } from 'zod';
import { handleApiError } from '@/lib/api-error-handler';

// Query schema for filtering
const querySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('50'),
  userId: z.string().optional(),
  action: z.string().optional(),
  module: z.string().optional(),
  status: z.enum(['success', 'failed', 'all']).optional().default('all'),
  search: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

// GET - List activity logs (ADMIN only)
export async function GET(request: NextRequest) {
  try {
    // Require ADMIN role
    await requireRole(['ADMIN']);

    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));

    const page = parseInt(query.page);
    const limit = Math.min(parseInt(query.limit), 100); // Max 100 per page
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.action) {
      where.action = query.action;
    }

    if (query.module) {
      where.module = query.module;
    }

    if (query.status !== 'all') {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { action: { contains: query.search, mode: 'insensitive' } },
        { module: { contains: query.search, mode: 'insensitive' } },
        { errorMessage: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) {
        where.createdAt.gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        where.createdAt.lte = new Date(query.dateTo);
      }
    }

    // Get logs with user info
    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
            },
          },
        },
      }),
      prisma.activityLog.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    const err = error as { name?: string; statusCode?: number; message?: string; errors?: any };
    // Check for auth errors first
    if (error instanceof AuthError || err?.name === 'AuthError' || err?.statusCode === 401) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้รับอนุญาต - กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }
    if (err?.statusCode === 403) {
      return NextResponse.json({ success: false, error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 });
    }
    if (err?.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'ข้อมูลไม่ถูกต้อง', details: err.errors },
        { status: 400 }
      );
    }
    console.error('Error fetching activity logs:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}

// POST - Create activity log entry (internal use)
export async function POST(request: NextRequest) {
  try {
    // This endpoint is for internal use - called by other services
    // We still require authentication but not necessarily ADMIN role
    const user = await requireRole(['ADMIN']);

    const body = await request.json();

    const log = await prisma.activityLog.create({
      data: {
        userId: body.userId,
        action: body.action,
        module: body.module,
        recordId: body.recordId,
        details: body.details,
        ipAddress: body.ipAddress,
        status: body.status || 'success',
        errorMessage: body.errorMessage,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: log,
    });
  } catch (error: unknown) {
    const err = error as { name?: string; statusCode?: number; message?: string };
    // Check for auth errors first
    if (error instanceof AuthError || err?.name === 'AuthError' || err?.statusCode === 401) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้รับอนุญาต - กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }
    if (err?.statusCode === 403) {
      return NextResponse.json({ success: false, error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 });
    }
    console.error('Error creating activity log:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการบันทึกกิจกรรม' },
      { status: 500 }
    );
  }
}
