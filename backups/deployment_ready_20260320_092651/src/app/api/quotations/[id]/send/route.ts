import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// POST /api/quotations/[id]/send - Send quotation to customer (DRAFT → SENT)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้รับอนุญาต' },
        { status: 401 }
      )
    }

    // Only ADMIN and ACCOUNTANT can send quotations
    if (!['ADMIN', 'ACCOUNTANT'].includes(session.user.role as string)) {
      return NextResponse.json(
        { success: false, error: 'ไม่มีสิทธิส่งใบเสนอราคา' },
        { status: 403 }
      )
    }

    const quotation = await prisma.quotation.findUnique({
      where: { id: id },
      include: {
        customer: true,
      },
    })

    if (!quotation) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบใบเสนอราคา' },
        { status: 404 }
      )
    }

    // Can only send DRAFT or REVISED quotations
    if (!['DRAFT', 'REVISED', 'REJECTED'].includes(quotation.status)) {
      return NextResponse.json(
        {
          success: false,
          error: 'สามารถส่งเฉพาะใบเสนอราคาที่อยู่ในสถานะ ร่าง, แก้ไขแล้ว, หรือ ปฏิเสธ',
        },
        { status: 400 }
      )
    }

    // Check if quotation is still valid
    if (quotation.validUntil < new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: 'ใบเสนอราคาหมดอายุแล้ว กรุณาตรวจสอบวันหมดอายุ',
        },
        { status: 400 }
      )
    }

    // Update status to SENT
    const updatedQuotation = await prisma.quotation.update({
      where: { id: id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        updatedById: session.user.id,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            code: true,
            email: true,
            phone: true,
          },
        },
        lines: {
          include: {
            product: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
          orderBy: {
            lineNo: 'asc',
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedQuotation,
      message: 'ส่งใบเสนอราคาเรียบร้อยแล้ว',
    })
  } catch (error) {
    console.error('Quotation Send Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'ข้อผิดพลาดในการส่งใบเสนอราคา',
      },
      { status: 500 }
    )
  }
}
