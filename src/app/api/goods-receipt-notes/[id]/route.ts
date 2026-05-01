// Goods Receipt Note Detail/Update API
// GET /api/goods-receipt-notes/[id] - Get single GRN with lines, vendor, warehouse, PO, journal entry
// PUT /api/goods-receipt-notes/[id] - Update GRN status (RECEIVED -> INSPECTED/CANCELLED), rejected qty, notes
// DELETE /api/goods-receipt-notes/[id] - Cancel GRN: create reversal journal, restore PO receivedQty

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import {
  requireAuth,
  apiResponse,
  apiError,
  unauthorizedError,
  forbiddenError,
} from '@/lib/api-utils';
import { AuthError } from '@/lib/api-auth';
import { z } from 'zod';

// Validation schema for GRN update
const grnUpdateSchema = z.object({
  status: z.enum(['RECEIVED', 'INSPECTED', 'CANCELLED']).optional(),
  notes: z.string().optional(),
  lines: z
    .array(
      z.object({
        id: z.string(),
        qtyRejected: z.number().min(0).default(0),
        notes: z.string().optional(),
      })
    )
    .optional(),
});

// GET /api/goods-receipt-notes/[id]
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const grn = await db.goodsReceiptNote.findUnique({
      where: { id },
      include: {
        purchaseOrder: {
          include: {
            vendor: true,
            lines: {
              include: {
                product: true,
              },
            },
          },
        },
        lines: {
          include: {
            poLine: {
              include: {
                product: true,
              },
            },
            product: true,
          },
        },
        journalEntry: {
          include: {
            lines: {
              include: {
                account: true,
              },
            },
          },
        },
      },
    });

    if (!grn) {
      return apiError('ไม่พบใบรับสินค้า', 404);
    }

    // Fetch vendor and warehouse separately (no direct relation on GoodsReceiptNote)
    const [vendor, warehouse] = await Promise.all([
      grn.vendorId ? db.vendor.findUnique({ where: { id: grn.vendorId } }) : null,
      grn.warehouseId ? db.warehouse.findUnique({ where: { id: grn.warehouseId } }) : null,
    ]);

    // IDOR protection: only ADMIN can access any GRN
    if (user.role !== 'ADMIN') {
      return forbiddenError();
    }

    return apiResponse({ ...grn, vendor, warehouse });
  } catch (error) {
    if (error instanceof AuthError) {
      return unauthorizedError();
    }
    return apiError('เกิดข้อผิดพลาดในการดึงข้อมูลใบรับสินค้า');
  }
}

// PUT /api/goods-receipt-notes/[id]
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    if (user.role === 'VIEWER') {
      return apiError('ไม่มีสิทธิ์แก้ไขใบรับสินค้า', 403);
    }

    // Get existing GRN
    const existingGRN = await db.goodsReceiptNote.findUnique({
      where: { id },
      include: {
        lines: true,
      },
    });

    if (!existingGRN) {
      return apiError('ไม่พบใบรับสินค้า', 404);
    }

    // IDOR protection: only ADMIN can modify any GRN
    if (user.role !== 'ADMIN') {
      return forbiddenError();
    }

    // CANCELLED GRNs cannot be modified
    if (existingGRN.status === 'CANCELLED') {
      return apiError('ใบรับสินค้าที่ยกเลิกแล้วไม่สามารถแก้ไขได้', 400);
    }

    const body = await request.json();
    const validatedData = grnUpdateSchema.parse(body);

    // Update rejected qty on lines if provided
    if (validatedData.lines) {
      for (const lineUpdate of validatedData.lines) {
        await db.goodsReceiptNoteLine.update({
          where: { id: lineUpdate.id },
          data: {
            qtyRejected: lineUpdate.qtyRejected,
            notes: lineUpdate.notes,
          },
        });
      }
    }

    // If status change to INSPECTED: update PO lines' receivedQty
    if (validatedData.status === 'INSPECTED' && existingGRN.status === 'RECEIVED') {
      // Fetch GRN lines with PO line references
      const grnLines = await db.goodsReceiptNoteLine.findMany({
        where: { grnId: id },
        include: { poLine: true },
      });

      // Update each PO line's receivedQty: add accepted qty (qtyReceived - qtyRejected)
      for (const grnLine of grnLines) {
        if (grnLine.poLineId && grnLine.poLine) {
          const acceptedQty = grnLine.qtyReceived - grnLine.qtyRejected;
          await db.purchaseOrderLine.update({
            where: { id: grnLine.poLineId },
            data: {
              receivedQty: grnLine.poLine.receivedQty + acceptedQty,
            },
          });
        }
      }
    }

    // Update GRN fields
    const updateData: Record<string, any> = {};
    if (validatedData.status) updateData.status = validatedData.status;
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;

    const updatedGRN = await db.goodsReceiptNote.update({
      where: { id },
      data: updateData,
      include: {
        purchaseOrder: true,
        lines: {
          include: {
            poLine: {
              include: {
                product: true,
              },
            },
            product: true,
          },
        },
        journalEntry: {
          include: {
            lines: {
              include: {
                account: true,
              },
            },
          },
        },
      },
    });

    // Fetch vendor and warehouse separately (no direct relation on GoodsReceiptNote)
    const [vendor, warehouse] = await Promise.all([
      updatedGRN.vendorId ? db.vendor.findUnique({ where: { id: updatedGRN.vendorId } }) : null,
      updatedGRN.warehouseId
        ? db.warehouse.findUnique({ where: { id: updatedGRN.warehouseId } })
        : null,
    ]);

    return apiResponse({ ...updatedGRN, vendor, warehouse });
  } catch (error) {
    if (error instanceof AuthError) {
      return unauthorizedError();
    }
    if (error instanceof Error && error.name === 'ZodError') {
      return apiError('ข้อมูลไม่ถูกต้อง');
    }
    return apiError('เกิดข้อผิดพลาดในการแก้ไขใบรับสินค้า');
  }
}

// DELETE /api/goods-receipt-notes/[id] - Cancel GRN
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    if (user.role !== 'ADMIN' && user.role !== 'ACCOUNTANT') {
      return forbiddenError();
    }

    const grn = await db.goodsReceiptNote.findUnique({
      where: { id },
      include: {
        lines: true,
        journalEntry: {
          select: { lines: true },
        },
      },
    });

    if (!grn) {
      return apiError('ไม่พบใบรับสินค้า', 404);
    }

    // IDOR protection: only ADMIN can delete any GRN
    if (user.role !== 'ADMIN') {
      return forbiddenError();
    }

    // Only DRAFT or RECEIVED can be cancelled (not INSPECTED or already CANCELLED)
    if (grn.status !== 'DRAFT' && grn.status !== 'RECEIVED') {
      return apiError(
        'สถานะ ' + grn.status + ' ไม่สามารถยกเลิกได้ ต้องเป็น DRAFT หรือ RECEIVED เท่านั้น',
        400
      );
    }

    // DRAFT: soft-delete + cascade children
    if (grn.status === 'DRAFT') {
      await db.$transaction([
        db.goodsReceiptNoteLine.deleteMany({ where: { grnId: id } }),
        db.goodsReceiptNote.update({
          where: { id },
          data: { deletedAt: new Date() },
        }),
      ]);
      return apiResponse({ success: true, message: 'ลบใบรับสินค้าเรียบร้อยแล้ว' });
    }

    // RECEIVED: journal reversal + restore PO quantities + cancel
    // Reverse journal entry if it exists (debit/credit swap)
    const journalEntryId = grn.journalEntryId;
    if (grn.journalEntry && journalEntryId) {
      // Capture narrowed types before entering the transaction callback
      const je = grn.journalEntry;
      const grnNo = grn.grnNo;
      await db.$transaction(async (tx) => {
        // Create reversal journal entry
        const reversalEntry = await tx.journalEntry.create({
          data: {
            entryDate: new Date(),
            description: 'ยกเลิก GRN: ' + grnNo,
            reference: grnNo,
            reversingId: journalEntryId as string,
            createdById: user.id,
            lines: {
              create: je.lines.map((line) => ({
                accountId: line.accountId,
                debit: line.credit, // Swap debit <-> credit
                credit: line.debit,
                description: line.description ?? '',
              })) as any,
            },
          } as any,
        });

        // Mark original journal entry as reversed
        await tx.journalEntry.update({
          where: { id: journalEntryId },
          data: { reversingId: reversalEntry.id },
        });
      });
    }

    // Restore PO receivedQty by subtracting the received qty from GRN lines
    for (const grnLine of grn.lines) {
      if (grnLine.poLineId) {
        const poLine = await db.purchaseOrderLine.findUnique({
          where: { id: grnLine.poLineId },
        });
        if (poLine && poLine.receivedQty !== null) {
          const restoredQty = Math.max(0, poLine.receivedQty - grnLine.qtyReceived);
          await db.purchaseOrderLine.update({
            where: { id: grnLine.poLineId },
            data: { receivedQty: restoredQty },
          });
        }
      }
    }

    // Update GRN status to CANCELLED
    await db.goodsReceiptNote.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    return apiResponse({ success: true, message: 'ยกเลิกใบรับสินค้าเรียบร้อยแล้ว' });
  } catch (error) {
    if (error instanceof AuthError) {
      return unauthorizedError();
    }
    console.error('GRN cancellation error:', error);
    return apiError('เกิดข้อผิดพลาดในการยกเลิกใบรับสินค้า');
  }
}
