# Thai Accounting ERP - Deployment Guide

## 📦 Deployment Package

Production-ready Thai Accounting ERP system with example database.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd .next/standalone
npm install --production --legacy-peer-deps
```

### 2. Configure Database
Edit `.next/standalone/.env`:
```bash
DATABASE_URL=file:/absolute/path/to/.next/standalone/prisma/dev.db
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
```

**IMPORTANT**: Use absolute paths for SQLite!

### 3. Copy Database
```bash
cp -r prisma .next/standalone/
```

### 4. Start Server
```bash
cd .next/standalone
npm start
```

## 🔐 Default Users

| Email | Password | Role |
|-------|----------|------|
| admin@thaiaccounting.com | admin123 | ADMIN |
| accountant@thaiaccounting.com | acc123 | ACCOUNTANT |
| user@thaiaccounting.com | user123 | USER |
| viewer@thaiaccounting.com | viewer123 | VIEWER |

## 📊 Features

All 16 modules included:
- Dashboard, Accounts, Journal, Invoices, Quotations, Receipts
- Customers, Vendors, Purchases, Payments, Credit/Debit Notes
- VAT, WHT, Inventory, Banking, Assets, Petty Cash, Payroll, Reports

## ✅ Build Status

- Compilation: ✓ Successful
- Theme System: ✓ Synchronized (light/dark)
- Color Contrast: ✓ WCAG AAA compliant
- Database: ✓ Seeded with example data
- Backup: ✓ backups/deployment_ready_20260320_092651/

Deploy now! 🚀
