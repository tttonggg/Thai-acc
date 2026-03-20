#!/usr/bin/env node
/**
 * Prisma Schema Loader
 * 
 * This script dynamically selects the appropriate schema file based on DATABASE_URL.
 * Supports both PostgreSQL (production with external DB) and SQLite (standalone deployment).
 * 
 * Usage: node prisma/schema-loader.js
 */

const fs = require('fs');
const path = require('path');

const databaseUrl = process.env.DATABASE_URL || '';
const schemaDir = __dirname;

// Determine which schema to use
function getSchemaType() {
  if (databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://')) {
    return 'postgres'; // Maps to schema-postgres.prisma
  }
  // Default to SQLite for file: protocol or empty/default
  return 'sqlite';
}

// Copy the appropriate schema file
function copySchema() {
  const schemaType = getSchemaType();
  // Map schema type to filename
  const schemaFileMap = {
    'postgres': 'schema-postgres.prisma',
    'sqlite': 'schema-sqlite.prisma'
  };
  const sourceFile = path.join(schemaDir, schemaFileMap[schemaType]);
  const targetFile = path.join(schemaDir, 'schema.prisma');

  // Check if source file exists
  if (!fs.existsSync(sourceFile)) {
    console.error(`❌ Schema file not found: ${sourceFile}`);
    console.error('   Run: npm run db:prepare-schemas to generate schema files');
    process.exit(1);
  }

  // Copy the file
  fs.copyFileSync(sourceFile, targetFile);
  console.log(`✅ Using ${schemaType.toUpperCase()} schema`);
  console.log(`   Source: ${sourceFile}`);
  console.log(`   Target: ${targetFile}`);
  
  return schemaType;
}

// Main execution
if (require.main === module) {
  try {
    const schemaType = copySchema();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error copying schema:', error.message);
    process.exit(1);
  }
}

module.exports = { copySchema, getSchemaType };
