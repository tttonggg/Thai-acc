// Employee Leave Balances API (Phase 3b)
import { NextRequest, NextResponse } from 'next/server';
import { getEmployeeBalances } from '@/lib/leave-service';
import { requireAuth } from '@/lib/api-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  try {
    await requireAuth();
    const { employeeId } = await params;
    const url = new URL(request.url);
    const year = parseInt(url.searchParams.get('year') || String(new Date().getFullYear()));

    const balances = await getEmployeeBalances(employeeId, year);
    return NextResponse.json({ success: true, data: balances });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
