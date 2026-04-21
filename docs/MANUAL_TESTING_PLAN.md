# 🧪 Manual Web UI Testing Plan - Currency Fixes Verification

**Date:** 2026-04-15
**Purpose:** Verify all currency unit fixes work correctly in real user workflows
**Criticality:** 🔴 **VERY IMPORTANT** - Production deployment depends on this

---

## 🎯 Objective

Test that **all 54 currency bug fixes** work correctly in real business scenarios by:
1. Resetting database to clean state
2. Manually entering data through web UI forms
3. Verifying amounts display correctly at each step
4. Testing end-to-end workflows (Create → View → Report)

**Why Manual Testing?**
- Database has mixed dummy data (old bugs + new fixes)
- Need to verify **real user workflows** work correctly
- Automation can't catch UX issues (e.g., "฿1,000,000 looks wrong")
- Must test **boundary conditions** (0.01, 999.99, 1000.00, etc.)

---

## 📋 Test Scenarios

### Scenario 1: Invoice Workflow (ภาษีขาย)
**Purpose:** Verify invoice creation and VAT calculation

**Steps:**
1. **Create Customer**
   - Name: "บริษัท ทดสอบ จำกัด"
   - Tax ID: "1234567890123"

2. **Create Invoice** (ทดสอบ 4 price points)
   - **Test 1: Small amount** (฿100.50)
     - Item: "สินค้าทดสอบ A"
     - Quantity: 1
     - Unit Price: ฿100.50
     - VAT: 7% (฿7.04)
     - **Expected Total:** ฿107.54

   - **Test 2: Medium amount** (฿1,234.56)
     - Item: "สินค้าทดสอบ B"
     - Quantity: 2
     - Unit Price: ฿617.28
     - VAT: 7% (฿86.42)
     - **Expected Total:** ฿1,320.98

   - **Test 3: Large amount** (฿10,000.00)
     - Item: "บริการให้คำปรึกษา"
     - Quantity: 1
     - Unit Price: ฿10,000.00
     - VAT: 7% (฿700.00)
     - **Expected Total:** ฿10,700.00

   - **Test 4: Very large amount** (฿999,999.99)
     - Item: "ระบบคอมพิวเตอร์"
     - Quantity: 1
     - Unit Price: ฿999,999.99
     - VAT: 7% (฿69,999.99)
     - **Expected Total:** ฿1,069,999.98

3. **Verify Display** (Invoice Detail Page)
   - ✅ Subtotal shows correctly (no ฿1,000,000 bug)
   - ✅ VAT amount shows correctly
   - ✅ Total shows correctly
   - ✅ Outstanding amount shows correctly

4. **Post to GL**
   - Journal entry should be created
   - Debit = Credit (balanced)

---

### Scenario 2: Receipt Workflow (รับเงิน)
**Purpose:** Verify receipt allocation and WHT calculation

**Steps:**
1. **Create Receipt for Invoice** (฿1,320.98 from Scenario 1)
   - Customer: "บริษัท ทดสอบ จำกัด"
   - Amount Received: ฿1,500.00
   - Allocate to Invoice INV-XXXX (฿1,320.98)
   - WHT: 3% (฿39.63)
   - **Expected Net Payment:** ฿1,281.35
   - **Expected Remaining:** ฿179.02

2. **Verify Display**
   - ✅ Receipt shows Baht format (฿1,500.00)
   - ✅ Allocation shows correct amounts
   - ✅ WHT calculated correctly
   - ✅ Outstanding balance updates

3. **Post to GL**
   - Dr Cash ฿1,500.00
   - Cr AR ฿1,281.35
   - Cr WHT Payable ฿39.63
   - Cr Customer Deposit ฿179.02

---

### Scenario 3: Payment Workflow (จ่ายเหนื่อย)
**Purpose:** Verify payment and WHT category guidance

**Steps:**
1. **Create Vendor**
   - Name: "บริษัท ผู้ขาย จำกัด"
   - Tax ID: "9876543210987"

2. **Create Purchase Invoice**
   - Vendor: "บริษัท ผู้ขาย จำกัด"
   - Item: "ค่าบริการวิชาชีพ"
   - Amount: ฿50,000.00
   - VAT: 7% (฿3,500.00)
   - **Expected Total:** ฿53,500.00

3. **Create Payment**
   - WHT Category: "ค่าบริการวิชาชีพ (Professional)" → 3%
   - WHT Amount: ฿1,500.00
   - **Expected Net Payment:** ฿52,000.00
   - **Expected Remaining:** ฿1,500.00

4. **Verify Display**
   - ✅ WHT dropdown shows correct categories
   - ✅ WTH tooltip displays all PND.53 rates
   - ✅ WHT amount auto-calculates correctly
   - ✅ Net payment shows correctly

---

### Scenario 4: Purchase Order Workflow (ใบสั่งซื้อ)
**Purpose:** Verify PO calculations (Float → Int migration)

**Steps:**
1. **Create Purchase Request**
   - Item: "กระดาษ A4"
   - Quantity: 100
   - Unit Price: ฿2.50
   - **Expected Line Amount:** ฿250.00
   - **Expected Total:** ฿250.00

2. **Convert to Purchase Order**
   - Vendor: "บริษัท ผู้ขาย จำกัด"
   - Copy from PR
   - **Verify:** Amounts still correct (not 100x bug)

3. **Verify Database Storage**
   - Check Prisma Studio or query database
   - ✅ unitPrice stored as Int: 250 (Satang)
   - ✅ amount stored as Int: 25000 (Satang)
   - ✅ No Float values

---

### Scenario 5: Quotation Workflow (ใบเสนอราคา)
**Purpose:** Verify quotation calculations

**Steps:**
1. **Create Quotation**
   - Customer: "บริษัท ลูกค้า จำกัด"
   - Items:
     - Line 1: 10 × ฿150.00 = ฿1,500.00
     - Line 2: 5 × ฿500.00 = ฿2,500.00
   - Subtotal: ฿4,000.00
   - Discount: ฿200.00 (5%)
   - VAT: 7% (฿266.00)
   - **Expected Total:** ฿4,066.00

2. **Verify Display**
   - ✅ Line amounts correct
   - ✅ Discount calculated correctly
   - ✅ VAT calculated correctly
   - ✅ Total shows correctly

---

### Scenario 6: Report Verification
**Purpose:** Verify reports show correct amounts (not 100x bug)

**Steps:**
1. **VAT Report** (รายงานภาษีมูลค่าเพิ่ม)
   - Run report for current month
   - ✅ Should show: ฿10,700.00 (NOT ฿1,070,000.00)

2. **WHT Report** (รายงานภาษีหัก ณ ที่จ่าย)
   - Run report for current month
   - ✅ Should show: ฿1,539.63 (NOT ฿153,963.00)

3. **Trial Balance** (งบทดลอง)
   - ✅ Revenue accounts show correct balances
   - ✅ No 100x errors

4. **Balance Sheet** (งบดุล)
   - ✅ Assets show correct amounts
   - ✅ Liabilities show correct amounts

---

### Scenario 7: Dashboard Verification
**Purpose:** Verify dashboard aging breakdowns

**Steps:**
1. **Login as Admin**
   - Go to Dashboard
   - ✅ AR Total shows: ฿10,700.00 (NOT 0.00 or 100x)
   - ✅ AP Total shows: ฿53,500.00 (NOT 0.00 or 100x)
   - ✅ Revenue shows correct amount
   - ✅ Aging breakdowns show actual values (not 0.00)

---

## 🔍 Critical Test Points

### Must Verify (Each Workflow)

1. **Input Form**
   - ✅ User can enter decimal amounts: 100.50
   - ✅ Form validates correctly (max 2 decimals)
   - ✅ WHT category dropdown shows all options
   - ✅ WTH tooltip displays PND.53 rates

2. **Database Storage**
   - ✅ Stored as Int (Satang): 10050
   - ✅ NOT stored as Float: 100.50
   - ✅ NOT stored as Baht×100 wrong: 100500

3. **Display**
   - ✅ Shows as Baht: ฿100.50
   - ✅ NOT shows as Satang: ฿10,050
   - ✅ NOT shows 100x: ฿10,050.00

4. **Calculations**
   - ✅ Line totals: quantity × price
   - ✅ Discounts: percentage or amount
   - ✅ VAT: 7% of (subtotal - discount)
   - ✅ WHT: category-based rate
   - ✅ Net amounts: accurate

5. **Reports**
   - ✅ Sum totals correct
   - ✅ NO 100x bug
   - ✅ NO 0.00 bug

---

## 📊 Test Data Summary

### Test Price Points (Cover All Ranges)

| Test | Amount | VAT (7%) | WHT (3%) | Net + VAT |
|------|--------|---------|----------|-----------|
| Small | ฿100.50 | ฿7.04 | ฿3.02 | ฿107.54 |
| Medium | ฿1,234.56 | ฿86.42 | ฿37.04 | ฿1,320.98 |
| Large | ฿10,000.00 | ฿700.00 | ฿300.00 | ฿10,700.00 |
| Very Large | ฿999,999.99 | ฿69,999.99 | ฿30,000.00 | ฿1,069,999.98 |

### WHT Categories to Test

| Category | Rate | Test Amount | Expected WHT |
|----------|------|-------------|--------------|
| ค่าบริการ (Service) | 3% | ฿10,000 | ฿300 |
| ค่าเช่า (Rent) | 5% | ฿10,000 | ฿500 |
| ค่าบริการวิชาชีพ (Professional) | 3% | ฿50,000 | ฿1,500 |
| ค่าจ้างทำของ (Contract) | 1% | ฿100,000 | ฿1,000 |
| ค่าโฆษณา (Advertising) | 2% | ฿20,000 | ฿400 |
| ไม่หักภาษี (No WHT) | 0% | ฿5,000 | ฿0 |

---

## 🚀 Execution Plan

### Step 1: Database Reset (Clean Slate)

```bash
# Stop dev server
pkill -f "next dev"

# Reset database
npx prisma migrate reset --force --skip-seed

# Start fresh
npm run dev
```

### Step 2: Manual Testing via Browser

1. **Open Browser:** http://localhost:3000
2. **Login:** admin@thaiaccounting.com / admin123
3. **Execute Scenarios 1-7** (in order)
4. **Document Results:** Screenshot each step
5. **Verify Database:** Check Prisma Studio after each scenario

### Step 3: Verification Checklist

After each scenario, verify:
- [ ] Input form accepts decimals correctly
- [ ] Database stores Int (Satang)
- [ ] Display shows Baht with 2 decimals
- [ ] Calculations are accurate
- [ ] Reports show correct amounts
- [ ] No 100x bugs
- [ ] No 0.00 bugs

---

## 📝 Test Results Template

### Scenario X: [Name]

**Test Date:** 2026-04-15
**Tester:** [Name]

**Steps Executed:**
1. [ ] Step 1 - Result: ✅/❌
2. [ ] Step 2 - Result: ✅/❌
3. [ ] Step 3 - Result: ✅/❌

**Issues Found:**
- [ ] None
- [ ] Issue 1: [Description]

**Screenshots:**
- [ ] Input form
- [ ] Database storage
- [ ] Display
- [ ] Report

**Verdict:** PASS / FAIL

---

## 🎯 Success Criteria

**Overall Test Passes If:**
- ✅ All 7 scenarios complete without critical bugs
- ✅ No 100x display errors found
- ✅ No 0.00 display errors found
- ✅ All calculations accurate (within 0.01)
- ✅ Database stores Int consistently
- ✅ All reports show correct amounts

**Can Deploy to Production If:**
- ✅ 90%+ test cases pass
- ✅ No critical bugs
- ✅ Minor issues documented

---

## 📞 Next Steps After Testing

1. **If Tests Pass:** Deploy to production via CI/CD
2. **If Tests Fail:** Fix bugs, re-test, then deploy
3. **Document Results:** Create test report with screenshots
4. **Update Documentation:** Add test cases to CI/CD

---

**This testing is CRITICAL before production deployment!** 🔴
