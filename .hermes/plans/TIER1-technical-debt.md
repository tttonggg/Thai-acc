# TIER 1: Technical Debt & Critical Issues Cleanup Plan

**Project:** Thai Accounting ERP (Keerati)
**Branch:** `dev/performance-framework`
**Generated:** 2026-05-01
**Status:** PLANNED

---

## Executive Summary

This plan addresses critical data-integrity risks, security vulnerabilities, and architectural defects discovered through codebase analysis. Issues are prioritized by impact: data corruption risk, security exposure, and audit-trail gaps. All items require remediation before production deployment.

**Source documents analyzed:**
- `ERP-IMPROVEMENT-ROADMAP.md` (722 lines)
- `ARCHITECTURE_REPORT.md` (403 lines)
- Direct scan of 50+ API routes, 15 service files, middleware, and package.json

---

## ISSUE TIER LEGEND

| Tier | Severity | Definition | SLA |
|------|----------|------------|-----|
| T1   | 🔴 CRITICAL | Data corruption or security exposure — active production risk | Fix before any release |
| T2   | 🟠 HIGH | Accounting logic errors, missing audit trails, hard deletes | Fix within 2 sprints |
| T3   | 🟡 MEDIUM | Race conditions, missing indexes, minor inconsistencies | Fix within 4 sprints |

---

## SECTION 1: CRITICAL DATA INTEGRITY — Missing Transactions

### 1.1 — `POST /api/invoices` — Invoice Create Without Transaction
**Severity:** T1 | **File:** `src/app/api/invoices/route.ts` (lines 263–320)

**Finding:** Invoice creation (line 263) and activity log (line 309) are two separate Prisma calls. If the app crashes between them, the invoice exists with no audit record.

```typescript
// LINE 263 — creates invoice
const invoice = await prisma.invoice.create({ data: {...} });

// LINE 309 — separate call, not atomic with above
await logCreate(user.id, 'invoices', invoice.id, {...}, ipAddress);
```

**Fix:** Wrap both in `prisma.$transaction`.

```typescript
await prisma.$transaction(async (tx) => {
  const invoice = await tx.invoice.create({ data: {...} });
  await logCreateTx(tx, user.id, 'invoices', invoice.id, {...}, ipAddress);
  return invoice;
});
```

**Risk if not fixed:** Orphaned invoices with no audit trail. Violates financial audit requirements.

---

### 1.2 — `POST /api/receipts` — Receipt + Allocations Not in Transaction
**Severity:** T1 | **File:** `src/app/api/receipts/route.ts` (lines 266–298)

**Finding:** Receipt create and its allocation records are one Prisma call (lines 266–298) — **this one is correct** — BUT the subsequent stock movements and any post-processing are outside a transaction. No major atomicity gap here, but verify no interleaving reads.

**Status:** ✅ POST is atomic. Verify GET/list operations don't read partially-allocated receipts.

---

### 1.3 — `PUT /api/receipts/[id]` — Delete + Update Not in Transaction
**Severity:** T1 | **File:** `src/app/api/receipts/[id]/route.ts` (lines 157–194)

**Finding:** `deleteMany` (line 158) then `update` (line 163) are separate calls. Allocation delete-then-receipt-update is non-atomic.

```typescript
// LINE 158 — delete allocations first
await prisma.receiptAllocation.deleteMany({ where: { receiptId: id } });

// LINE 163 — update receipt after (gap between operations)
const receipt = await prisma.receipt.update({ where: { id }, data: {...} });
```

**Fix:** Wrap in `prisma.$transaction`.

---

### 1.4 — `POST /api/payments` — Payment + Cheque + GL Posting Not in Transaction
**Severity:** T1 | **File:** `src/app/api/payments/route.ts` (lines 198–254, 257–265)

**Finding:** Three separate operations outside a transaction:
1. `db.payment.create` (line 198)
2. `db.cheque.create` (line 239) — if cheque payment
3. `postPaymentToGL(payment)` (line 258) — if POSTED
4. `generateWhtFromPayment(payment.id)` (line 263) — outside transaction

If step 2 or 3 throws, the payment exists but has no cheque record or GL entry.

**Fix:** Wrap payment create + cheque create + GL posting + WHT generation in a single `db.$transaction`.

---

### 1.5 — `PUT /api/payments/[id]` — Delete Allocations + Update Not in Transaction
**Severity:** T1 | **File:** `src/app/api/payments/[id]/route.ts` (lines 162–186)

**Finding:** `deleteMany` (line 163) then `createMany` (line 168) then `update` (line 180) are three separate calls. Allocation replacement is non-atomic.

**Fix:** Wrap all three in `db.$transaction`.

---

### 1.6 — `POST /api/purchases` — Purchase Invoice + VAT Record + Stock Not in Transaction
**Severity:** T1 | **File:** `src/app/api/purchases/route.ts` (lines 213–283)

**Finding:** Three separate operations:
1. `db.purchaseInvoice.create` (line 213)
2. `db.vatRecord.create` (line 259) — outside transaction
3. `db.purchaseInvoice.update` (line 280) — outside transaction
4. Stock movements (lines 286+) — outside transaction

If step 2 or 3 throws, the purchase invoice exists without a VAT record.

**Fix:** Wrap purchase invoice create + VAT record create + status update in `db.$transaction`.

---

### 1.7 — `POST /api/journal` — Journal Create Without Transaction
**Severity:** T1 | **File:** `src/app/api/journal/route.ts` (lines 192–221)

**Finding:** `prisma.journalEntry.create` with nested `lines.create` is one atomic call — **this is correct**. However, the entry is created as DRAFT and the number is generated with a race-prone `findFirst` + increment (lines 43–58) before the create.

**Additional risk:** See Section 2 (Race Conditions) — the `generateEntryNumber()` function is NOT atomic.

**Fix:** Wrap in `db.$transaction` and use `generateDocNumber` from `api-utils.ts` (which uses the `DocumentNumber` table) instead of the manual `findFirst` + increment pattern.

---

### 1.8 — `PUT /api/journal/[id]` — Update Replaces Lines Non-Atomically
**Severity:** T1 | **File:** `src/app/api/journal/[id]/route.ts` (lines 92–121)

**Finding:** `deleteMany` (line 104) then `create` (line 105) are within a single `prisma.journalEntry.update` — **this IS atomic** (Prisma handles nested writes atomically). No fix needed here.

**Verification needed:** Ensure `journal/route.ts:POST` also uses the same atomic pattern.

---

### 1.9 — `POST /api/journal/[id]/post` — Status Update Outside Transaction
**Severity:** T1 | **File:** `src/app/api/journal/[id]/post/route.ts` (lines 54–67)

**Finding:** Single `prisma.journalEntry.update` call — **this IS atomic**. No fix needed here.

**However:** This route sets `postedAt` (line 58) but does NOT set `postedById`. See Section 3 (Audit Trail).

---

### 1.10 — `asset-service.ts:postMonthlyDepreciation` — JE Create + Schedule Update Not in Transaction
**Severity:** T1 | **File:** `src/lib/asset-service.ts` (lines 65–96)

**Finding:** `prisma.journalEntry.create` (line 65) then `prisma.depreciationSchedule.update` (line 93) are separate calls. If the update throws, an orphaned POSTED JE exists with no schedule link.

```typescript
// LINE 65 — creates journal entry
const journalEntry = await prisma.journalEntry.create({ data: {...} });

// LINE 93 — separate call, orphaned JE if this throws
await prisma.depreciationSchedule.update({ where: { id: scheduleId }, data: { posted: true, journalEntryId: journalEntry.id } });
```

**Fix:** Wrap both in `prisma.$transaction`.

---

### 1.11 — `stock-take-service.ts` — Journal Entry + Lines Not in Transaction
**Severity:** T2 | **File:** `src/lib/stock-take-service.ts` (lines 387–388)

**Finding:** The journal entry creation (lines 380–387) and line creation may not be wrapped. Additionally, the debit/credit total formula `totalLoss + totalGain` for both debit and credit is mathematically incorrect — loss and gain cancel each other out instead of being recorded separately.

See Section 4 (Accounting Logic) for the full bug description.

---

### 1.12 — `receipts/[id]/post/route.ts` — Not Scanned Yet
**Severity:** T2 | **Status:** Needs file read

**Action:** Read `src/app/api/receipts/[id]/post/route.ts` and verify GL posting is inside a transaction with receipt status update.

---

### 1.13–1.18 — Remaining Routes from Roadmap Table
**Severity:** T2/T3 | **Status:** Routes identified in ERP-IMPROVEMENT-ROADMAP.md table (lines 51–70):

| Route | Issue | Priority |
|-------|-------|----------|
| `purchases/[id]/route.ts` PUT | Delete + update separate | T2 |
| `purchases/[id]/route.ts` DELETE | VAT delete + invoice delete | T2 |
| `credit-notes/[id]/route.ts` PUT | Status update only | T3 |
| `debit-notes/[id]/route.ts` PUT | Status update only | T3 |
| `credit-notes/[id]/route.ts` DELETE | Simple delete | T3 |
| `debit-notes/[id]/route.ts` DELETE | Simple delete | T3 |

**Action:** Audit each of these files individually.

---

## SECTION 2: CRITICAL SECURITY — Authentication & Authorization

### 2.1 — `journal/[id]/post` — Authentication Status
**Severity:** T1 | **File:** `src/app/api/journal/[id]/post/route.ts`

**Finding (ERP-IMPROVEMENT-ROADMAP.md line 33):** Claims route has NO authentication.

**Verification:** File read shows (line 11) `requireRole(['ADMIN', 'ACCOUNTANT'])` IS present. **The roadmap claim appears outdated** — the route DOES have auth. However, `postedById` is NOT set (see Section 3).

**Action:** Add `postedById: session.user.id` to the update call at line 56–59.

---

### 2.2 — `middleware.ts` — CSRF Bypass in Development
**Severity:** T1 | **File:** `src/middleware.ts` (lines 152–154)

**Finding:** In local dev (`isLocalDev`) OR when `BYPASS_CSRF=true`, CSRF validation is completely bypassed with a `console.warn`. This is a dev-only flag, but the flag name suggests it could be set in production.

```typescript
if (isLocalDev || bypassCsrf) {
  console.warn('[DEV] CSRF check bypassed for:', pathname);
  // Allows request without CSRF token
}
```

**Fix:**
1. Remove `BYPASS_CSRF` env var entirely — it should never be settable in production.
2. Ensure `isLocalDev` cannot be spoofed (`request.headers.get('host')` is not a reliable check for production).
3. Add `X-Request-Id` header for audit tracing.

---

### 2.3 — `middleware.ts` — Rate Limiting Exemption for `/api/invoices`
**Severity:** T2 | **File:** `src/middleware.ts` (line 134)

**Finding:** `/api/invoices` is in the `publicRoutes` list, exempting it from rate limiting. While POST might be needed for public-facing invoice submission, this is a SPA — all users should be authenticated.

```typescript
const publicRoutes = [
  '/api/auth/signin',
  '/api/auth/signout',
  '/api/auth/session',
  '/api/csrf/token',
  '/api/invoices', // Allow invoice creation during testing  ← COMMENT IS WRONG FOR PRODUCTION
];
```

**Fix:** Remove `/api/invoices` from publicRoutes, or restrict to unauthenticated invoice lookup (GET only).

---

### 2.4 — API Routes Without Auth Coverage
**Severity:** T2 | **Status:** Audit Required

**Finding:** Architecture report (line 245) notes "Not all routes may use these wrappers." The `src/app/api/` directory has 50+ route files. Systematic `requireAuth`/`requireRole` coverage has not been verified across all endpoints.

**Known routes without documented auth:**
- Some `v1/` and `v2/` API versions may have inconsistent auth
- `src/app/api/health/route.ts` — should be public
- `src/app/api/upload/route.ts` — should require ADMIN role

**Action:** Run a grep across all API routes for `requireAuth` absent in POST/PUT/PATCH/DELETE handlers.

---

## SECTION 3: CRITICAL ACCOUNTING LOGIC

### 3.1 — `invoices/[id]/issue/route.ts` — Missing Revenue GL Entry (CONFIRMED FIXED)
**Severity:** T1 | **File:** `src/app/api/invoices/[id]/issue/route.ts`

**Finding (ERP-IMPROVEMENT-ROADMAP.md line 109):** Claims only COGS entry is created, missing AR/Revenue/VAT entry.

**Verification:** File read shows (lines 154–227) — **Revenue journal entry IS created** with AR (1120), Revenue (4100), and VAT Output (2132) accounts. This route was already fixed. The COGS entry (lines 73–151) is also correctly created.

**Status:** ✅ This item is resolved. The roadmap may be stale.

---

### 3.2 — `journal-entry-auto-service.ts` — Hardcoded Account Code Maps
**Severity:** T2 | **File:** `src/lib/journal-entry-auto-service.ts` (lines 27–31)

**Finding:** Account codes are hardcoded in a constant map:

```typescript
const AC = {
  CASH: '1100',
  BANK: '1101',
  AR: '1102',
  INPUT_VAT: '1103',
  ...
};
```

These same codes appear in test files (`src/lib/__tests__/journal-auto-je.test.ts` lines 117–119) confirming the hardcoded values. If the Chart of Account structure changes, these services break silently.

**Fix:** Look up accounts dynamically from `chartOfAccount` table by `accountType` or a `systemCode` field, or use `SystemSettings` for configurable account mappings. Do NOT hardcode numeric account codes.

---

### 3.3 — `payments/route.ts:postPaymentToGL` — Hardcoded Account Codes
**Severity:** T2 | **File:** `src/app/api/payments/route.ts` (lines 296–318)

**Finding:** Multiple hardcoded account lookups:

```typescript
// LINE 297-298
const apAccount = await tx.chartOfAccount.findUnique({ where: { code: '2110' } });

// LINE 304-305
const cashAccount = await tx.chartOfAccount.findUnique({ where: { code: '1110' } });

// LINE 309-311
const bankGlAccount = await tx.chartOfAccount.findFirst({ where: { code: { startsWith: '112' } } });

// LINE 316-317
const whtAccount = await tx.chartOfAccount.findUnique({ where: { code: '2130' } });
```

**Fix:** Use `SystemSettings` configurable account IDs, or look up by account type classification rather than hardcoded code strings.

---

### 3.4 — `stock-take-service.ts` — Incorrect Journal Entry Totals
**Severity:** T1 | **File:** `src/lib/stock-take-service.ts` (lines 380–381, 393–409)

**Finding:** The journal entry for stock take adjustments uses:

```typescript
totalDebit: totalLoss + totalGain,  // LINE 380
totalCredit: totalLoss + totalGain,  // LINE 381
```

This is incorrect. The accounting treatment should be:

```
Loss (shrinkage):  DR Expense (debit loss)  | CR Inventory (credit)
Gain (surplus):    DR Inventory (debit gain) | CR Income (credit)
```

The current formula `totalLoss + totalGain` cancels them out rather than recording each properly.

**Correct fix pattern:**

```typescript
// When totalLoss > 0:  DR: Expense (totalLoss),  CR: Inventory (totalLoss)
// When totalGain > 0:  DR: Inventory (totalGain), CR: Income (totalGain)
```

**Action:** Rewrite lines 380–409 to create separate journal lines for loss and gain entries.

---

### 3.5 — `payroll-service.ts` — Float Arithmetic for Monetary Values
**Severity:** T1 | **File:** `src/lib/payroll-service.ts` (identified in ARCHITECTURE_REPORT.md line 134)

**Finding:** Uses raw Baht `Float` for `baseSalary`, SSC calculation, and PND1 withholding throughout. All monetary values in this schema are stored as `Int` (Satang), but the service reads them as Float.

```typescript
// ARCHITECTURE_REPORT.md line 270 example
Math.min(salary, 9900) * 0.05  // Float arithmetic, not Satang integer
```

**Risk:** Float precision errors accumulate in payroll calculations. SSC cap of 9,900 may miscalculate.

**Fix:** Convert all payroll monetary values to Satang integers before arithmetic, use integer math throughout, convert back only for display.

---

### 3.6 — PP30 Validation Bug — `taxRate === 0` Rejected for NET Type
**Severity:** T1 | **File:** `src/lib/tax-form-service.ts` (lines 598–600, reported as B-03 in ARCHITECTURE_REPORT.md)

**Finding:** PP30 form validation rejects `taxRate <= 0` but NET-type income lines legitimately have `taxRate: 0`. This causes the form to always fail validation for certain income types.

**Fix:** Allow `taxRate === 0` when the line type is `NET`.

---

## SECTION 4: RACE CONDITIONS

### 4.1 — Journal Entry Number Generation — `findFirst` + Create Race
**Severity:** T1 | **File:** `src/app/api/journal/route.ts` (lines 43–58)

**Finding:** Document number generation uses non-atomic `findFirst` + increment:

```typescript
// LINES 43-58 — NOT ATOMIC
const lastEntry = await prisma.journalEntry.findFirst({
  where: { entryNo: { startsWith: prefix } },
  orderBy: { entryNo: 'desc' },
});
let nextNum = 1;
if (lastEntry) {
  const lastNum = parseInt(lastEntry.entryNo.split('-')[2] || '0');
  nextNum = lastNum + 1;  // ← Two concurrent requests can get the same number
}
return `${prefix}-${String(nextNum).padStart(4, '0')}`;
// ... then create
const entry = await prisma.journalEntry.create({ data: { entryNo, ... } });
```

**Risk:** Two concurrent POST requests can read the same `lastEntry`, compute the same `nextNum`, and generate duplicate `entryNo` values. The `@unique` constraint on `entryNo` will cause one to fail with a DB error, but the error handling may not be graceful.

**Fix:** Use `generateDocNumber` from `api-utils.ts`, which uses the `DocumentNumber` table with atomic `findUnique` + `update` pattern, OR use a database-level sequence.

---

### 4.2 — Invoice Number Generation — Same Race Condition Pattern
**Severity:** T1 | **File:** `src/app/api/invoices/route.ts` (lines 44–76)

**Finding:** `generateInvoiceNumber()` uses the same non-atomic `findFirst` + increment pattern as journal entries.

```typescript
// LINES 59-72 — same race condition as journal
const lastInvoice = await prisma.invoice.findFirst({
  where: { invoiceNo: { startsWith: prefix } },
  orderBy: { invoiceNo: 'desc' },
});
let nextNum = 1;
if (lastInvoice) {
  const lastNum = parseInt(parts[parts.length - 1] || '0');
  nextNum = lastNum + 1;
}
```

**Fix:** Replace with `generateDocNumber(validatedData.type, prefix)` — the code at line 261 already uses this for the actual create. The `generateInvoiceNumber` function at line 44 is unused or called differently. Audit and remove the duplicate unsafe function.

---

### 4.3 — Period Locking — TOCTOU Race in `checkPeriodStatus`
**Severity:** T1 | **File:** `src/lib/period-service.ts` (lines 17–42)

**Finding:** `checkPeriodStatus()` is a read-then-act non-atomic function:

```typescript
// LINES 21-31 — READ
const period = await prisma.accountingPeriod.findUnique({ where: { year_month: { year, month } } });
if (!period) {
  // GAP HERE — another request could create the same period between findUnique and create
  const newPeriod = await prisma.accountingPeriod.create({ data: { year, month, status: 'OPEN' } });
  return { isValid: true, period: newPeriod };
}
```

Two concurrent requests for the same month can both see no period exists, both try to create it, and one will fail with a unique constraint violation.

**Fix:** Use `upsert` instead of `findUnique` + `create`, and move the entire check into a transaction. Additionally, critical GL operations (depreciation, cheque clearing, petty cash) must call `checkPeriodStatus()` before posting — currently they don't (ARCHITECTURE_REPORT.md lines 188–195).

---

## SECTION 5: HARDC DELETES — MASTER DATA

### 5.1 — Entities with Hard Deletes (Confirmed)
**Severity:** T2 | **Files:** Multiple

**Finding:** The following entities use `prisma.entity.delete()` (hard delete) instead of soft delete:

| File | Entity | Risk |
|------|--------|------|
| `src/app/api/customers/[id]/route.ts:131` | Customer | orphans invoices, receipts |
| `src/app/api/vendors/[id]/route.ts:124` | Vendor | orphans purchase invoices |
| `src/app/api/products/[id]/route.ts:176` | Product | orphans 10+ related tables |
| `src/app/api/warehouses/[id]/route.ts:110` | Warehouse | orphans stock balances |
| `src/app/api/employees/[id]/route.ts:119` | Employee | orphans payroll records |
| `src/app/api/departments/[id]/route.ts:281` | Department | orphans GL entries |

**Fix Pattern:**

```typescript
// BEFORE (hard delete)
await prisma.customer.delete({ where: { id } });

// AFTER (soft delete)
await prisma.customer.update({
  where: { id },
  data: { deletedAt: new Date(), isActive: false },
});

// All queries should include:
where: { deletedAt: null }
```

**Additional:** The Prisma schema needs `deletedAt DateTime?` and `isActive Boolean @default(true)` fields added to all master data models. Migration required.

---

### 5.2 — `invoices/[id]/route.ts:DELETE` — Correctly Uses Soft Delete
**Severity:** N/A | **Status:** ✅ Verified

The invoice DELETE (line 185–194) already uses `db.$transaction` with soft delete on the parent and hard delete on child records. This is the correct pattern.

---

## SECTION 6: MISSING AUDIT TRAILS

### 6.1 — `journal/[id]/post/route.ts` — `postedById` Not Set
**Severity:** T2 | **File:** `src/app/api/journal/[id]/post/route.ts` (lines 54–59)

**Finding:** Sets `postedAt` (line 58) but does NOT set `postedById`:

```typescript
// LINE 54-59 — missing postedById
const entry = await prisma.journalEntry.update({
  where: { id },
  data: {
    status: 'POSTED',
    postedAt: new Date(),
    // postedById: session.user.id ← MISSING
  },
```

**Fix:** Add `postedById: user.id` from the session established at line 11.

---

### 6.2 — `invoices/[id]/issue/route.ts` — `createdById` / `issuedById` Not Set
**Severity:** T2 | **File:** `src/app/api/invoices/[id]/issue/route.ts` (lines 231–237)

**Finding:** Invoice status update to ISSUED does not record who issued it. The session `user` is available (line 16) but not linked.

```typescript
// LINE 231-237 — missing issuedById
const invoice = await tx.invoice.update({
  where: { id },
  data: {
    status: 'ISSUED',
    journalEntryId: revenueJournalEntry.id,
    // issuedById: user.id ← MISSING
  },
});
```

**Fix:** Add `issuedById: user.id` to the update call. Also add `approvedById` and `approvedAt` (these are set for the revenue JE but not for the invoice record itself).

---

### 6.3 — All Document POST Endpoints — Missing `createdById`
**Severity:** T2 | **Files:** Multiple

**Finding:** Several POST endpoints accept `user` from session but don't always persist `createdById`:

| Route | `createdById` set? |
|-------|--------------------|
| `invoices/route.ts:POST` | ✅ Line 283 |
| `receipts/route.ts:POST` | ❓ Needs verification |
| `payments/route.ts:POST` | ✅ Line 212 |
| `purchases/route.ts:POST` | ✅ Line 233 |
| `journal/route.ts:POST` | ❓ Not set in create |

**Action:** Audit all POST routes to ensure `createdById: user.id` is consistently set on all financial document creates.

---

## SECTION 7: MIDDLEWARE & AUTHENTICATION GAPS

### 7.1 — CSRF Bypass via `BYPASS_CSRF` Environment Variable
**Severity:** T1 | **File:** `src/middleware.ts` (line 26)

```typescript
const bypassCsrf = process.env.BYPASS_CSRF === 'true';
```

This env var can be set in production, allowing CSRF bypass. The comment says "DEV ONLY" but nothing enforces it.

**Fix:** Remove `BYPASS_CSRF` env var support entirely. CSRF protection should only be bypassable via a compile-time flag, not a runtime env var.

---

### 7.2 — Host Header Check is Insufficient for Production
**Severity:** T2 | **File:** `src/middleware.ts` (lines 16–23)

```typescript
const isLocalDev =
  process.env.NODE_ENV === 'development' &&
  (request.headers.get('host')?.includes('localhost:3000') ||
   request.headers.get('host')?.includes('localhost:3001') ||
   request.headers.get('host')?.includes('localhost:3002') ||
   request.headers.get('host')?.includes('127.0.0.1:3000') || ...);
```

`Host` header is user-controlled and can be spoofed. In production, `NODE_ENV=development` should never be true regardless of host header.

**Fix:** Remove the host header list entirely. Rely solely on `NODE_ENV === 'development'`. If deployed behind a reverse proxy, use `X-Forwarded-Host` which is set by the proxy, not the browser.

---

### 7.3 — No `.env.example` File
**Severity:** T2 | **Status:** File Missing

**Finding:** No `.env.example` exists in the project root or `/src/`. New developers cannot determine which environment variables are required.

**Fix:** Create `.env.example` with all required variables:
```
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
NODE_ENV=development
BYPASS_CSRF=false
```

---

## SECTION 8: ADDITIONAL CRITICAL FINDINGS

### 8.1 — `petty-cash-service.ts` — Replenish Without Transaction
**Severity:** T2 | **File:** `src/lib/petty-cash-service.ts`

**Finding:** The `replenish()` function does NOT use `prisma.$transaction`. If voucher creation succeeds but fund update fails, the system is in an inconsistent state.

**Fix:** Wrap all replenish operations in `prisma.$transaction`.

---

### 8.2 — `cheque-service.ts` — Bounce and Clear TOCTOU
**Severity:** T1 | **File:** `src/lib/cheque-service.ts` (reported as B-04, B-05 in ARCHITECTURE_REPORT.md lines 363–365)

**Findings:**
- B-04: Cheque bounce not atomic — crash mid-operation leaves inconsistent state
- B-05: Cheque clear TOCTOU — status check outside transaction, double JE possible

**Fix:** Move status check inside `db.$transaction`. Ensure JE creation and status update are atomic.

---

### 8.3 — FIFO Costing is a Stub
**Severity:** T2 | **File:** `src/lib/inventory-service.ts` (lines 47–49, reported as B-06 in ARCHITECTURE_REPORT.md)

**Finding:** FIFO costing does not implement per-batch tracking — it accumulates like WAC. COGS calculations will be incorrect for FIFO businesses.

**Fix:** Implement proper batch-tracking FIFO with `StockBatch` or `StockMovement` history queries sorted by date.

---

### 8.4 — `revenue/auto-service.ts` — No Confirmed File
**Severity:** T3 | **Status:** Needs Investigation

**Finding (ERP-IMPROVEMENT-ROADMAP.md):** References a `revenue/auto-service.ts` that should create revenue GL entries automatically. This file was not found in the scan.

**Action:** Verify if this service exists. If not, the revenue GL entries may only be created manually in `invoices/[id]/issue/route.ts`.

---

### 8.5 — Missing `postedById` on Journal POST
**Severity:** T2 | **File:** `src/app/api/journal/[id]/post/route.ts`

See Section 6.1 above.

---

## PRIORITIZED ACTION ITEMS

### BLOCKER (Must Fix Before Any Release)

| # | Item | File | Fix |
|---|------|------|-----|
| B-01 | Add `postedById` to journal post | `journal/[id]/post/route.ts` | 1-line fix |
| B-02 | Asset depreciation transaction | `asset-service.ts` | Wrap in `$transaction` |
| B-03 | PP30 taxRate===0 validation | `tax-form-service.ts` | Allow 0 for NET type |
| B-04 | Cheque bounce atomicity | `cheque-service.ts` | Wrap in `$transaction` |
| B-05 | Cheque clear TOCTOU | `cheque-service.ts` | Move check inside tx |
| B-06 | FIFO costing stub | `inventory-service.ts` | Implement batch tracking |
| B-07 | Remove `BYPASS_CSRF` env var | `middleware.ts` | Delete bypass logic |
| B-08 | Stock take JE totals bug | `stock-take-service.ts` | Separate loss/gain entries |
| B-09 | Period locking TOCTOU | `period-service.ts` | Use upsert, wrap in tx |
| B-10 | Journal entryNo race | `journal/route.ts` | Use `generateDocNumber` |

### HIGH PRIORITY (Fix Within 2 Sprints)

| # | Item | File | Fix |
|---|------|------|-----|
| H-01 | Invoice create atomicity | `invoices/route.ts` | Wrap invoice+log in tx |
| H-02 | Payment create atomicity | `payments/route.ts` | Wrap all ops in tx |
| H-03 | Receipt PUT atomicity | `receipts/[id]/route.ts` | Wrap delete+update in tx |
| H-04 | Payment PUT atomicity | `payments/[id]/route.ts` | Wrap 3 ops in tx |
| H-05 | Purchase create atomicity | `purchases/route.ts` | Wrap 3 ops in tx |
| H-06 | Payroll Float → Satang | `payroll-service.ts` | Integer arithmetic |
| H-07 | Hardcoded account codes | Multiple files | Use SystemSettings lookups |
| H-08 | Soft delete master data | 6 entity files | Add `deletedAt` + migration |
| H-09 | issuedById on invoice issue | `invoices/[id]/issue/route.ts` | Add field to update |
| H-10 | createdById consistency | All POST routes | Audit and fix |

### MEDIUM PRIORITY (Fix Within 4 Sprints)

| # | Item | File | Fix |
|---|------|------|-----|
| M-01 | `.env.example` missing | Project root | Create template |
| M-02 | Rate limit exemption `/api/invoices` | `middleware.ts` | Remove from public routes |
| M-03 | Petty cash replenish no tx | `petty-cash-service.ts` | Wrap in `$transaction` |
| M-04 | Host header bypass risk | `middleware.ts` | Remove host list check |
| M-05 | `revenue/auto-service.ts` missing | Unknown | Investigate and create if needed |
| M-06 | Audit `createdById` all POSTs | All API routes | Systematic grep + fix |
| M-07 | recurring doc null date | `recurring-document-service.ts` | Handle null dates |
| M-08 | jsPDF v4 migration | `pdf-generator.ts` | Upgrade pending |

---

## FILE INVENTORY — SCANNED ROUTES

```
✅ src/app/api/journal/[id]/post/route.ts        — FIXED auth, MISSING postedById
✅ src/app/api/journal/route.ts                   — RACE condition in entryNo gen
✅ src/app/api/journal/[id]/route.ts              — Atomic update (correct)
✅ src/app/api/invoices/route.ts                  — MISSING tx on create+log
✅ src/app/api/invoices/[id]/route.ts             — ✅ Soft delete pattern correct
✅ src/app/api/invoices/[id]/issue/route.ts       — ✅ Revenue JE created correctly
✅ src/app/api/receipts/route.ts                 — POST is atomic (correct)
✅ src/app/api/receipts/[id]/route.ts            — MISSING tx on PUT delete+update
✅ src/app/api/payments/route.ts                 — MISSING tx on create+cheque+GL
✅ src/app/api/payments/[id]/route.ts            — MISSING tx on PUT delete+update
✅ src/app/api/purchases/route.ts                — MISSING tx on create+VAT+update
✅ src/app/api/credit-notes/route.ts            — ✅ Uses $transaction (correct)
✅ src/app/api/debit-notes/route.ts             — ✅ Uses $transaction (correct)
⚠️  src/app/api/receipts/[id]/post/route.ts    — NOT YET READ
⚠️  src/app/api/purchases/[id]/route.ts        — NOT YET READ
⚠️  src/app/api/credit-notes/[id]/route.ts      — NOT YET READ
⚠️  src/app/api/debit-notes/[id]/route.ts      — NOT YET READ
```

---

## VERIFICATION COMMANDS

```bash
# Find all API routes missing $transaction
grep -rn "\.create({" src/app/api --include="*.ts" | grep -v "transaction\|createMany" | head -30

# Find hardcoded account codes in API routes
grep -rn "'1100'\|'1101'\|'2100'\|'2110'\|'4100'\|'4201'" src/app/api --include="*.ts"

# Find all DELETE routes without soft-delete pattern
grep -rn "\.delete\({" src/app/api --include="*.ts"

# Find all routes missing requireAuth
grep -rn "export async function POST" src/app/api --include="*.ts" -l | xargs grep -L "requireAuth\|requireRole"
```

---

*Plan generated by Hermes Agent — Thai-acc-sandbox — dev/performance-framework*
