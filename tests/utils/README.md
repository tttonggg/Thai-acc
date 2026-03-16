# E2E Test Utilities

Comprehensive utility library for End-to-End testing of the Thai Accounting ERP system.

## Overview

This directory provides utilities for:
- **Database verification** - Direct database assertions
- **Test data factory** - Create test records programmatically
- **Test helpers** - UI interaction utilities
- **Constants** - Centralized configuration

## Installation

The utilities are already included in the project. No additional installation needed.

```bash
# Install Playwright (if not already installed)
bun run test:e2e:install
```

## Quick Start

### Importing Utilities

```typescript
// Import all utilities from index
import {
  loginAs,
  verifyRecordCount,
  createTestCustomer,
  TEST_USERS,
  URLs
} from '@/tests/utils';

// Or import from specific files
import { loginAs } from '@/tests/utils/test-helpers';
import { verifyRecordCount } from '@/tests/utils/db-verification';
import { createTestCustomer } from '@/tests/utils/test-data-factory';
```

### Basic Test Example

```typescript
import { test, expect } from '@playwright/test';
import { loginAs, createTestCustomer, verifyRecordExists } from '@/tests/utils';

test('create customer via API', async ({ page }) => {
  // Login
  await loginAs(page, 'ADMIN');

  // Create test customer
  const customer = await createTestCustomer({
    name: 'Test Customer',
    email: 'test@example.com'
  });

  // Verify in database
  const exists = await verifyRecordExists('customer', customer.id);
  expect(exists).toBe(true);
});
```

## Utilities Reference

### 1. Constants (`constants.ts`)

Provides test credentials, URLs, timeouts, and error messages.

```typescript
import {
  TEST_USERS,
  URLs,
  TIMEOUTS,
  SELECTORS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  TEST_DATA
} from '@/tests/utils';

// Usage
await loginAs(page, 'ADMIN');  // Uses TEST_USERS.ADMIN
await navigateTo(page, URLs.CUSTOMERS);
await page.waitForTimeout(TIMEOUTS.MEDIUM);
```

#### TEST_USERS

| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| ADMIN | admin@thaiaccounting.com | admin123 | Full access |
| ACCOUNTANT | accountant@thaiaccounting.com | acc123 | Accounting operations |
| USER | user@thaiaccounting.com | user123 | Basic operations |
| VIEWER | viewer@thaiaccounting.com | viewer123 | Read-only |

#### URLs

- `URLs.BASE` - Base URL (http://localhost:3000)
- `URLs.LOGIN` - Login page
- `URLs.DASHBOARD` - Dashboard
- `URLs.CUSTOMERS` - Customers page
- `URLs.VENDORS` - Vendors page
- `URLs.INVOICES` - Invoices page
- `URLs.RECEIPTS` - Receipts page
- `URLs.PAYMENTS` - Payments page
- And more...

### 2. Test Helpers (`test-helpers.ts`)

UI interaction utilities for Playwright tests.

#### Authentication

```typescript
import { loginAs, logout, setupTest } from '@/tests/utils';

// Login as specific role
await loginAs(page, 'ADMIN');

// Logout
await logout(page);

// Setup test environment (clear cookies, set headers)
await setupTest(page, {
  bypassRateLimit: true,
  viewport: { width: 1920, height: 1080 }
});
```

#### Navigation

```typescript
import { navigateTo, clickSidebarNavItem, waitForNavigation } from '@/tests/utils';

// Navigate to specific page
await navigateTo(page, URLs.CUSTOMERS);

// Click sidebar navigation
await clickSidebarNavItem(page, 'ลูกหนี้');

// Wait for navigation
await waitForNavigation(page);
```

#### Form Interactions

```typescript
import {
  fillField,
  fillForm,
  submitForm,
  selectOption,
  clickButton
} from '@/tests/utils';

// Fill single field by label
await fillField(page, 'ชื่อลูกค้า', 'Test Customer');

// Fill multiple fields
await fillForm(page, {
  'ชื่อลูกค้า': 'Test Customer',
  'อีเมล': 'test@example.com',
  'เบอร์โทรศัพท์': '0812345678'
});

// Select dropdown option
await selectOption(page, 'จังหวัด', 'Bangkok');

// Submit form
await submitForm(page);

// Click button
await clickButton(page, 'บันทึก');
```

#### Toast Notifications

```typescript
import { waitForToast, getToastMessage, waitForToastToDisappear } from '@/tests/utils';

// Wait for toast
await waitForToast(page);

// Get toast message
const message = await getToastMessage(page);
console.log('Toast:', message);

// Wait for toast to disappear
await waitForToastToDisappear(page);
```

#### Table Operations

```typescript
import {
  verifyTableRowCount,
  getTableRowData,
  findTableRowByText
} from '@/tests/utils';

// Verify row count
await verifyTableRowCount(page, 'table', 10);

// Get row data
const rowData = await getTableRowData(page, 0);
console.log('First row:', rowData);

// Find row by text
const rowIndex = await findTableRowByText(page, 'Test Customer');
if (rowIndex >= 0) {
  const data = await getTableRowData(page, rowIndex);
  console.log('Found:', data);
}
```

#### Dialog Operations

```typescript
import { openDialog, closeDialog } from '@/tests/utils';

// Open dialog
await openDialog(page, 'สร้างลูกค้าใหม่');

// Close dialog
await closeDialog(page);
```

#### Assertions

```typescript
import {
  verifyVisible,
  verifyHidden,
  verifyText,
  verifyContainsText,
  verifyUrl
} from '@/tests/utils';

// Verify element visible
await verifyVisible(page, '[data-card]');

// Verify element hidden
await verifyHidden(page, '.loading');

// Verify text content
await verifyText(page, 'h1', 'Dashboard');

// Verify contains text
await verifyContainsText(page, '.description', 'Welcome');

// Verify current URL
await verifyUrl(page, '/customers');
```

#### Debugging

```typescript
import { screenshotOnFailure, pause } from '@/tests/utils';

// Take screenshot
await screenshotOnFailure(page, 'my-test');

// Pause test execution (for debugging)
await pause(page, 'Check the state');
```

#### Advanced

```typescript
import { waitForApiResponse, retry, bypassRateLimiting } from '@/tests/utils';

// Wait for API response
const response = await waitForApiResponse(
  page,
  '/api/customers',
  async () => {
    await clickButton(page, 'บันทึก');
  }
);

// Retry flaky operation
const result = await retry(async () => {
  return await getRecordCount('customer');
}, 3, 1000);

// Bypass rate limiting
bypassRateLimiting(page);
```

### 3. Database Verification (`db-verification.ts`)

Direct database assertions using Prisma.

```typescript
import {
  verifyRecordCount,
  verifyRecordExists,
  verifyRecordValues,
  verifyRecordDeleted,
  getRecordCount,
  getAllRecords,
  getRecordById,
  verifyJournalEntry,
  verifyJournalEntryBalances,
  verifyStockMovement,
  getStockBalance,
  getAccountBalance,
  verifyDocumentStatus
} from '@/tests/utils';
```

#### Record Verification

```typescript
// Verify record count
const hasCorrectCount = await verifyRecordCount('customer', 10);
expect(hasCorrectCount).toBe(true);

// Verify record exists
const exists = await verifyRecordExists('customer', customerId);
expect(exists).toBe(true);

// Verify record values
const valuesMatch = await verifyRecordValues('customer', customerId, {
  name: 'Test Customer',
  email: 'test@example.com',
  status: 'ACTIVE'
});
expect(valuesMatch).toBe(true);

// Verify record was deleted
const deleted = await verifyRecordDeleted('customer', oldCustomerId);
expect(deleted).toBe(true);
```

#### Record Retrieval

```typescript
// Get record count
const count = await getRecordCount('customer');
console.log('Total customers:', count);

// Get all records
const customers = await getAllRecords('customer');
customers.forEach(c => console.log(c.name));

// Get specific record
const customer = await getRecordById('customer', customerId);
console.log('Found:', customer?.name);
```

#### Journal Entry Verification

```typescript
// Verify journal entry was created for document
const hasJournalEntry = await verifyJournalEntry('invoice', invoiceId);
expect(hasJournalEntry).toBe(true);

// Verify journal entry balances (debits = credits)
const balances = await verifyJournalEntryBalances(journalEntryId);
expect(balances).toBe(true);
```

#### Stock Verification

```typescript
// Verify stock movement
const movementCorrect = await verifyStockMovement(productId, 100);
expect(movementCorrect).toBe(true);

// Get current stock balance
const balance = await getStockBalance(productId, warehouseId);
console.log('Current stock:', balance);
```

#### Account Balances

```typescript
// Get account balance
const arBalance = await getAccountBalance('1201'); // Accounts Receivable
console.log('AR Balance:', arBalance);

expect(arBalance).toBeGreaterThan(0);
```

#### Document Status

```typescript
// Verify document status
const statusCorrect = await verifyDocumentStatus('invoice', invoiceId, 'POSTED');
expect(statusCorrect).toBe(true);
```

### 4. Test Data Factory (`test-data-factory.ts`)

Create test records programmatically.

```typescript
import {
  createTestCustomer,
  createTestVendor,
  createTestProduct,
  createTestWarehouse,
  createTestInvoice,
  createTestReceipt,
  createTestPayment,
  createTestScenario,
  createTestCustomers,
  createTestProducts,
  deleteTestData
} from '@/tests/utils';
```

#### Creating Single Records

```typescript
// Create customer
const customer = await createTestCustomer({
  name: 'Custom Customer',
  email: 'custom@example.com',
  creditLimit: 100000
});

// Create vendor
const vendor = await createTestVendor({
  name: 'Custom Vendor',
  paymentTerms: 45
});

// Create product
const product = await createTestProduct({
  name: 'Custom Product',
  code: 'PROD-001',
  price: 5000,
  vatType: 'INCLUSIVE'
});

// Create warehouse
const warehouse = await createTestWarehouse({
  name: 'Main Warehouse',
  code: 'WH-MAIN'
});
```

#### Creating Documents

```typescript
// Create invoice with items
const invoice = await createTestInvoice({
  customerId: customer.id,
  status: 'POSTED',
  items: [
    {
      productId: product1.id,
      quantity: 10,
      price: 1000,
      vatAmount: 700,
      total: 10700
    },
    {
      productId: product2.id,
      quantity: 5,
      price: 2000,
      vatAmount: 700,
      total: 10700
    }
  ]
});

// Create receipt
const receipt = await createTestReceipt({
  customerId: customer.id,
  amount: 5000,
  paymentMethod: 'BANK_TRANSFER'
});

// Create payment
const payment = await createTestPayment({
  vendorId: vendor.id,
  amount: 10000,
  paymentMethod: 'CHEQUE'
});
```

#### Creating Complete Scenarios

```typescript
// Create full test scenario with related records
const scenario = await createTestScenario();

// Scenario includes:
console.log('Customer:', scenario.customer.name);
console.log('Vendor:', scenario.vendor.name);
console.log('Products:', scenario.products.length); // 3 products
console.log('Warehouse:', scenario.warehouse.name);
console.log('Invoice:', scenario.invoice.invoiceNumber);
console.log('Receipt:', scenario.receipt.receiptNumber);
console.log('Payment:', scenario.payment.paymentNumber);
```

#### Bulk Creation

```typescript
// Create multiple customers
const customers = await createTestCustomers(10);
console.log(`Created ${customers.length} customers`);

// Create multiple products
const products = await createTestProducts(20);
console.log(`Created ${products.length} products`);
```

#### Cleanup

```typescript
// Delete all test data created by factory
await deleteTestData();
```

## Best Practices

### 1. Test Structure

```typescript
test.describe('Customer Management', () => {
  test.beforeAll(async () => {
    // One-time setup
    await seedTestData();
  });

  test.afterAll(async () => {
    // Cleanup
    await clearTestData();
    await disconnectDatabase();
  });

  test.beforeEach(async ({ page }) => {
    // Setup before each test
    await setupTest(page);
    await loginAs(page, 'ACCOUNTANT');
  });

  test.afterEach(async ({ page }, testInfo) => {
    // Screenshot on failure
    if (testInfo.status === 'failed') {
      await screenshotOnFailure(page, testInfo.title);
    }
  });

  test('should create customer', async ({ page }) => {
    // Test code here
  });
});
```

### 2. Using Test Context Helpers

```typescript
import { createTestContext, createTestWithDb } from '@/tests/utils';

test('example with context', async ({ page }) => {
  // Automatic setup + login
  const context = await createTestContext(page, 'ADMIN');

  // Test code...

  // Automatic cleanup
  await context.cleanup();
});

test('example with database', async ({ page }) => {
  // Automatic setup + login + seed data
  const { page: p, testIds, cleanup } = await createTestWithDb(page);

  // Use testIds directly
  await fillField(p, 'ลูกค้า', testIds.customerId);

  // Automatic cleanup
  await cleanup();
});
```

### 3. Error Handling

```typescript
test('with error handling', async ({ page }) => {
  try {
    await loginAs(page, 'ADMIN');
    // Test code...
  } catch (error) {
    await screenshotOnFailure(page, 'error');
    throw error; // Re-throw to fail test
  }
});
```

### 4. Making Tests Independent

```typescript
test('independent test 1', async ({ page }) => {
  const customer = await createTestCustomer();
  // Use customer...
  await deleteTestData(); // Cleanup
});

test('independent test 2', async ({ page }) => {
  const customer = await createTestCustomer();
  // Use customer...
  await deleteTestData(); // Cleanup
});
```

### 5. Performance Considerations

```typescript
test('performance example', async ({ page }) => {
  // Use waitForApiResponse instead of sleep
  const response = await waitForApiResponse(
    page,
    '/api/customers',
    async () => {
      await clickButton(page, 'บันทึก');
    }
  );

  // Use retry for flaky operations
  const result = await retry(async () => {
    return await getRecordCount('customer');
  });
});
```

## Running Tests

```bash
# Run all E2E tests
bun run test:e2e

# Run specific test file
bun run test:e2e tests/login.spec.ts

# Run with UI mode
bun run test:e2e:ui

# Run with debug mode
bun run test:e2e --debug

# Run specific test
bun run test:e2e -g "should create customer"
```

## Troubleshooting

### Database Connection Issues

```typescript
// Ensure database is connected
import { getPrisma } from '@/tests/utils/db-verification';

const prisma = getPrisma();
await prisma.$connect();
```

### Test Data Cleanup

```typescript
// Clear all test data
import { clearTestData } from '@/tests/utils';

await clearTestData();
```

### Rate Limiting

```typescript
// Bypass rate limiting for tests
import { bypassRateLimiting } from '@/tests/utils';

await bypassRateLimiting(page);
```

### Timeout Issues

```typescript
import { TIMEOUTS } from '@/tests/utils';

// Increase timeout for specific test
test.setTimeout(TIMEOUTS.XLONG);

// Or use page timeout
await page.waitForSelector('.element', { timeout: TIMEOUTS.LONG });
```

## Examples

See `/tests/examples/test-utilities-example.spec.ts` for comprehensive examples of:
- Basic test operations
- Database verification
- UI interactions
- Form submissions
- Table operations
- Toast handling
- API response testing
- Error handling
- Performance testing

## Contributing

When adding new utilities:

1. Follow existing patterns
2. Add TypeScript types
3. Include JSDoc comments
4. Add examples to README
5. Update example test file
6. Test thoroughly

## License

MIT - Part of Thai Accounting ERP System
