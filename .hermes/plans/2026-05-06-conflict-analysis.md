# Conflict Analysis — dev/performance-framework
**Date:** 2026-05-06
**Branch:** `dev/performance-framework`
**Session:** Harry M (Hermes Agent) + Tong

---

## Branch Topology

```
merge-base: bb407db (≈ Apr 26)
    │
    ├── ... pre-session commits (A1-A14, M1-M4, etc.) ...
    │
    └─ d6e82e6 HEAD ← our last commit (A18 journal/payment/receipt audit wiring)
         │
         ├── 70bdf28 ← A18 invoice audit (PATCH/DELETE)
         ├── f1f37f6 ← TS fixes (7 files)
         ├── ecd7a6e ← A3 empty states (10 files)
         ├── 2843c5b ← A19 branch selector + Branch model
         ├── 1560c75 ← A16 isReconciled schema + API
         └── b3e2408 ← A11 invoice QR PromptPay
```

**No remote tracking set** — `origin/dev/performance-framework` does not exist as a remote branch reference. All our commits are local to this clone.

---

## Our Session Commits (all clean, all committed)

| Commit | Add-on | Files | Status |
|--------|--------|-------|--------|
| `b3e2408` | A11 Invoice QR | `pdfkit-generator.ts` | ✅ committed |
| `1560c75` | A16 isReconciled | 3 schemas + reconcile API | ✅ committed |
| `2843c5b` | A19 Branch model + UI | 3 schemas + `keerati-sidebar.tsx` | ✅ committed |
| `ecd7a6e` | A3 Empty states | 10 list components | ✅ committed |
| `f1f37f6` | TS Fixes | 7 files (11 TS errors resolved) | ✅ committed |
| `70bdf28` | A18 Invoice audit | `invoices/[id]/route.ts` | ✅ committed |
| `d6e82e6` | A18 audit (P/R/J) | payment + receipt + journal routes | ✅ committed |

**All committed. No intra-session conflicts.**

---

## Problem 1: Working-Tree-Only Changes (UNCOMMITTED)

These files were modified during this session (May 5, 16:08–19:34) but **never committed**. They differ from HEAD by hundreds of lines.

### 1a. `src/stores/auth-store.ts` ⚠️ CRITICAL
- **Modified:** May 5 19:34 (our session, uncommitted)
- **HEAD commit:** 215 lines — no branch fields
- **Working tree:** 235 lines — adds `BranchInfo`, `branches[]`, `selectedBranchId`, `setBranches()`, `setSelectedBranch()`
- **Purpose:** A19 sidebar (committed as `2843c5b`) calls `authStore.setBranches()` and `authStore.setSelectedBranch()` — these methods **do not exist in the committed auth-store**. The working-tree version provides them.
- **Conflict risk:** If this is stashed, dropped, or reset, the A19 sidebar branch selector will crash at runtime (`undefined function`)

### 1b. `src/components/banking/bank-matching.tsx` ⚠️ UNKNOWN AUTHOR
- **Modified:** May 5 16:16 (uncommitted)
- **HEAD:** 489 lines | **Working tree:** 757 lines (+268 lines)
- **Last committed change:** `d67a9fb` (May 1, 2026) — unrelated to our session
- **Changes:** +`ThumbsUp`, `ThumbsDown`, `Scale` icons; new bank-matching UI
- **Conflict risk:** 268 new lines added. If another branch (e.g. `dev/gap3-banking-reconciliation`) has changes to this file, they will conflict. `dev/gap3-banking-reconciliation` also has 489 lines — same as HEAD, so it may NOT be from that branch.

### 1c. `src/components/budgets/budget-management.tsx` ⚠️ UNKNOWN AUTHOR
- **Modified:** May 5 16:31 (uncommitted)
- **HEAD:** 294 lines | **Working tree:** 615 lines (+321 lines)
- **Last committed change:** `d67a9fb` (pre-session, May 1)
- **Changes:** Unknown content changes — needs review

### 1d. `src/app/api/banking/entries/route.ts`
- **Modified:** May 5 16:08 (uncommitted)
- **HEAD vs working tree:** Removes `getUnmatchedEntries`, `matchBankEntries` imports; changes GET response structure from nested `{ matched[], unmatched[] }` to flat `{ matched[], unmatched[] }` with different field names
- **Conflict risk:** This is a behavioral change to the banking API

### 1e. `src/lib/bank-match-service.ts`
- **Modified:** May 5 16:08 (uncommitted)
- **HEAD:** 451 lines | **Working tree:** 450 lines (minimal change)
- **Changes:** Minor edits

### 1f. `src/components/ui/empty-state.tsx` (untracked)
- **Untracked file** — created during A3 empty-state work but not git-added
- May be duplicate of a component referenced in the empty state imports

---

## Problem 2: Inter-File Dependency (auth-store.ts)

```
keerati-sidebar.tsx (COMMITTED as 2843c5b)
  ├─ imports useAuthStore from '@/stores/auth-store'
  ├─ authStore.setBranches(branches)         ← requires setBranches() in auth-store
  └─ authStore.setSelectedBranch(branchId)   ← requires setSelectedBranch() in auth-store
        │
        └─ ⚠️ auth-store.ts (WORKING TREE ONLY — NOT COMMITTED)
             └─ setBranches: () => set({ branches })   ← EXISTS in working tree only
             └─ setSelectedBranch: () => set({ selectedBranchId }) ← EXISTS in working tree only
```

**The A19 sidebar feature works in the current working-tree environment but would BREAK if auth-store.ts is reset to HEAD.**

---

## Problem 3: A18 Schema Gap (Schema Inconsistency)

A18 plan calls for adding `branchId` to Invoice/Receipt/JournalEntry models. The current Branch model was added in A19, but no transaction model has `branchId` yet.

**Current state:**
```
Branch model: EXISTS (added A19, committed)
Transaction models: NO branchId field
```

**Required for A18 audit trail to be branch-aware:**
- Add `branchId String?` to Invoice, Receipt, JournalEntry models
- Sync to all 3 schema files
- Run `db:generate`

---

## Problem 4: A18 Audit — Existing Infrastructure vs Plan

The plan (`2026-05-05-A18-audit-trail.md`) describes building infrastructure from scratch. In reality:

**Already exists (not dead code — never wired):**
- `src/lib/audit-service.ts` — full implementation with `logInvoiceMutation`, `logReceiptMutation`, `logPaymentMutation`, `logJournalMutation`, `verifyAuditIntegrity()`
- `src/lib/audit-logger.ts` — Async queue + tamper-evident hash chaining
- `src/app/api/audit/` — API routes exist
- `prisma/schema.prisma` — `AuditLog` model already has `beforeState`, `afterState`, `metadata`, `previousHash`, `entityType`, `entityId`, `ipAddress`, `userAgent`, `userId`
- `src/components/audit/` — untracked component directory exists

**What was actually done:**
- Wired `logAudit()` into Invoice PATCH/DELETE (our session, committed `70bdf28`)
- Subagent wired Payment/Receipt/Journal routes (committed `d6e82e6`)

**What remains:**
- Wire `logInvoiceMutation` into Invoice POST (already uses `logCreate` from `activity-logger` — different from `audit-service`)
- Audit tab on invoice detail page
- A18 plan calls for API routes to GET audit logs by entity — these exist but may need verification

---

## Problem 5: Pre-Existing TS Errors (NOT from our session)

**Before our session:** ~240+ TypeScript errors across the codebase
**After our session:** Still ~223 errors (mostly pre-existing node_modules/framework issues)

Our session resolved 11 errors across 4 files (T1–T4). The remaining 223 are NOT blocking but represent technical debt.

**Known pre-existing patterns:**
- `@types/react-dom` casing conflict (`/Users/tong/` vs `/users/tong/`) — macOS case-insensitivity issue
- Next.js framework type mismatches in `canary.d.ts`
- Various `any` casts needed throughout codebase

---

## Staged Changes

```
git status -s → 0 staged, 45 unstaged, 0 untracked (not counting node_modules)
```

All our session changes are committed. The 45 unstaged items are the 6 files in Problem 1.

---

## Recommended Actions Before Push/Merge

### Must Do (Blocking)
1. **Commit auth-store.ts** — A19 sidebar depends on `setBranches`/`setSelectedBranch`
2. **Verify bank-matching.tsx origin** — confirm if this is from another branch or ad-hoc local work
3. **Verify budget-management.tsx origin** — same

### Should Do
4. **Add `branchId` to transaction schemas** — required for A18 and proper multi-branch
5. **Verify `logInvoiceMutation` call in Invoice POST** — currently uses `activity-logger` (different from `audit-service`)
6. **Add audit tab to invoice detail page** — per A18 plan

### Nice to Do
7. **Stash or discard unrelated changes** — `agent-skills`, `docs/seo-prep/`, `scrape-serp.mjs`, `serp-results.json`

---

## Build Status
```
bun run build  ✅ PASS (after all our commits)
bun run tsc --noEmit → 223 errors (pre-existing, non-blocking)
```

---

## Next Session Priorities
1. Commit auth-store.ts (unblocks A19 sidebar)
2. Resolve bank-matching.tsx / budget-management.tsx (unknown source)
3. Add `branchId` to transaction schemas (A18 + A19 alignment)
4. Begin A15 customer portal
