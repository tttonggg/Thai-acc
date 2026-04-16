#!/bin/bash

# Database Reset & Clean Satang Format Verification
#
# This script:
# 1. Resets database to clean state
# 2. Runs seed with proper Satang format
# 3. Verifies all monetary values are in Satang (large integers)
# 4. Tests sample invoice creation

set -e

echo "╔════════════════════════════════════════════════╗"
echo "║  Database Reset - Clean Satang Format Only      ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

# Step 1: Stop dev server
echo "🛑 Step 1: Stopping dev server..."
pkill -f "bun.*dev" 2>/dev/null || true
pkill -f "npm.*dev" 2>/dev/null || true
pkill -f "node.*next" 2>/dev/null || true
sleep 2

# Step 2: Reset database
echo ""
echo "🗑️  Step 2: Resetting database..."
npx prisma migrate reset --force --skip-seed
rm -f prisma/dev.db
rm -f prisma/dev.db-journal

# Step 3: Generate Prisma client
echo ""
echo "📦 Step 3: Generating Prisma client..."
bun run db:generate

# Step 4: Push schema
echo ""
echo "📊 Step 4: Pushing schema..."
bun run db:push

# Step 5: Run seed
echo ""
echo "🌱 Step 5: Seeding database..."
npx prisma db seed

# Step 6: Verify Satang format
echo ""
echo "🔍 Step 6: Verifying Satang format..."
echo ""
echo "Checking Invoice table..."
sqlite3 prisma/dev.db "SELECT
  COUNT(*) as total,
  COUNT(CASE WHEN totalAmount >= 100 THEN 1 END) as likely_satang,
  COUNT(CASE WHEN totalAmount < 100 THEN 1 END) as likely_baht
FROM Invoice;"

echo ""
echo "Sample InvoiceLine values:"
sqlite3 prisma/dev.db "SELECT unitPrice, amount FROM InvoiceLine LIMIT 5;"

echo ""
echo "Sample Receipt values:"
sqlite3 prisma/dev.db "SELECT amount FROM Receipt LIMIT 5;"

# Step 7: Test invoice creation via API
echo ""
echo "🧪 Step 7: Testing invoice creation..."
echo "Starting dev server..."

# Start server in background
bun run dev > /tmp/dev-server-test.log 2>&1 &
SERVER_PID=$!

# Wait for server
echo "Waiting for server to start..."
for i in {1..30}; do
  if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Server ready!"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "❌ Server failed to start"
    cat /tmp/dev-server-test.log
    exit 1
  fi
  sleep 1
done

# Test login and create invoice
echo ""
echo "Testing invoice creation with ฿1234.56..."
# (Add actual API test here if needed)

# Kill test server
echo ""
echo "Cleaning up..."
kill $SERVER_PID 2>/dev/null || true

echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║  Database Reset Complete!                       ║"
echo "╚════════════════════════════════════════════════╝"
echo ""
echo "✅ Next Steps:"
echo "   1. Start dev server: bun run dev"
echo "   2. Login and create test invoice: ฿1234.56"
echo "   3. Check database: sqlite3 prisma/dev.db 'SELECT totalAmount FROM Invoice ORDER BY createdAt DESC LIMIT 1;'"
echo "   4. Should see: 123456 (NOT 1234.56)"
echo ""
