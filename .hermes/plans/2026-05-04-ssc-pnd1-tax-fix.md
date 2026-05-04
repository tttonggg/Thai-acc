# SPEC: Fix SSC & PND1 Tax Calculation Bugs

## Objective
Fix 28 failing payroll tests caused by Baht/Satang unit mixing in `payroll-service.ts`.

## Root Cause (3 bugs)

| # | Bug | Location | Root Cause | Impact |
|---|-----|----------|------------|--------|
| 1 | SSC cap never fires | `calculateSSC()` line 15 | `sscCeiling = 9900_00` (Satang) makes `maxSSC = 49500` (Satang). Comparison `min(raw_Baht, 49500_Satang)` never caps. | ฿10,000 salary → SSC=500 instead of 495; ฿15,000+ → no cap |
| 2 | PND1 returns 0 for all | `calculatePND1()` line 30 | `taxableIncome = annualIncome_Baht - 6_000_000_Satang`. Negative → 0 tax. | All PND1 tests return +0 |
| 3 | Journal entry unbalanced | `createPayrollJournalEntry()` line 156-157 | Cascades from Bug 1: `calculateEmployerSSC(20000)` returns 1000 instead of 495. | JE Debit≠Credit: ฿106,485 vs ฿110,000 |

## Commands
- Test: `npm test -- --run src/lib/__tests__/payroll-service.test.ts`
- Build: `npm run build`
- TSC: `bun run tsc --noEmit`

## Fix Strategy

### Fix 1: SSC ceiling unit mismatch
**File:** `src/lib/payroll-service.ts` line 15

```typescript
// BEFORE (bug):
const sscCeiling = 9900_00; // ฿9,900 in Satang (9900 Baht × 100)
const maxSSC = Math.round(sscCeiling * sscRateBps / 10000); // = 49,500 Satang
// min(750, 49500) = 750 — cap never triggers for ฿15,000+ salary

// AFTER (fix):
const sscCeiling = 9900; // ฿9,900 in Baht (Satang mixed-bag caused maxSSC=49500)
const maxSSC = Math.round(sscCeiling * sscRateBps / 10000); // = 495 Baht
// min(750, 495) = 495 — cap fires correctly
```

Test verification:
- `calculateSSC(9900)` → `min(495, 495)` = 495 ✓
- `calculateSSC(10000)` → `min(500, 495)` = 495 ✓
- `calculateSSC(15000)` → `min(750, 495)` = 495 ✓
- `calculateSSC(50000)` → `min(2500, 495)` = 495 ✓

### Fix 2: PND1 taxable income unit mismatch
**File:** `src/lib/payroll-service.ts` line 30

```typescript
// BEFORE (bug):
const taxableIncome = Math.max(0, annualIncome - personalAllowance);
// 300000 (Baht) - 6_000_000 (Satang) = negative → 0

// AFTER (fix):
const taxableIncome = Math.max(0, annualIncome * 100 - personalAllowance);
// 300000*100 (Satang) - 6_000_000 (Satang) = 24_000_000 Satang ✓
```

Test verification:
- `calculatePND1(300000)` → 4500 annual → 375 monthly ✓
- `calculatePND1(500000)` → 21500 annual → 1792 monthly ✓

### Fix 3: Journal balance (cascades from Fix 1)
Once `calculateEmployerSSC` returns correct 495 for ฿10,000 salary, the journal balance self-corrects.

## Files to Change
- `src/lib/payroll-service.ts` — Fix 2 lines (SSC ceiling, PND1 allowance)

## Verification
1. `npm test -- --run src/lib/__tests__/payroll-service.test.ts` — all payroll tests pass
2. `npm run build` — passes
3. `bun run tsc --noEmit` — 0 errors
