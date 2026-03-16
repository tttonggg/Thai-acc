import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { z } from 'zod'
import { requireAuth, requireRole } from '@/lib/api-auth'

// Validation schema
const customerSchema = z.object({
  code: z.string().min(1, 'รหัสลูกค้าต้องไม่ว่าง'),
  name: z.string().min(1, 'ชื่อลูกค้าต้องไม่ว่าง'),
  nameEn: z.string().optional(),
  taxId: z.string().optional(),
  branchCode: z.string().optional(),
  address: z.string().optional(),
  subDistrict: z.string().optional(),
  district: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  phone: z.string().optional(),
  fax: z.string().optional(),
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง').optional().or(z.literal('')),
  website: z.string().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  creditLimit: z.number().min(0).default(0),
  creditDays: z.number().int().min(0).default(30),
  notes: z.string().optional(),
})

// GET - List customers (requires authentication)
export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '20'))
    const search = searchParams.get('search')
    const isActive = searchParams.get('isActive')

    const skip = (page - 1) * limit

    const where: any = {}

    if (search) {
      where.OR = [
        { code: { contains: search } },
        { name: { contains: search } },
        { taxId: { contains: search } },
        { phone: { contains: search } },
      ]
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true'
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          _count: {
            select: { invoices: true },
          },
        },
        orderBy: { code: 'asc' },
        skip,
        take: limit,
      }),
      prisma.customer.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    )
  }
}

// POST - Create customer (requires authentication)
export async function POST(request: NextRequest) {
  try {
    await requireAuth()

    const body = await request.json()
    const validatedData = customerSchema.parse(body)
    
    // Check if code already exists
    const existing = await prisma.customer.findUnique({
      where: { code: validatedData.code },
    })
    
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'รหัสลูกค้านี้มีอยู่แล้วในระบบ' },
        { status: 400 }
      )
    }
    
    const customer = await prisma.customer.create({
      data: {
        ...validatedData,
        email: validatedData.email || null,
        isActive: true,
      },
    })
    
    return NextResponse.json({ success: true, data: customer })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'ข้อมูลไม่ถูกต้อง', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: error.message || 'เกิดข้อผิดพลาดในการสร้างลูกค้า' },
      { status: 500 }
    )
  }
}
