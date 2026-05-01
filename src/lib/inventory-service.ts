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

    if (isIncoming) {
      if (costingMethod === 'WEIGHTED_AVERAGE') {
        // Integer Satang math: quantity * unitCost gives total in Satang
        const newItemTotalCost = quantity * unitCost;
        const combinedQty = newQty + quantity;
        const combinedCost = newTotalCost + newItemTotalCost;
        // WAC: round to nearest Satang (integer) to avoid float drift
        newUnitCost = combinedQty > 0 ? Math.round(combinedCost / combinedQty) : unitCost;
        newTotalCost = combinedCost;
      } else {
        // FIFO/batch: accumulate total cost in Satang
        newTotalCost = newTotalCost + quantity * unitCost;
      }
      newQty += quantity;
    } else if (isOutgoing) {
      if (newQty < quantity) {
        throw new Error(`สต็อกไม่เพียงพอ: มี ${newQty} หน่วย ต้องการ ${quantity} หน่วย`);
      }
      newQty -= quantity;
      // Integer Satang math for remaining balance
      newTotalCost = Math.round(newQty * newUnitCost);
    } else {
      // ADJUST / COUNT
      newQty += quantity;
      newTotalCost = Math.round(newQty * newUnitCost);
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
      },
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
