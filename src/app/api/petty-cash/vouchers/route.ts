// Petty Cash Vouchers API — Schema-exact field names
// PettyCashVoucher: date (not voucherDate), payee, description, glExpenseAccountId
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/api-utils';
import { handleApiError } from '@/lib/api-error-handler';

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = request.nextUrl;
    const fundId = searchParams.get('fundId');
    const isReimbursed = searchParams.get('isReimbursed');

    const where: any = {};
    if (fundId) where.fundId = fundId;
    if (isReimbursed !== null) where.isReimbursed = isReimbursed === 'true';

    const vouchers = await prisma.pettyCashVoucher.findMany({
      where,
      include: { fund: true },
      orderBy: { date: 'desc' }, // 'date' is the correct schema field
    });

    return NextResponse.json({ success: true, data: vouchers });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const body = await request.json();
    const { fundId, payee, description, amount, glExpenseAccountId, date } = body;

    if (!fundId || !payee || !description || !amount || !glExpenseAccountId) {
      return NextResponse.json(
        { success: false, error: 'ข้อมูลใบสำคัญไม่ครบถ้วน' },
        { status: 400 }
      );
    }

    const fund = await prisma.pettyCashFund.findUnique({ where: { id: fundId } });
    if (!fund)
      return NextResponse.json({ success: false, error: 'ไม่พบกองทุนเงินสดย่อย' }, { status: 404 });

    const voucherAmount = parseFloat(amount);
    if (fund.currentBalance < voucherAmount) {
      return NextResponse.json(
        {
          success: false,
          error: `เงินสดย่อยไม่เพียงพอ (คงเหลือ ฿${fund.currentBalance.toLocaleString()})`,
        },
        { status: 400 }
      );
    }

    const count = await prisma.pettyCashVoucher.count();
    const voucherNo = `PCV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const [voucher] = await prisma.$transaction([
      prisma.pettyCashVoucher.create({
        data: {
          voucherNo,
          fundId,
          payee, // correct schema field
          description,
          amount: voucherAmount,
          glExpenseAccountId,
          date: date ? new Date(date) : new Date(), // 'date' not 'voucherDate'
          isReimbursed: false,
        },
      }),
      prisma.pettyCashFund.update({
        where: { id: fundId },
        data: { currentBalance: { decrement: voucherAmount } },
      }),
    ]);

    return NextResponse.json({ success: true, data: voucher }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
