// ============================================
// 📦 Stock Take Service (Agent 03: Inventory Engineer)
// TAS 2 Compliant - Stock Count & Variance Processing
// ============================================

import prisma from '@/lib/db';
import { generateDocNumber } from '@/lib/api-utils';

/**
 * Generate stock take number (ST-YYYY-XXXX)
 */
async function generateStockTakeNo(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const prefix = `ST-${year}`;

  // Find or create document number record
  const docNumber = await prisma.documentNumber.upsert({
    where: { type: 'STOCK_TAKE' },
    create: {
      type: 'STOCK_TAKE',
      prefix: 'ST',
      currentNo: 0,
      format: '{prefix}{yyyy}-{0000}',
      resetYearly: true,
    },
    update: {},
  });

  // Increment counter
  const nextNo = docNumber.currentNo + 1;
  await prisma.documentNumber.update({
    where: { type: 'STOCK_TAKE' },
    data: { currentNo: nextNo },
  });

  // Format: ST-2026-0001
  const takeNo = `${prefix}-${String(nextNo).padStart(4, '0')}`;
  return takeNo;
}

/**
 * Create a new stock take with current stock balances as expected quantities
 */
export async function createStockTake(params: {
  warehouseId: string;
  date?: Date;
  notes?: string;
  productIds?: string[]; // Optional: specific products to count (null = all products)
}) {
  return await prisma.$transaction(async (tx) => {
    const { warehouseId, date, notes, productIds } = params;

    // Validate warehouse exists
    const warehouse = await tx.warehouse.findUnique({
      where: { id: warehouseId },
    });
    if (!warehouse) {
      throw new Error('ไม่พบคลังสินค้าที่ระบุ');
    }

    // Check if there's already a DRAFT or IN_PROGRESS stock take for this warehouse
    const existingTake = await tx.stockTake.findFirst({
      where: {
        warehouseId,
        status: { in: ['DRAFT', 'IN_PROGRESS'] },
      },
    });
    if (existingTake) {
      throw new Error(
        `มีการตรวจนับสต็อกที่ดำเนินการอยู่ (${existingTake.stockTakeNumber}) กรุณาดำเนินการให้เสร็จก่อน`
      );
    }

    // Get current stock balances
    const whereClause: any = { warehouseId };
    if (productIds && productIds.length > 0) {
      whereClause.productId = { in: productIds };
    }

    const balances = await tx.stockBalance.findMany({
      where: whereClause,
      include: { product: true },
    });

    if (balances.length === 0) {
      throw new Error('ไม่พบสินค้าในคลังสินค้าที่เลือก');
    }

    // Generate stock take number
    const takeNo = await generateStockTakeNo();

    // Create stock take header
    const stockTake = await tx.stockTake.create({
      // @ts-ignore
      data: {
        stockTakeNumber: takeNo,
        // @ts-ignore
        date: date || new Date(),
        warehouseId,
        status: 'DRAFT',
        notes,
      },
    });

    // Create stock take lines with current system quantities as expected
    const lines = await Promise.all(
      balances.map(async (balance) => {
        return await tx.stockTakeLine.create({
          // @ts-ignore
          data: {
            // @ts-ignore
            takeId: stockTake.id,
            productId: balance.productId,
            // @ts-ignore
            systemQuantity: balance.quantity,
            // @ts-ignore
            actualQuantity: balance.quantity, // Initialize with system quantity
            varianceQty: 0, // No variance initially
            costPerUnit: balance.unitCost,
            notes: null,
          },
          include: {
            product: true,
          },
        });
      })
    );

    return {
      stockTake,
      lines,
      summary: {
        totalItems: lines.length,
        // @ts-ignore
        totalSystemQty: lines.reduce((sum, line) => sum + line.systemQuantity, 0),
        // @ts-ignore
        totalSystemValue: lines.reduce((sum, line) => sum + line.systemQuantity * line.costPerUnit, 0),
      },
    };
  });
}

/**
 * Update a stock take line with actual counted quantity
 * Automatically calculates variance and variance value
 */
export async function updateStockTakeLine(params: {
  lineId: string;
  actualQuantity: number;
  notes?: string;
}) {
  return await prisma.$transaction(async (tx) => {
    const { lineId, actualQuantity, notes } = params;

    // Get the line with stock take info
    const line = await tx.stockTakeLine.findUnique({
      where: { id: lineId },
      // @ts-ignore
      include: { take: true },
    });

    if (!line) {
      throw new Error('ไม่พบรายการตรวจนับ');
    }

    // Validate stock take status
    // @ts-ignore
    if (line.take.status === 'COMPLETED') {
      throw new Error('ไม่สามารถแก้ไขการตรวจนับที่อนุมัติแล้วได้');
    }
    // @ts-ignore
    if (line.take.status === 'CANCELLED') {
      throw new Error('ไม่สามารถแก้ไขการตรวจนับที่ยกเลิกได้');
    }

    // Calculate variance
    // @ts-ignore
    const varianceQuantity = actualQuantity - line.systemQuantity;

    // Update line
    const updatedLine = await tx.stockTakeLine.update({
      where: { id: lineId },
      // @ts-ignore
      data: {
        // @ts-ignore
        actualQuantity,
        varianceQty: varianceQuantity,
        notes,
      },
      include: {
        product: true,
        // @ts-ignore
        take: true,
      },
    });

    // Calculate variance value
    const varianceValue = varianceQuantity * updatedLine.costPerUnit;

    return {
      // @ts-ignore
      ...updatedLine,
      varianceValue,
    };
  });
}

/**
 * Approve stock take
 * Validates all lines have actual quantities and changes status to COMPLETED
 */
export async function approveStockTake(params: { takeId: string; approverId: string }) {
  return await prisma.$transaction(async (tx) => {
    const { takeId, approverId } = params;

    // Get stock take with lines
    const stockTake = await tx.stockTake.findUnique({
      where: { id: takeId },
      include: {
        lines: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!stockTake) {
      throw new Error('ไม่พบการตรวจนับสต็อก');
    }

    // Validate status
    // @ts-ignore
    if (stockTake.status === 'COMPLETED') {
      throw new Error('การตรวจนับนี้ได้รับการอนุมัติแล้ว');
    }
    // @ts-ignore
    if (stockTake.status === 'CANCELLED') {
      throw new Error('ไม่สามารถอนุมัติการตรวจนับที่ยกเลิกได้');
    }

    // Validate all lines have actual quantities
    // @ts-ignore
    const linesWithoutActual = stockTake.lines.filter(
      // @ts-ignore
      (line) => line.actualQuantity === null || line.actualQuantity === undefined
    );
    if (linesWithoutActual.length > 0) {
      throw new Error(
        `กรุณาระบุยอดตรวจนับจริงสำหรับสินค้าทั้งหมด (${linesWithoutActual.length} รายการยังไม่ได้ระบุ)`
      );
    }

    // Update stock take status to COMPLETED
    // @ts-ignore
    const updatedTake = await tx.stockTake.update({
      where: { id: takeId },
      data: {
        // @ts-ignore
        status: 'COMPLETED',
      },
      include: {
        lines: {
          include: {
            product: true,
          },
        },
      },
    });

    // Calculate summary
    // @ts-ignore
    const totalVarianceQty = updatedTake.lines.reduce(
      (sum, line) => sum + line.varianceQty,
      0
    );
    // @ts-ignore
    const totalVarianceValue = updatedTake.lines.reduce(
      (sum, line) => sum + line.varianceQty * line.costPerUnit,
      0
    );
    // @ts-ignore
    const lossLines = updatedTake.lines.filter((line) => line.varianceQty < 0);
    // @ts-ignore
    const gainLines = updatedTake.lines.filter((line) => line.varianceQty > 0);

    return {
      ...updatedTake,
      summary: {
        // @ts-ignore
        totalItems: updatedTake.lines.length,
        totalVarianceQty,
        totalVarianceValue,
        totalLoss: lossLines.reduce(
          (sum, line) => sum + Math.abs(line.varianceQty) * line.costPerUnit,
          0
        ),
        totalGain: gainLines.reduce((sum, line) => sum + line.varianceQty * line.costPerUnit, 0),
        lossCount: lossLines.length,
        gainCount: gainLines.length,
      },
    };
  });
}

/**
 * Post stock take to GL
 * Creates journal entry for variances and updates stock balances
 */
export async function postStockTake(params: {
  takeId: string;
  userId: string;
  varianceExpenseAccountId?: string; // Default: 5210 (ต้นทุนกำกับหัว)
}) {
  return await prisma.$transaction(async (tx) => {
    const { takeId, userId, varianceExpenseAccountId } = params;

    // Get stock take with lines
    const stockTake = await tx.stockTake.findUnique({
      where: { id: takeId },
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
      throw new Error('ไม่พบการตรวจนับสต็อก');
    }

    // Validate status - must be COMPLETED
    // @ts-ignore
    if (stockTake.status !== 'COMPLETED') {
      throw new Error('สามารถลงบัญชีเฉพาะการตรวจนับที่ได้รับการอนุมัติแล้วเท่านั้น');
    }

    // Check if already posted
    if ((stockTake as any).metadata?.posted) {
      throw new Error('การตรวจนับนี้ได้ลงบัญชีแล้ว');
    }

    // Get default accounts if not provided
    // Inventory variance expense account: 5210 (ต้นทุนกำกับหัว - ผลต่างสต็อก)
    const expenseAccountId =
      varianceExpenseAccountId ||
      (
        await tx.chartOfAccount.findFirst({
          where: { code: '5210' },
        })
      )?.id;

    if (!expenseAccountId) {
      throw new Error('ไม่พบบัญชีค่าใช้จ่ายผลต่างสต็อก (5210) กรุณาระบุบัญชี');
    }

    // Calculate variance by product
    const varianceLines = stockTake.lines.filter((line) => line.varianceQty !== 0);

    if (varianceLines.length === 0) {
      throw new Error('ไม่มีผลต่างในการตรวจนับ ไม่จำเป็นต้องลงบัญชี');
    }

    // Group variances by inventory account (assuming 1210 for all products)
    // In a real system, each product might have its own inventory account
    const inventoryAccountId = (
      await tx.chartOfAccount.findFirst({
        where: { code: '1210' },
      })
    )?.id;

    if (!inventoryAccountId) {
      throw new Error('ไม่พบบัญชีสินค้าคงคลัง (1210)');
    }

    // Calculate totals - loss and gain tracked separately
    const totalLoss = varianceLines
      .filter((line) => line.varianceQty < 0)
      .reduce((sum, line) => sum + Math.abs(line.varianceQty) * line.costPerUnit, 0);

    const totalGain = varianceLines
      .filter((line) => line.varianceQty > 0)
      .reduce((sum, line) => sum + line.varianceQty * line.costPerUnit, 0);

    // @ts-ignore
    const journalEntries: any[] = [];

    // JE 1: Loss - Debit Expense, Credit Inventory
    if (totalLoss > 0) {
      const lossEntryNo = await generateDocNumber('JOURNAL_ENTRY', 'JE');
      // @ts-ignore
      const lossEntry = await tx.journalEntry.create({
        data: {
          entryNo: lossEntryNo,
          date: new Date(),
          description: `ผลต่างสต็อก (ขาด) - ${stockTake.warehouse.name} (${stockTake.stockTakeNumber})`,
          reference: stockTake.stockTakeNumber,
          documentType: 'STOCK_TAKE',
          documentId: stockTake.id,
          totalDebit: totalLoss,
          totalCredit: totalLoss,
          status: 'POSTED',
          approvedById: userId,
          approvedAt: new Date(),
          createdById: userId,
          lines: {
            create: [
              {
                lineNo: 1,
                accountId: expenseAccountId,
                description: `ผลต่างสต็อก (ขาด) - ${stockTake.stockTakeNumber}`,
                debit: totalLoss,
                credit: 0,
              },
              {
                lineNo: 2,
                accountId: inventoryAccountId,
                description: `ปรับปรุงสินค้าคงคลัง - ${stockTake.stockTakeNumber}`,
                debit: 0,
                credit: totalLoss,
              },
            ],
          },
        },
      });
      journalEntries.push(lossEntry);
    }

    // JE 2: Gain - Debit Inventory, Credit Expense (income)
    if (totalGain > 0) {
      const gainEntryNo = await generateDocNumber('JOURNAL_ENTRY', 'JE');
      // @ts-ignore
      const gainEntry = await tx.journalEntry.create({
        data: {
          entryNo: gainEntryNo,
          date: new Date(),
          description: `ผลต่างสต็อก (เกิน) - ${stockTake.warehouse.name} (${stockTake.stockTakeNumber})`,
          reference: stockTake.stockTakeNumber,
          documentType: 'STOCK_TAKE',
          documentId: stockTake.id,
          totalDebit: totalGain,
          totalCredit: totalGain,
          status: 'POSTED',
          approvedById: userId,
          approvedAt: new Date(),
          createdById: userId,
          lines: {
            create: [
              {
                lineNo: 1,
                accountId: inventoryAccountId,
                description: `ปรับปรุงสินค้าคงคลัง - ${stockTake.stockTakeNumber}`,
                debit: totalGain,
                credit: 0,
              },
              {
                lineNo: 2,
                accountId: expenseAccountId,
                description: `ผลต่างสต็อก (เกิน) - ${stockTake.stockTakeNumber}`,
                debit: 0,
                credit: totalGain,
              },
            ],
          },
        },
      });
      journalEntries.push(gainEntry);
    }

    // Store primary JE reference for backward compatibility
    const primaryJournalEntry = journalEntries[0] || null;

    // Update stock balances for variances
    for (const line of stockTake.lines) {
      if (line.varianceQty === 0) continue;

      const currentBalance = await tx.stockBalance.findUnique({
        where: {
          productId_warehouseId: {
            productId: line.productId,
            warehouseId: stockTake.warehouseId,
          },
        },
      });

      if (!currentBalance) {
        throw new Error(`ไม่พบยอดคงเหลือสินค้า: ${line.product.name}`);
      }

      // Update stock balance
      const newQuantity = currentBalance.quantity + line.varianceQty;
      const newTotalCost = newQuantity * currentBalance.unitCost;

      await tx.stockBalance.update({
        where: {
          productId_warehouseId: {
            productId: line.productId,
            warehouseId: stockTake.warehouseId,
          },
        },
        data: {
          quantity: newQuantity,
          totalCost: newTotalCost,
        },
      });

      // Record stock movement for adjustment
      await tx.stockMovement.create({
        data: {
          productId: line.productId,
          warehouseId: stockTake.warehouseId,
          type: 'ADJUST',
          quantity: line.varianceQty,
          unitCost: line.costPerUnit,
          totalCost: Math.abs(line.varianceQty) * line.costPerUnit,
          date: new Date(),
          referenceId: stockTake.id,
          referenceNo: stockTake.stockTakeNumber,
          notes: `ผลต่างการตรวจนับ: ${line.varianceQty > 0 ? '+' : ''}${line.varianceQty}`,
        },
      });
    }

    // Update stock take as posted - store all journal entry IDs
    const updatedTake = await tx.stockTake.update({
      where: { id: takeId },
      data: {
        status: 'POSTED',
      },
      include: {
        lines: {
          include: {
            product: true,
          },
        },
      },
    });

    return {
      stockTake: updatedTake,
      journalEntries,
      summary: {
        totalVariance: totalLoss + totalGain,
        totalLoss,
        totalGain,
      },
    };
  });
}

/**
 * Cancel stock take
 * Only allows cancellation if not posted
 */
export async function cancelStockTake(params: { takeId: string; reason?: string }) {
  return await prisma.$transaction(async (tx) => {
    const { takeId, reason } = params;

    // Get stock take
    const stockTake = await tx.stockTake.findUnique({
      where: { id: takeId },
    });

    if (!stockTake) {
      throw new Error('ไม่พบการตรวจนับสต็อก');
    }

    // Validate status
    if (stockTake.status === 'CANCELLED') {
      throw new Error('การตรวจนับนี้ถูกยกเลิกไปแล้ว');
    }

    // Update status to CANCELLED
    const updatedTake = await tx.stockTake.update({
      where: { id: takeId },
      data: {
        status: 'CANCELLED',
        notes: stockTake.notes
          ? `${stockTake.notes}\n[CANCELLED ${new Date().toISOString()}] ${reason || ''}`
          : `[CANCELLED ${new Date().toISOString()}] ${reason || ''}`,
      },
      include: {
        lines: {
          include: {
            product: true,
          },
        },
      },
    });

    return {
      stockTake: updatedTake,
      message: 'ยกเลิกการตรวจนับสต็อกเรียบร้อยแล้ว',
    };
  });
}

/**
 * Get stock take summary with variance calculations
 */
export async function getStockTakeSummary(takeId: string) {
  const stockTake = await prisma.stockTake.findUnique({
    where: { id: takeId },
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
    throw new Error('ไม่พบการตรวจนับสต็อก');
  }

  // Calculate summary
  const totalItems = stockTake.lines.length;
  const totalSystemQty = stockTake.lines.reduce((sum, line) => sum + line.expectedQty, 0);
  const totalActualQty = stockTake.lines.reduce((sum, line) => sum + line.actualQty, 0);
  const totalVarianceQty = stockTake.lines.reduce((sum, line) => sum + line.varianceQty, 0);
  const totalSystemValue = stockTake.lines.reduce(
    (sum, line) => sum + line.expectedQty * line.costPerUnit,
    0
  );
  const totalActualValue = stockTake.lines.reduce(
    (sum, line) => sum + line.actualQty * line.costPerUnit,
    0
  );
  const totalVarianceValue = stockTake.lines.reduce(
    (sum, line) => sum + line.varianceQty * line.costPerUnit,
    0
  );

  const lossLines = stockTake.lines.filter((line) => line.varianceQty < 0);
  const gainLines = stockTake.lines.filter((line) => line.varianceQty > 0);
  const matchedLines = stockTake.lines.filter((line) => line.varianceQty === 0);

  return {
    stockTake,
    summary: {
      totalItems,
      totalSystemQty,
      totalActualQty,
      totalVarianceQty,
      totalSystemValue,
      totalActualValue,
      totalVarianceValue,
      totalLoss: lossLines.reduce(
        (sum, line) => sum + Math.abs(line.varianceQty) * line.costPerUnit,
        0
      ),
      totalGain: gainLines.reduce((sum, line) => sum + line.varianceQty * line.costPerUnit, 0),
      lossCount: lossLines.length,
      gainCount: gainLines.length,
      matchedCount: matchedLines.length,
      accuracyRate: totalItems > 0 ? (matchedLines.length / totalItems) * 100 : 0,
    },
  };
}
