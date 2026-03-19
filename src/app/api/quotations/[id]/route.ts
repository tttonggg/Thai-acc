import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateQuotationSchema = z.object({
  validUntil: z.string().optional(),
  contactPerson: z.string().optional(),
  reference: z.string().optional(),
  discountAmount: z.number().int().min(0).optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  vatRate: z.number().min(0).max(100).optional(),
  terms: z.string().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  // Note: lines update is complex, handled separately
})

// GET /api/quotations/[id] - Get single quotation
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้รับอนุญาต' },
        { status: 401 }
      )
    }

    const quotation = await prisma.quotation.findUnique({
      where: { id: params.id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            code: true,
            taxId: true,
            address: true,
            phone: true,
          },
        },
        invoice: {
          select: {
            id: true,
            invoiceNo: true,
            status: true,
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

    if (!quotation) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบใบเสนอราคา' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: quotation,
    })
  } catch (error) {
    console.error('Quotation Fetch Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'ข้อผิดพลาดในการโหลดข้อมูล',
      },
      { status: 500 }
    )
  }
}

// PUT /api/quotations/[id] - Update quotation (DRAFT or REVISED only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้รับอนุญาต' },
        { status: 401 }
      )
    }

    // Check if user can edit
    if (!['ADMIN', 'ACCOUNTANT'].includes(session.user.role as string)) {
      return NextResponse.json(
        { success: false, error: 'ไม่มีสิทธิแก้ไข' },
        { status: 403 }
      )
    }

    const quotation = await prisma.quotation.findUnique({
      where: { id: params.id },
    })

    if (!quotation) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบใบเสนอราคา' },
        { status: 404 }
      )
    }

    // Can only edit DRAFT or REVISED quotations
    if (!['DRAFT', 'REVISED', 'REJECTED'].includes(quotation.status)) {
      return NextResponse.json(
        { success: false, error: 'สามารถแก้ไขเฉพาะใบเสนอราคาที่อยู่ในสถานะ ร่าง, แก้ไขแล้ว, หรือ ปฏิเสธ' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = updateQuotationSchema.parse(body)

    // Update version if REVISED
    const updateData: any = {
      ...validatedData,
      updatedById: session.user.id,
    }

    if (quotation.status === 'REVISED') {
      // Increment version when editing revised quotation
      const latestVersion = await prisma.quotation.findFirst({
        where: {
          quotationNo: quotation.quotationNo,
        },
        orderBy: {
          version: 'desc',
        },
      })

      if (latestVersion) {
        updateData.version = (latestVersion.version || 0) + 1
      }
    }

    const updatedQuotation = await prisma.quotation.update({
      where: { id: params.id },
      data: updateData,
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
      message: 'แก้ไขใบเสนอราคาเรียบร้อยแล้ว',
    })
  } catch (error) {
    console.error('Quotation Update Error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'ข้อมูลไม่ถูกต้อง',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'ข้อผิดพลาดในการแก้ไขใบเสนอราคา',
      },
      { status: 500 }
    )
  }
}

// DELETE /api/quotations/[id] - Delete quotation (DRAFT only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้รับอนุญาต' },
        { status: 401 }
      )
    }

    // Only ADMIN and ACCOUNTANT can delete
    if (!['ADMIN', 'ACCOUNTANT'].includes(session.user.role as string)) {
      return NextResponse.json(
        { success: false, error: 'ไม่มีสิทธิลบ' },
        { status: 403 }
      )
    }

    const quotation = await prisma.quotation.findUnique({
      where: { id: params.id },
    })

    if (!quotation) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบใบเสนอราคา' },
        { status: 404 }
      )
    }

    // Can only delete DRAFT quotations
    if (quotation.status !== 'DRAFT') {
      return NextResponse.json(
        { success: false, error: 'สามารถลบเฉพาะใบเสนอราคาที่อยู่ในสถานะ ร่าง' },
        { status: 400 }
      )
    }

    // Soft delete
    await prisma.quotation.update({
      where: { id: params.id },
      data: {
        deletedAt: new Date(),
        deletedBy: session.user.id,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'ลบใบเสนอราคาเรียบร้อยแล้ว',
    })
  } catch (error) {
    console.error('Quotation Delete Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'ข้อผิดพลาดในการลบใบเสนอราคา',
      },
      { status: 500 }
    )
  }
}
