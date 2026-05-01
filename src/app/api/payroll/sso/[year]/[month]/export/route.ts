// SSO 50 ทวิ File Export API
// GET /api/payroll/sso/[year]/[month]/export - Download 50 ทวิ bank file
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-utils';
import { generate50TongFile } from '@/lib/sso-filing-service';

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

    const { content, filename } = await generate50TongFile(yearNum, monthNum);

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.message.includes('ไม่พบ') ? 404 : 500 }
    );
  }
}
