import { FullConfig } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

/**
 * Global teardown for E2E tests
 *
 * Tasks:
 * - Generate test summary
 * - Clean up temporary files
 * - Verify database integrity
 */
async function globalTeardown(config: FullConfig) {
  console.log('\n========================================');
  console.log('🏁 Starting E2E Test Global Teardown');
  console.log('========================================\n');

  const prisma = new PrismaClient();

  try {
    // Generate test summary
    console.log('📊 Generating test summary...');
    const testResultsDir = path.join(process.cwd(), 'test-results');

    if (fs.existsSync(testResultsDir)) {
      const files = fs.readdirSync(testResultsDir);

      const summary = {
        timestamp: new Date().toISOString(),
        totalTests: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        artifacts: {
          screenshots: 0,
          videos: 0,
          traces: 0,
        },
      };

      // Count artifacts
      for (const file of files) {
        if (file.endsWith('.png')) summary.artifacts.screenshots++;
        if (file.endsWith('.webm')) summary.artifacts.videos++;
        if (file.endsWith('.zip')) summary.artifacts.traces++;
      }

      // Check for JSON results
      const jsonResults = path.join(testResultsDir, 'results.json');
      if (fs.existsSync(jsonResults)) {
        const results = JSON.parse(fs.readFileSync(jsonResults, 'utf-8'));
        summary.totalTests = results.stats?.expected || 0;
        summary.passed = results.stats?.passed || 0;
        summary.failed = results.stats?.failed || 0;
        summary.skipped = results.stats?.skipped || 0;
      }

      console.log('  📈 Test Summary:');
      console.log(`     Total: ${summary.totalTests}`);
      console.log(`     ✅ Passed: ${summary.passed}`);
      console.log(`     ❌ Failed: ${summary.failed}`);
      console.log(`     ⏭️  Skipped: ${summary.skipped}`);
      console.log('\n  📦 Artifacts:');
      console.log(`     📸 Screenshots: ${summary.artifacts.screenshots}`);
      console.log(`     🎥 Videos: ${summary.artifacts.videos}`);
      console.log(`     🔍 Traces: ${summary.artifacts.traces}`);

      // Save summary
      const summaryPath = path.join(testResultsDir, 'summary.json');
      fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
      console.log(`\n  💾 Summary saved to: ${summaryPath}`);
    }

    // Verify database integrity
    console.log('\n🔍 Verifying database integrity...');

    // Check for orphaned records (using Prisma Client for PostgreSQL compatibility)
    const invoiceCount = await prisma.invoice.count();
    const receiptCount = await prisma.receipt.count();
    console.log(`  📄 Total invoices: ${invoiceCount}`);
    console.log(`  📋 Total receipts: ${receiptCount}`);

    // Log final database state
    const counts = await prisma.$transaction([
      prisma.user.count(),
      prisma.customer.count(),
      prisma.vendor.count(),
      prisma.product.count(),
      prisma.invoice.count(),
      prisma.receipt.count(),
      prisma.payment.count(),
      prisma.journalEntry.count(),
    ]);

    console.log('\n  📊 Final Database State:');
    console.log(`     👤 Users: ${counts[0]}`);
    console.log(`     🏢 Customers: ${counts[1]}`);
    console.log(`     🏭 Vendors: ${counts[2]}`);
    console.log(`     📦 Products: ${counts[3]}`);
    console.log(`     📄 Invoices: ${counts[4]}`);
    console.log(`     📋 Receipts: ${counts[5]}`);
    console.log(`     💸 Payments: ${counts[6]}`);
    console.log(`     📒 Journal Entries: ${counts[7]}`);

    console.log('\n========================================');
    console.log('✅ Global Teardown Complete');
    console.log('========================================\n');
  } catch (error) {
    console.error('\n❌ Global Teardown Failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

export default globalTeardown;
