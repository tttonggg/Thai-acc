import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';
import { requireAuth, requireRole, generateDocNumber, getClientIp } from '@/lib/api-utils';
import { bahtToSatang, satangToBaht } from '@/lib/currency';
import { checkPeriodStatus } from '@/lib/period-service';
import { handleApiError } from '@/lib/api-error-handler';
import { logJournalMutation } from '@/lib/audit-service';

// Validation schema for journal entry
const journalLineSchema = z.object({
  accountId: z.string().min(1, 'ต้องเลือกบัญชี'),
  description: z.string().optional(),
  debit: z.number().min(0, 'เดบิตต้องไม่ติดลบ').default(0),
  credit: z.number().min(0, 'เครดิตต้องไม่ติดลบ').default(0),
});

const journalEntrySchema = z
  .object({
    date: z.string().transform((val) => new Date(val)),
    description: z.string().optional(),
    reference: z.string().optional(),
    documentType: z.string().optional(),
    documentId: z.string().optional(),
    notes: z.string().optional(),
    lines: z.array(journalLineSchema).min(2, 'ต้องมีอย่างน้อย 2 รายการ'),
  })
  .refine(
    (data) => {
      const totalDebit = data.lines.reduce((sum, line) => sum + line.debit, 0);
      const totalCredit = data.lines.reduce((sum, line) => sum + line.credit, 0);
      return Math.abs(totalDebit - totalCredit) < 0.01;
    },
    { message: 'ยอดเดบิตและเครดิตต้องเท่ากัน' }
  );

// NOTE: Entry number generation moved to generateDocNumber() in api-utils.ts
// which is transaction-safe. Used directly inline in POST handler.

// GET - List journal entries (ACCOUNTANT or ADMIN only)
export async function GET(request: NextRequest) {
  try {
    // Require ACCOUNTANT or ADMIN role
    await requireRole(['ACCOUNTANT', 'ADMIN']);

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    if (search) {
      where.OR = [
        { entryNo: { contains: search } },
        { description: { contains: search } },
        { reference: { contains: search } },
      ];
    }

    const [entries, total] = await Promise.all([
      prisma.journalEntry.findMany({
        where,
        include: {
          lines: {
            include: {
              account: true,
            },
            orderBy: { lineNo: 'asc' },
          },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.journalEntry.count({ where }),
    ]);

    // Convert Satang to Baht for response
    const entriesWithBaht = entries.map((entry: any) => ({
      ...entry,
      totalDebit: satangToBaht(entry.totalDebit),
      totalCredit: satangToBaht(entry.totalCredit),
      lines: entry.lines.map((line: any) => ({
        ...line,
        debit: satangToBaht(line.debit),
        credit: satangToBaht(line.credit),
      })),
    }));

    return NextResponse.json({
      success: true,
      data: entriesWithBaht,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    // Handle auth errors
    if (error?.statusCode === 401 || error?.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้รับอนุญาต - กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }
    if (error?.statusCode === 403) {
      return NextResponse.json({ success: false, error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 });
    }
    console.error('Journal API error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}

// POST - Create journal entry (ACCOUNTANT or ADMIN only)
export async function POST(request: NextRequest) {
  try {
    // Require ACCOUNTANT or ADMIN role
    const user = await requireRole(['ACCOUNTANT', 'ADMIN']);
    const ipAddress = getClientIp(request.headers);
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const body = await request.json();
    const validatedData = journalEntrySchema.parse(body);

    // B1. Period Locking - Check if period is open for journal entry date
    const periodCheck = await checkPeriodStatus(validatedData.date);
    if (!periodCheck.isValid) {
      return NextResponse.json(
        { success: false, error: periodCheck.error || 'ไม่สามารถสร้างบันทึกบัญชีในงวดที่ปิดแล้ว' },
        { status: 400 }
      );
    }

    // Convert Baht to Satang for debit/credit amounts
    const dataInSatang = {
      ...validatedData,
      lines: validatedData.lines.map((line) => ({
        ...line,
        debit: bahtToSatang(line.debit),
        credit: bahtToSatang(line.credit),
      })),
    };

    // Calculate totals (already in Satang)
    const totalDebit = dataInSatang.lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = dataInSatang.lines.reduce((sum, line) => sum + line.credit, 0);

    // Generate entry number (transaction-safe via generateDocNumber)
    const entryNo = await generateDocNumber('JOURNAL_ENTRY', 'JE');

    // Create journal entry with lines
    const entry = await prisma.journalEntry.create({
      data: {
        entryNo,
        date: dataInSatang.date,
        description: dataInSatang.description,
        reference: dataInSatang.reference,
        documentType: dataInSatang.documentType,
        documentId: dataInSatang.documentId,
        totalDebit,
        totalCredit,
        notes: dataInSatang.notes,
        status: 'DRAFT',
        createdById: user.id,
        lines: {
          create: dataInSatang.lines.map((line, index) => ({
            lineNo: index + 1,
            accountId: line.accountId,
            description: line.description,
            debit: line.debit,
            credit: line.credit,
          })),
        },
      },
      include: {
        lines: {
          include: {
            account: true,
          },
        },
      },
    });

    // Convert response to Baht
    const entryInBaht = {
      ...entry,
      totalDebit: satangToBaht(entry.totalDebit),
      totalCredit: satangToBaht(entry.totalCredit),
      lines: entry.lines.map((line: any) => ({
        ...line,
        debit: satangToBaht(line.debit),
        credit: satangToBaht(line.credit),
      })),
    };

    // Audit log the creation
    await logJournalMutation(
      user.id,
      entry.id,
      'CREATE',
      null,
      entryInBaht as unknown as Record<string, unknown>,
      ipAddress,
      userAgent
    );

    return NextResponse.json({ success: true, data: entryInBaht });
  } catch (error: unknown) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'ข้อมูลไม่ถูกต้อง', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || 'เกิดข้อผิดพลาดในการสร้างบันทึกบัญชี' },
      { status: 500 }
    );
  }
}
