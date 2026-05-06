# Remaining Add-Ons Master Plan
**Date:** 2026-05-06
**Status:** Research complete
**Verified by:** Full codebase audit + 5-agent parallel research

---

## Executive Summary

After full recheck of all 20 add-ons, the plan doc was partially wrong. Here is the verified status:

| # | Name | Status | Verified? |
|---|------|--------|----------|
| A1 | Quick Action FAB | ✅ DONE | Yes |
| A2 | Starting Date Fix | ✅ DONE | Yes |
| A3 | Empty State Redesign | ⚠️ PARTIAL | Yes — only 3/8 lists done |
| A4 | Payslip PDF | ✅ DONE | Yes — backend+API+button verified |
| A5 | Invoice Thai Font | ✅ DONE | Yes — THSarabunNew already in invoice PDF |
| A6 | Approval Workflow UI | ✅ DONE | Yes |
| A7 | Tax Form UI | ✅ DONE | Yes |
| A8 | Recurring Document UI | ✅ DONE | Yes |
| A9 | Global Search | ✅ DONE | Yes |
| A10 | Auto Email Reminder | ✅ DONE | Yes |
| A11 | QR PromptPay | ⚠️ PARTIAL | Yes — QR on receipts, missing on invoices |
| A12 | Low-Stock Alert | ✅ DONE | Yes |
| A13 | Bank Auto-Match | ✅ DONE | Yes |
| A14 | Project Costing | ✅ DONE | Yes |
| A15 | Customer Portal | ❌ NOT STARTED | Yes — completely absent |
| A16 | Auto-Bank Rec Full | ⚠️ PARTIAL | Yes — isReconciled missing from Receipt/Payment |
| A17 | Budget vs Actual | ✅ DONE | Yes — fully implemented |
| A18 | Audit Trail Field-Level | ⚠️ PARTIAL | Yes — only record-level, not field-level |
| A19 | Multi-Branch UI | ❌ NOT STARTED | Yes — no UI selector despite auth store |
| A20 | Notification Center | ✅ DONE | Yes |

**Net remaining to build:** A11 (invoice QR), A16 (isReconciled), A19 (branch selector UI), A3 (remaining empty states), A15 (customer portal), A18 (field-level audit).

---

## Verified Gap Details

### A11: Invoice QR (30min, EASY)
**Problem:** Receipt PDF has PromptPay QR (pdfkit-generator.ts:705-728). Invoice PDF does NOT.
**Root cause:** QR block only in receipt function, not copied to invoice function.
**Fix:** Copy the receipt QR block into `generateInvoicePDFWithPDFKit` after summary section.
**Schema:** No change needed — `company.promptpayId` already available.
**Risk:** LOW — pure copy-paste from working receipt code.

### A16: Receipt/Payment isReconciled Missing (1-2h, MEDIUM)
**Problem:** `bank-match-service.ts` and bank matching UI work correctly. But when reconcile API marks RECEIPT/PAYMENT entries as matched, there is NO `isReconciled` field on those models — it's a no-op. Next reconciliation recalculates book balance including those already-matched items, so difference never reaches zero.
**Root cause:** `Receipt` and `Payment` models lack `isReconciled` Boolean.
**Fix:** Add `isReconciled` to both models in 3 schema files + update reconcile API route.
**Risk:** LOW — straightforward schema field + API update.

### A19: Multi-Branch UI Selector (2-3h, MEDIUM)
**Problem:** Auth store has `selectedBranchId` + `branches[]` infrastructure. Company/User models have `branchCode`. But NO UI selector exists in page.tsx or sidebar.
**Fix:** Add branch selector dropdown in page.tsx (company branch list from `/api/company`).
**Risk:** LOW — UI-only, backend already exists.

### A3: Remaining Empty States (2-3h, EASY)
**Already done:** invoice-list, product-list, customer-list.
**Still missing:** receipt-list, payment-list, product-list-virtual, vendor list, cheque list, and likely 3-4 more.
**Fix:** Add EmptyState component to remaining list pages.
**Risk:** LOW — pure UI, no logic.

### A15: Customer Portal (3-5 days, COMPLEX)
**Problem:** Completely absent — no CustomerPortalAccount model, no portal auth, no portal routes.
**Scope:** New Prisma model + portal-specific NextAuth + portal UI routes + API endpoints.
**Note:** Phase 3+ material. Not in this sprint.

### A18: Field-Level Audit (2-3 days, COMPLEX)
**Problem:** `AuditLog` is record-level (full before/after JSON). Only `InvoiceLineItemAudit` is field-level. All other entity mutations log entire record snapshots, not per-field.
**Fix would require:** Audit logging across all entity types with field-level change tracking.
**Note:** Phase 3+ material. Not in this sprint.

---

## Recommended Implementation Order

```
Week 1, Day 1
├── A11  (30min) — Invoice QR PromptPay (copy from receipt pattern)
├── A16  (1-2h)  — isReconciled on Receipt/Payment + reconcile API fix
└── A19  (2-3h)  — Branch selector UI in page.tsx

Week 1, Day 2
└── A3   (2-3h)  — Remaining empty states on 5-8 list pages

Phase 3 (separate sprint)
├── A15  (3-5 days) — Customer Portal
└── A18  (2-3 days) — Field-level audit logging
```

**Dependencies:** None among Week 1 items. A11 is purely PDF template. A16 is schema+reconcile route. A19 is standalone UI. A3 is standalone UI.

**Parallel group (Week 1 Day 1):** A11 + A16 + A19 can be done by different agents in parallel since they touch different files (pdfkit-generator vs schemas/API vs page.tsx).

---

## Per-Item Implementation Plans

### A11: Invoice QR PromptPay

**Files:** `src/lib/pdfkit-generator.ts` (invoice function), no schema change needed.

**Schema Reality:**
- `Company.promptpayId` exists in all 3 schema files (line 33).
- No Invoice-level `promptpayId` needed — use company-level fallback (same as receipt).

**Receipt QR pattern to copy** (pdfkit-generator.ts:705-728):
```typescript
// PromptPay QR Code — bottom left area
const promptpayId = receipt.promptpayId || (company as any)?.promptpayId;
if (promptpayId) {
  try {
    const amountSatang = receipt.netAmount ?? 0;
    const amountBaht = amountSatang / 100;
    const payload = promptpayQR({ accountNumber: promptpayId, amount: amountBaht, reference: receipt.receiptNo || '' });
    const qrSvg: string = qrToString(payload, { type: 'svg' }) as string;
    const qrSize = 90;
    const pageH = doc.page.height;
    doc.image(qrSvg, margin, pageH - margin - qrSize, { width: qrSize, height: qrSize });
    doc.font(regularFontPath).fontSize(7).text('สแกนจ่ายด้วย PromptPay / Scan to pay', margin, pageH - margin - qrSize - 10, { width: qrSize });
  } catch (qrErr) {
    console.warn('QR generation failed:', qrErr);
  }
}
```

**For invoice, adapt:** `receipt.promptpayId` → `invoice.promptpayId || (company as any)?.promptpayId`, `receipt.netAmount` → `invoice.total`, `receipt.receiptNo` → `invoice.invoiceNumber`.

**Verify:** `grep -n "generateInvoicePDFWithPDFKit" src/lib/pdfkit-generator.ts` — function exists.

---

### A16: isReconciled on Receipt/Payment

**Schema Reality (verified):**
- `Receipt` model: check for existing `isReconciled` field.
- `Payment` model: check for existing `isReconciled` field.
- `Cheque` model: has `status` field with values ON_HAND/DEPOSITED/CLEARED/BOUNCED.

**Files to change:**
1. `prisma/schema-sqlite.prisma` — add `isReconciled Boolean @default(false)` to `Receipt` and `Payment`
2. `prisma/schema-postgres.prisma` — same
3. `src/app/api/bank-accounts/[id]/reconcile/route.ts` — replace no-op console.log blocks with actual `db.receipt.update()` / `db.payment.update()`
4. `bun run db:generate`

**Verification:** `grep -n "isReconciled" prisma/schema.prisma` should show on both Receipt and Payment.

---

### A19: Branch Selector UI

**Schema Reality (verified):**
- No `Branch` model exists.
- `Company` has `branchCode String?`.
- `User` has `branchCode String?`.
- `Employee` has `branchCode String?`.
- Auth store (`src/stores/auth-store.ts`) has `BranchInfo` interface but `branches[]` is populated from Company data, not a separate table.

**What "branches" means in this context:** Companies can have multiple branch codes (เลขประจำตัวผู้เสียภาษี สาขา). The selector is for filtering data by branch, not managing branch entities.

**Files to change:**
1. `src/app/page.tsx` — add branch selector dropdown near user info area
2. `src/components/layout/keerati-sidebar.tsx` (if needed)
3. API route may need to accept `?branchCode=X` filter on documents

**Current auth store structure:**
```typescript
interface BranchInfo { id: string; code: string; name: string }
branches: BranchInfo[];       // Available branches
selectedBranchId: string | null; // null = all branches
setSelectedBranch: (id) => void;
```

**The selector needs:** Fetch available branches from `/api/company` (company.branchCode can be comma-separated or separate field).

---

### A3: Remaining Empty States

**Already empty-stated (3):**
- invoice-list.tsx (line 722)
- product-list.tsx (line 306)
- customer-list.tsx (line 449)

**Still need empty states (at minimum):**
- receipt-list.tsx
- payment-list.tsx
- product-list-virtual.tsx
- vendor/supplier list (check if exists)
- Any other list pages under src/components/

**Pattern to follow:** Each empty state uses `<EmptyState icon={FileX} title="ไม่พบ..." description="..." action={...} />`.

---

## Verification Commands

```bash
# A11: Invoice has no QR — confirm
grep -n "qr\|QR\|promptpay\|PromptPay" src/lib/pdfkit-generator.ts | grep -v "receipt\|Receipt"

# A16: isReconciled absent from Receipt/Payment
grep -n "isReconciled" prisma/schema-prisma | grep -E "Receipt|Payment"

# A19: Branch selector absent from page.tsx
grep -c "selectedBranch\|BranchSelector\|branch.*dropdown" src/app/page.tsx

# A3: Empty state coverage
grep -rl "EmptyState" src/components/*/ | wc -l
# vs total list component count
ls src/components/*/*list*.tsx | wc -l
```
