# 🔴 Thai VAT Rounding & Decimal Display Issues

## Issues Found

### Issue 1: 3 Decimal Places Display

**Shows:** `฿33.277` (WRONG)  
**Should show:** `฿33.28` (2 decimals only)

### Issue 2: Thai VAT Rounding Compliance

**Question:** Should rounding happen at each step or only final?

**Answer:** Thai Revenue Department regulations:

- ✅ Maintain FULL precision during ALL calculations
- ✅ Round ONLY at final display stage
- ✅ Use standard rounding (0.005 → 0.01)
- ❌ NEVER round intermediate VAT calculations

---

## Root Cause Analysis

The issue is NOT in the display formatting (which is correct):

```typescript
{ minimumFractionDigits: 2, maximumFractionDigits: 2 }  // ✅ Correct
```

The issue is the **API is returning WRONG VALUES**:

- Database stores: `33277` (Satang)
- API should return: `332.77` (Baht)
- API probably returns: `33277` directly (not converted) ❌

Or:

- Database has: `33277` (already wrong, should be `332770`)

---

## Thai VAT Compliance Rules

### ✅ CORRECT (Thai Law Compliant)

```typescript
// Step 1: Calculate with FULL precision
const subtotal = 1234.567; // Keep all decimals
const vatRate = 0.07;

// Step 2: VAT calculation (NO ROUNDING)
const vatAmount = subtotal * vatRate; // 86.41969 (keep full precision)

// Step 3: Total (NO ROUNDING)
const total = subtotal + vatAmount; // 1320.98669 (keep full precision)

// Step 4: Convert to Satang for storage (ROUND HERE)
const totalInSatang = Math.round(total * 100); // 132099

// Step 5: Display (ROUND HERE TOO)
const display = Math.round(total * 100) / 100; // 1320.99
```

### ❌ WRONG (Violates Thai Law)

```typescript
// WRONG: Rounding at each step
const subtotal = 1234.567;
const vatAmount = Math.round(subtotal * 0.07 * 100) / 100; // 86.42 (WRONG!)
const total = Math.round((subtotal + vatAmount) * 100) / 100; // 1320.99 (WRONG!)
```

---

## Current Implementation Check

### Database Schema (Correct ✅)

```prisma
model Invoice {
  totalAmount Int @default(0)  // Satang as integer
  vatAmount Int @default(0)     // Satang as integer
  subtotal Int @default(0)      // Satang as integer
}
```

### API Conversion (Need to verify)

```typescript
// POST - Should do this:
totalAmount: bahtToSatang(total); // 1320.99 × 100 = 132099 ✅

// GET - Should do this:
totalAmount: satangToBaht(invoice.totalAmount); // 132099 ÷ 100 = 1320.99 ✅
```

### Display Formatting (Already correct ✅)

```typescript
toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
// This will always show 2 decimals
```

---

## The Fix

### Step 1: Check Database Values

```bash
# Check if values are in Satang (should be >= 1000 for realistic amounts)
sqlite3 prisma/dev.db "SELECT totalAmount FROM Invoice LIMIT 5;"

# If you see small numbers like 33277, the API is not converting
# If you see large numbers like 332770, it's correct
```

### Step 2: Verify API Routes

All GET routes must use `satangToBaht()`:

```typescript
// /api/dashboard/route.ts
revenue: {
  amount: satangToBaht(sumTotal),  // ✅ Converts to Baht
}
```

### Step 3: Verify Display

All displays must use 2-decimal formatting:

```typescript
value: `฿${amount.toLocaleString('th-TH', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;
```

---

## Testing

1. **Create test invoice:** ฿1234.567
2. **Check database:** Should store `123457` (Satang)
3. **Check API:** Should return `1234.57`
4. **Check UI:** Should show `฿1,234.57`

---

**Status:** 🔴 Need to verify API routes are converting correctly
