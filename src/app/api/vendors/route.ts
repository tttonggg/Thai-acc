import { db } from "@/lib/db"
import { requireAuth, apiResponse, apiError, unauthorizedError } from "@/lib/api-utils"
import { vendorSchema } from "@/lib/validations"

// GET /api/vendors - List vendors
export async function GET(request: Request) {
  try {
    await requireAuth()
    
    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get("isActive")
    const search = searchParams.get("search")
    
    const where: any = {}
    
    if (isActive !== null) {
      where.isActive = isActive === "true"
    }
    
    if (search) {
      where.OR = [
        { code: { contains: search } },
        { name: { contains: search } },
        { taxId: { contains: search } },
      ]
    }
    
    const vendors = await db.vendor.findMany({
      where,
      orderBy: { code: "asc" },
      include: {
        _count: {
          select: { purchaseInvoices: true }
        }
      }
    })
    
    return apiResponse(vendors)
  } catch (error) {
    if (error instanceof Error && error.message.includes("ไม่ได้รับอนุญาต")) {
      return unauthorizedError()
    }
    return apiError("เกิดข้อผิดพลาดในการดึงข้อมูลผู้ขาย")
  }
}

// POST /api/vendors - Create vendor
export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    
    if (user.role === "VIEWER") {
      return apiError("ไม่มีสิทธิ์สร้างผู้ขาย", 403)
    }
    
    const body = await request.json()
    const validatedData = vendorSchema.parse(body)
    
    // Check if code already exists
    const existing = await db.vendor.findUnique({
      where: { code: validatedData.code }
    })
    
    if (existing) {
      return apiError("รหัสผู้ขายนี้มีอยู่แล้วในระบบ")
    }
    
    const vendor = await db.vendor.create({
      data: validatedData
    })
    
    return apiResponse(vendor, 201)
  } catch (error) {
    if (error instanceof Error && error.message.includes("ไม่ได้รับอนุญาต")) {
      return unauthorizedError()
    }
    if (error instanceof Error && error.name === "ZodError") {
      return apiError("ข้อมูลไม่ถูกต้อง")
    }
    return apiError("เกิดข้อผิดพลาดในการสร้างผู้ขาย")
  }
}
