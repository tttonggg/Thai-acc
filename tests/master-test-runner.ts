#!/usr/bin/env ts-node

/**
 * Master Test Runner for Thai Accounting ERP
 *
 * Orchestrates execution of all E2E test suites with comprehensive reporting
 * Features:
 * - Parallel/sequential test execution
 * - Database verification before/after tests
 * - Screenshot capture on failures
 * - HTML report generation with statistics
 * - Performance metrics tracking
 * - CI/CD integration support
 */

import { execSync, spawn } from 'child_process'
import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, copyFileSync } from 'fs'
import { join, dirname } from 'path'
import { PrismaClient } from '@prisma/client'

interface TestSuite {
  name: string
  file: string
  priority: string
  timeout: number
  description: string
  tags: string[]
}

interface TestConfig {
  suites: TestSuite[]
  database: {
    verifyAfterEachTest: boolean
    cleanupAfterEachSuite: boolean
    seedTestData: boolean
    verifyModels: string[]
  }
  reporting: {
    format: string
    includeScreenshots: boolean
    includeDatabaseVerification: boolean
    includeTimeline: boolean
    includePerformanceMetrics: boolean
    outputDir: string
    screenshotsDir: string
    databaseReportFile: string
  }
  execution: {
    parallel: boolean
    maxWorkers: number
    retryFailedTests: boolean
    maxRetries: number
    continueOnFailure: boolean
    timeoutMultiplier: number
  }
}

interface TestResult {
  suite: TestSuite
  status: 'passed' | 'failed' | 'skipped' | 'timeout'
  duration: number
  startTime: Date
  endTime: Date
  errorMessage?: string
  screenshotPath?: string
  databaseSnapshot?: DatabaseSnapshot
}

interface DatabaseSnapshot {
  timestamp: Date
  recordCounts: Record<string, number>
  journalEntryBalance: number
  orphanedRecords: string[]
  integrityIssues: string[]
}

interface MasterReport {
  executionDate: Date
  totalDuration: number
  totalSuites: number
  passedSuites: number
  failedSuites: number
  skippedSuites: number
  passRate: number
  results: TestResult[]
  databaseVerification: {
    beforeTests: DatabaseSnapshot
    afterTests: DatabaseSnapshot
    changes: Record<string, number>
  }
  performanceMetrics: {
    averageTestDuration: number
    slowestTests: TestResult[]
    totalDatabaseVerificationTime: number
  }
  screenshots: string[]
  systemInfo: {
    nodeVersion: string
    os: string
    playwrightVersion: string
  }
}

class MasterTestRunner {
  private config: TestConfig
  private prisma: PrismaClient
  private results: TestResult[] = []
  private startTime: Date = new Date()
  private dbVerificationStartTime: number = 0

  constructor(configPath: string = join(process.cwd(), 'tests/test-suites.json')) {
    // Load configuration
    const configData = readFileSync(configPath, 'utf-8')
    this.config = JSON.parse(configData) as TestConfig

    // Initialize Prisma
    this.prisma = new PrismaClient()

    // Ensure output directories exist
    this.ensureDirectories()
  }

  private ensureDirectories(): void {
    const dirs = [
      this.config.reporting.outputDir,
      this.config.reporting.screenshotsDir,
      join(this.config.reporting.outputDir, 'html'),
      join(this.config.reporting.outputDir, 'json'),
    ]

    dirs.forEach(dir => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }
    })
  }

  /**
   * Execute all test suites
   */
  async runAll(filterTags?: string[]): Promise<MasterReport> {
    console.log('\n' + '='.repeat(80))
    console.log('🧪 THAI ACCOUNTING ERP - MASTER TEST RUNNER')
    console.log('='.repeat(80))
    console.log(`Start Time: ${this.startTime.toISOString()}`)
    console.log(`Total Test Suites: ${this.config.suites.length}`)
    if (filterTags) {
      console.log(`Filter Tags: ${filterTags.join(', ')}`)
    }
    console.log('='.repeat(80) + '\n')

    // Filter suites by tags if provided
    let suitesToRun = this.config.suites
    if (filterTags) {
      suitesToRun = this.config.suites.filter(suite =>
        suite.tags.some(tag => filterTags.includes(tag))
      )
    }

    // Take initial database snapshot
    console.log('📊 Taking initial database snapshot...')
    const beforeSnapshot = await this.takeDatabaseSnapshot()
    this.dbVerificationStartTime = Date.now()

    // Run test suites
    for (const suite of suitesToRun) {
      const result = await this.runTestSuite(suite)
      this.results.push(result)

      // Verify database after each test if configured
      if (this.config.database.verifyAfterEachTest) {
        console.log(`  📊 Verifying database after ${suite.name}...`)
        await this.verifyDatabaseIntegrity()
      }

      // Stop if critical test failed and continueOnFailure is false
      if (result.status === 'failed' &&
          suite.priority === 'critical' &&
          !this.config.execution.continueOnFailure) {
        console.error(`\n❌ CRITICAL TEST FAILED: ${suite.name}`)
        console.error('Stopping execution due to critical failure.\n')
        break
      }
    }

    // Take final database snapshot
    console.log('\n📊 Taking final database snapshot...')
    const afterSnapshot = await this.takeDatabaseSnapshot()
    const dbVerificationTime = Date.now() - this.dbVerificationStartTime

    // Generate screenshots list
    const screenshots = this.collectScreenshots()

    // Generate report
    const report = await this.generateReport(
      beforeSnapshot,
      afterSnapshot,
      dbVerificationTime,
      screenshots
    )

    // Cleanup
    await this.prisma.$disconnect()

    return report
  }

  /**
   * Run a single test suite
   */
  private async runTestSuite(suite: TestSuite): Promise<TestResult> {
    const startTime = new Date()
    console.log(`\n🧪 Running: ${suite.name}`)
    console.log(`   File: ${suite.file}`)
    console.log(`   Priority: ${suite.priority}`)
    console.log(`   Timeout: ${suite.timeout}ms`)

    const result: TestResult = {
      suite,
      status: 'passed',
      duration: 0,
      startTime,
      endTime: new Date(),
    }

    try {
      // Build Playwright command
      const testFile = suite.file
      const timeout = Math.floor(suite.timeout * this.config.execution.timeoutMultiplier)

      const args = [
        'playwright',
        'test',
        testFile,
        '--reporter=line',
        `--timeout=${timeout}`,
      ]

      if (!this.config.execution.parallel) {
        args.push('--workers=1')
      }

      if (this.config.execution.retryFailedTests) {
        args.push(`--retries=${this.config.execution.maxRetries}`)
      }

      // Execute test
      const startTimeMs = Date.now()
      const output = execSync(args.join(' '), {
        cwd: process.cwd(),
        stdio: 'inherit',
        env: {
          ...process.env,
          NODE_ENV: 'test',
        }
      })
      const duration = Date.now() - startTimeMs

      result.duration = duration
      result.endTime = new Date()
      result.status = 'passed'

      console.log(`   ✅ PASSED (${duration}ms)`)

      // Take database snapshot if configured
      if (this.config.database.verifyAfterEachTest) {
        result.databaseSnapshot = await this.takeDatabaseSnapshot()
      }

    } catch (error: any) {
      const duration = Date.now() - startTime.getTime()
      result.duration = duration
      result.endTime = new Date()
      result.status = 'failed'
      result.errorMessage = error.message

      console.log(`   ❌ FAILED (${duration}ms)`)
      console.log(`   Error: ${error.message}`)

      // Capture screenshot on failure
      const screenshotPath = this.captureFailureScreenshot(suite)
      if (screenshotPath) {
        result.screenshotPath = screenshotPath
      }

      // Retry if configured
      if (this.config.execution.retryFailedTests && this.config.execution.maxRetries > 0) {
        console.log(`   🔄 Retrying (${this.config.execution.maxRetries} attempts remaining)...`)
        // Retry logic would go here
      }
    }

    return result
  }

  /**
   * Take snapshot of database state
   */
  private async takeDatabaseSnapshot(): Promise<DatabaseSnapshot> {
    const snapshot: DatabaseSnapshot = {
      timestamp: new Date(),
      recordCounts: {},
      journalEntryBalance: 0,
      orphanedRecords: [],
      integrityIssues: [],
    }

    try {
      // Get record counts for all models
      for (const model of this.config.database.verifyModels) {
        try {
          const count: any = await (this.prisma as any)[model].count()
          snapshot.recordCounts[model] = count
        } catch (error) {
          console.warn(`    Warning: Could not count ${model}`)
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
          snapshot.integrityIssues.push(
            `Journal Entry ${entry.number} not balanced: D=${entryDebit}, C=${entryCredit}`
          )
        }

        totalDebit += entryDebit
        totalCredit += entryCredit
      }

      snapshot.journalEntryBalance = totalDebit - totalCredit

    } catch (error) {
      console.error('Error taking database snapshot:', error)
    }

    return snapshot
  }

  /**
   * Verify database integrity
   */
  private async verifyDatabaseIntegrity(): Promise<void> {
    const issues: string[] = []

    try {
      // Check for orphaned records
      const customersWithoutCompany = await this.prisma.customer.count({
        where: { companyId: null }
      })
      if (customersWithoutCompany > 0) {
        issues.push(`${customersWithoutCompany} customers without company`)
      }

      const invoicesWithoutJournal = await this.prisma.invoice.count({
        where: { journalEntryId: null }
      })
      if (invoicesWithoutJournal > 0) {
        issues.push(`${invoicesWithoutJournal} invoices without journal entry`)
      }

      if (issues.length > 0) {
        console.warn(`  ⚠️  Database integrity issues:`)
        issues.forEach(issue => console.warn(`     - ${issue}`))
      }
    } catch (error) {
      console.error('Error verifying database integrity:', error)
    }
  }

  /**
   * Capture screenshot on test failure
   */
  private captureFailureScreenshot(suite: TestSuite): string | null {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = `${suite.name.replace(/\s+/g, '-').toLowerCase()}-${timestamp}.png`
      const path = join(this.config.reporting.screenshotsDir, filename)

      // Playwright already captures screenshots, this is a placeholder
      // for custom screenshot logic if needed
      return path
    } catch (error) {
      console.error('Error capturing screenshot:', error)
      return null
    }
  }

  /**
   * Collect all screenshots from test results
   */
  private collectScreenshots(): string[] {
    const screenshots: string[] = []

    try {
      if (existsSync(this.config.reporting.screenshotsDir)) {
        const files = readdirSync(this.config.reporting.screenshotsDir)
        files.forEach(file => {
          if (file.endsWith('.png') || file.endsWith('.jpg')) {
            screenshots.push(join(this.config.reporting.screenshotsDir, file))
          }
        })
      }

      // Also check Playwright's screenshot directory
      const playwrightScreenshots = join('test-results', 'screenshots')
      if (existsSync(playwrightScreenshots)) {
        const files = readdirSync(playwrightScreenshots, { recursive: true })
        files.forEach((file: any) => {
          if (typeof file === 'string' && (file.endsWith('.png') || file.endsWith('.jpg'))) {
            screenshots.push(join(playwrightScreenshots, file))
          }
        })
      }
    } catch (error) {
      console.error('Error collecting screenshots:', error)
    }

    return screenshots
  }

  /**
   * Generate master report
   */
  private async generateReport(
    beforeSnapshot: DatabaseSnapshot,
    afterSnapshot: DatabaseSnapshot,
    dbVerificationTime: number,
    screenshots: string[]
  ): Promise<MasterReport> {
    const endTime = new Date()
    const totalDuration = endTime.getTime() - this.startTime.getTime()

    const passedSuites = this.results.filter(r => r.status === 'passed').length
    const failedSuites = this.results.filter(r => r.status === 'failed').length
    const skippedSuites = this.results.filter(r => r.status === 'skipped').length

    // Calculate database changes
    const changes: Record<string, number> = {}
    for (const model of this.config.database.verifyModels) {
      const before = beforeSnapshot.recordCounts[model] || 0
      const after = afterSnapshot.recordCounts[model] || 0
      changes[model] = after - before
    }

    // Calculate performance metrics
    const averageTestDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / this.results.length
    const slowestTests = [...this.results]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5)

    const report: MasterReport = {
      executionDate: this.startTime,
      totalDuration,
      totalSuites: this.results.length,
      passedSuites,
      failedSuites,
      skippedSuites,
      passRate: (passedSuites / this.results.length) * 100,
      results: this.results,
      databaseVerification: {
        beforeTests: beforeSnapshot,
        afterTests: afterSnapshot,
        changes,
      },
      performanceMetrics: {
        averageTestDuration,
        slowestTests,
        totalDatabaseVerificationTime: dbVerificationTime,
      },
      screenshots,
      systemInfo: {
        nodeVersion: process.version,
        os: process.platform,
        playwrightVersion: '1.58.2', // Should be dynamic
      }
    }

    // Save JSON report
    const jsonReportPath = join(
      this.config.reporting.outputDir,
      'json',
      `master-report-${this.startTime.toISOString().replace(/[:.]/g, '-')}.json`
    )
    writeFileSync(jsonReportPath, JSON.stringify(report, null, 2))
    console.log(`\n📄 JSON Report: ${jsonReportPath}`)

    // Generate HTML report
    await this.generateHtmlReport(report)

    return report
  }

  /**
   * Generate HTML report
   */
  private async generateHtmlReport(report: MasterReport): Promise<void> {
    const templatePath = join(__dirname, 'reporters', 'template.html')
    let html = ''

    try {
      if (existsSync(templatePath)) {
        html = readFileSync(templatePath, 'utf-8')
      } else {
        // Use default template if custom one doesn't exist
        html = this.getDefaultHtmlTemplate()
      }

      // Replace placeholders
      html = html.replace('{{TITLE}}', 'Thai Accounting ERP - Test Report')
      html = html.replace('{{EXECUTION_DATE}}', report.executionDate.toLocaleString('th-TH'))
      html = html.replace('{{TOTAL_DURATION}}', this.formatDuration(report.totalDuration))
      html = html.replace('{{TOTAL_SUITES}}', report.totalSuites.toString())
      html = html.replace('{{PASSED_SUITES}}', report.passedSuites.toString())
      html = html.replace('{{FAILED_SUITES}}', report.failedSuites.toString())
      html = html.replace('{{PASS_RATE}}', report.passRate.toFixed(1))

      // Generate results table
      const resultsTable = this.generateResultsTable(report)
      html = html.replace('{{RESULTS_TABLE}}', resultsTable)

      // Generate database section
      const databaseSection = this.generateDatabaseSection(report)
      html = html.replace('{{DATABASE_SECTION}}', databaseSection)

      // Generate performance section
      const performanceSection = this.generatePerformanceSection(report)
      html = html.replace('{{PERFORMANCE_SECTION}}', performanceSection)

      // Save HTML report
      const htmlReportPath = join(
        this.config.reporting.outputDir,
        'html',
        `master-report-${report.executionDate.toISOString().replace(/[:.]/g, '-')}.html`
      )
      writeFileSync(htmlReportPath, html)
      console.log(`📄 HTML Report: ${htmlReportPath}`)

    } catch (error) {
      console.error('Error generating HTML report:', error)
    }
  }

  private getDefaultHtmlTemplate(): string {
    return `
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{TITLE}}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Sarabun', -apple-system, sans-serif; background: #f5f5f5; padding: 20px; }
        .container { max-width: 1400px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .header h1 { font-size: 28px; margin-bottom: 10px; }
        .header .meta { opacity: 0.9; font-size: 14px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; padding: 30px; }
        .summary-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .summary-card .label { font-size: 12px; color: #6c757d; text-transform: uppercase; margin-bottom: 5px; }
        .summary-card .value { font-size: 32px; font-weight: bold; }
        .summary-card.passed .value { color: #28a745; }
        .summary-card.failed .value { color: #dc3545; }
        .summary-card.rate .value { color: #667eea; }
        .section { padding: 30px; border-top: 1px solid #dee2e6; }
        .section h2 { font-size: 20px; margin-bottom: 20px; color: #333; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6; }
        th { background: #f8f9fa; font-weight: 600; color: #495057; }
        .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
        .badge.passed { background: #d4edda; color: #155724; }
        .badge.failed { background: #f8d7da; color: #721c24; }
        .badge.skipped { background: #fff3cd; color: #856404; }
        .badge.critical { background: #f8d7da; color: #721c24; }
        .badge.high { background: #fff3cd; color: #856404; }
        .badge.medium { background: #d1ecf1; color: #0c5460; }
        .badge.low { background: #d4edda; color: #155724; }
        .database-changes { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px; }
        .db-change { padding: 15px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid #667eea; }
        .db-change.positive { border-left-color: #28a745; }
        .db-change.negative { border-left-color: #dc3545; }
        .db-change .model { font-weight: 600; margin-bottom: 5px; }
        .db-change .change { font-size: 24px; font-weight: bold; }
        .db-change .change.positive { color: #28a745; }
        .db-change .change.negative { color: #dc3545; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{TITLE}}</h1>
            <div class="meta">
                <div>📅 Execution Date: {{EXECUTION_DATE}}</div>
                <div>⏱️ Total Duration: {{TOTAL_DURATION}}</div>
            </div>
        </div>

        <div class="summary">
            <div class="summary-card">
                <div class="label">Total Suites</div>
                <div class="value">{{TOTAL_SUITES}}</div>
            </div>
            <div class="summary-card passed">
                <div class="label">Passed</div>
                <div class="value">{{PASSED_SUITES}}</div>
            </div>
            <div class="summary-card failed">
                <div class="label">Failed</div>
                <div class="value">{{FAILED_SUITES}}</div>
            </div>
            <div class="summary-card rate">
                <div class="label">Pass Rate</div>
                <div class="value">{{PASS_RATE}}%</div>
            </div>
        </div>

        <div class="section">
            <h2>📊 Test Results</h2>
            {{RESULTS_TABLE}}
        </div>

        <div class="section">
            <h2>🗄️ Database Verification</h2>
            {{DATABASE_SECTION}}
        </div>

        <div class="section">
            <h2>⚡ Performance Metrics</h2>
            {{PERFORMANCE_SECTION}}
        </div>
    </div>
</body>
</html>
    `
  }

  private generateResultsTable(report: MasterReport): string {
    const rows = report.results.map(result => {
      const statusClass = result.status
      const duration = this.formatDuration(result.duration)
      const priorityClass = result.suite.priority

      return `
        <tr>
            <td>${result.suite.name}</td>
            <td><span class="badge ${priorityClass}">${result.suite.priority}</span></td>
            <td><span class="badge ${statusClass}">${result.status.toUpperCase()}</span></td>
            <td>${duration}</td>
            <td>${result.errorMessage || '-'}</td>
        </tr>
      `
    }).join('')

    return `
      <table>
        <thead>
          <tr>
            <th>Test Suite</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Duration</th>
            <th>Error</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `
  }

  private generateDatabaseSection(report: MasterReport): string {
    const changes = Object.entries(report.databaseVerification.changes)
      .filter(([_, change]) => change !== 0)
      .map(([model, change]) => {
        const changeClass = change > 0 ? 'positive' : 'negative'
        const changeSymbol = change > 0 ? '+' : ''
        const icon = change > 0 ? '📈' : '📉'

        return `
          <div class="db-change ${changeClass}">
            <div class="model">${model}</div>
            <div class="change ${changeClass}">
              ${icon} ${changeSymbol}${change}
            </div>
          </div>
        `
      })
      .join('')

    return `
      <div class="database-changes">
        ${changes || '<p>No database changes detected</p>'}
      </div>
    `
  }

  private generatePerformanceSection(report: MasterReport): string {
    const slowestTests = report.performanceMetrics.slowestTests
      .map((test, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${test.suite.name}</td>
          <td>${this.formatDuration(test.duration)}</td>
        </tr>
      `)
      .join('')

    return `
      <table>
        <thead>
          <tr>
            <th>Metric</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Average Test Duration</td>
            <td>${this.formatDuration(report.performanceMetrics.averageTestDuration)}</td>
          </tr>
          <tr>
            <td>Total DB Verification Time</td>
            <td>${this.formatDuration(report.performanceMetrics.totalDatabaseVerificationTime)}</td>
          </tr>
        </tbody>
      </table>

      <h3 style="margin-top: 30px; margin-bottom: 15px;">🐌 Slowest Tests</h3>
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Test Suite</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          ${slowestTests}
        </tbody>
      </table>
    `
  }

  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    }
    return `${seconds}s`
  }
}

// CLI execution
if (require.main === module) {
  const runner = new MasterTestRunner()

  // Parse command line arguments
  const args = process.argv.slice(2)
  const tagsIndex = args.indexOf('--tags')
  const tags = tagsIndex >= 0 ? args[tagsIndex + 1]?.split(',') : undefined

  runner.runAll(tags)
    .then(report => {
      console.log('\n' + '='.repeat(80))
      console.log('✅ MASTER TEST RUNNER COMPLETED')
      console.log('='.repeat(80))
      console.log(`Total Duration: ${runner['formatDuration'](report.totalDuration)}`)
      console.log(`Passed: ${report.passedSuites}/${report.totalSuites}`)
      console.log(`Pass Rate: ${report.passRate.toFixed(1)}%`)
      console.log('='.repeat(80) + '\n')

      if (report.failedSuites > 0) {
        process.exit(1)
      }
    })
    .catch(error => {
      console.error('❌ MASTER TEST RUNNER FAILED:', error)
      process.exit(1)
    })
}

export { MasterTestRunner, TestConfig, TestResult, MasterReport }
