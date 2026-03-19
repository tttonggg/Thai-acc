import { test, expect } from '@playwright/test'

test.describe('CN/DN Forms - Error Check', () => {
  test('Debit Note Form - Check for vendors.map and products.filter errors', async ({ page }) => {
    // Monitor console errors BEFORE any navigation
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text()
        errors.push(text)
        console.log('❌ Console Error:', text)
      }
    })

    // Go to home and login
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')

    // Check if we need to login
    const emailInput = page.locator('input[type="email"], input[name="email"]').first()
    const emailVisible = await emailInput.isVisible().catch(() => false)

    if (emailVisible) {
      await emailInput.fill('admin@thaiaccounting.com')
      await page.locator('input[type="password"], input[name="password"]').first().fill('admin123')
      await page.locator('button:has-text("เข้าสู่ระบบ")').click()
      await page.waitForURL('http://localhost:3000/', { timeout: 10000 })
      console.log('✅ Logged in')
    }

    // Clear errors from login
    errors.length = 0

    // Navigate to Debit Notes
    await page.goto('http://localhost:3000/debit-notes')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(3000)

    // Try to find and click the create button - wait up to 10 seconds
    try {
      const button = page.locator('button:has-text("สร้างใบเพิ่มหนี้")')
      await button.waitFor({ state: 'visible', timeout: 10000 })
      await button.click()
      console.log('✅ Clicked create button')
      await page.waitForTimeout(3000)
    } catch (e) {
      console.log('⚠️  Could not find or click button:', e)
      // Take screenshot to debug
      await page.screenshot({ path: 'test-results/debit-notes-page-state.png' })
    }

    // Check for the specific errors
    const vendorMapErrors = errors.filter(e => e.includes('vendors.map is not a function'))
    const productFilterErrors = errors.filter(e => e.includes('products.filter is not a function'))

    console.log('\n📊 Error Summary:')
    console.log('Total errors:', errors.length)
    console.log('vendors.map errors:', vendorMapErrors.length)
    console.log('products.filter errors:', productFilterErrors.length)

    if (vendorMapErrors.length > 0) {
      console.log('❌ vendors.map errors found:', vendorMapErrors)
    }

    if (productFilterErrors.length > 0) {
      console.log('❌ products.filter errors found:', productFilterErrors)
    }

    // These should be 0 now!
    expect(vendorMapErrors.length, 'vendors.map errors should be 0').toBe(0)
    expect(productFilterErrors.length, 'products.filter errors should be 0').toBe(0)
  })

  test('Credit Note Form - Check for customers.map and products.filter errors', async ({ page }) => {
    // Monitor console errors BEFORE any navigation
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text()
        errors.push(text)
        console.log('❌ Console Error:', text)
      }
    })

    // Go to home and login
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')

    // Check if we need to login
    const emailInput = page.locator('input[type="email"], input[name="email"]').first()
    const emailVisible = await emailInput.isVisible().catch(() => false)

    if (emailVisible) {
      await emailInput.fill('admin@thaiaccounting.com')
      await page.locator('input[type="password"], input[name="password"]').first().fill('admin123')
      await page.locator('button:has-text("เข้าสู่ระบบ")').click()
      await page.waitForURL('http://localhost:3000/', { timeout: 10000 })
      console.log('✅ Logged in')
    }

    // Clear errors from login
    errors.length = 0

    // Navigate to Credit Notes
    await page.goto('http://localhost:3000/credit-notes')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(3000)

    // Try to find and click the create button
    try {
      const button = page.locator('button:has-text("สร้างใบลดหนี้")')
      await button.waitFor({ state: 'visible', timeout: 10000 })
      await button.click()
      console.log('✅ Clicked create button')
      await page.waitForTimeout(3000)
    } catch (e) {
      console.log('⚠️  Could not find or click button:', e)
      // Take screenshot to debug
      await page.screenshot({ path: 'test-results/credit-notes-page-state.png' })
    }

    // Check for the specific errors
    const customerMapErrors = errors.filter(e => e.includes('customers.map is not a function'))
    const productFilterErrors = errors.filter(e => e.includes('products.filter is not a function'))

    console.log('\n📊 Error Summary:')
    console.log('Total errors:', errors.length)
    console.log('customers.map errors:', customerMapErrors.length)
    console.log('products.filter errors:', productFilterErrors.length)

    if (customerMapErrors.length > 0) {
      console.log('❌ customers.map errors found:', customerMapErrors)
    }

    if (productFilterErrors.length > 0) {
      console.log('❌ products.filter errors found:', productFilterErrors)
    }

    // These should be 0 now!
    expect(customerMapErrors.length, 'customers.map errors should be 0').toBe(0)
    expect(productFilterErrors.length, 'products.filter errors should be 0').toBe(0)
  })
})
