import { db } from "@/lib/db"
import { vendorSchema } from "@/lib/validations"

// GET /api/vendors/[id] - Get single vendor
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(request)
    const { id } = await params
    
    const vendor = await db.vendor.findUnique({
      where: { id },
      include: {
        purchaseInvoices: {
          where: { status: { not: "CANCELLED" } },
          orderBy: { invoiceDate: "desc" },
          take: 10,
          select: {
            id: true,
            invoiceNo: true,
            invoiceDate: true,
            totalAmount: true,
            paidAmount: true,
            status: true,
          }
        },
        _count: {
          select: { purchaseInvoices: true }
        }
      }
    })
    
    if (!vendor) {
      return notFoundError("ไม่พบผู้ขาย")
    }
    
    return apiResponse(vendor)
  } catch (error) {
    if (error instanceof Error && error.message.includes("ไม่ได้รับอนุญาต")) {
      return unauthorizedError()
    }
    return apiError("เกิดข้อผิดพลาดในการดึงข้อมูลผู้ขาย")
  }
}

// PUT /api/vendors/[id] - Update vendor
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params
    
    // IDOR Protection: Only ADMIN and ACCOUNTANT can update vendors
    if (user.role !== "ADMIN" && user.role !== "ACCOUNTANT") {
      return forbiddenError()
    }
    
    const body = await request.json()
    const validatedData = vendorSchema.partial().parse(body)
    
    const existing = await db.vendor.findUnique({
      where: { id }
    })
    
    if (!existing) {
      return notFoundError("ไม่พบผู้ขาย")
    }
    
    // Check for duplicate code
    if (validatedData.code && validatedData.code !== existing.code) {
      const duplicate = await db.vendor.findUnique({
        where: { code: validatedData.code }
      })
      if (duplicate) {
        return apiError("รหัสผู้ขายนี้มีอยู่แล้วในระบบ")
      }
    }
    
    const vendor = await db.vendor.update({
      where: { id },
      data: validatedData
    })
    
    return apiResponse(vendor)
  } catch (error) {
    if (error instanceof Error && error.message.includes("ไม่ได้รับอนุญาต")) {
      return unauthorizedError()
    }
    if (error instanceof Error && error.name === "ZodError") {
      return apiError("ข้อมูลไม่ถูกต้อง")
    }
    return apiError("เกิดข้อผิดพลาดในการแก้ไขผู้ขาย")
  }
}

// DELETE /api/vendors/[id] - Delete vendor
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params
    
    // IDOR Protection: Only ADMIN can delete vendors
    if (user.role !== "ADMIN") {
      return forbiddenError()
    }
    
    const existing = await db.vendor.findUnique({
      where: { id },
      include: {
        _count: {
          select: { purchaseInvoices: true }
        }
      }
    })
    
    if (!existing) {
      return notFoundError("ไม่พบผู้ขาย")
    }
    
    if (existing._count.purchaseInvoices > 0) {
      return apiError("ไม่สามารถลบผู้ขายที่มีธุรกรรมแล้วได้")
    }
    
    await db.vendor.delete({
      where: { id }
    })
    
    return apiResponse({ message: "ลบผู้ขายสำเร็จ" })
  } catch (error) {
    if (error instanceof Error && error.message.includes("ไม่ได้รับอนุญาต")) {
      return unauthorizedError()
    }
    return apiError("เกิดข้อผิดพลาดในการลบผู้ขาย")
  }
}
