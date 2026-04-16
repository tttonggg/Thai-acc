import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/api-utils'

// GET - Dashboard summary (requires authentication)
export async function GET(request: NextRequest) {
  try {
    // Require authentication - pass request context
    await requireAuth(request)

    const searchParams = request.nextUrl.searchParams
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : null

    // Build date filter
    let startDate: Date
    let endDate: Date

    if (month) {
      startDate = new Date(year, month - 1, 1)
      endDate = new Date(year, month, 0, 23, 59, 59)
    } else {
      startDate = new Date(year, 0, 1)
      endDate = new Date(year, 11, 31, 23, 59, 59)
    }

    // ✅ OPTIMIZED: Execute all independent queries in parallel using Promise.all
    const [
      journalEntries,
      arBalance,
      apBalance,
      monthlyData,
      vatData,
      whtSummary,
      arAging,
      apAging,
      draftInvoices,
      overdueAR,
      pendingVatRecords,
    ] = await Promise.all([
      // 1. Get journal entries for the period
      prisma.journalEntry.findMany({
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
          status: 'POSTED',
        },
        include: {
          lines: {
            include: {
              account: true,
            },
          },
        },
      }),

      // 2. Get accounts receivable balance (parallel)
      prisma.invoice.aggregate({
        where: {
          status: { in: ['ISSUED', 'PARTIAL'] },
          deletedAt: null,
        },
        _sum: {
          totalAmount: true,
          paidAmount: true,
        },
      }),

      // 3. Get accounts payable balance (parallel)
      prisma.purchaseInvoice.aggregate({
        where: {
          status: { in: ['ISSUED', 'PARTIAL'] },
          deletedAt: null,
        },
        _sum: {
          totalAmount: true,
          paidAmount: true,
        },
      }),

      // 4. Get monthly data (optimized - single query)
      getMonthlyDataOptimized(year),

      // 5. Get VAT summary (optimized - single query)
      getMonthlyVatDataOptimized(year),

      // 6. Get WHT summary (parallel)
      getWhtSummary(year, month),

      // 7. Get AR aging (parallel)
      getARAging(),

      // 8. Get AP aging (parallel)
      getAPAging(),

      // 9-11. Quick action counts (parallel)
      prisma.invoice.count({ where: { status: 'DRAFT' } }),
      prisma.invoice.count({
        where: {
          status: { in: ['ISSUED', 'PARTIAL'] },
          dueDate: { lt: new Date() },
        },
      }),

      // Check pending VAT records (parallel)
      (() => {
        const currentMonth = new Date().getMonth() + 1
        const currentYear = new Date().getFullYear()
        return prisma.vatRecord.count({
          where: {
            taxMonth: currentMonth,
            taxYear: currentYear,
            reportStatus: 'PENDING',
          },
        })
      })(),
    ])

    // Calculate revenue and expenses from fetched journal entries
    const revenue = journalEntries.reduce((sum, entry) => {
      return sum + entry.lines.reduce((lineSum, line) => {
        if (line.account?.code?.startsWith('4') && line.credit > 0) {
          return lineSum + line.credit
        }
        return lineSum
      }, 0)
    }, 0)

    const expenses = journalEntries.reduce((sum, entry) => {
      return sum + entry.lines.reduce((lineSum, line) => {
        if (line.account?.code?.startsWith('5') && line.debit > 0) {
          return lineSum + line.debit
        }
        return lineSum
      }, 0)
    }, 0)

    const accountsReceivable = Math.round((arBalance._sum.totalAmount || 0) - (arBalance._sum.paidAmount || 0))
    const accountsPayable = Math.round((apBalance._sum.totalAmount || 0) - (apBalance._sum.paidAmount || 0))

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          revenue: { amount: revenue, change: 0 },
          expenses: { amount: expenses, change: 0 },
          ar: { amount: accountsReceivable, change: 0 },
          ap: { amount: accountsPayable, change: 0 },
        },
        monthlyData,
        vatData,
        whtData: whtSummary,
        arAging: [
          { name: 'ปัจจุบัน', value: arAging.current || 0, color: '#22c55e' },
          { name: '31-60 วัน', value: arAging.days31to60 || 0, color: '#eab308' },
          { name: '61-90 วัน', value: arAging.days61to90 || 0, color: '#f97316' },
          { name: '90+ วัน', value: arAging.over90 || 0, color: '#ef4444' },
        ],
        apAging: [
          { name: 'ปัจจุบัน', value: apAging.current || 0, color: '#22c55e' },
          { name: '31-60 วัน', value: apAging.days31to60 || 0, color: '#eab308' },
          { name: '61-90 วัน', value: apAging.days61to90 || 0, color: '#f97316' },
          { name: '90+ วัน', value: apAging.over90 || 0, color: '#ef4444' },
        ],
        quickActions: {
          draftInvoices: {
            count: draftInvoices,
            label: 'ใบกำกับภาษีร่าง',
            description: 'รายการรอออกใบกำกับภาษี',
            icon: 'FileText',
            color: 'yellow',
            action: '/invoices?status=DRAFT',
          },
          overdueAR: {
            count: overdueAR,
            label: 'ลูกหนี้เกินกำหนด',
            description: 'รายการเกินกำหนดชำระ',
            icon: 'Users',
            color: 'red',
            action: '/invoices?status=OVERDUE',
          },
          pendingVAT: {
            count: pendingVatRecords,
            label: 'รอยื่นภาษี',
            description: 'PP30 ประจำเดือนนี้',
            icon: 'DollarSign',
            color: 'blue',
            action: '/vat?action=file',
          },
        },
      },
    })
  } catch (error: any) {
    console.error('Dashboard API error:', error)
    console.error('Stack:', error?.stack)

    // Check if it's an auth error
    if (error?.name === 'AuthError' || error?.statusCode === 401) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้รับอนุญาต - กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูล: ' + (error?.message || 'Unknown error') },
      { status: 500 }
    )
  }
}

// ✅ OPTIMIZED: Get all monthly data in a single query using aggregation
async function getMonthlyDataOptimized(year: number) {
  const startDate = new Date(year, 0, 1)
  const endDate = new Date(year, 11, 31, 23, 59, 59)
  const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

  // Single query to get all journal entries for the year with their lines and accounts
  const journalEntries = await prisma.journalEntry.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      status: 'POSTED',
    },
    include: {
      lines: {
        include: {
          account: true,
        },
      },
    },
  })

  // Group and aggregate in memory (much faster than 12 separate queries)
  const monthlyData = Array.from({ length: 12 }, (_, m) => {
    const monthStart = new Date(year, m, 1)
    const monthEnd = new Date(year, m + 1, 0, 23, 59, 59)

    const monthEntries = journalEntries.filter(entry => {
      const entryDate = new Date(entry.date)
      return entryDate >= monthStart && entryDate <= monthEnd
    })

    const revenue = monthEntries.reduce((sum, e) =>
      sum + e.lines.reduce((s, l) => l.account?.code?.startsWith('4') && l.credit > 0 ? s + l.credit : s, 0)
    , 0)

    const expense = monthEntries.reduce((sum, e) =>
      sum + e.lines.reduce((s, l) => l.account?.code?.startsWith('5') && l.debit > 0 ? s + l.debit : s, 0)
    , 0)

    return {
      month: thaiMonths[m],
      revenue,
      expense,
      profit: revenue - expense,
    }
  })

  return monthlyData
}

// ✅ OPTIMIZED: Get all monthly VAT data in two queries (one for OUTPUT, one for INPUT)
async function getMonthlyVatDataOptimized(year: number) {
  const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

  // ✅ OPTIMIZED: Single query for all OUTPUT VAT data
  const vatOutputByMonth = await prisma.vatRecord.groupBy({
    by: ['taxMonth'],
    where: {
      taxYear: year,
      type: 'OUTPUT',
    },
    _sum: {
      vatAmount: true,
    },
  })

  // ✅ OPTIMIZED: Single query for all INPUT VAT data
  const vatInputByMonth = await prisma.vatRecord.groupBy({
    by: ['taxMonth'],
    where: {
      taxYear: year,
      type: 'INPUT',
    },
    _sum: {
      vatAmount: true,
    },
  })

  // Build monthly data from aggregated results
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1
    const outputRecord = vatOutputByMonth.find(r => r.taxMonth === month)
    const inputRecord = vatInputByMonth.find(r => r.taxMonth === month)

    return {
      month: thaiMonths[i],
      vatOutput: (outputRecord?._sum.vatAmount || 0),
      vatInput: (inputRecord?._sum.vatAmount || 0),
    }
  })

  return monthlyData
}

async function getWhtSummary(year: number, month: number | null) {
  const where: any = {}

  if (month) {
    where.taxYear = year
    where.taxMonth = month
  } else {
    where.taxYear = year
  }

  // Run both queries in parallel
  const [pnd3, pnd53] = await Promise.all([
    prisma.withholdingTax.aggregate({
      where: { ...where, type: 'PND3' },
      _sum: { whtAmount: true },
    }),
    prisma.withholdingTax.aggregate({
      where: { ...where, type: 'PND53' },
      _sum: { whtAmount: true },
    }),
  ])

  return {
    pnd3: pnd3._sum.whtAmount || 0,
    pnd53: pnd53._sum.whtAmount || 0,
    total: (pnd3._sum.whtAmount || 0) + (pnd53._sum.whtAmount || 0),
  }
}

async function getARAging() {
  const now = new Date()
  const invoices = await prisma.invoice.findMany({
    where: {
      status: { in: ['ISSUED', 'PARTIAL'] },
      deletedAt: null,
    },
    select: {
      dueDate: true,
      totalAmount: true,
      paidAmount: true,
    },
  })

  const aging = {
    current: 0,        // <= 30 days
    days31to60: 0,     // 31-60 days
    days61to90: 0,     // 61-90 days
    over90: 0,         // > 90 days
  }

  invoices.forEach(inv => {
    const balance = inv.totalAmount - inv.paidAmount
    if (balance <= 0) return

    const dueDate = inv.dueDate ? new Date(inv.dueDate) : null
    if (!dueDate) {
      aging.current += balance
      return
    }

    const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysOverdue <= 30) {
      aging.current += balance
    } else if (daysOverdue <= 60) {
      aging.days31to60 += balance
    } else if (daysOverdue <= 90) {
      aging.days61to90 += balance
    } else {
      aging.over90 += balance
    }
  })

  return aging
}

async function getAPAging() {
  const now = new Date()
  const purchases = await prisma.purchaseInvoice.findMany({
    where: {
      status: { in: ['ISSUED', 'PARTIAL'] },
      deletedAt: null,
    },
    select: {
      dueDate: true,
      totalAmount: true,
      paidAmount: true,
    },
  })

  const aging = {
    current: 0,
    days31to60: 0,
    days61to90: 0,
    over90: 0,
  }

  purchases.forEach(pur => {
    const balance = pur.totalAmount - pur.paidAmount
    if (balance <= 0) return

    const dueDate = pur.dueDate ? new Date(pur.dueDate) : null
    if (!dueDate) {
      aging.current += balance
      return
    }

    const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysOverdue <= 30) {
      aging.current += balance
    } else if (daysOverdue <= 60) {
      aging.days31to60 += balance
    } else if (daysOverdue <= 90) {
      aging.days61to90 += balance
    } else {
      aging.over90 += balance
    }
  })

  return aging
}
