// GET /api/tax-forms/[id]
// Returns a single TaxForm with lines
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAuth();
  const { id } = await params;

  const taxForm = await db.taxForm.findUnique({
    where: { id },
    include: { lines: { orderBy: { lineNo: 'asc' } } },
  });

  if (!taxForm) {
    return NextResponse.json({ error: 'ไม่พบแบบฟอร์มภาษี' }, { status: 404 });
  }

  return NextResponse.json(taxForm);
}
