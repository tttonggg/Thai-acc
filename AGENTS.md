<!-- Generated: 2026-04-26 | Updated: 2026-04-26 -->

# Thai-Acc / Keerati Thai Accounting ERP

## Purpose

Full-stack Thai accounting ERP system (Keerati) built with Next.js 16 App Router, Prisma ORM, and TypeScript. Designed for Thai SMEs as an affordable alternative to expensive ERP packages like PEAK AFP.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Database** | Prisma ORM (SQLite dev, PostgreSQL prod) |
| **Auth** | NextAuth.js v4 + RBAC |
| **State** | Zustand v5 (client) + TanStack Query v5 (server) |
| **UI** | React 19 + shadcn/ui + Tailwind CSS v4 |
| **Testing** | Playwright (E2E) + Vitest (unit) |
| **Runtime** | Bun |

## Key Files

| File | Description |
|------|-------------|
| `package.json` | Dependencies and scripts |
| `next.config.ts` | Next.js configuration |
| `prisma/schema.prisma` | Database schema (118K, 280+ models) |
| `src/middleware.ts` | Rate limiting, CSRF, auth middleware |
| `src/app/page.tsx` | SPA entry point (~500 lines) |
| `src/app/globals.css` | Global Tailwind styles |

## Architecture

```
Thai-Acc/
├── src/app/          # Next.js App Router + 64 API route dirs
├── src/components/   # 52 feature component dirs
├── src/lib/          # 80+ service files (business logic)
├── src/hooks/        # Custom React hooks
├── src/stores/       # Zustand state stores
├── src/types/        # TypeScript definitions
├── prisma/           # Schema + migrations + seed
├── e2e/              # Playwright E2E tests + workflows
├── tests/            # Unit + integration tests
├── infra/            # Docker, Caddy, Terraform, K8s, Nginx
└── deploy/           # VPS deployment scripts
```

## Critical Patterns

### Monetary Values (Satang/Baht)
All amounts stored as **Satang integers**. Conversion via `@/lib/currency`:
- `bahtToSatang()` — user input → database
- `satangToBaht()` — database → display

### Hybrid SPA Routing
App uses client-side SPA pattern via `activeModule` state, NOT standard Next.js file routing. See `src/app/AGENTS.md` for the 6-step module addition process.

### Authentication
- NextAuth.js session-based auth
- RBAC via `requireRole()`, `canEdit()`, `isAdmin()` helpers
- CSRF protection on all POST/PUT/PATCH/DELETE via `@/lib/csrf-service-server`

## For AI Agents

### Common Commands
```bash
npm run build        # Production build
npm run dev          # Development server
npx prisma db push   # Sync schema to database
npx prisma studio    # Open Prisma GUI
npm test             # Run tests (Vitest)
npm run test:e2e     # Playwright E2E tests
npm run lint         # ESLint check
```

### DB Migration
```bash
npx prisma migrate dev   # Create migration
npx prisma migrate deploy # Apply to prod
```

### Adding New Modules
See `src/app/AGENTS.md` — 6-step process for adding SPA modules.

### Important Rules
- All monetary values in Satang (integer), never floats
- Use Prisma transactions for double-entry accounting
- Validate all API inputs with Zod schemas
- Soft delete: add `where: { deletedAt: null }` to all queries
- Use service layer (`src/lib/*-service.ts`) not raw route logic

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `src/app/` | App Router, API routes, SPA entry (see `src/app/AGENTS.md`) |
| `src/components/` | React components (see `src/components/AGENTS.md`) |
| `src/lib/` | Business services, auth, utilities (see `src/lib/AGENTS.md`) |
| `src/hooks/` | Custom React hooks |
| `src/stores/` | Zustand state stores |
| `src/types/` | TypeScript type definitions |
| `prisma/` | Database schema and migrations |
| `e2e/` | Playwright E2E tests and workflows |
| `tests/` | Vitest unit and integration tests |
| `docs/` | ADRs, database docs, tutorials |
| `infra/` | Docker, Kubernetes, Terraform, Nginx configs |
| `deploy/` | VPS deployment scripts and configs |

## Dependencies

- **Next.js 16** + **React 19** — App Router framework
- **Prisma v6** — Database ORM with 280+ models
- **NextAuth.js v4** — Authentication
- **Zod v4** — Schema validation
- **Zustand v5** — Client state
- **TanStack Query v5** — Server state
- **Tailwind CSS v4** — Styling
- **shadcn/ui** — Component library
- **Playwright** — E2E testing
- **Vitest** — Unit testing
- **Bun** — JavaScript runtime

## Testing

```bash
npm test             # Vitest unit tests
npm run test:e2e    # Playwright E2E
npm run test:integration  # Integration tests
```

## Production

Build: `npm run build` → standalone output in `.next/`
Deploy via `deploy/` scripts to VPS with Docker/Caddy