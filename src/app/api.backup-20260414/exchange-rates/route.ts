// B2. Exchange Rates API
// API สำหรับจัดการอัตราแลกเปลี่ยน

import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { apiResponse, errorResponse } from "@/lib/api-utils"
import {
  setExchangeRate,
  updateExchangeRatesFromAPI,
  calculateUnrealizedGainLoss,
  generateMultiCurrencyReport,
} from "@/lib/currency-service"
import { z } from "zod"

const exchangeRateSchema = z.object({
  fromCurrency: z.string().length(3),
  toCurrency: z.string().length(3),
  rate: z.number().positive(),
  date: z.string().or(z.date()).optional(),
  source: z.enum(["MANUAL", "API", "SYSTEM"]).default("MANUAL"),
  sourceRef: z.string().optional(),
})

// GET /api/exchange-rates - Get exchange rates
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return errorResponse("Unauthorized", 401)

  try {
    const { searchParams } = new URL(req.url)
    const fromCurrency = searchParams.get("from")
    const toCurrency = searchParams.get("to")
    const date = searchParams.get("date")
    const report = searchParams.get("report")

    if (report === "multi-currency") {
      const reportData = await generateMultiCurrencyReport()
      return apiResponse(reportData)
    }

    const rates = await prisma.exchangeRate.findMany({
      where: {
        ...(fromCurrency && { fromCurrency }),
        ...(toCurrency && { toCurrency }),
        ...(date && { date: { lte: new Date(date) } }),
      },
      orderBy: { date: "desc" },
      take: 100,
    })

    return apiResponse({ rates })
  } catch (error) {
    console.error("Error fetching exchange rates:", error)
    return errorResponse("Failed to fetch exchange rates", 500)
  }
}

// POST /api/exchange-rates - Create/update exchange rate or perform action
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return errorResponse("Unauthorized", 401)

  if (!["ADMIN", "ACCOUNTANT"].includes(session.user.role)) {
    return errorResponse("Forbidden", 403)
  }

  try {
    const body = await req.json()

    // Handle actions
    if (body.action === "update-from-api") {
      const count = await updateExchangeRatesFromAPI(session.user.id)
      return apiResponse({
        message: `Updated ${count} exchange rates from API`,
        count,
      })
    }

    if (body.action === "calculate-gain-loss") {
      const asOfDate = body.asOfDate ? new Date(body.asOfDate) : new Date()
      const gainLoss = await calculateUnrealizedGainLoss(asOfDate)
      return apiResponse({ gainLoss, count: gainLoss.length })
    }

    const data = exchangeRateSchema.parse(body)

    const rate = await setExchangeRate(
      data.fromCurrency,
      data.toCurrency,
      data.rate,
      data.date ? new Date(data.date) : new Date(),
      data.source,
      data.sourceRef,
      session.user.id
    )

    return apiResponse({ rate })
  } catch (error) {
    console.error("Error creating exchange rate:", error)
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400)
    }
    return errorResponse("Failed to create exchange rate", 500)
  }
}
