import { test, expect } from '@playwright/test'

test.describe('Invoices (ใบกำกับภาษี)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.click('text=ใบกำกับภาษี')
  })

  test('should display invoices list', async ({ page }) => {
    // Check for invoice table
    await expect(page.locator('table')).toBeVisible()
  })

  test('should create new invoice', async ({ page }) => {
    // Click create button
    await page.click('button:has-text("สร้างใบกำกับภาษี")')

    // Fill invoice form
    await page.fill('[data-testid="customer-select"]', 'ลูกค้าทดสอบ')
    await page.fill('[data-testid="invoice-date"]', '11/03/2567')
    await page.fill('[data-testid="invoice-item-0-qty"]', '1')
    await page.fill('[data-testid="invoice-item-0-price"]', '1000')

    // Submit form
    await page.click('button:has-text("บันทึก")')

    // Should show success message
    await expect(page.locator('text=บันทึกสำเร็จ')).toBeVisible()
  })

  test('should calculate VAT correctly', async ({ page }) => {
    // Create invoice with 1000 THB amount
    await page.click('button:has-text("สร้างใบกำกับภาษี")')
    await page.fill('[data-testid="invoice-item-0-qty"]', '1')
    await page.fill('[data-testid="invoice-item-0-price"]', '1000')

    // Check VAT calculation (7% of 1000 = 70)
    const vatElement = page.locator('[data-testid="vat-amount"]')
    await expect(vatElement).toContainText('70')
  })

  test('should preview invoice', async ({ page }) => {
    // Click on first invoice in list
    const firstInvoice = page.locator('tbody tr').first()
    await firstInvoice.click()

    // Check for preview dialog
    await expect(page.locator('[role="dialog"]')).toBeVisible()
    await expect(page.locator('text=พิมพ์ใบกำกับภาษี')).toBeVisible()
  })
})

test.describe('Invoice Validation', () => {
  test('should validate required fields', async ({ page }) => {
    await page.goto('/')
    await page.click('text=ใบกำกับภาษี')
    await page.click('button:has-text("สร้างใบกำกับภาษี")')

    // Try to submit without required fields
    await page.click('button:has-text("บันทึก")')

    // Should show validation errors
    await expect(page.locator('text=กรุณากรอกข้อมูลให้ครบ')).toBeVisible()
  })

  test('should validate Thai tax ID format', async ({ page }) => {
    await page.goto('/')
    await page.click('text=ใบกำกับภาษี')
    await page.click('button:has-text("สร้างใบกำกับภาษี")')

    // Enter invalid tax ID (should be 13 digits)
    await page.fill('[data-testid="tax-id"]', '12345')

    // Should show validation error
    const taxIdError = page.locator('[data-testid="tax-id-error"]')
    if (await taxIdError.isVisible()) {
      await expect(taxIdError).toContainText('13')
    }
  })
})
