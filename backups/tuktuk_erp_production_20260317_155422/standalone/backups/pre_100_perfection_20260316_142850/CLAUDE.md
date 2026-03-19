# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Thai Accounting ERP System** (โปรแกรมบัญชีมาตรฐานไทย) - a comprehensive accounting application designed for Thai SME businesses, complying with Thai Financial Reporting Standards (TFRS).

**Key Technologies**: Next.js 16 (App Router), TypeScript 5, Prisma ORM, SQLite, shadcn/ui, NextAuth.js, TanStack Query, Zustand

**Implementation Status**: ✅ **100% COMPLETE** - All 6 expansion modules fully implemented and integrated (WHT, Inventory, Fixed Assets, Banking, Petty Cash, Payroll)

## Development Commands

```bash
# Development
bun run dev          # Start dev server on port 3000
bun run build        # Build for production (standalone output)
bun run start        # Start production server with Bun
bun run lint         # Run ESLint

# Database Operations
bun run db:generate  # Generate Prisma client (run after schema changes)
bun run db:push      # Push schema to database without migrations
bun run db:migrate   # Create and run migrations
bun run db:reset     # Reset database (WARNING: destroys all data)

# Database Seeding
npx prisma db seed   # Seed database with initial Thai chart of accounts (181 accounts)
bun run seed         # Alternative seeding via ts-node
bun run seed:fresh   # Reset database then seed (WARNING: destroys all data)
```

**Important**: Always run `bun run db:generate` after modifying `prisma/schema.prisma`.

## Testing Commands

### Quick Testing (2-3 minutes)

```bash
# Run smoke tests - critical paths only
bun run test:quick
# OR
./scripts/test-quick.sh
```

### Full Testing (15-20 minutes)

```bash
# Run complete E2E test suite
bun run test:full
# OR
./scripts/test-full.sh

# Run with Playwright directly
bun run test:e2e

# Run with UI mode (interactive)
bun run test:e2e:ui
```

### Module-Specific Testing

```bash
# Test specific module
./scripts/test-module.sh inventory
./scripts/test-module.sh "@smoke"
./scripts/test-module.sh "@critical and @compliance"

# Run tests by tag
npx playwright test --grep "@smoke"
npx playwright test --grep "@critical and not @pdf"
```

### Database Verification

```bash
# Verify database integrity after tests
bun run test:verify-db
# OR
./scripts/verify-database.sh
```

**Checks performed**:
- Record counts for all tables
- Journal entry debit/credit balance
- Orphaned records (customers, invoices, receipts, payments without company/journal entry)
- Foreign key violations

### Unit Testing

```bash
# Run Vitest unit tests
bun run test

# Run once (watch mode disabled)
bun run test:run

# Run with coverage report
bun run test:coverage
```

## Production Scripts

The `/scripts/` directory contains utility scripts for production deployment and monitoring:

### Server Management

```bash
# Start production server
./scripts/start-production.sh

# Stop production server
./scripts/stop-production.sh

# Restart production server
./scripts/restart-production.sh
```

### Health Monitoring

```bash
# Check production server health
./scripts/health-check.sh
```

**Health checks include**:
- Server process running
- Port accessibility (localhost:3000)
- Database file existence and readability
- Authentication endpoint responsiveness
- Log analysis for recent errors
- Disk space usage

### Deployment Verification

```bash
# Verify deployment after build
./scripts/verify-deployment.sh
```

## Testing Architecture

### Test Tags

Tests are organized by tags for selective execution:

- `@smoke` - Critical path tests (authentication, navigation, core features)
- `@critical` - Critical priority tests
- `@high` - High priority tests
- `@medium` - Medium priority tests
- `@low` - Low priority tests
- `@compliance` - Tax compliance tests (VAT, WHT, PND1)
- `@expansion` - Expansion module tests (Inventory, Assets, Banking, etc.)
- `@pdf` - PDF generation tests (50 Tawi, invoices, receipts)
- `@auth` - Authentication and authorization tests
- `@database` - Database verification tests

### Test Structure

```
tests/
├── master-test-runner.ts        # Main test orchestration
├── test-suites.json             # Test suite configuration
├── reporters/
│   ├── database-reporter.ts     # Database state tracking
│   └── template.html            # HTML report template
└── README.md                    # Comprehensive test documentation
```

### Test Modules Coverage

The test suite covers all 16 modules:

1. **Authentication & Navigation** - Login/logout, session management, all 16 sidebar items
2. **Chart of Accounts** - Account CRUD, hierarchical structure, 181 Thai standard accounts
3. **Journal Entries** - Double-entry bookkeeping, auto-balancing, GL posting
4. **Customers & AR** - Customer management, sales invoices, receipts, aging
5. **Vendors & AP** - Vendor management, purchase invoices, payments, aging
6. **VAT Management** - 7% VAT calculation, input/output tracking, Thai Revenue Dept compliance
7. **Withholding Tax** - PND3/PND53, 50 Tawi PDF generation
8. **Inventory** - Stock tracking, multi-warehouse, WAC costing, COGS
9. **Fixed Assets** - Asset registration, TAS 16 depreciation, net book value
10. **Banking** - Bank accounts, cheque lifecycle, reconciliation
11. **Petty Cash** - Fund management, voucher system, reimbursements
12. **Payroll** - Employee management, SSC/PND1 calculations, payroll runs
13. **Financial Reports** - Trial Balance, Balance Sheet, P&L
14. **Settings & Administration** - Company settings, user management, roles
15. **UI-DB Alignment** - Data consistency verification
16. **Full Coverage** - All modules with error monitoring and screenshots

### Rate Limiting Bypass for Tests

Tests use `x-playwright-test: true` header to bypass API rate limiting. This is configured in `src/middleware.ts`.

## Database Management

### Backup Strategy

```bash
# Create timestamped backup
cp prisma/dev.db backups/dev-$(date +%Y%m%d_%H%M%S).db

# List backups
ls -lh backups/
```

### Migration Best Practices

1. **Always backup before migrations**
   ```bash
   cp prisma/dev.db backups/dev-pre-migration.db
   ```

2. **Test migrations in development first**
   ```bash
   bun run db:push  # For schema changes without migration file
   bun run db:migrate  # For formal migration with file
   ```

3. **Generate Prisma client after schema changes**
   ```bash
   bun run db:generate
   ```

4. **Verify data integrity after migration**
   ```bash
   ./scripts/verify-database.sh
   ```

### Database Verification

Run database verification to ensure integrity:

```bash
./scripts/verify-database.sh
```

This script checks:
- All table record counts
- Journal entry balance (debits must equal credits)
- Orphaned records (documents without journal entries, customers without company)

## Recent Fixes & Improvements

### Sidebar Navigation Fix (2025-03-12)

**Issue**: 5 navigation buttons were missing from the sidebar (Inventory, Banking, Fixed Assets, Payroll, Petty Cash)

**Fix**: Updated `src/app/page.tsx` `getMenuItems()` function to include all 16 navigation items.

**Status**: ✅ All 16 navigation items now accessible and verified via E2E tests

**Navigation Items** (16 total):
1. Dashboard (ภาพรวม)
2. Chart of Accounts (ผังบัญชี)
3. Journal Entries (บันทึกบัญชี)
4. Invoices (ใบกำกับภาษี)
5. VAT (ภาษีมูลค่าเพิ่ม)
6. Withholding Tax (ภาษีหัก ณ ที่จ่าย)
7. Customers/AR (ลูกหนี้)
8. Vendors/AP (เจ้าหนี้)
9. **Inventory** (สต็อกสินค้า) - Fixed
10. **Banking** (ธนาคาร) - Fixed
11. **Fixed Assets** (ทรัพย์สินถาวร) - Fixed
12. **Payroll** (เงินเดือน) - Fixed
13. **Petty Cash** (เงินสดย่อย) - Fixed
14. Reports (รายงาน)
15. Settings (ตั้งค่า) - Admin only
16. User Management (จัดการผู้ใช้) - Admin only

### Production Deployment CRITICAL NOTES

After running `bun run build`, you **MUST** manually update the DATABASE_URL in the standalone `.env` file:

```bash
# The build creates .next/standalone/ but uses relative DATABASE_URL
# You MUST update it to use an absolute path:

# Edit .next/standalone/.env and change:
DATABASE_URL=file:./dev.db
# To:
DATABASE_URL=file:/absolute/path/to/.next/standalone/dev.db
```

**Why:** In standalone mode, Prisma Client cannot reliably resolve relative database paths. The build process copies the `.env` file but doesn't convert relative paths to absolute ones. Using a relative path causes Prisma to connect to the wrong database (often an empty one), resulting in "table does not exist" errors and login failures.

## Architecture

### Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (RESTful, Zod validated)
│   ├── layout.tsx         # Root layout with providers
│   └── page.tsx           # Dashboard/home page
├── components/            # React components
│   ├── ui/               # shadcn/ui components (don't modify directly)
│   ├── layout/           # Sidebar, Header, navigation
│   ├── journal/          # Journal entry management
│   ├── invoices/         # Sales invoices (ใบกำกับภาษี)
│   ├── purchase/         # Purchase invoices (ใบซื้อ)
│   ├── receipts/         # Receipts (ใบเสร็จรับเงิน)
│   ├── payments/         # Payments (ใบจ่ายเงิน)
│   ├── accounts/         # Chart of accounts (ผังบัญชี)
│   ├── ar/               # Accounts Receivable (ลูกหนี้)
│   ├── ap/               # Accounts Payable (เจ้าหนี้)
│   ├── vat/              # VAT management (ภาษีมูลค่าเพิ่ม)
│   ├── wht/              # Withholding tax (ภาษีหัก ณ ที่จ่าย)
│   ├── inventory/        # Inventory & stock management (สต็อกสินค้า)
│   ├── banking/          # Banking & cheque management (ธนาคาร)
│   ├── assets/           # Fixed assets & depreciation (ทรัพย์สินถาวร)
│   ├── payroll/          # Payroll & compensation (เงินเดือน)
│   ├── petty-cash/       # Petty cash management (เงินสดย่อย)
│   ├── reports/          # Financial reports (รายงานการเงิน)
│   └── auth/             # Authentication components
├── lib/                  # Utilities and configurations
│   ├── thai-accounting.ts # Thai-specific accounting functions
│   ├── wht-service.ts    # Withholding tax automation & 50 Tawi
│   ├── inventory-service.ts # Stock management & WAC costing
│   ├── asset-service.ts  # Fixed assets & depreciation
│   ├── payroll-service.ts # Payroll processing (SSC/PND1)
│   ├── auth.ts           # NextAuth configuration
│   ├── db.ts             # Prisma client singleton
│   ├── validations.ts    # Zod validation schemas
│   └── api-utils.ts      # API response helpers
└── stores/               # Zustand state management
    └── auth-store.ts     # Authentication state
```

### Key Architectural Patterns

1. **Service Layer Pattern**: Business logic is encapsulated in service modules (`src/lib/*-service.ts`). Services handle GL posting, calculations, and data transformations. API routes call services, which interact with Prisma. This keeps API routes thin and testable.

2. **Double-Entry Bookkeeping**: All financial transactions must balance (debit = credit). See `JournalEntry` and `JournalLine` models.

3. **Document-Driven Accounting**: Invoices, receipts, and payments automatically generate journal entries when posted. Track via `journalEntryId` foreign keys.

4. **Hierarchical Chart of Accounts**: 4-level account structure with parent-child relationships. Thai standard: Assets (1xxx), Liabilities (2xxx), Equity (3xxx), Revenue (4xxx), Expenses (5xxx).

5. **Role-Based Access Control**: Four roles - ADMIN, ACCOUNTANT, USER, VIEWER. UI filters navigation items based on user role.

6. **Document Numbering System**: Automatic sequential numbering with configurable formats. See `DocumentNumber` model and `generateDocumentNumber()` function.

7. **Thai Tax Compliance**:
   - **VAT** (ภาษีมูลค่าเพิ่ม): 7% rate, tracked separately via `VatRecord` model
   - **WHT** (ภาษีหัก ณ ที่จ่าย): PND3 (salary/wages), PND53 (services/rent) via `WithholdingTax` model

8. **Stock Integration**: Automatic stock updates from invoice posting and purchase creation. Real-time WAC costing calculation via `inventory-service.ts`.

9. **GL Posting Automation**: All modules automatically generate journal entries:
   - Fixed Assets: Monthly depreciation entries
   - Payroll: Salary expense, liability, and tax entries
   - Petty Cash: Expense voucher entries
   - Banking: Cheque clearing entries
   - Inventory: COGS and inventory receipt entries

## Thai-Specific Features

### Localization Functions (src/lib/thai-accounting.ts)

- `formatThaiDate()` - Convert to Thai Buddhist era (พ.ศ.) format: DD/MM/YYYY
- `formatCurrency()` - Thai Baht formatting with Satang
- `numberToThaiText()` - Convert numbers to Thai words (for checks)
- `calculateVAT()` - VAT calculation for inclusive/exclusive pricing
- `calculateWHT()` - Withholding tax calculation
- `calculateAging()` - AR/AP aging reports (current, 30, 60, 90, 90+ days)

### Tax Structures

```typescript
// VAT
VAT_RATE = 7%

// Withholding Tax (ภงด.)
WHT_RATES = {
  PND3: [0, 5, 10, 15, 20, 25, 30, 35],  // Progressive rates
  PND53: {
    service: 3,       // ค่าบริการ
    rent: 5,          // ค่าเช่า
    professional: 3,  // ค่าบริการวิชาชีพ
    contract: 1,      // ค่าจ้างทำของ
    advertising: 2,   // ค่าโฆษณา
  }
}
```

### Account Types (Thai Standard)

- **ASSET** (สินทรัพย์) - Code 1xxx
- **LIABILITY** (หนี้สิน) - Code 2xxx
- **EQUITY** (ทุน) - Code 3xxx
- **REVENUE** (รายได้) - Code 4xxx
- **EXPENSE** (ค่าใช้จ่าย) - Code 5xxx

## Database Schema Key Points

### Core Models

1. **Company** - Single company profile with tax info
2. **ChartOfAccount** - Hierarchical account structure (181 seeded accounts)
3. **JournalEntry/JournalLine** - Double-entry bookkeeping
4. **Customer/Vendor** - Master data for AR/AP
5. **Product** - Products and services with VAT configuration
6. **Invoice** - Sales tax invoices (ใบกำกับภาษี)
7. **PurchaseInvoice** - Purchase invoices (ใบซื้อ)
8. **Receipt/Payment** - Payment documents
9. **VatRecord** - VAT input/output tracking
10. **WithholdingTax** - PND3/PND53 tracking
11. **User** - Role-based access control

### Important Relationships

- Invoices/Receipts/CreditNotes → JournalEntry (via `journalEntryId`)
- PurchaseInvoices/Payments/DebitNotes → JournalEntry
- Documents must be posted to generate journal entries

### Document Status Flow

```
DRAFT → ISSUED/POSTED → PAID (for invoices) → CANCELLED/REVERSED
```

## API Patterns

All API routes follow this structure:

```typescript
// src/app/api/[resource]/route.ts
import { z } from 'zod';
import { auth } from '@/lib/auth';

// Validation schema
const schema = z.object({...});

export async function GET(req: Request) {
  const session = await auth();
  // Check permissions
  // Return data with pagination
}

export async function POST(req: Request) {
  const session = await auth();
  const body = await req.json();
  const validated = schema.parse(body);
  // Create record
  // Return success/error
}
```

### Standard Response Format

```typescript
// Success
{ success: true, data: {...} }

// Error
{ success: false, error: "Thai error message" }
```

## Environment Variables

Required `.env` file:

```env
DATABASE_URL=file:./dev.db
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-change-this
```

## Test Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@thaiaccounting.com | admin123 | ADMIN |
| accountant@thaiaccounting.com | acc123 | ACCOUNTANT |
| user@thaiaccounting.com | user123 | USER |
| viewer@thaiaccounting.com | viewer123 | VIEWER |

## Common Tasks

### Adding a New Accounting Module

1. Create Prisma models for documents and journal entry relationships
2. Add document type to `DocumentNumber` seed data
3. Create API routes in `src/app/api/[module]/route.ts`
4. Build UI components in `src/components/[module]/`
5. Add navigation item to sidebar (filter by role)
6. Implement journal entry generation on document post
7. Add E2E tests in `e2e/` directory
8. Update test suite configuration in `tests/test-suites.json`

### Modifying Chart of Accounts

1. Update `prisma/schema.prisma` if needed
2. Modify `prisma/seed.ts` for new accounts
3. Run `bun run db:reset` to reseed (WARNING: destroys data)
4. Or use Prisma Studio: `npx prisma studio`

### Adding New Tax Rates

1. Update `WHT_RATES` in `src/lib/thai-accounting.ts`
2. Modify `WithholdingTax` model if new types needed
3. Update forms to include new rate options
4. Run `bun run db:generate` and `bun run db:migrate`

## Development Workflows

### Typical Development Workflow

1. **Start Development**
   ```bash
   bun run dev &  # Start dev server
   ./scripts/test-quick.sh  # Run smoke tests
   ```

2. **Before Committing**
   ```bash
   bun run lint  # Check for linting errors
   ./scripts/test-module.sh <module-name>  # Test your module
   ./scripts/verify-database.sh  # Verify database integrity
   ```

3. **Production Deployment**
   ```bash
   bun run build
   # Update DATABASE_URL in .next/standalone/.env to absolute path
   ./scripts/verify-deployment.sh
   ./scripts/start-production.sh
   ./scripts/health-check.sh
   ```

### Troubleshooting

#### Login Issues

If you see "อีเมลหรือรหัสผ่านไม่ถูกต้อง" (Email or password incorrect):

1. **Check DATABASE_URL** - Must be absolute path in `.next/standalone/.env`
2. **Verify database exists** - Check `ls -lh .next/standalone/dev.db` (should be ~732KB)
3. **Test authentication directly**:
   ```bash
   cd .next/standalone
   node test-nextauth-flow.js
   node test-all-users.js
   ```
4. **Check Prisma connection**:
   ```bash
   node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.user.findMany().then(u => console.log('Users:', u.length)).finally(() => p.\$disconnect());"
   ```

#### Test Failures

- **Dev server not running**: Tests will auto-start server if needed
- **Database issues**: Run `./scripts/verify-database.sh` to check integrity
- **Timeout errors**: Increase timeout in `playwright.config.ts`
- **Rate limiting**: Ensure `x-playwright-test: true` header is set in `src/middleware.ts`

#### Build Errors

- **Module not found**: Run `bun run db:generate` after schema changes
- **Type errors**: Run `bun run lint` to check for issues
- **Database path errors**: Ensure DATABASE_URL uses absolute path in production

## Important Notes

- **Database**: SQLite for development. Production should use PostgreSQL.
- **Production Build**: Configured for standalone output (Docker-friendly)
- **Authentication**: NextAuth.js with credentials provider, JWT-based sessions
- **Validation**: All inputs use Zod schemas - never skip validation
- **Thai Language**: UI labels support Thai/English dual language
- **Date Handling**: Always use Thai date format for user-facing dates
- **Currency**: Always format as THB (฿) with 2 decimal places
- **Testing**: E2E tests verify all functionality, run before committing
- **Database Verification**: Always verify database integrity after schema changes

## Production Deployment

```bash
# Build
bun run build

# CRITICAL: After build, UPDATE .next/standalone/.env with absolute DATABASE_URL
# See "Production Deployment CRITICAL NOTES" section above

# The build creates:
# - .next/standalone/server.js (standalone server)
# - .next/standalone/.next/ (static assets)
# - .next/standalone/public/ (public files)
# - .next/standalone/dev.db (database - copy from prisma/)

# Run with Bun
cd .next/standalone
NODE_ENV=production bun server.js

# Or use production scripts
./scripts/start-production.sh
./scripts/health-check.sh
```

### Production Deployment Checklist

#### Pre-Deployment Preparation

- [ ] **Database Setup**
  - [ ] Run `bun run db:generate` to generate Prisma client
  - [ ] Run `bun run db:push` or `bun run db:migrate` to create schema
  - [ ] Run `npx prisma db seed` to seed Thai chart of accounts (181 accounts)
  - [ ] Create admin user account
  - [ ] Configure PostgreSQL for production (recommended) or use SQLite
  - [ ] Create database backup strategy

- [ ] **Environment Configuration**
  - [ ] Set `DATABASE_URL` to production database (use absolute path for SQLite)
  - [ ] Set `NEXTAUTH_URL` to production domain
  - [ ] Set `NEXTAUTH_SECRET` to strong random value
  - [ ] Set `NODE_ENV=production`

- [ ] **Build & Test**
  - [ ] Run `bun run build` to create production build
  - [ ] Update `.next/standalone/.env` with absolute DATABASE_URL
  - [ ] Run `./scripts/verify-database.sh` to check integrity
  - [ ] Run `bun run test:quick` to verify critical functionality
  - [ ] Test production build locally: `bun run start`
  - [ ] Run `./scripts/health-check.sh` to verify deployment

#### Production Deployment

- [ ] **Server Setup**
  - [ ] Install Bun runtime
  - [ ] Copy `.next/standalone/` directory to server
  - [ ] Set proper file permissions
  - [ ] Configure process manager (PM2, systemd, etc.)
  - [ ] Set up SSL/HTTPS

- [ ] **Security**
  - [ ] Enable HTTPS with SSL certificate
  - [ ] Configure firewall rules
  - [ ] Set up database backups
  - [ ] Configure error tracking (Sentry recommended)
  - [ ] Set up monitoring/logging
  - [ ] Review and harden system security

- [ ] **Post-Deployment Verification**
  - [ ] Run `./scripts/health-check.sh` to verify system health
  - [ ] Test user authentication
  - [ ] Verify all modules load correctly
  - [ ] Test document creation (invoices, receipts, payments)
  - [ ] Validate GL entries are posted correctly
  - [ ] Check Thai date formatting displays correctly
  - [ ] Test role-based access control
  - [ ] Verify PDF downloads work (50 Tawi, invoices)
  - [ ] Run database verification: `./scripts/verify-database.sh`

---

## ✅ Completed Expansion Modules (100% Complete)

All 6 expansion modules have been successfully implemented and integrated into the ERP system.

### Module Progress Summary

**Overall: 100% COMPLETE** ✅

| Module | Schema | API | UI | Logic | Navigation | Tests | Status |
|--------|--------|-----|-----|-------|------------|-------|--------|
| **WHT Automation** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **100%** 🚀 |
| **Inventory** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **100%** ✅ |
| **Fixed Assets** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **100%** ✅ |
| **Banking** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **100%** ✅ |
| **Petty Cash** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **100%** ✅ |
| **Payroll** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **100%** ✅ |

All modules are production-ready with full navigation integration, GL posting automation, Thai tax compliance, and comprehensive E2E test coverage.

### 1. WHT Automation & 50 Tawi (100% Complete) 🚀

**✅ FULLY IMPLEMENTED - PRODUCTION READY:**
- Database schema with `WithholdingTax` model
- `Product.incomeType` field for auto-detection
- `src/lib/wht-service.ts` with auto-generation functions
- WHT calculation in `thai-accounting.ts`
- WHT report UI component (`src/components/wht/`)
- `/api/reports/wht` endpoint with filtering
- **50 Tawi PDF generator** with Thai fonts (THSarabunNew.ttf)
- PND3/PND53 automatic determination
- Auto WHT generation from payments/receipts
- PDF download for each certificate
- E2E test coverage for WHT scenarios

**Status**: Complete and ready for use!

### 2. Inventory & Stock Management (100% Complete) ✅

**✅ FULLY IMPLEMENTED - PRODUCTION READY:**
- Complete database schema (10 models)
- `/api/warehouses` - Warehouse CRUD
- `/api/stock-balances` - Inventory valuation
- `/api/stock-movements` - Movement tracking
- `src/lib/inventory-service.ts` with **Weighted Average Costing (WAC)**
- COGS calculation functions
- **Stock integration** - Auto stock updates from invoices/purchases
- **UI Components**: `src/components/inventory/inventory-page.tsx`
  - Stock Balance tab with WAC costing
  - Stock Movements tab with tracking
  - Warehouses tab with management
  - Thai language support
- **Navigation integration** - Accessible via sidebar
- E2E test coverage for inventory operations

**Features:**
- Real-time stock tracking with multi-warehouse support
- Automatic stock updates from document posting
- WAC costing with COGS calculation
- Movement type tracking (Receive, Issue, Transfer, Adjust, Count)
- GL posting for inventory receipts and COGS

### 3. Fixed Assets & Depreciation (100% Complete) ✅

**✅ FULLY IMPLEMENTED - PRODUCTION READY:**
- Database schema: `Asset`, `DepreciationSchedule`
- `/api/assets` - Asset CRUD with net book values
- `src/lib/asset-service.ts`:
  - `generateDepreciationSchedule()` - Straight-line depreciation
  - `postMonthlyDepreciation()` - **Automated GL posting**
  - `getAssetNetValue()` - Net book value calculator
- **UI Components**: `src/components/assets/assets-page.tsx`
  - Asset registration with depreciation
  - TAS 16 compliant calculations
  - Summary cards with totals
- Chart of accounts for assets (121x series)
- Automated GL posting (debits expense, credits accumulated depreciation)
- **Navigation integration** - Accessible via sidebar
- E2E test coverage for asset lifecycle

**Features:**
- Asset lifecycle management with depreciation schedules
- Automatic monthly depreciation journal entries
- Net book value tracking and reporting
- TAS 16 compliant straight-line depreciation
- Chart of accounts integration

### 4. Banking & Cheque Management (100% Complete) ✅

**✅ FULLY IMPLEMENTED - PRODUCTION READY:**
- Database schema: `BankAccount`, `Cheque`, `Reconciliation`
- `/api/bank-accounts` - Bank account CRUD
- `/api/cheques` - Cheque CRUD with filtering
- **UI Components**: `src/components/banking/banking-page.tsx`
  - Bank Accounts tab with visual cards
  - Cheque Register tab with tracking
  - Gradient design, status badges
- Cheque workflow: ON_HAND → DEPOSITED → CLEARED/BOUNCED → CANCELLED
- Cheque details in receipt PDFs
- **GL posting** for cheque clearing
- Thai date formatting
- **Navigation integration** - Accessible via sidebar
- E2E test coverage for banking operations

**Features:**
- Bank account management with balance tracking
- Cheque lifecycle management with status workflows
- Automatic GL posting for cheque clearing
- Due date tracking and reminders
- Integration with payments and receipts

### 5. Petty Cash Management (100% Complete) ✅

**✅ FULLY IMPLEMENTED - PRODUCTION READY:**
- Database schema: `PettyCashFund`, `PettyCashVoucher`
- `/api/petty-cash/funds` - Fund CRUD with balance tracking
- `/api/petty-cash/vouchers` - Voucher CRUD with validation
- **UI Components**: `src/components/petty-cash/petty-cash-page.tsx`
  - Funds tab with balance progress bars
  - Vouchers tab with tracking
  - Low balance warnings (>80% used)
- Backend logic: balance validation, transaction safety
- Automatic voucher numbering (PCV-YYYY-XXXX)
- **GL posting** for expense vouchers
- Reimbursement workflow
- Petty cash account (1113) in chart of accounts
- Thai language support
- **Navigation integration** - Accessible via sidebar
- E2E test coverage for petty cash operations

**Features:**
- Fund management with balance tracking
- Voucher system with validation
- Automatic GL posting for expenses
- Reimbursement workflow with approval
- Low balance warnings and notifications

### 6. Payroll & Compensation (100% Complete) ✅

**✅ FULLY IMPLEMENTED - PRODUCTION READY:**
- Database schema: `Employee`, `PayrollRun`, `Payroll`
- `/api/employees` - Complete CRUD with Thai fields
- `/api/payroll` - Full payroll run processing
- **UI Components**: `src/components/payroll/`
  - `payroll-page.tsx` - Container
  - `employee-list.tsx` - Employee directory
  - `payroll-run-list.tsx` - Payroll processing
- `src/lib/payroll-service.ts`:
  - ✅ **SSC Calculation**: 5% capped at ฿750/month
  - ✅ **PND1 Calculation**: 2024 progressive rates
  - ✅ Personal allowance: ฿60,000/year
  - ✅ Employee + Employer SSC
  - ✅ Monthly vs annual conversion
- **GL posting** for payroll (salary expense, liabilities, tax)
- Payroll accounts in chart of accounts
- Automatic payroll numbering (PAY-YYYY-MM-###)
- Thai language support
- **Navigation integration** - Accessible via sidebar
- E2E test coverage for payroll processing

**Features:**
- Employee directory with comprehensive Thai fields
- Monthly payroll processing with auto-calculations
- SSC (Social Security) calculations for employee + employer
- PND1 progressive tax withholding (2024 rates)
- Automatic journal entries for salary, liabilities, and taxes
- Status tracking (Draft, Approved, Paid)

---

## 📝 System Capabilities Summary

### Fully Implemented Features

**Core Accounting:**
- ✅ Double-entry bookkeeping with automatic balancing
- ✅ Chart of accounts (181 Thai standard accounts)
- ✅ Journal entry management with GL posting
- ✅ Document-driven accounting (invoices, receipts, payments)
- ✅ Automatic document numbering

**Tax Compliance:**
- ✅ VAT 7% with input/output tracking
- ✅ WHT PND3/PND53 with 50 Tawi PDF certificates
- ✅ SSC (Social Security) calculations
- ✅ PND1 progressive tax withholding
- ✅ Thai Revenue Department compliance

**Expansion Modules:**
- ✅ Inventory: Multi-warehouse, WAC costing, stock movements
- ✅ Banking: Bank accounts, cheques, reconciliation
- ✅ Fixed Assets: Asset registry, TAS 16 depreciation
- ✅ Payroll: Employee management, payroll processing
- ✅ Petty Cash: Fund management, voucher system

**User Management:**
- ✅ Role-based access control (ADMIN, ACCOUNTANT, USER, VIEWER)
- ✅ NextAuth.js authentication
- ✅ Permission guards for sensitive operations

**Reporting:**
- ✅ Financial reports (Trial Balance, Balance Sheet, P&L)
- ✅ VAT reports
- ✅ WHT reports with 50 Tawi PDF generation
- ✅ Aging reports (AR/AP)

**Testing & Quality Assurance:**
- ✅ Comprehensive E2E test suite (all 16 modules)
- ✅ Database verification scripts
- ✅ Health monitoring for production
- ✅ Test tag system for selective execution
- ✅ Automated screenshot capture on failures

---

**System Status**: ✅ **PRODUCTION READY** - All modules implemented and integrated (100% Complete)
