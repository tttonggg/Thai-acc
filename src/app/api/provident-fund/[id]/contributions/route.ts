// POST /api/provident-fund/[id]/contributions - Add contribution
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-utils';
import { addContribution } from '@/lib/provident-fund-service';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id: providentFundId } = await params;
    const body = await request.json();
    const { employeeId, payrollRunId, employeePortion, employerPortion } = body;

    if (
      !employeeId ||
      !payrollRunId ||
      employeePortion === undefined ||
      employerPortion === undefined
    ) {
      return NextResponse.json({ success: false, error: 'กรุณาระบุข้อมูลให้ครบ' }, { status: 400 });
    }

    const contribution = await addContribution({
      providentFundId,
      employeeId,
      payrollRunId,
      employeePortion,
      employerPortion,
    });

    return NextResponse.json({ success: true, data: contribution }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
