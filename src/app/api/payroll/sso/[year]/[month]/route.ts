// SSO Filing Data API
// GET /api/payroll/sso/[year]/[month] - Get SSO filing data for a period
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-utils';
import { generateSSOFilingData, getSSOSummary } from '@/lib/sso-filing-service';
import { handleApiError } from '@/lib/api-error-handler';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ year: string; month: string }> }
) {
  try {
    await requireAuth();
    const { year, month } = await params;

    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return NextResponse.json({ success: false, error: 'ปีหรือเดือนไม่ถูกต้อง' }, { status: 400 });
    }

    const filingData = await generateSSOFilingData(yearNum, monthNum);
    const summary = getSSOSummary(filingData);

    return NextResponse.json({
      success: true,
      data: {
        ...filingData,
        summary,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.message.includes('ไม่พบ') ? 404 : 500 }
    );
  }
}
