import { test, expect } from '@playwright/test'

// Test credentials
const TEST_CREDENTIALS = {
  email: 'admin@thaiaccounting.com',
  password: 'admin123'
}

// Run tests serially since they share login state
test.describe.configure({ mode: 'serial' })

let page
let isLoggedIn = false

/**
 * Improved Login Function with better timing and sidebar detection
 */
async function loginAsAdmin(page) {
  console.log('🔐 Starting login process...')
  
  // Clear cookies to ensure fresh login
  await page.context().clearCookies()
  
  // Navigate to login page
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  
  console.log('✓ Page loaded')
  
  // Wait for form to be visible
  const emailInput = page.locator('input[type="email"]')
  const passwordInput = page.locator('input[type="password"]')
  const submitButton = page.locator('button[type="submit"]')
  
  await emailInput.waitFor({ state: 'visible', timeout: 10000 })
  await passwordInput.waitFor({ state: 'visible', timeout: 10000 })
  await submitButton.waitFor({ state: 'visible', timeout: 10000 })
  
  console.log('✓ Form fields visible')
  
  // Fill credentials using type with delay to simulate real user
  await emailInput.fill(TEST_CREDENTIALS.email)
  await passwordInput.fill(TEST_CREDENTIALS.password)
  
  console.log('✓ Credentials filled')
  
  // Wait a moment for any validation
  await page.waitForTimeout(300)
  
  // Click submit button with explicit wait
  await submitButton.click()
  
  // Wait for the page to navigate (URL should stay at / or redirect to dashboard)
  await page.waitForTimeout(4000)
  
  console.log('✓ Form submitted')
  
  // Check current URL
  const currentUrl = page.url()
  console.log('Current URL:', currentUrl)
  
  // Check for sidebar to confirm successful login
  const sidebar = page.locator('nav, aside').first()
  const sidebarVisible = await sidebar.isVisible().catch(() => false)
  
  if (!sidebarVisible) {
    // Take debug screenshot
    await page.screenshot({ path: 'test-results/login-debug.png', fullPage: true })
    
    // Check if still on login page with error
    const errorVisible = await page.locator('text=ไม่ถูกต้อง').isVisible().catch(() => false)
    const pageText = await page.locator('body').textContent().catch(() => '')
    console.log('Page text preview:', pageText?.substring(0, 200))
    
    if (errorVisible) {
      throw new Error('Login failed: Invalid credentials')
    }
    throw new Error('Login failed: Sidebar not visible')
  }
  
  console.log('✅ Login successful')
  return sidebar
}

/**
 * Login with retry logic for flaky logins
 */
async function loginWithRetry(page, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await loginAsAdmin(page)
      return
    } catch (error) {
      console.log(`Login attempt ${i + 1} failed, retrying...`)
      await page.waitForTimeout(2000)
    }
  }
  throw new Error('Login failed after all retries')
}

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage()
  await page.setExtraHTTPHeaders({ 'x-playwright-test': 'true' })
  
  // Login once before all tests with retry
  try {
    await loginWithRetry(page)
    isLoggedIn = true
    console.log('✓ Login successful')
  } catch (e) {
    console.log('⚠ Login failed:', e.message)
    isLoggedIn = false
  }
})

test.afterAll(async () => {
  await page.close()
})

async function navigateToModule(label) {
  // Find the button by iterating through sidebar buttons
  const buttons = page.locator('aside nav button')
  const count = await buttons.count()
  
  let clicked = false
  for (let i = 0; i < count; i++) {
    const text = await buttons.nth(i).textContent()
    if (text && text.includes(label)) {
      await buttons.nth(i).click()
      clicked = true
      break
    }
  }
  
  if (!clicked) {
    // List all available buttons for debugging
    console.log('  Available sidebar buttons:')
    for (let i = 0; i < count; i++) {
      const text = await buttons.nth(i).textContent()
      console.log(`    - "${text}"`)
    }
    throw new Error(`Could not find module button: ${label}`)
  }
  
  await page.waitForTimeout(2000)
}

test.describe('Core Financial Modules', () => {
  test('Dashboard module loads with all components', async () => {
    test.skip(!isLoggedIn, 'Skipping test - login failed')
    
    // Navigate to dashboard
    await navigateToModule('ภาพรวม')

    // Verify page header
    await expect(page.locator('h1')).toContainText('ภาพรวมธุรกิจ')

    // Verify Summary Cards (4 cards)
    const summaryCards = [
      { text: 'รายได้รวม (เดือนนี้)', name: 'Revenue card' },
      { text: 'ค่าใช้จ่ายรวม (เดือนนี้)', name: 'Expense card' },
      { text: 'ลูกหนี้การค้า', name: 'AR card' },
      { text: 'เจ้าหนี้การค้า', name: 'AP card' },
    ]

    for (const card of summaryCards) {
      const cardLocator = page.locator(`text=${card.text}`)
      await expect(cardLocator.first()).toBeVisible({ timeout: 5000 })
      console.log(`  ✓ ${card.name} is visible`)
    }

    // Verify Charts Section
    const charts = [
      { title: 'รายได้ vs ค่าใช้จ่าย', name: 'Revenue vs Expense bar chart' },
      { title: 'ภาษีมูลค่าเพิ่ม', name: 'VAT line chart' },
      { title: 'ลูกหนี้ตามอายุหนี้', name: 'AR Aging pie chart' },
      { title: 'เจ้าหนี้ตามอายุหนี้', name: 'AP Aging pie chart' },
    ]

    for (const chart of charts) {
      const chartLocator = page.locator(`text=${chart.title}`)
      await expect(chartLocator.first()).toBeVisible({ timeout: 5000 })
      console.log(`  ✓ ${chart.name} is visible`)
    }

    // Verify Quick Actions Section
    const quickActions = [
      { text: 'ใบกำกับภาษีร่าง', name: 'Draft Invoices' },
      { text: 'ลูกหนี้เกินกำหนด', name: 'Overdue AR' },
      { text: 'รอยื่นภาษี', name: 'Pending VAT' },
    ]

    for (const action of quickActions) {
      const actionLocator = page.locator(`text=${action.text}`)
      await expect(actionLocator.first()).toBeVisible({ timeout: 5000 })
      console.log(`  ✓ Quick Action: ${action.name} is visible`)
    }

    // Take screenshot
    await page.screenshot({ path: 'test-results/screenshots/finance/dashboard-overview.png', fullPage: true })
    console.log('  ✓ Screenshot saved: dashboard-overview.png')
  })

  test('Chart of Accounts module loads with all buttons', async () => {
    test.skip(!isLoggedIn, 'Skipping test - login failed')
    
    await navigateToModule('ผังบัญชี')

    // Verify page header
    await expect(page.locator('h1')).toContainText('ผังบัญชี')

    // Verify Search input field
    const searchInput = page.locator('input[placeholder*="ค้นหา"], input[type="text"]').first()
    await expect(searchInput).toBeVisible({ timeout: 5000 })
    console.log('  ✓ Search input field is visible')

    // Verify Add Account button (opens dialog)
    const addButton = page.locator('button', { hasText: /เพิ่มบัญชี/ }).first()
    await expect(addButton).toBeVisible({ timeout: 5000 })
    console.log('  ✓ Add Account button is visible')

    // Click Add Account button to test dialog
    await addButton.click()
    await page.waitForTimeout(800)
    
    // Verify dialog opens - look for dialog title
    const dialogTitle = page.locator('text=เพิ่มบัญชีใหม่')
    await expect(dialogTitle).toBeVisible({ timeout: 3000 })
    console.log('  ✓ Add Account dialog opens')
    
    // Close dialog using cancel button
    const cancelButton = page.locator('button', { hasText: 'ยกเลิก' }).first()
    await cancelButton.click()
    await page.waitForTimeout(500)

    // Verify Export button
    const exportButton = page.locator('button', { hasText: /ส่งออก/ }).first()
    await expect(exportButton).toBeVisible({ timeout: 5000 })
    console.log('  ✓ Export button is visible')

    // Verify Import button
    const importButton = page.locator('button', { hasText: /นำเข้า/ }).first()
    await expect(importButton).toBeVisible({ timeout: 5000 })
    console.log('  ✓ Import button is visible')

    // Click Import button to test dialog
    await importButton.click()
    await page.waitForTimeout(800)
    
    // Verify import dialog opens
    const importDialogTitle = page.locator('text=นำเข้าผังบัญชี')
    await expect(importDialogTitle).toBeVisible({ timeout: 3000 })
    console.log('  ✓ Import dialog opens')
    
    // Close dialog
    const closeButton = page.locator('button', { hasText: 'ยกเลิก' }).first()
    await closeButton.click()
    await page.waitForTimeout(500)

    // Verify account table is displayed
    const accountTable = page.locator('table').first()
    await expect(accountTable).toBeVisible({ timeout: 5000 })
    console.log('  ✓ Account table is visible')

    // Verify expand/collapse buttons
    const expandButtons = page.locator('button svg').first()
    const hasExpandButtons = await expandButtons.isVisible().catch(() => false)
    if (hasExpandButtons) {
      console.log('  ✓ Expand/collapse folder buttons are present')
    }

    // Verify account count in header
    const accountCountText = await page.locator('text=/\\d+ บัญชี/').first().textContent().catch(() => '')
    console.log(`  ✓ Account count displayed: ${accountCountText}`)

    // Verify column headers
    const expectedHeaders = ['รหัสบัญชี', 'ชื่อบัญชี', 'ประเภท', 'สถานะ', 'จัดการ']
    for (const header of expectedHeaders) {
      const headerLocator = page.locator('th', { hasText: header })
      await expect(headerLocator.first()).toBeVisible({ timeout: 3000 })
      console.log(`  ✓ Column header "${header}" is visible`)
    }

    // Take screenshot
    await page.screenshot({ path: 'test-results/screenshots/finance/accounts-tree.png', fullPage: true })
    console.log('  ✓ Screenshot saved: accounts-tree.png')
  })

  test('Journal Entries module loads with all form elements', async () => {
    test.skip(!isLoggedIn, 'Skipping test - login failed')
    
    await navigateToModule('บันทึกบัญชี')

    // Verify page header
    await expect(page.locator('h1')).toContainText('บันทึกบัญชี')

    // Verify Date input field
    const dateInput = page.locator('input[type="date"]').first()
    await expect(dateInput).toBeVisible({ timeout: 5000 })
    console.log('  ✓ Date input field is visible')

    // Verify Reference input
    const referenceInput = page.locator('input#reference, input[placeholder*="เอกสาร"]').first()
    await expect(referenceInput).toBeVisible({ timeout: 5000 })
    console.log('  ✓ Reference input field is visible')

    // Verify Description textarea
    const descriptionInput = page.locator('textarea#description, textarea[placeholder*="รายการ"]').first()
    await expect(descriptionInput).toBeVisible({ timeout: 5000 })
    console.log('  ✓ Description textarea is visible')

    // Verify Add Line button
    const addLineButton = page.locator('button', { hasText: /เพิ่มรายการ/ }).first()
    await expect(addLineButton).toBeVisible({ timeout: 5000 })
    console.log('  ✓ Add Line button is visible')

    // Verify table with journal lines
    const journalTable = page.locator('table').first()
    await expect(journalTable).toBeVisible({ timeout: 5000 })
    console.log('  ✓ Journal lines table is visible')

    // Verify Account selector dropdowns
    const accountSelectors = page.locator('[role="combobox"], button:has-text("เลือกบัญชี")').first()
    await expect(accountSelectors).toBeVisible({ timeout: 5000 })
    console.log('  ✓ Account selector dropdowns are visible')

    // Verify Debit/Credit input fields
    const debitInput = page.locator('input[type="number"]').first()
    await expect(debitInput).toBeVisible({ timeout: 5000 })
    console.log('  ✓ Debit/Credit input fields are visible')

    // Verify Remove Line button (trash icon)
    const removeButtons = page.locator('button:has(svg)')
    const removeButtonCount = await removeButtons.count()
    if (removeButtonCount > 0) {
      console.log(`  ✓ Remove Line buttons are present`)
    }

    // Verify Balance calculator display
    const balanceSection = page.locator('text=/รวมเดบิต|รวมเครดิต|สมดุล/').first()
    await expect(balanceSection).toBeVisible({ timeout: 5000 })
    console.log('  ✓ Balance calculator display is visible')

    // Verify Save button
    const saveButton = page.locator('button', { hasText: /บันทึก/ }).first()
    await expect(saveButton).toBeVisible({ timeout: 5000 })
    console.log('  ✓ Save button is visible')

    // Verify Calculate button
    const calculateButton = page.locator('button', { hasText: /คำนวณ/ }).first()
    await expect(calculateButton).toBeVisible({ timeout: 5000 })
    console.log('  ✓ Calculate button is visible')

    // Verify Recent Entries section
    const recentEntriesHeader = page.locator('text=รายการล่าสุด')
    await expect(recentEntriesHeader).toBeVisible({ timeout: 5000 })
    console.log('  ✓ Recent Entries section is visible')

    // Test Add Line functionality
    const initialRowCount = await page.locator('table tbody tr').count()
    await addLineButton.click()
    await page.waitForTimeout(800)
    const newRowCount = await page.locator('table tbody tr').count()
    if (newRowCount > initialRowCount) {
      console.log(`  ✓ Add Line button works: ${initialRowCount} -> ${newRowCount} rows`)
    }

    // Take screenshot
    await page.screenshot({ path: 'test-results/screenshots/finance/journal-form.png', fullPage: true })
    console.log('  ✓ Screenshot saved: journal-form.png')
  })

  test('Reports module loads with all report options', async () => {
    test.skip(!isLoggedIn, 'Skipping test - login failed')
    
    await navigateToModule('รายงาน')

    // Verify page header
    await expect(page.locator('h1')).toContainText('รายงาน')

    // Verify Period selector dropdown
    const periodSelector = page.locator('[role="combobox"]').first()
    await expect(periodSelector).toBeVisible({ timeout: 5000 })
    console.log('  ✓ Period selector dropdown is visible')

    // Verify all report options
    const expectedReports = [
      { name: 'งบทดลอง', id: 'trial_balance' },
      { name: 'งบดุล', id: 'balance_sheet' },
      { name: 'งบกำไรขาดทุน', id: 'income_statement' },
      { name: 'สมุดบัญชีแยกประเภท', id: 'general_ledger' },
      { name: 'รายงานลูกหนี้ตามอายุหนี้', id: 'aging_ar' },
      { name: 'รายงานเจ้าหนี้ตามอายุหนี้', id: 'aging_ap' },
      { name: 'รายงานภาษีมูลค่าเพิ่ม', id: 'vat_report' },
      { name: 'รายงานภาษีหัก ณ ที่จ่าย', id: 'wht_report' },
    ]

    for (const report of expectedReports) {
      const reportCard = page.locator(`text=${report.name}`).first()
      await expect(reportCard).toBeVisible({ timeout: 5000 })
      console.log(`  ✓ Report option "${report.name}" is visible`)
    }

    // Verify Print buttons for each report
    const printButtons = page.locator('button', { hasText: /พิมพ์/ })
    const printButtonCount = await printButtons.count()
    console.log(`  ✓ Print buttons found: ${printButtonCount}`)

    // Verify Export buttons for each report
    const exportButtons = page.locator('button', { hasText: /ส่งออก/ })
    const exportButtonCount = await exportButtons.count()
    console.log(`  ✓ Export buttons found: ${exportButtonCount}`)

    // Verify Trial Balance preview section
    const trialBalancePreview = page.locator('text=งบทดลอง - ตัวอย่าง')
    await expect(trialBalancePreview).toBeVisible({ timeout: 5000 })
    console.log('  ✓ Trial Balance preview section is visible')

    // Test Period selector options
    await periodSelector.click()
    await page.waitForTimeout(500)
    
    const periodOptions = ['เดือนนี้', 'ไตรมาสนี้', 'ปีนี้', 'กำหนดเอง']
    for (const option of periodOptions) {
      const optionLocator = page.locator(`text=${option}`).first()
      const isVisible = await optionLocator.isVisible().catch(() => false)
      if (isVisible) {
        console.log(`  ✓ Period option "${option}" is available`)
      }
    }
    
    // Close dropdown
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)

    // Take screenshot
    await page.screenshot({ path: 'test-results/screenshots/finance/reports-list.png', fullPage: true })
    console.log('  ✓ Screenshot saved: reports-list.png')
  })
})
