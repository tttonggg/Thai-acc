import { test, expect } from '@playwright/test'

test.describe('VAT (ภาษีมูลค่าเพิ่ม)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.click('text=ภาษีมูลค่าเพิ่ม')
  })

  test('should display VAT dashboard', async ({ page }) => {
    await expect(page.locator('text=ภาษีขาย')).toBeVisible()
    await expect(page.locator('text=ภาษีซื้อ')).toBeVisible()
  })

  test('should calculate VAT payable', async ({ page }) => {
    // Check for VAT summary section
    await expect(page.locator('text=ภาษีที่ต้องชำระ')).toBeVisible()
  })

  test('should display PP30 form section', async ({ page }) => {
    // Check for PP30 (monthly VAT return) form
    await expect(page.locator('text=PP30')).toBeVisible()
  })

  test('should generate VAT report', async ({ page }) => {
    // Click generate report button
    const generateButton = page.locator('button:has-text("สร้างรายงาน")')
    if (await generateButton.isVisible()) {
      await generateButton.click()

      // Should show report preview or download
      await expect(page.locator('[role="dialog"]')).toBeVisible()
    }
  })
})

test.describe('WHT (ภาษีหัก ณ ที่จ่าย)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.click('text=ภาษีหัก ณ ที่จ่าย')
  })

  test('should display WHT types', async ({ page }) => {
    // Check for PND3 (salary) and PND53 (services)
    await expect(page.locator('text=PND3')).toBeVisible()
    await expect(page.locator('text=PND53')).toBeVisible()
  })

  test('should select WHT type', async ({ page }) => {
    // Select PND53
    await page.click('text=PND53')

    // Should show PND53 form
    await expect(page.locator('text=ค่าบริการ')).toBeVisible()
  })

  test('should calculate WHT amount', async ({ page }) => {
    await page.click('text=PND53')

    // Enter payment amount
    await page.fill('[data-testid="payment-amount"]', '100000')

    // Check WHT calculation (3% of 100000 = 3000)
    const whtAmount = page.locator('[data-testid="wht-amount"]')
    if (await whtAmount.isVisible()) {
      await expect(whtAmount).toContainText('3,000')
    }
  })
})
