# Thai ERP — Remediation Master Plan
## 10-Issue Execution Roadmap

**Project:** Thai Accounting ERP (Keerati)  
**Generated:** 2026-05-03  
**Branch:** `dev/performance-framework` → `master`  
**Status:** PHASE A IN PROGRESS — A.4 Audit Complete

---

## Executive Summary

The codebase has 10 documented issues across code quality, performance, and monitoring. After investigation:

| # | Issue | Status on master | Action |
|---|-------|-----------------|--------|
| 1 | Phase 1: Foundation Setup | ✅ DONE | Verify completeness |
| 2 | Phase 2: Code Quality | ❌ NOT DONE | 26 files use raw catch, 0 use handleApiError |
| 3 | Phase 3: DB Optimization | 🔲 PARTIAL | 38 indexes exist, N+1 not verified |
| 4 | Phase 4: API Performance | ❌ NOT DONE | Dashboard 800ms→<200ms target, no timing code |
| 5 | Phase 5: Testing Strategy | 🔲 UNCLEAR | Need research |
| 6 | Phase 6: Performance Monitoring | ❌ NOT DONE | monitor exists but not wired |
| 7 | Bug: AuthError Handling | ❌ NOT DONE | Only 3 files handle explicitly |
| 8 | Bug: 12 N+1 Queries | 🔲 NOT VERIFIED | Need analysis |
| 9 | Verification: DB Indexes | ✅ PARTIAL | 38 indexes in migration, need verify applied |
| 10 | Bundle Analyzer | ✅ DONE | Wired, never run |

---

## Phase A: Quick Wins & Verification (Week 1)
**Goal:** Close low-effort items and verify existing infrastructure

### A.1 — Run Bundle Analyzer (Issue #10 ✅)
**File:** `next.config.ts` (already wired)  
**Command:** `ANALYZE=true bun run build`  
**Task:** Run bundle analyzer on master, document biggest chunks, create issue to address top 5  
**Dev Cycle:** `/spec → /build → /test → /review → /simplify → /ship`  
**Verify:** Report generated in `.next/analyze/`

### A.2 — Verify DB Indexes Applied (Issue #9)
**Task:**  
1. Check if SQLite DB has the 38 indexes: `sqlite3 prisma/dev.db ".indexes" | wc -l`  
2. For PostgreSQL: `SELECT indexname FROM pg_indexes WHERE schemaname='public' AND indexname LIKE '%_idx' | wc -l`  
3. If missing, run: `bunx prisma db push --skip-generate` or apply migration  
**Verify:** Index count matches migration (38)

### A.3 — Wire Performance Monitor to Dashboard API (Issue #6)
**Files:** `src/lib/performance-monitor.ts`, `src/app/api/dashboard/route.ts`  
**Task:** Add timing to dashboard route  
```typescript
import { trackApiPerformance } from '@/lib/performance-monitor';
const start = Date.now();
const result = await getDashboardData();
trackApiPerformance('GET', '/api/dashboard', Date.now() - start, true);
return result;
```
**Dev Cycle:** `/spec → /build → /test → /review → /simplify → /ship`  
**Verify:** Dashboard API response includes `X-Response-Time` header

### A.4 — AuthError Coverage Audit (Issue #7) ✅ COMPLETE
**Task:** Scan all 210 API routes for AuthError handling  
**Findings:**

| Pattern | Count | Auth Library | Handling |
|---------|-------|-------------|----------|
| `api-auth.ts` | 25 routes | `getCurrentUser()` + `requireAuth()` | Throws `AuthError` ✅ |
| `api-utils.ts` | 165 routes | `requireAuth()` + `requireRole()` | Throws plain `Error` ⚠️ |
| Direct `NextResponse` | ~20 routes | Manual session check | Raw 401/403 ⚠️ |
| **handleApiError** | **0 routes** | `src/lib/api-error-handler.ts` | **Not used in any route ❌** |

**Key findings:**
- `handleApiError` exists at `src/lib/api-error-handler.ts:125` but **0 API routes import it**
- `api-utils.ts` `requireAuth()` throws `new Error(...)` not `AuthError` — catches that check `error?.name === 'AuthError'` won't catch it
- Mixed auth patterns (api-auth vs api-utils) work but are inconsistent
- All 207 catch blocks across 207 route files handle errors manually

**Verdict:** Phase B is justified. `handleApiError` should be wired into all API routes.

### A.5 — DB Index Gaps (NEW — discovered during A.2)
**Finding:** NO indexes exist on `Invoice.status`, `Receipt.status`, `Payment.status`, `JournalEntry.status`, `WhtCertificate.status` — these are the most-queried status fields in accounting.
**Action:** Add to schema + migration. High-impact, low-risk quick win.

---

## Phase B: Code Quality — Error Handling Standardization (Weeks 2-3)
**Goal:** Fix Issue #2 — 26 API routes using raw `catch (error)`

### B.1 — Create Unified Error Handler Spec
**File:** `docs/ERROR_HANDLING_STANDARD.md`  
**Template:**
```typescript
// Pattern for all 64 API routes
import { handleApiError } from '@/lib/api-error-handler';

export async function POST(request: NextRequest) {
  try {
    // ... business logic
    return apiResponse(data);
  } catch (error) {
    return handleApiError(error);  // ← replace all raw catch blocks
  }
}
```
**Dev Cycle:** `/spec` first  
**Verify:** Spec document approved

### B.2 — Batch Update API Routes (26 files)
**Strategy:** Process by category, 5 routes per session

**Batch 1 — Finance (5):**
- `src/app/api/invoices/route.ts`
- `src/app/api/receipts/route.ts`
- `src/app/api/payments/route.ts`
- `src/app/api/credit-notes/route.ts`
- `src/app/api/debit-notes/route.ts`

**Batch 2 — Master Data (5):**
- `src/app/api/customers/route.ts`
- `src/app/api/customers/[id]/route.ts`
- `src/app/api/vendors/route.ts`
- `src/app/api/vendors/[id]/route.ts`
- `src/app/api/products/route.ts`

**Batch 3 — Operations (5):**
- `src/app/api/purchase-orders/route.ts`
- `src/app/api/purchase-requests/route.ts`
- `src/app/api/employees/route.ts`
- `src/app/api/assets/route.ts`
- `src/app/api/inventory/route.ts`

**Batch 4 — Tax & Banking (5):**
- `src/app/api/wht/route.ts`
- `src/app/api/cheques/route.ts`
- `src/app/api/bank-accounts/route.ts`
- `src/app/api/accounting-periods/route.ts`
- `src/app/api/budgets/route.ts`

**Batch 5 — Remaining (6):**
- `src/app/api/journal/route.ts`
- `src/app/api/reports/route.ts`
- `src/app/api/settings/route.ts`
- `src/app/api/users/route.ts`
- `src/app/api/notifications/route.ts`
- `src/app/api/documents/route.ts`

**Dev Cycle:** `/spec per batch → /build → /test → /review → /simplify → /ship`  
**Verify:** `grep -rn "handleApiError" src/app/api/*/route.ts | wc -l` → 26+

### B.3 — Enable noImplicitAny
**File:** `tsconfig.json`  
**Task:** Change `"noImplicitAny": false` → `"noImplicitAny": true`  
**Pre-requisite:** B.2 complete (removes most `any` casts)  
**Dev Cycle:** `/spec → /build → /test → /review → /simplify → /ship`  
**Verify:** `tsc --noEmit` clean or known-minimal errors

### B.4 — Split Dashboard Route (Issue #2 sub-task)
**Files:** `src/app/api/dashboard/route.ts` → `src/lib/dashboard-service.ts`  
**Task:** Extract `getDashboardData()` and `transformDashboardData()` to service  
**Dev Cycle:** `/spec → /build → /test → /review → /simplify → /ship`  
**Verify:** `tsc --noEmit` passes, dashboard API still works

---

## Phase C: Performance Optimization (Weeks 4-6)
**Goal:** Fix Issues #3, #4, #8

### C.1 — N+1 Query Analysis (Issue #8)
**Tool:** `scripts/analyze-query-performance.sh`  
**Task:** Run against dev DB, identify top 12 N+1 issues  
**Output:** `docs/N1_QUERIES_FOUND.md` — ranked list of N+1 by impact  
**Dev Cycle:** `/spec → /build → /test → /review → /simplify → /ship`  
**Verify:** Report documents 12+ specific N+1 locations with file:line

### C.2 — Fix Top 12 N+1 Queries (Issue #8)
**Strategy:** Fix highest-impact first

**Expected top issues:**
1. `GET /api/invoices` — no `include` for customer, lines, journalEntries
2. `GET /api/receipts` — no `include` for customer, allocations
3. `GET /api/payments` — no `include` for vendor, allocations
4. `GET /api/dashboard` — 4 separate findMany without includes
5. `GET /api/products` — no `include` for category, inventory
6. `GET /api/employees` — no `include` for department, position

**Pattern:**
```typescript
// BEFORE (N+1)
const invoices = await db.invoice.findMany();

// AFTER (1 query)
const invoices = await db.invoice.findMany({
  include: { customer: true, lines: true, journalEntries: true },
});
```
**Dev Cycle:** `/spec → /build → /test → /review → /simplify → /ship` per query  
**Verify:** `scripts/analyze-query-performance.sh` shows 0 new N+1 after fixes

### C.3 — Dashboard API 800ms → <200ms (Issue #4)
**Files:** `src/app/api/dashboard/route.ts`, `src/lib/dashboard-service.ts`  
**Targets:**
- Parallelize independent queries with `Promise.all`
- Add caching layer (Redis or in-memory for <1min TTL)
- Lazy-load non-critical sections

**Current state:** Likely sequential queries  
**Target:** P75 response < 200ms  
**Dev Cycle:** `/spec → /build → /test → /review → /simplify → /ship`  
**Verify:** `curl -w "%{time_total}" http://localhost:3002/api/dashboard -o /dev/null` < 0.2s

### C.4 — Database Index Validation (Issue #3)
**Task:** After N+1 fixes, verify composite indexes are used  
```sql
-- PostgreSQL: check index usage
SELECT indexrelname, idx_scan, idx_tup_read 
FROM pg_stat_user_indexes 
WHERE schemaname='public' 
ORDER BY idx_scan ASC;
```
**Verify:** No full table scans on frequently queried columns

---

## Phase D: Testing & Monitoring (Weeks 7-8)
**Goal:** Fix Issues #5, #6, #7

### D.1 — Testing Strategy Shift (Issue #5)
**Current state:** Vitest + Playwright, some mocks  
**Target:** Real DB tests only, no mocks for Prisma

**Tasks:**
1. Audit all test files for mocks: `grep -rn "vi.mock\|jest.mock" tests/"`  
2. Replace Prisma mocks with `resetTestDB()` pattern
3. Add integration tests for critical paths:
   - Invoice create → JE posted → audit log created
   - Payment posted → WHT generated → GL entries balanced
   - Receipt posted → allocation created → balance updated

**Dev Cycle:** `/spec → /build → /test → /review → /simplify → /ship`  
**Verify:** `bun run test` passes, 0 mocks

### D.2 — AuthError Coverage Fix (Issue #7)
**Task:** Update all 61 files missing AuthError handling  
**Pattern:**
```typescript
import { AuthError } from '@/lib/api-auth';

catch (error) {
  if (error instanceof AuthError) throw error; // let middleware handle
  return handleApiError(error);
}
```
**Dev Cycle:** `/spec per batch → /build → /test → /review → /simplify → /ship`  
**Verify:** All 64 API routes handle AuthError appropriately

### D.3 — Wire Performance Monitor Reporting (Issue #6)
**Task:** Connect `performance-monitor.ts` to a persistent store and dashboard widget
- Store: New `ApiMetric` model in Prisma (lightweight)
- Read: `GET /api/metrics/performance` endpoint
- Display: Small widget in admin dashboard

**Dev Cycle:** `/spec → /build → /test → /review → /simplify → /ship`  
**Verify:** Metrics visible at `GET /api/metrics/performance`

---

## Execution Sequence

```
Week 1:  A.1 → A.2 → A.3 → A.4       (Quick wins + research)
Week 2:  B.1 → B.2 Batch 1-2         (Error handling starts)
Week 3:  B.2 Batch 3-5 → B.3 → B.4  (Complete code quality)
Week 4:  C.1 (N+1 analysis)          (Performance research)
Week 5:  C.2 Fix N+1 (top 6)         (Performance fixes)
Week 6:  C.2 Fix N+1 (bottom 6) → C.3 → C.4
Week 7:  D.1 Testing strategy         (Testing)
Week 8:  D.2 AuthError → D.3 monitoring
```

## Dependencies

| Phase | Depends on |
|-------|-----------|
| A | None |
| B.1-B.2 | A.4 (need coverage audit first) |
| B.3 | B.2 complete |
| B.4 | B.1 spec approved |
| C.1 | A.1, A.2 |
| C.2 | C.1 (need analysis first) |
| C.3 | B.4 (dashboard split) |
| C.4 | C.2 |
| D.1 | C.2 |
| D.2 | A.4 (coverage audit) |
| D.3 | C.3 |

## Verification Commands

```bash
# Error handling coverage
grep -rn "handleApiError" src/app/api/*/route.ts | wc -l
# Target: 26+ (currently 0)

# Bundle analyzer
ANALYZE=true bun run build
# Target: static < 3MB

# N+1 query check
bun run scripts/analyze-query-performance.sh
# Target: 0 high-severity N+1

# Dashboard timing
curl -w "%{time_total}" http://localhost:3002/api/dashboard -o /dev/null
# Target: < 0.2s

# AuthError coverage
grep -rn "AuthError" src/app/api/*/route.ts | grep "catch\|throw"
# Target: All 64 files

# DB indexes
sqlite3 prisma/dev.db ".indexes" | wc -l
# Target: 38+
```

---

## Next Step

Approve this plan → I will execute **Phase A** in sequence:
1. Run bundle analyzer → report
2. Verify DB indexes applied
3. Wire performance monitor to dashboard
4. Create AuthError coverage audit

Each follows: `/spec → /build → /test → /review → /simplify → /ship`
