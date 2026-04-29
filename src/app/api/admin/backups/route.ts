import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json(
      { success: false, error: 'ไม่มีสิทธิ์ในการดูข้อมูลสำรอง' },
      { status: 403 }
    )
  }

  try {

    const backupsDir = path.join(process.cwd(), 'backups')

    // Check if backups directory exists
    try {
      await fs.access(backupsDir)
    } catch {
      // Directory doesn't exist, return empty list
      return NextResponse.json({
        success: true,
        data: {
          backups: [],
          totalBackups: 0,
          totalSize: 0,
          lastBackup: null,
          databaseLocation: path.join(process.cwd(), 'prisma', 'dev.db')
        }
      })
    }

    // Read all files in backups directory
    const files = await fs.readdir(backupsDir)

    // Filter only .db files and get their stats
    const backupPromises = files
      .filter(file => file.endsWith('.db'))
      .map(async (filename) => {
        const filePath = path.join(backupsDir, filename)
        const stats = await fs.stat(filePath)
        const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2)

        // Extract timestamp from filename
        const timestampMatch = filename.match(/thai-accounting-backup-(.+)\.db/)
        const timestamp = timestampMatch ? timestampMatch[1] : null

        return {
          filename,
          path: filePath,
          size: parseFloat(fileSizeInMB),
          createdAt: stats.birthtime.toISOString(),
          modifiedAt: stats.mtime.toISOString(),
          timestamp
        }
      })

    const backups = await Promise.all(backupPromises)

    // Sort by creation date (newest first)
    backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // Calculate total size
    const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0)

    // Get last backup date
    const lastBackup = backups.length > 0 ? backups[0].createdAt : null

    return NextResponse.json({
      success: true,
      data: {
        backups,
        totalBackups: backups.length,
        totalSize: parseFloat(totalSize.toFixed(2)),
        lastBackup,
        databaseLocation: path.join(process.cwd(), 'prisma', 'dev.db')
      }
    })
  } catch (error) {
    console.error('List backups error:', error)
    return NextResponse.json(
      { success: false, error: 'ไม่สามารถดึงรายการข้อมูลสำรองได้' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json(
      { success: false, error: 'ไม่มีสิทธิ์ในการลบข้อมูลสำรอง' },
      { status: 403 }
    )
  }

  try {

    const body = await req.json()
    const { filename } = body

    if (!filename) {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุชื่อไฟล์' },
        { status: 400 }
      )
    }

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

    // Delete the file
    await fs.unlink(filePath)

    return NextResponse.json({
      success: true,
      message: 'ลบข้อมูลสำรองเรียบร้อยแล้ว'
    })
  } catch (error) {
    console.error('Delete backup error:', error)
    return NextResponse.json(
      { success: false, error: 'ไม่สามารถลบข้อมูลสำรองได้' },
      { status: 500 }
    )
  }
}
