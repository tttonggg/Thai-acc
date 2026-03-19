import { test, expect } from '@playwright/test'

test.describe('Test Create Buttons', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.fill('input[type="email"]', 'admin@thaiaccounting.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(3000)
  })

  test('Create Invoice button', async ({ page }) => {
    // Navigate to Invoices (4th button - index 3)
    const navButtons = page.locator('aside nav button')
    await navButtons.nth(3).click()
    await page.waitForTimeout(2000)
    
    await page.screenshot({ path: 'test-results/before-create-invoice.png' })
    
    // Look for create button with various Thai text patterns
    const createBtn = page.locator('button').filter({ hasText: /สร้าง|เพิ่ม|New/i }).first()
    
    if (await createBtn.count() > 0) {
      await createBtn.click()
      await page.waitForTimeout(2000)
      await page.screenshot({ path: 'test-results/after-create-invoice.png' })
      
      // Check if dialog/form opened
      const dialog = await page.locator('[role="dialog"]').count()
      console.log(`✅ Create Invoice: Dialog count: ${dialog}`)
      expect(dialog).toBeGreaterThan(0)
    } else {
      console.log('❌ Create Invoice button not found')
      throw new Error('Create button not found')
    }
  })

  test('Create Customer button', async ({ page }) => {
    // Navigate to Customers (7th button - index 6)
    const navButtons = page.locator('aside nav button')
    await navButtons.nth(6).click()
    await page.waitForTimeout(2000)
    
    await page.screenshot({ path: 'test-results/before-create-customer.png' })
    
    // Look for create button
    const createBtn = page.locator('button').filter({ hasText: /สร้าง|เพิ่ม|New/i }).first()
    
    if (await createBtn.count() > 0) {
      await createBtn.click()
      await page.waitForTimeout(2000)
      await page.screenshot({ path: 'test-results/after-create-customer.png' })
      
      const dialog = await page.locator('[role="dialog"]').count()
      console.log(`✅ Create Customer: Dialog count: ${dialog}`)
      expect(dialog).toBeGreaterThan(0)
    } else {
      console.log('❌ Create Customer button not found')
      throw new Error('Create button not found')
    }
  })

  test('Create Vendor button', async ({ page }) => {
    // Navigate to Vendors (8th button - index 7)
    const navButtons = page.locator('aside nav button')
    await navButtons.nth(7).click()
    await page.waitForTimeout(2000)
    
    await page.screenshot({ path: 'test-results/before-create-vendor.png' })
    
    // Look for create button
    const createBtn = page.locator('button').filter({ hasText: /สร้าง|เพิ่ม|New/i }).first()
    
    if (await createBtn.count() > 0) {
      await createBtn.click()
      await page.waitForTimeout(2000)
      await page.screenshot({ path: 'test-results/after-create-vendor.png' })
      
      const dialog = await page.locator('[role="dialog"]').count()
      console.log(`✅ Create Vendor: Dialog count: ${dialog}`)
      expect(dialog).toBeGreaterThan(0)
    } else {
      console.log('❌ Create Vendor button not found')
      throw new Error('Create button not found')
    }
  })

  test('Create Journal Entry button', async ({ page }) => {
    // Navigate to Journal (3rd button - index 2)
    const navButtons = page.locator('aside nav button')
    await navButtons.nth(2).click()
    await page.waitForTimeout(2000)
    
    await page.screenshot({ path: 'test-results/before-create-journal.png' })
    
    // Look for create button
    const createBtn = page.locator('button').filter({ hasText: /สร้าง|เพิ่ม|New|บันทึก/i }).first()
    
    if (await createBtn.count() > 0) {
      await createBtn.click()
      await page.waitForTimeout(2000)
      await page.screenshot({ path: 'test-results/after-create-journal.png' })
      
      const dialog = await page.locator('[role="dialog"]').count()
      console.log(`✅ Create Journal: Dialog count: ${dialog}`)
      expect(dialog).toBeGreaterThan(0)
    } else {
      console.log('❌ Create Journal button not found')
      throw new Error('Create button not found')
    }
  })
})
