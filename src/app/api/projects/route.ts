import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';
import { requireAuth } from '@/lib/api-utils';
import { AuthError } from '@/lib/api-auth';

// Validation schema
const projectSchema = z.object({
  name: z.string().min(1, 'ชื่อโปรเจกต์ต้องไม่ว่าง'),
  code: z.string().min(1, 'รหัสโปรเจกต์ต้องไม่ว่าง'),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']).default('ACTIVE'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  customerId: z.string().optional(),
  budgetRevenue: z.number().int().min(0).optional(),
  budgetCost: z.number().int().min(0).optional(),
});

// GET - List projects
export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '20'));
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { code: { contains: search } },
        { name: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          customer: {
            select: { id: true, code: true, name: true },
          },
          _count: {
            select: { transactions: true },
          },
        },
        orderBy: { code: 'asc' },
        skip,
        take: limit,
      }),
      prisma.project.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    const err = error as { name?: string; statusCode?: number; message?: string };
    if (error instanceof AuthError || err?.name === 'AuthError' || err?.statusCode === 401) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้รับอนุญาต - กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }
    console.error('Projects API error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}

// POST - Create project
export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const validatedData = projectSchema.parse(body);

    // Check if code already exists
    const existing = await prisma.project.findUnique({
      where: { code: validatedData.code },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'รหัสโปรเจกต์นี้มีอยู่แล้วในระบบ' },
        { status: 400 }
      );
    }

    const project = await prisma.project.create({
      data: {
        ...validatedData,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
      },
    });

    return NextResponse.json({ success: true, data: project });
  } catch (error: unknown) {
    const err = error as { name?: string; statusCode?: number; message?: string };
    if (error instanceof AuthError || err?.name === 'AuthError' || err?.statusCode === 401) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้รับอนุญาต - กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }
    if (err?.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'ข้อมูลไม่ถูกต้อง', details: err?.message },
        { status: 400 }
      );
    }
    console.error('Create project error:', error);
    return NextResponse.json(
      { success: false, error: err?.message ?? 'เกิดข้อผิดพลาดในการสร้างโปรเจกต์' },
      { status: 500 }
    );
  }
}
