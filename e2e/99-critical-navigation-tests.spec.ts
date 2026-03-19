import { test, expect } from '@playwright/test'

// Helper function to login
async function loginAsAdmin(page: any) {
  await page.goto('/')
  await page.waitForTimeout(1000)

  // Check if already logged in
  const sidebar = page.locator('aside nav').first()
  const hasSidebar = await sidebar.isVisible().catch(() => false)

  if (hasSidebar) {
    console.log('Already logged in')
    return
  }

  // Perform login
  await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 })
  await page.fill('input[type="email"]', 'admin@thaiaccounting.com')
  await page.fill('input[type="password"]', 'admin123')
  await page.click('button[type="submit"]')

  // Wait for dashboard to load
  await page.waitForTimeout(4000)

  // Verify login successful
  const dashboard = page.locator('aside nav').first()
  await expect(dashboard).toBeVisible({ timeout: 10000 })
  console.log('✅ Login successful')
}

test.describe.configure({ mode: 'serial' }) // Run tests serially

test.describe('Critical Navigation & Redirect Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Bypass rate limiting for automated tests
    await page.setExtraHTTPHeaders({
      'x-playwright-test': 'true'
    })
  })

  test('[CRITICAL] Login as ADMIN to test navigation', async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('[CRITICAL] Should NOT redirect to dashboard when accessing Invoices', async ({ page }) => {
    await loginAsAdmin(page)

    // Navigate to invoices
    const invoiceButton = page.locator('aside nav button').filter({ hasText: 'ใบกำกับภาษี' })
    await expect(invoiceButton).toBeVisible()
    await invoiceButton.click()
    await page.waitForTimeout(2000)

    // CRITICAL CHECK: Verify URL is /invoices, NOT /
    const currentUrl = page.url()
    console.log(`Current URL after clicking Invoices: ${currentUrl}`)

    // This will FAIL if page redirects to dashboard
    expect(currentUrl).toContain('/invoices')
    expect(currentUrl).not.toEqual('http://localhost:3000/')

    // Verify page title/content is rendered
    const pageTitle = page.locator('h1, h2').first()
    await expect(pageTitle).toBeVisible()
    const titleText = await pageTitle.textContent()
    console.log(`Page title: ${titleText}`)

    // Verify it's not the dashboard
    expect(titleText).not.toContain('ภาพรวม')
    expect(titleText).not.toContain('Dashboard')
  })

  test('[CRITICAL] Should NOT redirect to dashboard when accessing Credit Notes', async ({ page }) => {
    await loginAsAdmin(page)

    // Navigate to credit notes
    const creditNoteButton = page.locator('aside nav button').filter({ hasText: 'ใบลดหนี้' })
    await expect(creditNoteButton).toBeVisible()
    await creditNoteButton.click()
    await page.waitForTimeout(2000)

    // CRITICAL CHECK: Verify URL is /credit-notes, NOT /
    const currentUrl = page.url()
    console.log(`Current URL after clicking Credit Notes: ${currentUrl}`)

    // This will FAIL if page redirects to dashboard
    expect(currentUrl).toContain('/credit-notes')
    expect(currentUrl).not.toEqual('http://localhost:3000/')

    // Verify page title/content is rendered
    const pageTitle = page.locator('h1, h2').first()
    await expect(pageTitle).toBeVisible()
    const titleText = await pageTitle.textContent()
    console.log(`Page title: ${titleText}`)

    // Verify it's not the dashboard
    expect(titleText).not.toContain('ภาพรวม')
    expect(titleText).not.toContain('Dashboard')
  })

  test('[CRITICAL] Should NOT redirect to dashboard when accessing Debit Notes', async ({ page }) => {
    await loginAsAdmin(page)

    // Navigate to debit notes
    const debitNoteButton = page.locator('aside nav button').filter({ hasText: 'ใบเพิ่มหนี้' })
    await expect(debitNoteButton).toBeVisible()
    await debitNoteButton.click()
    await page.waitForTimeout(2000)

    // CRITICAL CHECK: Verify URL is /debit-notes, NOT /
    const currentUrl = page.url()
    console.log(`Current URL after clicking Debit Notes: ${currentUrl}`)

    // This will FAIL if page redirects to dashboard
    expect(currentUrl).toContain('/debit-notes')
    expect(currentUrl).not.toEqual('http://localhost:3000/')

    // Verify page title/content is rendered
    const pageTitle = page.locator('h1, h2').first()
    await expect(pageTitle).toBeVisible()
    const titleText = await pageTitle.textContent()
    console.log(`Page title: ${titleText}`)

    // Verify it's not the dashboard
    expect(titleText).not.toContain('ภาพรวม')
    expect(titleText).not.toContain('Dashboard')
  })

  test('[CRITICAL] Should NOT redirect to dashboard when accessing Customers (AR)', async ({ page }) => {
    await loginAsAdmin(page)

    // Navigate to customers - note: UI shows "ลูกค้า" not "ลูกหนี้"
    const customerButton = page.locator('aside nav button').filter({ hasText: 'ลูกค้า' })
    await expect(customerButton).toBeVisible()
    await customerButton.click()
    await page.waitForTimeout(2000)

    // CRITICAL CHECK: Verify URL is /customers, NOT /
    const currentUrl = page.url()
    console.log(`Current URL after clicking Customers: ${currentUrl}`)

    // This will FAIL if page redirects to dashboard
    expect(currentUrl).toContain('/customers')
    expect(currentUrl).not.toEqual('http://localhost:3000/')

    // Verify page content is rendered
    const pageTitle = page.locator('h1, h2').first()
    await expect(pageTitle).toBeVisible()
  })

  test('[CRITICAL] Should NOT redirect to dashboard when accessing Vendors (AP)', async ({ page }) => {
    await loginAsAdmin(page)

    // Navigate to vendors - note: UI shows "ผู้ขาย" not "เจ้าหนี้"
    const vendorButton = page.locator('aside nav button').filter({ hasText: 'ผู้ขาย' })
    await expect(vendorButton).toBeVisible()
    await vendorButton.click()
    await page.waitForTimeout(2000)

    // CRITICAL CHECK: Verify URL is /vendors, NOT /
    const currentUrl = page.url()
    console.log(`Current URL after clicking Vendors: ${currentUrl}`)

    // This will FAIL if page redirects to dashboard
    expect(currentUrl).toContain('/vendors')
    expect(currentUrl).not.toEqual('http://localhost:3000/')

    // Verify page content is rendered
    const pageTitle = page.locator('h1, h2').first()
    await expect(pageTitle).toBeVisible()
  })

  test('[CRITICAL] Verify all main sections do NOT redirect to dashboard', async ({ page }) => {
    await loginAsAdmin(page)

    // Test all critical sections
    const sections = [
      { name: 'Invoices', selector: 'ใบกำกับภาษี', urlPart: '/invoices' },
      { name: 'Credit Notes', selector: 'ใบลดหนี้', urlPart: '/credit-notes' },
      { name: 'Debit Notes', selector: 'ใบเพิ่มหนี้', urlPart: '/debit-notes' },
      { name: 'Customers', selector: 'ลูกค้า', urlPart: '/customers' }, // UI shows "ลูกค้า"
      { name: 'Vendors', selector: 'ผู้ขาย', urlPart: '/vendors' }, // UI shows "ผู้ขาย"
      { name: 'Inventory', selector: 'สต็อกสินค้า', urlPart: '/inventory' },
      { name: 'Banking', selector: 'ธนาคาร', urlPart: '/banking' },
    ]

    for (const section of sections) {
      console.log(`\nTesting: ${section.name}`)

      // Navigate to section
      const button = page.locator('aside nav button').filter({ hasText: section.selector })
      await expect(button).toBeVisible()
      await button.click()
      await page.waitForTimeout(2000)

      // Verify URL
      const currentUrl = page.url()
      expect(currentUrl).toContain(section.urlPart)
      expect(currentUrl).not.toEqual('http://localhost:3000/')

      // Verify page content
      const pageTitle = page.locator('h1, h2').first()
      await expect(pageTitle).toBeVisible()

      console.log(`✅ ${section.name} - Navigation successful, no redirect`)
    }
  })
})

test.describe('Document Type Filtering Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.setExtraHTTPHeaders({
      'x-playwright-test': 'true'
    })
    await loginAsAdmin(page)
  })

  test('[FILTERING] Invoices section should NOT show Credit Notes or Debit Notes', async ({ page }) => {
    // Navigate to invoices
    const invoiceButton = page.locator('aside nav button').filter({ hasText: 'ใบกำกับภาษี' })
    await invoiceButton.click()
    await page.waitForTimeout(2000)

    // Wait for data to load
    await page.waitForSelector('table', { timeout: 10000 }).catch(() => {
      console.log('No table found, might be empty list')
    })

    // Check for any credit notes or debit notes in the page
    const creditNoteText = await page.locator('body').textContent()

    // These texts should NOT appear in the invoice list
    const hasCreditNoteType = creditNoteText.includes('CREDIT_NOTE')
    const hasDebitNoteType = creditNoteText.includes('DEBIT_NOTE')

    // Log what we found
    console.log(`Page contains CREDIT_NOTE: ${hasCreditNoteType}`)
    console.log(`Page contains DEBIT_NOTE: ${hasDebitNoteType}`)

    // Verify CN/DN are not shown as document types
    // Note: This checks if the actual text "CREDIT_NOTE" or "DEBIT_NOTE" appears
    // which would indicate the wrong document type is being displayed
    if (hasCreditNoteType || hasDebitNoteType) {
      // Take screenshot for debugging
      await page.screenshot({
        path: 'test-results/invoices-showing-cn-dn.png',
        fullPage: true
      })

      throw new Error('Invoice section should not show Credit Notes or Debit Notes!')
    }

    console.log('✅ Invoice section correctly filtered - no CN/DN shown')
  })

  test('[FILTERING] Credit Notes section should only show Credit Notes', async ({ page }) => {
    // Navigate to credit notes
    const creditNoteButton = page.locator('aside nav button').filter({ hasText: 'ใบลดหนี้' })
    await creditNoteButton.click()
    await page.waitForTimeout(2000)

    // Verify URL
    expect(page.url()).toContain('/credit-notes')

    // Verify page title in main content (not sidebar)
    const pageTitle = page.locator('main h1')
    await expect(pageTitle).toBeVisible()
    const titleText = await pageTitle.textContent()
    expect(titleText).toContain('ใบลดหนี้')

    console.log('✅ Credit Notes section shows correct content')
  })

  test('[FILTERING] Debit Notes section should only show Debit Notes', async ({ page }) => {
    // Navigate to debit notes
    const debitNoteButton = page.locator('aside nav button').filter({ hasText: 'ใบเพิ่มหนี้' })
    await debitNoteButton.click()
    await page.waitForTimeout(2000)

    // Verify URL
    expect(page.url()).toContain('/debit-notes')

    // Verify page title in main content (not sidebar)
    const pageTitle = page.locator('main h1')
    await expect(pageTitle).toBeVisible()
    const titleText = await pageTitle.textContent()
    expect(titleText).toContain('ใบเพิ่มหนี้')

    console.log('✅ Debit Notes section shows correct content')
  })
})
