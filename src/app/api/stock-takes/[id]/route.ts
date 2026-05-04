import { NextRequest, NextResponse } from 'next/server';
import {
  requireAuth,
  requireRole,
  apiError,
  notFoundError,
  unauthorizedError,
  forbiddenError,
} from '@/lib/api-auth';
import { apiResponse } from '@/lib/api-utils';
import { z } from 'zod';
import { db } from '@/lib/db';
import { handleApiError } from '@/lib/api-error-handler';

// Validation schema for updating stock take
const updateStockTakeSchema = z.object({
  takeDate: z
    .string()
    .transform((val) => new Date(val))
    .optional(),
  warehouseId: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['DRAFT', 'IN_PROGRESS', 'PENDING_APPROVAL', 'APPROVED', 'POSTED', 'CANCELLED']).optional(),
});

// Validation schema for stock take lines
const stockTakeLineSchema = z.object({
  productId: z.string().min(1, 'ต้องระบุสินค้า'),
  actualQuantity: z.number().min(0, 'จำนวนนับจริงต้องไม่ติดลบ'),
  notes: z.string().optional(),
});

// GET /api/stock-takes/[id] - Get single stock take
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;

    const stockTake = await db.stockTake.findUnique({
      where: { id },
      include: {
        warehouse: true,
        lines: {
          include: {
            product: true,
          },
          orderBy: {
            product: {
              code: 'asc',
            },
          },
        },
      },
    });

    if (!stockTake) {
      return notFoundError('ไม่พบการตรวจนับสต็อก');
    }

    return apiResponse(stockTake);
  } catch (error) {
    if (error.name === 'AuthError') {
      return unauthorizedError();
    }
    return apiError('เกิดข้อผิดพลาดในการดึงข้อมูลการตรวจนับสต็อก');
  }
}

// PUT /api/stock-takes/[id] - Update stock take
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    if (user.role === 'VIEWER') {
      return forbiddenError('ไม่มีสิทธิ์แก้ไขการตรวจนับสต็อก');
    }

    const existing = await db.stockTake.findUnique({
      where: { id },
    });

    if (!existing) {
      return notFoundError('ไม่พบการตรวจนับสต็อก');
    }

    if (existing.status === 'POSTED') {
      return apiError('ไม่สามารถแก้ไขการตรวจนับสต็อกที่เสร็จสมบูรณ์แล้วได้');
    }

    if (existing.status === 'CANCELLED') {
      return apiError('ไม่สามารถแก้ไขการตรวจนับสต็อกที่ยกเลิกแล้วได้');
    }

    const body = await request.json();

    // Check if updating lines
    if (body.lines) {
      const validatedLines = z.array(stockTakeLineSchema).parse(body.lines);

      // Delete existing lines and recreate
      await db.$transaction(async (tx) => {
        await tx.stockTakeLine.deleteMany({
          where: { stockTakeId: id },
        });

        // Recreate lines with updated actual quantities
        for (const line of validatedLines) {
          // Get current system stock
          const balance = await tx.stockBalance.findFirst({
            where: {
              productId: line.productId,
              warehouseId: existing.warehouseId,
            },
          });

          const systemQty = balance?.quantity || 0;
          const actualQty = line.actualQuantity;
          const variance = actualQty - systemQty;

          // Calculate variance value
          const product = await tx.product.findUnique({
            where: { id: line.productId },
          });

          const unitCost = product?.costPrice || 0;
          const varianceValue = variance * unitCost;

          await tx.stockTakeLine.create({
            data: {
              stockTakeId: id,
              productId: line.productId,
              expectedQty: systemQty,
              actualQty: actualQty,
              varianceQty: variance,
              varianceValue: varianceValue,
              notes: line.notes,
              costPerUnit: unitCost,
            } as any,
          });
        }
      });

      // Fetch updated stock take
      const updatedStockTake = await db.stockTake.findUnique({
        where: { id },
        include: {
          warehouse: true,
          lines: {
            include: {
              product: true,
            },
          },
        },
      });

      return apiResponse(updatedStockTake);
    }

    // Update header fields only
    const validatedData = updateStockTakeSchema.parse(body);

    const stockTake = await db.stockTake.update({
      where: { id },
      data: {
        ...(validatedData.takeDate && { takeDate: validatedData.takeDate }),
        ...(validatedData.warehouseId && { warehouseId: validatedData.warehouseId }),
        ...(validatedData.notes !== undefined && { notes: validatedData.notes }),
        ...(validatedData.status && { status: validatedData.status }),
      },
      include: {
        warehouse: true,
        lines: {
          include: {
            product: true,
          },
        },
      },
    });

    return apiResponse(stockTake);
  } catch (error) {
    if (error.name === 'AuthError') {
      return unauthorizedError();
    }
    if (error.name === 'ZodError') {
      return apiError('ข้อมูลไม่ถูกต้อง');
    }
    console.error('Stock Take Update Error:', error);
    return apiError(error.message || 'เกิดข้อผิดพลาดในการแก้ไขการตรวจนับสต็อก');
  }
}

// DELETE /api/stock-takes/[id] - Cancel stock take
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    if (user.role !== 'ADMIN' && user.role !== 'ACCOUNTANT') {
      return forbiddenError('ไม่มีสิทธิ์ยกเลิกการตรวจนับสต็อก');
    }

    const existing = await db.stockTake.findUnique({
      where: { id },
    });

    if (!existing) {
      return notFoundError('ไม่พบการตรวจนับสต็อก');
    }

    if (existing.status === 'CANCELLED') {
      return apiError('การตรวจนับสต็อกนี้ถูกยกเลิกแล้ว');
    }

    if (existing.status === 'POSTED') {
      return apiError('ไม่สามารถยกเลิกการตรวจนับสต็อกที่เสร็จสมบูรณ์แล้วได้');
    }

    // Update status to cancelled
    const stockTake = await db.stockTake.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    return apiResponse({
      message: 'ยกเลิกการตรวจนับสต็อกสำเร็จ',
      stockTake,
    });
  } catch (error) {
    if (error.name === 'AuthError') {
      return unauthorizedError();
    }
    return apiError('เกิดข้อผิดพลาดในการยกเลิกการตรวจนับสต็อก');
  }
}
