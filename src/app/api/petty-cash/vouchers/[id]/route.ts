import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/api-auth'

/**
 * GET /api/petty-cash/vouchers/[id]
 * Get single petty cash voucher by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const { id } = await params

    const voucher = await prisma.pettyCashVoucher.findUnique({
      where: { id },
      include: {
        fund: true,
      },
    })

    if (!voucher) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบใบเบิกเงินสดย่อย' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: voucher })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/petty-cash/vouchers/[id]
 * Delete a petty cash voucher (only if not yet approved/posted)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const { id } = await params

    // Fetch voucher first
    const voucher = await prisma.pettyCashVoucher.findUnique({
      where: { id },
    })

    if (!voucher) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบใบเบิกเงินสดย่อย' },
        { status: 404 }
      )
    }

    // Check if already has journal entry (already approved)
    if (voucher.journalEntryId) {
      return NextResponse.json(
        { success: false, error: 'ไม่สามารถลบใบเบิกที่ได้รับการอนุมัติแล้ว กรุณาใช้รายการย้อนกลับ' },
        { status: 400 }
      )
    }

    // Delete voucher and restore fund balance
    const [deletedVoucher] = await prisma.$transaction([
      prisma.pettyCashVoucher.delete({
        where: { id },
      }),
      prisma.pettyCashFund.update({
        where: { id: voucher.fundId },
        data: {
          currentBalance: {
            increment: voucher.amount,
          },
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: deletedVoucher,
      message: 'ลบใบเบิกเงินสดย่อยสำเร็จ',
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'เกิดข้อผิดพลาดในการลบใบเบิกเงินสดย่อย' },
      { status: 500 }
    )
  }
}
