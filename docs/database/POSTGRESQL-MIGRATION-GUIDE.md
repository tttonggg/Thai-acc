# Thai Accounting ERP - PostgreSQL Migration Guide

# โปรแกรมบัญชีมาตรฐานไทย - คู่มือการย้ายไป PostgreSQL

## Overview

This guide provides step-by-step instructions for migrating the Thai Accounting
ERP system from SQLite to PostgreSQL.

## Benefits of PostgreSQL

1. **Concurrent Access**: Multiple users can access the database simultaneously
2. **Advanced Features**: Full-text search, materialized views, partitioning
3. **Better Performance**: Optimized for concurrent workloads
4. **Enterprise Features**: Point-in-time recovery, replication
5. **Larger Scale**: Supports databases up to petabytes

## Prerequisites

- PostgreSQL 14+ installed
- psql and pg_dump utilities available
- Sufficient disk space (2x current database size)
- Backup of current SQLite database

## Migration Steps

### Step 1: Install PostgreSQL

#### Ubuntu/Debian

```bash
sudo apt update
sudo apt install postgresql-14 postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

#### macOS

```bash
brew install postgresql@14
brew services start postgresql@14
```

#### Windows

Download installer from https://www.postgresql.org/download/windows/

### Step 2: Create Database and User

```bash
# Switch to postgres user
sudo -u postgres psql

-- Create database
CREATE DATABASE thai_accounting;

-- Create user
CREATE USER thaiacc WITH ENCRYPTED PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE thai_accounting TO thaiacc;

-- Enable required extensions
\c thai_accounting
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Exit
\q
```

### Step 3: Update Environment Configuration

Create or update `.env` file:

```env
# PostgreSQL Configuration
DATABASE_URL=postgresql://thaiacc:your_secure_password@localhost:5432/thai_accounting

# Connection Pool Settings
DATABASE_MAX_CONNECTIONS=20
DATABASE_CONNECTION_TIMEOUT=30

# Optional: Read replica for reports
# DATABASE_READ_URL=postgresql://thaiacc:password@replica-host:5432/thai_accounting
```

### Step 4: Apply Enhanced Schema

```bash
# Copy the PostgreSQL schema
cp prisma/schema-enhanced.prisma prisma/schema.prisma

# Generate Prisma client
bun run db:generate

# Push schema to database
bun run db:push
```

### Step 5: Run Data Migration Script

```bash
# Install required dependencies
bun install pg pg-hstore

# Run migration script
bun run scripts/migrate-to-postgres.ts
```

### Step 6: Verify Migration

```bash
# Check row counts
psql -U thaiacc -d thai_accounting -c "SELECT 'ChartOfAccount' as table_name, COUNT(*) FROM \"ChartOfAccount\" UNION ALL SELECT 'JournalEntry', COUNT(*) FROM \"JournalEntry\" UNION ALL SELECT 'Invoice', COUNT(*) FROM \"Invoice\";"

# Verify data integrity
psql -U thaiacc -d thai_accounting -f scripts/verify-migration.sql
```

### Step 7: Apply PostgreSQL Optimizations

```bash
# Run triggers and functions
psql -U thaiacc -d thai_accounting -f prisma/postgresql/triggers.sql

# Create materialized views
psql -U thaiacc -d thai_accounting -f prisma/postgresql/materialized-views.sql

# Setup partitioning (optional, for large datasets)
psql -U thaiacc -d thai_accounting -f prisma/postgresql/partitioning.sql
```

### Step 8: Update Application Configuration

Update `src/lib/db.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prismaInstance =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
    // Connection pooling for PostgreSQL
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

// Connection health check (PostgreSQL only)
if (process.env.DATABASE_URL?.includes('postgresql')) {
  setInterval(async () => {
    try {
      await prismaInstance.$queryRaw`SELECT 1`;
    } catch (error) {
      console.error('Database connection lost:', error);
    }
  }, 30000); // Check every 30 seconds
}

if (process.env.NODE_ENV !== 'production')
  globalForPrisma.prisma = prismaInstance;

export const prisma = prismaInstance;
export const db = prismaInstance;
export default prismaInstance;
```

### Step 9: Configure Connection Pooling

For production, use PgBouncer:

```bash
# Install PgBouncer
sudo apt install pgbouncer

# Configure /etc/pgbouncer/pgbouncer.ini
[databases]
thai_accounting = host=localhost port=5432 dbname=thai_accounting

[pgbouncer]
listen_port = 6432
listen_addr = 127.0.0.1
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
```

Update connection string:

```env
DATABASE_URL=postgresql://thaiacc:password@localhost:6432/thai_accounting
```

### Step 10: Test and Deploy

```bash
# Run database tests
bun run test:db

# Start application
bun run build
bun run start
```

## Post-Migration Checklist

- [ ] All data migrated successfully
- [ ] Row counts match between SQLite and PostgreSQL
- [ ] Application starts without errors
- [ ] User authentication works
- [ ] All API endpoints respond correctly
- [ ] Financial reports generate properly
- [ ] Backup scripts updated for PostgreSQL
- [ ] Monitoring configured for PostgreSQL
- [ ] Performance benchmarks pass

## Rollback Procedure

If issues occur:

1. Stop the application
2. Restore `.env` with SQLite configuration
3. Restore SQLite database from backup
4. Restart application

## Troubleshooting

### Connection Issues

```bash
# Test connection
psql -U thaiacc -d thai_accounting -c "SELECT 1;"

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### Performance Issues

```sql
-- Check slow queries
SELECT query, calls, mean_time, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Analyze tables
ANALYZE "Invoice";
ANALYZE "JournalEntry";
```

### Data Type Issues

SQLite to PostgreSQL type mappings:

- `BOOLEAN`: Same
- `INTEGER`: Same
- `BIGINT`: Same
- `REAL`: Same
- `TEXT`: `VARCHAR(n)` or `TEXT`
- `BLOB`: `BYTEA`
- `NUMERIC`: `NUMERIC` or `DECIMAL`

## Full-Text Search Configuration

```sql
-- Enable Thai full-text search
CREATE TEXT SEARCH CONFIGURATION thai (COPY = english);

-- Create GIN indexes for search
CREATE INDEX idx_customer_search ON "Customer"
USING GIN (to_tsvector('thai', name || ' ' || COALESCE(address, '')));

CREATE INDEX idx_product_search ON "Product"
USING GIN (to_tsvector('thai', name || ' ' || COALESCE(description, '')));
```

## Monitoring Setup

```sql
-- Enable pg_stat_statements
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
SELECT pg_reload_conf();

-- Create extension
CREATE EXTENSION pg_stat_statements;

-- Query to monitor top queries
SELECT
    substring(query, 1, 100) as query_snippet,
    calls,
    round(total_exec_time::numeric, 2) as total_time,
    round(mean_exec_time::numeric, 2) as avg_time,
    rows
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;
```
