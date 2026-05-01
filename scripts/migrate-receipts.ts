/**
 * MIGRATION SCRIPT: Generate Receipts for Paid Invoices
 *
 * This script fixes the data inconsistency where invoices have paidAmount
 * but no Receipt documents exist. This violates Thai accounting standards.
 *
 * Thai Accounting Requirements:
 * - Every payment MUST have a Receipt (ใบเสร็จรับเงิน)
 * - Receipts must be linked to invoices via ReceiptAllocation (การจัดสรร)
 * - Receipt numbers must be sequential and reset monthly
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface PaidInvoice {
  id: string;
  invoiceNo: string;
  invoiceDate: Date;
  customerId: string;
  customerName: string;
  totalAmount: number;
  paidAmount: number;
  remaining: number;
  status: string;
}

async function generateReceiptNumber(prisma: PrismaClient, date: Date): Promise<string> {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');

  // Get or create receipt document number sequence
  let docNumber = await prisma.documentNumber.findUnique({
    where: { type: 'RECEIPT' },
  });

  if (!docNumber) {
    docNumber = await prisma.documentNumber.create({
      data: {
        type: 'RECEIPT',
        prefix: 'RC',
        currentNo: 0,
        format: '{prefix}{yyyy}{mm}-{0000}',
        resetMonthly: true,
      },
    });
  }

  // Check if we need to reset (monthly reset)
  const lastReceipt = await prisma.receipt.findFirst({
    where: {
      receiptNo: {
        startsWith: `RC${year}${month}`,
      },
    },
    orderBy: { receiptNo: 'desc' },
  });

  if (lastReceipt) {
    // Extract sequence number from last receipt
    const match = lastReceipt.receiptNo.match(/RC\d{4}-(\d{4})/);
    if (match) {
      const lastSeq = parseInt(match[1]);
      await prisma.documentNumber.update({
        where: { type: 'RECEIPT' },
        data: { currentNo: lastSeq },
      });
      docNumber.currentNo = lastSeq;
    }
  }

  // Increment and generate new number
  const newSeq = docNumber.currentNo + 1;
  await prisma.documentNumber.update({
    where: { type: 'RECEIPT' },
    data: { currentNo: newSeq },
  });

  const seq = String(newSeq).padStart(4, '0');
  return `RC${year}${month}-${seq}`;
}

async function migrateReceipts() {
  console.log('🔍 Starting Receipt Migration...\n');

  try {
    // Get all paid/partially paid invoices using Prisma client
    const invoices = await prisma.invoice.findMany({
      where: {
        paidAmount: { gt: 0 },
        status: { not: 'CANCELLED' },
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ customerId: 'asc' }, { invoiceDate: 'asc' }],
    });

    const paidInvoices: PaidInvoice[] = invoices.map((inv) => ({
      id: inv.id,
      invoiceNo: inv.invoiceNo,
      invoiceDate: inv.invoiceDate,
      customerId: inv.customerId,
      customerName: inv.customer.name,
      totalAmount: inv.totalAmount,
      paidAmount: inv.paidAmount,
      remaining: inv.totalAmount - inv.paidAmount,
      status: inv.status,
    }));

    console.log(`📊 Found ${paidInvoices.length} invoices with payments\n`);

    // Group by customer
    const customerGroups = new Map<string, PaidInvoice[]>();

    for (const invoice of paidInvoices) {
      if (!customerGroups.has(invoice.customerId)) {
        customerGroups.set(invoice.customerId, []);
      }
      customerGroups.get(invoice.customerId)!.push(invoice);
    }

    console.log(`👥 Processing ${customerGroups.size} customers\n`);

    let receiptCount = 0;
    let allocationCount = 0;

    // Process each customer
    for (const [customerId, invoices] of customerGroups.entries()) {
      console.log(`\n--- Customer: ${invoices[0].customerName} ---`);

      // For simplicity, create one receipt per invoice
      // In real scenario, you might want to group by payment date
      for (const invoice of invoices) {
        // Generate receipt number
        const receiptNo = await generateReceiptNumber(prisma, invoice.invoiceDate);

        // Create receipt
        const receipt = await prisma.receipt.create({
          data: {
            receiptNo,
            receiptDate: new Date(invoice.invoiceDate.getTime() + 86400000), // Day after invoice
            customerId: invoice.customerId,
            paymentMethod: 'TRANSFER', // Default payment method
            amount: invoice.paidAmount,
            whtAmount: 0,
            unallocated: 0,
            status: 'POSTED',
            isActive: true,
          },
        });

        console.log(
          `  ✅ Created Receipt: ${receiptNo} for ${invoice.invoiceNo} (${invoice.paidAmount / 100} THB)`
        );

        // Create allocation
        await prisma.receiptAllocation.create({
          data: {
            receiptId: receipt.id,
            invoiceId: invoice.id,
            amount: invoice.paidAmount,
            whtRate: 0,
            whtAmount: 0,
          },
        });

        console.log(`     └─ Allocated to ${invoice.invoiceNo}`);

        receiptCount++;
        allocationCount++;
      }
    }

    console.log(`\n\n✅ Migration Complete!`);
    console.log(`📄 Receipts created: ${receiptCount}`);
    console.log(`🔗 Allocations created: ${allocationCount}`);
    console.log(`\n📝 Note: Review generated receipts and adjust payment dates if needed`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateReceipts()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error:', error);
    process.exit(1);
  });
