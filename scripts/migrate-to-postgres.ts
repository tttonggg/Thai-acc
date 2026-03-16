#!/usr/bin/env bun
/**
 * Thai Accounting ERP - SQLite to PostgreSQL Migration Script
 * โปรแกรมบัญชีมาตรฐานไทย - สคริปต์ย้ายข้อมูลจาก SQLite ไป PostgreSQL
 * Version: 2.0 - Database Perfection Phase
 */

import { PrismaClient as PrismaSQLite } from '@prisma/client'
import { PrismaClient as PrismaPostgreSQL } from '@prisma/client'
import { createReadStream } from 'fs'
import { createInterface } from 'readline'

// ============================================
// Configuration
// ============================================
const BATCH_SIZE = 1000
const SQLITE_PATH = process.env.SQLITE_PATH || './prisma/dev.db'
const PG_URL = process.env.POSTGRES_URL || 'postgresql://thaiacc:password@localhost:5432/thai_accounting'

// ============================================
// Database Clients
// ============================================
const sqlite = new PrismaSQLite({
  datasources: {
    db: {
      url: `file:${SQLITE_PATH}`,
    },
  },
})

const postgres = new PrismaPostgreSQL({
  datasources: {
    db: {
      url: PG_URL,
    },
  },
})

// ============================================
// Migration Statistics
// ============================================
interface MigrationStats {
  table: string
  sourceCount: number
  targetCount: number
  duration: number
  errors: number
}

const stats: MigrationStats[] = []

// ============================================
// Helper Functions
// ============================================
function log(message: string, level: 'info' | 'warn' | 'error' = 'info') {
  const timestamp = new Date().toISOString()
  const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '✓'
  console.log(`[${timestamp}] ${prefix} ${message}`)
}

function logProgress(current: number, total: number, table: string) {
  const percentage = ((current / total) * 100).toFixed(1)
  process.stdout.write(`\r  ${table}: ${current}/${total} (${percentage}%)`)
}

async function countRows(tableName: string, client: any): Promise<number> {
  try {
    const result = await client.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${tableName}"`)
    return Number(result[0]?.count || 0)
  } catch (error) {
    return 0
  }
}

async function verifyMigration(tableName: string): Promise<boolean> {
  const sourceCount = await countRows(tableName, sqlite)
  const targetCount = await countRows(tableName, postgres)
  
  return sourceCount === targetCount
}

// ============================================
// Migration Functions by Table
// ============================================

async function migrateTable<T>(
  tableName: string,
  fetchFromSQLite: () => Promise<T[]>,
  insertToPostgres: (data: T[]) => Promise<any>
): Promise<MigrationStats> {
  const startTime = Date.now()
  log(`Starting migration: ${tableName}`)
  
  try {
    // Fetch data from SQLite
    const data = await fetchFromSQLite()
    const sourceCount = data.length
    
    if (sourceCount === 0) {
      log(`  No data to migrate for ${tableName}`)
      return {
        table: tableName,
        sourceCount: 0,
        targetCount: 0,
        duration: Date.now() - startTime,
        errors: 0,
      }
    }
    
    // Batch insert to PostgreSQL
    let insertedCount = 0
    let errorCount = 0
    
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      const batch = data.slice(i, i + BATCH_SIZE)
      logProgress(i + batch.length, data.length, tableName)
      
      try {
        await insertToPostgres(batch)
        insertedCount += batch.length
      } catch (error: any) {
        log(`\n  Error inserting batch ${i}: ${error.message}`, 'error')
        errorCount += batch.length
      }
    }
    
    process.stdout.write('\n')
    
    const duration = Date.now() - startTime
    log(`Completed ${tableName}: ${insertedCount} rows in ${duration}ms`)
    
    return {
      table: tableName,
      sourceCount,
      targetCount: insertedCount,
      duration,
      errors: errorCount,
    }
  } catch (error: any) {
    log(`Failed to migrate ${tableName}: ${error.message}`, 'error')
    return {
      table: tableName,
      sourceCount: 0,
      targetCount: 0,
      duration: Date.now() - startTime,
      errors: 1,
    }
  }
}

// ============================================
// Migration Definitions
// ============================================

async function migrateUsers() {
  return migrateTable(
    'User',
    async () => await sqlite.user.findMany(),
    async (data) => {
      await postgres.$executeRawUnsafe(`
        INSERT INTO "User" (id, email, password, name, role, "isActive", "lastLoginAt", "createdAt", "updatedAt")
        SELECT * FROM UNNEST(
          $1::uuid[], $2::varchar[], $3::varchar[], $4::varchar[], 
          $5::"UserRole"[], $6::boolean[], $7::timestamptz[], $8::timestamptz[], $9::timestamptz[]
        )
        ON CONFLICT (id) DO NOTHING
      `, 
      data.map(d => d.id),
      data.map(d => d.email),
      data.map(d => d.password),
      data.map(d => d.name),
      data.map(d => d.role),
      data.map(d => d.isActive),
      data.map(d => d.lastLoginAt),
      data.map(d => d.createdAt),
      data.map(d => d.updatedAt)
      )
    }
  )
}

async function migrateCompanies() {
  return migrateTable(
    'Company',
    async () => await sqlite.company.findMany(),
    async (data) => {
      for (const item of data) {
        await postgres.company.create({
          data: {
            ...item,
            id: item.id,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
          },
          skipDuplicates: true,
        })
      }
    }
  )
}

async function migrateSystemSettings() {
  return migrateTable(
    'SystemSettings',
    async () => await sqlite.systemSettings.findMany(),
    async (data) => {
      for (const item of data) {
        await postgres.systemSettings.create({
          data: {
            ...item,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
          },
          skipDuplicates: true,
        })
      }
    }
  )
}

async function migrateChartOfAccounts() {
  return migrateTable(
    'ChartOfAccount',
    async () => await sqlite.chartOfAccount.findMany(),
    async (data) => {
      for (const item of data) {
        await postgres.chartOfAccount.create({
          data: {
            id: item.id,
            code: item.code,
            name: item.name,
            nameEn: item.nameEn,
            type: item.type,
            level: item.level,
            parentId: item.parentId,
            isDetail: item.isDetail,
            isSystem: item.isSystem,
            isActive: item.isActive,
            notes: item.notes,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
          },
          skipDuplicates: true,
        })
      }
    }
  )
}

async function migrateCustomers() {
  return migrateTable(
    'Customer',
    async () => await sqlite.customer.findMany(),
    async (data) => {
      for (const item of data) {
        await postgres.customer.create({
          data: {
            id: item.id,
            code: item.code,
            name: item.name,
            nameEn: item.nameEn,
            taxId: item.taxId,
            branchCode: item.branchCode,
            address: item.address,
            subDistrict: item.subDistrict,
            district: item.district,
            province: item.province,
            postalCode: item.postalCode,
            phone: item.phone,
            fax: item.fax,
            email: item.email,
            website: item.website,
            contactName: item.contactName,
            contactPhone: item.contactPhone,
            creditLimit: item.creditLimit,
            creditDays: item.creditDays,
            isActive: item.isActive,
            deletedAt: item.deletedAt ? new Date(item.deletedAt) : null,
            deletedBy: item.deletedBy,
            notes: item.notes,
            externalRefId: item.externalRefId,
            metadata: item.metadata,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
          },
          skipDuplicates: true,
        })
      }
    }
  )
}

async function migrateVendors() {
  return migrateTable(
    'Vendor',
    async () => await sqlite.vendor.findMany(),
    async (data) => {
      for (const item of data) {
        await postgres.vendor.create({
          data: {
            ...item,
            deletedAt: item.deletedAt ? new Date(item.deletedAt) : null,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
          },
          skipDuplicates: true,
        })
      }
    }
  )
}

async function migrateProducts() {
  return migrateTable(
    'Product',
    async () => await sqlite.product.findMany(),
    async (data) => {
      for (const item of data) {
        await postgres.product.create({
          data: {
            ...item,
            deletedAt: item.deletedAt ? new Date(item.deletedAt) : null,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
          },
          skipDuplicates: true,
        })
      }
    }
  )
}

async function migrateJournalEntries() {
  return migrateTable(
    'JournalEntry',
    async () => await sqlite.journalEntry.findMany(),
    async (data) => {
      for (const item of data) {
        await postgres.journalEntry.create({
          data: {
            ...item,
            date: new Date(item.date),
            approvedAt: item.approvedAt ? new Date(item.approvedAt) : null,
            deletedAt: item.deletedAt ? new Date(item.deletedAt) : null,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
          },
          skipDuplicates: true,
        })
      }
    }
  )
}

async function migrateJournalLines() {
  return migrateTable(
    'JournalLine',
    async () => await sqlite.journalLine.findMany(),
    async (data) => {
      for (const item of data) {
        // Get entry date for partitioning
        const entry = await sqlite.journalEntry.findUnique({
          where: { id: item.entryId },
          select: { date: true }
        })
        
        await postgres.$executeRawUnsafe(`
          INSERT INTO "JournalLine" (
            id, "entryId", "lineNo", "accountId", description, 
            debit, credit, reference, "createdAt", "updatedAt", entry_date
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (id, entry_date) DO NOTHING
        `, 
        item.id, item.entryId, item.lineNo, item.accountId, item.description,
        item.debit, item.credit, item.reference, 
        new Date(item.createdAt), new Date(item.updatedAt),
        entry ? new Date(entry.date) : new Date()
        )
      }
    }
  )
}

async function migrateInvoices() {
  return migrateTable(
    'Invoice',
    async () => await sqlite.invoice.findMany(),
    async (data) => {
      for (const item of data) {
        // Calculate fiscal year
        const invoiceDate = new Date(item.invoiceDate)
        let fiscalYear = invoiceDate.getFullYear()
        if (invoiceDate.getMonth() >= 9) { // October onwards
          fiscalYear++
        }
        
        await postgres.invoice.create({
          data: {
            ...item,
            fiscalYear,
            invoiceDate: new Date(item.invoiceDate),
            dueDate: item.dueDate ? new Date(item.dueDate) : null,
            deletedAt: item.deletedAt ? new Date(item.deletedAt) : null,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
          },
          skipDuplicates: true,
        })
      }
    }
  )
}

async function migrateInvoiceLines() {
  return migrateTable(
    'InvoiceLine',
    async () => await sqlite.invoiceLine.findMany(),
    async (data) => {
      for (const item of data) {
        await postgres.invoiceLine.create({
          data: {
            ...item,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
          },
          skipDuplicates: true,
        })
      }
    }
  )
}

async function migrateReceipts() {
  return migrateTable(
    'Receipt',
    async () => await sqlite.receipt.findMany(),
    async (data) => {
      for (const item of data) {
        await postgres.receipt.create({
          data: {
            ...item,
            receiptDate: new Date(item.receiptDate),
            chequeDate: item.chequeDate ? new Date(item.chequeDate) : null,
            deletedAt: item.deletedAt ? new Date(item.deletedAt) : null,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
          },
          skipDuplicates: true,
        })
      }
    }
  )
}

async function migratePurchaseInvoices() {
  return migrateTable(
    'PurchaseInvoice',
    async () => await sqlite.purchaseInvoice.findMany(),
    async (data) => {
      for (const item of data) {
        await postgres.purchaseInvoice.create({
          data: {
            ...item,
            invoiceDate: new Date(item.invoiceDate),
            dueDate: item.dueDate ? new Date(item.dueDate) : null,
            deletedAt: item.deletedAt ? new Date(item.deletedAt) : null,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
          },
          skipDuplicates: true,
        })
      }
    }
  )
}

async function migratePayments() {
  return migrateTable(
    'Payment',
    async () => await sqlite.payment.findMany(),
    async (data) => {
      for (const item of data) {
        await postgres.payment.create({
          data: {
            ...item,
            paymentDate: new Date(item.paymentDate),
            chequeDate: item.chequeDate ? new Date(item.chequeDate) : null,
            deletedAt: item.deletedAt ? new Date(item.deletedAt) : null,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
          },
          skipDuplicates: true,
        })
      }
    }
  )
}

async function migrateAssets() {
  return migrateTable(
    'Asset',
    async () => await sqlite.asset.findMany(),
    async (data) => {
      for (const item of data) {
        await postgres.asset.create({
          data: {
            ...item,
            purchaseDate: new Date(item.purchaseDate),
            deletedAt: item.deletedAt ? new Date(item.deletedAt) : null,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
          },
          skipDuplicates: true,
        })
      }
    }
  )
}

async function migrateEmployees() {
  return migrateTable(
    'Employee',
    async () => await sqlite.employee.findMany(),
    async (data) => {
      for (const item of data) {
        await postgres.employee.create({
          data: {
            ...item,
            hireDate: new Date(item.hireDate),
            deletedAt: item.deletedAt ? new Date(item.deletedAt) : null,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
          },
          skipDuplicates: true,
        })
      }
    }
  )
}

async function migratePayrollRuns() {
  return migrateTable(
    'PayrollRun',
    async () => await sqlite.payrollRun.findMany(),
    async (data) => {
      for (const item of data) {
        await postgres.payrollRun.create({
          data: {
            ...item,
            paymentDate: new Date(item.paymentDate),
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
          },
          skipDuplicates: true,
        })
      }
    }
  )
}

async function migrateWarehouses() {
  return migrateTable(
    'Warehouse',
    async () => await sqlite.warehouse.findMany(),
    async (data) => {
      for (const item of data) {
        await postgres.warehouse.create({
          data: {
            ...item,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
          },
          skipDuplicates: true,
        })
      }
    }
  )
}

async function migrateBankAccounts() {
  return migrateTable(
    'BankAccount',
    async () => await sqlite.bankAccount.findMany(),
    async (data) => {
      for (const item of data) {
        await postgres.bankAccount.create({
          data: {
            ...item,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
          },
          skipDuplicates: true,
        })
      }
    }
  )
}

async function migrateDocumentNumbers() {
  return migrateTable(
    'DocumentNumber',
    async () => await sqlite.documentNumber.findMany(),
    async (data) => {
      for (const item of data) {
        await postgres.documentNumber.create({
          data: {
            ...item,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
          },
          skipDuplicates: true,
        })
      }
    }
  )
}

async function migrateInventoryConfig() {
  return migrateTable(
    'InventoryConfig',
    async () => await sqlite.inventoryConfig.findMany(),
    async (data) => {
      for (const item of data) {
        await postgres.inventoryConfig.create({
          data: {
            ...item,
            updatedAt: new Date(item.updatedAt),
          },
          skipDuplicates: true,
        })
      }
    }
  )
}

// ============================================
// Main Migration Function
// ============================================

async function runMigration() {
  const startTime = Date.now()
  log('Starting SQLite to PostgreSQL migration')
  log('=' .repeat(60))
  
  // Test connections
  log('Testing database connections...')
  try {
    await sqlite.$queryRaw`SELECT 1`
    log('SQLite connection: OK')
  } catch (error) {
    log('SQLite connection failed', 'error')
    process.exit(1)
  }
  
  try {
    await postgres.$queryRaw`SELECT 1`
    log('PostgreSQL connection: OK')
  } catch (error: any) {
    log(`PostgreSQL connection failed: ${error.message}`, 'error')
    process.exit(1)
  }
  
  log('')
  log('Beginning data migration...')
  log('=' .repeat(60))
  
  // Migration order matters due to foreign key constraints
  const migrations = [
    migrateUsers,
    migrateCompanies,
    migrateSystemSettings,
    migrateChartOfAccounts,
    migrateCustomers,
    migrateVendors,
    migrateProducts,
    migrateWarehouses,
    migrateBankAccounts,
    migrateEmployees,
    migrateDocumentNumbers,
    migrateInventoryConfig,
    migrateJournalEntries,
    migrateJournalLines,
    migrateInvoices,
    migrateInvoiceLines,
    migrateReceipts,
    migratePurchaseInvoices,
    migratePayments,
    migrateAssets,
    migratePayrollRuns,
  ]
  
  for (const migration of migrations) {
    const stat = await migration()
    stats.push(stat)
  }
  
  // Print summary
  const totalTime = Date.now() - startTime
  log('')
  log('=' .repeat(60))
  log('Migration Summary')
  log('=' .repeat(60))
  
  let totalSourceRows = 0
  let totalTargetRows = 0
  let totalErrors = 0
  
  for (const stat of stats) {
    const status = stat.errors === 0 ? '✓' : '⚠️'
    log(`${status} ${stat.table.padEnd(30)} ${stat.targetCount}/${stat.sourceCount} rows (${stat.duration}ms)`)
    totalSourceRows += stat.sourceCount
    totalTargetRows += stat.targetCount
    totalErrors += stat.errors
  }
  
  log('=' .repeat(60))
  log(`Total: ${totalTargetRows}/${totalSourceRows} rows migrated in ${totalTime}ms`)
  
  if (totalErrors > 0) {
    log(`Errors: ${totalErrors}`, 'warn')
  }
  
  // Verify critical tables
  log('')
  log('Verifying migration...')
  const criticalTables = ['User', 'ChartOfAccount', 'Customer', 'Vendor', 'Invoice', 'JournalEntry']
  let allVerified = true
  
  for (const table of criticalTables) {
    const verified = await verifyMigration(table)
    const status = verified ? '✓' : '❌'
    log(`${status} ${table}: ${verified ? 'VERIFIED' : 'MISMATCH'}`)
    if (!verified) allVerified = false
  }
  
  // Close connections
  await sqlite.$disconnect()
  await postgres.$disconnect()
  
  log('')
  if (allVerified && totalErrors === 0) {
    log('✓ Migration completed successfully!')
    process.exit(0)
  } else {
    log('⚠️ Migration completed with warnings. Please review the output above.', 'warn')
    process.exit(1)
  }
}

// Run migration
runMigration().catch((error) => {
  log(`Migration failed: ${error.message}`, 'error')
  process.exit(1)
})
