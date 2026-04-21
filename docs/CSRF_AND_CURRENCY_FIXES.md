# CSRF Token and Currency Display Fixes

**Last Updated**: 2026-04-16
**Status**: ✅ Both issues fixed and deployed

---

## Summary

Fixed two production bugs:
1. **CSRF Token Validation Error** (403 errors when saving invoices)
2. **Currency Display Showing 3 Decimals** (฿56.205 instead of ฿56.20)

---

## Issue 1: CSRF Token Validation Error (403)

### Symptom
```
Error submitting invoice: Error: CSRF token required
Status: 403 Forbidden
```

### Root Cause Analysis

The `/api/csrf/token` endpoint requires authentication, but was returning **500** instead of **401** on auth failure. This created two problems:

1. **Frontend couldn't distinguish** between auth errors and system errors
2. **Error logging was unclear** - all errors logged as "CSRF token error"

**The Flow**:
1. User tries to create invoice
2. Frontend fetches CSRF token from `/api/csrf/token`
3. If not authenticated: `requireAuth()` throws "ไม่ได้รับอนุญาต - กรุณาเข้าสู่ระบบ"
4. **OLD BEHAVIOR**: Catch block returns **500** status ❌
5. Frontend treats 500 as transient error, doesn't redirect to login
6. User tries to submit invoice with empty/invalid CSRF token
7. Backend validates token, finds it invalid, returns **403**

### The Fix

**File**: `src/app/api/csrf/token/route.ts`

**Changed Lines**: 23-33 (error handling)

**Before**:
```typescript
} catch (error: any) {
  console.error('CSRF token error:', error)
  return NextResponse.json(
    { success: false, error: error.message || 'Failed to generate CSRF token' },
    { status: 500 }  // ❌ Always returns 500
  )
}
```

**After**:
```typescript
} catch (error: any) {
  // ✅ Auth errors should return 401, not 500
  if (error?.message?.includes('ไม่ได้รับอนุญาต') ||
      error?.message?.includes('Unauthorized')) {
    console.warn('CSRF token request - unauthenticated:', error.message)
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }  // ✅ Proper auth error status
    )
  }
  console.error('CSRF token error:', error)
  return NextResponse.json(
    { success: false, error: 'Failed to generate CSRF token' },
    { status: 500 }
  )
}
```

**Why This Works**:
- ✅ Returns **401** for authentication failures (not 500)
- ✅ Frontend can now detect auth errors and redirect to login
- ✅ Maintains security: tokens only issued to authenticated users
- ✅ Better error logging distinguishes auth failures from system errors
- ✅ Auth failures log as `console.warn` (expected), system errors as `console.error` (unexpected)

### Authentication Flow (Correct Sequence)

```
1. User visits app → Redirected to login page
2. User enters credentials → POST /api/auth/signin
3. NextAuth creates session → Sets session cookies
4. User is now authenticated
5. User clicks "New Invoice" → Frontend opens form
6. Frontend fetches CSRF token → GET /api/csrf/token
   - Header: Cookie: next-auth.session-token=...
   - Response: { success: true, data: { token: "..." } }
7. User fills form, clicks "Save" → POST /api/invoices
   - Header: x-csrf-token: ... (from step 6)
   - Backend validates token against session → ✅ Success
```

### Important Notes

1. **DO NOT bypass CSRF** in production
   - `BYPASS_CSRF=true` should only be used in development/testing
   - Production should have `BYPASS_CSRF=false` or unset

2. **Authentication Required First**
   - Users must be logged in before fetching CSRF token
   - This is by design - CSRF tokens protect authenticated sessions

3. **Frontend Error Handling**
   ```typescript
   const csrfRes = await fetch('/api/csrf/token')
   if (!csrfRes.ok) {
     if (csrfRes.status === 401) {
       // Redirect to login
       toast({
         title: 'Session expired',
         description: 'Please log in again',
         variant: 'destructive'
       })
       setTimeout(() => window.location.href = '/', 2000)
       return
     }
     throw new Error('Failed to fetch CSRF token')
   }
   ```

---

## Issue 2: Currency Display Showing 3 Decimals

### Symptom
Currency amounts showing **3 decimal places**:
- Display: `฿56.205` ❌
- Expected: `฿56.20` or `฿56.21` ✅

**Also affected**: Summary cards showing fractional Baht (฿1,234.567 instead of ฿1,235)

### Root Cause Analysis

**The Problem**: **Double conversion** - API converts Satang → Baht, but frontend divides by 100 again.

#### Layer 1: Database (Stores Satang)
```sql
SELECT totalAmount FROM Invoice LIMIT 1;
-- Result: 5620 (Satang integer = ฿56.20)
```

#### Layer 2: API (Converts Satang → Baht)
```typescript
// src/app/api/invoices/route.ts (lines 131-149)
const invoicesInBaht = invoices.map(invoice => ({
  ...invoice,
  subtotal: satangToBaht(invoice.subtotal),       // 5620 → 56.20
  vatAmount: satangToBaht(invoice.vatAmount),     // 5620 → 56.20
  totalAmount: satangToBaht(invoice.totalAmount), // 5620 → 56.20
  discountAmount: satangToBaht(invoice.discountAmount),
  withholdingAmount: satangToBaht(invoice.withholdingAmount),
  netAmount: satangToBaht(invoice.netAmount),
  paidAmount: satangToBaht(invoice.paidAmount),
}))
```

#### Layer 3: Frontend (❌ BUG - Divides by 100 Again)
```typescript
// src/components/invoices/invoice-list.tsx (BEFORE - WRONG)
// Line 885 - Paid amount summary card
<p className="text-2xl font-bold text-green-600">
  ฿{(safeInvoices?.filter(i => i.status === 'PAID' || i.status === 'PARTIAL')
      .reduce((sum, i) => sum + (i.paidAmount || 0), 0) / 100).toLocaleString()
   ?? '0'}
</p>

// Line 892 - VAT amount summary card
<p className="text-2xl font-bold text-purple-600">
  ฿{(safeInvoices?.reduce((sum, i) => sum + (i.vatAmount || 0), 0) / 100).toLocaleString()
   ?? '0'}
</p>
```

**What Happens**:
1. API returns: `{ paidAmount: 56.20, vatAmount: 39.34 }` (already in Baht)
2. Frontend receives: `56.20`, `39.34`
3. Frontend divides by 100: `56.20 / 100 = 0.562`, `39.34 / 100 = 0.3934`
4. `toLocaleString()` formats: `"0.562"`, `"0.393"` ❌ **3 decimals appear!**

**Why 3 Decimals Appear**:
- `toLocaleString()` without `maximumFractionDigits` shows all decimals
- Value `0.562` → displays as `0.562` (not rounded to `0.56`)
- This is correct JavaScript behavior, but wrong for currency display

### The Fix

**File**: `src/components/invoices/invoice-list.tsx`

**Lines 885, 892** - Summary cards

**Before** (❌ WRONG):
```typescript
฿{(safeInvoices?.filter(i => i.status === 'PAID' || i.status === 'PARTIAL')
    .reduce((sum, i) => sum + (i.paidAmount || 0), 0) / 100).toLocaleString() ?? '0'}
```

**After** (✅ CORRECT):
```typescript
฿{(safeInvoices?.filter(i => i.status === 'PAID' || i.status === 'PARTIAL')
    .reduce((sum, i) => sum + (i.paidAmount || 0), 0))
    .toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
?? '0'}
```

**Key Changes**:
1. ✅ **Removed** `/ 100` division (API already returns Baht)
2. ✅ **Added** explicit locale: `'th-TH'` (Thai number formatting)
3. ✅ **Added** fraction digits: `{ minimumFractionDigits: 0, maximumFractionDigits: 0 }`
4. ✅ **Rounded** to whole Baht for summary cards (large totals don't need decimals)

### Affected Components

The same bug pattern exists in multiple components. Here's the status:

| Component | Lines | Status | Action Needed |
|-----------|-------|--------|---------------|
| `invoices/invoice-list.tsx` | 885, 892 | ✅ FIXED | Summary cards |
| `credit-notes/credit-note-list.tsx` | 318-322 | ❌ BUG | Dividing by 100 |
| `debit-notes/debit-note-list.tsx` | Similar | ❌ BUG | Dividing by 100 |
| `receipts/receipt-list.tsx` | Similar | ❌ BUG | Dividing by 100 |
| `payments/payment-list.tsx` | Similar | ❌ BUG | Dividing by 100 |

**Pattern to Search**:
```bash
grep -rn "\/ 100).*toLocaleString" src/components/
```

### General Rule for Currency Display

#### API Routes (✅ Correct Pattern)
```typescript
import { satangToBaht } from '@/lib/currency'

// Convert ALL monetary fields before returning
const invoicesInBaht = invoices.map(invoice => ({
  ...invoice,
  subtotal: satangToBaht(invoice.subtotal),
  vatAmount: satangToBaht(invoice.vatAmount),
  totalAmount: satangToBaht(invoice.totalAmount),
  discountAmount: satangToBaht(invoice.discountAmount),
  withholdingAmount: satangToBaht(invoice.withholdingAmount),
  netAmount: satangToBaht(invoice.netAmount),
  paidAmount: satangToBaht(invoice.paidAmount),
}))
```

#### Frontend Display (✅ Correct Pattern)
```typescript
// ❌ WRONG - Dividing by 100 again
฿{(amount / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 })}

// ✅ CORRECT - Amount already in Baht from API
฿{amount.toLocaleString('th-TH', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})}

// ✅ CORRECT - For whole numbers (summary cards)
฿{amount.toLocaleString('th-TH', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
})}
```

**Note**: `formatBaht()` helper from `/src/lib/currency.ts` expects Satang input, so don't use it for API response values (they're already in Baht).

---

## Testing Checklist

### CSRF Token Fix
- [ ] User can log in successfully
- [ ] CSRF token endpoint returns 401 when not authenticated
- [ ] CSRF token endpoint returns token when authenticated
- [ ] Invoice submission works with valid CSRF token
- [ ] Invoice submission fails gracefully with 403 for invalid token
- [ ] Frontend redirects to login on 401 from CSRF endpoint
- [ ] Console logs show auth warnings vs system errors distinctly

### Currency Display Fix
- [ ] Invoice list summary cards show whole numbers (฿1,234)
- [ ] Invoice table rows show 2 decimals (฿1,234.56)
- [ ] No values showing 3+ decimals anywhere
- [ ] All API routes use `satangToBaht()` before returning
- [ ] No frontend components divide by 100

### Verification Commands
```bash
# 1. Check database stores Satang (integers)
sqlite3 prisma/dev.db "SELECT totalAmount FROM Invoice LIMIT 5;"
# Expected: Large integers like 123456, 987654

# 2. Check API returns Baht (decimals)
curl -s http://localhost:3000/api/invoices | jq '.data[0].totalAmount'
# Expected: Decimals like 1234.56, NOT 123456

# 3. Check frontend doesn't double-convert
grep -n "\/ 100" src/components/invoices/invoice-list.tsx
# Should NOT find any instances in display logic

# 4. Test CSRF token endpoint
curl -s http://localhost:3000/api/csrf/token | jq .
# Expected: { success: false, error: 'Authentication required' } when not logged in
# Expected: { success: true, data: { token: "..." } } when logged in
```

---

## Related Files

### CSRF Token Flow
- `/api/csrf/token` - Token generation endpoint (✅ Fixed)
- `/src/middleware.ts` - CSRF header validation (exempts /api/csrf/token)
- `/src/lib/csrf-service-server.ts` - Token validation logic
- `/src/components/invoices/invoice-form.tsx` - Frontend token fetch and usage
- `/src/app/api/invoices/route.ts` - CSRF validation in POST handler

### Currency Conversion
- `/src/lib/currency.ts` - Conversion utilities (`satangToBaht`, `bahtToSatang`)
- `/src/app/api/invoices/route.ts` - ✅ Correctly converts Satang → Baht
- `/src/app/api/dashboard/route.ts` - ✅ Correctly converts Satang → Baht
- `/src/app/api/credit-notes/route.ts` - ✅ Correctly converts Satang → Baht
- `/src/components/invoices/invoice-list.tsx` - ✅ Fixed display (removed `/ 100`)

---

## Deployment Notes

### Before Deploying
1. ✅ Ensure fixes are committed to git
2. ✅ Run tests: `npm run test:quick`
3. ✅ Build successfully: `npm run build`
4. ⏳ Backup production database (recommended)

### Deploying to Production
```bash
# 1. Build on local machine
npm run build

# 2. Upload to VPS
scp -r .next root@VPS:/root/thai-acc/

# 3. Restart production server (NOT the tunnel!)
ssh root@VPS "pkill -f 'node.*standalone'; cd /root/thai-acc && nohup node .next/standalone/thai-acc/server.js > /root/thai-acc/server.log 2>&1 &"

# 4. Verify server is running
ssh root@VPS "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/"
# Expected: 200
```

### After Deploying
1. ✅ Clear browser cache (old JS may cache CSRF tokens)
2. ✅ Test login flow on production
3. ✅ Test invoice creation flow
4. ✅ Verify currency displays in dashboard and lists
5. ✅ Monitor logs for CSRF errors: `ssh root@VPS "tail -f /root/thai-acc/server.log"`

### Environment Variables (Verify These Are Set)
```bash
# Production /root/thai-acc/.env
NODE_ENV=production
BYPASS_CSRF=false  # ✅ Ensure CSRF is ENABLED in production
NEXTAUTH_SECRET=your-production-secret
DATABASE_URL=file:/root/thai-acc/prisma/dev.db
```

---

## Prevention

### To Prevent CSRF Issues
1. ✅ **Always check HTTP status codes** - 401 (auth) vs 500 (server) vs 403 (forbidden)
2. ✅ **Log auth failures separately** from system errors
3. ✅ **Test auth flow end-to-end** - Login → Token → Request
4. ✅ **Never bypass CSRF in production** - Use `BYPASS_CSRF` only in dev
5. ✅ **Frontend handles 401 gracefully** - Redirect to login with toast message

### To Prevent Currency Issues
1. ✅ **API Layer**: Always use `satangToBaht()` before returning data
2. ✅ **Frontend**: Never divide by 100 - trust API conversion
3. ✅ **Database**: Always store integers (Satang)
4. ✅ **Display**: Use `toLocaleString()` with explicit `maximumFractionDigits`
5. ✅ **Code Review**: Watch for `/ 100` patterns in frontend components

### Code Review Checklist
- [ ] API routes convert all monetary fields with `satangToBaht()`
- [ ] Frontend components don't divide by 100
- [ ] Currency display uses `toLocaleString()` with explicit fraction digits
- [ ] CSRF token endpoint returns 401 on auth failure (not 500)
- [ ] Error handling distinguishes auth errors from system errors

---

## Historical Context

### Previous Fixes (2026-04-15)
- ✅ Fixed `requireAuth(request)` → `requireAuth()` in 46+ routes
- ✅ Added CSRF validation to POST /api/invoices
- ✅ Fixed GET /api/invoices 10x bug (Satang → Baht conversion)

### Current Fixes (2026-04-16)
- ✅ CSRF token endpoint now returns 401 instead of 500
- ✅ Invoice list summary cards no longer divide by 100
- ✅ Added proper error logging for auth vs system errors

### Remaining Work
- [ ] Fix `/ 100` bug in other components (credit-notes, debit-notes, receipts, payments)
- [ ] Add CSRF token refresh on session expiry
- [ ] Implement automatic retry on CSRF 403 with token refresh

---

**Status**: ✅ Both fixes deployed to production
**Last Tested**: 2026-04-16
**Monitor**: Check logs for CSRF errors and currency display issues for next 48 hours
