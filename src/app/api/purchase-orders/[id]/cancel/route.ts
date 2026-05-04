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
import { purchaseOrderCancelSchema } from '@/lib/validations';
import { logActivity } from '@/lib/activity-logger';

// POST /api/purchase-orders/[id]/cancel - Cancel PO
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
        purchaseInvoice: true,
      },
    });

    if (!purchaseOrder) {
      return notFoundError('ไม่พบใบสั่งซื้อ');
    }

    // Validate which statuses can be cancelled
    const cancellableStatuses = ['DRAFT', 'PENDING', 'SENT', 'CONFIRMED'];
    if (!cancellableStatuses.includes(purchaseOrder.status)) {
      return apiError(`ไม่สามารถยกเลิกใบสั่งซื้อที่อยู่ในสถานะ ${purchaseOrder.status} ได้`, 400);
    }

    // Check if already linked to purchase invoice
    if (purchaseOrder.purchaseInvoiceId) {
      return apiError('ไม่สามารถยกเลิกใบสั่งซื้อที่มีใบซื้ออ้างอิงอยู่', 400);
    }

    const body = await request.json();
    const validatedData = purchaseOrderCancelSchema.parse(body);

    // Update status to CANCELLED
    const updated = await db.purchaseOrder.update({
      where: { id: id },
      data: {
        status: 'CANCELLED',
        notes: validatedData.reason
          ? `${purchaseOrder.notes || ''}\nเหตุผลการยกเลิก: ${validatedData.reason}`.trim()
          : purchaseOrder.notes,
        internalNotes:
          `ยกเลิกโดย ${user.name} (${user.email})\nเหตุผล: ${validatedData.reason}\n${purchaseOrder.internalNotes || ''}`.trim(),
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
      action: 'CANCEL',
      module: 'purchase-orders',
      recordId: id,
      details: {
        orderNo: updated.orderNo,
        vendorName: updated.vendor.name,
        reason: validatedData.reason,
        previousStatus: purchaseOrder.status,
      },
    });

    return apiResponse({
      success: true,
      message: 'ยกเลิกใบสั่งซื้อเรียบร้อยแล้ว',
      data: updated,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('ไม่ได้รับอนุญาต')) {
      return unauthorizedError();
    }
    if (error instanceof Error && error.name === 'ZodError') {
      return apiError('ข้อมูลไม่ถูกต้อง');
    }
    return apiError('เกิดข้อผิดพลาดในการยกเลิกใบสั่งซื้อ');
  }
}
