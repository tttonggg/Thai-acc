import { db } from "@/lib/db"
import { requireAuth, apiResponse, apiError, unauthorizedError, notFoundError, calculateInvoiceTotals } from "@/lib/api-utils"
import { invoiceSchema } from "@/lib/validations"

// GET /api/invoices/[id] - Get single invoice
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const { id } = await params
    
    const invoice = await db.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        lines: {
          orderBy: { lineNo: "asc" },
          include: {
            product: {
              select: { id: true, code: true, name: true, unit: true }
            }
          }
        },
        receiptAllocations: {
          include: {
            receipt: {
              select: {
                id: true,
                receiptNo: true,
                receiptDate: true,
                amount: true,
              }
            }
          }
        },
        journalEntry: true,
      }
    })
    
    if (!invoice) {
      return notFoundError("ไม่พบใบกำกับภาษี")
    }
    
    return apiResponse(invoice)
  } catch (error) {
    if (error instanceof Error && error.message.includes("ไม่ได้รับอนุญาต")) {
      return unauthorizedError()
    }
    return apiError("เกิดข้อผิดพลาดในการดึงข้อมูลใบกำกับภาษี")
  }
}

// PUT /api/invoices/[id] - Update invoice
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    
    if (user.role === "VIEWER") {
      return apiError("ไม่มีสิทธิ์แก้ไขใบกำกับภาษี", 403)
    }
    
    const existing = await db.invoice.findUnique({
      where: { id }
    })
    
    if (!existing) {
      return notFoundError("ไม่พบใบกำกับภาษี")
    }
    
    if (existing.status !== "DRAFT") {
      return apiError("ไม่สามารถแก้ไขใบกำกับภาษีที่ออกแล้วได้")
    }
    
    const body = await request.json()
    const validatedData = invoiceSchema.partial().parse(body)
    
    // If lines are provided, recalculate and update
    if (validatedData.lines) {
      const totals = calculateInvoiceTotals(
        validatedData.lines,
        validatedData.discountAmount || 0,
        validatedData.discountPercent || 0,
        validatedData.withholdingRate || 0
      )
      
      // Delete existing lines
      await db.invoiceLine.deleteMany({
        where: { invoiceId: id }
      })
      
      const invoice = await db.invoice.update({
        where: { id },
        data: {
          invoiceDate: validatedData.invoiceDate ? new Date(validatedData.invoiceDate) : undefined,
          dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
          customerId: validatedData.customerId,
          type: validatedData.type,
          reference: validatedData.reference,
          poNumber: validatedData.poNumber,
          subtotal: totals.subtotal,
          discountAmount: totals.totalDiscount,
          discountPercent: validatedData.discountPercent,
          vatAmount: totals.vatAmount,
          totalAmount: totals.totalAmount,
          withholdingRate: validatedData.withholdingRate,
          withholdingAmount: totals.withholdingAmount,
          netAmount: totals.netAmount,
          notes: validatedData.notes,
          internalNotes: validatedData.internalNotes,
          terms: validatedData.terms,
          lines: {
            create: validatedData.lines.map((line, index) => ({
              lineNo: index + 1,
              productId: line.productId,
              description: line.description,
              quantity: line.quantity,
              unit: line.unit,
              unitPrice: line.unitPrice,
              discount: line.discount,
              amount: (line.quantity * line.unitPrice) - line.discount,
              vatRate: line.vatRate,
              vatAmount: ((line.quantity * line.unitPrice) - line.discount) * (line.vatRate / 100),
              notes: line.notes,
            }))
          }
        },
        include: {
          customer: true,
          lines: true
        }
      })
      
      return apiResponse(invoice)
    }
    
    // Update without lines
    const invoice = await db.invoice.update({
      where: { id },
      data: {
        invoiceDate: validatedData.invoiceDate ? new Date(validatedData.invoiceDate) : undefined,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
        customerId: validatedData.customerId,
        type: validatedData.type,
        reference: validatedData.reference,
        poNumber: validatedData.poNumber,
        notes: validatedData.notes,
        internalNotes: validatedData.internalNotes,
        terms: validatedData.terms,
      },
      include: {
        customer: true,
        lines: true
      }
    })
    
    return apiResponse(invoice)
  } catch (error) {
    if (error instanceof Error && error.message.includes("ไม่ได้รับอนุญาต")) {
      return unauthorizedError()
    }
    if (error instanceof Error && error.name === "ZodError") {
      return apiError("ข้อมูลไม่ถูกต้อง")
    }
    return apiError("เกิดข้อผิดพลาดในการแก้ไขใบกำกับภาษี")
  }
}

// DELETE /api/invoices/[id] - Cancel invoice
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    
    if (user.role !== "ADMIN" && user.role !== "ACCOUNTANT") {
      return apiError("ไม่มีสิทธิ์ยกเลิกใบกำกับภาษี", 403)
    }
    
    const existing = await db.invoice.findUnique({
      where: { id },
      include: {
        receipts: true
      }
    })
    
    if (!existing) {
      return notFoundError("ไม่พบใบกำกับภาษี")
    }
    
    if (existing.status === "CANCELLED") {
      return apiError("ใบกำกับภาษีนี้ถูกยกเลิกแล้ว")
    }
    
    if (existing.receipts.length > 0) {
      return apiError("ไม่สามารถยกเลิกใบกำกับภาษีที่มีการรับชำระแล้วได้")
    }
    
    // Update status to cancelled
    const invoice = await db.invoice.update({
      where: { id },
      data: { status: "CANCELLED" }
    })
    
    return apiResponse({ message: "ยกเลิกใบกำกับภาษีสำเร็จ", invoice })
  } catch (error) {
    if (error instanceof Error && error.message.includes("ไม่ได้รับอนุญาต")) {
      return unauthorizedError()
    }
    return apiError("เกิดข้อผิดพลาดในการยกเลิกใบกำกับภาษี")
  }
}
