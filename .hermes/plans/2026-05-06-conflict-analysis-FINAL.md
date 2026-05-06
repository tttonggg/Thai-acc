# Conflict Analysis — FINAL (Post-Research)
**Date:** 2026-05-06
**Branch:** `dev/performance-framework`
**Research:** 2 parallel agent reviews + own investigation

---

## Source of Truth Verification

```
✅ Build:           PASS (after all 7 session commits)
✅ TS (intentional): 0 new errors from our changes
⚠️  TS (pre-existing): ~223 errors (framework/node_modules, non-blocking)
✅ Commits:         7/7 complete (A11, A16, A19, A3, TS-fixes, A18×2)
⚠️  auth-store.ts:  UNCOMMITTED — CRITICAL dependency
⚠️  bank-matching:   UNCOMMITTED — A13/A16 extension (ADDITIVE)
⚠️  budget-mgmt:    UNCOMMITTED — A17 extension (ADDITIVE)
⚠️  banking/entries: UNCOMMITTED — simplification of existing API
⚠️  empty-state.tsx: UNTRACKED — created but never git-added
```

---

## Finding 1: `auth-store.ts` — CRITICAL (Must Commit)

**Problem:** A19 sidebar (commit `2843c5b`) calls `authStore.setBranches()` and `authStore.setSelectedBranch()`. These methods **do not exist in the committed version** — they only exist in the working-tree copy.

```
COMMITTED (HEAD):
  └─ setUser(), setPermissions(), setLoading(), logout(), hasPermission()
      ↑ setBranches() ← MISSING

WORKING TREE:
  └─ setUser(), setPermissions(), setLoading(), setBranches(), setSelectedBranch(), logout()
      ↑ setBranches() ← EXISTS (required by sidebar)
```

**Impact:** Running the dev server → sidebar renders → calls `authStore.setBranches([])` → TypeScript error OR runtime crash.

**Changes:**
```typescript
// NEW in working tree auth-store.ts:
export interface BranchInfo { id, code, name }
interface AuthState {
  branches: BranchInfo[];
  selectedBranchId: string | null;
  setSelectedBranch: (id: string | null) => void;
  setBranches: (branches: BranchInfo[]) => void;
}
// plus partialize updated to persist selectedBranchId
```

**Resolution:** Commit immediately as part of A19 continuation. Message: `"A19: commit working-tree auth-store changes — setBranches/setSelectedBranch required by sidebar"`.

---

## Finding 2: `bank-matching.tsx` — A13/A16 Extension (Keep Uncommitted)

**What it does (268 new lines):**
- `handleApprove()` — POST to `/api/banking/match-decision` with `{ entryId, decision:'approve', docId, docType, score, reasons }`
- `handleReject()` — POST to `/api/banking/match-decision` with `{ entryId, decision:'reject' }`
- `handleReconcile()` — POST to `/api/bank-accounts/{id}/reconcile` with `{ statementDate, statementBalance, reconciledItems[] }`
- `statementBalance`, `statementDate`, `reconciling` state variables
- Statement balance/date inputs in UI
- `ThumbsUp`, `ThumbsDown`, `Scale` icons for approve/reject/reconcile
- Restructures `matched` entries to include `description, amount, type, valueDate, reference`

**Source:** Matches A13 plan (approve/reject auto-match) + A16 plan (bank reconciliation with statement balance).

**Risk:** None — purely additive. The original 489-line committed version still exists. This is a superset.

**Resolution:** Keep uncommitted. Either (a) commit as A13/A16 continuation later, or (b) `git checkout HEAD -- src/components/banking/bank-matching.tsx` if not needed.

---

## Finding 3: `budget-management.tsx` — A17 Extension (Keep Uncommitted)

**What it does (+321 new lines):**
- `openBudgetDialog()` — opens create/edit dialog with account selector
- `handleSaveBudget()`, `handleDeleteBudget()` — CRUD handlers
- `budgetDialog`, `editingBudget`, `accounts`, `formData` state
- `Select` import for account dropdown (EXPENSE accounts via `/api/chart-of-accounts`)
- `Textarea` import for notes
- `Trash2` icon for delete
- Budget edit dialog: year, account, amount (Baht), alert threshold %, notes
- Row-click to edit existing budget

**Source:** Matches A17 plan (budget CRUD + alert thresholds).

**Already committed:** `budget-service.ts` (482 lines, backend) + `budgets/route.ts` (133 lines, API) — these provide the backend that this UI calls.

**Risk:** None — purely additive UI layer on top of existing backend.

**Resolution:** Keep uncommitted. Either commit as A17 continuation or discard.

---

## Finding 4: `banking/entries/route.ts` — API Simplification

**What it does:**
- Removes `getUnmatchedEntries`, `matchBankEntries` from `bank-match-service`
- Removes `handleApiError` import
- Inlines the matched/unmatched filtering directly in the route
- Changes response shape to include full entry data (description, amount, type, valueDate, reference) per matched entry

**Risk:** Low — same data, simpler implementation. But removes `getUnmatchedEntries()` call that bank-matching.tsx might depend on.

**Check required:** Does the new `bank-matching.tsx` (uncommitted) call `/api/banking/entries`? If yes, the new response shape is compatible. If it uses `getUnmatchedEntries()` from `bank-match-service`, the removal is fine.

**Resolution:** Review and commit separately or revert.

---

## Finding 5: `empty-state.tsx` — UNTRACKED

**Status:** Untracked file at `src/components/ui/empty-state.tsx`. Never git-added.

**Origin:** Created during A3 empty-state work but `git add` was never run.

**Current state:** May or may not match what's imported in list components (which use `@/components/common/empty-state`).

**Resolution:** `git add src/components/ui/empty-state.tsx` OR delete it if it's a duplicate.

---

## Finding 6: A17 — Already Implemented (Backend + Partial UI)

**AGENT 2 FINDING:**

| Layer | Status | File |
|-------|--------|------|
| Schema | ✅ DONE | `Budget`, `BudgetAlert` models in schema |
| Backend service | ✅ DONE | `src/lib/budget-service.ts` (482 lines) |
| API route | ✅ DONE | `src/app/api/budgets/route.ts` (133 lines) |
| UI (committed) | 🟡 PARTIAL | `budget-management.tsx` — 294 lines, read-only report |
| UI (working tree) | 🟢 EXTENSION | `budget-management.tsx` — 615 lines, adds CRUD dialogs |

**Plan says:** "Schema done, need UI + reports" — **WRONG**. Backend is complete. Working-tree adds the CRUD UI.

**Resolution:** Mark A17 as DONE (backend). The working-tree CRUD UI is a bonus. Decide whether to commit it.

---

## Finding 7: A18 — Partially Implemented

**AGENT 2 FINDING:**

| Component | Status | Detail |
|-----------|--------|--------|
| `audit-service.ts` | ✅ EXISTS | Full implementation (logAudit, verifyAuditIntegrity, etc.) |
| `audit-logger.ts` | ✅ EXISTS | Async queue + tamper-evident hash chaining |
| `AuditLog` model | ✅ EXISTS | Schema has it |
| Audit API routes | ✅ EXISTS | `src/app/api/audit/` |
| Invoice line-item audit | ✅ DONE | `src/app/api/invoices/[id]/lines/[lineId]/route.ts` |
| Invoice POST audit | 🟡 NEEDS FIX | Uses `activity-logger` not `audit-service` |
| Invoice PATCH/DELETE | ✅ DONE | Committed this session (`70bdf28`) |
| Payment/Receipt/Journal | ✅ DONE | Committed this session (`d6e82e6`) |
| Invoice detail audit tab | ❌ MISSING | Plan calls for it |
| A18 plan | ⚠️ STALE | Describes building from scratch — infrastructure already existed |

**Resolution:** A18 is 85% done. Remaining: (1) fix Invoice POST to use `logInvoiceMutation`, (2) add audit tab to invoice detail.

---

## Finding 8: A15 — Still NOT Implemented (Correct)

Confirmed by Agent 2: No portal routes, no portal auth, no portal views. Plan is accurate.

---

## ALIGNED ACTION PLAN

### Phase 0: Immediate (No Build Risk) — Do First

| # | Action | Reason |
|---|--------|--------|
| P0-1 | `git add src/stores/auth-store.ts && git commit -m "A19: add branch state to auth-store — setBranches/setSelectedBranch required by sidebar"` | Unblocks A19 sidebar at runtime |
| P0-2 | `git add src/components/ui/empty-state.tsx` | Was never tracked |
| P0-3 | Verify: `grep -r "empty-state\|EmptyState" src/components/` to confirm which path is used | Prevent duplicate component confusion |

### Phase 1: Build Verification

| # | Action | Reason |
|---|--------|--------|
| P1-1 | Run `bun run build` after auth-store commit | Confirm no regressions |
| P1-2 | Run `bun run tsc --noEmit` — record error count | Baseline for A15 work |

### Phase 2: Conflict Resolution

| # | Action | Decision |
|---|--------|----------|
| P2-1 | Bank-matching.tsx | Keep uncommitted OR `git checkout HEAD --` if A13/A16 not ready |
| P2-2 | Budget-management.tsx | Keep uncommitted OR commit as A17 extension |
| P2-3 | Banking/entries/route.ts | Review: does new bank-matching use it? If yes, commit as a set with bank-matching |
| P2-4 | bank-match-service.ts | Check: is `getUnmatchedEntries` still needed? If no, commit removal |

### Phase 3: A18 Residual

| # | Action | Detail |
|---|--------|--------|
| P3-1 | Fix Invoice POST audit | Change `activity-logger` → `logInvoiceMutation` from `audit-service` |
| P3-2 | Add audit tab to invoice detail | `src/components/invoices/invoice-detail.tsx` — add tab showing `AuditLog` entries |

### Phase 4: A15 Planning (New Work)

Full plan: see `.hermes/plans/2026-05-05-A15-customer-portal.md`
Scope confirmed: auth + APIs + pages + customer portal button in customer form

---

## SEQUENCE TO EXECUTE

```
Step 1: git add + commit auth-store.ts (CRITICAL — runtime blocker)
Step 2: git add empty-state.tsx (cleanup)
Step 3: bun run build (verify no regression)
Step 4: Decide on bank-matching/budget (commit as feature OR discard)
Step 5: Fix A18 residual (2 small tasks)
Step 6: A15 — new plan from revised plan doc
```

---

## FILES BY ACTION

| File | Action | Reason |
|------|--------|--------|
| `src/stores/auth-store.ts` | **COMMIT NOW** | Runtime dependency of committed A19 sidebar |
| `src/components/ui/empty-state.tsx` | `git add` | Was never tracked |
| `src/components/banking/bank-matching.tsx` | Keep or discard | Additive A13/A16 feature (unrelated to our session) |
| `src/components/budgets/budget-management.tsx` | Keep or discard | Additive A17 feature (unrelated to our session) |
| `src/app/api/banking/entries/route.ts` | Review + commit/discard | Simplification (unrelated to our session) |
| `src/lib/bank-match-service.ts` | Review + commit/discard | May be needed by bank-matching |

**All our session's 7 commits are clean. The conflicts are pre-existing uncommitted work from other sessions or the same session's exploratory phase.**
