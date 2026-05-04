// POST /api/provident-fund - Create a new provident fund
// GET /api/provident-fund - List all provident funds
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-utils';
import { createProvidentFund, listProvidentFunds } from '@/lib/provident-fund-service';
import { handleApiError } from '@/lib/api-error-handler';

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const funds = await listProvidentFunds();
    return NextResponse.json({ success: true, data: funds });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const body = await request.json();
    const { name, employeeRate, employerRate, maxMonthly } = body;

    if (!name || employeeRate === undefined || employerRate === undefined) {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุชื่อกองทุนและอัตราส่วน' },
        { status: 400 }
      );
    }

    const fund = await createProvidentFund({ name, employeeRate, employerRate, maxMonthly });
    return NextResponse.json({ success: true, data: fund }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
