# AGENT_FULL_TEST - Full Coverage Test Suite

## Overview

Comprehensive test suite that tests all 16 sidebar modules for functionality,
error handling, and visual verification.

## Test File

- **Location:** `/Users/tong/Thai-acc/e2e/agents/99-full-coverage-test.spec.ts`
- **Framework:** Playwright
- **Total Tests:** 18 (1 setup + 16 modules + 1 report)

## Modules Tested (16 total)

| #   | Module ID  | Thai Name         | English Description                       |
| --- | ---------- | ----------------- | ----------------------------------------- |
| 1   | dashboard  | ภาพรวม            | Dashboard with summary cards and charts   |
| 2   | accounts   | ผังบัญชี          | Chart of accounts with account tree       |
| 3   | journal    | บันทึกบัญชี       | Journal entry listing and creation        |
| 4   | invoices   | ใบกำกับภาษี       | Invoice management                        |
| 5   | vat        | ภาษีมูลค่าเพิ่ม   | VAT reports and filings                   |
| 6   | wht        | ภาษีหัก ณ ที่จ่าย | Withholding tax management                |
| 7   | customers  | ลูกหนี้           | Accounts receivable / Customer management |
| 8   | vendors    | เจ้าหนี้          | Accounts payable / Vendor management      |
| 9   | inventory  | สต็อกสินค้า       | Inventory management                      |
| 10  | banking    | ธนาคาร            | Bank accounts and reconciliation          |
| 11  | assets     | ทรัพย์สิน         | Fixed asset management                    |
| 12  | payroll    | เงินเดือน         | Payroll processing                        |
| 13  | petty-cash | เงินสดย่อย        | Petty cash management                     |
| 14  | reports    | รายงาน            | Financial reports                         |
| 15  | settings   | ตั้งค่า           | System settings (Admin only)              |
| 16  | users      | จัดการผู้ใช้      | User management (Admin only)              |

## Test Phases

### Phase 0: Setup

- Login with admin credentials
- Verify sidebar visibility
- Take setup screenshot

### Phase 1: Module Testing (for each module)

1. **Navigate** to application
2. **Verify** sidebar is visible
3. **Click** sidebar button for module
4. **Wait** for module to load (2 seconds)
5. **Verify** sidebar button is active (bg-yellow-500)
6. **Verify** module content loaded
7. **Take** screenshot
8. **Check** for console/page errors

### Phase 2: Reporting

- Generate console summary
- Generate detailed markdown report
- Generate JSON report
- Assert test results

## Test Output

### Screenshots

- Location: `test-results/full-coverage/`
- Format: `{module-id}.png` or `{module-id}-ERROR.png`

### Reports

1. **Markdown Report:** `test-results/full-coverage/FULL_COVERAGE_REPORT.md`
2. **JSON Report:** `test-results/full-coverage/report.json`

### Report Contents

- Executive Summary (pass/fail counts, success rate)
- Detailed results table
- Failed modules analysis
- Console error log by module
- Recommendations for fixes

## Running the Tests

### Run all tests

```bash
npx playwright test e2e/agents/99-full-coverage-test.spec.ts
```

### Run with headed browser

```bash
npx playwright test e2e/agents/99-full-coverage-test.spec.ts --headed
```

### Run specific module test

```bash
npx playwright test e2e/agents/99-full-coverage-test.spec.ts --grep "MODULE-DASHBOARD"
```

### Run with UI mode

```bash
npx playwright test e2e/agents/99-full-coverage-test.spec.ts --ui
```

## Verification Criteria

Each module is tested for:

1. **Navigation:** Sidebar button click works
2. **Visual State:** Button shows active state (yellow background)
3. **Content Loading:** Main content area is present
4. **Element Verification:** At least one expected element is visible
5. **Error Monitoring:** No console or page errors

## Expected Results

- ✅ All 16 modules should pass
- ✅ No console errors
- ✅ No page crashes
- ✅ All screenshots captured
- ✅ Report generated

## Troubleshooting

### Module not found

- Check that the sidebar button label matches the test definition
- Verify the application is running on localhost:3000

### Login failures

- Ensure test credentials are valid (admin@thaiaccounting.com / admin123)
- Check that rate limiting is bypassed with `x-playwright-test: true` header

### Screenshots not captured

- Ensure `test-results/full-coverage/` directory exists and is writable
- Check Playwright config for screenshot settings

## Success Criteria

The test suite passes when:

- All 16 modules load without errors
- Content is verified for each module
- Screenshots are captured
- Report is generated
- No unexpected console errors
