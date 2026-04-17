import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/api-utils'
import { z } from 'zod'

// Validation schema for custom report configuration
const customReportSchema = z.object({
  reportType: z.enum([
    'TRIAL_BALANCE',
    'BALANCE_SHEET',
    'INCOME_STATEMENT',
    'AGING_AR',
    'AGING_AP',
    'STOCK_REPORT',
  ]),
  reportName: z.string(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  comparePrevious: z.boolean().default(false),
  includeZeroBalances: z.boolean().default(false),
  accountLevel: z.enum(['detail', 'summary']).default('detail'),
  columnAccountCode: z.boolean().default(true),
  columnAccountName: z.boolean().default(true),
  columnAccountNameEn: z.boolean().default(false),
  columnOpeningBalance: z.boolean().default(false),
  columnDebits: z.boolean().default(true),
  columnCredits: z.boolean().default(true),
  columnClosingBalance: z.boolean().default(true),
  columnBudget: z.boolean().default(false),
  columnVariance: z.boolean().default(false),
  filterAccountType: z.string().optional(),
  filterAccountFrom: z.string().optional(),
  filterAccountTo: z.string().optional(),
  outputFormat: z.enum(['preview', 'pdf', 'excel']).default('preview'),
  notes: z.string().optional(),
})

/**
 * POST /api/reports/custom
 * Generate custom report based on user configuration
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth()

    // Parse and validate request body
    const body = await request.json()
    const config = customReportSchema.parse(body)

    // Build date filter
    const dateFilter = config.dateTo ? new Date(config.dateTo) : new Date()
    dateFilter.setHours(23, 59, 59, 999)

    let reportData: any = {}

    // Generate report based on type
    switch (config.reportType) {
      case 'TRIAL_BALANCE':
        reportData = await generateTrialBalance(config, dateFilter)
        break
      case 'BALANCE_SHEET':
        reportData = await generateBalanceSheet(config, dateFilter)
        break
      case 'INCOME_STATEMENT':
        reportData = await generateIncomeStatement(config, dateFilter)
        break
      case 'AGING_AR':
        reportData = await generateAgingAR(config, dateFilter)
        break
      case 'AGING_AP':
        reportData = await generateAgingAP(config, dateFilter)
        break
      case 'STOCK_REPORT':
        reportData = await generateStockReport(config, dateFilter)
        break
      default:
        throw new Error('Invalid report type')
    }

    // Apply column filters
    reportData = applyColumnFilters(reportData, config)

    // Handle output format
    if (config.outputFormat === 'preview') {
      return NextResponse.json({
        success: true,
        data: reportData,
      })
    } else if (config.outputFormat === 'pdf') {
      // For PDF, redirect to the appropriate PDF export endpoint
      const endpoint = getReportEndpoint(config.reportType)
      const url = new URL(endpoint, request.url)
      url.searchParams.set('asOfDate', dateFilter.toISOString())

      // Pass filter parameters
      if (config.filterAccountType) {
        url.searchParams.set('accountType', config.filterAccountType)
      }
      if (config.filterAccountFrom) {
        url.searchParams.set('accountFrom', config.filterAccountFrom)
      }
      if (config.filterAccountTo) {
        url.searchParams.set('accountTo', config.filterAccountTo)
      }

      // Fetch PDF from export endpoint
      const pdfResponse = await fetch(url.toString())
      const pdfBlob = await pdfResponse.blob()

      return new NextResponse(pdfBlob, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${config.reportName}.pdf"`,
        },
      })
    } else if (config.outputFormat === 'excel') {
      // For Excel, redirect to the appropriate Excel export endpoint
      const endpoint = `${getReportEndpoint(config.reportType)}/export/excel`
      const url = new URL(endpoint, request.url)
      url.searchParams.set('asOfDate', dateFilter.toISOString())

      // Pass filter parameters
      if (config.filterAccountType) {
        url.searchParams.set('accountType', config.filterAccountType)
      }
      if (config.filterAccountFrom) {
        url.searchParams.set('accountFrom', config.filterAccountFrom)
      }
      if (config.filterAccountTo) {
        url.searchParams.set('accountTo', config.filterAccountTo)
      }

      // Fetch Excel from export endpoint
      const excelResponse = await fetch(url.toString())
      const excelBlob = await excelResponse.blob()

      return new NextResponse(excelBlob, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${config.reportName}.xlsx"`,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: reportData,
    })
  } catch (error: any) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'ข้อมูลไม่ถูกต้อง: ' + error.issues.map((e) => e.message).join(', '),
        },
        { status: 400 }
      )
    }

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
        error: error.message || 'เกิดข้อผิดพลาดในการสร้างรายงาน',
      },
      { status: 500 }
    )
  }
}

/**
 * Generate Trial Balance report
 */
async function generateTrialBalance(config: any, dateFilter: Date) {
  const whereClause: any = {
    status: 'POSTED',
    date: {
      lte: dateFilter,
    },
  }

  // Add date range filter
  if (config.dateFrom) {
    const fromDate = new Date(config.dateFrom)
    fromDate.setHours(0, 0, 0, 0)
    whereClause.date.gte = fromDate
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
  })

  // Calculate balances
  const accountBalances = new Map<string, any>()

  for (const entry of journalEntries) {
    for (const line of entry.lines) {
      if (!line.account.isActive) continue

      const accountId = line.accountId
      const account = line.account

      // Apply account type filter
      if (config.filterAccountType && account.type !== config.filterAccountType) {
        continue
      }

      // Apply account range filter
      if (config.filterAccountFrom && account.code < config.filterAccountFrom) {
        continue
      }
      if (config.filterAccountTo && account.code > config.filterAccountTo) {
        continue
      }

      if (!accountBalances.has(accountId)) {
        accountBalances.set(accountId, {
          code: account.code,
          name: account.name,
          nameEn: account.nameEn,
          type: account.type,
          debit: 0,
          credit: 0,
          balance: 0,
        })
      }

      const balance = accountBalances.get(accountId)!
      balance.debit += line.debit
      balance.credit += line.credit
    }
  }

  // Calculate net balance for each account
  const accounts = Array.from(accountBalances.values()).map((account) => {
    let balance = 0
    let debitBalance = 0
    let creditBalance = 0

    if (account.type === 'ASSET' || account.type === 'EXPENSE') {
      balance = account.debit - account.credit
      if (balance >= 0) {
        debitBalance = balance
        creditBalance = 0
      } else {
        debitBalance = 0
        creditBalance = Math.abs(balance)
      }
    } else {
      balance = account.credit - account.debit
      if (balance >= 0) {
        debitBalance = 0
        creditBalance = balance
      } else {
        debitBalance = Math.abs(balance)
        creditBalance = 0
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
    }
  })

  // Filter out zero balances if requested
  const filteredAccounts = config.includeZeroBalances
    ? accounts
    : accounts.filter((acc) => Math.abs(acc.balance) > 0.01)

  // Sort by account code
  filteredAccounts.sort((a, b) => a.code.localeCompare(b.code))

  // Calculate totals
  const totalDebit = filteredAccounts.reduce((sum, acc) => sum + acc.debit, 0)
  const totalCredit = filteredAccounts.reduce((sum, acc) => sum + acc.credit, 0)

  return {
    reportType: 'TRIAL_BALANCE',
    asOfDate: dateFilter.toISOString(),
    accounts: filteredAccounts,
    totals: {
      debit: totalDebit,
      credit: totalCredit,
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
    },
  }
}

/**
 * Generate Balance Sheet report
 */
async function generateBalanceSheet(config: any, dateFilter: Date) {
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
  })

  const assetMap = new Map<string, any>()
  const liabilityMap = new Map<string, any>()
  const equityMap = new Map<string, any>()

  for (const entry of journalEntries) {
    for (const line of entry.lines) {
      const account = line.account
      if (!account.isActive) continue

      // Apply account type filter
      if (config.filterAccountType && account.type !== config.filterAccountType) {
        continue
      }

      // Apply account range filter
      if (config.filterAccountFrom && account.code < config.filterAccountFrom) {
        continue
      }
      if (config.filterAccountTo && account.code > config.filterAccountTo) {
        continue
      }

      let targetMap: Map<string, any>
      if (account.type === 'ASSET') {
        targetMap = assetMap
      } else if (account.type === 'LIABILITY') {
        targetMap = liabilityMap
      } else if (account.type === 'EQUITY') {
        targetMap = equityMap
      } else {
        continue
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
      if (account.type === 'ASSET') {
        balance.amount += line.debit - line.credit
      } else {
        balance.amount += line.credit - line.debit
      }
    }
  }

  // Calculate retained earnings
  const revenueEntries = await prisma.journalLine.findMany({
    where: {
      entry: {
        status: 'POSTED',
        date: { lte: dateFilter },
      },
      account: {
        type: 'REVENUE',
        isActive: true,
      },
    },
  })

  const expenseEntries = await prisma.journalLine.findMany({
    where: {
      entry: {
        status: 'POSTED',
        date: { lte: dateFilter },
      },
      account: {
        type: 'EXPENSE',
        isActive: true,
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

  if (Math.abs(retainedEarnings) > 0.01) {
    equityMap.set('RETAINED_EARNINGS', {
      code: '3999',
      name: 'กำไรสุทธิสะสม (Retained Earnings)',
      nameEn: 'Retained Earnings',
      amount: retainedEarnings,
    })
  }

  const assets = Array.from(assetMap.values())
    .filter((acc) => config.includeZeroBalances || Math.abs(acc.amount) > 0.01)
    .sort((a, b) => a.code.localeCompare(b.code))

  const liabilities = Array.from(liabilityMap.values())
    .filter((acc) => config.includeZeroBalances || Math.abs(acc.amount) > 0.01)
    .sort((a, b) => a.code.localeCompare(b.code))

  const equity = Array.from(equityMap.values())
    .filter((acc) => config.includeZeroBalances || Math.abs(acc.amount) > 0.01)
    .sort((a, b) => a.code.localeCompare(b.code))

  const totalAssets = assets.reduce((sum, acc) => sum + acc.amount, 0)
  const totalLiabilities = liabilities.reduce((sum, acc) => sum + acc.amount, 0)
  const totalEquity = equity.reduce((sum, acc) => sum + acc.amount, 0)

  return {
    reportType: 'BALANCE_SHEET',
    asOfDate: dateFilter.toISOString(),
    assets,
    liabilities,
    equity,
    totals: {
      assets: totalAssets,
      liabilities: totalLiabilities,
      equity: totalEquity,
      isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
    },
  }
}

/**
 * Generate Income Statement report
 */
async function generateIncomeStatement(config: any, dateFilter: Date) {
  const whereClause: any = {
    status: 'POSTED',
    date: {
      lte: dateFilter,
    },
  }

  if (config.dateFrom) {
    const fromDate = new Date(config.dateFrom)
    fromDate.setHours(0, 0, 0, 0)
    whereClause.date.gte = fromDate
  }

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
  })

  const revenueMap = new Map<string, any>()
  const expenseMap = new Map<string, any>()

  for (const entry of journalEntries) {
    for (const line of entry.lines) {
      const account = line.account
      if (!account.isActive) continue

      if (account.type === 'REVENUE') {
        if (!revenueMap.has(account.id)) {
          revenueMap.set(account.id, {
            code: account.code,
            name: account.name,
            nameEn: account.nameEn,
            amount: 0,
          })
        }
        const revenue = revenueMap.get(account.id)!
        revenue.amount += line.credit - line.debit
      } else if (account.type === 'EXPENSE') {
        if (!expenseMap.has(account.id)) {
          expenseMap.set(account.id, {
            code: account.code,
            name: account.name,
            nameEn: account.nameEn,
            amount: 0,
          })
        }
        const expense = expenseMap.get(account.id)!
        expense.amount += line.debit - line.credit
      }
    }
  }

  const revenues = Array.from(revenueMap.values())
    .filter((acc) => config.includeZeroBalances || Math.abs(acc.amount) > 0.01)
    .sort((a, b) => a.code.localeCompare(b.code))

  const expenses = Array.from(expenseMap.values())
    .filter((acc) => config.includeZeroBalances || Math.abs(acc.amount) > 0.01)
    .sort((a, b) => a.code.localeCompare(b.code))

  const totalRevenue = revenues.reduce((sum, acc) => sum + acc.amount, 0)
  const totalExpenses = expenses.reduce((sum, acc) => sum + acc.amount, 0)
  const netIncome = totalRevenue - totalExpenses

  return {
    reportType: 'INCOME_STATEMENT',
    asOfDate: dateFilter.toISOString(),
    revenues,
    expenses,
    totals: {
      revenue: totalRevenue,
      expenses: totalExpenses,
      netIncome,
    },
  }
}

/**
 * Generate AR Aging report
 */
async function generateAgingAR(config: any, dateFilter: Date) {
  const customers = await prisma.customer.findMany({
    where: { isActive: true },
    include: {
      invoices: {
        where: {
          status: { in: ['ISSUED', 'OVERDUE'] },
        },
      },
    },
  })

  const agingData = customers.map((customer) => {
    const agingBuckets = {
      current: 0,
      days30: 0,
      days60: 0,
      days90: 0,
      days90Plus: 0,
    }

    let totalOutstanding = 0

    for (const invoice of customer.invoices) {
      const invoiceDate = new Date(invoice.date)
      const daysOverdue = Math.floor((dateFilter.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24))
      const outstandingAmount = invoice.totalAmount - (invoice.paidAmount || 0)

      totalOutstanding += outstandingAmount

      if (daysOverdue <= 0) {
        agingBuckets.current += outstandingAmount
      } else if (daysOverdue <= 30) {
        agingBuckets.days30 += outstandingAmount
      } else if (daysOverdue <= 60) {
        agingBuckets.days60 += outstandingAmount
      } else if (daysOverdue <= 90) {
        agingBuckets.days90 += outstandingAmount
      } else {
        agingBuckets.days90Plus += outstandingAmount
      }
    }

    return {
      customerId: customer.id,
      customerCode: customer.code,
      customerName: customer.name,
      ...agingBuckets,
      totalOutstanding,
    }
  })

  return {
    reportType: 'AGING_AR',
    asOfDate: dateFilter.toISOString(),
    customers: agingData.filter((c) => config.includeZeroBalances || c.totalOutstanding > 0),
  }
}

/**
 * Generate AP Aging report
 */
async function generateAgingAP(config: any, dateFilter: Date) {
  const vendors = await prisma.vendor.findMany({
    where: { isActive: true },
    include: {
      purchaseInvoices: {
        where: {
          status: { in: ['ISSUED', 'OVERDUE'] },
        },
      },
    },
  })

  const agingData = vendors.map((vendor) => {
    const agingBuckets = {
      current: 0,
      days30: 0,
      days60: 0,
      days90: 0,
      days90Plus: 0,
    }

    let totalOutstanding = 0

    for (const invoice of vendor.purchaseInvoices) {
      const invoiceDate = new Date(invoice.date)
      const daysOverdue = Math.floor((dateFilter.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24))
      const outstandingAmount = invoice.totalAmount - (invoice.paidAmount || 0)

      totalOutstanding += outstandingAmount

      if (daysOverdue <= 0) {
        agingBuckets.current += outstandingAmount
      } else if (daysOverdue <= 30) {
        agingBuckets.days30 += outstandingAmount
      } else if (daysOverdue <= 60) {
        agingBuckets.days60 += outstandingAmount
      } else if (daysOverdue <= 90) {
        agingBuckets.days90 += outstandingAmount
      } else {
        agingBuckets.days90Plus += outstandingAmount
      }
    }

    return {
      vendorId: vendor.id,
      vendorCode: vendor.code,
      vendorName: vendor.name,
      ...agingBuckets,
      totalOutstanding,
    }
  })

  return {
    reportType: 'AGING_AP',
    asOfDate: dateFilter.toISOString(),
    vendors: agingData.filter((v) => config.includeZeroBalances || v.totalOutstanding > 0),
  }
}

/**
 * Generate Stock Report
 */
async function generateStockReport(config: any, dateFilter: Date) {
  const stockBalances = await prisma.stockBalance.findMany({
    where: {
      quantity: config.includeZeroBalances ? undefined : { gt: 0 },
    },
    include: {
      product: {
        select: {
          code: true,
          name: true,
          nameEn: true,
        },
      },
      warehouse: {
        select: {
          code: true,
          name: true,
        },
      },
    },
  })

  const stockData = stockBalances.map((stock) => ({
    productCode: stock.product.code,
    productName: stock.product.name,
    productNameEn: stock.product.nameEn,
    warehouseCode: stock.warehouse.code,
    warehouseName: stock.warehouse.name,
    quantity: stock.quantity,
    unitCost: stock.unitCost,
    totalValue: stock.quantity * stock.unitCost,
  }))

  const totalQuantity = stockData.reduce((sum, item) => sum + item.quantity, 0)
  const totalValue = stockData.reduce((sum, item) => sum + item.totalValue, 0)

  return {
    reportType: 'STOCK_REPORT',
    asOfDate: dateFilter.toISOString(),
    items: stockData,
    totals: {
      totalQuantity,
      totalValue,
    },
  }
}

/**
 * Apply column filters to report data
 */
function applyColumnFilters(data: any, config: any) {
  // For now, we'll return all data and let the frontend handle column display
  // This function can be enhanced to strip unwanted columns from the response
  return data
}

/**
 * Get report endpoint for export redirects
 */
function getReportEndpoint(reportType: string): string {
  const endpoints: Record<string, string> = {
    TRIAL_BALANCE: '/api/reports/trial-balance',
    BALANCE_SHEET: '/api/reports/balance-sheet',
    INCOME_STATEMENT: '/api/reports/income-statement',
    AGING_AR: '/api/reports/aging-ar',
    AGING_AP: '/api/reports/aging-ap',
    STOCK_REPORT: '/api/reports/stock',
  }

  return endpoints[reportType] || '/api/reports/trial-balance'
}
