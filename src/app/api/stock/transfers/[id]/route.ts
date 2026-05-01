// Stock Transfer individual operations API (Agent 03: Inventory Engineer)
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/api-utils';
import { recordStockMovement } from '@/lib/inventory-service';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;

    // Find all movements for this transfer
    const movements = await prisma.stockMovement.findMany({
      where: {
        referenceNo: id,
        type: { in: ['TRANSFER_IN', 'TRANSFER_OUT'] },
      },
      include: {
        product: true,
        warehouse: true,
      },
      orderBy: { date: 'desc' },
    });

    if (movements.length === 0) {
      return NextResponse.json({ success: false, error: 'ไม่พบการโอนสินค้า' }, { status: 404 });
    }

    const outMovement = movements.find((m) => m.type === 'TRANSFER_OUT');
    const inMovement = movements.find((m) => m.type === 'TRANSFER_IN');

    return NextResponse.json({
      success: true,
      data: {
        transferNo: id,
        outMovement,
        inMovement,
        status: inMovement ? 'COMPLETED' : 'IN_TRANSIT',
        product: outMovement?.product || inMovement?.product,
        fromWarehouse: outMovement?.warehouse,
        toWarehouse: inMovement?.warehouse,
        quantity: outMovement?.quantity || inMovement?.quantity,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const { action, receivedQuantity, notes } = body;

    if (action === 'complete') {
      // Get the transfer details first to find destination warehouse
      const transferData = await prisma.$queryRaw<Array<any>>`
        SELECT
          m1."productId",
          m1."warehouseId" as "fromWarehouseId",
          m1.quantity,
          m1."unitCost",
          m1.notes,
          JSON_EXTRACT(m1.metadata, '$.toWarehouseId') as "toWarehouseId"
        FROM "StockMovement" m1
        WHERE m1."referenceNo" = ${id}
        AND m1.type = 'TRANSFER_OUT'
        LIMIT 1
      `;

      if (!transferData || transferData.length === 0) {
        return NextResponse.json({ success: false, error: 'ไม่พบการโอนสินค้า' }, { status: 404 });
      }

      const transfer = transferData[0];

      // Check if already completed
      const existingIn = await prisma.stockMovement.findFirst({
        where: {
          referenceNo: id,
          type: 'TRANSFER_IN',
        },
      });

      if (existingIn) {
        return NextResponse.json(
          { success: false, error: 'การโอนสินค้านี้ได้รับยืนยันแล้ว' },
          { status: 400 }
        );
      }

      // Use received quantity or default to original quantity
      const finalQuantity = receivedQuantity !== undefined ? receivedQuantity : transfer.quantity;

      // If received quantity is different, create adjustment at source
      if (finalQuantity !== transfer.quantity) {
        const difference = transfer.quantity - finalQuantity;

        if (difference > 0) {
          // Some items were damaged/lost - create adjustment at source warehouse
          await recordStockMovement({
            productId: transfer.productId,
            warehouseId: transfer.fromWarehouseId,
            type: 'ADJUST',
            quantity: difference,
            unitCost: transfer.unitCost,
            referenceId: id,
            referenceNo: `ADJ-${id}`,
            notes: `สูญหาย/เสียหายระหว่างการโอน: ${difference} หน่วย`,
            sourceChannel: 'WEB',
          });
        }
      }

      // Create TRANSFER_IN movement with final quantity at destination
      const result = await recordStockMovement({
        productId: transfer.productId,
        warehouseId: transfer.toWarehouseId,
        type: 'TRANSFER_IN',
        quantity: finalQuantity,
        unitCost: transfer.unitCost,
        referenceId: id,
        referenceNo: id,
        notes: notes || 'รับสินค้าโอน',
        sourceChannel: 'WEB',
      });

      return NextResponse.json({
        success: true,
        data: {
          transferNo: id,
          movement: result.movement,
          message: 'ยืนยันการรับสินค้าโอนเรียบร้อยแล้ว',
        },
      });
    }

    if (action === 'cancel') {
      // Cancel a transfer by reversing the TRANSFER_OUT
      const movements = await prisma.stockMovement.findMany({
        where: {
          referenceNo: id,
          type: { in: ['TRANSFER_IN', 'TRANSFER_OUT'] },
        },
      });

      const outMovement = movements.find((m) => m.type === 'TRANSFER_OUT');
      const inMovement = movements.find((m) => m.type === 'TRANSFER_IN');

      if (inMovement) {
        return NextResponse.json(
          { success: false, error: 'ไม่สามารถยกเลิกการโอนที่ได้รับแล้วได้' },
          { status: 400 }
        );
      }

      if (!outMovement) {
        return NextResponse.json({ success: false, error: 'ไม่พบการโอนสินค้า' }, { status: 404 });
      }

      // Reverse the TRANSFER_OUT
      await recordStockMovement({
        productId: outMovement.productId,
        warehouseId: outMovement.warehouseId,
        type: 'TRANSFER_IN',
        quantity: outMovement.quantity,
        unitCost: outMovement.unitCost,
        referenceId: id,
        referenceNo: `CANCEL-${id}`,
        notes: 'ยกเลิกการโอนสินค้า',
        sourceChannel: 'WEB',
      });

      return NextResponse.json({
        success: true,
        message: 'ยกเลิกการโอนสินค้าเรียบร้อยแล้ว',
      });
    }

    return NextResponse.json(
      { success: false, error: 'ไม่รองรับการดำเนินการนี้' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
