// Warehouse individual operations API (Agent 03: Inventory Engineer)
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/api-auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const { id } = await params

    const warehouse = await prisma.warehouse.findUnique({
      where: { id },
      include: {
        zones: true,
        _count: {
          select: {
            balances: true,
            stockMovements: true,
          }
        }
      }
    })

    if (!warehouse) {
      return NextResponse.json({ success: false, error: 'ไม่พบคลังสินค้า' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: warehouse })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูลคลังสินค้า' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const { id } = await params
    const body = await request.json()
    const { code, name, type, location, notes, isActive } = body

    if (!code || !name) {
      return NextResponse.json({ success: false, error: 'กรุณากรอกรหัสและชื่อคลังสินค้า' }, { status: 400 })
    }

    // Check if code is already used by another warehouse
    const existing = await prisma.warehouse.findFirst({
      where: {
        code,
        id: { not: id }
      }
    })

    if (existing) {
      return NextResponse.json({ success: false, error: 'รหัสคลังสินค้านี้ถูกใช้งานแล้ว' }, { status: 400 })
    }

    const warehouse = await prisma.warehouse.update({
      where: { id },
      data: {
        code,
        name,
        type: type || 'MAIN',
        location,
        notes,
        isActive: isActive !== undefined ? isActive : true,
      },
    })

    return NextResponse.json({ success: true, data: warehouse })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'ไม่สามารถอัปเดตข้อมูลคลังสินค้าได้' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const { id } = await params

    // Check if warehouse has stock balances
    const balancesCount = await prisma.stockBalance.count({
      where: { warehouseId: id }
    })

    if (balancesCount > 0) {
      return NextResponse.json({
        success: false,
        error: `ไม่สามารถลบคลังสินค้าได้ เนื่องจากมีสินค้าคงเหลือ ${balancesCount} รายการ`
      }, { status: 400 })
    }

    // Delete warehouse
    await prisma.warehouse.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, message: 'ลบคลังสินค้าเรียบร้อยแล้ว' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'ไม่สามารถลบคลังสินค้าได้' }, { status: 500 })
  }
}
