import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/api-utils';
import { handleApiError } from '@/lib/api-error-handler';

/**
 * GET /api/petty-cash/vouchers/[id]
 * Get single petty cash voucher by ID
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;

    const voucher = await prisma.pettyCashVoucher.findUnique({
      where: { id },
      include: {
        fund: true,
      },
    });

    if (!voucher) {
      return NextResponse.json({ success: false, error: 'ไม่พบใบเบิกเงินสดย่อย' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: voucher });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/petty-cash/vouchers/[id]
 * Update petty cash voucher (only if not yet approved)
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const { fundId, payee, description, amount, glExpenseAccountId, date } = body;

    // Fetch voucher first
    const existingVoucher = await prisma.pettyCashVoucher.findUnique({
      where: { id },
      include: { fund: true },
    });

    if (!existingVoucher) {
      return NextResponse.json({ success: false, error: 'ไม่พบใบเบิกเงินสดย่อย' }, { status: 404 });
    }

    // Check if already approved (has journal entry)
    if (existingVoucher.journalEntryId) {
      return NextResponse.json(
        { success: false, error: 'ไม่สามารถแก้ไขใบเบิกที่ได้รับการอนุมัติแล้ว' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!fundId || !payee || !description || !amount || !glExpenseAccountId) {
      return NextResponse.json(
        { success: false, error: 'ข้อมูลใบสำคัญไม่ครบถ้วน' },
        { status: 400 }
      );
    }

    // If fund changed, validate new fund has enough balance
    let newFund = existingVoucher.fund;
    if (fundId !== existingVoucher.fundId) {
      const fund = await prisma.pettyCashFund.findUnique({ where: { id: fundId } });
      if (!fund) {
        return NextResponse.json(
          { success: false, error: 'ไม่พบกองทุนเงินสดย่อย' },
          { status: 404 }
        );
      }
      newFund = fund;
    }

    const voucherAmount = parseFloat(amount);
    const oldAmount = existingVoucher.amount;

    // Calculate balance impact
    // If changing funds, we need to restore old amount to old fund and check new fund
    // If same fund, we need to check if new amount - old amount is available
    let balanceChange = 0;

    if (fundId !== existingVoucher.fundId) {
      // Different fund: restore old amount to old fund, check new fund
      const newFundAvailableBalance =
        newFund.currentBalance + (fundId !== existingVoucher.fundId ? oldAmount : 0);

      if (newFundAvailableBalance < voucherAmount) {
        return NextResponse.json(
          {
            success: false,
            error: `เงินสดย่อยไม่เพียงพอ (คงเหลือ ฿${newFundAvailableBalance.toLocaleString()})`,
          },
          { status: 400 }
        );
      }

      // Restore old fund balance
      await prisma.pettyCashFund.update({
        where: { id: existingVoucher.fundId },
        data: { currentBalance: { increment: oldAmount } },
      });

      // Update voucher
      const updatedVoucher = await prisma.pettyCashVoucher.update({
        where: { id },
        data: {
          fundId,
          payee,
          description,
          amount: voucherAmount,
          glExpenseAccountId,
          date: date ? new Date(date) : existingVoucher.date,
        },
      });

      // Deduct from new fund
      await prisma.pettyCashFund.update({
        where: { id: fundId },
        data: { currentBalance: { decrement: voucherAmount } },
      });

      return NextResponse.json({
        success: true,
        data: updatedVoucher,
        message: 'อัปเดตใบเบิกเงินสดย่อยสำเร็จ',
      });
    } else {
      // Same fund: check if we have enough for the difference
      balanceChange = voucherAmount - oldAmount;

      if (balanceChange > 0 && existingVoucher.fund.currentBalance < balanceChange) {
        return NextResponse.json(
          {
            success: false,
            error: `เงินสดย่อยไม่เพียงพอสำหรับวงเงินที่เพิ่มขึ้น (คงเหลือ ฿${existingVoucher.fund.currentBalance.toLocaleString()})`,
          },
          { status: 400 }
        );
      }

      // Update voucher and adjust fund balance in transaction
      const [updatedVoucher] = await prisma.$transaction([
        prisma.pettyCashVoucher.update({
          where: { id },
          data: {
            payee,
            description,
            amount: voucherAmount,
            glExpenseAccountId,
            date: date ? new Date(date) : existingVoucher.date,
          },
        }),
        prisma.pettyCashFund.update({
          where: { id: fundId },
          data: { currentBalance: { decrement: balanceChange } },
        }),
      ]);

      return NextResponse.json({
        success: true,
        data: updatedVoucher,
        message: 'อัปเดตใบเบิกเงินสดย่อยสำเร็จ',
      });
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || 'เกิดข้อผิดพลาดในการอัปเดตใบเบิกเงินสดย่อย' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/petty-cash/vouchers/[id]
 * Delete a petty cash voucher (only if not yet approved/posted)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    // Fetch voucher first
    const voucher = await prisma.pettyCashVoucher.findUnique({
      where: { id },
    });

    if (!voucher) {
      return NextResponse.json({ success: false, error: 'ไม่พบใบเบิกเงินสดย่อย' }, { status: 404 });
    }

    // Check if already has journal entry (already approved)
    if (voucher.journalEntryId) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่สามารถลบใบเบิกที่ได้รับการอนุมัติแล้ว กรุณาใช้รายการย้อนกลับ',
        },
        { status: 400 }
      );
    }

    // Delete voucher and restore fund balance
    const [deletedVoucher] = await prisma.$transaction([
      prisma.pettyCashVoucher.delete({
        where: { id },
      }),
      prisma.pettyCashFund.update({
        where: { id: voucher.fundId },
        data: {
          currentBalance: {
            increment: voucher.amount,
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: deletedVoucher,
      message: 'ลบใบเบิกเงินสดย่อยสำเร็จ',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || 'เกิดข้อผิดพลาดในการลบใบเบิกเงินสดย่อย' },
      { status: 500 }
    );
  }
}
