#!/usr/bin/env node
/**
 * Production Build Script for Standalone Deployment
 *
 * This script prepares the production build with SQLite support.
 * It ensures the correct schema is used and generates the Prisma client.
 *
 * Usage: node scripts/build-production.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const standaloneDir = path.join(rootDir, '.next', 'standalone');
const prismaDir = path.join(rootDir, 'prisma');

function ensureDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyFile(src, dest) {
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`📄 Copied: ${path.relative(rootDir, src)} -> ${path.relative(rootDir, dest)}`);
  }
}

function buildProduction() {
  console.log('🏗️  Preparing Production Build for Standalone Deployment\n');

  // Step 1: Ensure SQLite schema exists
  const sqliteSchemaPath = path.join(prismaDir, 'schema-sqlite.prisma');
  if (!fs.existsSync(sqliteSchemaPath)) {
    console.log('🔄 Generating SQLite schema...');
    execSync('npm run db:prepare-schemas', { stdio: 'inherit', cwd: rootDir });
  }

  // Step 2: Copy SQLite schema as the active schema
  console.log('\n📋 Setting up SQLite schema for build...');
  fs.copyFileSync(
    path.join(prismaDir, 'schema-sqlite.prisma'),
    path.join(prismaDir, 'schema.prisma')
  );

  // Step 3: Generate Prisma client
  console.log('\n🔧 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit', cwd: rootDir });

  // Step 4: Ensure standalone directory exists
  ensureDirectory(standaloneDir);

  // Step 5: Copy Prisma files to standalone
  console.log('\n📦 Copying Prisma files to standalone...');
  const standalonePrismaDir = path.join(standaloneDir, 'prisma');
  ensureDirectory(standalonePrismaDir);

  copyFile(path.join(prismaDir, 'schema.prisma'), path.join(standalonePrismaDir, 'schema.prisma'));
  copyFile(
    path.join(prismaDir, 'schema-sqlite.prisma'),
    path.join(standalonePrismaDir, 'schema-sqlite.prisma')
  );

  // Step 6: Copy node_modules/.prisma to standalone
  console.log('\n📦 Copying Prisma client...');
  const sourcePrismaClient = path.join(rootDir, 'node_modules', '.prisma');
  const targetPrismaClient = path.join(standaloneDir, 'node_modules', '.prisma');

  if (fs.existsSync(sourcePrismaClient)) {
    ensureDirectory(path.dirname(targetPrismaClient));
    execSync(`cp -r "${sourcePrismaClient}" "${targetPrismaClient}"`, { stdio: 'inherit' });
  }

  // Step 7: Create production .env template
  console.log('\n📝 Creating production .env template...');
  const envTemplate = `# Production Environment Configuration
# Update these values for your deployment

# Database - ABSOLUTE PATH REQUIRED
DATABASE_URL=file:/absolute/path/to/your/prod.db

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=${process.env.NEXTAUTH_SECRET || 'change-this-secret-in-production'}

# Production Mode
NODE_ENV=production
PORT=3000
`;
  fs.writeFileSync(path.join(standaloneDir, '.env.example'), envTemplate);

  console.log('\n✅ Production build preparation complete!');
  console.log('\n📋 Next steps:');
  console.log('   1. Update .next/standalone/Desktop/Thai-acc-sandbox/.env with your absolute DATABASE_URL path');
  console.log('   2. Copy your SQLite database to the specified path');
  console.log('   3. Start the server: bun run start');
}

if (require.main === module) {
  try {
    buildProduction();
  } catch (error) {
    console.error('\n❌ Build failed:', error.message);
    process.exit(1);
  }
}

module.exports = { buildProduction };
