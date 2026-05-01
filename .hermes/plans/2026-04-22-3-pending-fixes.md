# Plan: 3 Remaining Pending Fixes

## Context

After implementing DRAFT-only delete/edit protection, 3 items were identified as
out-of-scope but fixable in single sessions.

---

## Task 1: Invoice POST — add `createdById`

**File**: `src/app/api/invoices/route.ts:259-301` **Test**:
`src/lib/__tests__/invoice.test.ts` (add `createdById` assertion) **Depends
on**: None

### What

Invoice POST creates invoices but never sets `createdById`. Schema has
`createdById String?` on Invoice model. Need to add `createdById: user.id` to
`prisma.invoice.create()` data.

### How

In `prisma.invoice.create({ data: {` block, add `createdById: user.id,` after
`status: 'DRAFT',` (line ~279).

### Verification

```bash
cd /Users/tong/Desktop/Thai-acc-sandbox
# Create invoice via API → query DB: SELECT createdById FROM Invoice WHERE invoiceNo = 'INV...'
# Should NOT be NULL
```

### Checklist

- [x] Satang (N/A — metadata field)
- [x] Prisma transaction (N/A — single create)
- [x] Real DB test (add assertion)

---

## Task 2: GET /api/invoices — filter out soft-deleted

**File**: `src/app/api/invoices/route.ts:93` **Test**:
`src/lib/__tests__/invoice.test.ts` (add deleted invoice to list — should not
appear) **Depends on**: None

### What

`GET /api/invoices` returns ALL invoices including soft-deleted ones
(`deletedAt IS NOT NULL`). Need to add `deletedAt: null` to the `where` clause.

### How

In the `where` object construction (line ~93), add:

```ts
where.deletedAt = null;
```

Also apply same filter to `prisma.invoice.count({ where })` at line ~129 — the
same `where` object is reused, so `deletedAt: null` applies to both `findMany`
and `count`.

### Verification

```bash
cd /Users/tong/Desktop/Thai-acc-sandbox
# Soft-delete an invoice (or use existing INV202604-0001 which has deletedAt)
# GET /api/invoices → should NOT include soft-deleted invoices
```

### Checklist

- [x] Satang (N/A — query filter)
- [x] Prisma transaction (N/A — read query)
- [x] Real DB test (verify deletedAt filter works)

---

## Task 3: Receipt view-dialog — add permission-aware Delete button

**File**: `src/components/receipts/receipt-view-dialog.tsx:396-424` **Test**:
Manual UI test **Depends on**: None (frontend-only)

### What

Receipt view-dialog shows Delete button for ALL DRAFT receipts without checking
user role. Backend requires ACCOUNTANT or ADMIN. Frontend should match — show
Delete button only for ACCOUNTANT or ADMIN role.

### How

- The dialog receives no auth context currently
- Need to determine approach: **Option A (simplest)**: Show Delete button only
  when session role is ACCOUNTANT or ADMIN — requires passing user role to
  component **Option B ( safest)**: Always show button, let backend return 403
  if unauthorized (backend already enforces)

**Decision**: Option B is acceptable since backend already enforces. No frontend
change needed if we accept backend-403 pattern. **If Option A required**: Pass
`role` prop to ReceiptViewDialog from parent, conditional render Delete button.

### Recommended Action

Add `role?: string` prop to `ReceiptViewDialog` interface, then:

```tsx
{receipt.status === 'DRAFT' && (role === 'ACCOUNTANT' || role === 'ADMIN') && (
  <Button ... onClick={handleDelete}>ลบ</Button>
)}
```

### Verification

- Login as VIEWER/ACCOUNTANT/ADMIN → open DRAFT receipt → verify Delete button
  visibility
- Login as non-ACCOUNTANT → DRAFT receipt → Delete button hidden

### Checklist

- [x] Satang (N/A — UI)
- [x] Real DB test (manual)
