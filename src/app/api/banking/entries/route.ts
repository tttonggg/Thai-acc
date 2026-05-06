// Bank Statement Entries API
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-utils';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const bankAccountId = searchParams.get('bankAccountId');

    if (!bankAccountId) {
      return NextResponse.json({ success: false, error: 'กรุณาระบุบัญชีธนาคาร' }, { status: 400 });
    }

    const allEntries = await prisma.bankStatementEntry.findMany({
      where: { bankAccountId },
      orderBy: { valueDate: 'asc' },
    });

    const matched = allEntries
      .filter((e) => e.matched)
      .map((e) => ({
        entryId: e.id,
        description: e.description,
        amount: e.amount,
        type: e.type as 'CREDIT' | 'DEBIT',
        valueDate: e.valueDate,
        reference: e.reference,
        matchedEntryId: e.matchedEntryId,
        matchedEntryType: e.matchedEntryType as 'JOURNAL_ENTRY' | 'PAYMENT' | 'RECEIPT' | null,
        matchConfidence: e.matchConfidence ?? 100,
        matchReason: 'จับคู่แล้ว',
      }));

    const unmatched = allEntries
      .filter((e) => !e.matched)
      .map((e) => ({
        id: e.id,
        description: e.description,
        amount: e.amount,
        type: e.type as 'CREDIT' | 'DEBIT',
        valueDate: e.valueDate,
        reference: e.reference,
      }));

    return NextResponse.json({ success: true, data: { matched, unmatched } });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ success: false, error: err?.message ?? String(error) }, { status: 500 });
  }
}
