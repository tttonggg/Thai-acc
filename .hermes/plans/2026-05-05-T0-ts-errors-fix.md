## Task T0: Fix TypeScript Errors (Pre-flight)
**Files:** 5 route files
**Dev Cycle:** /spec → /plan → /build → /test → /review → /ship
**Depends on:** Nothing (must do first)

---

## What
Fix 10 TypeScript errors across 5 files before any add-on work can be merged.

---

## Step 1: /spec

### Current Errors
```
src/app/api/users/route.ts(40,46): error TS2339: Property 'name' does not exist on type '{}'.
src/app/api/users/route.ts(40,77): error TS2339: Property 'statusCode' does not exist on type '{}'.
src/app/api/users/route.ts(46,16): error TS2339: Property 'statusCode' does not exist on type '{}'.
src/app/api/users/route.ts(106,46): error TS2339: Property 'name' does not exist on type '{}'.
src/app/api/users/route.ts(106,77): error TS2339: Property 'statusCode' does not exist on type '{}'.
src/app/api/users/route.ts(112,16): error TS2339: Property 'statusCode' does not exist on type '{}'.
src/app/api/users/route.ts(115,9): error TS18046: 'error' is of type 'unknown'.
src/app/api/users/route.ts(117,63): error TS18046: 'error' is of type 'unknown'.
src/app/api/users/route.ts(123,32): error TS18046: 'error' is of type 'unknown'.
src/app/api/users/[id]/route.ts(133,9): error TS18046: 'error' is of type 'unknown'.
src/app/api/users/[id]/route.ts(135,63): error TS18046: 'error' is of type 'unknown'.
src/app/api/users/[id]/route.ts(140,32): error TS18046: 'error' is of type 'unknown'.
src/app/api/users/[id]/route.ts(195,32): error TS18046: 'error' is of type 'unknown'.
src/app/api/warehouses/route.ts(17,55): error TS18046: 'error' is of type 'unknown'.
src/app/api/warehouses/route.ts(47,55): error TS18046: 'error' is of type 'unknown'.
src/app/api/stock/transfers/route.ts(197,55): error TS18046: 'error' is of type 'unknown'.
src/app/api/test-auth/route.ts(34,16): error TS18046: 'error' is of type 'unknown'.
src/app/api/test-auth/route.ts(35,16): error TS18046: 'error' is of type 'unknown'.
```

### Root Cause
1. `catch (error: any)` → TypeScript strict mode rejects `any`; change to `catch (error)`
2. Error object being destructured as `{}` type — needs proper `Error` type annotation

---

## Step 2: /build

### Fix Pattern
```typescript
// BEFORE (TS strict rejects : any)
} catch (error: any) {
  const { name, message, statusCode } = error;

// AFTER
} catch (error) {
  const err = error as { name?: string; message?: string; statusCode?: number };
  // use err.name, err.statusCode
```

### File: src/app/api/users/route.ts
- Line ~40, 106: Fix error destructuring `{}` → typed
- Line ~115, 117, 123: Fix `catch (error: any)` → `catch (error)`

### File: src/app/api/users/[id]/route.ts
- Lines ~133, 135, 140, 195: Fix `catch (error: any)` → `catch (error)`

### File: src/app/api/warehouses/route.ts
- Lines ~17, 47: Fix `catch (error: any)` → `catch (error)`

### File: src/app/api/stock/transfers/route.ts
- Line ~197: Fix `catch (error: any)` → `catch (error)`

### File: src/app/api/test-auth/route.ts
- Lines ~34, 35: Fix `catch (error: any)` → `catch (error)`

---

## Step 3: /test

```bash
bun run tsc --noEmit
```

Expected: exit code 0 (no errors)

---

## Step 4: /review

Verify:
- [ ] `catch (error: any)` pattern removed from all 5 files
- [ ] Error destructuring uses proper type annotation
- [ ] `bun run tsc --noEmit` passes

---

## Step 5: /ship

```bash
git add src/app/api/users/route.ts src/app/api/users/ src/app/api/warehouses/route.ts src/app/api/stock/transfers/route.ts src/app/api/test-auth/route.ts
git commit -m "fix: resolve TypeScript strict mode errors (catch unknown)

- Remove catch(error: any) in favor of catch(error) with type assertion
- Fix error destructuring from {} to typed Error variant
- Fixes TS18046 and TS2339 across 5 route files
"
```
