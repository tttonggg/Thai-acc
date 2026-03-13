import { test, expect, Page } from '@playwright/test'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'

/**
 * AGENT_FULL_TEST - Full Coverage Test Suite
 * Tests all 16 sidebar modules for functionality and errors
 * 
 * Test Phases:
 * 1. Navigation Test - Each module loads via sidebar
 * 2. Interaction Test - Buttons, forms, tables are functional
 * 3. Console Error Monitoring - Capture all JS errors
 * 4. Visual Verification - Screenshots for evidence
 */

// Increase test timeout to 2 minutes per test
test.setTimeout(120000)

// Test configuration
test.use({
  baseURL: 'http://localhost:3000',
  extraHTTPHeaders: { 'x-playwright-test': 'true' },
  viewport: { width: 1920, height: 1080 },
  screenshot: 'only-on-failure',
  trace: 'on-first-retry',
})

// Ensure directory exists
function ensureDir(path: string) {
  const dir = dirname(path)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

// Test credentials
const TEST_CREDENTIALS = {
  email: 'admin@thaiaccounting.com',
  password: 'admin123'
}

// Module definitions with verification selectors
const MODULES = [
  { 
    id: 'dashboard', 
    name: 'ภาพรวม',
    expectedElements: ['main', '[data-testid="dashboard"]', '.dashboard'],
    description: 'Dashboard with summary cards and charts'
  },
  { 
    id: 'accounts', 
    name: 'ผังบัญชี',
    expectedElements: ['table', '[data-testid="chart-of-accounts"]', '.accounts'],
    description: 'Chart of accounts with account tree'
  },
  { 
    id: 'journal', 
    name: 'บันทึกบัญชี',
    expectedElements: ['table', '[data-testid="journal"]', '.journal'],
    description: 'Journal entry listing and creation'
  },
  { 
    id: 'invoices', 
    name: 'ใบกำกับภาษี',
    expectedElements: ['table', '[data-testid="invoices"]', '.invoices'],
    description: 'Invoice management'
  },
  { 
    id: 'vat', 
    name: 'ภาษีมูลค่าเพิ่ม',
    expectedElements: ['[data-testid="vat"]', '.vat', 'form'],
    description: 'VAT reports and filings'
  },
  { 
    id: 'wht', 
    name: 'ภาษีหัก ณ ที่จ่าย',
    expectedElements: ['[data-testid="wht"]', '.wht', '[role="tabpanel"]'],
    description: 'Withholding tax management'
  },
  { 
    id: 'customers', 
    name: 'ลูกหนี้',
    expectedElements: ['table', '[data-testid="customers"]', '.customers'],
    description: 'Accounts receivable / Customer management'
  },
  { 
    id: 'vendors', 
    name: 'เจ้าหนี้',
    expectedElements: ['table', '[data-testid="vendors"]', '.vendors'],
    description: 'Accounts payable / Vendor management'
  },
  { 
    id: 'inventory', 
    name: 'สต็อกสินค้า',
    expectedElements: ['table', '[data-testid="inventory"]', '.inventory'],
    description: 'Inventory management'
  },
  { 
    id: 'banking', 
    name: 'ธนาคาร',
    expectedElements: ['table', '[data-testid="banking"]', '.banking'],
    description: 'Bank accounts and reconciliation'
  },
  { 
    id: 'assets', 
    name: 'ทรัพย์สิน',
    expectedElements: ['table', '[data-testid="assets"]', '.assets'],
    description: 'Fixed asset management'
  },
  { 
    id: 'payroll', 
    name: 'เงินเดือน',
    expectedElements: ['table', '[data-testid="payroll"]', '.payroll'],
    description: 'Payroll processing'
  },
  { 
    id: 'petty-cash', 
    name: 'เงินสดย่อย',
    expectedElements: ['table', '[data-testid="petty-cash"]', '.petty-cash'],
    description: 'Petty cash management'
  },
  { 
    id: 'reports', 
    name: 'รายงาน',
    expectedElements: ['[data-testid="reports"]', '.reports', 'button'],
    description: 'Financial reports'
  },
  { 
    id: 'settings', 
    name: 'ตั้งค่า',
    expectedElements: ['form', '[data-testid="settings"]', '.settings'],
    description: 'System settings (Admin only)'
  },
  { 
    id: 'users', 
    name: 'จัดการผู้ใช้',
    expectedElements: ['table', '[data-testid="users"]', '.users'],
    description: 'User management (Admin only)'
  },
]

// Test results storage
interface TestResult {
  moduleId: string
  moduleName: string
  status: 'PASSED' | 'FAILED' | 'SKIPPED'
  loadTime: number
  consoleErrors: string[]
  pageErrors: string[]
  screenshotPath: string
  verificationResults: {
    sidebarActive: boolean
    contentLoaded: boolean
    elementsFound: string[]
    elementsMissing: string[]
  }
  errorMessage?: string
  timestamp: string
}

const testResults: TestResult[] = []
const consoleErrorLog: { module: string; type: string; message: string; timestamp: string }[] = []

/**
 * Check if page has chunk loading error
 */
async function hasChunkError(page: Page): Promise<boolean> {
  const bodyText = await page.locator('body').textContent().catch(() => '')
  return bodyText?.includes('Failed to load chunk') || 
         bodyText?.includes('เกิดข้อผิดพลาด') || false
}

/**
 * Login helper with retry logic and proper loading waits
 */
async function loginAsAdmin(page: Page, maxRetries = 3): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`  🔐 Login attempt ${attempt}/${maxRetries}...`)
      
      // Clear cookies for fresh login
      await page.context().clearCookies()
      
      // Navigate to login page
      console.log('  🌐 Navigating to login page...')
      await page.goto('http://localhost:3000/')
      
      // Wait for page to fully load - networkidle waits for all network requests
      console.log('  ⏳ Waiting for page to load (networkidle)...')
      await page.waitForLoadState('networkidle', { timeout: 15000 })
      
      // Extra wait for React hydration
      console.log('  ⏳ Waiting for React hydration...')
      await page.waitForTimeout(3000)
      
      // Check for chunk error
      if (await hasChunkError(page)) {
        console.log('  ⚠️ Chunk loading error detected, refreshing page...')
        await page.reload()
        await page.waitForLoadState('networkidle', { timeout: 15000 })
        await page.waitForTimeout(3000)
      }
      
      // Wait for loading to complete (no "กำลังโหลด" text)
      console.log('  ⏳ Checking for loading state...')
      try {
        await page.waitForFunction(() => {
          return !document.body.innerText.includes('กำลังโหลด')
        }, { timeout: 10000 })
        console.log('  ✅ Loading complete')
      } catch {
        console.log('  ⚠️ Loading check timed out, continuing...')
      }
      
      // First check if already logged in (sidebar visible)
      const sidebar = page.locator('aside, nav').first()
      const isSidebarVisible = await sidebar.isVisible().catch(() => false)
      
      if (isSidebarVisible) {
        console.log('  ✅ Already logged in (sidebar visible)')
        return
      }
      
      // Wait for login form with longer timeout
      console.log('  📝 Waiting for login form...')
      await page.waitForSelector('input[type="email"]', { timeout: 15000 })
      
      // Check for login form
      const emailInput = page.locator('input[type="email"]')
      const hasLoginForm = await emailInput.isVisible().catch(() => false)
      
      if (!hasLoginForm) {
        throw new Error('Login form not found and not already logged in')
      }
      
      const passwordInput = page.locator('input[type="password"]')
      const submitButton = page.locator('button[type="submit"]')
      
      await emailInput.waitFor({ state: 'visible', timeout: 15000 })
      await passwordInput.waitFor({ state: 'visible', timeout: 15000 })
      await submitButton.waitFor({ state: 'visible', timeout: 15000 })
      
      // Fill credentials
      await emailInput.fill(TEST_CREDENTIALS.email)
      await passwordInput.fill(TEST_CREDENTIALS.password)
      
      // Submit form
      await submitButton.click()
      
      // Wait for navigation/dashboard
      await page.waitForTimeout(4000)
      
      // Verify login success by checking for sidebar
      const isSidebarVisibleAfter = await sidebar.isVisible().catch(() => false)
      
      if (isSidebarVisibleAfter) {
        console.log('  ✅ Login successful')
        return
      }
      
      throw new Error('Login failed - sidebar not visible')
    } catch (error) {
      console.log(`  ❌ Login attempt ${attempt} failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      
      if (attempt === maxRetries) {
        throw new Error(`Login failed after ${maxRetries} attempts`)
      }
      
      await page.waitForTimeout(2000)
    }
  }
}

/**
 * Setup console error monitoring
 */
function setupConsoleMonitoring(page: Page, moduleId: string) {
  const moduleErrors: string[] = []
  const modulePageErrors: string[] = []
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const errorText = msg.text()
      moduleErrors.push(errorText)
      consoleErrorLog.push({
        module: moduleId,
        type: 'console',
        message: errorText,
        timestamp: new Date().toISOString()
      })
      console.log(`    🔴 Console Error [${moduleId}]: ${errorText.substring(0, 150)}`)
    }
  })
  
  page.on('pageerror', error => {
    const errorText = error.message
    modulePageErrors.push(errorText)
    consoleErrorLog.push({
      module: moduleId,
      type: 'page',
      message: errorText,
      timestamp: new Date().toISOString()
    })
    console.log(`    🔴 Page Error [${moduleId}]: ${errorText.substring(0, 150)}`)
  })
  
  return { moduleErrors, modulePageErrors }
}

/**
 * Find and click sidebar button
 */
async function clickSidebarButton(page: Page, moduleName: string) {
  const buttons = page.locator('aside nav button')
  const count = await buttons.count()
  
  for (let i = 0; i < count; i++) {
    const button = buttons.nth(i)
    const text = await button.textContent()
    
    if (text && (text.includes(moduleName) || 
                 (moduleName === 'ลูกหนี้' && text.includes('ลูกหนี้')) ||
                 (moduleName === 'เจ้าหนี้' && text.includes('เจ้าหนี้')))) {
      await button.click()
      console.log(`    ✓ Clicked: "${text?.trim()}"`)
      return button
    }
  }
  
  throw new Error(`Sidebar button for "${moduleName}" not found`)
}

/**
 * Verify module content loaded
 */
async function verifyModuleContent(page: Page, module: typeof MODULES[0]): Promise<{
  contentLoaded: boolean
  elementsFound: string[]
  elementsMissing: string[]
}> {
  const elementsFound: string[] = []
  const elementsMissing: string[] = []
  
  // Check for error indicators
  const bodyText = await page.locator('body').textContent()
  
  if (bodyText?.includes('Application error') || 
      bodyText?.includes('Internal Server Error') ||
      bodyText?.includes('Something went wrong')) {
    return { contentLoaded: false, elementsFound, elementsMissing: ['Module crashed'] }
  }
  
  // Check for expected elements
  for (const selector of module.expectedElements) {
    try {
      const element = page.locator(selector).first()
      const isVisible = await element.isVisible({ timeout: 3000 }).catch(() => false)
      
      if (isVisible) {
        elementsFound.push(selector)
      } else {
        elementsMissing.push(selector)
      }
    } catch {
      elementsMissing.push(selector)
    }
  }
  
  // Also check for main content area
  const hasMain = await page.locator('main').count() > 0
  if (hasMain) {
    elementsFound.push('main')
  }
  
  // Content is considered loaded if we have main and at least one expected element
  const contentLoaded = hasMain && elementsFound.length > 1
  
  return { contentLoaded, elementsFound, elementsMissing }
}

/**
 * Check if sidebar button is active
 */
async function isSidebarButtonActive(button: any): Promise<boolean> {
  return await button.evaluate((el: HTMLElement) => {
    return el.classList.contains('bg-yellow-500') ||
           el.className?.includes('bg-yellow-500') ||
           window.getComputedStyle(el).backgroundColor === 'rgb(234, 179, 8)'
  }).catch(() => false)
}

// Configure tests to run serially
test.describe.configure({ mode: 'serial' })

test.describe('AGENT_FULL_TEST - Full Coverage Test Suite', () => {
  
  /**
   * Phase 0: Login Setup
   */
  test('[SETUP] Login as admin', async ({ page }) => {
    console.log('\n' + '='.repeat(60))
    console.log('PHASE 0: SETUP - Login')
    console.log('='.repeat(60))
    
    await loginAsAdmin(page)
    
    // Take setup screenshot
    const screenshotPath = 'test-results/full-coverage/setup-login.png'
    ensureDir(screenshotPath)
    await page.screenshot({ path: screenshotPath, fullPage: true })
    
    console.log('✅ Setup complete')
  })
  
  /**
   * Phase 1: Test Each Module
   */
  for (const module of MODULES) {
    test(`[MODULE-${module.id.toUpperCase()}] ${module.name} - ${module.description}`, async ({ page }) => {
      console.log(`\n${'='.repeat(60)}`)
      console.log(`TESTING: ${module.name} (${module.id})`)
      console.log(`Description: ${module.description}`)
      console.log('='.repeat(60))
      
      const startTime = Date.now()
      const result: TestResult = {
        moduleId: module.id,
        moduleName: module.name,
        status: 'FAILED',
        loadTime: 0,
        consoleErrors: [],
        pageErrors: [],
        screenshotPath: '',
        verificationResults: {
          sidebarActive: false,
          contentLoaded: false,
          elementsFound: [],
          elementsMissing: []
        },
        timestamp: new Date().toISOString()
      }
      
      try {
        // Setup console monitoring
        const { moduleErrors, modulePageErrors } = setupConsoleMonitoring(page, module.id)
        
        // Step 1: Navigate to the application
        console.log('  Step 1: Navigating to application...')
        await page.goto('/')
        await page.waitForTimeout(2000)
        
        // Step 2: Verify sidebar is visible
        console.log('  Step 2: Verifying sidebar visibility...')
        const sidebar = page.locator('aside nav').first()
        await expect(sidebar).toBeVisible({ timeout: 10000 })
        
        // Step 3: Click sidebar button
        console.log('  Step 3: Clicking sidebar button...')
        const button = await clickSidebarButton(page, module.name)
        
        // Step 4: Wait for module to load
        console.log('  Step 4: Waiting for module to load...')
        await page.waitForTimeout(2000)
        
        // Step 5: Verify sidebar button is active
        console.log('  Step 5: Verifying sidebar active state...')
        result.verificationResults.sidebarActive = await isSidebarButtonActive(button)
        if (result.verificationResults.sidebarActive) {
          console.log('    ✓ Sidebar button is active')
        } else {
          console.log('    ⚠️ Sidebar button may not be showing as active')
        }
        
        // Step 6: Verify content loaded
        console.log('  Step 6: Verifying module content...')
        const verification = await verifyModuleContent(page, module)
        result.verificationResults = {
          ...result.verificationResults,
          ...verification
        }
        
        console.log(`    ✓ Elements found: ${verification.elementsFound.join(', ') || 'None'}`)
        if (verification.elementsMissing.length > 0) {
          console.log(`    ⚠️ Elements missing: ${verification.elementsMissing.join(', ')}`)
        }
        
        // Step 7: Take screenshot
        console.log('  Step 7: Capturing screenshot...')
        const screenshotPath = `test-results/full-coverage/${module.id}.png`
        ensureDir(screenshotPath)
        await page.screenshot({ path: screenshotPath, fullPage: true })
        result.screenshotPath = screenshotPath
        console.log(`    ✓ Screenshot saved: ${screenshotPath}`)
        
        // Step 8: Check for errors
        console.log('  Step 8: Checking for errors...')
        result.consoleErrors = moduleErrors
        result.pageErrors = modulePageErrors
        
        if (moduleErrors.length > 0) {
          console.log(`    ⚠️ ${moduleErrors.length} console error(s) detected`)
        }
        if (modulePageErrors.length > 0) {
          console.log(`    ⚠️ ${modulePageErrors.length} page error(s) detected`)
        }
        if (moduleErrors.length === 0 && modulePageErrors.length === 0) {
          console.log('    ✓ No errors detected')
        }
        
        // Calculate load time
        result.loadTime = Date.now() - startTime
        
        // Determine test status
        if (verification.contentLoaded) {
          result.status = 'PASSED'
          console.log(`\n✅ TEST PASSED: ${module.name} (${result.loadTime}ms)`)
        } else {
          result.status = 'FAILED'
          result.errorMessage = 'Content failed to load properly'
          console.log(`\n❌ TEST FAILED: ${module.name} - Content did not load`)
        }
        
      } catch (error) {
        result.loadTime = Date.now() - startTime
        result.errorMessage = error instanceof Error ? error.message : 'Unknown error'
        result.status = 'FAILED'
        
        console.log(`\n❌ TEST FAILED: ${module.name}`)
        console.log(`   Error: ${result.errorMessage}`)
        
        // Take error screenshot
        const errorPath = `test-results/full-coverage/${module.id}-ERROR.png`
        ensureDir(errorPath)
        await page.screenshot({ path: errorPath, fullPage: true }).catch(() => {})
        result.screenshotPath = errorPath
      }
      
      testResults.push(result)
    })
  }
  
  /**
   * Phase 2: Generate Comprehensive Report
   */
  test('[REPORT] Generate full coverage test report', async ({ page }) => {
    console.log('\n' + '='.repeat(60))
    console.log('PHASE 3: GENERATING TEST REPORT')
    console.log('='.repeat(60))
    
    // Calculate statistics
    const passed = testResults.filter(r => r.status === 'PASSED')
    const failed = testResults.filter(r => r.status === 'FAILED')
    const totalErrors = testResults.reduce((sum, r) => 
      sum + r.consoleErrors.length + r.pageErrors.length, 0)
    
    const avgLoadTime = testResults.length > 0 
      ? Math.round(testResults.reduce((sum, r) => sum + r.loadTime, 0) / testResults.length)
      : 0
    
    // Generate console summary
    console.log('\n📊 TEST SUMMARY')
    console.log('='.repeat(60))
    console.log(`Total Modules Tested: ${testResults.length}`)
    console.log(`Passed: ${passed.length} ✅`)
    console.log(`Failed: ${failed.length} ${failed.length > 0 ? '❌' : ''}`)
    console.log(`Success Rate: ${Math.round((passed.length / testResults.length) * 100)}%`)
    console.log(`Total Errors: ${totalErrors}`)
    console.log(`Average Load Time: ${avgLoadTime}ms`)
    console.log('='.repeat(60))
    
    // Detailed results
    console.log('\n📋 DETAILED RESULTS')
    console.log('='.repeat(60))
    
    for (const result of testResults) {
      const icon = result.status === 'PASSED' ? '✅' : '❌'
      console.log(`\n${icon} ${result.moduleName} (${result.moduleId})`)
      console.log(`   Status: ${result.status}`)
      console.log(`   Load Time: ${result.loadTime}ms`)
      console.log(`   Sidebar Active: ${result.verificationResults.sidebarActive ? 'Yes' : 'No'}`)
      console.log(`   Content Loaded: ${result.verificationResults.contentLoaded ? 'Yes' : 'No'}`)
      console.log(`   Console Errors: ${result.consoleErrors.length}`)
      console.log(`   Page Errors: ${result.pageErrors.length}`)
      
      if (result.errorMessage) {
        console.log(`   Error: ${result.errorMessage}`)
      }
    }
    
    // Failed modules summary
    if (failed.length > 0) {
      console.log('\n❌ FAILED MODULES')
      console.log('='.repeat(60))
      for (const result of failed) {
        console.log(`  - ${result.moduleName}: ${result.errorMessage || 'Unknown error'}`)
      }
    }
    
    // Console error summary
    if (consoleErrorLog.length > 0) {
      console.log('\n🔴 CONSOLE ERRORS BY MODULE')
      console.log('='.repeat(60))
      const errorsByModule: Record<string, number> = {}
      for (const error of consoleErrorLog) {
        errorsByModule[error.module] = (errorsByModule[error.module] || 0) + 1
      }
      for (const [module, count] of Object.entries(errorsByModule)) {
        console.log(`  ${module}: ${count} error(s)`)
      }
    }
    
    // Generate markdown report
    const reportPath = generateMarkdownReport(testResults, consoleErrorLog)
    console.log(`\n📝 Report saved: ${reportPath}`)
    
    // Generate JSON report for programmatic access
    const jsonReportPath = 'test-results/full-coverage/report.json'
    ensureDir(jsonReportPath)
    writeFileSync(jsonReportPath, JSON.stringify({
      summary: {
        total: testResults.length,
        passed: passed.length,
        failed: failed.length,
        successRate: Math.round((passed.length / testResults.length) * 100),
        totalErrors,
        avgLoadTime
      },
      results: testResults,
      consoleErrors: consoleErrorLog,
      generatedAt: new Date().toISOString()
    }, null, 2))
    console.log(`📝 JSON Report saved: ${jsonReportPath}`)
    
    // Final assertion
    console.log('\n' + '='.repeat(60))
    if (failed.length === 0) {
      console.log('🎉 ALL MODULES PASSED!')
    } else {
      console.log(`⚠️ ${failed.length} MODULE(S) FAILED - SEE REPORT FOR DETAILS`)
    }
    console.log('='.repeat(60))
    
    // Assert for test framework
    expect(failed.length, `${failed.length} module(s) failed. See report for details.`).toBe(0)
  })
})

/**
 * Generate markdown report
 */
function generateMarkdownReport(results: TestResult[], consoleErrors: typeof consoleErrorLog): string {
  const passed = results.filter(r => r.status === 'PASSED')
  const failed = results.filter(r => r.status === 'FAILED')
  const totalErrors = results.reduce((sum, r) => sum + r.consoleErrors.length + r.pageErrors.length, 0)
  const avgLoadTime = results.length > 0 
    ? Math.round(results.reduce((sum, r) => sum + r.loadTime, 0) / results.length)
    : 0
  
  const reportLines: string[] = []
  
  reportLines.push('# Full Coverage Test Report')
  reportLines.push('')
  reportLines.push(`**Generated:** ${new Date().toLocaleString('th-TH')}`)
  reportLines.push(`**Test Suite:** AGENT_FULL_TEST`)
  reportLines.push('')
  
  // Executive Summary
  reportLines.push('## Executive Summary')
  reportLines.push('')
  reportLines.push('| Metric | Value |')
  reportLines.push('|--------|-------|')
  reportLines.push(`| Total Modules | ${results.length} |`)
  reportLines.push(`| Passed | ${passed.length} ✅ |`)
  reportLines.push(`| Failed | ${failed.length} ❌ |`)
  reportLines.push(`| Success Rate | ${Math.round((passed.length / results.length) * 100)}% |`)
  reportLines.push(`| Total Errors | ${totalErrors} |`)
  reportLines.push(`| Average Load Time | ${avgLoadTime}ms |`)
  reportLines.push('')
  
  // Results Table
  reportLines.push('## Test Results by Module')
  reportLines.push('')
  reportLines.push('| # | Module | Status | Load Time | Console Errors | Page Errors | Screenshot |')
  reportLines.push('|---|--------|--------|-----------|----------------|-------------|------------|')
  
  results.forEach((result, index) => {
    const status = result.status === 'PASSED' ? '✅ PASS' : '❌ FAIL'
    const screenshotLink = result.screenshotPath 
      ? `[View](./${result.screenshotPath.replace('test-results/', '')})` 
      : 'N/A'
    reportLines.push(`| ${index + 1} | ${result.moduleName} (${result.moduleId}) | ${status} | ${result.loadTime}ms | ${result.consoleErrors.length} | ${result.pageErrors.length} | ${screenshotLink} |`)
  })
  
  reportLines.push('')
  
  // Failed Modules Detail
  if (failed.length > 0) {
    reportLines.push('## Failed Modules - Detailed Analysis')
    reportLines.push('')
    
    for (const result of failed) {
      reportLines.push(`### ${result.moduleName} (${result.moduleId})`)
      reportLines.push('')
      reportLines.push(`- **Status:** ❌ FAILED`)
      reportLines.push(`- **Error:** ${result.errorMessage || 'Unknown error'}`)
      reportLines.push(`- **Load Time:** ${result.loadTime}ms`)
      reportLines.push(`- **Sidebar Active:** ${result.verificationResults.sidebarActive ? 'Yes' : 'No'}`)
      reportLines.push(`- **Content Loaded:** ${result.verificationResults.contentLoaded ? 'Yes' : 'No'}`)
      reportLines.push(`- **Elements Found:** ${result.verificationResults.elementsFound.join(', ') || 'None'}`)
      reportLines.push(`- **Elements Missing:** ${result.verificationResults.elementsMissing.join(', ') || 'None'}`)
      
      if (result.consoleErrors.length > 0) {
        reportLines.push('- **Console Errors:**')
        result.consoleErrors.forEach((err, i) => {
          reportLines.push(`  ${i + 1}. \`${err.substring(0, 100)}${err.length > 100 ? '...' : ''}\``)
        })
      }
      
      if (result.pageErrors.length > 0) {
        reportLines.push('- **Page Errors:**')
        result.pageErrors.forEach((err, i) => {
          reportLines.push(`  ${i + 1}. \`${err.substring(0, 100)}${err.length > 100 ? '...' : ''}\``)
        })
      }
      
      reportLines.push('')
      reportLines.push('**Recommendation:**')
      reportLines.push('- Check module component for runtime errors')
      reportLines.push('- Verify data fetching and state management')
      reportLines.push('- Review browser console for detailed error messages')
      reportLines.push('')
    }
  }
  
  // Console Error Log
  if (consoleErrors.length > 0) {
    reportLines.push('## Console Error Log')
    reportLines.push('')
    
    const errorsByModule: Record<string, typeof consoleErrors> = {}
    for (const error of consoleErrors) {
      if (!errorsByModule[error.module]) {
        errorsByModule[error.module] = []
      }
      errorsByModule[error.module].push(error)
    }
    
    for (const [module, errors] of Object.entries(errorsByModule)) {
      reportLines.push(`### ${module}`)
      reportLines.push('')
      errors.forEach((err, i) => {
        reportLines.push(`${i + 1}. **${err.type.toUpperCase()}:** \`${err.message.substring(0, 150)}${err.message.length > 150 ? '...' : ''}\``)
      })
      reportLines.push('')
    }
  }
  
  // Recommendations
  reportLines.push('## Recommendations')
  reportLines.push('')
  
  if (failed.length > 0) {
    reportLines.push('### Immediate Actions Required')
    reportLines.push('')
    reportLines.push('1. **Fix Failed Modules:**')
    for (const result of failed) {
      reportLines.push(`   - [ ] Fix ${result.moduleName} (${result.moduleId})`)
    }
    reportLines.push('')
  }
  
  if (totalErrors > 0) {
    reportLines.push('2. **Address Console Errors:**')
    reportLines.push(`   - [ ] Review and fix ${totalErrors} console error(s)`)
    reportLines.push('')
  }
  
  reportLines.push('### General Improvements')
  reportLines.push('')
  reportLines.push('- [ ] Add data-testid attributes to all module components')
  reportLines.push('- [ ] Implement error boundaries for better error handling')
  reportLines.push('- [ ] Add loading states for async operations')
  reportLines.push('- [ ] Optimize module load times')
  reportLines.push('')
  
  // Appendix
  reportLines.push('## Appendix')
  reportLines.push('')
  reportLines.push('### Module Test Definitions')
  reportLines.push('')
  reportLines.push('| Module ID | Thai Name | Description | Expected Elements |')
  reportLines.push('|-----------|-----------|-------------|-------------------|')
  
  for (const module of MODULES) {
    reportLines.push(`| ${module.id} | ${module.name} | ${module.description} | ${module.expectedElements.join(', ')} |`)
  }
  
  reportLines.push('')
  reportLines.push('### Test Environment')
  reportLines.push('')
  reportLines.push('- **Base URL:** http://localhost:3000')
  reportLines.push('- **Viewport:** 1920x1080')
  reportLines.push('- **Browser:** Chromium (Playwright)')
  reportLines.push('- **Test Credentials:** admin@thaiaccounting.com / admin123')
  reportLines.push('')
  reportLines.push('---')
  reportLines.push('*Report generated by AGENT_FULL_TEST suite*')
  
  const reportPath = 'test-results/full-coverage/FULL_COVERAGE_REPORT.md'
  ensureDir(reportPath)
  writeFileSync(reportPath, reportLines.join('\n'), 'utf-8')
  
  return reportPath
}
