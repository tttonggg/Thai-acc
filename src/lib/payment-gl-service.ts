import { db } from '@/lib/db';

// Account codes for payment GL posting
const PAYMENT_ACCOUNT_CODES = {
  AP: '2110',           // เจ้าหนี้การค้า
  CASH: '1110',         // เงินสด
  BANK_PREFIX: '112',   // เงินฝากธนาคาร (prefix match)
  WHT_RECEIVABLE: '2130', // ภาษีหัก ณ ที่จ่าย
} as const;

/**
 * Post a payment to the General Ledger.
 * Used by payment approval flow and other services that need to post payments.
 */
export async function postPaymentToGL(payment: any, tx: any = db) {
  // Get AP account - MUST match purchase invoice posting (2110)
  const apAccount = await tx.chartOfAccount.findUnique({
    where: { code: PAYMENT_ACCOUNT_CODES.AP },
  });

  // Get cash/bank account based on payment method
  let cashAccountId: string | null = null;
  if (payment.paymentMethod === 'CASH') {
    const cashAccount = await tx.chartOfAccount.findUnique({
      where: { code: PAYMENT_ACCOUNT_CODES.CASH },
    });
    cashAccountId = cashAccount?.id || null;
  } else if (payment.bankAccountId) {
    const bankGlAccount = await tx.chartOfAccount.findFirst({
      where: { code: { startsWith: PAYMENT_ACCOUNT_CODES.BANK_PREFIX } },
    });
    cashAccountId = bankGlAccount?.id || null;
  }

  // Get WHT receivable account
  const whtAccount = await tx.chartOfAccount.findUnique({
    where: { code: PAYMENT_ACCOUNT_CODES.WHT_RECEIVABLE },
  });

  if (!apAccount) {
    throw new Error(`ไม่พบบัญชีเจ้าหนี้การค้า (${PAYMENT_ACCOUNT_CODES.AP})`);
  }

  // Create journal entry lines
  const lines: any[] = [];

  // Debit: AP (reduce liability)
  for (const allocation of payment.allocations) {
    lines.push({
      accountId: apAccount!.id,
      description: `จ่ายเงินเจ้าหนี้ ${payment.vendor.name} ใบซื้อ ${allocation.invoice.invoiceNo}`,
      debit: allocation.amount + allocation.whtAmount,
      credit: 0,
      reference: payment.paymentNo,
    });
  }

  // Credit: Cash/Bank
  if (cashAccountId) {
    lines.push({
      accountId: cashAccountId,
      description: `จ่ายเงินเจ้าหนี้ ${payment.vendor.name}`,
      debit: 0,
      credit: payment.amount - payment.unallocated,
      reference: payment.paymentNo,
    });
  }

  // Credit: Unallocated (vendor credit)
  if (payment.unallocated > 0) {
    lines.push({
      accountId: apAccount.id,
      description: `เครดิตเจ้าหนี้ ${payment.vendor.name}`,
      debit: 0,
      credit: payment.unallocated,
      reference: payment.paymentNo,
    });
  }

  // Credit: WHT (if any)
  if (payment.whtAmount > 0 && whtAccount) {
    lines.push({
      accountId: whtAccount.id,
      description: `ภาษีหัก ณ ที่จ่าย ${payment.vendor.name}`,
      debit: 0,
      credit: payment.whtAmount,
      reference: payment.paymentNo,
    });
  }

  // Create journal entry
  const journalEntry = await tx.journalEntry.create({
    data: {
      date: payment.paymentDate,
      description: `ใบจ่ายเงิน ${payment.paymentNo} - ${payment.vendor.name}`,
      reference: payment.paymentNo,
      documentType: 'PAYMENT',
      documentId: payment.id,
      totalDebit: lines.reduce((sum, l) => sum + l.debit, 0),
      totalCredit: lines.reduce((sum, l) => sum + l.credit, 0),
      status: 'POSTED',
      lines: {
        create: lines.map((line, index) => ({
          ...line,
          lineNo: index + 1,
        })),
      },
    },
  });

  // Update payment with journal entry ID
  await tx.payment.update({
    where: { id: payment.id },
    data: { journalEntryId: journalEntry.id },
  });

  // Update invoice balances
  for (const allocation of payment.allocations) {
    await tx.purchaseInvoice.update({
      where: { id: allocation.invoiceId },
      data: {
        paidAmount: {
          increment: allocation.amount,
        },
      },
    });
  }

  return journalEntry;
}
