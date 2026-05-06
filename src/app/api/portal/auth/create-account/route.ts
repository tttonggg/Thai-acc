import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-utils';
import { createPortalAccount, getPortalAccountByCustomerId } from '@/lib/portal-auth';

export async function POST(req: NextRequest) {
  try {
    await requireAuth();

    const { customerId, email } = await req.json();

    if (!customerId || !email) {
      return NextResponse.json(
        { success: false, error: 'customerId and email are required' },
        { status: 400 }
      );
    }

    // Check if email already belongs to another portal account
    const existing = await getPortalAccountByCustomerId(customerId);
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'ลูกค้ารายนี้มีบัญชีพอร์ทัลอยู่แล้ว' },
        { status: 409 }
      );
    }

    const result = await createPortalAccount(customerId, email);

    return NextResponse.json({
      success: true,
      tempPassword: result.tempPassword,
      portalAccountId: result.portalAccountId,
    });
  } catch (error: unknown) {
    const err = error as any;
    console.error('createPortalAccount error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'เกิดข้อผิดพลาด' },
      { status: 500 }
    );
  }
}
