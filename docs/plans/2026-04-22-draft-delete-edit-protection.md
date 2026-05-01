# DRAFT Delete/Edit Protection Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement
> task-by-task. **Dev Cycle:** /spec → /plan → /build → /test → /review →
> /code-simplify → /ship

**Goal:** Add permission-based DRAFT delete/edit protection across all document
types. Only DRAFT documents can be deleted or edited, and only by their creator
or ADMIN.

**Architecture:**

- API layer: validate status + ownership before any mutation (PUT/DELETE)
- Prisma: all models already have `deletedAt` for soft-delete
- UI layer: conditionally render edit/delete buttons based on status + role +
  ownership
- Permission helpers: `requireAuth()` returns user with id/role; compare
  `createdById === user.id`

**Scope — 11 document types:** | Document | Status Field | Has DRAFT? | DELETE
endpoint | |----------|-------------|-----------|-----------------| | Invoice |
InvoiceStatus | ✅ DRAFT | stub (needs impl) | | Receipt | ReceiptStatus | ✅
DRAFT | stub (needs impl) | | PurchaseInvoice | PurchaseInvoiceStatus | ? | stub
(needs impl) | | PurchaseOrder | OrderStatus | ✅ DRAFT | stub (needs impl) | |
CreditNote | CreditNoteStatus | ❌ no DRAFT | stub (needs impl) | | DebitNote |
DebitNoteStatus | ❌ no DRAFT | stub (needs impl) | | Quotation | OrderStatus |
✅ DRAFT | stub (needs impl) | | GoodsReceiptNote | GoodsReceiptStatus | ? |
stub (needs impl) | | Payment | PaymentStatus | ? | stub (needs impl) | | Asset
| AssetStatus | ? | stub (needs impl) | | Employee | EmployeeStatus | ? | stub
(needs impl) |

**Permission rules:**

1. **DRAFT only** — non-DRAFT → return 400 "เอกสารออกแล้วไม่สามารถแก้ไข/ลบได้"
2. **Creator OR ADMIN** — check
   `createdById === user.id || user.role === "ADMIN"`
3. **Non-creator/non-admin** → return 403 "ไม่มีสิทธิ์"
4. **Soft-delete** — set `deletedAt = new Date()`, don't hard-delete
5. **Also fix edit (PUT)** — currently all stubs need real implementation

---

## Phase A: Fix 5 Invoice Sub-Route Import Errors (prevent 500)

These are causing 500 errors on invoice detail page tabs (audit, comments,
related).

### Task A1: Fix `[id]/comments/route.ts` missing imports

**Objective:** Add missing NextRequest import + api-utils imports

**File:** `src/app/api/invoices/[id]/comments/route.ts`

**Step 1: Verify current imports (lines 1-16)**

```bash
head -16 src/app/api/invoices/[id]/comments/route.ts
```

**Step 2: Add missing imports**

```typescript
// Already added via previous patch, verify:
import {
  requireAuth,
  apiResponse,
  apiError,
  notFoundError,
  unauthorizedError,
} from '@/lib/api-utils';
```

**Step 3: Also add getClientIp — verify if used**

```bash
grep -n "getClientIp" src/app/api/invoices/[id]/comments/route.ts
```

If used but not imported, add to import block:

```typescript
import { getClientIp } from '@/lib/api-utils';
```

---

### Task A2: Fix `[id]/related/route.ts` missing `forbiddenError` import

**Objective:** Add missing forbiddenError import

**File:** `src/app/api/invoices/[id]/related/route.ts`

**Step 1: Verify current imports**

```bash
head -15 src/app/api/invoices/[id]/related/route.ts
```

**Step 2: Already patched — verify forbiddenError is in import block** The patch
already added `forbiddenError` to the import. Verify:

```bash
grep -n "forbiddenError" src/app/api/invoices/[id]/related/route.ts | head -5
```

If missing, add to existing import block:

```typescript
import {
  apiResponse,
  apiError,
  notFoundError,
  unauthorizedError,
  requireAuth,
  forbiddenError,
} from '@/lib/api-utils';
```

---

### Task A3: Fix `[id]/comments/[commentId]/route.ts` missing imports

**Objective:** Add missing imports (requireAuth, apiResponse, apiError, etc.)

**File:** `src/app/api/invoices/[id]/comments/[commentId]/route.ts`

**Step 1: Verify current imports (should now include api-utils)**

```bash
head -14 src/app/api/invoices/[id]/comments/[commentId]/route.ts
```

Previously added — verify `requireAuth`, `apiResponse`, `apiError`,
`notFoundError`, `unauthorizedError` are in the import block. If not, add:

```typescript
import {
  requireAuth,
  apiResponse,
  apiError,
  notFoundError,
  unauthorizedError,
} from '@/lib/api-utils';
```

---

### Task A4: Audit remaining `/api/invoices/[id]/` routes for missing imports

**Objective:** Find ALL routes in `/api/invoices/[id]/` that use but don't
import `requireAuth`/api-utils functions

**Files to check:**

```bash
for f in src/app/api/invoices/[id]/*/route.ts; do
  echo "=== $f ==="
  grep -n "^import.*api-utils" "$f" || echo "NO API-UTILS IMPORT"
  grep -n "requireAuth\|apiResponse\|apiError\|notFoundError\|unauthorizedError\|forbiddenError" "$f" | grep -v "^.*import\|^.*\/\/" | head -3
done
```

**Fix any that are missing imports** using the same pattern as Task A3.

---

### Task A5: Audit ALL other `/api/*/` routes for missing imports (systematic sweep)

**Objective:** Find all route files across the entire `/api/` tree that call but
don't import api-utils functions

**Run this to find ALL candidates:**

```bash
cd /Users/tong/Desktop/Thai-acc-sandbox
for f in $(find src/app/api -name "route.ts" | grep -v "\[id\]"); do
  imports=$(grep -c "^import.*api-utils" "$f" || echo 0)
  uses=$(grep -c "requireAuth\|requireRole\|apiResponse\|apiError\|notFoundError\|unauthorizedError\|forbiddenError" "$f" || echo 0)
  if [ "$uses" -gt 0 ] && [ "$imports" -eq 0 ]; then
    echo "MISSING: $f (uses=$uses, imports=$imports)"
  fi
done
```

Also check all `[id]/route.ts` files:

```bash
for f in $(find src/app/api -path "*/\[id\]/route.ts"); do
  imports=$(grep -c "^import.*api-utils" "$f" || echo 0)
  uses=$(grep -c "requireAuth\|requireRole\|apiResponse\|apiError\|notFoundError\|unauthorizedError\|forbiddenError" "$f" || echo 0)
  if [ "$uses" -gt 0 ] && [ "$imports" -eq 0 ]; then
    echo "MISSING: $f (uses=$uses, imports=$imports)"
  fi
done
```

**Fix each file** by adding the missing imports to the top of the file.

---

## Phase B: Implement DELETE — Soft-Delete with DRAFT+Owner/Admin Check

For each document type, implement real DELETE that:

1. `requireAuth()` → get user
2. `db.[Model].findUnique({ where: { id } })` → check exists + get status +
   createdById
3. If not DRAFT → return 400
4. If createdById !== user.id AND user.role !== "ADMIN" → return 403
5. `db.[Model].update({ where: { id }, data: { deletedAt: new Date() } })` →
   soft delete
6. Cascade soft-delete to child records (lines, etc.) if they have `deletedAt`

### Task B1: Invoice DELETE — implement soft-delete

**File:** `src/app/api/invoices/[id]/route.ts`

**Step 1: Read current DELETE (line 108+)**

```typescript
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Basic DELETE implementation
  return apiResponse({ message: 'DELETE endpoint working' });
}
```

**Step 2: Replace DELETE with full implementation**

```typescript
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const invoice = await db.invoice.findUnique({
      where: { id },
      select: { id: true, status: true, createdById: true },
    });

    if (!invoice) {
      return notFoundError('ไม่พบใบกำกับภาษี');
    }

    // Only DRAFT can be deleted
    if (invoice.status !== 'DRAFT') {
      return apiError('เอกสารออกแล้วไม่สามารถลบได้ กรุณาใช้ยกเลิกแทน', 400);
    }

    // Only creator or ADMIN can delete
    if (invoice.createdById !== user.id && user.role !== 'ADMIN') {
      return forbiddenError();
    }

    // Soft delete invoice
    await db.invoice.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Soft delete lines
    await db.invoiceLine.updateMany({
      where: { invoiceId: id },
      data: { deletedAt: new Date() },
    });

    return apiResponse({ success: true, message: 'ลบใบกำกับภาษีเรียบร้อย' });
  } catch (error) {
    if (error instanceof AuthError) return unauthorizedError();
    console.error('Invoice DELETE error:', error);
    return apiError('เกิดข้อผิดพลาดในการลบใบกำกับภาษี', 500);
  }
}
```

**Step 3: Add AuthError to imports if not present**

```bash
grep -n "AuthError" src/app/api/invoices/\[id\]/route.ts
```

**Step 4: Test — list DRAFT invoices**

```bash
curl -s http://localhost:3002/api/invoices?status=DRAFT | python3 -m json.tool | head -30
```

---

### Task B2: Receipt DELETE — implement soft-delete

**File:** `src/app/api/receipts/[id]/route.ts`

**Step 1: Check current DELETE stub**

```bash
sed -n '220,240p' src/app/api/receipts/route.ts
```

**Step 2: Also check if [id]/route.ts exists**

```bash
ls src/app/api/receipts/[id]/
```

**Step 3: Read receipt model status enum for DRAFT check** Receipt status:
DRAFT, POSTED, CANCELLED. Implement same pattern as B1.

---

### Task B3-Task B11: Implement DELETE for remaining 10 document types

Pattern: same as Task B1 — soft-delete, DRAFT-only, creator/ADMIN check.

Document → route file to modify: | # | Document | DELETE Route |
|---|----------|-------------| | B3 | PurchaseInvoice |
`src/app/api/purchases/[id]/route.ts` | | B4 | PurchaseOrder |
`src/app/api/purchase-orders/[id]/route.ts` | | B5 | CreditNote |
`src/app/api/credit-notes/[id]/route.ts` | | B6 | DebitNote |
`src/app/api/debit-notes/[id]/route.ts` | | B7 | Quotation |
`src/app/api/quotations/[id]/route.ts` | | B8 | GoodsReceiptNote |
`src/app/api/goods-receipt-notes/[id]/route.ts` | | B9 | Payment |
`src/app/api/payments/[id]/route.ts` | | B10 | Asset |
`src/app/api/assets/[id]/route.ts` | | B11 | Employee |
`src/app/api/employees/[id]/route.ts` |

For each: check `enum XxxStatus` in schema.prisma to know which statuses allow
delete. For CreditNote/DebitNote — no DRAFT status, so check
`status !== "ISSUED"` (only CANCELLED can be deleted, since ISSUED means it's
out there).

---

## Phase C: Implement PUT Edit — DRAFT+Owner/Admin Check

For Invoice PUT, replace the stub with full implementation:

- Same status/permission checks as DELETE
- Validate input with existing schema
- Update fields
- Cascade to lines

### Task C1: Invoice PUT — implement full edit

**File:** `src/app/api/invoices/[id]/route.ts`

**Step 1: Read current PUT stub (line 99-106)**

```typescript
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Basic PUT implementation
  return apiResponse({ message: 'PUT endpoint working' });
}
```

**Step 2: Replace with full implementation**

```typescript
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const invoice = await db.invoice.findUnique({
      where: { id },
      select: { id: true, status: true, createdById: true },
    });

    if (!invoice) {
      return notFoundError('ไม่พบใบกำกับภาษี');
    }

    if (invoice.status !== 'DRAFT') {
      return apiError('เอกสารออกแล้วไม่สามารถแก้ไขได้', 400);
    }

    if (invoice.createdById !== user.id && user.role !== 'ADMIN') {
      return forbiddenError();
    }

    const body = await request.json();
    const validated = invoiceUpdateSchema.parse(body);

    const updated = await db.invoice.update({
      where: { id },
      data: {
        invoiceDate: validated.invoiceDate
          ? new Date(validated.invoiceDate)
          : undefined,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : undefined,
        customerId: validated.customerId,
        reference: validated.reference,
        notes: validated.notes,
        internalNotes: validated.internalNotes,
      },
    });

    return apiResponse(updated);
  } catch (error) {
    if (error instanceof AuthError) return unauthorizedError();
    console.error('Invoice PUT error:', error);
    return apiError('เกิดข้อผิดพลาดในการแก้ไขใบกำกับภาษี', 500);
  }
}
```

**Note:** If `invoiceUpdateSchema` doesn't exist in validations, create a
minimal one or skip schema validation for now and update fields directly.

---

## Phase D: UI — Add Delete Button (DRAFT only, creator/ADMIN)

### Task D1: Add delete button to InvoiceList

**File:** `src/components/invoices/invoice-list.tsx`

**Step 1: Read current invoice list to find where action buttons are rendered**

```bash
grep -n "DRAFT\|ISSUED\|delete\|edit\|onClick\|action" src/components/invoices/invoice-list.tsx | head -40
```

**Step 2: Find the row/button area**

```bash
grep -n "Button\|onEdit\|onDelete\|row\|tr " src/components/invoices/invoice-list.tsx | head -30
```

**Step 3: Add conditional delete button** After the "ออก" (issue) button, add:

```typescript
{(invoice.status === "DRAFT" && (user.id === invoice.createdById || user.role === "ADMIN")) && (
  <Button
    variant="destructive"
    size="sm"
    onClick={() => onDelete(invoice.id)}
  >
    ลบ
  </Button>
)}
```

**Step 4: Add onDelete handler to the component**

```typescript
const handleDelete = async (id: string) => {
  if (!confirm('ต้องการลบใบกำกับภาษีนี้?')) return;
  const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
  if (res.ok) {
    queryClient.invalidateQueries({ queryKey: ['invoices'] });
    toast({ title: 'ลบเรียบร้อย' });
  } else {
    const data = await res.json();
    toast({
      title: 'ไม่สามารถลบได้',
      description: data.error,
      variant: 'destructive',
    });
  }
};
```

**Step 5: Pass user from session to the component**

---

### Task D2-Task D12: Add delete button to remaining 10 document lists

Apply same pattern as D1 to: | # | Document | List Component |
|---|----------|----------------| | D2 | Receipt |
`src/components/receipts/receipt-list.tsx` | | D3 | PurchaseInvoice |
`src/components/purchases/purchase-list.tsx` | | D4 | PurchaseOrder |
`src/components/purchase-orders/purchase-order-list.tsx` | | D5 | CreditNote |
`src/components/credit-notes/credit-note-list.tsx` | | D6 | DebitNote |
`src/components/debit-notes/debit-note-list.tsx` | | D7 | Quotation |
`src/components/quotations/quotation-list.tsx` | | D8 | GoodsReceiptNote |
`src/components/goods-receipt-notes/grn-list.tsx` | | D9 | Payment |
`src/components/payments/payment-list.tsx` | | D10 | Asset |
`src/components/assets/asset-list.tsx` | | D11 | Employee |
`src/components/employees/employee-list.tsx` | | D12 | PettyCash |
`src/components/petty-cash/petty-cash-list.tsx` |

---

## Phase E: UI — Lock Edit for ISSUED/Posted Documents

### Task E1: Invoice — hide/disable edit button for non-DRAFT

**File:** `src/components/invoices/invoice-list.tsx`

Find the "แก้ไข" button and wrap it:

```typescript
{invoice.status === "DRAFT" && (
  <Button variant="outline" size="sm" onClick={() => onEdit(invoice.id)}>
    แก้ไข
  </Button>
)}
```

### Task E2-E12: Apply to remaining 10 document lists

Same pattern as E1 for each document list component.

---

## Phase F: Write Tests

### Task F1: Test Invoice DELETE — DRAFT success, ISSUED fail, non-creator fail

**File:** `tests/invoices.test.ts` or create if doesn't exist

```typescript
describe('Invoice DELETE', () => {
  it('deletes DRAFT invoice by creator', async () => {
    // Create DRAFT invoice, then DELETE it
    // Expect 200 + deletedAt is set
  });

  it('rejects DELETE of ISSUED invoice', async () => {
    // Try to delete ISSUED invoice
    // Expect 400 "เอกสารออกแล้วไม่สามารถลบได้"
  });

  it('rejects DELETE by non-creator non-ADMIN', async () => {
    // Create invoice as user A, try to delete as user B
    // Expect 403
  });

  it('allows ADMIN to delete any DRAFT invoice', async () => {
    // Create as user A, delete as ADMIN
    // Expect 200
  });
});
```

### Task F2: Write tests for remaining document types

Same pattern as F1 for: Receipt, PurchaseInvoice, PurchaseOrder, CreditNote,
DebitNote, Quotation, GoodsReceiptNote, Payment, Asset, Employee.

---

## Execution Order

```
Phase A → Phase B → Phase C → Phase D → Phase E → Phase F
(Import fixes → DELETE → PUT → UI delete → UI edit lock → Tests)
```

**Recommended subagent dispatch order:**

1. A1-A5: Fix all import errors first (prevents 500s during testing)
2. B1-B11: Implement DELETE for all 11 documents
3. C1: Implement Invoice PUT
4. D1-D12: Add delete buttons to all UI lists
5. E1-E12: Lock edit buttons
6. F1-F2: Write tests

```

```
