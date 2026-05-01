import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { checkPeriodStatus } from '@/lib/period-service';
import {
  requireAuth,
  apiResponse,
  apiError,
  unauthorizedError,
  forbiddenError,
} from '@/lib/api-utils';
import { AuthError } from '@/lib/api-auth';
import { generateWhtFromPayment } from '@/lib/wht-service';
import { z } from 'zod';

// Validation schema
const paymentAllocationSchema = z.object({
  invoiceId: z.string().min(1, 'กรุณาเลือกใบซื้อ'),
  amount: z.number().min(0, 'จำนวนเงินต้องไม่น้อยกว่า 0'),
  whtRate: z.number().min(0).max(100).default(0),
  whtAmount: z.number().min(0).default(0),
  notes: z.string().optional(),
});

const paymentUpdateSchema = z.object({
  vendorId: z.string().min(1, 'กรุณาเลือกผู้ขาย').optional(),
  paymentDate: z.string().or(z.date()).optional(),
  paymentMethod: z.enum(['CASH', 'TRANSFER', 'CHEQUE', 'CREDIT', 'OTHER']).optional(),
  bankAccountId: z.string().optional(),
  chequeNo: z.string().optional(),
  chequeDate: z.string().or(z.date()).optional(),
  amount: z.number().min(0, 'จำนวนเงินต้องไม่น้อยกว่า 0').optional(),
  unallocated: z.number().min(0).default(0).optional(),
  notes: z.string().optional(),
  allocations: z.array(paymentAllocationSchema).optional(),
  status: z.enum(['DRAFT', 'POSTED', 'CANCELLED']).optional(),
});

// GET /api/payments/[id] - Get single payment
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const payment = await db.payment.findUnique({
      where: { id },
      include: {
        vendor: true,
        bankAccount: true,
        allocations: {
          include: {
            invoice: {
              include: {
                vendor: true,
              },
            },
          },
        },
        journalEntry: {
          include: {
            lines: {
              include: {
                account: true,
              },
            },
          },
        },
        cheques: true,
      },
    });

    if (!payment) {
      return apiError('ไม่พบใบจ่ายเงิน', 404);
    }

    // IDOR Protection: Check ownership - only ADMIN can access any payment
    if (user.role !== 'ADMIN' && payment.createdById && payment.createdById !== user.id) {
      return forbiddenError();
    }

    return apiResponse(payment);
  } catch (error) {
    if (error instanceof AuthError) {
      return unauthorizedError();
    }
    return apiError('เกิดข้อผิดพลาดในการดึงข้อมูลใบจ่ายเงิน');
  }
}

// PUT /api/payments/[id] - Update payment (draft only)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    if (user.role === 'VIEWER') {
      return apiError('ไม่มีสิทธิ์แก้ไขใบจ่ายเงิน', 403);
    }

    // Get existing payment
    const existingPayment = await db.payment.findUnique({
      where: { id },
      include: {
        allocations: true,
      },
    });

    if (!existingPayment) {
      return apiError('ไม่พบใบจ่ายเงิน', 404);
    }

    // IDOR Protection: Check ownership - only ADMIN can modify any payment
    if (
      user.role !== 'ADMIN' &&
      existingPayment.createdById &&
      existingPayment.createdById !== user.id
    ) {
      return forbiddenError();
    }

    // Only draft payments can be edited
    if (existingPayment.status !== 'DRAFT') {
      return apiError('สามารถแก้ไขเฉพาะสถานะร่างเท่านั้น', 403);
    }

    const body = await request.json();
    const validatedData = paymentUpdateSchema.parse(body);

    // Verify vendor if changed
    if (validatedData.vendorId && validatedData.vendorId !== existingPayment.vendorId) {
      const vendor = await db.vendor.findUnique({
        where: { id: validatedData.vendorId },
      });
      if (!vendor) {
        return apiError('ไม่พบผู้ขาย');
      }
    }

    // If allocations are provided, replace them
    if (validatedData.allocations) {
      // Verify all invoices exist and belong to vendor
      const invoiceIds = validatedData.allocations.map((a) => a.invoiceId);
      const invoices = await db.purchaseInvoice.findMany({
        where: {
          id: { in: invoiceIds },
          vendorId: validatedData.vendorId || existingPayment.vendorId,
        },
      });

      if (invoices.length !== invoiceIds.length) {
        return apiError('ไม่พบใบซื้อบางรายการ หรือใบซื้อไม่ใช่ของผู้ขายรายนี้');
      }

      // Calculate totals
      const totalAllocated = validatedData.allocations.reduce((sum, a) => sum + a.amount, 0);
      const totalWHT = validatedData.allocations.reduce((sum, a) => sum + a.whtAmount, 0);
      const amount = validatedData.amount ?? existingPayment.amount;

      if (amount < totalAllocated) {
        return apiError('ยอดจ่ายรวมต้องไม่น้อยกว่ายอดจัดจ่าย');
      }

      // Delete old allocations, create new allocations, and update payment in a transaction
      await db.$transaction([
        db.paymentAllocation.deleteMany({
          where: { paymentId: id },
        }),
        db.paymentAllocation.createMany({
          data: validatedData.allocations.map((allocation) => ({
            paymentId: id,
            invoiceId: allocation.invoiceId,
            amount: bahtToSatang(allocation.amount),
            whtRate: allocation.whtRate,
            whtAmount: bahtToSatang(allocation.whtAmount),
            notes: allocation.notes,
          })),
        }),
        db.payment.update({
          where: { id: id },
          data: {
            whtAmount: totalWHT,
            unallocated: amount - totalAllocated,
          },
        }),
      ]);
    }

    // Update payment fields
    const updateData: any = {};
    if (validatedData.vendorId) updateData.vendorId = validatedData.vendorId;
    if (validatedData.paymentDate) updateData.paymentDate = new Date(validatedData.paymentDate);
    if (validatedData.paymentMethod) updateData.paymentMethod = validatedData.paymentMethod;
    if (validatedData.bankAccountId !== undefined)
      updateData.bankAccountId = validatedData.bankAccountId;
    if (validatedData.chequeNo !== undefined) updateData.chequeNo = validatedData.chequeNo;
    if (validatedData.chequeDate) updateData.chequeDate = new Date(validatedData.chequeDate);
    if (validatedData.amount !== undefined) updateData.amount = validatedData.amount;
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;

    const payment = await db.payment.update({
      where: { id: id },
      data: updateData,
      include: {
        vendor: true,
        allocations: {
          include: {
            invoice: true,
          },
        },
      },
    });

    return apiResponse(payment);
  } catch (error) {
    if (error instanceof AuthError) {
      return unauthorizedError();
    }
    if (error instanceof Error && error.name === 'ZodError') {
      return apiError('ข้อมูลไม่ถูกต้อง');
    }
    return apiError('เกิดข้อผิดพลาดในการแก้ไขใบจ่ายเงิน');
  }
}

// DELETE /api/payments/[id] - Delete payment (admin only, draft only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    if (user.role !== 'ADMIN' && user.role !== 'ACCOUNTANT') {
      return forbiddenError();
    }

    const payment = await db.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      return apiError('ไม่พบใบจ่ายเงิน', 404);
    }

    // IDOR Protection: Check ownership - only ADMIN can delete any payment
    if (user.role !== 'ADMIN' && payment.createdById && payment.createdById !== user.id) {
      return forbiddenError();
    }

    // Only draft payments can be deleted
    if (payment.status !== 'DRAFT') {
      return apiError('สามารถลบเฉพาะสถานะร่างเท่านั้น', 403);
    }

    // Delete payment (allocations will be cascade deleted)
    await db.payment.delete({
      where: { id: id },
    });

    return apiResponse({ success: true, message: 'ลบใบจ่ายเงินเรียบร้อยแล้ว' });
  } catch (error) {
    if (error instanceof AuthError) {
      return unauthorizedError();
    }
    return apiError('เกิดข้อผิดพลาดในการลบใบจ่ายเงิน');
  }
}

// POST /api/payments/[id]/post - Post payment to GL
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    if (user.role === 'VIEWER') {
      return apiError('ไม่มีสิทธิ์ลงบัญชี', 403);
    }

    const payment = await db.payment.findUnique({
      where: { id },
      include: {
        vendor: true,
        allocations: {
          include: {
            invoice: true,
          },
        },
      },
    });

    if (!payment) {
      return apiError('ไม่พบใบจ่ายเงิน', 404);
    }

    // IDOR Protection: Check ownership - only ADMIN can post any payment
    if (user.role !== 'ADMIN' && payment.createdById && payment.createdById !== user.id) {
      return forbiddenError();
    }

    if (payment.status !== 'DRAFT') {
      return apiError('สามารถลงบัญชีเฉพาะสถานะร่างเท่านั้น', 403);
    }

    // B1. Period Locking - Check if period is open
    const periodCheck = await checkPeriodStatus(payment.paymentDate);
    if (!periodCheck.isValid) {
      return apiError(periodCheck.error || 'ไม่สามารถลงบัญชีในงวดที่ปิดแล้ว', 400);
    }

    // Import the posting function
    const { postPaymentToGL } = await import('../route');

    // Post to GL in a transaction
    await db.$transaction(async (tx) => {
      await postPaymentToGL(payment, tx);

      // Update payment status
      await tx.payment.update({
        where: { id: id },
        data: { status: 'POSTED' },
      });
    });

    // Auto-generate WHT records after successful GL posting (PND3/PND53)
    // Mirrors the pattern used in receipts/[id]/post/route.ts lines 266-311
    if (payment.whtAmount > 0) {
      await generateWhtFromPayment(id);
    }

    // Fetch updated payment to return
    const updatedPayment = await db.payment.findUnique({
      where: { id: id },
      include: {
        vendor: true,
        allocations: {
          include: {
            invoice: true,
          },
        },
        journalEntry: true,
      },
    });

    return apiResponse(updatedPayment);
  } catch (error) {
    if (error instanceof AuthError) {
      return unauthorizedError();
    }
    console.error('Payment posting error:', error);
    return apiError('เกิดข้อผิดพลาดในการลงบัญชี');
  }
}
