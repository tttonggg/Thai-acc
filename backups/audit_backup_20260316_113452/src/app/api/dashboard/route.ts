import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/api-auth'

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
    
    // Get journal entries for the period
    const journalEntries = await prisma.journalEntry.findMany({
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
    })
    
    // Calculate revenue (accounts starting with 4)
    const revenue = journalEntries.reduce((sum, entry) => {
      return sum + entry.lines.reduce((lineSum, line) => {
        if (line.account?.code?.startsWith('4') && line.credit > 0) {
          return lineSum + line.credit
        }
        return lineSum
      }, 0)
    }, 0)
    
    // Calculate expenses (accounts starting with 5)
    const expenses = journalEntries.reduce((sum, entry) => {
      return sum + entry.lines.reduce((lineSum, line) => {
        if (line.account?.code?.startsWith('5') && line.debit > 0) {
          return lineSum + line.debit
        }
        return lineSum
      }, 0)
    }, 0)
    
    // Get accounts receivable balance
    const arBalance = await prisma.invoice.aggregate({
      where: {
        status: { in: ['ISSUED', 'PARTIAL'] },
      },
      _sum: {
        totalAmount: true,
        paidAmount: true,
      },
    })
    
    const accountsReceivable = (arBalance._sum.totalAmount || 0) - (arBalance._sum.paidAmount || 0)
    
    // Get accounts payable balance
    const apBalance = await prisma.purchaseInvoice.aggregate({
      where: {
        status: { in: ['ISSUED', 'PARTIAL'] },
      },
      _sum: {
        totalAmount: true,
        paidAmount: true,
      },
    })
    
    const accountsPayable = (apBalance._sum.totalAmount || 0) - (apBalance._sum.paidAmount || 0)
    
    // Get monthly data for charts
    const monthlyData = await getMonthlyData(year)
    
    // Get VAT summary
    const vatSummary = await getVatSummary(year, month)
    
    // Get WHT summary
    const whtSummary = await getWhtSummary(year, month)
    
    // Get AR aging
    const arAging = await getARAging()
    
    // Get AP aging
    const apAging = await getAPAging()
    
    // Get quick actions
    const draftInvoices = await prisma.invoice.count({
      where: { status: 'DRAFT' },
    })

    const overdueAR = await prisma.invoice.count({
      where: {
        status: { in: ['ISSUED', 'PARTIAL'] },
        dueDate: { lt: new Date() },
      },
    })

    // Check if VAT needs to be filed for current month
    const currentMonth = new Date().getMonth() + 1 // 1-12
    const currentYear = new Date().getFullYear()

    // Check if there's any VAT activity for current month that hasn't been reported
    const pendingVatRecords = await prisma.vatRecord.count({
      where: {
        taxMonth: currentMonth,
        taxYear: currentYear,
        reportStatus: 'PENDING',
      },
    })

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
        vatData: vatSummary,
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
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    )
  }
}

async function getMonthlyData(year: number) {
  const months = []
  const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
  
  for (let m = 0; m < 12; m++) {
    const startDate = new Date(year, m, 1)
    const endDate = new Date(year, m + 1, 0, 23, 59, 59)
    
    const entries = await prisma.journalEntry.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        status: 'POSTED',
      },
      include: {
        lines: { include: { account: true } },
      },
    })
    
    const revenue = entries.reduce((sum, e) => 
      sum + e.lines.reduce((s, l) => l.account?.code?.startsWith('4') && l.credit > 0 ? s + l.credit : s, 0)
    , 0)
    
    const expense = entries.reduce((sum, e) => 
      sum + e.lines.reduce((s, l) => l.account?.code?.startsWith('5') && l.debit > 0 ? s + l.debit : s, 0)
    , 0)
    
    months.push({
      month: thaiMonths[m],
      revenue,
      expense,
      profit: revenue - expense,
    })
  }
  
  return months
}

async function getVatSummary(year: number, month: number | null) {
  const where: any = {}
  
  if (month) {
    where.taxYear = year
    where.taxMonth = month
  } else {
    where.taxYear = year
  }
  
  const vatOutput = await prisma.vatRecord.aggregate({
    where: { ...where, type: 'OUTPUT' },
    _sum: { vatAmount: true },
  })
  
  const vatInput = await prisma.vatRecord.aggregate({
    where: { ...where, type: 'INPUT' },
    _sum: { vatAmount: true },
  })
  
  const output = vatOutput._sum.vatAmount || 0
  const input = vatInput._sum.vatAmount || 0
  
  return {
    output,
    input,
    netVat: output - input,
  }
}

async function getWhtSummary(year: number, month: number | null) {
  const where: any = {}
  
  if (month) {
    where.taxYear = year
    where.taxMonth = month
  } else {
    where.taxYear = year
  }
  
  const pnd3 = await prisma.withholdingTax.aggregate({
    where: { ...where, type: 'PND3' },
    _sum: { whtAmount: true },
  })
  
  const pnd53 = await prisma.withholdingTax.aggregate({
    where: { ...where, type: 'PND53' },
    _sum: { whtAmount: true },
  })
  
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
