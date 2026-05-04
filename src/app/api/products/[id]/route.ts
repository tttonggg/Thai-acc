import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/api-utils';
import { handleApiError } from '@/lib/api-error-handler';

// GET - Get single product by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json({ success: false, error: 'ไม่พบสินค้า' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: product });
  } catch (error: unknown) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}

// PUT - Update product
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;

    const body = await request.json();

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json({ success: false, error: 'ไม่พบสินค้า' }, { status: 404 });
    }

    // Check if code is being changed and if it conflicts with another product
    if (body.code && body.code !== existingProduct.code) {
      const codeExists = await prisma.product.findUnique({
        where: { code: body.code },
      });

      if (codeExists) {
        return NextResponse.json(
          { success: false, error: 'รหัสสินค้านี้ถูกใช้งานแล้ว' },
          { status: 400 }
        );
      }
    }

    // Validate data
    const validationErrors: string[] = [];

    if (!body.name || body.name.trim() === '') {
      validationErrors.push('กรุณาระบุชื่อสินค้า');
    }

    if (body.salePrice !== undefined && body.salePrice < 0) {
      validationErrors.push('ราคาขายต้องไม่น้อยกว่า 0');
    }

    if (body.costPrice !== undefined && body.costPrice < 0) {
      validationErrors.push('ราคาทุนต้องไม่น้อยกว่า 0');
    }

    if (body.quantity !== undefined && body.quantity < 0) {
      validationErrors.push('จำนวนคงเหลือต้องไม่น้อยกว่า 0');
    }

    if (body.minQuantity !== undefined && body.minQuantity < 0) {
      validationErrors.push('จำนวนต่ำสุดต้องไม่น้อยกว่า 0');
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { success: false, error: validationErrors.join(', ') },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.nameEn !== undefined && { nameEn: body.nameEn || null }),
      ...(body.description !== undefined && { description: body.description || null }),
      ...(body.category !== undefined && { category: body.category || null }),
      ...(body.unit !== undefined && { unit: body.unit }),
      ...(body.type !== undefined && { type: body.type }),
      ...(body.salePrice !== undefined && { salePrice: body.salePrice }),
      ...(body.costPrice !== undefined && { costPrice: body.costPrice }),
      ...(body.vatRate !== undefined && { vatRate: body.vatRate }),
      ...(body.vatType !== undefined && { vatType: body.vatType }),
      ...(body.isInventory !== undefined && { isInventory: body.isInventory }),
      ...(body.quantity !== undefined && { quantity: body.quantity }),
      ...(body.minQuantity !== undefined && { minQuantity: body.minQuantity }),
      ...(body.incomeType !== undefined && { incomeType: body.incomeType || null }),
      ...(body.costingMethod !== undefined && { costingMethod: body.costingMethod }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      ...(body.notes !== undefined && { notes: body.notes || null }),
    };

    // Update code only if provided and different
    if (body.code && body.code !== existingProduct.code) {
      updateData.code = body.code;
    }

    // Update product
    const product = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: product });
  } catch (error: unknown) {
    console.error('Error updating product:', error);

    // Handle Prisma unique constraint error
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'รหัสสินค้านี้ถูกใช้งานแล้ว' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล' },
      { status: 500 }
    );
  }
}

// DELETE - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        invoiceLines: true,
        purchaseLines: true,
      },
    });

    if (!product) {
      return NextResponse.json({ success: false, error: 'ไม่พบสินค้า' }, { status: 404 });
    }

    // Check if product is used in transactions
    const hasTransactions = product.invoiceLines.length > 0 || product.purchaseLines.length > 0;

    if (hasTransactions) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่สามารถลบสินค้าที่ถูกใช้ในรายการแล้วได้ (แนะนำให้ระงับการใช้งานแทน)',
        },
        { status: 400 }
      );
    }

    // Soft delete product - H-08: set deletedAt and isActive=false instead of hard delete
    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    return NextResponse.json({ success: true, message: 'ลบสินค้าเรียบร้อยแล้ว' });
  } catch (error: unknown) {
    console.error('Error deleting product:', error);

    // Handle foreign key constraint error
    if (error.code === 'P2003') {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่สามารถลบสินค้าที่ถูกใช้ในรายการแล้วได้',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการลบข้อมูล' },
      { status: 500 }
    );
  }
}
