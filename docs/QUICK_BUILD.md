# Quick Build & Deployment Reference

## One-Line Build Commands

### Build for Production
```bash
npm run build
```
This now automatically handles everything including dependency installation!

### Start Production Server
```bash
# With Bun (recommended - faster)
npm run start

# With Node.js (fallback)
npm run start:node
```

---

## Complete Production Build (Alternative)

```bash
./scripts/build-production.sh
```

This automated script:
1. Cleans previous build
2. Generates Prisma Client
3. Builds Next.js
4. Copies static files
5. Copies database
6. Installs dependencies (351 packages)
7. Configures .env with absolute paths

---

## Current Configuration

### Next.js Config
- Standalone output: ✅ Enabled
- TypeScript errors: ✅ Ignored in builds
- Build size: ~925MB

### Environment
- Root `.env`: Uses relative path (`./prisma/dev.db`)
- Standalone `.env`: Uses absolute path (auto-configured)

### Dependencies
- Production packages: 351
- Database: SQLite (732KB)
- Prisma Client: Generated and included

---

## Troubleshooting Quick Fixes

### "Cannot find module" error
```bash
cd .next/standalone
npm install --production --legacy-peer-deps
```

### Login not working
Check `.next/standalone/.env` has absolute DATABASE_URL:
```bash
DATABASE_URL=file:/Users/tong/Thai-acc/.next/standalone/dev.db
```

### Port already in use
```bash
lsof -i :3000
kill -9 <PID>
```

---

## File Locations

| File | Location |
|------|----------|
| Next.js config | `/Users/tong/Thai-acc/next.config.ts` |
| Build script | `/Users/tong/Thai-acc/scripts/build-production.sh` |
| Standalone build | `/Users/tong/Thai-acc/.next/standalone/` |
| Production server | `.next/standalone/server.js` |
| Standalone .env | `.next/standalone/.env` |
| Database | `.next/standalone/dev.db` |

---

## Test Accounts

All accounts use the same password as the username prefix:

| Email | Password | Role |
|-------|----------|------|
| admin@thaiaccounting.com | admin123 | ADMIN |
| accountant@thaiaccounting.com | acc123 | ACCOUNTANT |
| user@thaiaccounting.com | user123 | USER |
| viewer@thaiaccounting.com | viewer123 | VIEWER |

---

## Module Access (Role-Based)

- **ADMIN**: All modules + system settings
- **ACCOUNTANT**: All modules + journal entries
- **USER**: Invoices, receipts, payments, customers, vendors
- **VIEWER**: Read-only access to reports

### 6 Expansion Modules
1. **WHT** (Withholding Tax) - 50 Tawi certificates
2. **Inventory** - Stock management with WAC costing
3. **Fixed Assets** - TAS 16 depreciation
4. **Banking** - Cheques and reconciliation
5. **Petty Cash** - Fund management
6. **Payroll** - SSC and PND1 calculations

---

## Deployment Checklist

### Before Deployment
- [ ] Run `npm run build`
- [ ] Verify `.next/standalone/node_modules` exists
- [ ] Check `.next/standalone/.env` has absolute DATABASE_URL
- [ ] Copy database to standalone directory
- [ ] Test login with admin account

### After Deployment
- [ ] Test all 6 modules
- [ ] Verify document creation works
- [ ] Check PDF generation
- [ ] Validate GL posting
- [ ] Monitor error logs

---

**Full Documentation**: See `BUILD_DEPLOYMENT.md` for detailed deployment guide.

**Last Updated**: 2026-03-12
