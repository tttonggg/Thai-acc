import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requireAuth } from '@/lib/api-utils'
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

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth()

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string

    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'ไม่พบไฟล์'
      }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        success: false,
        error: `ขนาดไฟล์ต้องไม่เกิน ${MAX_FILE_SIZE / 1024 / 1024}MB`
      }, { status: 400 })
    }

    // Validate file size (minimum 100 bytes to prevent empty files)
    if (file.size < 100) {
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

    // Sanitize filename - use UUID for uniqueness
    const uuid = randomUUID()
    const sanitizedName = file.name
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .substring(0, 50) // Limit filename length
    const filename = `${type || 'file'}-${uuid}${ext}`

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

    // Return public URL with metadata
    const url = `/uploads/${filename}`

    return NextResponse.json({
      success: true,
      url,
      filename: sanitizedName,
      storedFilename: filename,
      size: file.size,
      type: file.type,
      extension: ext
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'อัปโหลดไฟล์ไม่สำเร็จ กรุณาลองใหม่'
    }, { status: 500 })
  }
}
