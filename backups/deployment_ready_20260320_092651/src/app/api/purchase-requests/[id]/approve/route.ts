import { NextRequest } from 'next/server'
import { requireAuth, requireRole, apiResponse, apiError, unauthorizedError, notFoundError, forbiddenError } from '@/lib/api-utils'
import { prisma } from '@/lib/db'
import { logActivity } from '@/lib/activity-logger'
import { z } from 'zod'

// Validation schema for approve request
const approveSchema = z.object({
  notes: z.string().optional(),
})

// POST /api/purchase-requests/[id]/approve - Approve PR
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require ADMIN or ACCOUNTANT role
    const user = await requireRole(['ADMIN', 'ACCOUNTANT'])

    const { id } = await params

    // Parse request body
    const body = await request.json().catch(() => ({}))
    const validatedData = approveSchema.parse(body)

    // Fetch PR with all relations
    const pr = await prisma.purchaseRequest.findUnique({
      where: { id },
      include: {
        lines: true,
        requestedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        departmentData: true,
        budget: true,
      },
    })

    if (!pr) {
      return notFoundError('ไม่พบใบขอซื้อ')
    }

    // Validate status transition
    if (pr.status !== 'PENDING') {
      return apiError('สามารถอนุมัติเฉพาะใบขอซื้อที่อยู่ในสถานะรออนุมัติเท่านั้น', 400)
    }

    // Check if budget has sufficient funds (if budget is specified)
    if (pr.budget) {
      const budget = await prisma.departmentBudget.findUnique({
        where: { id: pr.budget.id },
      })

      if (budget && budget.remainingAmount < pr.estimatedAmount) {
        return apiError('งบประมาณไม่เพียงพอสำหรับอนุมัติใบขอซื้อนี้', 400)
      }
    }

    // Update status to APPROVED using transaction
    const updated = await prisma.$transaction(async (tx) => {
      // Update PR status
      const updatedPR = await tx.purchaseRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedBy: user.id,
          approvedAt: new Date(),
          approvalNotes: validatedData.notes,
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
      action: 'APPROVE',
      module: 'purchase-requests',
      recordId: id,
      details: {
        requestNo: updated.requestNo,
        requestedBy: updated.requestedByUser.name,
        department: updated.departmentData?.name,
        notes: validatedData.notes,
      },
    })

    return apiResponse({
      success: true,
      message: 'อนุมัติใบขอซื้อเรียบร้อยแล้ว',
      data: updated,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError('ข้อมูลไม่ถูกต้อง: ' + error.errors.map(e => e.message).join(', '), 400)
    }
    if (error instanceof Error && error.message.includes('ไม่ได้รับอนุญาต')) {
      return unauthorizedError()
    }
    if (error instanceof Error && error.message.includes('ไม่มีสิทธิ์เข้าถึง')) {
      return forbiddenError()
    }
    console.error('Purchase Request Approve Error:', error)
    return apiError('เกิดข้อผิดพลาดในการอนุมัติใบขอซื้อ')
  }
}
