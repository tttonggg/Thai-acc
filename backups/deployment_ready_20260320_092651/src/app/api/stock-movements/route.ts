// Stock Movements API (Agent 03: Inventory Engineer)
// Schema-exact: StockMovement uses 'date' not 'movementDate'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/api-utils'
import { recordStockMovement } from '@/lib/inventory-service'

export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    const { searchParams } = request.nextUrl
    const productId = searchParams.get('productId')
    const warehouseId = searchParams.get('warehouseId')
    const type = searchParams.get('type')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const where: any = {}
    if (productId) where.productId = productId
    if (warehouseId) where.warehouseId = warehouseId
    if (type) where.type = type

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        include: { product: true, warehouse: true },
        orderBy: { date: 'desc' }, // schema field is 'date' not 'movementDate'
        skip, take: limit,
      }),
      prisma.stockMovement.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: movements,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    const body = await request.json()
    const { productId, warehouseId, type, quantity, unitCost, referenceId, referenceNo, notes } = body

    if (!productId || !warehouseId || !type || quantity == null || unitCost == null) {
      return NextResponse.json({ success: false, error: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 })
    }

    const result = await recordStockMovement({
      productId, warehouseId, type, quantity, unitCost,
      referenceId, referenceNo, notes, sourceChannel: 'WEB',
    })

    return NextResponse.json({ success: true, data: result }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
