import { db } from '@/lib/db';
import {
  requireAuth,
  apiResponse,
  apiError,
  unauthorizedError,
  generateDocNumber,
} from '@/lib/api-utils';
import { z } from 'zod';
import { bahtToSatang, satangToBaht } from '@/lib/currency';
import { generateWhtFromPayment } from '@/lib/wht-service';
import { postPaymentToGL } from '@/lib/payment-gl-service';

// Validation schema
const paymentAllocationSchema = z.object({
  invoiceId: z.string().min(1, 'กรุณาเลือกใบซื้อ'),
  amount: z.number().min(0, 'จำนวนเงินต้องไม่น้อยกว่า 0'),
  whtRate: z.number().min(0).max(100).default(0),
  whtAmount: z.number().min(0).default(0),
  notes: z.string().optional(),
});

const paymentSchema = z.object({
  vendorId: z.string().min(1, 'กรุณาเลือกผู้ขาย'),
  paymentDate: z.string().or(z.date()),
  paymentMethod: z.enum(['CASH', 'TRANSFER', 'CHEQUE', 'CREDIT', 'OTHER']),
  bankAccountId: z.string().optional(),
  chequeNo: z.string().optional(),
  chequeDate: z.string().or(z.date()).optional(),
  amount: z.number().min(0, 'จำนวนเงินต้องไม่น้อยกว่า 0'),
  whtAmount: z.number().min(0).default(0),
  unallocated: z.number().min(0).default(0),
  notes: z.string().optional(),
  allocations: z.array(paymentAllocationSchema).min(1, 'ต้องมีการจัดจ่ายอย่างน้อย 1 รายการ'),
  status: z.enum(['DRAFT', 'POSTED', 'CANCELLED']).default('DRAFT'),
});

// GET /api/payments - List payments
export async function GET(request: Request) {
  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '20'));
    const status = searchParams.get('status');
    const vendorId = searchParams.get('vendorId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (vendorId) {
      where.vendorId = vendorId;
    }

    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate.gte = new Date(startDate);
      if (endDate) where.paymentDate.lte = new Date(endDate);
    }

    if (search) {
      where.OR = [{ paymentNo: { contains: search } }, { vendor: { name: { contains: search } } }];
    }

    const [payments, total] = await Promise.all([
      db.payment.findMany({
        where,
        orderBy: { paymentDate: 'desc' },
        skip,
        take: limit,
        include: {
          vendor: {
            select: { id: true, code: true, name: true, taxId: true },
          },
          bankAccount: {
            select: { id: true, code: true, bankName: true, accountNumber: true },
          },
          allocations: {
            include: {
              invoice: {
                select: { id: true, invoiceNo: true, invoiceDate: true, totalAmount: true },
              },
            },
          },
        },
      }),
      db.payment.count({ where }),
    ]);

    // Convert Satang to Baht for all monetary fields
    const paymentsInBaht = payments.map((payment) => ({
      ...payment,
      amount: satangToBaht(payment.amount),
      whtAmount: satangToBaht(payment.whtAmount),
      unallocated: satangToBaht(payment.unallocated),
      allocations: payment.allocations.map((alloc) => ({
        ...alloc,
        amount: satangToBaht(alloc.amount),
        whtAmount: satangToBaht(alloc.whtAmount),
        invoice: alloc.invoice
          ? {
              ...alloc.invoice,
              totalAmount: satangToBaht(alloc.invoice.totalAmount),
            }
          : alloc.invoice,
      })),
    }));

    return Response.json({
      success: true,
      data: paymentsInBaht,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('ไม่ได้รับอนุญาต')) {
      return unauthorizedError();
    }
    return apiError('เกิดข้อผิดพลาดในการดึงข้อมูลใบจ่ายเงิน');
  }
}

// POST /api/payments - Create payment
export async function POST(request: Request) {
  try {
    const user = await requireAuth();

    if (user.role === 'VIEWER') {
      return apiError('ไม่มีสิทธิ์สร้างใบจ่ายเงิน', 403);
    }

    const body = await request.json();
    const validatedData = paymentSchema.parse(body);

    // Verify vendor exists
    const vendor = await db.vendor.findUnique({
      where: { id: validatedData.vendorId },
    });

    if (!vendor) {
      return apiError('ไม่พบผู้ขาย');
    }

    // B-03: Require bank account for transfer/cheque payments
    if (
      (validatedData.paymentMethod === 'TRANSFER' || validatedData.paymentMethod === 'CHEQUE') &&
      !validatedData.bankAccountId
    ) {
      return apiError('กรุณาระบุบัญชีธนาคาร', 400);
    }
    if (validatedData.bankAccountId) {
      const bankAccount = await db.bankAccount.findUnique({
        where: { id: validatedData.bankAccountId },
      });
      if (!bankAccount) {
        return apiError('ไม่พบบัญชีธนาคาร');
      }
    }

    // Verify all invoices exist and belong to vendor
    const invoiceIds = validatedData.allocations.map((a) => a.invoiceId);
    const invoices = await db.purchaseInvoice.findMany({
      where: {
        id: { in: invoiceIds },
        vendorId: validatedData.vendorId,
      },
    });

    if (invoices.length !== invoiceIds.length) {
      return apiError('ไม่พบใบซื้อบางรายการ หรือใบซื้อไม่ใช่ของผู้ขายรายนี้');
    }

    // Calculate totals
    const totalAllocated = validatedData.allocations.reduce((sum, a) => sum + a.amount, 0);
    const totalWHT = validatedData.allocations.reduce((sum, a) => sum + a.whtAmount, 0);

    // Validate total amount
    if (validatedData.amount < totalAllocated) {
      return apiError('ยอดจ่ายรวมต้องไม่น้อยกว่ายอดจัดจ่าย');
    }

    // Generate payment number
    const paymentNo = await generateDocNumber('PAYMENT', 'PAY');

    // Atomic transaction: payment.create + cheque.create + GL posting + WHT generation
    const payment = await db.$transaction(async (tx) => {
      // Create payment with allocations
      const payment = await tx.payment.create({
        data: {
          paymentNo,
          paymentDate: new Date(validatedData.paymentDate),
          vendorId: validatedData.vendorId,
          paymentMethod: validatedData.paymentMethod,
          bankAccountId: validatedData.bankAccountId,
          chequeNo: validatedData.chequeNo,
          chequeDate: validatedData.chequeDate ? new Date(validatedData.chequeDate) : null,
          amount: bahtToSatang(validatedData.amount),
          whtAmount: bahtToSatang(totalWHT),
          unallocated: bahtToSatang(validatedData.amount - totalAllocated),
          notes: validatedData.notes,
          status: validatedData.status,
          createdById: user.id,
          allocations: {
            create: validatedData.allocations.map((allocation) => ({
              invoiceId: allocation.invoiceId,
              amount: bahtToSatang(allocation.amount),
              whtRate: allocation.whtRate,
              whtAmount: bahtToSatang(allocation.whtAmount),
              notes: allocation.notes,
            })),
          },
        },
        include: {
          vendor: true,
          allocations: {
            include: {
              invoice: true,
            },
          },
        },
      });

      // Create cheque record if payment by cheque
      if (validatedData.paymentMethod === 'CHEQUE' && validatedData.chequeNo) {
        await tx.cheque.create({
          data: {
            chequeNo: validatedData.chequeNo,
            type: 'PAY',
            bankAccountId: validatedData.bankAccountId || '',
            dueDate: validatedData.chequeDate
              ? new Date(validatedData.chequeDate)
              : new Date(validatedData.paymentDate),
            amount: bahtToSatang(validatedData.amount),
            payeeName: vendor.name,
            status: 'ON_HAND',
            documentRef: paymentNo,
            paymentId: payment.id,
          },
        });
      }

      // If POSTED, create journal entry
      if (validatedData.status === 'POSTED') {
        await postPaymentToGL(payment, tx);

        // Auto-generate WHT records for vendor-withheld amounts (PND3/PND53)
        // Mirrors the pattern used in receipts/[id]/post/route.ts lines 266-311
        if (payment.whtAmount > 0) {
          await generateWhtFromPayment(payment.id, tx);
        }
      }

      return payment;
    });

    // Convert Satang to Baht for response
    const paymentInBaht = {
      ...payment,
      amount: satangToBaht(payment.amount),
      whtAmount: satangToBaht(payment.whtAmount),
      unallocated: satangToBaht(payment.unallocated),
      allocations: payment.allocations.map((alloc) => ({
        ...alloc,
        amount: satangToBaht(alloc.amount),
        whtAmount: satangToBaht(alloc.whtAmount),
      })),
    };

    return apiResponse(paymentInBaht, 201);
  } catch (error) {
    if (error instanceof Error && error.message.includes('ไม่ได้รับอนุญาต')) {
      return unauthorizedError();
    }
    if (error instanceof z.ZodError) {
      const issues = error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
      return apiError(`ข้อมูลไม่ถูกต้อง: ${issues}`, 400);
    }
    console.error('Payment creation error:', error);
    return apiError('เกิดข้อผิดพลาดในการสร้างใบจ่ายเงิน');
  }
}

// Account codes for payment GL posting
