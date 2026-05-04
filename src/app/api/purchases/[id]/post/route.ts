import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import {
  requireAuth,
  apiResponse,
  apiError,
  unauthorizedError,
  generateDocNumber,
} from '@/lib/api-utils';
import { recordStockMovement } from '@/lib/inventory-service';
import { checkPeriodStatus } from '@/lib/period-service';

// POST /api/purchases/[id]/post - Post purchase invoice (receive from supplier)
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    if (user.role === 'VIEWER') {
      return apiError('ไม่มีสิทธิ์รับใบซื้อ', 403);
    }

    const existing = await db.purchaseInvoice.findUnique({
      where: { id },
      include: {
        vendor: true,
        lines: true,
      },
    });

    if (!existing) {
      return apiError('ไม่พบใบซื้อ', 404);
    }

    if (existing.status !== 'DRAFT') {
      return apiError('ใบซื้อนี้ถูกรับแล้ว');
    }

    if (existing.lines.length === 0) {
      return apiError('ใบซื้อต้องมีอย่างน้อย 1 รายการ');
    }

    // B1. Period Locking - Check if period is open for purchase invoice date
    const periodCheck = await checkPeriodStatus(existing.invoiceDate);
    if (!periodCheck.isValid) {
      return apiError(periodCheck.error || 'ไม่สามารถรับใบซื้อในงวดที่ปิดแล้ว');
    }

    // Cache line data before transaction (needed for transaction closure)
    const lineProductIds = existing.lines
      .map((l) => l.productId)
      .filter((id): id is string => id !== null);

    // Wrap all operations in a single transaction
    const purchase = await db.$transaction(async (tx) => {
      // =========================================================
      // THREE-WAY MATCH VALIDATION
      // =========================================================
      // Only validate when purchase invoice has a PO reference
      if (existing.poNumber) {
        // 1. Look up PurchaseOrder via poNumber
        const purchaseOrder = await tx.purchaseOrder.findFirst({
          where: {
            orderNo: existing.poNumber,
            deletedAt: null,
          },
          include: {
            lines: true,
          },
        });

        if (purchaseOrder) {
          // 2. Look up GRN via PurchaseOrder.goodsReceiptNote relation
          const grn = (purchaseOrder as any).goodsReceiptNoteId
            ? await tx.goodsReceiptNote.findUnique({
                where: { id: (purchaseOrder as any).goodsReceiptNoteId },
                include: { lines: true },
              })
            : null;

          // 3. Build GRN line map: poLineId -> accumulated qtyReceived
          const grnLineMap = new Map<string, number>();
          if (grn) {
            for (const grnLine of grn.lines) {
              if (grnLine.poLineId) {
                grnLineMap.set(
                  grnLine.poLineId,
                  (grnLineMap.get(grnLine.poLineId) ?? 0) + grnLine.qtyReceived
                );
              }
            }
          }

          // 4. Validate each invoice line against PO and GRN
          const blockedLines: {
            lineNo: number;
            description: string;
            issue: string;
            qtyVariancePct: number;
            priceVariancePct: number;
          }[] = [];

          for (const invLine of existing.lines) {
            // Match invoice line to PO line by productId, then fallback by line index
            let matchedPOLine: (typeof purchaseOrder.lines)[0] | null = null;
            if (invLine.productId) {
              matchedPOLine =
                purchaseOrder.lines.find((l) => l.productId === invLine.productId) ?? null;
            }
            if (!matchedPOLine && invLine.lineNo <= purchaseOrder.lines.length) {
              matchedPOLine = purchaseOrder.lines[invLine.lineNo - 1];
            }
            if (!matchedPOLine) continue;

            const qtyPO = matchedPOLine.quantity;
            const qtyGRN = grnLineMap.get(matchedPOLine.id) ?? 0;
            const qtyInvoice = invLine.quantity;
            // PO line unitPrice is Float; invoice line unitPrice is Int (satang) — convert to float Baht
            const pricePO = matchedPOLine.unitPrice;
            const priceInvoice = invLine.unitPrice / 100;

            // Calculate variances
            const qtyVariance = qtyInvoice - qtyGRN;
            const priceVariance = priceInvoice - pricePO;
            const qtyVariancePct =
              qtyGRN > 0 ? (qtyVariance / qtyGRN) * 100 : qtyInvoice > 0 ? 999 : 0;
            const priceVariancePct = pricePO > 0 ? (priceVariance / pricePO) * 100 : 0;

            // Determine match status
            const qtyAbs = Math.abs(qtyVariancePct);
            const priceAbs = Math.abs(priceVariancePct);
            let matchStatus: string;
            if (qtyAbs > 10 || priceAbs > 5) {
              matchStatus = 'BLOCKED';
            } else if (qtyVariance !== 0 && priceVariance !== 0) {
              matchStatus = 'FLAGGED';
            } else if (qtyAbs > 5) {
              matchStatus = 'QTY_VARIANCE';
            } else if (priceAbs > 2) {
              matchStatus = 'PRICE_VARIANCE';
            } else {
              matchStatus = 'MATCHED';
            }

            if (matchStatus === 'BLOCKED') {
              blockedLines.push({
                lineNo: invLine.lineNo,
                description: invLine.description,
                issue: `ปริมาณเกิน 10% หรือราคาเกิน 5%: qtyVariancePct=${qtyVariancePct.toFixed(1)}%, priceVariancePct=${priceVariancePct.toFixed(1)}%`,
                qtyVariancePct,
                priceVariancePct,
              });
            }
          }

          // Reject post if any lines are blocked
          if (blockedLines.length > 0) {
            const summary = blockedLines
              .map((l) => `รายการ ${l.lineNo} (${l.description}): ${l.issue}`)
              .join('; ');
            throw new Error(`ไม่สามารถรับใบซื้อ — พบความแตกต่างเกินขีดจำกัด: ${summary}`);
          }
        }
      }
      // =========================================================
      // END THREE-WAY MATCH VALIDATION
      // =========================================================

      // NOTE: VAT record is already created in the purchase creation route
      // Do not create duplicate VAT records here

      // Record stock movements for inventory items
      const inventoryConfig = await tx.inventoryConfig.findUnique({
        where: { id: 'default' },
      });

      if (inventoryConfig?.defaultWarehouseId && lineProductIds.length > 0) {
        const products = await tx.product.findMany({
          where: { id: { in: lineProductIds } },
          select: { id: true, costPrice: true, isInventory: true },
        });

        const productMap = new Map(products.map((p) => [p.id, p]));

        for (const line of existing.lines) {
          if (!line.productId) continue;

          const product = productMap.get(line.productId);
          if (!product || !product.isInventory) continue;

          await recordStockMovement({
            productId: line.productId,
            warehouseId: inventoryConfig.defaultWarehouseId,
            type: 'RECEIVE',
            quantity: line.quantity,
            unitCost: product.costPrice,
            referenceId: existing.id,
            referenceNo: existing.invoiceNo,
            notes: `รับสินค้าจากผู้ขาย ${existing.vendor.name}`,
            sourceChannel: 'PURCHASE',
          });
        }
      }

      // Create journal entries for the purchase (GR/IR clearing approach)
      // At invoice post: Dr GR/IR Clearing (2160), Dr VAT Input (1145), Cr AP (2110)
      // Inventory (1140) was already booked at GRN receive: Dr 1140 / Cr 2160
      // This entry clears the GR/IR liability and records the vendor AP
      const grirAccount = await tx.chartOfAccount.findUnique({
        where: { code: '2160' },
      });

      const vatInputAccount = await tx.chartOfAccount.findUnique({
        where: { code: '1145' },
      });

      const apAccount = await tx.chartOfAccount.findUnique({
        where: { code: '2110' },
      });

      if (!grirAccount || !vatInputAccount || !apAccount) {
        throw new Error(`ไม่พบบัญชี: GR/IR Clearing (2160), VAT ซื้อ (1145), หรือเจ้าหนี้ (2110)`);
      }

      const entryNo = await generateDocNumber('JOURNAL_ENTRY', 'JE');

      const totalAmount = existing.totalAmount;
      const subtotal = existing.subtotal;
      const vatAmount = existing.vatAmount;

      const journalEntry = await tx.journalEntry.create({
        data: {
          entryNo,
          date: existing.invoiceDate,
          description: `ซื้อสินค้าจาก ${existing.vendor.name}`,
          reference: existing.invoiceNo,
          documentType: 'PURCHASE_INVOICE',
          documentId: existing.id,
          totalDebit: totalAmount,
          totalCredit: totalAmount,
          status: 'POSTED',
          createdById: user.id,
          approvedById: user.id,
          approvedAt: new Date(),
          lines: {
            create: [
              {
                lineNo: 1,
                accountId: grirAccount.id,
                description: 'ล้าง GR/IR Clearing จากการรับสินค้า',
                debit: subtotal,
                credit: 0,
                reference: existing.invoiceNo,
              },
              {
                lineNo: 2,
                accountId: vatInputAccount.id,
                description: 'ภาษีมูลค่าเพิ่มซื้อ',
                debit: vatAmount,
                credit: 0,
                reference: existing.invoiceNo,
              },
              {
                lineNo: 3,
                accountId: apAccount.id,
                description: `เจ้าหนี้ ${existing.vendor.name}`,
                debit: 0,
                credit: totalAmount,
                reference: existing.invoiceNo,
              },
            ],
          },
        },
      });

      // Update purchase invoice with status and journal entry ID atomically
      return tx.purchaseInvoice.update({
        where: { id },
        data: {
          status: 'ISSUED',
          journalEntryId: journalEntry.id,
        },
      });
    });

    return apiResponse({
      message: 'รับใบซื้อสำเร็จ',
      purchase,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('ไม่ได้รับอนุญาต')) {
      return unauthorizedError();
    }
    // Surface three-way match BLOCKED errors with their details
    if (error instanceof Error && error.message.includes('พบความแตกต่างเกินขีดจำกัด')) {
      return apiError(error.message, 422);
    }
    return apiError('เกิดข้อผิดพลาดในการรับใบซื้อ');
  }
}
