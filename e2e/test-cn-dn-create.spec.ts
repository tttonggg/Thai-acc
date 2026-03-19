import { test, expect } from '@playwright/test'

test.describe('Credit Notes & Debit Notes - Create Form Test', () => {
  test.beforeEach(async ({ page }) => {
    // Go to login page first
    await page.goto('http://localhost:3000')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Check if we need to login
    const currentUrl = page.url()
    if (!currentUrl.includes('/dashboard') && !currentUrl.includes('login')) {
      // Try to find email input
      const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email"]').first()
      const isVisible = await emailInput.isVisible().catch(() => false)

      if (isVisible) {
        await emailInput.fill('admin@thaiaccounting.com')

        // Find password input
        const passwordInput = page.locator('input[type="password"], input[name="password"], input[placeholder*="•••"]').first()
        await passwordInput.fill('admin123')

        // Click login button
        const loginButton = page.locator('button:has-text("เข้าสู่ระบบ"), button[type="submit"]').first()
        await loginButton.click()

        // Wait for navigation
        await page.waitForURL('http://localhost:3000/', { timeout: 10000 })
        console.log('✅ Logged in successfully')
      }
    }
  })

  test('should open Debit Note form without errors', async ({ page }) => {
    // Monitor console errors
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text()
        errors.push(text)
        console.log('❌ Console Error:', text)
      }
    })

    // Navigate to Debit Notes
    await page.goto('http://localhost:3000/debit-notes')
    await page.waitForTimeout(2000)

    // Click "Create New" button - Look for specific Thai text
    const createButton = page.locator('button:has-text("สร้างใบเพิ่มหนี้")').first()
    await createButton.click()
    await page.waitForTimeout(3000)

    // Check for specific errors
    const vendorMapErrors = errors.filter(e => e.includes('vendors.map is not a function'))
    const productFilterErrors = errors.filter(e => e.includes('products.filter is not a function'))

    console.log('Total console errors:', errors.length)
    console.log('vendors.map errors:', vendorMapErrors.length)
    console.log('products.filter errors:', productFilterErrors.length)

    // Take screenshot
    await page.screenshot({ path: 'test-results/debit-note-form-state.png' })

    // Verify no critical errors
    expect(vendorMapErrors.length).toBe(0)
    expect(productFilterErrors.length).toBe(0)
  })

  test('should open Credit Note form without errors', async ({ page }) => {
    // Monitor console errors
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text()
        errors.push(text)
        console.log('❌ Console Error:', text)
      }
    })

    // Navigate to Credit Notes
    await page.goto('http://localhost:3000/credit-notes')
    await page.waitForTimeout(2000)

    // Click "Create New" button - Look for specific Thai text
    const createButton = page.locator('button:has-text("สร้างใบลดหนี้")').first()
    await createButton.click()
    await page.waitForTimeout(3000)

    // Check for specific errors
    const customerMapErrors = errors.filter(e => e.includes('customers.map is not a function'))
    const productFilterErrors = errors.filter(e => e.includes('products.filter is not a function'))

    console.log('Total console errors:', errors.length)
    console.log('customers.map errors:', customerMapErrors.length)
    console.log('products.filter errors:', productFilterErrors.length)

    // Take screenshot
    await page.screenshot({ path: 'test-results/credit-note-form-state.png' })

    // Verify no critical errors
    expect(customerMapErrors.length).toBe(0)
    expect(productFilterErrors.length).toBe(0)
  })
})
