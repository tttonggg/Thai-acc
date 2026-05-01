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
import { purchaseOrderShipSchema } from '@/lib/validations';
import { logActivity } from '@/lib/activity-logger';

// POST /api/purchase-orders/[id]/ship - Mark PO as shipped
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
      },
    });

    if (!purchaseOrder) {
      return notFoundError('ไม่พบใบสั่งซื้อ');
    }

    // Validate status transition - only CONFIRMED can be shipped
    if (purchaseOrder.status !== 'CONFIRMED') {
      return apiError('สามารถบันทึกการจัดส่งเฉพาะใบสั่งซื้อที่ยืนยันแล้วเท่านั้น', 400);
    }

    const body = await request.json();
    const validatedData = purchaseOrderShipSchema.parse(body);

    // Prepare metadata for shipping information
    const metadata: any = {
      trackingNumber: validatedData.trackingNumber,
      shippingMethod: validatedData.shippingMethod,
      estimatedDelivery: validatedData.estimatedDelivery
        ? new Date(validatedData.estimatedDelivery)
        : null,
    };

    // Update status to SHIPPED
    const updated = await db.purchaseOrder.update({
      where: { id: id },
      data: {
        status: 'SHIPPED',
        shippedAt: new Date(),
        notes: validatedData.notes ? validatedData.notes : purchaseOrder.notes,
        internalNotes: validatedData.trackingNumber
          ? `${purchaseOrder.internalNotes || ''}\nเลขติดตามพัสดุ: ${validatedData.trackingNumber}`.trim()
          : purchaseOrder.internalNotes,
        attachments: {
          ...((purchaseOrder.attachments as any) || {}),
          shipping: metadata,
        },
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
      action: 'SHIP',
      module: 'purchase-orders',
      recordId: id,
      details: {
        orderNo: updated.orderNo,
        vendorName: updated.vendor.name,
        trackingNumber: validatedData.trackingNumber,
        shippingMethod: validatedData.shippingMethod,
      },
    });

    return apiResponse({
      success: true,
      message: 'บันทึกการจัดส่งเรียบร้อยแล้ว',
      data: updated,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('ไม่ได้รับอนุญาต')) {
      return unauthorizedError();
    }
    if (error instanceof Error && error.name === 'ZodError') {
      return apiError('ข้อมูลไม่ถูกต้อง');
    }
    return apiError('เกิดข้อผิดพลาดในการบันทึกการจัดส่ง');
  }
}
