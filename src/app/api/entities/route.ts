// B5. Entities (Inter-Company) API
// API สำหรับจัดการบริษัทในเครือ

import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { apiResponse, errorResponse } from "@/lib/api-utils"
import {
  createEntity,
  initializePrimaryEntity,
  getInterCompanyTransactions,
  autoEliminateTransactions,
  generateInterCompanyReconciliationReport,
  generateConsolidatedTrialBalance,
} from "@/lib/intercompany-service"
import { z } from "zod"

const entitySchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  nameEn: z.string().optional(),
  taxId: z.string().optional(),
  isPrimary: z.boolean().default(false),
})

// GET /api/entities - List entities
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return errorResponse("Unauthorized", 401)

  try {
    const { searchParams } = new URL(req.url)
    const includeInactive = searchParams.get("all") === "true"
    const report = searchParams.get("report")
    const year = searchParams.get("year")
      ? parseInt(searchParams.get("year")!)
      : undefined
    const month = searchParams.get("month")
      ? parseInt(searchParams.get("month")!)
      : undefined

    if (report === "consolidated-trial-balance" && year && month) {
      const reportData = await generateConsolidatedTrialBalance(year, month)
      return apiResponse(reportData)
    }

    if (report === "reconciliation") {
      const startDate = searchParams.get("startDate")
        ? new Date(searchParams.get("startDate")!)
        : undefined
      const endDate = searchParams.get("endDate")
        ? new Date(searchParams.get("endDate")!)
        : undefined
      const reportData = await generateInterCompanyReconciliationReport(
        startDate,
        endDate
      )
      return apiResponse(reportData)
    }

    if (report === "transactions") {
      const fromEntityId = searchParams.get("fromEntityId") || undefined
      const toEntityId = searchParams.get("toEntityId") || undefined
      const isEliminated = searchParams.get("isEliminated")
        ? searchParams.get("isEliminated") === "true"
        : undefined
      const startDate = searchParams.get("startDate")
        ? new Date(searchParams.get("startDate")!)
        : undefined
      const endDate = searchParams.get("endDate")
        ? new Date(searchParams.get("endDate")!)
        : undefined

      const transactions = await getInterCompanyTransactions({
        fromEntityId,
        toEntityId,
        isEliminated,
        startDate,
        endDate,
      })
      return apiResponse({ transactions })
    }

    const entities = await prisma.entity.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: [{ isPrimary: "desc" }, { code: "asc" }],
    })

    return apiResponse({ entities })
  } catch (error) {
    console.error("Error fetching entities:", error)
    return errorResponse("Failed to fetch entities", 500)
  }
}

// POST /api/entities - Create entity or perform action
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return errorResponse("Unauthorized", 401)

  if (!["ADMIN", "ACCOUNTANT"].includes(session.user.role)) {
    return errorResponse("Forbidden", 403)
  }

  try {
    const body = await req.json()

    // Handle actions
    if (body.action === "initialize") {
      const entity = await initializePrimaryEntity()
      return apiResponse({ entity, message: "Primary entity initialized" })
    }

    if (body.action === "auto-eliminate") {
      const count = await autoEliminateTransactions(session.user.id)
      return apiResponse({
        message: `Eliminated ${count} inter-company transactions`,
        count,
      })
    }

    // Create entity
    const data = entitySchema.parse(body)

    const entity = await createEntity(data.code, data.name, {
      nameEn: data.nameEn,
      taxId: data.taxId,
      isPrimary: data.isPrimary,
    })

    return apiResponse({ entity })
  } catch (error) {
    console.error("Error creating entity:", error)
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400)
    }
    return errorResponse("Failed to create entity", 500)
  }
}
