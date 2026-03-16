/**
 * Database Test Reporter for Thai Accounting ERP
 *
 * Custom Playwright reporter that tracks database state during test execution
 * Features:
 * - Record counts before/after each test
 * - Referential integrity checks
 * - Orphaned record detection
 * - Journal entry balance verification
 * - JSON export of database changes
 */

import { FullConfig, Reporter, Suite, TestCase, TestResult } from '@playwright/test'
import { PrismaClient } from '@prisma/client'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

interface DatabaseState {
  timestamp: Date
  testName: string
  recordCounts: Record<string, number>
  journalEntryBalance: number
  integrityIssues: string[]
  orphanedRecords: string[]
}

interface TestDatabaseReport {
  suite: string
  test: string
  status: string
  duration: number
  beforeState: DatabaseState
  afterState: DatabaseState
  changes: Record<string, number>
  issues: string[]
}

export class DatabaseReporter implements Reporter {
  private prisma: PrismaClient
  private states: Map<string, DatabaseState> = new Map()
  private reports: TestDatabaseReport[] = []
  private outputDir: string

  constructor(options: { outputDir?: string } = {}) {
    this.prisma = new PrismaClient()
    this.outputDir = options.outputDir || join(process.cwd(), 'test-results', 'database')

    // Ensure output directory exists
    if (!existsSync(this.outputDir)) {
      mkdirSync(this.outputDir, { recursive: true })
    }
  }

  async onBegin(config: FullConfig, suite: Suite) {
    console.log('\n📊 Database Reporter initialized')
    console.log(`   Output directory: ${this.outputDir}`)
  }

  async onTestBegin(test: TestCase) {
    // Capture database state before test
    const state = await this.captureDatabaseState(test.title)
    this.states.set(test.id, state)
  }

  async onTestEnd(test: TestCase, result: TestResult) {
    // Capture database state after test
    const beforeState = this.states.get(test.id)
    const afterState = await this.captureDatabaseState(test.title)

    if (!beforeState) {
      console.warn(`No before state found for test: ${test.title}`)
      return
    }

    // Calculate changes
    const changes: Record<string, number> = {}
    for (const model of Object.keys(beforeState.recordCounts)) {
      changes[model] = (afterState.recordCounts[model] || 0) - beforeState.recordCounts[model]
    }

    // Collect issues
    const issues: string[] = [
      ...afterState.integrityIssues,
      ...afterState.orphanedRecords,
    ]

    if (Math.abs(afterState.journalEntryBalance) > 0.01) {
      issues.push(`Journal entries not balanced: ${afterState.journalEntryBalance}`)
    }

    // Create report
    const report: TestDatabaseReport = {
      suite: test.parent.title,
      test: test.title,
      status: result.status,
      duration: result.duration,
      beforeState,
      afterState,
      changes,
      issues,
    }

    this.reports.push(report)

    // Log issues if any
    if (issues.length > 0) {
      console.warn(`\n⚠️  Database issues detected in: ${test.title}`)
      issues.forEach(issue => console.warn(`   - ${issue}`))
    }
  }

  async onEnd() {
    // Generate summary report
    const summary = {
      timestamp: new Date(),
      totalTests: this.reports.length,
      passedTests: this.reports.filter(r => r.status === 'passed').length,
      failedTests: this.reports.filter(r => r.status === 'failed').length,
      totalIssues: this.reports.reduce((sum, r) => sum + r.issues.length, 0),
      reports: this.reports,
    }

    // Save summary
    const summaryPath = join(this.outputDir, 'database-summary.json')
    writeFileSync(summaryPath, JSON.stringify(summary, null, 2))
    console.log(`\n📊 Database summary saved: ${summaryPath}`)

    // Generate per-test reports
    this.reports.forEach(report => {
      const filename = `${report.suite.replace(/\s+/g, '-')}-${report.test.replace(/\s+/g, '-')}.json`
      const path = join(this.outputDir, filename)
      writeFileSync(path, JSON.stringify(report, null, 2))
    })

    console.log(`📊 Generated ${this.reports.length} database reports`)

    // Cleanup
    await this.prisma.$disconnect()
  }

  private async captureDatabaseState(testName: string): Promise<DatabaseState> {
    const state: DatabaseState = {
      timestamp: new Date(),
      testName,
      recordCounts: {},
      journalEntryBalance: 0,
      integrityIssues: [],
      orphanedRecords: [],
    }

    try {
      // Get record counts for all models
      const models = [
        'User', 'ChartOfAccount', 'Customer', 'Vendor', 'Product',
        'Invoice', 'PurchaseInvoice', 'Receipt', 'Payment',
        'JournalEntry', 'JournalLine', 'VatRecord', 'WithholdingTax',
        'Warehouse', 'StockBalance', 'StockMovement',
        'Asset', 'BankAccount', 'Cheque',
        'PettyCashFund', 'PettyCashVoucher',
        'Employee', 'PayrollRun', 'Payroll',
      ]

      for (const model of models) {
        try {
          const count: any = await (this.prisma as any)[model].count()
          state.recordCounts[model] = count
        } catch (error) {
          // Model might not exist
        }
      }

      // Verify journal entry balances
      const journalEntries = await this.prisma.journalEntry.findMany({
        include: { lines: true }
      })

      let totalDebit = 0
      let totalCredit = 0

      for (const entry of journalEntries) {
        const entryDebit = entry.lines.reduce((sum, line) => sum + Number(line.debit || 0), 0)
        const entryCredit = entry.lines.reduce((sum, line) => sum + Number(line.credit || 0), 0)

        if (Math.abs(entryDebit - entryCredit) > 0.01) {
          state.integrityIssues.push(
            `Journal Entry ${entry.number} not balanced: D=${entryDebit}, C=${entryCredit}`
          )
        }

        totalDebit += entryDebit
        totalCredit += entryCredit
      }

      state.journalEntryBalance = totalDebit - totalCredit

      // Check for orphaned records
      const orphanChecks = [
        { model: 'Customer', field: 'companyId' },
        { model: 'Vendor', field: 'companyId' },
        { model: 'Invoice', field: 'journalEntryId' },
        { model: 'Receipt', field: 'journalEntryId' },
        { model: 'Payment', field: 'journalEntryId' },
      ]

      for (const check of orphanChecks) {
        try {
          const count: any = await (this.prisma as any)[check.model].count({
            where: { [check.field]: null }
          })

          if (count > 0) {
            state.orphanedRecords.push(
              `${count} ${check.model} records without ${check.field}`
            )
          }
        } catch (error) {
          // Field might not exist
        }
      }

    } catch (error) {
      console.error('Error capturing database state:', error)
    }

    return state
  }
}
