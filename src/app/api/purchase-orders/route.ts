import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateDocNumber } from '@/lib/api-utils';
import { z } from 'zod';
import { bahtToSatang, satangToBaht } from '@/lib/currency';

// Validation schema for PO line item
const poLineSchema = z.object({
  lineNo: z.number().int().positive(),
  productId: z.string().optional(),
  description: z.string().min(1, 'รายการสินค้าต้องไม่ว่างเปล่า'),
  quantity: z.number().positive('จำนวนต้องมากกว่า 0'),
  unit: z.string().default('ชิ้น'),
  unitPrice: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  vatRate: z.number().min(0).default(7),
  vatAmount: z.number().min(0).default(0),
  amount: z.number().min(0).default(0),
  specUrl: z.string().optional(),
  notes: z.string().optional(),
});

// Validation schema for PO
const purchaseOrderSchema = z.object({
  orderNo: z.string().optional(),
  orderDate: z.string().optional(),
  vendorId: z.string().min(1, 'ต้องระบุผู้ขาย'),
  vendorContact: z.string().optional(),
  vendorEmail: z.string().email().optional().or(z.literal('')),
  vendorPhone: z.string().optional(),
  vendorAddress: z.string().optional(),
  purchaseRequestId: z.string().optional(),
  shippingTerms: z.string().optional(),
  paymentTerms: z.string().optional(),
  deliveryAddress: z.string().optional(),
  budgetId: z.string().optional(),
  expectedDate: z.string().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  vendorNotes: z.string().optional(),
  attachments: z.any().optional(),
  lines: z.array(poLineSchema).min(1, 'ต้องมีอย่างน้อย 1 รายการ'),
});

// GET /api/purchase-orders - List all POs
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'ไม่ได้รับอนุญาต' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const vendorId = searchParams.get('vendorId');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (vendorId) {
      where.vendorId = vendorId;
    }

    if (search) {
      where.OR = [
        { orderNo: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Non-admin users can only see their own POs
    if (!['ADMIN', 'ACCOUNTANT'].includes(session.user.role as string)) {
      where.createdById = session.user.id;
    }

    const [pos, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        include: {
          vendor: {
            select: {
              id: true,
              name: true,
              code: true,
              taxId: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          updatedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          purchaseRequest: {
            select: {
              id: true,
              requestNo: true,
              status: true,
            },
          },
          budget: {
            select: {
              id: true,
              name: true,
              fiscalYear: true,
              remainingAmount: true,
            },
          },
          lines: {
            include: {
              product: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
              },
            },
            orderBy: {
              lineNo: 'asc',
            },
          },
          purchaseInvoice: {
            select: {
              id: true,
              invoiceNo: true,
              status: true,
            },
          },
          _count: {
            select: {
              lines: true,
            },
          },
        },
        orderBy: {
          orderDate: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    // Convert Satang to Baht for response
    const posWithBaht = pos.map((po: any) => ({
      ...po,
      subtotal: satangToBaht(po.subtotal),
      vatAmount: satangToBaht(po.vatAmount),
      totalAmount: satangToBaht(po.totalAmount),
      budget: po.budget
        ? {
            ...po.budget,
            remainingAmount: satangToBaht(po.budget.remainingAmount),
          }
        : null,
      lines: po.lines.map((line: any) => ({
        ...line,
        unitPrice: satangToBaht(line.unitPrice),
        discount: satangToBaht(line.discount),
        vatAmount: satangToBaht(line.vatAmount),
        amount: satangToBaht(line.amount),
      })),
    }));

    return NextResponse.json({
      success: true,
      data: posWithBaht,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    console.error('Purchase Orders Fetch Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'ข้อผิดพลาดในการโหลดข้อมูล',
      },
      { status: 500 }
    );
  }
}

// POST /api/purchase-orders - Create new PO
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'ไม่ได้รับอนุญาต' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = purchaseOrderSchema.parse(body);

    // Convert Baht to Satang for all monetary fields
    const dataInSatang = {
      ...validatedData,
      lines: validatedData.lines.map((line) => ({
        ...line,
        unitPrice: bahtToSatang(line.unitPrice),
        discount: bahtToSatang(line.discount),
        vatAmount: bahtToSatang(line.vatAmount),
        amount: bahtToSatang(line.amount),
      })),
    };

    // Generate PO number if not provided
    const orderNo = dataInSatang.orderNo || (await generateDocNumber('PO', 'PO'));

    // Check if vendor exists
    const vendor = await prisma.vendor.findUnique({
      where: { id: dataInSatang.vendorId },
    });

    if (!vendor) {
      return NextResponse.json({ success: false, error: 'ไม่พบผู้ขาย' }, { status: 400 });
    }

    // Check if PR exists (if specified)
    if (dataInSatang.purchaseRequestId) {
      const pr = await prisma.purchaseRequest.findUnique({
        where: { id: dataInSatang.purchaseRequestId },
      });

      if (!pr) {
        return NextResponse.json({ success: false, error: 'ไม่พบใบขอซื้อ' }, { status: 400 });
      }
    }

    // Check if budget exists and has sufficient funds (if specified)
    if (dataInSatang.budgetId) {
      const budget = await prisma.departmentBudget.findUnique({
        where: { id: dataInSatang.budgetId },
      });

      if (!budget) {
        return NextResponse.json({ success: false, error: 'ไม่พบงบประมาณ' }, { status: 400 });
      }

      // Calculate total amount (already in Satang)
      const totalAmount = dataInSatang.lines.reduce((sum, line) => sum + line.amount, 0);

      if (budget.remainingAmount < totalAmount) {
        return NextResponse.json({ success: false, error: 'งบประมาณไม่เพียงพอ' }, { status: 400 });
      }
    }

    // Calculate amounts for each line (already in Satang)
    const lines = dataInSatang.lines.map((line) => {
      const subtotal = line.quantity * line.unitPrice;
      const discountAmount = Math.round(subtotal * (line.discount / 100));
      const afterDiscount = subtotal - discountAmount;
      const vatAmount = Math.round(afterDiscount * (line.vatRate / 100));
      const amount = afterDiscount + vatAmount;

      return {
        ...line,
        vatAmount,
        amount,
      };
    });

    // Calculate totals (already in Satang)
    const subtotal = lines.reduce((sum, line) => {
      const lineSubtotal = line.quantity * line.unitPrice;
      const discountAmount = Math.round(lineSubtotal * (line.discount / 100));
      return sum + (lineSubtotal - discountAmount);
    }, 0);

    const totalVatAmount = lines.reduce((sum, line) => sum + line.vatAmount, 0);
    const totalAmount = lines.reduce((sum, line) => sum + line.amount, 0);

    // Create PO with transaction
    const po = await prisma.$transaction(async (tx) => {
      // Create PO
      const purchaseOrder = await tx.purchaseOrder.create({
        data: {
          orderNo,
          orderDate: dataInSatang.orderDate ? new Date(dataInSatang.orderDate) : new Date(),
          vendorId: dataInSatang.vendorId,
          vendorContact: dataInSatang.vendorContact,
          vendorEmail: dataInSatang.vendorEmail || null,
          vendorPhone: dataInSatang.vendorPhone,
          vendorAddress: dataInSatang.vendorAddress,
          purchaseRequestId: dataInSatang.purchaseRequestId,
          shippingTerms: dataInSatang.shippingTerms,
          paymentTerms: dataInSatang.paymentTerms,
          deliveryAddress: dataInSatang.deliveryAddress,
          budgetId: dataInSatang.budgetId,
          expectedDate: dataInSatang.expectedDate ? new Date(dataInSatang.expectedDate) : null,
          notes: dataInSatang.notes,
          internalNotes: dataInSatang.internalNotes,
          vendorNotes: dataInSatang.vendorNotes,
          attachments: dataInSatang.attachments,
          subtotal: Math.round(subtotal),
          vatRate: 7,
          vatAmount: Math.round(totalVatAmount),
          totalAmount: Math.round(totalAmount),
          status: 'DRAFT',
          createdById: session.user.id,
          lines: {
            create: lines,
          },
        },
        include: {
          vendor: {
            select: {
              id: true,
              name: true,
              code: true,
              taxId: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          purchaseRequest: {
            select: {
              id: true,
              requestNo: true,
              status: true,
            },
          },
          budget: {
            select: {
              id: true,
              name: true,
              fiscalYear: true,
              remainingAmount: true,
            },
          },
          lines: {
            include: {
              product: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
              },
            },
            orderBy: {
              lineNo: 'asc',
            },
          },
        },
      });

      return purchaseOrder;
    });

    // Convert response to Baht
    const poInBaht = {
      ...po,
      subtotal: satangToBaht(po.subtotal),
      vatAmount: satangToBaht(po.vatAmount),
      totalAmount: satangToBaht(po.totalAmount),
      budget: po.budget
        ? {
            ...po.budget,
            remainingAmount: satangToBaht(po.budget.remainingAmount),
          }
        : null,
      lines: po.lines.map((line: any) => ({
        ...line,
        unitPrice: satangToBaht(line.unitPrice),
        discount: satangToBaht(line.discount),
        vatAmount: satangToBaht(line.vatAmount),
        amount: satangToBaht(line.amount),
      })),
    };

    return NextResponse.json(
      {
        success: true,
        data: poInBaht,
        message: 'สร้างใบสั่งซื้อสำเร็จ',
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Purchase Order Creation Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'ข้อมูลไม่ถูกต้อง',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'ข้อผิดพลาดในการสร้างใบสั่งซื้อ',
      },
      { status: 500 }
    );
  }
}
