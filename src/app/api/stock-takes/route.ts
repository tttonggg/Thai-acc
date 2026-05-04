import { NextRequest, NextResponse } from 'next/server';
import {
  requireAuth,
  apiResponse,
  apiError,
  unauthorizedError,
  forbiddenError,
  notFoundError,
} from '@/lib/api-utils';
import { AuthError } from '@/lib/api-auth';
import { z } from 'zod';
import { db } from '@/lib/db';

// Wrapper that properly handles auth with request context
async function requireAuthWithRequest(request: NextRequest): Promise<any> {
  // Import the requireAuth that accepts request from api-auth
  const { requireAuth: requireAuthWithReq } = await import('@/lib/api-auth');
  return requireAuthWithReq(request);
}

// Validation schema for stock take lines
const stockTakeLineSchema = z.object({
  productId: z.string().min(1, 'ต้องระบุสินค้า'),
  systemQuantity: z.number().min(0, 'จำนวนในระบบต้องไม่ติดลบ'),
  actualQuantity: z.number().min(0, 'จำนวนนับจริงต้องไม่ติดลบ'),
  notes: z.string().optional(),
});

// Validation schema for stock take
const stockTakeSchema = z.object({
  date: z.string().transform((val) => new Date(val)),
  warehouseId: z.string().min(1, 'ต้องเลือกคลังสินค้า'),
  notes: z.string().optional(),
  lines: z.array(stockTakeLineSchema).min(1, 'ต้องมีอย่างน้อย 1 รายการ'),
});

// Generate stock take number
async function generateStockTakeNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  const prefix = `ST-${year}${month}`;

  const lastStockTake = await db.stockTake.findFirst({
    where: {
      stockTakeNumber: {
        startsWith: prefix,
      },
    },
    orderBy: { stockTakeNumber: 'desc' },
  });

  let nextNum = 1;
  if (lastStockTake) {
    const parts = lastStockTake.stockTakeNumber.split('-');
    const lastNum = parseInt(parts[parts.length - 1] || '0');
    nextNum = lastNum + 1;
  }

  return `${prefix}-${String(nextNum).padStart(4, '0')}`;
}

// GET /api/stock-takes - List stock takes with pagination and filters
export async function GET(request: NextRequest) {
  try {
    await requireAuthWithRequest(request);

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const warehouseId = searchParams.get('warehouseId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) where.status = status;
    if (warehouseId) where.warehouseId = warehouseId;

    if (startDate || endDate) {
      where.takeDate = {};
      if (startDate) where.takeDate.gte = new Date(startDate);
      if (endDate) where.takeDate.lte = new Date(endDate);
    }

    if (search) {
      where.OR = [{ stockTakeNumber: { contains: search } }, { notes: { contains: search } }];
    }

    const [stockTakes, total] = await Promise.all([
      db.stockTake.findMany({
        where,
        include: {
          warehouse: true,
          lines: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { takeDate: 'desc' },
        skip,
        take: limit,
      }),
      db.stockTake.count({ where }),
    ]);

    return apiResponse({
      success: true,
      data: stockTakes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return unauthorizedError();
    }
    console.error('Stock Takes API Error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return apiError('เกิดข้อผิดพลาดในการดึงข้อมูลการตรวจนับสต็อก');
  }
}

// POST /api/stock-takes - Create new stock take
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthWithRequest(request);

    // Only ADMIN and ACCOUNTANT can create stock takes
    if (user.role !== 'ADMIN' && user.role !== 'ACCOUNTANT') {
      return apiError('ไม่มีสิทธิ์สร้างการตรวจนับสต็อก', 403);
    }

    const body = await request.json();
    const validatedData = stockTakeSchema.parse(body);

    // Verify warehouse exists
    const warehouse = await db.warehouse.findUnique({
      where: { id: validatedData.warehouseId },
    });

    if (!warehouse) {
      return notFoundError('ไม่พบคลังสินค้า');
    }

    // Generate stock take number
    const stockTakeNumber = await generateStockTakeNumber();

    // Create stock take with lines
    const stockTake = await db.$transaction(async (tx) => {
      // Create stock take header
      const take = await tx.stockTake.create({
        data: {
          stockTakeNumber,
          takeDate: validatedData.date,
          warehouseId: validatedData.warehouseId,
          status: 'DRAFT',
          notes: validatedData.notes,
        },
      });

      // ✅ OPTIMIZED: Create lines with variance calculations
      // Get all required data in batch first
      const productIds = validatedData.lines.map((l) => l.productId);

      // Get all stock balances in ONE query
      const balances = await tx.stockBalance.findMany({
        where: {
          productId: { in: productIds },
          warehouseId: validatedData.warehouseId,
        },
      });

      // Create a map for quick balance lookup
      const balanceMap = new Map(balances.map((b) => [`${b.productId}_${b.warehouseId}`, b]));

      // Get all products in ONE query
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, costPrice: true },
      });

      // Create a map for quick product lookup
      const productMap = new Map(products.map((p) => [p.id, p]));

      // Now create all lines in parallel using the pre-fetched data
      const lines = await Promise.all(
        validatedData.lines.map((line) => {
          // Get balance from map (no query!)
          const balanceKey = `${line.productId}_${validatedData.warehouseId}`;
          const balance = balanceMap.get(balanceKey);
          const systemQty = balance?.quantity || 0;

          const actualQty = line.actualQuantity;
          const variance = actualQty - systemQty;

          // Get product from map (no query!)
          const product = productMap.get(line.productId);
          const unitCost = product?.costPrice || 0;
          const varianceValue = variance * unitCost;

          return tx.stockTakeLine.create({
            data: {
              stockTakeId: take.id,
              productId: line.productId,
              expectedQty: systemQty,
              actualQty: actualQty,
              varianceQty: variance,
              varianceValue: varianceValue,
              notes: line.notes,
              costPerUnit: unitCost,
            } as any,
            include: {
              product: true,
            },
          });
        })
      );

      return {
        ...take,
        lines,
      };
    });

    // Fetch complete data with relations
    const completeStockTake = await db.stockTake.findUnique({
      where: { id: stockTake.id },
      include: {
        warehouse: true,
        lines: {
          include: {
            product: true,
          },
        },
      },
    });

    return apiResponse({ success: true, data: completeStockTake }, 201);
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return unauthorizedError();
    }
    console.error('Stock Take Creation Error:', error);
    if (error instanceof z.ZodError) {
      return apiError('ข้อมูลไม่ถูกต้อง', 400);
    }
    console.error('Error message:', (error as any)?.message);
    console.error('Error stack:', (error as any)?.stack);
    return apiError((error as any)?.message || 'เกิดข้อผิดพลาดในการสร้างการตรวจนับสต็อก');
  }
}
