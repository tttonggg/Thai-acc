import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { purchaseInvoiceSchema } from "@/lib/validations"
import { requireAuth, apiResponse, apiError, unauthorizedError, notFoundError } from "@/lib/api-utils"
import { AuthError } from "@/lib/api-auth"

// GET /api/purchases/[id] - Get single purchase invoice
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const { id } = await params
    
    const purchase = await db.purchaseInvoice.findUnique({
      where: { id },
      include: {
        vendor: true,
        lines: {
          orderBy: { lineNo: "asc" },
          include: {
            product: {
              select: { id: true, code: true, name: true, unit: true }
            }
          }
        },
        payments: {
          select: {
            id: true,
            paymentNo: true,
            paymentDate: true,
            amount: true,
          }
        },
        journalEntry: {
          select: {
            id: true,
            entryNo: true,
            status: true,
          }
        }
      }
    })
    
    if (!purchase) {
      return notFoundError("ไม่พบใบซื้อ")
    }
    
    return apiResponse(purchase)
  } catch (error) {
    if (error instanceof AuthError) {
      return unauthorizedError()
    }
    return apiError("เกิดข้อผิดพลาดในการดึงข้อมูลใบซื้อ")
  }
}

// PUT /api/purchases/[id] - Update purchase invoice (draft only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    if (user.role === "VIEWER") {
      return apiError("ไม่มีสิทธิ์แก้ไขใบซื้อ", 403)
    }

    const body = await request.json()
    const validatedData = purchaseInvoiceSchema.parse(body)

    // Check if purchase exists and is draft
    const existing = await db.purchaseInvoice.findUnique({
      where: { id },
      include: {
        lines: true
      }
    })

    if (!existing) {
      return notFoundError("ไม่พบใบซื้อ")
    }

    // Only allow editing DRAFT status
    if (existing.status !== "DRAFT") {
      return apiError("แก้ไขได้เฉพาะใบซื้อที่เป็นสถานะร่างเท่านั้น", 403)
    }

    // Verify vendor exists
    const vendor = await db.vendor.findUnique({
      where: { id: validatedData.vendorId }
    })

    if (!vendor) {
      return apiError("ไม่พบผู้ขาย")
    }

    // Calculate totals
    const totals = calculateInvoiceTotals(
      validatedData.lines,
      validatedData.discountAmount,
      0,
      validatedData.withholdingRate
    )

    // Delete existing lines
    await db.purchaseInvoiceLine.deleteMany({
      where: { purchaseId: id }
    })

    // Update purchase invoice
    const purchase = await db.purchaseInvoice.update({
      where: { id },
      data: {
        vendorId: validatedData.vendorId,
        invoiceDate: new Date(validatedData.invoiceDate),
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        vendorInvoiceNo: validatedData.vendorInvoiceNo,
        type: validatedData.type,
        reference: validatedData.reference,
        poNumber: validatedData.poNumber,
        subtotal: Math.round(totals.subtotal * 100),
        discountAmount: Math.round(totals.totalDiscount * 100),
        vatRate: 7,
        vatAmount: Math.round(totals.vatAmount * 100),
        totalAmount: Math.round(totals.totalAmount * 100),
        withholdingRate: validatedData.withholdingRate,
        withholdingAmount: Math.round(totals.withholdingAmount * 100),
        netAmount: Math.round(totals.netAmount * 100),
        notes: validatedData.notes,
        internalNotes: validatedData.internalNotes,
        lines: {
          create: validatedData.lines.map((line, index) => ({
            lineNo: index + 1,
            productId: line.productId,
            description: line.description,
            quantity: line.quantity,
            unit: line.unit,
            unitPrice: Math.round(line.unitPrice * 100),
            discount: Math.round(line.discount * 100),
            amount: Math.round(((line.quantity * line.unitPrice) - line.discount) * 100),
            vatRate: line.vatRate,
            vatAmount: Math.round((((line.quantity * line.unitPrice) - line.discount) * (line.vatRate / 100)) * 100),
            notes: line.notes,
          }))
        }
      },
      include: {
        vendor: true,
        lines: true
      }
    })

    return apiResponse(purchase)
  } catch (error) {
    if (error instanceof Error && error.message.includes("ไม่ได้รับอนุญาต")) {
      return unauthorizedError()
    }
    if (error instanceof Error && error.name === "ZodError") {
      return apiError("ข้อมูลไม่ถูกต้อง")
    }
    return apiError("เกิดข้อผิดพลาดในการแก้ไขใบซื้อ")
  }
}

// DELETE /api/purchases/[id] - Delete purchase invoice
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    
    if (user.role !== "ADMIN") {
      return apiError("เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถลบใบซื้อได้", 403)
    }
    
    const existing = await db.purchaseInvoice.findUnique({
      where: { id },
      include: {
        payments: true
      }
    })
    
    if (!existing) {
      return notFoundError("ไม่พบใบซื้อ")
    }
    
    if (existing.payments.length > 0) {
      return apiError("ไม่สามารถลบใบซื้อที่มีการจ่ายเงินแล้วได้")
    }
    
    // Delete related VAT record
    await db.vatRecord.deleteMany({
      where: {
        referenceId: id,
        documentType: "PURCHASE"
      }
    })
    
    // Delete purchase invoice
    await db.purchaseInvoice.delete({
      where: { id }
    })
    
    return apiResponse({ message: "ลบใบซื้อสำเร็จ" })
  } catch (error) {
    if (error instanceof Error && error.message.includes("ไม่ได้รับอนุญาต")) {
      return unauthorizedError()
    }
    return apiError("เกิดข้อผิดพลาดในการลบใบซื้อ")
  }
}
