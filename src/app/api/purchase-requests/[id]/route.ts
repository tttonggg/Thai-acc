import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Validation schema for update
const prUpdateSchema = z.object({
  departmentId: z.string().optional(),
  requiredDate: z.string().optional(),
  reason: z.string().optional(),
  priority: z.enum(['URGENT', 'HIGH', 'NORMAL', 'LOW']).optional(),
  budgetId: z.string().nullable().optional(),
  estimatedAmount: z.number().int().min(0).optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  status: z.enum(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'CONVERTED']).optional(),
})

// Validation schema for approval
const approvalSchema = z.object({
  action: z.enum(['submit', 'approve', 'reject', 'cancel']),
  approvalNotes: z.string().optional(),
  lines: z.array(z.object({
    id: z.string().optional(),
    lineNo: z.number().int().positive(),
    productId: z.string().optional(),
    description: z.string().min(1),
    quantity: z.number().positive(),
    unit: z.string(),
    unitPrice: z.number().min(0),
    discount: z.number().min(0),
    vatRate: z.number().min(0),
    suggestedVendor: z.string().optional(),
    specUrl: z.string().optional(),
    notes: z.string().optional(),
  })).optional(),
})

// GET /api/purchase-requests/[id] - Get single PR
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้รับอนุญาต' },
        { status: 401 }
      )
    }

    const pr = await prisma.purchaseRequest.findUnique({
      where: { id: id },
      include: {
        requestedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        updatedBy: {
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
            allocatedAmount: true,
            usedAmount: true,
            remainingAmount: true,
          },
        },
        purchaseOrder: {
          select: {
            id: true,
            orderNo: true,
            status: true,
            vendorId: true,
            vendor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        lines: {
          include: {
            product: {
              select: {
                id: true,
                code: true,
                name: true,
                unit: true,
              },
            },
          },
          orderBy: {
            lineNo: 'asc',
          },
        },
      },
    })

    if (!pr) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบใบขอซื้อ' },
        { status: 404 }
      )
    }

    // Check access permission
    const isOwner = pr.requestedBy === session.user.id
    const isAdmin = ['ADMIN', 'ACCOUNTANT'].includes(session.user.role as string)

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { success: false, error: 'ไม่มีสิทธิ์เข้าถึงข้อมูล' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: pr,
    })
  } catch (error) {
    console.error('Purchase Request Fetch Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'ข้อผิดพลาดในการโหลดข้อมูล',
      },
      { status: 500 }
    )
  }
}

// PUT /api/purchase-requests/[id] - Update PR
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้รับอนุญาต' },
        { status: 401 }
      )
    }

    // Check if PR exists
    const existing = await prisma.purchaseRequest.findUnique({
      where: { id: id },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบใบขอซื้อ' },
        { status: 404 }
      )
    }

    // Check permission - only owner and admin/accountant can edit
    const isOwner = existing.requestedBy === session.user.id
    const isAdmin = ['ADMIN', 'ACCOUNTANT'].includes(session.user.role as string)

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { success: false, error: 'ไม่มีสิทธิ์แก้ไขใบขอซื้อ' },
        { status: 403 }
      )
    }

    // Can only edit DRAFT status
    if (existing.status !== 'DRAFT') {
      return NextResponse.json(
        { success: false, error: 'สามารถแก้ไขเฉพาะใบขอซื้อที่มีสถานะร่างเท่านั้น' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = prUpdateSchema.parse(body)

    // Update PR
    const pr = await prisma.purchaseRequest.update({
      where: { id: id },
      data: {
        ...validatedData,
        requiredDate: validatedData.requiredDate ? new Date(validatedData.requiredDate) : undefined,
        updatedById: session.user.id,
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

    return NextResponse.json({
      success: true,
      data: pr,
      message: 'อัปเดตใบขอซื้อสำเร็จ',
    })
  } catch (error) {
    console.error('Purchase Request Update Error:', error)

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
        error: error instanceof Error ? error.message : 'ข้อผิดพลาดในการอัปเดตใบขอซื้อ',
      },
      { status: 500 }
    )
  }
}

// DELETE /api/purchase-requests/[id] - Delete PR
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้รับอนุญาต' },
        { status: 401 }
      )
    }

    // Check if PR exists
    const existing = await prisma.purchaseRequest.findUnique({
      where: { id: id },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบใบขอซื้อ' },
        { status: 404 }
      )
    }

    // Check permission
    const isOwner = existing.requestedBy === session.user.id
    const isAdmin = session.user.role === 'ADMIN'

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { success: false, error: 'ไม่มีสิทธิ์ลบใบขอซื้อ' },
        { status: 403 }
      )
    }

    // Can only delete DRAFT status
    if (existing.status !== 'DRAFT') {
      return NextResponse.json(
        { success: false, error: 'สามารถลบเฉพาะใบขอซื้อที่มีสถานะร่างเท่านั้น' },
        { status: 400 }
      )
    }

    // Check if already converted to PO
    if (existing.purchaseOrderId) {
      return NextResponse.json(
        { success: false, error: 'ไม่สามารถลบใบขอซื้อที่ถูกแปลงเป็นใบสั่งซื้อแล้ว' },
        { status: 400 }
      )
    }

    // Delete PR (cascade will delete lines)
    await prisma.purchaseRequest.delete({
      where: { id: id },
    })

    return NextResponse.json({
      success: true,
      message: 'ลบใบขอซื้อสำเร็จ',
    })
  } catch (error) {
    console.error('Purchase Request Deletion Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'ข้อผิดพลาดในการลบใบขอซื้อ',
      },
      { status: 500 }
    )
  }
}

// POST /api/purchase-requests/[id]/approve - Approval workflow
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้รับอนุญาต' },
        { status: 401 }
      )
    }

    // Only ADMIN and ACCOUNTANT can approve
    if (!['ADMIN', 'ACCOUNTANT'].includes(session.user.role as string)) {
      return NextResponse.json(
        { success: false, error: 'ไม่มีสิทธิ์อนุมัติใบขอซื้อ' },
        { status: 403 }
      )
    }

    // Check if PR exists
    const existing = await prisma.purchaseRequest.findUnique({
      where: { id: id },
      include: {
        lines: true,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบใบขอซื้อ' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { action, approvalNotes, lines } = approvalSchema.parse(body)

    const now = new Date()

    switch (action) {
      case 'submit':
        if (existing.status !== 'DRAFT') {
          return NextResponse.json(
            { success: false, error: 'สามารถส่งอนุมัติเฉพาะใบขอซื้อที่มีสถานะร่างเท่านั้น' },
            { status: 400 }
          )
        }

        await prisma.purchaseRequest.update({
          where: { id: id },
          data: {
            status: 'PENDING',
            submittedAt: now,
          },
        })

        break

      case 'approve':
        if (existing.status !== 'PENDING') {
          return NextResponse.json(
            { success: false, error: 'สามารถอนุมัติเฉพาะใบขอซื้อที่มีสถานะรออนุมัติเท่านั้น' },
            { status: 400 }
          )
        }

        await prisma.purchaseRequest.update({
          where: { id: id },
          data: {
            status: 'APPROVED',
            approvedBy: session.user.id,
            approvedAt: now,
            approvalNotes,
          },
        })

        break

      case 'reject':
        if (existing.status !== 'PENDING') {
          return NextResponse.json(
            { success: false, error: 'สามารถปฏิเสธเฉพาะใบขอซื้อที่มีสถานะรออนุมัติเท่านั้น' },
            { status: 400 }
          )
        }

        await prisma.purchaseRequest.update({
          where: { id: id },
          data: {
            status: 'REJECTED',
            approvedBy: session.user.id,
            approvedAt: now,
            approvalNotes,
          },
        })

        break

      case 'cancel':
        if (existing.status === 'CONVERTED') {
          return NextResponse.json(
            { success: false, error: 'ไม่สามารถยกเลิกใบขอซื้อที่ถูกแปลงเป็นใบสั่งซื้อแล้ว' },
            { status: 400 }
          )
        }

        await prisma.purchaseRequest.update({
          where: { id: id },
          data: {
            status: 'CANCELLED',
          },
        })

        break
    }

    return NextResponse.json({
      success: true,
      message: `ดำเนินการสำเร็จ`,
    })
  } catch (error) {
    console.error('Purchase Request Approval Error:', error)

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
        error: error instanceof Error ? error.message : 'ข้อผิดพลาดในการดำเนินการ',
      },
      { status: 500 }
    )
  }
}
