import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// POST /api/quotations/[id]/convert-to-invoice - Convert quotation to invoice (APPROVED → CONVERTED)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้รับอนุญาต' },
        { status: 401 }
      )
    }

    // Only ADMIN and ACCOUNTANT can convert quotations
    if (!['ADMIN', 'ACCOUNTANT'].includes(session.user.role as string)) {
      return NextResponse.json(
        { success: false, error: 'ไม่มีสิทธิแปลงใบเสนอราคา' },
        { status: 403 }
      )
    }

    const quotation = await prisma.quotation.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        lines: {
          include: {
            product: true,
          },
          orderBy: {
            lineNo: 'asc',
          },
        },
      },
    })

    if (!quotation) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบใบเสนอราคา' },
        { status: 404 }
      )
    }

    // Can only convert APPROVED quotations
    if (quotation.status !== 'APPROVED') {
      return NextResponse.json(
        {
          success: false,
          error: 'สามารถแปลงเฉพาะใบเสนอราคาที่อยู่ในสถานะ ลูกค้าอนุมัติ',
        },
        { status: 400 }
      )
    }

    // Check if already converted
    if (quotation.invoiceId) {
      return NextResponse.json(
        {
          success: false,
          error: 'ใบเสนอราคานี้ถูกแปลงเป็นใบกำกับภาษีแล้ว',
        },
        { status: 400 }
      )
    }

    // Check if quotation is still valid
    if (quotation.validUntil < new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: 'ใบเสนอราคาหมดอายุแล้ว กรุณาตรวจสอบวันหมดอายุ',
        },
        { status: 400 }
      )
    }

    // Generate Invoice number
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')

    const latestInvoice = await prisma.invoice.findFirst({
      where: {
        invoiceNo: {
          startsWith: `INV${year}${month}`,
        },
      },
      orderBy: {
        invoiceNo: 'desc',
      },
    })

    let sequence = 1
    if (latestInvoice) {
      const match = latestInvoice.invoiceNo.match(/INV\d{6}-(\d{4})/)
      if (match) {
        sequence = parseInt(match[1]) + 1
      }
    }

    const invoiceNo = `INV${year}${month}-${String(sequence).padStart(4, '0')}`

    // Create Invoice from Quotation using transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create Invoice
      const invoice = await tx.invoice.create({
        data: {
          invoiceNo,
          invoiceDate: now,
          customerId: quotation.customerId,
          contactPerson: quotation.contactPerson,
          reference: `ใบเสนอราคา ${quotation.quotationNo}`,
          subtotal: quotation.subtotal,
          discountAmount: quotation.discountAmount,
          discountPercent: quotation.discountPercent,
          vatRate: quotation.vatRate,
          vatAmount: quotation.vatAmount,
          totalAmount: quotation.totalAmount,
          status: 'POSTED',
          type: 'TAX_INVOICE',
          terms: quotation.terms,
          notes: quotation.notes,
          internalNotes: quotation.internalNotes,
          createdById: session.user.id,
          updatedById: session.user.id,
          lines: {
            create: quotation.lines.map((line) => ({
              lineNo: line.lineNo,
              productId: line.productId,
              description: line.description,
              quantity: line.quantity,
              unit: line.unit,
              unitPrice: line.unitPrice,
              discount: line.discount,
              vatRate: line.vatRate,
              vatAmount: line.vatAmount,
              amount: line.amount,
              notes: line.notes,
            })),
          },
        },
      })

      // Update Quotation status
      const updatedQuotation = await tx.quotation.update({
        where: { id: params.id },
        data: {
          status: 'CONVERTED',
          invoiceId: invoice.id,
          updatedById: session.user.id,
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          lines: {
            include: {
              product: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
              },
            },
            orderBy: {
              lineNo: 'asc',
            },
          },
        },
      })

      return { invoice, quotation: updatedQuotation }
    })

    return NextResponse.json({
      success: true,
      data: {
        invoice: result.invoice,
        quotation: result.quotation,
      },
      message: `แปลงใบเสนอราคาเป็นใบกำกับภาษีเรียบร้อยแล้ว (${result.invoice.invoiceNo})`,
    })
  } catch (error) {
    console.error('Quotation Convert Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'ข้อผิดพลาดในการแปลงใบเสนอราคา',
      },
      { status: 500 }
    )
  }
}
