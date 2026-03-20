// Bank Reconciliation API (Agent 05: Banking & Finance Engineer)
// POST endpoint to create bank reconciliation
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/api-utils'
import { z } from 'zod'

// Validation schema for reconciliation request
const reconcileSchema = z.object({
  statementDate: z.string(), // ISO date string
  statementBalance: z.number(), // Bank statement balance
  reconciledItems: z.array(z.object({
    id: z.string(), // Cheque ID
    type: z.enum(['CHEQUE']), // Can extend to RECEIPT, PAYMENT later
  })).optional(),
  notes: z.string().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(request)
    const { id } = await params

    const bankAccountId = id

    // Verify bank account exists
    const bankAccount = await prisma.bankAccount.findUnique({
      where: { id: bankAccountId },
    })

    if (!bankAccount) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบบัญชีธนาคาร' },
        { status: 404 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validated = reconcileSchema.parse(body)

    const statementDate = new Date(validated.statementDate)

    // Calculate book balance from unreconciled cheques
    const unreconciledCheques = await prisma.cheque.findMany({
      where: {
        bankAccountId,
        isReconciled: false,
        status: { in: ['CLEARED', 'DEPOSITED'] }, // Only cleared/deposited cheques
      },
    })

    // Calculate book balance (deposits - withdrawals)
    let bookBalance = 0
    unreconciledCheques.forEach(cheque => {
      if (cheque.type === 'RECEIVE') {
        bookBalance += cheque.amount
      } else {
        bookBalance -= cheque.amount
      }
    })

    // Calculate difference
    const difference = validated.statementBalance - bookBalance

    // Create bank reconciliation record
    const reconciliation = await prisma.bankReconciliation.create({
      data: {
        bankAccountId,
        statementDate,
        statementBalance: validated.statementBalance,
        bookBalance,
        difference,
        status: Math.abs(difference) < 0.01 ? 'MATCHED' : 'UNMATCHED',
        reconciledAt: Math.abs(difference) < 0.01 ? new Date() : null,
        notes: validated.notes,
      },
    })

    // Mark specified cheques as reconciled
    if (validated.reconciledItems && validated.reconciledItems.length > 0) {
      const chequeIds = validated.reconciledItems.map(item => item.id)

      await prisma.cheque.updateMany({
        where: {
          id: { in: chequeIds },
          bankAccountId,
        },
        data: {
          isReconciled: true,
          reconciliationId: reconciliation.id,
        },
      })
    }

    // Fetch updated reconciliation with relations
    const updatedReconciliation = await prisma.bankReconciliation.findUnique({
      where: { id: reconciliation.id },
      include: {
        bankAccount: true,
        cheques: {
          where: { reconciliationId: reconciliation.id },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        ...updatedReconciliation,
        unreconciledCount: unreconciledCheques.length - (validated.reconciledItems?.length || 0),
        summary: {
          statementBalance: validated.statementBalance,
          bookBalance,
          difference,
          status: Math.abs(difference) < 0.01 ? 'MATCHED' : 'UNMATCHED',
        },
      },
    })
  } catch (error: any) {

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'รูปแบบข้อมูลไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'เกิดข้อผิดพลาดในการกระทบยอด' },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch unreconciled items for a bank account
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(request)
    const { id } = await params

    const bankAccountId = id

    // Fetch unreconciled cheques
    const unreconciledCheques = await prisma.cheque.findMany({
      where: {
        bankAccountId,
        isReconciled: false,
      },
      orderBy: { dueDate: 'desc' },
    })

    // Fetch reconciliation history
    const reconciliationHistory = await prisma.bankReconciliation.findMany({
      where: { bankAccountId },
      include: {
        cheques: true,
      },
      orderBy: { statementDate: 'desc' },
      take: 10,
    })

    return NextResponse.json({
      success: true,
      data: {
        unreconciledCheques,
        reconciliationHistory,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
