import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { promises as fs } from 'fs'
import path from 'path'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json(
      { success: false, error: 'ไม่มีสิทธิ์ในการอัปโหลดข้อมูลสำรอง' },
      { status: 403 }
    )
  }

  try {

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบไฟล์ที่อัปโหลด' },
        { status: 400 }
      )
    }

    // Validate file extension
    if (!file.name.endsWith('.db')) {
      return NextResponse.json(
        { success: false, error: 'รองรับเฉพาะไฟล์ .db เท่านั้น' },
        { status: 400 }
      )
    }

    // Create backups directory if it doesn't exist
    const backupsDir = path.join(process.cwd(), 'backups')
    try {
      await fs.access(backupsDir)
    } catch {
      await fs.mkdir(backupsDir, { recursive: true })
    }

    // Generate safe filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const uploadedFilename = `uploaded-backup-${timestamp}-${file.name}`
    const filePath = path.join(backupsDir, uploadedFilename)

    // Convert file to buffer and write to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await fs.writeFile(filePath, buffer)

    // Get file size
    const stats = await fs.stat(filePath)
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2)

    return NextResponse.json({
      success: true,
      message: 'อัปโหลดไฟล์เรียบร้อยแล้ว',
      data: {
        filename: uploadedFilename,
        originalFilename: file.name,
        path: filePath,
        size: parseFloat(fileSizeInMB),
        createdAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Upload backup error:', error)
    return NextResponse.json(
      { success: false, error: 'ไม่สามารถอัปโหลดไฟล์ได้' },
      { status: 500 }
    )
  }
}
