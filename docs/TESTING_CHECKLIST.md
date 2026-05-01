# ✅ Manual Testing Checklist - Currency Fixes

**Date:** 2026-04-15 **Dev Server:** http://localhost:3000 ✅ Running
**Database:** ✅ Clean & Seeded (50 invoices, 100 journal entries) **Status:**
Ready for manual testing

---

## 🔐 Login First

**URL:** http://localhost:3000 **Email:** admin@thaiaccounting.com **Password:**
admin123

---

## 📋 Quick Test Checklist

### Test 1: Create Invoice (ภาษีขาย) - 5 min

**Path:** ขาย (SELL) → ใบกำกับภาษี

1. **Click [+ สร้างใบกำกับภาษี]**
2. **Select Customer:** บ.สยามพาเวอร์
3. **Add Line Item:**
   - Description: "ทดสอบราคา"
   - Quantity: 1
   - Unit Price: **1234.56** ← Enter with decimal
   - VAT Rate: 7%
4. **Click [บันทึก]**

**✅ Verify:**

- [ ] Subtotal shows: **฿1,234.56**
- [ ] VAT shows: **฿86.42**
- [ ] Total shows: **฿1,320.98**
- [ ] **NOT** ฿132,098 (100x bug)
- [ ] **NOT** ฿0.00 (operator precedence bug)

---

### Test 2: View Invoice List - 2 min

**Path:** ขาย (SELL) → ใบกำกับภาษี

**✅ Verify:**

- [ ] Total column shows: **฿1,320.98** (just created)
- [ ] Outstanding column shows: **฿1,320.98**
- [ ] **NOT** ฿132,098.00
- [ ] Quick filters work: [ทั้งหมด] [รอดำเนินการ] [เร่งด่วน] [เสร็จสิ้น]

---

### Test 3: Create Receipt (รับเงิน) - 5 min

**Path:** ขาย (SELL) → รับเงิน

1. **Click [+ รับเงิน]**
2. **Select Customer:** บ.สยามพาเวอร์
3. **Amount Received:** **1500.00**
4. **Select Invoice:** INV-XXXX (฿1,320.98)
5. **WHT Rate:** 3%
6. **Click [จัดจ่าย]**

**✅ Verify:**

- [ ] WHT Amount shows: **฿39.63**
- [ ] Net Payment shows: **฿1,281.35**
- [ ] Remaining shows: **฿179.02**
- [ ] Allocation bar updates correctly

---

### Test 4: Dashboard Check - 2 min

**Path:** Dashboard (หน้าแรก)

**✅ Verify:**

- [ ] AR Total shows: **฿1,320.98** (from Test 3)
- [ ] Revenue shows correct amount
- [ ] **NOT** 0.00 (operator precedence bug)
- [ ] Aging breakdown shows actual values

---

### Test 5: Create Payment (จ่ายเหนื่อย) - 5 min

**Path:** ซื้อ (BUY) → จ่ายเหนื่อย

1. **Click [+ จ่ายเหนื่อย]**
2. **Select Vendor:** บ.มิตรภาพ
3. **Add Invoice Allocation:**
   - Amount: **5000.00**
   - WHT Category: **ค่าบริการวิชาชีพ (Professional)** → Should auto-select 3%
4. **Click [บันทึก]**

**✅ Verify:**

- [ ] WHT dropdown shows all 6 categories
- [ ] Info tooltip shows PND.53 rates
- [ ] WHT Amount: **฿150.00**
- [ ] Net Payment: **฿4,850.00**

---

### Test 6: VAT Report - 2 min

**Path:** รายงาน/ภาษี (REPORTS) → VAT Report

**✅ Verify:**

- [ ] Report loads without error
- [ ] Amounts show: **฿1,320.98** format
- [ ] **NOT** ฿132,098.00 (100x bug)
- [ ] Columns align correctly

---

### Test 7: WHT Report - 2 min

**Path:** รายงาน/ภาษี (REPORTS) → WHT Report

**✅ Verify:**

- [ ] Report shows WHT: **฿189.63** (฿39.63 + ฿150.00)
- [ ] **NOT** ฿18,963.00 (100x bug)
- [ ] PND.3 form shows correct amounts

---

### Test 8: Trial Balance - 2 min

**Path:** บัญชี (ACCOUNTING) → งบทดลอง

**✅ Verify:**

- [ ] Debit = Credit (balanced)
- [ ] Amounts show in **฿XXX.XX** format
- [ ] **NOT** ฿XXX,XXX.XX (100x bug)

---

### Test 9: Balance Sheet - 2 min

**Path:** รายงาน/ภาษี (REPORTS) → งบดุล

**✅ Verify:**

- [ ] Assets show correct amounts
- [ ] Liabilities show correct amounts
- [ ] **NOT** 100x errors
- [ ] No ฿0.00 errors

---

### Test 10: Purchase Order - 5 min

**Path:** ซื้อ (BUY) → ใบสั่งซื้อ

1. **Click [+ สร้างใบสั่งซื้อ]**
2. **Select Vendor:** บ.มิตรภาพ
3. **Add Line:**
   - Description: "กระดาษ A4"
   - Quantity: 100
   - Unit Price: **2.50**
4. **Click [บันทึก]**

**✅ Verify:**

- [ ] Line amount: **฿250.00**
- [ ] Total: **฿267.50** (includes VAT 7%)
- [ ] **NOT** ฿26,750.00

---

## 🎯 Critical Verification Points

### Input Forms

- [ ] Accept decimals: 1234.56 ✅
- [ ] WHT dropdown shows 6 categories ✅
- [ ] Tooltips display PND.53 rates ✅

### Database Storage (Check with Prisma Studio)

```bash
npx prisma studio
```

- [ ] Amounts stored as Int: 132098 (Satang)
- [ ] NOT Float: 1320.98
- [ ] NOT wrong: 13209800

### Display

- [ ] Shows Baht: ฿1,320.98 ✅
- [ ] NOT Satang: ฿132,098
- [ ] NOT 100x: ฿132,098.00

### Reports

- [ ] No 100x bugs ✅
- [ ] No 0.00 bugs ✅
- [ ] Calculations accurate ✅

---

## 📊 Test Results Summary

**Total Tests:** 10 **Estimated Time:** 30-35 minutes **Pass Criteria:** 9/10
tests pass (90%)

| Test               | Status | Notes |
| ------------------ | ------ | ----- |
| 1. Create Invoice  | ⏳     |       |
| 2. Invoice List    | ⏳     |       |
| 3. Create Receipt  | ⏳     |       |
| 4. Dashboard       | ⏳     |       |
| 5. Create Payment  | ⏳     |       |
| 6. VAT Report      | ⏳     |       |
| 7. WHT Report      | ⏳     |       |
| 8. Trial Balance   | ⏳     |       |
| 9. Balance Sheet   | ⏳     |       |
| 10. Purchase Order | ⏳     |       |

---

## 🐛 If You Find Bugs

**Screenshot the error** and note:

1. What you were doing (step number)
2. Expected value (what should show)
3. Actual value (what actually shows)
4. Browser console errors (F12 → Console)

**Common Bugs to Look For:**

- 🔴 100x error: Shows ฿132,098 instead of ฿1,320.98
- 🔴 0.00 error: Shows ฿0.00 instead of actual amount
- 🔴 Satang display: Shows ฿132,098 instead of ฿1,320.98
- 🔴 Wrong calculation: VAT, WHT, or totals incorrect

---

## ✅ When All Tests Pass

**Next Steps:**

1. Document results (screenshots)
2. Update task status
3. Deploy to production via CI/CD
4. Test on production VPS

**Status:** Ready to begin testing! 🚀

---

**Start with Test 1 and work through sequentially. Good luck!** 🎯
