# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Thai Accounting ERP System** (โปรแกรมบัญชีมาตรฐานไทย) - comprehensive accounting for Thai SME businesses, complying with TFRS and Thai Revenue Department regulations.

**Key Technologies**: Next.js 16 (App Router), React 19, TypeScript 5, Prisma ORM (v6), SQLite (dev) / PostgreSQL (prod), shadcn/ui (New York style), NextAuth.js v4, TanStack Query v5, Zustand v5, Zod v4, Bun runtime

**Status**: ✅ All 7 modules complete — WHT, Inventory, Fixed Assets, Banking, Petty Cash, Payroll, Quotation

## Development Commands

```bash
bun run dev          # Start dev server on port 3000
bun run build        # Build for production (standalone output)
bun run start        # Start production server with Bun
bun run lint:fix     # Fix ESLint errors automatically
bun run type-check   # TypeScript type checking
```

### Database

```bash
bun run db:generate  # Generate Prisma client (run after schema changes)
bun run db:push      # Push schema to database without migrations
bun run db:migrate   # Create and run migrations
bun run db:reset     # Reset database (WARNING: destroys all data)
npx prisma db seed   # Seed Thai chart of accounts (181 accounts)
```

**Important**: Always run `bun run db:generate` after modifying `prisma/schema.prisma`. The `db:select-schema` script runs automatically before Prisma commands to choose between SQLite (dev) and PostgreSQL (prod) schemas.

### Testing

```bash
bun run test:quick          # Smoke tests — critical paths only (~2-3 min)
bun run test:full           # Full E2E suite (~15-20 min)
bun run test:verify-db      # Verify database integrity
bun run test:module "@smoke" # Run tests by tag
npx playwright test e2e/invoices.spec.ts --project=chromium --headed
```

**Test tags**: `@smoke`, `@critical`, `@high`, `@medium`, `@low`, `@compliance`, `@expansion`, `@pdf`, `@auth`, `@database`

**Rate limiting bypass**: Tests use `x-playwright-test: true` header (configured in `src/middleware.ts`).

### Other Commands

```bash
bun run docker:compose:up    # Start with Docker Compose
bun run ci:all               # Full CI pipeline (lint + type-check + test:coverage + build)
bun run security:scan        # Scan for secrets in code
./scripts/health-check.sh    # Check production server health
```

## Architecture

### SPA Routing Pattern (IMPORTANT)

This app uses a **hybrid SPA pattern**, NOT standard Next.js file-based routing.

- All pages render from `src/app/page.tsx` using `activeModule` state
- URL sync via `window.history.pushState()` and `popstate` listener (see `src/app/page.tsx:100-191`)
- **Adding a new module requires all 6 steps**:
  1. Add to `Module` type union in `src/app/page.tsx`
  2. Add to both `moduleToPath` AND `pathToModule` maps (`src/app/page.tsx`) — must be kept in sync manually
  3. Add navigation button to `src/components/layout/keerati-sidebar.tsx`
  4. Create component in `src/components/your-module/`
  5. Add case to `renderModule()` switch in `src/app/page.tsx`
  6. Create API routes in `src/app/api/your-resource/route.ts`

`invoice-detail` is the only sub-route (pattern `/invoices/:id`). All other modules map 1:1 to a top-level path.

### Monetary Storage: Integer Satang (CRITICAL)

All monetary values in the database are stored as **integers in Satang** (1/100 Baht), not floats. Example: `subtotal Int @default(0) // มูลค่าก่อน VAT (สตางค์)`. Float is used only for rates/percentages (`vatRate Float`, `discountPercent Float`).

- Divide by 100 to display Baht to users
- Multiply by 100 when storing user-entered Baht values
- Mixing Baht/Satang causes factor-of-100 bugs

### Key Patterns

- **Service Layer**: Business logic in `src/lib/*-service.ts`. API routes call services; keep routes thin.
- **Double-Entry**: All transactions must balance (debit = credit). Use `prisma.$transaction()`.
- **Document-Driven**: Invoices/receipts/payments auto-generate journal entries on post via `journalEntryId` (null until posted).
- **GL Posting**: Fixed Assets (depreciation), Payroll (expenses/taxes), Petty Cash, Banking, Inventory all auto-post GL entries.
- **Document Numbering**: Use `generateDocNumber(type, prefix)` from `api-utils.ts` — transaction-safe sequential numbering via `DocumentNumber` model. Never implement ad-hoc numbering.
- **Soft Deletes**: Most entities have `deletedAt DateTime?`. Always add `where: { deletedAt: null }` in queries.
- **Idempotency**: `JournalEntry` and `Receipt` have `idempotencyKey String? @unique` to prevent duplicate records from network retries.

### Security

1. **Rate Limiting** (`src/middleware.ts`) — bypass with `x-playwright-test: true` or localhost; `strict` preset for auth endpoints, `moderate` for general API
2. **CSRF** — required for POST/PUT/PATCH/DELETE on `/api/`; middleware checks header _presence_, route handlers validate token validity via `csrf-service-server.ts`; fetch token from `/api/csrf/token`, send as `x-csrf-token` header; exempt paths: `/api/auth/*`, `/api/csrf/token`, `/api/webhooks/`
3. **Auth helpers** (`src/lib/api-utils.ts`) — `requireAuth()` throws on unauthenticated (use in routes); `auth()` returns null if unauthenticated (use in conditionals); `requireRole([roles])`, `canEdit()` (ADMIN or ACCOUNTANT), `isAdmin()`
4. **Validation** — ALL API inputs must use Zod schemas (v4 — breaking API vs v3); never trust client-side validation
5. **SQL** — Always use Prisma parameterized queries; never raw SQL with user input

### API Route Convention

**Typical route pattern**:
```typescript
export async function POST(request: NextRequest) {
  const user = await requireAuth()           // or requireRole(['ADMIN'])
  const body = await request.json()
  const validated = schema.parse(body)       // Zod, throws on failure
  // ... call service layer ...
  await logCreate(user.id, 'MODULE', id, {}) // activity log
  return apiResponse(result, 201)
}
```

- Path: `src/app/api/[resource]/route.ts`
- Response: `{ success: true, data: {...} }` or `{ success: false, error: "message" }`
- Helpers from `api-utils.ts`: `apiResponse()`, `apiError()`, `unauthorizedError()`, `forbiddenError()`, `notFoundError()`, `serverError()`

### Client vs Server Code

- **Never** import `src/lib/db.ts` in client components — causes PrismaClient browser bundle error
- `src/lib/thai-accounting.ts` is the only lib file safe for client import (no Prisma dependency)
- `src/lib/csrf-service.ts` is Edge-safe (no Prisma); actual token validation uses `csrf-service-server.ts`

## Thai-Specific Features

### Key Functions (`src/lib/thai-accounting.ts`)

- `formatThaiDate()` — Thai Buddhist era (พ.ศ.) DD/MM/YYYY (adds 543 to CE year)
- `formatCurrency()` — Thai Baht with Satang
- `numberToThaiText()` — Numbers to Thai words (for cheques)
- `calculateVAT()` — Inclusive/exclusive VAT
- `calculateWHT()` — Withholding tax
- `calculateAging()` — AR/AP aging (current, 30, 60, 90, 90+ days)

### Tax Rates

```
VAT: 7%
WHT PND3: progressive [0, 5, 10, 15, 20, 25, 30, 35]%
WHT PND53: service 3%, rent 5%, professional 3%, contract 1%, advertising 2%
SSC: 5% capped at ฿750/month
```

### Account Codes (Thai Standard)

`1xxx` Assets · `2xxx` Liabilities · `3xxx` Equity · `4xxx` Revenue · `5xxx` Expenses

## Database

### Core Models

`Company`/`SystemSettings` (1:1, tax rate config), `ChartOfAccount` (181 seeded, self-referential hierarchy), `JournalEntry`/`JournalLine`, `Customer`/`Vendor`, `Product`, `Invoice`/`InvoiceLine`, `PurchaseInvoice`, `Receipt`/`ReceiptAllocation`, `Payment`, `CreditNote`/`DebitNote`, `Quotation`/`QuotationLine`, `BankAccount`/`Cheque`, `Asset`/`Depreciation`, `Employee`/`PayrollRun`/`PayrollItem`, `PettyCashFund`/`PettyCashVoucher`, `StockMovement`/`StockBalance`/`StockTake`/`StockTransfer`/`Warehouse`, `DocumentNumber`, `WithholdingTax`/`VatRecord`, `User`, `ActivityLog`/`SecurityAuditLog`/`UserSession`, `Currency`, `WebhookConfig`/`WebhookDelivery`

### Document Status Flow

```
DRAFT → ISSUED/POSTED → PAID → CANCELLED/REVERSED
```

Documents **must be posted** to generate journal entries (`journalEntryId` becomes non-null on post).

## Environment Variables

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

## Production Build

```bash
bun run build
```

**CRITICAL**: After build, update `DATABASE_URL` in `.next/standalone/.env` to an **absolute path**:
```env
DATABASE_URL=file:/absolute/path/to/.next/standalone/dev.db
```
Relative paths cause Prisma to connect to the wrong database (empty), resulting in login failures.

### Deployment Checklist

1. `bun run db:generate` → `bun run db:push` → `npx prisma db seed`
2. Set `DATABASE_URL` (absolute), `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `NODE_ENV=production`
3. `bun run build` → update `.next/standalone/.env` → `bun run start`
4. `./scripts/health-check.sh` to verify

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| URL doesn't change on navigation | Missing route mapping | Add to both `moduleToPath` + `pathToModule` in `page.tsx` |
| API 403 Forbidden | Missing CSRF token or auth | Check `src/middleware.ts`; add `x-playwright-test: true` for tests |
| "table does not exist" | Wrong DATABASE_URL | Use absolute path in `.next/standalone/.env` |
| Prisma browser bundle error | Importing `db.ts` in client component | Keep Prisma server-side only |
| Tests rate-limited | Missing bypass header | Verify `x-playwright-test: true` in `src/middleware.ts` |
| Journal entries don't balance | Debit ≠ Credit | Check service layer; all `prisma.$transaction()` must balance |
| Thai fonts missing in PDF | Missing font registration | Check `public/fonts/THSarabunNew.ttf` exists |
| Login fails (standalone) | Relative DATABASE_URL | Absolute path in `.next/standalone/.env` |
| Wrong monetary amounts | Satang/Baht mismatch | Check division/multiplication by 100 at API boundary |
| Deleted records appearing | Missing soft-delete filter | Add `where: { deletedAt: null }` to Prisma queries |

## Mobile Responsiveness & Theming

### Mobile-First Design

The app is fully responsive with mobile-optimized patterns:

- **Mobile Navigation**: Hamburger menu (<768px) via `Sheet` component, sidebar on desktop
- **Responsive Grids**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` pattern throughout
- **Touch Targets**: Minimum 44×44px for all interactive elements (iOS/Android standard)
- **Table Scrolling**: `overflow-x-auto` wrapper for horizontal scroll on mobile
- **Dialog Sizing**: `max-w-[95vw] md:max-w-2xl` pattern (full-width mobile, fixed desktop)

**Key Files**:
- `/src/app/page.tsx` - Mobile hamburger implementation (lines 452-474)
- `/src/components/layout/keerati-sidebar.tsx` - Responsive sidebar
- `/src/app/globals.css` - Theme CSS variables

### Theme System

8 built-in color themes with dark mode support:

| Theme | Name (TH) | Gradient |
|-------|-----------|----------|
| default | ชมพูพาสเทล | #ffb6c1 → #ffd1dc |
| mint | มิ้นท์สดชื่น | #98ddca → #b5eadd |
| lavender | ลาเวนเดอร์ | #dcd0ff → #e6e6fa |
| peach | พีชหวาน | #ffdab9 → #ffe4d6 |
| sky | ฟ้าสดใส | #87ceeb → #b5eaff |
| lemon | เลมอนสด | #fff68f → #fffacd |
| coral | คอรัลพีช | #ff9e8d → #ffb6b0 |
| professional | อาชีพแอมเบอร์ | #F59E0B → #FBBF24 |

**Theme Customization**:
- Access via sidebar: "ปรับแต่งธีม" button
- Options: Color theme, dark mode, animations, border radius, accent intensity
- Stored in localStorage (`keerati-theme-storage`)
- Zustand store: `/src/stores/theme-store.ts`

**CSS Variables**:
- `--primary`, `--foreground`, `--background`, etc.
- Dark mode: `.dark` class on `<html>`
- Theme variants: `[data-theme="mint"]` attribute

**Usage**:
```typescript
import { useThemeStore } from '@/stores/theme-store'
const { theme, setTheme, toggleDarkMode } = useThemeStore()
```

**Documentation**:
- `/MOBILE_FEATURES.md` - User-facing mobile guide
- `/DEVELOPER_MOBILE_GUIDE.md` - Developer mobile patterns
- `/THEME_CUSTOMIZATION.md` - Theme system documentation
- `/TESTING_CHECKLIST.md` - QA checklist for mobile/themes

## Active Work: UI/UX Redesign

**Status**: Phase 1 ✅ Complete — Phase 2 & 3 Pending

A comprehensive UI/UX redesign improving user workflow and empathy. Original components backed up to `src/components.invoices.backup-20260414/`.

### Backup & Rollback
```bash
# Rollback invoice changes: cp src/components.invoices.backup-20260414/* src/components/invoices/
git tag ui-redesign-invoice-done    # after invoice module
git tag ui-redesign-grn-done        # after GRN module
```

### Phase 1: Invoice Redesign ✅ (Complete)
- ✅ Quick filter buttons (ทั้งหมด/รอดำเนินการ/เร่งด่วน/เสร็จสิ้น)
- ✅ Aging color badge (🔴 overdue/🟡 approaching/🟢 paid)
- ✅ Outstanding amount column (ยอดค้างรับ)
- ✅ Explicit "Post" button in row actions
- ✅ Invoice edit: 3 tabs (Details | Comments & Audit | Related)
- ✅ Invoice creation: WHT guidance tooltip with PND.53 rates

### Phase 2: GRN + Three-Way Match (Pending)
- New GRN components (list, form, detail)
- Three-way match validation in purchase invoices
- Variance report UI

### Phase 3: Receipt/Payment + Navigation (Pending)
- Receipt: 2-panel allocation layout
- Payment: WHT category dropdown with PND.53 rate guidance
- Sidebar: workflow-grouped (Sell → Buy → Accounting → Reports)

## Important Notes

- **Never** import `src/lib/db.ts` in client components — server-side only
- **Never** disable rate limiting in production
- **Always** use `prisma.$transaction()` for multi-step financial operations
- **Always** verify database integrity after schema changes: `bun run test:verify-db`
- Currency: always THB (฿) with 2 decimal places; stored as Satang integers in DB
- Dates: always Thai Buddhist era format for user-facing display
- See `FUTURE_WORK.md` for planned features roadmap
