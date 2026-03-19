/**
 * Audit Log API Routes
 * GET /api/security/audit - Get audit logs (admin only)
 * POST /api/security/audit/verify - Verify audit integrity
 * GET /api/security/audit/export - Export audit logs
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireRole, getClientIp } from '@/lib/api-auth'
import { getAuditLogs, verifyAuditIntegrity, exportToSyslogFormat, exportToJSON } from '@/lib/audit-service'
import { logSecurityEvent } from '@/lib/audit-service'

// GET - Get audit logs
export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(['ADMIN', 'ACCOUNTANT'], request)
    
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId') || undefined
    const action = url.searchParams.get('action') as any || undefined
    const entityType = url.searchParams.get('entityType') || undefined
    const entityId = url.searchParams.get('entityId') || undefined
    const startDate = url.searchParams.get('startDate') 
      ? new Date(url.searchParams.get('startDate')!) 
      : undefined
    const endDate = url.searchParams.get('endDate') 
      ? new Date(url.searchParams.get('endDate')!) 
      : undefined
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const format = url.searchParams.get('format') || 'json'
    
    const { logs, total } = await getAuditLogs({
      userId: userId || undefined,
      action,
      entityType: entityType || undefined,
      entityId: entityId || undefined,
      startDate,
      endDate,
      limit,
      offset,
    })
    
    // Log access to audit logs
    const ipAddress = getClientIp(request)
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    await logSecurityEvent(
      user.id,
      'VIEW',
      { resource: 'audit_logs', count: logs.length },
      ipAddress,
      userAgent
    )
    
    // Export format
    if (format === 'syslog') {
      const syslogLines = exportToSyslogFormat(logs.map(l => ({
        timestamp: l.timestamp,
        userId: l.userId,
        action: l.action,
        entityType: l.entityType,
        entityId: l.entityId,
        ipAddress: l.ipAddress,
      })))
      
      return new NextResponse(syslogLines.join('\n'), {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': 'attachment; filename="audit.log"',
        },
      })
    }
    
    if (format === 'json-export') {
      const jsonData = exportToJSON(logs)
      
      return new NextResponse(jsonData, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': 'attachment; filename="audit.json"',
        },
      })
    }
    
    return NextResponse.json({
      success: true,
      data: logs,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + logs.length < total,
      }
    })
  } catch (error: any) {
    console.error('Audit API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Verify audit integrity or other actions
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole('ADMIN', request)
    const body = await request.json()
    const { action } = body
    
    if (action === 'verify') {
      const result = await verifyAuditIntegrity()
      
      const ipAddress = getClientIp(request)
      const userAgent = request.headers.get('user-agent') || 'unknown'
      
      await logSecurityEvent(
        user.id,
        'VIEW',
        { 
          resource: 'audit_integrity', 
          valid: result.valid,
          totalRecords: result.totalRecords,
          invalidRecords: result.invalidRecords.length 
        },
        ipAddress,
        userAgent
      )
      
      return NextResponse.json({
        success: true,
        data: result,
      })
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Audit POST error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
