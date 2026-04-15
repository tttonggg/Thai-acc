/**
 * API Version 1 - Invoices Endpoint
 * Phase D: API Mastery - API Versioning
 * 
 * This is the stable v1 API for invoices.
 * Changes to this endpoint will be backward compatible.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Validation schema for v1
const invoiceQuerySchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().max(100).default(20),
  status: z.enum(['DRAFT', 'ISSUED', 'PARTIAL', 'PAID', 'CANCELLED']).optional(),
  customerId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// GET /api/v1/invoices - List invoices (v1)
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', version: 'v1' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const params = invoiceQuerySchema.parse(Object.fromEntries(searchParams));

    const skip = (params.page - 1) * params.limit;

    const where = {
      isActive: true,
      ...(params.status && { status: params.status }),
      ...(params.customerId && { customerId: params.customerId }),
      ...(params.startDate && params.endDate && {
        invoiceDate: {
          gte: new Date(params.startDate),
          lte: new Date(params.endDate),
        },
      }),
    };

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: { invoiceDate: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              code: true,
              name: true,
              taxId: true,
            },
          },
          lines: {
            select: {
              id: true,
              description: true,
              quantity: true,
              unitPrice: true,
              amount: true,
            },
          },
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      version: 'v1',
      deprecationWarning: null,
      data: invoices,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    });
  } catch (error) {
    console.error('Error fetching invoices (v1):', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices', version: 'v1' },
      { status: 500 }
    );
  }
}

// POST /api/v1/invoices - Create invoice (v1)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', version: 'v1' },
        { status: 401 }
      );
    }

    const body = await req.json();

    // Basic validation
    if (!body.customerId || !body.lines || !Array.isArray(body.lines)) {
      return NextResponse.json(
        { error: 'Missing required fields: customerId, lines', version: 'v1' },
        { status: 400 }
      );
    }

    // Create invoice with auto-generated number
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const count = await prisma.invoice.count({
      where: {
        createdAt: {
          gte: new Date(year, date.getMonth(), 1),
        },
      },
    });
    const invoiceNo = `INV-${year}${month}-${String(count + 1).padStart(4, '0')}`;

    // Calculate totals
    let subtotal = 0;
    let vatAmount = 0;
    const vatRate = body.vatRate || 7;

    for (const line of body.lines) {
      const lineAmount = (line.quantity || 1) * (line.unitPrice || 0);
      subtotal += lineAmount;
      vatAmount += Math.round(lineAmount * (vatRate / 100));
    }

    const totalAmount = subtotal + vatAmount;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo,
        invoiceDate: new Date(body.invoiceDate || date),
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        customerId: body.customerId,
        reference: body.reference,
        poNumber: body.poNumber,
        subtotal,
        vatRate,
        vatAmount,
        totalAmount,
        discountAmount: body.discountAmount || 0,
        discountPercent: body.discountPercent || 0,
        netAmount: totalAmount,
        status: 'DRAFT',
        notes: body.notes,
        lines: {
          create: body.lines.map((line: any, index: number) => ({
            lineNo: index + 1,
            productId: line.productId,
            description: line.description,
            quantity: line.quantity || 1,
            unit: line.unit || 'ชิ้น',
            unitPrice: line.unitPrice || 0,
            discount: line.discount || 0,
            amount: (line.quantity || 1) * (line.unitPrice || 0),
            vatRate,
            vatAmount: Math.round((line.quantity || 1) * (line.unitPrice || 0) * (vatRate / 100)),
          })),
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        lines: true,
      },
    });

    return NextResponse.json({
      success: true,
      version: 'v1',
      data: invoice,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice (v1):', error);
    return NextResponse.json(
      { error: 'Failed to create invoice', version: 'v1' },
      { status: 500 }
    );
  }
}
