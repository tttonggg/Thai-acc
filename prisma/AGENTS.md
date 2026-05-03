<!-- Parent: ../AGENTS.md -->
# AGENTS.md - Prisma Database Schema

This file provides essential guidance for AI coding agents working with the
**Prisma database schema** for the Thai Accounting ERP System
(โปรแกรมบัญชีมาตรฐานไทย).

## Directory Overview

The `prisma/` directory is CRITICAL and contains the database schema and seed
data for the entire application. This directory manages a dual-schema system for
development and production deployments.

**Parent Reference**: See `../AGENTS.md` for overall project documentation.

## Directory Structure

```
prisma/
├── AGENTS.md                          # This file - schema guidance
├── schema.prisma                      # Main schema file (auto-generated)
├── schema-postgres.prisma             # PostgreSQL production schema
├── schema-sqlite.prisma                # SQLite development schema
├── seed.ts                           # Thai chart of accounts (181 accounts)
├── dev.db                            # SQLite development database
├── reset-db.ts                       # Database reset script
├── check-credit-notes.ts             # Data validation utility
├── create-sample-cn-dn.ts            # Sample credit/debit notes
├── schema-loader.js                  # Schema selection script
├── schema-loader.js.backup           # Backup of schema loader
└── migrations/                       # Migration history
    └── 20260311033206_init/         # Initial migration
    └── 20250315_add_performance_indexes/
    └── 20260317_add_performance_indexes/
└── postgresql/                      # PostgreSQL-specific configurations
    ├── triggers.sql                 # PostgreSQL triggers
    ├── optimized-indexes.sql        # Performance indexes
    └── partitioning.sql            # Table partitioning
```

## Critical: Dual-Schema System

The project uses a dynamic schema selection system:

### How It Works

- **`schema-loader.js`** automatically selects the correct schema based on
  `DATABASE_URL`
- **Development**: Uses `schema-sqlite.prisma` (SQLite for fast local
  development)
- **Production**: Uses `schema-postgres.prisma` (PostgreSQL for performance and
  scalability)

### Database URLs

```bash
# Development (SQLite)
DATABASE_URL=file:./prisma/dev.db

# Production (PostgreSQL)
DATABASE_URL=postgresql://user:pass@localhost:5432/thai_erp

# Production (Standalone)
DATABASE_URL=file:/absolute/path/to/.next/standalone/prisma/dev.db
```

### Schema Selection Commands

```bash
# Automatically selects and copies appropriate schema
npm run db:select-schema

# Uses selected schema for subsequent commands
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema to database
npm run db:migrate     # Create and run migrations
```

## CRITICAL: Monetary Storage - Integer Satang Format

**⚠️ EXTREMELY IMPORTANT**: ALL monetary values in the database MUST be stored
as **integers in Satang** (1/100 Baht).

### Correct Pattern

```typescript
// User input: ฿1,234.56 → Database: 123456 (integer)
import { bahtToSatang } from '@/lib/currency';

// POST routes: convert Baht to Satang before saving
const invoice = await prisma.invoice.create({
  data: {
    totalAmount: bahtToSatang(userEnteredAmount), // 1234.56 → 123456
    // ...
  },
});

// GET routes: convert Satang back to Baht for display
const invoice = await prisma.invoice.findUnique({ where: { id } });
return {
  ...invoice,
  totalAmount: satangToBaht(invoice.totalAmount), // 123456 → 1234.56
};
```

### ❌ WRONG - Don't Do This

```typescript
// WRONG: Storing Baht directly (float values)
totalAmount: userEnteredAmount; // ❌ Stores 1234.56 as float

// WRONG: Not converting on display
totalAmount: invoice.totalAmount; // ❌ Returns Satang as if it's Baht (100x error!)
```

### Common Bug Prevention

- **Legacy bug**: Some old data stores Baht directly (NOT converted to Satang)
- This causes 100x display errors when new code correctly converts
- **Solution**: Database reset + clean seed required

### Financial Models Using Satang

- ✅ `Invoice` (totalAmount, subtotalAmount, vatAmount)
- ✅ `Receipt` (amount)
- ✅ `Payment` (amount)
- ✅ `PurchaseInvoice` (totalAmount)
- ✅ `PurchaseOrder` (totalAmount)
- ✅ `JournalEntry` (amount on JournalLine)
- ✅ `Asset` (cost, currentValue)
- ✅ `Payroll` (amounts)
- ✅ `PettyCashVoucher` (amount)

## Schema Key Facts

### Schema Size

- **60+ models** covering all accounting functionality
- **2300+ lines** of Prisma schema
- **181 accounts** in Thai chart of accounts

### Database Features

- **Soft Deletes**: Most models have `deletedAt DateTime?` field
- **Audit Trails**: `createdAt`, `updatedAt` timestamps on all models
- **Foreign Key Constraints**: Proper relationship management
- **Unique Constraints**: Document numbering, business rules
- **Indexes**: Performance optimized for accounting queries

### Model Categories

1. **Company Data**: Company, SystemSettings
2. **Master Data**: Account, Customer, Vendor, Product, Asset
3. **Transactions**: Invoice, Receipt, Payment, PurchaseInvoice, JournalEntry
4. **Documents**: DocumentNumber, DocumentAttachment
5. **Tax**: VatDeclaration, WhtDeclaration
6. **Payroll**: Employee, PayrollPeriod, PayrollEntry
7. **Reports**: FinancialStatement

## Key Commands

### Database Development

```bash
# Generate Prisma client (REQUIRED after schema changes)
bun run db:generate

# Push schema without migrations (development only)
bun run db:push

# Create and run migrations (production safe)
bun run db:migrate

# Reset database (WARNING: destroys all data)
bun run db:reset

# Seed Thai chart of accounts (181 accounts)
npx prisma db seed

# Fresh reset + seed
bun run seed:fresh
```

### Schema Management

```bash
# Prepare schema files (maintenance)
bun run db:prepare-schemas

# Select schema based on DATABASE_URL
bun run db:select-schema

# Check current schema selection
node prisma/schema-loader.js
```

### Database Verification

```bash
# Check database integrity
bun run test:verify-db

# Validate monetary values (should be Satang integers)
sqlite3 prisma/dev.db "SELECT totalAmount FROM Invoice LIMIT 5;"
# Correct: 123456, 987654 (Satang)
# Wrong: 1234.56, 9876.54 (Baht - needs fix)
```

## Working with the Schema

### Adding New Models

1. Edit `prisma/schema-postgres.prisma` (production schema)
2. Edit `prisma/schema-sqlite.prisma` (development schema)
3. Run `bun run db:generate` to regenerate Prisma client
4. Run `bun run db:migrate` to create migration

### Schema Changes

- **Always edit the base schemas**
  (`schema-postgres.prisma`/`schema-sqlite.prisma`)
- The `schema.prisma` file is **auto-generated** by `schema-loader.js`
- Never modify `schema.prisma` directly

### Data Seeding

- **Seed data**: Thai chart of accounts, company info, initial settings
- **Idempotent**: Can run multiple times safely (skips duplicates)
- **Fresh start**: Use `bun run seed:fresh` to reset + seed

## Performance Considerations

### PostgreSQL Optimizations

- **Triggers**: `postgresql/triggers.sql` for data integrity
- **Indexes**: `postgresql/optimized-indexes.sql` for query performance
- **Partitioning**: `postgresql/partitioning.sql` for large datasets

### SQLite for Development

- Fast file-based database for local development
- Automatic file: `prisma/dev.db`
- Regular backups: `prisma/dev.db.backup`

## Migration Management

### Migration Files

- Located in `migrations/` directory
- Named with timestamp: `YYYYMMDDHHMMSS_description`
- SQL files with schema changes
- Safe for production deployment

### Migration Commands

```bash
# Create new migration (manual)
bun run db:migrate --create-only

# Run pending migrations
bun run db:migrate

# Reset to migration (destructive)
bun run db:migrate --to-pending
```

## Error Prevention

### Critical Rules

1. **Always run `bun run db:generate` after schema changes**
2. **Verify all monetary values use Satang format**
3. **Use proper transaction handling for double-entry bookkeeping**
4. **Maintain foreign key relationships**
5. **Test with `bun run test:verify-db` after changes**

### Common Issues

- **Prisma Client Error**: Regenerate after schema changes
- **Foreign Key Violation**: Check relationship order in deletes
- **Satang Format Error**: Verify database values are integers
- **Migration Conflicts**: Use `bun run db:reset` for fresh start

## Security Notes

- **Schema Access**: Prisma schema contains business rules and constraints
- **Data Sensitivity**: Financial data requires proper access controls
- **Audit Trail**: All modifications tracked with timestamps
- **Soft Deletes**: Maintain data history with `deletedAt` field

## Testing Database Changes

### Before Deployment

1. Run `bun run db:generate`
2. Run `bun run test:verify-db`
3. Test monetary values in UI
4. Verify journal entries balance

### After Deployment

1. Check database connection
2. Verify Prisma client works
3. Test critical accounting operations
4. Monitor performance

## Related Files

- **`../AGENTS.md`**: Overall project documentation
- **`../CLAUDE.md`**: Detailed project guidance
- **`src/lib/currency.ts`**: Satang conversion utilities
- **`src/lib/db.ts`**: Prisma client singleton
- **`src/lib/api-utils.ts`**: Database operation helpers

---

**Status**: ✅ Production Ready

**Last Updated**: 2026-04-16

This directory contains the foundation of the Thai Accounting ERP System. All
database operations must respect the Satang monetary format and the dual-schema
architecture.
