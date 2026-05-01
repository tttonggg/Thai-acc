/**
 * Backfill VatRecord entries for existing invoices
 * Run this script to create missing VatRecord entries for all ISSUED/PAID invoices
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function backfillVatRecords() {
  console.log('🔍 Starting VatRecord backfill...');

  try {
    // Get all ISSUED, PAID, and PARTIAL invoices that don't have VatRecord entries
    const invoices = await prisma.invoice.findMany({
      where: {
        status: {
          in: ['ISSUED', 'PAID', 'PARTIAL'],
        },
      },
      include: {
        customer: true,
      },
      orderBy: {
        invoiceDate: 'desc',
      },
    });

    console.log(`📊 Found ${invoices.length} invoices to process`);

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const invoice of invoices) {
      try {
        // Check if VatRecord already exists
        const existing = await prisma.vatRecord.findFirst({
          where: {
            referenceId: invoice.id,
            documentType: 'INVOICE',
          },
        });

        if (existing) {
          console.log(`⏭️  Skipping ${invoice.invoiceNo} - VatRecord already exists`);
          skipped++;
          continue;
        }

        // Create VatRecord
        await prisma.vatRecord.create({
          data: {
            type: 'OUTPUT',
            documentNo: invoice.invoiceNo,
            documentDate: invoice.invoiceDate,
            documentType: 'INVOICE',
            referenceId: invoice.id,
            customerId: invoice.customerId,
            customerName: invoice.customer.name,
            customerTaxId: invoice.customer.taxId,
            description: `ใบกำกับภาษี ${invoice.invoiceNo}`,
            subtotal: invoice.subtotal,
            vatRate: invoice.vatRate || 7,
            vatAmount: invoice.vatAmount,
            totalAmount: invoice.totalAmount,
            taxMonth: invoice.invoiceDate.getMonth() + 1,
            taxYear: invoice.invoiceDate.getFullYear(),
          },
        });

        console.log(`✅ Created VatRecord for ${invoice.invoiceNo} (VAT: ${invoice.vatAmount})`);
        created++;
      } catch (error) {
        console.error(`❌ Error processing ${invoice.invoiceNo}:`, error);
        errors++;
      }
    }

    console.log('\n📈 Summary:');
    console.log(`   ✅ Created: ${created}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📊 Total processed: ${invoices.length}`);

    // Calculate totals
    const totalVat = invoices.reduce((sum, inv) => sum + inv.vatAmount, 0);
    const totalSubtotal = invoices.reduce((sum, inv) => sum + inv.subtotal, 0);
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

    console.log('\n💰 VAT Totals:');
    console.log(`   Subtotal: ฿${totalSubtotal.toLocaleString()}`);
    console.log(`   VAT: ฿${totalVat.toLocaleString()}`);
    console.log(`   Total: ฿${totalAmount.toLocaleString()}`);

    // Verify records were actually created
    const vatRecordCount = await prisma.vatRecord.count();
    const vatRecordSum = await prisma.vatRecord.aggregate({
      _sum: {
        vatAmount: true,
      },
    });
    console.log('\n🔍 Verification:');
    console.log(`   VatRecord count in database: ${vatRecordCount}`);
    console.log(
      `   Total VAT in VatRecord: ฿${(vatRecordSum._sum.vatAmount || 0).toLocaleString()}`
    );
  } catch (error) {
    console.error('💥 Fatal error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

backfillVatRecords()
  .then(() => {
    console.log('\n✅ Backfill complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Backfill failed:', error);
    process.exit(1);
  });
