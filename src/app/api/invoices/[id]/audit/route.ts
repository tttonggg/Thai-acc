import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { formatThaiDate } from '@/lib/thai-accounting';
import { apiResponse, notFoundError, apiError, unauthorizedError, requireAuth } from '@/lib/api-utils';

interface AuditEntry {
  id: string;
  action: string;
  entityType: 'INVOICE' | 'LINE_ITEM';
  entityId: string;
  beforeState: any;
  afterState: any;
  userId: string;
  userName: string | null;
  createdAt: Date;
  thaiDate: string;
  // Line item specific fields
  field?: string | null;
  fieldName?: string;
  oldValue?: string | null;
  newValue?: string | null;
  lineItem?: {
    id: string;
    description: string;
    lineNo: number;
  } | null;
  changeReason?: string | null;
}

/**
 * GET /api/invoices/[id]/audit
 *
 * Fetches comprehensive audit trail for an invoice including:
 * - General invoice changes from AuditLog model
 * - Line item changes from InvoiceLineItemAudit model
 *
 * Query Parameters:
 * - action: Filter by action type (CREATED, UPDATED, DELETED, VIEW, EXPORT)
 * - entityType: Filter by entity type (INVOICE, LINE_ITEM)
 * - userId: Filter by user who made changes
 * - startDate: Filter by start date (ISO format)
 * - endDate: Filter by end date (ISO format)
 * - limit: Pagination limit (default: 50, max: 100)
 * - cursor: Pagination cursor for next page
 *
 * Response Format:
 * {
 *   success: true,
 *   data: {
 *     entries: AuditEntry[],
 *     nextCursor: string | null,
 *     totalEntries: number
 *   }
 * }
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const entityType = searchParams.get('entityType');
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = Math.min(Number(searchParams.get('limit') || '50'), 100);
    const cursor = searchParams.get('cursor');

    // Check if invoice exists
    const invoice = await db.invoice.findUnique({
      where: { id },
      select: { id: true, createdById: true },
    });

    if (!invoice) {
      return notFoundError('ไม่พบใบกำกับภาษี');
    }

    // IDOR Protection: Check ownership - only ADMIN can access any invoice
    if (user.role !== 'ADMIN' && invoice.createdById && invoice.createdById !== user.id) {
      return apiError('ไม่มีสิทธิ์เข้าถึงข้อมูล', 403);
    }

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    // Fetch general audit logs for the invoice
    const generalAuditLogs = await db.auditLog.findMany({
      where: {
        entityType: 'Invoice',
        entityId: id,
        ...(action && { action }),
        ...(userId && { userId }),
        ...(Object.keys(dateFilter).length > 0 && { timestamp: dateFilter }),
        ...(cursor && { timestamp: { ...dateFilter, lt: new Date(cursor) } }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
    });

    // Get line item IDs for this invoice
    const lineItems = await db.invoiceLine.findMany({
      where: { invoiceId: id },
      select: { id: true },
    });

    const lineItemIds = lineItems.map((item) => item.id);

    // Fetch line item audit logs
    const lineItemAuditLogs = await db.invoiceLineItemAudit.findMany({
      where: {
        lineItemId: { in: lineItemIds },
        ...(action && { action }),
        ...(userId && { changedById: userId }),
        ...(Object.keys(dateFilter).length > 0 && {
          createdAt: dateFilter,
        }),
        ...(cursor && {
          createdAt: { ...dateFilter, lt: new Date(cursor) },
        }),
      },
      include: {
        lineItem: {
          select: {
            id: true,
            description: true,
            lineNo: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    // Format field names in Thai/English
    const fieldNames: Record<string, string> = {
      description: 'รายการ',
      quantity: 'จำนวน',
      unit: 'หน่วย',
      unitPrice: 'ราคาต่อหน่วย',
      discount: 'ส่วนลด',
      vatRate: 'อัตรา VAT',
      notes: 'หมายเหตุ',
    };

    // Transform general audit logs to unified format
    const generalEntries: AuditEntry[] = generalAuditLogs.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: 'INVOICE',
      entityId: log.entityId,
      beforeState: log.beforeState,
      afterState: log.afterState,
      userId: log.userId,
      userName: log.user.name || log.user.email,
      createdAt: log.timestamp,
      thaiDate: formatThaiDate(log.timestamp),
      field: null,
      fieldName: undefined,
      oldValue: null,
      newValue: null,
      lineItem: null,
      changeReason: null,
    }));

    // Transform line item audit logs to unified format
    const lineItemEntries = lineItemAuditLogs.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: 'LINE_ITEM',
      entityId: log.lineItemId,
      beforeState: null,
      afterState: null,
      userId: log.changedById,
      userName: log.changedByName,
      createdAt: log.createdAt,
      thaiDate: formatThaiDate(log.createdAt),
      field: log.field,
      fieldName: fieldNames[log.field || ''] || log.field,
      oldValue: log.oldValue,
      newValue: log.newValue,
      lineItem: log.lineItem,
      changeReason: log.changeReason,
    }));

    // Combine and sort all entries by date (most recent first)
    const allEntries = [...generalEntries, ...lineItemEntries].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );

    // Apply additional filters
    let filteredEntries = allEntries;

    if (entityType === 'INVOICE') {
      filteredEntries = allEntries.filter((e) => e.entityType === 'INVOICE');
    } else if (entityType === 'LINE_ITEM') {
      filteredEntries = allEntries.filter((e) => e.entityType === 'LINE_ITEM');
    }

    // Apply pagination
    const paginatedEntries = filteredEntries.slice(0, limit);
    const nextCursor =
      paginatedEntries.length < filteredEntries.length
        ? paginatedEntries[paginatedEntries.length - 1].createdAt.toISOString()
        : null;

    return apiResponse({
      entries: paginatedEntries,
      nextCursor,
      totalEntries: filteredEntries.length,
      filters: {
        action,
        entityType,
        userId,
        startDate,
        endDate,
      },
    });
  } catch (error) {
    console.error('Audit log fetch error:', error);

    if (error instanceof Error && error.message.includes('ไม่ได้รับอนุญาต')) {
      return unauthorizedError();
    }

    return apiError('เกิดข้อผิดพลาดในการดึงข้อมูลประวัติการแก้ไข');
  }
}
