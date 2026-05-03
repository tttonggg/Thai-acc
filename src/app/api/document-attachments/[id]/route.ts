import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isAdmin } from '@/lib/api-utils'
import { db } from '@/lib/db'
import fs from 'fs'
import path from 'path'

// GET /api/document-attachments/[id] - Fetch single attachment by id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const attachment = await db.documentAttachment.findFirst({
      where: {
        id,
        deletedAt: null
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!attachment) {
      return NextResponse.json({
        success: false,
        error: 'ไม่พบเอกสารแนบ'
      }, { status: 404 })
    }

    // RBAC: only uploadedById or ADMIN can view
    const admin = await isAdmin()
    if (attachment.uploadedById !== user.id && !admin) {
      return NextResponse.json({
        success: false,
        error: 'ไม่มีสิทธิ์ดูเอกสารแนบนี้'
      }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      data: attachment
    })
  } catch (error) {
    console.error('Error fetching document attachment:', error)
    return NextResponse.json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการดึงข้อมูลเอกสารแนบ'
    }, { status: 500 })
  }
}

// PATCH /api/document-attachments/[id] - Update entityType and/or entityId
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    // Fetch the attachment first
    const attachment = await db.documentAttachment.findFirst({
      where: {
        id,
        deletedAt: null
      }
    })

    if (!attachment) {
      return NextResponse.json({
        success: false,
        error: 'ไม่พบเอกสารแนบ'
      }, { status: 404 })
    }

    // RBAC: only uploadedById or ADMIN can update
    const admin = await isAdmin()
    if (attachment.uploadedById !== user.id && !admin) {
      return NextResponse.json({
        success: false,
        error: 'ไม่มีสิทธิ์แก้ไขเอกสารแนบนี้'
      }, { status: 403 })
    }

    const body = await request.json()
    const { entityType, entityId } = body

    // Build update data - only update provided fields
    const updateData: { entityType?: string; entityId?: string } = {}
    if (entityType !== undefined) updateData.entityType = entityType
    if (entityId !== undefined) updateData.entityId = entityId

    // Update the attachment
    const updated = await db.documentAttachment.update({
      where: { id },
      data: updateData,
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: updated
    })
  } catch (error) {
    console.error('Error updating document attachment:', error)
    return NextResponse.json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการแก้ไขเอกสารแนบ'
    }, { status: 500 })
  }
}

// DELETE /api/document-attachments/[id] - Soft delete and remove file from disk
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    // Fetch the attachment first to get filename and check permissions
    const attachment = await db.documentAttachment.findFirst({
      where: {
        id,
        deletedAt: null
      }
    })

    if (!attachment) {
      return NextResponse.json({
        success: false,
        error: 'ไม่พบเอกสารแนบ'
      }, { status: 404 })
    }

    // RBAC: only uploadedById or ADMIN can delete
    const admin = await isAdmin()
    if (attachment.uploadedById !== user.id && !admin) {
      return NextResponse.json({
        success: false,
        error: 'ไม่มีสิทธิ์ลบเอกสารแนบนี้'
      }, { status: 403 })
    }

    // Soft delete the DB record (set deletedAt)
    await db.documentAttachment.update({
      where: { id },
      data: { deletedAt: new Date() }
    })

    // T7: Delete the physical file from disk
    // File URL is like /uploads/doc-xxx.ext, we need to map to public/uploads/doc-xxx.ext
    const filePath = path.join(process.cwd(), 'public', attachment.fileUrl)

    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
        console.log(`Deleted file from disk: ${filePath}`)
      } else {
        console.warn(`File not found on disk (may already be deleted): ${filePath}`)
      }
    } catch (fileError) {
      // If file deletion fails, still soft-delete the DB record but log the error
      console.error('Error deleting file from disk:', fileError)
      // Don't return error - the DB record is already soft-deleted
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting document attachment:', error)
    return NextResponse.json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการลบเอกสารแนบ'
    }, { status: 500 })
  }
}
