import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, apiResponse, apiError, unauthorizedError, notFoundError, forbiddenError } from '@/lib/api-utils'
import { db } from '@/lib/db'

// GET /api/debit-notes/[id] - Get single debit note
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const { id } = await params

    const debitNote = await db.debitNote.findUnique({
      where: { id },
      include: {
        vendor: true,
        purchaseInvoice: true,
        journalEntry: {
          include: {
            lines: {
              include: {
                account: true
              }
            }
          }
        },
      },
    })

    if (!debitNote) {
      return notFoundError('ไม่พบใบเพิ่มหนี้')
    }

    return apiResponse(debitNote)
  } catch (error) {
    if (error instanceof Error && error.message.includes('ไม่ได้รับอนุญาต')) {
      return unauthorizedError()
    }
    return apiError('เกิดข้อผิดพลาดในการดึงข้อมูลใบเพิ่มหนี้')
  }
}

// PUT /api/debit-notes/[id] - Update debit note
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()

    if (user.role === 'VIEWER') {
      return forbiddenError()
    }

    const { id } = await params

    const existing = await db.debitNote.findUnique({
      where: { id },
      include: {
        journalEntry: true
      }
    })

    if (!existing) {
      return notFoundError('ไม่พบใบเพิ่มหนี้')
    }

    // Only allow updating if not yet posted to journal
    if (existing.status === 'ISSUED' && existing.journalEntryId) {
      return apiError('ไม่สามารถแก้ไขใบเพิ่มหนี้ที่ออกแล้ว', 403)
    }

    const body = await request.json()

    // Allow updating notes and status only
    const updated = await db.debitNote.update({
      where: { id },
      data: {
        notes: body.notes,
        status: body.status,
      },
      include: {
        vendor: true,
        purchaseInvoice: true,
      },
    })

    return apiResponse(updated)
  } catch (error) {
    if (error instanceof Error && error.message.includes('ไม่ได้รับอนุญาต')) {
      return unauthorizedError()
    }
    return apiError('เกิดข้อผิดพลาดในการแก้ไขใบเพิ่มหนี้')
  }
}

// DELETE /api/debit-notes/[id] - Delete debit note (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()

    if (user.role !== 'ADMIN') {
      return forbiddenError()
    }

    const { id } = await params

    const existing = await db.debitNote.findUnique({
      where: { id },
      include: {
        journalEntry: true
      }
    })

    if (!existing) {
      return notFoundError('ไม่พบใบเพิ่มหนี้')
    }

    // Cannot delete if journal entry exists
    if (existing.journalEntryId) {
      return apiError('ไม่สามารถลบใบเพิ่มหนี้ที่มีการลงบัญชีแล้ว', 403)
    }

    // Delete debit note
    await db.debitNote.delete({
      where: { id }
    })

    return apiResponse({ message: 'ลบใบเพิ่มหนี้เรียบร้อยแล้ว' })
  } catch (error) {
    if (error instanceof Error && error.message.includes('ไม่ได้รับอนุญาต')) {
      return unauthorizedError()
    }
    return apiError('เกิดข้อผิดพลาดในการลบใบเพิ่มหนี้')
  }
}
