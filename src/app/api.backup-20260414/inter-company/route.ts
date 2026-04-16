// B5. Inter-Company Transactions API
// API สำหรับบันทึกรายการระหว่างบริษัท

import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { apiResponse, errorResponse } from "@/lib/api-utils"
import { recordInterCompanyTransaction } from "@/lib/intercompany-service"
import { z } from "zod"

const transactionSchema = z.object({
  fromEntityId: z.string(),
  toEntityId: z.string(),
  documentType: z.string(),
  documentId: z.string(),
  documentNo: z.string(),
  amount: z.number().positive(),
  description: z.string().optional(),
})

// GET /api/inter-company - List inter-company transactions
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return errorResponse("Unauthorized", 401)

  try {
    const { searchParams } = new URL(req.url)
    const fromEntityId = searchParams.get("fromEntityId") || undefined
    const toEntityId = searchParams.get("toEntityId") || undefined
    const isEliminated = searchParams.get("isEliminated")
      ? searchParams.get("isEliminated") === "true"
      : undefined

    const transactions = await prisma.interCompanyTransaction.findMany({
      where: {
        ...(fromEntityId && { fromEntityId }),
        ...(toEntityId && { toEntityId }),
        ...(isEliminated !== undefined && { isEliminated }),
      },
      include: {
        fromEntity: { select: { code: true, name: true } },
        toEntity: { select: { code: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    return apiResponse({ transactions })
  } catch (error) {
    console.error("Error fetching inter-company transactions:", error)
    return errorResponse("Failed to fetch transactions", 500)
  }
}

// POST /api/inter-company - Create inter-company transaction
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return errorResponse("Unauthorized", 401)

  if (!["ADMIN", "ACCOUNTANT"].includes(session.user.role)) {
    return errorResponse("Forbidden", 403)
  }

  try {
    const body = await req.json()
    const data = transactionSchema.parse(body)

    if (data.fromEntityId === data.toEntityId) {
      return errorResponse(
        "From and to entities must be different",
        400
      )
    }

    const transaction = await recordInterCompanyTransaction(
      data.fromEntityId,
      data.toEntityId,
      data.documentType,
      data.documentId,
      data.documentNo,
      data.amount,
      data.description
    )

    return apiResponse({ transaction })
  } catch (error) {
    console.error("Error creating inter-company transaction:", error)
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400)
    }
    return errorResponse("Failed to create transaction", 500)
  }
}
