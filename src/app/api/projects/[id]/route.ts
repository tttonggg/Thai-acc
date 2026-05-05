import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';
import { requireAuth } from '@/lib/api-utils';
import { AuthError } from '@/lib/api-auth';

const projectUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  customerId: z.string().optional().nullable(),
  budgetRevenue: z.number().int().min(0).optional().nullable(),
  budgetCost: z.number().int().min(0).optional().nullable(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const project = await prisma.project.findUnique({
      where: { id, deletedAt: null },
      include: {
        customer: { select: { id: true, code: true, name: true } },
        transactions: { orderBy: { date: 'desc' } },
      },
    });
    if (!project) {
      return NextResponse.json({ success: false, error: 'ไม่พบโปรเจกต์' }, { status: 404 });
    }
    const revenue = project.transactions.filter(t => t.type === 'REVENUE').reduce((s, t) => s + t.amount, 0);
    const expense = project.transactions.filter(t => t.type === 'EXPENSE' || t.type === 'TIME_COST').reduce((s, t) => s + t.amount, 0);
    return NextResponse.json({ success: true, data: { ...project, summary: { totalRevenue: revenue, totalExpense: expense, profit: revenue - expense } } });
  } catch (error: unknown) {
    const err = error as { name?: string; statusCode?: number; message?: string };
    if (error instanceof AuthError || err?.statusCode === 401) {
      return NextResponse.json({ success: false, error: 'ไม่ได้รับอนุญาต' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const validatedData = projectUpdateSchema.parse(body);
    const existing = await prisma.project.findUnique({ where: { id, deletedAt: null } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'ไม่พบโปรเจกต์' }, { status: 404 });
    }
    const project = await prisma.project.update({
      where: { id },
      data: {
        ...validatedData,
        startDate: validatedData.startDate !== undefined ? (validatedData.startDate ? new Date(validatedData.startDate) : null) : undefined,
        endDate: validatedData.endDate !== undefined ? (validatedData.endDate ? new Date(validatedData.endDate) : null) : undefined,
      },
    });
    return NextResponse.json({ success: true, data: project });
  } catch (error: unknown) {
    const err = error as { name?: string; statusCode?: number; message?: string };
    if (error instanceof AuthError || err?.statusCode === 401) {
      return NextResponse.json({ success: false, error: 'ไม่ได้รับอนุญาต' }, { status: 401 });
    }
    if (err?.name === 'ZodError') {
      return NextResponse.json({ success: false, error: 'ข้อมูลไม่ถูกต้อง', details: err?.message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const existing = await prisma.project.findUnique({ where: { id, deletedAt: null } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'ไม่พบโปรเจกต์' }, { status: 404 });
    }
    await prisma.project.update({ where: { id }, data: { deletedAt: new Date() } });
    return NextResponse.json({ success: true, message: 'ลบโปรเจกต์เรียบร้อย' });
  } catch (error: unknown) {
    const err = error as { statusCode?: number };
    if (err?.statusCode === 401) {
      return NextResponse.json({ success: false, error: 'ไม่ได้รับอนุญาต' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
