# 🤖 Automation Test Plan - UI + Database Validation

**Date:** 2026-04-15
**Purpose:** Automated E2E tests validating currency fixes work correctly in UI and database
**Criticality:** 🔴 **CRITICAL** - Must pass before manual testing

---

## 🎯 Test Strategy

**Why Automation?**
- Validates entire stack: UI → API → Database → API → UI
- Prevents regressions (double-division, 100x bugs)
- Provides documented proof of correctness
- Faster than repeated manual testing

**Test Flow:**
```
User Input (UI) → API (converts) → Database (stores Satang) → API (converts back) → UI (displays Baht)
     ✅                    ✅                      ✅                        ✅                    ✅
```

---

## 📋 Test Scenarios (Automated)

### Test 1: Invoice Creation - Decimal Amounts

**Objective:** Verify invoice with decimal amounts stores correctly

**Test Steps:**
1. **Login** to http://localhost:3000 (admin@thaiaccounting.com)
2. **Navigate** to ขาย → ใบกำกับภาษี
3. **Click** [+ สร้างใบกำกับภาษี]
4. **Fill Form:**
   - Customer: บ.สยามพาเวอร์
   - Description: "ทดสอบทศนิยม"
   - Quantity: 1
   - Unit Price: **1234.56** ← Test decimal
   - VAT Rate: 7%
5. **Submit** form
6. **Query Database** for created invoice
7. **Compare** UI display vs database storage

**Expected Results:**

| Stage | Field | Expected Value | Actual Value | Pass/Fail |
|-------|-------|----------------|--------------|-----------|
| **UI Input** | unitPrice | 1234.56 | TBD | ⏳ |
| **Database** | unitPrice (Satang) | 123456 | TBD | ⏳ |
| **Database** | vatAmount (Satang) | 8642 (123456 * 0.07) | TBD | ⏳ |
| **Database** | amount (Satang) | 123456 | TBD | ⏳ |
| **Database** | totalAmount (Satang) | 132098 | TBD | ⏳ |
| **API Response** | unitPrice | 1234.56 | TBD | ⏳ |
| **API Response** | totalAmount | 1320.98 | TBD | ⏳ |
| **UI Display** | Unit Price | ฿1,234.56 | TBD | ⏳ |
| **UI Display** | Total | ฿1,320.98 | TBD | ⏳ |

**Validation Rules:**
- ✅ Input = 1234.56 (no rounding)
- ✅ DB stores: 123456 (1234.56 * 100)
- ✅ DB calculates VAT: 8642 (123456 * 0.07)
- ✅ DB calculates total: 132098 (123456 + 8642)
- ✅ API returns: 1234.56 and 1320.98
- ✅ UI displays: ฿1,234.56 and ฿1,320.98
- ❌ NOT ฿13.21 (double-division)
- ❌ NOT ฿132,098 (no division)

---

### Test 2: Receipt with WHT Calculation

**Objective:** Verify receipt allocation and WHT calculation

**Test Steps:**
1. **Use Invoice** from Test 1 (฿1,320.98)
2. **Navigate** to ขาย → รับเงิน
3. **Click** [+ รับเงิน]
4. **Fill Form:**
   - Customer: บ.สยามพาเวอร์
   - Amount Received: **1500.00**
   - Select Invoice: INV-XXXX (฿1,320.98)
   - WHT Rate: **3%**
5. **Submit** form
6. **Query Database** for created receipt and allocation
7. **Verify** calculations

**Expected Results:**

| Stage | Field | Expected Value | Actual Value | Pass/Fail |
|-------|-------|----------------|--------------|-----------|
| **Database** | receipt.amount (Satang) | 150000 | TBD | ⏳ |
| **Database** | allocation.amount (Satang) | 132098 | TBD | ⏳ |
| **Database** | allocation.whtAmount (Satang) | 3963 (132098 * 0.03) | TBD | ⏳ |
| **Database** | allocation.netPayment (Satang) | 128135 (132098 - 3963) | TBD | ⏳ |
| **UI Display** | Receipt Amount | ฿1,500.00 | TBD | ⏳ |
| **UI Display** | Allocated | ฿1,320.98 | TBD | ⏳ |
| **UI Display** | WHT | ฿39.63 | TBD | ⏳ |
| **UI Display** | Net Payment | ฿1,281.35 | TBD | ⏳ |
| **UI Display** | Remaining | ฿179.02 | TBD | ⏳ |

**Validation Rules:**
- ✅ WHT = 3963 Satang (฿39.63)
- ✅ Net = 132098 - 3963 = 128135
- ✅ Remaining = 150000 - 132098 = 17902
- ❌ NOT WHT = 39 (wrong currency)
- ❌ NOT double-divided

---

### Test 3: Payment with WHT Category

**Objective:** Verify payment WHT category guidance

**Test Steps:**
1. **Navigate** to ซื้อ → จ่ายเหนื่อย
2. **Click** [+ จ่ายเหนื่อย]
3. **Fill Form:**
   - Vendor: บ.มิตรภาพ
   - Amount: **50000.00**
   - WHT Category: **ค่าบริการวิชาชีพ (Professional)**
   - Auto-populates: WHT Rate 3%
4. **Submit** form
5. **Query Database** for payment
6. **Verify** WHT amount and category

**Expected Results:**

| Stage | Field | Expected Value | Actual Value | Pass/Fail |
|-------|-------|----------------|--------------|-----------|
| **UI Behavior** | WHT Category | Shows 6 options | TBD | ⏳ |
| **UI Behavior** | Auto-populate rate | 3% selected | TBD | ⏳ |
| **UI Behavior** | WHT tooltip | Shows PND.53 rates | TBD | ⏳ |
| **Database** | payment.amount (Satang) | 5000000 | TBD | ⏳ |
| **Database** | payment.whtAmount (Satang) | 150000 (5000000 * 0.03) | TBD | ⏳ |
| **Database** | payment.unallocated (Satang) | 150000 | TBD | ⏳ |
| **UI Display** | Amount | ฿50,000.00 | TBD | ⏳ |
| **UI Display** | WHT | ฿1,500.00 | TBD | ⏳ |
| **UI Display** | Net | ฿48,500.00 | TBD | ⏳ |

**Validation Rules:**
- ✅ WHT category dropdown has 6 options
- ✅ Professional auto-selects 3%
- ✅ WHT = 150000 Satang (฿1,500)
- ✅ Tooltip displays all PND.53 rates

---

### Test 4: Report Verification (100x Bug Check)

**Objective:** Verify reports don't show 100x amounts

**Test Steps:**
1. **Navigate** to รายงาน/ภาษี → VAT Report
2. **Run report** for current month
3. **Check** displayed amounts
4. **Compare** vs database totals

**Expected Results:**

| Stage | Field | Expected Value | Actual Value | Pass/Fail |
|-------|-------|----------------|--------------|-----------|
| **Database** | Sum invoice.vatAmount | Sum of all VAT | TBD | ⏳ |
| **Report Display** | Total VAT | Sum / 100 (convert to Baht) | TBD | ⏳ |
| **Validation** | NOT 100x | Amount < ฿100,000 | TBD | ⏳ |
| **Validation** | NOT 0.00 | Amount > ฿0 | TBD | ⏳ |

**Example:**
- DB sum: 86420 Satang (from Test 1)
- Report shows: ฿864.20
- ❌ NOT ฿86,420 (100x bug)
- ❌ NOT ฿0.00

---

### Test 5: Dashboard Aging Check

**Objective:** Verify dashboard shows actual amounts (not 0.00)

**Test Steps:**
1. **Navigate** to Dashboard
2. **Check** AR Total, AP Total, Revenue
3. **Compare** vs database

**Expected Results:**

| Stage | Field | Expected Value | Actual Value | Pass/Fail |
|-------|-------|----------------|--------------|-----------|
| **Database** | Unpaid invoices total | Sum of outstanding | TBD | ⏳ |
| **Dashboard** | AR Total | Sum / 100 (Baht) | TBD | ⏳ |
| **Validation** | NOT 0.00 | Amount > ฿0 | TBD | ⏳ |
| **Validation** | Correct operator precedence | (value ?? 0) / 100 | TBD | ⏳ |

---

### Test 6: Purchase Order (Float→Int Migration)

**Objective:** Verify PO stores Int (Satang), not Float

**Test Steps:**
1. **Navigate** to ซื้อ → ใบสั่งซื้อ
2. **Create PO:**
   - Vendor: บ.มิตรภาพ
   - Item: "กระดาษ A4"
   - Quantity: 100
   - Unit Price: **2.50**
3. **Submit** form
4. **Query Database** for PO line

**Expected Results:**

| Stage | Field | Expected Value | Actual Value | Pass/Fail |
|-------|-------|----------------|--------------|-----------|
| **Database** | unitPrice type | INTEGER (not Float) | TBD | ⏳ |
| **Database** | unitPrice value | 250 (2.50 * 100) | TBD | ⏳ |
| **Database** | amount value | 25000 (100 * 250) | TBD | ⏳ |
| **UI Display** | Unit Price | ฿2.50 | TBD | ⏳ |
| **UI Display** | Amount | ฿250.00 | TBD | ⏳ |

**Validation Rules:**
- ✅ unitPrice column is INTEGER type
- ✅ Stored as 250 (not 2.5 or 250.0)
- ✅ No floating-point precision issues

---

## 🔧 Test Implementation

### Test Runner Script

**File:** `scripts/run-automation-tests.ts`

```typescript
#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client'
import fetch from 'node-fetch'

const prisma = new PrismaClient()

interface TestCase {
  name: string
  test: () => Promise<TestResult>
}

interface TestResult {
  passed: boolean
  expected: any
  actual: any
  message: string
}

async function runTests() {
  const results: Record<string, TestResult> = {}

  // Test 1: Invoice Creation
  results['Test 1: Invoice Decimal'] = await testInvoiceCreation()

  // Test 2: Receipt WHT
  results['Test 2: Receipt WHT'] = await testReceiptWHT()

  // Test 3: Payment WHT
  results['Test 3: Payment WHT'] = await testPaymentWHT()

  // Test 4: Reports
  results['Test 4: Reports'] = await testReports()

  // Test 5: Dashboard
  results['Test 5: Dashboard'] = await testDashboard()

  // Test 6: PO Migration
  results['Test 6: PO Migration'] = await testPOMigration()

  // Print results
  printResults(results)

  // Exit with code
  const allPassed = Object.values(results).every(r => r.passed)
  process.exit(allPassed ? 0 : 1)
}

function printResults(results: Record<string, TestResult>) {
  console.log('\n' + '='.repeat(80))
  console.log('🤖 AUTOMATION TEST RESULTS')
  console.log('='.repeat(80) + '\n')

  let passed = 0
  let failed = 0

  for (const [name, result] of Object.entries(results)) {
    const status = result.passed ? '✅ PASS' : '❌ FAIL'
    console.log(`${status}: ${name}`)
    console.log(`  Expected: ${JSON.stringify(result.expected)}`)
    console.log(`  Actual: ${JSON.stringify(result.actual)}`)
    console.log(`  Message: ${result.message}\n`)

    if (result.passed) passed++
    else failed++
  }

  console.log('='.repeat(80))
  console.log(`📊 Summary: ${passed} passed, ${failed} failed`)
  console.log('='.repeat(80))

  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Ready for manual testing.\n')
  } else {
    console.log('\n⚠️  SOME TESTS FAILED! Fix bugs before manual testing.\n')
  }
}

// Test implementations...
async function testInvoiceCreation(): Promise<TestResult> {
  // Implementation
  return { passed: false, expected: '', actual: '', message: 'Not implemented' }
}

// ... other tests

runTests().catch(console.error)
```

---

## 📊 Test Execution Plan

### Phase 1: Setup (5 min)
1. Start dev server: `npm run dev`
2. Confirm database is clean: `npx prisma studio`
3. Login to UI: admin@thaiaccounting.com

### Phase 2: Run Automated Tests (15 min)
1. Execute test runner: `npx tsx scripts/run-automation-tests.ts`
2. Tests will:
   - Create data via UI automation (Playwright)
   - Query database directly (Prisma)
   - Compare expected vs actual
   - Generate report with pass/fail

### Phase 3: Review Results (5 min)
1. Check test output
2. **If ALL PASS:** Proceed to manual testing
3. **If ANY FAIL:** Fix bugs, re-run tests

### Phase 4: Manual Verification (30 min)
1. Use `TESTING_CHECKLIST.md` for manual scenarios
2. Verify UI looks correct
3. Check for UX issues automation can't catch

---

## 🎯 Pass Criteria

**Automation Tests Pass If:**
- ✅ All 6 test scenarios pass
- ✅ No 100x bugs detected
- ✅ No 0.00 bugs detected
- ✅ No double-division bugs
- ✅ Database stores Int (Satang)
- ✅ UI displays Baht correctly
- ✅ WHT calculations accurate

**Can Proceed to Manual Testing If:**
- ✅ 100% automation pass rate
- ✅ Test report shows all green

---

## 📝 Test Report Template

```markdown
# Automation Test Report - [Date]

## Summary
- **Total Tests:** 6
- **Passed:** X
- **Failed:** Y
- **Pass Rate:** Z%

## Results Details

### Test 1: Invoice Decimal Amounts
- **Status:** ✅/❌
- **Expected:** unitPrice = 123456 (Satang)
- **Actual:** [value]
- **Difference:** [description]

### Test 2: Receipt WHT Calculation
- **Status:** ✅/❌
- **Expected:** whtAmount = 3963 (Satang)
- **Actual:** [value]
- **Difference:** [description]

[... remaining tests ...]

## Issues Found

1. [Issue description]
   - Expected: [value]
   - Actual: [value]
   - Impact: [description]

## Recommendation

- [ ] Proceed to manual testing
- [ ] Fix bugs first, then re-test

## Next Steps

1. [ ] Fix failed tests
2. [ ] Re-run automation suite
3. [ ] Manual verification
4. [ ] Deploy to production
```

---

## 🚀 Next Steps After Automation

**If Tests Pass:**
1. ✅ Proceed to manual testing with `TESTING_CHECKLIST.md`
2. ✅ User verifies UI looks good
3. ✅ Document results with screenshots
4. ✅ Deploy to production

**If Tests Fail:**
1. ❌ Review failed test details
2. ❌ Identify root cause (double-division? missing conversion?)
3. ❌ Fix bugs in code
4. ❌ Re-run automation tests
5. ❌ Repeat until 100% pass

---

**This automation plan ensures systematic validation of all currency fixes before manual testing!** 🎯
