// Stock Transfers API (Agent 03: Inventory Engineer)
// Creates TRANSFER_OUT and TRANSFER_IN movements for warehouse-to-warehouse transfers
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/api-utils';
import { recordStockMovement } from '@/lib/inventory-service';

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Fetch stock movements that are TRANSFER_IN or TRANSFER_OUT
    // Group them by referenceNo (transfer number) to show complete transfers
    const movements = await prisma.stockMovement.findMany({
      where: {
        type: { in: ['TRANSFER_IN', 'TRANSFER_OUT'] },
      },
      include: { product: true, warehouse: true },
      orderBy: { date: 'desc' },
      skip,
      take: limit,
    });

    // Get unique transfer numbers
    const transferNos = Array.from(new Set(movements.map((m) => m.referenceNo).filter(Boolean)));

    // Build transfer list by grouping movements
    const transfers = await Promise.all(
      transferNos.map(async (transferNo) => {
        const transferMovements = movements.filter((m) => m.referenceNo === transferNo);
        const outMovement = transferMovements.find((m) => m.type === 'TRANSFER_OUT');
        const inMovement = transferMovements.find((m) => m.type === 'TRANSFER_IN');

        return {
          transferNo,
          date: outMovement?.date || inMovement?.date,
          productId: outMovement?.productId || inMovement?.productId,
          product: outMovement?.product || inMovement?.product,
          fromWarehouse: outMovement?.warehouse,
          toWarehouse: inMovement?.warehouse,
          quantity: outMovement?.quantity || inMovement?.quantity,
          status: inMovement ? 'COMPLETED' : 'IN_TRANSIT',
          notes: outMovement?.notes,
        };
      })
    );

    const total = transferNos.length;

    return NextResponse.json({
      success: true,
      data: transfers,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const body = await request.json();
    const { fromWarehouseId, toWarehouseId, productId, quantity, date, notes } = body;

    // Validation
    if (!fromWarehouseId || !toWarehouseId || !productId || !quantity) {
      return NextResponse.json(
        {
          success: false,
          error: 'ข้อมูลไม่ครบถ้วน: ต้องระบุคลังต้นทาง, คลังปลายทาง, สินค้า และจำนวน',
        },
        { status: 400 }
      );
    }

    if (fromWarehouseId === toWarehouseId) {
      return NextResponse.json(
        { success: false, error: 'คลังต้นทางและคลังปลายทางต้องไม่ใช่คลังเดียวกัน' },
        { status: 400 }
      );
    }

    if (quantity <= 0) {
      return NextResponse.json({ success: false, error: 'จำนวนต้องมากกว่า 0' }, { status: 400 });
    }

    // Get product to get current unit cost
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        stockBalances: {
          where: { warehouseId: fromWarehouseId },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ success: false, error: 'ไม่พบสินค้า' }, { status: 404 });
    }

    const sourceBalance = product.stockBalances[0];
    if (!sourceBalance || sourceBalance.quantity < quantity) {
      return NextResponse.json(
        {
          success: false,
          error: `สต็อกไม่เพียงพอ: มี ${sourceBalance?.quantity || 0} หน่วย ต้องการ ${quantity} หน่วย`,
        },
        { status: 400 }
      );
    }

    // Generate transfer number (format: TRF-YYYYMM-XXXX)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `TRF-${year}${month}`;

    // Find or create document number for transfers
    let docNumber = await prisma.documentNumber.findUnique({
      where: { type: 'STOCK_TRANSFER' },
    });

    if (!docNumber) {
      docNumber = await prisma.documentNumber.create({
        data: {
          type: 'STOCK_TRANSFER',
          prefix,
          currentNo: 0,
          format: '{prefix}-{0000}',
          resetMonthly: true,
        },
      });
    }

    // Check if we need to reset (new month)
    const currentPrefix = `${prefix}`;
    if (!docNumber.prefix.startsWith(currentPrefix)) {
      await prisma.documentNumber.update({
        where: { type: 'STOCK_TRANSFER' },
        data: { prefix: currentPrefix, currentNo: 0 },
      });
      docNumber.prefix = currentPrefix;
      docNumber.currentNo = 0;
    }

    // Increment and generate transfer number
    docNumber.currentNo += 1;
    const transferNo = `${prefix}-${String(docNumber.currentNo).padStart(4, '0')}`;

    await prisma.documentNumber.update({
      where: { type: 'STOCK_TRANSFER' },
      data: { currentNo: docNumber.currentNo },
    });

    // Get unit cost from source warehouse
    const unitCost = sourceBalance.unitCost;

    // Create TRANSFER_OUT movement (reduces source stock)
    // Store destination warehouse in metadata for completion
    const outResult = await recordStockMovement({
      productId,
      warehouseId: fromWarehouseId,
      type: 'TRANSFER_OUT',
      quantity,
      unitCost,
      referenceId: transferNo,
      referenceNo: transferNo,
      notes: notes ? `${notes} (โอนออก)` : 'โอนสินค้าออก',
      sourceChannel: 'WEB',
      metadata: {
        toWarehouseId,
      },
    });

    // Note: TRANSFER_IN will be created when the transfer is completed via PUT /api/stock/transfers/[id]

    return NextResponse.json(
      {
        success: true,
        data: {
          transferNo,
          outMovement: outResult.movement,
          fromBalance: outResult.balance,
          status: 'IN_TRANSIT',
          message: 'สร้างการโอนสินค้าและรอการยืนยันการรับที่คลังปลายทาง',
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
