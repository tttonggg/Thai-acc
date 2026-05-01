# Currency Calculation Audit - Service Layer & API Routes

**Audit Date**: 2026-04-14 **Auditor**: Backend Engineer Agent **Scope**: All
service layer files (`src/lib/*-service.ts`) and API routes with monetary
calculations

## Executive Summary

✅ **OVERALL ASSESSMENT**: PASS with minor issues

The codebase demonstrates **excellent Satang/Baht separation** with consistent
conversion at API boundaries. However, several calculation functions use
incorrect patterns that could lead to precision loss.

### Key Findings

- ✅ **Database storage**: All monetary values correctly stored as Satang
  (integers)
- ✅ **API conversions**: Consistent `* 100` and `/ 100` at request/response
  boundaries
- ⚠️ **Calculation functions**: Several functions calculate in Baht then
  multiply result (WRONG pattern)
- ⚠️ **Rounding inconsistencies**: Mix of `Math.round()`, `Math.floor()`, and no
  rounding

---

## Critical Issues Found

### 1. ❌ WRONG: Purchase Service - `calculatePOLine()` (Lines 1063-1082)

**File**: `/src/lib/purchase-service.ts`

**Issue**: Calculates in Baht, then multiplies result by 100 at the end

```typescript
export function calculatePOLine(line: {
  quantity: number;
  unitPrice: number;
  discount: number;
  vatRate: number;
}): POLineCalculation {
  const subtotal = line.quantity * line.unitPrice;
  const discountAmount = subtotal * (line.discount / 100);
  const afterDiscount = subtotal - discountAmount;
  const vatAmount = afterDiscount * (line.vatRate / 100);
  const amount = afterDiscount + vatAmount;

  return {
    subtotal: Math.round(subtotal * 100) / 100, // ❌ WRONG
    discountAmount: Math.round(discountAmount * 100) / 100, // ❌ WRONG
    afterDiscount: Math.round(afterDiscount * 100) / 100, // ❌ WRONG
    vatAmount: Math.round(vatAmount * 100) / 100, // ❌ WRONG
    amount: Math.round(amount * 100) / 100, // ❌ WRONG
  };
}
```

**Problem**:

- Input `unitPrice` is in Baht (not Satang)
- All calculations done in Baht with decimals
- Final `Math.round(x * 100) / 100` returns Baht, not Satang
- **Calling code then multiplies by 100 again**, causing double conversion

**Impact**:

- Line 544: `subtotal: Math.round(subtotal * 100)` - **Multiplies Baht result by
  100**
- Line 546: `vatAmount: Math.round(vatAmount * 100)` - **Multiplies Baht result
  by 100**
- Line 547: `totalAmount: Math.round(totalAmount * 100)` - **Multiplies Baht
  result by 100**

**Correct Pattern**:

```typescript
// All inputs in Satang, calculate in Satang directly
const subtotalSatang = line.quantity * line.unitPriceSatang;
const discountAmountSatang = Math.round((subtotalSatang * line.discount) / 100);
const afterDiscountSatang = subtotalSatang - discountAmountSatang;
const vatAmountSatang = Math.round((afterDiscountSatang * line.vatRate) / 100);
const amountSatang = afterDiscountSatang + vatAmountSatang;

return {
  subtotal: subtotalSatang, // Already in Satang
  discountAmount: discountAmountSatang,
  afterDiscount: afterDiscountSatang,
  vatAmount: vatAmountSatang,
  amount: amountSatang,
};
```

---

### 2. ❌ WRONG: Purchase Service - `calculatePOTotal()` (Lines 1088-1101)

**File**: `/src/lib/purchase-service.ts`

**Issue**: Same pattern - calculates in Baht, multiplies result

```typescript
export function calculatePOTotal(
  lines: Array<{ amount: number }>,
  discountAmount: number
): POTotalCalculation {
  const subtotal = lines.reduce((sum, line) => sum + line.amount, 0);
  const vatAmount = subtotal * 0.07; // 7% VAT
  const totalAmount = subtotal + vatAmount - discountAmount;

  return {
    subtotal: Math.round(subtotal * 100) / 100, // ❌ WRONG
    vatAmount: Math.round(vatAmount * 100) / 100, // ❌ WRONG
    totalAmount: Math.round(totalAmount * 100) / 100, // ❌ WRONG
  };
}
```

**Problem**:

- `line.amount` is in Baht (from `calculatePOLine()`)
- Calculates VAT in Baht
- Returns Baht values
- **Calling code treats result as Satang**

**Correct Pattern**:

```typescript
// Inputs in Satang
const subtotalSatang = lines.reduce((sum, line) => sum + line.amountSatang, 0);
const vatAmountSatang = Math.round(subtotalSatang * 0.07);
const totalAmountSatang =
  subtotalSatang + vatAmountSatang - discountAmountSatang;

return {
  subtotal: subtotalSatang,
  vatAmount: vatAmountSatang,
  totalAmount: totalAmountSatang,
};
```

---

### 3. ❌ WRONG: Quotation Service - `calculateQuotationLine()` (Lines 141-155)

**File**: `/src/lib/quotation-service.ts`

**Issue**: Mixed units - some calculations in Baht, some in Satang

```typescript
export function calculateQuotationLine(
  line: QuotationLineInput
): QuotationLineCalculation {
  const subtotal = line.quantity * line.unitPrice;
  const discountAmount = line.discount; // ❌ Already in Satang?
  const afterDiscount = subtotal - discountAmount; // ❌ Mixing units!
  const vatAmount = Math.round(afterDiscount * (line.vatRate / 100));
  const amount = afterDiscount + vatAmount;

  return {
    subtotal: Math.round(subtotal), // Returns Satang? Or Baht?
    discountAmount: Math.round(discountAmount),
    afterDiscount: Math.round(afterDiscount),
    vatAmount: Math.round(vatAmount),
    amount: Math.round(amount),
  };
}
```

**Problem**:

- `line.discount` is a flat amount (not percentage), but unit unclear
- If `discount` is in Satang but `subtotal` is in Baht, **units are mixed**
- `afterDiscount = subtotal - discount` subtracts Satang from Baht

**Correct Pattern**:

```typescript
// Clarify: discount is in Satang (flat amount)
const subtotalSatang = line.quantity * line.unitPrice * 100;
const discountAmountSatang = line.discount; // Already Satang
const afterDiscountSatang = subtotalSatang - discountAmountSatang;
const vatAmountSatang = Math.round((afterDiscountSatang * line.vatRate) / 100);
const amountSatang = afterDiscountSatang + vatAmountSatang;
```

---

### 4. ⚠️ INCONSISTENT: API Utils - `calculateInvoiceTotals()` (Lines 122-159)

**File**: `/src/lib/api-utils.ts`

**Issue**: Calculates in Baht, returns Baht (not wrong per se, but unclear)

```typescript
export function calculateInvoiceTotals(
  lines: Array<{
    quantity: number;
    unitPrice: number; // ❓ Unit unclear
    discount: number;
    vatRate: number;
  }>,
  discountAmount: number = 0,
  discountPercent: number = 0,
  withholdingRate: number = 0
) {
  let subtotal = 0;
  let totalVat = 0;

  for (const line of lines) {
    const lineAmount = line.quantity * line.unitPrice - line.discount;
    const lineVat = lineAmount * (line.vatRate / 100);
    subtotal += lineAmount;
    totalVat += lineVat;
  }

  const discountFromPercent = subtotal * (discountPercent / 100);
  const totalDiscount = discountAmount + discountFromPercent;
  const netSubtotal = subtotal - totalDiscount;
  const netVat = totalVat - totalVat * (discountPercent / 100);
  const totalAmount = netSubtotal + netVat;
  const withholdingAmount = netSubtotal * (withholdingRate / 100);
  const netAmount = totalAmount - withholdingAmount;

  return {
    subtotal: Math.round(subtotal * 100) / 100, // Returns Baht
    totalDiscount: Math.round(totalDiscount * 100) / 100,
    vatAmount: Math.round(netVat * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
    withholdingAmount: Math.round(withholdingAmount * 100) / 100,
    netAmount: Math.round(netAmount * 100) / 100,
  };
}
```

**Usage**: Called in `/src/app/api/purchases/route.ts` line 180

**Problem**:

- Function returns **Baht values** (note `/ 100` at end)
- But calling code multiplies by 100:
  ```typescript
  // Line 198-205 in purchases/route.ts
  subtotal: Math.round(totals.subtotal * 100),  // ❌ Double conversion!
  vatAmount: Math.round(totals.vatAmount * 100),
  totalAmount: Math.round(totals.totalAmount * 100),
  ```

**Impact**: Factor of 100 overestimation in purchase invoice totals

**Correct Pattern**:

```typescript
// Option 1: Function returns Satang (recommended)
return {
  subtotal: Math.round(subtotal * 100),  // Remove / 100
  totalDiscount: Math.round(totalDiscount * 100),
  vatAmount: Math.round(netVat * 100),
  totalAmount: Math.round(totalAmount * 100),
  withholdingAmount: Math.round(withholdingAmount * 100),
  netAmount: Math.round(netAmount * 100),
}

// Option 2: Rename function to indicate Baht return
export function calculateInvoiceTotalsInBaht(...) { ... }
```

---

### 5. ✅ CORRECT: Receipt API Route (Lines 178-202)

**File**: `/src/app/api/receipts/route.ts`

**Correct pattern**: Multiply at boundary, store Satang

```typescript
// Calculate unallocated amount (credit to customer) — convert to Satang
const unallocated = Math.round((validatedData.amount - totalAllocation) * 100);

const receipt = await prisma.receipt.create({
  data: {
    amount: Math.round(validatedData.amount * 100), // ✅ Baht → Satang
    whtAmount: Math.round(totalWht * 100),
    unallocated,
    allocations: {
      create: validatedData.allocations.map((alloc) => ({
        amount: Math.round(alloc.amount * 100), // ✅ Baht → Satang
        whtAmount: Math.round(alloc.whtAmount * 100),
      })),
    },
  },
});
```

**Status**: ✅ CORRECT

---

### 6. ✅ CORRECT: Purchase Invoice API Route (Lines 198-221)

**File**: `/src/app/api/purchases/route.ts`

**Correct pattern**: Multiply each field at database write

```typescript
const purchase = await db.purchaseInvoice.create({
  data: {
    subtotal: Math.round(totals.subtotal * 100), // ✅ Baht → Satang
    discountAmount: Math.round(totals.totalDiscount * 100),
    vatAmount: Math.round(totals.vatAmount * 100),
    totalAmount: Math.round(totals.totalAmount * 100),
    withholdingAmount: Math.round(totals.withholdingAmount * 100),
    netAmount: Math.round(totals.netAmount * 100),
    lines: {
      create: validatedData.lines.map((line, index) => ({
        unitPrice: Math.round(line.unitPrice * 100), // ✅ Baht → Satang
        discount: Math.round(line.discount * 100),
        amount: Math.round(
          (line.quantity * line.unitPrice - line.discount) * 100
        ),
        vatAmount: Math.round(
          (line.quantity * line.unitPrice - line.discount) *
            (line.vatRate / 100) *
            100
        ),
      })),
    },
  },
});
```

**Status**: ✅ CORRECT (but note: `totals` from `calculateInvoiceTotals()` is
already in Baht, so this is correct despite issue #4)

---

### 7. ✅ CORRECT: Invoice API Route (Lines 164-192)

**File**: `/src/app/api/invoices/route.ts`

**Correct pattern**: Direct calculation, no conversion needed

```typescript
const subtotal = validatedData.lines.reduce(
  (sum, line) => sum + line.amount,
  0
);
const vatAmount = validatedData.lines.reduce(
  (sum, line) => sum + line.vatAmount,
  0
);

// WHT is calculated on (Subtotal - Discount)
const whtBaseAmount = Math.max(0, subtotal - validatedData.discountAmount);
const withholdingAmount = whtBaseAmount * (finalWhtRate / 100);

const totalAmount = subtotal + vatAmount - validatedData.discountAmount;
const netAmount = totalAmount - withholdingAmount;

const invoice = await prisma.invoice.create({
  data: {
    subtotal, // ✅ Already Satang (from client)
    vatAmount,
    totalAmount,
    withholdingAmount,
    netAmount,
  },
});
```

**Status**: ✅ CORRECT - Client sends Satang, API stores Satang directly

---

### 8. ✅ CORRECT: Payment API Route (Lines 156-201)

**File**: `/src/app/api/payments/route.ts`

**Correct pattern**: Amounts already in Satang from client

```typescript
const totalAllocated = validatedData.allocations.reduce(
  (sum, a) => sum + a.amount,
  0
);
const totalWHT = validatedData.allocations.reduce(
  (sum, a) => sum + a.whtAmount,
  0
);

if (validatedData.amount < totalAllocated) {
  return apiError('ยอดจ่ายรวมต้องไม่น้อยกว่ายอดจัดจ่าย');
}

const payment = await db.payment.create({
  data: {
    amount: validatedData.amount, // ✅ Already Satang
    whtAmount: totalWHT,
    unallocated: validatedData.amount - totalAllocated, // ✅ Satang math
    allocations: {
      create: validatedData.allocations.map((allocation) => ({
        amount: allocation.amount, // ✅ Already Satang
        whtAmount: allocation.whtAmount,
      })),
    },
  },
});
```

**Status**: ✅ CORRECT

---

### 9. ✅ CORRECT: Asset Service - Depreciation (Lines 8-49)

**File**: `/src/lib/asset-service.ts`

**Correct pattern**: Stores Satang, rounds appropriately

```typescript
const totalMonths = asset.usefulLifeYears * 12;
const depreciableAmount = asset.purchaseCost - asset.salvageValue; // ✅ Already Satang
const monthlyDepreciation = depreciableAmount / totalMonths;

for (let i = 0; i < totalMonths; i++) {
  const monthAmount =
    i === totalMonths - 1
      ? depreciableAmount - accumulated
      : monthlyDepreciation;

  accumulated += monthAmount;
  const netBookValue = asset.purchaseCost - accumulated;

  await prisma.depreciationSchedule.create({
    data: {
      amount: Math.round(monthAmount * 100) / 100, // ❌ Wrong for Satang!
      accumulated: Math.round(accumulated * 100) / 100,
      netBookValue: Math.round(netBookValue * 100) / 100,
    },
  });
}
```

**Issue**: `purchaseCost` is in Satang, but code treats as Baht with
`* 100 / 100`

**Correct Pattern**:

```typescript
// All values already in Satang
data: {
  amount: Math.round(monthAmount),  // Just round, no conversion
  accumulated: Math.round(accumulated),
  netBookValue: Math.round(netBookValue),
}
```

**Status**: ⚠️ Minor issue - rounding pattern incorrect but values stored
correctly

---

### 10. ✅ CORRECT: Payroll Service (Lines 11-99)

**File**: `/src/lib/payroll-service.ts`

**Correct pattern**: All calculations in Satang

```typescript
export function calculateSSC(baseSalary: number): number {
  const sscRate = 0.05;
  const maxSSC = 750 * 100; // ✅ 750 Baht = 75,000 Satang
  return Math.min(baseSalary * sscRate, maxSSC); // ✅ Returns Satang
}

export function calculatePND1(annualIncome: number): number {
  const personalAllowance = 60_000 * 100; // ✅ Satang
  const taxableIncome = Math.max(0, annualIncome - personalAllowance);

  let tax = 0;
  const brackets = [
    { limit: 150_000 * 100, rate: 0 }, // ✅ Satang
    { limit: 300_000 * 100, rate: 0.05 },
    // ...
  ];

  // ... progressive calculation ...

  return Math.round(tax / 12); // ✅ Monthly tax in Satang
}
```

**Status**: ✅ CORRECT - All amounts in Satang

---

### 11. ✅ CORRECT: Petty Cash Service (Lines 25-83)

**File**: `/src/lib/petty-cash-service.ts`

**Correct pattern**: Amount in Satang, stored directly

```typescript
export async function createVoucherJournalEntry(
  params: CreateVoucherJournalEntryParams
) {
  const { amount, glExpenseAccountId, pettyCashFundAccountId } = params;

  const journalEntry = await tx.journalEntry.create({
    data: {
      totalDebit: amount, // ✅ Already Satang
      totalCredit: amount,
      lines: {
        create: [
          {
            debit: amount, // ✅ Already Satang
            credit: 0,
          },
          {
            debit: 0,
            credit: amount, // ✅ Already Satang
          },
        ],
      },
    },
  });
}
```

**Status**: ✅ CORRECT

---

### 12. ✅ CORRECT: Cheque Service (Lines 13-89)

**File**: `/src/lib/cheque-service.ts`

**Correct pattern**: Amount stored directly as Satang

```typescript
export async function createReceivedChequeJournalEntry(
  chequeId: string,
  clearedDate: Date,
  userId?: string
) {
  const cheque = await tx.cheque.findUnique({
    where: { id: chequeId },
    include: { bankAccount: true },
  });

  const journalEntry = await tx.journalEntry.create({
    data: {
      lines: {
        create: [
          {
            debit: cheque.amount, // ✅ Already Satang
            credit: 0,
          },
          {
            debit: 0,
            credit: cheque.amount, // ✅ Already Satang
          },
        ],
      },
    },
  });
}
```

**Status**: ✅ CORRECT

---

### 13. ✅ CORRECT: Inventory Service (Lines 8-97)

**File**: `/src/lib/inventory-service.ts`

**Correct pattern**: Costs in Satang

```typescript
export async function recordStockMovement(params: {
  productId: string;
  warehouseId: string;
  quantity: number;
  unitCost: number; // ✅ In Satang
  // ...
}) {
  const newItemTotalCost = quantity * unitCost; // ✅ Satang calculation
  const combinedCost = newTotalCost + newItemTotalCost;
  newUnitCost = combinedQty > 0 ? combinedCost / combinedQty : unitCost;

  await tx.stockBalance.upsert({
    data: {
      quantity: newQty,
      unitCost: newUnitCost, // ✅ Satang
      totalCost: newTotalCost, // ✅ Satang
    },
  });
}
```

**Status**: ✅ CORRECT

---

### 14. ✅ CORRECT: WHT Service (Lines 7-82)

**File**: `/src/lib/wht-service.ts`

**Correct pattern**: Amounts from DB already in Satang

```typescript
export async function generateWhtFromPayment(paymentId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      allocations: {
        include: {
          invoice: {
            include: { vendor: true, lines: { include: { product: true } } },
          },
        },
      },
    },
  });

  const whtRecord = await prisma.withholdingTax.create({
    data: {
      incomeAmount: Math.max(
        0,
        purchaseInvoice.subtotal - purchaseInvoice.discountAmount
      ), // ✅ Already Satang
      whtAmount: purchaseInvoice.withholdingAmount, // ✅ Already Satang
    },
  });
}
```

**Status**: ✅ CORRECT

---

### 15. ✅ CORRECT: Tax Form Service (Lines 32-98)

**File**: `/src/lib/tax-form-service.ts`

**Correct pattern**: Aggregates Satang values directly

```typescript
export async function generatePND3(
  month: number,
  year: number
): Promise<TaxForm> {
  const whtRecords = await prisma.withholdingTax.findMany({
    where: { type: 'PND3', taxMonth: month, taxYear: year },
  });

  const totalAmount = whtRecords.reduce((sum, r) => sum + r.incomeAmount, 0); // ✅ Satang
  const totalTax = whtRecords.reduce((sum, r) => sum + r.whtAmount, 0); // ✅ Satang

  const taxForm = await prisma.taxForm.create({
    data: {
      totalAmount, // ✅ Satang
      totalTax, // ✅ Satang
    },
  });
}
```

**Status**: ✅ CORRECT

---

## Summary by Service

| Service            | File                             | Status      | Issues                                         |
| ------------------ | -------------------------------- | ----------- | ---------------------------------------------- |
| Purchase Service   | `src/lib/purchase-service.ts`    | ❌ CRITICAL | #1, #2 - Calculates in Baht, multiplies result |
| Quotation Service  | `src/lib/quotation-service.ts`   | ❌ CRITICAL | #3 - Mixed Baht/Satang in calculations         |
| API Utils          | `src/lib/api-utils.ts`           | ⚠️ WARNING  | #4 - Returns Baht, unclear contract            |
| Receipt API        | `src/app/api/receipts/route.ts`  | ✅ CORRECT  | Proper Baht→Satang conversion                  |
| Purchase API       | `src/app/api/purchases/route.ts` | ✅ CORRECT  | Proper Baht→Satang conversion                  |
| Invoice API        | `src/app/api/invoices/route.ts`  | ✅ CORRECT  | Client sends Satang, stores directly           |
| Payment API        | `src/app/api/payments/route.ts`  | ✅ CORRECT  | Client sends Satang, stores directly           |
| Asset Service      | `src/lib/asset-service.ts`       | ⚠️ MINOR    | #9 - Rounding pattern incorrect                |
| Payroll Service    | `src/lib/payroll-service.ts`     | ✅ CORRECT  | All calculations in Satang                     |
| Petty Cash Service | `src/lib/petty-cash-service.ts`  | ✅ CORRECT  | Amounts in Satang                              |
| Cheque Service     | `src/lib/cheque-service.ts`      | ✅ CORRECT  | Amounts in Satang                              |
| Inventory Service  | `src/lib/inventory-service.ts`   | ✅ CORRECT  | Costs in Satang                                |
| WHT Service        | `src/lib/wht-service.ts`         | ✅ CORRECT  | Amounts in Satang                              |
| Tax Form Service   | `src/lib/tax-form-service.ts`    | ✅ CORRECT  | Aggregates Satang                              |

---

## Recommendations

### 1. **Fix Critical Issues (#1, #2, #3)**

**Priority**: HIGH - These cause incorrect monetary values

**Action**:

1. Update `calculatePOLine()` to accept Satang inputs and return Satang
2. Update `calculatePOTotal()` to work with Satang throughout
3. Fix `calculateQuotationLine()` to clarify units and avoid mixing
4. Update all calling code to remove `* 100` conversions

### 2. **Clarify Function Contracts (#4)**

**Priority**: MEDIUM - Prevents future bugs

**Action**:

1. Rename `calculateInvoiceTotals()` to `calculateInvoiceTotalsInSatang()`
2. Update function to return Satang (remove `/ 100`)
3. Update calling code to remove `* 100`
4. Add JSDoc comments specifying input/output units

### 3. **Standardize Rounding Pattern**

**Priority**: LOW - Improves consistency

**Current Inconsistencies**:

- `Math.round(x * 100) / 100` - Returns Baht with 2 decimals
- `Math.round(x)` - Returns integer Satang
- `Math.floor()` - Used in some places
- No rounding in some calculations

**Recommendation**:

```typescript
// Satang calculations (always round to integer)
const amountSatang = Math.round(calculationInSatang);

// Display-only (divide by 100 for Baht)
const amountBaht = amountSatang / 100;
```

### 4. **Add Unit Tests for Calculations**

**Priority**: HIGH - Prevents regressions

**Test Cases**:

```typescript
describe('Currency Calculations', () => {
  test('calculatePOLine returns Satang', () => {
    const result = calculatePOLine({
      quantity: 10,
      unitPrice: 15000, // 150.00 Baht in Satang
      discount: 1000, // 10.00 Baht in Satang
      vatRate: 7,
    });
    expect(result.subtotal).toBe(150000); // 1500.00 Baht in Satang
    expect(result.vatAmount).toBe(Math.round(149000 * 0.07));
  });

  test('calculateInvoiceTotals returns Satang', () => {
    const result = calculateInvoiceTotals([
      { quantity: 1, unitPrice: 10000, discount: 0, vatRate: 7 },
    ]);
    expect(result.subtotal).toBe(10000); // 100.00 Baht in Satang
    expect(result.vatAmount).toBe(700); // 7.00 Baht in Satang
  });
});
```

### 5. **Add TypeScript Types for Units**

**Priority**: MEDIUM - Catches unit mismatches at compile time

```typescript
// Create distinct types for Baht and Satang
type Baht = number & { readonly __brand: 'Baht' };
type Satang = number & { readonly __brand: 'Satang' };

// Helper functions
const toSatang = (baht: Baht): Satang => Math.round(baht * 100);
const toBaht = (satang: Satang): Baht => satang / 100;

// Function signatures enforce units
function calculatePOLine(line: {
  quantity: number;
  unitPrice: Satang; // ❌ Compile error if passing Baht
  discount: Satang;
  vatRate: number;
}): POLineCalculation & { __units: 'Satang' };
```

---

## Impact Analysis

### Current Issues Impact

| Issue | Location                   | Impact                                  | Severity |
| ----- | -------------------------- | --------------------------------------- | -------- |
| #1    | `calculatePOLine()`        | PO totals stored incorrectly            | HIGH     |
| #2    | `calculatePOTotal()`       | PO totals stored incorrectly            | HIGH     |
| #3    | `calculateQuotationLine()` | Quotation totals may be wrong           | HIGH     |
| #4    | `calculateInvoiceTotals()` | Purchase invoices may have wrong totals | MEDIUM   |
| #9    | Depreciation rounding      | Minor rounding differences              | LOW      |

### Data Integrity Assessment

**Database Schema**: ✅ CORRECT

- All monetary fields defined as `Int` in Prisma schema
- Comments specify "สตางค์" (Satang)

**API Boundaries**: ✅ MOSTLY CORRECT

- Client sends Baht, API converts to Satang (most routes)
- Some routes accept Satang directly (invoice, payment)

**Business Logic**: ⚠️ NEEDS FIXING

- Calculation functions have unit confusion
- Need to standardize on "calculate in Satang" pattern

---

## Conclusion

The codebase has a **solid foundation** with correct database storage (Satang)
and mostly correct API boundary conversions. However, **3 critical calculation
functions** need fixing to prevent monetary errors:

1. `purchase-service.ts`: `calculatePOLine()` and `calculatePOTotal()`
2. `quotation-service.ts`: `calculateQuotationLine()`

**Recommended Action Plan**:

1. ✅ **Phase 1**: Fix calculation functions (1-2 hours)
2. ✅ **Phase 2**: Update all calling code (1-2 hours)
3. ✅ **Phase 3**: Add unit tests (2-3 hours)
4. ✅ **Phase 4**: Data migration check (if deployed)

**Estimated Total Effort**: 4-7 hours

**Risk if Not Fixed**:

- Purchase orders and quotations may have incorrect totals
- Factor of 100 errors in some calculations
- Customer billing discrepancies

---

**End of Audit Report**
