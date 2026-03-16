import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/api-auth'
import { generateIncomeStatementExcel } from '@/lib/excel-export'

/**
 * GET /api/reports/income-statement/export/excel
 * Export income statement report to Excel format
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth()

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build date filters
    const now = new Date()
    const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1)
    const end = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0)

    // Set end date to end of day
    end.setHours(23, 59, 59, 999)

    // Fetch all posted journal entries within the date range
    const journalEntries = await prisma.journalEntry.findMany({
      where: {
        status: 'POSTED',
        date: {
          gte: start,
          lte: end,
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

    // Calculate balances for revenue and expense accounts
    interface AccountBalance {
      code: string
      name: string
      nameEn?: string | null
      amount: number
    }

    const revenueMap = new Map<string, AccountBalance>()
    const expenseMap = new Map<string, AccountBalance>()

    // Process all journal lines
    for (const entry of journalEntries) {
      for (const line of entry.lines) {
        const account = line.account

        // Skip inactive accounts
        if (!account.isActive) continue

        // Only process revenue and expense accounts
        if (account.type !== 'REVENUE' && account.type !== 'EXPENSE') {
          continue
        }

        const targetMap = account.type === 'REVENUE' ? revenueMap : expenseMap

        if (!targetMap.has(account.id)) {
          targetMap.set(account.id, {
            code: account.code,
            name: account.name,
            nameEn: account.nameEn,
            amount: 0,
          })
        }

        const balance = targetMap.get(account.id)!

        // For revenue: credit increases, debit decreases
        // For expenses: debit increases, credit decreases
        if (account.type === 'REVENUE') {
          balance.amount += line.credit - line.debit
        } else {
          balance.amount += line.debit - line.credit
        }
      }
    }

    // Convert maps to arrays and filter out zero balances
    const revenue = Array.from(revenueMap.values())
      .filter((acc) => Math.abs(acc.amount) > 0.01)
      .sort((a, b) => a.code.localeCompare(b.code))

    const expenses = Array.from(expenseMap.values())
      .filter((acc) => Math.abs(acc.amount) > 0.01)
      .sort((a, b) => a.code.localeCompare(b.code))

    // Calculate totals
    const totalRevenue = revenue.reduce((sum, acc) => sum + acc.amount, 0)
    const totalExpenses = expenses.reduce((sum, acc) => sum + acc.amount, 0)
    const netIncome = totalRevenue - totalExpenses

    const reportData = {
      revenue,
      expenses,
      totalRevenue,
      totalExpenses,
      netIncome,
    }

    // Generate Excel buffer
    const buffer = await generateIncomeStatementExcel(reportData)

    // Format dates for filename
    const startStr = startDate || start.toISOString().split('T')[0]
    const endStr = endDate || end.toISOString().split('T')[0]

    // Return Excel file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="income-statement-${startStr}-to-${endStr}.xlsx"`,
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
        error: 'เกิดข้อผิดพลาดในการส่งออกงบกำไรขาดทุนเป็น Excel',
      },
      { status: 500 }
    )
  }
}
