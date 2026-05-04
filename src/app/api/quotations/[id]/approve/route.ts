import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// POST /api/quotations/[id]/approve - Approve quotation (SENT → APPROVED)
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'ไม่ได้รับอนุญาต' }, { status: 401 });
    }

    // Only ADMIN and ACCOUNTANT can approve quotations
    if (!['ADMIN', 'ACCOUNTANT'].includes(session.user.role as string)) {
      return NextResponse.json(
        { success: false, error: 'ไม่มีสิทธิอนุมัติใบเสนอราคา' },
        { status: 403 }
      );
    }

    const { id } = await params;

    const quotation = await prisma.quotation.findUnique({
      where: { id: id },
    });

    if (!quotation) {
      return NextResponse.json({ success: false, error: 'ไม่พบใบเสนอราคา' }, { status: 404 });
    }

    // Can only approve SENT quotations
    if (quotation.status !== 'SENT') {
      return NextResponse.json(
        {
          success: false,
          error: 'สามารถอนุมัติเฉพาะใบเสนอราคาที่อยู่ในสถานะ ส่งแล้ว',
        },
        { status: 400 }
      );
    }

    // Check if quotation is still valid
    if (quotation.validUntil < new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: 'ใบเสนอราคาหมดอายุแล้ว กรุณาตรวจสอบวันหมดอายุ',
        },
        { status: 400 }
      );
    }

    // Update status to APPROVED
    const updatedQuotation = await prisma.quotation.update({
      where: { id: id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedById: session.user.id,
      } as any,
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
    });

    return NextResponse.json({
      success: true,
      data: updatedQuotation,
      message: 'อนุมัติใบเสนอราคาเรียบร้อยแล้ว',
    });
  } catch (error: unknown) {
    console.error('Quotation Approve Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'ข้อผิดพลาดในการอนุมัติใบเสนอราคา',
      },
      { status: 500 }
    );
  }
}
