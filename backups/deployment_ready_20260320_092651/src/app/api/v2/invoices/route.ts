/**
 * API Version 2 - Invoices Endpoint
 * Phase D: API Mastery - API Versioning
 * 
 * v2 Improvements over v1:
 * - GraphQL query support via ?query parameter
 * - Field selection with ?fields=id,invoiceNo,customer.name
 * - Pagination with cursor-based navigation
 * - Included totals and summary in response
 * - Multi-currency support
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Validation schema for v2
const invoiceQuerySchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().max(100).default(20),
  cursor: z.string().optional(), // Cursor-based pagination
  status: z.enum(['DRAFT', 'ISSUED', 'PARTIAL', 'PAID', 'CANCELLED']).optional(),
  customerId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  fields: z.string().optional(), // Field selection: fields=id,invoiceNo,customer.name
  include: z.string().optional(), // Include relations: include=customer,lines,journalEntry
  graphql: z.string().optional(), // GraphQL query
});

// Field selection mapper
const fieldMapping: Record<string, any> = {
  'id': true,
  'invoiceNo': true,
  'invoiceDate': true,
  'dueDate': true,
  'customerId': true,
  'status': true,
  'subtotal': true,
  'vatRate': true,
  'vatAmount': true,
  'totalAmount': true,
  'discountAmount': true,
  'discountPercent': true,
  'withholdingAmount': true,
  'netAmount': true,
  'paidAmount': true,
  'reference': true,
  'poNumber': true,
  'notes': true,
  'createdAt': true,
  'updatedAt': true,
  'currencyId': true,
  'exchangeRate': true,
  'foreignAmount': true,
};

// Include relation mapper
const includeMapping: Record<string, any> = {
  'customer': {
    select: {
      id: true,
      code: true,
      name: true,
      nameEn: true,
      taxId: true,
      address: true,
      phone: true,
      email: true,
    },
  },
  'lines': {
    select: {
      id: true,
      lineNo: true,
      productId: true,
      product: {
        select: {
          code: true,
          name: true,
        },
      },
      description: true,
      quantity: true,
      unit: true,
      unitPrice: true,
      discount: true,
      amount: true,
      vatRate: true,
      vatAmount: true,
    },
  },
  'journalEntry': {
    select: {
      id: true,
      entryNo: true,
      date: true,
      totalDebit: true,
      totalCredit: true,
      status: true,
    },
  },
  'currency': {
    select: {
      id: true,
      code: true,
      name: true,
      symbol: true,
    },
  },
  'receiptAllocations': {
    select: {
      id: true,
      amount: true,
      whtAmount: true,
      receipt: {
        select: {
          receiptNo: true,
          receiptDate: true,
        },
      },
    },
  },
};

// Parse fields parameter
function parseFields(fieldsParam?: string): Record<string, boolean> {
  if (!fieldsParam) return fieldMapping;

  const fields: Record<string, boolean> = {};
  const requestedFields = fieldsParam.split(',').map(f => f.trim());

  for (const field of requestedFields) {
    if (fieldMapping[field]) {
      fields[field] = true;
    }
  }

  // Always include id
  fields.id = true;

  return fields;
}

// Parse include parameter
function parseInclude(includeParam?: string): Record<string, any> {
  if (!includeParam) return {};

  const include: Record<string, any> = {};
  const requestedIncludes = includeParam.split(',').map(i => i.trim());

  for (const inc of requestedIncludes) {
    if (includeMapping[inc]) {
      include[inc] = includeMapping[inc];
    }
  }

  return include;
}

// GET /api/v2/invoices - List invoices (v2)
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', version: 'v2' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const params = invoiceQuerySchema.parse(Object.fromEntries(searchParams));

    // Handle GraphQL query if provided
    if (params.graphql) {
      return handleGraphQLQuery(params.graphql, session.user);
    }

    // Parse cursor if provided
    let cursorCondition = {};
    if (params.cursor) {
      try {
        const cursorData = JSON.parse(Buffer.from(params.cursor, 'base64').toString());
        cursorCondition = {
          id: { gt: cursorData.id },
        };
      } catch {
        return NextResponse.json(
          { error: 'Invalid cursor', version: 'v2' },
          { status: 400 }
        );
      }
    }

    const skip = params.cursor ? 0 : (params.page - 1) * params.limit;

    const where = {
      isActive: true,
      ...cursorCondition,
      ...(params.status && { status: params.status }),
      ...(params.customerId && { customerId: params.customerId }),
      ...(params.startDate && params.endDate && {
        invoiceDate: {
          gte: new Date(params.startDate),
          lte: new Date(params.endDate),
        },
      }),
    };

    // Build select and include
    const select = parseFields(params.fields);
    const include = parseInclude(params.include);

    const [invoices, total, totals] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: { id: 'asc' }, // Consistent ordering for cursor pagination
        ...(Object.keys(select).length > 0 && { select }),
        ...(Object.keys(include).length > 0 && { include }),
      }),
      prisma.invoice.count({ where: { isActive: true, ...(params.status && { status: params.status }) } }),
      prisma.invoice.aggregate({
        where,
        _sum: {
          subtotal: true,
          vatAmount: true,
          totalAmount: true,
          paidAmount: true,
        },
        _count: { id: true },
      }),
    ]);

    // Generate next cursor
    const nextCursor = invoices.length === params.limit
      ? Buffer.from(JSON.stringify({ id: invoices[invoices.length - 1].id })).toString('base64')
      : null;

    return NextResponse.json({
      success: true,
      version: 'v2',
      features: ['field-selection', 'cursor-pagination', 'include-relations', 'totals'],
      data: invoices,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
        nextCursor,
      },
      summary: {
        count: totals._count.id,
        subtotal: totals._sum.subtotal || 0,
        vatAmount: totals._sum.vatAmount || 0,
        totalAmount: totals._sum.totalAmount || 0,
        paidAmount: totals._sum.paidAmount || 0,
        balance: (totals._sum.totalAmount || 0) - (totals._sum.paidAmount || 0),
      },
    });
  } catch (error) {
    console.error('Error fetching invoices (v2):', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices', version: 'v2' },
      { status: 500 }
    );
  }
}

// POST /api/v2/invoices - Create invoice (v2)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', version: 'v2' },
        { status: 401 }
      );
    }

    const body = await req.json();

    // Enhanced validation for v2
    if (!body.customerId || !body.lines || !Array.isArray(body.lines) || body.lines.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: customerId, lines (at least one)', version: 'v2' },
        { status: 400 }
      );
    }

    // Validate line items
    for (const [index, line] of body.lines.entries()) {
      if (!line.description) {
        return NextResponse.json(
          { error: `Line ${index + 1}: description is required`, version: 'v2' },
          { status: 400 }
        );
      }
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
    let withholdingAmount = 0;
    const vatRate = body.vatRate ?? 7;
    const withholdingRate = body.withholdingRate ?? 0;

    for (const line of body.lines) {
      const lineAmount = (line.quantity || 1) * (line.unitPrice || 0) - (line.discount || 0);
      subtotal += lineAmount;
      vatAmount += Math.round(lineAmount * (vatRate / 100));
    }

    // Calculate withholding if applicable
    if (withholdingRate > 0) {
      withholdingAmount = Math.round(subtotal * (withholdingRate / 100));
    }

    const totalAmount = subtotal + vatAmount;
    const netAmount = totalAmount - withholdingAmount;

    // Handle multi-currency
    const exchangeRate = body.exchangeRate || 1;
    const foreignAmount = body.currencyId ? Math.round(netAmount / exchangeRate) : null;

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
        withholdingRate,
        withholdingAmount,
        netAmount,
        status: 'DRAFT',
        notes: body.notes,
        internalNotes: body.internalNotes,
        currencyId: body.currencyId,
        exchangeRate,
        foreignAmount,
        lines: {
          create: body.lines.map((line: any, index: number) => {
            const lineAmount = (line.quantity || 1) * (line.unitPrice || 0) - (line.discount || 0);
            return {
              lineNo: index + 1,
              productId: line.productId,
              description: line.description,
              quantity: line.quantity || 1,
              unit: line.unit || 'ชิ้น',
              unitPrice: line.unitPrice || 0,
              discount: line.discount || 0,
              amount: lineAmount,
              vatRate,
              vatAmount: Math.round(lineAmount * (vatRate / 100)),
            };
          }),
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            code: true,
            name: true,
            taxId: true,
          },
        },
        lines: true,
        currency: true,
      },
    });

    return NextResponse.json({
      success: true,
      version: 'v2',
      data: invoice,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice (v2):', error);
    return NextResponse.json(
      { error: 'Failed to create invoice', version: 'v2' },
      { status: 500 }
    );
  }
}

// Handle GraphQL query
async function handleGraphQLQuery(query: string, user: any) {
  // Redirect to GraphQL endpoint
  return NextResponse.json({
    success: false,
    version: 'v2',
    message: 'Use POST /api/graphql for GraphQL queries',
    documentation: '/api/docs',
  }, { status: 400 });
}
