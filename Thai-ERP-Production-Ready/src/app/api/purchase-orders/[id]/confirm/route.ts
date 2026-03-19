import { NextRequest } from 'next/server'
import { requireAuth, apiResponse, apiError, unauthorizedError, notFoundError, forbiddenError } from '@/lib/api-utils'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/activity-logger'

// POST /api/purchase-orders/[id]/confirm - Confirm PO from vendor
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()

    // Only ADMIN or ACCOUNTANT can confirm POs
    if (user.role !== 'ADMIN' && user.role !== 'ACCOUNTANT') {
      return forbiddenError('เฉพาะผู้ดูแลระบบหรือนักบัญชีเท่านั้นที่สามารถยืนยันใบสั่งซื้อได้')
    }

    const purchaseOrder = await db.purchaseOrder.findUnique({
      where: { id: params.id },
      include: {
        vendor: true,
        lines: true,
      },
    })

    if (!purchaseOrder) {
      return notFoundError('ไม่พบใบสั่งซื้อ')
    }

    // Validate status transition - only SENT can be confirmed
    if (purchaseOrder.status !== 'SENT') {
      return apiError('สามารถยืนยันเฉพาะใบสั่งซื้อที่ส่งให้ผู้ขายแล้วเท่านั้น', 400)
    }

    // Update status to CONFIRMED
    const updated = await db.purchaseOrder.update({
      where: { id: params.id },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
        updatedById: user.id,
      },
      include: {
        vendor: true,
        lines: {
          include: {
            product: true
          }
        },
      },
    })

    // Log activity
    await logActivity({
      userId: user.id,
      action: 'CONFIRM',
      module: 'purchase-orders',
      recordId: params.id,
      details: {
        orderNo: updated.orderNo,
        vendorName: updated.vendor.name,
      },
    })

    return apiResponse({
      success: true,
      message: 'ยืนยันใบสั่งซื้อเรียบร้อยแล้ว',
      data: updated,
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes('ไม่ได้รับอนุญาต')) {
      return unauthorizedError()
    }
    return apiError('เกิดข้อผิดพลาดในการยืนยันใบสั่งซื้อ')
  }
}
