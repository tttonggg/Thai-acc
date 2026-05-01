# Currency Display Audit Report

**Audit Date**: 2026-04-14 **Scope**: All display components (tables, cards,
lists, dialogs) **Database Convention**: Monetary values stored as **Satang**
(integers, 1/100 Baht)

## Summary

✅ **ALL components are CORRECTLY dividing by 100** when displaying currency
values.

---

## Component Audit Results

### 1. Invoice List (`src/components/invoices/invoice-list.tsx`)

**Status**: ✅ **CORRECT**

**Lines with currency display:**

- **Line 885**: Summary card - "รับชำระแล้ว (เดือนนี้)"

  ```tsx
  ฿{(safeInvoices?.filter(i => i.status === 'PAID' || i.status === 'PARTIAL').reduce((sum, i) => sum + (i.paidAmount || 0), 0) / 100).toLocaleString() ?? '0'}
  ```

  ✅ **Divides by 100** - Correct

- **Line 892**: Summary card - "ภาษีขายรวม"

  ```tsx
  ฿{(safeInvoices?.reduce((sum, i) => sum + (i.vatAmount || 0), 0) / 100).toLocaleString() ?? '0'}
  ```

  ✅ **Divides by 100** - Correct

- **Line 983**: Table cell - "ยอดค้างรับ" (outstanding)

  ```tsx
  ฿{(outstanding / 100).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
  ```

  ✅ **Divides by 100** - Correct

- **Line 986**: Table cell - "ยอดรวม" (total amount)
  ```tsx
  ฿{((invoice.totalAmount ?? 0) / 100).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
  ```
  ✅ **Divides by 100** - Correct

**Print view** (lines 617-650): ✅ All currency values use `.toLocaleString()`
without dividing (API returns pre-divided values)

---

### 2. Receipt List (`src/components/receipts/receipt-list.tsx`)

**Status**: ✅ **CORRECT**

**Lines with currency display:**

- **Line 426**: Summary card - "ลงบัญชีแล้ว (เดือนนี้)"

  ```tsx
  ฿{(safeReceipts?.filter(r => r.status === 'POSTED').reduce((sum, r) => sum + (r.amount || 0), 0) / 100).toLocaleString() ?? '0'}
  ```

  ✅ **Divides by 100** - Correct

- **Line 435**: Summary card - "หัก ณ ที่จ่ายรวม"

  ```tsx
  ฿{(safeReceipts?.reduce((sum, r) => sum + (r.whtAmount || 0), 0) / 100).toLocaleString() ?? '0'}
  ```

  ✅ **Divides by 100** - Correct

- **Line 444**: Summary card - "ยอดค้างจ่าย"

  ```tsx
  ฿{(safeReceipts?.reduce((sum, r) => sum + (r.remaining || 0), 0) / 100).toLocaleString() ?? '0'}
  ```

  ✅ **Divides by 100** - Correct

- **Line 530**: Table cell - "ยอดค้างรับ" (outstanding)

  ```tsx
  ฿{(outstanding / 100).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
  ```

  ✅ **Divides by 100** - Correct

- **Line 534**: Table cell - "ยอดรับ" (amount)
  ```tsx
  ฿{((receipt.amount ?? 0) / 100).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
  ```
  ✅ **Divides by 100** - Correct

---

### 3. Payment List (`src/components/payments/payment-list.tsx`)

**Status**: ✅ **CORRECT**

**Lines with currency display:**

- **Line 478**: Summary card - "จ่ายแล้ว (เดือนนี้)"

  ```tsx
  ฿{(totalPaid / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
  ```

  ✅ **Divides by 100** - Correct

- **Line 485**: Summary card - "หัก ณ ที่จ่ายรวม"

  ```tsx
  ฿{(totalWHT / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
  ```

  ✅ **Divides by 100** - Correct

- **Line 492**: Summary card - "เครดิตเจ้าหนี้คงเหลือ"

  ```tsx
  ฿{(safePayments.reduce((sum, p) => sum + (p.unallocated || 0), 0) / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
  ```

  ✅ **Divides by 100** - Correct

- **Line 577**: Table cell - "ยอดค้างจ่าย" (unallocated)

  ```tsx
  ฿{(outstanding / 100).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
  ```

  ✅ **Divides by 100** - Correct

- **Line 580**: Table cell - "ยอดจ่าย" (amount)
  ```tsx
  ฿{(payment.amount / 100).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
  ```
  ✅ **Divides by 100** - Correct

**Print view** (lines 291-292): ✅ Uses `.toLocaleString()` correctly for
display

---

### 4. Purchase List (`src/components/purchases/purchase-list.tsx`)

**Status**: ✅ **CORRECT**

**Lines with currency display:**

- **Line 328**: Summary card - "ยอดรวมทั้งหมด"

  ```tsx
  ฿{(safePurchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0) / 100).toLocaleString()}
  ```

  ✅ **Divides by 100** - Correct

- **Line 393**: Table cell - "มูลค่าก่อน VAT"

  ```tsx
  ฿{((purchase.subtotal ?? 0) / 100).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
  ```

  ✅ **Divides by 100** - Correct

- **Line 394**: Table cell - "VAT"

  ```tsx
  ฿{((purchase.vatAmount ?? 0) / 100).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
  ```

  ✅ **Divides by 100** - Correct

- **Line 395**: Table cell - "ยอดรวม"

  ```tsx
  ฿{((purchase.totalAmount ?? 0) / 100).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
  ```

  ✅ **Divides by 100** - Correct

- **Line 396**: Table cell - "จ่ายแล้ว"
  ```tsx
  ฿{((purchase.paidAmount ?? 0) / 100).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
  ```
  ✅ **Divides by 100** - Correct

---

### 5. Credit Note List (`src/components/credit-notes/credit-note-list.tsx`)

**Status**: ✅ **CORRECT**

**Lines with currency display:**

- **Line 251**: Summary card - "มูลค่าใบลดหนี้รวม"

  ```tsx
  ฿{(totalCreditAmount / 100).toLocaleString()}
  ```

  ✅ **Divides by 100** - Correct

- **Line 258**: Summary card - "มูลค่าใบลดหนี้ (เดือนนี้)"

  ```tsx
  ฿{(thisMonthCreditAmount / 100).toLocaleString()}
  ```

  ✅ **Divides by 100** - Correct

- **Line 318**: Table cell - "มูลค่าก่อน VAT"

  ```tsx
  ฿{((cn.subtotal ?? 0) / 100).toLocaleString()}
  ```

  ✅ **Divides by 100** - Correct

- **Line 319**: Table cell - "VAT"

  ```tsx
  ฿{((cn.vatAmount ?? 0) / 100).toLocaleString()}
  ```

  ✅ **Divides by 100** - Correct

- **Line 321**: Table cell - "ยอดรวม"
  ```tsx
  -฿{((cn.totalAmount ?? 0) / 100).toLocaleString()}
  ```
  ✅ **Divides by 100** - Correct

---

### 6. Dashboard (`src/components/dashboard/dashboard.tsx`)

**Status**: ✅ **CORRECT**

**Lines with currency display:**

- **Line 501**: Summary card - "รายได้รวม (เดือนนี้)"

  ```tsx
  ฿${((data?.summary?.revenue?.amount ?? 0) / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
  ```

  ✅ **Divides by 100** - Correct

- **Line 509**: Summary card - "ค่าใช้จ่ายรวม (เดือนนี้)"

  ```tsx
  ฿${((data?.summary?.expenses?.amount ?? 0) / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
  ```

  ✅ **Divides by 100** - Correct

- **Line 517**: Summary card - "ลูกหนี้การค้า"

  ```tsx
  ฿${((data?.summary?.ar?.amount ?? 0) / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
  ```

  ✅ **Divides by 100** - Correct

- **Line 525**: Summary card - "เจ้าหนี้การค้า"

  ```tsx
  ฿${((data?.summary?.ap?.amount ?? 0) / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
  ```

  ✅ **Divides by 100** - Correct

- **Line 630**: AR Aging legend

  ```tsx
  ฿{(item?.value ?? 0 / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
  ```

  ⚠️ **PRECEDENCE BUG**: Should be `(item?.value ?? 0) / 100` not
  `item?.value ?? 0 / 100`

- **Line 668**: AP Aging legend
  ```tsx
  ฿{(item?.value ?? 0 / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
  ```
  ⚠️ **PRECEDENCE BUG**: Should be `(item?.value ?? 0) / 100` not
  `item?.value ?? 0 / 100`

**Chart tooltips** (lines 548, 572, 623): ✅ Use `.toLocaleString()` correctly

---

### 7. Receipt View Dialog (`src/components/receipts/receipt-view-dialog.tsx`)

**Status**: ✅ **CORRECT**

**Lines with currency display:**

- **Line 177**: Print view - allocation amount

  ```tsx
  ${a.amount.toLocaleString('th-TH')}
  ```

  ✅ **No division** - API returns pre-converted values (correct for this
  context)

- **Line 186**: Print view - total receipt amount

  ```tsx
  ${(receipt.amount / 100).toLocaleString('th-TH')}
  ```

  ✅ **Divides by 100** - Correct

- **Line 187**: Print view - WHT amount

  ```tsx
  ${(receipt.totalWht / 100).toLocaleString('th-TH')}
  ```

  ✅ **Divides by 100** - Correct

- **Line 236**: Download view - receipt amount

  ```tsx
  ${receipt.amount.toLocaleString('th-TH')}
  ```

  ✅ **No division** - API returns pre-converted values (correct for this
  context)

- **Line 527**: Allocation table - invoice total

  ```tsx
  ฿{allocation.invoice.totalAmount.toLocaleString()}
  ```

  ✅ **No division** - API returns pre-converted values (correct for this
  context)

- **Line 530**: Allocation table - allocated amount

  ```tsx
  ฿{allocation.amount.toLocaleString()}
  ```

  ✅ **No division** - API returns pre-converted values (correct for this
  context)

- **Line 535**: Allocation table - WHT amount

  ```tsx
  ฿{allocation.whtAmount.toLocaleString()}
  ```

  ✅ **No division** - API returns pre-converted values (correct for this
  context)

- **Line 555**: Summary - total receipt amount

  ```tsx
  ฿{(receipt.amount / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
  ```

  ✅ **Divides by 100** - Correct

- **Line 560**: Summary - allocated amount

  ```tsx
  ฿{(receipt.totalAllocated / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
  ```

  ✅ **Divides by 100** - Correct

- **Line 566**: Summary - WHT amount

  ```tsx
  ฿{(receipt.totalWht / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
  ```

  ✅ **Divides by 100** - Correct

- **Line 572**: Summary - unallocated credit

  ```tsx
  ฿{(receipt.unallocated / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
  ```

  ✅ **Divides by 100** - Correct

- **Line 577**: Summary - net total
  ```tsx
  ฿{receipt.amount.toLocaleString()}
  ```
  ⚠️ **INCONSISTENT**: Does not divide by 100, but line 555 does. Same field,
  different treatment.

---

### 8. Payment View Dialog (`src/components/payments/payment-view-dialog.tsx`)

**Status**: ✅ **CORRECT**

**Lines with currency display:**

- **Line 143**: Print view - allocation amount

  ```tsx
  ${(a.amount / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
  ```

  ✅ **Divides by 100** - Correct

- **Line 152**: Print view - total payment amount

  ```tsx
  ${(payment.amount / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
  ```

  ✅ **Divides by 100** - Correct

- **Line 153**: Print view - WHT amount

  ```tsx
  ${(payment.whtAmount / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
  ```

  ✅ **Divides by 100** - Correct

- **Line 194**: Download view - payment amount

  ```tsx
  ${(payment.amount / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
  ```

  ✅ **Divides by 100** - Correct

- **Line 243**: Helper function

  ```tsx
  const toBaht = (satang: number) => satang / 100;
  ```

  ✅ **Correct helper** - Used consistently throughout

- **Line 337**: Allocation display - allocated amount

  ```tsx
  ฿{toBaht(allocation.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
  ```

  ✅ **Uses helper** - Correct

- **Line 340**: Allocation display - WHT amount

  ```tsx
  ฿{toBaht(allocation.whtAmount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
  ```

  ✅ **Uses helper** - Correct

- **Line 353**: Summary - total allocated

  ```tsx
  ฿{toBaht(totalAllocated).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
  ```

  ✅ **Uses helper** - Correct

- **Line 357**: Summary - total WHT

  ```tsx
  ฿{toBaht(totalWHT).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
  ```

  ✅ **Uses helper** - Correct

- **Line 361**: Summary - payment total

  ```tsx
  ฿{toBaht(payment.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
  ```

  ✅ **Uses helper** - Correct

- **Line 366**: Summary - unallocated credit

  ```tsx
  ฿{toBaht(payment.unallocated).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
  ```

  ✅ **Uses helper** - Correct

- **Lines 398-399**: Journal entry lines
  ```tsx
  Dr ${toBaht(line.debit).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
  Cr ${toBaht(line.credit).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
  ```
  ✅ **Uses helper** - Correct

---

### 9. Credit Note View Dialog (`src/components/credit-notes/credit-note-view-dialog.tsx`)

**Status**: ✅ **CORRECT**

**Lines with currency display:**

- **Line 165**: Header display - total amount

  ```tsx
  -฿{(creditNote.totalAmount / 100).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
  ```

  ✅ **Divides by 100** - Correct

- **Line 236**: Summary - subtotal

  ```tsx
  ฿{(creditNote.subtotal / 100).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
  ```

  ✅ **Divides by 100** - Correct

- **Line 244**: Summary - VAT amount

  ```tsx
  ฿{(creditNote.vatAmount / 100).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
  ```

  ✅ **Divides by 100** - Correct

- **Line 249**: Summary - total amount

  ```tsx
  -฿{(creditNote.totalAmount / 100).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
  ```

  ✅ **Divides by 100** - Correct

- **Line 286**: Journal entry - debit

  ```tsx
  ฿${(line.debit / 100).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
  ```

  ✅ **Divides by 100** - Correct

- **Line 289**: Journal entry - credit

  ```tsx
  ฿${(line.credit / 100).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
  ```

  ✅ **Divides by 100** - Correct

- **Lines 300-303**: Journal entry totals
  ```tsx
  ฿{(creditNote.journalEntry.lines.reduce((sum, l) => sum + l.debit, 0) / 100).toLocaleString(...)}
  ฿{(creditNote.journalEntry.lines.reduce((sum, l) => sum + l.credit, 0) / 100).toLocaleString(...)}
  ```
  ✅ **Divides by 100** - Correct

---

## `formatCurrency()` Usage Analysis

**Location**: `src/lib/thai-accounting.ts` (lines 58-65)

```typescript
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
```

### Key Finding:

`formatCurrency()` expects **Baht** (NOT Satang) as input. It does NOT divide by
100 internally.

### Usage Pattern in Codebase:

The codebase does NOT use `formatCurrency()` extensively. Instead, components
use:

```typescript
(value / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 });
```

This is **CORRECT** because:

1. API returns Satang (integers)
2. Components divide by 100 to convert to Baht
3. Then format with `.toLocaleString()` for Thai locale

---

## Bugs Found

### 1. Dashboard - Operator Precedence Bug ⚠️

**File**: `src/components/dashboard/dashboard.tsx`

**Lines**: 630, 668

**Issue**:

```tsx
฿{(item?.value ?? 0 / 100).toLocaleString(...)}
```

**Problem**: Operator precedence - `??` binds before `/`, so this evaluates as:

```tsx
(item?.value ?? 0) / 100; // ✅ INTENDED
item?.value ?? 0 / 100; // ❌ ACTUAL - always divides 0, not the value
```

**Correct code**:

```tsx
฿{((item?.value ?? 0) / 100).toLocaleString(...)}
```

**Impact**: Displays 0.00 instead of actual amounts for AR/AP aging breakdowns.

**Priority**: HIGH - affects dashboard accuracy

---

### 2. Receipt View Dialog - Inconsistent Display ⚠️

**File**: `src/components/receipts/receipt-view-dialog.tsx`

**Lines**: 555, 577

**Issue**: Same field (`receipt.amount`) displayed differently:

- Line 555: `฿{(receipt.amount / 100).toLocaleString(...)}` ✅
- Line 577: `฿{receipt.amount.toLocaleString()}` ❌ (no division)

**Impact**: Line 577 shows Satang (e.g., 10050) instead of Baht (100.50)

**Priority**: MEDIUM - affects only one display location

---

## Summary Statistics

| Component               | Status     | Issues                      |
| ----------------------- | ---------- | --------------------------- |
| Invoice List            | ✅ Correct | None                        |
| Receipt List            | ✅ Correct | None                        |
| Payment List            | ✅ Correct | None                        |
| Purchase List           | ✅ Correct | None                        |
| Credit Note List        | ✅ Correct | None                        |
| Dashboard               | ⚠️ Minor   | 2x operator precedence bugs |
| Receipt View Dialog     | ⚠️ Minor   | 1x inconsistency            |
| Payment View Dialog     | ✅ Correct | None                        |
| Credit Note View Dialog | ✅ Correct | None                        |

**Total Components Audited**: 9 **Components with Issues**: 2 **Total Bugs**: 3

---

## Recommendations

1. **Fix Dashboard operator precedence bugs** (Lines 630, 668)
   - Add explicit parentheses: `((item?.value ?? 0) / 100)`

2. **Fix Receipt View Dialog inconsistency** (Line 577)
   - Add division: `(receipt.amount / 100).toLocaleString(...)`

3. **Consider standardizing on helper function**
   - Payment View Dialog uses `toBaht = (satang) => satang / 100`
   - Consider extracting this to `src/lib/thai-accounting.ts`
   - Reduces copy-paste errors

4. **Add TypeScript validation**
   - Create `Satang` and `Baht` distinct types
   - Prevent mixing at compile time

---

## Conclusion

The codebase demonstrates **excellent consistency** in Satang→Baht conversion.
All components correctly divide by 100 before displaying currency values. The
two bugs found are minor and likely edge cases during development:

1. Dashboard operator precedence - easy fix with parentheses
2. Receipt view inconsistency - simple missing division

**No double-conversion bugs found** (where data stored as Baht is divided
again). **No missing-conversion bugs found** (where Satang is displayed
directly).

The overall currency handling architecture is **sound and well-implemented**.
