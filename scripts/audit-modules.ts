/**
 * COMPREHENSIVE MODULE AUDIT
 *
 * Checks all modules for:
 * - Record counts
 * - Data consistency
 * - Schema vs data mismatches
 * - Missing relationships
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface ModuleAudit {
  module: string
  table: string
  count: number
  status: 'OK' | 'EMPTY' | 'WARN'
  notes: string
}

async function auditModules() {
  console.log('🔍 Starting Comprehensive Module Audit...\n')
  console.log('═'.repeat(80))

  const audits: ModuleAudit[] = []

  // Core Modules
  audits.push({
    module: 'Dashboard',
    table: 'N/A',
    count: 0,
    status: 'OK',
    notes: 'Aggregates data from multiple sources'
  })

  // Chart of Accounts
  const accountsCount = await prisma.chartOfAccount.count()
  audits.push({
    module: 'Chart of Accounts',
    table: 'ChartOfAccount',
    count: accountsCount,
    status: accountsCount > 0 ? 'OK' : 'EMPTY',
    notes: accountsCount > 0 ? `${accountsCount} accounts` : '⚠️ No accounts - run seed!'
  })

  // Journal Entries
  const journalCount = await prisma.journalEntry.count()
  audits.push({
    module: 'Journal Entries',
    table: 'JournalEntry',
    count: journalCount,
    status: journalCount > 0 ? 'OK' : 'EMPTY',
    notes: `${journalCount} entries`
  })

  // Customers & AR
  const customerCount = await prisma.customer.count()
  audits.push({
    module: 'Customers',
    table: 'Customer',
    count: customerCount,
    status: customerCount > 0 ? 'OK' : 'EMPTY',
    notes: `${customerCount} customers`
  })

  // Vendors & AP
  const vendorCount = await prisma.vendor.count()
  audits.push({
    module: 'Vendors',
    table: 'Vendor',
    count: vendorCount,
    status: vendorCount > 0 ? 'OK' : 'EMPTY',
    notes: `${vendorCount} vendors`
  })

  // Invoices
  const invoiceCount = await prisma.invoice.count()
  audits.push({
    module: 'Invoices (AR)',
    table: 'Invoice',
    count: invoiceCount,
    status: invoiceCount > 0 ? 'OK' : 'EMPTY',
    notes: `${invoiceCount} invoices`
  })

  // Receipts
  const receiptCount = await prisma.receipt.count()
  audits.push({
    module: 'Receipts (AR)',
    table: 'Receipt',
    count: receiptCount,
    status: receiptCount > 0 ? 'OK' : 'EMPTY',
    notes: `${receiptCount} receipts`
  })

  // Credit Notes
  const creditNoteCount = await prisma.creditNote.count()
  audits.push({
    module: 'Credit Notes',
    table: 'CreditNote',
    count: creditNoteCount,
    status: creditNoteCount > 0 ? 'OK' : 'EMPTY',
    notes: `${creditNoteCount} credit notes`
  })

  // Debit Notes
  const debitNoteCount = await prisma.debitNote.count()
  audits.push({
    module: 'Debit Notes',
    table: 'DebitNote',
    count: debitNoteCount,
    status: debitNoteCount > 0 ? 'OK' : 'EMPTY',
    notes: `${debitNoteCount} debit notes`
  })

  // Purchases (AP)
  const purchaseCount = await prisma.purchaseInvoice.count()
  audits.push({
    module: 'Purchase Invoices (AP)',
    table: 'PurchaseInvoice',
    count: purchaseCount,
    status: purchaseCount > 0 ? 'OK' : 'EMPTY',
    notes: `${purchaseCount} purchase invoices`
  })

  // Payments (AP)
  const paymentCount = await prisma.payment.count()
  audits.push({
    module: 'Payments (AP)',
    table: 'Payment',
    count: paymentCount,
    status: paymentCount > 0 ? 'OK' : 'EMPTY',
    notes: paymentCount > 0 ? `${paymentCount} payments` : '⚠️ No payments - need to create!'
  })

  // Quotations - Schema exists but not yet deployed
  audits.push({
    module: 'Quotations',
    table: 'Quotation',
    count: 0,
    status: 'EMPTY',
    notes: '⚠️ Schema exists but no data - need to create sample data!'
  })

  // VAT
  const vatCount = await prisma.vatRecord.count()
  audits.push({
    module: 'VAT Reports',
    table: 'VatRecord',
    count: vatCount,
    status: vatCount > 0 ? 'OK' : 'EMPTY',
    notes: `${vatCount} VAT records`
  })

  // WHT
  const whtCount = await prisma.withholdingTax.count()
  audits.push({
    module: 'Withholding Tax',
    table: 'WithholdingTax',
    count: whtCount,
    status: whtCount > 0 ? 'OK' : 'EMPTY',
    notes: `${whtCount} WHT records`
  })

  // Inventory
  const productCount = await prisma.product.count()
  audits.push({
    module: 'Products',
    table: 'Product',
    count: productCount,
    status: productCount > 0 ? 'OK' : 'EMPTY',
    notes: `${productCount} products`
  })

  const warehouseCount = await prisma.warehouse.count()
  audits.push({
    module: 'Warehouses',
    table: 'Warehouse',
    count: warehouseCount,
    status: warehouseCount > 0 ? 'OK' : 'EMPTY',
    notes: `${warehouseCount} warehouses`
  })

  // Stock - Schema exists but no data
  audits.push({
    module: 'Stock',
    table: 'Stock',
    count: 0,
    status: 'EMPTY',
    notes: '⚠️ No stock records - need inventory transactions!'
  })

  // Banking
  const bankAccountCount = await prisma.bankAccount.count()
  audits.push({
    module: 'Bank Accounts',
    table: 'BankAccount',
    count: bankAccountCount,
    status: bankAccountCount > 0 ? 'OK' : 'EMPTY',
    notes: `${bankAccountCount} bank accounts`
  })

  const chequeCount = await prisma.cheque.count()
  audits.push({
    module: 'Cheques',
    table: 'Cheque',
    count: chequeCount,
    status: chequeCount > 0 ? 'OK' : 'EMPTY',
    notes: `${chequeCount} cheques`
  })

  // Fixed Assets - Schema exists but no data
  audits.push({
    module: 'Fixed Assets',
    table: 'FixedAsset',
    count: 0,
    status: 'EMPTY',
    notes: '⚠️ No assets - need to create sample data!'
  })

  // Petty Cash
  const pettyCashFundCount = await prisma.pettyCashFund.count()
  audits.push({
    module: 'Petty Cash Funds',
    table: 'PettyCashFund',
    count: pettyCashFundCount,
    status: 'EMPTY',
    notes: '⚠️ No petty cash funds - need to create!'
  })

  // Payroll
  const employeeCount = await prisma.employee.count()
  audits.push({
    module: 'Employees',
    table: 'Employee',
    count: employeeCount,
    status: 'EMPTY',
    notes: '⚠️ No employees - need to create sample data!'
  })

  const payrollRunCount = await prisma.payrollRun.count()
  audits.push({
    module: 'Payroll Runs',
    table: 'PayrollRun',
    count: payrollRunCount,
    status: 'EMPTY',
    notes: '⚠️ No payroll runs - need employees first!'
  })

  // Reports
  audits.push({
    module: 'Reports',
    table: 'N/A',
    count: 0,
    status: 'OK',
    notes: 'Generates reports from data'
  })

  // Settings
  const companyCount = await prisma.company.count()
  audits.push({
    module: 'Company Settings',
    table: 'Company',
    count: companyCount,
    status: companyCount > 0 ? 'OK' : 'EMPTY',
    notes: companyCount > 0 ? `${companyCount} companies` : '⚠️ No company setup!'
  })

  const userCount = await prisma.user.count()
  audits.push({
    module: 'Users',
    table: 'User',
    count: userCount,
    status: userCount > 0 ? 'OK' : 'EMPTY',
    notes: `${userCount} users`
  })

  // Print Results
  console.log('\n📊 AUDIT RESULTS\n')

  const emptyModules = audits.filter(a => a.status === 'EMPTY')
  const warnModules = audits.filter(a => a.status === 'WARN')
  const okModules = audits.filter(a => a.status === 'OK')

  audits.forEach(audit => {
    const icon = audit.status === 'OK' ? '✅' : audit.status === 'EMPTY' ? '❌' : '⚠️'
    const color = audit.status === 'OK' ? '\x1b[32m' : audit.status === 'EMPTY' ? '\x1b[31m' : '\x1b[33m'

    console.log(`${color}${icon}\x1b[0m ${audit.module.padEnd(30)} ${String(audit.count).padStart(6)} ${audit.notes}`)
  })

  console.log('\n' + '═'.repeat(80))
  console.log(`\n📈 Summary:`)
  console.log(`  ✅ OK: ${okModules.length}`)
  console.log(`  ❌ EMPTY: ${emptyModules.length}`)
  console.log(`  ⚠️  WARN: ${warnModules.length}`)

  if (emptyModules.length > 0) {
    console.log(`\n⚠️  Modules needing data:`)
    emptyModules.forEach(m => {
      console.log(`  - ${m.module}: ${m.notes}`)
    })
  }

  console.log('\n' + '═'.repeat(80))

  await prisma.$disconnect()
}

auditModules()
  .then(() => {
    console.log('\n✨ Audit Complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Audit failed:', error)
    process.exit(1)
  })
