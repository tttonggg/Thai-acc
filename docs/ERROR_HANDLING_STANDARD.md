# Error Handling Standard — Thai ERP API Routes

**Status:** SPEC — Phase B  
**Generated:** 2026-05-03  
**Branch:** `dev/performance-framework`

---

## Overview

All 210 API routes must use `handleApiError` from `src/lib/api-error-handler.ts` as the single error handling function in their `catch` blocks. This replaces 207 manual `catch (error: any)` blocks across 207 route files.

---

## Current State

| Pattern | Count | Status |
|---------|-------|--------|
| `catch (error: any)` with manual handling | 207 files | ❌ Replace |
| `handleApiError` used | 0 files | ❌ Not wired |
| `apiError()` from `api-utils` | ~20 files | ⚠️ Partial |
| `NextResponse.json(..., {status: 401})` direct | ~20 files | ⚠️ Partial |

---

## Target Pattern

### Single catch block per route handler

```typescript
import { handleApiError } from '@/lib/api-error-handler';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้รับอนุญาต - กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    const data = await prisma.invoice.findMany({
      where: { deletedAt: null },
      include: { customer: true, lines: true },
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return handleApiError(error, request);
  }
}
```

### Key rules

1. **Auth errors (401/403)**: Check session at top of handler, return `NextResponse.json(..., {status: 401})` directly — do NOT throw. Throwing causes an extra exception handling layer.

2. **Business logic errors (409, 400)**: Use `throw new ConflictError(...)`, `throw new ValidationError(...)` from `src/lib/errors.ts`. These are caught by `handleApiError`.

3. **Catch block**: Always use `handleApiError(error, request)` as the sole statement in every `catch` block.

4. **Never use `catch (error: any)`** — use `catch (error)` (TypeScript infers `unknown` in modern codebases with strict settings).

5. **Never manually `console.error` in catch** — `handleApiError` logs automatically.

---

## Error Classes Available

| Class | Status | Use for |
|-------|--------|---------|
| `AuthError` | 401 | Unauthenticated — use `throw new AuthError(...)` in services |
| `ForbiddenError` | 403 | Unauthorized role |
| `ValidationError` | 400 | Input validation failures |
| `NotFoundError` | 404 | Record not found |
| `ConflictError` | 409 | Duplicate, locked, state conflict |
| `DatabaseError` | 500 | DB connection/query failures |
| `RateLimitError` | 429 | Too many requests |
| `BusinessLogicError` | 422 | Business rule violations |

All defined in `src/lib/errors.ts`.

---

## Migration Batch Order

| Batch | Routes | Count |
|-------|--------|-------|
| 1 — Finance hot path | invoices, receipts, payments | 5 |
| 2 — Customers/Vendors | customers, vendors, products | 5 |
| 3 — Operations | purchase-orders, purchase-requests, employees | 5 |
| 4 — Tax & Banking | wht, cheques, bank-accounts, accounting-periods | 5 |
| 5 — Journal/Ledger | journal, journal-entries | 5 |
| 6 — Reports | reports/*, trial-balance, balance-sheet | 5 |
| 7 — Assets & Stock | assets, stock-takes, stock-movements | 5 |
| 8 — Settings & Admin | settings, users, notifications, admin/* | 5 |
| 9 — Remaining v1/v2 | v1/*, v2/*, documents, uploads | 5 |
| 10 — Last batch | All remaining routes | ~5 |

---

## Verification

After migration:

```bash
# Count handleApiError usages — should be > 0
grep -rn "handleApiError" src/app/api/ | wc -l

# Count raw catch blocks — should be 0
grep -rn "catch (error: any)" src/app/api/ | wc -l

# TypeScript
bun run tsc --noEmit  # should pass
npm run build          # should pass
```

---

## Notes

- **Auth errors**: Direct `return NextResponse.json(..., {status: 401})` at top of handler is fine and preferred over throwing — no change needed for auth checks.
- **Services** that throw `Error` (from `api-utils`) — those throw plain `Error` not `AuthError`. The service layer doesn't need to change; the route's `handleApiError` catches the thrown `Error` and returns 500. To fix this properly, `api-utils` would need updating to throw `AuthError`, but that's Phase C work.
- **Nested try/catch**: Routes with nested `try/catch` (e.g., inner business logic) should only use `handleApiError` in the outer-most `catch`.
