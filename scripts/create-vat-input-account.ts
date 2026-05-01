/**
 * Create VAT Input Account (1145)
 *
 * This script creates the missing VAT Input account that is referenced
 * in the Debit Notes and Purchase Invoice modules but doesn't exist
 * in the chart of accounts.
 *
 * VAT Input (ภาษีมูลค่าเพิ่มซื้อ) is an ASSET account that tracks
 * recoverable VAT paid on purchases. This is used for:
 * - Purchase Invoices (VAT paid to suppliers)
 * - Debit Notes from suppliers (additional VAT paid)
 * - Supplier Credit Notes (VAT reductions)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking if VAT Input account (1145) exists...');

  // Check if account already exists
  const existing = await prisma.chartOfAccount.findUnique({
    where: { code: '1145' },
  });

  if (existing) {
    console.log('✅ VAT Input account (1145) already exists');
    console.log(`   Code: ${existing.code}`);
    console.log(`   Name: ${existing.name}`);
    console.log(`   Type: ${existing.type}`);
    return;
  }

  console.log('📝 Creating VAT Input account (1145)...');

  // Get the parent asset account (1100 - Current Assets)
  const parentAccount = await prisma.chartOfAccount.findUnique({
    where: { code: '1100' },
  });

  if (!parentAccount) {
    throw new Error('Parent account 1100 (สินทรัพย์หมุนเวียน) not found');
  }

  // Create VAT Input account
  const vatInputAccount = await prisma.chartOfAccount.create({
    data: {
      code: '1145',
      name: 'ภาษีมูลค่าเพิ่มซื้อ',
      nameEn: 'VAT Input',
      type: 'ASSET',
      parentId: parentAccount.id,
      level: 4,
      isDetail: true,
      isSystem: false,
      isActive: true,
    },
  });

  console.log('✅ VAT Input account created successfully!');
  console.log(`   Code: ${vatInputAccount.code}`);
  console.log(`   Name: ${vatInputAccount.name}`);
  console.log(`   Name (EN): ${vatInputAccount.nameEn}`);
  console.log(`   Type: ${vatInputAccount.type}`);
  console.log(`   Parent: ${parentAccount.name} (${parentAccount.code})`);

  console.log('\n📊 Chart of Accounts Summary:');
  console.log('   VAT INPUT (1145): ภาษีมูลค่าเพิ่มซื้อ (ASSET) - For VAT paid on purchases');
  console.log(
    '   VAT OUTPUT (2132): ภาษีมูลค่าเพิ่มต้องชำระ (LIABILITY) - For VAT charged on sales'
  );
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
