import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Validation schema for update
const departmentUpdateSchema = z.object({
  code: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  nameEn: z.string().optional(),
  managerId: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
  costCenter: z.string().optional(),
  location: z.string().optional(),
  isActive: z.boolean().optional(),
  notes: z.string().optional(),
})

// GET /api/departments/[id] - Get single department
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้รับอนุญาต' },
        { status: 401 }
      )
    }

    const department = await prisma.department.findUnique({
      where: { id: id },
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
        children: {
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
        budgets: {
          where: {
            status: 'ACTIVE',
          },
          orderBy: {
            fiscalYear: 'desc',
          },
        },
        purchaseRequests: {
          orderBy: {
            requestDate: 'desc',
          },
          take: 10,
        },
      },
    })

    if (!department) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบแผนก' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: department,
    })
  } catch (error) {
    console.error('Department Fetch Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'ข้อผิดพลาดในการโหลดข้อมูล',
      },
      { status: 500 }
    )
  }
}

// PUT /api/departments/[id] - Update department
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้รับอนุญาต' },
        { status: 401 }
      )
    }

    // Only ADMIN and ACCOUNTANT can update departments
    if (!['ADMIN', 'ACCOUNTANT'].includes(session.user.role as string)) {
      return NextResponse.json(
        { success: false, error: 'ไม่มีสิทธิ์แก้ไขแผนก' },
        { status: 403 }
      )
    }

    // Check if department exists
    const existing = await prisma.department.findUnique({
      where: { id: id },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบแผนก' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validatedData = departmentUpdateSchema.parse(body)

    // Check if new code conflicts with existing department
    if (validatedData.code && validatedData.code !== existing.code) {
      const codeExists = await prisma.department.findUnique({
        where: { code: validatedData.code },
      })

      if (codeExists) {
        return NextResponse.json(
          { success: false, error: 'รหัสแผนกนี้มีอยู่แล้ว' },
          { status: 400 }
        )
      }
    }

    // If parent is being changed, validate it
    if (validatedData.parentId !== undefined) {
      if (validatedData.parentId === null) {
        // Allow setting to null (removing parent)
      } else {
        // Check if parent exists and is not the department itself
        if (validatedData.parentId === id) {
          return NextResponse.json(
            { success: false, error: 'แผนกไม่สามารถเป็นแผนกแม่ของตัวเองได้' },
            { status: 400 }
          )
        }

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
    }

    // If manager is being changed, validate it
    if (validatedData.managerId !== undefined) {
      if (validatedData.managerId === null) {
        // Allow setting to null (removing manager)
      } else {
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
    }

    const department = await prisma.department.update({
      where: { id: id },
      data: validatedData,
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

    return NextResponse.json({
      success: true,
      data: department,
      message: 'อัปเดตแผนกสำเร็จ',
    })
  } catch (error) {
    console.error('Department Update Error:', error)

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
        error: error instanceof Error ? error.message : 'ข้อผิดพลาดในการอัปเดตแผนก',
      },
      { status: 500 }
    )
  }
}

// DELETE /api/departments/[id] - Delete department
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้รับอนุญาต' },
        { status: 401 }
      )
    }

    // Only ADMIN can delete departments
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'ไม่มีสิทธิ์ลบแผนก' },
        { status: 403 }
      )
    }

    // Check if department exists
    const existing = await prisma.department.findUnique({
      where: { id: id },
      include: {
        _count: {
          select: {
            children: true,
            purchaseRequests: true,
            budgets: true,
          },
        },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบแผนก' },
        { status: 404 }
      )
    }

    // Check if department has child departments
    if (existing._count.children > 0) {
      return NextResponse.json(
        { success: false, error: 'ไม่สามารถลบแผนกที่มีแผนกย่อยได้' },
        { status: 400 }
      )
    }

    // Check if department has purchase requests or budgets
    if (existing._count.purchaseRequests > 0 || existing._count.budgets > 0) {
      return NextResponse.json(
        { success: false, error: 'ไม่สามารถลบแผนกที่มีข้อมูลอ้างอิงได้' },
        { status: 400 }
      )
    }

    await prisma.department.delete({
      where: { id: id },
    })

    return NextResponse.json({
      success: true,
      message: 'ลบแผนกสำเร็จ',
    })
  } catch (error) {
    console.error('Department Deletion Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'ข้อผิดพลาดในการลบแผนก',
      },
      { status: 500 }
    )
  }
}
