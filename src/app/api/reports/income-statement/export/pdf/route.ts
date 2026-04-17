/**
 * Income Statement PDF Export API Route
 * เส้นทาง API สำหรับส่งออกรายงานงบกำไรขาดทุนเป็น PDF
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-utils'
import { prisma } from '@/lib/db'
import { generateIncomeStatementPDF } from '@/lib/pdf-generator'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    // Fetch revenue accounts
    const revenueAccounts = await prisma.chartOfAccount.findMany({
      where: {
        type: 'REVENUE',
        isActive: true,
        isDetail: true
      },
      orderBy: {
        code: 'asc'
      }
    })

    // Fetch expense accounts
    const expenseAccounts = await prisma.chartOfAccount.findMany({
      where: {
        type: 'EXPENSE',
        isActive: true,
        isDetail: true
      },
      orderBy: {
        code: 'asc'
      }
    })

    // Calculate revenue amounts
    const revenueData = await Promise.all(
      revenueAccounts.map(async (account) => {
        const result = await prisma.$queryRaw`
          SELECT
            SUM(CASE WHEN debit > 0 THEN debit ELSE 0 END) as totalDebit,
            SUM(CASE WHEN credit > 0 THEN credit ELSE 0 END) as totalCredit
          FROM JournalLine
          WHERE accountId = ${account.id}
          AND entryId IN (
            SELECT id FROM JournalEntry
            WHERE date >= ${start}
            AND date <= ${end}
            AND status != 'REVERSED'
          )
        ` as any[]

        const amounts = result[0] || { totalDebit: 0, totalCredit: 0 }
        // Revenue accounts normally have credit balances
        const amount = (amounts.totalCredit || 0) - (amounts.totalDebit || 0)

        return {
          account: account.name,
          amount: amount > 0 ? amount : 0
        }
      })
    )

    // Calculate expense amounts
    const expenseData = await Promise.all(
      expenseAccounts.map(async (account) => {
        const result = await prisma.$queryRaw`
          SELECT
            SUM(CASE WHEN debit > 0 THEN debit ELSE 0 END) as totalDebit,
            SUM(CASE WHEN credit > 0 THEN credit ELSE 0 END) as totalCredit
          FROM JournalLine
          WHERE accountId = ${account.id}
          AND entryId IN (
            SELECT id FROM JournalEntry
            WHERE date >= ${start}
            AND date <= ${end}
            AND status != 'REVERSED'
          )
        ` as any[]

        const amounts = result[0] || { totalDebit: 0, totalCredit: 0 }
        // Expense accounts normally have debit balances
        const amount = (amounts.totalDebit || 0) - (amounts.totalCredit || 0)

        return {
          account: account.name,
          amount: amount > 0 ? amount : 0
        }
      })
    )

    // Calculate totals
    const totalRevenue = revenueData.reduce((sum, item) => sum + item.amount, 0)
    const totalExpense = expenseData.reduce((sum, item) => sum + item.amount, 0)
    const netIncome = totalRevenue - totalExpense

    // Build report data
    const reportData: any[] = []

    // Revenue section
    reportData.push({ category: 'REVENUE / รายได้', account: '', amount: '' })
    revenueData.forEach((item) => {
      reportData.push({
        category: '',
        account: `  ${item.account}`,
        amount: item.amount
      })
    })
    reportData.push({
      category: '',
      account: 'Total Revenue / รายได้รวม',
      amount: totalRevenue
    })

    // Expense section
    reportData.push({ category: 'EXPENSE / ค่าใช้จ่าย', account: '', amount: '' })
    expenseData.forEach((item) => {
      reportData.push({
        category: '',
        account: `  ${item.account}`,
        amount: item.amount
      })
    })
    reportData.push({
      category: '',
      account: 'Total Expenses / ค่าใช้จ่ายรวม',
      amount: totalExpense
    })

    // Net income
    reportData.push({
      category: '',
      account: 'Net Income / กำไรสุทธิ',
      amount: netIncome
    })

    const reportDataFormatted = {
      title: 'INCOME STATEMENT',
      titleTh: 'งบกำไรขาดทุน',
      startDate: start,
      endDate: end,
      columns: ['Description / รายการ', 'Amount / จำนวนเงิน'],
      data: reportData,
      totals: {
        totalRevenue,
        totalExpense,
        netIncome
      }
    }

    // Generate PDF
    const pdfBytes = await generateIncomeStatementPDF(reportDataFormatted)

    // Return PDF file
    const filename = `income-statement-${startDate}-to-${endDate}.pdf`
    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
