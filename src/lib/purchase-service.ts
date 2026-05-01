// ============================================
// 🛒 Purchase Request & Purchase Order Service
// บริการใบขอซื้อ (PR) และใบสั่งซื้อ (PO)
// ============================================

import prisma from '@/lib/db';
import { generateDocNumber } from '@/lib/api-utils';
import { bahtToSatang, satangToBaht, calculatePercent } from '@/lib/currency';

// ============================================
// Custom Error Classes
// ============================================

export class PRValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PRValidationError';
  }
}

export class POWorkflowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'POWorkflowError';
  }
}

export class BudgetInsufficientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BudgetInsufficientError';
  }
}

// ============================================
// Type Definitions
// ============================================

export interface ReceivedItem {
  lineId: string;
  receivedQty: number;
  notes?: string;
}

export interface POStatusInfo {
  canSubmit: boolean;
  canConfirm: boolean;
  canShip: boolean;
  canReceive: boolean;
  canCancel: boolean;
  allowedTransitions: string[];
}

export interface POConversionOptions {
  vendorContact?: string;
  vendorEmail?: string;
  vendorPhone?: string;
  shippingTerms?: string;
  paymentTerms?: string;
  deliveryAddress?: string;
  expectedDate?: Date;
  notes?: string;
}

export interface POLineCalculation {
  subtotal: number;
  discountAmount: number;
  afterDiscount: number;
  vatAmount: number;
  amount: number;
}

export interface POTotalCalculation {
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
}

export interface BudgetValidationResult {
  valid: boolean;
  budget?: any;
  error?: string;
}

// ============================================
// Number Generation Functions
// ============================================

/**
 * Generate Purchase Request Number
 * สร้างเลขที่ใบขอซื้อ
 * Format: PR{yyyy}{mm}-{sequence}
 * Example: PR202603-0001
 */
export async function generatePRNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `PR${year}${month}`;

  // Find the last PR number for this month
  const lastPR = await prisma.purchaseRequest.findFirst({
    where: {
      requestNo: {
        startsWith: prefix,
      },
    },
    orderBy: {
      requestNo: 'desc',
    },
  });

  let sequence = 1;
  if (lastPR) {
    const lastSequence = parseInt(lastPR.requestNo.split('-')[1]);
    sequence = lastSequence + 1;
  }

  return `${prefix}-${String(sequence).padStart(4, '0')}`;
}

/**
 * Generate Purchase Order Number
 * สร้างเลขที่ใบสั่งซื้อ
 * Format: PO{yyyy}{mm}-{sequence}
 * Example: PO202603-0001
 */
export async function generatePONumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `PO${year}${month}`;

  // Find the last PO number for this month
  const lastPO = await prisma.purchaseOrder.findFirst({
    where: {
      orderNo: {
        startsWith: prefix,
      },
    },
    orderBy: {
      orderNo: 'desc',
    },
  });

  let sequence = 1;
  if (lastPO) {
    const lastSequence = parseInt(lastPO.orderNo.split('-')[1]);
    sequence = lastSequence + 1;
  }

  return `${prefix}-${String(sequence).padStart(4, '0')}`;
}

// ============================================
// PR Workflow Functions
// ============================================

/**
 * Submit PR for Approval
 * ส่งใบขอซื้อเพื่อขออนุมัติ
 */
export async function submitPRForApproval(prId: string, userId?: string): Promise<any> {
  return await prisma.$transaction(async (tx) => {
    const pr = await tx.purchaseRequest.findUnique({
      where: { id: prId },
      include: {
        lines: true,
        budget: true,
      },
    });

    if (!pr) {
      throw new PRValidationError('ไม่พบใบขอซื้อ (PR not found)');
    }

    if (pr.status !== 'DRAFT') {
      throw new PRValidationError(
        `สถานะใบขอซื้อไม่ถูกต้อง ต้องเป็น DRAFT เท่านั้น (Invalid PR status, must be DRAFT)`
      );
    }

    if (!pr.lines || pr.lines.length === 0) {
      throw new PRValidationError(
        'ต้องมีรายการสินค้าอย่างน้อย 1 รายการ (Must have at least 1 line item)'
      );
    }

    // Check budget if specified
    if (pr.budgetId) {
      const budgetCheck = await checkPRBudget(prId);
      if (!budgetCheck.sufficient) {
        throw new BudgetInsufficientError(
          budgetCheck.error || 'งบประมาณไม่เพียงพอ (Insufficient budget)'
        );
      }
    }

    const updatedPR = await tx.purchaseRequest.update({
      where: { id: prId },
      data: {
        status: 'PENDING',
        submittedAt: new Date(),
        updatedById: userId,
      },
      include: {
        requestedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        departmentData: true,
        budget: true,
        lines: {
          include: {
            product: true,
          },
        },
      },
    });

    return updatedPR;
  });
}

/**
 * Approve PR
 * อนุมัติใบขอซื้อ
 */
export async function approvePR(prId: string, approverId: string, notes?: string): Promise<any> {
  return await prisma.$transaction(async (tx) => {
    const pr = await tx.purchaseRequest.findUnique({
      where: { id: prId },
      include: {
        lines: true,
        budget: true,
      },
    });

    if (!pr) {
      throw new PRValidationError('ไม่พบใบขอซื้อ (PR not found)');
    }

    if (pr.status !== 'PENDING') {
      throw new PRValidationError(
        `สถานะใบขอซื้อไม่ถูกต้อง ต้องเป็น PENDING เท่านั้น (Invalid PR status, must be PENDING)`
      );
    }

    // Final budget check before approval
    if (pr.budgetId) {
      const budgetCheck = await checkPRBudget(prId);
      if (!budgetCheck.sufficient) {
        throw new BudgetInsufficientError(
          budgetCheck.error || 'งบประมาณไม่เพียงพอ (Insufficient budget)'
        );
      }

      // Reserve budget amount
      if (budgetCheck.budget) {
        const newUsedAmount = budgetCheck.budget.usedAmount + pr.estimatedAmount;
        const newRemainingAmount = budgetCheck.budget.remainingAmount - pr.estimatedAmount;

        if (newRemainingAmount < 0) {
          throw new BudgetInsufficientError(
            `งบประมาณคงเหลือไม่เพียงพอ: คงเหลือ ${newRemainingAmount / 100} บาท (Insufficient remaining budget)`
          );
        }

        await tx.departmentBudget.update({
          where: { id: pr.budgetId },
          data: {
            usedAmount: newUsedAmount,
            remainingAmount: newRemainingAmount,
          },
        });
      }
    }

    const updatedPR = await tx.purchaseRequest.update({
      where: { id: prId },
      data: {
        status: 'APPROVED',
        approvedBy: approverId,
        approvedAt: new Date(),
        approvalNotes: notes,
        updatedById: approverId,
      },
      include: {
        requestedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approvedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        departmentData: true,
        budget: true,
        lines: {
          include: {
            product: true,
          },
        },
      },
    });

    return updatedPR;
  });
}

/**
 * Reject PR
 * ปฏิเสธใบขอซื้อ
 */
export async function rejectPR(prId: string, approverId: string, reason: string): Promise<any> {
  if (!reason || reason.trim().length === 0) {
    throw new PRValidationError('ต้องระบุเหตุผลในการปฏิเสธ (Must specify rejection reason)');
  }

  return await prisma.$transaction(async (tx) => {
    const pr = await tx.purchaseRequest.findUnique({
      where: { id: prId },
    });

    if (!pr) {
      throw new PRValidationError('ไม่พบใบขอซื้อ (PR not found)');
    }

    if (pr.status !== 'PENDING') {
      throw new PRValidationError(
        `สถานะใบขอซื้อไม่ถูกต้อง ต้องเป็น PENDING เท่านั้น (Invalid PR status, must be PENDING)`
      );
    }

    const updatedPR = await tx.purchaseRequest.update({
      where: { id: prId },
      data: {
        status: 'REJECTED',
        approvedBy: approverId,
        approvedAt: new Date(),
        approvalNotes: reason,
        updatedById: approverId,
      },
      include: {
        requestedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approvedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        departmentData: true,
        budget: true,
        lines: {
          include: {
            product: true,
          },
        },
      },
    });

    return updatedPR;
  });
}

/**
 * Check PR Budget Availability
 * ตรวจสอบงบประมาณสำหรับใบขอซื้อ
 */
export async function checkPRBudget(prId: string): Promise<{
  sufficient: boolean;
  budget?: any;
  error?: string;
}> {
  const pr = await prisma.purchaseRequest.findUnique({
    where: { id: prId },
    include: {
      budget: true,
    },
  });

  if (!pr) {
    return { sufficient: false, error: 'ไม่พบใบขอซื้อ (PR not found)' };
  }

  if (!pr.budgetId) {
    // No budget specified, consider as sufficient
    return { sufficient: true };
  }

  if (!pr.budget) {
    return { sufficient: false, error: 'ไม่พบงบประมาณ (Budget not found)' };
  }

  if (pr.budget.status !== 'ACTIVE') {
    return {
      sufficient: false,
      error: `งบประมาณไม่อยู่ในสถานะใช้งาน (Budget status is ${pr.budget.status})`,
    };
  }

  const now = new Date();
  if (now < pr.budget.startDate || now > pr.budget.endDate) {
    return {
      sufficient: false,
      error: 'งบประมาณไม่อยู่ในช่วงเวลาที่กำหนด (Budget not in valid date range)',
    };
  }

  const remainingAmount = pr.budget.remainingAmount - pr.estimatedAmount;
  const sufficient = remainingAmount >= 0;

  return {
    sufficient,
    budget: pr.budget,
    error: sufficient
      ? undefined
      : `งบประมาณคงเหลือไม่เพียงพอ: คงเหลือ ${pr.budget.remainingAmount / 100} บาท ต้องการ ${pr.estimatedAmount / 100} บาท`,
  };
}

// ============================================
// PO Creation from PR
// ============================================

/**
 * Convert PR to PO
 * แปลงใบขอซื้อเป็นใบสั่งซื้อ
 */
export async function convertPRToPO(
  prId: string,
  vendorId: string,
  options: POConversionOptions = {},
  userId?: string
): Promise<any> {
  return await prisma.$transaction(async (tx) => {
    // Get PR with lines
    const pr = await tx.purchaseRequest.findUnique({
      where: { id: prId },
      include: {
        lines: {
          include: {
            product: true,
          },
        },
        budget: true,
      },
    });

    if (!pr) {
      throw new PRValidationError('ไม่พบใบขอซื้อ (PR not found)');
    }

    if (pr.status !== 'APPROVED') {
      throw new PRValidationError(
        `สถานะใบขอซื้อไม่ถูกต้อง ต้องเป็น APPROVED เท่านั้น (Invalid PR status, must be APPROVED)`
      );
    }

    if (pr.purchaseOrderId) {
      throw new PRValidationError('ใบขอซื้อนี้ถูกแปลงเป็น PO แล้ว (PR already converted to PO)');
    }

    // Verify vendor exists
    const vendor = await tx.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      throw new PRValidationError('ไม่พบผู้ขาย (Vendor not found)');
    }

    // Generate PO number
    const orderNo = await generatePONumber();

    // Create PO lines from PR lines
    const poLinesData = pr.lines.map((line, index) => ({
      lineNo: index + 1,
      productId: line.productId,
      description: line.description,
      quantity: line.quantity,
      unit: line.unit,
      unitPrice: line.unitPrice,
      discount: line.discount,
      vatRate: line.vatRate,
      vatAmount: line.vatAmount,
      amount: line.amount,
      specUrl: line.specUrl,
      notes: line.notes,
    }));

    // Calculate totals
    const subtotal = pr.lines.reduce((sum, line) => sum + line.amount, 0);
    const vatAmount = pr.lines.reduce((sum, line) => sum + line.vatAmount, 0);
    const totalAmount = subtotal + vatAmount;

    // Create PO
    const po = await tx.purchaseOrder.create({
      data: {
        orderNo,
        orderDate: new Date(),
        expectedDate: options.expectedDate,
        vendorId,
        vendorContact: options.vendorContact,
        vendorEmail: options.vendorEmail,
        vendorPhone: options.vendorPhone,
        vendorAddress: vendor.address,
        purchaseRequestId: prId,
        shippingTerms: options.shippingTerms,
        paymentTerms: options.paymentTerms,
        deliveryAddress: options.deliveryAddress,
        budgetId: pr.budgetId,
        budgetAmount: pr.budgetAmount,
        subtotal: Math.round(subtotal * 100),
        vatRate: 7,
        vatAmount: Math.round(vatAmount * 100),
        totalAmount: Math.round(totalAmount * 100),
        notes: options.notes,
        status: 'DRAFT',
        lines: {
          create: poLinesData,
        },
      },
      include: {
        vendor: true,
        purchaseRequest: true,
        budget: true,
        lines: {
          include: {
            product: true,
          },
        },
      },
    });

    // Update PR status
    await tx.purchaseRequest.update({
      where: { id: prId },
      data: {
        status: 'CONVERTED',
        purchaseOrderId: po.id,
        updatedById: userId,
      },
    });

    return po;
  });
}

// ============================================
// PO Workflow Functions
// ============================================

/**
 * Submit PO to Vendor
 * ส่งใบสั่งซื้อให้ผู้ขาย
 */
export async function submitPOToVendor(poId: string, userId?: string): Promise<any> {
  return await prisma.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.findUnique({
      where: { id: poId },
      include: {
        lines: true,
      },
    });

    if (!po) {
      throw new POWorkflowError('ไม่พบใบสั่งซื้อ (PO not found)');
    }

    if (po.status !== 'DRAFT' && po.status !== 'PENDING') {
      throw new POWorkflowError(
        `สถานะใบสั่งซื้อไม่ถูกต้อง ต้องเป็น DRAFT หรือ PENDING เท่านั้น (Invalid PO status, must be DRAFT or PENDING)`
      );
    }

    if (!po.lines || po.lines.length === 0) {
      throw new POWorkflowError(
        'ต้องมีรายการสินค้าอย่างน้อย 1 รายการ (Must have at least 1 line item)'
      );
    }

    const updatedPO = await tx.purchaseOrder.update({
      where: { id: poId },
      data: {
        status: 'SENT',
        submittedAt: new Date(),
      },
      include: {
        vendor: true,
        purchaseRequest: {
          include: {
            requestedByUser: true,
            departmentData: true,
          },
        },
        budget: true,
        lines: {
          include: {
            product: true,
          },
        },
      },
    });

    return updatedPO;
  });
}

/**
 * Confirm PO from Vendor
 * ยืนยันใบสั่งซื้อจากผู้ขาย
 */
export async function confirmPOFromVendor(poId: string): Promise<any> {
  return await prisma.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.findUnique({
      where: { id: poId },
    });

    if (!po) {
      throw new POWorkflowError('ไม่พบใบสั่งซื้อ (PO not found)');
    }

    if (po.status !== 'SENT') {
      throw new POWorkflowError(
        `สถานะใบสั่งซื้อไม่ถูกต้อง ต้องเป็น SENT เท่านั้น (Invalid PO status, must be SENT)`
      );
    }

    const updatedPO = await tx.purchaseOrder.update({
      where: { id: poId },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
      },
      include: {
        vendor: true,
        purchaseRequest: true,
        budget: true,
        lines: {
          include: {
            product: true,
          },
        },
      },
    });

    return updatedPO;
  });
}

/**
 * Mark PO as Shipped
 * ทำเครื่องหมายใบสั่งซื้อว่าจัดส่งแล้ว
 */
export async function markPOAsShipped(poId: string, trackingInfo?: any): Promise<any> {
  return await prisma.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.findUnique({
      where: { id: poId },
    });

    if (!po) {
      throw new POWorkflowError('ไม่พบใบสั่งซื้อ (PO not found)');
    }

    if (po.status !== 'CONFIRMED') {
      throw new POWorkflowError(
        `สถานะใบสั่งซื้อไม่ถูกต้อง ต้องเป็น CONFIRMED เท่านั้น (Invalid PO status, must be CONFIRMED)`
      );
    }

    const updatedPO = await tx.purchaseOrder.update({
      where: { id: poId },
      data: {
        status: 'SHIPPED',
        shippedAt: new Date(),
        notes: trackingInfo
          ? `${po.notes || ''}\nTracking: ${JSON.stringify(trackingInfo)}`
          : po.notes,
      },
      include: {
        vendor: true,
        purchaseRequest: true,
        budget: true,
        lines: {
          include: {
            product: true,
          },
        },
      },
    });

    return updatedPO;
  });
}

/**
 * Mark PO as Received
 * ทำเครื่องหมายใบสั่งซื้อว่ารับสินค้าแล้ว
 * สร้าง GoodsReceiptNote + รายการบันทึกข้อมูล GR/IR + อัปเดต PO line
 */
export async function markPOAsReceived(
  poId: string,
  receivedItems: ReceivedItem[],
  warehouseId: string,
  userId?: string
): Promise<any> {
  return await prisma.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.findUnique({
      where: { id: poId },
      include: {
        lines: { include: { product: true } },
        vendor: true,
        purchaseRequest: true,
      },
    });

    if (!po) {
      throw new POWorkflowError('ไม่พบใบสั่งซื้อ (PO not found)');
    }

    if (po.status !== 'SHIPPED' && po.status !== 'CONFIRMED') {
      throw new POWorkflowError(
        `สถานะใบสั่งซื้อไม่ถูกต้อง ต้องเป็น SHIPPED หรือ CONFIRMED เท่านั้น (Invalid PO status, must be SHIPPED or CONFIRMED)`
      );
    }

    // Build GRN lines from receivedItems
    const grnLines: Array<{
      poLineId: string;
      productId: string | null;
      description: string;
      unit: string | null;
      qtyOrdered: number;
      qtyReceived: number;
      qtyRejected: number;
      unitCost: number;
      amount: number;
      notes: string | null;
    }> = [];

    let totalReceivedAmount = 0;

    for (const receivedItem of receivedItems) {
      const line = po.lines.find((l) => l.id === receivedItem.lineId);
      if (!line) {
        throw new POWorkflowError(
          `ไม่พบรายการสินค้า (Line item not found): ${receivedItem.lineId}`
        );
      }

      if (receivedItem.receivedQty > line.quantity - line.receivedQty) {
        throw new POWorkflowError(
          `จำนวนรับเกินกว่าที่สั่งซื้อ (Received quantity exceeds ordered quantity): ${line.description}`
        );
      }

      // Calculate unit cost (after discount, in satang)
      const calculation = calculatePOLine({
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        discount: line.discount,
        vatRate: line.vatRate,
      });
      const unitCostSatang = Math.round(calculation.afterDiscount / line.quantity);
      const lineAmount = unitCostSatang * receivedItem.receivedQty;

      grnLines.push({
        poLineId: line.id,
        productId: line.productId ?? null,
        description: line.description,
        unit: line.unit ?? null,
        qtyOrdered: line.quantity,
        qtyReceived: receivedItem.receivedQty,
        qtyRejected: 0,
        unitCost: unitCostSatang / 100,
        amount: lineAmount / 100,
        notes: receivedItem.notes ?? null,
      });

      totalReceivedAmount += lineAmount;
    }

    // Create GoodsReceiptNote
    const grnNo = await generateDocNumber('GRN', 'GRN');
    const today = new Date();

    const grn = await tx.goodsReceiptNote.create({
      data: {
        grnNo,
        date: today,
        status: 'RECEIVED',
        poId: po.id,
        vendorId: po.vendorId,
        warehouseId,
        receivedById: userId ?? null,
      },
    });

    // Create GRN lines
    await tx.goodsReceiptNoteLine.createMany({
      data: grnLines.map((l) => ({
        grnId: grn.id,
        ...l,
      })),
    });

    // Create GR/IR journal entry: Dr Inventory (1140), Cr GR/IR Clearing (2160)
    if (totalReceivedAmount > 0) {
      const inventoryAccount = await tx.chartOfAccount.findUnique({ where: { code: '1140' } });
      const grirAccount = await tx.chartOfAccount.findUnique({ where: { code: '2160' } });

      if (!inventoryAccount || !grirAccount) {
        throw new POWorkflowError(
          'ไม่พบบัญชี Inventory (1140) หรือ GR/IR Clearing (2160) — กรุณาตรวจสอบ Chart of Accounts'
        );
      }

      const journalNo = await generateDocNumber('JOURNAL_ENTRY', 'JE');
      await tx.journalEntry.create({
        data: {
          entryNo: journalNo,
          date: today,
          description: `รับสินค้า GRN ${grnNo} จาก PO ${po.orderNo}`,
          reference: grnNo,
          documentType: 'GRN',
          documentId: grn.id,
          totalDebit: totalReceivedAmount,
          totalCredit: totalReceivedAmount,
          status: 'POSTED',
          lines: {
            create: [
              {
                lineNo: 1,
                accountId: inventoryAccount.id,
                description: `สินค้าคงคลัง — GRN ${grnNo}`,
                debit: totalReceivedAmount,
                credit: 0,
                reference: grnNo,
              },
              {
                lineNo: 2,
                accountId: grirAccount.id,
                description: `GR/IR Clearing — GRN ${grnNo}`,
                debit: 0,
                credit: totalReceivedAmount,
                reference: grnNo,
              },
            ],
          },
        },
      });
    }

    // Update received quantities on PO lines
    for (const receivedItem of receivedItems) {
      const line = po.lines.find((l) => l.id === receivedItem.lineId);
      await tx.purchaseOrderLine.update({
        where: { id: receivedItem.lineId },
        data: {
          receivedQty: { increment: receivedItem.receivedQty },
          notes: receivedItem.notes
            ? `${line?.notes || ''}\n${receivedItem.notes}`
            : (line?.notes ?? undefined),
        },
      });
    }

    // Check if all items received
    const updatedLines = await tx.purchaseOrderLine.findMany({ where: { orderId: poId } });
    const allReceived = updatedLines.every((line) => line.receivedQty >= line.quantity);

    const updatedPO = await tx.purchaseOrder.update({
      where: { id: poId },
      data: {
        status: allReceived ? 'RECEIVED' : 'SHIPPED',
        receivedAt: allReceived ? new Date() : null,
        grnId: grn.id,
      },
      include: {
        vendor: true,
        purchaseRequest: true,
        budget: true,
        lines: { include: { product: true } },
      },
    });

    // Create stock movements for inventory updates
    await createStockMovementFromPO(poId, warehouseId, receivedItems);

    return updatedPO;
  });
}

/**
 * Cancel PO
 * ยกเลิกใบสั่งซื้อ
 */
export async function cancelPO(poId: string, reason: string, userId?: string): Promise<any> {
  if (!reason || reason.trim().length === 0) {
    throw new POWorkflowError('ต้องระบุเหตุผลในการยกเลิก (Must specify cancellation reason)');
  }

  return await prisma.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.findUnique({
      where: { id: poId },
      include: {
        purchaseRequest: true,
      },
    });

    if (!po) {
      throw new POWorkflowError('ไม่พบใบสั่งซื้อ (PO not found)');
    }

    if (po.status === 'CANCELLED') {
      throw new POWorkflowError('ใบสั่งซื้อถูกยกเลิกไปแล้ว (PO already cancelled)');
    }

    if (po.status === 'RECEIVED' || po.status === 'CLOSED') {
      throw new POWorkflowError(
        'ไม่สามารถยกเลิกใบสั่งซื้อที่รับสินค้าแล้ว (Cannot cancel received PO)'
      );
    }

    // Update PO status
    const updatedPO = await tx.purchaseOrder.update({
      where: { id: poId },
      data: {
        status: 'CANCELLED',
        notes: `${po.notes || ''}\nยกเลิก: ${reason}`,
      },
      include: {
        vendor: true,
        purchaseRequest: true,
        budget: true,
        lines: {
          include: {
            product: true,
          },
        },
      },
    });

    // Release budget if reserved
    if (po.budgetId && po.purchaseRequest) {
      const pr = await tx.purchaseRequest.findUnique({
        where: { id: po.purchaseRequestId! },
        include: { budget: true },
      });

      if (pr && pr.budget) {
        const newUsedAmount = pr.budget.usedAmount - pr.estimatedAmount;
        const newRemainingAmount = pr.budget.remainingAmount + pr.estimatedAmount;

        await tx.departmentBudget.update({
          where: { id: po.budgetId },
          data: {
            usedAmount: newUsedAmount,
            remainingAmount: newRemainingAmount,
          },
        });
      }
    }

    return updatedPO;
  });
}

// ============================================
// Budget Validation Functions
// ============================================

/**
 * Validate Budget Availability
 * ตรวจสอบวงเงินงบประมาณ
 */
export async function validateBudgetAvailability(
  budgetId: string,
  amount: number
): Promise<BudgetValidationResult> {
  const budget = await prisma.departmentBudget.findUnique({
    where: { id: budgetId },
  });

  if (!budget) {
    return {
      valid: false,
      error: 'ไม่พบงบประมาณ (Budget not found)',
    };
  }

  if (budget.status !== 'ACTIVE') {
    return {
      valid: false,
      budget,
      error: `งบประมาณไม่อยู่ในสถานะใช้งาน (Budget status is ${budget.status})`,
    };
  }

  const now = new Date();
  if (now < budget.startDate || now > budget.endDate) {
    return {
      valid: false,
      budget,
      error: 'งบประมาณไม่อยู่ในช่วงเวลาที่กำหนด (Budget not in valid date range)',
    };
  }

  const remainingAmount = budget.remainingAmount - amount;
  const valid = remainingAmount >= 0;

  return {
    valid,
    budget,
    error: valid
      ? undefined
      : `งบประมาณคงเหลือไม่เพียงพอ: คงเหลือ ${budget.remainingAmount / 100} บาท ต้องการ ${amount / 100} บาท`,
  };
}

// ============================================
// Calculation Functions
// ============================================

/**
 * Calculate PO Line Amounts
 * คำนวณยอดรายการใบสั่งซื้อ
 *
 * CRITICAL: All inputs are in Satang, all outputs are in Satang
 */
export function calculatePOLine(line: {
  quantity: number;
  unitPrice: number;
  discount: number;
  vatRate: number;
}): POLineCalculation {
  // All inputs should be in Satang
  const subtotal = line.quantity * line.unitPrice;
  const discountAmount = calculatePercent(subtotal, line.discount);
  const afterDiscount = subtotal - discountAmount;
  const vatAmount = calculatePercent(afterDiscount, line.vatRate);
  const amount = afterDiscount + vatAmount;

  return {
    subtotal: Math.round(subtotal),
    discountAmount: Math.round(discountAmount),
    afterDiscount: Math.round(afterDiscount),
    vatAmount: Math.round(vatAmount),
    amount: Math.round(amount),
  };
}

/**
 * Calculate PO Total Amounts
 * คำนวณยอดรวมใบสั่งซื้อ
 *
 * CRITICAL: All inputs and outputs are in Satang
 */
export function calculatePOTotal(
  lines: Array<{ amount: number }>,
  discountAmount: number
): POTotalCalculation {
  const subtotal = lines.reduce((sum, line) => sum + line.amount, 0);
  const vatAmount = calculatePercent(subtotal, 7); // 7% VAT
  const totalAmount = subtotal + vatAmount - discountAmount;

  return {
    subtotal: Math.round(subtotal),
    vatAmount: Math.round(vatAmount),
    totalAmount: Math.round(totalAmount),
  };
}

// ============================================
// Stock Integration Functions
// ============================================

/**
 * Create Stock Movement from PO
 * สร้างการเคลื่อนไหวสต็อกจากใบสั่งซื้อ
 */
export async function createStockMovementFromPO(
  poId: string,
  warehouseId: string,
  receivedItems: ReceivedItem[]
): Promise<void> {
  const { recordStockMovement } = await import('./inventory-service');

  const po = await prisma.purchaseOrder.findUnique({
    where: { id: poId },
    include: {
      lines: {
        include: {
          product: true,
        },
      },
      vendor: true,
    },
  });

  if (!po) {
    throw new POWorkflowError('ไม่พบใบสั่งซื้อ (PO not found)');
  }

  for (const receivedItem of receivedItems) {
    const line = po.lines.find((l) => l.id === receivedItem.lineId);
    if (!line || !line.productId) continue;

    // Calculate weighted average cost
    const calculation = calculatePOLine({
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      discount: line.discount,
      vatRate: line.vatRate,
    });

    const unitCost = calculation.afterDiscount / line.quantity;

    // Create stock movement
    await recordStockMovement({
      productId: line.productId,
      warehouseId,
      type: 'RECEIVE',
      quantity: receivedItem.receivedQty,
      unitCost,
      referenceId: poId,
      referenceNo: po.orderNo,
      notes: `รับสินค้าจากใบสั่งซื้อ ${po.orderNo} ผู้ขาย: ${po.vendor.name}${receivedItem.notes ? '\n' + receivedItem.notes : ''}`,
      sourceChannel: 'PO',
      metadata: {
        purchaseOrderId: poId,
        orderNo: po.orderNo,
        vendorId: po.vendorId,
        vendorName: po.vendor.name,
        lineId: line.id,
        description: line.description,
      },
    });
  }
}

// ============================================
// PO Status Functions
// ============================================

/**
 * Get PO Status Info
 * ดูข้อมูลสถานะใบสั่งซื้อ
 */
export function getPOStatusInfo(status: string): POStatusInfo {
  const transitions: Record<string, string[]> = {
    DRAFT: ['PENDING', 'SENT', 'CANCELLED'],
    PENDING: ['APPROVED', 'CANCELLED'],
    APPROVED: ['SENT', 'CANCELLED'],
    SENT: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['SHIPPED', 'CANCELLED'],
    SHIPPED: ['RECEIVED', 'CANCELLED'],
    RECEIVED: ['CLOSED'],
    CLOSED: [],
    CANCELLED: [],
  };

  const allowedTransitions = transitions[status] || [];

  return {
    canSubmit: ['DRAFT', 'PENDING', 'APPROVED'].includes(status),
    canConfirm: status === 'SENT',
    canShip: status === 'CONFIRMED',
    canReceive: ['SHIPPED', 'CONFIRMED'].includes(status),
    canCancel: !['CLOSED', 'CANCELLED', 'RECEIVED'].includes(status),
    allowedTransitions,
  };
}

// ============================================
// Reporting Functions
// ============================================

/**
 * Get PR Report
 * รายงานใบขอซื้อ
 */
export async function getPRReport(filters: {
  startDate?: Date;
  endDate?: Date;
  departmentId?: string;
  status?: string;
  userId?: string;
}) {
  const where: any = {
    deletedAt: null,
  };

  if (filters.startDate || filters.endDate) {
    where.requestDate = {};
    if (filters.startDate) where.requestDate.gte = filters.startDate;
    if (filters.endDate) where.requestDate.lte = filters.endDate;
  }

  if (filters.departmentId) {
    where.departmentId = filters.departmentId;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.userId) {
    where.requestedBy = filters.userId;
  }

  const prs = await prisma.purchaseRequest.findMany({
    where,
    include: {
      requestedByUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      approvedByUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      departmentData: true,
      budget: true,
      purchaseOrder: {
        select: {
          id: true,
          orderNo: true,
          status: true,
        },
      },
      lines: {
        include: {
          product: true,
        },
      },
    },
    orderBy: {
      requestDate: 'desc',
    },
  });

  const totalEstimatedAmount = prs.reduce((sum, pr) => sum + pr.estimatedAmount, 0);

  return {
    prs,
    summary: {
      totalCount: prs.length,
      totalEstimatedAmount,
      statusBreakdown: prs.reduce(
        (acc, pr) => {
          acc[pr.status] = (acc[pr.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
    },
  };
}

/**
 * Get PO Report
 * รายงานใบสั่งซื้อ
 */
export async function getPOReport(filters: {
  startDate?: Date;
  endDate?: Date;
  vendorId?: string;
  status?: string;
}) {
  const where: any = {};

  if (filters.startDate || filters.endDate) {
    where.orderDate = {};
    if (filters.startDate) where.orderDate.gte = filters.startDate;
    if (filters.endDate) where.orderDate.lte = filters.endDate;
  }

  if (filters.vendorId) {
    where.vendorId = filters.vendorId;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  const pos = await prisma.purchaseOrder.findMany({
    where,
    include: {
      vendor: true,
      purchaseRequest: {
        include: {
          requestedByUser: true,
          departmentData: true,
        },
      },
      budget: true,
      lines: {
        include: {
          product: true,
        },
      },
    },
    orderBy: {
      orderDate: 'desc',
    },
  });

  const totalAmount = pos.reduce((sum, po) => sum + po.totalAmount, 0);
  const totalVATAmount = pos.reduce((sum, po) => sum + po.vatAmount, 0);

  return {
    pos,
    summary: {
      totalCount: pos.length,
      totalAmount,
      totalVATAmount,
      statusBreakdown: pos.reduce(
        (acc, po) => {
          acc[po.status] = (acc[po.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
    },
  };
}

/**
 * Get Pending Approvals
 * ดูรายการที่รออนุมัติ
 */
export async function getPendingApprovals(departmentId?: string) {
  const where: any = {
    status: 'PENDING',
    deletedAt: null,
  };

  if (departmentId) {
    where.departmentId = departmentId;
  }

  const pendingPRs = await prisma.purchaseRequest.findMany({
    where,
    include: {
      requestedByUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      departmentData: true,
      budget: true,
      lines: {
        include: {
          product: true,
        },
      },
    },
    orderBy: {
      requestDate: 'asc',
    },
  });

  return pendingPRs;
}

/**
 * Get Overdue PRs
 * ดูใบขอซื้อที่เกินกำหนด
 */
export async function getOverduePRs() {
  const now = new Date();

  const overduePRs = await prisma.purchaseRequest.findMany({
    where: {
      status: {
        in: ['PENDING', 'APPROVED'],
      },
      requiredDate: {
        lt: now,
      },
      deletedAt: null,
    },
    include: {
      requestedByUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      departmentData: true,
      budget: true,
      lines: {
        include: {
          product: true,
        },
      },
    },
    orderBy: {
      requiredDate: 'asc',
    },
  });

  return overduePRs;
}
