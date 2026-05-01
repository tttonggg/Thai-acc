# Currency Bug Analysis - INV2603-0015 Case Study

## The Problem

Invoice INV2603-0015 shows different amounts in different views:

- **List table:** ฿39.12
- **Detail view:** ฿3,912.00

## Database Reality (Satang)

```sql
SELECT invoiceNo, subtotal, totalAmount, netAmount FROM Invoice WHERE invoiceNo = 'INV2603-0015';
```

**Result:** `INV2603-0015 | 3656 | 3912 | 3912`

Database stores **Satang** (integers):

- subtotal: 3656 Satang
- totalAmount: 3912 Satang
- netAmount: 3912 Satang

## Correct Display (Baht)

Should be: 3912 Satang ÷ 100 = **฿39.12**

## Current Bug Status

### ✅ List View - CORRECT

- GET `/api/invoices` includes `satangToBaht()` conversion (lines 130-147)
- Shows: ฿39.12 ✅
- Formula: `satangToBaht(3912) = 39.12`

### ❌ Detail View - WRONG (100x bug)

- GET `/api/invoices/[id]` does NOT convert
- Returns Satang directly to frontend
- Shows: ฿3,912.00 ❌ (should be ฿39.12)
- **Root Cause:** Missing `satangToBaht()` conversion

## The Fix

### Option 1: Fix API (RECOMMENDED)

Add `satangToBaht()` conversion to `/api/invoices/[id]/route.ts`:

```typescript
import { satangToBaht } from '@/lib/currency';

// In GET handler:
const invoiceInBaht = {
  ...invoice,
  subtotal: satangToBaht(invoice.subtotal),
  vatAmount: satangToBaht(invoice.vatAmount),
  totalAmount: satangToBaht(invoice.totalAmount),
  discountAmount: satangToBaht(invoice.discountAmount),
  withholdingAmount: satangToBaht(invoice.withholdingAmount),
  netAmount: satangToBaht(invoice.netAmount),
  paidAmount: satangToBaht(invoice.paidAmount),
  lines: invoice.lines.map((line) => ({
    ...line,
    unitPrice: satangToBaht(line.unitPrice),
    discount: satangToBaht(line.discount),
    amount: satangToBaht(line.amount),
    vatAmount: satangToBaht(line.vatAmount),
  })),
};

return apiResponse(invoiceInBaht);
```

### Option 2: Fix Frontend (NOT RECOMMENDED)

Make frontend divide by 100. This is wrong because:

- Frontend shouldn't know about Satang
- Breaks abstraction layer
- List view works, detail view doesn't = inconsistent API design

## Other Routes With Same Bug

Need to check if these routes also convert Satang→Baht:

- `/api/receipts/[id]/route.ts`
- `/api/payments/[id]/route.ts`
- `/api/purchases/[id]/route.ts`
- `/api/credit-notes/[id]/route.ts`
- `/api/debit-notes/[id]/route.ts`

## Test Plan

1. ✅ List view shows ฿39.12 (CORRECT)
2. ❌ Detail view should show ฿39.12 (currently shows ฿3,912.00)
3. After fix: Both views show same amount

## Verification

```bash
# Check database
sqlite3 prisma/dev.db "SELECT totalAmount FROM Invoice WHERE invoiceNo = 'INV2603-0015';"
# Result: 3912 (Satang)

# Expected display: ฿39.12 (3912 ÷ 100)
```

---

**Status:** 🔴 Bug identified, fix ready to apply **Next Step:** Add
`satangToBaht()` conversion to detail view routes
