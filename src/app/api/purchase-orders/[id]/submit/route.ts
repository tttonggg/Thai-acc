import { NextRequest } from 'next/server';
import {
  requireAuth,
  apiResponse,
  apiError,
  unauthorizedError,
  notFoundError,
  forbiddenError,
} from '@/lib/api-utils';
import { db } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';

// POST /api/purchase-orders/[id]/submit - Submit PO to vendor
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    if (user.role === 'VIEWER') {
      return forbiddenError();
    }

    const purchaseOrder = await db.purchaseOrder.findUnique({
      where: { id: id },
      include: {
        vendor: true,
        lines: true,
      },
    });

    if (!purchaseOrder) {
      return notFoundError('ไม่พบใบสั่งซื้อ');
    }

    // Validate status transition
    if (purchaseOrder.status !== 'DRAFT' && purchaseOrder.status !== 'PENDING') {
      return apiError('สามารถส่งเฉพาะใบสั่งซื้อที่อยู่ในสถานะร่างหรือรออนุมัติเท่านั้น', 400);
    }

    // Validate vendor exists
    if (!purchaseOrder.vendor) {
      return apiError('ไม่พบข้อมูลผู้ขาย', 400);
    }

    // Validate lines exist
    if (!purchaseOrder.lines || purchaseOrder.lines.length === 0) {
      return apiError('ใบสั่งซื้อต้องมีรายการสินค้าอย่างน้อย 1 รายการ', 400);
    }

    // Update status to SENT (using OrderStatus enum value)
    const updated = await db.purchaseOrder.update({
      where: { id: id },
      data: {
        status: 'SENT',
        submittedAt: new Date(),
        updatedById: user.id,
      },
      include: {
        vendor: true,
        lines: {
          include: {
            product: true,
          },
        },
      },
    });

    // Log activity
    await logActivity({
      userId: user.id,
      action: 'SUBMIT',
      module: 'purchase-orders',
      recordId: id,
      details: {
        orderNo: updated.orderNo,
        vendorName: updated.vendor.name,
      },
    });

    return apiResponse({
      success: true,
      message: 'ส่งใบสั่งซื้อให้ผู้ขายเรียบร้อยแล้ว',
      data: updated,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('ไม่ได้รับอนุญาต')) {
      return unauthorizedError();
    }
    return apiError('เกิดข้อผิดพลาดในการส่งใบสั่งซื้อ');
  }
}
