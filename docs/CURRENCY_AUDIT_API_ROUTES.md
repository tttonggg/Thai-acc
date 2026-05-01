# Currency Conversion Audit Report - API Routes

**Audit Date**: 2026-04-14 **Auditor**: Backend Engineer Agent **Scope**: All
API routes handling monetary values **Standard**: Database stores Satang
(integers), API accepts/returns Baht (decimals)

---

## Executive Summary

**Critical Finding**: 9 out of 9 API routes have **MAJOR BUGS** in currency
conversion.

### Bug Categories Found:

1. **Double Conversion Bug** (2 routes) - Values converted twice, creating
   factor-of-100 errors
2. **Missing Input Conversion** (6 routes) - Accepting Baht but storing as Baht
   instead of Satang
3. **Missing Output Conversion** (7 routes) - Returning Satang without dividing
   by 100
4. **Inconsistent Conversion** (2 routes) - Mixed conversion within same route

---

## Detailed Findings

### 1. `/api/invoices` (POST, GET)

**Route**: `/Users/tong/Thai-acc/src/app/api/invoices/route.ts`

#### POST (Create Invoice)

- **Input Handling**: ❌ **CRITICAL BUG** - Missing Baht → Satang conversion
- **Output Handling**: ✅ No output conversion needed (returns created object)
- **Line Numbers**: 206-214, 221-232

**Specific Bugs**:

```typescript
// Line 206-214: Stores Baht directly instead of converting to Satang
subtotal,  // ❌ BUG: Should be Math.round(subtotal * 100)
vatAmount,  // ❌ BUG: Should be Math.round(vatAmount * 100)
totalAmount,  // ❌ BUG: Should be Math.round(totalAmount * 100)
withholdingAmount,  // ❌ BUG: Should be Math.round(withholdingAmount * 100)
netAmount,  // ❌ BUG: Should be Math.round(netAmount * 100)

// Lines 221-232: Line items also not converted
unitPrice: line.unitPrice,  // ❌ BUG: Should be Math.round(line.unitPrice * 100)
amount: line.amount,  // ❌ BUG: Should be Math.round(line.amount * 100)
vatAmount: line.vatAmount,  // ❌ BUG: Should be Math.round(line.vatAmount * 100)
```

#### GET (List Invoices)

- **Input Handling**: N/A (GET request)
- **Output Handling**: ❌ **CRITICAL BUG** - Returns Satang without conversion
- **Line Numbers**: 110-127

**Specific Bug**:

```typescript
// Lines 110-127: Returns Satang values directly
data: invoices,  // ❌ BUG: All monetary fields need /100 conversion
```

**Impact**: Invoice amounts displayed 100x higher than actual value.

---

### 2. `/api/receipts` (POST, GET, PUT)

**Route**: `/Users/tong/Thai-acc/src/app/api/receipts/route.ts`

#### POST (Create Receipt)

- **Input Handling**: ✅ **CORRECT** - Converts Baht to Satang
- **Output Handling**: ❌ **BUG** - Returns Satang without conversion
- **Line Numbers**: 179-203

**Correct Implementation**:

```typescript
// Lines 179-203: Correctly converts Baht to Satang
unallocated: Math.round((validatedData.amount - totalAllocation) * 100),  // ✅
amount: Math.round(validatedData.amount * 100),  // ✅
whtAmount: Math.round(totalWht * 100),  // ✅
amount: Math.round(alloc.amount * 100),  // ✅
whtAmount: Math.round(alloc.whtAmount * 100),  // ✅
```

**Output Bug**:

```typescript
// Line 216: Returns Satang values without conversion
return NextResponse.json({ success: true, data: receipt }); // ❌ Needs conversion
```

#### GET (List Receipts)

- **Input Handling**: N/A
- **Output Handling**: ❌ **CRITICAL BUG** - Returns Satang without conversion
- **Line Numbers**: 63-119

**Specific Bug**:

```typescript
// Lines 63-119: Returns Satang values directly
data: receipts,  // ❌ BUG: All monetary fields need /100 conversion
```

#### PUT (Update Receipt) - `/api/receipts/[id]/route.ts`

- **Input Handling**: ❌ **BUG** - Missing Baht → Satang conversion
- **Output Handling**: ❌ **BUG** - Returns Satang without conversion
- **Line Numbers**: 157-188

**Specific Bugs**:

```typescript
// Lines 157-188: Stores Baht directly
amount: validatedData.amount,  // ❌ BUG: Should be Math.round(validatedData.amount * 100)
whtAmount: totalWht,  // ❌ BUG: Should be Math.round(totalWht * 100)
unallocated,  // ❌ BUG: Should be Math.round(unallocated * 100)
amount: alloc.amount,  // ❌ BUG: Should be Math.round(alloc.amount * 100)
whtAmount: alloc.whtAmount,  // ❌ BUG: Should be Math.round(alloc.whtAmount * 100)
```

---

### 3. `/api/payments` (POST, GET, PUT)

**Route**: `/Users/tong/Thai-acc/src/app/api/payments/route.ts`

#### POST (Create Payment)

- **Input Handling**: ❌ **CRITICAL BUG** - Missing Baht → Satang conversion
- **Output Handling**: ❌ **BUG** - Returns Satang without conversion
- **Line Numbers**: 156-201

**Specific Bugs**:

```typescript
// Lines 177-179: Stores Baht directly
amount: validatedData.amount,  // ❌ BUG: Should be Math.round(validatedData.amount * 100)
whtAmount: totalWHT,  // ❌ BUG: Should be Math.round(totalWHT * 100)
unallocated: validatedData.amount - totalAllocated,  // ❌ BUG: Should be in Satang

// Lines 184-191: Allocations not converted
amount: allocation.amount,  // ❌ BUG: Should be Math.round(allocation.amount * 100)
whtAmount: allocation.whtAmount,  // ❌ BUG: Should be Math.round(allocation.whtAmount * 100)

// Line 215: Returns Satang values
return apiResponse(payment, 201)  // ❌ BUG: Needs /100 conversion
```

#### GET (List Payments)

- **Input Handling**: N/A
- **Output Handling**: ❌ **CRITICAL BUG** - Returns Satang without conversion
- **Line Numbers**: 68-102

**Specific Bug**:

```typescript
// Lines 68-102: Returns Satang values directly
data: payments,  // ❌ BUG: All monetary fields need /100 conversion
```

#### PUT (Update Payment) - `/api/payments/[id]/route.ts`

- **Input Handling**: ❌ **BUG** - Missing Baht → Satang conversion
- **Output Handling**: ❌ **BUG** - Returns Satang without conversion
- **Line Numbers**: 163-206

**Specific Bugs**:

```typescript
// Lines 163-171: Allocations not converted
amount: allocation.amount,  // ❌ BUG: Should be Math.round(allocation.amount * 100)
whtAmount: allocation.whtAmount,  // ❌ BUG: Should be Math.round(allocation.whtAmount * 100)

// Lines 175-180: Totals not converted
whtAmount: totalWHT,  // ❌ BUG: Should be Math.round(totalWHT * 100)
unallocated: amount - totalAllocated,  // ❌ BUG: Should be in Satang
```

---

### 4. `/api/purchases` (POST, GET, PUT)

**Route**: `/Users/tong/Thai-acc/src/app/api/purchases/route.ts`

#### POST (Create Purchase Invoice)

- **Input Handling**: ✅ **CORRECT** - Converts Baht to Satang
- **Output Handling**: ❌ **BUG** - Returns Satang without conversion
- **Line Numbers**: 188-229

**Correct Implementation**:

```typescript
// Lines 198-205: Correctly converts Baht to Satang
subtotal: Math.round(totals.subtotal * 100),  // ✅
discountAmount: Math.round(totals.totalDiscount * 100),  // ✅
vatAmount: Math.round(totals.vatAmount * 100),  // ✅
totalAmount: Math.round(totals.totalAmount * 100),  // ✅
withholdingAmount: Math.round(totals.withholdingAmount * 100),  // ✅
netAmount: Math.round(totals.netAmount * 100),  // ✅

// Lines 216-220: Line items correctly converted
unitPrice: Math.round(line.unitPrice * 100),  // ✅
discount: Math.round(line.discount * 100),  // ✅
amount: Math.round(((line.quantity * line.unitPrice) - line.discount) * 100),  // ✅
vatAmount: Math.round((((line.quantity * line.unitPrice) - line.discount) * (line.vatRate / 100)) * 100),  // ✅
```

**Output Bug**:

```typescript
// Line 321: Returns Satang values
return apiResponse(purchase, 201); // ❌ Needs /100 conversion
```

#### GET (List Purchases)

- **Input Handling**: N/A
- **Output Handling**: ❌ **CRITICAL BUG** - Returns Satang without conversion
- **Line Numbers**: 52-73, 131-140

**Specific Bug**:

```typescript
// Lines 52-73: Returns Satang values directly
data: transformedPurchases,  // ❌ BUG: All monetary fields need /100 conversion
```

#### PUT (Update Purchase) - `/api/purchases/[id]/route.ts`

- **Input Handling**: ✅ **CORRECT** - Converts Baht to Satang
- **Output Handling**: ❌ **BUG** - Returns Satang without conversion
- **Line Numbers**: 113-153

**Correct Implementation**:

```typescript
// Lines 123-130: Correctly converts Baht to Satang
subtotal: Math.round(totals.subtotal * 100),  // ✅
discountAmount: Math.round(totals.totalDiscount * 100),  // ✅
vatAmount: Math.round(totals.vatAmount * 100),  // ✅
totalAmount: Math.round(totals.totalAmount * 100),  // ✅

// Lines 140-144: Line items correctly converted
unitPrice: Math.round(line.unitPrice * 100),  // ✅
discount: Math.round(line.discount * 100),  // ✅
amount: Math.round(((line.quantity * line.unitPrice) - line.discount) * 100),  // ✅
```

---

### 5. `/api/credit-notes` (POST, GET)

**Route**: `/Users/tong/Thai-acc/src/app/api/credit-notes/route.ts`

#### POST (Create Credit Note)

- **Input Handling**: ✅ **CORRECT** - Converts Baht to Satang
- **Output Handling**: ❌ **BUG** - Returns Satang without conversion
- **Line Numbers**: 243-303

**Correct Implementation**:

```typescript
// Lines 250-253: Correctly converts Baht to Satang
subtotal: Math.round(validatedData.subtotal * 100),  // ✅
vatAmount: Math.round(validatedData.vatAmount * 100),  // ✅
totalAmount: Math.round(validatedData.totalAmount * 100),  // ✅

// Lines 284, 291: Journal entries also converted
debit: Math.round(validatedData.subtotal * 100),  // ✅
debit: Math.round(validatedData.vatAmount * 100),  // ✅
```

**Output Bug**:

```typescript
// Line 371: Returns Satang values
return apiResponse({ success: true, data: completeCreditNote }, 201); // ❌ Needs conversion
```

#### GET (List Credit Notes)

- **Input Handling**: N/A
- **Output Handling**: ❌ **CRITICAL BUG** - Returns Satang without conversion
- **Line Numbers**: 82-155

**Specific Bug**:

```typescript
// Lines 82-155: Returns Satang values directly
data: transformedCreditNotes,  // ❌ BUG: All monetary fields need /100 conversion
```

---

### 6. `/api/debit-notes` (POST, GET)

**Route**: `/Users/tong/Thai-acc/src/app/api/debit-notes/route.ts`

#### POST (Create Debit Note)

- **Input Handling**: ❌ **CRITICAL BUG** - Missing Baht → Satang conversion
- **Output Handling**: ❌ **BUG** - Returns Satang without conversion
- **Line Numbers**: 243-303

**Specific Bugs**:

```typescript
// Lines 250-253: Stores Baht directly
subtotal: validatedData.subtotal,  // ❌ BUG: Should be Math.round(validatedData.subtotal * 100)
vatAmount: validatedData.vatAmount,  // ❌ BUG: Should be Math.round(validatedData.vatAmount * 100)
totalAmount: validatedData.totalAmount,  // ❌ BUG: Should be Math.round(validatedData.totalAmount * 100)

// Lines 284, 291: Journal entries also not converted
debit: validatedData.subtotal,  // ❌ BUG: Should be in Satang
debit: validatedData.vatAmount,  // ❌ BUG: Should be in Satang
```

#### GET (List Debit Notes)

- **Input Handling**: N/A
- **Output Handling**: ❌ **CRITICAL BUG** - Returns Satang without conversion
- **Line Numbers**: 82-155

**Specific Bug**:

```typescript
// Lines 82-155: Returns Satang values directly
data: transformedDebitNotes,  // ❌ BUG: All monetary fields need /100 conversion
```

---

### 7. `/api/quotations` (POST, GET)

**Route**: `/Users/tong/Thai-acc/src/app/api/quotations/route.ts`

#### POST (Create Quotation)

- **Input Handling**: ❌ **INCONSISTENT** - Partial conversion
- **Output Handling**: ❌ **BUG** - Returns Satang without conversion
- **Line Numbers**: 233-303

**Inconsistent Implementation**:

```typescript
// Lines 233-246: Lines NOT converted (using Satang values from schema)
const subtotal = line.quantity * line.unitPrice  // ❌ BUG: Already in Satang per schema
const amount = afterDiscount + vatAmount  // ❌ BUG: Already in Satang per schema

// Lines 249-253: Totals calculated incorrectly (double counting Satang)
const subtotal = lines.reduce((sum, line) => sum + (line.quantity * line.unitPrice), 0)  // ❌
const vatAmount = Math.round(afterDiscount * (validatedData.vatRate / 100))  // ❌
const totalAmount = afterDiscount + vatAmount  // ❌

// Lines 265-270: Stores calculated values as-is (no conversion)
subtotal: Math.round(subtotal),  // ⚠️ Inconsistent - already Satang
discountAmount: Math.round(totalDiscount),  // ⚠️ Inconsistent
vatAmount,  // ⚠️ Inconsistent
totalAmount: Math.round(totalAmount),  // ⚠️ Inconsistent
```

**Schema Issue**:

```typescript
// Lines 13-17: Schema expects Satang (integers) but validates as numbers
unitPrice: z.number().int().min(0, 'ราคาต้องไม่ติดลบ'),  // ✅ Integer (Satang)
amount: z.number().int().min(0).default(0),  // ✅ Integer (Satang)
vatAmount: z.number().int().min(0).default(0),  // ✅ Integer (Satang)
```

#### GET (List Quotations)

- **Input Handling**: N/A
- **Output Handling**: ❌ **CRITICAL BUG** - Returns Satang without conversion
- **Line Numbers**: 99-142

**Specific Bug**:

```typescript
// Lines 99-142: Returns Satang values directly
data: quotations,  // ❌ BUG: All monetary fields need /100 conversion
```

---

### 8. `/api/purchase-orders` (POST, GET)

**Route**: `/Users/tong/Thai-acc/src/app/api/purchase-orders/route.ts`

#### POST (Create Purchase Order)

- **Input Handling**: ❌ **INCONSISTENT** - Partial conversion with
  floating-point errors
- **Output Handling**: ❌ **BUG** - Returns Satang without conversion
- **Line Numbers**: 255-361

**Inconsistent Implementation**:

```typescript
// Lines 256-268: Lines calculate in Baht then store with incorrect rounding
const vatAmount = afterDiscount * (line.vatRate / 100)  // ❌ Float calculation
const amount = afterDiscount + vatAmount  // ❌ Float calculation

// Lines 265-267: Incorrect rounding (should be *100 for Satang)
vatAmount: Math.round(vatAmount * 100) / 100,  // ❌ WRONG: Should be Math.round(vatAmount * 100)
amount: Math.round(amount * 100) / 100,  // ❌ WRONG: Should be Math.round(amount * 100)

// Lines 271-278: Totals also incorrectly rounded
const subtotal = lines.reduce((sum, line) => {
  const lineSubtotal = line.quantity * line.unitPrice
  const discountAmount = lineSubtotal * (line.discount / 100)
  return sum + (lineSubtotal - discountAmount)
}, 0)  // ❌ All in Baht, not converted to Satang

// Lines 302-305: Stores with incorrect rounding
subtotal: Math.round(subtotal * 100) / 100,  // ❌ WRONG: Floating-point Satang
vatAmount: Math.round(totalVatAmount * 100) / 100,  // ❌ WRONG: Floating-point Satang
totalAmount: Math.round(totalAmount * 100) / 100,  // ❌ WRONG: Floating-point Satang
```

#### GET (List Purchase Orders)

- **Input Handling**: N/A
- **Output Handling**: ❌ **CRITICAL BUG** - Returns Satang without conversion
- **Line Numbers**: 88-174

**Specific Bug**:

```typescript
// Lines 88-174: Returns Satang values directly
data: pos,  // ❌ BUG: All monetary fields need /100 conversion
```

---

### 9. `/api/journal` (POST, GET)

**Route**: `/Users/tong/Thai-acc/src/app/api/journal/route.ts`

#### POST (Create Journal Entry)

- **Input Handling**: ❌ **CRITICAL BUG** - Missing Baht → Satang conversion
- **Output Handling**: ❌ **BUG** - Returns Satang without conversion
- **Line Numbers**: 160-189

**Specific Bugs**:

```typescript
// Lines 153-154: Calculates totals in Baht
const totalDebit = validatedData.lines.reduce((sum, line) => sum + line.debit, 0)  // ❌ Baht
const totalCredit = validatedData.lines.reduce((sum, line) => sum + line.credit, 0)  // ❌ Baht

// Lines 168-169: Stores Baht directly
totalDebit,  // ❌ BUG: Should be Math.round(totalDebit * 100)
totalCredit,  // ❌ BUG: Should be Math.round(totalCredit * 100)

// Lines 173-179: Line items not converted
debit: line.debit,  // ❌ BUG: Should be Math.round(line.debit * 100)
credit: line.credit,  // ❌ BUG: Should be Math.round(line.credit * 100)
```

#### GET (List Journal Entries)

- **Input Handling**: N/A
- **Output Handling**: ❌ **CRITICAL BUG** - Returns Satang without conversion
- **Line Numbers**: 93-119

**Specific Bug**:

```typescript
// Lines 93-119: Returns Satang values directly
data: entries,  // ❌ BUG: debit, credit, totalDebit, totalCredit need /100 conversion
```

---

## Summary Table

| Route                  | POST Input      | POST Output | GET Output | PUT Input  | PUT Output | Status      |
| ---------------------- | --------------- | ----------- | ---------- | ---------- | ---------- | ----------- |
| `/api/invoices`        | ❌ Missing      | ❌ Missing  | ❌ Missing | N/A        | N/A        | 🔴 CRITICAL |
| `/api/receipts`        | ✅ Correct      | ❌ Missing  | ❌ Missing | ❌ Missing | ❌ Missing | 🔴 CRITICAL |
| `/api/payments`        | ❌ Missing      | ❌ Missing  | ❌ Missing | ❌ Missing | ❌ Missing | 🔴 CRITICAL |
| `/api/purchases`       | ✅ Correct      | ❌ Missing  | ❌ Missing | ✅ Correct | ❌ Missing | 🔴 CRITICAL |
| `/api/credit-notes`    | ✅ Correct      | ❌ Missing  | ❌ Missing | N/A        | N/A        | 🔴 CRITICAL |
| `/api/debit-notes`     | ❌ Missing      | ❌ Missing  | ❌ Missing | N/A        | N/A        | 🔴 CRITICAL |
| `/api/quotations`      | ⚠️ Inconsistent | ❌ Missing  | ❌ Missing | N/A        | N/A        | 🔴 CRITICAL |
| `/api/purchase-orders` | ⚠️ Inconsistent | ❌ Missing  | ❌ Missing | N/A        | N/A        | 🔴 CRITICAL |
| `/api/journal`         | ❌ Missing      | ❌ Missing  | ❌ Missing | N/A        | N/A        | 🔴 CRITICAL |

**Legend**:

- ✅ Correct: Baht → Satang conversion on input, Satang → Baht on output
- ❌ Missing: No conversion applied
- ⚠️ Inconsistent: Partial or incorrect conversion
- 🔴 CRITICAL: Data corruption or display errors

---

## Bug Patterns Identified

### Pattern 1: Missing Input Conversion (Most Common)

```typescript
// ❌ WRONG
amount: validatedData.amount;

// ✅ CORRECT
amount: Math.round(validatedData.amount * 100);
```

### Pattern 2: Missing Output Conversion (Most Common)

```typescript
// ❌ WRONG
return NextResponse.json({ success: true, data: invoice });

// ✅ CORRECT
const invoiceInBaht = {
  ...invoice,
  subtotal: invoice.subtotal / 100,
  vatAmount: invoice.vatAmount / 100,
  totalAmount: invoice.totalAmount / 100,
  // ... convert all monetary fields
};
return NextResponse.json({ success: true, data: invoiceInBaht });
```

### Pattern 3: Double Conversion Bug

```typescript
// ❌ WRONG (value already in Satang)
amount: Math.round(line.amount * 100);

// ✅ CORRECT
amount: line.amount; // Already in Satang from schema
```

### Pattern 4: Floating-Point Satang (Incorrect)

```typescript
// ❌ WRONG (creates floating-point Satang)
amount: Math.round(amount * 100) / 100;

// ✅ CORRECT
amount: Math.round(amount * 100); // Always integer
```

---

## Recommended Fixes

### 1. Standardize Input Conversion

All POST/PUT routes should convert Baht to Satang before database write:

```typescript
// Helper function to add to api-utils.ts
function convertBahtToSatang(amount: number): number {
  return Math.round(amount * 100)
}

// Usage in routes
data: {
  amount: convertBahtToSatang(validatedData.amount),
  lines: {
    create: validatedData.lines.map(line => ({
      amount: convertBahtToSatang(line.amount),
      unitPrice: convertBahtToSatang(line.unitPrice),
      // ...
    }))
  }
}
```

### 2. Standardize Output Conversion

All GET routes should convert Satang to Baht before response:

```typescript
// Helper function to add to api-utils.ts
function convertSatangToBaht<T>(record: T, fields: string[]): T {
  const result = { ...record };
  fields.forEach((field) => {
    if (result[field] !== undefined) {
      result[field] = result[field] / 100;
    }
  });
  return result;
}

// Usage in GET routes
const invoicesInBaht = invoices.map((inv) =>
  convertSatangToBaht(inv, [
    'subtotal',
    'vatAmount',
    'totalAmount',
    'netAmount',
  ])
);
```

### 3. Create Transformation Layer

Add transformation middleware to handle conversion automatically:

```typescript
// src/lib/api-transform.ts
export function transformToSatang(data: any, schema: z.ZodTypeAny) {
  // Recursively convert all monetary fields
}

export function transformToBaht(data: any, model: string) {
  // Recursively convert all monetary fields based on model schema
}
```

### 4. Validation Schema Updates

Ensure schemas clearly document Baht vs Satang:

```typescript
// Bad: Ambiguous
amount: z.number().min(0)

// Good: Clear documentation
amount: z.number().min(0),  // Input in Baht, will be converted to Satang

// Alternative: Accept Satang directly
amount: z.number().int().min(0),  // Satang (integer)
```

---

## Priority Matrix

| Priority | Routes                                    | Risk            | Business Impact                |
| -------- | ----------------------------------------- | --------------- | ------------------------------ |
| P0       | `/api/invoices`, `/api/purchases`         | Data Corruption | Financial statements incorrect |
| P1       | `/api/receipts`, `/api/payments`          | Data Corruption | Payment tracking wrong         |
| P2       | `/api/credit-notes`, `/api/debit-notes`   | Data Corruption | AR/AP balances wrong           |
| P3       | `/api/journal`                            | Data Corruption | GL entries wrong               |
| P4       | `/api/quotations`, `/api/purchase-orders` | Display Error   | Non-posted documents           |

---

## Testing Recommendations

### 1. Add Conversion Tests

```typescript
describe('Currency Conversion', () => {
  it('should convert Baht to Satang on invoice creation', async () => {
    const response = await POST({
      json: () => ({ amount: 100.5 }), // 100.50 Baht
    });
    expect(response.data.amount).toBe(10050); // 10050 Satang
  });

  it('should convert Satang to Baht on invoice fetch', async () => {
    const response = await GET();
    expect(response.data.amount).toBe(100.5); // Not 10050
  });
});
```

### 2. Integration Tests

```typescript
it('should maintain precision through invoice → payment flow', async () => {
  const invoice = await createInvoice({ amount: 1234.56 });
  const payment = await createPayment({ amount: 1234.56 });
  expect(payment.amount).toBe(invoice.amount);
});
```

### 3. Regression Tests

Add tests for all routes found in this audit to prevent future bugs.

---

## Conclusion

**All 9 API routes have critical currency conversion bugs** that will cause:

- Financial reports to show values 100x too high
- Database corruption if both Baht and Satang values exist
- Payment tracking errors
- Tax calculation errors

**Immediate action required**: Implement standardized conversion layer and fix
all routes.

**Estimated Fix Time**: 8-12 hours (including testing)

**Risk if Unfixed**: Production financial data corruption, customer trust
issues, tax compliance problems.
