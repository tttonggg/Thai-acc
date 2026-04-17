import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Validation schema
const departmentSchema = z.object({
  code: z.string().min(1, 'รหัสแผนกต้องไม่ว่างเปล่า'),
  name: z.string().min(1, 'ชื่อแผนกต้องไม่ว่างเปล่า'),
  nameEn: z.string().optional(),
  managerId: z.string().optional(),
  parentId: z.string().optional(),
  costCenter: z.string().optional(),
  location: z.string().optional(),
  isActive: z.boolean().default(true),
  notes: z.string().optional(),
})

// GET /api/departments - List all departments
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้รับอนุญาต' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')
    const search = searchParams.get('search')

    const where: any = {}

    if (isActive === 'true') {
      where.isActive = true
    } else if (isActive === 'false') {
      where.isActive = false
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameEn: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ]
    }

    const departments = await prisma.department.findMany({
      where,
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        parent: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            children: true,
            purchaseRequests: true,
            budgets: true,
          },
        },
      },
      orderBy: {
        code: 'asc',
      },
    })

    return NextResponse.json({
      success: true,
      data: departments,
    })
  } catch (error) {
    console.error('Departments Fetch Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'ข้อผิดพลาดในการโหลดข้อมูล',
      },
      { status: 500 }
    )
  }
}

// POST /api/departments - Create new department
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้รับอนุญาต' },
        { status: 401 }
      )
    }

    // Only ADMIN and ACCOUNTANT can create departments
    if (!['ADMIN', 'ACCOUNTANT'].includes(session.user.role as string)) {
      return NextResponse.json(
        { success: false, error: 'ไม่มีสิทธิ์สร้างแผนก' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = departmentSchema.parse(body)

    // Check if department code already exists
    const existing = await prisma.department.findUnique({
      where: { code: validatedData.code },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'รหัสแผนกนี้มีอยู่แล้ว' },
        { status: 400 }
      )
    }

    // If parent is specified, check if it exists
    if (validatedData.parentId) {
      const parent = await prisma.department.findUnique({
        where: { id: validatedData.parentId },
      })

      if (!parent) {
        return NextResponse.json(
          { success: false, error: 'ไม่พบแผนกแม่' },
          { status: 400 }
        )
      }
    }

    // If manager is specified, check if user exists
    if (validatedData.managerId) {
      const manager = await prisma.user.findUnique({
        where: { id: validatedData.managerId },
      })

      if (!manager) {
        return NextResponse.json(
          { success: false, error: 'ไม่พบผู้จัดการ' },
          { status: 400 }
        )
      }
    }

    const department = await prisma.department.create({
      data: {
        ...validatedData,
        createdById: session.user.id,
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        parent: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: department,
        message: 'สร้างแผนกสำเร็จ',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Department Creation Error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'ข้อมูลไม่ถูกต้อง',
          details: error.issues,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'ข้อผิดพลาดในการสร้างแผนก',
      },
      { status: 500 }
    )
  }
}
