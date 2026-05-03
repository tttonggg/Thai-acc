/**
 * Journal Entry PDF Export API Route
 * เส้นทาง API สำหรับส่งออกบันทึกบัญชีเป็น PDF
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-utils';
import { prisma } from '@/lib/db';
import { generateJournalEntryPDF } from '@/lib/pdf-generator';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check authentication
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await params to get the id
    const { id } = await params;

    // Fetch journal entry with all related data
    const entry = await prisma.journalEntry.findUnique({
      where: { id: id },
      include: {
        lines: {
          include: {
            account: true,
          },
          orderBy: {
            lineNo: 'asc',
          },
        },
      },
    });

    if (!entry) {
      return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 });
    }

    // Generate PDF
    const pdfBytes = await generateJournalEntryPDF(entry);

    // Return PDF file
    return new NextResponse(new Uint8Array(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="journal-entry-${entry.entryNo}.pdf"`,
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
