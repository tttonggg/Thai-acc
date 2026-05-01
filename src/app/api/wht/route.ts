import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/api-utils';
import { AuthError } from '@/lib/api-auth';

// GET - List WithholdingTax records
export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    const skip = (page - 1) * limit;
    const where: any = {};

    if (type) where.type = type;
    if (status) where.reportStatus = status;
    if (month) where.taxMonth = parseInt(month);
    if (year) where.taxYear = parseInt(year);

    const [records, total] = await Promise.all([
      prisma.withholdingTax.findMany({
        where,
        orderBy: { documentDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.withholdingTax.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: records,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    // Check for auth errors first
    if (error instanceof AuthError || error?.name === 'AuthError' || error?.statusCode === 401) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้รับอนุญาต - กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }
    console.error('WHT API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
