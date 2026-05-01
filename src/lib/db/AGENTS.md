<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-04-26 -->

# src/lib/db

## Purpose

Database connection management, connection pooling, and query monitoring
utilities.

## Parent Reference

<!-- Parent: ../AGENTS.md -->

## Key Files

| File                 | Description                         |
| -------------------- | ----------------------------------- |
| `connection-pool.ts` | Database connection pool management |
| `query-monitor.ts`   | Query performance monitoring        |

## For AI Agents

- Use `import { prisma } from '@/lib/db'` for database access
- Connection pool configured for production workloads
- Query monitoring tracks slow queries for optimization
