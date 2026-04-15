import { NextRequest } from 'next/server'
import { requireAuth, apiResponse, apiError, unauthorizedError, notFoundError, forbiddenError } from '@/lib/api-utils'
import { prisma } from '@/lib/db'
import { logActivity } from '@/lib/activity-logger'
import { z } from 'zod'

// POST /api/purchase-requests/[id]/submit - Submit PR for approval
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)

    if (user.role === 'VIEWER') {
      return forbiddenError()
    }

    const { id } = await params

    // Fetch PR with all relations
    const pr = await prisma.purchaseRequest.findUnique({
      where: { id },
      include: {
        lines: true,
        departmentData: true,
        budget: true,
      },
    })

    if (!pr) {
      return notFoundError('ไม่พบใบขอซื้อ')
    }

    // Only creator can submit their own PR
    if (pr.requestedBy !== user.id && !['ADMIN', 'ACCOUNTANT'].includes(user.role as string)) {
      return apiError('คุณไม่มีสิทธิ์ส่งใบขอซื้อนี้', 403)
    }

    // Validate status transition
    if (pr.status !== 'DRAFT') {
      return apiError('สามารถส่งเฉพาะใบขอซื้อที่อยู่ในสถานะร่างเท่านั้น', 400)
    }

    // Validate lines exist
    if (!pr.lines || pr.lines.length === 0) {
      return apiError('ใบขอซื้อต้องมีรายการสินค้าอย่างน้อย 1 รายการ', 400)
    }

    // Update status to PENDING using transaction
    const updated = await prisma.$transaction(async (tx) => {
      // Update PR status
      const updatedPR = await tx.purchaseRequest.update({
        where: { id },
        data: {
          status: 'PENDING',
          submittedAt: new Date(),
          updatedById: user.id,
        },
        include: {
          requestedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          departmentData: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          approvedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          budget: {
            select: {
              id: true,
              name: true,
              fiscalYear: true,
              remainingAmount: true,
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

      return updatedPR
    })

    // Log activity
    await logActivity({
      userId: user.id,
      action: 'SUBMIT',
      module: 'purchase-requests',
      recordId: id,
      details: {
        requestNo: updated.requestNo,
        department: updated.departmentData?.name,
        lineCount: updated.lines.length,
      },
    })

    return apiResponse({
      success: true,
      message: 'ส่งใบขอซื้อเพื่อขออนุมัติเรียบร้อยแล้ว',
      data: updated,
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes('ไม่ได้รับอนุญาต')) {
      return unauthorizedError()
    }
    console.error('Purchase Request Submit Error:', error)
    return apiError('เกิดข้อผิดพลาดในการส่งใบขอซื้อ')
  }
}
