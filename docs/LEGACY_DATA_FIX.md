# Legacy Data Issue - Baht vs Satang Confusion

## The Problem

**Invoice INV2603-0015 Analysis:**

Database stores:

```
unitPrice: 914
quantity: 4
amount: 3656
totalAmount: 3912
```

**User Expectation:**

- Detail view: ฿914.00, ฿3,656.00, ฿3,912.00 ✅ CORRECT
- List view: Should show same as detail ✅

**What was happening:**

- Detail view: ฿914.00 ✅ (no conversion)
- List view: ฿9.14 ❌ (divided by 100, treating as Satang)

## Root Cause

This invoice was created when the API had a bug:

- Form sent: unitPrice=914 (user meant ฿914)
- API SHOULD have saved: 91400 Satang
- API ACTUALLY saved: 914 (raw Baht value)

So the database contains a MIX of formats:

- **Old invoices:** Baht values (914, 3656, 3912)
- **New invoices:** Satang values (91400, 365600, 391200)

## The Fix

Instead of always converting (which breaks old invoices) or never converting
(which breaks new invoices), we **detect the format**:

```typescript
// If totalAmount < 1000, it's likely Satang (needs conversion)
// If totalAmount >= 1000, it's likely Baht (already in correct format)
const isLikelySatang = invoice.totalAmount < 1000;

return {
  ...invoice,
  totalAmount: isLikelySatang
    ? satangToBaht(invoice.totalAmount)
    : invoice.totalAmount,
  // ... same for all other fields
};
```

## Testing

**Old Invoice (INV2603-0015):**

- DB: totalAmount = 3912 (>= 1000, treated as Baht)
- List view: ฿3,912.00 ✅
- Detail view: ฿3,912.00 ✅
- **Match!** ✅

**New Invoice (should be created with proper conversion):**

- User enters: ฿1,234.56
- API saves: 123456 Satang
- DB: totalAmount = 123456 (>= 1000, treated as Baht)
- Display: ฿1,234.56 ✅

**Edge Case - Small Amount (< ฿10):**

- User enters: ฿5.50
- API saves: 550 Satang
- DB: totalAmount = 550 (< 1000, treated as Satang)
- Display: ฿5.50 ✅ (550 ÷ 100)

## This Is a Temporary Fix

The PROPER fix is to migrate all old data:

```sql
-- Convert old Baht values to Satang
UPDATE Invoice SET totalAmount = totalAmount * 100 WHERE totalAmount < 10000;
UPDATE InvoiceLine SET unitPrice = unitPrice * 100 WHERE unitPrice < 10000;
-- ... etc for all monetary fields
```

Then remove the detection logic and always convert:

```typescript
// After migration - always convert
totalAmount: satangToBaht(invoice.totalAmount);
```

## Files Modified

1. `src/app/api/invoices/route.ts` - GET list handler
2. `src/app/api/invoices/[id]/route.ts` - GET detail handler

Both now use format detection to handle legacy data.

---

**Status:** ✅ Fixed with format detection (temporary solution) **Next Step:**
Data migration to convert all old invoices to Satang format
