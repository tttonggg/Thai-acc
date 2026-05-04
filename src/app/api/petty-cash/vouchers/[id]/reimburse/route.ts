import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/api-utils';
import { generateDocNumber } from '@/lib/api-utils';
import { handleApiError } from '@/lib/api-error-handler';

/**
 * POST /api/petty-cash/vouchers/[id]/reimburse
 * Reimburse a petty cash fund (create journal entry to replenish fund)
 * This creates a journal entry to debit petty cash and credit cash/bank
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;

    // Fetch voucher with related fund data
    const voucher = await prisma.pettyCashVoucher.findUnique({
      where: { id },
      include: {
        fund: true,
      },
    });

    if (!voucher) {
      return NextResponse.json({ success: false, error: 'ไม่พบใบเบิกเงินสดย่อย' }, { status: 404 });
    }

    // Check if already reimbursed
    if (voucher.isReimbursed) {
      return NextResponse.json(
        { success: false, error: 'ใบเบิกเงินสดย่อยนี้ได้รับการเติมเงินแล้ว' },
        { status: 400 }
      );
    }

    // For reimbursement, we need to know which cash/bank account to credit
    // This should be provided in the request body
    const body = await request.json();
    const { cashBankAccountId } = body;

    if (!cashBankAccountId) {
      return NextResponse.json(
        { success: false, error: 'ต้องระบุบัญชีเงินสด/ธนาคารที่จะเติมเงิน' },
        { status: 400 }
      );
    }

    // Verify the cash/bank account exists
    const cashBankAccount = await prisma.chartOfAccount.findUnique({
      where: { id: cashBankAccountId },
    });

    if (!cashBankAccount) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบบัญชีเงินสด/ธนาคาร' },
        { status: 404 }
      );
    }

    // Wrap all operations in a transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // C-03: Use generateDocNumber for transaction-safe journal entry number
      const entryNo = await generateDocNumber('JOURNAL_ENTRY', 'JV');

      // Create reimbursement journal entry
      // Debit: Petty cash fund (increase)
      // Credit: Cash/Bank account (decrease)
      const journalEntry = await tx.journalEntry.create({
        data: {
          entryNo,
          date: new Date(),
          description: `เติมเงินสดย่อย ${voucher.fund.name} ใบเบิก ${voucher.voucherNo}`,
          reference: `เติมเงินสดย่อย ${voucher.voucherNo}`,
          documentType: 'PETTY_CASH_REIMBURSEMENT',
          documentId: voucher.id,
          totalDebit: voucher.amount,
          totalCredit: voucher.amount,
          status: 'POSTED',
          lines: {
            create: [
              // Debit line - Petty cash fund (increase)
              {
                lineNo: 1,
                accountId: voucher.fund.glAccountId,
                description: `เติมเงินสดย่อย ${voucher.fund.name}`,
                debit: voucher.amount,
                credit: 0,
                reference: voucher.voucherNo,
              },
              // Credit line - Cash/Bank account (decrease)
              {
                lineNo: 2,
                accountId: cashBankAccountId,
                description: `เติมเงินสดย่อย (${voucher.payee})`,
                debit: 0,
                credit: voucher.amount,
                reference: voucher.voucherNo,
              },
            ],
          },
        },
      });

      // Mark voucher as reimbursed
      const updatedVoucher = await tx.pettyCashVoucher.update({
        where: { id },
        data: {
          isReimbursed: true,
        },
      });

      // Update fund current balance
      const updatedFund = await tx.pettyCashFund.update({
        where: { id: voucher.fundId },
        data: {
          currentBalance: {
            increment: voucher.amount,
          },
        },
      });

      return {
        voucher: updatedVoucher,
        fund: updatedFund,
        journalEntry,
        newBalance: updatedFund.currentBalance,
      };
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: 'เติมเงินสดย่อยสำเร็จ',
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error.message || 'เกิดข้อผิดพลาดในการเติมเงินสดย่อย' },
      { status: 500 }
    );
  }
}
