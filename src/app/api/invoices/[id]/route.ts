import { NextRequest, NextResponse } from 'next/server';
import {
  requireAuth,
  apiError,
  unauthorizedError,
  notFoundError,
  forbiddenError,
  AuthError,
} from '@/lib/api-auth';
import { apiResponse } from '@/lib/api-utils';
import { db } from '@/lib/db';
import { satangToBaht } from '@/lib/currency';
import { logAudit } from '@/lib/audit-service';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // Find invoice
    const invoice = await db.invoice.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true } },
        lines: true,
      },
    });

    if (!invoice) {
      return notFoundError('ไม่พบใบกำกับภาษี');
    }

    // CRITICAL: Convert Satang to Baht for all monetary fields
    // Database stores Satang (integers), API returns Baht (decimals)
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

    return apiResponse(invoiceInBaht);
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return unauthorizedError();
    }
    if (error instanceof Response) {
      return error;
    }
    if (error instanceof Error && error.message.includes('unauthorized')) {
      return unauthorizedError();
    }
    return apiError('เกิดข้อผิดพลาดในการดึงข้อมูลใบกำกับภาษี');
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    // Find invoice
    const invoice = await db.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      return notFoundError('ไม่พบใบกำกับภาษี');
    }

    // Handle different actions
    if (action === 'post') {
      // Issue invoice (DRAFT → ISSUED)
      if (invoice.status !== 'DRAFT') {
        return apiError('สามารถออกเฉพาะใบกำกับภาษีสถานะร่างเท่านั้น', 400);
      }

      const updatedInvoice = await db.invoice.update({
        where: { id },
        data: { status: 'ISSUED' },
      });

      // Audit POST (issue) action
      await logAudit({
        userId: user.id,
        action: 'POST',
        entityType: 'Invoice',
        entityId: id,
        beforeState: { status: invoice.status },
        afterState: { status: updatedInvoice.status },
        ipAddress: request.headers.get('x-forwarded-for') || '',
        userAgent: request.headers.get('user-agent') || '',
      }).catch((err) => console.error('Audit log failed:', err));

      return apiResponse(updatedInvoice);
    }

    if (action === 'update') {
      // Update DRAFT invoice
      if (invoice.status !== 'DRAFT') {
        return forbiddenError('สามารถแก้ไขได้เฉพาะใบกำกับภาษีสถานะร่างเท่านั้น');
      }

      // Permission: only creator or ADMIN
      const isAdmin = user.role === 'ADMIN';
      const isCreator = invoice.createdById === user.id;
      if (!isCreator && !isAdmin) {
        return forbiddenError('ไม่มีสิทธิ์แก้ไขใบกำกับภาษีนี้');
      }

      const { data } = body;

      // Update allowed fields
      const updatedInvoice = await db.invoice.update({
        where: { id },
        data: {
          invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : undefined,
          dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
          customerId: data.customerId,
          type: data.type,
          reference: data.reference,
          poNumber: data.poNumber,
          discountAmount: data.discountAmount,
          discountPercent: data.discountPercent,
          withholdingRate: data.withholdingRate,
          notes: data.notes,
          internalNotes: data.internalNotes,
          terms: data.terms,
        },
      });

      // Audit field-level changes
      await logAudit({
        userId: user.id,
        action: 'UPDATE',
        entityType: 'Invoice',
        entityId: id,
        beforeState: {
          invoiceDate: invoice.invoiceDate,
          dueDate: invoice.dueDate,
          customerId: invoice.customerId,
          type: invoice.type,
          reference: invoice.reference,
          poNumber: invoice.poNumber,
          discountAmount: invoice.discountAmount,
          discountPercent: invoice.discountPercent,
          withholdingRate: invoice.withholdingRate,
          notes: invoice.notes,
          internalNotes: invoice.internalNotes,
          terms: invoice.terms,
        },
        afterState: {
          invoiceDate: updatedInvoice.invoiceDate,
          dueDate: updatedInvoice.dueDate,
          customerId: updatedInvoice.customerId,
          type: updatedInvoice.type,
          reference: updatedInvoice.reference,
          poNumber: updatedInvoice.poNumber,
          discountAmount: updatedInvoice.discountAmount,
          discountPercent: updatedInvoice.discountPercent,
          withholdingRate: updatedInvoice.withholdingRate,
          notes: updatedInvoice.notes,
          internalNotes: updatedInvoice.internalNotes,
          terms: updatedInvoice.terms,
        },
        ipAddress: request.headers.get('x-forwarded-for') || '',
        userAgent: request.headers.get('user-agent') || '',
      }).catch((err) => console.error('Audit log failed:', err)); // non-blocking

      return apiResponse(updatedInvoice);
    }

    return apiError('ไม่รองรับ action ที่ร้องขอ', 400);
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return unauthorizedError();
    }
    if (error instanceof Response) {
      return error;
    }
    if (error instanceof Error && error.message.includes('unauthorized')) {
      return unauthorizedError();
    }
    return apiError('เกิดข้อผิดพลาดในการอัปเดตสถานะใบกำกับภาษี');
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Basic PUT implementation
  return apiResponse({ message: 'PUT endpoint working' });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // Find invoice
    const invoice = await db.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      return notFoundError('ไม่พบใบกำกับภาษี');
    }

    // Permission: only DRAFT status
    if (invoice.status !== 'DRAFT') {
      return forbiddenError('สามารถลบได้เฉพาะใบกำกับภาษีสถานะร่างเท่านั้น');
    }

    // Permission: only creator or ADMIN
    const isAdmin = user.role === 'ADMIN';
    const isCreator = invoice.createdById === user.id;
    if (!isCreator && !isAdmin) {
      return forbiddenError('ไม่มีสิทธิ์ลบใบกำกับภาษีนี้');
    }

    // Soft-delete invoice + hard-delete cascade children
    await db.$transaction([
      // Soft-delete parent
      db.invoice.update({
        where: { id },
        data: { deletedAt: new Date(), deletedBy: user.id },
      }),
      // Hard-delete cascade children (audit trail not meaningful for orphaned children)
      db.invoiceLine.deleteMany({ where: { invoiceId: id } }),
      db.invoiceComment.deleteMany({ where: { invoiceId: id } }),
    ]);

    // Audit DELETE
    await logAudit({
      userId: user.id,
      action: 'DELETE',
      entityType: 'Invoice',
      entityId: id,
      beforeState: {
        invoiceNo: invoice.invoiceNo,
        status: invoice.status,
        totalAmount: invoice.totalAmount,
        customerId: invoice.customerId,
      },
      afterState: null,
      ipAddress: request.headers.get('x-forwarded-for') || '',
      userAgent: request.headers.get('user-agent') || '',
    }).catch((err) => console.error('Audit log failed:', err));

    return apiResponse({ message: 'ลบใบกำกับภาษีเรียบร้อยแล้ว' });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('unauthorized')) {
      return unauthorizedError();
    }
    return apiError('เกิดข้อผิดพลาดในการลบใบกำกับภาษี');
  }
}
