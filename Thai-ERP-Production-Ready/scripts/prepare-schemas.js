#!/usr/bin/env node
/**
 * Prepare Prisma Schemas
 * 
 * This script generates schema-postgres.prisma and schema-sqlite.prisma
 * from schema.prisma (the source of truth).
 * 
 * Usage: node scripts/prepare-schemas.js
 */

const fs = require('fs');
const path = require('path');

const prismaDir = path.join(__dirname, '..', 'prisma');
const baseSchemaPath = path.join(prismaDir, 'schema.prisma');

function prepareSchemas() {
  console.log('🔧 Preparing Prisma schemas...\n');

  // Read base schema
  if (!fs.existsSync(baseSchemaPath)) {
    console.error('❌ Base schema not found:', baseSchemaPath);
    process.exit(1);
  }

  const baseSchema = fs.readFileSync(baseSchemaPath, 'utf8');

  // 1. Create PostgreSQL schema
  const postgresSchema = baseSchema; // No changes needed
  const postgresPath = path.join(prismaDir, 'schema-postgres.prisma');
  fs.writeFileSync(postgresPath, postgresSchema);
  console.log('✅ Created schema-postgres.prisma');

  // 2. Create SQLite schema
  let sqliteSchema = baseSchema
    // Change provider
    .replace(/provider\s*=\s*"postgresql"/, 'provider = "sqlite"')
    // Convert String[] to Json for SQLite
    .replace(/mentions\s+String\[\]/g, 'mentions    Json?');

  const sqlitePath = path.join(prismaDir, 'schema-sqlite.prisma');
  fs.writeFileSync(sqlitePath, sqliteSchema);
  console.log('✅ Created schema-sqlite.prisma');

  console.log('\n📋 Summary:');
  console.log('   - schema.prisma (source of truth)');
  console.log('   - schema-postgres.prisma (for PostgreSQL deployments)');
  console.log('   - schema-sqlite.prisma (for SQLite/standalone deployments)');
  console.log('\n💡 Use "npm run db:generate" to generate client based on DATABASE_URL');
}

if (require.main === module) {
  try {
    prepareSchemas();
  } catch (error) {
    console.error('❌ Error preparing schemas:', error.message);
    process.exit(1);
  }
}

module.exports = { prepareSchemas };
