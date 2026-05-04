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
import { db } from '@/lib/db';
import { recordStockMovement } from '@/lib/inventory-service';
import { handleApiError } from '@/lib/api-error-handler';

// POST /api/stock-takes/[id]/post - Post stock take to GL and update stock
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // Only ADMIN and ACCOUNTANT can post stock takes
    if (user.role !== 'ADMIN' && user.role !== 'ACCOUNTANT') {
      return forbiddenError('ไม่มีสิทธิ์ลงบัญชีการตรวจนับสต็อก');
    }

    const stockTake = await db.stockTake.findUnique({
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

    if (!stockTake) {
      return notFoundError('ไม่พบการตรวจนับสต็อก');
    }

    if (stockTake.status === 'POSTED') {
      return apiError('การตรวจนับสต็อกนี้ได้ลงบัญชีแล้ว');
    }

    if (stockTake.status === 'CANCELLED') {
      return apiError('ไม่สามารถลงบัญชีการตรวจนับสต็อกที่ยกเลิกแล้วได้');
    }

    if (stockTake.status === 'DRAFT') {
      return apiError('กรุณาอนุมัติการตรวจนับสต็อกก่อนลงบัญชี');
    }

    // Get chart of accounts for variance posting
    // Inventory variance account (usually 5xxx - Expense)
    // For Thai accounting: 5200 = ค่าใช้จ่ายในการตรวจนับสินค้า
    const varianceAccount = await db.chartOfAccount.findFirst({
      where: {
        code: '5200', // Inventory variance expense account
      },
    });

    if (!varianceAccount) {
      return apiError('ไม่พบบัญชีค่าความแตกต่างของสต็อก (กรุณาตั้งค่าบัญชี 5200)');
    }

    // Get inventory account (1200 = สินค้าคงเหลือ)
    const inventoryAccount = await db.chartOfAccount.findFirst({
      where: {
        code: '1200',
      },
    });

    if (!inventoryAccount) {
      return apiError('ไม่พบบัญชีสินค้าคงเหลือ (กรุณาตั้งค่าบัญชี 1200)');
    }

    // Calculate total variance
    let totalVarianceValue = 0;
    for (const line of stockTake.lines) {
      totalVarianceValue += line.varianceValue;
    }

    // Only create journal entry if there's a variance
    let journalEntry: Awaited<ReturnType<typeof db.journalEntry.create>> | null = null;
    if (Math.abs(totalVarianceValue) > 0.01) {
      // Generate journal entry number
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');

      const prefix = `JE-${year}${month}`;
      const lastEntry = await db.journalEntry.findFirst({
        where: {
          entryNo: {
            startsWith: prefix,
          },
        },
        orderBy: { entryNo: 'desc' },
      });

      let nextNum = 1;
      if (lastEntry) {
        const parts = lastEntry.entryNo.split('-');
        const lastNum = parseInt(parts[parts.length - 1] || '0');
        nextNum = lastNum + 1;
      }

      const entryNo = `${prefix}-${String(nextNum).padStart(4, '0')}`;

      // Create journal entry lines
      const journalLines: Array<{
        accountId: string;
        description: string;
        debit: number;
        credit: number;
      }> = [];

      if (totalVarianceValue > 0) {
        // Stock increase (positive variance)
        // Debit Inventory, Credit Variance Expense
        journalLines.push({
          accountId: inventoryAccount.id,
          description: `ปรับสต็อกเพิ่ม - การตรวจนับ ${stockTake.stockTakeNumber}`,
          debit: Math.abs(totalVarianceValue),
          credit: 0,
        });
        journalLines.push({
          accountId: varianceAccount.id,
          description: `ปรับสต็อกเพิ่ม - การตรวจนับ ${stockTake.stockTakeNumber}`,
          debit: 0,
          credit: Math.abs(totalVarianceValue),
        });
      } else {
        // Stock decrease (negative variance)
        // Debit Variance Expense, Credit Inventory
        journalLines.push({
          accountId: varianceAccount.id,
          description: `ปรับสต็อกลด - การตรวจนับ ${stockTake.stockTakeNumber}`,
          debit: Math.abs(totalVarianceValue),
          credit: 0,
        });
        journalLines.push({
          accountId: inventoryAccount.id,
          description: `ปรับสต็อกลด - การตรวจนับ ${stockTake.stockTakeNumber}`,
          debit: 0,
          credit: Math.abs(totalVarianceValue),
        });
      }

      // Create journal entry
      journalEntry = await db.journalEntry.create({
        data: {
          entryNo,
          date: stockTake.takeDate,
          description: `การตรวจนับสต็อก ${stockTake.stockTakeNumber} ณ คลัง ${stockTake.warehouse.name}`,
          reference: stockTake.stockTakeNumber,
          documentType: 'STOCK_TAKE',
          documentId: stockTake.id,
          totalDebit: Math.abs(totalVarianceValue),
          totalCredit: Math.abs(totalVarianceValue),
          status: 'POSTED',
          lines: {
            create: journalLines.map((line, index) => ({
              ...line,
              lineNo: index + 1,
            })),
          },
        },
      });
    }

    // Update stock balances and record stock movements
    for (const line of stockTake.lines) {
      if (Math.abs(line.varianceQty) > 0.001) {
        // Record stock movement for variance
        await recordStockMovement({
          productId: line.productId,
          warehouseId: stockTake.warehouseId,
          type: 'COUNT', // Stock count adjustment
          quantity: line.varianceQty,
          unitCost: line.product.costPrice || 0,
          referenceId: stockTake.id,
          referenceNo: stockTake.stockTakeNumber,
          notes: `ปรับปรุงตามการตรวจนับ ${stockTake.stockTakeNumber}`,
          sourceChannel: 'STOCK_TAKE',
        });
      }
    }

    // Update stock take status to POSTED
    const updated = await db.stockTake.update({
      where: { id },
      data: {
        status: 'POSTED',
        journalEntryId: journalEntry?.id,
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

    return apiResponse({
      message: 'ลงบัญชีการตรวจนับสต็อกสำเร็จ',
      data: updated,
      journalEntry,
    });
  } catch (error) {
    if (error.name === 'AuthError') {
      return unauthorizedError();
    }
    console.error('Stock Take Post Error:', error);
    return apiError(error.message || 'เกิดข้อผิดพลาดในการลงบัญชีการตรวจนับสต็อก');
  }
}
