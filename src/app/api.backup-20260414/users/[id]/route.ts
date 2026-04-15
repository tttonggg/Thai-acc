import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { z } from 'zod'
import * as bcrypt from 'bcryptjs'
import { requireAuth, apiError } from '@/lib/api-utils'

const userUpdateSchema = z.object({
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง').optional(),
  name: z.string().min(1, 'ชื่อต้องไม่ว่าง').optional(),
  password: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร').optional(),
  role: z.enum(['ADMIN', 'ACCOUNTANT', 'USER', 'VIEWER']).optional(),
  isActive: z.boolean().optional(),
})

// GET - Get single user (ADMIN only, or own profile)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth()
    const { id } = await params

    // Only ADMIN can view other users' profiles
    if (currentUser.role !== 'ADMIN' && currentUser.id !== id) {
      return apiError('ไม่มีสิทธิ์เข้าถึง', 403)
    }
    
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบผู้ใช้นี้' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true, data: user })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    )
  }
}

// PUT - Update user (ADMIN only, or own profile with restrictions)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth()
    const { id } = await params
    const body = await request.json()
    const validatedData = userUpdateSchema.parse(body)

    // Check permissions
    const isAdmin = currentUser.role === 'ADMIN'
    const isSelf = currentUser.id === id

    if (!isAdmin && !isSelf) {
      return apiError('ไม่มีสิทธิ์แก้ไขผู้ใช้คนนี้', 403)
    }

    const existing = await prisma.user.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบผู้ใช้นี้' },
        { status: 404 }
      )
    }

    // Non-admin users cannot modify role or isActive
    if (!isAdmin && (validatedData.role || validatedData.isActive !== undefined)) {
      return apiError('ไม่มีสิทธิ์เปลี่ยนแปลงบทบาทหรือสถานะ', 403)
    }

    // Users cannot elevate their own role
    if (isSelf && validatedData.role && validatedData.role !== existing.role) {
      return apiError('ไม่สามารถเปลี่ยนแปลงบทบาทตัวเองได้', 403)
    }

    // Check email uniqueness if changing
    if (validatedData.email && validatedData.email !== existing.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: validatedData.email },
      })

      if (emailExists) {
        return NextResponse.json(
          { success: false, error: 'อีเมลนี้มีอยู่แล้วในระบบ' },
          { status: 400 }
        )
      }
    }

    // Hash password if provided (with increased cost factor)
    type UserUpdateData = {
      email?: string
      name?: string
      role?: 'ADMIN' | 'ACCOUNTANT' | 'USER' | 'VIEWER'
      isActive?: boolean
      password?: string
    }

    let updateData: UserUpdateData = { ...validatedData }
    if (validatedData.password) {
      updateData.password = await bcrypt.hash(validatedData.password, 12)
    } else {
      delete updateData.password
    }
    
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    })
    
    return NextResponse.json({ success: true, data: user })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'ข้อมูลไม่ถูกต้อง', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: error.message || 'เกิดข้อผิดพลาดในการอัปเดต' },
      { status: 500 }
    )
  }
}

// DELETE - Delete user (ADMIN only, cannot delete self)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth()

    // Only ADMIN can delete users
    if (currentUser.role !== 'ADMIN') {
      return apiError('ไม่มีสิทธิ์ลบผู้ใช้', 403)
    }

    const { id } = await params

    // Prevent self-deletion
    if (currentUser.id === id) {
      return apiError('ไม่สามารถลบบัญชีตัวเองได้', 403)
    }

    const existing = await prisma.user.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบผู้ใช้นี้' },
        { status: 404 }
      )
    }

    // Prevent deleting the last admin
    if (existing.role === 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN', isActive: true },
      })

      if (adminCount <= 1) {
        return NextResponse.json(
          { success: false, error: 'ไม่สามารถลบ Admin คนสุดท้ายได้' },
          { status: 400 }
        )
      }
    }
    
    await prisma.user.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true, message: 'ลบผู้ใช้สำเร็จ' })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'เกิดข้อผิดพลาดในการลบ' },
      { status: 500 }
    )
  }
}
