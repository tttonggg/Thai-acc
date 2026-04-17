// B3. Tax Form Export API
// API สำหรับส่งออกแบบฟอร์มภาษี

import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-utils"
import { errorResponse } from "@/lib/api-utils"
import {
  exportTaxFormToPDF,
  exportTaxFormToExcel,
} from "@/lib/tax-form-service"

// GET /api/tax-forms/[id]/export?format=pdf|excel
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const format = searchParams.get("format") || "pdf"

    let buffer: Buffer
    let contentType: string
    let filename: string

    if (format === "pdf") {
      buffer = await exportTaxFormToPDF(id)
      contentType = "application/pdf"
      filename = `tax-form-${id}.pdf`
    } else if (format === "excel") {
      buffer = await exportTaxFormToExcel(id)
      contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      filename = `tax-form-${id}.xlsx`
    } else {
      return errorResponse("Invalid format", 400)
    }

    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Error exporting tax form:", error)
    return errorResponse("Failed to export tax form", 500)
  }
}
