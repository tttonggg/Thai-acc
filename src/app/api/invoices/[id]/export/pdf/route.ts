/**
 * Invoice PDF Export API Route
 * เส้นทาง API สำหรับส่งออกใบกำกับภาษีเป็น PDF
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-utils';
import { prisma } from '@/lib/db';
import { generateInvoicePDF } from '@/lib/pdf-generator';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check authentication
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await params to get the id
    const { id } = await params;

    // Fetch invoice with all related data
    const invoice = await prisma.invoice.findUnique({
      where: { id: id },
      include: {
        customer: true,
        lines: {
          include: {
            product: true,
          },
          orderBy: {
            lineNo: 'asc',
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Generate PDF
    const pdfBytes = await generateInvoicePDF(invoice);

    // Return PDF file
    return new NextResponse(new Uint8Array(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNo}.pdf"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to generate PDF',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
