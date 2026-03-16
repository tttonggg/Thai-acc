import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { z } from 'zod'
import { requireAuth } from '@/lib/api-auth'
import { generateDocumentNumber } from '@/lib/thai-accounting'

// Validation schema for receipt allocation
const receiptAllocationSchema = z.object({
  invoiceId: z.string().min(1, 'กรุณาระบุใบกำกับภาษี'),
  amount: z.number().min(0, 'จำนวนเงินต้องไม่ติดลบ'),
  whtRate: z.number().min(0).max(100).default(0),
  whtAmount: z.number().min(0).default(0),
})

// Validation schema for receipt
const receiptSchema = z.object({
  receiptDate: z.string().transform((val) => new Date(val)),
  customerId: z.string().min(1, 'กรุณาเลือกลูกค้า'),
  paymentMethod: z.enum(['CASH', 'CHEQUE', 'TRANSFER', 'CREDIT', 'OTHER']).default('CASH'),
  bankAccountId: z.string().optional().nullable(),
  chequeNo: z.string().optional(),
  chequeDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  amount: z.number().min(0, 'จำนวนเงินต้องไม่ติดลบ'),
  notes: z.string().optional(),
  allocations: z.array(receiptAllocationSchema).optional().default([]),
})

// GET - List receipts
export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '20'))
    const status = searchParams.get('status')
    const customerId = searchParams.get('customerId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    const where: any = {}

    if (status) where.status = status
    if (customerId) where.customerId = customerId

    if (startDate || endDate) {
      where.receiptDate = {}
      if (startDate) where.receiptDate.gte = new Date(startDate)
      if (endDate) where.receiptDate.lte = new Date(endDate)
    }

    if (search) {
      where.OR = [
        { receiptNo: { contains: search } },
        { customer: { name: { contains: search } } },
        { notes: { contains: search } },
      ]
    }

    const [receipts, total] = await Promise.all([
      prisma.receipt.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              code: true,
              name: true,
            }
          },
          bankAccount: {
            select: {
              id: true,
              code: true,
              bankName: true,
              accountNumber: true,
            }
          },
          allocations: {
            include: {
              invoice: {
                select: {
                  id: true,
                  invoiceNo: true,
                  invoiceDate: true,
                  totalAmount: true,
                }
              }
            }
          },
          journalEntry: {
            select: {
              id: true,
              entryNo: true,
            }
          }
        },
        orderBy: { receiptDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.receipt.count({ where }),
    ])

    // Calculate allocated and unallocated amounts
    const receiptsWithCalculations = receipts.map(receipt => {
      const totalAllocated = receipt.allocations.reduce((sum, alloc) => sum + alloc.amount, 0)
      const totalWht = receipt.allocations.reduce((sum, alloc) => sum + alloc.whtAmount, 0)

      return {
        ...receipt,
        totalAllocated,
        totalWht,
        remaining: receipt.amount - totalAllocated,
      }
    })

    return NextResponse.json({
      success: true,
      data: receiptsWithCalculations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('Error fetching receipts:', error)
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    )
  }
}

// POST - Create receipt
export async function POST(request: NextRequest) {
  try {
    await requireAuth()

    const body = await request.json()
    const validatedData = receiptSchema.parse(body)

    // Validate that total allocations don't exceed amount
    const totalAllocation = validatedData.allocations.reduce((sum, alloc) => sum + alloc.amount, 0)
    const totalWht = validatedData.allocations.reduce((sum, alloc) => sum + alloc.whtAmount, 0)

    if (totalAllocation > validatedData.amount) {
      return NextResponse.json(
        { success: false, error: 'ยอดจัดจ่ายเกินกว่ายอดรับเงิน' },
        { status: 400 }
      )
    }

    // Validate bank account for non-cash payments
    if ((validatedData.paymentMethod === 'TRANSFER' || validatedData.paymentMethod === 'CHEQUE') && !validatedData.bankAccountId) {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุบัญชีธนาคาร' },
        { status: 400 }
      )
    }

    // Validate cheque number for cheque payments
    if (validatedData.paymentMethod === 'CHEQUE' && !validatedData.chequeNo) {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุเลขที่เช็ค' },
        { status: 400 }
      )
    }

    // Generate receipt number
    const receiptNo = await generateReceiptNumber()

    // Calculate unallocated amount (credit to customer)
    const unallocated = validatedData.amount - totalAllocation

    // Create receipt with allocations
    const receipt = await prisma.receipt.create({
      data: {
        receiptNo,
        receiptDate: validatedData.receiptDate,
        customerId: validatedData.customerId,
        paymentMethod: validatedData.paymentMethod,
        bankAccountId: validatedData.bankAccountId,
        chequeNo: validatedData.chequeNo,
        chequeDate: validatedData.chequeDate,
        amount: validatedData.amount,
        whtAmount: totalWht,
        unallocated,
        notes: validatedData.notes,
        status: 'DRAFT',
        allocations: {
          create: validatedData.allocations.map(alloc => ({
            invoiceId: alloc.invoiceId,
            amount: alloc.amount,
            whtRate: alloc.whtRate,
            whtAmount: alloc.whtAmount,
          }))
        }
      },
      include: {
        customer: true,
        bankAccount: true,
        allocations: {
          include: {
            invoice: true,
          }
        }
      }
    })

    return NextResponse.json({ success: true, data: receipt })
  } catch (error: any) {
    console.error('Error creating receipt:', error)
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'ข้อมูลไม่ถูกต้อง', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: error.message || 'เกิดข้อผิดพลาดในการสร้างใบเสร็จรับเงิน' },
      { status: 500 }
    )
  }
}

// Generate receipt number (RCP-YYYYMM-####)
async function generateReceiptNumber(): Promise<string> {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')

  const prefix = `RCP-${year}${month}`

  const lastReceipt = await prisma.receipt.findFirst({
    where: {
      receiptNo: {
        startsWith: prefix,
      },
    },
    orderBy: { receiptNo: 'desc' },
  })

  let nextNum = 1
  if (lastReceipt) {
    const parts = lastReceipt.receiptNo.split('-')
    const lastNum = parseInt(parts[parts.length - 1] || '0')
    nextNum = lastNum + 1
  }

  return `${prefix}-${String(nextNum).padStart(4, '0')}`
}
