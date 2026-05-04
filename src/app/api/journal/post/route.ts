import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';
import { requireAuth, getClientIp } from '@/lib/api-utils';
import { logPost } from '@/lib/activity-logger';
import { handleApiError } from '@/lib/api-error-handler';

/**
 * Validation schema for journal entry lines
 */
const journalLineSchema = z.object({
  accountId: z.string().min(1, 'ต้องระบุบัญชี'),
  description: z.string().optional(),
  debit: z.number().min(0).default(0),
  credit: z.number().min(0).default(0),
  reference: z.string().optional(),
});

/**
 * Validation schema for journal entry
 */
const journalEntrySchema = z.object({
  date: z.string().transform((val) => new Date(val)),
  description: z.string().optional(),
  reference: z.string().optional(),
  documentType: z.string().optional(),
  documentId: z.string().optional(),
  isAdjustment: z.boolean().default(false),
  isReversing: z.boolean().default(false),
  reversingId: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(journalLineSchema).min(2, 'ต้องมีอย่างน้อย 2 รายการ (เดบิตและเครดิต)'),
});

/**
 * Generate journal entry number
 * Pattern: JV-YYYY-NNNN (e.g., JV-2567-0001)
 */
async function generateJournalEntryNumber(): Promise<string> {
  const now = new Date();
  const thaiYear = now.getFullYear() + 543; // Convert to Buddhist year

  const prefix = `JV-${thaiYear}`;

  // Find last journal entry for this year
  const lastEntry = await prisma.journalEntry.findFirst({
    where: {
      entryNo: {
        startsWith: prefix,
      },
    },
    orderBy: {
      entryNo: 'desc',
    },
    select: {
      entryNo: true,
    },
  });

  let nextNum = 1;
  if (lastEntry) {
    const parts = lastEntry.entryNo.split('-');
    const lastNum = parseInt(parts[parts.length - 1] || '0', 10);
    nextNum = lastNum + 1;
  }

  return `${prefix}-${String(nextNum).padStart(4, '0')}`;
}

/**
 * POST /api/journal/post
 * Validate and post journal entries
 * Validates: debits === credits (within 0.01 tolerance)
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth();
    const ipAddress = getClientIp(request.headers);

    // Parse and validate request body
    const body = await request.json();
    const validatedData = journalEntrySchema.parse(body);

    // Calculate totals
    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of validatedData.lines) {
      totalDebit += line.debit;
      totalCredit += line.credit;
    }

    // Validate debits equal credits (within 0.01 tolerance)
    const difference = Math.abs(totalDebit - totalCredit);
    if (difference > 0.01) {
      return NextResponse.json(
        {
          success: false,
          error: 'ยอดเดบิตและเครดิตไม่เท่ากัน',
          details: {
            totalDebit,
            totalCredit,
            difference,
          },
        },
        { status: 400 }
      );
    }

    // Validate that at least one line has debit and one has credit
    const hasDebit = validatedData.lines.some((line) => line.debit > 0);
    const hasCredit = validatedData.lines.some((line) => line.credit > 0);

    if (!hasDebit || !hasCredit) {
      return NextResponse.json(
        {
          success: false,
          error: 'ต้องมีทั้งรายการเดบิตและเครดิต',
        },
        { status: 400 }
      );
    }

    // Verify all accounts exist
    const accountIds = validatedData.lines.map((line) => line.accountId);
    const accounts = await prisma.chartOfAccount.findMany({
      where: {
        id: { in: accountIds },
        isActive: true,
      },
      select: {
        id: true,
        code: true,
        name: true,
        type: true,
      },
    });

    if (accounts.length !== accountIds.length) {
      return NextResponse.json(
        {
          success: false,
          error: 'พบบัญชีที่ไม่มีอยู่จริงหรือถูกปิดใช้งาน',
        },
        { status: 400 }
      );
    }

    // Generate journal entry number
    const entryNo = await generateJournalEntryNumber();

    // Create journal entry with lines
    const journalEntry = await prisma.journalEntry.create({
      data: {
        entryNo,
        date: validatedData.date,
        description: validatedData.description,
        reference: validatedData.reference,
        documentType: validatedData.documentType,
        documentId: validatedData.documentId,
        totalDebit,
        totalCredit,
        status: 'POSTED',
        isAdjustment: validatedData.isAdjustment,
        isReversing: validatedData.isReversing,
        reversingId: validatedData.reversingId,
        createdById: user.id,
        approvedById: user.id,
        approvedAt: new Date(),
        notes: validatedData.notes,
        lines: {
          create: validatedData.lines.map((line, index) => ({
            lineNo: index + 1,
            accountId: line.accountId,
            description: line.description,
            debit: line.debit,
            credit: line.credit,
            reference: line.reference,
          })),
        },
      },
      include: {
        lines: {
          include: {
            account: {
              select: {
                code: true,
                name: true,
                nameEn: true,
                type: true,
              },
            },
          },
        },
      },
    });

    // Log journal posting
    await logPost(
      user.id,
      'journal',
      journalEntry.id,
      {
        entryNo: journalEntry.entryNo,
        totalDebit: journalEntry.totalDebit,
        totalCredit: journalEntry.totalCredit,
        documentType: journalEntry.documentType,
      },
      ipAddress
    );

    return NextResponse.json({
      success: true,
      journalId: journalEntry.id,
      entryNo: journalEntry.entryNo,
      data: journalEntry,
    });
  } catch (error) {
    // Handle auth errors
    if (error.name === 'AuthError') {
      return NextResponse.json(
        { success: false, error: error.message || 'กรุณาเข้าสู่ระบบ' },
        { status: error.statusCode || 401 }
      );
    }

    // Handle validation errors
    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: 'ข้อมูลไม่ถูกต้อง',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    // Handle other errors
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'เกิดข้อผิดพลาดในการลงบัญชี',
      },
      { status: 500 }
    );
  }
}
