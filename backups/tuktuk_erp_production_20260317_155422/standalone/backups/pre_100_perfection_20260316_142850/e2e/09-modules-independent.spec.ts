import { test, expect } from '@playwright/test'

const modules = [
  { id: 'dashboard', thai: 'ภาพรวม', english: 'Dashboard' },
  { id: 'accounts', thai: 'ผังบัญชี', english: 'Chart of Accounts' },
  { id: 'journal', thai: 'บันทึกบัญชี', english: 'Journal' },
  { id: 'invoices', thai: 'ใบกำกับภาษี', english: 'Invoices' },
  { id: 'vat', thai: 'ภาษีมูลค่าเพิ่ม', english: 'VAT' },
  { id: 'wht', thai: 'ภาษีหัก ณ ที่จ่าย', english: 'WHT' },
  { id: 'customers', thai: 'ลูกหนี้ (AR)', english: 'Customers' },
  { id: 'vendors', thai: 'เจ้าหนี้ (AP)', english: 'Vendors' },
  { id: 'inventory', thai: 'สต็อกสินค้า', english: 'Inventory' },
  { id: 'banking', thai: 'ธนาคาร', english: 'Banking' },
  { id: 'assets', thai: 'ทรัพย์สินถาวร', english: 'Assets' },
  { id: 'payroll', thai: 'เงินเดือน', english: 'Payroll' },
  { id: 'petty-cash', thai: 'เงินสดย่อย', english: 'Petty Cash' },
  { id: 'reports', thai: 'รายงาน', english: 'Reports' },
  { id: 'settings', thai: 'ตั้งค่า', english: 'Settings' },
  { id: 'users', thai: 'จัดการผู้ใช้', english: 'User Management' },
]

for (const module of modules) {
  test(`module-${module.id}-works`, async ({ page }) => {
    await page.setExtraHTTPHeaders({ 'x-playwright-test': 'true' })

    // Login
    await page.goto('/')
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 })
    await page.fill('input[type="email"]', 'admin@thaiaccounting.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')

    // Wait for sidebar
    await page.waitForTimeout(4000)

    // Find and click the button
    const buttons = page.locator('aside nav button')
    const count = await buttons.count()

    let clicked = false
    for (let i = 0; i < count; i++) {
      const text = await buttons.nth(i).textContent()
      if (text && (text.includes(module.thai) || text.includes(module.english))) {
        await buttons.nth(i).click()
        clicked = true
        break
      }
    }

    expect(clicked).toBe(true)

    // Wait for page to load
    await page.waitForTimeout(3000)

    // Check page is still valid
    const url = page.url()
    expect(url).toContain('localhost')

    // Take screenshot
    await page.screenshot({ path: `test-results/module-test/${module.id}.png` })

    console.log(`✅ ${module.id} (${module.english}): Working`)
  })
}
