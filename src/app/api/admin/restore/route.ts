import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { promises as fs } from 'fs'
import path from 'path'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'ไม่มีสิทธิ์ในการคืนค่าข้อมูล' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { filename } = body

    if (!filename) {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุชื่อไฟล์' },
        { status: 400 }
      )
    }

    // Validate filename - reject path traversal attempts
    if (filename.includes('..') || !/^[a-zA-Z0-9_\-.]+$/.test(filename)) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })
    }

    const backupsDir = path.join(process.cwd(), 'backups')
    const backupPath = path.join(backupsDir, filename)

    // Check if backup file exists
    try {
      await fs.access(backupPath)
    } catch {
      return NextResponse.json(
        { success: false, error: 'ไม่พบไฟล์ข้อมูลสำรอง' },
        { status: 404 }
      )
    }

    // Database paths
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')
    const dbWalPath = path.join(process.cwd(), 'prisma', 'dev.db-wal')
    const dbShmPath = path.join(process.cwd(), 'prisma', 'dev.db-shm')

    // Create a backup of current database before restoring
    const now = new Date()
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const preRestoreBackupFilename = `pre-restore-backup-${timestamp}.db`
    const preRestoreBackupPath = path.join(backupsDir, preRestoreBackupFilename)

    try {
      await fs.copyFile(dbPath, preRestoreBackupPath)
    } catch (error) {
      console.error('Pre-restore backup failed:', error)
      // Continue with restore even if pre-restore backup fails
    }

    // Delete WAL and SHM files if they exist
    try {
      await fs.unlink(dbWalPath)
    } catch {}
    try {
      await fs.unlink(dbShmPath)
    } catch {}

    // Copy backup file to database location
    await fs.copyFile(backupPath, dbPath)

    // Get file size
    const stats = await fs.stat(dbPath)
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2)

    return NextResponse.json({
      success: true,
      message: 'คืนค่าข้อมูลเรียบร้อยแล้ว',
      data: {
        filename,
        size: fileSizeInMB,
        restoredAt: now.toISOString(),
        preRestoreBackup: preRestoreBackupFilename
      }
    })
  } catch (error) {
    console.error('Restore error:', error)
    return NextResponse.json(
      { success: false, error: 'ไม่สามารถคืนค่าข้อมูลได้' },
      { status: 500 }
    )
  }
}
