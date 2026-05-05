import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';
import { requireAuth } from '@/lib/api-utils';
import { AuthError } from '@/lib/api-auth';

const transactionSchema = z.object({
  type: z.enum(['REVENUE', 'EXPENSE', 'TIME_COST']),
  amount: z.number().int().min(1, 'จำนวนเงินต้องมากกว่า 0'),
  description: z.string().optional(),
  date: z.string().datetime(),
  invoiceId: z.string().optional(),
  paymentId: z.string().optional(),
  journalEntryId: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const transactions = await prisma.projectTransaction.findMany({
      where: { projectId: id },
      orderBy: { date: 'desc' },
    });
    return NextResponse.json({ success: true, data: transactions });
  } catch (error: unknown) {
    const err = error as { statusCode?: number };
    if (err?.statusCode === 401) {
      return NextResponse.json({ success: false, error: 'ไม่ได้รับอนุญาต' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const validatedData = transactionSchema.parse(body);

    const project = await prisma.project.findUnique({ where: { id, deletedAt: null } });
    if (!project) {
      return NextResponse.json({ success: false, error: 'ไม่พบโปรเจกต์' }, { status: 404 });
    }

    const transaction = await prisma.projectTransaction.create({
      data: {
        projectId: id,
        type: validatedData.type,
        amount: validatedData.amount,
        description: validatedData.description,
        date: new Date(validatedData.date),
        invoiceId: validatedData.invoiceId,
        paymentId: validatedData.paymentId,
        journalEntryId: validatedData.journalEntryId,
      },
    });

    return NextResponse.json({ success: true, data: transaction });
  } catch (error: unknown) {
    const err = error as { name?: string; statusCode?: number; message?: string };
    if (err?.statusCode === 401) {
      return NextResponse.json({ success: false, error: 'ไม่ได้รับอนุญาต' }, { status: 401 });
    }
    if (err?.name === 'ZodError') {
      return NextResponse.json({ success: false, error: 'ข้อมูลไม่ถูกต้อง', details: err?.message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
