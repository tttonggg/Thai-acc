/**
 * POST /api/banking/match-decision
 * User approves or rejects a candidate match
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-utils';
import prisma from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const { entryId, decision, docId, docType, score, reasons } = await request.json();

    if (!entryId || !decision) {
      return NextResponse.json({ success: false, error: 'ข้อมูลไม่ครบ' }, { status: 400 });
    }

    if (decision === 'approve') {
      if (!docId || !docType) {
        return NextResponse.json({ success: false, error: 'ต้องระบุเอกสารที่จะจับคู่' }, { status: 400 });
      }

      await prisma.$transaction(async (tx) => {
        await tx.bankStatementEntry.update({
          where: { id: entryId },
          data: {
            matched: true,
            matchedEntryId: docId,
            matchedEntryType: docType,
            matchConfidence: score ?? 0,
            matchReasons: JSON.stringify(reasons ?? []),
          },
        });
      });

      return NextResponse.json({ success: true, message: 'จับคู่เรียบร้อยแล้ว' });
    }

    if (decision === 'reject') {
      await prisma.bankStatementEntry.update({
        where: { id: entryId },
        data: {
          matchReasons: JSON.stringify(['ผู้ใช้ปฏิเสธการจับคู่']),
        },
      });
      return NextResponse.json({ success: true, message: 'ปฏิเสธการจับคู่แล้ว' });
    }

    return NextResponse.json({ success: false, error: 'decision ต้องเป็น approve หรือ reject' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
