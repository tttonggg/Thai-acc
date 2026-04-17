import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireRole } from '@/lib/api-utils'

// GET - Export activity logs to CSV (ADMIN only)
export async function GET(request: NextRequest) {
  try {
    await requireRole(['ADMIN'])

    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const action = searchParams.get('action')
    const module = searchParams.get('module')
    const status = searchParams.get('status')

    // Build where clause
    const where: any = {}

    if (action) {
      where.action = action
    }

    if (module) {
      where.module = module
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo)
      }
    }

    // Fetch all matching logs (no pagination for export)
    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            email: true,
            name: true,
            role: true,
          },
        },
      },
    })

    // Convert to CSV
    const headers = [
      'Date/Time',
      'User Email',
      'User Name',
      'Role',
      'Action',
      'Module',
      'Record ID',
      'IP Address',
      'Status',
      'Error Message',
      'Details',
    ]

    const rows = logs.map((log) => {
      const details = log.details ? JSON.stringify(log.details) : ''
      return [
        log.createdAt.toISOString(),
        log.user.email,
        log.user.name || '',
        log.user.role,
        log.action,
        log.module,
        log.recordId || '',
        log.ipAddress || '',
        log.status,
        log.errorMessage || '',
        `"${details.replace(/"/g, '""')}"`, // Escape quotes in CSV
      ].join(',')
    })

    const csv = [headers.join(','), ...rows].join('\n')

    // Return as CSV file
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="activity-logs-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error: any) {
    console.error('Error exporting activity logs:', error)
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการส่งออกข้อมูล' },
      { status: 500 }
    )
  }
}
