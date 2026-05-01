import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import {
  requireAuth,
  apiResponse,
  apiError,
  unauthorizedError,
  generateDocNumber,
} from '@/lib/api-utils';
import { AuthError } from '@/lib/api-auth';
import { z } from 'zod';

// ============================================
// Zod Schemas
// ============================================

const goodsReceiptNoteLineSchema = z.object({
  poLineId: z.string().optional(),
  productId: z.string().optional(),
  description: z.string().min(1, 'ต้องระบุรายละเอียดสินค้า'),
  unit: z.string().optional(),
  qtyOrdered: z.number().min(0),
  qtyReceived: z.number().min(0),
  qtyRejected: z.number().min(0).default(0),
  unitCost: z.number().min(0).default(0),
  amount: z.number().min(0).default(0),
  notes: z.string().optional(),
});

const createGoodsReceiptNoteSchema = z.object({
  date: z.string().or(z.date()),
  poId: z.string().optional(),
  vendorId: z.string().optional(),
  warehouseId: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(goodsReceiptNoteLineSchema).min(1, 'ต้องมีรายการสินค้าอย่างน้อย 1 รายการ'),
});

// ============================================
// GET /api/goods-receipt-notes
// ============================================

export async function GET(request: NextRequest) {
  try {
    // requireAuth takes no arguments — uses server session internally
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const poId = searchParams.get('poId');
    const vendorId = searchParams.get('vendorId');
    const warehouseId = searchParams.get('warehouseId');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (poId) where.poId = poId;
    if (vendorId) where.vendorId = vendorId;
    if (warehouseId) where.warehouseId = warehouseId;
    if (status) where.status = status;

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const [grns, total] = await Promise.all([
      db.goodsReceiptNote.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: limit,
        include: {
          purchaseOrder: {
            select: { id: true, orderNo: true, status: true },
          },
          journalEntry: {
            select: { id: true, entryNo: true },
          },
          lines: {
            select: { id: true },
          },
        },
      }),
      db.goodsReceiptNote.count({ where }),
    ]);

    // Fetch vendors and warehouses separately to avoid missing-relation errors
    const vendorIds = [
      ...new Set(grns.map((g) => g.vendorId).filter((id): id is string => id !== null)),
    ];
    const warehouseIds = [
      ...new Set(grns.map((g) => g.warehouseId).filter((id): id is string => id !== null)),
    ];

    const [vendors, warehouses] = await Promise.all([
      db.vendor.findMany({
        where: vendorIds.length > 0 ? { id: { in: vendorIds } } : { id: { in: [] as string[] } },
        select: { id: true, code: true, name: true, taxId: true },
      }),
      db.warehouse.findMany({
        where:
          warehouseIds.length > 0 ? { id: { in: warehouseIds } } : { id: { in: [] as string[] } },
        select: { id: true, code: true, name: true },
      }),
    ]);

    const vendorMap = new Map(vendors.map((v) => [v.id, v]));
    const warehouseMap = new Map(warehouses.map((w) => [w.id, w]));

    const result = grns.map((grn) => ({
      ...grn,
      date: grn.date?.toISOString() ?? null,
      createdAt: grn.createdAt?.toISOString() ?? null,
      updatedAt: grn.updatedAt?.toISOString() ?? null,
      lineCount: grn.lines.length,
      vendor: grn.vendorId ? (vendorMap.get(grn.vendorId) ?? null) : null,
      warehouse: grn.warehouseId ? (warehouseMap.get(grn.warehouseId) ?? null) : null,
      lines: undefined,
    }));

    return Response.json({
      success: true,
      data: result,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof AuthError) return unauthorizedError();
    console.error('GoodsReceiptNotes GET error:', error);
    return apiError('เกิดข้อผิดพลาดในการดึงข้อมูลใบรับสินค้า');
  }
}

// ============================================
// POST /api/goods-receipt-notes
// ============================================

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    if (user.role === 'VIEWER') {
      return apiError('ไม่มีสิทธิ์สร้างใบรับสินค้า', 403);
    }

    const body = await request.json();
    const validated = createGoodsReceiptNoteSchema.parse(body);

    const result = await db.$transaction(async (tx) => {
      // --- Validate PO if provided ---
      if (validated.poId) {
        const po = await tx.purchaseOrder.findUnique({
          where: { id: validated.poId },
          include: { lines: true },
        });
        if (!po) {
          throw new Error('ไม่พบใบสั่งซื้อ (PO not found)');
        }
        if (!['CONFIRMED', 'SHIPPED'].includes(po.status)) {
          throw new Error(
            `ใบสั่งซื้อต้องอยู่ในสถานะ CONFIRMED หรือ SHIPPED (สถานะปัจจุบัน: ${po.status})`
          );
        }
        const existingGrn = await tx.goodsReceiptNote.findUnique({
          where: { poId: validated.poId },
        });
        if (existingGrn) {
          throw new Error('ใบสั่งซื้อนี้มี GRN แล้ว ไม่สามารถสร้างซ้ำได้');
        }
      }

      // --- Vendor ---
      let vendorName = '';
      if (validated.vendorId) {
        const vendor = await tx.vendor.findUnique({
          where: { id: validated.vendorId },
        });
        if (!vendor) throw new Error('ไม่พบผู้ขาย (Vendor not found)');
        vendorName = vendor.name;
      }

      // --- Warehouse ---
      if (validated.warehouseId) {
        const warehouse = await tx.warehouse.findUnique({
          where: { id: validated.warehouseId },
        });
        if (!warehouse) throw new Error('ไม่พบคลังสินค้า (Warehouse not found)');
      }

      // --- Account codes: 1140 = Inventory, 2160 = GR/IR Clearing ---
      const inventoryAccount = await tx.chartOfAccount.findUnique({
        where: { code: '1140' },
      });
      if (!inventoryAccount) {
        throw new Error('ไม่พบบัญชีสินค้าคงเหลือ (1140)');
      }

      const grirAccount = await tx.chartOfAccount.findUnique({
        where: { code: '2160' },
      });
      if (!grirAccount) {
        throw new Error('ไม่พบบัญชี GR/IR (2160)');
      }

      // --- Calculate total amount from lines (in Satang) ---
      const totalAmount = validated.lines.reduce(
        (sum, line) => sum + Math.round(line.amount * 100),
        0
      );

      // --- Generate numbers ---
      const grnNo = await generateDocNumber('GRN', 'GRN');
      const entryNo = await generateDocNumber('JOURNAL_ENTRY', 'JE');

      // --- Create GRN (journal entry ID set after creation) ---
      const grn = await tx.goodsReceiptNote.create({
        data: {
          grnNo,
          date: new Date(validated.date),
          status: 'RECEIVED',
          poId: validated.poId ?? null,
          vendorId: validated.vendorId ?? null,
          warehouseId: validated.warehouseId ?? null,
          notes: validated.notes ?? null,
          receivedById: user.id,
          journalEntryId: null as any, // set below
          lines: {
            create: validated.lines.map((line) => ({
              poLineId: line.poLineId ?? null,
              productId: line.productId ?? null,
              description: line.description,
              unit: line.unit ?? null,
              qtyOrdered: line.qtyOrdered,
              qtyReceived: line.qtyReceived,
              qtyRejected: line.qtyRejected,
              unitCost: line.unitCost,
              amount: Math.round(line.amount * 100),
              notes: line.notes ?? null,
            })),
          },
        },
      });

      // --- Create journal entry with documentId pointing to GRN ---
      await tx.journalEntry.create({
        data: {
          entryNo,
          date: new Date(validated.date),
          description: `รับสินค้า ${grnNo}${vendorName ? ` - ${vendorName}` : ''}`,
          reference: grnNo,
          documentType: 'GOODS_RECEIPT_NOTE',
          documentId: grn.id,
          totalDebit: totalAmount,
          totalCredit: totalAmount,
          status: 'POSTED',
          lines: {
            create: [
              {
                lineNo: 1,
                accountId: inventoryAccount.id,
                description: `รับสินค้าเข้าคลัง ${grnNo}`,
                debit: totalAmount,
                credit: 0,
              },
              {
                lineNo: 2,
                accountId: grirAccount.id,
                description: `GR/IR ${grnNo}`,
                debit: 0,
                credit: totalAmount,
              },
            ],
          },
        },
      });

      // --- Link journal entry to GRN ---
      const linkedJournalEntry = await tx.journalEntry.findFirst({
        where: { documentId: grn.id, documentType: 'GOODS_RECEIPT_NOTE' },
        select: { id: true, entryNo: true },
      });

      if (linkedJournalEntry) {
        await tx.goodsReceiptNote.update({
          where: { id: grn.id },
          data: { journalEntryId: linkedJournalEntry.id },
        });
      }

      // --- Update PO receivedQty for each line ---
      if (validated.poId) {
        for (const line of validated.lines) {
          if (line.poLineId) {
            const poLine = await tx.purchaseOrderLine.findUnique({
              where: { id: line.poLineId },
            });
            if (poLine) {
              await tx.purchaseOrderLine.update({
                where: { id: line.poLineId },
                data: {
                  receivedQty: poLine.receivedQty + line.qtyReceived,
                },
              });
            }
          }
        }

        // Update PO status
        const updatedLines = await tx.purchaseOrderLine.findMany({
          where: { orderId: validated.poId },
        });
        const allReceived = updatedLines.every((l) => l.receivedQty >= l.quantity);
        await tx.purchaseOrder.update({
          where: { id: validated.poId },
          data: {
            status: allReceived ? 'RECEIVED' : 'SHIPPED',
            receivedAt: allReceived ? new Date() : undefined,
            grnId: grn.id,
          },
        });
      }

      // Return complete GRN with relations
      return await tx.goodsReceiptNote.findUnique({
        where: { id: grn.id },
        include: {
          purchaseOrder: { select: { id: true, orderNo: true } },
          journalEntry: { select: { id: true, entryNo: true } },
          lines: true,
        },
      });
    });

    // Attach vendor and warehouse if present
    let enriched = result as any;
    if (result && validated.vendorId) {
      const vendor = await db.vendor.findUnique({
        where: { id: validated.vendorId },
        select: { id: true, code: true, name: true },
      });
      enriched = { ...enriched, vendor };
    }
    if (result && validated.warehouseId) {
      const warehouse = await db.warehouse.findUnique({
        where: { id: validated.warehouseId },
        select: { id: true, code: true, name: true },
      });
      enriched = { ...enriched, warehouse };
    }

    return apiResponse(enriched, 201);
  } catch (error) {
    if (error instanceof AuthError) return unauthorizedError();
    if (error instanceof Error && error.name === 'ZodError') {
      return apiError('ข้อมูลไม่ถูกต้อง');
    }
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการสร้างใบรับสินค้า';
    console.error('GoodsReceiptNotes POST error:', error);
    return apiError(message);
  }
}
