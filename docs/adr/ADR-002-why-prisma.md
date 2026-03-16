# ADR-002: Why Prisma

## Status
Accepted

## Context
We needed an ORM (Object-Relational Mapping) tool for database operations. Requirements:
- Type-safe database queries
- Migration support
- Good developer experience
- Support for SQLite (initial) and PostgreSQL (future)
- Relationship handling
- Seeding capabilities

## Decision
We chose **Prisma** as our ORM.

## Consequences

### Positive
- **Type safety**: Full TypeScript support with generated types
- **Declarative schema**: Schema defined in Prisma schema file
- **Migrations**: Built-in migration system
- **Prisma Client**: Auto-generated, type-safe database client
- **Prisma Studio**: Visual database management tool
- **Relations**: Excellent handling of database relationships
- **Raw queries**: Can fall back to raw SQL when needed
- **Multi-database support**: SQLite for development, PostgreSQL for production

### Negative
- **Migration limitations**: Complex migrations can be difficult
- **Learning curve**: Need to learn Prisma schema syntax
- **Query performance**: Some queries may not be as optimized as hand-written SQL
- **Bundle size**: Prisma Client adds to bundle size

## Alternatives Considered

### 1. Drizzle
- Pros: Lightweight, SQL-like syntax, better performance
- Cons: Newer, smaller ecosystem, less mature

### 2. TypeORM
- Pros: Mature, decorators, active record pattern
- Cons: Complex configuration, inconsistent API, maintenance issues

### 3. Sequelize
- Pros: Mature, widely used
- Cons: Not TypeScript-first, callback-based API

### 4. Raw SQL + knex.js
- Pros: Full control, lightweight
- Cons: No type safety, more boilerplate

## Decision Drivers
1. Type safety
2. Developer experience
3. Migration support
4. Schema visualization
5. Community support

## Implementation

```prisma
// Example schema
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id    String @id @default(cuid())
  email String @unique
  name  String
}
```

## References
- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma vs TypeORM](https://www.prisma.io/docs/concepts/more/comparisons/prisma-and-typeorm)

## Date
March 16, 2026

## Author
Development Team
