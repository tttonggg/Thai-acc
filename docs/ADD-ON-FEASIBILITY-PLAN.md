# Thai-Acc / Keerati — Add-On Feasibility & Implementation Plan

**Date:** 2026-05-04
**Status:** Research complete
**Branch:** `dev/performance-framework`

---

## Executive Summary

From 20 candidate add-ons researched, **11 already exist** (partially/completely) in the codebase. This changes the plan dramatically — we can focus dev time on completing/improving existing features rather than building from scratch.

### Discovery: What's Already Implemented (Hidden/Incomplete)

| Feature | File(s) | Status |
|---------|---------|--------|
| Recurring Documents Engine | `src/lib/recurring-document-service.ts` (611 lines) | ✅ Engine done, no UI |
| Approval Workflow (Purchase Requests) | `src/app/api/purchase-requests/[id]/approve/route.ts` | ✅ Backend done, no UI |
| WHT Auto-Generation | `src/lib/wht-service.ts` (162 lines) | ✅ Done |
| Tax Form Generation (PND3/PND53) | `src/lib/tax-form-service.ts` (595 lines) | ✅ Backend done, no UI |
| PDF Invoice Generation | `src/lib/pdfkit-generator.ts` (951 lines) | ✅ PDFKit done, jsPDF broken |
| PDF Export Button | `src/components/pdf-export-button.tsx` | ✅ Basic UI exists |
| Bank Reconciliation | `src/app/api/bank-accounts/[id]/reconcile/route.ts` | ✅ UI + API, auto-match engine missing |
| Budget System | `prisma.schema` has `DepartmentBudget` | ✅ Schema done, no UI |

**Net remaining add-ons to build from scratch: ~12**

---

## Add-On Feasibility Matrix

Difficulty scale: 🟢 Easy (1-2h) | 🟡 Medium (half-day) | 🔴 Hard (1-2 days) | ⚫ Complex (3-5 days)

| # | Add-On | Difficulty | Time | Effort | Already Done? | Notes |
|---|--------|-----------|------|--------|----------------|-------|
| **A1** | Quick Action Buttons (Dashboard) | 🟢 Easy | 1-2h | Low | N/A | UI only |
| **A2** | Starting Date Error Fix | 🟢 Easy | 30m | Trivial | N/A | UX fix |
| **A3** | Empty State Redesign | 🟢 Easy | 1-2h | Low | N/A | UX only |
| **A4** | Payslip PDF Template | 🟡 Medium | 2-3h | Low | Partial | Reuse pdfkit-generator |
| **A5** | Invoice Template + Thai Font (PDFKit) | 🟡 Medium | 2-4h | Low | Partial | pdfkit-generator.ts exists, just needs Thai fonts |
| **A6** | Approval Workflow UI (Config Page) | 🟡 Medium | 3-4h | Medium | YES | Backend done, need config UI |
| **A7** | Tax Form Auto-Fill UI (PND3/PND53) | 🟡 Medium | 3-4h | Medium | YES | Backend done, need UI + integration |
| **A8** | Recurring Document UI | 🟡 Medium | 3-4h | Medium | YES | Backend done, need UI |
| **A9** | Global Search (Ctrl+K) | 🟡 Medium | 2-3h | Low | NO | Uses existing API, easy search UI |
| **A10** | Auto Email Reminder (Invoice) | 🔴 Hard | 2-3h | Medium | NO | Needs email service (nodemailer) |
| **A11** | QR PromptPay on Invoice | 🟡 Medium | 2-3h | Low | NO | QR generation lib + PDF embed |
| **A12** | Low-Stock Alert System | 🟡 Medium | 2-3h | Medium | NO | Needs notification system |
| **A13** | Bank Auto-Match Engine | 🔴 Hard | 2-3 days | High | Partial | API exists, auto-match algorithm missing |
| **A14** | Project/Job Costing | ⚫ Complex | 3-5 days | High | NO | New schema + full module |
| **A15** | Customer Portal | ⚫ Complex | 3-5 days | High | NO | New auth + views |
| **A16** | Auto-Bank Rec (Full) | ⚫ Complex | 3-5 days | High | Partial | See A13 |
| **A17** | Budget vs Actual UI | 🟡 Medium | 3-4h | Medium | Partial | Schema done, need UI + reports |
| **A18** | Audit Trail (Field-Level) | 🔴 Hard | 2 days | Medium | NO | Needs history table + tracking |
| **A19** | Multi-Branch Support UI | 🔴 Hard | 2 days | High | Partial | Schema has branchId, UI needed |
| **A20** | Notification Center UI | 🟡 Medium | 2-3h | Low | Partial | Socket.io exists, need UI panel |

### Groupable (Can Build Together)

**Parallel Track 1 — Low Effort, High Visibility (Week 1)**
- A1 (Quick Actions) + A2 (Starting Date Fix) + A3 (Empty States)
- A9 (Global Search) — independent

**Parallel Track 2 — Completing Existing Backend (Week 1-2)**
- A6 (Approval Config UI) — backend already done
- A7 (Tax Form UI) — backend already done
- A8 (Recurring Document UI) — backend already done
- A5 (Invoice Template + Thai Font) — pdfkit-generator exists

**Parallel Track 3 — New Features (Week 2-3)**
- A11 (QR PromptPay) — A5 must be done first (same PDF template)
- A4 (Payslip PDF) — reuse pdfkit-generator
- A17 (Budget vs Actual UI) — schema exists

**Complex Features (Week 3+)**
- A13/A16 (Bank Auto-Match) — needs algorithm work
- A14 (Project Costing) — new schema + module
- A15 (Customer Portal) — separate auth needed

---

## Detailed Implementation Plans

### A1: Quick Action Buttons on Dashboard
**Difficulty:** 🟢 Easy | **Time:** 1-2h | **File:** `src/app/page.tsx`

**What:** Add large action buttons to dashboard for common tasks:
- "+ สร้างใบวางบิล" (New Invoice)
- "+ บันทึกรายจ่าย" (New Expense/Payment)
- "+ สร้างใบเสนอราคา" (New Quote)
- "+ ดึงข้อมูลธนาคาร" (Import Bank)

**How:**
1. Add `action-buttons.tsx` component
2. Import into `page.tsx` dashboard section
3. Each button calls existing API route + navigates to form

**Dev Cycle:**
```
/spec (tiny — 1 paragraph)
/build (action-buttons.tsx)
/test (manual — click each button)
/review
/simplify
/ship
```

**Verify:** `npm run build` ✅

---

### A2: Starting Date Blocking Error Fix
**Difficulty:** 🟢 Easy | **Time:** 30min | **File:** `src/app/page.tsx` (login redirect logic)

**What:** On first login, the "set starting date" error blocks everything with no easy way out. Fix:
1. Add inline link "ไปตั้งค่า" that jumps to settings
2. Or auto-redirect to settings if no starting date set

**Dev Cycle:** /build → /ship (trivial)

---

### A3: Empty State Redesign
**Difficulty:** 🟢 Easy | **Time:** 1-2h | **Files:** Multiple component files

**What:** Replace plain "No data" text with illustrated empty states + CTA buttons.
Pattern: icon + message + "สร้างรายการแรก" button

**Files to update:**
- Invoice list (no invoices yet)
- Receipt list
- Payment list
- Product list
- Customer/Supplier list

**Dev Cycle:** /build each → /review → /ship

---

### A5: Invoice PDF Template with Thai Font + QR
**Difficulty:** 🟡 Medium | **Time:** 2-4h | **File:** `src/lib/pdfkit-generator.ts`

**What:** Improve invoice PDF to:
1. Use Sarabun/THSarabun font (Thai font, open license)
2. Add company logo (from Company settings)
3. Add QR PromptPay code (optional field on invoice)
4. Professional Thai-language layout

**Dependencies:** A11 (QR generation)

**Dev Cycle:**
```
/spec (Thai invoice template spec)
/build (pdfkit-generator.ts updates)
/test (manual PDF preview)
/review
/simplify
/ship
```

**Note:** jsPDF version (`src/lib/pdf-generator.ts`) is broken (autoTable API mismatch). PDFKit version works. Use PDFKit.

---

### A6: Approval Workflow Configuration UI
**Difficulty:** 🟡 Medium | **Time:** 3-4h | **Files:** `src/components/approval/`, `src/app/api/approvals/config/`

**What Exists:** `DocumentApproverConfig` schema + `purchase-request approve API` + role-based check

**What's Missing:** UI to configure approval rules

**Schema (already exists):**
```prisma
model DocumentApproverConfig {
  id            String @id
  documentType  String  // PURCHASE_REQUEST, INVOICE, PAYMENT
  approvalOrder Int
  roleId        String
}
```

**UI Needs:**
- Settings → Approval Rules page
- CRUD for DocumentApproverConfig
- For each document type: set approval chain (order + role)

**Can Extend To:**
- Invoice approval (before posting)
- Payment approval (before payment)
- Purchase Order approval (already has approve API)

**Dev Cycle:**
```
/spec (approval config UI spec)
/build (approval-config-page.tsx + API routes)
/test (manual — create config, try to approve PR)
/review
/simplify
/ship
```

---

### A7: Tax Form Auto-Fill UI (PND3/PND53)
**Difficulty:** 🟡 Medium | **Time:** 3-4h | **Files:** `src/components/tax/`, `src/lib/tax-form-service.ts` (already exists)

**What Exists:** `tax-form-service.ts` — `generatePND3()`, `generatePND53()` functions that pull from `WithholdingTax` records

**What's Missing:** UI to:
1. Select month/year
2. Preview PND3/PND53 form data
3. Generate PDF
4. Submit/print

**Integration Flow:**
```
User clicks "ภาษีหัก ณ ที่จ่าย" → Select month/year
→ System fetches all WHT records for that month
→ Shows form with payee names, income types, amounts, tax
→ "สร้าง PDF" → generates PND3/PND53 form
→ Print or submit to RD
```

**Dev Cycle:**
```
/spec (tax form UI spec)
/build (tax-form-page.tsx — existing service handles logic)
/test (manual — generate PND3 for current month)
/review
/simplify
/ship
```

---

### A8: Recurring Document UI
**Difficulty:** 🟡 Medium | **Time:** 3-4h | **Files:** `src/lib/recurring-document-service.ts` (611 lines exists)

**What Exists:** Full recurring document engine:
- `createRecurringDocument()`, `calculateNextRun()`, `processRecurringDocuments()`
- Types: INVOICE, EXPENSE, RECEIPT
- Frequencies: MONTHLY, QUARTERLY, YEARLY
- Scheduled via `src/lib/scheduler.ts`

**What's Missing:** UI to:
1. List recurring documents
2. Create/edit recurring templates
3. View next run date
4. Pause/resume

**Component:** `src/components/recurring/recurring-documents.tsx` (stub exists)

**Dev Cycle:**
```
/spec (recurring document UI spec)
/build (recurring-documents.tsx full implementation)
/test (create a recurring invoice, check scheduler)
/review
/simplify
/ship
```

---

### A9: Global Search (Ctrl+K Command Bar)
**Difficulty:** 🟡 Medium | **Time:** 2-3h | **Files:** `src/components/search/command-palette.tsx`

**What:** Press `Ctrl+K` → modal with search input → search across:
- Invoices (by number, customer)
- Customers (by name)
- Products (by name/code)
- Journal entries

**Implementation:**
1. Single endpoint `GET /api/search?q=keyword&type=all`
2. `CommandPalette` component with keyboard shortcut
3. Results grouped by type

**Dev Cycle:**
```
/spec (search command palette spec)
/build (search API + command-palette.tsx)
/test (manual)
/review
/simplify
/ship
```

---

### A10: Auto Email Reminder
**Difficulty:** 🔴 Hard | **Time:** 2-3h | **Files:** email service + scheduled job

**What:** When invoice is >7 days overdue, auto-send reminder email.

**Requires:**
1. Email service (nodemailer/SMTP) — NOT in codebase
2. Scheduled job (cron or scheduler.ts)
3. Email templates (Thai)

**Blocker:** No email infrastructure exists. Must install nodemailer + SMTP config.

**Dev Cycle:**
```
/spec (email reminder spec)
/build (email service + templates + scheduler)
/test (manual — send test email)
/review
/simplify
/ship
```

---

### A11: QR PromptPay on Invoice
**Difficulty:** 🟡 Medium | **Time:** 2-3h | **Files:** `src/lib/qr-generator.ts` (new) + PDF template

**What:** Generate QR code for PromptPay payment on invoice PDF.

**Implementation:**
```typescript
// Simple QR with bank account info (no library needed for basic QR)
import QRCode from 'qrcode'; // or 'qrcode' npm package

function generatePromptPayQR(amount: number, accountNo: string): string {
  // Thai QR payment format (Pseudocode)
  const qrData = buildThaiQRPayload({
    amount,
    accountNo,
    merchantName: 'COMPANY NAME'
  });
  return QRCode.toDataURL(qrData);
}
```

**Easy version:** Use `qrcode` npm package + bank account from SystemSettings.

**Must wait for:** A5 (Invoice template updates) so QR can be embedded in PDF.

**Dev Cycle:**
```
/spec (QR PromptPay spec)
/build (qr-generator.ts)
/test (generate QR, verify with banking app)
/review
/simplify
/ship
```

---

### A12: Low-Stock Alert
**Difficulty:** 🟡 Medium | **Time:** 2-3h | **Files:** notification service + product pages

**What:** When stock falls below `reorderPoint`, trigger notification.

**Schema already has:** `Product.reorderPoint?` (check)

**Flow:**
1. Product creation/edit: set `reorderPoint`
2. Stock transaction: check if new qty < reorderPoint
3. If so → create notification + optionally email

**Dev Cycle:**
```
/spec (low-stock alert spec)
/build (stock alert check in product-service.ts)
/test (create product with reorderPoint=10, reduce stock to 5)
/review
/simplify
/ship
```

---

### A13: Bank Auto-Match Engine
**Difficulty:** 🔴 Hard | **Time:** 2-3 days | **Files:** `src/lib/bank-auto-match.ts` (new)

**What Exists:** Bank reconciliation API (`bank-accounts/[id]/reconcile/route.ts`) — manual matching.

**What's Missing:** Automatic matching algorithm:
1. Upload bank statement CSV
2. Parse → extract: date, amount, description
3. For each bank line, find matching:
   - Receipt/Payment by amount + date range (±3 days)
   - Customer/Vendor by reference number
4. Present confidence scores: High/Medium/Low/None
5. User approves/rejects matches
6. Auto-create reconciled records

**Algorithm Complexity:**
```typescript
// Matching logic
function findMatch(bankLine: BankStatementLine): MatchResult {
  // Exact match: amount = invoice total, date within 1 day
  // Fuzzy match: amount = invoice partial, description contains invoice no
  // No match: flag for manual review
}
```

**Dev Cycle:**
```
/spec (bank auto-match algorithm spec)
/build (bank-auto-match.ts + CSV parser)
/test (upload CSV, verify matching logic)
/review
/simplify
/ship
```

---

### A17: Budget vs Actual UI
**Difficulty:** 🟡 Medium | **Time:** 3-4h | **Files:** `src/components/budget/` + `src/app/api/budget/`

**What Exists:** `DepartmentBudget` schema

**What's Missing:** Everything UI-wise:
- Budget creation per department
- Budget vs actual report (per category)
- Alert when 80%/100% consumed

**Dev Cycle:**
```
/spec (budget UI spec)
/build (budget components + API routes)
/test (set budget ฿100k for marketing, record ฿80k expense, see alert)
/review
/simplify
/ship
```

---

## Recommended Implementation Order

### Phase 1: Quick Wins (Week 1, Day 1-2) — No Spec Needed
Build all in parallel, commit together:

| Task | Time | Command |
|------|------|---------|
| A1: Quick Action Buttons | 1-2h | `/build` |
| A2: Starting Date Fix | 30min | `/build` |
| A3: Empty State Redesign | 1-2h | `/build` |
| A9: Global Search | 2-3h | `/spec + /build` |

**Total Phase 1: ~1 day**

### Phase 2: Complete Existing Backends (Week 1-2)
These all have backend code — just need UI:

| Task | Time | Dependency | Command |
|------|------|-----------|---------|
| A6: Approval Config UI | 3-4h | None | `/spec + /build` |
| A7: Tax Form UI | 3-4h | None | `/spec + /build` |
| A8: Recurring Document UI | 3-4h | None | `/spec + /build` |
| A4: Payslip PDF | 2-3h | None | `/spec + /build` |

**Total Phase 2: ~1.5 days**

### Phase 3: Invoice Quality (Week 2)
| Task | Time | Dependency | Command |
|------|------|-----------|---------|
| A5: Invoice Thai Font Template | 2-4h | A4 first (share PDF infra) | `/spec + /build` |
| A11: QR PromptPay on Invoice | 2-3h | A5 first | `/spec + /build` |

**Total Phase 3: ~2 days**

### Phase 4: Alerts & Notifications (Week 2-3)
| Task | Time | Dependency | Command |
|------|------|-----------|---------|
| A20: Notification Center UI | 2-3h | Socket.io exists | `/spec + /build` |
| A12: Low-Stock Alert | 2-3h | A20 first | `/spec + /build` |
| A17: Budget vs Actual | 3-4h | None | `/spec + /build` |
| A10: Auto Email Reminder | 2-3h | A20 first (needs email service) | `/spec + /build` |

**Total Phase 4: ~2 days**

### Phase 5: Complex (Week 3+)
| Task | Time | Difficulty | Notes |
|------|------|-----------|-------|
| A13/A16: Bank Auto-Match | 3-5 days | Complex | Algorithm work |
| A14: Project Costing | 3-5 days | Complex | New schema + module |
| A15: Customer Portal | 3-5 days | Complex | Separate auth |
| A18: Field-Level Audit | 2 days | Hard | History tracking |
| A19: Multi-Branch UI | 2 days | Hard | Schema exists |

---

## What Can Run in Parallel

### Parallel Group A (Independent, Same Week)
- A1 (Quick Actions) — UI only
- A2 (Starting Date Fix) — UX only
- A9 (Global Search) — new API + UI

### Parallel Group B (Independent, Same Week)
- A6 (Approval UI) — existing backend
- A7 (Tax Form UI) — existing backend
- A8 (Recurring UI) — existing backend
- A4 (Payslip) — reuse pdfkit-generator

### Parallel Group C (Dependent on Phase 2)
- A5 (Invoice Template) — needs A4 first (same PDF infra)
- A11 (QR Code) — needs A5 first (same PDF template)

### Parallel Group D (Dependent on Phase 2-3)
- A20 (Notification UI) — Socket.io exists
- A12 (Low-Stock) — needs A20 or standalone
- A17 (Budget) — independent but uses existing schema

---

## Commit Strategy

Each phase = 1 commit (or multiple small commits if parallel tasks):

```
Phase 1: "feat(ui): quick actions, empty states, global search"
Phase 2: "feat(approval): approval workflow config UI"
         "feat(tax): PND3/PND53 form generation UI"
         "feat(recurring): recurring document management UI"
         "feat(payroll): payslip PDF generation"
Phase 3: "feat(invoice): professional Thai invoice template + QR"
Phase 4: "feat(alerts): notification center, low-stock, budget tracking"
Phase 5: "feat(banking): auto bank statement matching engine"
         "feat(projects): project costing module"
```

---

## Tech Debt & Prerequisites

Before building Phase 2+, verify:

1. **PDFKit over jsPDF** — `pdfkit-generator.ts` works, `pdf-generator.ts` (jsPDF) is broken. Use PDFKit only.
2. **SMTP/Email** — no nodemailer in `package.json`. Need to install if doing A10.
3. **QR library** — `npm install qrcode` (or similar) needed for A11.
4. **Scheduler** — `src/lib/scheduler.ts` exists and handles recurring jobs.
5. **Socket.io** — `src/lib/socket.ts` + notifications exist for real-time UI.

---

## Summary Table

| Phase | Tasks | Time | What |
|-------|-------|------|------|
| **Phase 1** | A1, A2, A3, A9 | ~1 day | Quick wins, no backend needed |
| **Phase 2** | A6, A7, A8, A4 | ~1.5 days | Complete existing backends |
| **Phase 3** | A5, A11 | ~2 days | Invoice quality + QR |
| **Phase 4** | A20, A12, A17, A10 | ~2 days | Alerts, budgets, email |
| **Phase 5** | A13, A14, A15, A18, A19 | ~3+ weeks | Complex features |

**Total for Phases 1-4: ~6.5 days of dev time**

**Start with Phase 1 tasks immediately** — no spec needed, pure UI work.
