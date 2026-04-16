import { NextRequest, NextResponse } from "next/server"
import { requireAuth, apiResponse, apiError, unauthorizedError, notFoundError, forbiddenError } from "@/lib/api-utils"
import { AuthError } from "@/lib/api-auth"
import { db } from "@/lib/db"
import { satangToBaht } from "@/lib/currency"

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

    // CRITICAL: Convert Satang to Baht for all monetary fields
    // Database stores Satang (integers), API returns Baht (decimals)
    const invoiceInBaht = {
      ...invoice,
      subtotal: satangToBaht(invoice.subtotal),
      vatAmount: satangToBaht(invoice.vatAmount),
      totalAmount: satangToBaht(invoice.totalAmount),
      discountAmount: satangToBaht(invoice.discountAmount),
      withholdingAmount: satangToBaht(invoice.withholdingAmount),
      netAmount: satangToBaht(invoice.netAmount),
      paidAmount: satangToBaht(invoice.paidAmount),
      lines: invoice.lines.map(line => ({
        ...line,
        unitPrice: satangToBaht(line.unitPrice),
        discount: satangToBaht(line.discount),
        amount: satangToBaht(line.amount),
        vatAmount: satangToBaht(line.vatAmount),
      })),
    }

    return apiResponse(invoiceInBaht)
  } catch (error) {
    if (error instanceof Error && error.message.includes("unauthorized")) {
      return unauthorizedError()
    }
    return apiError("เกิดข้อผิดพลาดในการดึงข้อมูลใบกำกับภาษี")
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params
    const body = await request.json()
    const { action } = body

    // Find invoice
    const invoice = await db.invoice.findUnique({
      where: { id }
    })

    if (!invoice) {
      return notFoundError("ไม่พบใบกำกับภาษี")
    }

    // Handle different actions
    if (action === 'post') {
      // Issue invoice (DRAFT → ISSUED)
      if (invoice.status !== 'DRAFT') {
        return apiError("สามารถออกเฉพาะใบกำกับภาษีสถานะร่างเท่านั้น", 400)
      }

      const updatedInvoice = await db.invoice.update({
        where: { id },
        data: { status: 'ISSUED' }
      })

      return apiResponse(updatedInvoice)
    }

    return apiError("ไม่รองรับ action ที่ร้องขอ", 400)
  } catch (error) {
    if (error instanceof Error && error.message.includes("unauthorized")) {
      return unauthorizedError()
    }
    return apiError("เกิดข้อผิดพลาดในการอัปเดตสถานะใบกำกับภาษี")
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
