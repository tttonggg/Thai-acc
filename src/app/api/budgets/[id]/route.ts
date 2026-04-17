// B4. Budget Detail API

import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { apiResponse, errorResponse } from "@/lib/api-utils"
import { z } from "zod"

const updateSchema = z.object({
  amount: z.number().min(0).optional(),
  alertAt: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
})

// GET /api/budgets/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return errorResponse("Unauthorized", 401)

  try {
    const { id } = await params
    const budget = await prisma.budget.findUnique({
      where: { id },
      include: {
        account: true,
        alerts: {
          orderBy: { triggeredAt: "desc" },
        },
      },
    })

    if (!budget) {
      return errorResponse("Budget not found", 404)
    }

    return apiResponse({ budget })
  } catch (error) {
    console.error("Error fetching budget:", error)
    return errorResponse("Failed to fetch budget", 500)
  }
}

// PUT /api/budgets/[id]
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

    const budget = await prisma.budget.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: { account: true },
    })

    return apiResponse({ budget })
  } catch (error) {
    console.error("Error updating budget:", error)
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0].message, 400)
    }
    return errorResponse("Failed to update budget", 500)
  }
}

// DELETE /api/budgets/[id]
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

    // Delete alerts first
    await prisma.budgetAlert.deleteMany({
      where: { budgetId: id },
    })

    await prisma.budget.delete({
      where: { id },
    })

    return apiResponse({ message: "Budget deleted" })
  } catch (error) {
    console.error("Error deleting budget:", error)
    return errorResponse("Failed to delete budget", 500)
  }
}
