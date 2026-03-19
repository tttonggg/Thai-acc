// Petty Cash Funds API — Schema-exact (no glAccount relation/include)
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth, AuthError } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    const funds = await prisma.pettyCashFund.findMany({
      include: { vouchers: true },
      orderBy: { code: 'asc' },
    })
    return NextResponse.json({ success: true, data: funds })
  } catch (error: any) {
    // Check for auth errors first
    if (error instanceof AuthError || error?.name === 'AuthError' || error?.statusCode === 401) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้รับอนุญาต - กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      )
    }
    console.error('Petty cash funds API error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    const body = await request.json()
    const { code, name, custodianId, glAccountId, maxAmount } = body

    if (!code || !name || !custodianId || !glAccountId || !maxAmount) {
      return NextResponse.json({ success: false, error: 'กรุณากรอกข้อมูลกองทุนเงินสดย่อยให้ครบถ้วน' }, { status: 400 })
    }

    const fund = await prisma.pettyCashFund.create({
      data: {
        code, name, custodianId, glAccountId,
        maxAmount: parseFloat(maxAmount),
        currentBalance: parseFloat(maxAmount), // initial balance = max amount (funded)
        isActive: true,
      }
    })
    return NextResponse.json({ success: true, data: fund }, { status: 201 })
  } catch (error: any) {
    // Check for auth errors first
    if (error instanceof AuthError || error?.name === 'AuthError' || error?.statusCode === 401) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้รับอนุญาต - กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      )
    }
    console.error('Create petty cash fund error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
