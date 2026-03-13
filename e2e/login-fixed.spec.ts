import { test, expect } from '@playwright/test'

const TEST_USERS = [
  { email: 'admin@thaiaccounting.com', password: 'admin123', role: 'ADMIN' },
  { email: 'accountant@thaiaccounting.com', password: 'acc123', role: 'ACCOUNTANT' },
  { email: 'user@thaiaccounting.com', password: 'user123', role: 'USER' },
  { email: 'viewer@thaiaccounting.com', password: 'viewer123', role: 'VIEWER' }
]

test.describe('Login Tests Fixed', () => {
  test.beforeEach(async ({ page }) => {
    // Bypass rate limiting for automated tests
    await page.setExtraHTTPHeaders({
      'x-playwright-test': 'true'
    })
    await page.context().clearCookies()
    await page.goto('/')
  })

  for (const user of TEST_USERS) {
    test(`login as ${user.role}`, async ({ page }) => {
      await expect(page.locator('input[type="email"]')).toBeVisible()
      await page.fill('input[type="email"]', user.email)
      await page.fill('input[type="password"]', user.password)
      await page.click('button[type="submit"]')

      await page.waitForTimeout(3000)

      const dashboard = page.locator('nav, aside').first()
      const visible = await dashboard.isVisible().catch(() => false)

      expect(visible).toBe(true)

      console.log(`${user.role} login successful`)
    })
  }
})
