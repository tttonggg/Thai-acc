// B5. Entity Detail API

import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { apiResponse, errorResponse } from "@/lib/api-utils"
import { z } from "zod"

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  nameEn: z.string().optional(),
  taxId: z.string().optional(),
  isPrimary: z.boolean().optional(),
  isActive: z.boolean().optional(),
})

// GET /api/entities/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return errorResponse("Unauthorized", 401)

  try {
    const { id } = await params
    const entity = await prisma.entity.findUnique({
      where: { id },
      include: {
        fromTransactions: {
          take: 10,
          orderBy: { createdAt: "desc" },
          include: { toEntity: { select: { code: true, name: true } } },
        },
        toTransactions: {
          take: 10,
          orderBy: { createdAt: "desc" },
          include: { fromEntity: { select: { code: true, name: true } } },
        },
      },
    })

    if (!entity) {
      return errorResponse("Entity not found", 404)
    }

    return apiResponse({ entity })
  } catch (error) {
    console.error("Error fetching entity:", error)
    return errorResponse("Failed to fetch entity", 500)
  }
}

// PUT /api/entities/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return errorResponse("Unauthorized", 401)

  if (!["ADMIN", "ACCOUNTANT"].includes(session.user.role)) {
    return errorResponse("Forbidden", 403)
  }

  try {
    const { id } = await params
    const body = await req.json()
    const data = updateSchema.parse(body)

    // If setting as primary, unset others
    if (data.isPrimary) {
      await prisma.entity.updateMany({
        where: { isPrimary: true },
        data: { isPrimary: false },
      })
    }

    const entity = await prisma.entity.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    })

    return apiResponse({ entity })
  } catch (error) {
    console.error("Error updating entity:", error)
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0].message, 400)
    }
    return errorResponse("Failed to update entity", 500)
  }
}

// DELETE /api/entities/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return errorResponse("Unauthorized", 401)

  if (!["ADMIN", "ACCOUNTANT"].includes(session.user.role)) {
    return errorResponse("Forbidden", 403)
  }

  try {
    const { id } = await params

    // Check for existing transactions
    const transactionCount = await prisma.interCompanyTransaction.count({
      where: { OR: [{ fromEntityId: id }, { toEntityId: id }] },
    })

    if (transactionCount > 0) {
      // Soft delete - mark as inactive
      const entity = await prisma.entity.update({
        where: { id },
        data: { isActive: false, updatedAt: new Date() },
      })
      return apiResponse({
        entity,
        message: "Entity marked as inactive (has transactions)",
      })
    }

    await prisma.entity.delete({
      where: { id },
    })

    return apiResponse({ message: "Entity deleted" })
  } catch (error) {
    console.error("Error deleting entity:", error)
    return errorResponse("Failed to delete entity", 500)
  }
}
