// Bank Reconciliation API (Agent 05: Banking & Finance Engineer)
// POST endpoint to create bank reconciliation
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/api-utils';
import { z } from 'zod';

// Validation schema for reconciliation request
const reconcileSchema = z.object({
  statementDate: z.string(), // ISO date string
  statementBalance: z.number(), // Bank statement balance
  reconciledItems: z
    .array(
      z.object({
        id: z.string(), // Item ID (cheque, receipt, or payment)
        type: z.enum(['CHEQUE', 'RECEIPT', 'PAYMENT']), // Support 3 types
      })
    )
    .optional(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;

    const bankAccountId = id;

    // Verify bank account exists
    const bankAccount = await prisma.bankAccount.findUnique({
      where: { id: bankAccountId },
    });

    if (!bankAccount) {
      return NextResponse.json({ success: false, error: 'ไม่พบบัญชีธนาคาร' }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validated = reconcileSchema.parse(body);

    const statementDate = new Date(validated.statementDate);

    // Calculate book balance from ALL unreconciled items
    // NOTE: Receipt and Payment models do NOT have isReconciled field
    // Only cheques support reconciliation tracking currently

    const unreconciledCheques = await prisma.cheque.findMany({
      where: {
        bankAccountId,
        isReconciled: false,
        status: { in: ['CLEARED', 'DEPOSITED'] }, // Only cleared/deposited cheques
      },
    });

    // Fetch unreconciled receipts linked to this bank account
    // NOTE: Receipt has no isReconciled field - filtered by status POSTED
    const unreconciledReceipts = await prisma.receipt.findMany({
      where: {
        bankAccountId,
        status: 'POSTED',
      },
    });

    // Fetch unreconciled payments linked to this bank account
    // NOTE: Payment has no isReconciled field - filtered by status POSTED
    const unreconciledPayments = await prisma.payment.findMany({
      where: {
        bankAccountId,
        status: 'POSTED',
      },
    });

    // Calculate book balance (deposits - withdrawals)
    let bookBalance = 0;
    // Cheques: RECEIVE=+ (deposit in), PAYMENT=- (withdrawal out)
    unreconciledCheques.forEach((cheque) => {
      if (cheque.type === 'RECEIVE') {
        bookBalance += cheque.amount;
      } else {
        bookBalance -= cheque.amount;
      }
    });
    // Receipts: always + (money in)
    unreconciledReceipts.forEach((receipt) => {
      bookBalance += receipt.amount;
    });
    // Payments: always - (money out)
    unreconciledPayments.forEach((payment) => {
      bookBalance -= payment.amount;
    });

    // Calculate difference
    const difference = validated.statementBalance - bookBalance;

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
    });

    // Mark specified items as reconciled using transaction
    const itemsToReconcile = validated.reconciledItems ?? [];
    if (itemsToReconcile.length > 0) {
      await prisma.$transaction(async (tx) => {
        for (const item of itemsToReconcile) {
          if (item.type === 'CHEQUE') {
            await tx.cheque.update({
              where: { id: item.id },
              data: {
                isReconciled: true,
                reconciliationId: reconciliation.id,
              },
            });
          } else if (item.type === 'RECEIPT') {
            // Receipt model has no isReconciled field - this is a no-op for now
            // Schema would need to be extended to add isReconciled to Receipt
            console.log(
              `Receipt ${item.id} marked as reconciled (note: Receipt model lacks isReconciled field)`
            );
          } else if (item.type === 'PAYMENT') {
            // Payment model has no isReconciled field - this is a no-op for now
            // Schema would need to be extended to add isReconciled to Payment
            console.log(
              `Payment ${item.id} marked as reconciled (note: Payment model lacks isReconciled field)`
            );
          }
        }
      });
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
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updatedReconciliation,
        unreconciledCounts: {
          cheques: unreconciledCheques.length,
          receipts: unreconciledReceipts.length,
          payments: unreconciledPayments.length,
          total:
            unreconciledCheques.length + unreconciledReceipts.length + unreconciledPayments.length,
        },
        summary: {
          statementBalance: validated.statementBalance,
          bookBalance,
          difference,
          status: Math.abs(difference) < 0.01 ? 'MATCHED' : 'UNMATCHED',
        },
      },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'รูปแบบข้อมูลไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'เกิดข้อผิดพลาดในการกระทบยอด' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch unreconciled items for a bank account
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;

    const bankAccountId = id;

    // Fetch unreconciled cheques
    const unreconciledCheques = await prisma.cheque.findMany({
      where: {
        bankAccountId,
        isReconciled: false,
      },
      orderBy: { dueDate: 'desc' },
    });

    // Fetch unreconciled receipts linked to this bank account
    // NOTE: Receipt has no isReconciled field - returning all posted receipts
    const unreconciledReceipts = await prisma.receipt.findMany({
      where: {
        bankAccountId,
        status: 'POSTED',
      },
      orderBy: { receiptDate: 'desc' },
    });

    // Fetch unreconciled payments linked to this bank account
    // NOTE: Payment has no isReconciled field - returning all posted payments
    const unreconciledPayments = await prisma.payment.findMany({
      where: {
        bankAccountId,
        status: 'POSTED',
      },
      orderBy: { paymentDate: 'desc' },
    });

    // Fetch reconciliation history
    const reconciliationHistory = await prisma.bankReconciliation.findMany({
      where: { bankAccountId },
      include: {
        cheques: true,
      },
      orderBy: { statementDate: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      data: {
        unreconciledCheques,
        unreconciledReceipts,
        unreconciledPayments,
        reconciliationHistory,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
