import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/api-utils';
import { logActivity } from '@/lib/activity-logger';
import { getClientIp } from '@/lib/api-utils';

/**
 * POST /api/invoices/[id]/void
 * Void an invoice - create reversal journal entry and mark as cancelled
 * Only accessible by ACCOUNTANT and ADMIN roles
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole(['ACCOUNTANT', 'ADMIN']);
    const { id } = await params;
    const ipAddress = getClientIp(request.headers);
    const body = await request.json();
    const { reason } = body;

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุเหตุผลการยกเลิก' },
        { status: 400 }
      );
    }

    // Fetch invoice with all related data
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        lines: true,
        journalEntry: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ success: false, error: 'ไม่พบใบกำกับภาษี' }, { status: 404 });
    }

    if (invoice.status === 'DRAFT') {
      return NextResponse.json(
        { success: false, error: 'ไม่สามารถยกเลิกใบร่างได้' },
        { status: 400 }
      );
    }

    if (invoice.status === 'CANCELLED') {
      return NextResponse.json(
        { success: false, error: 'ใบกำกับภาษีถูกยกเลิกแล้ว' },
        { status: 400 }
      );
    }

    // Get AR and Revenue accounts from chart of accounts
    const arAccount = await prisma.chartOfAccount.findFirst({
      where: { code: '1120' }, // Accounts Receivable
    });

    const revenueAccount = await prisma.chartOfAccount.findFirst({
      where: { code: '4100' }, // Sales Revenue
    });

    if (!arAccount || !revenueAccount) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบบัญชีบัญชีลูกหนี้ (1120) หรือบัญชีรายได้ (4100)' },
        { status: 400 }
      );
    }

    // Create reversal journal entry and update invoice using transaction
    const result = await prisma.$transaction(
      async (tx) => {
        // 1. Create reversal journal entry if original was posted
        let reversalEntryNo;
        if (invoice.journalEntryId) {
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const prefix = `CN-${year}${month}`;

          // Get next sequence number for credit notes
          const lastCreditNote = await tx.journalEntry.findFirst({
            where: {
              entryNo: { startsWith: prefix },
            },
            orderBy: { entryNo: 'desc' },
          });

          const nextNum = lastCreditNote
            ? parseInt(lastCreditNote.entryNo.split('-')[2] || '0') + 1
            : 1;

          reversalEntryNo = `${prefix}-${String(nextNum).padStart(4, '0')}`;

          // Calculate reversal amounts (net amount = total - WHT)
          const reversalAmount = invoice.netAmount || invoice.totalAmount;

          // Create reversal journal entry
          await tx.journalEntry.create({
            data: {
              entryNo: reversalEntryNo,
              date: new Date(),
              description: `ยกเลิก ${invoice.invoiceNo}: ${invoice.customer.name}`,
              reference: invoice.invoiceNo,
              documentType: 'CREDIT_NOTE',
              documentId: invoice.id,
              totalDebit: reversalAmount,
              totalCredit: reversalAmount,
              status: 'POSTED',
              isReversing: true,
              reversingId: invoice.journalEntryId,
              createdById: user.id,
              notes: `เหตุผล: ${reason}`,
              lines: {
                create: [
                  // Debit AR (reverse original credit to AR)
                  {
                    lineNo: 1,
                    accountId: arAccount.id,
                    description: `ยกเลิก ${invoice.invoiceNo} - ${invoice.customer.name}`,
                    debit: reversalAmount,
                    credit: 0,
                  },
                  // Credit Revenue (reverse original debit from Revenue)
                  {
                    lineNo: 2,
                    accountId: revenueAccount.id,
                    description: `ยกเลิก ${invoice.invoiceNo} - ${invoice.type}`,
                    debit: 0,
                    credit: reversalAmount,
                  },
                ],
              },
            },
          });
        }

        // 2. Update invoice status
        const updated = await tx.invoice.update({
          where: { id },
          data: {
            status: 'CANCELLED',
            notes: `${invoice.notes || ''}\n\nยกเลิกเมื่อ: ${new Date().toLocaleString('th-TH', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}\nเหตุผล: ${reason}`,
          },
        });

        return updated;
      },
      { maxWait: 5000, timeout: 10000 }
    );

    // Log activity
    await logActivity({
      userId: user.id,
      action: 'INVOICE_VOID',
      module: 'invoices',
      recordId: id,
      details: {
        invoiceNo: invoice.invoiceNo,
        customerId: invoice.customerId,
        totalAmount: invoice.totalAmount,
        reason,
      },
      ipAddress,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        reversalEntryNo,
      },
      message: 'ยกเลิกใบกำกับภาษีเรียบร้อยแล้ว',
    });
  } catch (error: any) {
    console.error('Error voiding invoice:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'เกิดข้อผิดพลาดในการยกเลิกใบกำกับภาษี' },
      { status: 500 }
    );
  }
}
