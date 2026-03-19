# Database Setup Guide

## Overview

Thai Accounting ERP supports both **PostgreSQL** and **SQLite** databases:

- **SQLite**: Default for development and standalone deployments
- **PostgreSQL**: For production with external database server

## Quick Start

### Development (SQLite - Default)

```bash
# Already configured in .env
DATABASE_URL=file:./prisma/dev.db

# Install dependencies and generate client
npm install
npm run db:generate

# Push schema to database
npm run db:push

# Seed initial data
npx prisma db seed

# Start development server
npm run dev
```

### Production with PostgreSQL

```bash
# Update .env
DATABASE_URL=postgresql://user:password@host:5432/thai_accounting

# Generate Prisma client for PostgreSQL
npm run db:generate

# Run migrations
npm run db:migrate

# Build for production
npm run build
```

### Standalone Deployment (SQLite)

```bash
# Build creates standalone with SQLite
npm run build

# The build automatically:
# 1. Uses SQLite schema
# 2. Generates Prisma client
# 3. Copies files to .next/standalone

# Update production environment
cd .next/standalone
cp .env.example .env
# Edit .env with your absolute DATABASE_URL path

# Create/copy database
cp ../../prisma/dev.db ./prod.db

# Start server
npm run start
```

## Schema Management

### File Structure

```
prisma/
├── schema.prisma           # Active schema (copied from below based on DATABASE_URL)
├── schema-postgres.prisma  # PostgreSQL schema
├── schema-sqlite.prisma    # SQLite schema
└── schema-loader.js        # Dynamic schema selector
```

### Modifying Schema

1. Edit `prisma/schema.prisma` (source of truth)

2. Regenerate variant schemas:
   ```bash
   npm run db:prepare-schemas
   ```

3. Generate Prisma client:
   ```bash
   npm run db:generate
   ```

### Key Differences Between Schemas

| Feature | PostgreSQL | SQLite |
|---------|------------|--------|
| Array fields | `String[]` | `Json?` |
| Extensions | `pgcrypto`, `pg_trgm` | Not supported |
| Full-text search | Native | Limited |
| Concurrent connections | High | Single writer |

## Environment Variables

### Required

```env
# Database URL - determines which database to use
DATABASE_URL=file:./prisma/dev.db                    # SQLite
# DATABASE_URL=postgresql://user:pass@host/db       # PostgreSQL

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
```

### Production Standalone

For standalone deployment, **always use absolute path** for SQLite:

```env
# ✅ Correct - Absolute path
DATABASE_URL=file:/absolute/path/to/.next/standalone/prod.db

# ❌ Wrong - Relative path won't work
DATABASE_URL=file:./prisma/dev.db
```

## Commands Reference

| Command | Description |
|---------|-------------|
| `npm run db:prepare-schemas` | Generate schema variants from source |
| `npm run db:select-schema` | Select schema based on DATABASE_URL |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Create and run migration |
| `npm run db:reset` | Reset database (⚠️ destructive) |

## Troubleshooting

### "Error validating datasource: the URL must start with protocol postgresql://"

This means your schema.prisma is set to PostgreSQL but DATABASE_URL is SQLite.

**Fix:**
```bash
# Regenerate with correct schema
npm run db:select-schema
npm run db:generate
```

### "Database file not found" in production

Ensure you use an absolute path for SQLite in production:

```bash
# Check current path
echo $PWD

# Update .env with absolute path
DATABASE_URL=file:/full/path/to/.next/standalone/prod.db
```

### Schema changes not applied

After modifying schema.prisma:

```bash
# 1. Regenerate schema variants
npm run db:prepare-schemas

# 2. Select and generate
npm run db:generate

# 3. Push to database
npm run db:push
```

## Migration Strategy

### SQLite to PostgreSQL

1. Export data from SQLite:
   ```bash
   sqlite3 prisma/dev.db .dump > backup.sql
   ```

2. Set up PostgreSQL and update DATABASE_URL

3. Run migrations:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

4. Import data (use appropriate tools for schema conversion)

## Performance Considerations

### SQLite
- ✅ Single-user or low-concurrency scenarios
- ✅ Standalone deployments
- ✅ Easy backups (just copy the file)
- ❌ Limited concurrent writes

### PostgreSQL
- ✅ High concurrency
- ✅ Large datasets
- ✅ Advanced features (full-text search, JSON operations)
- ✅ Production with multiple users
- ❌ Requires database server setup

## Security

### SQLite
- File-level permissions
- Store outside web root
- Backup regularly

### PostgreSQL
- Use strong passwords
- Enable SSL connections
- Configure firewall rules
- Regular backups with pg_dump
