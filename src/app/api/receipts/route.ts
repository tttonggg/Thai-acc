import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';
import { requireAuth, generateDocNumber } from '@/lib/api-utils';
import { bahtToSatang, satangToBaht } from '@/lib/currency';
import { handleApiError } from '@/lib/api-error-handler';

// Validation schema for receipt allocation
const receiptAllocationSchema = z.object({
  invoiceId: z.string().min(1, 'กรุณาระบุใบกำกับภาษี'),
  amount: z.number().min(0, 'จำนวนเงินต้องไม่ติดลบ'),
  whtRate: z.number().min(0).max(100).default(0),
  whtAmount: z.number().min(0).default(0),
});

// Validation schema for receipt
const receiptSchema = z.object({
  receiptDate: z.string().transform((val) => new Date(val)),
  customerId: z.string().min(1, 'กรุณาเลือกลูกค้า'),
  paymentMethod: z.enum(['CASH', 'CHEQUE', 'TRANSFER', 'CREDIT', 'OTHER']).default('CASH'),
  bankAccountId: z.string().optional().nullable(),
  chequeNo: z.string().optional(),
  chequeDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  amount: z.number().min(0, 'จำนวนเงินต้องไม่ติดลบ'),
  notes: z.string().optional(),
  allocations: z.array(receiptAllocationSchema).optional().default([]),
});

// GET - List receipts
export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '20'));
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) where.status = status;
    if (customerId) where.customerId = customerId;

    if (startDate || endDate) {
      where.receiptDate = {};
      if (startDate) where.receiptDate.gte = new Date(startDate);
      if (endDate) where.receiptDate.lte = new Date(endDate);
    }

    if (search) {
      where.OR = [
        { receiptNo: { contains: search } },
        { customer: { name: { contains: search } } },
        { notes: { contains: search } },
      ];
    }

    const [receipts, total] = await Promise.all([
      prisma.receipt.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          bankAccount: {
            select: {
              id: true,
              code: true,
              bankName: true,
              accountNumber: true,
            },
          },
          allocations: {
            include: {
              invoice: {
                select: {
                  id: true,
                  invoiceNo: true,
                  invoiceDate: true,
                  totalAmount: true,
                },
              },
            },
          },
          journalEntry: {
            select: {
              id: true,
              entryNo: true,
            },
          },
        },
        orderBy: { receiptDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.receipt.count({ where }),
    ]);

    // Calculate allocated and unallocated amounts and convert to Baht
    const receiptsWithCalculations = receipts.map((receipt) => {
      const totalAllocated = receipt.allocations.reduce((sum, alloc) => sum + alloc.amount, 0);
      const totalWht = receipt.allocations.reduce((sum, alloc) => sum + alloc.whtAmount, 0);

      return {
        ...receipt,
        amount: satangToBaht(receipt.amount),
        whtAmount: satangToBaht(receipt.whtAmount),
        unallocated: satangToBaht(receipt.unallocated),
        totalAllocated: satangToBaht(totalAllocated),
        totalWht: satangToBaht(totalWht),
        remaining: satangToBaht(receipt.amount - totalAllocated),
        allocations: receipt.allocations.map((alloc) => ({
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
      };
    });

    return NextResponse.json({
      success: true,
      data: receiptsWithCalculations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching receipts:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}

// POST - Create receipt
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const validatedData = receiptSchema.parse(body);

    // Normalize empty string bankAccountId to null
    if (validatedData.bankAccountId === '') {
      validatedData.bankAccountId = null;
    }

    // Validate that total allocations don't exceed amount
    const totalAllocation = validatedData.allocations.reduce((sum, alloc) => sum + alloc.amount, 0);
    const totalWht = validatedData.allocations.reduce((sum, alloc) => sum + alloc.whtAmount, 0);

    if (totalAllocation > validatedData.amount) {
      return NextResponse.json(
        { success: false, error: 'ยอดจัดจ่ายเกินกว่ายอดรับเงิน' },
        { status: 400 }
      );
    }

    // Validate bank account for non-cash payments
    if (
      (validatedData.paymentMethod === 'TRANSFER' || validatedData.paymentMethod === 'CHEQUE') &&
      !validatedData.bankAccountId
    ) {
      return NextResponse.json({ success: false, error: 'กรุณาระบุบัญชีธนาคาร' }, { status: 400 });
    }

    // Validate cheque number for cheque payments
    if (validatedData.paymentMethod === 'CHEQUE' && !validatedData.chequeNo) {
      return NextResponse.json({ success: false, error: 'กรุณาระบุเลขที่เช็ค' }, { status: 400 });
    }

    // Validate customer exists and get organization for IDOR check
    const customer = await prisma.customer.findUnique({
      where: { id: validatedData.customerId },
      select: { id: true, organizationId: true } as any,
    });
    if (!customer) {
      return NextResponse.json({ success: false, error: 'ไม่พบข้อมูลลูกค้า' }, { status: 400 });
    }

    // Validate all invoiceIds exist and belong to this customer
    if (validatedData.allocations.length > 0) {
      const invoiceIds = validatedData.allocations.map((a) => a.invoiceId);
      const invoices = await prisma.invoice.findMany({
        where: { id: { in: invoiceIds }, customerId: validatedData.customerId },
        select: { id: true, customerId: true, status: true },
      });

      if (invoices.length !== invoiceIds.length) {
        return NextResponse.json(
          { success: false, error: 'ใบกำกับภาษีที่เลือกไม่ถูกต้อง' },
          { status: 400 }
        );
      }

      // Check all invoices belong to the same customer
      const mismatchedCustomer = invoices.find(
        (inv) => inv.customerId !== validatedData.customerId
      );
      if (mismatchedCustomer) {
        return NextResponse.json(
          { success: false, error: 'ใบกำกับภาษีไม่ได้เป็นของลูกค้าที่เลือก' },
          { status: 400 }
        );
      }

      // Check invoices are still open (ISSUED or PARTIAL)
      const closedInvoice = invoices.find(
        (inv) => inv.status === 'PAID' || inv.status === 'CANCELLED'
      );
      if (closedInvoice) {
        return NextResponse.json(
          {
            success: false,
            error: `ใบกำกับภาษี ${closedInvoice.id} ถูกปิดไปแล้ว ไม่สามารถจัดจ่ายได้`,
          },
          { status: 400 }
        );
      }
    }

    // Validate bank account exists if provided
    if (validatedData.bankAccountId) {
      const bankAccount = await prisma.bankAccount.findUnique({
        where: { id: validatedData.bankAccountId },
        select: { id: true },
      });
      if (!bankAccount) {
        return NextResponse.json(
          { success: false, error: 'ไม่พบข้อมูลบัญชีธนาคาร' },
          { status: 400 }
        );
      }
    }

    // Generate receipt number (transaction-safe via DocumentNumber table)
    const receiptNo = await generateDocNumber('RECEIPT', 'RCP') as string;

    // Calculate unallocated amount (credit to customer) — convert to Satang
    const unallocated = bahtToSatang(validatedData.amount - totalAllocation);

    // Create receipt with allocations
    const receipt = await prisma.receipt.create({
      data: {
        receiptNo,
        receiptDate: validatedData.receiptDate,
        customerId: validatedData.customerId,
        paymentMethod: validatedData.paymentMethod,
        bankAccountId: validatedData.bankAccountId,
        chequeNo: validatedData.chequeNo,
        chequeDate: validatedData.chequeDate,
        amount: bahtToSatang(validatedData.amount),
        whtAmount: bahtToSatang(totalWht),
        unallocated,
        notes: validatedData.notes,
        status: 'DRAFT',
        createdById: user.id,
        allocations: {
          create: validatedData.allocations.map((alloc) => ({
            invoiceId: alloc.invoiceId,
            amount: bahtToSatang(alloc.amount),
            whtRate: alloc.whtRate,
            whtAmount: bahtToSatang(alloc.whtAmount),
          })),
        },
      },
      include: {
        customer: true,
        bankAccount: true,
        allocations: {
          include: {
            invoice: true,
          },
        },
      },
    });

    // Convert Satang to Baht for response
    const receiptInBaht = {
      ...receipt,
      amount: satangToBaht(receipt.amount),
      whtAmount: satangToBaht(receipt.whtAmount),
      unallocated: satangToBaht(receipt.unallocated),
      allocations: receipt.allocations.map((alloc) => ({
        ...alloc,
        amount: satangToBaht(alloc.amount),
        whtAmount: satangToBaht(alloc.whtAmount),
      })),
    };

    return NextResponse.json({ success: true, data: receiptInBaht });
  } catch (error) {
    console.error('Error creating receipt:', error.message);
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'ข้อมูลไม่ถูกต้อง', details: error.errors },
        { status: 400 }
      );
    }
    // Prisma P2003: Foreign key constraint violation
    if (error.code === 'P2003') {
      return NextResponse.json(
        { success: false, error: 'ข้อมูลใบกำกับภาษีหรือลูกค้าไม่ถูกต้อง' },
        { status: 400 }
      );
    }
    console.error('Error creating receipt:', error.message);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' },
      { status: 500 }
    );
  }
}
