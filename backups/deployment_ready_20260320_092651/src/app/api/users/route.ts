import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { z } from 'zod'
import * as bcrypt from 'bcryptjs'
import { requireRole, apiError, apiResponse } from "@/lib/api-utils"
import { AuthError } from "@/lib/api-auth"

// Validation schema
const userSchema = z.object({
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง'),
  name: z.string().min(1, 'ชื่อต้องไม่ว่าง'),
  password: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร').optional(),
  role: z.enum(['ADMIN', 'ACCOUNTANT', 'USER', 'VIEWER']),
  isActive: z.boolean().default(true),
})

// GET - List users (ADMIN only)
export async function GET(request: NextRequest) {
  try {
    // Require ADMIN role
    await requireRole('ADMIN')

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    
    return NextResponse.json(users)
  } catch (error: any) {
    // Check for auth errors first
    if (error instanceof AuthError || error?.name === 'AuthError' || error?.statusCode === 401) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้รับอนุญาต - กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      )
    }
    if (error?.statusCode === 403) {
      return NextResponse.json(
        { success: false, error: 'ไม่มีสิทธิ์เข้าถึง' },
        { status: 403 }
      )
    }
    console.error('Users API error:', error)
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    )
  }
}

// POST - Create user (ADMIN only)
export async function POST(request: NextRequest) {
  try {
    // Require ADMIN role
    await requireRole('ADMIN')

    const body = await request.json()
    const validatedData = userSchema.parse(body)
    
    if (!validatedData.password) {
      return NextResponse.json(
        { success: false, error: 'ต้องระบุรหัสผ่าน' },
        { status: 400 }
      )
    }
    
    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })
    
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'อีเมลนี้มีอยู่แล้วในระบบ' },
        { status: 400 }
      )
    }
    
    // Hash password with increased cost factor for security
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)
    
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        name: validatedData.name,
        password: hashedPassword,
        role: validatedData.role,
        isActive: validatedData.isActive,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    })
    
    return NextResponse.json(user)
  } catch (error: any) {
    // Check for auth errors first
    if (error instanceof AuthError || error?.name === 'AuthError' || error?.statusCode === 401) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้รับอนุญาต - กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      )
    }
    if (error?.statusCode === 403) {
      return NextResponse.json(
        { success: false, error: 'ไม่มีสิทธิ์เข้าถึง' },
        { status: 403 }
      )
    }
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'ข้อมูลไม่ถูกต้อง', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Create user error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'เกิดข้อผิดพลาดในการสร้างผู้ใช้' },
      { status: 500 }
    )
  }
}
