import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'ไม่มีสิทธิ์ในการดาวน์โหลดข้อมูลสำรอง' },
        { status: 403 }
      )
    }

    const { filename } = await params
    const backupsDir = path.join(process.cwd(), 'backups')
    const filePath = path.join(backupsDir, filename)

    // Check if file exists
    try {
      await fs.access(filePath)
    } catch {
      return NextResponse.json(
        { success: false, error: 'ไม่พบไฟล์ข้อมูลสำรอง' },
        { status: 404 }
      )
    }

    // Read file
    const fileBuffer = await fs.readFile(filePath)

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileBuffer.length.toString()
      }
    })
  } catch (error) {
    console.error('Download backup error:', error)
    return NextResponse.json(
      { success: false, error: 'ไม่สามารถดาวน์โหลดไฟล์ได้' },
      { status: 500 }
    )
  }
}
