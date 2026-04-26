<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-04-26 -->

# src/lib/graphql

## Purpose

GraphQL schema definitions, resolvers, and dataloaders for the Thai Accounting ERP API.

## Parent Reference
<!-- Parent: ../AGENTS.md -->

## Key Files

| File | Description |
|------|-------------|
| `schema.ts` | GraphQL type definitions |
| `resolvers.ts` | GraphQL resolvers |
| `dataloaders.ts` | Data loaders for N+1 query prevention |

## For AI Agents

- GraphQL endpoint at `/api/graphql`
- Use dataloaders to avoid N+1 queries
- Schema follows same business logic as REST API