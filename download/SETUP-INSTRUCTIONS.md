# Thai Accounting ERP - Setup Instructions

## Download the Project

The project ZIP file is available at:
```
/home/z/my-project/download/thai-accounting-erp-project.zip
```

## Setup on Your Local PC

### 1. Prerequisites
- Node.js 18+ or Bun runtime
- SQLite (included with the project)

### 2. Installation Steps

```bash
# Extract the ZIP file
unzip thai-accounting-erp-project.zip

# Navigate to project folder
cd thai-accounting-erp-project

# Install dependencies
npm install
# OR if you have Bun
bun install

# Generate Prisma client
npx prisma generate
# OR
bunx prisma generate

# Run database migrations
npx prisma migrate dev
# OR
bunx prisma migrate dev

# Seed the database with initial data
npx prisma db seed
# OR
bun run prisma/seed.ts

# Start development server
npm run dev
# OR
bun run dev
```

### 3. Environment Variables

Create a `.env` file with:
```
DATABASE_URL=file:./dev.db
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-change-this
```

### 4. Test Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@thaiaccounting.com | admin123 | Admin |
| accountant@thaiaccounting.com | acc123 | Accountant |
| user@thaiaccounting.com | user123 | User |
| viewer@thaiaccounting.com | viewer123 | Viewer |

## Features

- Dashboard with financial overview
- Chart of Accounts (ผังบัญชี) - Thai standard TFRS
- Journal Entry (บันทึกบัญชี)
- Tax Invoices (ใบกำกับภาษี)
- VAT Reports (ภาษีมูลค่าเพิ่ม)
- Withholding Tax Reports (ภาษีหัก ณ ที่จ่าย)
- Accounts Receivable (ลูกหนี้)
- Accounts Payable (เจ้าหนี้)
- Financial Reports (รายงาน)
- User Management (จัดการผู้ใช้)
- Data Backup/Restore

## Tech Stack

- Next.js 15 (App Router)
- React 18
- TypeScript
- Prisma ORM
- SQLite
- Tailwind CSS
- shadcn/ui Components
- NextAuth.js

## Support

For issues or questions, please check the project documentation.
