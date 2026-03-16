# ADR-003: Why SQLite for Development, PostgreSQL for Production

## Status
Accepted

## Context
We needed to decide on database technology for different environments. Requirements:
- Easy development setup
- Zero configuration for developers
- Production-ready performance
- ACID compliance
- Cost-effectiveness

## Decision
We chose **SQLite** for development and **PostgreSQL** for production.

## Consequences

### Positive
- **Zero setup**: SQLite requires no installation or configuration
- **File-based**: Easy to copy, backup, and share databases
- **Prisma compatibility**: Same Prisma schema works for both
- **Development speed**: Fast iteration without database server
- **Production performance**: PostgreSQL handles high concurrency
- **Advanced features**: PostgreSQL offers advanced features when needed
- **Cost**: Both are free and open-source

### Negative
- **Behavioral differences**: Some edge cases may behave differently
- **SQLite limitations**: No stored procedures, limited ALTER TABLE
- **Migration complexity**: Need to test migrations on both databases
- **Production-only features**: Some PostgreSQL features not available in SQLite

## Implementation Strategy

### Development (.env)
```env
DATABASE_URL=file:./prisma/dev.db
```

### Production (.env)
```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

### Prisma Schema
```prisma
datasource db {
  provider = "sqlite" // Change to "postgresql" for production
  url      = env("DATABASE_URL")
}
```

## Migration Path
1. Develop with SQLite
2. Test thoroughly
3. Switch to PostgreSQL for production
4. Run migrations on PostgreSQL
5. Test again in production-like environment

## Alternatives Considered

### 1. PostgreSQL for all environments
- Pros: Consistency across environments
- Cons: Requires Docker or local PostgreSQL setup, more complex for developers

### 2. MySQL
- Pros: Widely used
- Cons: Less advanced features than PostgreSQL, Oracle ownership concerns

### 3. MongoDB
- Pros: Schema flexibility
- Cons: Not suitable for transactional financial data

## Decision Drivers
1. Developer experience
2. Zero configuration for new developers
3. Production performance
4. ACID compliance for financial data
5. Cost

## References
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma Database Connectors](https://www.prisma.io/docs/reference/database-reference/supported-databases)

## Date
March 16, 2026

## Author
Development Team
