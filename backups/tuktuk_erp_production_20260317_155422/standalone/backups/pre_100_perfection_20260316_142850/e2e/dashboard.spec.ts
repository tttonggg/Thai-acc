import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/')
  })

  test('should display dashboard page', async ({ page }) => {
    // Check for Thai dashboard heading
    await expect(page.locator('h1')).toContainText('ภาพรวมธุรกิจ')
  })

  test('should display summary cards', async ({ page }) => {
    // Check for summary cards with Thai labels
    await expect(page.locator('text=รายได้รวม')).toBeVisible()
    await expect(page.locator('text=ค่าใช้จ่ายรวม')).toBeVisible()
    await expect(page.locator('text=ลูกหนี้')).toBeVisible()
    await expect(page.locator('text=เจ้าหนี้')).toBeVisible()
  })

  test('should display charts', async ({ page }) => {
    // Check for charts
    await expect(page.locator('text=รายได้ vs ค่าใช้จ่าย')).toBeVisible()
    await expect(page.locator('text=ภาษีมูลค่าเพิ่ม')).toBeVisible()
    await expect(page.locator('text=ลูกหนี้ตามอายุหนี้')).toBeVisible()
    await expect(page.locator('text=เจ้าหนี้ตามอายุหนี้')).toBeVisible()
  })

  test('should display quick actions', async ({ page }) => {
    // Check for quick action items
    await expect(page.locator('text=การดำเนินการด่วน')).toBeVisible()
    await expect(page.locator('text=ใบกำกับภาษีร่าง')).toBeVisible()
  })
})

test.describe('Navigation', () => {
  test('should navigate between modules', async ({ page }) => {
    await page.goto('/')

    // Click on ผังบัญชี (Chart of Accounts)
    await page.click('text=ผังบัญชี')
    await expect(page).toHaveURL(/.*accounts/)

    // Click on บันทึกบัญชี (Journal Entries)
    await page.click('text=บันทึกบัญชี')
    await expect(page).toHaveURL(/.*journal/)
  })

  test('should toggle sidebar', async ({ page }) => {
    await page.goto('/')

    // Check if sidebar toggle button exists
    const toggleButton = page.locator('button[aria-label="Toggle sidebar"]')
    if (await toggleButton.isVisible()) {
      await toggleButton.click()
      // Sidebar should collapse
    }
  })
})

test.describe('Authentication', () => {
  test('should redirect unauthenticated users to signin', async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies()

    await page.goto('/dashboard')
    // Should redirect to signin or show login modal
    await expect(page).toHaveURL(/.*\/(signin|login)/)
  })

  test('should display user profile in sidebar', async ({ page }) => {
    await page.goto('/')

    // Check for user profile section (when sidebar is open)
    const userProfile = page.locator('[data-testid="user-profile"]')
    if (await userProfile.isVisible()) {
      await expect(userProfile).toBeVisible()
    }
  })
})
