import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Export all data
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      exportedBy: user.email,
      data: {
        company: await prisma.company.findFirst(),
        accounts: await prisma.chartOfAccount.findMany(),
        journalEntries: await prisma.journalEntry.findMany({
          include: { lines: true }
        }),
        invoices: await prisma.invoice.findMany({
          include: { lines: true }
        }),
        customers: await prisma.customer.findMany(),
        vendors: await prisma.vendor.findMany(),
        vatRecords: await prisma.vatRecord.findMany(),
        withholdingTaxes: await prisma.withholdingTax.findMany(),
        users: await prisma.user.findMany({
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true
          }
        })
      }
    }

    return new NextResponse(JSON.stringify(backup, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="thai-erp-backup-${new Date().toISOString().split('T')[0]}.json"`
      }
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to export data' 
    }, { status: 500 })
  }
}
