// B1. Check period status API
// API ตรวจสอบสถานะงวดบัญชี

import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { apiResponse, errorResponse } from "@/lib/api-utils"
import { checkPeriodStatus, validatePeriodRange } from "@/lib/period-service"
import { z } from "zod"

const checkSchema = z.object({
  date: z.string().or(z.date()),
  startDate: z.string().or(z.date()).optional(),
  endDate: z.string().or(z.date()).optional(),
})

// POST /api/accounting-periods/check
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return errorResponse("Unauthorized", 401)

  try {
    const body = await req.json()
    const { date, startDate, endDate } = checkSchema.parse(body)

    if (startDate && endDate) {
      const result = await validatePeriodRange(
        new Date(startDate),
        new Date(endDate)
      )
      return apiResponse(result)
    }

    const result = await checkPeriodStatus(new Date(date))
    return apiResponse(result)
  } catch (error) {
    console.error("Error checking period:", error)
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0].message, 400)
    }
    return errorResponse("Failed to check period", 500)
  }
}
