/**
 * COMPREHENSIVE TEST DATA SEED SCRIPT
 *
 * DATA FLOW RULE (CRITICAL):
 * ==========================
 * 1. USER INPUT: User enters Baht (e.g., 100.50)
 * 2. DATABASE: Store as Satang Int (100.50 × 100 = 10050)
 * 3. DISPLAY: Convert back to Baht (10050 ÷ 100 = 100.50)
 *
 * EXAMPLE:
 * - User types: 100.50 Baht
 * - Form onChange: parseFloat("100.50") × 100 = 10050
 * - Database stores: 10050 (Int)
 * - Display shows: 10050 ÷ 100 = 100.50 Baht
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Test values in BAHT (what user sees/enters)
const TEST_DATA = {
  invoices: [
    { no: 'INV-001', amount: 10000.50, vat: 700.04, total: 10700.54, paid: 5000.00 },
    { no: 'INV-002', amount: 25000.00, vat: 1750.00, total: 26750.00, paid: 0 },
    { no: 'INV-003', amount: 5500.25, vat: 385.02, total: 5885.27, paid: 5885.27 },
  ],
  receipts: [
    { no: 'RC-001', amount: 5000.00, wht: 0 },
    { no: 'RC-002', amount: 10700.54, wht: 150 },
    { no: 'RC-003', amount: 15000.00, wht: 0 },
  ],
  payments: [
    { no: 'PAY-001', amount: 10000.00, wht: 50 },
    { no: 'PAY-002', amount: 20000.00, wht: 0 },
  ],
  purchases: [
    { no: 'PO-001', amount: 5000.00, vat: 350.00, total: 5350.00, paid: 2000.00 },
    { no: 'PO-002', amount: 15000.00, vat: 1050.00, total: 16050.00, paid: 0 },
  ],
}

/**
 * Convert Baht to Satang for storage
 * @param baht - Amount in Baht (what user enters)
 * @returns Satang value for database
 */
function toSatang(baht: number): number {
  return Math.round(baht * 100)
}

/**
 * Convert Satang to Baht for display
 * @param satang - Amount from database
 * @returns Baht value for display
 */
function toBaht(satang: number): number {
  return satang / 100
}

async function clearAllData() {
  console.log('🧹 Clearing all data...')

  // Delete all records that reference JournalEntry FIRST
  await prisma.invoiceLine.deleteMany({})
  await prisma.invoice.deleteMany({})
  await prisma.receiptAllocation.deleteMany({})
  await prisma.receipt.deleteMany({})
  await prisma.paymentAllocation.deleteMany({})
  await prisma.payment.deleteMany({})
  await prisma.purchaseInvoice.deleteMany({})
  await prisma.creditNote.deleteMany({})
  await prisma.debitNote.deleteMany({})
  await prisma.cheque.deleteMany({})
  await prisma.pettyCashVoucher.deleteMany({})
  await prisma.payrollRun.deleteMany({})
  await prisma.depreciationSchedule.deleteMany({})
  await prisma.stockTake.deleteMany({})
  await prisma.currencyGainLoss.deleteMany({})
  await prisma.consolidationAdjustment.deleteMany({})

  // Now safe to delete journal entries
  await prisma.journalLine.deleteMany({})
  await prisma.journalEntry.deleteMany({})

  // Delete customers and vendors last
  await prisma.customer.deleteMany({})
  await prisma.vendor.deleteMany({})

  console.log('✅ All data cleared')
}

async function seedTestData() {
  console.log('🌱 Seeding test data with KNOWN VALUES for verification...')

  // Create Customer
  const customer = await prisma.customer.create({
    data: {
      code: 'CUST-001',
      name: 'บริษัท ทดสอบ จำกัด',
      taxId: '1234567890123',
      creditLimit: toSatang(100000), // 100,000 Baht → 10,000,000 Satang
    },
  })
  console.log(`✅ Customer created: ${customer.name}`)

  // Create Vendor
  const vendor = await prisma.vendor.create({
    data: {
      code: 'VEND-001',
      name: 'บริษัท ผู้ขายทดสอบ จำกัด',
      taxId: '9876543210123',
    },
  })
  console.log(`✅ Vendor created: ${vendor.name}`)

  // Create Invoices with KNOWN values (paidAmount will be calculated from allocations)
  console.log('\n📄 Creating INVOICES (User sees Baht → DB stores Satang):')
  const createdInvoices: any[] = []
  for (const inv of TEST_DATA.invoices) {
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo: inv.no,
        invoiceDate: new Date('2025-01-15'),
        customerId: customer.id,
        subtotal: toSatang(inv.amount),      // Baht → Satang
        vatAmount: toSatang(inv.vat),
        totalAmount: toSatang(inv.total),
        paidAmount: 0,  // Will be updated from allocations
        status: 'ISSUED',  // Will be updated from allocations
      },
    })
    createdInvoices.push(invoice)
    console.log(`  ${inv.no}: User sees ${inv.total} → DB stores ${invoice.totalAmount} (Satang) → Display shows ${toBaht(invoice.totalAmount)} (Baht)`)

    // Create line item
    await prisma.invoiceLine.create({
      data: {
        invoiceId: invoice.id,
        lineNo: 1,
        description: 'สินค้าทดสอบ',
        quantity: 1,
        unit: 'ชิ้น',
        unitPrice: toSatang(inv.amount),
        amount: toSatang(inv.amount),
        vatAmount: toSatang(inv.vat),
      },
    })
  }

  // Create Receipts with KNOWN values and allocations
  console.log('\n💰 Creating RECEIPTS with allocations:')
  const createdReceipts: any[] = []
  for (const rc of TEST_DATA.receipts) {
    const receipt = await prisma.receipt.create({
      data: {
        receiptNo: rc.no,
        receiptDate: new Date('2025-01-20'),
        customerId: customer.id,
        amount: toSatang(rc.amount),
        whtAmount: toSatang(rc.wht),
        status: 'POSTED',
        paymentMethod: 'TRANSFER',
      },
    })
    createdReceipts.push(receipt)
    console.log(`  ${rc.no}: User sees ${rc.amount} → DB stores ${receipt.amount} (Satang) → Display shows ${toBaht(receipt.amount)} (Baht)`)
  }

  // Allocate receipts to invoices
  console.log('\n🔗 Allocating receipts to invoices:')
  // RC-001 (5000) → INV-001 (paying 5000 of 10700.54)
  await prisma.receiptAllocation.create({
    data: {
      receiptId: createdReceipts[0].id,
      invoiceId: createdInvoices[0].id,
      amount: toSatang(5000),
    },
  })
  console.log(`  RC-001 (5000) → INV-001: allocated 5000`)

  // RC-002 (10700.54) → INV-002 (partial payment)
  await prisma.receiptAllocation.create({
    data: {
      receiptId: createdReceipts[1].id,
      invoiceId: createdInvoices[1].id,
      amount: toSatang(10700.54),
    },
  })
  console.log(`  RC-002 (10700.54) → INV-002: allocated 10700.54`)

  // RC-003 (15000) → split between INV-002 remaining and INV-003
  // INV-002 has 26750 total, 10700.54 already paid, so 16049.46 remaining
  // Allocate 5700.54 to INV-001 (to complete it) and 9299.46 to INV-002
  await prisma.receiptAllocation.create({
    data: {
      receiptId: createdReceipts[2].id,
      invoiceId: createdInvoices[0].id,
      amount: toSatang(5700.54),
    },
  })
  await prisma.receiptAllocation.create({
    data: {
      receiptId: createdReceipts[2].id,
      invoiceId: createdInvoices[2].id,
      amount: toSatang(5885.27),
    },
  })
  await prisma.receiptAllocation.create({
    data: {
      receiptId: createdReceipts[2].id,
      invoiceId: createdInvoices[1].id,
      amount: toSatang(3414.19),
    },
  })
  console.log(`  RC-003 (15000) → INV-001: 5700.54, INV-003: 5885.27, INV-002: 3414.19`)

  // Update invoice paidAmount and status based on allocations
  console.log('\n📊 Updating invoice paid amounts and status:')
  for (const invoice of createdInvoices) {
    const allocations = await prisma.receiptAllocation.findMany({
      where: { invoiceId: invoice.id },
    })
    const totalPaid = allocations.reduce((sum, a) => sum + a.amount, 0)

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        paidAmount: totalPaid,
        status: totalPaid >= invoice.totalAmount ? 'PAID' : totalPaid > 0 ? 'PARTIAL' : 'ISSUED',
      },
    })

    console.log(`  ${invoice.invoiceNo}: paid ${toBaht(totalPaid)} of ${toBaht(invoice.totalAmount)} → ${totalPaid >= invoice.totalAmount ? 'PAID' : totalPaid > 0 ? 'PARTIAL' : 'ISSUED'}`)
  }

  // Create Payments
  console.log('\n💳 Creating PAYMENTS:')
  for (const pay of TEST_DATA.payments) {
    const payment = await prisma.payment.create({
      data: {
        paymentNo: pay.no,
        paymentDate: new Date('2025-01-22'),
        vendorId: vendor.id,
        amount: toSatang(pay.amount),
        whtAmount: toSatang(pay.wht),
        status: 'POSTED',
        paymentMethod: 'TRANSFER',
      },
    })
    console.log(`  ${pay.no}: User sees ${pay.amount} → DB stores ${payment.amount} (Satang) → Display shows ${toBaht(payment.amount)} (Baht)`)
  }

  // Create Purchase Invoices
  console.log('\n📋 Creating PURCHASES:')
  for (const po of TEST_DATA.purchases) {
    const purchase = await prisma.purchaseInvoice.create({
      data: {
        invoiceNo: po.no,
        invoiceDate: new Date('2025-01-10'),
        vendorId: vendor.id,
        subtotal: toSatang(po.amount),
        vatAmount: toSatang(po.vat),
        totalAmount: toSatang(po.total),
        paidAmount: toSatang(po.paid),
        status: 'ISSUED',
        type: 'TAX_INVOICE',
      },
    })
    console.log(`  ${po.no}: User sees ${po.total} → DB stores ${purchase.totalAmount} (Satang) → Display shows ${toBaht(purchase.totalAmount)} (Baht)`)
  }

  console.log('\n✅ Test data seeded successfully!')
  console.log('\n📊 VERIFICATION CHECKLIST:')
  console.log('1. Open Invoice list → Should show ฿10,700.54 (not 1,070,054)')
  console.log('2. Open Receipt list → Should show ฿10,700.54 (not 1,070,054)')
  console.log('3. Create new Invoice for ฿1,234.56 → DB should store 123456')
  console.log('4. Create new Receipt for ฿999.99 → DB should store 99999')
  console.log('5. Dashboard AR/AP → Should show correct Baht values')
}

async function main() {
  try {
    await clearAllData()
    await seedTestData()

    console.log('\n✨ All done! You can now test UI with known values.')
    console.log('🔍 To verify: Check database directly with sqlite3 prisma/dev.db')
  } catch (error) {
    console.error('❌ Error seeding data:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
