#!/usr/bin/env bun
/**
 * Historical Data Seeding Script
 * Seeds a full year of data (April 2025 - March 2026) for testing reports
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper functions
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateInvoiceNumber(prefix: string, date: Date, seq: number): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const seqStr = seq.toString().padStart(4, '0');
  return `${prefix}-${year}-${month}-${seqStr}`;
}

function calculateVat(amount: number, rate: number = 7): number {
  return Math.round((amount * rate) / 100);
}

// Get quarter for a date
function getQuarter(date: Date): number {
  return Math.floor(date.getMonth() / 3) + 1;
}

// Get fiscal year (Thai fiscal year starts in October)
function getFiscalYear(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth();
  // Thai fiscal year: Oct-Dec = current year+1, Jan-Sep = current year
  return month >= 9 ? year + 1 : year;
}

async function main() {
  console.log('🌱 Starting historical data seeding...');
  console.log('📅 Date range: April 2025 - March 2026 (Full Fiscal Year)');

  // Define date range - Full year covering fiscal year 2026
  const startDate = new Date('2025-04-01');
  const endDate = new Date('2026-03-31');
  const today = new Date();

  // Get existing data
  const company = await prisma.company.findFirst();
  if (!company) {
    console.error('❌ No company found. Please run initial seed first.');
    process.exit(1);
  }

  const customers = await prisma.customer.findMany();
  const vendors = await prisma.vendor.findMany();
  const products = await prisma.product.findMany();
  const accounts = await prisma.chartOfAccount.findMany();

  console.log(
    `📊 Found ${customers.length} customers, ${vendors.length} vendors, ${products.length} products`
  );

  // Get account IDs
  const accountMap: Record<string, string> = {};
  for (const acc of accounts) {
    accountMap[acc.code] = acc.id;
  }

  // ============================================
  // 1. Generate Sales Invoices (200 invoices)
  // ============================================
  console.log('\n📄 Generating Sales Invoices...');

  const invoiceStatuses = ['DRAFT', 'ISSUED', 'PAID', 'PARTIAL', 'CANCELLED'];
  const invoiceStatusWeights = [0.1, 0.3, 0.4, 0.15, 0.05]; // Probability distribution

  let invoiceSeq = (await prisma.invoice.count()) + 1;
  const invoicesCreated = [];

  // Distribute 200 invoices across 12 months
  for (let month = 0; month < 12; month++) {
    const monthStart = new Date(2025, 3 + month, 1); // April 2025 = month 3
    const monthEnd = new Date(2025, 4 + month, 0); // Last day of month

    // Adjust for months beyond December
    if (month >= 8) {
      monthStart.setFullYear(2025 + Math.floor((month + 4) / 12));
      monthEnd.setFullYear(2025 + Math.floor((month + 4) / 12));
    }

    // 15-20 invoices per month
    const monthInvoiceCount = randomInt(15, 20);

    for (let i = 0; i < monthInvoiceCount; i++) {
      const customer = customers[randomInt(0, customers.length - 1)];
      const invoiceDate = randomDate(monthStart, monthEnd);
      const invoiceNo = generateInvoiceNumber('INV', invoiceDate, invoiceSeq++);

      // Weighted random status
      const rand = Math.random();
      let status = 'DRAFT';
      let cumulativeWeight = 0;
      for (let j = 0; j < invoiceStatuses.length; j++) {
        cumulativeWeight += invoiceStatusWeights[j];
        if (rand <= cumulativeWeight) {
          status = invoiceStatuses[j];
          break;
        }
      }

      // Generate 1-4 line items
      const numLines = randomInt(1, 4);
      const lines = [];
      let subtotal = 0;

      for (let j = 0; j < numLines; j++) {
        const product = products[randomInt(0, products.length - 1)];
        const quantity = randomInt(1, 10);
        const unitPrice = product.salePrice || randomInt(500, 5000);
        const amount = quantity * unitPrice;
        subtotal += amount;

        lines.push({
          lineNo: j + 1,
          productId: product.id,
          description: product.name,
          quantity,
          unit: product.unit,
          unitPrice,
          amount,
          vatRate: 7,
          vatAmount: calculateVat(amount),
        });
      }

      const vatAmount = calculateVat(subtotal);
      const totalAmount = subtotal + vatAmount;
      const discountAmount = Math.random() > 0.7 ? Math.floor(subtotal * 0.05) : 0;
      const netAmount = totalAmount - discountAmount;

      // Calculate paid amount based on status
      let paidAmount = 0;
      if (status === 'PAID') {
        paidAmount = netAmount;
      } else if (status === 'PARTIAL') {
        paidAmount = Math.floor(netAmount * (randomInt(20, 80) / 100));
      }

      const invoice = await prisma.invoice.create({
        data: {
          invoiceNo,
          invoiceDate,
          dueDate: new Date(invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000),
          customerId: customer.id,
          type: 'TAX_INVOICE',
          subtotal,
          vatRate: 7,
          vatAmount,
          totalAmount,
          discountAmount,
          netAmount,
          paidAmount,
          status: status as any,
          lines: {
            create: lines,
          },
        },
      });
      invoicesCreated.push(invoice);
    }
  }
  console.log(`✅ Created ${invoicesCreated.length} sales invoices`);

  // ============================================
  // 2. Generate Credit Notes (30 CN)
  // ============================================
  console.log('\n📝 Generating Credit Notes (ใบลดหนี้)...');

  let cnSeq = (await prisma.creditNote.count()) + 1;
  const cnCreated = [];

  for (let i = 0; i < 30; i++) {
    const customer = customers[randomInt(0, customers.length - 1)];
    const cnDate = randomDate(startDate, endDate);
    const cnNo = generateInvoiceNumber('CN', cnDate, cnSeq++);

    // Find a random invoice for reference
    const refInvoice = invoicesCreated[randomInt(0, invoicesCreated.length - 1)];

    const amount = randomInt(1000, 50000);
    const vatAmount = calculateVat(amount);
    const totalAmount = amount + vatAmount;

    const cn = await prisma.creditNote.create({
      data: {
        cnNo,
        cnDate,
        customerId: customer.id,
        referenceInvoiceId: refInvoice?.id || null,
        reason: ['สินค้าผิดพลาด', 'ราคาผิด', 'คืนสินค้า', 'ส่วนลดพิเศษ'][randomInt(0, 3)],
        amount,
        vatRate: 7,
        vatAmount,
        totalAmount,
        status: Math.random() > 0.2 ? 'ISSUED' : 'DRAFT',
        lines: {
          create: [
            {
              lineNo: 1,
              description: 'รายการลดหนี้',
              quantity: 1,
              unit: 'รายการ',
              unitPrice: amount,
              amount,
              vatRate: 7,
              vatAmount,
            },
          ],
        },
      },
    });
    cnCreated.push(cn);
  }
  console.log(`✅ Created ${cnCreated.length} credit notes`);

  // ============================================
  // 3. Generate Debit Notes (20 DN)
  // ============================================
  console.log('\n📝 Generating Debit Notes (ใบเพิ่มหนี้)...');

  let dnSeq = (await prisma.debitNote.count()) + 1;
  const dnCreated = [];

  for (let i = 0; i < 20; i++) {
    const customer = customers[randomInt(0, customers.length - 1)];
    const dnDate = randomDate(startDate, endDate);
    const dnNo = generateInvoiceNumber('DN', dnDate, dnSeq++);

    // Find a random invoice for reference
    const refInvoice = invoicesCreated[randomInt(0, invoicesCreated.length - 1)];

    const amount = randomInt(500, 25000);
    const vatAmount = calculateVat(amount);
    const totalAmount = amount + vatAmount;

    const dn = await prisma.debitNote.create({
      data: {
        dnNo,
        dnDate,
        customerId: customer.id,
        referenceInvoiceId: refInvoice?.id || null,
        reason: ['ค่าขนส่งเพิ่ม', 'ราคาสินค้าปรับขึ้น', 'ค่าบริการเพิ่มเติม'][randomInt(0, 2)],
        amount,
        vatRate: 7,
        vatAmount,
        totalAmount,
        status: Math.random() > 0.2 ? 'ISSUED' : 'DRAFT',
        lines: {
          create: [
            {
              lineNo: 1,
              description: 'รายการเพิ่มหนี้',
              quantity: 1,
              unit: 'รายการ',
              unitPrice: amount,
              amount,
              vatRate: 7,
              vatAmount,
            },
          ],
        },
      },
    });
    dnCreated.push(dn);
  }
  console.log(`✅ Created ${dnCreated.length} debit notes`);

  // ============================================
  // 4. Generate Purchase Invoices (80)
  // ============================================
  console.log('\n📄 Generating Purchase Invoices (ใบซื้อ)...');

  let poSeq = (await prisma.purchaseInvoice.count()) + 1;
  const purchasesCreated = [];

  for (let i = 0; i < 80; i++) {
    const vendor = vendors[randomInt(0, vendors.length - 1)];
    const poDate = randomDate(startDate, endDate);
    const poNo = generateInvoiceNumber('PO', poDate, poSeq++);

    // 1-3 line items
    const numLines = randomInt(1, 3);
    const lines = [];
    let subtotal = 0;

    for (let j = 0; j < numLines; j++) {
      const product = products[randomInt(0, products.length - 1)];
      const quantity = randomInt(5, 50);
      const unitPrice = product.costPrice || randomInt(300, 3000);
      const amount = quantity * unitPrice;
      subtotal += amount;

      lines.push({
        lineNo: j + 1,
        description: product.name,
        quantity,
        unit: product.unit,
        unitPrice,
        amount,
        vatRate: 7,
        vatAmount: calculateVat(amount),
      });
    }

    const vatAmount = calculateVat(subtotal);
    const totalAmount = subtotal + vatAmount;

    const purchase = await prisma.purchaseInvoice.create({
      data: {
        poNo,
        poDate,
        dueDate: new Date(poDate.getTime() + 30 * 24 * 60 * 60 * 1000),
        vendorId: vendor.id,
        subtotal,
        vatRate: 7,
        vatAmount,
        totalAmount,
        status: ['DRAFT', 'ISSUED', 'PAID', 'PARTIAL'][randomInt(0, 3)] as any,
        lines: {
          create: lines,
        },
      },
    });
    purchasesCreated.push(purchase);
  }
  console.log(`✅ Created ${purchasesCreated.length} purchase invoices`);

  // ============================================
  // 5. Generate Receipts (150)
  // ============================================
  console.log('\n💰 Generating Receipts (ใบเสร็จรับเงิน)...');

  let receiptSeq = (await prisma.receipt.count()) + 1;
  const receiptsCreated = [];

  // Get unpaid/partial invoices
  const unpaidInvoices = invoicesCreated.filter(
    (inv) => inv.status === 'ISSUED' || inv.status === 'PARTIAL'
  );

  for (let i = 0; i < 150; i++) {
    const customer = customers[randomInt(0, customers.length - 1)];
    const receiptDate = randomDate(startDate, endDate);
    const receiptNo = generateInvoiceNumber('RCP', receiptDate, receiptSeq++);

    const amount = randomInt(1000, 100000);
    const whtAmount = Math.random() > 0.7 ? Math.floor(amount * 0.03) : 0;
    const netAmount = amount - whtAmount;

    // Link to random invoice if available
    const refInvoice =
      unpaidInvoices.length > 0 ? unpaidInvoices[randomInt(0, unpaidInvoices.length - 1)] : null;

    const receipt = await prisma.receipt.create({
      data: {
        receiptNo,
        receiptDate,
        customerId: customer.id,
        reference: refInvoice?.invoiceNo || null,
        amount,
        whtRate: whtAmount > 0 ? 3 : 0,
        whtAmount,
        netAmount,
        paymentMethod: ['CASH', 'BANK_TRANSFER', 'CHEQUE', 'CREDIT_CARD'][randomInt(0, 3)] as any,
        status: 'COMPLETED',
      },
    });
    receiptsCreated.push(receipt);
  }
  console.log(`✅ Created ${receiptsCreated.length} receipts`);

  // ============================================
  // 6. Generate Payments (100)
  // ============================================
  console.log('\n💸 Generating Payments (ใบจ่ายเงิน)...');

  let paymentSeq = (await prisma.payment.count()) + 1;
  const paymentsCreated = [];

  for (let i = 0; i < 100; i++) {
    const vendor = vendors[randomInt(0, vendors.length - 1)];
    const paymentDate = randomDate(startDate, endDate);
    const paymentNo = generateInvoiceNumber('PAY', paymentDate, paymentSeq++);

    const amount = randomInt(1000, 80000);
    const whtAmount = Math.random() > 0.6 ? Math.floor(amount * 0.03) : 0;
    const netAmount = amount - whtAmount;

    const payment = await prisma.payment.create({
      data: {
        paymentNo,
        paymentDate,
        vendorId: vendor.id,
        description: `ค่าสินค้า/บริการ - ${vendor.name}`,
        amount,
        whtRate: whtAmount > 0 ? 3 : 0,
        whtAmount,
        netAmount,
        paymentMethod: ['CASH', 'BANK_TRANSFER', 'CHEQUE'][randomInt(0, 2)] as any,
        status: 'COMPLETED',
      },
    });
    paymentsCreated.push(payment);
  }
  console.log(`✅ Created ${paymentsCreated.length} payments`);

  // ============================================
  // 7. Generate Journal Entries (300)
  // ============================================
  console.log('\n📒 Generating Journal Entries (บันทึกบัญชี)...');

  let jeSeq = (await prisma.journalEntry.count()) + 1;
  const entriesCreated = [];

  const jeTypes = [
    { type: 'SALES', desc: 'บันทึกขายสินค้า', debit: '1121', credit: '4110', ratio: 0.3 },
    { type: 'PURCHASE', desc: 'บันทึกซื้อสินค้า', debit: '5110', credit: '2110', ratio: 0.2 },
    { type: 'CASH', desc: 'รับเงิน/จ่ายเงิน', debit: '1111', credit: '1121', ratio: 0.2 },
    { type: 'EXPENSE', desc: 'บันทึกค่าใช้จ่าย', debit: '5310', credit: '1111', ratio: 0.15 },
    { type: 'ADJUST', desc: 'ปรับปรุงบัญชี', debit: '5390', credit: '1212', ratio: 0.1 },
    { type: 'ACCRUAL', desc: 'ค่าใช้จ่ายค้างจ่าย', debit: '5320', credit: '2131', ratio: 0.05 },
  ];

  for (let i = 0; i < 300; i++) {
    const jeDate = randomDate(startDate, endDate);
    const jeNo = `JE-${jeDate.getFullYear()}-${jeSeq.toString().padStart(5, '0')}`;
    jeSeq++;

    // Select JE type based on ratio
    const rand = Math.random();
    let cumulativeRatio = 0;
    let selectedType = jeTypes[0];
    for (const jeType of jeTypes) {
      cumulativeRatio += jeType.ratio;
      if (rand <= cumulativeRatio) {
        selectedType = jeType;
        break;
      }
    }

    const amount = randomInt(1000, 100000);
    const vatAmount = calculateVat(amount);
    const totalAmount = amount + vatAmount;

    const entry = await prisma.journalEntry.create({
      data: {
        entryNo: jeNo,
        date: jeDate,
        description: selectedType.desc,
        totalDebit: totalAmount,
        totalCredit: totalAmount,
        status: 'POSTED',
        lines: {
          create: [
            {
              lineNo: 1,
              accountId: accountMap[selectedType.debit] || accountMap['1111'],
              description: selectedType.desc,
              debit: totalAmount,
              credit: 0,
            },
            {
              lineNo: 2,
              accountId: accountMap[selectedType.credit] || accountMap['4110'],
              description: selectedType.desc,
              debit: 0,
              credit: amount,
            },
            ...(vatAmount > 0 && selectedType.type === 'SALES'
              ? [
                  {
                    lineNo: 3,
                    accountId: accountMap['2132'],
                    description: 'ภาษีมูลค่าเพิ่ม',
                    debit: 0,
                    credit: vatAmount,
                  },
                ]
              : []),
          ].filter(Boolean) as any,
        },
      },
    });
    entriesCreated.push(entry);
  }
  console.log(`✅ Created ${entriesCreated.length} journal entries`);

  // ============================================
  // 8. Update Document Numbers
  // ============================================
  console.log('\n🔄 Updating document numbers...');

  await prisma.documentNumber.updateMany({
    where: { type: 'INVOICE' },
    data: { currentNo: invoiceSeq },
  });
  await prisma.documentNumber.updateMany({
    where: { type: 'CREDIT_NOTE' },
    data: { currentNo: cnSeq },
  });
  await prisma.documentNumber.updateMany({
    where: { type: 'DEBIT_NOTE' },
    data: { currentNo: dnSeq },
  });
  await prisma.documentNumber.updateMany({
    where: { type: 'PURCHASE' },
    data: { currentNo: poSeq },
  });
  await prisma.documentNumber.updateMany({
    where: { type: 'RECEIPT' },
    data: { currentNo: receiptSeq },
  });
  await prisma.documentNumber.updateMany({
    where: { type: 'PAYMENT' },
    data: { currentNo: paymentSeq },
  });
  console.log('✅ Document numbers updated');

  // ============================================
  // Summary
  // ============================================
  console.log('\n' + '='.repeat(60));
  console.log('🎉 Historical Data Seeding Complete!');
  console.log('='.repeat(60));
  console.log('\n📊 Data Summary:');
  console.log(`   • Sales Invoices: ${invoicesCreated.length}`);
  console.log(`   • Credit Notes (CN): ${cnCreated.length}`);
  console.log(`   • Debit Notes (DN): ${dnCreated.length}`);
  console.log(`   • Purchase Invoices: ${purchasesCreated.length}`);
  console.log(`   • Receipts: ${receiptsCreated.length}`);
  console.log(`   • Payments: ${paymentsCreated.length}`);
  console.log(`   • Journal Entries: ${entriesCreated.length}`);
  console.log(
    `\n📅 Period: ${startDate.toLocaleDateString('th-TH')} - ${endDate.toLocaleDateString('th-TH')}`
  );

  // Calculate totals by quarter
  const quarters = {
    Q1: { invoices: 0, amount: 0 },
    Q2: { invoices: 0, amount: 0 },
    Q3: { invoices: 0, amount: 0 },
    Q4: { invoices: 0, amount: 0 },
  };

  for (const inv of invoicesCreated) {
    const q = getQuarter(inv.invoiceDate);
    const qKey = `Q${q}` as keyof typeof quarters;
    quarters[qKey].invoices++;
    quarters[qKey].amount += inv.netAmount;
  }

  console.log('\n📈 Sales by Quarter:');
  for (const [q, data] of Object.entries(quarters)) {
    console.log(`   • ${q}: ${data.invoices} invoices, ฿${data.amount.toLocaleString('th-TH')}`);
  }

  console.log('\n✨ Ready for testing reports:');
  console.log('   • Date-to-date reports');
  console.log('   • Quarterly reports');
  console.log('   • Half-year reports (H1/H2)');
  console.log('   • Fiscal year reports');
  console.log('='.repeat(60));
}

main()
  .catch((e) => {
    console.error('❌ Historical seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
