// Stock Movement individual operations API (Agent 03: Inventory Engineer)
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/api-utils'
import { recordStockMovement } from '@/lib/inventory-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const { id } = await params

    const movement = await prisma.stockMovement.findUnique({
      where: { id },
      include: {
        product: true,
        warehouse: true,
      }
    })

    if (!movement) {
      return NextResponse.json({ success: false, error: 'ไม่พบการเคลื่อนไหวสินค้า' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: movement })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
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
    const { notes } = body

    // Only allow updating notes for movements
    const movement = await prisma.stockMovement.update({
      where: { id },
      data: {
        notes,
      },
    })

    return NextResponse.json({ success: true, data: movement })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const { id } = await params
    const body = await request.json()
    const { action } = body

    if (action === 'reverse') {
      // Reverse a movement by creating an opposite movement
      const originalMovement = await prisma.stockMovement.findUnique({
        where: { id },
        include: {
          product: true,
          warehouse: true,
        }
      })

      if (!originalMovement) {
        return NextResponse.json({ success: false, error: 'ไม่พบการเคลื่อนไหวสินค้า' }, { status: 404 })
      }

      // Determine opposite type
      const oppositeTypes: Record<string, string> = {
        'RECEIVE': 'ISSUE',
        'ISSUE': 'RECEIVE',
        'TRANSFER_IN': 'TRANSFER_OUT',
        'TRANSFER_OUT': 'TRANSFER_IN',
        'ADJUST': 'ADJUST',
      }

      const oppositeType = oppositeTypes[originalMovement.type] || 'ADJUST'

      // Create reversing movement
      const result = await recordStockMovement({
        productId: originalMovement.productId,
        warehouseId: originalMovement.warehouseId,
        type: oppositeType,
        quantity: originalMovement.quantity, // Will be negated based on type
        unitCost: originalMovement.unitCost,
        referenceId: id,
        referenceNo: `REV-${originalMovement.referenceNo || originalMovement.id.substring(0, 8)}`,
        notes: `ยกเลิกการเคลื่อนไหวเดิม: ${originalMovement.notes || '-'}`,
        sourceChannel: 'WEB',
      })

      return NextResponse.json({
        success: true,
        data: {
          originalMovement,
          reversingMovement: result.movement,
          message: 'ยกเลิกการเคลื่อนไหวสินค้าเรียบร้อยแล้ว'
        }
      })
    }

    return NextResponse.json({ success: false, error: 'ไม่รองรับการดำเนินการนี้' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
