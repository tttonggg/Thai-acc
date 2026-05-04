// WHT Reports API (Agent 02: WHT & Tax Automation)
// /api/reports/wht - needed by existing UI component
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/api-utils';
import { handleApiError } from '@/lib/api-error-handler';

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = request.nextUrl;
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined;
    const year = searchParams.get('year')
      ? parseInt(searchParams.get('year')!)
      : new Date().getFullYear();
    const type = searchParams.get('type'); // PND3, PND53

    const where: any = { taxYear: year };
    if (month) where.taxMonth = month;
    if (type) where.type = type;

    const records = await prisma.withholdingTax.findMany({
      where,
      orderBy: [{ taxYear: 'desc' }, { taxMonth: 'desc' }, { documentDate: 'desc' }],
    });

    // Summary
    const summary = {
      totalRecords: records.length,
      totalIncomeAmount: records.reduce((s, r) => s + r.incomeAmount, 0),
      totalWhtAmount: records.reduce((s, r) => s + r.whtAmount, 0),
      pnd3Count: records.filter((r) => r.type === 'PND3').length,
      pnd3Amount: records.filter((r) => r.type === 'PND3').reduce((s, r) => s + r.whtAmount, 0),
      pnd53Count: records.filter((r) => r.type === 'PND53').length,
      pnd53Amount: records.filter((r) => r.type === 'PND53').reduce((s, r) => s + r.whtAmount, 0),
      pending: records.filter((r) => r.reportStatus === 'PENDING').length,
      reported: records.filter((r) => r.reportStatus === 'REPORTED').length,
    };

    return NextResponse.json({ success: true, data: records, summary });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
