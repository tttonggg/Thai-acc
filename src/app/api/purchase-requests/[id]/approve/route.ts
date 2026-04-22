import { NextRequest } from 'next/server'
import { requireAuth, apiResponse, apiError, unauthorizedError, notFoundError, forbiddenError } from '@/lib/api-utils'
import { prisma } from '@/lib/db'
import { logActivity } from '@/lib/activity-logger'
import { z } from 'zod'

// Validation schema for approve request
const approveSchema = z.object({
  notes: z.string().optional(),
})

// Helper: Check if user is allowed to approve based on DocumentApproverConfig
async function canUserApprove(userId: string, userRole: string, departmentId: string | null, documentType: string, amount: number): Promise<boolean> {
  // ADMIN can always approve
  if (userRole === 'ADMIN') return true

  // Get approver configs for this document type
  const configs = await prisma.documentApproverConfig.findMany({
    where: {
      documentType,
      isActive: true,
    },
    orderBy: { approvalOrder: 'asc' },
  })

  if (configs.length === 0) {
    // No config - fall back to ADMIN/ACCOUNTANT
    return userRole === 'ADMIN' || userRole === 'ACCOUNTANT'
  }

  // Check if user matches any active config
  for (const config of configs) {
    if (config.approverType === 'ROLE' && config.approverId) {
      const role = await prisma.role.findUnique({ where: { id: config.approverId } })
      if (role && role.name === userRole) return true
    }
    if (config.approverType === 'USER' && config.approverId === userId) return true
    if (config.approverType === 'DEPARTMENT_HEAD' && config.approverDepartmentId === departmentId) {
      // Check if user is manager of that department
      const dept = await prisma.department.findUnique({ where: { id: config.approverDepartmentId } })
      if (dept && dept.managerId === userId) return true
    }
  }

  return false
}

// POST /api/purchase-requests/[id]/approve - Approve PR
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()

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

    // Check if user is allowed to approve based on config
    const canApprove = await canUserApprove(
      user.id,
      user.role,
      pr.departmentId,
      'PURCHASE_REQUEST',
      pr.estimatedAmount
    )

    if (!canApprove) {
      return forbiddenError()
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

      // Log to ApprovalAudit
      await tx.approvalAudit.create({
        data: {
          documentType: 'PURCHASE_REQUEST',
          documentId: id,
          approverId: user.id,
          approverRole: user.role,
          action: 'APPROVED',
          comments: validatedData.notes || null,
          metadata: JSON.stringify({
            requestNo: updated.requestNo,
            amount: pr.estimatedAmount,
          }),
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
      return apiError('ข้อมูลไม่ถูกต้อง: ' + error.issues.map(e => e.message).join(', '), 400)
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
