// Warehouse & Inventory APIs (Agent 03: Inventory Engineer)
// Schema-exact: Warehouse has location (not address), no isDefault field
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    const warehouses = await prisma.warehouse.findMany({
      include: { zones: true },
      orderBy: { code: 'asc' },
    })
    return NextResponse.json({ success: true, data: warehouses })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    const body = await request.json()
    const { code, name, type, location, notes } = body

    if (!code || !name) {
      return NextResponse.json({ success: false, error: 'กรุณากรอกรหัสและชื่อคลังสินค้า' }, { status: 400 })
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        code,
        name,
        type: type || 'GENERAL',
        location,  // correct schema field (not 'address')
        notes,
        isActive: true,
      },
    })

    return NextResponse.json({ success: true, data: warehouse }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
