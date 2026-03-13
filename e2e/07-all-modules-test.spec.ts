import { test, expect } from '@playwright/test'

// All navigation items to test
const ALL_MODULES = [
  { id: 'dashboard', thaiLabel: 'ภาพรวม', englishLabel: 'Dashboard' },
  { id: 'accounts', thaiLabel: 'ผังบัญชี', englishLabel: 'Chart of Accounts' },
  { id: 'journal', thaiLabel: 'บันทึกบัญชี', englishLabel: 'Journal Entries' },
  { id: 'invoices', thaiLabel: 'ใบกำกับภาษี', englishLabel: 'Invoices' },
  { id: 'vat', thaiLabel: 'ภาษีมูลค่าเพิ่ม', englishLabel: 'VAT' },
  { id: 'wht', thaiLabel: 'ภาษีหัก ณ ที่จ่าย', englishLabel: 'Withholding Tax' },
  { id: 'customers', thaiLabel: 'ลูกหนี้ (AR)', englishLabel: 'Customers' },
  { id: 'vendors', thaiLabel: 'เจ้าหนี้ (AP)', englishLabel: 'Vendors' },
  { id: 'inventory', thaiLabel: 'สต็อกสินค้า', englishLabel: 'Inventory' },
  { id: 'banking', thaiLabel: 'ธนาคาร', englishLabel: 'Banking' },
  { id: 'assets', thaiLabel: 'ทรัพย์สินถาวร', englishLabel: 'Fixed Assets' },
  { id: 'payroll', thaiLabel: 'เงินเดือน', englishLabel: 'Payroll' },
  { id: 'petty-cash', thaiLabel: 'เงินสดย่อย', englishLabel: 'Petty Cash' },
  { id: 'reports', thaiLabel: 'รายงาน', englishLabel: 'Reports' },
  { id: 'settings', thaiLabel: 'ตั้งค่า', englishLabel: 'Settings' },
  { id: 'users', thaiLabel: 'จัดการผู้ใช้', englishLabel: 'User Management' },
]

// Helper function to login
async function loginAsAdmin(page: any) {
  await page.setExtraHTTPHeaders({
    'x-playwright-test': 'true'
  })

  await page.goto('/')
  await page.waitForTimeout(1000)

  // Check if already logged in
  const sidebar = page.locator('aside nav').first()
  const hasSidebar = await sidebar.isVisible().catch(() => false)

  if (hasSidebar) {
    return
  }

  // Perform login
  await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 })
  await page.fill('input[type="email"]', 'admin@thaiaccounting.com')
  await page.fill('input[type="password"]', 'admin123')
  await page.click('button[type="submit"]')

  // Wait for dashboard to load
  await page.waitForTimeout(4000)
  await expect(sidebar).toBeVisible({ timeout: 10000 })
}

test.describe.configure({ mode: 'serial' })

test.describe('Comprehensive Module Check', () => {
  const results: any[] = []

  test('[LOGIN] Login once at the beginning', async ({ page }) => {
    await loginAsAdmin(page)
    console.log('✅ Login successful')
  })

  for (const module of ALL_MODULES) {
    test(`[TEST] ${module.id} - ${module.englishLabel}`, async ({ page }) => {
      // Already logged in from first test
      await page.goto('/')
      await page.waitForTimeout(1000)

      // Find and click the navigation button
      const buttons = page.locator('aside nav button')
      const count = await buttons.count()

      let foundButton = null
      for (let i = 0; i < count; i++) {
        const button = buttons.nth(i)
        const text = await button.textContent()

        if (text && (text.includes(module.thaiLabel) || text.includes(module.englishLabel))) {
          foundButton = button
          break
        }
      }

      if (!foundButton) {
        results.push({ module: module.id, status: 'FAILED', error: 'Button not found' })
        console.log(`❌ ${module.id} - Button not found`)
        throw new Error(`Navigation button not found`)
      }

      // Click the button
      await foundButton.click()

      // Wait for content to load
      await page.waitForTimeout(2000)

      // Check if page crashed (URL still valid)
      const currentUrl = page.url()
      const isStillValid = currentUrl.includes('localhost')

      // Take screenshot
      const screenshotPath = `test-results/modules/${module.id}-module.png`
      await page.screenshot({ path: screenshotPath, fullPage: false })

      // Check for error indicators in the page
      const hasError = await page.locator('text=เกิดข้อผิดพลาด, text=Error, text=error').count() > 0

      if (!isStillValid) {
        results.push({ module: module.id, status: 'CRASHED', error: 'Page became unresponsive' })
        console.log(`❌ ${module.id} - Page crashed`)
        throw new Error('Page crashed')
      } else if (hasError) {
        results.push({ module: module.id, status: 'ERROR', error: 'Error message displayed on page' })
        console.log(`⚠️ ${module.id} - Has error message`)
      } else {
        results.push({ module: module.id, status: 'OK', error: null })
        console.log(`✅ ${module.id} - Working`)
      }
    })
  }

  test('[SUMMARY] Generate comprehensive report', async ({ page }) => {
    console.log('\n==========================================')
    console.log('COMPREHENSIVE MODULE TEST REPORT')
    console.log('==========================================')

    const working = results.filter(r => r.status === 'OK')
    const failed = results.filter(r => r.status !== 'OK')

    console.log(`\nTotal Modules: ${results.length}`)
    console.log(`Working: ${working.length}`)
    console.log(`Failed: ${failed.length}`)
    console.log('\n==========================================')

    if (failed.length > 0) {
      console.log('\nFAILED MODULES:')
      for (const f of failed) {
        console.log(`  ❌ ${f.module} - ${f.status}: ${f.error}`)
      }
    }

    console.log('\n==========================================')
    console.log('WORKING MODULES:')
    for (const w of working) {
      console.log(`  ✅ ${w.module}`)
    }
    console.log('==========================================\n')

    // Take a final screenshot of the application state
    await page.screenshot({ path: 'test-results/modules/final-state.png', fullPage: false })
  })
})
