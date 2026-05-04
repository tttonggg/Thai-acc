import { NextRequest, NextResponse } from 'next/server';
import {
  requireAuth,
  apiResponse,
  apiError,
  unauthorizedError,
  notFoundError,
  forbiddenError,
} from '@/lib/api-utils';
import { db } from '@/lib/db';
import { satangToBaht } from '@/lib/currency';

// GET /api/credit-notes/[id] - Get single credit note
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;

    const creditNote = await db.creditNote.findUnique({
      where: { id },
      include: {
        customer: true,
        invoice: true,
        journalEntry: {
          include: {
            lines: {
              include: {
                account: true,
              },
            },
          },
        },
      },
    });

    if (!creditNote) {
      return notFoundError('ไม่พบใบลดหนี้');
    }

    // Convert Satang to Baht for all monetary fields
    const creditNoteInBaht = {
      ...creditNote,
      subtotal: satangToBaht(creditNote.subtotal),
      vatAmount: satangToBaht(creditNote.vatAmount),
      totalAmount: satangToBaht(creditNote.totalAmount),
      // Convert journal entry lines if present
      journalEntry: creditNote.journalEntry
        ? {
            ...creditNote.journalEntry,
            lines: creditNote.journalEntry.lines.map((line) => ({
              ...line,
              debit: satangToBaht(line.debit),
              credit: satangToBaht(line.credit),
            })),
          }
        : null,
    };

    return apiResponse(creditNoteInBaht);
  } catch (error) {
    if (error instanceof Error && error.message.includes('ไม่ได้รับอนุญาต')) {
      return unauthorizedError();
    }
    return apiError('เกิดข้อผิดพลาดในการดึงข้อมูลใบลดหนี้');
  }
}

// PUT /api/credit-notes/[id] - Update credit note (only cancelled status can be modified)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();

    if (user.role === 'VIEWER') {
      return forbiddenError();
    }

    const { id } = await params;

    const existing = await db.creditNote.findUnique({
      where: { id },
      include: {
        journalEntry: true,
      },
    });

    if (!existing) {
      return notFoundError('ไม่พบใบลดหนี้');
    }

    // Only allow updating if not yet posted to journal
    if (existing.status === 'ISSUED' && existing.journalEntryId) {
      return apiError('ไม่สามารถแก้ไขใบลดหนี้ที่ออกแล้ว', 403);
    }

    const body = await request.json();

    // Allow updating notes and status only
    const updated = await db.creditNote.update({
      where: { id },
      data: {
        notes: body.notes,
        status: body.status,
      },
      include: {
        customer: true,
        invoice: true,
      },
    });

    return apiResponse(updated);
  } catch (error) {
    if (error instanceof Error && error.message.includes('ไม่ได้รับอนุญาต')) {
      return unauthorizedError();
    }
    return apiError('เกิดข้อผิดพลาดในการแก้ไขใบลดหนี้');
  }
}

// DELETE /api/credit-notes/[id] - Delete credit note (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();

    if (user.role !== 'ADMIN' && user.role !== 'ACCOUNTANT') {
      return forbiddenError();
    }

    const { id } = await params;

    const existing = await db.creditNote.findUnique({
      where: { id },
      include: {
        journalEntry: true,
      },
    });

    if (!existing) {
      return notFoundError('ไม่พบใบลดหนี้');
    }

    // Only ISSUED status without journal entry can be deleted
    if (existing.status !== 'ISSUED') {
      return (forbiddenError() as any)(
        'สามารถลบได้เฉพาะใบลดหนี้สถานะออกแล้วที่ยังไม่ได้ลงบัญชีเท่านั้น'
      );
    }

    // Cannot delete if journal entry exists
    if (existing.journalEntryId) {
      return apiError('ไม่สามารถลบใบลดหนี้ที่มีการลงบัญชีแล้ว', 403);
    }

    // Soft-delete
    await db.creditNote.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false, deletedBy: user.id },
    });

    return apiResponse({ message: 'ลบใบลดหนี้เรียบร้อยแล้ว' });
  } catch (error) {
    if (error instanceof Error && error.message.includes('ไม่ได้รับอนุญาต')) {
      return unauthorizedError();
    }
    return apiError('เกิดข้อผิดพลาดในการลบใบลดหนี้');
  }
}
