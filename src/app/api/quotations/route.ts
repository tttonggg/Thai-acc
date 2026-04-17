import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { bahtToSatang, satangToBaht } from '@/lib/currency'

// Validation schema for Quotation line item
const quotationLineSchema = z.object({
  lineNo: z.number().int().positive(),
  productId: z.string().optional(),
  description: z.string().min(1, 'รายการสินค้าต้องไม่ว่างเปล่า'),
  quantity: z.number().positive('จำนวนต้องมากกว่า 0'),
  unit: z.string().default('ชิ้น'),
  unitPrice: z.number().int().min(0, 'ราคาต้องไม่ติดลบ'),
  discount: z.number().int().min(0).default(0),
  vatRate: z.number().min(0).max(100).default(7),
  vatAmount: z.number().int().min(0).default(0),
  amount: z.number().int().min(0).default(0),
  notes: z.string().optional(),
})

// Validation schema for Quotation
const quotationSchema = z.object({
  quotationNo: z.string().optional(),
  quotationDate: z.string().optional(),
  validUntil: z.string().min(1, 'วันหมดอายุต้องไม่ว่างเปล่า'),
  customerId: z.string().min(1, 'กรุณาเลือกลูกค้า'),
  contactPerson: z.string().optional(),
  reference: z.string().optional(),
  subtotal: z.number().int().min(0).default(0),
  discountAmount: z.number().int().min(0).default(0),
  discountPercent: z.number().min(0).max(100).default(0),
  vatRate: z.number().min(0).max(100).default(7),
  vatAmount: z.number().int().min(0).default(0),
  totalAmount: z.number().int().min(0).default(0),
  terms: z.string().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  lines: z.array(quotationLineSchema).min(1, 'ต้องมีอย่างน้อย 1 รายการ'),
})

// GET /api/quotations - List all quotations
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้รับอนุญาต' },
        { status: 401 }
      )
    }

    // Check if Quotation model exists in Prisma schema
    if (!prisma.quotation || typeof prisma.quotation.findMany !== 'function') {
      // Return empty result if model doesn't exist
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 0
        }
      })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const customerId = searchParams.get('customerId')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const where: any = {}

    if (status) {
      where.status = status
    }

    if (customerId) {
      where.customerId = customerId
    }

    if (search) {
      where.OR = [
        { quotationNo: { contains: search, mode: 'insensitive' } },
        { reference: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Non-admin users can only see their own quotations
    // For now, show all to ADMIN and ACCOUNTANT
    if (!['ADMIN', 'ACCOUNTANT'].includes(session.user.role as string)) {
      // Add user filter logic if needed
    }

    const [quotations, total] = await Promise.all([
      prisma.quotation.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          invoice: {
            select: {
              id: true,
              invoiceNo: true,
              status: true,
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
          _count: {
            select: {
              lines: true,
            },
          },
        },
        orderBy: {
          quotationDate: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.quotation.count({ where }),
    ])

    // Convert Satang to Baht for response
    const quotationsWithBaht = quotations.map((q: any) => ({
      ...q,
      subtotal: satangToBaht(q.subtotal),
      discountAmount: satangToBaht(q.discountAmount),
      vatAmount: satangToBaht(q.vatAmount),
      totalAmount: satangToBaht(q.totalAmount),
      lines: q.lines.map((line: any) => ({
        ...line,
        unitPrice: satangToBaht(line.unitPrice),
        discount: satangToBaht(line.discount),
        vatAmount: satangToBaht(line.vatAmount),
        amount: satangToBaht(line.amount),
      })),
    }))

    return NextResponse.json({
      success: true,
      data: quotationsWithBaht,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Quotations Fetch Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'ข้อผิดพลาดในการโหลดข้อมูล',
      },
      { status: 500 }
    )
  }
}

// POST /api/quotations - Create new quotation
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้รับอนุญาต' },
        { status: 401 }
      )
    }

    // Check if Quotation model exists in Prisma schema
    if (!prisma.quotation || typeof prisma.quotation.create !== 'function') {
      return NextResponse.json(
        { success: false, error: 'Quotation module is not available' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const validatedData = quotationSchema.parse(body)

    // Convert Baht to Satang for all monetary fields
    const dataInSatang = {
      ...validatedData,
      subtotal: bahtToSatang(validatedData.subtotal),
      discountAmount: bahtToSatang(validatedData.discountAmount),
      vatAmount: bahtToSatang(validatedData.vatAmount),
      totalAmount: bahtToSatang(validatedData.totalAmount),
      lines: validatedData.lines.map((line) => ({
        ...line,
        unitPrice: bahtToSatang(line.unitPrice),
        discount: bahtToSatang(line.discount),
        vatAmount: bahtToSatang(line.vatAmount),
        amount: bahtToSatang(line.amount),
      })),
    }

    // Generate Quotation number if not provided
    let quotationNo = validatedData.quotationNo
    if (!quotationNo) {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')

      // Find latest Quotation number for this month
      const latestQuotation = await prisma.quotation.findFirst({
        where: {
          quotationNo: {
            startsWith: `QT${year}${month}`,
          },
        },
        orderBy: {
          quotationNo: 'desc',
        },
      })

      let sequence = 1
      if (latestQuotation) {
        const match = latestQuotation.quotationNo.match(/QT\d{6}-(\d{4})/)
        if (match) {
          sequence = parseInt(match[1]) + 1
        }
      }

      quotationNo = `QT${year}${month}-${String(sequence).padStart(4, '0')}`
    }

    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: dataInSatang.customerId },
    })

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบลูกค้า' },
        { status: 400 }
      )
    }

    // Calculate amounts for each line (already in Satang)
    const lines = dataInSatang.lines.map((line) => {
      const subtotal = line.quantity * line.unitPrice
      const discountAmount = line.discount
      const afterDiscount = subtotal - discountAmount
      const vatAmount = Math.round(afterDiscount * (line.vatRate / 100))
      const amount = afterDiscount + vatAmount

      return {
        ...line,
        vatAmount,
        amount: Math.round(amount),
      }
    })

    // Calculate totals (already in Satang)
    const subtotal = lines.reduce((sum, line) => sum + (line.quantity * line.unitPrice), 0)
    const totalDiscount = dataInSatang.discountAmount + Math.round(subtotal * (dataInSatang.discountPercent / 100))
    const afterDiscount = subtotal - totalDiscount
    const vatAmount = Math.round(afterDiscount * (dataInSatang.vatRate / 100))
    const totalAmount = afterDiscount + vatAmount

    // Create Quotation with transaction
    const quotation = await prisma.$transaction(async (tx) => {
      const createdQuotation = await tx.quotation.create({
        data: {
          quotationNo,
          quotationDate: dataInSatang.quotationDate ? new Date(dataInSatang.quotationDate) : new Date(),
          validUntil: new Date(dataInSatang.validUntil),
          customerId: dataInSatang.customerId,
          contactPerson: dataInSatang.contactPerson,
          reference: dataInSatang.reference,
          subtotal: Math.round(subtotal),
          discountAmount: Math.round(totalDiscount),
          discountPercent: dataInSatang.discountPercent,
          vatRate: dataInSatang.vatRate,
          vatAmount,
          totalAmount: Math.round(totalAmount),
          terms: dataInSatang.terms,
          notes: dataInSatang.notes,
          internalNotes: dataInSatang.internalNotes,
          status: 'DRAFT',
          createdById: session.user.id,
          updatedById: session.user.id,
          lines: {
            create: lines,
          },
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

      return createdQuotation
    })

    // Convert response to Baht
    const quotationInBaht = {
      ...quotation,
      subtotal: satangToBaht(quotation.subtotal),
      discountAmount: satangToBaht(quotation.discountAmount),
      vatAmount: satangToBaht(quotation.vatAmount),
      totalAmount: satangToBaht(quotation.totalAmount),
      lines: quotation.lines.map((line: any) => ({
        ...line,
        unitPrice: satangToBaht(line.unitPrice),
        discount: satangToBaht(line.discount),
        vatAmount: satangToBaht(line.vatAmount),
        amount: satangToBaht(line.amount),
      })),
    }

    return NextResponse.json(
      {
        success: true,
        data: quotationInBaht,
        message: 'สร้างใบเสนอราคาเรียบร้อยแล้ว',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Quotation Creation Error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'ข้อมูลไม่ถูกต้อง',
          details: error.issues,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'ข้อผิดพลาดในการสร้างใบเสนอราคา',
      },
      { status: 500 }
    )
  }
}
