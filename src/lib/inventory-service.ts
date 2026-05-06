// ============================================
// 📦 Inventory Service (Agent 03: Inventory Engineer)
// TAS 2 Compliant - WAC & FIFO Costing
// Schema-exact field names verified from prisma/schema.prisma
// ============================================
import prisma from '@/lib/db';

export async function recordStockMovement(params: {
  productId: string;
  warehouseId: string;
  type: 'RECEIVE' | 'ISSUE' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'ADJUST' | 'COUNT';
  quantity: number;
  unitCost: number;
  referenceId?: string;
  referenceNo?: string;
  notes?: string;
  sourceChannel?: string;
  metadata?: any;
}) {
  return await prisma.$transaction(async (tx) => {
    const { productId, warehouseId, type, quantity, unitCost, metadata } = params;

    const existingBalance = await tx.stockBalance.findUnique({
      where: { productId_warehouseId: { productId, warehouseId } },
      include: { product: true },
    });

    const product =
      existingBalance?.product ?? (await tx.product.findUnique({ where: { id: productId } }));
    if (!product) throw new Error(`Product ${productId} not found`);

    const costingMethod = (product as any).costingMethod || 'WEIGHTED_AVERAGE';

    let newQty = existingBalance?.quantity || 0;
    let newUnitCost = existingBalance?.unitCost || unitCost;
    let newTotalCost = existingBalance?.totalCost || 0;

    const isIncoming = ['RECEIVE', 'TRANSFER_IN'].includes(type);
    const isOutgoing = ['ISSUE', 'TRANSFER_OUT'].includes(type);

    // ─── WAC (Weighted Average Cost) ──────────────────────────────────────────
    if (isIncoming) {
      if (costingMethod === 'WEIGHTED_AVERAGE') {
        // Integer Satang math: quantity * unitCost gives total in Satang
        const newItemTotalCost = quantity * unitCost;
        const combinedQty = newQty + quantity;
        const combinedCost = newTotalCost + newItemTotalCost;
        // WAC: round to nearest Satang (integer) to avoid float drift
        newUnitCost = combinedQty > 0 ? Math.round(combinedCost / combinedQty) : unitCost;
        newTotalCost = combinedCost;
      }
      newQty += quantity;
    } else if (isOutgoing) {
      if (newQty < quantity) {
        throw new Error(`สต็อกไม่เพียงพอ: มี ${newQty} หน่วย ต้องการ ${quantity} หน่วย`);
      }
      newQty -= quantity;
      // WAC: Integer Satang math for remaining balance
      newTotalCost = Math.round(newQty * newUnitCost);
    } else {
      // ADJUST / COUNT
      newQty += quantity;
      newTotalCost = Math.round(newQty * newUnitCost);
    }

    // ─── FIFO BATCH TRACKING ─────────────────────────────────────────────────
    // For FIFO products, record the incoming batch and consume oldest batches on issue
    if (isIncoming && costingMethod === 'FIFO') {
      // Record incoming batch with cost and remaining quantity
      // All monetary values stored in Satang (integer)
      const unitCostSatang = Math.round(unitCost);
      const totalCostSatang = quantity * unitCostSatang;
      await tx.stockBatch.create({
        data: {
          productId,
          warehouseId,
          batchDate: new Date(),
          quantity,                    // remaining quantity in this batch
          unitCost: unitCostSatang,    // Satang
          totalCost: totalCostSatang,  // Satang
          referenceId: params.referenceId,
          referenceNo: params.referenceNo,
          notes: params.notes,
        },
      });
    } else if (isOutgoing && costingMethod === 'FIFO') {
      // FIFO: consume from oldest batches first (FEFO logic)
      let remainingToIssue = quantity;
      const batches = await tx.stockBatch.findMany({
        where: { productId, warehouseId, quantity: { gt: 0 } },
        orderBy: { batchDate: 'asc' },
      });

      if (batches.length === 0) {
        throw new Error(`ไม่พบ batch สินค้าสำหรับ FIFO: ${productId}`);
      }

      for (const batch of batches) {
        if (remainingToIssue <= 0) break;

        const qtyFromBatch = Math.min(batch.quantity, remainingToIssue);
        // Update batch remaining quantity
        await tx.stockBatch.update({
          where: { id: batch.id },
          data: { quantity: batch.quantity - qtyFromBatch },
        });

        remainingToIssue -= qtyFromBatch;
      }

      if (remainingToIssue > 0) {
        throw new Error(`FIFO batch ไม่เพียงพอ: ยังต้องการอีก ${remainingToIssue} หน่วย`);
      }

      // Recalculate balance totalCost from remaining batches after consumption
      const remainingBatches = await tx.stockBatch.findMany({
        where: { productId, warehouseId },
        select: { totalCost: true },
      });
      newTotalCost = remainingBatches.reduce((sum, b) => sum + b.totalCost, 0);
      // Recalculate unit cost for display (avg of remaining batches in Satang)
      newUnitCost = newQty > 0 ? Math.round(newTotalCost / newQty) : unitCost;
    }

    // Ensure all values are integers (Satang)
    const balance = await tx.stockBalance.upsert({
      where: { productId_warehouseId: { productId, warehouseId } },
      create: {
        productId,
        warehouseId,
        quantity: newQty,
        unitCost: Math.round(newUnitCost),
        totalCost: Math.round(newTotalCost),
      },
      update: { quantity: newQty, unitCost: Math.round(newUnitCost), totalCost: Math.round(newTotalCost) },
    });

    // StockMovement schema fields: date, type, quantity, unitCost, totalCost
    const movement = await tx.stockMovement.create({
      data: {
        productId,
        warehouseId,
        type: type as any,
        quantity,
        unitCost,
        totalCost: quantity * unitCost,
        date: new Date(), // schema field is 'date' not 'movementDate'
        referenceId: params.referenceId,
        referenceNo: params.referenceNo,
        notes: params.notes,
        sourceChannel: params.sourceChannel,
        metadata: metadata || undefined,
      } as any,
    });

    return { balance, movement };
  });
}

export async function calculateCOGS(
  productId: string,
  warehouseId: string,
  quantity: number
): Promise<number> {
  const balance = await prisma.stockBalance.findUnique({
    where: { productId_warehouseId: { productId, warehouseId } },
  });
  if (!balance) return 0;
  return balance.unitCost * quantity;
}

export async function getInventoryValuation(warehouseId?: string) {
  const balances = await prisma.stockBalance.findMany({
    where: warehouseId ? { warehouseId } : undefined,
    include: { product: true, warehouse: true },
    orderBy: { product: { code: 'asc' } },
  });

  const totalValue = balances.reduce((sum, b) => sum + b.totalCost, 0);

  return {
    balances,
    totalValue,
    summary: {
      totalProducts: balances.length,
      totalQty: balances.reduce((sum, b) => sum + b.quantity, 0),
      totalValue,
    },
  };
}

/**
 * Check if a product is below its reorder point after a stock movement.
 * Creates a LOW_STOCK notification for admins if below minQuantity.
 * Called by API routes after recordStockMovement for OUTGOING movements.
 */
export async function checkLowStock(productId: string, warehouseId: string) {

  const balance = await prisma.stockBalance.findUnique({
    where: { productId_warehouseId: { productId, warehouseId } },
    include: { product: true },
  });

  if (!balance) return;

  const { quantity, product } = balance;
  const minQty = product.minQuantity ?? 0;

  // Only alert if: inventory-tracked product, has a minQuantity set, and below threshold
  if (!product.isInventory || minQty <= 0 || quantity >= minQty) return;

  // Find admin users to notify
  const adminUsers = await prisma.user.findMany({
    where: { role: { in: ['ADMIN'] }, isActive: true },
    select: { id: true },
  });

  const message =
    quantity === 0
      ? `สินค้า "${product.name}" หมดสต็อก — ต่ำกว่า minQuantity (${minQty} ${product.unit})`
      : `สินค้า "${product.name}" เหลือ ${quantity} ${product.unit} — ต่ำกว่า minQuantity (${minQty} ${product.unit})`;

  for (const admin of adminUsers) {
    await prisma.notification.create({
      data: {
        userId: admin.id,
        type: 'WARNING',
        title: 'แจ้งเตือนสต็อกต่ำ',
        message,
        module: 'products',
        recordId: productId,
        actionUrl: '/products',
      },
    });
  }
}
