# Collaboration Rules — Thai ERP (Keerati)

**Effective: 2026-05-05**

---

## Roles

| Role | Who | Responsibility |
|------|-----|----------------|
| **Architect / Master Owner** | Claude | Overall design, consistency, final quality gate |
| **Feature Builder** | Hermes | Fast delivery in isolated branches |

---

## Golden Rules

### 1. Never Break Master Branch

Every change must be coordinated. Direct commits to `master` are blocked.
All work happens in named feature branches, reviewed before merge.

### 2. Schema Is Sacred Shared Territory

The database schema (`schema-sqlite.prisma`, `schema-postgres.prisma`) is shared code.
Any schema change — new model, new field, new relation — must be:

- Planned in writing (with impact analysis)
- Reviewed by the Architect before merge
- Version-controlled (migration file created)

No silent schema edits. No "I'll fix it later" schema changes.

### 3. Changes Must Be Explicitly Coordinated

Before making any change that affects shared code or cross-module behavior:
- State the intent
- State the impact
- Get acknowledgment from the Architect

---

## Working Rules

### Branching

```
master                    ← production-ready only
  ├── dev/performance-framework  ← stable integration branch
  └── dev/gap[N]-feature-name   ← feature branches (from latest work)
```

Branch from the latest stable work, never directly from master.

### Code Quality Gates (Pre-Commit)

- [ ] `npm run build` passes
- [ ] No new TypeScript errors in changed files
- [ ] `git diff --stat` shows only expected files
- [ ] `git status --short` has no junk files (`-p`, `3002`, etc.)
- [ ] DB schema synced (`bun run db:push --accept-data-loss` if schema changed)

### Build Order (Per Feature)

For every feature slice, follow this order:

```
1. Schema  (if new model/field) → prisma/schema-*.prisma
2. Service (business logic)      → src/lib/X-service.ts
3. Test    (unit test)           → src/lib/__tests__/X.test.ts
4. API     (route handler)       → src/app/api/X/route.ts
5. UI      (component)            → src/components/X/
```

Never build all of layer A before any of layer B. Complete one vertical slice at a time.

### Monetary Values — Non-Negotiable

All monetary amounts stored as **Satang integers** (1/100 of a Baht).

```
✅ Correct:  500_00    // represents ฿500.00
❌ Wrong:   500.00    // float for money is a bug
```

Conversion:
- `bahtToSatang()` — user input → database
- `satangToBaht()` — database → display

### Double-Entry Accounting

Every GL journal entry must balance:

```typescript
const totalDebit  = lines.reduce((sum, l) => sum + l.debit,  0)
const totalCredit = lines.reduce((sum, l) => sum + l.credit, 0)
if (totalDebit !== totalCredit) throw new Error('JE must balance')
```

### Prisma Schema Architecture

```
schema-sqlite.prisma     ← EDIT THIS FIRST (dev source)
schema-postgres.prisma   ← EDIT THIS TOO (production source)
        ↓
schema.prisma            ← AUTO-GENERATED, DO NOT EDIT DIRECTLY
```

### Route Files — Thin Only

Route files (`src/app/api/*/route.ts`) must export only HTTP method handlers.
All business logic goes in `src/lib/*-service.ts`. Non-route exports from route files cause TypeScript errors.

### T0 TypeScript Errors — Non-Blocking

`npm run build` is the gate. `bun run tsc --noEmit` is for tracking only.
Build passes with 200+ TypeScript errors. Never let tsc errors stop a commit.

### Pre-Existing Test Failures

If `git diff` does NOT touch the failing test file, the failure is pre-existing.
Run the failing test in isolation to confirm, then proceed with commit.

### Bulk Code Changes — Use Python, Not Subagents

For systematic multi-file changes (50+ files), write a Python script with proper brace-matching parsing.
Subagent delegation consistently times out on complex multi-file tasks and produces wrong patterns.

### Pre-Commit Junk-File Cleanup

After `git add -A`, always run `git status --short` before committing.
Remove any accidental filenames from stdin accidents:

```bash
rm -f -- "-p" "3002"
```

---

## Communication Norms

| Situation | Norm |
|-----------|------|
| Making a change to shared code | State intent + impact first |
| Finishing a feature | Report: done / blocked / next |
| Finding a pre-existing problem | Report separately, don't silently fix |
| Uncertain about scope | Ask before, not after |

### Status Reporting

After each session or significant milestone, report:

```
Done:   [what shipped]
Blocked: [what can't proceed and why]
Next:   [what I'm about to do]
```

Keep it factual and concise. No markdown spam.

---

## File Locations Reference

| File | Purpose |
|------|---------|
| `prisma/schema-sqlite.prisma` | Dev schema (edit first) |
| `prisma/schema-postgres.prisma` | Prod schema (edit too) |
| `src/lib/*-service.ts` | Business logic |
| `src/app/api/*/route.ts` | HTTP handlers only |
| `.hermes/plans/` | Feature plans |

---

## Quick Reference

```bash
# Sync schema
bun run db:generate && bun run db:push --accept-data-loss

# Verify build
npm run build

# Type-check (tracking only)
bun run tsc --noEmit 2>&1 | grep "^src/" | wc -l

# Check for junk files
git status --short
```
