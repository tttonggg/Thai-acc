import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if account has children
    const children = await prisma.chartOfAccount.findFirst({
      where: { parentId: id }
    })

    if (children) {
      return NextResponse.json({
        error: 'ไม่สามารถลบบัญชีที่มีบัญชีย่อยได้ กรุณาลบบัญชีย่อยก่อน'
      }, { status: 400 })
    }

    // Check if account is used in journal entries
    const journalLines = await prisma.journalLine.findFirst({
      where: { accountId: id }
    })

    if (journalLines) {
      return NextResponse.json({
        error: 'ไม่สามารถลบบัญชีที่มีรายการบันทึกบัญชีได้'
      }, { status: 400 })
    }

    // Soft delete by setting isActive to false
    await prisma.chartOfAccount.update({
      where: { id: id },
      data: { isActive: false }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to delete account'
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const data = await request.json()

    const account = await prisma.chartOfAccount.update({
      where: { id: id },
      data: {
        name: data.name,
        nameEn: data.nameEn || null,
        type: data.type,
        isDetail: data.isDetail,
        isActive: data.isActive,
        notes: data.notes || null,
      }
    })

    return NextResponse.json({
      id: account.id,
      code: account.code,
      name: account.name,
      nameEn: account.nameEn,
      type: account.type,
      level: account.level,
      parentId: account.parentId,
      isDetail: account.isDetail,
      isActive: account.isActive,
      notes: account.notes,
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to update account'
    }, { status: 500 })
  }
}
