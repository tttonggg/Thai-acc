/**
 * API Version 2 - Single Invoice Endpoint
 * Phase D: API Mastery - API Versioning
 *
 * v2 Improvements:
 * - Field selection
 * - Include relations
 * - Issue/void actions
 * - Activity history
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/v2/invoices/:id - Get single invoice with enhanced features
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized', version: 'v2' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);

    // Parse field selection
    const fieldsParam = searchParams.get('fields');
    const includeParam = searchParams.get('include');

    // Build select
    const select: Record<string, boolean> = {};
    if (fieldsParam) {
      const fields = fieldsParam.split(',').map((f) => f.trim());
      for (const field of fields) {
        select[field] = true;
      }
      select.id = true; // Always include id
    }

    // Build include
    const include: Record<string, any> = {};
    if (includeParam) {
      const includes = includeParam.split(',').map((i) => i.trim());
      for (const inc of includes) {
        switch (inc) {
          case 'customer':
            include.customer = {
              select: {
                id: true,
                code: true,
                name: true,
                nameEn: true,
                taxId: true,
                address: true,
                phone: true,
                email: true,
                creditLimit: true,
                creditDays: true,
              },
            };
            break;
          case 'lines':
            include.lines = {
              include: {
                product: {
                  select: { code: true, name: true, unit: true },
                },
              },
            };
            break;
          case 'journalEntry':
            include.journalEntry = {
              select: {
                id: true,
                entryNo: true,
                date: true,
                totalDebit: true,
                totalCredit: true,
                status: true,
              },
            };
            break;
          case 'receiptAllocations':
            include.receiptAllocations = {
              include: {
                receipt: {
                  select: { receiptNo: true, receiptDate: true, amount: true },
                },
              },
            };
            break;
          case 'currency':
            include.currency = {
              select: { code: true, name: true, symbol: true },
            };
            break;
          case 'activity':
            // Activity is not a direct relation, would need separate query
            break;
        }
      }
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id, isActive: true },
      ...(Object.keys(select).length > 0 && { select }),
      ...(Object.keys(include).length > 0 && { include }),
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found', version: 'v2' }, { status: 404 });
    }

    // Calculate additional metrics
    const metrics = {
      daysOutstanding:
        invoice.status === 'PAID'
          ? 0
          : Math.floor(
              (Date.now() - new Date(invoice.invoiceDate).getTime()) / (1000 * 60 * 60 * 24)
            ),
      balanceDue: (invoice.totalAmount || 0) - (invoice.paidAmount || 0),
      isOverdue:
        invoice.dueDate && new Date(invoice.dueDate) < new Date() && invoice.status !== 'PAID',
    };

    return NextResponse.json({
      success: true,
      version: 'v2',
      features: ['field-selection', 'include-relations', 'metrics'],
      data: invoice,
      metrics,
    });
  } catch (error) {
    console.error('Error fetching invoice (v2):', error);
    return NextResponse.json({ error: 'Failed to fetch invoice', version: 'v2' }, { status: 500 });
  }
}

// PUT /api/v2/invoices/:id - Update invoice
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized', version: 'v2' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    // Check if invoice exists
    const existing = await prisma.invoice.findUnique({
      where: { id },
      select: { status: true, lines: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found', version: 'v2' }, { status: 404 });
    }

    // Build update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (body.invoiceDate) updateData.invoiceDate = new Date(body.invoiceDate);
    if (body.dueDate) updateData.dueDate = new Date(body.dueDate);
    if (body.reference !== undefined) updateData.reference = body.reference;
    if (body.poNumber !== undefined) updateData.poNumber = body.poNumber;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.internalNotes !== undefined) updateData.internalNotes = body.internalNotes;

    // Recalculate totals if lines provided
    if (body.lines && Array.isArray(body.lines)) {
      let subtotal = 0;
      let vatAmount = 0;
      const vatRate = body.vatRate ?? 7;

      for (const line of body.lines) {
        const lineAmount = (line.quantity || 1) * (line.unitPrice || 0) - (line.discount || 0);
        subtotal += lineAmount;
        vatAmount += Math.round(lineAmount * (vatRate / 100));
      }

      updateData.subtotal = subtotal;
      updateData.vatAmount = vatAmount;
      updateData.totalAmount = subtotal + vatAmount;
      updateData.netAmount =
        subtotal +
        vatAmount -
        (existing.lines as any[]).reduce((sum, l) => sum + (l.whtAmount || 0), 0);
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        customer: {
          select: { id: true, code: true, name: true },
        },
        lines: true,
      },
    });

    return NextResponse.json({
      success: true,
      version: 'v2',
      data: invoice,
    });
  } catch (error) {
    console.error('Error updating invoice (v2):', error);
    return NextResponse.json({ error: 'Failed to update invoice', version: 'v2' }, { status: 500 });
  }
}

// DELETE /api/v2/invoices/:id - Delete (soft) invoice
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized', version: 'v2' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const reason = searchParams.get('reason') || undefined;

    // Check if invoice exists
    const existing = await prisma.invoice.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found', version: 'v2' }, { status: 404 });
    }

    // Soft delete with audit trail
    await prisma.invoice.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
        deletedBy: session.user.id,
        notes: reason ? `Deleted: ${reason}` : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      version: 'v2',
      message: 'Invoice deleted successfully',
      deletedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error deleting invoice (v2):', error);
    return NextResponse.json({ error: 'Failed to delete invoice', version: 'v2' }, { status: 500 });
  }
}
