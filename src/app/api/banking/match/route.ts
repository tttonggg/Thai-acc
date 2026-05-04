// Bank Statement Matching API
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-utils';
import { matchBankEntries } from '@/lib/bank-match-service';
import prisma from '@/lib/db';
import { handleApiError } from '@/lib/api-error-handler';

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const { bankAccountId } = body;

    if (!bankAccountId) {
      return NextResponse.json({ success: false, error: 'กรุณาระบุบัญชีธนาคาร' }, { status: 400 });
    }

    // Run auto-match
    const result = await matchBankEntries(bankAccountId);

    return NextResponse.json({
      success: true,
      data: {
        matched: result.matched.length,
        unmatched: result.unmatched.length,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const { entryId } = body;

    if (!entryId) {
      return NextResponse.json({ success: false, error: 'กรุณาระบุรายการ' }, { status: 400 });
    }

    // Unmatch - update the entry
    await prisma.bankStatementEntry.update({
      where: { id: entryId },
      data: {
        matched: false,
        matchedEntryId: null,
        matchedEntryType: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
