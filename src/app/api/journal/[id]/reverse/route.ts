import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/api-utils';
import { logActivity } from '@/lib/activity-logger';
import { getClientIp } from '@/lib/api-utils';
import { handleApiError } from '@/lib/api-error-handler';

/**
 * POST /api/journal/[id]/reverse
 * Reverse a journal entry - create reversal entry and mark original as reversed
 * Only accessible by ACCOUNTANT and ADMIN roles
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole(['ACCOUNTANT', 'ADMIN']);
    const { id } = await params;
    const ipAddress = getClientIp(request.headers);
    const body = await request.json();
    const { reason } = body;

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุเหตุผลการยกเลิกบันทึกบัญชี' },
        { status: 400 }
      );
    }

    // Fetch original journal entry
    const originalEntry = await prisma.journalEntry.findUnique({
      where: { id },
      include: {
        lines: {
          include: {
            account: true,
          },
        },
      },
    });

    if (!originalEntry) {
      return NextResponse.json({ success: false, error: 'ไม่พบบันทึกบัญชี' }, { status: 404 });
    }

    if (originalEntry.status !== 'POSTED') {
      return NextResponse.json(
        { success: false, error: 'สามารถยกเลิกเฉพาะบันทึกที่ลงบัญชีแล้ว' },
        { status: 400 }
      );
    }

    if (originalEntry.isReversing) {
      return NextResponse.json(
        { success: false, error: 'บันทึกนี้เป็นบันทึกยกเลิกอยู่แล้ว' },
        { status: 400 }
      );
    }

    // Check if already reversed
    if (originalEntry.reversingId) {
      return NextResponse.json(
        { success: false, error: 'บันทึกนี้ถูกยกเลิกไปแล้ว' },
        { status: 400 }
      );
    }

    // Generate reversal entry number
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `RV-${year}${month}`;

    // Get next sequence number for reversals
    const lastReversal = await prisma.journalEntry.findFirst({
      where: {
        entryNo: { startsWith: prefix },
      },
      orderBy: { entryNo: 'desc' },
    });

    const nextNum = lastReversal ? parseInt(lastReversal.entryNo.split('-')[2] || '0') + 1 : 1;

    const reversalNo = `${prefix}-${String(nextNum).padStart(4, '0')}`;

    // Create reversal journal entry using transaction
    const reversalEntry = await prisma.$transaction(
      async (tx) => {
        // Create reversal journal entry with swapped debits/credits
        const reversal = await tx.journalEntry.create({
          data: {
            entryNo: reversalNo,
            date: new Date(),
            description: `ยกเลิก ${originalEntry.entryNo}: ${originalEntry.description}`,
            reference: originalEntry.entryNo,
            documentType: 'REVERSAL',
            documentId: originalEntry.documentId,
            totalDebit: originalEntry.totalCredit,
            totalCredit: originalEntry.totalDebit,
            status: 'POSTED',
            isReversing: true,
            reversingId: originalEntry.id,
            createdById: user.id,
            notes: `เหตุผล: ${reason}`,
            lines: {
              create: originalEntry.lines.map((line, index) => {
                // Swap debit and credit for reversal
                return {
                  lineNo: index + 1,
                  accountId: line.accountId,
                  description: `ยกเลิก: ${line.description}`,
                  debit: line.credit, // Swap
                  credit: line.debit, // Swap
                };
              }),
            },
          },
        });

        // Mark original as reversed
        await tx.journalEntry.update({
          where: { id },
          data: {
            isAdjustment: true,
            notes: `ถูกยกเลิกโดย ${reversalNo}\nเหตุผล: ${reason}\nหมายเหตุ: ${originalEntry.notes || '-'}`,
          },
        });

        return reversal;
      },
      { maxWait: 5000, timeout: 10000 }
    );

    // Log activity
    await logActivity({
      userId: user.id,
      action: 'JOURNAL_REVERSE',
      module: 'journal',
      recordId: id,
      details: {
        originalEntryNo: originalEntry.entryNo,
        reversalEntryNo: reversalEntry.entryNo,
        totalAmount: originalEntry.totalDebit,
        reason,
      },
      ipAddress,
    });

    return NextResponse.json({
      success: true,
      data: reversalEntry,
      message: 'ยกเลิกบันทึกบัญชีเรียบร้อยแล้ว',
    });
  } catch (error: unknown) {
    console.error('Error reversing journal entry:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'เกิดข้อผิดพลาดในการยกเลิกบันทึกบัญชี' },
      { status: 500 }
    );
  }
}
