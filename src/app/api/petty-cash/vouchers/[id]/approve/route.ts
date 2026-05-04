import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/api-utils';
import { createVoucherJournalEntry } from '@/lib/petty-cash-service';
import { handleApiError } from '@/lib/api-error-handler';

/**
 * POST /api/petty-cash/vouchers/[id]/approve
 * Approve a petty cash voucher and create GL journal entry
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;

    // Fetch voucher with related fund data
    const voucher = await prisma.pettyCashVoucher.findUnique({
      where: { id },
      include: {
        fund: true,
      },
    });

    if (!voucher) {
      return NextResponse.json({ success: false, error: 'ไม่พบใบเบิกเงินสดย่อย' }, { status: 404 });
    }

    // Check if already has journal entry (already approved)
    if (voucher.journalEntryId) {
      return NextResponse.json(
        { success: false, error: 'ใบเบิกเงินสดย่อยนี้ได้รับการอนุมัติแล้ว' },
        { status: 400 }
      );
    }

    // Create journal entry
    const journalEntry = await createVoucherJournalEntry({
      voucherId: voucher.id,
      voucherNo: voucher.voucherNo,
      voucherDate: voucher.date,
      amount: voucher.amount,
      payee: voucher.payee,
      description: voucher.description,
      glExpenseAccountId: voucher.glExpenseAccountId,
      pettyCashFundAccountId: voucher.fund.glAccountId,
    });

    // Update voucher with journal entry ID
    const updatedVoucher = await prisma.pettyCashVoucher.update({
      where: { id },
      data: {
        journalEntryId: journalEntry.id,
      },
      include: {
        fund: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        voucher: updatedVoucher,
        journalEntry,
      },
      message: 'อนุมัติใบเบิกเงินสดย่อยและบันทึกบัญชีสำเร็จ',
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error.message || 'เกิดข้อผิดพลาดในการอนุมัติใบเบิกเงินสดย่อย' },
      { status: 500 }
    );
  }
}
