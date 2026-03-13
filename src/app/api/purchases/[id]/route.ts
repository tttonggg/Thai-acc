import { db } from "@/lib/db"
import { requireAuth, apiResponse, apiError, unauthorizedError, notFoundError } from "@/lib/api-utils"

// GET /api/purchases/[id] - Get single purchase invoice
export async function GET(
  request: Request,
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
        }
      }
    })
    
    if (!purchase) {
      return notFoundError("ไม่พบใบซื้อ")
    }
    
    return apiResponse(purchase)
  } catch (error) {
    if (error instanceof Error && error.message.includes("ไม่ได้รับอนุญาต")) {
      return unauthorizedError()
    }
    return apiError("เกิดข้อผิดพลาดในการดึงข้อมูลใบซื้อ")
  }
}

// DELETE /api/purchases/[id] - Delete purchase invoice
export async function DELETE(
  request: Request,
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
