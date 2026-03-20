// Bank Accounts API (Agent 05: Banking & Finance Engineer)
// Schema-correct version — BankAccount has no isDefault or glAccount relation
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    const accounts = await prisma.bankAccount.findMany({
      orderBy: { code: 'asc' },
    })
    return NextResponse.json({ success: true, data: accounts })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    const body = await request.json()
    const { code, bankName, branchName, accountNumber, accountName, glAccountId } = body

    if (!code || !bankName || !accountNumber || !glAccountId) {
      return NextResponse.json({ success: false, error: 'กรุณากรอกข้อมูลธนาคารให้ครบถ้วน' }, { status: 400 })
    }

    const account = await prisma.bankAccount.create({
      data: {
        code,
        bankName,
        branchName: branchName || '',
        accountNumber,
        accountName: accountName || '',
        glAccountId,
      },
    })

    return NextResponse.json({ success: true, data: account }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
