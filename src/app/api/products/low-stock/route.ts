// GET /api/products/low-stock - Get products below minQuantity
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-utils';
import { db } from '@/lib/db';
const prisma = db;

export async function GET(req: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(req.url);
    const warehouseId = searchParams.get('warehouseId');

    // Fetch stock balances with product info
    const where: any = {};
    if (warehouseId) where.warehouseId = warehouseId;

    const balances = await prisma.stockBalance.findMany({
      where,
      include: {
        product: {
          where: {
            isInventory: true,
            deletedAt: null,
          },
        },
        warehouse: { select: { id: true, name: true } },
      },
    });

    // Filter to products below their minQuantity
    const lowStock = balances
      .filter((b) => {
        const minQty = b.product?.minQuantity ?? 0;
        return b.product && minQty > 0 && b.quantity < minQty;
      })
      .map((b) => ({
        productId: b.productId,
        productName: b.product!.name,
        productCode: b.product!.code,
        unit: b.product!.unit,
        warehouseId: b.warehouseId,
        warehouseName: b.warehouse.name,
        currentQty: b.quantity,
        minQuantity: b.product!.minQuantity,
        shortage: b.product!.minQuantity - b.quantity,
        shortagePct: Math.round((b.quantity / b.product!.minQuantity!) * 100),
      }))
      .sort((a, b) => a.shortagePct - b.shortagePct);

    return NextResponse.json({
      success: true,
      lowStock,
      summary: {
        total: lowStock.length,
        outOfStock: lowStock.filter((p) => p.currentQty === 0).length,
        critical: lowStock.filter((p) => p.shortagePct < 30).length,
      },
    });
  } catch (error: unknown) {
    console.error('Low stock check error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch low stock' },
      { status: 500 }
    );
  }
}
