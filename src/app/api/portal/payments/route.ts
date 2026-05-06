/**
 * POST /api/portal/payments
 * Record a customer payment → creates DRAFT Receipt for ERP approval.
 */
import { NextRequest, NextResponse } from 'next/server';
import { recordPortalPayment } from '@/lib/portal-payment-service';
import { PaymentMethod } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const customerId = request.headers.get('x-customer-id');
    if (!customerId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { payments, paymentMethod, bankAccountId, chequeNo, chequeDate, notes } = body;

    if (!payments || !Array.isArray(payments) || payments.length === 0) {
      return NextResponse.json({ success: false, error: 'กรุณาเลือกใบแจ้งหนี้ที่ต้องการชำระ' }, { status: 400 });
    }

    if (!paymentMethod) {
      return NextResponse.json({ success: false, error: 'กรุณาเลือกวิธีการชำระเงิน' }, { status: 400 });
    }

    // Validate each payment entry
    for (const p of payments) {
      if (!p.invoiceId || typeof p.amount !== 'number' || p.amount <= 0) {
        return NextResponse.json({ success: false, error: 'ข้อมูลการชำระเงินไม่ถูกต้อง' }, { status: 400 });
      }
    }

    const result = await recordPortalPayment({
      customerId,
      payments: payments.map((p: { invoiceId: string; amount: number }) => ({
        invoiceId: p.invoiceId,
        amount: p.amount,
      })),
      paymentMethod: paymentMethod as PaymentMethod,
      bankAccountId: bankAccountId || undefined,
      chequeNo: chequeNo || undefined,
      chequeDate: chequeDate || undefined,
      notes: notes || undefined,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      receiptId: result.receiptId,
      receiptNo: result.receiptNo,
    });
  } catch (error) {
    console.error('Portal payments error:', error);
    return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาดในการบันทึกการชำระเงิน' }, { status: 500 });
  }
}
