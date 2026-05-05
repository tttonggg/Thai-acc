// GET /api/tax-forms/summary?year=2026
// Returns all TaxForms for a given year (for the list/history view)
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { getTaxFormSummary } from '@/lib/tax-form-service';

export async function GET(req: NextRequest) {
  await requireAuth();
  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get('year') ?? new Date().getFullYear().toString(), 10);

  try {
    const summary = await getTaxFormSummary(year);
    return NextResponse.json(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get summary';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
