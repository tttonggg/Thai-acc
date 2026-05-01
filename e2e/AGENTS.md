# AGENTS.md - E2E Testing Suite

This file provides essential guidance for AI coding agents working on the **E2E
Testing Suite** for the Thai Accounting ERP System. The suite contains 67
Playwright test files with 21,421 lines of comprehensive test coverage.

## Parent Reference

See [../AGENTS.md](../AGENTS.md) for general project overview and core system
documentation.

## Test Suite Overview

### Test Organization

The E2E tests are organized into 6 main categories:

#### 🤖 **agents/** - E2E Test Agents

- **8 agent files** covering specialized testing domains
- Each agent focuses on specific functionality areas
- Implement shared patterns and standardized test structures

**Agent Categories:**

- `01-auth-navigation.spec.ts` - Authentication and navigation flows
- `02-core-financial.spec.ts` - Core financial transactions (invoices, receipts,
  payments)
- `03-sales-ar.spec.ts` - Sales and accounts receivable workflows
- `04-tax-modules.spec.ts` - VAT and WHT tax modules
- `05-expansion-modules.spec.ts` - All 6 expansion modules
- `06-admin-modules.spec.ts` - Administrative functions and user management
- `07-ui-db-alignment.spec.ts` - UI and database synchronization
- `99-full-coverage-test.spec.ts` - Complete end-to-end coverage

#### 📋 **comprehensive/** - Comprehensive Test Suites

- **18 module-specific files** covering all system modules
- Test every button, form field, and functionality
- Database verification integration
- Performance monitoring

**Module Coverage:**

- `accounts.spec.ts` - Chart of accounts management
- `customers.spec.ts` - Customer master data
- `vendors.spec.ts` - Vendor master data
- `products.spec.ts` - Product inventory
- `invoices.spec.ts` - Sales invoice workflows
- `purchases.spec.ts` - Purchase workflows
- `assets.spec.ts` - Fixed assets
- `debit-notes.spec.ts` - Debit note processing
- `receipts.spec.ts` - Receipt processing
- `inventory.spec.ts` - Stock management
- `banking.spec.ts` - Banking transactions
- `credit-notes.spec.ts` - Credit note processing
- `petty-cash.spec.ts` - Petty cash operations
- `payments.spec.ts` - Payment processing
- `payroll.spec.ts` - Payroll calculations
- `void-reverse-pagination.spec.ts` - Void and reverse operations

#### 🧪 **comprehensive/** - Additional Test Components

- `test-helpers.ts` - Shared utilities and login functions
- `README.md` - Comprehensive testing documentation
- `TEST_TEMPLATES.md` - Test structure templates

#### 🔄 **workflows/** - Workflow Integration Tests

- **5 workflow files** testing end-to-end business processes
- Integration between multiple modules
- Data flow and state verification

**Workflows Covered:**

- `invoice-workflow.spec.ts` - Complete invoice lifecycle
- `journal-workflow.spec.ts` - Journal entry creation and posting
- `inventory-workflow.spec.ts` - Stock management workflows
- `payroll-workflow.spec.ts` - Payroll processing cycle
- `reporting.spec.ts` - Financial report generation

#### 📊 **performance/** - Performance Tests

- `performance.spec.ts` - Page load times and performance metrics
- Database query validation
- Memory leak detection

#### 👁️ **visual/** - Visual Regression Tests

- `visual-regression.spec.ts` - UI consistency verification
- Cross-browser compatibility
- Responsive design validation

#### 🎯 **Critical Path Tests**

- `critical-workflows.spec.ts` - Business-critical workflows
- `login.spec.ts` - Authentication flows
- `dashboard.spec.ts` - Key dashboard functionality
- Navigation and menu validation

## Test Configuration

### Playwright Configuration (`/Users/tong/Thai-acc/playwright.config.ts`)

**Key Settings:**

- **Base URL:** `http://localhost:3000`
- **Test Timeout:** 60 seconds per test
- **Retries:** 2 in CI, 0 locally
- **Workers:** 1 in CI for stability
- **Browsers:** Chromium, Firefox, WebKit, Microsoft Edge
- **Mobile:** iPhone 12, iPhone SE, Galaxy S8, iPad, iPad Pro
- **Locale:** Thai (th-TH), Asia/Bangkok timezone

### Rate Limiting Bypass

**Critical Configuration:** All tests use the `x-playwright-test: true` header
to bypass rate limiting.

**Usage Patterns:**

```typescript
test.use({
  extraHTTPHeaders: { 'x-playwright-test': 'true' },
});

// Or in individual test files:
await page.setExtraHTTPHeaders({ 'x-playwright-test': 'true' });
```

**Why This Matters:** The application implements rate limiting for security, but
tests need rapid execution without delays. This header bypasses rate limiting
while maintaining security in production.

## Test Credentials and Users

### Standard Test Users

```typescript
const TEST_USERS = {
  admin: {
    email: 'admin@thaiaccounting.com',
    password: 'admin123',
    role: 'ADMIN',
  },
  accountant: {
    email: 'accountant@thaiaccounting.com',
    password: 'acc123',
    role: 'ACCOUNTANT',
  },
  user: { email: 'user@thaiaccounting.com', password: 'user123', role: 'USER' },
  viewer: {
    email: 'viewer@thaiaccounting.com',
    password: 'viewer123',
    role: 'VIEWER',
  },
};
```

### Test Data Patterns

- Customers: `CUST001`, `บริษัท ทดสอบ จำกัด`, Tax ID: `1234567890123`
- Vendors: `VEND001`, `บริษัท ผู้ขายทดสอบ จำกัด`, Tax ID: `9876543210987`
- Products: `PROD001`, `สินค้าทดสอบ`, Unit Price: ฿1,000
- Services: `SERV001`, `บริการทดสอบ`, Unit Price: ฿5,000

## How to Run Tests

### Test Commands

```bash
# Full E2E suite
npx playwright test

# Run specific category
npx playwright test e2e/agents/
npx playwright test e2e/comprehensive/
npx playwright test e2e/workflows/

# Run specific test file
npx playwright test e2e/agents/01-auth-navigation.spec.ts

# Run with UI mode (for debugging)
npx playwright test --ui

# Run with headed mode (visual debugging)
npx playwright test --headed

# Run specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox

# Run mobile tests
npx playwright test e2e/mobile-responsive.spec.ts --project='Mobile Chrome'

# Run performance tests
npx playwright test e2e/performance.spec.ts

# Run visual regression tests
npx playwright test e2e/visual-regression.spec.ts

# Run with CI configuration
CI=true npx playwright test
```

### Quick Test Options

```bash
# Quick smoke tests
./scripts/test-quick.sh

# Full E2E suite
./scripts/test-full.sh

# Module-specific tests
./scripts/test-module.sh <module-name>

# Currency-related tests
./scripts/run-automation-tests.sh

# Scheduled tests
./scripts/test-scheduler.sh
```

## Test Patterns and Best Practices

### 1. Test Structure Patterns

#### Agent Tests

```typescript
test.describe('Agent Category', () => {
  test('should perform specific functionality', async ({ page }) => {
    // Setup
    // Action
    // Assertion
  });
});
```

#### Comprehensive Module Tests

```typescript
test.describe('Module Name - Comprehensive Tests', () => {
  let loginPage: LoginPage;
  let modulePage: ModulePage;

  test.beforeAll(async ({ browser }) => {
    // Setup shared resources
  });

  test('should display main page elements', async ({ page }) => {
    // UI verification
  });

  test('should create new record', async ({ page }) => {
    // Creation workflow
  });
});
```

#### Workflow Tests

```typescript
test.describe('Business Workflow', () => {
  test('should complete full process flow', async ({ page }) => {
    // Step 1: Create initial data
    // Step 2: Process transaction
    // Step 3: Verify results
    // Step 4: Check database state
  });
});
```

### 2. Login Pattern

#### Standard Login

```typescript
await page.goto('/');
await page.fill('input[type="email"]', 'admin@thaiaccounting.com');
await page.fill('input[type="password"]', 'admin123');
await page.click('button:has-text("เข้าสู่ระบบ")');
```

#### Role-Based Login

```typescript
async function loginAs(page: Page, role: keyof typeof TEST_CREDENTIALS) {
  const credentials = TEST_CREDENTIALS[role];
  await login(page, credentials.email, credentials.password);
}
```

### 3. Database Verification Pattern

```typescript
import {
  verifyRecordCount,
  verifyRecordExists,
  verifyJournalEntry,
} from '../../tests/utils/db-verification';

// Verify record creation
await verifyRecordCount('Invoice', 1);

// Verify specific record exists
const invoice = await verifyRecordExists('Invoice', {
  invoiceNumber: 'INV-001',
});

// Verify journal entry was created
await verifyJournalEntry(invoice.journalEntryId);
```

### 4. Navigation Pattern

```typescript
// Sidebar navigation
const navItems = [
  { id: 'dashboard', label: 'ภพรวม' },
  { id: 'invoices', label: 'ใบกำกับภาษี' },
  // ... other items
];

for (const navItem of navItems) {
  await page.click(`nav:has-text("${navItem.label}")`);
  await expect(page.locator(`h1:has-text("${navItem.label}")`)).toBeVisible();
}
```

### 5. Financial Testing Patterns

#### Currency Handling

```typescript
// Input validation
const inputAmount = '1,234.56';
const expectedSatang = 123456; // Database stores in Satang

// Create invoice with amount
await page.fill('input[name="amount"]', inputAmount);
await expect(page.locator('.amount-display')).toHaveText('฿1,234.56');
```

#### VAT Calculations

```typescript
// Expected calculations (7% VAT)
const calculations = {
  line1: { qty: 5, price: 1000, amount: 5000, vat: 350 },
  line2: { qty: 1, price: 5000, amount: 5000, vat: 350 },
  subtotal: 10000,
  totalVat: 700,
  total: 10700,
};
```

## Test Categories and Coverage

### Test Tags

- `@smoke` - Critical path verification
- `@critical` - Business-critical workflows
- `@high` - High priority functionality
- `@medium` - Standard functionality
- `@low` - Optional features
- `@compliance` - Regulatory and tax compliance
- `@expansion` - Expansion modules
- `@pdf` - Document generation
- `@auth` - Authentication flows
- `@database` - Database operations

### Browser Matrix

| Browser  | Desktop | Mobile | CI Headless |
| -------- | ------- | ------ | ----------- |
| Chromium | ✅      | ✅     | ✅          |
| Firefox  | ✅      | ❌     | ❌          |
| WebKit   | ✅      | ❌     | ❌          |
| Edge     | ✅      | ❌     | ❌          |

### Mobile Devices

- iPhone 12 (iOS)
- iPhone SE (iOS)
- Galaxy S8 (Android)
- iPad (iOS)
- iPad Pro (iOS)

## Testing Best Practices

### 1. Test Isolation

- Each test should be independent
- Clean up test data after each test
- Use unique identifiers for test records

### 2. Performance Testing

- Monitor page load times
- Check database query efficiency
- Validate memory usage patterns

### 3. Cross-Browser Testing

- Test on all supported browsers
- Validate responsive design
- Check for browser-specific bugs

### 4. Database Validation

- Verify data integrity after operations
- Check journal entry creation
- Validate audit trail logging

### 5. Error Handling

- Test error scenarios
- Validate error messages
- Check recovery mechanisms

### 6. Security Testing

- Verify authentication flows
- Test authorization levels
- Check for security vulnerabilities

## Test Reports and Artifacts

### Output Directories

- `playwright-report/` - HTML reports with screenshots
- `test-results/` - JSON and JUnit results
- `e2e/comprehensive/logs/` - Detailed test execution logs

### Report Types

- **HTML Reports**: Detailed browser-like view with screenshots
- **JSON Results**: Machine-readable test data
- **JUnit XML**: CI/CD integration format
- **Console Logs**: Real-time test execution feedback

## Critical Test Scenarios

### 1. Authentication Tests

- Login with valid credentials
- Login with invalid credentials
- Session management
- Role-based access control

### 2. Navigation Tests

- Sidebar menu items
- URL routing
- Page loading
- Breadcrumb navigation

### 3. Financial Transaction Tests

- Invoice creation and approval
- Payment processing
- Journal entry generation
- VAT calculation

### 4. Integration Tests

- Cross-module data flow
- Database synchronization
- API consistency
- UI responsiveness

### 5. Performance Tests

- Page load optimization
- Database query performance
- Memory usage
- Concurrent user simulation

## Test Data Management

### Test Data Cleanup

```typescript
test.afterAll(async ({ page }) => {
  // Clean up test invoices
  await prisma.invoice.deleteMany({
    where: { invoiceNumber: { startsWith: 'TEST-' } },
  });
});
```

### Test Data Persistence

- Use unique identifiers for test records
- Avoid conflicts with production data
- Maintain data consistency across tests

## Development Workflow

### Adding New Tests

1. Create test file in appropriate directory
2. Follow naming conventions: `[category]-[module]-spec.ts`
3. Use established patterns and utilities
4. Include database verification
5. Add to appropriate test categories

### Test Maintenance

- Update tests when UI changes
- Verify test data remains valid
- Update expected values as requirements change
- Remove obsolete test files

### CI/CD Integration

- Tests run on every commit
- Full suite executes in CI environment
- Performance tests monitor regression
- Reports generated for review

## Troubleshooting

### Common Issues

1. **Rate Limiting**: Ensure `x-playwright-test: true` header is present
2. **Database State**: Reset database before full test runs
3. **Authentication**: Verify test credentials are correct
4. **Browser Timing**: Use appropriate wait times for async operations

### Debug Commands

```bash
# Run single test with debugging
npx playwright test e2e/agents/01-auth-navigation.spec.ts --headed

# Run with trace capture
npx playwright test --trace on

# Run with specific timeout
npx playwright test --timeout 30000
```

---

**Note**: This E2E suite provides comprehensive coverage of the Thai Accounting
ERP System. Always run tests before deployment to ensure system reliability and
functionality.
