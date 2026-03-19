import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/api-auth'
import { generateBalanceSheetExcel } from '@/lib/excel-export'

/**
 * GET /api/reports/balance-sheet/export/excel
 * Export balance sheet report to Excel format
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth(request)

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams
    const asOfDate = searchParams.get('asOfDate')

    // Build date filter
    const dateFilter = asOfDate ? new Date(asOfDate) : new Date()

    // Set end of day
    dateFilter.setHours(23, 59, 59, 999)

    // Fetch all posted journal entries up to the specified date
    const journalEntries = await prisma.journalEntry.findMany({
      where: {
        status: 'POSTED',
        date: {
          lte: dateFilter,
        },
      },
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
    })

    // Calculate balances for assets, liabilities, and equity accounts
    interface AccountBalance {
      code: string
      name: string
      nameEn?: string | null
      amount: number
    }

    const assetMap = new Map<string, AccountBalance>()
    const liabilityMap = new Map<string, AccountBalance>()
    const equityMap = new Map<string, AccountBalance>()

    // Process all journal lines
    for (const entry of journalEntries) {
      for (const line of entry.lines) {
        const account = line.account

        // Skip inactive accounts
        if (!account.isActive) continue

        // Only process balance sheet accounts (assets, liabilities, equity)
        if (
          account.type !== 'ASSET' &&
          account.type !== 'LIABILITY' &&
          account.type !== 'EQUITY'
        ) {
          continue
        }

        // Select the appropriate map based on account type
        let targetMap: Map<string, AccountBalance>
        if (account.type === 'ASSET') {
          targetMap = assetMap
        } else if (account.type === 'LIABILITY') {
          targetMap = liabilityMap
        } else {
          targetMap = equityMap
        }

        if (!targetMap.has(account.id)) {
          targetMap.set(account.id, {
            code: account.code,
            name: account.name,
            nameEn: account.nameEn,
            amount: 0,
          })
        }

        const balance = targetMap.get(account.id)!

        // For assets: debit increases, credit decreases
        // For liabilities & equity: credit increases, debit decreases
        if (account.type === 'ASSET') {
          balance.amount += line.debit - line.credit
        } else {
          balance.amount += line.credit - line.debit
        }
      }
    }

    // Calculate current retained earnings (cumulative net income)
    // Revenue accounts
    const revenueEntries = await prisma.journalLine.findMany({
      where: {
        entry: {
          status: 'POSTED',
          date: {
            lte: dateFilter,
          },
        },
        account: {
          type: 'REVENUE',
          isActive: true,
        },
      },
      include: {
        account: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    })

    // Expense accounts
    const expenseEntries = await prisma.journalLine.findMany({
      where: {
        entry: {
          status: 'POSTED',
          date: {
            lte: dateFilter,
          },
        },
        account: {
          type: 'EXPENSE',
          isActive: true,
        },
      },
      include: {
        account: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    })

    let totalRevenue = 0
    for (const line of revenueEntries) {
      totalRevenue += line.credit - line.debit
    }

    let totalExpenses = 0
    for (const line of expenseEntries) {
      totalExpenses += line.debit - line.credit
    }

    const retainedEarnings = totalRevenue - totalExpenses

    // Add retained earnings to equity if non-zero
    if (Math.abs(retainedEarnings) > 0.01) {
      const retainedEarningsKey = 'RETAINED_EARNINGS'
      equityMap.set(retainedEarningsKey, {
        code: '3999',
        name: 'กำไรสุทธิสะสม (Retained Earnings)',
        nameEn: 'Retained Earnings',
        amount: retainedEarnings,
      })
    }

    // Convert maps to arrays and filter out zero balances
    const assets = Array.from(assetMap.values())
      .filter((acc) => Math.abs(acc.amount) > 0.01)
      .sort((a, b) => a.code.localeCompare(b.code))

    const liabilities = Array.from(liabilityMap.values())
      .filter((acc) => Math.abs(acc.amount) > 0.01)
      .sort((a, b) => a.code.localeCompare(b.code))

    const equity = Array.from(equityMap.values())
      .filter((acc) => Math.abs(acc.amount) > 0.01)
      .sort((a, b) => a.code.localeCompare(b.code))

    // Calculate totals
    const totalAssets = assets.reduce((sum, acc) => sum + acc.amount, 0)
    const totalLiabilities = liabilities.reduce((sum, acc) => sum + acc.amount, 0)
    const totalEquity = equity.reduce((sum, acc) => sum + acc.amount, 0)

    // Validate accounting equation: Assets = Liabilities + Equity
    const isBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01

    const reportData = {
      assets,
      liabilities,
      equity,
      totalAssets,
      totalLiabilities,
      totalEquity,
      isBalanced,
    }

    // Generate Excel buffer
    const buffer = await generateBalanceSheetExcel(reportData)

    // Format date for filename
    const dateStr = asOfDate || new Date().toISOString().split('T')[0]

    // Return Excel file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="balance-sheet-${dateStr}.xlsx"`,
      },
    })
  } catch (error: any) {

    // Handle auth errors
    if (error.name === 'AuthError') {
      return NextResponse.json(
        { success: false, error: error.message || 'กรุณาเข้าสู่ระบบ' },
        { status: error.statusCode || 401 }
      )
    }

    // Handle other errors
    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการส่งออกงบดุลเป็น Excel',
      },
      { status: 500 }
    )
  }
}
