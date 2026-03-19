# Invoice Commenting and Editing Feature - Test Report

**Test Date**: 2026-03-18
**Test Agent**: Claude Code
**Feature Status**: ❌ **NOT IMPLEMENTED**

---

## Executive Summary

**RESULT**: Feature does not exist in the codebase.

After comprehensive review of the Thai Accounting ERP System, **no invoice commenting or line-item editing feature with audit trail was found**. The system has general audit logging, but lacks dedicated:

- Comment threads on invoices
- Line-item editing with change tracking
- Visual audit trail UI
- Comment notifications
- Related documents linking

---

## What Was Reviewed

### 1. Database Schema (`prisma/schema.prisma`)

**Found:**
- `Invoice` model with `internalNotes` field (free text)
- `AuditLog` model (general system audit)
- `ActivityLog` model (general activity tracking)

**Missing:**
- ❌ `InvoiceComment` model
- ❌ `InvoiceLineEdit` model
- ❌ `InvoiceAuditEvent` model
- ❌ Comment threading/reply support
- ❌ Change tracking for line items
- ❌ Mention/user tagging system
- ❌ Related documents references

### 2. API Endpoints

**Found:**
- `/api/invoices` - CRUD operations with audit logging
- `/api/v2/invoices/[id]` - Enhanced API with field selection
- `/api/invoices/[id]/preview` - HTML preview generation
- `/api/invoices/[id]/issue` - Issue invoice
- `/api/invoices/[id]/void` - Void invoice

**Missing:**
- ❌ `/api/invoices/[id]/comments` - Add/list comments
- ❌ `/api/invoices/[id]/audit` - Get audit trail
- ❌ `/api/invoices/[id]/lines/[lineId]` - Edit line items
- ❌ `/api/invoices/[id]/related` - Get related documents
- ❌ Comment notification endpoints

### 3. UI Components

**Found:**
- `invoice-preview-dialog.tsx` - HTML preview with print/download
- `invoice-form.tsx` - Create/edit invoice form
- `invoice-list.tsx` - List view with filtering

**Missing:**
- ❌ Comment thread component
- ❌ Audit timeline component
- ❌ Line-item edit dialog
- ❌ Related documents panel
- ❌ Comment notifications UI
- ❌ Change history viewer

### 4. Business Logic

**Found:**
- General audit service (`audit-service.ts`)
- Logs CREATE/UPDATE/DELETE operations
- Tamper-evident hash chain
- State tracking (before/after)

**Missing:**
- ❌ Comment-specific business logic
- ❌ Line-item change detection
- ❌ Change approval workflows
- ❌ Comment resolution tracking

---

## Test Plan for Future Implementation

If this feature is to be implemented, here is the comprehensive test plan:

### Phase 1: Database Tests (Unit Tests)

```typescript
// File: test/invoices/comments.test.ts

describe('InvoiceComment Model', () => {
  test('should create comment on invoice', async () => {
    const comment = await prisma.invoiceComment.create({
      data: {
        invoiceId: 'test-invoice-id',
        userId: 'test-user-id',
        content: 'Please check the VAT calculation',
        mentions: ['user2@example.com'],
      }
    })
    expect(comment).toHaveProperty('id')
    expect(comment.content).toBe('Please check the VAT calculation')
  })

  test('should support comment threading', async () => {
    const parent = await createComment()
    const reply = await prisma.invoiceComment.create({
      data: {
        invoiceId: parent.invoiceId,
        userId: 'another-user',
        content: 'I agree with this point',
        parentId: parent.id,
      }
    })
    expect(reply.parentId).toBe(parent.id)
  })

  test('should prevent comments on cancelled invoices', async () => {
    const cancelledInvoice = await createCancelledInvoice()
    await expect(
      prisma.invoiceComment.create({
        data: {
          invoiceId: cancelledInvoice.id,
          userId: 'user',
          content: 'Test',
        }
      })
    ).rejects.toThrow()
  })
})

describe('InvoiceLineEdit Model', () => {
  test('should track line item changes', async () => {
    const edit = await prisma.invoiceLineEdit.create({
      data: {
        invoiceId: 'inv-id',
        lineId: 'line-id',
        userId: 'user-id',
        field: 'quantity',
        oldValue: 1,
        newValue: 5,
        reason: 'Customer requested change',
      }
    })
    expect(edit.field).toBe('quantity')
    expect(edit.oldValue).toBe(1)
    expect(edit.newValue).toBe(5)
  })

  test('should track multiple field changes', async () => {
    const edit = await prisma.invoiceLineEdit.create({
      data: {
        invoiceId: 'inv-id',
        lineId: 'line-id',
        userId: 'user-id',
        field: 'unitPrice',
        oldValue: 1000,
        newValue: 1200,
        reason: 'Price adjustment',
        changedFields: ['unitPrice', 'vatRate'],
      }
    })
    expect(edit.changedFields).toContain('unitPrice')
    expect(edit.changedFields).toContain('vatRate')
  })
})
```

### Phase 2: API Tests (Integration Tests)

```typescript
// File: test/api/invoices/comments-api.test.ts

describe('POST /api/invoices/[id]/comments', () => {
  test('should add comment to draft invoice', async () => {
    const response = await fetch('/api/invoices/draft-id/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        content: 'กรุณาตรวจสอบยอด VAT (Please check VAT amount)',
        mentions: ['accountant@example.com'],
      }),
    })
    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.content).toContain('VAT')
  })

  test('should support Thai language comments', async () => {
    const response = await fetch('/api/invoices/inv-id/comments', {
      method: 'POST',
      body: JSON.stringify({
        content: 'ลูกค้าต้องการเปลี่ยนวันที่ใบกำกับภาษี',
      }),
    })
    const data = await response.json()
    expect(data.data.content).toMatch(/ลูกค้า|วันที่|ใบกำกับภาษี/)
  })

  test('should validate comment length', async () => {
    const longComment = 'x'.repeat(5001) // Max 5000 chars
    const response = await fetch('/api/invoices/inv-id/comments', {
      method: 'POST',
      body: JSON.stringify({ content: longComment }),
    })
    expect(response.status).toBe(400)
  })

  test('should notify mentioned users', async () => {
    const response = await fetch('/api/invoices/inv-id/comments', {
      method: 'POST',
      body: JSON.stringify({
        content: '@accountant@example.com please review',
        mentions: ['accountant@example.com'],
      }),
    })
    // Check notification was created
    const notifications = await prisma.notification.findMany({
      where: { userId: 'accountant-id', type: 'COMMENT_MENTION' }
    })
    expect(notifications.length).toBeGreaterThan(0)
  })
})

describe('PUT /api/invoices/[id]/lines/[lineId]', () => {
  test('should edit line item in draft invoice', async () => {
    const response = await fetch('/api/invoices/inv-id/lines/line-1', {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        quantity: 10,
        unitPrice: 1500,
        reason: 'Customer ordered additional units',
      }),
    })
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.data.quantity).toBe(10)
  })

  test('should recalculate totals after line edit', async () => {
    const beforeInvoice = await getInvoice('inv-id')
    const response = await fetch('/api/invoices/inv-id/lines/line-1', {
      method: 'PUT',
      body: JSON.stringify({ unitPrice: 2000 }),
    })
    const afterInvoice = await getInvoice('inv-id')
    expect(afterInvoice.totalAmount).not.toBe(beforeInvoice.totalAmount)
    expect(afterInvoice.subtotal).toBeGreaterThan(beforeInvoice.subtotal)
  })

  test('should prevent edits to posted invoices', async () => {
    const postedInvoice = await createPostedInvoice()
    const response = await fetch(`/api/invoices/${postedInvoice.id}/lines/line-1`, {
      method: 'PUT',
      body: JSON.stringify({ quantity: 5 }),
    })
    expect(response.status).toBe(403)
    expect(await response.json()).toMatchObject({
      error: /Cannot edit posted invoice/
    })
  })
})

describe('GET /api/invoices/[id]/audit', () => {
  test('should return complete audit trail', async () => {
    const response = await fetch('/api/invoices/inv-id/audit')
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.data).toBeInstanceOf(Array)
    expect(data.data.length).toBeGreaterThan(0)
  })

  test('should include comments in audit trail', async () => {
    await addComment('inv-id', 'Test comment')
    const response = await fetch('/api/invoices/inv-id/audit')
    const data = await response.json()
    const commentEvents = data.data.filter((e: any) => e.type === 'COMMENT')
    expect(commentEvents.length).toBeGreaterThan(0)
  })

  test('should include line edits in audit trail', async () => {
    await editLine('inv-id', 'line-1', { quantity: 5 })
    const response = await fetch('/api/invoices/inv-id/audit')
    const data = await response.json()
    const editEvents = data.data.filter((e: any) => e.type === 'LINE_EDIT')
    expect(editEvents.length).toBeGreaterThan(0)
  })
})
```

### Phase 3: E2E Tests (Playwright)

```typescript
// File: e2e/invoices/commenting-editing.spec.ts

import { test, expect } from '@playwright/test'

test.describe('Invoice Commenting Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Login as accountant
    await page.goto('http://localhost:3000')
    await page.fill('input[name="email"]', 'accountant@thaiaccounting.com')
    await page.fill('input[name="password"]', 'acc123')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard')
  })

  test('should add comment to draft invoice', async ({ page }) => {
    await page.goto('http://localhost:3000/invoices')
    await page.click('text=INV-202603') // Click first invoice
    await page.waitForSelector('[data-testid="invoice-detail"]')

    // Scroll to comments section
    await page.click('[data-testid="comments-tab"]')

    // Add comment
    await page.fill('[data-testid="comment-input"]', 'กรุณาตรวจสอบ VAT 7%')
    await page.click('[data-testid="submit-comment"]')

    // Verify comment appears
    await expect(page.locator('text=กรุณาตรวจสอบ VAT 7%')).toBeVisible()
    await expect(page.locator('text=accountant@thaiaccounting.com')).toBeVisible()
  })

  test('should display Thai language correctly', async ({ page }) => {
    await page.goto('http://localhost:3000/invoices/inv-001')
    await page.click('[data-testid="comments-tab"]')

    await page.fill('[data-testid="comment-input"]', 'ลูกค้าขอเปลี่ยนวันครบกำหนด')
    await page.click('[data-testid="submit-comment"]')

    // Verify Thai text renders correctly (not as mojibake)
    const comment = page.locator('text=ลูกค้าขอเปลี่ยนวันครบกำหนด')
    await expect(comment).toBeVisible()

    // Check font supports Thai
    const fontFamily = await comment.evaluate(el =>
      window.getComputedStyle(el).fontFamily
    )
    expect(fontFamily).toMatch(/Sarabun|Prompt|Kanit|Thai/)
  })

  test('should support comment replies', async ({ page }) => {
    await page.goto('http://localhost:3000/invoices/inv-001')
    await page.click('[data-testid="comments-tab"]')

    // Add parent comment
    await page.fill('[data-testid="comment-input"]', 'Parent comment')
    await page.click('[data-testid="submit-comment"]')

    // Click reply button
    await page.click('[data-testid="reply-button"]')
    await page.fill('[data-testid="reply-input"]', 'Reply comment')
    await page.click('[data-testid="submit-reply"]')

    // Verify thread structure
    await expect(page.locator('.comment-thread .comment-reply')).toHaveCount(1)
  })

  test('should notify mentioned users', async ({ page, context }) => {
    await page.goto('http://localhost:3000/invoices/inv-001')
    await page.click('[data-testid="comments-tab"]')

    // Mention another user
    await page.fill('[data-testid="comment-input"]', '@admin@thaiaccounting.com please approve')
    await page.click('[data-testid="submit-comment"]')

    // Verify notification was sent (check database or API)
    const notifications = await fetchNotifications('admin-id')
    expect(notifications.some(n => n.type === 'COMMENT_MENTION')).toBe(true)
  })
})

test.describe('Invoice Line Item Editing', () => {
  test('should edit line item in draft invoice', async ({ page }) => {
    await page.goto('http://localhost:3000/invoices/draft-001')
    await page.click('[data-testid="edit-mode"]')

    // Click edit on first line item
    await page.click('[data-testid="line-item-1"] [data-testid="edit-button"]')

    // Update quantity
    await page.fill('[data-testid="line-quantity"]', '10')
    await page.fill('[data-testid="edit-reason"]', 'Customer requested change')

    // Save changes
    await page.click('[data-testid="save-line-edit"]')

    // Verify update
    await expect(page.locator('[data-testid="line-quantity"]')).toHaveValue('10')
  })

  test('should recalculate totals after line edit', async ({ page }) => {
    await page.goto('http://localhost:3000/invoices/draft-001')

    const beforeTotal = await page.textContent('[data-testid="invoice-total"]')
    const beforeTotalNum = parseFloat(beforeTotal?.replace(/[^0-9.]/g, '') || '0')

    await page.click('[data-testid="line-item-1"] [data-testid="edit-button"]')
    await page.fill('[data-testid="line-quantity"]', '20')
    await page.click('[data-testid="save-line-edit"]')

    const afterTotal = await page.textContent('[data-testid="invoice-total"]')
    const afterTotalNum = parseFloat(afterTotal?.replace(/[^0-9.]/g, '') || '0')

    expect(afterTotalNum).toBeGreaterThan(beforeTotalNum)
  })

  test('should prevent edits to posted invoices', async ({ page }) => {
    await page.goto('http://localhost:3000/invoices/posted-001')

    // Edit button should be disabled or hidden
    const editButton = page.locator('[data-testid="edit-mode"]')
    await expect(editButton).toBeDisabled()
  })
})

test.describe('Audit Trail Display', () => {
  test('should display complete audit timeline', async ({ page }) => {
    await page.goto('http://localhost:3000/invoices/inv-001')
    await page.click('[data-testid="audit-tab"]')

    // Check audit events are displayed
    await expect(page.locator('[data-testid="audit-event"]')).toHaveCount(3) // Create, Edit, Comment

    // Verify events are in chronological order
    const events = page.locator('[data-testid="audit-event"]')
    const firstEvent = await events.first().textContent()
    const lastEvent = await events.last().textContent()
    expect(firstEvent).toContain('Created')
    expect(lastEvent).toContain('Comment')
  })

  test('should show before/after values for edits', async ({ page }) => {
    await page.goto('http://localhost:3000/invoices/inv-001')
    await page.click('[data-testid="audit-tab"]')

    // Click on edit event to see details
    await page.click('[data-testid="audit-event"][data-type="LINE_EDIT"]')

    // Verify change details
    await expect(page.locator('[data-testid="change-field"]')).toContainText('quantity')
    await expect(page.locator('[data-testid="old-value"]')).toContainText('1')
    await expect(page.locator('[data-testid="new-value"]')).toContainText('5')
  })

  test('should export audit trail', async ({ page }) => {
    await page.goto('http://localhost:3000/invoices/inv-001')
    await page.click('[data-testid="audit-tab"]')

    // Click export button
    const downloadPromise = page.waitForEvent('download')
    await page.click('[data-testid="export-audit"]')
    const download = await downloadPromise

    expect(download.suggestedFilename()).toMatch(/audit.*\.pdf|audit.*\.xlsx/)
  })
})

test.describe('Related Documents', () => {
  test('should show related receipts and credit notes', async ({ page }) => {
    await page.goto('http://localhost:3000/invoices/inv-001')
    await page.click('[data-testid="related-tab"]')

    // Should show receipt allocations
    await expect(page.locator('[data-testid="related-receipt"]')).toBeVisible()

    // Should show credit notes
    await expect(page.locator('[data-testid="related-cn"]')).toBeVisible()
  })

  test('should navigate to related documents', async ({ page }) => {
    await page.goto('http://localhost:3000/invoices/inv-001')
    await page.click('[data-testid="related-tab"]')

    // Click on related receipt
    await page.click('[data-testid="related-receipt"]')

    // Should navigate to receipt detail
    await expect(page).toHaveURL(/\/receipts\/RC-/)
  })
})

test.describe('Mobile Responsiveness', () => {
  test('should work on mobile devices', async ({ page, viewport }) => {
    await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE
    await page.goto('http://localhost:3000/invoices/inv-001')

    // Comments section should be accessible
    await page.click('[data-testid="comments-tab"]')
    await expect(page.locator('[data-testid="comment-input"]')).toBeVisible()

    // Audit trail should be scrollable
    await page.click('[data-testid="audit-tab"]')
    await expect(page.locator('[data-testid="audit-event"]')).toBeVisible()
  })
})
```

### Phase 4: Manual Testing Checklist

```markdown
## Manual Test Cases

### Comment Adding
- [ ] Add comment to draft invoice
- [ ] Add comment to issued invoice
- [ ] Add comment with Thai text
- [ ] Add comment with English text
- [ ] Add comment with mixed Thai/English
- [ ] Add comment with mentions (@user)
- [ ] Add comment with attachments (if supported)
- [ ] Add comment longer than 1000 characters
- [ ] Try to add comment to cancelled invoice (should fail)
- [ ] Try to add empty comment (should fail)

### Comment Threading
- [ ] Reply to existing comment
- [ ] Reply to reply (nested threading)
- [ ] Delete own comment
- [ ] Delete comment with replies (cascade delete?)
- [ ] Edit own comment
- [ ] Resolve comment thread
- [ ] Mark comment as important/pinned

### Line Item Editing
- [ ] Edit quantity
- [ ] Edit unit price
- [ ] Edit description
- [ ] Edit VAT rate
- [ ] Edit discount
- [ ] Provide reason for edit
- [ ] Cancel edit operation
- [ ] Try to edit posted invoice (should fail)
- [ ] Try to edit paid invoice (should fail)
- [ ] Bulk edit multiple line items

### Audit Trail
- [ ] View complete audit history
- [ ] Filter by event type (create, edit, comment)
- [ ] Filter by date range
- [ ] Filter by user
- [ ] Export audit trail to PDF
- [ ] Export audit trail to Excel
- [ ] Search audit trail
- [ ] View before/after values
- [ ] Restore previous version (if supported)

### Related Documents
- [ ] View linked receipts
- [ ] View linked credit notes
- [ ] View linked journal entries
- [ ] Navigate to related document
- [ ] Link existing document to invoice
- [ ] Unlink document

### Notifications
- [ ] Receive notification when mentioned
- [ ] Receive notification on invoice comment
- [ ] Receive notification on line edit
- [ ] Mark notification as read
- [ ] Notification count badge
- [ ] Email notifications (if configured)

### Thai Language Support
- [ ] Thai labels display correctly
- [ ] Thai text input works
- [ ] Thai text renders without mojibake
- [ ] Thai font is used (Sarabun/Prompt/Kanit)
- [ ] Thai date formatting (พ.ศ.)
- [ ] Thai currency formatting (฿)

### Mobile Responsiveness
- [ ] Comments work on mobile
- [ ] Audit trail scrollable on mobile
- [ ] Line edit dialog fits mobile screen
- [ ] Touch targets are large enough (44px)
- [ ] Responsive tables for line items

### Performance
- [ ] Comments load within 1 second
- [ ] Audit trail loads within 2 seconds
- [ ] Line edit saves within 500ms
- [ ] Search within 100 results is instant
- [ ] Pagination works smoothly
```

---

## Implementation Recommendations

### 1. Database Schema

```prisma
// Add to schema.prisma

model InvoiceComment {
  id          String          @id @default(cuid())
  invoiceId   String
  invoice     Invoice         @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  parentId    String?
  parent      InvoiceComment? @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies     InvoiceComment[] @relation("CommentReplies")
  userId      String
  user        User            @relation(fields: [userId], references: [id])
  content     String          @db.Text
  mentions    String[]        // Email addresses of mentioned users
  isResolved  Boolean         @default(false)
  isPinned    Boolean         @default(false)
  metadata    Json?
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  @@index([invoiceId])
  @@index([userId])
  @@index([parentId])
  @@index([createdAt])
}

model InvoiceLineEdit {
  id            String   @id @default(cuid())
  invoiceId     String
  invoice       Invoice  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  lineId        String
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  field         String   // quantity, unitPrice, description, etc.
  oldValue      Json
  newValue      Json
  changedFields String[] // For multi-field edits
  reason        String?  @db.Text
  metadata      Json?
  createdAt     DateTime @default(now())

  @@index([invoiceId])
  @@index([lineId])
  @@index([userId])
  @@index([createdAt])
}
```

### 2. API Endpoints to Create

```
POST   /api/invoices/[id]/comments          - Add comment
GET    /api/invoices/[id]/comments          - List comments
PUT    /api/invoices/[id]/comments/[cid]    - Update comment
DELETE /api/invoices/[id]/comments/[cid]    - Delete comment

PUT    /api/invoices/[id]/lines/[lineId]    - Edit line item
GET    /api/invoices/[id]/audit             - Get audit trail
GET    /api/invoices/[id]/related           - Get related documents

POST   /api/invoices/[id]/comments/[cid]/resolve  - Resolve comment
POST   /api/invoices/[id]/comments/[cid]/pin      - Pin comment
```

### 3. UI Components to Create

```
src/components/invoices/
  ├── invoice-comments-tab.tsx      - Comments section
  ├── comment-thread.tsx             - Comment thread component
  ├── comment-form.tsx               - Add/edit comment form
  ├── invoice-audit-tab.tsx          - Audit timeline
  ├── audit-timeline.tsx             - Timeline component
  ├── audit-event-card.tsx           - Single event display
  ├── line-edit-dialog.tsx           - Line item edit dialog
  └── related-documents-tab.tsx      - Related documents panel
```

### 4. Priority Implementation Order

**Phase 1** (High Priority - Core Features):
1. InvoiceComment model + migrations
2. POST/GET `/api/invoices/[id]/comments`
3. Basic comment UI component
4. Comment notification emails

**Phase 2** (Medium Priority - Enhanced Features):
1. InvoiceLineEdit model
2. PUT `/api/invoices/[id]/lines/[lineId]`
3. Audit trail API and UI
4. Comment threading/replies

**Phase 3** (Low Priority - Nice to Have):
1. Related documents panel
2. Comment resolution workflow
3. Advanced audit filtering
4. Audit trail export

---

## Conclusion

**Status**: ❌ **FEATURE NOT IMPLEMENTED**

The Thai Accounting ERP System currently lacks invoice commenting and line-item editing features. The existing audit logging system provides basic tracking of CREATE/UPDATE/DELETE operations, but does not support:

- User-facing comment threads
- Line-item change tracking with reasons
- Visual audit timeline
- Comment notifications
- Related documents linking

**Recommendation**: Implement this feature following the test plan and schema recommendations provided above. This would significantly improve collaboration and auditability for accounting teams.

**Estimated Implementation Effort**:
- Database: 4 hours
- API: 8 hours
- UI Components: 16 hours
- Testing: 12 hours
- **Total: ~40 hours (1 week)**

---

**Report Generated**: 2026-03-18
**Test Agent**: Claude Code (Sonnet 4.5)
