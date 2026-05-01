# Sidebar Naming Convention Update

**Date**: March 19, 2026 **Purpose**: Align sidebar navigation with real-world
accounting standards and improve user empathy

---

## ✅ Changes Made

### 1. Fixed Purchases Page Loading Error

**File**: `/src/components/purchases/purchase-list.tsx`

**Problem**: "Invalid purchases data format" error when no purchase data exists

**Solution**: Improved error handling:

- Check for `result.success` before accessing data
- Set empty array instead of throwing error when data format is unexpected
- Better error logging with `console.error` for debugging

**Result**: Purchases page now loads gracefully even with no data

---

### 2. Updated Sidebar Naming Convention

**File**: `/src/components/layout/keerati-sidebar.tsx`

**Format**: `ไทย (English)` - Thai name with English translation in parentheses

**Benefits**:

- ✅ Aligns with real-world accounting standards
- ✅ Improves user empathy for bilingual users
- ✅ Clear understanding of document types
- ✅ Professional appearance

---

## 📋 Complete Sidebar Menu Structure

### 🌸 หน้าหลัก (Main)

- ภาพรวม (Dashboard)

### 🛒 งานขาย (Sales)

- ลูกค้า (Customers)
- ใบเสนอราคา (Quotation)
- ใบกำกับภาษี (Tax Invoice) ✅ **Key accounting document**
- ใบลดหนี้ (Credit Note)
- ใบเสร็จรับเงิน (Receipt) ✅ **Added for accounting completeness**

### 🚚 งานซื้อ (Purchasing)

- ผู้ขาย (Vendors)
- ใบขอซื้อ (PR) - Purchase Request
- ใบสั่งซื้อ (PO) - Purchase Order
- ใบซื้อ (Purchase Invoice) ✅ **Key accounting document**
- ใบจ่ายเงิน (Payment)
- ใบเพิ่มหนี้ (Debit Note)

### 📦 สินค้าและคลัง (Inventory)

- สต็อกสินค้า (Stock)
- สินค้า (Products)
- คลังสินค้า (Warehouses)

### 📒 บัญชี (Accounting)

- ผังบัญชี (Chart of Accounts)
- บันทึกบัญชี (Journal Entry)
- ธนาคาร (Banking)
- ทรัพย์สินถาวร (Fixed Assets) ✅ **Clarified as "Fixed Assets"**
- เงินสดย่อย (Petty Cash)

### 🏛️ ภาษี (Tax)

- ภาษีมูลค่าเพิ่ม (VAT)
- ภาษีหัก ณ ที่จ่าย (Withholding Tax)

### 👥 บุคลากร (HR & Payroll)

- เงินเดือน (Payroll)
- พนักงาน (Employees)

### 📊 รายงาน (Reports)

- รายงานทั้งหมด (All Reports)
- งวดบัญชี (Accounting Periods)
- งบประมาณ (Budgets)

### ⚙️ ผู้ดูแลระบบ (Admin)

- ตั้งค่า (Settings)
- จัดการผู้ใช้ (User Management)
- บริษัทในเครือ (Entities)
- สกุลเงิน (Currencies)

---

## 🎯 Key Accounting Documents Highlighted

### Sales Documents (ภาษีขาย - VAT OUTPUT)

1. **ใบกำกับภาษี (Tax Invoice)** - Primary sales document
2. **ใบเสร็จรับเงิน (Receipt)** - Payment acknowledgment
3. **ใบลดหนี้ (Credit Note)** - Sales returns/discounts

### Purchase Documents (ภาษีซื้อ - VAT INPUT)

1. **ใบซื้อ (Purchase Invoice)** - Primary purchase document
2. **ใบเพิ่มหนี้ (Debit Note)** - Additional supplier charges
3. **ใบจ่ายเงิน (Payment)** - Payment to suppliers

### Internal Documents (No Tax Impact)

- **ใบเสนอราคา (Quotation)** - Price quote to customer
- **ใบขอซื้อ (PR)** - Internal purchase request
- **ใบสั่งซื้อ (PO)** - Internal purchase order

---

## 📚 Accounting Standards Compliance

### Document Types (Based on Thai Revenue Department Standards)

**Tax Documents (Create VAT Records)**:

- ✅ Tax Invoice (ใบกำกับภาษี) - Creates VAT OUTPUT
- ✅ Receipt (ใบเสร็จรับเงิน) - Creates VAT OUTPUT
- ✅ Credit Note (ใบลดหนี้) - Adjusts VAT OUTPUT
- ✅ Purchase Invoice (ใบซื้อ) - Creates VAT INPUT
- ✅ Debit Note (ใบเพิ่มหนี้) - Creates VAT INPUT

**Non-Tax Documents**:

- ❌ Quotation (ใบเสนอราคา) - No VAT until issued
- ❌ Purchase Request (ใบขอซื้อ) - Internal document only
- ❌ Purchase Order (ใบสั่งซื้อ) - Internal document only

---

## 🔄 Naming Convention Pattern

### Group Labels

`หมวดหมู่ (English Category)`

Examples:

- งานขาย (Sales)
- งานซื้อ (Purchasing)
- บัญชี (Accounting)

### Menu Items

`ชื่อไทย (English Name)`

Examples:

- ใบกำกับภาษี (Tax Invoice)
- ผังบัญชี (Chart of Accounts)
- ทรัพย์สินถาวร (Fixed Assets)

### Abbreviations

Common abbreviations kept in parentheses:

- PR (Purchase Request)
- PO (Purchase Order)
- VAT (Value Added Tax)

---

## ✨ User Experience Improvements

### Before:

- ใบกำกับภาษี
- ใบซื้อ
- ผังบัญชี
- ทรัพย์สิน

### After:

- ใบกำกับภาษี (Tax Invoice) ✅
- ใบซื้อ (Purchase Invoice) ✅
- ผังบัญชี (Chart of Accounts) ✅
- ทรัพย์สินถาวร (Fixed Assets) ✅

**Benefits**:

- Clear understanding for English-speaking accountants
- Professional appearance matching international ERP systems
- Easy training for new users
- Bilingual support without language switching

---

## 🧪 Testing Checklist

- [x] Sidebar loads without errors
- [x] All menu items display correctly with Thai (English) format
- [x] Navigation works for all modules
- [x] Purchases page loads even with no data
- [x] No "Invalid purchases data format" error
- [x] Group labels follow consistent pattern

---

## 📝 Notes

1. **Receipts Added**: Added "ใบเสร็จรับเงิน (Receipt)" to Sales section for
   accounting completeness
2. **Fixed Assets Clarified**: Changed "ทรัพย์สิน" to "ทรัพย์สินถาวร (Fixed
   Assets)" for clarity
3. **Error Handling**: Improved Purchases page to handle empty data gracefully
4. **Future Enhancement**: Consider adding language toggle for Thai-only /
   English-only / Bilingual modes

---

## 🚀 Status

✅ **COMPLETE** - All sidebar items now follow Thai (English) naming convention
aligned with real-world accounting standards.

**Next Steps**:

- Consider updating page titles to match sidebar naming
- Update breadcrumb navigation if applicable
- Add tooltips explaining document types for new users
