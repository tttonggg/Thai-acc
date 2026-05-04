/**
 * API Version 1 - Single Invoice Endpoint
 * Phase D: API Mastery - API Versioning
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/v1/invoices/:id - Get single invoice
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized', version: 'v1' }, { status: 401 });
    }

    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({
      where: { id, isActive: true },
      include: {
        customer: {
          select: {
            id: true,
            code: true,
            name: true,
            taxId: true,
            address: true,
            phone: true,
          },
        },
        lines: {
          include: {
            product: {
              select: {
                code: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found', version: 'v1' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      version: 'v1',
      data: invoice,
    });
  } catch (error: unknown) {
    console.error('Error fetching invoice (v1):', error);
    return NextResponse.json({ error: 'Failed to fetch invoice', version: 'v1' }, { status: 500 });
  }
}

// PUT /api/v1/invoices/:id - Update invoice
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized', version: 'v1' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    // Check if invoice exists and is in DRAFT status
    const existing = await prisma.invoice.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found', version: 'v1' }, { status: 404 });
    }

    if (existing.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Cannot update non-draft invoice', version: 'v1' },
        { status: 400 }
      );
    }

    // Update invoice
    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        ...(body.invoiceDate && { invoiceDate: new Date(body.invoiceDate) }),
        ...(body.dueDate && { dueDate: new Date(body.dueDate) }),
        ...(body.reference && { reference: body.reference }),
        ...(body.poNumber && { poNumber: body.poNumber }),
        ...(body.notes && { notes: body.notes }),
        updatedAt: new Date(),
      },
      include: {
        customer: {
          select: { id: true, code: true, name: true },
        },
        lines: true,
      },
    });

    return NextResponse.json({
      success: true,
      version: 'v1',
      data: invoice,
    });
  } catch (error: unknown) {
    console.error('Error updating invoice (v1):', error);
    return NextResponse.json({ error: 'Failed to update invoice', version: 'v1' }, { status: 500 });
  }
}

// DELETE /api/v1/invoices/:id - Delete (soft) invoice
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized', version: 'v1' }, { status: 401 });
    }

    const { id } = await params;

    // Check if invoice exists
    const existing = await prisma.invoice.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found', version: 'v1' }, { status: 404 });
    }

    // Soft delete
    await prisma.invoice.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
        deletedBy: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      version: 'v1',
      message: 'Invoice deleted successfully',
    });
  } catch (error: unknown) {
    console.error('Error deleting invoice (v1):', error);
    return NextResponse.json({ error: 'Failed to delete invoice', version: 'v1' }, { status: 500 });
  }
}
