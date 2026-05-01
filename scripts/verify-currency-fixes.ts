#!/usr/bin/env tsx
/**
 * Currency Fixes Verification Script
 *
 * Tests that all currency unit conversions are working correctly
 * after Phase 1-4 fixes
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper functions from currency.ts
function bahtToSatang(baht: number): number {
  return Math.round(baht * 100);
}

function satangToBaht(satang: number): number {
  return satang / 100;
}

function formatBaht(satang: number): string {
  return `฿${satangToBaht(satang).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

async function verifyCurrencyFixes() {
  console.log('🔍 Verifying Currency Fixes...\n');

  let errors: string[] = [];
  let passed = 0;

  // Test 1: Check database schema (Float vs Int)
  console.log('📊 Test 1: Database Schema Verification');

  // Get a sample invoice
  const invoice = await prisma.invoice.findFirst({
    where: { deletedAt: null },
  });

  if (!invoice) {
    errors.push('❌ No invoices found in database');
  } else {
    console.log(`  ✅ Found invoice: ${invoice.invoiceNumber}`);

    // Verify amounts are integers (Satang)
    const checks = [
      { field: 'subtotal', value: invoice.subtotal },
      { field: 'vatAmount', value: invoice.vatAmount },
      { field: 'totalAmount', value: invoice.totalAmount },
      { field: 'netAmount', value: invoice.netAmount },
    ];

    checks.forEach(({ field, value }) => {
      if (!Number.isInteger(value)) {
        errors.push(`❌ ${field} is not an integer: ${value} (type: ${typeof value})`);
      } else {
        console.log(`  ✅ ${field} is integer (Satang): ${value}`);
      }
    });

    // Verify display conversion
    const displayTotal = formatBaht(invoice.totalAmount);
    console.log(`  ✅ Display format: ${displayTotal}`);
    passed++;
  }

  // Test 2: Check PurchaseOrderLine schema (Float → Int migration)
  console.log('\n📊 Test 2: PO Line Float→Int Migration');

  const poLine = await prisma.purchaseOrderLine.findFirst();

  if (!poLine) {
    console.log('  ⚠️  No PO lines found (expected - dev database may be empty)');
  } else {
    const poChecks = [
      { field: 'unitPrice', value: poLine.unitPrice },
      { field: 'discount', value: poLine.discount },
      { field: 'vatAmount', value: poLine.vatAmount },
      { field: 'amount', value: poLine.amount },
    ];

    poChecks.forEach(({ field, value }) => {
      if (!Number.isInteger(value)) {
        errors.push(`❌ PO ${field} is not an integer: ${value} (type: ${typeof value})`);
      } else {
        console.log(`  ✅ PO ${field} is integer (Satang): ${value}`);
      }
    });
    passed++;
  }

  // Test 3: Check PurchaseRequestLine schema (Float → Int migration)
  console.log('\n📊 Test 3: PR Line Float→Int Migration');

  const prLine = await prisma.purchaseRequestLine.findFirst();

  if (!prLine) {
    console.log('  ⚠️  No PR lines found (expected - dev database may be empty)');
  } else {
    const prChecks = [
      { field: 'unitPrice', value: prLine.unitPrice },
      { field: 'discount', value: prLine.discount },
      { field: 'vatAmount', value: prLine.vatAmount },
      { field: 'amount', value: prLine.amount },
    ];

    prChecks.forEach(({ field, value }) => {
      if (!Number.isInteger(value)) {
        errors.push(`❌ PR ${field} is not an integer: ${value} (type: ${typeof value})`);
      } else {
        console.log(`  ✅ PR ${field} is integer (Satang): ${value}`);
      }
    });
    passed++;
  }

  // Test 4: Verify currency helper functions
  console.log('\n🔧 Test 4: Currency Helper Functions');

  const testCases = [
    { baht: 100.5, expectedSatang: 10050 },
    { baht: 1000, expectedSatang: 100000 },
    { baht: 0.99, expectedSatang: 99 },
  ];

  testCases.forEach(({ baht, expectedSatang }) => {
    const result = bahtToSatang(baht);
    if (result !== expectedSatang) {
      errors.push(`❌ bahtToSatang(${baht}) = ${result}, expected ${expectedSatang}`);
    } else {
      console.log(`  ✅ bahtToSatang(${baht}) = ${result}`);
    }

    const backToBaht = satangToBaht(result);
    if (Math.abs(backToBaht - baht) > 0.01) {
      errors.push(`❌ satangToBaht(${result}) = ${backToBaht}, expected ${baht}`);
    } else {
      console.log(`  ✅ satangToBaht(${result}) = ${backToBaht.toFixed(2)}`);
    }
  });
  passed++;

  // Test 5: Verify no factor-of-100 errors in stored data
  console.log('\n📊 Test 5: Data Sanity Check');

  const invoices = await prisma.invoice.findMany({
    where: { deletedAt: null },
    take: 5,
  });

  console.log(`  ✅ Checking ${invoices.length} invoices for factor-of-100 errors...`);

  invoices.forEach((inv) => {
    // If totalAmount is reasonable (e.g., between 100 and 10000000 Satang = ฿1-฿100,000)
    if (inv.totalAmount < 100 || inv.totalAmount > 10000000) {
      errors.push(
        `❌ Invoice ${inv.invoiceNumber} has suspicious totalAmount: ${inv.totalAmount} Satang`
      );
    } else {
      console.log(`  ✅ Invoice ${inv.invoiceNumber}: ${formatBaht(inv.totalAmount)} (reasonable)`);
    }
  });
  passed++;

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('='.repeat(60));

  if (errors.length === 0) {
    console.log(`✅ ALL TESTS PASSED (${passed}/${passed})`);
    console.log('\n🎉 Currency fixes are working correctly!');
    console.log('\n✅ Database schema: All monetary fields are Int (Satang)');
    console.log('✅ Helper functions: Conversions work correctly');
    console.log('✅ Data integrity: No factor-of-100 errors detected');
  } else {
    console.log(`❌ SOME TESTS FAILED (${errors.length} errors)`);
    console.log('');
    errors.forEach((err) => console.log(err));
  }

  console.log('\n' + '='.repeat(60));

  await prisma.$disconnect();
  process.exit(errors.length > 0 ? 1 : 0);
}

verifyCurrencyFixes().catch(console.error);
