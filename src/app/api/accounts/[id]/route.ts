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

    // Check if account has children
    const children = await prisma.chartOfAccount.findFirst({
      where: { parentId: id }
    })

    if (children) {
      return NextResponse.json({ 
        error: 'Cannot delete account with children' 
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

    const data = await request.json()

    const account = await prisma.chartOfAccount.update({
      where: { id: id },
      data: {
        name: data.name,
        type: data.type,
        isDetail: data.isDetail
      }
    })

    return NextResponse.json(account)
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to update account' 
    }, { status: 500 })
  }
}
