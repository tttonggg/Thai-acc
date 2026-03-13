#!/bin/bash

# Thai Accounting ERP - Production Build Script
# This script automates the complete production build process

set -e  # Exit on error

echo "================================================"
echo "Thai Accounting ERP - Production Build"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Clean previous build
echo -e "${YELLOW}Step 1: Cleaning previous build...${NC}"
rm -rf .next/standalone
rm -rf .next/static
echo -e "${GREEN}✓ Clean complete${NC}"
echo ""

# Step 2: Generate Prisma Client
echo -e "${YELLOW}Step 2: Generating Prisma Client...${NC}"
npm run db:generate
echo -e "${GREEN}✓ Prisma Client generated${NC}"
echo ""

# Step 3: Build Next.js application
echo -e "${YELLOW}Step 3: Building Next.js application (standalone mode)...${NC}"
next build
echo -e "${GREEN}✓ Next.js build complete${NC}"
echo ""

# Step 4: Copy static files to standalone
echo -e "${YELLOW}Step 4: Copying static files to standalone directory...${NC}"
cp -r .next/static .next/standalone/.next/
cp -r public .next/standalone/
echo -e "${GREEN}✓ Static files copied${NC}"
echo ""

# Step 5: Copy database
echo -e "${YELLOW}Step 5: Copying database to standalone directory...${NC}"
if [ -f "prisma/dev.db" ]; then
    cp prisma/dev.db .next/standalone/dev.db
    echo -e "${GREEN}✓ Database copied${NC}"
else
    echo -e "${RED}⚠ Warning: prisma/dev.db not found. You may need to seed the database.${NC}"
fi
echo ""

# Step 6: Install production dependencies in standalone
echo -e "${YELLOW}Step 6: Installing production dependencies in standalone directory...${NC}"
cd .next/standalone
npm install --production --legacy-peer-deps
cd ../..
echo -e "${GREEN}✓ Dependencies installed (351 packages)${NC}"
echo ""

# Step 7: Configure .env with absolute paths
echo -e "${YELLOW}Step 7: Configuring environment variables...${NC}"
STANDALONE_DIR="$(pwd)/.next/standalone"
cat > .next/standalone/.env << EOF
DATABASE_URL=file:$STANDALONE_DIR/dev.db
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=B/lLqgzybPsxU6dNnvb/wG5XuEpfVfU68pVN0A7KseY=
EOF
echo -e "${GREEN}✓ Environment configured with absolute DATABASE_URL${NC}"
echo ""

# Build complete
echo "================================================"
echo -e "${GREEN}✓ BUILD COMPLETE!${NC}"
echo "================================================"
echo ""
echo "Standalone directory: .next/standalone/"
echo "Build size: $(du -sh .next/standalone/ | cut -f1)"
echo ""
echo "To start the production server:"
echo "  npm run start         (with Bun)"
echo "  npm run start:node    (with Node.js)"
echo ""
echo "Or directly:"
echo "  bun .next/standalone/server.js"
echo "  node .next/standalone/server.js"
echo ""
echo "Server will run at: http://localhost:3000"
echo ""
echo "Test accounts:"
echo "  admin@thaiaccounting.com / admin123 (ADMIN)"
echo "  accountant@thaiaccounting.com / acc123 (ACCOUNTANT)"
echo "  user@thaiaccounting.com / user123 (USER)"
echo "  viewer@thaiaccounting.com / viewer123 (VIEWER)"
echo ""
echo "================================================"
