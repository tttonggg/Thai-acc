# Thai ERP — Lean, Performance & Framework Master Plan

**Project:** Thai Accounting ERP (Keerati)
**Generated:** 2026-05-01
**Branch:** `dev/performance-framework`
**Status:** MASTER PLAN — integrates all three tier plans

---

## MASTER OVERVIEW

### Executive Summary

The Thai Accounting ERP (Keerati) codebase carries 18+ critical data-integrity risks, architectural defects that block performance scaling, and tight coupling that prevents framework reuse. This master plan coordinates three parallel workstreams — **TIER1** (critical debt & security), **TIER2** (performance optimization), and **TIER3** (framework extraction) — into a single cohesive execution roadmap. TIER1 items are prerequisites for TIER2, and both must complete before framework extraction can begin. Total estimated effort: **~380+ agent-hours** across 16+ weeks.

### Current State Assessment

| Dimension | State |
|-----------|-------|
| **Data Integrity** | 18 routes missing Prisma transactions — active data-corruption risk |
| **Security** | CSRF bypass via env var, unauthenticated journal post (verified fixed), rate-limit exemption on invoices |
| **Accounting Logic** | Hardcoded account codes (2+ files), stock-take JE totals bug, float arithmetic in payroll |
| **Race Conditions** | 3 document-number generators using non-atomic findFirst+increment pattern |
| **Performance** | 22.3s webpack build, 4.1MB static, 126 dynamic routes, no code splitting, N+1 queries |
| **Architecture** | Monolithic Next.js app — 65% generic / 35% Thai-specific coupling |

### Target State

- All financial operations atomic with full audit trails and RBAC enforcement
- Build time <5s (Turbopack), bundle <3MB, API P95 <500ms, list renders <500ms
- Extracted monorepo framework with plugin architecture supporting Thai locale + generic domains

### Three-Stream Architecture Diagram

```
=================================================================
  THREE-STREAM ARCHITECTURE — Thai ERP Master Plan
=================================================================

  ┌─────────────────────────────────────────────────────────┐
  │                    TIER 1 (WEEKS 1-6)                   │
  │         Technical Debt & Critical Issues                │
  │                                                         │
  │  [1.1] Invoice/Rcpt/Pmt/Journal Tx Wrappers             │
  │  [1.2] Hard Delete → Soft Delete (6 entities)           │
  │  [1.3] Race Condition Fixes (doc numbers, period lock) │
  │  [1.4] Dependency & Middleware Security                 │
  │  [1.5] Audit Trail Completeness (postedById, createdById│
  │  [1.6] Accounting Logic Bugs (stock-take, payroll)      │
  └────────────────────┬────────────────────────────────────┘
                       │ TIER1 must PASS before TIER2
                       ▼
  ┌─────────────────────────────────────────────────────────┐
  │                    TIER 2 (WEEKS 5-10)                  │
  │              Performance Optimization                   │
  │                                                         │
  │  [2.1] Frontend: Lazy load, code split, virtual lists │
  │  [2.2] Backend/API: N+1 fixes, composite indexes       │
  │  [2.3] Database: Prisma query caching, connection pool │
  │  [2.4] Build: Turbopack, bundle analyzer, Prisma gen   │
  │  [2.5] Memory: Event listener cleanup, QueryClient     │
  └────────────────────┬────────────────────────────────────┘
                       │ TIER1+2 must PASS before TIER3
                       ▼
  ┌─────────────────────────────────────────────────────────┐
  │                   TIER 3 (WEEKS 10-16)                  │
  │               Framework Extraction                      │
  │                                                         │
  │  [3.1] Domain Separation (core vs thai vs domain pkgs) │
  │  [3.2] Framework Architecture (plugin system, eventbus│
  │  [3.3] Skeleton/Starter Template (Turborepo monorepo)  │
  │  [3.4] Module Extraction Workflow                      │
  │  [3.5] Configuration System                            │
  │  [3.6] Auth & Multi-Tenancy (row-level security)      │
  │  [3.7] Migration & Upgrade Path                        │
  │  [3.8] Documentation & DX                             │
  └─────────────────────────────────────────────────────────┘

  SHARED INFRASTRUCTURE (all tiers):
  ├── Prisma ORM (SQLite dev / PostgreSQL prod)
  ├── NextAuth.js v4 + RBAC
  ├── TanStack Query v5 + Zustand v5
  ├── shadcn/ui + Tailwind CSS v4
  └── Bun runtime
=================================================================
```

---

## MASTER FLOWCHART

```
START
  │
  ▼
┌──────────────────────────────────────────────────┐
│ PHASE 0: VERIFICATION (Day 1)                    │
│  • Audit all 18 routes for transaction gaps      │
│  • Confirm journal/[id]/post auth status        │
│  • Map all hard-delete entities                  │
│  • Inventory race-condition sites                │
└────────────────────┬─────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────┐
│ MILESTONE M1: TIER1 BLOCKERS (Weeks 1-2)         │
│  B-01 to B-10 (BLOCKER items from TIER1)        │
│  [B-01] Add postedById to journal post           │
│  [B-02] Asset depreciation transaction           │
│  [B-03] PP30 taxRate===0 validation             │
│  [B-04] Cheque bounce atomicity                 │
│  [B-05] Cheque clear TOCTOU                     │
│  [B-06] FIFO costing stub (batch tracking)      │
│  [B-07] Remove BYPASS_CSRF env var             │
│  [B-08] Stock take JE totals bug               │
│  [B-09] Period locking TOCTOU                   │
│  [B-10] Journal entryNo race condition          │
└────────────────────┬─────────────────────────────┘
                     │ All blockers pass
                     ▼
┌──────────────────────────────────────────────────┐
│ MILESTONE M2: TIER1 HIGH-PRIORITY (Weeks 2-4)   │
│  H-01 to H-10 (High-priority items from TIER1)  │
│  • Invoice/Payment/Receipt atomic wrappers       │
│  • Hardcoded account → SystemSettings lookups   │
│  • Soft delete migration (6 entities)            │
│  • Payroll float→Satang integer arithmetic      │
│  • Audit trail completeness (postedById, createdById)
└────────────────────┬─────────────────────────────┘
                     │ High-priority pass
                     ▼
┌──────────────────────────────────────────────────┐
│ MILESTONE M3: TIER1 MEDIUM + TIER2 STARTS        │
│  M-01 to M-08 (Medium items from TIER1)         │
│  TIER2 Phase 1: Quick wins (Turbopack, indexes) │
│  • .env.example creation                         │
│  • Rate-limit /api/invoices fix                 │
│  • Turbopack enable + bundle analyzer           │
│  • Missing composite indexes (PostgreSQL)        │
└────────────────────┬─────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          │ Parallel Streams    │
          ▼                    ▼
┌──────────────────┐  ┌──────────────────────────────────┐
│ MILESTONE M4:    │  │ MILESTONE M4:                     │
│ TIER1 MEDIUM     │  │ TIER2 PHASE 2 (Weeks 5-7)         │
│ (cont.)          │  │ Component optimization             │
│ • env.example    │  │ • Split invoice-list (1195 lines) │
│ • Host header    │  │ • Lazy load page.tsx modules      │
│   bypass fix     │  │ • @tanstack/react-virtual        │
│ • Petty cash tx  │  │ • Zustand store optimization      │
│ • createdById    │  │ • TanStack Query staleTime 5min  │
│   audit all POSTs│  │ • API prefetching dashboard       │
└──────────────────┘  └────────────────────┬─────────────┘
                                            │
                                            ▼
                          ┌──────────────────────────────────┐
                          │ MILESTONE M5: TIER2 PHASE 3       │
                          │ Data layer + Build (Weeks 7-9)    │
                          │ • N+1 audit all findMany          │
                          │ • Query result caching            │
                          │ • Prisma build optimization       │
                          │ • Memory leak cleanup (listeners) │
                          │ • Bundle analysis + standalone opt │
                          └────────────────────┬─────────────┘
                                            │
                  TIER1+2 COMPLETE ─────────┘
                                            │
                                            ▼
                          ┌──────────────────────────────────┐
                          │ MILESTONE M6: TIER3 PHASE 1       │
                          │ Core Framework (Weeks 10-12)      │
                          │ • Turborepo monorepo setup        │
                          │ • Extract packages/core          │
                          │ • Define plugin interface        │
                          │ • Event bus system               │
                          │ • Migrate auth to plugin         │
                          └────────────────────┬─────────────┘
                                            │
                                            ▼
                          ┌──────────────────────────────────┐
                          │ MILESTONE M7: TIER3 PHASE 2-4     │
                          │ UI Foundation + Domain Packages   │
                          │ (Weeks 12-14)                     │
                          │ • Extract packages/ui (shadcn)   │
                          │ • Domain packages (invoicing,     │
                          │   payments, inventory, payroll)    │
                          │ • Auth plugin (multi-tenant)      │
                          └────────────────────┬─────────────┘
                                            │
                                            ▼
                          ┌──────────────────────────────────┐
                          │ MILESTONE M8: TIER3 PHASE 5-6    │
                          │ Thai Locale Plugin + Templates    │
                          │ (Weeks 14-16)                    │
                          │ • plugin-locale-th (Thai acctg)   │
                          │ • WHT/VAT/SSC calculations       │
                          │ • Thai translations + i18n       │
                          │ • SaaS + ERP templates           │
                          │ • Migration guides + docs         │
                          └────────────────────┬─────────────┘
                                            │
                                            ▼
                                        DONE
```

---

## STREAM 1: Technical Debt & Critical Issues (TIER1)

**Full details:** `.hermes/plans/TIER1-technical-debt.md`

### Summary

TIER1 addresses the most critical production risks: data corruption via non-atomic financial writes, security gaps, broken accounting logic, race conditions in document numbering, and hard deletes on master data. All items must be resolved before any release. This stream has **28 named issues** across 8 categories.

### Key Issues

#### 1.1 — Critical Data Integrity — Missing Transactions (18 routes)

**Severity: T1 — BLOCKER** | 10 items require immediate fix (B-01 through B-10)

Non-atomic Prisma calls in financial routes mean a crash between operations leaves orphaned records:

| Route | Issue | Fix |
|-------|-------|-----|
| `POST /api/invoices` | Invoice create + activity log separate | Wrap in `$transaction` |
| `PUT /api/receipts/[id]` | Delete allocations + receipt update separate | Wrap in `$transaction` |
| `POST /api/payments` | Payment + cheque + GL posting + WHT separate | Wrap in `$transaction` |
| `PUT /api/payments/[id]` | deleteMany + createMany + update separate | Wrap in `$transaction` |
| `POST /api/purchases` | Invoice + VAT record + status update separate | Wrap in `$transaction` |
| `POST /api/journal` | entryNo race + nested lines create | Use `generateDocNumber` |
| `asset-service.ts:postMonthlyDepreciation` | JE create + schedule update separate | Wrap in `$transaction` |
| `cheque-service.ts` | Bounce not atomic + clear TOCTOU | Wrap in `$transaction` |
| `petty-cash-service.ts:replenish` | Voucher create + fund update separate | Wrap in `$transaction` |
| `period-service.ts:checkPeriodStatus` | findUnique + create not atomic | Use `upsert`, wrap in tx |

#### 1.2 — Hard Delete → Soft Delete

**Severity: T2** | 6 entities affected

Hard deletes on master data orphan related financial records:

```
Customer    → orphans invoices, receipts
Vendor      → orphans purchase invoices
Product     → orphans 10+ related tables
Warehouse   → orphans stock balances
Employee    → orphans payroll records
Department   → orphans GL entries
```

**Fix:** Add `deletedAt DateTime?` + `isActive Boolean @default(true)` to schema; change all `delete()` to `update({ data: { deletedAt: new Date() }})`; add `where: { deletedAt: null }` to all queries.

#### 1.3 — Race Condition Fixes

**Severity: T1 — BLOCKER** | 3 items

1. **Journal Entry Number** (`journal/route.ts:43-58`) — `findFirst` + increment is NOT atomic. Two concurrent requests get same number. **Fix:** Use `generateDocNumber` from `api-utils.ts`.
2. **Invoice Number Generation** (`invoices/route.ts:44-76`) — same pattern. **Fix:** Audit and remove duplicate unsafe function.
3. **Period Locking TOCTOU** (`period-service.ts:17-42`) — read-then-act. **Fix:** Use `upsert`, wrap in transaction.

#### 1.4 — Middleware & Security

**Severity: T1 — BLOCKER**

- **BYPASS_CSRF env var** (`middleware.ts:26`) — can be set in production, allowing full CSRF bypass. **Fix:** Remove entirely.
- **Host header check** (`middleware.ts:16-23`) — user-controlled, spoofable. **Fix:** Remove host whitelist, rely on `NODE_ENV`.
- **Rate limit exemption** `/api/invoices` — exempt from rate limiting. **Fix:** Remove from `publicRoutes`.

#### 1.5 — Unused Code & Build Cleanup

**Severity: T3**

- `revenue/auto-service.ts` — referenced in roadmap but file not found
- jsPDF v4 migration pending in `pdf-generator.ts`
- API structure duplication: `journal/` + `journal-entries/`, `v1/` + `v2/`

#### 1.6 — Accounting Logic Bugs

**Severity: T1 — BLOCKER**

| Bug | File | Issue | Fix |
|-----|------|-------|-----|
| Stock-take JE totals | `stock-take-service.ts:380-381` | `totalLoss + totalGain` cancels out | Separate DR/CR for loss vs gain |
| Payroll Float→Satang | `payroll-service.ts` | Float arithmetic on Satang values | Integer arithmetic throughout |
| PP30 taxRate===0 | `tax-form-service.ts:598-600` | Rejects NET-type income (taxRate=0) | Allow `taxRate===0` for NET type |
| Hardcoded account codes | `journal-entry-auto-service.ts:27-31` | Codes like '1100', '2110' hardcoded | Dynamic lookup via `chartOfAccount` or `SystemSettings` |
| Hardcoded account codes | `payments/route.ts:296-318` | Multiple hardcoded code lookups | Use configurable account IDs |

---

## STREAM 2: Performance Optimization (TIER2)

**Full details:** `.hermes/plans/TIER2-performance.md`

### Summary

TIER2 addresses performance across 5 dimensions: Next.js bundle (webpack→Turbopack, code splitting), Prisma database (indexes, N+1, caching), client state (TanStack Query tuning, Zustand optimization), component architecture (large file splitting, virtualization), and build/runtime (22.3s build, memory leaks). Current baseline: 22.3s build, 4.1MB static, 126 dynamic routes.

### Key Items

#### 2.1 — Frontend Performance

- **Turbopack** (dev): Replace `--webpack` with `--turbopack` — 10x faster builds
- **Code splitting** (`page.tsx`): 50+ component imports at module level → lazy load per `activeModule`
- **Bundle analyzer**: Add `@next/bundle-analyzer` to identify large chunks (current: 454KB, 227KB, 198KB chunks)

#### 2.2 — Backend/API Performance

- **N+1 queries**: Audit all `include` patterns; add explicit `select` for minimal field retrieval
- **TanStack Query tuning**: Increase `staleTime` from default to 5 minutes
- **API prefetching**: Dashboard data on session load

#### 2.3 — Database Performance

- **Missing composite indexes** (PostgreSQL):
  ```sql
  @@index([customerId, status, invoiceDate])
  @@index([invoiceDate, status])
  @@index([date, status])
  @@index([documentType, documentId])
  @@index([isInventory, isActive, category])
  ```
- **Query caching**: In-memory cache with 5-minute TTL for expensive lookups
- **Connection pooling**: `connection_limit=20&pool_timeout=10` for PostgreSQL

#### 2.4 — Build & Runtime Performance

- **Prisma pre-generation**: `prisma generate` before `next build`; don't regenerate at build time
- **Standalone optimization**: 135 packages in node_modules — exclude dev-only deps

#### 2.5 — Memory & Stability

- **Event listener cleanup** (`page.tsx`): `window.removeEventListener` on unmount
- **QueryClient cleanup** (`providers.tsx`): `queryClient.clear()` on unmount
- **React Strict Mode**: Currently disabled — re-enable for leak detection

---

## STREAM 3: Framework Extraction (TIER3)

**Full details:** `.hermes/plans/TIER3-framework.md`

### Summary

TIER3 extracts a reusable ERP framework from the monolithic codebase. Analysis shows ~65% generic/framework-ready code and ~35% Thai-specific. The target is a Turborepo monorepo with plugin architecture supporting multiple locales (Thai, English, etc.) and multi-tenancy via row-level security.

### Key Items

#### 3.1 — Domain Separation

```
Generic Layers (framework-ready):
  [Core]    → Prisma/DB, Auth, API, Validation, Audit, Session
  [Domain]  → Invoicing, Payments, Inventory, Assets, Payroll
  [UI]      → shadcn/ui, Forms, Tables, Charts

Thai-Specific Layers (locale plugins):
  [Locale]  → ThaiAccounting, WHT, VAT, TFRS, ThaiDate
  [Config]  → ChartOfAccounts (TH), TaxForms, SSCCalculations
```

#### 3.2 — Framework Architecture

Recommended: **Turborepo monorepo with NPM workspaces**

```
erp-framework/
├── packages/
│   ├── core/                    # Base: DB, API utils, types, events
│   ├── ui/                     # shadcn/ui + Tailwind + theme
│   ├── plugin-auth-nextauth/   # NextAuth v4 integration
│   ├── plugin-locale-th/       # Thai accounting + localization
│   ├── domain-invoicing/       # Invoice domain
│   ├── domain-payments/        # Payments domain
│   ├── domain-inventory/       # Inventory domain
│   ├── domain-payroll/         # Payroll domain
│   ├── domain-assets/          # Fixed assets domain
│   ├── template-saas/          # SaaS boilerplate
│   └── template-erp/           # Full ERP template
├── apps/
│   ├── demo/                   # Demo application
│   └── docs/                   # Documentation
└── turbo.json
```

#### 3.3 — Skeleton/Starter Template

- Extract `packages/core` first (no changes to existing code)
- Create `apps/demo` referencing local packages
- Maintain backward compatibility: main app uses local packages during extraction

#### 3.4 — Module Extraction Workflow

```
1. Core types, events, plugin interface (no code changes)
2. UI components (copy to packages/ui, reference from original)
3. Auth system (extract to plugin, maintain compatibility)
4. Domain services + API routes (gradual per-module migration)
5. Thai locale plugin (create new, don't modify original until ready)
```

#### 3.5 — Configuration System

- Plugin registration via `createERPApp({ plugins: [...] })`
- Event bus for plugin-to-plugin communication
- Tenant context injected into all operations

#### 3.6 — Auth & Multi-Tenancy

- **Strategy**: Shared Schema + Row-Level Security (v1); Separate Schema (v2+)
- **Current**: Single-tenant per deployment with NextAuth v4 + RBAC
- **Target**: Multi-tenant via `tenantId` on all scoped models; Prisma middleware auto-injects filter

#### 3.7 — Migration & Upgrade Path

- Maintain current codebase working throughout extraction
- Publish to npm only after extraction complete
- Semantic versioning + changelog for breaking changes

#### 3.8 — Documentation & DX

- Migration guides for each package
- Plugin development guide
- Success metrics: 280+ models accessible via package imports; Thai locale < 20% of codebase

---

## CROSS-STREAM INTEGRATION

### Which TIER2 Items MUST Complete Before TIER3

| TIER2 Item | Why It Blocks TIER3 |
|------------|---------------------|
| N+1 query audit (`src/app/api/*`) | Domain packages will inherit query patterns — fixing now prevents refactoring domain packages later |
| Prisma composite indexes | Domain packages rely on optimized schema — indexes must exist before package extraction |
| Query caching layer | Domain packages use shared caching infrastructure — must be in core before plugin extraction |
| Prisma `$transaction` (TIER1) | All domain packages need atomic operations — this is a hard dependency |

### Which TIER1 Items MUST Complete Before TIER2

| TIER1 Item | Why It Blocks TIER2 |
|------------|-------------------|
| All BLOCKER items (B-01 to B-10) | Performance testing requires a stable, corruption-free system |
| Race condition fixes (B-09, B-10) | Concurrent load testing will expose race conditions — fix first |
| Period locking (B-09) | Concurrent period access during performance tests needs correct locking |
| Audit trail completeness (H-09, H-10) | Performance metrics need accurate `postedById`/`createdById` attribution |

### Shared Components Across Streams

```
SHARED FOUNDATION (TIER1+2 before TIER3):
├── Prisma schema (280+ models)
│   ├── Need: soft-delete fields (TIER1 H-08)
│   ├── Need: composite indexes (TIER2 2.3)
│   └── Need: tenantId for multi-tenancy (TIER3)
├── Auth system (NextAuth v4 + RBAC)
│   ├── Need: Audit trails (TIER1 1.5)
│   └── Need: Multi-tenant context (TIER3)
├── Service layer (src/lib/*-service.ts)
│   ├── Need: Transaction wrappers (TIER1 1.1)
│   ├── Need: Hardcoded → dynamic account lookup (TIER1 1.6)
│   └── Need: Plugin interface (TIER3)
├── API route handlers (src/app/api/*)
│   ├── Need: Atomic writes (TIER1 1.1)
│   ├── Need: N+1 fixes (TIER2 2.2)
│   └── Need: Domain separation (TIER3)
└── Build pipeline (next.config.ts, package.json)
    ├── Need: Turbopack (TIER2 2.4)
    └── Need: Monorepo workspaces (TIER3)
```

---

## PRIORITIZATION MATRIX

| Priority | Stream | Task | Effort (hrs) | Risk | Dependencies |
|----------|--------|------|-------------|------|--------------|
| P0-BLOCKER | TIER1 | B-01: Add postedById to journal post | 1 | CRITICAL | None |
| P0-BLOCKER | TIER1 | B-07: Remove BYPASS_CSRF env var | 1 | CRITICAL | None |
| P0-BLOCKER | TIER1 | B-08: Stock-take JE totals bug | 2 | CRITICAL | None |
| P0-BLOCKER | TIER1 | B-09: Period locking TOCTOU | 3 | CRITICAL | None |
| P0-BLOCKER | TIER1 | B-10: Journal entryNo race | 2 | CRITICAL | None |
| P0-BLOCKER | TIER1 | B-02: Asset depreciation transaction | 1 | CRITICAL | None |
| P0-BLOCKER | TIER1 | B-03: PP30 taxRate===0 validation | 1 | CRITICAL | None |
| P0-BLOCKER | TIER1 | B-04: Cheque bounce atomicity | 2 | CRITICAL | None |
| P0-BLOCKER | TIER1 | B-05: Cheque clear TOCTOU | 2 | CRITICAL | None |
| P0-BLOCKER | TIER1 | B-06: FIFO costing (batch tracking) | 4 | CRITICAL | None |
| P1-HIGH | TIER1 | H-01: Invoice create atomicity | 2 | HIGH | B-01, B-10 |
| P1-HIGH | TIER1 | H-02: Payment create atomicity | 2 | HIGH | B-04, B-05 |
| P1-HIGH | TIER1 | H-03: Receipt PUT atomicity | 1 | HIGH | None |
| P1-HIGH | TIER1 | H-04: Payment PUT atomicity | 1 | HIGH | H-02 |
| P1-HIGH | TIER1 | H-05: Purchase create atomicity | 2 | HIGH | B-09 |
| P1-HIGH | TIER1 | H-06: Payroll Float→Satang | 3 | HIGH | None |
| P1-HIGH | TIER1 | H-07: Hardcoded account codes | 4 | HIGH | None |
| P1-HIGH | TIER1 | H-08: Soft delete master data | 12 | HIGH | B-01 |
| P1-HIGH | TIER1 | H-09: issuedById on invoice issue | 1 | HIGH | B-01 |
| P1-HIGH | TIER1 | H-10: createdById all POSTs audit | 4 | MEDIUM | H-01..H-05 |
| P1-HIGH | TIER2 | Turbopack + bundle analyzer | 2 | HIGH | None |
| P1-HIGH | TIER2 | Missing composite indexes | 3 | HIGH | TIER1 H-08 |
| P1-HIGH | TIER2 | Lazy load page.tsx modules | 4 | HIGH | None |
| P2-MEDIUM | TIER1 | M-01: .env.example | 1 | LOW | None |
| P2-MEDIUM | TIER1 | M-02: Rate-limit /api/invoices fix | 0.5 | MEDIUM | None |
| P2-MEDIUM | TIER1 | M-03: Petty cash tx | 1 | MEDIUM | None |
| P2-MEDIUM | TIER1 | M-04: Host header bypass | 0.5 | MEDIUM | B-07 |
| P2-MEDIUM | TIER1 | M-05: revenue/auto-service.ts investigation | 2 | LOW | None |
| P2-MEDIUM | TIER1 | M-06: createdById systematic audit | 4 | MEDIUM | H-01..H-05 |
| P2-MEDIUM | TIER1 | M-07: recurring doc null date | 1 | LOW | None |
| P2-MEDIUM | TIER1 | M-08: jsPDF v4 migration | 2 | LOW | None |
| P2-MEDIUM | TIER2 | Split invoice-list.tsx | 6 | MEDIUM | None |
| P2-MEDIUM | TIER2 | TanStack Query staleTime tuning | 1 | MEDIUM | None |
| P2-MEDIUM | TIER2 | Zustand store optimization | 2 | MEDIUM | None |
| P2-MEDIUM | TIER2 | Memory leak cleanup | 2 | MEDIUM | None |
| P2-MEDIUM | TIER2 | Query caching layer | 4 | MEDIUM | TIER2 indexes |
| P2-MEDIUM | TIER2 | API prefetching dashboard | 3 | MEDIUM | None |
| P3-LOW | TIER2 | Prisma pre-generation | 1 | LOW | None |
| P3-LOW | TIER2 | Font + image optimization | 2 | LOW | None |
| P3-LOW | TIER3 | Core framework setup | 40 | MEDIUM | TIER1+2 complete |
| P3-LOW | TIER3 | UI foundation | 32 | MEDIUM | Core |
| P3-LOW | TIER3 | Auth plugin + multi-tenancy | 40 | HIGH | Core |
| P3-LOW | TIER3 | Domain packages (5) | 120 | HIGH | Core, UI |
| P3-LOW | TIER3 | Thai locale plugin | 80 | MEDIUM | Domain packages |
| P3-LOW | TIER3 | Templates + documentation | 40 | LOW | All above |

---

## MILESTONES & TIMELINE

| Milestone | Streams | Tasks | Duration | Success Criteria |
|-----------|---------|-------|----------|------------------|
| **M1** | TIER1 | B-01 through B-10 (all BLOCKERs) | Weeks 1-2 | All 10 blockers pass verification tests |
| **M2** | TIER1 | H-01 through H-10 (HIGH priority) | Weeks 2-4 | All financial routes use transactions; soft delete migration complete |
| **M3** | TIER1+2 | M-01 through M-08 + TIER2 Phase 1 | Weeks 4-5 | env.example exists; Turbopack enabled; indexes added |
| **M4** | TIER2 | Component optimization (lazy load, split, virtual) | Weeks 5-7 | page.tsx modules lazy-loaded; invoice-list split; virtualization added |
| **M5** | TIER2 | Data layer + build optimization | Weeks 7-9 | N+1 audit complete; query cache active; memory leaks fixed |
| **M6** | TIER3 | Core framework (monorepo, plugin interface, event bus) | Weeks 10-12 | Monorepo builds; plugin interface stable; auth in plugin |
| **M7** | TIER3 | UI foundation + domain packages | Weeks 12-14 | packages/ui published; 3+ domain packages extracted |
| **M8** | TIER3 | Thai locale plugin + templates | Weeks 14-16 | Thai plugin functional; SaaS+ERP templates working |

---

## MASTER RISK REGISTER

| Risk | Stream | Likelihood | Impact | Mitigation | Owner |
|------|--------|------------|--------|------------|-------|
| TIER1 transaction fixes break existing behavior | TIER1 | MEDIUM | HIGH | Comprehensive E2E tests before release; wrap in feature flag | Agent |
| Race condition fixes cause deadlocks under load | TIER1 | MEDIUM | HIGH | Test with concurrent POST requests; monitor for lock timeouts | Agent |
| Soft delete migration corrupts existing data | TIER1 | MEDIUM | CRITICAL | Full DB backup before migration; test on copy first | Agent |
| TIER1 security fixes (BYPASS_CSRF removal) break tests | TIER1 | LOW | MEDIUM | Update test environment configs; remove BYPASS_CSRF from CI | Agent |
| Turbopack instability in dev | TIER2 | LOW | LOW | Keep webpack fallback available | Agent |
| Bundle splitting breaks SPA routing | TIER2 | MEDIUM | HIGH | Test all 6 SPA modules after lazy loading | Agent |
| TIER3 scope creep delays delivery | TIER3 | HIGH | HIGH | Strict phase gates; defer non-essential features | Agent |
| Thai-specific tight coupling to generic code | TIER3 | HIGH | HIGH | Early boundary analysis; isolate thai-specific code first | Agent |
| Breaking changes in TIER3 confuse TIER1/2 work | TIER3 | MEDIUM | MEDIUM | Branch strategy: `dev/performance-framework` → merge to `main` only after all tiers pass | Agent |
| Prisma $transaction overhead causes perf regression | TIER2 | MEDIUM | MEDIUM | Benchmark key routes before/after; optimize transaction scope | Agent |
| Framework extraction destabilizes running app | TIER3 | HIGH | CRITICAL | Extract incrementally; maintain working app throughout | Agent |
| Multi-tenancy row-level security bugs | TIER3 | MEDIUM | CRITICAL | Security audit per domain package; test tenant isolation | Agent |

---

## RESOURCE ESTIMATE

| Task | Complexity (1-5) | Agent-Hours | Tools | Dependencies |
|------|------------------|-------------|-------|--------------|
| TIER1 B-01 (postedById journal) | 1 | 1 | grep, text editor | None |
| TIER1 B-07 (remove BYPASS_CSRF) | 1 | 1 | grep, text editor | None |
| TIER1 B-02 (asset-service tx) | 2 | 1 | Prisma, text editor | None |
| TIER1 B-03 (PP30 validation) | 2 | 1 | grep, text editor | None |
| TIER1 B-04 (cheque bounce) | 3 | 2 | Prisma, text editor | B-07 |
| TIER1 B-05 (cheque clear TOCTOU) | 3 | 2 | Prisma, text editor | B-04 |
| TIER1 B-06 (FIFO batch tracking) | 4 | 4 | Prisma, inventory-service | None |
| TIER1 B-08 (stock-take JE bug) | 3 | 2 | stock-take-service, text editor | None |
| TIER1 B-09 (period lock TOCTOU) | 3 | 3 | Prisma, period-service | None |
| TIER1 B-10 (entryNo race) | 2 | 2 | Prisma, api-utils | None |
| TIER1 H-01 (invoice tx) | 2 | 2 | Prisma | B-10 |
| TIER1 H-02 (payment tx) | 3 | 2 | Prisma | B-04, B-05 |
| TIER1 H-03 (receipt PUT tx) | 2 | 1 | Prisma | None |
| TIER1 H-04 (payment PUT tx) | 2 | 1 | Prisma | H-02 |
| TIER1 H-05 (purchase tx) | 3 | 2 | Prisma | B-09 |
| TIER1 H-06 (payroll Satang) | 4 | 3 | payroll-service, currency lib | None |
| TIER1 H-07 (hardcoded accounts) | 3 | 4 | SystemSettings, chartOfAccount | None |
| TIER1 H-08 (soft delete) | 4 | 12 | Prisma migrate, all entity routes | B-01 |
| TIER1 H-09 (issuedById) | 1 | 1 | text editor | B-01 |
| TIER1 H-10 (createdById audit) | 2 | 4 | grep, all POST routes | H-01..H-05 |
| TIER1 M-01 (env.example) | 1 | 1 | terminal | None |
| TIER1 M-02 (rate-limit invoices) | 1 | 0.5 | middleware.ts | None |
| TIER1 M-03 (petty cash tx) | 2 | 1 | Prisma | B-07 |
| TIER1 M-04 (host header fix) | 1 | 0.5 | middleware.ts | B-07 |
| TIER1 M-05 (revenue service) | 2 | 2 | grep, investigation | None |
| TIER1 M-06 (createdById systematic) | 2 | 4 | grep, all POST routes | H-01..H-05 |
| TIER1 M-07 (recurring null date) | 1 | 1 | recurring-doc-service | None |
| TIER1 M-08 (jsPDF v4) | 2 | 2 | pdf-generator, npm | None |
| TIER2: Turbopack + analyzer | 2 | 2 | next.config.ts, package.json | None |
| TIER2: Composite indexes | 2 | 3 | Prisma schema | TIER1 H-08 |
| TIER2: Lazy load page.tsx | 3 | 4 | page.tsx, React.lazy | None |
| TIER2: Split invoice-list | 3 | 6 | invoice-list.tsx, sub-components | None |
| TIER2: TanStack Query tuning | 2 | 1 | providers.tsx | None |
| TIER2: Zustand optimization | 2 | 2 | auth-store.ts, stores | None |
| TIER2: Memory leak cleanup | 2 | 2 | page.tsx, providers.tsx | None |
| TIER2: Query caching | 3 | 4 | db-helpers.ts | TIER2 indexes |
| TIER2: API prefetching | 2 | 3 | API routes, TanStack Query | None |
| TIER2: Prisma pre-gen | 1 | 1 | package.json, next.config | None |
| TIER2: Font/image opt | 1 | 2 | layout.tsx, components | None |
| TIER3: Core framework | 5 | 40 | Turborepo, TypeScript | TIER1+2 |
| TIER3: UI foundation | 4 | 32 | shadcn/ui, Tailwind | Core |
| TIER3: Auth plugin + multi-tenancy | 5 | 40 | NextAuth, Prisma middleware | Core |
| TIER3: Domain packages (5x) | 5 | 120 | Prisma, services, routes | Core, UI |
| TIER3: Thai locale plugin | 4 | 80 | ThaiAccounting, WHT, VAT | Domain packages |
| TIER3: Templates + docs | 3 | 40 | Turbo, docs | All above |
| **TIER1 TOTAL** | | **~62** | | |
| **TIER2 TOTAL** | | **~30** | | |
| **TIER3 TOTAL** | | **~352** | | |
| **GRAND TOTAL** | | **~444** | | |

---

## DELIVERY CHECKLIST

### Milestone M1 — TIER1 BLOCKER Items
- [ ] B-01: `journal/[id]/post/route.ts` — `postedById` added to update call
- [ ] B-02: `asset-service.ts:postMonthlyDepreciation` — wrapped in `$transaction`
- [ ] B-03: `tax-form-service.ts:598-600` — `taxRate===0` allowed for NET type
- [ ] B-04: `cheque-service.ts` — bounce operation wrapped in `$transaction`
- [ ] B-05: `cheque-service.ts` — clear operation TOCTOU fixed with inside-tx check
- [ ] B-06: `inventory-service.ts` — FIFO batch tracking implemented
- [ ] B-07: `middleware.ts` — `BYPASS_CSRF` env var and logic removed entirely
- [ ] B-08: `stock-take-service.ts:380-409` — separate loss/gain journal entries
- [ ] B-09: `period-service.ts:checkPeriodStatus` — `upsert` replaces find+create; wrapped in tx
- [ ] B-10: `journal/route.ts` — `generateDocNumber` replaces `findFirst`+increment pattern
- [ ] Verification: `grep -rn "\.create({" src/app/api --include="*.ts" | grep -v "transaction\|createMany"` returns no financial route violations

### Milestone M2 — TIER1 HIGH Priority
- [ ] H-01: `invoices/route.ts:263-320` — invoice create + log wrapped in `$transaction`
- [ ] H-02: `payments/route.ts` — payment + cheque + GL + WHT all in one `$transaction`
- [ ] H-03: `receipts/[id]/route.ts:PUT` — delete allocations + receipt update wrapped
- [ ] H-04: `payments/[id]/route.ts:PUT` — 3 operations wrapped in `$transaction`
- [ ] H-05: `purchases/route.ts` — invoice + VAT + status update wrapped
- [ ] H-06: `payroll-service.ts` — all float arithmetic replaced with Satang integer math
- [ ] H-07: `journal-entry-auto-service.ts` + `payments/route.ts` — hardcoded accounts replaced with dynamic lookups
- [ ] H-08: Prisma migration — `deletedAt DateTime?` + `isActive Boolean @default(true)` on 6 entities; all delete() calls changed to update()
- [ ] H-09: `invoices/[id]/issue/route.ts:231-237` — `issuedById` added to update
- [ ] H-10: Audit all POST routes — `createdById` consistently set on all financial document creates

### Milestone M3 — TIER1 Medium + TIER2 Quick Wins
- [ ] M-01: `.env.example` created with all required variables
- [ ] M-02: `/api/invoices` removed from `publicRoutes` in `middleware.ts`
- [ ] M-03: `petty-cash-service.ts:replenish` — wrapped in `$transaction`
- [ ] M-04: `middleware.ts` — host header whitelist removed; rely on `NODE_ENV`
- [ ] M-05: `revenue/auto-service.ts` — file confirmed or created
- [ ] M-06: Systematic `createdById` audit across all POST routes
- [ ] M-07: `recurring-document-service.ts` — null date handling fixed
- [ ] M-08: `pdf-generator.ts` — jsPDF v4 migration completed
- [ ] TIER2-1: `package.json` dev script updated with `--turbopack`
- [ ] TIER2-2: `@next/bundle-analyzer` added and configured
- [ ] TIER2-3: Missing composite indexes added to `schema-postgres.prisma`

### Milestone M4 — TIER2 Component Optimization
- [ ] `src/app/page.tsx` — all 50+ component imports changed to `React.lazy()` per module
- [ ] `invoice-list.tsx` split into: `invoice-table.tsx`, `invoice-filters.tsx`, `invoice-pagination.tsx`, `use-invoice-list.ts`
- [ ] `@tanstack/react-virtual` added for large list rendering (invoice table)
- [ ] `src/stores/auth-store.ts` — persisted state reduced to minimal fields
- [ ] `providers.tsx` — `staleTime: 5 * 60 * 1000` added to TanStack Query config
- [ ] Dashboard prefetching — session load triggers data prefetch

### Milestone M5 — TIER2 Data Layer + Build
- [ ] All `findMany` calls audited for N+1; explicit `select` added where needed
- [ ] Query caching layer in `db-helpers.ts` — 5-min TTL cache active
- [ ] `next build` pre-generates Prisma client (`prisma generate` before `next build`)
- [ ] `page.tsx` — `window.removeEventListener` in cleanup function
- [ ] `providers.tsx` — `queryClient.clear()` on unmount
- [ ] `reactStrictMode: true` re-enabled in `next.config.ts`
- [ ] Build output analyzed; large chunks identified and addressed
- [ ] `standalone` output optimized; dev-only deps excluded

### Milestone M6 — TIER3 Core Framework
- [ ] Turborepo monorepo initialized with `turbo.json` and workspace `package.json`
- [ ] `packages/core` extracted with: base types, Prisma client wrapper, event bus, plugin interface
- [ ] Plugin interface (`ERPPlugin`) defined and stable
- [ ] Event bus system functional with `emit`, `on`, `off`
- [ ] NextAuth extracted to `plugin-auth-nextauth` — main app still works
- [ ] Main app updated to reference local `packages/*` during extraction phase

### Milestone M7 — TIER3 UI Foundation + Domain Packages
- [ ] `packages/ui` extracted with shadcn/ui components and Tailwind theme system
- [ ] `packages/ui` theme system supports Thai font (Noto Sans Thai)
- [ ] `domain-invoicing` package — Invoice, InvoiceLine, Receipt models + routes + services
- [ ] `domain-payments` package — Payment, CreditNote, DebitNote
- [ ] `domain-inventory` package — Product, Warehouse, StockMovement, StockTake
- [ ] `domain-payroll` package — Employee, PayrollPeriod, PayrollEntry
- [ ] `domain-assets` package — Asset, AssetDepreciation, DepreciationSchedule
- [ ] Row-level security middleware in Prisma for `tenantId` filtering

### Milestone M8 — TIER3 Thai Locale + Templates
- [ ] `plugin-locale-th` functional with Thai accounting rules
- [ ] WHT calculations (PND3, PND53) in Thai plugin
- [ ] VAT 7% inclusive/exclusive calculations
- [ ] Thai date formatting (Buddhist calendar, DD/MM/YYYY)
- [ ] Thai number-to-text conversion (บาท สตางค์)
- [ ] Thai chart of accounts seed data
- [ ] `template-saas` — working SaaS boilerplate with demo tenant
- [ ] `template-erp` — full ERP template
- [ ] Migration guides for each package
- [ ] Plugin development guide

---

## HOW TO USE THIS PLAN

### Which Stream to Start With

**TIER1 first — always.** TIER1 fixes are production-safety issues (data corruption, security, broken accounting). They must be resolved before any other work touches the codebase. Do not begin TIER2 or TIER3 work until TIER1 BLOCKERs (M1) are verified.

### How to Coordinate Parallel Work

```
WEEKS 1-2:  TIER1 BLOCKERS (M1) — sequential, full focus
WEEKS 2-4:  TIER1 HIGH PRIORITY (M2) — sequential
            TIER2 Phase 1 can START in parallel after M1 passes
WEEKS 4-5:  TIER1 MEDIUM (M3) + TIER2 Phase 1 (Turbopack, indexes) — parallel
WEEKS 5-7:  TIER2 Phase 2 (components) — parallel with TIER1 M3 completion
WEEKS 7-9:  TIER2 Phase 3 (data layer) — no TIER1 parallel needed
WEEK  10+:  TIER3 Phase 1 (core framework) — ONLY after TIER1+2 pass all milestones
```

**Rule:** TIER3 does not start until M5 (TIER2 Phase 3) is verified. Framework extraction on an unstable or slow system produces a broken framework.

### How to Verify Each Milestone

| Milestone | Verification Command/Action |
|-----------|----------------------------|
| M1 | `grep -L 'prisma.\$transaction' src/app/api/invoices/route.ts src/app/api/payments/route.ts ...` (should be empty); run `npm test` — all pass |
| M2 | E2E test: create invoice → crash mid-request → verify no orphaned invoice without log; check soft delete queries across 6 entities |
| M3 | `ls .env.example` exists; `npm run dev --turbopack` starts; `EXPLAIN` on key queries shows index usage |
| M4 | Network tab: only active module JS loaded; invoice-list with 1000 rows scrolls at 60fps |
| M5 | `ANALYZE=true npm run build` — bundle <3MB; memory usage stable after 10 page navigations |
| M6 | `npm run build` in monorepo succeeds; `npm run dev` in `apps/demo` starts |
| M7 | `domain-invoicing` package imports work; tenant isolation tested (tenant A cannot see tenant B data) |
| M8 | Thai plugin loaded; PND1/3/53 forms generate correctly; Thai date format verified |

---

## APPENDIX: Cross-Reference Table

| Item | Full Details In | Specific Section |
|------|-----------------|------------------|
| Missing transactions (18 routes) | `TIER1-technical-debt.md` | Section 1 (1.1–1.13) |
| Hard delete → soft delete | `TIER1-technical-debt.md` | Section 5 |
| Race conditions (doc numbers, period lock) | `TIER1-technical-debt.md` | Section 4 |
| Middleware & security (CSRF, BYPASS_CSRF) | `TIER1-technical-debt.md` | Section 2, 7 |
| Accounting logic bugs (stock-take, payroll, PP30) | `TIER1-technical-debt.md` | Section 3, 8 |
| Audit trails (postedById, createdById) | `TIER1-technical-debt.md` | Section 6 |
| Turbopack + bundle analyzer | `TIER2-performance.md` | Section 1, 5 |
| Component splitting + virtualization | `TIER2-performance.md` | Section 4 |
| Prisma indexes + N+1 + caching | `TIER2-performance.md` | Section 2 |
| TanStack Query + Zustand optimization | `TIER2-performance.md` | Section 3 |
| Memory leaks + build optimization | `TIER2-performance.md` | Section 5 |
| Framework architecture (monorepo) | `TIER3-framework.md` | Section 3 |
| Plugin system design | `TIER3-framework.md` | Section 4 |
| Multi-tenancy strategy | `TIER3-framework.md` | Section 5 |
| Thai vs generic component analysis | `TIER3-framework.md` | Section 2 |
| Database model organization | `TIER3-framework.md` | Section 6 |
| Migration path | `TIER3-framework.md` | Section 8 |
| ERP improvement roadmap | `ERP-IMPROVEMENT-ROADMAP.md` | Full doc (722 lines) |
| Project context | `AGENTS.md` | Full doc |

---

*Master Plan compiled by Hermes Agent — Thai-acc-sandbox — dev/performance-framework — 2026-05-01*
