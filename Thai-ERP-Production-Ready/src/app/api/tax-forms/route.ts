// B3. Tax Forms API
// API สำหรับจัดการแบบฟอร์มภาษี

import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { apiResponse, errorResponse } from "@/lib/api-utils"
import {
  generatePND3,
  generatePND53,
  generatePP30,
  submitTaxForm,
  fileTaxForm,
  exportTaxFormToPDF,
  exportTaxFormToExcel,
  getTaxFormSummary,
  validateTaxForm,
  getIncomeTypes,
} from "@/lib/tax-form-service"
import { z } from "zod"

const generateSchema = z.object({
  formType: z.enum(["PND3", "PND53", "PP30"]),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000),
})

const submitSchema = z.object({
  taxFormId: z.string(),
})

const fileSchema = z.object({
  taxFormId: z.string(),
  filingDate: z.string().or(z.date()),
  receiptNo: z.string().optional(),
})

// GET /api/tax-forms - List tax forms
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return errorResponse("Unauthorized", 401)

  try {
    const { searchParams } = new URL(req.url)
    const year = searchParams.get("year")
      ? parseInt(searchParams.get("year")!)
      : undefined
    const month = searchParams.get("month")
      ? parseInt(searchParams.get("month")!)
      : undefined
    const formType = searchParams.get("formType") || undefined
    const summary = searchParams.get("summary") === "true"
    const incomeTypes = searchParams.get("incomeTypes")

    if (incomeTypes) {
      const types = getIncomeTypes(incomeTypes as "PND3" | "PND53")
      return apiResponse({ incomeTypes: types })
    }

    if (summary && year) {
      const summaryData = await getTaxFormSummary(year, month)
      return apiResponse({ summary: summaryData })
    }

    const taxForms = await prisma.taxForm.findMany({
      where: {
        ...(year && { year }),
        ...(month && { month }),
        ...(formType && { formType }),
      },
      include: { lines: true },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    })

    return apiResponse({ taxForms })
  } catch (error) {
    console.error("Error fetching tax forms:", error)
    return errorResponse("Failed to fetch tax forms", 500)
  }
}

// POST /api/tax-forms - Generate, submit, or file tax form
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return errorResponse("Unauthorized", 401)

  try {
    const body = await req.json()

    // Generate new tax form
    if (body.formType && body.month && body.year) {
      if (!["ADMIN", "ACCOUNTANT"].includes(session.user.role)) {
        return errorResponse("Forbidden", 403)
      }

      const { formType, month, year } = generateSchema.parse(body)

      let taxForm
      switch (formType) {
        case "PND3":
          taxForm = await generatePND3(month, year, session.user.id)
          break
        case "PND53":
          taxForm = await generatePND53(month, year, session.user.id)
          break
        case "PP30":
          taxForm = await generatePP30(month, year, session.user.id)
          break
      }

      return apiResponse({ taxForm, message: `Generated ${formType} form` })
    }

    // Submit tax form
    if (body.action === "submit") {
      const { taxFormId } = submitSchema.parse(body)

      const validation = await validateTaxForm(taxFormId)
      if (!validation.valid) {
        return errorResponse(`Validation failed: ${validation.errors.join(", ")}`, 400)
      }

      const taxForm = await submitTaxForm(taxFormId, session.user.id)
      return apiResponse({ taxForm, message: "Tax form submitted" })
    }

    // File tax form
    if (body.action === "file") {
      const { taxFormId, filingDate, receiptNo } = fileSchema.parse(body)

      const taxForm = await fileTaxForm(
        taxFormId,
        new Date(filingDate),
        receiptNo
      )
      return apiResponse({ taxForm, message: "Tax form filed" })
    }

    return errorResponse("Invalid request", 400)
  } catch (error) {
    console.error("Error processing tax form:", error)
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400)
    }
    return errorResponse("Failed to process tax form", 500)
  }
}
