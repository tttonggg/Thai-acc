import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-utils';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accounts = await prisma.chartOfAccount.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    });

    // Create CSV content
    const headers = 'code,name,type,isDetail\n';
    const rows = accounts
      .map((a: any) => `${a.code},"${a.name}",${a.type},${a.isDetail}`)
      .join('\n');

    const csv = headers + rows;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="chart-of-accounts-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: 'Failed to export accounts',
      },
      { status: 500 }
    );
  }
}
