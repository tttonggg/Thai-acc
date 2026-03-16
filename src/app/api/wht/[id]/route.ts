import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/api-auth'

// GET - Single WHT record
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth()
    const { id } = await params

    const record = await prisma.withholdingTax.findUnique({
      where: { id },
    })

    if (!record) {
      return NextResponse.json({ success: false, error: 'ไม่พบเอกสาร' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: record })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูลภาษีหัก ณ ที่จ่าย' }, { status: 500 })
  }
}

// PATCH - Update reportStatus (mark as filed)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth()
    const { id } = await params

    const body = await request.json()
    const { reportStatus } = body

    const record = await prisma.withholdingTax.update({
      where: { id },
      data: { reportStatus },
    })

    return NextResponse.json({ success: true, data: record })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'ไม่สามารถอัปเดตสถานะรายงานได้' }, { status: 500 })
  }
}
