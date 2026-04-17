import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const rejectQuotationSchema = z.object({
  reason: z.string().min(1, 'กรุณาระบุเหตุผลการปฏิเสธ'),
})

// POST /api/quotations/[id]/reject - Reject quotation (SENT → REJECTED)
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

    // Only ADMIN and ACCOUNTANT can reject quotations
    if (!['ADMIN', 'ACCOUNTANT'].includes(session.user.role as string)) {
      return NextResponse.json(
        { success: false, error: 'ไม่มีสิทธิปฏิเสธใบเสนอราคา' },
        { status: 403 }
      )
    }

    const quotation = await prisma.quotation.findUnique({
      where: { id: id },
    })

    if (!quotation) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบใบเสนอราคา' },
        { status: 404 }
      )
    }

    // Can only reject SENT quotations
    if (quotation.status !== 'SENT') {
      return NextResponse.json(
        {
          success: false,
          error: 'สามารถปฏิเสธเฉพาะใบเสนอราคาที่อยู่ในสถานะ ส่งแล้ว',
        },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = rejectQuotationSchema.parse(body)

    // Update status to REJECTED
    const updatedQuotation = await prisma.quotation.update({
      where: { id: id },
      data: {
        status: 'REJECTED',
        rejectionReason: validatedData.reason,
        updatedById: session.user.id,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            code: true,
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
      message: 'ปฏิเสธใบเสนอราคาเรียบร้อยแล้ว',
    })
  } catch (error) {
    console.error('Quotation Reject Error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'ข้อมูลไม่ถูกต้อง',
          details: error.issues,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'ข้อผิดพลาดในการปฏิเสธใบเสนอราคา',
      },
      { status: 500 }
    )
  }
}
