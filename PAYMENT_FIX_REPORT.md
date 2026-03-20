# Payment Form Unpaid Invoices Fix - Root Cause Analysis

**Date:** March 19, 2026
**Issue:** Unpaid invoices not loading in payment form when vendor is selected
**Status:** ✅ FIXED

---

## Problem Description

When a user creates a new payment and selects a vendor (e.g., V002 - บริษัท โลจิสติกส์ไทย จำกัด), the unpaid invoices section shows "ไม่พบยอดค้างจ่าย" (No outstanding balance found), even though the database contains unpaid purchase invoices for that vendor.

**Database Verification:**
```sql
SELECT invoiceNo, totalAmount, paidAmount, status FROM PurchaseInvoice WHERE vendorId = 'cmmnqsfo0002i03ypge0zxns1';

-- Result:
-- PO202603-0001 | 292214 | 0 | ISSUED
-- PO202603-0002 | 269640 | 0 | ISSUED
-- Total: 561,854 THB unpaid
```

---

## Root Cause Analysis

### The Issue

The payment form frontend code was incorrectly parsing the API response structure.

**API Response Format** (`/api/payments/unpaid-invoices`):
```json
{
  "success": true,
  "data": {
    "invoices": [...],
    "totalAPBalance": 561854,
    "vendorId": "cmmnqsfo0002i03ypge0zxns1"
  }
}
```

**Frontend Code** (BEFORE FIX - `src/components/payments/payment-form.tsx:132-137`):
```typescript
const res = await fetch(`/api/payments/unpaid-invoices?vendorId=${selectedVendor}`)
if (res.ok) {
  const data = await res.json()
  setUnpaidInvoices(data.invoices || [])        // ❌ WRONG: Should be data.data.invoices
  setApBalance(data.totalAPBalance || 0)         // ❌ WRONG: Should be data.data.totalAPBalance
}
```

**Why This Failed:**
- `data.invoices` is `undefined` because the actual structure is `data.data.invoices`
- `data.totalAPBalance` is `undefined` because the actual structure is `data.data.totalAPBalance`
- Result: `unpaidInvoices` state becomes `[]`, showing "ไม่พบยอดค้างจ่าย"

---

## The Fix

**Updated Code** (`src/components/payments/payment-form.tsx:132-152`):
```typescript
const res = await fetch(`/api/payments/unpaid-invoices?vendorId=${selectedVendor}`)
if (res.ok) {
  const response = await res.json()
  // API returns { success: true, data: { invoices: [...], totalAPBalance: ..., vendorId: ... } }
  if (response.success && response.data) {
    setUnpaidInvoices(response.data.invoices || [])
    setApBalance(response.data.totalAPBalance || 0)
  } else {
    // Fallback for backward compatibility
    setUnpaidInvoices(response.invoices || [])
    setApBalance(response.totalAPBalance || 0)
  }
} else {
  console.error('API returned error:', res.status, res.statusText)
}
```

**Key Improvements:**
1. ✅ Correctly accesses `response.data.invoices` and `response.data.totalAPBalance`
2. ✅ Checks `response.success` before accessing data
3. ✅ Adds error logging for non-OK responses
4. ✅ Includes fallback for backward compatibility (in case API changes)

---

## API Inconsistency Discovery

During investigation, I discovered an **inconsistency** between two similar APIs:

### Receipts API (`/api/receipts/unpaid-invoices`)
```typescript
return NextResponse.json({
  success: true,
  data: invoicesWithBalance,  // Direct array
})
```
**Response:** `{ success: true, data: [...] }`

### Payments API (`/api/payments/unpaid-invoices`)
```typescript
return apiSuccess({
  invoices: unpaidInvoices,
  totalAPBalance,
  vendorId
})
```
**Response:** `{ success: true, data: { invoices: [], totalAPBalance: 0, vendorId: "" } }`

**Why Different?**
- Receipts API returns simple array (only unpaid invoices)
- Payments API returns object with invoices + total balance + vendor ID (more metadata)

**Recommendation:**
Keep the current structure as it provides useful metadata (total AP balance for the vendor).

---

## Testing Instructions

### Manual Testing
1. Go to Payments page (`/payments`)
2. Click "สร้างใบจ่ายเงินใหม่" (Create New Payment)
3. Select vendor "V002 - บริษัท โลจิสติกส์ไทย จำกัด"
4. **Expected:** See 2 unpaid invoices:
   - PO202603-0001: ฿292,214
   - PO202603-0002: ฿269,640
   - Total: ฿561,854
5. Enter payment amount (e.g., 500,000)
6. Click "จัดสรรอัตโนมัติ" (Auto Allocate)
7. **Expected:** Allocations automatically populate for both invoices

### Database Verification
```bash
sqlite3 prisma/dev.db "SELECT invoiceNo, totalAmount, paidAmount, status FROM PurchaseInvoice WHERE vendorId = 'cmmnqsfo0002i03ypge0zxns1'"
```

### API Verification (with authentication)
```bash
# Get session cookie first, then:
curl "http://localhost:3000/api/payments/unpaid-invoices?vendorId=cmmnqsfo0002i03ypge0zxns1" \
  -H "Cookie: <your-session-cookie>"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "invoices": [
      {
        "id": "...",
        "invoiceNo": "PO202603-0001",
        "invoiceDate": "2026-03-01T00:00:00.000Z",
        "dueDate": "...",
        "totalAmount": 292214,
        "paidAmount": 0,
        "status": "ISSUED",
        "balance": 292214,
        "canAllocate": true,
        "vendor": { ... }
      },
      {
        "id": "...",
        "invoiceNo": "PO202603-0002",
        "invoiceDate": "2026-03-15T00:00:00.000Z",
        "dueDate": "...",
        "totalAmount": 269640,
        "paidAmount": 0,
        "status": "ISSUED",
        "balance": 269640,
        "canAllocate": true,
        "vendor": { ... }
      }
    ],
    "totalAPBalance": 561854,
    "vendorId": "cmmnqsfo0002i03ypge0zxns1"
  }
}
```

---

## Files Modified

1. **`/Users/tong/Thai-acc/src/components/payments/payment-form.tsx`** (Lines 122-152)
   - Fixed API response parsing
   - Added proper error handling
   - Added backward compatibility fallback

---

## Additional Findings

### Receipt Form is Correct
The receipt form (`/src/components/receipts/receipt-form.tsx:178`) correctly accesses `data.data`:
```typescript
const data = await res.json()
setUnpaidInvoices(data.data || [])  // ✅ CORRECT
```

### Authentication Works
The API endpoint properly uses `requireAuth()` from `@/lib/api-auth` and returns 401 for unauthenticated requests:
```json
{
  "success": false,
  "error": "กรุณาเข้าสู่ระบบ"
}
```

---

## Impact Assessment

**Severity:** High (blocking payment workflow)
**User Impact:** Users cannot allocate payments to unpaid invoices
**Business Impact:** AP payments cannot be properly recorded, affecting vendor relationships and financial accuracy

**Affected Users:** All users who create payments (ADMIN, ACCOUNTANT roles)

---

## Prevention Measures

To prevent similar issues in the future:

1. **TypeScript Interfaces:** Define strict types for API responses
2. **API Documentation:** Document response formats in API route comments
3. **Unit Tests:** Add tests for API response parsing
4. **Integration Tests:** Add E2E tests for payment form workflow
5. **Code Review:** Look for response parsing patterns when reviewing PRs

**Suggested TypeScript Interface:**
```typescript
interface UnpaidInvoicesResponse {
  success: boolean
  data: {
    invoices: Array<{
      id: string
      invoiceNo: string
      invoiceDate: string
      totalAmount: number
      paidAmount: number
      balance: number
      canAllocate: boolean
    }>
    totalAPBalance: number
    vendorId: string
  }
}
```

---

## Conclusion

The issue was a **data structure mismatch** between the API response format and frontend parsing logic. The fix ensures proper access to nested data (`response.data.invoices` instead of `response.invoices`) and adds error handling for robustness.

**Status:** ✅ FIXED - Ready for testing

---

**Next Steps:**
1. Test the fix manually following the testing instructions above
2. Create E2E test for payment form workflow
3. Add TypeScript interfaces for API responses
4. Consider standardizing API response format across all endpoints
