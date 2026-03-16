# PostgreSQL Migration Guide
## Thai Accounting ERP System

This guide provides step-by-step instructions for migrating the Thai Accounting ERP System from SQLite to PostgreSQL.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [PostgreSQL Installation](#postgresql-installation)
3. [Database Setup](#database-setup)
4. [Data Migration](#data-migration)
5. [Application Configuration](#application-configuration)
6. [Post-Migration Tasks](#post-migration-tasks)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- PostgreSQL 14+ (recommended: 15 or 16)
- pgAdmin 4 or DBeaver (optional, for GUI management)
- Node.js 18+ and Bun
- AWS CLI (if using S3 for backups)

### Required PostgreSQL Extensions

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";      -- For text search
CREATE EXTENSION IF NOT EXISTS "btree_gist";   -- For exclusion constraints
```

---

## PostgreSQL Installation

### macOS

```bash
# Using Homebrew
brew install postgresql@15
brew services start postgresql@15

# Create database user
createuser -s postgres
```

### Ubuntu/Debian

```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Switch to postgres user
sudo -u postgres psql
```

### Windows

1. Download installer from https://www.postgresql.org/download/windows/
2. Run installer with default options
3. Remember the password set for postgres user

---

## Database Setup

### 1. Create Database and User

```bash
# Connect to PostgreSQL
psql -U postgres
```

```sql
-- Create database
CREATE DATABASE thai_acc_db;

-- Create application user
CREATE USER thai_acc_user WITH ENCRYPTED PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE thai_acc_db TO thai_acc_user;

-- Connect to database and grant schema privileges
\c thai_acc_db
GRANT ALL ON SCHEMA public TO thai_acc_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO thai_acc_user;
```

### 2. Enable Extensions

```sql
\c thai_acc_db

-- Required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gist";
```

---

## Data Migration

### Option 1: Using Prisma Migrate (Recommended for Fresh Install)

```bash
# 1. Update environment variables
export DATABASE_URL="postgresql://thai_acc_user:your_secure_password@localhost:5432/thai_acc_db"

# 2. Update schema.prisma to use PostgreSQL
cp prisma/schema-postgres.prisma prisma/schema.prisma

# 3. Generate Prisma client
bun run db:generate

# 4. Push schema to database
bun run db:push

# 5. Seed initial data
npx prisma db seed
```

### Option 2: Migration from SQLite with Data Export/Import

#### Step 1: Export Data from SQLite

```bash
# Create export directory
mkdir -p migration/export

# Export each table to CSV
sqlite3 prisma/dev.db <<EOF
.mode csv
.headers on
.output migration/export/customers.csv
SELECT * FROM Customer;
.output migration/export/products.csv
SELECT * FROM Product;
.output migration/export/invoices.csv
SELECT * FROM Invoice;
.output migration/export/invoice_lines.csv
SELECT * FROM InvoiceLine;
.output migration/export/journal_entries.csv
SELECT * FROM JournalEntry;
.output migration/export/journal_lines.csv
SELECT * FROM JournalLine;
.output migration/export/receipts.csv
SELECT * FROM Receipt;
.output migration/export/vendors.csv
SELECT * FROM Vendor;
.output migration/export/purchase_invoices.csv
SELECT * FROM PurchaseInvoice;
.output migration/export/chart_of_accounts.csv
SELECT * FROM ChartOfAccount;
.quit
EOF
```

#### Step 2: Create PostgreSQL Schema

```bash
# Update schema.prisma for PostgreSQL
cp prisma/schema-postgres.prisma prisma/schema.prisma

# Generate and push schema
bun run db:generate
bun run db:push
```

#### Step 3: Import Data to PostgreSQL

```bash
# Create import script
psql -U thai_acc_user -d thai_acc_db <<'EOF'
-- Import customers
COPY customers(id, code, name, name_en, tax_id, branch_code, address, 
    sub_district, district, province, postal_code, phone, fax, email, 
    website, contact_name, contact_phone, credit_limit, credit_days, 
    is_active, deleted_at, deleted_by, notes, external_ref_id, metadata, 
    created_at, updated_at)
FROM '/path/to/migration/export/customers.csv'
WITH (FORMAT csv, HEADER true);

-- Import chart of accounts
COPY chart_of_accounts(id, code, name, name_en, type, level, parent_id, 
    is_detail, is_system, is_active, notes, created_at, updated_at)
FROM '/path/to/migration/export/chart_of_accounts.csv'
WITH (FORMAT csv, HEADER true);

-- Import products
COPY products(id, code, name, name_en, description, category, unit, type, 
    sale_price, cost_price, vat_rate, vat_type, is_inventory, quantity, 
    min_quantity, income_type, costing_method, is_active, deleted_at, 
    deleted_by, notes, metadata, created_at, updated_at)
FROM '/path/to/migration/export/products.csv'
WITH (FORMAT csv, HEADER true);

-- Import journal entries
COPY journal_entries(id, entry_no, date, description, reference, 
    document_type, document_id, total_debit, total_credit, status, 
    is_adjustment, is_reversing, reversing_id, created_by_id, approved_by_id, 
    approved_at, idempotency_key, notes, is_active, deleted_at, deleted_by, 
    created_at, updated_at)
FROM '/path/to/migration/export/journal_entries.csv'
WITH (FORMAT csv, HEADER true);

-- Import journal lines
COPY journal_lines(id, entry_id, line_no, account_id, description, 
    debit, credit, reference, created_at, updated_at)
FROM '/path/to/migration/export/journal_lines.csv'
WITH (FORMAT csv, HEADER true);

-- Add more imports as needed...
EOF
```

### Option 3: Using pgloader (Fastest for Large Databases)

```bash
# Install pgloader
# macOS
brew install pgloader

# Ubuntu
sudo apt install pgloader

# Create migration script
cat > migration/load.script <<EOF
LOAD DATABASE
    FROM sqlite:///path/to/prisma/dev.db
    INTO postgresql://thai_acc_user:password@localhost:5432/thai_acc_db
    WITH include drop, create tables, create indexes, reset sequences
    SET work_mem to '16MB', maintenance_work_mem to '512 MB'
    CAST type datetime to timestamptz
    ALTER SCHEMA 'main' RENAME TO 'public';
EOF

# Run migration
pgloader migration/load.script
```

---

## Application Configuration

### 1. Update Environment Variables

```bash
# .env file
DATABASE_URL="postgresql://thai_acc_user:your_secure_password@localhost:5432/thai_acc_db?schema=public"

# Connection pooling (recommended)
DATABASE_URL="postgresql://thai_acc_user:your_secure_password@localhost:5432/thai_acc_db?schema=public&connection_limit=10"
```

### 2. Configure Connection Pooling (PgBouncer)

For production environments, use PgBouncer:

```bash
# Install PgBouncer
sudo apt install pgbouncer

# Configure /etc/pgbouncer/pgbouncer.ini
[databases]
thai_acc_db = host=localhost port=5432 dbname=thai_acc_db

[pgbouncer]
listen_port = 6432
listen_addr = 127.0.0.1
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
reserve_pool_size = 5
reserve_pool_timeout = 3
```

### 3. SSL Configuration (Production)

```bash
# Update .env for SSL
DATABASE_URL="postgresql://thai_acc_user:password@host:5432/thai_acc_db?sslmode=require"

# Or with certificate files
DATABASE_URL="postgresql://thai_acc_user:password@host:5432/thai_acc_db?sslmode=require&sslcert=client-cert.pem&sslkey=client-key.pem&sslrootcert=ca.pem"
```

---

## Post-Migration Tasks

### 1. Apply Performance Optimizations

```bash
# Connect to PostgreSQL
psql -U thai_acc_user -d thai_acc_db

-- Apply check constraints
\i prisma/postgresql/check-constraints.sql

-- Apply unique constraints
\i prisma/postgresql/unique-constraints.sql

-- Apply indexes
\i prisma/postgresql/performance-indexes.sql

-- Create triggers
\i prisma/postgresql/triggers-complete.sql

-- Create materialized views
\i prisma/postgresql/materialized-views.sql

-- Setup partitioning (optional)
\i prisma/postgresql/partitioning.sql
```

### 2. Create Scheduled Jobs

```sql
-- Refresh materialized views (run daily)
SELECT cron.schedule('refresh-materialized-views', '0 2 * * *', 
    'SELECT refresh_all_materialized_views()');

-- Maintain partitions (run monthly)
SELECT cron.schedule('maintain-partitions', '0 3 1 * *', 
    'SELECT maintain_partitions()');

-- Analyze tables (run weekly)
SELECT cron.schedule('analyze-tables', '0 4 * * 0', 
    'SELECT analyze_all_tables()');
```

### 3. Setup Backup Automation

```bash
# Make scripts executable
chmod +x scripts/backup.sh
chmod +x scripts/backup-restore.sh

# Add to crontab
crontab -e

# Add these lines:
# Daily backup at 2 AM
0 2 * * * /path/to/scripts/backup.sh daily >> /var/log/thai-acc-backup.log 2>&1

# Weekly backup on Sundays at 3 AM
0 3 * * 0 /path/to/scripts/backup.sh weekly >> /var/log/thai-acc-backup.log 2>&1

# Monthly backup on 1st at 4 AM
0 4 1 * * /path/to/scripts/backup.sh monthly >> /var/log/thai-acc-backup.log 2>&1
```

### 4. Verify Migration

```bash
# Run database tests
bun run test:db

# Run application
bun run dev

# Verify key features:
# - Create invoice
# - Post journal entry
# - Generate reports
# - Check inventory
```

---

## PostgreSQL Features Enabled

### Full-Text Search

```sql
-- Enable Thai full-text search
CREATE TEXT SEARCH CONFIGURATION thai (COPY = simple);

-- Example usage
SELECT * FROM products 
WHERE to_tsvector('thai', name) @@ to_tsquery('thai', 'คอมพิวเตอร์');
```

### JSONB for Metadata

```sql
-- Query JSONB metadata
SELECT * FROM customers 
WHERE metadata @> '{"region": "bangkok"}'::jsonb;

-- Index for JSONB queries
CREATE INDEX idx_customers_metadata ON customers USING gin (metadata);
```

### Geographic Extensions (Optional)

```sql
-- Enable PostGIS for location tracking
CREATE EXTENSION postgis;

-- Add location column
ALTER TABLE customers ADD COLUMN location geography(POINT);

-- Create spatial index
CREATE INDEX idx_customers_location ON customers USING gist (location);
```

---

## Troubleshooting

### Common Issues

#### 1. Connection Refused

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check port
sudo netstat -plunt | grep 5432

# Update pg_hba.conf for local connections
sudo nano /etc/postgresql/15/main/pg_hba.conf

# Add:
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

#### 2. Permission Denied

```sql
-- Grant schema permissions
GRANT USAGE ON SCHEMA public TO thai_acc_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO thai_acc_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO thai_acc_user;

-- Set default privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT ALL ON TABLES TO thai_acc_user;
```

#### 3. Slow Queries

```sql
-- Check query performance
EXPLAIN ANALYZE SELECT * FROM invoices WHERE customer_id = 'xxx';

-- Check table statistics
SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_live_tup 
FROM pg_stat_user_tables 
ORDER BY n_live_tup DESC;

-- Update statistics
ANALYZE;
```

#### 4. Lock Issues

```sql
-- View active locks
SELECT * FROM pg_locks WHERE NOT granted;

-- View blocking queries
SELECT blocked_locks.pid AS blocked_pid,
       blocked_activity.usename AS blocked_user,
       blocking_locks.pid AS blocking_pid,
       blocking_activity.usename AS blocking_user
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;
```

---

## Migration Checklist

- [ ] PostgreSQL installed and running
- [ ] Database and user created
- [ ] Extensions enabled
- [ ] Schema migrated (prisma db push)
- [ ] Data imported
- [ ] Constraints applied
- [ ] Indexes created
- [ ] Triggers configured
- [ ] Materialized views created
- [ ] Application environment updated
- [ ] Backup scripts configured
- [ ] Tests passing
- [ ] Application running successfully

---

## Support

For issues or questions:
1. Check PostgreSQL logs: `/var/log/postgresql/`
2. Review application logs: `logs/`
3. Consult PostgreSQL documentation: https://www.postgresql.org/docs/
