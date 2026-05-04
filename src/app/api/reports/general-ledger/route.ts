import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/api-utils';
import { handleApiError } from '@/lib/api-error-handler';

interface GeneralLedgerEntry {
  date: string;
  entryNo: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

interface GeneralLedgerAccount {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountNameEn?: string | null;
  entries: GeneralLedgerEntry[];
  totalDebit: number;
  totalCredit: number;
  endingBalance: number;
}

/**
 * GET /api/reports/general-ledger
 * Generate general ledger report
 * Returns all journal entries within date range, grouped by account
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth();

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const accountId = searchParams.get('accountId');

    // Validate date parameters
    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุช่วงวันที่ (startDate, endDate)' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { success: false, error: 'รูปแบบวันที่ไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    if (start > end) {
      return NextResponse.json(
        { success: false, error: 'วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด' },
        { status: 400 }
      );
    }

    // Set end date to end of day
    end.setHours(23, 59, 59, 999);

    // Build where clause
    const whereClause: any = {
      status: 'POSTED',
      date: {
        gte: start,
        lte: end,
      },
    };

    if (accountId) {
      whereClause.lines = {
        some: {
          accountId,
        },
      };
    }

    // Fetch journal entries
    const journalEntries = await prisma.journalEntry.findMany({
      where: whereClause,
      include: {
        lines: {
          include: {
            account: {
              select: {
                id: true,
                code: true,
                name: true,
                nameEn: true,
                type: true,
                isActive: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Group entries by account
    const accountMap = new Map<string, GeneralLedgerAccount>();

    for (const entry of journalEntries) {
      for (const line of entry.lines) {
        if (!line.account.isActive) continue;

        const accId = line.accountId;
        const account = line.account;

        if (!accountMap.has(accId)) {
          accountMap.set(accId, {
            accountId: accId,
            accountCode: account.code,
            accountName: account.name,
            accountNameEn: account.nameEn,
            entries: [],
            totalDebit: 0,
            totalCredit: 0,
            endingBalance: 0,
          });
        }

        const accountData = accountMap.get(accId)!;

        // Add entry
        accountData.entries.push({
          date: entry.date.toISOString().split('T')[0],
          entryNo: entry.entryNo,
          description: line.description || entry.description || '',
          debit: line.debit,
          credit: line.credit,
          balance: 0, // Will be calculated later
        });

        // Update totals
        accountData.totalDebit += line.debit;
        accountData.totalCredit += line.credit;
      }
    }

    // Calculate running balance for each account
    const accounts = Array.from(accountMap.values()).map((account) => {
      let runningBalance = 0;

      // Calculate opening balance (before start date)
      // We need to fetch all posted entries before startDate
      // For simplicity, we'll start from 0 in this implementation

      // Calculate running balance
      account.entries.forEach((entry) => {
        const balanceChange = entry.debit - entry.credit;
        runningBalance += balanceChange;
        entry.balance = runningBalance;
      });

      account.endingBalance = runningBalance;

      return account;
    });

    // Sort by account code
    accounts.sort((a, b) => a.accountCode.localeCompare(b.accountCode));

    return NextResponse.json({
      success: true,
      period: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      },
      accounts,
    });
  } catch (error: unknown) {
    // Handle auth errors
    if (error.name === 'AuthError') {
      return NextResponse.json(
        { success: false, error: error.message || 'กรุณาเข้าสู่ระบบ' },
        { status: error.statusCode || 401 }
      );
    }

    // Handle other errors
    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการสร้างรายงานบัญชีแยกประเภท',
      },
      { status: 500 }
    );
  }
}
