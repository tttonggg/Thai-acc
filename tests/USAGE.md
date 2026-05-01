# Master Test Orchestration - Quick Start Guide

## Overview

The Master Test Orchestration system provides comprehensive testing for the Thai
Accounting ERP with:

- **16 test suites** covering all modules
- **Database verification** with integrity checks
- **HTML reports** with screenshots and metrics
- **CI/CD integration** with GitHub Actions
- **Multiple execution modes** (quick, full, module-specific)

## Quick Start

### 1. Prerequisites

```bash
# Install dependencies
bun install

# Setup database
bun run db:generate
bun run db:push
bun run seed
```

### 2. Run Quick Tests (2-3 minutes)

```bash
bun run test:quick
```

Runs critical smoke tests for fast feedback.

### 3. Run Full Tests (15-20 minutes)

```bash
bun run test:full
```

Runs all test suites with database verification.

### 4. Run Module-Specific Tests

```bash
bun run test:module inventory
bun run test:module "@smoke"
bun run test:module "@critical and @smoke"
```

### 5. Generate Master Report

```bash
bun run test:master
```

Creates comprehensive HTML report with all metrics.

## Test Scripts

| Script                       | Duration  | Coverage      | Use Case           |
| ---------------------------- | --------- | ------------- | ------------------ |
| `bun run test:quick`         | 2-3 min   | Smoke tests   | Before commits     |
| `bun run test:full`          | 15-20 min | All modules   | Before PRs         |
| `bun run test:module <name>` | 5-10 min  | Single module | During development |
| `bun run test:e2e`           | 15-20 min | All modules   | Playwright direct  |
| `bun run test:e2e:ui`        | -         | Interactive   | Debugging          |
| `bun run test:verify-db`     | 1-2 min   | Database      | Integrity check    |
| `bun run test:master`        | 20-25 min | All + reports | Comprehensive      |

## Test Modules

### Critical Priority (smoke tests)

1. **Authentication & Navigation** - Login, logout, sidebar
2. **Chart of Accounts** - Account management
3. **Journal Entries** - Double-entry bookkeeping
4. **Customers & AR** - Sales, invoices, receipts
5. **Vendors & AP** - Purchases, payments
6. **VAT Management** - Tax calculation

### High Priority

7. **Withholding Tax** - PND3/PND53, 50 Tawi
8. **Financial Reports** - Balance Sheet, P&L

### Medium Priority

9. **Inventory** - Stock, warehouses, WAC
10. **Fixed Assets** - Depreciation, TAS 16
11. **Banking** - Cheques, reconciliation
12. **Petty Cash** - Funds, vouchers
13. **Payroll** - SSC, PND1, payroll runs
14. **Settings** - Admin, user management

### Comprehensive

15. **UI-DB Alignment** - Data consistency
16. **Full Coverage** - All modules with error monitoring

## Reports

### HTML Reports

```bash
# Playwright report
open playwright-report/index.html

# Master test report
open test-results/html/master-report-*.html
```

### Database Reports

```bash
# Summary
cat test-results/database/database-summary.json

# Per-test
ls test-results/database/
```

### Screenshots

```bash
# View failure screenshots
open test-results/screenshots/
```

## CI/CD

### GitHub Actions

Tests run automatically on:

- Push to `main` or `develop`
- Pull requests
- Manual dispatch

### Artifacts

- `playwright-report/` - HTML reports
- `test-screenshots/` - Failure screenshots
- `test-database/` - Database snapshot

## Troubleshooting

### Dev server not running

```bash
bun run dev
```

### Database errors

```bash
bun run db:push
bun run seed
```

### Timeout errors

```bash
# Increase timeout in playwright.config.ts
timeout: 120000
```

### Browser not installed

```bash
npx playwright install
```

## Best Practices

1. **Before committing**: Run `bun run test:quick`
2. **Before PR**: Run `bun run test:full`
3. **While developing**: Run `bun run test:module <name>`
4. **After tests**: Run `bun run test:verify-db`
5. **Review failures**: Check HTML reports and screenshots

## Documentation

See `tests/README.md` for comprehensive documentation including:

- Detailed test descriptions
- Writing new tests
- Database verification
- Performance optimization
- Troubleshooting guide

## Support

For issues:

1. Check test output logs
2. Review HTML reports
3. Check database verification
4. Inspect screenshots
5. See tests/README.md
