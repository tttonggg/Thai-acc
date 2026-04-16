// Bank Account Individual Operations API
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/api-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const account = await prisma.bankAccount.findUnique({
      where: { id: id },
    })

    if (!account) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบบัญชีธนาคาร' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: account })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const body = await request.json()
    const { code, bankName, branchName, accountNumber, accountName, glAccountId, isActive } = body

    // Verify account exists
    const existing = await prisma.bankAccount.findUnique({
      where: { id: id },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบบัญชีธนาคาร' },
        { status: 404 }
      )
    }

    // Check for cheques if deactivating
    if (isActive === false) {
      const chequeCount = await prisma.cheque.count({
        where: {
          bankAccountId: id,
          status: { in: ['ON_HAND', 'DEPOSITED'] },
        },
      })

      if (chequeCount > 0) {
        return NextResponse.json(
          { success: false, error: `ไม่สามารถระงับบัญชีได้ เนื่องจากมีเช็คที่ยังไม่ได้กระทบยอด ${chequeCount} รายการ` },
          { status: 400 }
        )
      }
    }

    const account = await prisma.bankAccount.update({
      where: { id: id },
      data: {
        code: code ?? existing.code,
        bankName: bankName ?? existing.bankName,
        branchName: branchName !== undefined ? branchName : existing.branchName,
        accountNumber: accountNumber ?? existing.accountNumber,
        accountName: accountName !== undefined ? accountName : existing.accountName,
        glAccountId: glAccountId ?? existing.glAccountId,
        isActive: isActive !== undefined ? isActive : existing.isActive,
      },
    })

    return NextResponse.json({ success: true, data: account })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()

    // Check if cheques exist
    const chequeCount = await prisma.cheque.count({
      where: { bankAccountId: id },
    })

    if (chequeCount > 0) {
      return NextResponse.json(
        { success: false, error: `ไม่สามารถลบบัญชีได้ เนื่องจากมีเช็ค ${chequeCount} รายการ` },
        { status: 400 }
      )
    }

    // Check if reconciliations exist
    const reconCount = await prisma.bankReconciliation.count({
      where: { bankAccountId: id },
    })

    if (reconCount > 0) {
      return NextResponse.json(
        { success: false, error: `ไม่สามารถลบบัญชีได้ เนื่องจากมีรายการกระทบยอด ${reconCount} รายการ` },
        { status: 400 }
      )
    }

    await prisma.bankAccount.delete({
      where: { id: id },
    })

    return NextResponse.json({ success: true, message: 'ลบบัญชีธนาคารสำเร็จ' })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
