import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json(
      { success: false, error: 'ไม่มีสิทธิ์ในการสร้างข้อมูลสำรอง' },
      { status: 403 }
    );
  }

  try {
    // Create backups directory if it doesn't exist
    const backupsDir = path.join(process.cwd(), 'backups');
    try {
      await fs.access(backupsDir);
    } catch {
      await fs.mkdir(backupsDir, { recursive: true });
    }

    // Generate backup filename with timestamp
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupFilename = `thai-accounting-backup-${timestamp}.db`;
    const backupPath = path.join(backupsDir, backupFilename);

    // Database path
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');

    // Check if database exists
    try {
      await fs.access(dbPath);
    } catch {
      return NextResponse.json({ success: false, error: 'ไม่พบไฟล์ฐานข้อมูล' }, { status: 404 });
    }

    // Copy database file to backup location
    await fs.copyFile(dbPath, backupPath);

    // Get file size
    const stats = await fs.stat(backupPath);
    const fileSizeInBytes = stats.size;
    const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2);

    return NextResponse.json({
      success: true,
      data: {
        filename: backupFilename,
        path: backupPath,
        size: fileSizeInMB,
        createdAt: now.toISOString(),
        timestamp: timestamp,
      },
    });
  } catch (error: unknown) {
    console.error('Backup creation error:', error);
    return NextResponse.json(
      { success: false, error: 'ไม่สามารถสร้างข้อมูลสำรองได้' },
      { status: 500 }
    );
  }
}
