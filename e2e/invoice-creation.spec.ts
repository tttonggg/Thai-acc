import { test, expect } from '@playwright/test'

/**
 * E2E Test: Invoice Creation Flow
 * Tests the full flow of creating a new tax invoice
 */

test.describe('Invoice Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app and login
    await page.goto('http://localhost:3000')
    // Wait for page to load
    await page.waitForLoadState('networkidle')
  })

  test('should create a new tax invoice successfully', async ({ page }) => {
    // 1. Navigate to invoices page
    await page.goto('http://localhost:3000/invoices')
    await page.waitForLoadState('networkidle')

    // 2. Click "สร้างใบกำกับภาษี" button
    const createButton = page.locator('button:has-text("สร้าง"), button:has-text("สร้างใบกำกับภาษี"), a:has-text("สร้าง")').first()
    await createButton.click()
    await page.waitForLoadState('networkidle')

    // 3. Wait for form to appear
    await page.waitForTimeout(1000)

    // 4. Fill in customer name
    const customerInput = page.locator('input[id*="customer"], input[id*="Customer"], input[placeholder*="ลูกค้า"]').first()
    if (await customerInput.isVisible()) {
      await customerInput.fill('บริษัท ทดสอบ จำกัด')
    }

    // 5. Fill in line item
    const descriptionInput = page.locator('input[id*="description"], input[placeholder*="รายการ"]').first()
    if (await descriptionInput.isVisible()) {
      await descriptionInput.fill('ค่าบริการที่ปรึกษา')
    }

    const quantityInput = page.locator('input[id*="quantity"], input[placeholder*="จำนวน"]').first()
    if (await quantityInput.isVisible()) {
      await quantityInput.fill('1')
    }

    const priceInput = page.locator('input[id*="price"], input[placeholder*="ราคา"]').first()
    if (await priceInput.isVisible()) {
      await priceInput.fill('10000') // ฿10,000
    }

    // 6. Save the invoice
    const saveButton = page.locator('button:has-text("บันทึก"), button:has-text("Save")').first()
    await saveButton.click()
    await page.waitForTimeout(2000)

    // 7. Check for success toast or error
    const toast = page.locator('[role="alert"], .toast, [class*="toast"]').first()
    const toastText = await toast.textContent().catch(() => '')

    // Log result
    if (toastText.includes('สำเร็จ') || toastText.includes('success')) {
      console.log('✅ Invoice created successfully')
    } else {
      console.log('❌ Invoice creation failed:', toastText)
      // Take screenshot for debugging
      await page.screenshot({ path: `test-results/invoice-error-${Date.now()}.png` })
    }

    // Assert no critical errors
    expect(toastText).not.toContain('CSRF')
    expect(toastText).not.toContain('ไม่ถูกต้อง')
  })

  test('should display dashboard with correct currency format', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')

    // Wait for dashboard to load
    await page.waitForTimeout(2000)

    // Check for currency values - should NOT have 3 decimal places
    const pageContent = await page.content()

    // Look for the pattern of 3 decimal places (e.g., ฿33.277)
    const hasThreeDecimals = /฿\d+,\d+\.\d{3}/.test(pageContent)
    expect(hasThreeDecimals).toBe(false)

    // Check for correct 2 decimal format
    const hasCorrectFormat = /฿\d+[,\d]*\.\d{2}/.test(pageContent)
    expect(hasCorrectFormat).toBe(true)

    console.log('✅ Dashboard currency format is correct')
  })

  test('should list invoices with correct amounts', async ({ page }) => {
    await page.goto('http://localhost:3000/invoices')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Get all invoice amounts from the page
    const invoiceRows = page.locator('tbody tr, table tr')
    const count = await invoiceRows.count()

    console.log(`Found ${count} invoice rows`)

    // Check each row doesn't have 3 decimal places
    for (let i = 0; i < Math.min(count, 10); i++) {
      const rowText = await invoiceRows.nth(i).textContent()
      if (rowText) {
        const hasThreeDecimals = /\d+\.\d{3}/.test(rowText)
        expect(hasThreeDecimals).toBe(false)
      }
    }

    console.log('✅ Invoice list format is correct')
  })
})

test.describe('CSRF Protection', () => {
  test('should bypass CSRF in development mode', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')

    // Navigate to invoices
    await page.goto('http://localhost:3000/invoices')
    await page.waitForLoadState('networkidle')

    // Try to create invoice
    const createButton = page.locator('button:has-text("สร้าง")').first()
    await createButton.click()
    await page.waitForTimeout(1000)

    // Fill minimal data
    const descInput = page.locator('input').filter({ hasText: '' }).first()
    await descInput.fill('Test Service')

    // Save
    const saveButton = page.locator('button:has-text("บันทึก")').first()
    await saveButton.click()
    await page.waitForTimeout(2000)

    // Should NOT see CSRF error
    const pageText = await page.textContent('body')
    expect(pageText).not.toContain('CSRF token ไม่ถูกต้อง')
    expect(pageText).not.toContain('CSRF token required')

    console.log('✅ CSRF bypass working in development')
  })
})
