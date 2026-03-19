import { test, expect } from '@playwright/test'

test.describe('Full Navigation and Button Test', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/')
    await page.fill('input[type="email"]', 'admin@thaiaccounting.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(3000)
  })

  // ============================================
  // SIDEBAR NAVIGATION TESTS
  // ============================================
  const modules = [
    { name: 'Dashboard', selector: 'text=ภาพรวม' },
    { name: 'Chart of Accounts', selector: 'text=ผังบัญชี' },
    { name: 'Journal', selector: 'text=บันทึกบัญชี' },
    { name: 'Invoices', selector: 'text=ใบกำกับภาษี' },
    { name: 'VAT', selector: 'text=ภาษีมูลค่าเพิ่ม' },
    { name: 'WHT', selector: 'text=ภาษีหัก ณ ที่จ่าย' },
    { name: 'Customers', selector: 'text=ลูกหนี้' },
    { name: 'Vendors', selector: 'text=เจ้าหนี้' },
    { name: 'Payments', selector: 'text=ใบจ่ายเงิน' },
    { name: 'Inventory', selector: 'text=สต็อกสินค้า' },
    { name: 'Banking', selector: 'text=ธนาคาร' },
    { name: 'Assets', selector: 'text=ทรัพย์สิน' },
    { name: 'Payroll', selector: 'text=เงินเดือน' },
    { name: 'Petty Cash', selector: 'text=เงินสดย่อย' },
    { name: 'Reports', selector: 'text=รายงาน' },
    { name: 'Settings', selector: 'text=ตั้งค่า' },
  ]
  
  for (const module of modules) {
    test(`Navigate to ${module.name}`, async ({ page }) => {
      try {
        // Wait for the element to be visible and click
        await page.locator(module.selector).first().waitFor({ timeout: 10000 })
        await page.click(module.selector)
        await page.waitForTimeout(2000)
        
        // Check for error boundaries
        const errorBoundary = await page.locator('text=เกิดข้อผิดพลาด').count()
        expect(errorBoundary).toBe(0)
        
        // Check for React error overlay
        const reactError = await page.locator('[class*="error"], [class*="Error"]').count()
        
        // Take screenshot
        const screenshotPath = `test-results/navigation-${module.name.toLowerCase().replace(/\s+/g, '-')}.png`
        await page.screenshot({ path: screenshotPath, fullPage: false })
        
        console.log(`✅ ${module.name} works`)
      } catch (e: any) {
        console.log(`❌ ${module.name} failed:`, e.message)
        await page.screenshot({ path: `test-results/navigation-${module.name.toLowerCase().replace(/\s+/g, '-')}-error.png` })
        throw e
      }
    })
  }

  // ============================================
  // CREATE BUTTON TESTS - INVOICES
  // ============================================
  test('Create Invoice button works', async ({ page }) => {
    try {
      // Navigate to Invoices
      await page.click('text=ใบกำกับภาษี')
      await page.waitForTimeout(2000)
      
      // Look for create button (various possible labels)
      const createButtonSelectors = [
        'button:has-text("สร้าง")',
        'button:has-text("เพิ่ม")',
        'button:has-text("+ ใหม่")',
        'button:has-text("New")',
      ]
      
      let buttonFound = false
      for (const selector of createButtonSelectors) {
        const count = await page.locator(selector).count()
        if (count > 0) {
          await page.click(selector)
          buttonFound = true
          console.log(`✅ Found create button with selector: ${selector}`)
          break
        }
      }
      
      expect(buttonFound).toBe(true)
      await page.waitForTimeout(1500)
      
      // Check for form/dialog opening
      const dialog = await page.locator('[role="dialog"], .dialog, [class*="Dialog"]').count()
      const form = await page.locator('form, input[name*="customer"], input[name*="number"]').count()
      
      console.log(`Dialog elements: ${dialog}, Form elements: ${form}`)
      expect(dialog > 0 || form > 0).toBe(true)
      
      await page.screenshot({ path: 'test-results/create-invoice-button.png' })
      console.log('✅ Create Invoice button works')
    } catch (e: any) {
      console.log('❌ Create Invoice button failed:', e.message)
      await page.screenshot({ path: 'test-results/create-invoice-button-error.png' })
      throw e
    }
  })

  // ============================================
  // CREATE BUTTON TESTS - CUSTOMERS
  // ============================================
  test('Create Customer button works', async ({ page }) => {
    try {
      // Navigate to Customers
      await page.click('text=ลูกหนี้')
      await page.waitForTimeout(2000)
      
      // Look for create button
      const createButtonSelectors = [
        'button:has-text("สร้าง")',
        'button:has-text("เพิ่ม")',
        'button:has-text("+ ใหม่")',
      ]
      
      let buttonFound = false
      for (const selector of createButtonSelectors) {
        const count = await page.locator(selector).count()
        if (count > 0) {
          await page.click(selector)
          buttonFound = true
          console.log(`✅ Found create button with selector: ${selector}`)
          break
        }
      }
      
      expect(buttonFound).toBe(true)
      await page.waitForTimeout(1500)
      
      // Check for form/dialog
      const dialog = await page.locator('[role="dialog"], .dialog').count()
      const form = await page.locator('form').count()
      
      expect(dialog > 0 || form > 0).toBe(true)
      
      await page.screenshot({ path: 'test-results/create-customer-button.png' })
      console.log('✅ Create Customer button works')
    } catch (e: any) {
      console.log('❌ Create Customer button failed:', e.message)
      await page.screenshot({ path: 'test-results/create-customer-button-error.png' })
      throw e
    }
  })

  // ============================================
  // CREATE BUTTON TESTS - VENDORS
  // ============================================
  test('Create Vendor button works', async ({ page }) => {
    try {
      // Navigate to Vendors
      await page.click('text=เจ้าหนี้')
      await page.waitForTimeout(2000)
      
      // Look for create button
      const createButtonSelectors = [
        'button:has-text("สร้าง")',
        'button:has-text("เพิ่ม")',
        'button:has-text("+ ใหม่")',
      ]
      
      let buttonFound = false
      for (const selector of createButtonSelectors) {
        const count = await page.locator(selector).count()
        if (count > 0) {
          await page.click(selector)
          buttonFound = true
          console.log(`✅ Found create button with selector: ${selector}`)
          break
        }
      }
      
      expect(buttonFound).toBe(true)
      await page.waitForTimeout(1500)
      
      // Check for form/dialog
      const dialog = await page.locator('[role="dialog"], .dialog').count()
      const form = await page.locator('form').count()
      
      expect(dialog > 0 || form > 0).toBe(true)
      
      await page.screenshot({ path: 'test-results/create-vendor-button.png' })
      console.log('✅ Create Vendor button works')
    } catch (e: any) {
      console.log('❌ Create Vendor button failed:', e.message)
      await page.screenshot({ path: 'test-results/create-vendor-button-error.png' })
      throw e
    }
  })

  // ============================================
  // CREATE BUTTON TESTS - JOURNAL ENTRY
  // ============================================
  test('Create Journal Entry button works', async ({ page }) => {
    try {
      // Navigate to Journal
      await page.click('text=บันทึกบัญชี')
      await page.waitForTimeout(2000)
      
      // Look for create button
      const createButtonSelectors = [
        'button:has-text("สร้าง")',
        'button:has-text("เพิ่ม")',
        'button:has-text("+ ใหม่")',
        'button:has-text("บันทึกใหม่")',
      ]
      
      let buttonFound = false
      for (const selector of createButtonSelectors) {
        const count = await page.locator(selector).count()
        if (count > 0) {
          await page.click(selector)
          buttonFound = true
          console.log(`✅ Found create button with selector: ${selector}`)
          break
        }
      }
      
      expect(buttonFound).toBe(true)
      await page.waitForTimeout(1500)
      
      // Check for form/dialog
      const dialog = await page.locator('[role="dialog"], .dialog').count()
      const form = await page.locator('form').count()
      
      expect(dialog > 0 || form > 0).toBe(true)
      
      await page.screenshot({ path: 'test-results/create-journal-button.png' })
      console.log('✅ Create Journal Entry button works')
    } catch (e: any) {
      console.log('❌ Create Journal Entry button failed:', e.message)
      await page.screenshot({ path: 'test-results/create-journal-button-error.png' })
      throw e
    }
  })

  // ============================================
  // CONSOLE ERROR CHECK
  // ============================================
  test('Check for console errors during navigation', async ({ page }) => {
    const errors: string[] = []
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    
    page.on('pageerror', (err) => {
      errors.push(err.message)
    })
    
    // Navigate through several modules
    await page.click('text=ภาพรวม')
    await page.waitForTimeout(1000)
    await page.click('text=ผังบัญชี')
    await page.waitForTimeout(1000)
    await page.click('text=ใบกำกับภาษี')
    await page.waitForTimeout(1000)
    await page.click('text=รายงาน')
    await page.waitForTimeout(1000)
    
    console.log('Console errors found:', errors.length)
    errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`))
    
    // Fail if there are critical errors
    const criticalErrors = errors.filter(e => 
      e.includes('TypeError') || 
      e.includes('ReferenceError') ||
      e.includes('Cannot read') ||
      e.includes('undefined')
    )
    
    expect(criticalErrors.length).toBe(0)
  })
})
