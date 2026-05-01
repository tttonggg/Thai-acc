# 🔴 Database Reset Required - Mixed Baht/Satang Data Bug

**Date:** 2026-04-15 **Severity:** CRITICAL **Impact:** All monetary modules
display 100x wrong amounts

---

## The Problem

**Root Cause:** Database contains MIXED data formats:

- **Old invoices:** Stored Baht directly (e.g., 3912)
- **New code:** Expects Satang (e.g., 391200)

**Example - INV2603-0015:**

```
Database: totalAmount = 3912 (stored as Baht, not Satang)
Detail view: Shows ฿3,912.00 (no conversion, "correct" for old data)
List view: Shows ฿39.12 (÷100 conversion, "wrong" for old data)
```

**Why it happened:** Old code didn't use `bahtToSatang()` when saving. New code
uses `satangToBaht()` when loading.

---

## The Fix

### Step 1: Reset Database ✅

```bash
./scripts/reset-database-satang.sh
```

This script:

1. Deletes old database
2. Creates clean schema
3. Runs seed with CORRECT Satang format
4. Verifies all values are large integers (>= 100)

### Step 2: Removed Format Detection Hacks ✅

**Files Fixed:**

- `src/app/api/invoices/route.ts` - List view
- `src/app/api/invoices/[id]/route.ts` - Detail view

**Before (WRONG - format detection):**

```typescript
const isLikelySatang = invoice.totalAmount < 1000;
totalAmount: isLikelySatang
  ? satangToBaht(invoice.totalAmount)
  : invoice.totalAmount;
```

**After (CORRECT - always convert):**

```typescript
totalAmount: satangToBaht(invoice.totalAmount);
```

### Step 3: Updated CLAUDE.md ✅

Added CRITICAL section explaining Satang storage pattern with examples.

---

## Verification

### After Reset, Test This:

1. **Create invoice via UI:**
   - Unit price: ฿1,234.56
   - Quantity: 1
   - Total should be: ฿1,234.56

2. **Check database:**

   ```bash
   sqlite3 prisma/dev.db "SELECT totalAmount FROM Invoice ORDER BY createdAt DESC LIMIT 1;"
   ```

   **Expected:** `123456` (Satang) **Wrong:** `1234.56` (Baht)

3. **Check API response:**
   ```bash
   curl http://localhost:3000/api/invoices?limit=1
   ```
   **Expected:** `"totalAmount": 1234.56` **Wrong:** `"totalAmount": 123456`

---

## Affected Modules (ALL Must Follow Satang Pattern)

✅ Invoices - Fixed ✅ Receipts - Uses satangToBaht ✅ Payments - Uses
satangToBaht ✅ Purchase Invoices - Uses satangToBaht ✅ Purchase Orders - Uses
satangToBaht ✅ Quotations - Uses satangToBaht ✅ Credit Notes - Uses
satangToBaht ✅ Debit Notes - Uses satangToBaht

**All these modules follow the pattern:**

- POST: `bahtToSatang(userInput)` → Database
- GET: `satangToBaht(dbValue)` → Response

---

## Next Steps

1. ✅ Run database reset script
2. ⏳ Test invoice creation with decimal amounts
3. ⏳ Verify list and detail views match
4. ⏳ Test all 8 modules
5. ⏳ Run full E2E test suite

---

**Status:** 🟡 Ready for database reset **Files Modified:**

- CLAUDE.md (added CRITICAL Satang section)
- scripts/reset-database-satang.sh (new)
- src/app/api/invoices/route.ts (removed format detection)
- src/app/api/invoices/[id]/route.ts (removed format detection)
