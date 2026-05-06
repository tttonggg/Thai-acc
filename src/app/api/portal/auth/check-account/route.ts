import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-utils';
import { getPortalAccountByCustomerId } from '@/lib/portal-auth';

export async function GET(req: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json({ success: false, error: 'customerId required' }, { status: 400 });
    }

    const portalAccount = await getPortalAccountByCustomerId(customerId);

    return NextResponse.json({
      success: true,
      hasAccount: !!portalAccount,
      email: portalAccount?.user.email ?? null,
    });
  } catch (error: unknown) {
    const err = error as any;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
