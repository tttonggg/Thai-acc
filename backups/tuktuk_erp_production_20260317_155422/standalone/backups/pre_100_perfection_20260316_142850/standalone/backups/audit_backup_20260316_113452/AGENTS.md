# AGENTS.md - Thai Accounting ERP System

This file provides essential guidance for AI coding agents working on the **Thai Accounting ERP System** (โปรแกรมบัญชีมาตรฐานไทย).

## Project Overview

This is a comprehensive accounting application designed for Thai SME businesses, complying with Thai Financial Reporting Standards (TFRS). The system supports Thai tax requirements including VAT (ภาษีมูลค่าเพิ่ม) at 7%, Withholding Tax (ภาษีหัก ณ ที่จ่าย) PND3/PND53, and Social Security calculations.

**Implementation Status**: ✅ **100% COMPLETE** - All 6 expansion modules fully implemented and integrated:
- WHT Automation & 50 Tawi (ภาษีหัก ณ ที่จ่าย)
- Inventory & Stock Management (คลังสินค้า)
- Fixed Assets & Depreciation (ทะเบียนทรัพย์สิน)
- Banking & Cheque Management (ธนาคารและเช็ค)
- Petty Cash Management (เงินสดย่อย)
- Payroll & Compensation (เงินเดือน)

## Technology Stack

| Category | Technology | Version |
|----------|------------|---------|
| Framework | Next.js (App Router) | 16.1.1 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| UI Components | shadcn/ui | New York style |
| Database | Prisma ORM + SQLite | 6.11.1 |
| Authentication | NextAuth.js | 4.24.11 |
| State Management | Zustand | 5.x |
| Data Fetching | TanStack Query | 5.x |
| Forms | React Hook Form + Zod | 7.x / 4.x |
| Icons | Lucide React | 0.525.0 |
| Testing | Vitest + Playwright | 4.x / 1.x |
| PDF Generation | jsPDF + pdfkit | 4.x / 0.17.x |
| Excel Export | xlsx | 0.18.x |
| Runtime | Bun (preferred) or Node.js | - |

## Project Structure

```
├── prisma/                    # Database schema and seed files
│   ├── schema.prisma          # Prisma schema (50+ models, 1250+ lines)
│   ├── seed.ts                # Initial data seeding
│   └── dev.db                 # SQLite database
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/              # REST API routes (90+ endpoints)
│   │   │   ├── accounts/     # Chart of accounts APIs
│   │   │   ├── invoices/     # Invoice management APIs
│   │   │   ├── journal/      # Journal entry APIs
│   │   │   ├── assets/       # Fixed assets APIs
│   │   │   ├── payroll/      # Payroll APIs
│   │   │   ├── inventory/    # Stock management APIs
│   │   │   ├── banking/      # Bank & cheque APIs
│   │   │   ├── petty-cash/   # Petty cash APIs
│   │   │   ├── wht/          # Withholding tax APIs
│   │   │   └── reports/      # Financial report APIs
│   │   ├── layout.tsx        # Root layout with providers
│   │   ├── page.tsx          # Dashboard/home page (SPA architecture)
│   │   └── globals.css       # Global styles
│   ├── components/           # React components
│   │   ├── ui/              # shadcn/ui components (DO NOT MODIFY)
│   │   ├── layout/          # Sidebar, Header navigation
│   │   ├── journal/         # Journal entry management
│   │   ├── invoices/        # Sales invoices (ใบกำกับภาษี)
│   │   ├── accounts/        # Chart of accounts (ผังบัญชี)
│   │   ├── inventory/       # Stock management
│   │   ├── banking/         # Bank accounts & cheques
│   │   ├── assets/          # Fixed assets
│   │   ├── payroll/         # Employee & payroll
│   │   ├── petty-cash/      # Petty cash management
│   │   ├── wht/             # Withholding tax reports
│   │   ├── ar/              # Accounts Receivable (customers)
│   │   ├── ap/              # Accounts Payable (vendors)
│   │   ├── receipts/        # Receipts (ใบเสร็จรับเงิน)
│   │   ├── payments/        # Payments (ใบจ่ายเงิน)
│   │   ├── credit-notes/    # Credit notes (ใบลดหนี้)
│   │   ├── debit-notes/     # Debit notes (ใบเพิ่มหนี้)
│   │   ├── products/        # Product management
│   │   ├── vat/             # VAT reports
│   │   ├── reports/         # Financial reports
│   │   ├── settings/        # System settings
│   │   ├── admin/           # Admin functions
│   │   └── auth/            # Authentication components
│   ├── lib/                  # Utilities and service layer
│   │   ├── db.ts            # Prisma client singleton
│   │   ├── auth.ts          # NextAuth configuration
│   │   ├── validations.ts   # Zod validation schemas
│   │   ├── api-utils.ts     # API response helpers
│   │   ├── thai-accounting.ts    # Thai-specific accounting functions
│   │   ├── inventory-service.ts  # Stock & WAC costing
│   │   ├── asset-service.ts      # Depreciation calculations
│   │   ├── payroll-service.ts    # SSC & PND1 calculations
│   │   ├── wht-service.ts        # Withholding tax automation
│   │   ├── petty-cash-service.ts # Petty cash logic
│   │   ├── cheque-service.ts     # Cheque management
│   │   ├── stock-take-service.ts # Stock taking logic
│   │   ├── pdf-generator.ts      # PDF generation (50 Tawi)
│   │   ├── excel-export.ts       # Excel export functionality
│   │   ├── activity-logger.ts    # Audit logging
│   │   └── rate-limit.ts         # API rate limiting
│   ├── stores/              # Zustand state management
│   │   └── auth-store.ts    # Authentication state
│   ├── hooks/               # Custom React hooks
│   │   ├── use-toast.ts     # Toast notifications
│   │   ├── use-mobile.ts    # Mobile detection
│   │   └── use-delete-confirm.ts # Delete confirmation
│   ├── test/                # Test utilities and setup
│   │   ├── setup.ts         # Vitest setup
│   │   └── utils/           # Test utilities
│   └── middleware.ts        # Rate limiting & auth middleware
├── e2e/                     # Playwright E2E tests (18 test files)
├── tests/                   # Additional test files
│   ├── global-setup.ts      # Global test setup
│   └── global-teardown.ts   # Global test teardown
├── public/                  # Static assets
└── docs/                    # Documentation
```

## Build and Development Commands

```bash
# Development (port 3000)
bun run dev

# Production Build
bun run build              # Creates .next/standalone/ output

# Production Server
bun run start             # Start with Bun
npm run start:node        # Start with Node.js

# Linting
bun run lint              # Run ESLint

# Database Operations
bun run db:generate       # Generate Prisma client (REQUIRED after schema changes)
bun run db:push          # Push schema without migrations
bun run db:migrate       # Create and run migrations
bun run db:reset         # Reset database (WARNING: destroys all data)
npx prisma db seed       # Seed Thai chart of accounts (181 accounts)
bun run seed:fresh       # Reset + seed

# Testing
bun run test             # Run Vitest in watch mode
bun run test:run         # Run tests once
bun run test:coverage    # Run with coverage report
bun run test:e2e         # Run Playwright E2E tests
bun run test:e2e:ui      # Run E2E tests with UI mode
bun run test:quick       # Quick test run
bun run test:full        # Full test suite
bun run test:master      # Master test runner
```

**Important**: Always run `bun run db:generate` after modifying `prisma/schema.prisma`.

## Environment Variables

Required `.env` file:

```env
DATABASE_URL=file:./prisma/dev.db    # SQLite path
NEXTAUTH_URL=http://localhost:3000   # App URL
NEXTAUTH_SECRET=your-secret-key      # JWT secret (generate strong key for production)
```

**Production Note**: In standalone mode, `DATABASE_URL` must use an **absolute path**:
```env
# Correct for production:
DATABASE_URL=file:/absolute/path/to/.next/standalone/dev.db
```

## Code Style Guidelines

### TypeScript
- Strict mode enabled but `noImplicitAny: false` for flexibility
- Use path alias `@/` for imports from `src/`
- Export types explicitly for complex interfaces

### Naming Conventions
- **Components**: PascalCase (e.g., `InvoiceList.tsx`)
- **Files**: kebab-case for utilities, camelCase for services
- **API Routes**: Route handlers use HTTP method names (GET, POST, PUT, DELETE)
- **Database Models**: PascalCase, matching Prisma schema
- **Enums**: UPPER_SNAKE_CASE for values

### Component Patterns
```typescript
// Use functional components with explicit types
interface InvoiceListProps {
  invoices: Invoice[];
  onSelect: (id: string) => void;
}

export function InvoiceList({ invoices, onSelect }: InvoiceListProps) {
  // Component logic
}
```

### API Route Patterns
```typescript
// Standard API route structure
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

const schema = z.object({
  // Validation schema
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return new Response('Unauthorized', { status: 401 });
  
  // Fetch data
  return Response.json({ success: true, data: result });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return new Response('Unauthorized', { status: 401 });
  
  const body = await req.json();
  const validated = schema.parse(body);
  
  // Create record
  return Response.json({ success: true, data: created });
}
```

## Testing Strategy

### Unit Tests (Vitest)
- Location: `src/lib/__tests__/` or co-located with source files
- Setup: `src/test/setup.ts`
- Coverage: v8 provider with text/json/html/lcov reports
- Environment: jsdom for DOM testing

### E2E Tests (Playwright)
- Location: `e2e/` directory
- Browsers: Chromium, Firefox, WebKit
- Base URL: `http://localhost:3000`
- Test bypass header: `x-playwright-test: true` (bypasses rate limiting)

### Test Categories
| Category | Files | Description |
|----------|-------|-------------|
| Authentication | `01-login-*.spec.ts`, `login*.spec.ts` | Login flows, session management |
| Master Data | `02-master-*.spec.ts` | Customers, vendors, products, accounts |
| Transactions | `03-accounting-*.spec.ts`, `invoices.spec.ts` | Journal entries, invoices |
| Navigation | `04-sidebar-*.spec.ts`, `05-sidebar-*.spec.ts` | UI navigation tests |
| Reports | `04-database-validation-*.spec.ts` | Financial reports, VAT reports |
| Module Tests | `0*-modules-*.spec.ts` | All 6 expansion modules |
| Production | `10-production-*.spec.ts` | Comprehensive production tests |

### Running Specific Tests
```bash
# Run specific E2E test
npx playwright test e2e/login-fixed.spec.ts

# Run with UI mode for debugging
npx playwright test --ui

# Run specific unit test
bun run test src/lib/__tests__/thai-tax.test.ts
```

## Key Architectural Patterns

### 1. Service Layer Pattern
Business logic is encapsulated in service modules (`src/lib/*-service.ts`). Services handle:
- GL (General Ledger) posting
- Complex calculations (tax, depreciation, costing)
- Data transformations
- External integrations

Example flow: API Route → Service → Prisma → Database

### 2. Double-Entry Bookkeeping
All financial transactions must balance (debit = credit). Key models:
- `JournalEntry` - Header record
- `JournalLine` - Individual debit/credit lines

### 3. Document-Driven Accounting
Documents automatically generate journal entries when posted:
- Invoices, Receipts, Payments → Journal entries
- Track via `journalEntryId` foreign keys

### 4. Hierarchical Chart of Accounts
4-level account structure with Thai standard codes:
- **1xxx** - Assets (สินทรัพย์)
- **2xxx** - Liabilities (หนี้สิน)
- **3xxx** - Equity (ทุน)
- **4xxx** - Revenue (รายได้)
- **5xxx** - Expenses (ค่าใช้จ่าย)

### 5. Role-Based Access Control
Four user roles with decreasing permissions:
- **ADMIN** - Full access including user management
- **ACCOUNTANT** - Full accounting operations
- **USER** - Limited operations (no settings)
- **VIEWER** - Read-only access

### 6. Document Numbering
Automatic sequential numbering with configurable formats:
```typescript
// Format: {prefix}{yyyy}{mm}-{0000}
// Example: INV-202603-0001
```

### 7. SPA Architecture
The application uses a Single Page Application architecture:
- Main entry point: `src/app/page.tsx`
- Module switching via state management
- All modules rendered in the same page with conditional display
- Sidebar navigation controls active module state

## Thai-Specific Features

### Localization Functions (`src/lib/thai-accounting.ts`)
- `formatThaiDate()` - Buddhist era (พ.ศ.) format: DD/MM/YYYY
- `formatCurrency()` - Thai Baht formatting with Satang
- `numberToThaiText()` - Convert numbers to Thai words (for checks)
- `calculateVAT()` - 7% VAT inclusive/exclusive calculations
- `calculateWHT()` - Withholding tax calculation
- `calculateAging()` - AR/AP aging (current, 30, 60, 90, 90+ days)
- `calculateSSC()` - Social Security contributions (5% capped at ฿750)

### Tax Structures
```typescript
// VAT
VAT_RATE = 7%

// Withholding Tax Rates (PND3 - Progressive)
PND3_RATES = [0, 5, 10, 15, 20, 25, 30, 35]

// Withholding Tax Rates (PND53 - Fixed)
PND53_RATES = {
  service: 3,       // ค่าบริการ
  rent: 5,          // ค่าเช่า
  professional: 3,  // ค่าบริการวิชาชีพ
  contract: 1,      // ค่าจ้างทำของ
  advertising: 2,   // ค่าโฆษณา
}

// Social Security (2024)
SSC_RATE = 5% (max ฿750/month for employee)
```

### Thai Language Support
- UI language: Thai (primary)
- Error messages: Thai
- Date format: DD/MM/YYYY (Buddhist year +543)
- Number format: Thai locale with comma separators
- Currency: Thai Baht (฿)

## Security Considerations

### Authentication
- JWT-based sessions (8-hour expiry)
- bcrypt password hashing (10 rounds)
- NextAuth.js with credentials provider

### Rate Limiting
- Authentication endpoints: Strict limiting
- API routes: Moderate limiting
- Test bypass: `x-playwright-test: true` header
- Middleware: `src/middleware.ts`

### Input Validation
- All API inputs use Zod schemas (`src/lib/validations.ts`)
- File upload restrictions (size, type)
- SQL injection prevention via Prisma

### Production Security
- HTTPS required
- `NEXTAUTH_SECRET` must be set
- Absolute database paths in standalone mode

## Test Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@thaiaccounting.com | admin123 | ADMIN |
| accountant@thaiaccounting.com | acc123 | ACCOUNTANT |
| user@thaiaccounting.com | user123 | USER |
| viewer@thaiaccounting.com | viewer123 | VIEWER |

## Common Development Tasks

### Adding a New Module
1. Create Prisma models in `prisma/schema.prisma`
2. Run `bun run db:generate`
3. Add document type to `DocumentNumber` seed data
4. Create service layer in `src/lib/[module]-service.ts`
5. Create API routes in `src/app/api/[module]/route.ts`
6. Build UI components in `src/components/[module]/`
7. Add module to sidebar navigation in `src/app/page.tsx`
8. Implement GL posting in service layer
9. Add E2E tests in `e2e/`

### Modifying Database Schema
```bash
# 1. Edit prisma/schema.prisma
# 2. Generate client
bun run db:generate

# 3. Push changes (development)
bun run db:push

# 4. Or create migration (production)
bun run db:migrate
```

### Adding New API Endpoints
1. Create route file in `src/app/api/[resource]/route.ts`
2. Add Zod validation schema in `src/lib/validations.ts`
3. Implement CRUD operations
4. Add to service layer if complex logic needed
5. Follow existing response format: `{ success: boolean, data/error }`

## Troubleshooting

### Login Issues
If seeing "อีเมลหรือรหัสผ่านไม่ถูกต้อง" (Email or password incorrect):
1. Check `DATABASE_URL` uses absolute path in production
2. Verify database exists: `ls -lh .next/standalone/dev.db`
3. Check Prisma connection: `node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.user.findMany().then(u => console.log('Users:', u.length)).finally(() => p.\$disconnect());"`

### Build Issues
- Ensure `bun run db:generate` was run after schema changes
- Check `tsconfig.tsbuildinfo` can be safely deleted if stale
- Verify Node.js version compatibility (18+)

### Database Connection Issues
- SQLite: Check file permissions
- Prisma: Run `bun run db:generate` after any schema change
- Migration conflicts: Use `bun run db:reset` (destroys data)

## Deployment Notes

### Standalone Build
The project builds to `.next/standalone/` for Docker-friendly deployment:

```bash
bun run build
# Output: .next/standalone/server.js
```

**CRITICAL**: Update `.next/standalone/.env` with absolute `DATABASE_URL` path before starting.

### Production Checklist
- [ ] Set strong `NEXTAUTH_SECRET`
- [ ] Update `DATABASE_URL` to absolute path
- [ ] Configure HTTPS
- [ ] Set up database backups
- [ ] Enable logging/monitoring
- [ ] Run E2E tests against production build

## File Modification Guidelines

### DO NOT Modify
- `src/components/ui/*` - shadcn/ui components (use `npx shadcn add` instead)
- `node_modules/` - Use package manager
- `.next/` - Build output

### Modify with Caution
- `prisma/schema.prisma` - Requires regeneration
- `src/lib/db.ts` - Prisma client singleton
- `src/lib/auth.ts` - Auth configuration affects all routes
- `src/middleware.ts` - Affects all API requests

### Safe to Modify
- `src/components/[module]/*` - Module components
- `src/app/api/[resource]/*` - API routes
- `src/lib/*-service.ts` - Business logic
- `e2e/*.spec.ts` - Test files

## Related Documentation

- `CLAUDE.md` - Detailed project guidance for Claude Code
- `README.md` - General project overview (scaffold template)
- `ROADMAP.md` - Development roadmap
- Various `*-IMPLEMENTATION.md` files - Module-specific documentation:
  - `CREDIT-DEBIT-NOTES-IMPLEMENTATION.md`
  - `BANK_RECONCILIATION_IMPLEMENTATION.md`
  - `CHEQUE_CLEARING_IMPLEMENTATION.md`
  - `PETTY-CASH-IMPLEMENTATION.md`
  - `PAYROLL_JOURNAL_IMPLEMENTATION.md`
  - `PDF-GENERATOR-IMPLEMENTATION.md`
  - `EXCEL-EXPORT-IMPLEMENTATION.md`
  - `BACKUP-RESTORE-FEATURE.md`
  - `SECURITY-IMPLEMENTATION-SUMMARY.md`

---

**System Status**: ✅ Production Ready (100% Complete)

For questions or issues, refer to existing documentation files or run tests to verify functionality.
