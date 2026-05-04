import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/api-utils';
import { handleApiError } from '@/lib/api-error-handler';

/**
 * GET /api/reports/trial-balance
 * Generate trial balance report
 * Sums all account balances by account
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth();

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const asOfDate = searchParams.get('asOfDate');
    const accountId = searchParams.get('accountId');

    // Build date filter
    const dateFilter = asOfDate ? new Date(asOfDate) : new Date();

    // Get all posted journal entries up to the specified date
    const whereClause: any = {
      status: 'POSTED',
      date: {
        lte: dateFilter,
      },
    };

    if (accountId) {
      whereClause.lines = {
        some: {
          accountId,
        },
      };
    }

    // Fetch all journal entries with their lines
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

    // Calculate balances for each account
    const accountBalances = new Map<
      string,
      {
        code: string;
        name: string;
        nameEn?: string | null;
        type: string;
        debit: number;
        credit: number;
        balance: number;
      }
    >();

    // Process all journal lines
    for (const entry of journalEntries) {
      for (const line of entry.lines) {
        if (!line.account.isActive) continue;

        const accountId = line.accountId;
        const account = line.account;

        if (!accountBalances.has(accountId)) {
          accountBalances.set(accountId, {
            code: account.code,
            name: account.name,
            nameEn: account.nameEn,
            type: account.type,
            debit: 0,
            credit: 0,
            balance: 0,
          });
        }

        const balance = accountBalances.get(accountId)!;
        balance.debit += line.debit;
        balance.credit += line.credit;
      }
    }

    // Calculate net balance for each account based on account type
    const accounts = Array.from(accountBalances.values()).map((account) => {
      let balance = 0;
      let debitBalance = 0;
      let creditBalance = 0;

      // For assets, expenses: normal balance is debit
      // For liabilities, equity, revenue: normal balance is credit
      if (account.type === 'ASSET' || account.type === 'EXPENSE') {
        balance = account.debit - account.credit;
        if (balance >= 0) {
          debitBalance = balance;
          creditBalance = 0;
        } else {
          debitBalance = 0;
          creditBalance = Math.abs(balance);
        }
      } else {
        // LIABILITY, EQUITY, REVENUE
        balance = account.credit - account.debit;
        if (balance >= 0) {
          debitBalance = 0;
          creditBalance = balance;
        } else {
          debitBalance = Math.abs(balance);
          creditBalance = 0;
        }
      }

      return {
        code: account.code,
        name: account.name,
        nameEn: account.nameEn,
        type: account.type,
        debit: debitBalance,
        credit: creditBalance,
        balance,
      };
    });

    // Sort by account code
    accounts.sort((a, b) => a.code.localeCompare(b.code));

    // Calculate totals
    const totalDebit = accounts.reduce((sum, acc) => sum + acc.debit, 0);
    const totalCredit = accounts.reduce((sum, acc) => sum + acc.credit, 0);

    return NextResponse.json({
      success: true,
      asOfDate: dateFilter.toISOString(),
      accounts,
      totals: {
        debit: totalDebit,
        credit: totalCredit,
        isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
      },
    });
  } catch (error) {
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
        error: 'เกิดข้อผิดพลาดในการสร้างงบทดลอง',
      },
      { status: 500 }
    );
  }
}
