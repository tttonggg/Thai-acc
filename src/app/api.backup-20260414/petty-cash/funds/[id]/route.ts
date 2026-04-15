import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/api-utils'

/**
 * GET /api/petty-cash/funds/[id]
 * Get single petty cash fund by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const { id } = await params

    const fund = await prisma.pettyCashFund.findUnique({
      where: { id },
      include: {
        custodian: {
          select: { id: true, name: true, email: true }
        },
        vouchers: {
          select: { id: true, voucherNo: true, amount: true, isReimbursed: true }
        }
      }
    })

    if (!fund) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบกองทุนเงินสดย่อย' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: fund })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/petty-cash/funds/[id]
 * Update petty cash fund
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const { id } = await params
    const body = await request.json()
    const { code, name, custodianId, glAccountId, maxAmount, isActive } = body

    // Validate required fields
    if (!code || !name || !custodianId || !glAccountId || !maxAmount) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      )
    }

    // Check if fund exists
    const existingFund = await prisma.pettyCashFund.findUnique({
      where: { id },
      include: { vouchers: true }
    })

    if (!existingFund) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบกองทุนเงินสดย่อย' },
        { status: 404 }
      )
    }

    // Check if code is being changed and if it conflicts with another fund
    if (code !== existingFund.code) {
      const codeExists = await prisma.pettyCashFund.findUnique({
        where: { code }
      })

      if (codeExists) {
        return NextResponse.json(
          { success: false, error: 'รหัสกองทุนนี้มีอยู่แล้วในระบบ' },
          { status: 400 }
        )
      }
    }

    // Validate maxAmount cannot be less than current balance
    const newMaxAmount = parseFloat(maxAmount)
    if (newMaxAmount < existingFund.currentBalance) {
      return NextResponse.json(
        {
          success: false,
          error: `วงเงินสูงสุดไม่สามารถน้อยกว่ายอดคงเหลือปัจจุบัน (฿${existingFund.currentBalance.toLocaleString()})`
        },
        { status: 400 }
      )
    }

    // Update fund
    const updatedFund = await prisma.pettyCashFund.update({
      where: { id },
      data: {
        code,
        name,
        custodianId,
        glAccountId,
        maxAmount: newMaxAmount,
        isActive: isActive !== undefined ? isActive : existingFund.isActive,
      },
      include: {
        custodian: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedFund,
      message: 'อัปเดตกองทุนเงินสดย่อยสำเร็จ'
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'เกิดข้อผิดพลาดในการอัปเดตกองทุนเงินสดย่อย' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/petty-cash/funds/[id]
 * Delete petty cash fund (only if no vouchers or all vouchers are deleted)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const { id } = await params

    // Check if fund exists
    const fund = await prisma.pettyCashFund.findUnique({
      where: { id },
      include: { vouchers: true }
    })

    if (!fund) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบกองทุนเงินสดย่อย' },
        { status: 404 }
      )
    }

    // Check if fund has any vouchers
    if (fund.vouchers.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `ไม่สามารถลบกองทุนที่มีใบสำคัญได้ (มี ${fund.vouchers.length} ใบสำคัญ)`
        },
        { status: 400 }
      )
    }

    // Check if fund has balance
    if (fund.currentBalance > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `ไม่สามารถลบกองทุนที่มียอดคงเหลือ (฿${fund.currentBalance.toLocaleString()})`
        },
        { status: 400 }
      )
    }

    // Delete fund
    await prisma.pettyCashFund.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'ลบกองทุนเงินสดย่อยสำเร็จ'
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'เกิดข้อผิดพลาดในการลบกองทุนเงินสดย่อย' },
      { status: 500 }
    )
  }
}
