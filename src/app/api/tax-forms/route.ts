// GET /api/tax-forms?formType=PND3&month=3&year=2026
// Returns a single TaxForm by type+month+year (for history list)
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  await requireAuth();
  const { searchParams } = new URL(req.url);
  const formType = searchParams.get('formType') as 'PND3' | 'PND53' | null;
  const month = parseInt(searchParams.get('month') ?? '0', 10);
  const year = parseInt(searchParams.get('year') ?? '0', 10);

  if (!formType || !month || !year) {
    return NextResponse.json({ error: 'formType, month, year required' }, { status: 400 });
  }

  const taxForm = await db.taxForm.findFirst({
    where: { formType, month, year },
    include: { lines: { orderBy: { lineNo: 'asc' } } },
  });

  if (!taxForm) {
    return NextResponse.json(null);
  }

  return NextResponse.json(taxForm);
}
