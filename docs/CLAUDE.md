# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Core Principles

### 1. Think Before Coding
Don't assume. Don't hide confusion. Surface tradeoffs.
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First
Minimum code that solves the problem. Nothing speculative.
- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

### 3. Surgical Changes
Touch only what you must. Clean up only your own mess.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.
- Every changed line should trace directly to the user's request.
- When your changes create orphans, remove unused imports/variables/functions.

### 4. Goal-Driven Execution
Define success criteria. Loop until verified.
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- For multi-step tasks, state a brief plan before executing
- Strong success criteria let you loop independently.

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

**⚠️ CRITICAL**: After `db:reset`, ALWAYS verify data uses correct Satang format. See "Monetary Storage" section below.

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

### 🔴 Monetary Storage: Integer Satang (CRITICAL - READ THIS FIRST!)

**⚠️ CRITICAL RULE**: ALL monetary values in the database MUST be stored as **integers in Satang** (1/100 Baht).

**Example**:
- User enters: `฿1,234.56` (Baht)
- Database stores: `123456` (Satang as integer)
- Display shows: `฿1,234.56` (after ÷100 conversion)

**🚨 COMMON BUG - Mixed Data Formats**:
- Legacy bug: Some old data stored Baht directly (NOT converted to Satang)
- This causes 100x display errors when new code correctly converts
- **Solution**: Database reset + clean seed required

**✅ CORRECT Pattern** (from `src/lib/currency.ts`):
```typescript
// User input → Database (POST routes)
import { bahtToSatang } from '@/lib/currency'

const invoice = await prisma.invoice.create({
  data: {
    totalAmount: bahtToSatang(userEnteredAmount), // 1234.56 → 123456
    // ...
  }
})

// Database → Display (GET routes)
import { satangToBaht } from '@/lib/currency'

const invoice = await prisma.invoice.findUnique({ where: { id } })
return {
  ...invoice,
  totalAmount: satangToBaht(invoice.totalAmount), // 123456 → 1234.56
}
```

**❌ WRONG - Don't do this**:
```typescript
// WRONG: Storing Baht directly
totalAmount: userEnteredAmount  // ❌ Stores 1234.56 as float (wrong!)

// WRONG: Not converting on GET
totalAmount: invoice.totalAmount  // ❌ Returns Satang as if it's Baht (100x bug!)
```

**📋 Modules Using Monetary Values** (ALL must follow Satang pattern):
- ✅ Invoices (`/api/invoices/route.ts`)
- ✅ Receipts (`/api/receipts/route.ts`)
- ✅ Payments (`/api/payments/route.ts`)
- ✅ Purchase Invoices (`/api/purchases/route.ts`)
- ✅ Purchase Orders (`/api/purchase-orders/route.ts`)
- ✅ Quotations (`/api/quotations/route.ts`)
- ✅ Credit Notes (`/api/credit-notes/route.ts`)
- ✅ Debit Notes (`/api/debit-notes/route.ts`)
- ✅ Journal Entries (`/api/journal/route.ts`)
- ✅ Petty Cash (`/api/petty-cash/vouchers/route.ts`)
- ✅ Assets (`/api/assets/route.ts`)
- ✅ Payroll (`/api/payroll/route.ts`)

**🔍 Verification**:
```bash
# Check database values (should be large integers)
sqlite3 prisma/dev.db "SELECT totalAmount FROM Invoice LIMIT 5;"
# Correct: 123456, 987654 (Satang)
# Wrong: 1234.56, 9876.54 (Baht - needs fix)
```

**⚠️ If you see wrong values**:
1. DO NOT use format detection hacks
2. DO reset database: `bun run db:reset`
3. DO re-seed: `npx prisma db seed`
4. DO verify: Run `bun run test:verify-db`

### Key Patterns

- **Service Layer**: Business logic in `src/lib/*-service.ts`. API routes call services; keep routes thin.
- **Double-Entry**: All transactions must balance (debit = credit). Use `prisma.$transaction()`.
- **Document-Driven**: Invoices/receipts/payments auto-generate journal entries on post via `journalEntryId` (null until posted).
- **GL Posting**: Fixed Assets (depreciation), Payroll (expenses/taxes), Petty Cash, Banking, Inventory all auto-post GL entries.
- **Document Numbering**: Use `generateDocNumber(type, prefix)` from `api-utils.ts` — transaction-safe sequential numbering via `DocumentNumber` model. Never implement ad-hoc numbering.
- **Soft Deletes**: Most entities have `deletedAt DateTime?`. Always add `where: { deletedAt: null }` in queries.
- **Idempotency**: `JournalEntry` and `Receipt` have `idempotencyKey String? @unique` to prevent duplicate records from network retries.

### Gap Closure Status (vs PEAK Manual)

**Completed (Backend + UI)**:
- ✅ Cash Flow Statement - API + UI (`src/app/api/reports/cash-flow/`, `cash-flow-report.tsx`)
- ✅ PP30 Form PDF - API + UI (`src/lib/pdf-generator.ts` - `generatePP30PDF`, `tax-form-management.tsx`)
- ✅ WHT Form PDF - API + UI (`generatePND3PDF`, `generatePND53PDF`)
- ✅ Bank Statement Import - API + UI (`bank-statement-import.tsx`, `bank-matching.tsx`)
- ✅ Provident Fund - API + UI (`provident-fund-service.ts`, `provident-fund-management.tsx`)
- ✅ Leave Management - API + UI (`leave-service.ts`, `leave-management.tsx`)
- ✅ Asset Revaluation - API + UI (`asset-revaluation-dialog.tsx`)
- ✅ Recurring Documents - API + UI (`recurring-documents.tsx`, `scheduler.ts`)
- ✅ SSO Filing - API + UI (`sso-filing.tsx` with 50 ทวิ export)

**Sidebar Navigation Added**:
- ลางาน (Leave) - under PEOPLE
- กองทุนสำรองเลี้ยงชีพ (Provident) - under PEOPLE
- เอกสารประจำ (Recurring) - under REPORTS
- งบกระแสเงินสด (Cash Flow) - under REPORTS
- ประกันสังคม (SSC) - under PEOPLE
- นำเข้า Bank (Import) - under BANKING tabs

**Pending/New Infrastructure Needed**:
- ⏳ Multi-instance background jobs (BullMQ + Redis) - single-instance scheduler running
- ⏳ Full DBD e-Filing integration (RD gateway)
- ⏳ Multi-company consolidation

### Security

1. **Rate Limiting** (`src/middleware.ts`) — bypass with `x-playwright-test: true` or localhost; `strict` preset for auth endpoints, `moderate` for general API
2. **CSRF** — required for POST/PUT/PATCH/DELETE on `/api/`; middleware checks header _presence_, route handlers validate token validity via `csrf-service-server.ts`; fetch token from `/api/csrf/token`, send as `x-csrf-token` header; exempt paths: `/api/auth/*`, `/api/csrf/token`, `/api/webhooks/`
3. **Auth helpers** (`src/lib/api-utils.ts`) — `requireAuth()` throws on unauthenticated (use in routes); `auth()` returns null if unauthenticated (use in conditionals); `requireRole([roles])`, `canEdit()` (ADMIN or ACCOUNTANT), `isAdmin()`
4. **Validation** — ALL API inputs must use Zod schemas (v4 — breaking API vs v3); never trust client-side validation
5. **SQL** — Always use Prisma parameterized queries; never raw SQL with user input

## Deployment

### VPS Tunnel Configuration (IMPORTANT - DO NOT TOUCH OTHER TUNNELS)

**🚨 CRITICAL RULE**: This project uses ONLY `acc.k56mm.uk` via tunnel `e4880092-554d-471c-aa65-ec8c25b7e6bd`. Other tunnels on the VPS belong to different projects — **never touch them**.

**SSH Connection**:
```bash
ssh -i ~/.ssh/test root@135.181.107.76
```

**Tunnel details**:
- Tunnel ID: `e4880092-554d-471c-aa65-ec8c25b7e6bd`
- Credentials: `/root/.cloudflared/e4880092-554d-471c-aa65-ec8c25b7e6bd.json`
- Domain: `acc.k56mm.uk`
- Target: `http://localhost:3000`

**⚠️ NEVER run commands that affect tunnels** (including but not limited to):
- `cloudflared tunnel list`, `cloudflared tunnel run`, `cloudflared tunnel route`, `cloudflared tunnel delete`, `killall cloudflared`
- Any `cloudflared` commands unless specifically for `acc.k56mm.uk` and tunnel `e4880092`
- `killall cloudflared` (kills ALL tunnels, not just this project's)

**To restart the production server only** (not the tunnel):
```bash
ssh -i ~/.ssh/test root@135.181.107.76 "docker restart thai-acc-app"
```

**To check server status** (without touching tunnel):
```bash
ssh -i ~/.ssh/test root@135.181.107.76 "curl -s http://localhost:3000/api/health"
```

**⚠️ IMPORTANT - Other projects on VPS**: `/root/thai-acc/` belongs to a DIFFERENT project (acc3.k56mm.uk). Our project runs as Docker container `thai-acc-app` with data at `/root/data/thai-acc-erp/`. **Never touch `/root/thai-acc/`.**

**Container details**:
- Container: `thai-acc-app`
- Image: `ghcr.io/tttonggg/thai-acc:latest`
- Port: 3000
- Volume: `/root/data/thai-acc-erp:/app/prisma` (SQLite database)
- DB ownership: UID 1001 (nextjs user)

### Production Deployment (Docker CI/CD)

**Push to master triggers automatic deployment via GitHub Actions:**
1. `deploy-vps.yml` builds Docker image on GitHub Actions (Linux-native)
2. Pushes to GitHub Container Registry (GHCR)
3. SSH into VPS, pulls `:latest` image, recreates container

**Manual deploy (if needed):**
```bash
ssh -i ~/.ssh/test root@135.181.107.76 "
  docker stop thai-acc-app 2>/dev/null; docker rm thai-acc-app 2>/dev/null
  docker pull ghcr.io/tttonggg/thai-acc:latest
  docker run -d --name thai-acc-app --restart unless-stopped -p 3000:3000 \
    -e NODE_ENV=production \
    -e DATABASE_URL=file:/app/prisma/dev.db \
    -e NEXTAUTH_URL=https://acc.k56mm.uk \
    -e NEXTAUTH_SECRET=B/lLqgzybPsxU6dNnvb/wG5XuEpfVfU68pVN0A7KseY= \
    -e BYPASS_CSRF=true \
    -v /root/data/thai-acc-erp:/app/prisma \
    ghcr.io/tttonggg/thai-acc:latest
  chown -R 1001:1001 /root/data/thai-acc-erp/
"
```

**⚠️ CROSS-PLATFORM NOTE**: Never build standalone on macOS and deploy to Linux VPS (Prisma engine mismatch). Always use Docker CI/CD pipeline.

---

## Framework Architecture: Module Plugin System

**Goal**: Transform Thai ACC into a framework where new modules can be added with ~200 lines (manifest + schema) instead of ~1,500 lines of duplicated code.

### Why Refactor

- **157 form components** with ~70% identical logic
- Top components: 900-1,270 lines each (fat components)
- Invoice, Purchase, Receipt, Quotation forms are nearly identical
- New modules require copy-paste of entire form + list + API pattern

### Current Problem vs Target

| Aspect | Current | Target |
|--------|---------|--------|
| Module registration | 6 manual steps in page.tsx + sidebar | Auto-discovery via registry |
| Form components | Duplicated per module | Generic `BaseForm<T>` |
| Data tables | Duplicated per module | Generic `DataTable<T>` |
| API routes | Hardcoded per module | Factory pattern |
| Bundle | All 43 modules eager-loaded | Lazy-load by route |

### Target Architecture

```
src/
├── framework/                    # Built once, used by all modules
│   ├── module-registry.ts        # Auto-discover + register modules
│   ├── module-manifest.ts        # Module metadata type definitions
│   ├── types/
│   │   ├── entity.ts             # Generic entity<T> interface
│   │   ├── form-schema.ts        # Form field + validation schema
│   │   └── list-config.ts        # Sortable columns, filters, actions
│   ├── components/
│   │   ├── DataTable.tsx         # Reusable list shell (~500 lines)
│   │   ├── BaseForm.tsx          # Generic create/edit wrapper (~300 lines)
│   │   ├── LineItemEditor.tsx    # Shared line editor (~300 lines)
│   │   └── Field.tsx            # Input/select/date/money primitives
│   └── utils/
│       ├── schema-helpers.ts     # Zod schemas for common fields
│       └── api-factory.ts        # Per-module API client factory
│
├── modules/                      # New modules use plugin pattern
│   └── my-new-module/
│       ├── manifest.ts           # Module metadata only
│       ├── schema.prisma         # Database model
│       └── types.ts              # Typed entity
│
└── existing-modules/             # Migrate gradually (buy-side first)
```

### Migration Phases

| Phase | Scope | Lines Reduced | Effort |
|-------|-------|---------------|--------|
| 1 | Framework core: module-registry, BaseForm, DataTable, LineItemEditor, API Factory | ~20,000 | 2-3 weeks |
| 2 | Buy-side: invoices, purchases, receipts, quotations (60% identical) | ~15,000 | 3 weeks |
| 3 | Sell-side: customers, vendors, payments | ~8,000 | 2 weeks |
| 4 | Performance: code-splitting + lazy loading (43 modules → initial <500KB) | — | 1-2 weeks |
| 5 | Polish: module template CLI, docs, DX | — | 1 week |

**After Phase 2**: New modules take ~1 day instead of 1-2 weeks.

### Key Refactoring Targets

| File | Current | Target | Savings |
|------|---------|--------|---------|
| `components/purchases/purchase-form.tsx` | 1,270 | 200 | ~1,070 |
| `components/invoices/invoice-form.tsx` | 888 | 200 | ~688 |
| `components/receipts/receipt-form.tsx` | 1,086 | 200 | ~886 |
| `components/quotations/quotation-form.tsx` | 996 | 200 | ~796 |
| `components/invoices/line-item-editor.tsx` | 911 | 300 | ~611 |
| **Total** | **5,151** | **1,100** | **~4,051** |

### Detailed Plan Location

Full multi-tier plan with workflows, file inventories, and technical decisions:
→ `/docs/MASTER-PLAN-FRAMEWORK.md`

### Progress Tracking

- [ ] Phase 1: Framework core built
- [ ] Phase 2: Buy-side migrated
- [ ] Phase 3: Sell-side migrated
- [ ] Phase 4: Performance optimization (lazy loading)
- [ ] Phase 5: Module template CLI + docs
- [ ] All legacy form components migrated to BaseForm<T>