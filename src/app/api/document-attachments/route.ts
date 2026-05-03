import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-utils'
import { db } from '@/lib/db'
import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

// Allowed file types (whitelist approach)
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

// Allowed file extensions
const ALLOWED_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp',
  '.pdf',
  '.csv', '.xls', '.xlsx',
  '.doc', '.docx'
]

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024

// Minimum file size: 100 bytes
const MIN_FILE_SIZE = 100

// GET /api/document-attachments?entityType=xxx&entityId=xxx
export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get('entityType')
    const entityId = searchParams.get('entityId')

    if (!entityType || !entityId) {
      return NextResponse.json({
        success: false,
        error: 'ต้องระบุ entityType และ entityId'
      }, { status: 400 })
    }

    const attachments = await db.documentAttachment.findMany({
      where: {
        entityType,
        entityId,
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: attachments
    })
  } catch (error) {
    console.error('Error fetching document attachments:', error)
    return NextResponse.json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการดึงข้อมูลเอกสารแนบ'
    }, { status: 500 })
  }
}

// POST /api/document-attachments (multipart/form-data)
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()

    const formData = await request.formData()
    const file = formData.get('file') as File
    const entityType = formData.get('entityType') as string
    const entityId = formData.get('entityId') as string

    // Validate required fields
    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'ไม่พบไฟล์'
      }, { status: 400 })
    }

    if (!entityType || !entityId) {
      return NextResponse.json({
        success: false,
        error: 'ต้องระบุ entityType และ entityId'
      }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        success: false,
        error: `ขนาดไฟล์ต้องไม่เกิน ${MAX_FILE_SIZE / 1024 / 1024}MB`
      }, { status: 400 })
    }

    // Validate file size (min 100 bytes)
    if (file.size < MIN_FILE_SIZE) {
      return NextResponse.json({
        success: false,
        error: 'ไฟล์มีขนาดเล็กเกินไป'
      }, { status: 400 })
    }

    // Validate MIME type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json({
        success: false,
        error: 'ประเภทไฟล์ไม่ถูกต้อง'
      }, { status: 400 })
    }

    // Validate file extension
    const ext = path.extname(file.name).toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json({
        success: false,
        error: 'นามสกุลไฟล์ไม่ถูกต้อง'
      }, { status: 400 })
    }

    // Sanitize filename
    const uuid = randomUUID()
    const sanitizedName = file.name
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .substring(0, 50)
    const filename = `doc-${entityType}-${uuid}${ext}`

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    const filepath = path.join(uploadDir, filename)

    // Write file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    fs.writeFileSync(filepath, buffer)

    // Create document attachment record in DB
    const attachment = await db.documentAttachment.create({
      data: {
        entityType,
        entityId,
        fileName: sanitizedName,
        storedFileName: filename,
        fileUrl: `/uploads/${filename}`,
        fileSize: file.size,
        mimeType: file.type,
        uploadedById: user.id
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

    return NextResponse.json({
      success: true,
      data: attachment
    })
  } catch (error) {
    console.error('Error creating document attachment:', error)
    return NextResponse.json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการอัปโหลดเอกสารแนบ'
    }, { status: 500 })
  }
}
