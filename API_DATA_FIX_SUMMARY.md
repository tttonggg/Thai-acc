# API Data Transformation Fix

**Date**: March 19, 2026
**Issue**: "Invalid purchases data format" error and "Fetch failed" on multiple pages

---

## 🐛 Root Cause

API endpoints were returning **nested objects** (e.g., `vendor.name`) but frontend components expected **flattened fields** (e.g., `vendorName`).

### Example:
```javascript
// API returned:
{
  id: "...",
  vendor: { name: "บริษัท โลจิสติกส์ไทย จำกัด" }
}

// Frontend expected:
{
  id: "...",
  vendorName: "บริษัท โลจิสติกส์ไทย จำกัด"
}
```

---

## ✅ Fixed APIs

### 1. Purchase Invoices API
**File**: `/src/app/api/purchases/route.ts`

**Added transformation**:
```typescript
const transformedPurchases = purchases.map((purchase: any) => ({
  ...purchase,
  vendorName: purchase.vendor?.name || '',
  vendorCode: purchase.vendor?.code || '',
  vendorTaxId: purchase.vendor?.taxId || '',
  invoiceDate: purchase.invoiceDate.toISOString(),
  createdAt: purchase.createdAt.toISOString(),
  updatedAt: purchase.updatedAt.toISOString(),
}))
```

**Result**: ✅ 2 purchase invoices now display correctly

---

### 2. Debit Notes API
**File**: `/src/app/api/debit-notes/route.ts`

**Added transformation**:
```typescript
const transformedDebitNotes = debitNotes.map((dn: any) => ({
  ...dn,
  vendorName: dn.vendor?.name || '',
  vendorCode: dn.vendor?.code || '',
  vendorTaxId: dn.vendor?.taxId || '',
  debitNoteDate: dn.debitNoteDate.toISOString(),
  createdAt: dn.createdAt.toISOString(),
  updatedAt: dn.updatedAt.toISOString(),
}))
```

**Result**: ✅ 12 debit notes now display correctly

---

### 3. Credit Notes API
**File**: `/src/app/api/credit-notes/route.ts`

**Added transformation**:
```typescript
const transformedCreditNotes = creditNotes.map((cn: any) => ({
  ...cn,
  customerName: cn.customer?.name || '',
  customerCode: cn.customer?.code || '',
  customerTaxId: cn.customer?.taxId || '',
  creditNoteDate: cn.creditNoteDate.toISOString(),
  createdAt: cn.createdAt.toISOString(),
  updatedAt: cn.updatedAt.toISOString(),
}))
```

**Result**: ✅ Credit notes now display correctly

---

## 📊 Data Confirmed in Database

### Purchase Invoices:
- **Total**: 2 records
- **PO202603-0001**: ฿273,098 + ฿19,116 VAT = ฿292,214
- **PO202603-0002**: ฿252,000 + ฿17,640 VAT = ฿269,640
- **Vendor**: บริษัท โลจิสติกส์ไทย จำกัด
- **Status**: ISSUED (not yet POSTED)

### Debit Notes:
- **Total**: 12 records
- All now display with vendor information

---

## 🔍 Why This Happened

The issue was a **data structure mismatch** between:
1. **Backend**: Used Prisma's `include` to fetch related objects (normalized data)
2. **Frontend**: Expected flattened fields for easier display (denormalized data)

**Solution**: Transform API responses to flatten nested objects before sending to frontend.

---

## 📝 Pattern Applied

For all APIs that return vendor/customer data:

```typescript
// ❌ Before (nested structure)
{
  vendor: { name: "...", code: "...", taxId: "..." }
}

// ✅ After (flattened structure)
{
  vendorName: "...",
  vendorCode: "...",
  vendorTaxId: "..."
}
```

This makes frontend code simpler:
```typescript
// ❌ Before (nested access)
<td>{purchase.vendor?.name || '-'}</td>

// ✅ After (direct access)
<td>{purchase.vendorName}</td>
```

---

## 🧪 Testing Checklist

- [x] Purchase Invoices page loads without errors
- [x] Purchase invoices display vendor names correctly
- [x] Debit Notes page loads without errors
- [x] Debit notes display vendor names correctly
- [x] Credit Notes page loads without errors
- [x] Credit notes display customer names correctly
- [x] All date fields properly formatted as ISO strings
- [x] No "Invalid data format" errors

---

## 🚀 Status

✅ **COMPLETE** - All 3 APIs now transform data correctly to match frontend expectations.

**User Impact**:
- Purchase invoices now visible (2 records)
- Debit notes now visible (12 records)
- Credit notes now visible
- No more "Fetch failed" errors
- No more "Invalid data format" errors

---

## 📋 Additional Notes

1. **Date Formatting**: All dates converted to ISO string format for consistent frontend handling
2. **Null Safety**: Used optional chaining (`?.`) and null coalescing (`|| ''`) to prevent errors
3. **Future**: Consider applying same pattern to other APIs (invoices, receipts, payments, etc.)

---

## 🔧 Files Modified

1. `/src/app/api/purchases/route.ts` - Added data transformation
2. `/src/app/api/debit-notes/route.ts` - Added data transformation
3. `/src/app/api/credit-notes/route.ts` - Added data transformation
4. `/src/components/purchases/purchase-list.tsx` - Improved error handling

**Total Lines Changed**: ~60 lines across 4 files
