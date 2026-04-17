import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/api-utils'

/**
 * GET /api/reports/cash-flow
 * Generate cash flow statement (indirect method)
 * Categories: Operating, Investing, Financing activities
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build date filters
    const now = new Date()
    const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1)
    const end = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0)
    end.setHours(23, 59, 59, 999)

    // Previous period for comparison (for working capital changes)
    const prevEnd = new Date(start)
    prevEnd.setDate(prevEnd.getDate() - 1)
    prevEnd.setHours(23, 59, 59, 999)

    // Cash account codes (typically 1xxx assets that are cash/cash-equivalents)
    const CASH_ACCOUNT_CODES = ['1100', '1101', '1102', '1103', '1104', '1105', '1106', '1107', '1108', '1109']
    const WORKING_CAPITAL_TYPES = ['ASSET', 'LIABILITY']

    // Helper to get account balance at a point in time
    async function getAccountBalanceAtDate(accountId: string, date: Date): Promise<number> {
      const result = await prisma.journalLine.aggregate({
        where: {
          accountId,
          entry: {
            status: 'POSTED',
            date: { lte: date },
          },
        },
        _sum: { debit: true, credit: true },
      })
      const debit = result._sum.debit || 0
      const credit = result._sum.credit || 0
      return debit - credit
    }

    // Get all posted journal entries in the period
    const journalEntries = await prisma.journalEntry.findMany({
      where: {
        status: 'POSTED',
        date: { gte: start, lte: end },
      },
      include: {
        lines: {
          include: { account: true },
        },
      },
      orderBy: { date: 'asc' },
    })

    // Get all accounts
    const accounts = await prisma.account.findMany({
      where: { isActive: true },
    })
    const accountMap = new Map(accounts.map(a => [a.id, a]))

    // Identify cash accounts
    const cashAccountIds = accounts
      .filter(a => CASH_ACCOUNT_CODES.some(code => a.code.startsWith(code)))
      .map(a => a.id)

    // Calculate cash flows
    let operatingNetIncome = 0
    let investingOutflows = 0
    let investingInflows = 0
    let financingOutflows = 0
    let financingInflows = 0

    // Working capital changes tracking
    const wcChanges = new Map<string, { current: number; prior: number }>()

    for (const entry of journalEntries) {
      for (const line of entry.lines) {
        const account = line.account
        if (!account.isActive) continue

        const isDebit = line.debit > 0
        const isCredit = line.credit > 0
        const amount = line.debit || line.credit

        // Cash flows by account type and cash account involvement
        if (cashAccountIds.includes(account.id)) {
          // This line affects cash
          const otherSide = entry.lines.find(l => l.id !== line.id)
          const otherAccount = otherSide ? accountMap.get(otherSide.accountId) : null

          if (otherAccount) {
            if (otherAccount.type === 'ASSET' && !cashAccountIds.includes(otherAccount.id)) {
              // Buying/selling assets (investing)
              if (isDebit) investingInflows += amount
              else investingOutflows += amount
            } else if (otherAccount.type === 'LIABILITY' || otherAccount.type === 'EQUITY') {
              // Financing activities
              if (isDebit) financingOutflows += amount
              else financingInflows += amount
            } else if (otherAccount.type === 'REVENUE' || otherAccount.type === 'EXPENSE') {
              // Operating activities (direct cash from operations)
              if (isDebit) operatingNetIncome -= amount
              else operatingNetIncome += amount
            }
          }
        } else if (account.type === 'REVENUE') {
          // Revenue earned (credit = increase)
          if (isCredit) operatingNetIncome += amount
          else operatingNetIncome -= amount
        } else if (account.type === 'EXPENSE') {
          // Expenses incurred (debit = increase)
          if (isDebit) operatingNetIncome -= amount
          else operatingNetIncome += amount
        }

        // Track working capital changes
        if (WORKING_CAPITAL_TYPES.includes(account.type) && !cashAccountIds.includes(account.id)) {
          if (!wcChanges.has(account.id)) {
            wcChanges.set(account.id, { current: 0, prior: 0 })
          }
          const wc = wcChanges.get(account.id)!
          // Current period
          if (account.type === 'ASSET') {
            if (isDebit) wc.current += amount
            else wc.current -= amount
          } else {
            // Liability
            if (isCredit) wc.current += amount
            else wc.current -= amount
          }
        }
      }
    }

    // Calculate working capital changes
    const workingCapitalChanges: Array<{ code: string; name: string; change: number }> = []
    let totalWorkingCapitalChange = 0

    for (const [accountId, wc] of wcChanges) {
      const account = accountMap.get(accountId)
      if (!account) continue

      // Get prior period balance
      wc.prior = await getAccountBalanceAtDate(accountId, prevEnd)

      // Change = current period movement only (not cumulative balance)
      // For assets: increase = cash outflow, decrease = cash inflow
      // For liabilities: increase = cash inflow, decrease = cash outflow
      const assetChange = account.type === 'ASSET' ? -wc.current : wc.current
      totalWorkingCapitalChange += assetChange

      if (Math.abs(wc.current) > 1) { // Only show significant changes (>1 satang)
        workingCapitalChanges.push({
          code: account.code,
          name: account.name,
          change: assetChange,
        })
      }
    }

    // Net cash from operating = net income + working capital changes
    const netOperatingCash = operatingNetIncome + totalWorkingCapitalChange

    // Net cash from investing
    const netInvestingCash = investingInflows - investingOutflows

    // Net cash from financing
    const netFinancingCash = financingInflows - financingOutflows

    // Total net cash change
    const totalNetCash = netOperatingCash + netInvestingCash + netFinancingCash

    // Beginning cash balance
    let beginningCash = 0
    for (const cashId of cashAccountIds) {
      beginningCash += await getAccountBalanceAtDate(cashId, prevEnd)
    }

    // Ending cash balance
    let endingCash = beginningCash
    for (const entry of journalEntries) {
      for (const line of entry.lines) {
        if (cashAccountIds.includes(line.accountId)) {
          endingCash += (line.debit || 0) - (line.credit || 0)
        }
      }
    }

    const data = {
      operating: {
        netIncome: operatingNetIncome,
        workingCapitalChanges: workingCapitalChanges.sort((a, b) => Math.abs(b.change) - Math.abs(a.change)),
        totalWorkingCapitalChange: totalWorkingCapitalChange,
        netCash: netOperatingCash,
      },
      investing: {
        inflows: investingInflows,
        outflows: investingOutflows,
        netCash: netInvestingCash,
      },
      financing: {
        inflows: financingInflows,
        outflows: financingOutflows,
        netCash: netFinancingCash,
      },
      summary: {
        netChange: totalNetCash,
        beginningCash,
        endingCash,
        variance: Math.abs(endingCash - beginningCash - totalNetCash),
      },
    }

    return NextResponse.json({
      success: true,
      period: { startDate: start.toISOString(), endDate: end.toISOString() },
      data,
    })
  } catch (error: any) {
    if (error.name === 'AuthError') {
      return NextResponse.json(
        { success: false, error: error.message || 'กรุณาเข้าสู่ระบบ' },
        { status: error.statusCode || 401 }
      )
    }
    console.error('Cash flow statement error:', error)
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการสร้างงบกระแสเงินสด' },
      { status: 500 }
    )
  }
}
