# Thai-Acc Add-Ons — Master Implementation Plan
**Generated:** 2026-05-05 | **User:** Tong | **Branch:** `dev/performance-framework`
**Dev Cycle:** /spec → /plan → /build → /test → /review → /simplify → /ship

---

## Phase 0: Pre-flight (Blocker — ต้องทำก่อน)

จะเริ่ม add-on ใดก็ตาม ต้อง fix TypeScript errors 10 ตัวก่อน ไม่งั้น build จะ fail

### Task 0a: Fix TS Errors (2 files)
**File:** `src/app/api/users/route.ts` + `src/app/api/warehouses/route.ts` + `src/app/api/users/[id]/route.ts`
**Dev Cycle Step:** /spec → /build → /test → /review → /ship
**Command:** `bun run tsc --noEmit`

| # | Error | File | Fix |
|---|-------|------|-----|
| T1 | `catch (error: unknown)` | users/route.ts, users/[id]/route.ts, warehouses/route.ts | `catch (error)` ลบ `: any` ออก |
| T2 | `Property 'name'/'statusCode' does not exist on type '{}'` | users/route.ts | Error object destructuring ผิดรูปแบบ |

**Verify:** `bun run tsc --noEmit` → exit 0

---

## Phase 1: Quick Wins (Week 1, ~1 วัน)

### A1: Quick Action FAB Button
**Spec file:** `.hermes/plans/2026-05-05-A1-quick-action-fab.md`
**Dev Cycle:** /spec → /plan → /build → /test → /review → /ship

### A2: Starting Date Error Fix (UX)
**Spec file:** `.hermes/plans/2026-05-05-A2-starting-date-error-fix.md`
**Dev Cycle:** /spec → /plan → /build → /test → /review → /ship

### A3: Empty State Redesign
**Spec file:** `.hermes/plans/2026-05-05-A3-empty-state-redesign.md`
**Dev Cycle:** /spec → /plan → /build → /test → /review → /ship

### A9: Global Search (Ctrl+K)
**Spec file:** `.hermes/plans/2026-05-05-A9-global-search.md`
**Dev Cycle:** /spec → /plan → /build → /test → /review → /simplify → /ship

**Phase 1 รวม:** 4 tasks, ~1 วัน, ไม่มี dependency

---

## Phase 2: Backend→UI (Week 1-2, ~1.5 วัน)

### A6: Approval Workflow UI (Backend มีอยู่แล้ว)
**Spec file:** `.hermes/plans/2026-05-05-A6-approval-workflow-ui.md`
**Dev Cycle:** /spec → /plan → /build → /test → /review → /simplify → /ship

### A7: Tax Form Auto-Fill UI (PND3/PND53 — Backend มี)
**Spec file:** `.hermes/plans/2026-05-05-A7-tax-form-ui.md`
**Dev Cycle:** /spec → /plan → /build → /test → /review → /simplify → /ship

### A8: Recurring Document UI (Backend มี)
**Spec file:** `.hermes/plans/2026-05-05-A8-recurring-document-ui.md`
**Dev Cycle:** /spec → /plan → /build → /test → /review → /simplify → /ship

### A4: Payslip PDF Template
**Spec file:** `.hermes/plans/2026-05-05-A4-payslip-pdf.md`
**Dev Cycle:** /spec → /plan → /build → /test → /review → /simplify → /ship

**Phase 2 รวม:** 4 tasks, ~1.5 วัน

---

## Phase 3: Invoice Quality (Week 2, ~2 วัน)

### A5: Invoice Thai Font Template (PDFKit)
**Spec file:** `.hermes/plans/2026-05-05-A5-invoice-thai-font.md`
**Dev Cycle:** /spec → /plan → /build → /test → /review → /simplify → /ship
**Dependency:** A5 ต้องเสร็จก่อน A11

### A11: QR PromptPay on Invoice
**Spec file:** `.hermes/plans/2026-05-05-A11-qr-promptpay.md`
**Dev Cycle:** /spec → /plan → /build → /test → /review → /simplify → /ship
**Dependency:** A11 ต้องรอ A5 เสร็จก่อน (same PDF template)

**Phase 3 รวม:** 2 tasks, ~2 วัน

---

## Phase 4: Alerts & Budget (Week 2-3, ~2 วัน)

### A20: Notification Center UI
**Spec file:** `.hermes/plans/2026-05-05-A20-notification-center-ui.md`
**Dev Cycle:** /spec → /plan → /build → /test → /review → /simplify → /ship

### A12: Low-Stock Alert System
**Spec file:** `.hermes/plans/2026-05-05-A12-low-stock-alert.md`
**Dev Cycle:** /spec → /plan → /build → /test → /review → /simplify → /ship

### A17: Budget vs Actual UI
**Spec file:** `.hermes/plans/2026-05-05-A17-budget-vs-actual-ui.md`
**Dev Cycle:** /spec → /plan → /build → /test → /review → /simplify → /ship

### A10: Auto Email Reminder
**Spec file:** `.hermes/plans/2026-05-05-A10-auto-email-reminder.md`
**Dev Cycle:** /spec → /plan → /build → /test → /review → /simplify → /ship

**Phase 4 รวม:** 4 tasks, ~2 วัน

---

## Phase 5: Complex (Week 3+, ~3+ สัปดาห์)

### A13: Bank Auto-Match Engine
**Spec file:** `.hermes/plans/2026-05-05-A13-bank-auto-match.md`
**Dev Cycle:** /spec → /plan → /build → /test → /review → /simplify → /ship

### A16: Auto-Bank Rec (Full)
**Dependency:** A13 เสร็จก่อน

### A14: Project/Job Costing
**Spec file:** `.hermes/plans/2026-05-05-A14-project-costing.md`
**Dev Cycle:** /spec → /plan → /build → /test → /review → /simplify → /ship

### A15: Customer Portal
**Spec file:** `.hermes/plans/2026-05-05-A15-customer-portal.md`
**Dev Cycle:** /spec → /plan → /build → /test → /review → /simplify → /ship

### A18: Field-Level Audit Trail
**Spec file:** `.hermes/plans/2026-05-05-A18-audit-trail.md`
**Dev Cycle:** /spec → /plan → /build → /test → /review → /simplify → /ship

### A19: Multi-Branch UI
**Spec file:** `.hermes/plans/2026-05-05-A19-multi-branch-ui.md`
**Dev Cycle:** /spec → /plan → /build → /test → /review → /simplify → /ship

**Phase 5 รวม:** 6 tasks, ~3+ สัปดาห์

---

## Execution Order

```
Week 1:
  Day 1: T0 (TS fix) → A2 → A3 (parallel)
  Day 2: A1 → A9

Week 1-2:
  Day 3: A6 → A7 (parallel, both backend exists)
  Day 4: A8 → A4 (parallel)
  Day 5: A5 (Invoice Thai font)

Week 2:
  Day 6: A11 (QR, depends on A5)
  Day 7: A20 → A12 (parallel)
  Day 8: A17 → A10 (parallel)

Week 2-3:
  Day 9-10: A13 (Bank auto-match engine — hardest)
  Day 11+: A16, A14, A15, A18, A19
```

---

## Current TS Error Files (Quick Ref)
```
src/app/api/users/route.ts         — TS2339: name/statusCode on {}
src/app/api/users/[id]/route.ts   — TS18046: error unknown
src/app/api/warehouses/route.ts   — TS18046: error unknown
src/app/api/stock/transfers/route.ts — TS18046: error unknown
src/app/api/test-auth/route.ts    — TS18046: error unknown
```

---

## Verification Commands
```bash
# TypeScript
bun run tsc --noEmit

# Build
npm run build

# Quick test (smoke)
bun run test:quick

# Count plans
ls .hermes/plans/2026-05-05-A*.md | wc -l  # should be 17 plan files
```
