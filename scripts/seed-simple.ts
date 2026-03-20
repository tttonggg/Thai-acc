/**
 * SIMPLE SEED DATA FOR TESTING
 *
 * Creates test data for empty modules without external dependencies
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Helper to generate dates
function addDays(days: number): Date {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date
}

async function seedBankAccounts() {
  console.log('🏦 Seeding Bank Accounts...')

  const banks = [
    { code: 'BBL', name: 'ธนาคารกรุงเทพ', accountNo: '1234567890' },
    { code: 'KTB', name: 'ธนาคารกรุงไทย', accountNo: '2345678901' },
    { code: 'SCB', name: 'ธนาคารไทยพาณิชย์', accountNo: '3456789012' },
    { code: 'KBANK', name: 'ธนาคารกสิกรไทย', accountNo: '4567890123' },
  ]

  for (const bank of banks) {
    await prisma.bankAccount.upsert({
      where: { code: `${bank.code}-001` },
      update: {},
      create: {
        code: `${bank.code}-001`,
        accountName: `บัญชีออมทรัพย์ ${bank.name}`,
        accountNumber: bank.accountNo,
        bankName: bank.name,
        branchName: 'สาขาหลัก',
        glAccountId: '',
        isActive: true,
      }
    })
  }

  console.log('  ✅ Created 4 bank accounts')
}

async function seedInstallmentPayments() {
  console.log('💳 Seeding Installment Payments...')

  // Find unpaid/partial invoices
  const invoices = await prisma.invoice.findMany({
    where: {
      status: { in: ['ISSUED', 'PARTIAL'] }
    },
    take: 5
  })

  // Filter for invoices with remaining balance
  const unpaidInvoices = invoices.filter(inv => inv.totalAmount > inv.paidAmount)

  console.log(`  Found ${unpaidInvoices.length} invoices for installment payments`)

  for (const invoice of unpaidInvoices) {
    // Create 2-3 installment receipts
    const numInstallments = Math.floor(Math.random() * 2) + 2
    const installmentAmount = Math.floor((invoice.totalAmount - invoice.paidAmount) / numInstallments)
    let currentPaid = invoice.paidAmount

    for (let i = 0; i < numInstallments; i++) {
      const receiptDate = addDays(i * 30)
      const year = receiptDate.getFullYear()
      const month = String(receiptDate.getMonth() + 1).padStart(2, '0')

      // Get last receipt number for this month
      const lastReceipt = await prisma.receipt.findFirst({
        where: {
          receiptNo: {
            startsWith: `RC${year}${month}`
          }
        },
        orderBy: { receiptNo: 'desc' }
      })

      const lastSeq = lastReceipt ? parseInt(lastReceipt.receiptNo.split('-')[1]) : 0
      const seq = String(lastSeq + 1 + i).padStart(4, '0')

      // Last installment pays remaining balance
      const amount = (i === numInstallments - 1)
        ? invoice.totalAmount - currentPaid
        : Math.min(installmentAmount, invoice.totalAmount - currentPaid)

      if (amount <= 0) break

      const receipt = await prisma.receipt.create({
        data: {
          receiptNo: `RC${year}${month}-${seq}`,
          receiptDate,
          customerId: invoice.customerId,
          paymentMethod: 'TRANSFER',
          amount,
          whtAmount: 0,
          unallocated: 0,
          status: 'POSTED',
          isActive: true,
        }
      })

      await prisma.receiptAllocation.create({
        data: {
          receiptId: receipt.id,
          invoiceId: invoice.id,
          amount,
          whtRate: 0,
          whtAmount: 0
        }
      })

      currentPaid += amount
      console.log(`  ✅ Installment ${i + 1}/${numInstallments} for ${invoice.invoiceNo}: ${amount / 100} THB`)
    }

    // Update invoice
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        paidAmount: currentPaid,
        status: currentPaid >= invoice.totalAmount ? 'PAID' : 'PARTIAL'
      }
    })
  }
}

async function main() {
  console.log('🌱 Starting Simple Data Seeding...\n')

  try {
    await seedBankAccounts()
    await seedInstallmentPayments()

    console.log('\n✅ Seeding Complete!')
    console.log('\n📊 Summary:')
    console.log('  - Bank Accounts: 4')
    console.log('  - Installment Receipts: Created for 5+ invoices')

    // Show payment status summary
    const invoiceStats = await prisma.$queryRaw`
      SELECT
        'FULLY PAID' as status,
        COUNT(*) as count
      FROM Invoice
      WHERE paidAmount >= totalAmount AND status != 'CANCELLED'
      UNION ALL
      SELECT
        'PARTIALLY PAID',
        COUNT(*)
      FROM Invoice
      WHERE paidAmount > 0 AND paidAmount < totalAmount
      UNION ALL
      SELECT
        'UNPAID',
        COUNT(*)
      FROM Invoice
      WHERE paidAmount = 0 AND status NOT IN ('CANCELLED', 'DRAFT')
    `

    console.log('\n📈 Updated Invoice Payment Status:')
    for (const stat of invoiceStats as any[]) {
      console.log(`  - ${stat.status}: ${stat.count}`)
    }

  } catch (error) {
    console.error('\n❌ Seeding failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .then(() => {
    console.log('\n✨ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Error:', error)
    process.exit(1)
  })
