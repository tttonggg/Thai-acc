// Cheque Status Update API (Agent 05: Banking & Finance Engineer)
// Handles cheque clearing, bouncing, and status changes with GL journal entry generation
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/api-auth'
import { clearCheque, bounceCheque } from '@/lib/cheque-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()
    const cheque = await prisma.cheque.findUnique({
      where: { id: params.id },
      include: {
        bankAccount: true,
      }
    })

    if (!cheque) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบเช็ค' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: cheque })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูลเช็ค' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()
    const body = await request.json()
    const { status, clearedDate, bounceReason, chequeNo, type, bankAccountId, amount, dueDate, payeeName } = body

    // Verify cheque exists
    const cheque = await prisma.cheque.findUnique({
      where: { id: params.id },
      include: { bankAccount: true }
    })

    if (!cheque) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบเช็ค' },
        { status: 404 }
      )
    }

    // If status update is requested (with GL posting)
    if (status && (status === 'CLEARED' || status === 'BOUNCED')) {
      if (status === 'CLEARED') {
        // Clear cheque with GL journal entry
        const date = clearedDate ? new Date(clearedDate) : new Date()
        const journalEntry = await clearCheque(params.id, date)

        return NextResponse.json({
          success: true,
          data: {
            cheque: await prisma.cheque.findUnique({
              where: { id: params.id },
              include: { bankAccount: true }
            }),
            journalEntry
          }
        })
      }

      if (status === 'BOUNCED') {
        // Bounce cheque with reversing GL entry
        const date = clearedDate ? new Date(clearedDate) : new Date()
        const journalEntry = await bounceCheque(params.id, date, bounceReason)

        return NextResponse.json({
          success: true,
          data: {
            cheque: await prisma.cheque.findUnique({
              where: { id: params.id },
              include: { bankAccount: true }
            }),
            journalEntry
          }
        })
      }
    }

    // Handle field updates or simple status changes
    const updateData: any = {}

    if (chequeNo !== undefined) updateData.chequeNo = chequeNo
    if (type !== undefined) updateData.type = type
    if (bankAccountId !== undefined) updateData.bankAccountId = bankAccountId
    if (amount !== undefined) updateData.amount = parseFloat(amount)
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate)
    if (payeeName !== undefined) updateData.payeeName = payeeName
    if (status !== undefined) updateData.status = status

    // Set cleared date if status changes to DEPOSITED, CLEARED, or BOUNCED
    if (status && ['DEPOSITED', 'CLEARED', 'BOUNCED'].includes(status)) {
      updateData.clearedDate = clearedDate ? new Date(clearedDate) : new Date()
    }

    const updatedCheque = await prisma.cheque.update({
      where: { id: params.id },
      data: updateData,
      include: { bankAccount: true }
    })

    return NextResponse.json({ success: true, data: updatedCheque })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'ไม่สามารถอัปเดตสถานะเช็คได้' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()

    // Check if cheque has journal entry
    const cheque = await prisma.cheque.findUnique({
      where: { id: params.id }
    })

    if (!cheque) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบเช็ค' },
        { status: 404 }
      )
    }

    if (cheque.journalEntryId) {
      return NextResponse.json(
        { success: false, error: 'ไม่สามารถลบเช็คที่มีบันทึกบัญชีแล้ว' },
        { status: 400 }
      )
    }

    await prisma.cheque.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true, message: 'ลบเช็คสำเร็จ' })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'ไม่สามารถลบเช็คได้' },
      { status: 500 }
    )
  }
}
