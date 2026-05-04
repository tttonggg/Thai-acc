// Fixed Assets API - Individual Asset Operations
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/api-utils';
import { generateDepreciationSchedule, getAssetNetBookValue } from '@/lib/asset-service';
import { handleApiError } from '@/lib/api-error-handler';

// GET /api/assets/[id] - Get single asset with depreciation schedules
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;

    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        schedules: {
          orderBy: { date: 'asc' },
        },
      },
    });

    if (!asset) {
      return NextResponse.json({ success: false, error: 'ไม่พบสินทรัพย์' }, { status: 404 });
    }

    // Get net book value
    const nbv = await getAssetNetBookValue(asset.id);

    return NextResponse.json({
      success: true,
      data: {
        ...asset,
        ...nbv,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูลสินทรัพย์' },
      { status: 500 }
    );
  }
}

// PUT /api/assets/[id] - Update asset
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    if (user.role === 'VIEWER') {
      return NextResponse.json(
        { success: false, error: 'ไม่มีสิทธิ์แก้ไขสินทรัพย์' },
        { status: 403 }
      );
    }

    const body = await request.json();

    const {
      code,
      name,
      purchaseDate,
      purchaseCost,
      salvageValue,
      usefulLifeYears,
      depreciationRate,
      glAccountId,
      accumDepAccountId,
      depExpenseAccountId,
      isActive,
      notes,
    } = body;

    const existing = await prisma.asset.findUnique({
      where: { id },
      include: {
        schedules: {
          where: { posted: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'ไม่พบสินทรัพย์' }, { status: 404 });
    }

    // Check if trying to modify critical fields after depreciation has been posted
    const hasPostedDepreciation = existing.schedules.length > 0;

    if (hasPostedDepreciation) {
      // Prevent changing purchase cost, salvage value, or useful life if depreciation has been posted
      if (purchaseCost !== undefined && purchaseCost !== existing.purchaseCost) {
        return NextResponse.json(
          {
            success: false,
            error: 'ไม่สามารถแก้ไขราคาทุนได้เนื่องจากมีการบันทึกค่าเสื่อมราคาแล้ว',
          },
          { status: 400 }
        );
      }

      if (salvageValue !== undefined && salvageValue !== existing.salvageValue) {
        return NextResponse.json(
          {
            success: false,
            error: 'ไม่สามารถแก้ไขค่าซากได้เนื่องจากมีการบันทึกค่าเสื่อมราคาแล้ว',
          },
          { status: 400 }
        );
      }

      if (usefulLifeYears !== undefined && usefulLifeYears !== existing.usefulLifeYears) {
        return NextResponse.json(
          {
            success: false,
            error: 'ไม่สามารถแก้ไขอายุการใช้งานได้เนื่องจากมีการบันทึกค่าเสื่อมราคาแล้ว',
          },
          { status: 400 }
        );
      }
    }

    // Check for duplicate code
    if (code && code !== existing.code) {
      const duplicate = await prisma.asset.findUnique({
        where: { code },
      });
      if (duplicate) {
        return NextResponse.json(
          { success: false, error: 'รหัสสินทรัพย์นี้มีอยู่แล้ว' },
          { status: 400 }
        );
      }
    }

    // Calculate depreciation rate if useful life years changed
    let newDepreciationRate = existing.depreciationRate;
    if (usefulLifeYears && !hasPostedDepreciation) {
      newDepreciationRate = parseFloat(depreciationRate || String(100 / usefulLifeYears));
    }

    // Prepare update data
    const updateData: any = {};
    if (code !== undefined) updateData.code = code;
    if (name !== undefined) updateData.name = name;
    if (purchaseDate !== undefined) updateData.purchaseDate = new Date(purchaseDate);
    if (purchaseCost !== undefined && !hasPostedDepreciation)
      updateData.purchaseCost = parseFloat(purchaseCost);
    if (salvageValue !== undefined && !hasPostedDepreciation)
      updateData.salvageValue = parseFloat(salvageValue);
    if (usefulLifeYears !== undefined && !hasPostedDepreciation) {
      updateData.usefulLifeYears = parseInt(usefulLifeYears);
      updateData.depreciationRate = newDepreciationRate;
    }
    if (glAccountId !== undefined) updateData.glAccountId = glAccountId;
    if (accumDepAccountId !== undefined) updateData.accumDepAccountId = accumDepAccountId;
    if (depExpenseAccountId !== undefined) updateData.depExpenseAccountId = depExpenseAccountId;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Store notes in metadata
    if (notes !== undefined) {
      updateData.metadata = {
        ...((existing.metadata as any) || {}),
        notes,
      };
    }

    // Update asset
    const asset = await prisma.asset.update({
      where: { id },
      data: updateData,
    });

    // Regenerate depreciation schedule if critical fields changed and no depreciation posted
    if (
      !hasPostedDepreciation &&
      (purchaseCost !== undefined || salvageValue !== undefined || usefulLifeYears !== undefined)
    ) {
      await generateDepreciationSchedule(asset.id);
    }

    // Get updated net book value
    const nbv = await getAssetNetBookValue(asset.id);

    return NextResponse.json({
      success: true,
      data: {
        ...asset,
        ...nbv,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: 'ไม่สามารถอัปเดตข้อมูลสินทรัพย์ได้' },
      { status: 500 }
    );
  }
}

// DELETE /api/assets/[id] - Delete asset
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        {
          success: false,
          error: 'เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถลบสินทรัพย์ได้',
        },
        { status: 403 }
      );
    }

    const existing = await prisma.asset.findUnique({
      where: { id },
      include: {
        schedules: {
          where: { posted: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'ไม่พบสินทรัพย์' }, { status: 404 });
    }

    // Check if asset has posted depreciation entries
    if (existing.schedules.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `ไม่สามารถลบสินทรัพย์ได้เนื่องจากมีการบันทึกค่าเสื่อมราคาแล้ว ${existing.schedules.length} รายการ`,
        },
        { status: 400 }
      );
    }

    // Delete depreciation schedules first
    await prisma.depreciationSchedule.deleteMany({
      where: { assetId: id },
    });

    // Delete asset
    await prisma.asset.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'ลบสินทรัพย์สำเร็จ',
    });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: 'ไม่สามารถลบสินทรัพย์ได้' }, { status: 500 });
  }
}
