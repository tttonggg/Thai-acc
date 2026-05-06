# A15: Customer Portal — Build Plan

**Status:** SPEC DONE → /plan before /build
**Updated:** 2026-05-06

---

## Goal
Build the Customer Portal in this order so each step is independently testable.

---

## Current Context

- Customer + Invoice models exist (customerId FK, paidAmount, status, all Satang)
- NextAuth v4 in use with UserRole enum (ADMIN, ACCOUNTANT, USER, VIEWER)
- Role/RolePermission/EmployeeRole RBAC system exists
- pdfkit-generator.ts + pdf-generator.ts exist for PDF generation
- DocumentAttachment model exists for file uploads
- Portal route group `/portal` does NOT exist yet
- CustomerPortalAccount does NOT exist yet

---

## Proposed Approach

Build in 7 ordered slices. Each slice is independently testable.

---

## Step-by-Step Plan

### Slice 1: Schema (smallest, no logic)
Add `CustomerPortalAccount` model, extend `UserRole` enum with `CUSTOMER_PORTAL`, add relation on `User`.

**Files:**
- `prisma/schema.prisma` — add CustomerPortalAccount model + CUSTOMER_PORTAL to UserRole
- `prisma/schema-postgres.prisma` — same
- `prisma/schema-sqlite.prisma` — same

**Verify:** `bun run db:generate` + `bun run tsc --noEmit`

---

### Slice 2: Portal Auth Service
Create `src/lib/portal-auth.ts` — helpers for portal login, password hashing, session building.

**Files:**
- `src/lib/portal-auth.ts` — NEW

**Functions:**
- `hashPassword(password)` — bcrypt, salt 12
- `verifyPassword(password, hash)` — returns boolean
- `generateTempPassword()` — random secure string for initial setup
- Portal login: validate email+password against CustomerPortalAccount → return session

**Verify:** `bun run tsc --noEmit`

---

### Slice 3: Portal Invoice Service
Create `src/lib/portal-invoice-service.ts` — customer-scoped invoice queries.

**Files:**
- `src/lib/portal-invoice-service.ts` — NEW

**Functions:**
- `getCustomerInvoices(customerId, filters?)` — paginated list with status filter
- `getInvoiceDetail(invoiceId, customerId)` — throws if customerId mismatch
- `getOutstandingBalance(customerId)` — sum(totalAmount - paidAmount) for non-PAID/CANCELLED
- `getRecentInvoices(customerId, limit)` — last 5 posted invoices
- `getOverdueInvoices(customerId)` — dueDate < today && status POSTED

**Verify:** `bun run tsc --noEmit`

---

### Slice 4: Portal API Routes (auth + invoices)
Create `src/app/api/portal/auth/login/route.ts` and `src/app/api/portal/invoices/` routes.

**Files:**
- `src/app/api/portal/auth/login/route.ts` — POST, returns NextAuth session
- `src/app/api/portal/auth/logout/route.ts` — POST, destroys session
- `src/app/api/portal/auth/me/route.ts` — GET, current customer + account info
- `src/app/api/portal/invoices/route.ts` — GET list, filtered by customerId from session
- `src/app/api/portal/invoices/[id]/route.ts` — GET detail, verifies customerId ownership

**Auth:** All routes check `requireRole('CUSTOMER_PORTAL')` + `session.user.customerId`

**Verify:** `bun run tsc --noEmit`

---

### Slice 5: Portal Payment Service + API
Create `src/lib/portal-payment-service.ts` and `POST /api/portal/payments`.

**Files:**
- `src/lib/portal-payment-service.ts` — NEW
- `src/app/api/portal/payments/route.ts` — POST, creates pending Receipt

**Functions:**
- `recordCustomerPayment(customerId, paymentData)` — creates Receipt with status=PENDING, links to invoice(s), attaches slip image

**Verify:** `bun run tsc --noEmit`

---

### Slice 6: Portal Pages
Create the `/portal` route group with login + dashboard + invoice list + invoice detail.

**Files:**
```
src/app/portal/
  (auth)/
    login/page.tsx              — email + password form
  (app)/
    layout.tsx                  — portal shell (header with logo + logout, nav)
    dashboard/page.tsx          — outstanding balance card, recent invoices, due soon
    invoices/
      page.tsx                  — paginated list with status filter tabs
      [id]/page.tsx            — line items table, payment history, PDF download button
    payments/
      new/page.tsx             — payment form: select invoice, amount, method, slip upload
```

**Key components to create in `src/components/portal/`:**
- `portal-layout.tsx` — header + logout button + nav links
- `invoice-list.tsx` — table with status badge + pagination
- `invoice-detail.tsx` — line items + PDF download
- `payment-form.tsx` — amount input + slip upload
- `statement-download.tsx` — month picker → calls `/api/portal/statements`

**Verify:** `bun run tsc --noEmit` + `bun run build`

---

### Slice 7: ERP Side — Create Portal Account + Payment Approval
Two small additions in the main ERP:

**A. "สร้างบัญชีพอร์ทัล" button in Customer form**

Files:
- `src/components/customers/customer-form-dialog.tsx` — add portal account section
- `src/app/api/customers/[id]/portal-account/route.ts` — POST: create CustomerPortalAccount + linked User

**B. Receipt approval already works** — pending Receipts from portal are normal Receipts. ERP staff can approve via existing Receipt approval flow. No new code needed unless Receipt approval UI doesn't show portal-created receipts. Check `receipts/[id]/route.ts` for approval PATCH.

**Verify:** `bun run tsc --noEmit` + manual test

---

## Files Likely to Change

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add CustomerPortalAccount, extend UserRole |
| `prisma/schema-postgres.prisma` | Same |
| `prisma/schema-sqlite.prisma` | Same |
| `src/lib/portal-auth.ts` | NEW |
| `src/lib/portal-invoice-service.ts` | NEW |
| `src/lib/portal-payment-service.ts` | NEW |
| `src/app/api/portal/` | NEW dir + 6 route files |
| `src/app/portal/` | NEW dir + 8 page/layout files |
| `src/components/portal/` | NEW dir + 5 component files |
| `src/components/customers/customer-form-dialog.tsx` | Add portal account section |
| `src/app/api/customers/[id]/portal-account/route.ts` | NEW |

---

## Tests / Validation

```bash
bun run db:generate
bun run tsc --noEmit
bun run build
```

**Manual test (per spec):**
1. Create CustomerPortalAccount for "บริษัท ABC" via ERP
2. Login at /portal/login
3. See dashboard with correct outstanding balance
4. Open invoice → see line items + download PDF
5. Record payment with slip → see PENDING receipt in ERP
6. Approve receipt in ERP → invoice paidAmount updated
7. Customer portal shows invoice as PAID

---

## Risks & Open Questions

1. **NextAuth session shape** — does `session.user.customerId` exist? May need to extend the NextAuth callbacks in `src/lib/auth.ts` to include `customerId` when role is `CUSTOMER_PORTAL`. The CustomerPortalAccount → User link must be set up at account creation time.

2. **Receipt approval flow** — verify existing PATCH `/api/receipts/[id]` handles `status: APPROVED` and correctly increments `invoice.paidAmount`. If not, this is a separate bug fix.

3. **PDF download** — reuses `pdfkit-generator.ts`. Check if it has a `generateInvoicePDF(invoiceId)` export or if需要一个新wrapper. May need a `portal-pdf-service.ts`.

4. **Slip image upload** — use existing `DocumentAttachment` or `/api/upload`. Check if upload route exists and handles the file storage (local vs S3).

5. **Session timeout** — NextAuth session maxAge for CUSTOMER_PORTAL role. Set to 30 min. Check `src/lib/auth.ts` for session config.
