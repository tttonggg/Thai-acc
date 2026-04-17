/**
 * Balance Sheet PDF Export API Route
 * เส้นทาง API สำหรับส่งออกรายงานงบดุลเป็น PDF
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-utils'
import { prisma } from '@/lib/db'
import { generateBalanceSheetPDF } from '@/lib/pdf-generator'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const endDate = searchParams.get('endDate')

    if (!endDate) {
      return NextResponse.json(
        { error: 'End date is required' },
        { status: 400 }
      )
    }

    const end = new Date(endDate)

    // Fetch all balance sheet accounts
    const accounts = await prisma.chartOfAccount.findMany({
      where: {
        type: {
          in: ['ASSET', 'LIABILITY', 'EQUITY']
        },
        isActive: true,
        isDetail: true
      },
      orderBy: [
        { type: 'asc' },
        { code: 'asc' }
      ]
    })

    // Calculate balances for each account
    const balanceSheetData = await Promise.all(
      accounts.map(async (account) => {
        const result = await prisma.$queryRaw`
          SELECT
            SUM(CASE WHEN debit > 0 THEN debit ELSE 0 END) as totalDebit,
            SUM(CASE WHEN credit > 0 THEN credit ELSE 0 END) as totalCredit
          FROM JournalLine
          WHERE accountId = ${account.id}
          AND entryId IN (
            SELECT id FROM JournalEntry
            WHERE date <= ${end}
            AND status != 'REVERSED'
          )
        ` as any[]

        const amounts = result[0] || { totalDebit: 0, totalCredit: 0 }

        // Calculate balance based on account type
        let amount = 0

        if (account.type === 'ASSET' || account.type === 'EXPENSE') {
          // Normal debit balance
          amount = (amounts.totalDebit || 0) - (amounts.totalCredit || 0)
        } else {
          // Normal credit balance
          amount = (amounts.totalCredit || 0) - (amounts.totalDebit || 0)
        }

        return {
          type: account.type,
          code: account.code,
          account: account.name,
          amount: amount > 0 ? amount : 0
        }
      })
    )

    // Filter out accounts with zero balances
    const filteredData = balanceSheetData.filter((item) => item.amount > 0)

    // Calculate totals by type
    const totalAssets = filteredData
      .filter((item) => item.type === 'ASSET')
      .reduce((sum, item) => sum + item.amount, 0)

    const totalLiabilities = filteredData
      .filter((item) => item.type === 'LIABILITY')
      .reduce((sum, item) => sum + item.amount, 0)

    const totalEquity = filteredData
      .filter((item) => item.type === 'EQUITY')
      .reduce((sum, item) => sum + item.amount, 0)

    const reportData = {
      title: 'BALANCE SHEET',
      titleTh: 'งบดุล',
      endDate: end,
      columns: ['Code\nรหัส', 'Account\nชื่อบัญชี', 'Amount\nจำนวนเงิน'],
      data: filteredData.map((item) => ({
        type: item.type,
        category: item.type === 'ASSET' ? 'Assets' : item.type === 'LIABILITY' ? 'Liabilities' : 'Equity',
        account: item.account,
        amount: item.amount
      })),
      totals: {
        totalAssets,
        totalLiabilities,
        totalEquity,
        totalLiabilitiesEquity: totalLiabilities + totalEquity
      }
    }

    // Generate PDF
    const pdfBytes = await generateBalanceSheetPDF(reportData)

    // Return PDF file
    const filename = `balance-sheet-${endDate}.pdf`
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
