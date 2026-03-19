#!/bin/bash

# Thai Accounting ERP - Quick Start Script
# โปรแกรมบัญชีไทย - สคริปต์เริ่มต้นอย่างรวดเร็ว

echo "🚀 Thai Accounting ERP - Quick Start"
echo "======================================"
echo ""

# ตรวจสอบ Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js ไม่ได้ติดตั้ง"
    echo "   กรุณาติดตั้งจาก https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# ย้าย config files
echo ""
echo "📦 Setting up configuration..."
cp config/package.json ./ 2>/dev/null || true
cp config/tsconfig.json ./ 2>/dev/null || true
cp config/next.config.ts ./ 2>/dev/null || true
cp config/playwright.config.ts ./ 2>/dev/null || true
cp config/vitest.config.ts ./ 2>/dev/null || true
cp config/tailwind.config.ts ./ 2>/dev/null || true
cp config/postcss.config.mjs ./ 2>/dev/null || true

# สร้าง .env ถ้ายังไม่มี
if [ ! -f .env ]; then
    echo "📄 Creating .env file..."
    cat > .env << 'EOF'
# Thai Accounting ERP Environment
DATABASE_URL=file:./prisma/dev.db
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=B/lLqgzybPsxU6dNnvb/wG5XuEpfVfU68pVN0A7KseY=
PORT=3000
LOG_LEVEL=info
EOF
    echo "✅ .env created"
else
    echo "✅ .env already exists"
fi

# ติดตั้ง dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Error: npm install failed"
    exit 1
fi

echo "✅ Dependencies installed"

# Generate Prisma
echo ""
echo "🗄️  Setting up database..."
npm run db:generate

if [ $? -ne 0 ]; then
    echo "❌ Error: Prisma generate failed"
    exit 1
fi

echo "✅ Prisma client generated"

# Push schema
npm run db:push

if [ $? -ne 0 ]; then
    echo "❌ Error: Database push failed"
    exit 1
fi

echo "✅ Database schema pushed"

# Seed data
npx prisma db seed

if [ $? -ne 0 ]; then
    echo "⚠️  Warning: Seed failed (may already have data)"
else
    echo "✅ Seed data loaded"
fi

# สร้างโฟลเดอร์ที่จำเป็น
mkdir -p logs
mkdir -p test-results
mkdir -p upload

echo ""
echo "======================================"
echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "   1. Start development server:"
echo "      npm run dev"
echo ""
echo "   2. Open browser:"
echo "      http://localhost:3000"
echo ""
echo "   3. Login with:"
echo "      Email: admin@thaiaccounting.com"
echo "      Password: admin123"
echo ""
echo "   4. Run tests:"
echo "      npm run test:unit"
echo ""
echo "📚 Documentation:"
echo "   - README.md - Overview"
echo "   - SETUP.md - Detailed setup guide"
echo "   - MANIFEST.md - File listing"
echo ""
echo "Happy accounting! 🧮"
echo ""
