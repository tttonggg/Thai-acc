import { NextRequest, NextResponse } from "next/server"
import { requireAuth, apiResponse, apiError, unauthorizedError, notFoundError, forbiddenError } from "@/lib/api-utils"
import { AuthError } from "@/lib/api-auth"
import { db } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params

    // Find invoice
    const invoice = await db.invoice.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true } },
        lines: true
      }
    })

    if (!invoice) {
      return notFoundError("ไม่พบใบกำกับภาษี")
    }

    return apiResponse(invoice)
  } catch (error) {
    if (error instanceof Error && error.message.includes("unauthorized")) {
      return unauthorizedError()
    }
    return apiError("เกิดข้อผิดพลาดในการดึงข้อมูลใบกำกับภาษี")
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Basic PUT implementation
  return apiResponse({ message: "PUT endpoint working" })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Basic DELETE implementation
  return apiResponse({ message: "DELETE endpoint working" })
}
