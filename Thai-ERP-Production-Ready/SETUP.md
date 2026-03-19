# คู่มือการติดตั้ง (Setup Guide)
# Thai Accounting ERP - Production Ready

## ขั้นตอนที่ 1: ติดตั้ง Prerequisites

### ติดตั้ง Node.js
- ดาวน์โหลดจาก https://nodejs.org/
- แนะนำเวอร์ชัน 18.x หรือ 20.x

### ติดตั้ง Package Manager
ตัวเลือกใดตัวเลือกหนึ่ง:
```bash
# npm (มาพร้อม Node.js)
npm --version

# หรือ bun (เร็วกว่า)
curl -fsSL https://bun.sh/install | bash
```

## ขั้นตอนที่ 2: แตกไฟล์ Zip

```bash
# แตกไฟล์
unzip Thai-ERP-Production-Ready.zip
cd Thai-ERP-Production-Ready
```

## ขั้นตอนที่ 3: ย้ายไฟล์ Config

```bash
# ย้าย config files ไป root
cp config/package.json ./
cp config/tsconfig.json ./
cp config/next.config.ts ./
cp config/playwright.config.ts ./
cp config/vitest.config.ts ./
cp config/tailwind.config.ts ./ 2>/dev/null || true
cp config/postcss.config.mjs ./ 2>/dev/null || true
```

## ขั้นตอนที่ 4: ติดตั้ง Dependencies

```bash
npm install
```

หรือถ้าใช้ bun:
```bash
bun install
```

## ขั้นตอนที่ 5: ตั้งค่า Environment

### สร้างไฟล์ .env

```bash
cp config/.env.example .env
```

### แก้ไขไฟล์ .env ตามต้องการ

**สำหรับ Development (SQLite):**
```env
DATABASE_URL=file:./prisma/dev.db
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-min-32-characters-long
```

**สำหรับ Production (PostgreSQL):**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/thai_accounting
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-min-32-characters-long
```

สร้าง secret key:
```bash
openssl rand -base64 32
```

## ขั้นตอนที่ 6: Setup Database

### 6.1 Generate Prisma Client

```bash
npm run db:generate
```

### 6.2 Push Schema to Database

**SQLite:**
```bash
npm run db:push
```

**PostgreSQL:**
```bash
npm run db:migrate
```

### 6.3 Seed Initial Data

```bash
npm run seed:fresh
```

หรือถ้าใช้ npx:
```bash
npx prisma db seed
```

## ขั้นตอนที่ 7: รัน Development Server

```bash
npm run dev
```

เปิด browser ไปที่: http://localhost:3000

## ขั้นตอนที่ 8: Login

ใช้ test account:
- Email: `admin@thaiaccounting.com`
- Password: `admin123`

## ขั้นตอนที่ 9: ทดสอบ PR/PO

### ทดสอบใบขอซื้อ (Purchase Request)
1. คลิกเมนู "งานซื้อ" → "ใบขอซื้อ (PR)"
2. คลิก "สร้างใบขอซื้อ"
3. กรอกข้อมูล:
   - เหตุผล: ทดสอบระบบ
   - ความสำคัญ: สูง
4. เพิ่มรายการ:
   - รายการ: สินค้าทดสอบ
   - จำนวน: 10
   - ราคา: 1000
5. บันทึก

### ทดสอบใบสั่งซื้อ (Purchase Order)
1. คลิกเมนู "งานซื้อ" → "ใบสั่งซื้อ (PO)"
2. คลิก "สร้างใบสั่งซื้อ"
3. เลือกผู้ขาย
4. กรอกรายการสินค้า
5. บันทึก

## ขั้นตอนที่ 10: Build Production (Optional)

```bash
npm run build
```

ผลลัพธ์จะอยู่ใน `.next/standalone/`

### รัน Production Build

```bash
cd .next/standalone

# แก้ไข .env ให้ใช้ absolute path
# DATABASE_URL=file:/absolute/path/to/prisma/dev.db

node server.js
```

## การรัน Tests

### Unit Tests
```bash
npm run test:unit
```

### E2E Tests
```bash
# ติดตั้ง browsers
npx playwright install

# รัน tests
npx playwright test e2e/purchase-workflow.spec.ts

# รันทั้งหมด
npx playwright test
```

## การแก้ไขปัญหา

### ปัญหา: "Cannot find module"
```bash
rm -rf node_modules
npm install
npm run db:generate
```

### ปัญหา: "Database does not exist"
```bash
npm run db:push
npm run seed:fresh
```

### ปัญหา: "Port 3000 is already in use"
```bash
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### ปัญหา: "Prisma schema validation error"
```bash
# สำหรับ SQLite
DATABASE_URL=file:./prisma/dev.db npm run db:generate

# สำหรับ PostgreSQL
DATABASE_URL=postgresql://... npm run db:generate
```

## การ Backup และ Restore

### Backup Database
```bash
# SQLite
cp prisma/dev.db prisma/dev.db.backup.$(date +%Y%m%d)

# PostgreSQL
pg_dump -U user -d thai_accounting > backup.sql
```

### Restore Database
```bash
# SQLite
cp prisma/dev.db.backup.20260318 prisma/dev.db

# PostgreSQL
psql -U user -d thai_accounting < backup.sql
```

## การอัปเดตระบบ

```bash
# 1. Backup ก่อน
npm run backup

# 2. Pull โค้ดใหม่
git pull

# 3. ติดตั้ง dependencies ใหม่
npm install

# 4. Generate Prisma
npm run db:generate

# 5. รัน migration
npm run db:migrate

# 6. Build ใหม่
npm run build
```

## ติดต่อสนับสนุน

หากมีปัญหา กรุณาตรวจสอบ:
1. Logs ใน terminal
2. ไฟล์ `.env` ตั้งค่าถูกต้องหรือไม่
3. Database path เป็น absolute path (สำหรับ production)
4. Port 3000 ไม่ถูกใช้โดยโปรแกรมอื่น

---

**หมายเหตุ:** ระบบนี้รองรับทั้ง SQLite (สำหรับ development) และ PostgreSQL (สำหรับ production)
