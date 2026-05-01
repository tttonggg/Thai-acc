# Comprehensive E2E Test Suites

This directory contains comprehensive end-to-end tests for the Thai Accounting
ERP System. Each test file tests every button, form field, validation, and
database interaction for its respective module.

## Test Structure

All tests follow a consistent pattern:

1. **Navigation Tests** - Verify module can be accessed
2. **Create Tests** - Test all create operations and buttons
3. **Validation Tests** - Test form validation rules
4. **Edit Tests** - Test all edit operations
5. **Delete Tests** - Test delete with confirmation
6. **Search/Filter Tests** - Test search and filter functionality
7. **Integration Tests** - Verify data appears in related modules
8. **Export Tests** - Test export functionality
9. **Pagination Tests** - Test list navigation
10. **Screenshot Tests** - Capture visual state

## Created Test Files

### ✅ Completed

- `test-helpers.ts` - Reusable utility functions for all tests
- `accounts.spec.ts` - Chart of Accounts comprehensive tests
- `customers.spec.ts` - Customers/AR comprehensive tests
- `vendors.spec.ts` - Vendors/AP comprehensive tests

### 📋 To Be Created

The following test files need to be created following the same pattern as the
completed files:

#### 4. Products Test (`products.spec.ts`)

**Key Tests:**

- Add Product button and form
- Product code uniqueness validation
- Price and cost validation
- VAT type selection (VAT7, VAT0, NONE)
- Income type selection (service, rent, etc.)
- Inventory item toggle
- Stock level indicator
- Category and status filters
- Product appears in invoice line items

#### 5. Invoices Test (`invoices.spec.ts`)

**Key Tests:**

- New Invoice button and form
- Draft invoice creation
- Add line items
- Calculate totals (subtotal, VAT, grand total)
- Edit draft invoice
- Delete draft invoice
- Issue/Post invoice to GL
- Verify journal entry created
- Verify VAT record created
- Verify stock movement (if inventory item)
- Verify customer balance updated
- Invoice status workflow (DRAFT → ISSUED → PAID)
- Invoice PDF export
- Search and filter invoices

#### 6. Purchase Invoices Test (`purchases.spec.ts`)

**Key Tests:**

- New Purchase button and form
- Draft purchase creation
- Add line items
- Calculate totals
- Edit draft purchase
- Delete draft purchase
- Issue/Post purchase to GL
- Verify journal entry created
- Verify VAT input record created
- Verify stock movement (if inventory item)
- Verify vendor balance updated
- Purchase status workflow
- Search and filter purchases

#### 7. Receipts Test (`receipts.spec.ts`)

**Key Tests:**

- New Receipt button and form
- Select customer
- View unpaid invoices
- Allocate payment to single invoice
- Allocate payment to multiple invoices
- Add WHT deduction
- Calculate payment totals
- Post receipt to GL
- Verify journal entry (debit cash, credit AR, credit WHT)
- Verify invoice balance updated
- Verify invoice status updated (PAID or PARTIAL)
- Receipt search and filter
- Receipt export

#### 8. Payments Test (`payments.spec.ts`)

**Key Tests:**

- New Payment button and form
- Select vendor
- View unpaid purchase invoices
- Allocate payment to single invoice
- Allocate payment to multiple invoices
- Add WHT deduction (PND53)
- Calculate payment totals
- Post payment to GL
- Verify journal entry (credit cash, debit AP, debit WHT)
- Verify purchase invoice balance updated
- Payment by cheque
- Verify cheque record created
- Payment search and filter

#### 9. Assets Test (`assets.spec.ts`)

**Key Tests:**

- Add Asset button and form
- Fill asset details (code, name, purchase date, cost)
- Set salvage value and useful life
- Verify depreciation schedule created
- Edit asset details
- Delete asset with validation
- View depreciation schedule
- Status toggle (activate/deactivate)
- Asset search and filter
- TAS 16 compliance labels

#### 10. Banking Test (`banking.spec.ts`)

**Key Tests:**

- Bank Accounts Tab
  - Add Bank Account button and form
  - Edit bank account
  - Delete bank account
  - View account balance
- Cheques Tab
  - Add Cheque button and form
  - Deposit quick action
  - Verify cheque status updated
  - Clear quick action
  - Verify journal entry created
  - Bounce quick action
  - Verify reversal journal entry created
  - Cheque search and filter
- Reconciliation Tab
  - Create bank reconciliation
  - Verify reconciliation saved

#### 11. Payroll Test (`payroll.spec.ts`)

**Key Tests:**

- Employees Tab
  - Add Employee button and form
  - Fill employee details (Thai fields)
  - Edit employee details
  - Delete employee with validation
  - Employee search
- Payroll Runs Tab
  - Create Payroll Run button and form
  - Select employees
  - Verify SSC calculations (5% capped at ฿750)
  - Verify PND1 calculations (progressive rates)
  - Create payroll run
  - Verify payroll records in database
  - Approve button
  - Verify journal entry created
  - Mark Paid button
  - Verify status updated

#### 12. Petty Cash Test (`petty-cash.spec.ts`)

**Key Tests:**

- Funds Tab
  - Add Fund button and form
  - Fill fund details (code, name, custodian, amount)
  - Edit fund details
  - Delete fund with validation
  - View fund balance progress bar
  - Low balance warnings
- Vouchers Tab
  - Add Voucher button and form
  - Fill voucher details
  - Verify fund balance decreased
  - Edit pending voucher
  - Verify fund balance restored on delete
  - Approve button
  - Verify journal entry created
  - Reimburse button
  - Verify reimbursement journal entry
  - Verify fund balance restored

#### 13. Inventory Test (`inventory.spec.ts`)

**Key Tests:**

- Stock Balances Tab
  - View stock levels
  - WAC cost display
  - Adjust button
  - Create stock adjustment
  - Verify ADJUST movement created
  - Verify WAC cost recalculated
  - Verify stock balance updated
- Stock Movements Tab
  - View movement history
  - Movement type filters (RECEIVE, ISSUE, TRANSFER_OUT, TRANSFER_IN, ADJUST,
    COUNT)
  - Edit movement notes
  - Reverse movement
  - Verify correcting entry created
- Warehouses Tab
  - Add Warehouse button and form
  - Edit warehouse
  - Delete warehouse
- Transfers Tab
  - Create Transfer button and form
  - Select source and destination warehouses
  - Select product and quantity
  - Create transfer
  - Verify TRANSFER_OUT movement created
  - Complete Transfer button
  - Verify TRANSFER_IN movement created
  - Verify stock updated at both warehouses

#### 14. Credit Notes Test (`credit-notes.spec.ts`)

**Key Tests:**

- New Credit Note button and form
- Select customer
- Select invoice to credit
- Add line items with stock return
- Calculate totals
- Issue/Post credit note
- Verify credit note in database
- Verify journal entry created (debit sales returns, credit AR)
- Verify stock added back (if return stock checked)
- Verify invoice balance updated
- Credit note search and filter
- Credit note PDF export

#### 15. Debit Notes Test (`debit-notes.spec.ts`)

**Key Tests:**

- New Debit Note button and form
- Select vendor
- Select purchase invoice to debit
- Add line items
- Calculate totals
- Issue/Post debit note
- Verify debit note in database
- Verify journal entry created (debit purchases, credit AP)
- Verify stock added (if applicable)
- Verify purchase invoice balance updated
- Debit note search and filter
- Debit note PDF export

## Test Helpers

The `test-helpers.ts` file provides reusable functions:

### Authentication

- `loginAs(page, role)` - Login as specific user role
- `loginWithRetry(page, role, maxRetries)` - Login with retry logic
- `getAuthenticatedContext(role)` - Get API context for DB verification

### Navigation

- `clickSidebarButton(page, thaiText, englishText)` - Click sidebar navigation
- `navigateToModule(page, moduleThai, moduleEnglish)` - Navigate to module

### Database Verification

- `verifyRecordExists(context, endpoint, code, expectedFields)` - Verify record
  in DB
- `verifyRecordDeleted(context, endpoint, code)` - Verify record deleted
- `getRecordByCode(context, endpoint, code)` - Get record from DB
- `countRecords(context, endpoint)` - Count records

### UI Interaction

- `fillFormByLabels(page, fields)` - Fill form fields by label
- `clickButton(page, text)` - Click button by text
- `takeScreenshot(page, path)` - Take screenshot with directory creation
- `waitForToast(page, timeout)` - Wait for toast notification
- `verifyTableHasData(page)` - Verify table has rows

### Test Data

- `generateTestCode(prefix)` - Generate unique code with timestamp
- `generateTestCustomer()` - Generate test customer data
- `generateTestVendor()` - Generate test vendor data
- `generateTestProduct()` - Generate test product data

### Cleanup

- `deleteTestRecord(context, endpoint, code)` - Delete test record
- `cleanupTestRecords(context, endpoint, prefix)` - Cleanup all test records

## Running Tests

```bash
# Run all comprehensive tests
bun run test:e2e e2e/comprehensive

# Run specific test file
bun run test:e2e e2e/comprehensive/accounts.spec.ts

# Run with UI
bun run test:e2e:ui e2e/comprehensive

# Run specific test
bun run test:e2e e2e/comprehensive/accounts.spec.ts -g "CREATE"
```

## Test Organization

Each test file uses `test.describe.configure({ mode: 'serial' })` to ensure
tests run in order and can share state (test data codes).

Tests use the following lifecycle:

- `beforeAll` - Setup API context for database verification
- `afterAll` - Cleanup test data
- `beforeEach` - Login and navigate to module

## Screenshot Directory

Screenshots are saved to `screenshots/comprehensive/{module}/` for visual
verification and debugging.

## Database Verification

All critical operations verify database state using the API context:

- Create operations verify record exists
- Edit operations verify fields updated
- Delete operations verify record removed
- Post operations verify journal entries created

## Best Practices

1. **Use descriptive test names** with prefixes: `[NAVIGATE]`, `[CREATE]`,
   `[EDIT]`, `[DELETE]`, etc.
2. **Verify database state** after all mutations
3. **Clean up test data** in `afterAll` hooks
4. **Use test helpers** to avoid code duplication
5. **Take screenshots** at key points for debugging
6. **Test validation** with both valid and invalid data
7. **Test error handling** (e.g., duplicate codes, required fields)
8. **Verify toast notifications** for user feedback
9. **Test search/filter** functionality
10. **Test pagination** when applicable

## Coverage Goals

Each test file should achieve:

- ✅ Every button clicked
- ✅ Every form field filled
- ✅ Every validation rule tested
- ✅ Every error message verified
- ✅ Every database state verified
- ✅ Every integration point tested
- ✅ Every filter and search option tested
- ✅ Screenshot captured for main views

## Status Dashboard

| Module       | Status      | Last Updated | Tests Count |
| ------------ | ----------- | ------------ | ----------- |
| Accounts     | ✅ Complete | 2025-03-13   | 12          |
| Customers    | ✅ Complete | 2025-03-13   | 13          |
| Vendors      | ✅ Complete | 2025-03-13   | 13          |
| Products     | 📋 Pending  | -            | ~12         |
| Invoices     | 📋 Pending  | -            | ~15         |
| Purchases    | 📋 Pending  | -            | ~12         |
| Receipts     | 📋 Pending  | -            | ~12         |
| Payments     | 📋 Pending  | -            | ~13         |
| Assets       | 📋 Pending  | -            | ~10         |
| Banking      | 📋 Pending  | -            | ~15         |
| Payroll      | 📋 Pending  | -            | ~12         |
| Petty Cash   | 📋 Pending  | -            | ~14         |
| Inventory    | 📋 Pending  | -            | ~14         |
| Credit Notes | 📋 Pending  | -            | ~10         |
| Debit Notes  | 📋 Pending  | -            | ~10         |

**Total Planned Tests:** ~177 tests across 15 modules

## Next Steps

1. Create remaining test files following the established pattern
2. Run all tests and fix any failures
3. Add more edge case tests as needed
4. Integrate with CI/CD pipeline
5. Add test coverage reporting
6. Create test data fixtures for complex scenarios
