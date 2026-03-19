import { test, expect } from '@playwright/test'

test('UI Diagnostic - Check sidebar structure', async ({ page }) => {
  // Login
  await page.goto('/')
  await page.fill('input[type="email"]', 'admin@thaiaccounting.com')
  await page.fill('input[type="password"]', 'admin123')
  await page.click('button[type="submit"]')
  await page.waitForTimeout(3000)
  
  // Take initial screenshot
  await page.screenshot({ path: 'test-results/diagnostic-dashboard.png' })
  
  // Get all button text in sidebar
  const sidebarButtons = await page.locator('aside nav button').allTextContents()
  console.log('Sidebar buttons:', sidebarButtons)
  
  // Check which buttons are visible
  const allButtons = await page.locator('button').allTextContents()
  console.log('All buttons:', allButtons.slice(0, 30))
  
  // Try to click Journal by index
  const navButtons = page.locator('aside nav button')
  const count = await navButtons.count()
  console.log(`Found ${count} nav buttons`)
  
  // Click second button (Journal)
  if (count > 2) {
    await navButtons.nth(2).click()
    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'test-results/diagnostic-journal.png' })
    console.log('✅ Journal clicked via index')
  }
})

test('Test create buttons on invoices', async ({ page }) => {
  // Login
  await page.goto('/')
  await page.fill('input[type="email"]', 'admin@thaiaccounting.com')
  await page.fill('input[type="password"]', 'admin123')
  await page.click('button[type="submit"]')
  await page.waitForTimeout(3000)
  
  // Navigate to invoices
  const navButtons = page.locator('aside nav button')
  await navButtons.nth(3).click() // Invoices
  await page.waitForTimeout(2000)
  
  await page.screenshot({ path: 'test-results/diagnostic-invoices.png' })
  
  // Find all buttons on the page
  const allButtons = await page.locator('button').allTextContents()
  console.log('All buttons on invoices page:', allButtons)
  
  // Look for create button
  const createButton = page.locator('button').filter({ hasText: /สร้าง|เพิ่ม|new/i })
  console.log('Create buttons found:', await createButton.count())
  
  if (await createButton.count() > 0) {
    await createButton.first().click()
    await page.waitForTimeout(1500)
    await page.screenshot({ path: 'test-results/diagnostic-create-invoice.png' })
    console.log('✅ Create button clicked')
  }
})
