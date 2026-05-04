import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/api-utils';
import { handleApiError } from '@/lib/api-error-handler';

// GET - List products (requires authentication)
export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const isActive = searchParams.get('isActive');

    const where: any = {};

    if (search) {
      where.OR = [
        { code: { contains: search } },
        { name: { contains: search } },
        { nameEn: { contains: search } },
      ];
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { code: 'asc' },
      include: {
        stockBalances: true,
      },
    });

    return NextResponse.json({ success: true, data: products });
  } catch (error: unknown) {
    console.error('Products API error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}

// POST - Create new product
export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();

    // Validate required fields
    const validationErrors: string[] = [];

    if (!body.code || body.code.trim() === '') {
      validationErrors.push('กรุณาระบุรหัสสินค้า');
    }

    if (!body.name || body.name.trim() === '') {
      validationErrors.push('กรุณาระบุชื่อสินค้า');
    }

    if (body.salePrice === undefined || body.salePrice < 0) {
      validationErrors.push('กรุณาระบุราคาขายที่ถูกต้อง');
    }

    if (body.costPrice !== undefined && body.costPrice < 0) {
      validationErrors.push('ราคาทุนต้องไม่น้อยกว่า 0');
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { success: false, error: validationErrors.join(', ') },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existingProduct = await prisma.product.findUnique({
      where: { code: body.code },
    });

    if (existingProduct) {
      return NextResponse.json(
        { success: false, error: 'รหัสสินค้านี้ถูกใช้งานแล้ว' },
        { status: 400 }
      );
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        code: body.code,
        name: body.name,
        nameEn: body.nameEn || null,
        description: body.description || null,
        category: body.category || null,
        unit: body.unit || 'ชิ้น',
        type: body.type || 'PRODUCT',
        salePrice: body.salePrice || 0,
        costPrice: body.costPrice || 0,
        vatRate: body.vatRate !== undefined ? body.vatRate : 7,
        vatType: body.vatType || 'EXCLUSIVE',
        isInventory: body.isInventory || false,
        quantity: body.quantity || 0,
        minQuantity: body.minQuantity || 0,
        incomeType: body.incomeType || null,
        costingMethod: body.costingMethod || 'WEIGHTED_AVERAGE',
        isActive: body.isActive !== undefined ? body.isActive : true,
        notes: body.notes || null,
      },
    });

    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating product:', error);

    // Handle Prisma unique constraint error
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'รหัสสินค้านี้ถูกใช้งานแล้ว' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการสร้างข้อมูล' },
      { status: 500 }
    );
  }
}
