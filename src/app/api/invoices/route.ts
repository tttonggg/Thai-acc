import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { z } from 'zod'
import { requireAuth } from '@/lib/api-auth'

// Validation schema
const invoiceLineSchema = z.object({
  productId: z.string().optional().nullable(),
  description: z.string().min(1, 'ต้องระบุรายการ'),
  quantity: z.number().positive('จำนวนต้องมากกว่า 0'),
  unit: z.string().default('ชิ้น'),
  unitPrice: z.number().min(0, 'ราคาต้องไม่ติดลบ'),
  discount: z.number().min(0).default(0),
  amount: z.number().min(0),
  vatRate: z.number().min(0).max(100).default(7),
  vatAmount: z.number().min(0).default(0),
})

const invoiceSchema = z.object({
  invoiceDate: z.string().transform((val) => new Date(val)),
  dueDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  customerId: z.string().min(1, 'ต้องเลือกลูกค้า'),
  type: z.enum(['TAX_INVOICE', 'RECEIPT', 'DELIVERY_NOTE', 'CREDIT_NOTE', 'DEBIT_NOTE']),
  reference: z.string().optional(),
  poNumber: z.string().optional(),
  discountAmount: z.number().min(0).default(0),
  discountPercent: z.number().min(0).max(100).default(0),
  withholdingRate: z.number().min(0).max(100).default(0),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  terms: z.string().optional(),
  lines: z.array(invoiceLineSchema).min(1, 'ต้องมีอย่างน้อย 1 รายการ'),
})

// Generate invoice number
async function generateInvoiceNumber(type: string): Promise<string> {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  
  const prefixes: Record<string, string> = {
    'TAX_INVOICE': 'INV',
    'RECEIPT': 'RC',
    'DELIVERY_NOTE': 'DN',
    'CREDIT_NOTE': 'CN',
    'DEBIT_NOTE': 'DN',
  }
  
  const prefix = `${prefixes[type] || 'INV'}-${year}${month}`
  
  const lastInvoice = await prisma.invoice.findFirst({
    where: {
      invoiceNo: {
        startsWith: prefix,
      },
    },
    orderBy: { invoiceNo: 'desc' },
  })
  
  let nextNum = 1
  if (lastInvoice) {
    const parts = lastInvoice.invoiceNo.split('-')
    const lastNum = parseInt(parts[parts.length - 1] || '0')
    nextNum = lastNum + 1
  }
  
  return `${prefix}-${String(nextNum).padStart(4, '0')}`
}

// GET - List invoices (requires authentication)
export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const customerId = searchParams.get('customerId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const search = searchParams.get('search')
    
    const skip = (page - 1) * limit
    
    const where: any = {}
    
    if (status) where.status = status
    if (type) where.type = type
    if (customerId) where.customerId = customerId
    
    if (startDate || endDate) {
      where.invoiceDate = {}
      if (startDate) where.invoiceDate.gte = new Date(startDate)
      if (endDate) where.invoiceDate.lte = new Date(endDate)
    }
    
    if (search) {
      where.OR = [
        { invoiceNo: { contains: search } },
        { customer: { name: { contains: search } } },
        { reference: { contains: search } },
      ]
    }
    
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          customer: true,
          lines: true,
        },
        orderBy: { invoiceDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ])
    
    return NextResponse.json({
      success: true,
      data: invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    )
  }
}

// POST - Create invoice (requires authentication)
export async function POST(request: NextRequest) {
  try {
    await requireAuth()

    const body = await request.json()
    const validatedData = invoiceSchema.parse(body)
    
    // Calculate totals
    const subtotal = validatedData.lines.reduce((sum, line) => sum + line.amount, 0)
    const vatAmount = validatedData.lines.reduce((sum, line) => sum + line.vatAmount, 0)
    
    // Auto WHT detection if rate is 0
    let finalWhtRate = validatedData.withholdingRate
    if (finalWhtRate === 0) {
      const productIds = validatedData.lines.map(l => l.productId).filter(Boolean) as string[]
      if (productIds.length > 0) {
        // Find if any product is a service with an incomeType that specifies WHT percentage
        const products = await prisma.product.findMany({
          where: { id: { in: productIds }, type: 'SERVICE', incomeType: { not: null } }
        })
        if (products.length > 0 && products[0].incomeType) {
          // Extract percentage from string like "ค่าบริการ 3%" => 3
          const match = products[0].incomeType.match(/(\d+)%/)
          if (match && match[1]) {
            finalWhtRate = parseInt(match[1])
          }
        }
      }
    }

    // WHT is calculated on (Subtotal - Discount)
    const whtBaseAmount = Math.max(0, subtotal - validatedData.discountAmount)
    const withholdingAmount = whtBaseAmount * (finalWhtRate / 100)
    
    const totalAmount = subtotal + vatAmount - validatedData.discountAmount
    const netAmount = totalAmount - withholdingAmount
    
    // Generate invoice number
    const invoiceNo = await generateInvoiceNumber(validatedData.type)
    
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo,
        invoiceDate: validatedData.invoiceDate,
        dueDate: validatedData.dueDate,
        customerId: validatedData.customerId,
        type: validatedData.type,
        reference: validatedData.reference,
        poNumber: validatedData.poNumber,
        subtotal,
        vatRate: 7,
        vatAmount,
        totalAmount,
        discountAmount: validatedData.discountAmount,
        discountPercent: validatedData.discountPercent,
        withholdingRate: finalWhtRate,
        withholdingAmount,
        netAmount,
        paidAmount: 0,
        status: 'DRAFT',
        notes: validatedData.notes,
        internalNotes: validatedData.internalNotes,
        terms: validatedData.terms,
        lines: {
          create: validatedData.lines.map((line, index) => ({
            lineNo: index + 1,
            productId: line.productId,
            description: line.description,
            quantity: line.quantity,
            unit: line.unit,
            unitPrice: line.unitPrice,
            discount: line.discount,
            amount: line.amount,
            vatRate: line.vatRate,
            vatAmount: line.vatAmount,
          })),
        },
      },
      include: {
        customer: true,
        lines: true,
      },
    })
    
    return NextResponse.json({ success: true, data: invoice })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'ข้อมูลไม่ถูกต้อง', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: error.message || 'เกิดข้อผิดพลาดในการสร้างใบกำกับภาษี' },
      { status: 500 }
    )
  }
}
