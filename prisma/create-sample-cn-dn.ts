import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function createSampleData() {
  console.log('Creating sample Credit Notes and Debit Notes...');

  // Get a customer and vendor
  const customers = await db.customer.findMany({ take: 1 });
  const vendors = await db.vendor.findMany({ take: 1 });

  if (customers.length === 0) {
    console.log('❌ No customers found. Please create customers first.');
    return;
  }

  if (vendors.length === 0) {
    console.log('❌ No vendors found. Please create vendors first.');
    return;
  }

  const customer = customers[0];
  const vendor = vendors[0];

  console.log(`Using customer: ${customer.name} (${customer.id})`);
  console.log(`Using vendor: ${vendor.name} (${vendor.id})`);

  // Create a sample Credit Note
  const creditNote = await db.creditNote.create({
    data: {
      creditNoteNo: 'CN-TEST-001',
      creditNoteDate: new Date(),
      customerId: customer.id,
      reason: 'RETURN',
      subtotal: 1000,
      vatRate: 7,
      vatAmount: 70,
      totalAmount: 1070,
      status: 'ISSUED',
      notes: 'Sample credit note for testing',
    },
  });

  console.log(`✅ Created Credit Note: ${creditNote.creditNoteNo}`);

  // Create a sample Debit Note
  const debitNote = await db.debitNote.create({
    data: {
      debitNoteNo: 'DN-TEST-001',
      debitNoteDate: new Date(),
      vendorId: vendor.id,
      reason: 'ADDITIONAL_CHARGES',
      subtotal: 500,
      vatRate: 7,
      vatAmount: 35,
      totalAmount: 535,
      status: 'ISSUED',
      notes: 'Sample debit note for testing',
    },
  });

  console.log(`✅ Created Debit Note: ${debitNote.debitNoteNo}`);

  // Create journal entries for them
  const settings = await db.systemSettings.findFirst();

  // Credit Note Journal Entry
  const cnJE = await db.journalEntry.create({
    data: {
      entryNo: 'JE-CN-TEST-001',
      date: new Date(),
      description: `ใบลดหนี้ CN-TEST-001 - ${customer.name}`,
      reference: 'CN-TEST-001',
      documentType: 'CREDIT_NOTE',
      documentId: creditNote.id,
      totalDebit: 1070,
      totalCredit: 1070,
      status: 'POSTED',
    },
  });

  await db.journalLine.createMany({
    data: [
      {
        journalEntryId: cnJE.id,
        lineNo: 1,
        accountId: settings?.salesReturnsAccountId || '4130',
        description: `คืนสินค้า/ลดหนี้ CN-TEST-001`,
        debit: 1000,
        credit: 0,
      },
      {
        journalEntryId: cnJE.id,
        lineNo: 2,
        accountId: settings?.vatOutputAccountId || '2132',
        description: `VAT ใบลดหนี้ CN-TEST-001`,
        debit: 70,
        credit: 0,
      },
      {
        journalEntryId: cnJE.id,
        lineNo: 3,
        accountId: settings?.arAccountId || '1121',
        description: `ลดหนี้ลูกค้า ${customer.name}`,
        debit: 0,
        credit: 1070,
      },
    ],
  });

  await db.creditNote.update({
    where: { id: creditNote.id },
    data: { journalEntryId: cnJE.id },
  });

  // Debit Note Journal Entry
  const dnJE = await db.journalEntry.create({
    data: {
      entryNo: 'JE-DN-TEST-001',
      date: new Date(),
      description: `ใบเพิ่มหนี้ DN-TEST-001 - ${vendor.name}`,
      reference: 'DN-TEST-001',
      documentType: 'DEBIT_NOTE',
      documentId: debitNote.id,
      totalDebit: 535,
      totalCredit: 535,
      status: 'POSTED',
    },
  });

  await db.journalLine.createMany({
    data: [
      {
        journalEntryId: dnJE.id,
        lineNo: 1,
        accountId: settings?.purchaseAccountId || '5110',
        description: `ค่าใช้จ่ายเพิ่มเติม DN-TEST-001`,
        debit: 500,
        credit: 0,
      },
      {
        journalEntryId: dnJE.id,
        lineNo: 2,
        accountId: settings?.vatInputAccountId || '1145',
        description: `VAT ใบเพิ่มหนี้ DN-TEST-001`,
        debit: 35,
        credit: 0,
      },
      {
        journalEntryId: dnJE.id,
        lineNo: 3,
        accountId: settings?.apAccountId || '2110',
        description: `เพิ่มหนี้ผู้ขาย ${vendor.name}`,
        debit: 0,
        credit: 535,
      },
    ],
  });

  await db.debitNote.update({
    where: { id: debitNote.id },
    data: { journalEntryId: dnJE.id },
  });

  console.log(`✅ Created journal entries for both CN and DN`);

  // Create VAT INPUT record for debit note
  await db.vatRecord.create({
    data: {
      type: 'INPUT',
      documentNo: 'DN-TEST-001',
      documentDate: new Date(),
      documentType: 'DEBIT_NOTE',
      referenceId: debitNote.id,
      vendorId: vendor.id,
      vendorName: vendor.name,
      vendorTaxId: vendor.taxId || '',
      description: `ใบเพิ่มหนี้จากผู้ขาย DN-TEST-001`,
      subtotal: 500,
      vatRate: 7,
      vatAmount: 35,
      totalAmount: 535,
      taxMonth: new Date().getMonth() + 1,
      taxYear: new Date().getFullYear(),
    },
  });

  console.log(`✅ Created VAT INPUT record for debit note`);

  await db.$disconnect();

  console.log('\n✅ Sample data created successfully!');
  console.log('📝 Credit Note: CN-TEST-001');
  console.log('📝 Debit Note: DN-TEST-001');
}

createSampleData().catch(console.error);
