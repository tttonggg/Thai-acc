// GET /api/tax-forms/pnd53?month=3&year=2026
// Returns existing TaxForm for PND53, or generates a new one on POST
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { generatePND53 } from '@/lib/tax-form-service';

export async function GET(req: NextRequest) {
  const _user = await requireAuth();
  const { searchParams } = new URL(req.url);
  const month = parseInt(searchParams.get('month') ?? '0', 10);
  const year = parseInt(searchParams.get('year') ?? '0', 10);

  if (!month || !year) {
    return NextResponse.json({ error: 'month and year are required' }, { status: 400 });
  }

  const existing = await db.taxForm.findFirst({
    where: { formType: 'PND53', month, year },
    include: { lines: { orderBy: { lineNo: 'asc' } } },
  });

  if (existing) {
    return NextResponse.json(existing);
  }

  return NextResponse.json(null);
}

export async function POST(req: NextRequest) {
  const _user = await requireAuth();
  const { searchParams } = new URL(req.url);
  const month = parseInt(searchParams.get('month') ?? '0', 10);
  const year = parseInt(searchParams.get('year') ?? '0', 10);

  if (!month || !year) {
    return NextResponse.json({ error: 'month and year are required' }, { status: 400 });
  }

  try {
    const taxForm = await generatePND53(month, year);
    return NextResponse.json(taxForm, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate PND53';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
