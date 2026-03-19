# Thai Accounting ERP - Production Ready Package
# โปรแกรมบัญชีไทย - แพ็คเกจพร้อมใช้งาน

## 📋 รายการไฟล์ (File Manifest)

```
Thai-ERP-Production-Ready/
├── README.md                      # ไฟล์นี้
├── SETUP.md                       # คู่มือการติดตั้ง
├── src/                           # โค้ดต้นฉบับ
│   ├── app/                       # Next.js App Router
│   ├── components/                # React Components
│   │   ├── purchase-requests/     # ใบขอซื้อ (PR)
│   │   ├── purchase-orders/       # ใบสั่งซื้อ (PO) - NEW!
│   │   ├── purchases/             # ใบซื้อ
│   │   └── layout/                # Sidebar, Header
│   ├── lib/                       # Utilities & Services
│   ├── stores/                    # Zustand Stores
│   └── hooks/                     # Custom Hooks
├── prisma/                        # Database Schema
│   ├── schema.prisma              # Current schema
│   ├── schema-postgres.prisma     # PostgreSQL version
│   ├── schema-sqlite.prisma       # SQLite version
│   ├── schema-loader.js           # Auto-select schema
│   ├── seed.ts                    # Seed data
│   └── dev.db                     # SQLite database
├── e2e/                           # E2E Tests
│   ├── purchase-workflow.spec.ts  # PR/PO tests
│   └── helpers/                   # Test helpers
├── scripts/                       # Build scripts
│   ├── build-production.js
│   └── prepare-schemas.js
├── config/                        # Configuration files
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   ├── playwright.config.ts
│   ├── vitest.config.ts
│   ├── tailwind.config.ts
│   ├── postcss.config.mjs
│   ├── .env.example
│   └── .env.production
└── docs/                          # Documentation
    ├── DATABASE_SETUP.md
    └── API_DOCUMENTATION.md
```

## 🚀 Quick Start

### 1. ติดตั้ง Dependencies

```bash
npm install
```

### 2. ตั้งค่า Database

**สำหรับ Development (SQLite):**
```bash
# ใช้ค่า default จาก .env ได้เลย
npm run db:generate
npm run db:push
npm run seed:fresh
```

**สำหรับ Production (PostgreSQL):**
```bash
# แก้ไข .env
DATABASE_URL=postgresql://user:password@localhost:5432/thai_accounting

npm run db:generate
npm run db:migrate
npm run seed:fresh
```

### 3. รัน Development Server

```bash
npm run dev
# เปิด http://localhost:3000
```

### 4. Build Production

```bash
npm run build
# Output: .next/standalone/
```

### 5. รัน Production

```bash
cd .next/standalone
# แก้ไข .env ให้ใช้ absolute path
DATABASE_URL=file:/absolute/path/to/prisma/dev.db

node server.js
```

## 🧪 รัน Tests

```bash
# Unit Tests
npm run test:unit

# E2E Tests
npx playwright install
npx playwright test e2e/purchase-workflow.spec.ts

# All Tests
npm run test:all
```

## 📁 สิ่งที่เพิ่มมาใหม่ (New Features)

### Purchase Order Module
- ✅ `purchase-order-list.tsx` - รายการ PO
- ✅ `purchase-order-form.tsx` - ฟอร์มสร้าง PO
- ✅ `purchase-order-view-dialog.tsx` - ดูรายละเอียด PO
- ✅ `purchase-order-edit-dialog.tsx` - แก้ไข PO

### E2E Tests
- ✅ `purchase-workflow.spec.ts` - 17 test cases
- ✅ Page Object Models
- ✅ API Helpers

### Database Dual Support
- ✅ PostgreSQL schema
- ✅ SQLite schema
- ✅ Auto-select by DATABASE_URL

## 🔧 การตั้งค่า Environment

สร้างไฟล์ `.env` จาก `.env.example`:

```env
# Database
DATABASE_URL=file:./prisma/dev.db

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Optional
PORT=3000
LOG_LEVEL=info
```

## 👤 Test Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@thaiaccounting.com | admin123 | ADMIN |
| accountant@thaiaccounting.com | acc123 | ACCOUNTANT |
| user@thaiaccounting.com | user123 | USER |
| viewer@thaiaccounting.com | viewer123 | VIEWER |

## 📚 Documentation

- `SETUP.md` - คู่มือติดตั้งละเอียด
- `DATABASE_SETUP.md` - การตั้งค่าฐานข้อมูล
- `API_DOCUMENTATION.md` - API Reference

## 🆘 Troubleshooting

### ปัญหา: Port 3000 ถูกใช้งาน
```bash
lsof -ti:3000 | xargs kill -9
```

### ปัญหา: Prisma Client ไม่ทำงาน
```bash
npm run db:generate
```

### ปัญหา: Database ไม่พบ
```bash
# ตรวจสอบ path
ls -la prisma/dev.db

# สร้างใหม่
npm run db:reset
```

## 📦 การย้ายไป PC อื่น

1. คัดลอกโฟลเดอร์ `Thai-ERP-Production-Ready` ไป PC ใหม่
2. รัน `npm install`
3. รัน `npm run db:generate`
4. รัน `npm run dev`

## 📝 License

สงวนลิขสิทธิ์ - Thai Accounting ERP System
