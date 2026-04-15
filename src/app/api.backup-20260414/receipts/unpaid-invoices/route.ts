import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/api-utils'

// GET - Get unpaid invoices for a customer
export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const searchParams = request.nextUrl.searchParams
    const customerId = searchParams.get('customerId')

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุรหัสลูกค้า' },
        { status: 400 }
      )
    }

    // Get invoices that are not fully paid
    const invoices = await prisma.invoice.findMany({
      where: {
        customerId,
        status: {
          in: ['ISSUED', 'PARTIAL']
        }
      },
      orderBy: {
        invoiceDate: 'asc'
      }
    })

    // Calculate balance for each invoice
    const invoicesWithBalance = invoices.map(invoice => {
      const balance = invoice.totalAmount - invoice.paidAmount
      return {
        id: invoice.id,
        invoiceNo: invoice.invoiceNo,
        invoiceDate: invoice.invoiceDate,
        totalAmount: invoice.totalAmount,
        paidAmount: invoice.paidAmount,
        balance: Math.max(0, balance),
        status: invoice.status,
      }
    }).filter(inv => inv.balance > 0.01) // Only show invoices with outstanding balance

    return NextResponse.json({
      success: true,
      data: invoicesWithBalance,
    })
  } catch (error: any) {
    console.error('Error fetching unpaid invoices:', error)
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    )
  }
}
