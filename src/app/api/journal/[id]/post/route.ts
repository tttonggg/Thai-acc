import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { checkPeriodStatus } from '@/lib/period-service';
import { requireRole } from '@/lib/api-utils';
import { handleApiError } from '@/lib/api-error-handler';

// POST - Post journal entry (change status from DRAFT to POSTED)
// CRITICAL SECURITY: Requires ADMIN or ACCOUNTANT role
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // SECURITY: Require ADMIN or ACCOUNTANT role
    const session = await requireRole(['ADMIN', 'ACCOUNTANT']);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้รับอนุญาต - ต้องเป็นผู้ดูแลระบบหรือนักบัญชี' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const existing = await prisma.journalEntry.findUnique({
      where: { id },
      include: {
        lines: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'ไม่พบรายการนี้' }, { status: 404 });
    }

    if (existing.status === 'POSTED') {
      return NextResponse.json({ success: false, error: 'รายการนี้ลงบัญชีแล้ว' }, { status: 400 });
    }

    // B1. Period Locking - Check if period is open
    const periodCheck = await checkPeriodStatus(existing.date);
    if (!periodCheck.isValid) {
      return NextResponse.json({ success: false, error: periodCheck.error }, { status: 400 });
    }

    // Validate balance
    const totalDebit = existing.lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = existing.lines.reduce((sum, line) => sum + line.credit, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return NextResponse.json(
        { success: false, error: 'ยอดเดบิตและเครดิตไม่สมดุล' },
        { status: 400 }
      );
    }

    // Update status to POSTED
    const entry = await prisma.journalEntry.update({
      where: { id },
      data: {
        status: 'POSTED',
        postedAt: new Date(),
        postedById: session.id,
      },
      include: {
        lines: {
          include: {
            account: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: entry,
      message: 'ลงบัญชีสำเร็จ',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || 'เกิดข้อผิดพลาดในการลงบัญชี' },
      { status: 500 }
    );
  }
}
