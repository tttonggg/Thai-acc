# Invoice Comments and Editing System - Integration Guide

## Overview

The invoice commenting and editing system has been successfully implemented with
the following features:

- **Comment System**: Add internal and external comments to invoices
- **Line Item Editing**: Edit invoice line items with audit trail
- **Audit Log**: Track all changes with before/after values
- **Permission Control**: Role-based access control

## Database Schema

### New Models

#### InvoiceComment

- Stores comments (internal and external)
- Links to invoices and users
- Timestamped for chronological tracking

#### InvoiceLineItemAudit

- Tracks all changes to line items
- Records before/after values
- Links to users who made changes

### API Endpoints

| Endpoint                            | Method | Description      |
| ----------------------------------- | ------ | ---------------- |
| `/api/invoices/[id]/comments`       | GET    | List comments    |
| `/api/invoices/[id]/comments`       | POST   | Add comment      |
| `/api/invoices/[id]/lines/[lineId]` | PUT    | Update line item |
| `/api/invoices/[id]/lines/[lineId]` | DELETE | Delete line item |
| `/api/invoices/[id]/audit`          | GET    | Get audit trail  |

## UI Components

### 1. CommentSection Component

**Location**: `/src/components/invoices/comment-section.tsx`

**Props**:

- `invoiceId`: string - The invoice ID
- `currentUser`: { id, name?, email, role } - Current user info

**Features**:

- Add comments (public or internal)
- View all comments with user info
- Internal comments visible only to ADMIN/ACCOUNTANT
- Thai date formatting
- Role badges

**Usage Example**:

```tsx
import { CommentSection } from '@/components/invoices/comment-section';

function InvoiceDetailPage({ invoice, user }) {
  return (
    <CommentSection
      invoiceId={invoice.id}
      currentUser={{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }}
    />
  );
}
```

### 2. LineItemEditor Component

**Location**: `/src/components/invoices/line-item-editor.tsx`

**Props**:

- `lineItem`: InvoiceLine - The line item to edit
- `products`: Product[] - List of products
- `onSave`: (totals: InvoiceTotals) => void - Callback after save
- `canEdit`: boolean - Whether editing is allowed

**Features**:

- Edit all line item fields
- Product selection dropdown
- Real-time total calculation
- Reason for change (optional)
- Only editable when invoice status is DRAFT

**Usage Example**:

```tsx
import { LineItemEditor } from '@/components/invoices/line-item-editor';

function InvoiceLineItemsTable({ invoice, products, user }) {
  const canEdit = invoice.status === 'DRAFT' && user.role !== 'VIEWER';

  const handleLineUpdate = (totals) => {
    // Refresh invoice data or update totals
    console.log('New totals:', totals);
  };

  return (
    <table>
      {invoice.lines.map((line) => (
        <tr key={line.id}>
          <td>{line.description}</td>
          <td>{line.quantity}</td>
          <td>
            <LineItemEditor
              lineItem={line}
              products={products}
              onSave={handleLineUpdate}
              canEdit={canEdit}
            />
          </td>
        </tr>
      ))}
    </table>
  );
}
```

### 3. AuditLog Component

**Location**: `/src/components/invoices/audit-log.tsx`

**Props**:

- `invoiceId`: string - The invoice ID

**Features**:

- Display audit trail for all line items
- Filter by action (CREATED, UPDATED, DELETED)
- Filter by field (description, quantity, etc.)
- Shows before/after values
- Thai date formatting

**Usage Example**:

```tsx
import { AuditLog } from '@/components/invoices/audit-log';

function InvoiceDetailPage({ invoice }) {
  return (
    <div className="space-y-4">
      <AuditLog invoiceId={invoice.id} />
    </div>
  );
}
```

## Complete Integration Example

Here's a complete example of how to integrate all components into an invoice
detail page:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { CommentSection } from '@/components/invoices/comment-section';
import { LineItemEditor } from '@/components/invoices/line-item-editor';
import { AuditLog } from '@/components/invoices/audit-log';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function InvoiceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { data: session } = useSession();
  const [invoice, setInvoice] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchInvoice();
      fetchProducts();
    }
  }, [params.id]);

  const fetchInvoice = async () => {
    try {
      const response = await fetch(`/api/invoices/${params.id}`);
      const result = await response.json();
      if (response.ok) {
        setInvoice(result.data);
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const result = await response.json();
      if (response.ok) {
        setProducts(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleLineUpdate = (totals: any) => {
    // Refresh invoice to get updated totals
    fetchInvoice();
  };

  const canEdit =
    invoice?.status === 'DRAFT' && session?.user?.role !== 'VIEWER';

  if (loading) {
    return <div>กำลังโหลด...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Invoice Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>ใบกำกับภาษี {invoice?.invoiceNo}</CardTitle>
            <Badge
              variant={invoice?.status === 'DRAFT' ? 'secondary' : 'default'}
            >
              {invoice?.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>{/* Invoice details */}</CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>รายการสินค้า/บริการ</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr>
                <th>รายการ</th>
                <th>จำนวน</th>
                <th>หน่วย</th>
                <th>ราคาต่อหน่วย</th>
                <th>จำนวนเงิน</th>
                <th>แก้ไข</th>
              </tr>
            </thead>
            <tbody>
              {invoice?.lines.map((line: any) => (
                <tr key={line.id}>
                  <td>{line.description}</td>
                  <td>{line.quantity}</td>
                  <td>{line.unit}</td>
                  <td>{(line.unitPrice / 100).toFixed(2)}</td>
                  <td>{(line.amount / 100).toFixed(2)}</td>
                  <td>
                    <LineItemEditor
                      lineItem={line}
                      products={products}
                      onSave={handleLineUpdate}
                      canEdit={canEdit}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Comments */}
      {session?.user && (
        <CommentSection
          invoiceId={params.id}
          currentUser={{
            id: session.user.id,
            name: session.user.name || undefined,
            email: session.user.email || '',
            role: session.user.role || 'USER',
          }}
        />
      )}

      {/* Audit Log */}
      <AuditLog invoiceId={params.id} />
    </div>
  );
}
```

## Permissions

| Role       | View Comments  | Add Comments | Edit Line Items               | View Audit        |
| ---------- | -------------- | ------------ | ----------------------------- | ----------------- |
| ADMIN      | ✅ All         | ✅           | ✅ (DRAFT only)               | ✅                |
| ACCOUNTANT | ✅ All         | ✅           | ✅ (DRAFT only)               | ✅                |
| USER       | ✅ Public only | ✅           | ✅ (Own invoices, DRAFT only) | ✅ (Own invoices) |
| VIEWER     | ✅ Public only | ❌           | ❌                            | ✅ (Own invoices) |

## Key Features

### 1. Security

- IDOR protection on all endpoints
- Role-based access control
- Internal comments only visible to authorized roles
- Cannot edit posted invoices (status !== DRAFT)

### 2. Audit Trail

- All changes tracked with before/after values
- User attribution (who changed what)
- Optional reason field for changes
- Chronological ordering with timestamps

### 3. Thai Language Support

- All UI text in Thai
- Thai date formatting
- Field names in Thai (รายการ, จำนวน, หน่วย, etc.)

### 4. Real-time Updates

- Invoice totals recalculated after line edits
- Comments appear immediately
- Audit log updates in real-time

## Database Migration

The database has been updated with:

- `InvoiceComment` table
- `InvoiceLineItemAudit` table
- Indexes for optimal query performance

## Testing Checklist

- [ ] Add public comment (visible to all)
- [ ] Add internal comment (ADMIN only)
- [ ] Edit line item with reason
- [ ] Delete line item
- [ ] View audit log filters
- [ ] Verify permissions by role
- [ ] Test with posted invoice (cannot edit)
- [ ] Test Thai date formatting
- [ ] Verify totals recalculation

## Future Enhancements

Possible improvements:

1. Email notifications for new comments
2. Attachment support for comments
3. Export audit log to PDF/Excel
4. Line item approval workflow
5. Bulk edit multiple line items
6. Version history (restore previous versions)
