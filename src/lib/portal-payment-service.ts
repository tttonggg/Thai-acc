/**
 * Portal Payment Service
 * Records customer payments → creates DRAFT Receipt for ERP approval.
 * All amounts in Satang (integers).
 */
import { prisma } from '@/lib/db';
import { PaymentMethod } from '@prisma/client';

export interface PortalPaymentInput {
  customerId: string;
  payments: Array<{
    invoiceId: string;
    amount: number; // Satang
  }>;
  paymentMethod: PaymentMethod;
  bankAccountId?: string;
  chequeNo?: string;
  chequeDate?: string;
  notes?: string;
  slipImageUrl?: string; // uploaded slip image URL
}

export interface PortalPaymentResult {
  success: boolean;
  receiptId?: string;
  receiptNo?: string;
  error?: string;
}

/**
 * Generate a portal receipt number.
 * Format: RCP-PORTAL-{YYYYMMDD}-{4-digit-seq}
 */
async function generatePortalReceiptNo(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD

  const lastReceipt = await prisma.receipt.findFirst({
    where: { receiptNo: { startsWith: `RCP-PORTAL-${dateStr}` } },
    orderBy: { createdAt: 'desc' },
    select: { receiptNo: true },
  });

  let seq = 1;
  if (lastReceipt) {
    const lastSeq = parseInt(lastReceipt.receiptNo.split('-').pop() || '0', 10);
    seq = lastSeq + 1;
  }

  return `RCP-PORTAL-${dateStr}-${seq.toString().padStart(4, '0')}`;
}

/**
 * Record a customer payment → creates DRAFT Receipt.
 * Supports multiple invoice allocations (partial payments).
 * ERP accountant approves via existing /api/receipts/[id]/post flow.
 */
export async function recordPortalPayment(
  input: PortalPaymentInput
): Promise<PortalPaymentResult> {
  const {
    customerId,
    payments,
    paymentMethod,
    bankAccountId,
    chequeNo,
    chequeDate,
    notes,
    slipImageUrl,
  } = input;

  // Validate: all invoices belong to this customer and are payable
  const invoiceIds = payments.map((p) => p.invoiceId);

  const invoices = await prisma.invoice.findMany({
    where: {
      id: { in: invoiceIds },
      customerId,
      status: { in: ['ISSUED', 'PARTIAL'] },
      deletedAt: null,
    },
    select: {
      id: true,
      invoiceNo: true,
      totalAmount: true,
      paidAmount: true,
      dueDate: true,
    },
  });

  if (invoices.length !== invoiceIds.length) {
    return { success: false, error: 'ใบแจ้งหนี้บางรายการไม่พบหรือไม่สามารถชำระได้' };
  }

  // Validate amounts
  for (const payment of payments) {
    const invoice = invoices.find((i) => i.id === payment.invoiceId)!;
    const outstanding = invoice.totalAmount - invoice.paidAmount;
    if (payment.amount <= 0) {
      return { success: false, error: 'จำนวนเงินต้องมากกว่า 0' };
    }
    if (payment.amount > outstanding) {
      return {
        success: false,
        error: `จำนวนเงินเกินยอดค้างชำระของใบแจ้งหนี้ ${invoice.invoiceNo}`,
      };
    }
  }

  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const receiptNo = await generatePortalReceiptNo();

  try {
    const receipt = await prisma.receipt.create({
      data: {
        receiptNo,
        receiptDate: new Date(),
        customerId,
        paymentMethod,
        bankAccountId: bankAccountId || null,
        chequeNo: chequeNo || null,
        chequeDate: chequeDate ? new Date(chequeDate) : null,
        amount: totalAmount,
        whtAmount: 0,
        unallocated: 0,
        notes: notes || null,
        status: 'DRAFT',
        isActive: true,
        lines: {
          create: payments.map((payment, idx) => ({
            lineNo: idx + 1,
            invoiceId: payment.invoiceId,
            amount: payment.amount,
            whtRate: 0,
            whtAmount: 0,
          })),
        },
        allocations: {
          create: payments.map((payment) => ({
            invoiceId: payment.invoiceId,
            amount: payment.amount,
            whtRate: 0,
          })),
        },
      },
    });

    // Note: slip image attachment is skipped here.
    // Portal creates DRAFT Receipt; ERP accountant attaches slip on approval.
    // If attachment is needed, use a system/service user ID.

    return {
      success: true,
      receiptId: receipt.id,
      receiptNo: receipt.receiptNo,
    };
  } catch (error) {
    console.error('recordPortalPayment error:', error);
    return { success: false, error: 'เกิดข้อผิดพลาดในการบันทึกการชำระเงิน' };
  }
}

/**
 * Upload a slip image and return the URL.
 * Calls the existing document-attachments endpoint.
 */
export async function uploadSlipImage(
  receiptId: string,
  fileData: string // base64
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const formData = new FormData();
    const blob = await fetch(`data:image/jpeg;base64,${fileData}`).then((r) =>
      r.blob()
    );
    formData.append('file', blob, 'slip.jpg');
    formData.append('entityType', 'receipt');
    formData.append('entityId', receiptId);

    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/document-attachments/`, {
      method: 'POST',
      headers: { Authorization: `Bearer portal` },
      body: formData,
    });

    if (!res.ok) {
      return { success: false, error: 'อัปโหลดสลิปไม่สำเร็จ' };
    }

    const data = await res.json();
    return { success: true, url: data.url || data.fileUrl };
  } catch (error) {
    console.error('uploadSlipImage error:', error);
    return { success: false, error: 'เกิดข้อผิดพลาดในการอัปโหลดสลิป' };
  }
}
