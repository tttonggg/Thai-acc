import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

// POST - Post journal entry (change status from DRAFT to POSTED)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const existing = await prisma.journalEntry.findUnique({
      where: { id },
      include: {
        lines: true,
      },
    })
    
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบรายการนี้' },
        { status: 404 }
      )
    }
    
    if (existing.status === 'POSTED') {
      return NextResponse.json(
        { success: false, error: 'รายการนี้ลงบัญชีแล้ว' },
        { status: 400 }
      )
    }
    
    // Validate balance
    const totalDebit = existing.lines.reduce((sum, line) => sum + line.debit, 0)
    const totalCredit = existing.lines.reduce((sum, line) => sum + line.credit, 0)
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return NextResponse.json(
        { success: false, error: 'ยอดเดบิตและเครดิตไม่สมดุล' },
        { status: 400 }
      )
    }
    
    // Update status to POSTED
    const entry = await prisma.journalEntry.update({
      where: { id },
      data: {
        status: 'POSTED',
        postedAt: new Date(),
      },
      include: {
        lines: {
          include: {
            account: true,
          },
        },
      },
    })
    
    return NextResponse.json({ 
      success: true, 
      data: entry,
      message: 'ลงบัญชีสำเร็จ' 
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'เกิดข้อผิดพลาดในการลงบัญชี' },
      { status: 500 }
    )
  }
}
