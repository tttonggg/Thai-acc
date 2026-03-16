import { FullConfig } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

/**
 * Global setup for E2E tests
 *
 * Tasks:
 * - Ensure database exists
 * - Run migrations if needed
 * - Seed test data if database is empty
 * - Create test artifacts directories
 */
async function globalSetup(config: FullConfig) {
  console.log('\n========================================');
  console.log('🚀 Starting E2E Test Global Setup');
  console.log('========================================\n');

  const prisma = new PrismaClient();

  try {
    // Create test artifacts directories
    const artifactsDirs = [
      'test-results',
      'test-results/screenshots',
      'test-results/videos',
      'test-results/traces',
      'test-results/evidence',
      'test-results/artifacts'
    ];

    console.log('📁 Creating test artifacts directories...');
    for (const dir of artifactsDirs) {
      const fullPath = path.join(process.cwd(), dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`  ✅ Created: ${dir}`);
      }
    }

    // Test database connection
    console.log('\n🔍 Testing database connection...');
    await prisma.$connect();
    console.log('  ✅ Database connected successfully');

    // Check if database has data
    console.log('\n📊 Checking database state...');
    const userCount = await prisma.user.count();
    const accountCount = await prisma.chartOfAccount.count();

    console.log(`  👤 Users: ${userCount}`);
    console.log(`  📒 Chart of Accounts: ${accountCount}`);

    // Seed database if empty
    if (userCount === 0 || accountCount === 0) {
      console.log('\n🌱 Seeding database with initial data...');
      const { execSync } = require('child_process');

      try {
        execSync('npm run seed', {
          stdio: 'inherit',
          cwd: process.cwd()
        });
        console.log('  ✅ Database seeded successfully');
      } catch (error) {
        console.error('  ❌ Failed to seed database:', error);
        throw error;
      }
    } else {
      console.log('  ✅ Database already seeded');
    }

    // Verify test users exist
    console.log('\n👥 Verifying test users...');
    const testUsers = [
      'admin@thaiaccounting.com',
      'accountant@thaiaccounting.com',
      'user@thaiaccounting.com',
      'viewer@thaiaccounting.com'
    ];

    for (const email of testUsers) {
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (user) {
        console.log(`  ✅ ${email} (${user.role})`);
      } else {
        console.warn(`  ⚠️  ${email} not found`);
      }
    }

    // Clean up any orphaned test data
    console.log('\n🧹 Cleaning up orphaned test data...');

    // Delete unposted journal entries
    const deletedJournalEntries = await prisma.journalEntry.deleteMany({
      where: {
        status: 'DRAFT',
        createdAt: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Older than 24 hours
        }
      }
    });
    console.log(`  🗑️  Deleted ${deletedJournalEntries.count} old draft journal entries`);

    // Delete draft invoices older than 24 hours
    const deletedInvoices = await prisma.invoice.deleteMany({
      where: {
        status: 'DRAFT',
        createdAt: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });
    console.log(`  🗑️  Deleted ${deletedInvoices.count} old draft invoices`);

    console.log('\n========================================');
    console.log('✅ Global Setup Complete');
    console.log('========================================\n');

  } catch (error) {
    console.error('\n❌ Global Setup Failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

export default globalSetup;
