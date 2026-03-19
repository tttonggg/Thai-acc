import { test, expect } from '@playwright/test'

test.describe('Credit Notes & Debit Notes - Root Cause Analysis', () => {
  test('deep dive: check CN/DN API responses', async ({ page }) => {
    // First, login to get a session
    await page.goto('http://localhost:3000')

    // Check if already logged in or on login page
    const currentUrl = page.url()
    console.log('Current URL:', currentUrl)

    if (currentUrl.includes('/dashboard') || currentUrl === 'http://localhost:3000/') {
      console.log('✅ Already logged in')
    } else {
      console.log('🔐 Need to login...')

      // Use placeholder-based selectors
      await page.fill('input[placeholder*="email"]', 'admin@thaiaccounting.com')
      await page.fill('input[placeholder*="•••"]', 'admin123')
      await page.click('button:has-text("เข้าสู่ระบบ")')

      // Wait for navigation
      await page.waitForURL('http://localhost:3000/', { timeout: 10000 })
      console.log('✅ Logged in successfully')
    }

    // Monitor console errors
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
        console.log('❌ Console Error:', msg.text())
      }
    })

    // Test Credit Notes API
    console.log('\n📝 Testing Credit Notes...')
    await page.goto('http://localhost:3000/credit-notes')
    await page.waitForTimeout(2000)

    const cnErrors = errors.filter(e =>
      e.includes('Unexpected data format') ||
      e.includes('Fetch failed') ||
      e.includes('customers.map') ||
      e.includes('customers.filter')
    )

    console.log('Credit Notes errors:', cnErrors)
    console.log('Total console errors:', errors.length)

    // Test Debit Notes API
    errors.length = 0 // Clear errors
    await page.goto('http://localhost:3000/debit-notes')
    await page.waitForTimeout(2000)

    const dnErrors = errors.filter(e =>
      e.includes('Unexpected data format') ||
      e.includes('Fetch failed') ||
      e.includes('vendors.map') ||
      e.includes('vendors.filter')
    )

    console.log('Debit Notes errors:', dnErrors)

    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/cn-dn-state.png' })

    expect(cnErrors.length + dnErrors.length).toBe(0)
  })

  test('direct API test: check response structure', async ({ request }) => {
    // This test checks the actual API response structure

    // Note: This will fail without auth, but we can see the response
    const context = await request.newContext({
      ignoreHTTPSErrors: true
    })

    try {
      // Test Credit Notes API
      const cnResponse = await context.fetch('http://localhost:3000/api/credit-notes?limit=10')
      const cnStatus = cnResponse.status()
      const cnData = await cnResponse.text()

      console.log('\n📝 Credit Notes API:')
      console.log('Status:', cnStatus)
      console.log('Response (first 200 chars):', cnData.substring(0, 200))

      // Test Debit Notes API
      const dnResponse = await context.fetch('http://localhost:3000/api/debit-notes?limit=10')
      const dnStatus = dnResponse.status()
      const dnData = await dnResponse.text()

      console.log('\n📝 Debit Notes API:')
      console.log('Status:', dnStatus)
      console.log('Response (first 200 chars):', dnData.substring(0, 200))

      // Parse JSON if possible
      try {
        const cnJson = JSON.parse(cnData)
        console.log('Credit Notes has success?', 'success' in cnJson)
        console.log('Credit Notes has data?', 'data' in cnJson)
        if ('data' in cnJson) {
          console.log('Credit Notes data type:', Array.isArray(cnJson.data) ? 'array' : typeof cnJson.data)
        }
      } catch (e) {
        console.log('Credit Notes: Not JSON')
      }

      try {
        const dnJson = JSON.parse(dnData)
        console.log('Debit Notes has success?', 'success' in dnJson)
        console.log('Debit Notes has data?', 'data' in dnJson)
        if ('data' in dnJson) {
          console.log('Debit Notes data type:', Array.isArray(dnJson.data) ? 'array' : typeof dnJson.data)
        }
      } catch (e) {
        console.log('Debit Notes: Not JSON')
      }

    } finally {
      await context.close()
    }
  })
})
