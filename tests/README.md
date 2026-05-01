# Thai Accounting ERP - Test Documentation

## Overview

This directory contains comprehensive test orchestration for the Thai Accounting
ERP system. The test suite covers all 16 modules with automated database
verification, screenshot capture, and detailed reporting.

## Test Structure

```
tests/
├── master-test-runner.ts        # Main test orchestration
├── test-suites.json             # Test suite configuration
├── reporters/
│   ├── database-reporter.ts     # Database state tracking
│   └── template.html            # HTML report template
├── scripts/
│   ├── test-quick.sh            # Quick smoke tests
│   ├── test-full.sh             # Full test suite
│   ├── test-module.sh           # Module-specific tests
│   └── verify-database.sh       # Database integrity check
└── README.md                    # This file
```

## Prerequisites

### Required Software

- **Node.js**: v20 or higher
- **Bun**: Latest version (for running the application)
- **Playwright**: Installed via `npm install`
- **Prisma CLI**: For database operations

### Database Setup

1. **Generate Prisma Client**:

   ```bash
   bun run db:generate
   ```

2. **Push Schema to Database**:

   ```bash
   bun run db:push
   ```

3. **Seed Database** (optional but recommended):
   ```bash
   bun run seed
   ```

### Dev Server

Most tests require the development server to be running:

```bash
bun run dev
```

The test scripts will automatically start the server if it's not running.

## Running Tests Locally

### Quick Smoke Tests

Run only critical and high-priority tests for fast feedback:

```bash
./scripts/test-quick.sh
```

**Duration**: ~2-3 minutes **Coverage**: Authentication, navigation, core
accounting features

### Full Test Suite

Run all comprehensive tests with database verification:

```bash
./scripts/test-full.sh
```

**Duration**: ~15-20 minutes **Coverage**: All 16 modules, database integrity,
GL posting

**Options**:

- `--no-db-verify` - Skip database verification
- `--parallel` - Run tests in parallel (default)
- `--sequential` - Run tests sequentially

### Module-Specific Tests

Run tests for a specific module:

```bash
./scripts/test-module.sh <module-name>
```

**Examples**:

```bash
./scripts/test-module.sh inventory
./scripts/test-module.sh @smoke
./scripts/test-module.sh "@critical and @smoke"
```

### Using Playwright Directly

Run all Playwright tests:

```bash
npx playwright test
```

Run specific test file:

```bash
npx playwright test e2e/agents/01-auth-navigation.spec.ts
```

Run with UI mode:

```bash
npx playwright test --ui
```

Run with headed mode (see browser):

```bash
npx playwright test --headed
```

## Running Tests in CI

### GitHub Actions

Tests automatically run on:

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Manual workflow dispatch

The CI pipeline:

1. Checks out code
2. Sets up Node.js and Bun
3. Installs dependencies
4. Generates Prisma client
5. Sets up database
6. Installs Playwright browsers
7. Starts dev server
8. Runs smoke tests
9. Runs full E2E tests
10. Uploads artifacts (reports, screenshots, database)
11. Comments on PR with results

### Local CI Simulation

Simulate the CI pipeline locally:

```bash
# Install dependencies
bun install

# Setup database
bun run db:push
bun run seed

# Run tests
npx playwright test --reporter=html

# Verify database
./scripts/verify-database.sh
```

## Test Modules

### Core Modules (High Priority)

1. **Authentication & Navigation**
   - Login/logout functionality
   - Session management
   - Sidebar navigation (all 16 items)
   - Role-based access control

2. **Chart of Accounts**
   - Account creation/editing
   - Hierarchical structure
   - Account types validation
   - Thai standard accounts (181 seeded)

3. **Journal Entries**
   - Double-entry bookkeeping
   - Debit/credit validation
   - Auto-balancing
   - GL posting

4. **Customers & Accounts Receivable**
   - Customer management
   - Sales invoices
   - Receipts
   - Aging reports

5. **Vendors & Accounts Payable**
   - Vendor management
   - Purchase invoices
   - Payments
   - Aging reports

### Tax Modules (High Priority)

6. **VAT Management**
   - VAT calculation (7%)
   - Input/output tracking
   - VAT reports
   - Thai Revenue Department compliance

7. **Withholding Tax**
   - PND3 (salary/wages)
   - PND53 (services/rent)
   - 50 Tawi PDF generation
   - Certificate management

### Expansion Modules (Medium Priority)

8. **Inventory Management**
   - Stock tracking
   - Multi-warehouse support
   - WAC costing
   - Stock movements
   - COGS calculation

9. **Fixed Assets**
   - Asset registration
   - TAS 16 depreciation
   - Net book value
   - Monthly depreciation entries

10. **Banking & Cheques**
    - Bank account management
    - Cheque lifecycle
    - Reconciliation
    - Cheque clearing

11. **Petty Cash**
    - Fund management
    - Voucher system
    - Reimbursements
    - Balance tracking

12. **Payroll**
    - Employee management
    - SSC calculations
    - PND1 tax withholding
    - Payroll runs
    - Salary processing

### Admin Modules (Medium Priority)

13. **Financial Reports**
    - Trial Balance
    - Balance Sheet
    - Profit & Loss
    - VAT reports
    - WHT reports

14. **Settings & Administration**
    - Company settings
    - User management
    - Role assignments
    - Configurations

### Comprehensive Tests

15. **UI-DB Alignment**
    - Verify UI data matches database
    - Cross-module consistency
    - Data integrity checks

16. **Full Coverage**
    - All 16 modules
    - Error monitoring
    - Performance tracking
    - Screenshot capture

## Test Tags

Tests are tagged for easy filtering:

- `@smoke` - Critical path tests (quick feedback)
- `@critical` - Critical priority tests
- `@high` - High priority tests
- `@medium` - Medium priority tests
- `@low` - Low priority tests
- `@compliance` - Tax compliance tests
- `@expansion` - Expansion module tests
- `@pdf` - PDF generation tests
- `@auth` - Authentication tests
- `@database` - Database verification tests

**Usage**:

```bash
npx playwright test --grep "@smoke"
npx playwright test --grep "@critical and not @pdf"
```

## Database Verification

### Automatic Verification

The test suite automatically verifies database integrity:

- Record counts before/after each test
- Journal entry balance validation
- Orphaned record detection
- Referential integrity checks

### Manual Verification

Run manual database verification:

```bash
./scripts/verify-database.sh
```

**Checks**:

- Record counts for all tables
- Journal entry debit/credit balance
- Orphaned records (customers, invoices, receipts, payments)
- Foreign key violations

### Database State Snapshots

The `database-reporter.ts` captures database state:

```json
{
  "timestamp": "2025-03-13T10:00:00.000Z",
  "testName": "should create customer",
  "recordCounts": {
    "Customer": 10,
    "Invoice": 5,
    "JournalEntry": 8
  },
  "journalEntryBalance": 0,
  "integrityIssues": [],
  "orphanedRecords": []
}
```

## Test Reports

### HTML Reports

Generated automatically after test runs:

```bash
open playwright-report/index.html
```

**Features**:

- Test results overview
- Per-test details
- Screenshots of failures
- Timeline visualization
- Error messages

### Master Test Runner Report

Comprehensive report with database verification:

```bash
npx ts-node tests/master-test-runner.ts
```

**Output**:

- `test-results/html/master-report-*.html` - Visual report
- `test-results/json/master-report-*.json` - Raw data

**Sections**:

- Executive summary
- Pass/fail statistics
- Per-module results
- Database changes
- Performance metrics
- Screenshot gallery

### Database Reports

Per-test database verification reports:

```bash
ls test-results/database/
```

**Files**:

- `database-summary.json` - Summary of all tests
- `<suite>-<test>.json` - Per-test details

## Writing New Tests

### Test File Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Module Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    await page.goto('http://localhost:3000');
    await login(page);
  });

  test('should do something', async ({ page }) => {
    // Test implementation
    await page.click('button');
    await expect(page).toHaveURL(/expected-url/);
  });
});
```

### Test Tags

Add tags to tests for filtering:

```typescript
test('should create customer', async ({ page }) => {
  // Test implementation
});

test('@smoke @critical should login', async ({ page }) => {
  // Test implementation
});
```

### Database Verification

Use the database reporter:

```typescript
// playwright.config.ts
export default defineConfig({
  reporter: [
    ['html'],
    [
      'tests/reporters/database-reporter.ts',
      {
        outputDir: 'test-results/database',
      },
    ],
  ],
});
```

### Best Practices

1. **Use Page Object Model**:

   ```typescript
   class CustomerPage {
     constructor(private page: Page) {}

     async goto() {
       await this.page.goto('/customers');
     }

     async createCustomer(data: CustomerData) {
       await this.page.fill('[name="name"]', data.name);
       await this.page.click('button[type="submit"]');
     }
   }
   ```

2. **Use Test Data Fixtures**:

   ```typescript
   const testCustomer = {
     name: 'Test Customer',
     taxId: '1234567890123',
     email: 'test@example.com',
   };

   test('should create customer', async ({ page }) => {
     await createCustomer(page, testCustomer);
     // Assertions...
   });
   ```

3. **Wait for Network Idle**:

   ```typescript
   await page.waitForLoadState('networkidle');
   ```

4. **Use Playwright Assertions**:

   ```typescript
   await expect(page.locator('.success-message')).toBeVisible();
   await expect(page).toHaveTitle(/Customer/);
   ```

5. **Clean Up Test Data**:
   ```typescript
   test.afterEach(async ({ page }) => {
     // Clean up created records
     await deleteTestCustomer(page);
   });
   ```

## Troubleshooting

### Common Issues

#### 1. Dev Server Not Running

**Error**: `connect ECONNREFUSED localhost:3000`

**Solution**: Start the dev server:

```bash
bun run dev
```

The test scripts will auto-start the server if needed.

#### 2. Database Not Found

**Error**: `Table does not exist`

**Solution**:

```bash
bun run db:push
bun run seed
```

#### 3. Timeout Errors

**Error**: `Test timeout of 60000ms exceeded`

**Solution**: Increase timeout for specific tests:

```typescript
test.setTimeout(120000);
```

Or in `playwright.config.ts`:

```typescript
export default defineConfig({
  timeout: 120000,
});
```

#### 4. Browser Not Installed

**Error**: `Executable doesn't exist`

**Solution**: Install Playwright browsers:

```bash
npx playwright install
```

#### 5. Rate Limiting

**Error**: `Too many requests`

**Solution**: Tests use `x-playwright-test: true` header to bypass rate
limiting. Ensure this is set in `src/middleware.ts`.

#### 6. Screenshot Capture Failures

**Error**: Screenshots not saving

**Solution**: Ensure screenshot directory exists:

```bash
mkdir -p test-results/screenshots
```

#### 7. Database Verification Errors

**Error**: Journal entries not balanced

**Solution**: This indicates a test failure. Check the test implementation for
proper GL posting.

## Test Data Management

### Seed Data

Default seed data includes:

- 181 Thai chart of accounts
- 4 test users (admin, accountant, user, viewer)
- Default company settings

### Test Data Isolation

Tests should:

1. Create their own test data
2. Clean up after execution
3. Use unique identifiers (timestamps, UUIDs)
4. Not depend on shared state

### Database Reset

To reset the database completely:

```bash
bun run db:reset
bun run seed
```

**Warning**: This destroys all data!

## Performance Optimization

### Parallel Execution

Tests run in parallel by default (3 workers). Adjust in `playwright.config.ts`:

```typescript
export default defineConfig({
  workers: 4,
});
```

### Test Isolation

Each test should:

- Use fresh browser context
- Clean up after itself
- Not depend on other tests

### Database Verification

Disable database verification for faster runs:

```bash
./scripts/test-full.sh --no-db-verify
```

## Continuous Integration

### GitHub Actions

See `.github/workflows/e2e-tests.yml` for CI configuration.

### Status Badges

Add to README.md:

```markdown
![E2E Tests](https://github.com/your-org/Thai-acc/workflows/E2E%20Tests/badge.svg)
```

## Support

For issues or questions:

1. Check this documentation
2. Review Playwright docs: https://playwright.dev
3. Check test output logs
4. Review database verification reports
5. Inspect screenshots for failures

## Summary

| Test Type       | Duration  | Coverage       | When to Run        |
| --------------- | --------- | -------------- | ------------------ |
| Quick Smoke     | 2-3 min   | Critical paths | Before commits     |
| Full Suite      | 15-20 min | All modules    | Before PRs         |
| Module Test     | 5-10 min  | Single module  | During development |
| Database Verify | 1-2 min   | Data integrity | After tests        |

**Recommended Workflow**:

1. Run quick tests before committing
2. Run module tests while developing
3. Run full tests before creating PR
4. Verify database after test runs
5. Review HTML reports for failures
