import { NextRequest } from 'next/server'
import { requireAuth, apiResponse, apiError, unauthorizedError, notFoundError, forbiddenError } from '@/lib/api-utils'
import { db } from '@/lib/db'
import { purchaseOrderUpdateSchema } from '@/lib/validations'

// GET /api/purchase-orders/[id] - Get single PO by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const { id } = await params

    const purchaseOrder = await db.purchaseOrder.findUnique({
      where: { id },
      include: {
        vendor: {
          select: {
            id: true,
            code: true,
            name: true,
            taxId: true,
            email: true,
            phone: true,
            address: true,
          }
        },
        purchaseRequest: {
          select: {
            id: true,
            requestNo: true,
            requestDate: true,
            status: true,
          }
        },
        budget: {
          select: {
            id: true,
            fiscalYear: true,
            amount: true,
          }
        },
        lines: {
          include: {
            product: {
              select: {
                id: true,
                code: true,
                name: true,
                unit: true,
              }
            }
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        updatedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        purchaseInvoice: {
          select: {
            id: true,
            invoiceNo: true,
            invoiceDate: true,
          }
        },
      },
    })

    if (!purchaseOrder) {
      return notFoundError('ไม่พบใบสั่งซื้อ')
    }

    return apiResponse(purchaseOrder)
  } catch (error) {
    if (error instanceof Error && error.message.includes('ไม่ได้รับอนุญาต')) {
      return unauthorizedError()
    }
    return apiError('เกิดข้อผิดพลาดในการดึงข้อมูลใบสั่งซื้อ')
  }
}

// PUT /api/purchase-orders/[id] - Update PO (DRAFT status only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    if (user.role === 'VIEWER') {
      return forbiddenError()
    }

    const existing = await db.purchaseOrder.findUnique({
      where: { id },
      include: { lines: true }
    })

    if (!existing) {
      return notFoundError('ไม่พบใบสั่งซื้อ')
    }

    // Only allow updating DRAFT status
    if (existing.status !== 'DRAFT') {
      return apiError('ไม่สามารถแก้ไขใบสั่งซื้อที่ไม่อยู่ในสถานะร่าง', 403)
    }

    const body = await request.json()
    const validatedData = purchaseOrderUpdateSchema.parse(body)

    // Calculate totals if lines are provided
    let updateData: any = { ...validatedData }

    if (validatedData.orderDate) {
      updateData.orderDate = new Date(validatedData.orderDate)
    }

    if (validatedData.expectedDate) {
      updateData.expectedDate = new Date(validatedData.expectedDate)
    }

    updateData.updatedById = user.id

    const updated = await db.purchaseOrder.update({
      where: { id },
      data: updateData,
      include: {
        vendor: true,
        lines: {
          include: {
            product: true
          }
        },
      },
    })

    return apiResponse(updated)
  } catch (error) {
    if (error instanceof Error && error.message.includes('ไม่ได้รับอนุญาต')) {
      return unauthorizedError()
    }
    if (error instanceof Error && error.name === 'ZodError') {
      return apiError('ข้อมูลไม่ถูกต้อง')
    }
    return apiError('เกิดข้อผิดพลาดในการแก้ไขใบสั่งซื้อ')
  }
}

// DELETE /api/purchase-orders/[id] - Delete PO (DRAFT status only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    if (user.role === 'VIEWER') {
      return forbiddenError()
    }

    const existing = await db.purchaseOrder.findUnique({
      where: { id },
    })

    if (!existing) {
      return notFoundError('ไม่พบใบสั่งซื้อ')
    }

    // Only allow deleting DRAFT status
    if (existing.status !== 'DRAFT') {
      return apiError('ไม่สามารถลบใบสั่งซื้อที่ไม่อยู่ในสถานะร่าง', 403)
    }

    // Creator or ADMIN only
    if (user.role !== 'ADMIN' && existing.createdById !== user.id) {
      return forbiddenError('ไม่มีสิทธิ์ลบใบสั่งซื้อนี้')
    }

    // Soft delete + cascade
    await db.$transaction([
      db.purchaseOrderLine.deleteMany({ where: { orderId: id } }),
      db.purchaseOrder.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedBy: user.id,
        },
      }),
    ])

    return apiResponse({ success: true, message: 'ลบใบสั่งซื้อเรียบร้อยแล้ว' })
  } catch (error) {
    if (error instanceof Error && error.message.includes('ไม่ได้รับอนุญาต')) {
      return unauthorizedError()
    }
    return apiError('เกิดข้อผิดพลาดในการลบใบสั่งซื้อ')
  }
}
