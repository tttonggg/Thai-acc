# Invoice Audit Log API Documentation

## Endpoint

```
GET /api/invoices/[id]/audit
```

## Description

Retrieves a comprehensive audit trail for an invoice, combining both general invoice changes (from `AuditLog` model) and line item changes (from `InvoiceLineItemAudit` model).

## Authentication

- **Required**: Yes (via NextAuth session)
- **Permissions**: Users can access audit logs for their own invoices. ADMIN users can access all invoices.

## Request Parameters

### Path Parameters

| Parameter | Type   | Required | Description            |
|-----------|--------|----------|------------------------|
| id        | string | Yes      | Invoice ID (cuid)      |

### Query Parameters

| Parameter   | Type   | Required | Default | Description                                                 |
|-------------|--------|----------|---------|-------------------------------------------------------------|
| action      | string | No       | -       | Filter by action type (CREATED, UPDATED, DELETED, VIEW, EXPORT) |
| entityType  | string | No       | -       | Filter by entity type (INVOICE, LINE_ITEM)                  |
| userId      | string | No       | -       | Filter by user who made the changes                        |
| startDate   | string | No       | -       | ISO 8601 date string (e.g., 2026-01-01)                     |
| endDate     | string | No       | -       | ISO 8601 date string (e.g., 2026-12-31)                     |
| limit       | number | No       | 50      | Number of entries per page (max: 100)                       |
| cursor      | string | No       | -       | Pagination cursor (ISO date string for next page)           |

## Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "entries": [
      {
        "id": "clm1234567890",
        "action": "UPDATED",
        "entityType": "LINE_ITEM",
        "entityId": "clm0987654321",
        "beforeState": null,
        "afterState": null,
        "userId": "user123",
        "userName": "Admin User",
        "createdAt": "2026-03-18T10:30:00.000Z",
        "thaiDate": "18/03/2569",
        "field": "quantity",
        "fieldName": "จำนวน",
        "oldValue": "10",
        "newValue": "15",
        "lineItem": {
          "id": "clm0987654321",
          "description": "Product A",
          "lineNo": 1
        },
        "changeReason": null
      },
      {
        "id": "clm9876543210",
        "action": "CREATED",
        "entityType": "INVOICE",
        "entityId": "inv123",
        "beforeState": null,
        "afterState": {
          "invoiceNo": "INV-202603-0001",
          "customerId": "cust123",
          "totalAmount": 15000
        },
        "userId": "user123",
        "userName": "Admin User",
        "createdAt": "2026-03-18T09:00:00.000Z",
        "thaiDate": "18/03/2569",
        "field": null,
        "fieldName": undefined,
        "oldValue": null,
        "newValue": null,
        "lineItem": null,
        "changeReason": null
      }
    ],
    "nextCursor": "2026-03-18T09:00:00.000Z",
    "totalEntries": 45,
    "filters": {
      "action": "UPDATED",
      "entityType": "LINE_ITEM",
      "userId": null,
      "startDate": null,
      "endDate": null
    }
  }
}
```

### Entry Types

#### Invoice-Level Changes (entityType: "INVOICE")

- Captures general invoice state changes
- Includes `beforeState` and `afterState` JSON objects
- Actions: CREATED, UPDATED, DELETED, VIEW, EXPORT

#### Line Item Changes (entityType: "LINE_ITEM")

- Captures individual line item modifications
- Includes field-specific changes (quantity, unitPrice, etc.)
- Actions: CREATED, UPDATED, DELETED
- Includes `lineItem` reference with description and line number

### Error Responses

#### 401 Unauthorized
```json
{
  "success": false,
  "error": "ไม่ได้รับอนุญาต - กรุณาเข้าสู่ระบบ"
}
```

#### 403 Forbidden
```json
{
  "success": false,
  "error": "ไม่มีสิทธิ์เข้าถึงข้อมูล"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "error": "ไม่พบใบกำกับภาษี"
}
```

#### 500 Server Error
```json
{
  "success": false,
  "error": "เกิดข้อผิดพลาดในการดึงข้อมูลประวัติการแก้ไข"
}
```

## Thai Field Name Mappings

| Field (English) | Field Name (Thai) |
|-----------------|-------------------|
| description     | รายการ            |
| quantity        | จำนวน             |
| unit            | หน่วย             |
| unitPrice       | ราคาต่อหน่วย        |
| discount        | ส่วนลด            |
| vatRate         | อัตรา VAT          |
| notes           | หมายเหตุ           |

## Usage Examples

### Example 1: Fetch All Audit Logs

```bash
curl -X GET "http://localhost:3000/api/invoices/clm123/audit" \
  -H "Cookie: next-auth.session-token=..."
```

### Example 2: Filter by Action Type

```bash
curl -X GET "http://localhost:3000/api/invoices/clm123/audit?action=UPDATED" \
  -H "Cookie: next-auth.session-token=..."
```

### Example 3: Filter by Entity Type

```bash
curl -X GET "http://localhost:3000/api/invoices/clm123/audit?entityType=LINE_ITEM" \
  -H "Cookie: next-auth.session-token=..."
```

### Example 4: Date Range Filter

```bash
curl -X GET "http://localhost:3000/api/invoices/clm123/audit?startDate=2026-01-01&endDate=2026-03-31" \
  -H "Cookie: next-auth.session-token=..."
```

### Example 5: Paginated Results

```bash
curl -X GET "http://localhost:3000/api/invoices/clm123/audit?limit=20&cursor=2026-03-18T10:00:00.000Z" \
  -H "Cookie: next-auth.session-token=..."
```

### Example 6: Combined Filters

```bash
curl -X GET "http://localhost:3000/api/invoices/clm123/audit?action=UPDATED&entityType=LINE_ITEM&userId=user456&limit=50" \
  -H "Cookie: next-auth.session-token=..."
```

## JavaScript/TypeScript Client Example

```typescript
interface AuditEntry {
  id: string
  action: string
  entityType: 'INVOICE' | 'LINE_ITEM'
  entityId: string
  beforeState: any
  afterState: any
  userId: string
  userName: string | null
  createdAt: string
  thaiDate: string
  field?: string | null
  fieldName?: string
  oldValue?: string | null
  newValue?: string | null
  lineItem?: {
    id: string
    description: string
    lineNo: number
  } | null
  changeReason?: string | null
}

interface AuditResponse {
  success: boolean
  data: {
    entries: AuditEntry[]
    nextCursor: string | null
    totalEntries: number
    filters: {
      action: string | null
      entityType: string | null
      userId: string | null
      startDate: string | null
      endDate: string | null
    }
  }
}

async function fetchInvoiceAuditLog(
  invoiceId: string,
  params?: {
    action?: string
    entityType?: string
    userId?: string
    startDate?: string
    endDate?: string
    limit?: number
    cursor?: string
  }
): Promise<AuditResponse> {
  const queryParams = new URLSearchParams()

  if (params?.action) queryParams.append('action', params.action)
  if (params?.entityType) queryParams.append('entityType', params.entityType)
  if (params?.userId) queryParams.append('userId', params.userId)
  if (params?.startDate) queryParams.append('startDate', params.startDate)
  if (params?.endDate) queryParams.append('endDate', params.endDate)
  if (params?.limit) queryParams.append('limit', params.limit.toString())
  if (params?.cursor) queryParams.append('cursor', params.cursor)

  const response = await fetch(`/api/invoices/${invoiceId}/audit?${queryParams.toString()}`)
  return response.json()
}

// Usage
const auditData = await fetchInvoiceAuditLog('clm123', {
  action: 'UPDATED',
  entityType: 'LINE_ITEM',
  limit: 20
})

console.log(`Total entries: ${auditData.data.totalEntries}`)
auditData.data.entries.forEach(entry => {
  console.log(`[${entry.thaiDate}] ${entry.action}: ${entry.fieldName || entry.entityType}`)
})
```

## React Hook Example

```typescript
import { useState, useEffect } from 'react'

function useInvoiceAuditLog(invoiceId: string, filters = {}) {
  const [data, setData] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [totalEntries, setTotalEntries] = useState(0)

  const fetchAuditLog = async (cursor?: string) => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams({
        ...Object.entries(filters).reduce((acc, [key, value]) => {
          if (value) acc[key] = String(value)
          return acc
        }, {} as Record<string, string>),
        ...(cursor && { cursor })
      })

      const response = await fetch(`/api/invoices/${invoiceId}/audit?${queryParams}`)
      const result: AuditResponse = await response.json()

      if (result.success) {
        setData(result.data.entries)
        setNextCursor(result.data.nextCursor)
        setTotalEntries(result.data.totalEntries)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('Failed to fetch audit log')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAuditLog()
  }, [invoiceId, JSON.stringify(filters)])

  const loadMore = () => {
    if (nextCursor) {
      fetchAuditLog(nextCursor)
    }
  }

  return { data, loading, error, nextCursor, totalEntries, loadMore, refetch: () => fetchAuditLog() }
}

// Usage in component
function InvoiceAuditLog({ invoiceId }: { invoiceId: string }) {
  const { data, loading, error } = useInvoiceAuditLog(invoiceId, {
    action: 'UPDATED',
    limit: 20
  })

  if (loading) return <div>กำลังโหลด...</div>
  if (error) return <div>เกิดข้อผิดพลาด: {error}</div>

  return (
    <div>
      {data.map(entry => (
        <div key={entry.id}>
          <p>{entry.thaiDate} - {entry.action}</p>
          {entry.fieldName && <p>ฟิลด์: {entry.fieldName}</p>}
        </div>
      ))}
    </div>
  )
}
```

## Security Features

1. **IDOR Protection**: Users can only access audit logs for invoices they created (unless ADMIN)
2. **Authentication Required**: All requests must have a valid NextAuth session
3. **Input Validation**: All query parameters are validated and sanitized
4. **SQL Injection Prevention**: Uses Prisma ORM with parameterized queries
5. **Data Access Control**: Enforcement of role-based access control

## Performance Considerations

1. **Default Limit**: 50 entries per page to balance performance and usability
2. **Maximum Limit**: Capped at 100 entries per request
3. **Database Indexing**: Queries leverage existing indexes on `AuditLog` and `InvoiceLineItemAudit` models
4. **Cursor Pagination**: Efficient for large datasets, avoiding OFFSET performance issues
5. **Combined Queries**: Fetches both invoice and line item logs in parallel, then combines in memory

## Thai Date Formatting

All timestamps include a `thaiDate` field formatted as `DD/MM/YYYY` with Buddhist era (year + 543). For example:
- `2026-03-18` → `18/03/2569`
- `2025-12-31` → `31/12/2568`

## Testing

See `/e2e/critical-workflows.spec.ts` for E2E test coverage of audit log functionality.

## Related Files

- **API Route**: `/src/app/api/invoices/[id]/audit/route.ts`
- **Database Models**: `AuditLog`, `InvoiceLineItemAudit` (in `prisma/schema.prisma`)
- **UI Component**: `/src/components/invoices/audit-log.tsx`
- **Type Definitions**: See `AuditEntry` interface in the route file
- **Utility Functions**: `formatThaiDate` in `/src/lib/thai-accounting.ts`
