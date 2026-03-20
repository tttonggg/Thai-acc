import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireRole, apiResponse, apiError, notFoundError, unauthorizedError, forbiddenError } from '@/lib/api-utils'
import { db } from '@/lib/db'

// POST /api/stock-takes/[id]/approve - Approve stock take
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    // Only ADMIN and ACCOUNTANT can approve stock takes
    if (user.role !== 'ADMIN' && user.role !== 'ACCOUNTANT') {
      return forbiddenError('ไม่มีสิทธิ์อนุมัติการตรวจนับสต็อก')
    }

    const stockTake = await db.stockTake.findUnique({
      where: { id },
      include: {
        lines: {
          include: {
            product: true,
          },
        },
      },
    })

    if (!stockTake) {
      return notFoundError('ไม่พบการตรวจนับสต็อก')
    }

    if (stockTake.status === 'COMPLETED') {
      return apiError('การตรวจนับสต็อกนี้ได้รับการอนุมัติแล้ว')
    }

    if (stockTake.status === 'CANCELLED') {
      return apiError('ไม่สามารถอนุมัติการตรวจนับสต็อกที่ยกเลิกแล้วได้')
    }

    // Update status to IN_PROGRESS
    const updated = await db.stockTake.update({
      where: { id },
      data: { status: 'IN_PROGRESS' },
      include: {
        warehouse: true,
        lines: {
          include: {
            product: true,
          },
        },
      },
    })

    return apiResponse({
      message: 'อนุมัติการตรวจนับสต็อกสำเร็จ',
      data: updated,
    })
  } catch (error: any) {
    if (error.name === 'AuthError') {
      return unauthorizedError()
    }
    console.error('Stock Take Approve Error:', error)
    return apiError(error.message || 'เกิดข้อผิดพลาดในการอนุมัติการตรวจนับสต็อก')
  }
}
