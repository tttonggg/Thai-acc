import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { requireAuth, apiResponse, apiError, unauthorizedError } from "@/lib/api-utils"
import { AuthError } from "@/lib/api-auth"
import { vendorSchema } from "@/lib/validations"

// GET /api/vendors - List vendors
export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "20"))
    const isActive = searchParams.get("isActive")
    const search = searchParams.get("search")

    const skip = (page - 1) * limit

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

    const [vendors, total] = await Promise.all([
      db.vendor.findMany({
        where,
        orderBy: { code: "asc" },
        skip,
        take: limit,
        include: {
          _count: {
            select: { purchaseInvoices: true }
          }
        }
      }),
      db.vendor.count({ where }),
    ])

    return Response.json({
      success: true,
      data: vendors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    })
  } catch (error: any) {
    // Check for auth errors first
    if (error instanceof AuthError || (error instanceof Error && error.message.includes("ไม่ได้รับอนุญาต"))) {
      return unauthorizedError()
    }
    console.error('Vendors API error:', error)
    return apiError("เกิดข้อผิดพลาดในการดึงข้อมูลผู้ขาย", 500)
  }
}

// POST /api/vendors - Create vendor
export async function POST(request: NextRequest) {
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
  } catch (error: any) {
    // Check for auth errors first
    if (error instanceof AuthError || (error instanceof Error && error.message.includes("ไม่ได้รับอนุญาต"))) {
      return unauthorizedError()
    }
    if (error?.statusCode === 403) {
      return apiError("ไม่มีสิทธิ์เข้าถึง", 403)
    }
    if (error instanceof Error && error.name === "ZodError") {
      return apiError("ข้อมูลไม่ถูกต้อง", 400)
    }
    console.error('Create vendor error:', error)
    return apiError("เกิดข้อผิดพลาดในการสร้างผู้ขาย", 500)
  }
}
