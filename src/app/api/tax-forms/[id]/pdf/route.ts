// GET /api/tax-forms/[id]/pdf
// Returns PDF for a TaxForm using the existing service
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { exportTaxFormToPDF } from '@/lib/tax-form-service';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAuth();
  const { id } = await params;

  try {
    const pdfBuffer = await exportTaxFormToPDF(id);
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="tax-form-${id}.pdf"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to export PDF';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
