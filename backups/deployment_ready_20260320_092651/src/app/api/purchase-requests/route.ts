import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Validation schema for PR line item
const prLineSchema = z.object({
  lineNo: z.number().int().positive(),
  productId: z.string().optional(),
  description: z.string().min(1, 'รายการสินค้าต้องไม่ว่างเปล่า'),
  quantity: z.number().positive('จำนวนต้องมากกว่า 0'),
  unit: z.string().default('ชิ้น'),
  unitPrice: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  vatRate: z.number().min(0).default(7),
  vatAmount: z.number().min(0).default(0),
  amount: z.number().min(0).default(0),
  suggestedVendor: z.string().optional(),
  specUrl: z.string().optional(),
  notes: z.string().optional(),
})

// Validation schema for PR
const purchaseRequestSchema = z.object({
  requestNo: z.string().optional(),
  requestDate: z.string().optional(),
  departmentId: z.string().optional(),
  requiredDate: z.string().optional(),
  reason: z.string().optional(),
  priority: z.enum(['URGENT', 'HIGH', 'NORMAL', 'LOW']).default('NORMAL'),
  budgetId: z.string().optional(),
  estimatedAmount: z.number().int().min(0).default(0),
  notes: z.string().optional(),
  attachments: z.any().optional(),
  internalNotes: z.string().optional(),
  lines: z.array(prLineSchema).min(1, 'ต้องมีอย่างน้อย 1 รายการ'),
})

// GET /api/purchase-requests - List all PRs
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้รับอนุญาต' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const departmentId = searchParams.get('departmentId')
    const priority = searchParams.get('priority')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const where: any = {}

    if (status) {
      where.status = status
    }

    if (departmentId) {
      where.departmentId = departmentId
    }

    if (priority) {
      where.priority = priority
    }

    if (search) {
      where.OR = [
        { requestNo: { contains: search, mode: 'insensitive' } },
        { reason: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Non-admin users can only see their own PRs
    if (!['ADMIN', 'ACCOUNTANT'].includes(session.user.role as string)) {
      where.requestedBy = session.user.id
    }

    const [prs, total] = await Promise.all([
      prisma.purchaseRequest.findMany({
        where,
        include: {
          requestedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          departmentData: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          approvedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          budget: {
            select: {
              id: true,
              name: true,
              fiscalYear: true,
              remainingAmount: true,
            },
          },
          purchaseOrder: {
            select: {
              id: true,
              orderNo: true,
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
          requestDate: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.purchaseRequest.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: prs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Purchase Requests Fetch Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'ข้อผิดพลาดในการโหลดข้อมูล',
      },
      { status: 500 }
    )
  }
}

// POST /api/purchase-requests - Create new PR
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้รับอนุญาต' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = purchaseRequestSchema.parse(body)

    // Generate PR number if not provided
    let requestNo = validatedData.requestNo
    if (!requestNo) {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')

      // Find latest PR number for this month
      const latestPR = await prisma.purchaseRequest.findFirst({
        where: {
          requestNo: {
            startsWith: `PR${year}${month}`,
          },
        },
        orderBy: {
          requestNo: 'desc',
        },
      })

      let sequence = 1
      if (latestPR) {
        const match = latestPR.requestNo.match(/PR\d{6}-(\d{4})/)
        if (match) {
          sequence = parseInt(match[1]) + 1
        }
      }

      requestNo = `PR${year}${month}-${String(sequence).padStart(4, '0')}`
    }

    // Check if department exists (if specified)
    if (validatedData.departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: validatedData.departmentId },
      })

      if (!department) {
        return NextResponse.json(
          { success: false, error: 'ไม่พบแผนก' },
          { status: 400 }
        )
      }
    }

    // Check if budget exists and has sufficient funds (if specified)
    if (validatedData.budgetId) {
      const budget = await prisma.departmentBudget.findUnique({
        where: { id: validatedData.budgetId },
      })

      if (!budget) {
        return NextResponse.json(
          { success: false, error: 'ไม่พบงบประมาณ' },
          { status: 400 }
        )
      }

      if (budget.remainingAmount < validatedData.estimatedAmount) {
        return NextResponse.json(
          { success: false, error: 'งบประมาณไม่เพียงพอ' },
          { status: 400 }
        )
      }
    }

    // Calculate amounts for each line
    const lines = validatedData.lines.map((line) => {
      const subtotal = line.quantity * line.unitPrice
      const discountAmount = subtotal * (line.discount / 100)
      const afterDiscount = subtotal - discountAmount
      const vatAmount = afterDiscount * (line.vatRate / 100)
      const amount = afterDiscount + vatAmount

      return {
        ...line,
        vatAmount: Math.round(vatAmount * 100) / 100,
        amount: Math.round(amount * 100) / 100,
      }
    })

    // Create PR with transaction
    const pr = await prisma.$transaction(async (tx) => {
      // Create PR
      const purchaseRequest = await tx.purchaseRequest.create({
        data: {
          requestNo,
          requestDate: validatedData.requestDate ? new Date(validatedData.requestDate) : new Date(),
          requestedBy: session.user.id,
          departmentId: validatedData.departmentId,
          requiredDate: validatedData.requiredDate ? new Date(validatedData.requiredDate) : undefined,
          reason: validatedData.reason,
          priority: validatedData.priority,
          budgetId: validatedData.budgetId,
          estimatedAmount: validatedData.estimatedAmount,
          notes: validatedData.notes,
          attachments: validatedData.attachments,
          internalNotes: validatedData.internalNotes,
          status: 'DRAFT',
          lines: {
            create: lines,
          },
        },
        include: {
          requestedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          departmentData: {
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

      return purchaseRequest
    })

    return NextResponse.json(
      {
        success: true,
        data: pr,
        message: 'สร้างใบขอซื้อสำเร็จ',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Purchase Request Creation Error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'ข้อมูลไม่ถูกต้อง',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'ข้อผิดพลาดในการสร้างใบขอซื้อ',
      },
      { status: 500 }
    )
  }
}
