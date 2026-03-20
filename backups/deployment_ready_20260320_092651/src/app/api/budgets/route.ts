// B4. Budgets API
// API สำหรับจัดการงบประมาณ

import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { apiResponse, errorResponse } from "@/lib/api-utils"
import {
  setBudget,
  updateAllBudgetActuals,
  generateBudgetVsActualReport,
  generateVarianceAnalysis,
  copyBudgetsFromPreviousYear,
  getActiveAlerts,
  acknowledgeBudgetAlert,
} from "@/lib/budget-service"
import { z } from "zod"

const budgetSchema = z.object({
  year: z.number(),
  accountId: z.string(),
  amount: z.number().min(0),
  alertAt: z.number().min(0).max(100).default(80),
  notes: z.string().optional(),
})

// GET /api/budgets - List budgets
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return errorResponse("Unauthorized", 401)

  try {
    const { searchParams } = new URL(req.url)
    const year = searchParams.get("year")
      ? parseInt(searchParams.get("year")!)
      : new Date().getFullYear()
    const accountId = searchParams.get("accountId") || undefined
    const report = searchParams.get("report")
    const alerts = searchParams.get("alerts") === "true"

    if (alerts) {
      const activeAlerts = await getActiveAlerts()
      return apiResponse({ alerts: activeAlerts })
    }

    if (report === "vs-actual") {
      const accountType = searchParams.get("accountType") || undefined
      const reportData = await generateBudgetVsActualReport(year, accountType)
      return apiResponse(reportData)
    }

    if (report === "variance") {
      const analysis = await generateVarianceAnalysis(year)
      return apiResponse(analysis)
    }

    const budgets = await prisma.budget.findMany({
      where: {
        year,
        ...(accountId && { accountId }),
      },
      include: {
        account: {
          select: { code: true, name: true, type: true },
        },
        alerts: {
          where: { acknowledged: false },
        },
      },
      orderBy: { account: { code: "asc" } },
    })

    return apiResponse({ budgets, year })
  } catch (error) {
    console.error("Error fetching budgets:", error)
    return errorResponse("Failed to fetch budgets", 500)
  }
}

// POST /api/budgets - Create/update budget or perform action
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return errorResponse("Unauthorized", 401)

  if (!["ADMIN", "ACCOUNTANT"].includes(session.user.role)) {
    return errorResponse("Forbidden", 403)
  }

  try {
    const body = await req.json()

    // Handle actions
    if (body.action === "update-actuals") {
      const year = body.year || new Date().getFullYear()
      await updateAllBudgetActuals(year)
      return apiResponse({ message: "Budget actuals updated" })
    }

    if (body.action === "copy-from-previous") {
      const { sourceYear, targetYear, adjustmentPercent = 0 } = body
      const count = await copyBudgetsFromPreviousYear(
        sourceYear,
        targetYear,
        adjustmentPercent
      )
      return apiResponse({
        message: `Copied ${count} budgets from ${sourceYear} to ${targetYear}`,
        count,
      })
    }

    if (body.action === "acknowledge-alert") {
      const { alertId } = body
      const alert = await acknowledgeBudgetAlert(alertId, session.user.id)
      return apiResponse({ alert, message: "Alert acknowledged" })
    }

    // Create/update budget
    const data = budgetSchema.parse(body)

    const budget = await setBudget(
      data.year,
      data.accountId,
      data.amount,
      data.alertAt,
      data.notes
    )

    return apiResponse({ budget })
  } catch (error) {
    console.error("Error creating/updating budget:", error)
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400)
    }
    return errorResponse("Failed to create/update budget", 500)
  }
}
