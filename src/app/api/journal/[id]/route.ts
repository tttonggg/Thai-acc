import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';
import { requireAuth, requireRole } from '@/lib/api-utils';
import { handleApiError } from '@/lib/api-error-handler';

// Validation schema
const journalLineSchema = z.object({
  accountId: z.string().min(1, 'ต้องเลือกบัญชี'),
  description: z.string().optional(),
  debit: z.number().min(0).default(0),
  credit: z.number().min(0).default(0),
});

const journalEntrySchema = z
  .object({
    date: z.string().transform((val) => new Date(val)),
    description: z.string().optional(),
    reference: z.string().optional(),
    documentType: z.string().optional(),
    documentId: z.string().optional(),
    notes: z.string().optional(),
    lines: z.array(journalLineSchema).min(2, 'ต้องมีอย่างน้อย 2 รายการ'),
  })
  .refine(
    (data) => {
      const totalDebit = data.lines.reduce((sum, line) => sum + line.debit, 0);
      const totalCredit = data.lines.reduce((sum, line) => sum + line.credit, 0);
      return Math.abs(totalDebit - totalCredit) < 0.01;
    },
    { message: 'ยอดเดบิตและเครดิตต้องเท่ากัน' }
  );

// GET - Get single journal entry
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(['ACCOUNTANT', 'ADMIN']);
    const { id } = await params;

    const entry = await prisma.journalEntry.findUnique({
      where: { id },
      include: {
        lines: {
          include: {
            account: true,
          },
          orderBy: { lineNo: 'asc' },
        },
      },
    });

    if (!entry) {
      return NextResponse.json({ success: false, error: 'ไม่พบรายการนี้' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: entry });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}

// PUT - Update journal entry
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(['ACCOUNTANT', 'ADMIN']);
    const { id } = await params;
    const body = await request.json();
    const validatedData = journalEntrySchema.parse(body);

    // Check if exists and is still draft
    const existing = await prisma.journalEntry.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'ไม่พบรายการนี้' }, { status: 404 });
    }

    if (existing.status === 'POSTED') {
      return NextResponse.json(
        { success: false, error: 'ไม่สามารถแก้ไขรายการที่ลงบัญชีแล้วได้' },
        { status: 400 }
      );
    }

    const totalDebit = validatedData.lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = validatedData.lines.reduce((sum, line) => sum + line.credit, 0);

    // Update entry and replace lines
    const entry = await prisma.journalEntry.update({
      where: { id },
      data: {
        date: validatedData.date,
        description: validatedData.description,
        reference: validatedData.reference,
        documentType: validatedData.documentType,
        documentId: validatedData.documentId,
        notes: validatedData.notes,
        totalDebit,
        totalCredit,
        lines: {
          deleteMany: {},
          create: validatedData.lines.map((line, index) => ({
            lineNo: index + 1,
            accountId: line.accountId,
            description: line.description,
            debit: line.debit,
            credit: line.credit,
          })),
        },
      },
      include: {
        lines: {
          include: {
            account: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: entry });
  } catch (error) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'ข้อมูลไม่ถูกต้อง', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || 'เกิดข้อผิดพลาดในการอัปเดต' },
      { status: 500 }
    );
  }
}

// DELETE - Delete journal entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(['ACCOUNTANT', 'ADMIN']);
    const { id } = await params;

    const existing = await prisma.journalEntry.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'ไม่พบรายการนี้' }, { status: 404 });
    }

    if (existing.status === 'POSTED') {
      return NextResponse.json(
        { success: false, error: 'ไม่สามารถลบรายการที่ลงบัญชีแล้วได้' },
        { status: 400 }
      );
    }

    await prisma.journalEntry.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'ลบรายการสำเร็จ' });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || 'เกิดข้อผิดพลาดในการลบ' },
      { status: 500 }
    );
  }
}
