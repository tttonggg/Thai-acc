// Cheques API (Agent 05: Banking & Finance Engineer)
// Schema-exact: payeeName not payee, no payer/notes/createdById fields
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    const { searchParams } = request.nextUrl
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const bankAccountId = searchParams.get('bankAccountId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const where: any = {}
    if (type) where.type = type
    if (status) where.status = status
    if (bankAccountId) where.bankAccountId = bankAccountId

    const [cheques, total] = await Promise.all([
      prisma.cheque.findMany({
        where,
        include: { bankAccount: true },
        orderBy: { dueDate: 'asc' },
        skip, take: limit,
      }),
      prisma.cheque.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: cheques,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    const body = await request.json()
    const { chequeNo, type, bankAccountId, amount, dueDate, payeeName, documentRef } = body

    if (!chequeNo || !type || !bankAccountId || !amount || !dueDate) {
      return NextResponse.json({ success: false, error: 'ข้อมูลเช็คไม่ครบถ้วน' }, { status: 400 })
    }

    const cheque = await prisma.cheque.create({
      data: {
        chequeNo,
        type,
        bankAccountId,
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
        payeeName,
        documentRef,
        status: 'ON_HAND',
      }
    })

    return NextResponse.json({ success: true, data: cheque }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
