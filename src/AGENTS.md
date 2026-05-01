<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-26 -->

# src

## Purpose

Main application source code directory for the Thai Accounting ERP system
(Keerati).

## Key Files

| File                 | Description                                     |
| -------------------- | ----------------------------------------------- |
| `middleware.ts`      | Rate limiting, CSRF protection, auth middleware |
| `instrumentation.ts` | Next.js instrumentation                         |

## Subdirectories

| Directory     | Purpose                                                      |
| ------------- | ------------------------------------------------------------ |
| `app/`        | Next.js App Router + 64 API route dirs (see `app/AGENTS.md`) |
| `components/` | 52 feature component dirs (see `components/AGENTS.md`)       |
| `lib/`        | 80+ service files, business logic (see `lib/AGENTS.md`)      |
| `hooks/`      | Custom React hooks                                           |
| `stores/`     | Zustand state management stores                              |
| `types/`      | TypeScript type definitions                                  |

## For AI Agents

### Working In This Directory

- All paths use `@/` alias mapping to `src/`
- Follow TypeScript strict mode guidelines
- Use service layer for business logic — keep API routes thin
- Monetary values always in Satang (integer)

### Common Patterns

- **Service Layer**: `src/lib/*-service.ts` — business logic
- **API Routes**: `src/app/api/[resource]/route.ts` — REST endpoints
- **Components**: `src/components/[module]/` — React UI
- **State**: Zustand stores or TanStack Query

### Critical Rules

1. **Satang/Baht**: Use `bahtToSatang()` on input, `satangToBaht()` on output
2. **Soft deletes**: Add `where: { deletedAt: null }` to all queries
3. **Auth helpers**: `requireAuth()`, `requireRole()`, `canEdit()`, `isAdmin()`
4. **Double-entry**: All GL transactions must balance (debit = credit)
5. **Zod validation**: All API inputs validated via schemas in
   `lib/validations.ts`

### Architecture

- **Hybrid SPA**: All pages render from `app/page.tsx` via `activeModule` state
- **No standard Next.js routing** — client-side navigation only
- See `app/AGENTS.md` for the 6-step module addition process

## Dependencies

### Internal

- Prisma client from `lib/db.ts`
- NextAuth from `lib/auth.ts`
- Services in `lib/`

### External

- Next.js 16, React 19, Prisma v6, Zustand v5, TanStack Query v5
