<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-16 -->

# src

## Purpose
Main application source code directory containing the complete Thai Accounting ERP system implementation.

## Key Files
| File | Description |
|------|-------------|
| `middleware.ts` | Next.js middleware for rate limiting, CSRF, and auth |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `app/` | Next.js App Router and API routes (see `app/AGENTS.md`) |
| `components/` | React UI components organized by feature (see `components/AGENTS.md`) |
| `lib/` | Business logic services and utilities (see `lib/AGENTS.md`) |
| `hooks/` | Custom React hooks |
| `stores/` | Zustand state management stores |
| `types/` | TypeScript type definitions |

## For AI Agents

### Working In This Directory
- All paths use @/ alias mapping to src/
- Follow TypeScript strict mode guidelines
- Use existing service layer for business logic
- Maintain separation between components and services

### Common Patterns
- Service layer pattern in lib/*-service.ts
- API routes follow REST conventions in app/api/
- Components organized by feature domain
- State via Zustand stores or TanStack Query

## Dependencies

### Internal
- Uses Prisma client from lib/db.ts
- NextAuth configuration from lib/auth.ts
- Shared utilities in lib/

### External
- Next.js 16 - App Router framework
- React 19 - UI framework
- Prisma - Database ORM
- Zustand - State management
- TanStack Query - Data fetching