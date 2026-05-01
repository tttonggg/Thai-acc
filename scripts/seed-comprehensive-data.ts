/**
 * COMPREHENSIVE SEED DATA FOR TESTING
 *
 * This script creates realistic test data for ALL modules including:
 * - Installment payments (ผ่อนจ่ายหลายงวด)
 * - Full and partial payment scenarios
 * - Quotations, Bank Accounts, Fixed Assets, Employees, etc.
 * - Test data for all empty modules
 */

import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { DateTime } from 'luxon';

const prisma = new PrismaClient();

// Helper to generate Thai dates
function thaiDate(daysOffset: number = 0): Date {
  return DateTime.now().plus({ days: daysOffset }).toJSDate();
}

// Helper to generate random Thai phone number
function thaiPhone(): string {
  const prefixes = [
    '081',
    '082',
    '083',
    '085',
    '086',
    '087',
    '089',
    '061',
    '062',
    '063',
    '064',
    '065',
  ];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = Math.floor(Math.random() * 100000000)
    .toString()
    .padStart(8, '0');
  return `${prefix}${suffix}`;
}

// Helper to generate Thai Tax ID (13 digits)
function thaiTaxId(): string {
  return Math.floor(Math.random() * 1000000000000)
    .toString()
    .padStart(13, '0');
}

async function seedBankAccounts() {
  console.log('🏦 Seeding Bank Accounts...');

  const banks = [
    { code: 'BBL', name: 'ธนาคารกรุงเทพ' },
    { code: 'KTB', name: 'ธนาคารกรุงไทย' },
    { code: 'SCB', name: 'ธนาคารไทยพาณิชย์' },
    { code: 'KBANK', name: 'ธนาคารกสิกรไทย' },
  ];

  for (const bank of banks) {
    await prisma.bankAccount.upsert({
      where: { code: `${bank.code}-001` },
      update: {},
      create: {
        code: `${bank.code}-001`,
        accountName: `บัญชีออมทรัพย์ ${bank.name}`,
        accountNumber: `${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        bankName: bank.name,
        branch: 'สาขาหลัก',
        accountType: 'SAVINGS',
        currency: 'THB',
        balance: Math.floor(Math.random() * 5000000) * 100, // Random balance up to 50,000 THB
        isActive: true,
      },
    });
  }

  console.log('  ✅ Created 4 bank accounts');
}

async function seedQuotations() {
  console.log('📄 Seeding Quotations...');

  const customers = await prisma.customer.findMany({ take: 5 });
  const products = await prisma.product.findMany({ take: 10 });

  for (let i = 0; i < 15; i++) {
    const customer = customers[i % customers.length];
    const validDays = Math.floor(Math.random() * 30) + 15; // 15-45 days validity
    const quotationDate = thaiDate(-Math.floor(Math.random() * 30));
    const validUntil = DateTime.fromJSDate(quotationDate).plus({ days: validDays }).toJSDate();

    // Generate random line items
    const numItems = Math.floor(Math.random() * 3) + 1;
    const lines = [];
    let subtotal = 0;

    for (let j = 0; j < numItems; j++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const quantity = Math.floor(Math.random() * 10) + 1;
      const unitPrice = Math.floor(Math.random() * 5000) + 500; // 500-5500 THB
      const amount = quantity * unitPrice;
      subtotal += amount;

      lines.push({
        lineNo: j + 1,
        description: product.name || `สินค้าประเภท ${j + 1}`,
        quantity,
        unit: 'ชิ้น',
        unitPrice,
        vatRate: 7,
        vatAmount: Math.round(amount * 0.07),
        amount,
      });
    }

    const vatAmount = Math.round(subtotal * 0.07);
    const totalAmount = subtotal + vatAmount;

    // Determine quotation status based on validity date
    let status: 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'CONVERTED' | 'EXPIRED' | 'CANCELLED';
    const now = DateTime.now();
    const validUntilDt = DateTime.fromJSDate(validUntil);

    if (validUntilDt < now) {
      status = 'EXPIRED';
    } else if (Math.random() > 0.5) {
      status = ['APPROVED', 'SENT', 'CONVERTED'][Math.floor(Math.random() * 3)] as any;
    } else {
      status = 'SENT';
    }

    await prisma.quotation.create({
      data: {
        quotationNo: `QT${DateTime.fromJSDate(quotationDate).toFormat('yyyyMM')}-${String(i + 1).padStart(4, '0')}`,
        quotationDate,
        validUntil,
        customerId: customer.id,
        contactPerson: customer.name,
        subtotal,
        discountAmount: 0,
        discountPercent: 0,
        vatRate: 7,
        vatAmount,
        totalAmount,
        status,
        notes: 'สำหรับการทดสอบระบบ',
        isActive: true,
        lines: {
          create: lines,
        },
      },
    });
  }

  console.log('  ✅ Created 15 quotations');
}

async function seedInstallments() {
  console.log('💳 Seeding Installment Payments...');

  // Find some unpaid/partially paid invoices
  const invoices = await prisma.invoice.findMany({
    where: {
      status: 'ISSUED',
      remaining: { gt: 0 },
    },
    take: 5,
  });

  for (const invoice of invoices) {
    // Create 2-3 installment receipts for each invoice
    const numInstallments = Math.floor(Math.random() * 2) + 2; // 2-3 installments
    const installmentAmount = Math.floor(invoice.totalAmount / numInstallments);
    let currentPaid = invoice.paidAmount;

    for (let i = 0; i < numInstallments; i++) {
      const installmentNo = i + 1;
      const receiptDate = thaiDate(i * 30); // Each installment 30 days apart

      // Last installment pays remaining balance
      const amount =
        i === numInstallments - 1
          ? invoice.totalAmount - currentPaid
          : Math.min(installmentAmount, invoice.totalAmount - currentPaid);

      if (amount <= 0) break;

      // Generate receipt number
      const year = receiptDate.getFullYear();
      const month = String(receiptDate.getMonth() + 1).padStart(2, '0');
      const seq = String(Math.floor(Math.random() * 9000) + 1000);

      const receipt = await prisma.receipt.create({
        data: {
          receiptNo: `RC${year}${month}-${seq}`,
          receiptDate,
          customerId: invoice.customerId,
          paymentMethod: ['CASH', 'TRANSFER', 'CHEQUE'][Math.floor(Math.random() * 3)] as any,
          amount,
          whtAmount: 0,
          unallocated: 0,
          status: 'POSTED',
          isActive: true,
        },
      });

      // Create allocation
      await prisma.receiptAllocation.create({
        data: {
          receiptId: receipt.id,
          invoiceId: invoice.id,
          amount,
          whtRate: 0,
          whtAmount: 0,
        },
      });

      // Update invoice paid amount
      currentPaid += amount;

      console.log(
        `  ✅ Installment ${installmentNo}/${numInstallments} for ${invoice.invoiceNo}: ${amount / 100} THB`
      );
    }

    // Update final invoice status
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        paidAmount: currentPaid,
        status: currentPaid >= invoice.totalAmount ? 'PAID' : 'PARTIAL',
      },
    });
  }

  console.log('  ✅ Created installment payments for 5 invoices');
}

async function seedFixedAssets() {
  console.log('🏢 Seeding Fixed Assets...');

  const assetTypes = [
    { name: 'คอมพิวเตอร์', depreciationRate: 0.2, usefulLife: 5 },
    { name: 'เฟอร์นิเจอร์ออฟฟิศ', depreciationRate: 0.142, usefulLife: 7 },
    { name: 'รถยนต์บริษัท', depreciationRate: 0.1, usefulLife: 10 },
    { name: 'เครื่องปรับอากาศ', depreciationRate: 0.125, usefulLife: 8 },
    { name: 'อุปกรณ์ออฟฟิศ', depreciationRate: 0.2, usefulLife: 5 },
  ];

  for (let i = 0; i < 20; i++) {
    const assetType = assetTypes[i % assetTypes.length];
    const purchaseDate = thaiDate(-Math.floor(Math.random() * 365));
    const purchasePrice = Math.floor(Math.random() * 500000) + 10000; // 10,000 - 510,000 THB

    await prisma.fixedAsset.create({
      data: {
        code: `AS${DateTime.fromJSDate(purchaseDate).toFormat('yyyyMM')}-${String(i + 1).padStart(4, '0')}`,
        name: `${assetType.name} #${i + 1}`,
        description: `${assetType.name} สำหรับการใช้งานในออฟฟิศ`,
        assetType: ['TANGIBLE', 'INTANGIBLE'][Math.floor(Math.random() * 2)] as any,
        serialNo: `SN${Date.now()}${i}`,
        purchaseDate,
        purchasePrice,
        accumulatedDepreciation: 0,
        netBookValue: purchasePrice,
        depreciationRate: assetType.depreciationRate,
        usefulLife: assetType.usefulLife,
        status: 'ACTIVE',
        location: 'สำนักงานใหญ่',
        responsible: 'แผนกบัญชี',
        notes: 'สำหรับการทดสอบระบบ',
        isActive: true,
      },
    });
  }

  console.log('  ✅ Created 20 fixed assets');
}

async function seedEmployees() {
  console.log('👥 Seeding Employees...');

  const positions = [
    { title: 'ผู้จัดการ', salary: 60000 },
    { title: 'นักบัญชี', salary: 35000 },
    { title: 'เจ้าหน้าที่ธุรการ', salary: 25000 },
    { title: 'พนักงานขาย', salary: 28000 },
    { title: 'โปรแกรมเมอร์', salary: 45000 },
  ];

  const thaiNames = [
    'สมชาย ใจดี',
    'วิภา สุขสันต์',
    'สมหมาย มั่นมี',
    'นภา รัตนากร',
    'อนุชิต สุขสุข',
    'มานี มีสุข',
    'สุดา รัตนเดช',
    'ปิติ มีตรี',
    'กิตติ ดีมาก',
    'สุนิสา ชื่นมงคล',
    'วีระ กล้าหาญ',
    'สมศรี จริงใจ',
  ];

  for (let i = 0; i < 12; i++) {
    const position = positions[i % positions.length];
    const name = thaiNames[i];

    await prisma.employee.upsert({
      where: { code: `EMP${String(i + 1).padStart(4, '0')}` },
      update: {},
      create: {
        code: `EMP${String(i + 1).padStart(4, '0')}`,
        name,
        email: `employee${i + 1}@company.com`,
        phone: thaiPhone(),
        position: position.title,
        department: ['บัญชี', 'ขาย', 'ไอที', 'ธุรการ'][Math.floor(Math.random() * 4)],
        salary: position.salary + Math.floor(Math.random() * 10000) - 5000,
        startDate: thaiDate(-Math.floor(Math.random() * 365)),
        ssn: thaiTaxId(),
        address: `${Math.floor(Math.random() * 500) + 1} หมู่ ${Math.floor(Math.random() * 10) + 1}`,
        province: 'กรุงเทพมหานคร',
        postalCode: '10100',
        status: 'ACTIVE',
        isActive: true,
      },
    });
  }

  console.log('  ✅ Created 12 employees');
}

async function seedPettyCash() {
  console.log('💰 Seeding Petty Cash Funds...');

  const departments = [
    { name: 'แผนกบัญชี', custodian: 'สมชาย ใจดี', amount: 5000 },
    { name: 'แผนกขาย', custodian: 'วิภา สุขสันต์', amount: 10000 },
    { name: 'แผนกธุรการ', custodian: 'สมหมาย มั่นมี', amount: 3000 },
    { name: 'แผนกไอที', custodian: 'อนุชิต สุขสุข', amount: 2000 },
  ];

  for (const dept of departments) {
    await prisma.pettyCashFund.create({
      data: {
        code: `PCF-${dept.name.substring(3, 6)}-${Math.floor(Math.random() * 1000)}`,
        name: `กองทุนเงินสดย่อย ${dept.name}`,
        department: dept.name,
        custodian: dept.custodian,
        fundAmount: dept.amount,
        currentBalance: dept.amount,
        accountNumber: `เงินสด ${dept.name}`,
        status: 'ACTIVE',
        notes: 'เงินสดย่อยสำหรับค่าใช้จ่ายประจำวัน',
        isActive: true,
      },
    });
  }

  console.log('  ✅ Created 4 petty cash funds');
}

async function seedStock() {
  console.log('📦 Seeding Stock Records...');

  const products = await prisma.product.findMany({ take: 10 });
  const warehouse = await prisma.warehouse.first();

  if (!warehouse) {
    console.log('  ⚠️ No warehouse found, skipping stock');
    return;
  }

  for (const product of products) {
    const quantity = Math.floor(Math.random() * 100) + 10;
    const unitCost = Math.floor(Math.random() * 500) + 100;

    await prisma.stock.upsert({
      where: {
        productId_warehouseId: {
          productId: product.id,
          warehouseId: warehouse.id,
        },
      },
      update: {},
      create: {
        productId: product.id,
        warehouseId: warehouse.id,
        quantity,
        unitCost,
        averageCost: unitCost,
        totalValue: quantity * unitCost,
      },
    });
  }

  console.log('  ✅ Created stock records');
}

async function seedCheques() {
  console.log('📋 Seeding Cheques...');

  const bankAccounts = await prisma.bankAccount.findMany();
  const invoices = await prisma.invoice.findMany({
    where: { status: 'ISSUED' },
    take: 5,
  });

  for (let i = 0; i < 8; i++) {
    const bankAccount = bankAccounts[i % bankAccounts.length];
    const invoice = invoices[i % invoices.length];

    const chequeNo = `CH${DateTime.now().toFormat('yyyyMMdd')}-${String(i + 1).padStart(4, '0')}`;
    const chequeDate = thaiDate(Math.floor(Math.random() * 30));

    await prisma.cheque.create({
      data: {
        chequeNo,
        bankAccountId: bankAccount.id,
        amount: Math.floor(Math.random() * 50000) + 5000,
        chequeDate,
        payee: invoice?.customerId || null,
        status: ['ON_HAND', 'DEPOSITED', 'CLEARED', 'BOUNCED'][
          Math.floor(Math.random() * 4)
        ] as any,
        notes: 'เช็คสำหรับการทดสอบระบบ',
        invoiceId: invoice?.id,
      },
    });
  }

  console.log('  ✅ Created 8 cheques');
}

async function seedWithholdingTax() {
  console.log('🧾 Seeding Withholding Tax...');

  const invoices = await prisma.invoice.findMany({
    where: { status: 'ISSUED' },
    include: { customer: true },
    take: 10,
  });

  for (const invoice of invoices) {
    // PND53: Service withholding (3%)
    const whtAmount = Math.round(invoice.totalAmount * 0.03);

    await prisma.withholdingTax.create({
      data: {
        whtNo: `WHT${DateTime.now().toFormat('yyyyMM')}-${String(invoices.indexOf(invoice) + 1).padStart(4, '0')}`,
        whtType: 'PND53',
        paymentDate: thaiDate(-Math.floor(Math.random() * 30)),
        withholdingRate: 3,
        amount: invoice.totalAmount,
        whtAmount,
        payerType: 'COMPANY',
        payerName: 'บริษัท ตัวอย่าง จำกัด',
        payerTaxId: thaiTaxId(),
        recipientType: 'COMPANY',
        recipientName: invoice.customer.name,
        recipientTaxId: invoice.customer.taxId,
        paymentType: 'SERVICE',
        description: `หัก ณ ที่จ่ายจาก ${invoice.invoiceNo}`,
        status: 'FILED',
        notes: 'สำหรับการทดสอบระบบ',
      },
    });
  }

  console.log('  ✅ Created 10 WHT records (PND53)');
}

async function seedAPPayments() {
  console.log('💸 Seeding AP Payments...');

  const purchaseInvoices = await prisma.purchaseInvoice.findMany();
  const vendors = await prisma.vendor.findMany();
  const bankAccounts = await prisma.bankAccount.findMany();

  if (purchaseInvoices.length === 0) {
    console.log('  ⚠️ No purchase invoices found');
    return;
  }

  for (const purchaseInvoice of purchaseInvoices) {
    const bankAccount = bankAccounts[Math.floor(Math.random() * bankAccounts.length)];
    const paymentDate = thaiDate(Math.floor(Math.random() * 60));

    // Generate payment number
    const year = paymentDate.getFullYear();
    const month = String(paymentDate.getMonth() + 1).padStart(2, '0');
    const seq = String(Math.floor(Math.random() * 9000) + 1000);

    const payment = await prisma.payment.create({
      data: {
        paymentNo: `PAY${year}${month}-${seq}`,
        paymentDate,
        vendorId: purchaseInvoice.vendorId,
        paymentMethod: ['CASH', 'TRANSFER', 'CHEQUE'][Math.floor(Math.random() * 3)] as any,
        bankAccountId: bankAccount?.id,
        amount: purchaseInvoice.totalAmount * 0.5, // Pay 50%
        whtAmount: 0,
        unallocated: 0,
        status: 'POSTED',
        notes: 'การชำระเงินสำหรับใบซื้อ',
        isActive: true,
      },
    });

    // Create allocation
    await prisma.paymentAllocation.create({
      data: {
        paymentId: payment.id,
        invoiceId: purchaseInvoice.id,
        amount: payment.amount,
        whtRate: 0,
        whtAmount: 0,
      },
    });

    // Update purchase invoice paid amount
    await prisma.purchaseInvoice.update({
      where: { id: purchaseInvoice.id },
      data: {
        paidAmount: { increment: payment.amount },
      },
    });

    console.log(
      `  ✅ Payment ${payment.paymentNo} for ${purchaseInvoice.invoiceNo}: ${payment.amount / 100} THB`
    );
  }

  console.log('  ✅ Created AP payments');
}

async function main() {
  console.log('🌱 Starting Comprehensive Data Seeding...\n');
  console.log('═'.repeat(80));

  try {
    await seedBankAccounts();
    await seedQuotations();
    await seedInstallments();
    await seedFixedAssets();
    await seedEmployees();
    await seedPettyCash();
    await seedStock();
    await seedCheques();
    await seedWithholdingTax();
    await seedAPPayments();

    console.log('\n' + '═'.repeat(80));
    console.log('\n✅ Seeding Complete!');
    console.log('\n📊 Summary:');
    console.log('  - Bank Accounts: 4');
    console.log('  - Quotations: 15');
    console.log('  - Installment Payments: Multiple for 5 invoices');
    console.log('  - Fixed Assets: 20');
    console.log('  - Employees: 12');
    console.log('  - Petty Cash Funds: 4');
    console.log('  - Stock Records: Created');
    console.log('  - Cheques: 8');
    console.log('  - Withholding Tax: 10 (PND53)');
    console.log('  - AP Payments: Created');

    console.log('\n🎉 All test data seeded successfully!');
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error:', error);
    process.exit(1);
  });
