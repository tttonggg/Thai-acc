import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';
import { requireAuth, generateDocNumber } from '@/lib/api-utils';
import { logCreate, logCreateTx } from '@/lib/activity-logger';
import { getClientIp } from '@/lib/api-utils';
import { bahtToSatang, satangToBaht } from '@/lib/currency';
import { validateCsrfToken, getCsrfTokenFromHeaders } from '@/lib/csrf-service-server';
import { checkPeriodStatus } from '@/lib/period-service';
import { handleApiError } from '@/lib/api-error-handler';

// Validation schema
const invoiceLineSchema = z.object({
  productId: z.string().optional().nullable(),
  description: z.string().min(1, 'ต้องระบุรายการ'),
  quantity: z.number().positive('จำนวนต้องมากกว่า 0'),
  unit: z.string().default('ชิ้น'),
  unitPrice: z.number().min(0, 'ราคาต้องไม่ติดลบ'),
  discount: z.number().min(0).default(0),
  amount: z.number().min(0),
  vatRate: z.number().min(0).max(100).default(7),
  vatAmount: z.number().min(0).default(0),
});

const invoiceSchema = z.object({
  invoiceDate: z.string().transform((val) => new Date(val)),
  dueDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  customerId: z.string().min(1, 'ต้องเลือกลูกค้า'),
  type: z.enum(['TAX_INVOICE', 'RECEIPT', 'DELIVERY_NOTE', 'CREDIT_NOTE', 'DEBIT_NOTE']),
  reference: z.string().optional(),
  poNumber: z.string().optional(),
  discountAmount: z.number().min(0).default(0),
  discountPercent: z.number().min(0).max(100).default(0),
  withholdingRate: z.number().min(0).max(100).default(0),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  terms: z.string().optional(),
  lines: z.array(invoiceLineSchema).min(1, 'ต้องมีอย่างน้อย 1 รายการ'),
});

// C-03: Invoice number generation uses generateDocNumber for transaction safety
// Map document types to prefixes - must be unique per type

// GET - List invoices (requires authentication)
export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    // ✅ FIXED: Add max limit of 100 items per page to prevent performance issues
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '50'));
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const customerId = searchParams.get('customerId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (status) where.status = status;
    if (type) where.type = type;
    if (customerId) where.customerId = customerId;

    if (startDate || endDate) {
      where.invoiceDate = {};
      if (startDate) where.invoiceDate.gte = new Date(startDate);
      if (endDate) where.invoiceDate.lte = new Date(endDate);
    }

    if (search) {
      where.OR = [
        { invoiceNo: { contains: search } },
        { customer: { name: { contains: search } } },
        { reference: { contains: search } },
      ];
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          lines: {
            select: {
              id: true,
              productId: true,
              quantity: true,
              amount: true,
              unitPrice: true,
              discount: true,
              vatAmount: true,
            },
          },
          _count: {
            select: {
              comments: true,
            },
          },
        },
        orderBy: { invoiceDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ]);

    // CRITICAL: Convert Satang to Baht for all monetary fields
    // Database stores Satang (integers), API returns Baht (decimals)
    const invoicesInBaht = invoices.map((invoice) => ({
      ...invoice,
      customerName: invoice.customer?.name || '', // Extract customer name for list view
      subtotal: satangToBaht(invoice.subtotal),
      vatAmount: satangToBaht(invoice.vatAmount),
      totalAmount: satangToBaht(invoice.totalAmount),
      discountAmount: satangToBaht(invoice.discountAmount),
      withholdingAmount: satangToBaht(invoice.withholdingAmount),
      netAmount: satangToBaht(invoice.netAmount),
      paidAmount: satangToBaht(invoice.paidAmount),
      lines: invoice.lines.map((line) => ({
        ...line,
        unitPrice: satangToBaht(line.unitPrice),
        discount: satangToBaht(line.discount),
        amount: satangToBaht(line.amount),
        vatAmount: satangToBaht(line.vatAmount),
      })),
    }));

    return NextResponse.json({
      success: true,
      data: invoicesInBaht,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    // Handle auth errors
    if (error?.statusCode === 401 || error?.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้รับอนุญาต - กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }
    console.error('Invoices API error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}

// POST - Create invoice (requires authentication)
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Skip CSRF validation if BYPASS_CSRF=true or in development
    const bypassCsrf = process.env.BYPASS_CSRF === 'true' || process.env.NODE_ENV === 'development';

    if (!bypassCsrf) {
      // Validate CSRF token in production only
      const csrfToken = getCsrfTokenFromHeaders(request.headers);
      const sessionId =
        request.cookies.get('next-auth.session-token')?.value ||
        request.cookies.get('__Secure-next-auth.session-token')?.value ||
        request.headers.get('x-session-id') ||
        user.id;

      if (!csrfToken || !(await validateCsrfToken(csrfToken, sessionId))) {
        return NextResponse.json(
          { success: false, error: 'CSRF token ไม่ถูกต้องหรือหมดอายุ' },
          { status: 403 }
        );
      }
    }

    const ipAddress = getClientIp(request.headers);

    const body = await request.json();
    const validatedData = invoiceSchema.parse(body);

    // B1. Period Locking - Check if period is open for invoice date
    const periodCheck = await checkPeriodStatus(validatedData.invoiceDate);
    if (!periodCheck.isValid) {
      return NextResponse.json(
        { success: false, error: periodCheck.error || 'ไม่สามารถสร้างใบกำกับภาษีในงวดที่ปิดแล้ว' },
        { status: 400 }
      );
    }

    // Calculate totals
    const subtotal = validatedData.lines.reduce((sum, line) => sum + line.amount, 0);
    const vatAmount = validatedData.lines.reduce((sum, line) => sum + line.vatAmount, 0);

    // Auto WHT detection if rate is 0
    let finalWhtRate = validatedData.withholdingRate;
    if (finalWhtRate === 0) {
      const productIds = validatedData.lines.map((l) => l.productId).filter(Boolean) as string[];
      if (productIds.length > 0) {
        // Find if any product is a service with an incomeType that specifies WHT percentage
        const products = await prisma.product.findMany({
          where: { id: { in: productIds }, type: 'SERVICE', incomeType: { not: null } },
        });
        if (products.length > 0 && products[0].incomeType) {
          // Extract percentage from string like "ค่าบริการ 3%" => 3
          const match = products[0].incomeType.match(/(\d+)%/);
          if (match && match[1]) {
            finalWhtRate = parseInt(match[1]);
          }
        }
      }
    }

    // WHT is calculated on (Subtotal - Discount)
    const whtBaseAmount = Math.max(0, subtotal - validatedData.discountAmount);
    const withholdingAmount = whtBaseAmount * (finalWhtRate / 100);

    const totalAmount = subtotal + vatAmount - validatedData.discountAmount;
    const netAmount = totalAmount - withholdingAmount;

    // Generate invoice number (C-03: use transaction-safe generateDocNumber)
    // Map document types to prefixes - must be unique per type
    const typeToPrefix: Record<string, string> = {
      TAX_INVOICE: 'INV',
      RECEIPT: 'RC',
      DELIVERY_NOTE: 'DN',
      CREDIT_NOTE: 'CN',
      DEBIT_NOTE: 'DN2', // C-03: DN2 to avoid collision with DELIVERY_NOTE
    };
    const prefix = typeToPrefix[validatedData.type] || 'INV';
    const invoiceNo = await generateDocNumber(validatedData.type, prefix);

    const invoice = await prisma.$transaction(async (tx) => {
      const newInvoice = await tx.invoice.create({
        data: {
          invoiceNo,
          invoiceDate: validatedData.invoiceDate,
          dueDate: validatedData.dueDate,
          customerId: validatedData.customerId,
          type: validatedData.type,
          reference: validatedData.reference,
          poNumber: validatedData.poNumber,
          subtotal: bahtToSatang(subtotal),
          vatRate: 7,
          vatAmount: bahtToSatang(vatAmount),
          totalAmount: bahtToSatang(totalAmount),
          discountAmount: bahtToSatang(validatedData.discountAmount),
          discountPercent: validatedData.discountPercent,
          withholdingRate: finalWhtRate,
          withholdingAmount: bahtToSatang(withholdingAmount),
          netAmount: bahtToSatang(netAmount),
          paidAmount: 0,
          status: 'DRAFT',
          createdById: user.id,
          notes: validatedData.notes,
          internalNotes: validatedData.internalNotes,
          terms: validatedData.terms,
          lines: {
            create: validatedData.lines.map((line, index) => ({
              lineNo: index + 1,
              productId: line.productId,
              description: line.description,
              quantity: line.quantity,
              unit: line.unit,
              unitPrice: bahtToSatang(line.unitPrice),
              discount: bahtToSatang(line.discount),
              amount: bahtToSatang(line.amount),
              vatRate: line.vatRate,
              vatAmount: bahtToSatang(line.vatAmount),
            })),
          },
        },
        include: {
          customer: true,
          lines: true,
        },
      });

      // Log invoice creation within transaction
      await logCreateTx(
        tx,
        user.id,
        'invoices',
        newInvoice.id,
        {
          invoiceNo: newInvoice.invoiceNo,
          customerId: newInvoice.customerId,
          totalAmount: newInvoice.totalAmount,
          type: newInvoice.type,
        },
        ipAddress
      );

      return newInvoice;
    });

    // Convert Satang to Baht for response
    const invoiceInBaht = {
      ...invoice,
      subtotal: satangToBaht(invoice.subtotal),
      vatAmount: satangToBaht(invoice.vatAmount),
      totalAmount: satangToBaht(invoice.totalAmount),
      discountAmount: satangToBaht(invoice.discountAmount),
      withholdingAmount: satangToBaht(invoice.withholdingAmount),
      netAmount: satangToBaht(invoice.netAmount),
      paidAmount: satangToBaht(invoice.paidAmount),
      lines: invoice.lines.map((line) => ({
        ...line,
        unitPrice: satangToBaht(line.unitPrice),
        discount: satangToBaht(line.discount),
        amount: satangToBaht(line.amount),
        vatAmount: satangToBaht(line.vatAmount),
      })),
    };

    return NextResponse.json({ success: true, data: invoiceInBaht });
  } catch (error: unknown) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'ข้อมูลไม่ถูกต้อง', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || 'เกิดข้อผิดพลาดในการสร้างใบกำกับภาษี' },
      { status: 500 }
    );
  }
}
