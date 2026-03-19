import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, apiResponse, apiError, unauthorizedError, notFoundError, forbiddenError } from '@/lib/api-utils'
import { db } from '@/lib/db'

// GET /api/credit-notes/[id] - Get single credit note
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()

    const creditNote = await db.creditNote.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        invoice: true,
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

    if (!creditNote) {
      return notFoundError('ไม่พบใบลดหนี้')
    }

    return apiResponse(creditNote)
  } catch (error) {
    if (error instanceof Error && error.message.includes('ไม่ได้รับอนุญาต')) {
      return unauthorizedError()
    }
    return apiError('เกิดข้อผิดพลาดในการดึงข้อมูลใบลดหนี้')
  }
}

// PUT /api/credit-notes/[id] - Update credit note (only cancelled status can be modified)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()

    if (user.role === 'VIEWER') {
      return forbiddenError()
    }

    const existing = await db.creditNote.findUnique({
      where: { id: params.id },
      include: {
        journalEntry: true
      }
    })

    if (!existing) {
      return notFoundError('ไม่พบใบลดหนี้')
    }

    // Only allow updating if not yet posted to journal
    if (existing.status === 'ISSUED' && existing.journalEntryId) {
      return apiError('ไม่สามารถแก้ไขใบลดหนี้ที่ออกแล้ว', 403)
    }

    const body = await request.json()

    // Allow updating notes and status only
    const updated = await db.creditNote.update({
      where: { id: params.id },
      data: {
        notes: body.notes,
        status: body.status,
      },
      include: {
        customer: true,
        invoice: true,
      },
    })

    return apiResponse(updated)
  } catch (error) {
    if (error instanceof Error && error.message.includes('ไม่ได้รับอนุญาต')) {
      return unauthorizedError()
    }
    return apiError('เกิดข้อผิดพลาดในการแก้ไขใบลดหนี้')
  }
}

// DELETE /api/credit-notes/[id] - Delete credit note (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()

    if (user.role !== 'ADMIN') {
      return forbiddenError()
    }

    const existing = await db.creditNote.findUnique({
      where: { id: params.id },
      include: {
        journalEntry: true
      }
    })

    if (!existing) {
      return notFoundError('ไม่พบใบลดหนี้')
    }

    // Cannot delete if journal entry exists
    if (existing.journalEntryId) {
      return apiError('ไม่สามารถลบใบลดหนี้ที่มีการลงบัญชีแล้ว', 403)
    }

    // Delete credit note
    await db.creditNote.delete({
      where: { id: params.id }
    })

    return apiResponse({ message: 'ลบใบลดหนี้เรียบร้อยแล้ว' })
  } catch (error) {
    if (error instanceof Error && error.message.includes('ไม่ได้รับอนุญาต')) {
      return unauthorizedError()
    }
    return apiError('เกิดข้อผิดพลาดในการลบใบลดหนี้')
  }
}
