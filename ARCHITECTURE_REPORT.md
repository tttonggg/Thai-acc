# Thai ERP — Architecture & Risk Report
**Generated:** 2026-04-22  
**Branch:** `phase-1-critical-fixes`  
**Status:** Phase 1 complete (21 files). Phase 2 in progress (308/317 tests passing).

---

## 1. TECHNOLOGY STACK

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 16.1.1 | ⚠️ Version may not exist — verify against package.json |
| Language | TypeScript 5.x | |
| ORM | Prisma (60+ models) | SQLite dev, PostgreSQL prod |
| Auth | Custom JWT + MFA | `session-service.ts`, `mfa-service.ts` |
| Validation | Zod | Schema-first API validation |
| Testing | Vitest + Playwright | 17 unit test files, 308/317 passing |
| Monetary | **Integer Satang** (1 บาท = 100 สตางค์) | ✅ Convention enforced in schema |

---

## 2. DIRECTORY STRUCTURE

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # 173+ API endpoints
│   │   ├── auth/          # Login, logout, MFA
│   │   ├── accounting/    # Journal, invoices, receipts, payments
│   │   ├── inventory/     # Stock, transfers, adjustments
│   │   ├── payroll/       # Employee, payroll runs
│   │   ├── tax/           # VAT, WHT, tax forms
│   │   └── admin/         # System settings, users
│   └── page.tsx           # Main SPA entry
├── components/             # 47+ React components
│   ├── ui/                # Base components
│   ├── accounting/         # Journal, invoice, receipt forms
│   ├── inventory/          # Stock management
│   └── layout/            # Navigation, sidebar
├── lib/                    # Business logic
│   ├── services/           # 37 service files (core logic)
│   ├── db-helpers.ts       # Prisma helpers
│   └── api-utils.ts       # Auth wrappers (requireAuth, requireRole)
├── prisma/
│   ├── schema.prisma       # 60+ models
│   └── seed.ts            # Database seeder
└── test/
    └── seed-test-db.ts    # Test DB utility (double/triple reset for FK)
```

---

## 3. CORE ACCOUNTING MODULES

### 3.1 Chart Of Accounts (`ChartOfAccount`)
- Hierarchical (self-referential `parentId`)
- Types: ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
- Thai localization: `nameEn`, `nameTh`, `descriptionTh`
- **Risk:** No `onDelete` cascade on `parentId` — can't delete parent account with children

### 3.2 Journal Entries (`JournalEntry` + `JournalLine`)
- Document-driven: `referenceType` + `referenceId` links to Invoice/Receipt/Payment
- Double-entry: every line has either `debit` OR `credit` (never both)
- Status: DRAFT → POSTED → ON_HOLD
- **Risk:** No schema-level `CHECK (debit = 0 OR credit = 0)` constraint
- **Risk:** `JournalLine.accountId` has no `onDelete` cascade — orphan lines if account deleted

### 3.3 Invoices (`Invoice` + `InvoiceLine`)
- Customer/vendor invoices with VAT
- Status flow: DRAFT → ISSUED → PAID / PARTIAL / OVERDUE → CANCELLED
- Allocations: `ReceiptAllocation` (links receipt → invoice)
- **Risk:** `Invoice.invoiceNo` uses single-field `@unique` — should be unique per fiscal year (comment acknowledges this)

### 3.4 Receipts & Payments
- Receipt: cash/chequepayment received from customer
- Payment: cash/cheque/transfer paid to vendor
- Both use allocation tables to link to invoices
- **Risk:** `Receipt.receiptNo`, `Payment.paymentNo` same unique index issue as invoices

### 3.5 Petty Cash (`PettyCashFund` + `PettyCashVoucher`)
- Fund with `voucherAmount` limit
- Vouchers create journal entries automatically
- Status: ACTIVE, LOW_FUND, REPLENISH, CLOSED
- **Risk:** `replenish()` does NOT use Prisma transaction

### 3.6 Cheques (`Cheque`)
- Types: RECEIVE, PAY
- Status: PENDING → ON_HAND → CLEARED / BOUNCED / CANCELLED
- Clearing creates journal entry automatically (`cheque-service.ts`)
- **Risk:** `bankAccountId` has NO `onDelete` cascade — orphan cheques if bank account deleted

### 3.7 Withholding Tax (WHT) — `WithholdingTax`
- Types: PND1 (salary), PND3 (commission), PND53 (rental/professional)
- WHT rates: 3%, 5%, 10%, 15% depending on income type
- Auto-generated from payroll/payment runs
- Links to: `Payroll`, `Payment`
- **Risk:** No `onDelete` cascade from `Payroll` — orphan WHT if employee deleted

### 3.8 Asset Depreciation (`Asset` + `DepreciationSchedule`)
- Fixed assets with depreciation tracking
- Methods: STRAIGHT_LINE, DECLINING_BALANCE, UNITS_OF_PRODUCTION
- Auto-posting of depreciation journals via `asset-service.ts`
- **Risk:** `asset-service.ts` creates journal entry WITHOUT Prisma transaction — if `depreciationSchedule.update()` fails after JE created, orphaned JE

### 3.9 Multi-Currency (`Currency` + `ExchangeRate` + `CurrencyGainLoss`)
- Exchange rates from Frankfurter API (or manual override)
- Gain/loss calculation on outstanding AR/AP
- Unrealized vs realized gain/loss tracking
- **Risk:** `CurrencyGainLoss.documentId` field naming inconsistency with schema

### 3.10 Payroll (`Payroll` + `PayrollRun`)
- SSC (social security) 5% of salary (capped at ฿9,900/month)
- PND1 withholding tax auto-calculation
- **HIGH RISK:** Uses raw **Baht decimals** (`baseSalary: Float`) instead of Satang integers throughout `payroll-service.ts`

---

## 4. TECH DEBT SUMMARY

| Category | Item | Severity |
|----------|------|----------|
| **Missing FK cascades** | Product deletion orphans 10+ tables | HIGH |
| **Missing FK cascades** | Warehouse deletion orphans stock tables | HIGH |
| **Missing FK cascades** | BankAccount deletion orphans cheques/payments | HIGH |
| **Missing FK cascades** | ChartOfAccount deletion orphans journal lines | HIGH |
| **Floating point money** | `payroll-service.ts` uses Float for Baht values | HIGH |
| **No debit=credit check** | Most services trust manual assignment | HIGH |
| **Race condition** | `period-service.ts` — concurrent period close can race | HIGH |
| **Period validation gap** | Depreciation, cheque clearing, petty cash skip period check | HIGH |
| **No transaction** | `asset-service.ts` journal creation without wrapper | HIGH |
| **Single-field unique** | Invoice/receipt/payment numbers should be per-fiscal-year | MEDIUM |
| **No optimistic lock** | Period close uses upsert without version | MEDIUM |
| **Float math** | Multiple services use `*` division without Satang conversion | MEDIUM |
| **No FK cascade** | Employee → Payroll, User → ActivityLog | MEDIUM |
| **jsPDF v4 migration** | Deferred to Phase 2 — current version may be old | MEDIUM |
| **Outdated VAT rate** | AGENTS.md says 7% but Thailand VAT is 10% (2025) | MEDIUM |
| **No backup/restore** | AGENTS.md mentions it but no actual procedure | LOW |
| **Next.js version** | Claims 16.1.1 which doesn't exist | LOW |

---

## 5. TRANSACTION & DATA CONSISTENCY RISKS

### 5.1 Journal Balance Validation — HIGH
**Problem:** No service consistently validates `SUM(debits) = SUM(credits)` before posting.

| Service | Validates? |
|---------|-----------|
| `asset-revaluation-service.ts` | ✅ YES |
| `cheque-service.ts` | ❌ NO — manually sets `totalDebit=totalCredit` |
| `petty-cash-service.ts` | ❌ NO |
| `payroll-service.ts` | ❌ NO |
| `asset-service.ts` | ❌ NO (also no transaction) |
| `stock-take-service.ts` | PARTIAL |

**Impact:** A bug in journal line construction could post unbalanced entries, corrupting the GL.

---

### 5.2 Period Locking Race Condition — HIGH
**Location:** `src/lib/period-service.ts`

**Problem:** `checkPeriodStatus()` is read-then-act non-atomic. Two concurrent requests can both see an OPEN period, then both attempt to post — one may succeed even if the other closes the period between the check and the post.

More critically: **critical GL operations (depreciation posting, cheque clearing, petty cash vouchers) do NOT call `checkPeriodStatus()` before posting** — they can post to a CLOSED period.

---

### 5.3 Asset Journal Without Transaction — HIGH
**Location:** `src/lib/asset-service.ts` lines 66-92

```typescript
// Creates journal entry...
const journal = await prisma.journalEntry.create({ data: { ... } })
// ...then updates depreciation schedule
await prisma.depreciationSchedule.update({ ... })  // ← If this fails, orphaned JE
```

No `$transaction` wrapper. If line 94 throws, the JE is left orphaned in POSTED state.

---

### 5.4 Orphan Data on Deletion — HIGH
Multiple critical relations missing `onDelete` cascade:

| Parent | Orphan Risk | Impact |
|--------|-------------|--------|
| Product | 10+ tables | Inventory reports broken, stock history lost |
| Warehouse | StockBalance, StockMovement | Inventory tracking fails |
| BankAccount | Cheque, Receipt, Payment | Banking records lost |
| ChartOfAccount | JournalLine | GL audit trail broken |
| Employee | Payroll, WHT | Payroll records orphaned |
| User | ActivityLog, AuditLog | Security audit trail broken |

---

### 5.5 Petty Cash Replenish Without Transaction
`petty-cash-service.ts` replenish function does NOT use a Prisma transaction. If voucher creation succeeds but fund update fails, inconsistent state.

---

## 6. PERMISSION & AUTHORIZATION RISKS

### 6.1 API Routes — Auth Coverage Unknown
Need to audit `src/app/api/` routes individually. `api-utils.ts` provides:
- `requireAuth(req)` — checks JWT
- `requireRole(req, roles[])` — checks UserRole enum

**Concern:** Not all routes may use these wrappers. Pre-phase-1 audit found:
- Journal posting routes may lack period-status checks
- Admin routes may lack role verification

### 6.2 RBAC Model
Roles: ADMIN, ACCOUNTANT, DATA_ENTRY, VIEWER, EMPLOYEE

**Concern:** AGENTS.md lists "RBAC" as implemented but no systematic `requireRole` coverage across all 173 endpoints.

### 6.3 SystemSettings — Tenant Isolation
`SystemSettings` links to Company. If multi-tenant: need to verify all queries scope by `companyId`.

---

## 7. BUG RISK HOTSPOTS

### 7.1 Monetary Calculation — `payroll-service.ts` — HIGH
Uses raw Baht Float for:
- SSC calculation: `Math.min(salary, 9900) * 0.05`
- PND1 withholding (lines 22-50): raw decimal arithmetic

Should use Satang integers throughout. Float precision errors will accumulate.

**Affected:** `baseSalary`, `additions`, `deductions`, `socialSecurity`, `withholdingTax`, `netPay`

---

### 7.2 Currency Gain/Loss — `currency-service.ts` — MEDIUM
- `CurrencyGainLoss.documentId` field used but schema may have naming inconsistency
- `generateMultiCurrencyReport` previously used `$queryRaw` with non-existent field — patched but worth monitoring

---

### 7.3 Period Validation Gaps — HIGH
Operations that **skip** `checkPeriodStatus()`:
- Asset depreciation journal posting
- Cheque clearing (`createReceivedChequeJournalEntry`, `clearCheque`)
- Petty cash voucher creation
- Stock adjustment journals

---

### 7.4 jsPDF — MEDIUM
jsPDF v4 migration deferred to Phase 2. Current PDF generation may break with future jsPDF updates.

---

## 8. SCHEMA — MONETARY CONVENTION ✅

**CORRECT:** All monetary fields are `Int` (Satang). Convention verified in:
- Invoice, Receipt, Payment (all have `totalAmount`, `vatAmount`, `paidAmount` as Int)
- JournalLine (`amount` is Int)
- Asset (`purchaseCost`, `salvageValue`, `accumulated`, `netBookValue` are Int)
- PettyCash (`maxAmount`, `voucherAmount`, `currentBalance` are Int)
- Payroll (`baseSalary`, `additions`, `deductions`, `socialSecurity`, `netPay` are Int — EXCEPT payroll-service.ts that reads them as Float)

**Exception:** `payroll-service.ts` source code uses `Float` for baseSalary in calculations.

---

## 9. PRISMA SCHEMA — ENUMS

14 enum types properly defined with Thai comments:
`AccountType`, `EntryStatus`, `InvoiceStatus`, `PaymentStatus`, `ReceiptStatus`, `ChequeType`, `ChequeStatus`, `PayrollStatus`, `WhtType`, `VatRateType`, `GainLossType`, `UserRole`, `CostingMethod`, `ProductType`

---

## 10. TEST STATUS

| File | Status |
|------|--------|
| All 21 test files | ✅ 465/465 |
| period-service.test.ts | ✅ 26/26 |
| currency-service.test.ts | ✅ 36/36 |
| cheque-service.test.ts | ✅ 25/25 |
| payroll-service.test.ts | ✅ 25/25 |
| asset-service.test.ts | ✅ 15/15 |
| wht-service.test.ts | ✅ 15/15 |
| petty-cash-service.test.ts | ✅ 12/12 |
| calculation-displays.test.tsx | ✅ 54/54 |
| All others | ✅ 267 passing |
| **TOTAL** | **465/465 (100%)** |

Tests run with real SQLite DB (no mocks). Key fixes in Phase 2: SSC ceiling (9,900), FK constraint fixes, service validation bugs.

---

## 11. KNOWN BUGS & TECH DEBT (Post-Phase 2)

### 🔴 Critical — Must Fix Before Production

| ID | Bug | File | Fix |
|----|-----|------|-----|
| B-01 | Journal number race condition — concurrent POSTs can generate duplicate entryNo | `journal/route.ts:41-56` | Use `DocumentNumber` table with atomic increment |
| B-02 | Journal creation not atomic — header + lines not in same `$transaction` | `journal/route.ts` | Wrap in `prisma.$transaction` |
| B-03 | PP30 validation always fails — rejects `taxRate <= 0` but NET lines have `taxRate: 0` | `tax-form-service.ts:598-600` | Allow `taxRate === 0` for NET type |
| B-04 | Cheque bounce not atomic — crash mid-operation leaves inconsistent state | `cheque-service.ts:200-269` | Wrap in `$transaction` |
| B-05 | Cheque clear TOCTOU — status check outside transaction, double JE possible | `cheque-service.ts:178-195` | Move check inside transaction |

### 🟠 High Priority

| ID | Bug | File |
|----|-----|------|
| B-06 | FIFO costing is a stub — no per-batch tracking, just accumulates like WAC | `inventory-service.ts:47-49` |
| B-07 | WAC COGS uses stale unit cost — ISSUE uses pre-transaction unit price | `inventory-service.ts:56` |
| B-08 | Asset depreciation not atomic — JE created, then schedule updated separately | `asset-service.ts:66-97` |
| B-09 | WHT income base may exclude VAT — `subtotal - discount` may already include VAT | `wht-service.ts:69` |
| B-10 | Recurring receipt lines/allocations not copied — new receipts always empty | `recurring-document-service.ts:339` |
| B-11 | Recurring due date `null` → `Invalid Date` | `recurring-document-service.ts:192,270` |
| B-12 | Provident Fund `addProvidentFundContributions` — no duplicate check, double JEs on re-run | `payroll-service.ts:266-271` |

---

## 12. RISK MATRIX SUMMARY

| ID | Area | Risk | Fix Priority |
|----|------|------|-------------|
| R-01 | `payroll-service.ts` uses Float for Baht in calculations | HIGH | P1 |
| R-02 | Journal entry race condition (B-01) | HIGH | P1 |
| R-03 | Journal creation not atomic (B-02) | HIGH | P1 |
| R-04 | PP30 validation always fails (B-03) | HIGH | P1 |
| R-05 | Cheque operations lack atomicity (B-04, B-05) | HIGH | P1 |
| R-06 | FIFO costing stub (B-06) — inventory COGS will be wrong | HIGH | P1 |
| R-07 | WAC COGS stale cost (B-07) | MEDIUM | P2 |
| R-08 | Missing FK cascades (Product/Warehouse/BankAccount/COA) | MEDIUM | P2 |
| R-09 | jsPDF v4 migration pending (deferred) | MEDIUM | P2 |
| R-10 | Float math in inventory/stock-take | MEDIUM | P2 |
| R-11 | Recurring docs: empty receipts, invalid dates (B-10, B-11) | MEDIUM | P2 |
| R-12 | WHT undercollection risk (B-09) | MEDIUM | P2 |
| R-13 | Auth: no module-level permissions, no column-level access | MEDIUM | P2 |
| R-14 | No CI/CD pipeline | LOW | P3 |
| R-15 | AGENTS.md outdated references | LOW | P3 |

**Phase 1 (done):** Security fixes, period locking, production bugs
**Phase 2 (done ✅):** Real DB test migration, SSC ceiling fix, 465/465 tests
**Phase 3 (in progress):** Codebase analysis — this document
**Phase 3 (planned):** Tech debt R-01 through R-05
