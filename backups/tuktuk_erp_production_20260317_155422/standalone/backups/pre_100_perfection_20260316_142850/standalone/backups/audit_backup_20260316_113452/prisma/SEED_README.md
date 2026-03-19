# Seed Data Fix - Duplicate Invoice Constraint Error

## Problem Fixed
The seed function was failing with `Unique constraint failed on the fields: (invoiceNo)` when run multiple times because it was trying to create duplicate invoice numbers.

## Solution Implemented

### 1. Idempotent Seed Function
The seed function can now be run multiple times safely without errors. It:
- Checks if an invoice/journal entry exists before creating
- Skips existing records with a warning message
- Handles unique constraint violations gracefully with try-catch
- Uses existing records instead of failing

### 2. Changes Made to `/Users/tong/Thai-acc/prisma/seed.ts`

#### Added Cleanup Function
```typescript
async function cleanSeedData() {
  // Deletes invoices, journal entries in correct order
  // Uncomment await cleanSeedData() in main() for fresh data
}
```

#### Fixed Invoice Creation (Line 605-668)
- Added existence check before creating
- Wrapped in try-catch for P2002 constraint errors
- Logs warnings for duplicates instead of failing
- Uses existing invoice if found

#### Fixed Journal Entry Creation (Line 1028-1080)
- Added existence check before creating
- Wrapped in try-catch for P2002 constraint errors
- Logs warnings for duplicates instead of failing
- Uses existing journal entry if found

### 3. New Files Created

#### `/Users/tong/Thai-acc/prisma/reset-db.ts`
Standalone script to completely reset the database:
- Deletes all data in correct order (respects foreign keys)
- Provides clear console output
- Safe to run anytime

### 4. Updated NPM Scripts

Added to `/Users/tong/Thai-acc/package.json`:
```json
"seed": "ts-node prisma/seed.ts",
"seed:fresh": "ts-node prisma/reset-db.ts && npm run seed"
```

## Usage

### Run Seed (Safe - Idempotent)
```bash
npm run seed
```
- Can be run multiple times safely
- Skips existing records
- No data loss

### Fresh Seed (Deletes All Data First)
```bash
npm run seed:fresh
```
- Deletes ALL data from database
- Then runs seed with fresh data
- Use only when you want to start completely fresh

### Manual Cleanup Only
```bash
ts-node prisma/reset-db.ts
```
- Deletes all seed data
- Useful before running custom imports

## How It Works

### Duplicate Detection Flow
1. **Before Create**: Checks if record exists by unique key (invoiceNo/entryNo)
2. **If Exists**: Logs warning, uses existing record, continues
3. **Try Create**: Attempts to create new record
4. **Constraint Error**: Catches P2002 errors, fetches existing record, continues
5. **Other Errors**: Re-throws for debugging

### Benefits
- **Safe**: No accidental data duplication
- **Fast**: Skips existing records without database errors
- **Observable**: Clear console logging shows what's happening
- **Maintainable**: Clean error handling and separation of concerns

## Error Handling

### P2002 (Unique Constraint)
- Caught and handled gracefully
- Logs: "⚠️ Duplicate invoice number skipped: INV-..."
- Fetches and uses existing record

### Other Errors
- Re-thrown for debugging
- Logs: "❌ Error creating invoice: INV-... [error message]"
- Process exits with error code

## Testing

### Test Idempotency
```bash
# Run seed twice - second run should skip existing records
npm run seed
npm run seed
```

Expected output:
- First run: Creates all records
- Second run: Shows "⚠️ Invoice already exists" for duplicates
- Both runs complete successfully with "🎉 Seed completed successfully!"

### Test Fresh Seed
```bash
# Complete reset and fresh seed
npm run seed:fresh
```

Expected output:
- Database cleared
- All records created fresh
- No duplicate warnings

## Files Modified

1. `/Users/tong/Thai-acc/prisma/seed.ts` - Main seed file with idempotent logic
2. `/Users/tong/Thai-acc/prisma/reset-db.ts` - Database reset script
3. `/Users/tong/Thai-acc/package.json` - Added seed scripts

## Technical Details

### Prisma Model Names
- `Invoice` - Invoice records
- `InvoiceLine` - Invoice line items
- `JournalEntry` - Journal entries
- `JournalLine` - Journal entry lines (not `journalEntryLine`)

### Foreign Key Constraints
Delete order matters:
1. Child records (lines) deleted first
2. Parent records (invoices/journals) deleted second
3. Other dependent records (products, customers, etc.) deleted last

## Troubleshooting

### Seed Still Fails
1. Check database connection
2. Verify Prisma client is generated: `npm run db:generate`
3. Check database schema: `npm run db:push`
4. Run fresh seed: `npm run seed:fresh`

### Module Type Warning
The warning about MODULE_TYPELESS_PACKAGE_JSON is informational and doesn't affect functionality. It can be safely ignored or resolved by adding `"type": "module"` to package.json if needed.

## Summary

The seed data is now:
- **Idempotent**: Can run multiple times safely
- **Resilient**: Handles duplicates gracefully
- **Observable**: Clear logging of all operations
- **Flexible**: Choose between incremental or fresh seeding
