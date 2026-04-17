/**
 * Trial Balance PDF Export API Route
 * เส้นทาง API สำหรับส่งออกรายงานงบทดลองเป็น PDF
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-utils'
import { prisma } from '@/lib/db'
import { generateTrialBalancePDF } from '@/lib/pdf-generator'

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

    if (!endDate) {
      return NextResponse.json(
        { error: 'End date is required' },
        { status: 400 }
      )
    }

    // Fetch trial balance data
    const accounts = await prisma.chartOfAccount.findMany({
      where: {
        isActive: true,
        isDetail: true
      },
      include: {
        _count: {
          select: {
            journalLines: true
          }
        }
      },
      orderBy: {
        code: 'asc'
      }
    })

    // Calculate balances for each account
    const trialBalanceData = await Promise.all(
      accounts.map(async (account) => {
        // Get all journal lines for this account within the date range
        const journalLines = await prisma.$queryRaw`
          SELECT
            SUM(CASE WHEN debit > 0 THEN debit ELSE 0 END) as totalDebit,
            SUM(CASE WHEN credit > 0 THEN credit ELSE 0 END) as totalCredit
          FROM JournalLine
          WHERE accountId = ${account.id}
          AND entryId IN (
            SELECT id FROM JournalEntry
            WHERE date >= ${startDate ? new Date(startDate) : new Date(0)}
            AND date <= ${new Date(endDate!)}
            AND status != 'REVERSED'
          )
        ` as any[]

        const result = journalLines[0] || { totalDebit: 0, totalCredit: 0 }

        // Calculate balance based on account type
        let debitBalance = 0
        let creditBalance = 0

        if (
          account.type === 'ASSET' ||
          account.type === 'EXPENSE'
        ) {
          // Normal debit balance
          debitBalance = (result.totalDebit || 0) - (result.totalCredit || 0)
          if (debitBalance < 0) {
            creditBalance = Math.abs(debitBalance)
            debitBalance = 0
          }
        } else {
          // Normal credit balance
          creditBalance = (result.totalCredit || 0) - (result.totalDebit || 0)
          if (creditBalance < 0) {
            debitBalance = Math.abs(creditBalance)
            creditBalance = 0
          }
        }

        return {
          code: account.code,
          account: account.name,
          debit: debitBalance > 0 ? debitBalance : 0,
          credit: creditBalance > 0 ? creditBalance : 0
        }
      })
    )

    // Filter out accounts with zero balances
    const filteredData = trialBalanceData.filter(
      (item) => item.debit > 0 || item.credit > 0
    )

    // Calculate totals
    const totalDebit = filteredData.reduce((sum, item) => sum + item.debit, 0)
    const totalCredit = filteredData.reduce((sum, item) => sum + item.credit, 0)

    const reportData = {
      title: 'TRIAL BALANCE',
      titleTh: 'งบทดลอง',
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: new Date(endDate!),
      columns: ['Code\nรหัส', 'Account\nชื่อบัญชี', 'Debit\nเดบิต', 'Credit\nเครดิต'],
      data: filteredData,
      totals: {
        totalDebit,
        totalCredit
      }
    }

    // Generate PDF
    const pdfBytes = await generateTrialBalancePDF(reportData)

    // Return PDF file
    const filename = `trial-balance-${endDate}.pdf`
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
