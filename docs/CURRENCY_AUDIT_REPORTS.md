# Currency Display & Calculation Audit - Reports

**Audit Date**: 2026-04-14 **Auditor**: Data Engineer Agent **Scope**: All
report components and API routes **Currency Standard**: Integer Satang (1/100
Baht) in database, divide by 100 for display

---

## Executive Summary

**CRITICAL FINDING**: All report components display Satang directly without
dividing by 100, causing amounts to appear **100x larger than actual values**.

**Impact**: EVERY financial report shows incorrect amounts (e.g., ฿1,000,000
instead of ฿10,000.00)

**Status**: 🔴 CRITICAL - System-wide bug affecting all financial reporting

---

## Database Schema Verification

✅ **All monetary fields stored as Int (Satang)** - Confirmed in
`prisma/schema.prisma`:

```prisma
debit       Int  // เดบิต (สตางค์)
credit      Int  // เครดิต (สตางค์)
subtotal    Int  // มูลค่าก่อน VAT (สตางค์)
vatAmount   Int  // ภาษีมูลค่าเพิ่ม (สตางค์)
totalAmount Int  // ยอดรวม (สตางค์)
whtAmount   Int  // ภาษีหัก ณ ที่จ่าย (สตางค์)
incomeAmount Int // จำนวนเงินที่จ่าย (สตางค์)
taxAmount   Int  // ภาษีที่หัก (สตางค์)
```

**Standard**: All values stored as Satang integers. Display = value / 100.

---

## Report Component Audit Results

### 1. VAT Report (`src/components/vat/vat-report.tsx`)

**Status**: ❌ **CRITICAL BUG**

**Calculations** (Lines 169-171):

```typescript
const totalVatOutput = vatOutputRecords.reduce((sum, r) => sum + r.vat, 0);
const totalVatInput = vatInputRecords.reduce((sum, r) => sum + r.vat, 0);
const netVatVal = totalVatOutput - totalVatInput;
```

- ❌ Sums Satang values directly
- ❌ Does NOT divide by 100 for display

**Display Examples**:

- Line 322: `฿{totalVatOutput?.toLocaleString() ?? '0'}` - Shows Satang as Baht
- Line 333: `฿{totalVatInput?.toLocaleString() ?? '0'}` - Shows Satang as Baht
- Line 345: `฿{netVatVal?.toLocaleString() ?? '0'}` - Shows Satang as Baht
- Line 394: `฿{record.amount?.toLocaleString() ?? '0'}` - Shows Satang as Baht
- Line 395: `฿{record.vat?.toLocaleString() ?? '0'}` - Shows Satang as Baht
- Line 400:
  `฿{vatOutputRecords.reduce((s, r) => s + (r.amount || 0), 0).toLocaleString()}` -
  ❌ WRONG

**Print Function** (Lines 181-264):

```typescript
<p>ภาษีขาย (Output VAT): ${totalVatOutput.toLocaleString('th-TH', {minimumFractionDigits: 2})} บาท</p>
<p>ภาษีซื้อ (Input VAT): ${totalVatInput.toLocaleString('th-TH', {minimumFractionDigits: 2})} บาท</p>
```

- ❌ Formats Satang as Baht with 2 decimal places
- ❌ Double conversion: shows "700.00" for ฿7.00 (700 Satang)

**Bug Summary**:

- Calculation: ✅ Correct (sums Satang)
- Display: ❌ **Wrong** (displays Satang as Baht, 100x too large)
- Fix needed: Divide all totals by 100 before display

---

### 2. WHT Report (`src/components/wht/wht-report.tsx`)

**Status**: ❌ **CRITICAL BUG**

**Calculations** (Lines 143-144):

```typescript
const totalPnd3 = pnd3Records.reduce((sum, r) => sum + (r.tax || 0), 0);
const totalPnd53 = pnd53Records.reduce((sum, r) => sum + (r.tax || 0), 0);
```

- ✅ Correctly sums Satang values
- ❌ Does NOT divide by 100 for display

**Display Examples**:

- Line 295: `฿{totalPnd3.toLocaleString()}` - ❌ Shows Satang as Baht
- Line 307: `฿{totalPnd53.toLocaleString()}` - ❌ Shows Satang as Baht
- Line 319: `฿{(totalPnd3 + totalPnd53).toLocaleString()}` - ❌ Shows Satang as
  Baht
- Line 361: `฿{record.income.toLocaleString()}` - ❌ Shows Satang as Baht
- Line 363: `฿{record.tax.toLocaleString()}` - ❌ Shows Satang as Baht
- Line 368:
  `฿{pnd53Records.reduce((s, r) => s + (r.income || 0), 0).toLocaleString()}` -
  ❌ WRONG
- Line 401: `฿{record.income.toLocaleString()}` - ❌ Shows Satang as Baht
- Line 403: `฿{record.tax.toLocaleString()}` - ❌ Shows Satang as Baht
- Line 408:
  `฿{pnd3Records.reduce((s, r) => s + (r.income || 0), 0).toLocaleString()}` -
  ❌ WRONG

**Print Function** (Lines 153-244):

```typescript
<p>ภงด.3 (เงินเดือน/ค่าจ้าง): ${totalPnd3.toLocaleString('th-TH', {minimumFractionDigits: 2})} บาท</p>
<p>ภงด.53 (ค่าบริการ/ค่าเช่า): ${totalPnd53.toLocaleString('th-TH', {minimumFractionDigits: 2})} บาท</p>
```

- ❌ Same double conversion bug as VAT report

**Bug Summary**:

- Calculation: ✅ Correct (sums Satang)
- Display: ❌ **Wrong** (displays Satang as Baht, 100x too large)
- Fix needed: Divide all totals by 100 before display

---

### 3. Reports Hub (`src/components/reports/reports.tsx`)

**Status**: ❌ **CRITICAL BUG**

**Trial Balance Print Function** (Lines 332-357):

```typescript
const totalDebit = accounts.reduce(
  (sum: number, a: any) => sum + (a.debit || 0),
  0
);
const totalCredit = accounts.reduce(
  (sum: number, a: any) => sum + (a.credit || 0),
  0
);
```

- ✅ Correctly sums Satang values
- ❌ Does NOT divide by 100 before display

**Display** (Lines 350-351, 356-357):

```typescript
<td class="text-right">${(acc.debit || 0) > 0 ? acc.debit.toLocaleString('th-TH', {minimumFractionDigits: 2}) : ''}</td>
<td class="text-right">${(acc.credit || 0) > 0 ? acc.credit.toLocaleString('th-TH', {minimumFractionDigits: 2}) : ''}</td>
```

- ❌ Displays Satang as Baht

**Balance Sheet Print Function** (Lines 362-376):

```typescript
<p>สินทรัพย์หมุนเวียน: ${(data.currentAssets || 0).toLocaleString('th-TH')} บาท</p>
<p>สินทรัพย์ไม่หมุนเวียน: ${(data.nonCurrentAssets || 0).toLocaleString('th-TH')} บาท</p>
<p style="font-weight: bold;">รวมสินทรัพย์: ${(data.totalAssets || 0).toLocaleString('th-TH')} บาท</p>
```

- ❌ All amounts displayed without dividing by 100

**Income Statement Print Function** (Lines 377-392):

```typescript
<p>รายได้จากการขาย: ${(data.revenue || 0).toLocaleString('th-TH')} บาท</p>
<p>ต้นทุนขาย: ${(data.costOfSales || 0).toLocaleString('th-TH')} บาท</p>
```

- ❌ All amounts displayed without dividing by 100

**Bug Summary**:

- All three report types (Trial Balance, Balance Sheet, Income Statement)
- Calculation: ✅ Correct (sums Satang from API)
- Display: ❌ **Wrong** (displays Satang as Baht, 100x too large)
- Fix needed: Divide all monetary values by 100 before toLocaleString()

---

### 4. Custom Report Builder (`src/components/reports/custom-report-builder.tsx`)

**Status**: ❌ **CRITICAL BUG**

**Display Examples** (Lines 754, 762, 810, 815):

```typescript
฿{reportData.totals?.debit?.toLocaleString('th-TH', { minimumFractionDigits: 2 }) || '0.00'}
฿{reportData.totals?.credit?.toLocaleString('th-TH', { minimumFractionDigits: 2 }) || '0.00'}
{account.debit > 0 ? `฿${account.debit.toLocaleString('th-TH', { minimumFractionDigits: 2 })}` : '-'}
{account.credit > 0 ? `฿${account.credit.toLocaleString('th-TH', { minimumFractionDigits: 2 })}` : '-'}
```

- ❌ Displays Satang as Baht
- ❌ Uses `minimumFractionDigits: 2` which creates double-conversion visual bug

**Bug Summary**:

- Calculation: ✅ Correct (sums Satang from API)
- Display: ❌ **Wrong** (displays Satang as Baht, 100x too large)
- Fix needed: Divide all monetary values by 100 before display

---

## API Routes Audit

### 1. Trial Balance API (`src/app/api/reports/trial-balance/route.ts`)

**Status**: ✅ **CORRECT**

**Return Values** (Lines 147-148):

```typescript
const totalDebit = accounts.reduce((sum, acc) => sum + acc.debit, 0);
const totalCredit = accounts.reduce((sum, acc) => sum + acc.credit, 0);
```

- ✅ Returns Satang values (Integers)
- ✅ Client responsible for dividing by 100

**Note**: API correctly returns Satang. The bug is in the component display
layer.

---

### 2. VAT Report API (`src/app/api/reports/vat/route.ts`)

**Status**: ✅ **CORRECT**

**Return Values** (Lines 88-95, 99-106):

```typescript
const totalVatOutput = transformedOutputRecords.reduce(
  (sum, r) => sum + r.vat,
  0
);
const totalVatInput = transformedInputRecords.reduce(
  (sum, r) => sum + r.vat,
  0
);
const totalOutputAmount = transformedOutputRecords.reduce(
  (sum, r) => sum + r.amount,
  0
);
const totalInputAmount = transformedInputRecords.reduce(
  (sum, r) => sum + r.amount,
  0
);
```

- ✅ Returns Satang values (from `vatRecord.vatAmount` - Int field)
- ✅ Client responsible for dividing by 100

**Note**: API correctly returns Satang. The bug is in the component display
layer.

---

### 3. WHT Report API (`src/app/api/reports/wht/route.ts`)

**Status**: ✅ **CORRECT**

**Return Values** (Lines 27-32):

```typescript
totalIncomeAmount: records.reduce((s, r) => s + r.incomeAmount, 0),
totalWhtAmount: records.reduce((s, r) => s + r.whtAmount, 0),
pnd3Amount: records.filter(r => r.type === 'PND3').reduce((s, r) => s + r.whtAmount, 0),
pnd53Amount: records.filter(r => r.type === 'PND53').reduce((s, r) => s + r.whtAmount, 0),
```

- ✅ Returns Satang values (from `withholdingTax.whtAmount` - Int field)
- ✅ Client responsible for dividing by 100

**Note**: API correctly returns Satang. The bug is in the component display
layer.

---

### 4. Balance Sheet API (`src/app/api/reports/balance-sheet/route.ts`)

**Status**: ✅ **CORRECT**

**Return Values** (Lines 212-214):

```typescript
const totalAssets = assets.reduce((sum, acc) => sum + acc.amount, 0);
const totalLiabilities = liabilities.reduce((sum, acc) => sum + acc.amount, 0);
const totalEquity = equity.reduce((sum, acc) => sum + acc.amount, 0);
```

- ✅ Returns Satang values (Integers)
- ✅ Client responsible for dividing by 100

**Note**: API correctly returns Satang. The bug is in the component display
layer.

---

## Root Cause Analysis

### The Bug Pattern

**Every report component follows this pattern**:

```typescript
// ❌ WRONG - Current implementation
const total = records.reduce((sum, r) => sum + r.amount, 0); // Sums Satang (correct)
return `฿${total.toLocaleString()}`; // Displays Satang as Baht (WRONG - 100x too large)

// ✅ CORRECT - Should be
const total = records.reduce((sum, r) => sum + r.amount, 0); // Sums Satang (correct)
return `฿${(total / 100).toLocaleString()}`; // Converts to Baht (CORRECT)
```

### Why This Happened

1. **API correctly returns Satang** (following database schema)
2. **Components correctly sum Satang** (calculation is correct)
3. **Display layer forgets to divide by 100** (conversion step missing)

This is a **presentation layer bug**, not a data integrity bug.

---

## Impact Assessment

### User Impact

**Severity**: 🔴 **CRITICAL**

**Example**:

- Actual: ฿10,000.00 (1,000,000 Satang)
- Displayed: ฿1,000,000.00 (1,000,000 shown as Baht)
- **User sees 100x larger amounts**

**Affected Reports**:

1. ✅ Trial Balance - ALL debit/credit totals wrong
2. ✅ Balance Sheet - ALL asset/liability/equity totals wrong
3. ✅ Income Statement - ALL revenue/expense totals wrong
4. ✅ VAT Report - ALL VAT amounts wrong
5. ✅ WHT Report - ALL tax amounts wrong
6. ✅ Custom Reports - ALL monetary fields wrong

### Business Impact

1. **Financial Misrepresentation**: All reports show inflated amounts
2. **Tax Compliance Risk**: VAT/WHT reports show wrong amounts for filing
3. **Decision Making**: Management decisions based on incorrect data
4. **User Trust**: Users will lose confidence in the system

---

## Recommended Fixes

### Fix Pattern

For every monetary display:

```typescript
// ❌ BEFORE
const total = records.reduce((sum, r) => sum + r.amount, 0)
<p>฿{total.toLocaleString()}</p>

// ✅ AFTER
const total = records.reduce((sum, r) => sum + r.amount, 0)
<p>฿{(total / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</p>
```

### Files Requiring Fixes

1. `src/components/vat/vat-report.tsx`
   - Lines: 322, 333, 345, 394, 395, 400, 205-207

2. `src/components/wht/wht-report.tsx`
   - Lines: 295, 307, 319, 361, 363, 368, 401, 403, 408, 178-180

3. `src/components/reports/reports.tsx`
   - Lines: 350-351, 356-357, 365-375, 380-391

4. `src/components/reports/custom-report-builder.tsx`
   - Lines: 754, 762, 810, 815

---

## Additional Findings

### Double Conversion Bug

Some reports use `{ minimumFractionDigits: 2 }` on Satang values:

```typescript
// ❌ Double conversion bug
700 Satang → "700.00" displayed (should be "7.00")
```

**Why this happens**:

- Satang value: 700 (integer)
- toLocaleString with minimumFractionDigits: 2
- Result: "700.00" (adds decimal to integer, treating it as Baht)
- Correct: Should divide by 100 first, then format

**Example from code**:

```typescript
// Line 322 in vat-report.tsx
฿{totalVatOutput?.toLocaleString() ?? '0'}
// Shows: ฿700 (should be ฿7.00)
```

---

## Testing Recommendations

### Manual Testing

1. Create test invoice: ฿1,234.56 (123,456 Satang)
2. Generate all report types
3. Verify displays: "฿1,234.56" NOT "฿123,456"

### Automated Testing

Add to report component tests:

```typescript
expect(screen.getByText('฿1,234.56')).toBeInTheDocument();
expect(screen.queryByText('฿123,456')).not.toBeInTheDocument();
```

---

## Summary Table

| Report           | Calculation   | Display        | Fix Needed    | Priority    |
| ---------------- | ------------- | -------------- | ------------- | ----------- |
| VAT Report       | ✅ Sum Satang | ❌ Show Satang | Divide by 100 | 🔴 Critical |
| WHT Report       | ✅ Sum Satang | ❌ Show Satang | Divide by 100 | 🔴 Critical |
| Trial Balance    | ✅ Sum Satang | ❌ Show Satang | Divide by 100 | 🔴 Critical |
| Balance Sheet    | ✅ Sum Satang | ❌ Show Satang | Divide by 100 | 🔴 Critical |
| Income Statement | ✅ Sum Satang | ❌ Show Satang | Divide by 100 | 🔴 Critical |
| Custom Reports   | ✅ Sum Satang | ❌ Show Satang | Divide by 100 | 🔴 Critical |

---

## Conclusion

**All report components have the same bug**: Displaying Satang (integer) values
directly as Baht without dividing by 100.

**Root Cause**: Missing conversion step in presentation layer.

**Fix**: Add `/ 100` before all monetary displays.

**Estimated Effort**: 2-3 hours to fix all 6 report components.

**Risk**: High - affects all financial reporting and tax filings.

---

**Audit Complete** ✅ **Next Action**: Fix all report display bugs (separate
task - NOT included in this audit)
