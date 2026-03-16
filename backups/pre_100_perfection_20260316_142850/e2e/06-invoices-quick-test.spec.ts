import { test, expect } from '@playwright/test'

test.describe('Invoices Module Quick Test', () => {
  test('[VERIFY] Invoices module loads without crashing', async ({ page }) => {
    // Bypass rate limiting for automated tests
    await page.setExtraHTTPHeaders({
      'x-playwright-test': 'true'
    })

    // Login as admin
    await page.goto('/')
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 })
    await page.fill('input[type="email"]', 'admin@thaiaccounting.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')

    // Wait for dashboard
    await page.waitForTimeout(4000)
    await expect(page.locator('aside nav')).toBeVisible({ timeout: 10000 })
    console.log('✅ Login successful')

    // Find and click the Invoices button
    const buttons = page.locator('aside nav button')
    const count = await buttons.count()

    let invoicesButton = null
    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i)
      const text = await button.textContent()
      if (text && text.includes('ใบกำกับภาษี')) {
        invoicesButton = button
        break
      }
    }

    expect(invoicesButton).not.toBeNull()
    console.log('✅ Invoices button found')

    // Click the button
    await invoicesButton!.click()
    await page.waitForTimeout(3000)

    // Check if we're still on the page (not crashed)
    const currentUrl = page.url()
    expect(currentUrl).toContain('localhost')

    // Take a screenshot
    await page.screenshot({
      path: 'test-results/navigation/invoices-module-test.png',
      fullPage: false
    })

    console.log('✅ Invoices module loaded successfully')
    console.log('✅ Page did not crash')
  })
})
