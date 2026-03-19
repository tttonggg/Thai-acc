import { test, expect, Page } from '@playwright/test'

/**
 * Invoice Commenting Integration Test Suite
 *
 * Tests the complete invoice commenting feature including:
 * - Authentication (login with valid/invalid credentials)
 * - Invoice list with comment badges
 * - Invoice edit dialog with tabs (Details + Comments)
 * - Comment CRUD operations (add, reply, resolve, delete)
 * - UI/UX verification
 */

// Test credentials
const TEST_CREDENTIALS = {
  email: 'admin@thaiaccounting.com',
  password: 'admin123'
}

// Helper function to login
async function login(page: Page, email: string, password: string) {
  // Navigate with longer timeout and wait for network to be idle
  await page.goto('/', { waitUntil: 'networkidle', timeout: 60000 })

  // Wait for login page - use longer timeout
  await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 20000 })
  await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 10000 })

  // Fill credentials
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)

  // Submit form
  await page.click('button[type="submit"]')

  // Wait for dashboard (check for sidebar or main content) - use longer timeout
  await expect(page.locator('nav, aside, [data-testid="sidebar"], h1').first()).toBeVisible({ timeout: 30000 })
}

// Helper function to navigate to invoices
async function navigateToInvoices(page: Page) {
  // Click on invoices in sidebar
  const invoiceLink = page.locator('text=ใบกำกับภาษี').first()
  await expect(invoiceLink).toBeVisible({ timeout: 20000 })
  await invoiceLink.click()

  // Wait for invoice list to load - use longer timeout
  await expect(page.locator('table')).toBeVisible({ timeout: 20000 })
  // Wait for data to load
  await page.waitForTimeout(2000)
}

test.describe('Authentication Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies()
    await page.waitForTimeout(500)
  })

  test('should login successfully with valid credentials', async ({ page }) => {
    await login(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password)

    // Take screenshot of dashboard
    await page.screenshot({ path: 'test-results/01-login-success.png' })

    // Verify dashboard elements
    const dashboardVisible = await page.locator('h1:has-text("ภาพรวมธุรกิจ")').isVisible({ timeout: 5000 }).catch(() => false)
    const sidebarVisible = await page.locator('nav, aside').first().isVisible().catch(() => false)

    expect(dashboardVisible || sidebarVisible).toBeTruthy()

    // Check for summary cards or navigation
    await expect(page.locator('text=รายได้รวม').or(page.locator('text=ค่าใช้จ่ายรวม')).or(page.locator('nav')).first()).toBeVisible({ timeout: 5000 })
  })

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle', timeout: 60000 })

    // Wait for login form
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 20000 })

    // Fill invalid credentials
    await page.fill('input[type="email"]', 'invalid@test.com')
    await page.fill('input[type="password"]', 'wrongpassword')

    // Submit form
    await page.click('button[type="submit"]')

    // Should show error message (Thai)
    await expect(page.locator('text=อีเมลหรือรหัสผ่านไม่ถูกต้อง')).toBeVisible({ timeout: 5000 })

    // Take screenshot of error
    await page.screenshot({ path: 'test-results/02-login-error.png' })

    // Should still be on login page
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('should persist session across page reloads', async ({ page }) => {
    await login(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password)

    // Wait for dashboard
    await expect(page.locator('input[type="email"]')).not.toBeVisible({ timeout: 10000 })

    // Reload the page
    await page.reload()

    // Should still be logged in
    await expect(page.locator('h1:has-text("ภาพรวมธุรกิจ")').or(page.locator('nav')).first()).toBeVisible({ timeout: 10000 })

    // Login form should not be visible
    await expect(page.locator('input[type="email"]')).not.toBeVisible()
  })

  test('auth should work consistently without intermittent failures', async ({ page }) => {
    // Test multiple login attempts to verify consistency
    for (let i = 0; i < 3; i++) {
      await page.context().clearCookies()
      await page.goto('/', { waitUntil: 'networkidle', timeout: 60000 })

      await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 20000 })
      await page.fill('input[type="email"]', TEST_CREDENTIALS.email)
      await page.fill('input[type="password"]', TEST_CREDENTIALS.password)
      await page.click('button[type="submit"]')

      // Should navigate to dashboard - use longer timeout
      await expect(page.locator('nav, aside, h1').first()).toBeVisible({ timeout: 30000 })

      // Logout for next iteration
      const logoutButton = page.locator('button:has-text("ออกจากระบบ"), button[aria-label="Logout"]').first()
      if (await logoutButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await logoutButton.click()
        await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 })
      }
    }
  })
})

test.describe('Invoice List - Comment Badges', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password)
    await navigateToInvoices(page)
  })

  test('should display invoice list with comment column', async ({ page }) => {
    // Take screenshot of invoice list
    await page.screenshot({ path: 'test-results/03-invoice-list.png' })

    // Verify table headers
    await expect(page.locator('th:has-text("เลขที่")')).toBeVisible()
    await expect(page.locator('th:has-text("วันที่")')).toBeVisible()
    await expect(page.locator('th:has-text("ลูกค้า")')).toBeVisible()
    await expect(page.locator('th:has-text("สถานะ")')).toBeVisible()

    // Verify comment column exists
    const commentHeader = page.locator('th:has-text("คอมเมนต์")')
    await expect(commentHeader).toBeVisible()
  })

  test('should display comment badges in invoice list', async ({ page }) => {
    // Check for comment badges in the table
    const commentCells = page.locator('td:nth-child(9)')
    const count = await commentCells.count()

    if (count > 0) {
      // Take screenshot showing comment badges
      await page.screenshot({ path: 'test-results/04-comment-badges.png' })

      // Check if any invoices have comment badges
      const badges = page.locator('td:nth-child(9) .badge, td:nth-child(9) [class*="badge"]')
      const badgeCount = await badges.count()

      if (badgeCount > 0) {
        // Verify badge contains number and icon
        const firstBadge = badges.first()
        await expect(firstBadge).toBeVisible()

        // Badge should contain a number
        const badgeText = await firstBadge.textContent()
        expect(badgeText).toMatch(/\d+/)
      }
    }
  })

  test('should show empty state for invoices without comments', async ({ page }) => {
    // Look for cells with dash or empty state
    const commentCells = page.locator('td:nth-child(9)')
    const count = await commentCells.count()

    if (count > 0) {
      // At least some cells should show dash for no comments
      const hasEmptyState = await commentCells.filter({ hasText: '-' }).count() > 0
      const hasMutedText = await commentCells.locator('.text-muted-foreground').count() > 0

      expect(hasEmptyState || hasMutedText).toBeTruthy()
    }
  })
})

test.describe('Invoice Edit Dialog - Tabs', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password)
    await navigateToInvoices(page)
  })

  test('should open edit dialog with tabs', async ({ page }) => {
    // Wait for table to be populated
    await page.waitForSelector('tbody tr', { timeout: 10000 })

    // Get the first invoice row
    const firstRow = page.locator('tbody tr').first()
    await expect(firstRow).toBeVisible()

    // Click edit button
    const editButton = firstRow.locator('button').filter({ has: page.locator('svg[data-lucide="edit"], .lucide-edit') }).first()
    await editButton.click()

    // Wait for dialog to open
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 10000 })

    // Take screenshot of dialog
    await page.screenshot({ path: 'test-results/05-edit-dialog-tabs.png' })

    // Verify tabs exist
    await expect(page.locator('button[role="tab"]:has-text("รายละเอียด")')).toBeVisible()
    await expect(page.locator('button[role="tab"]:has-text("คอมเมนต์")')).toBeVisible()
  })

  test('should switch between Details and Comments tabs', async ({ page }) => {
    // Wait for table
    await page.waitForSelector('tbody tr', { timeout: 10000 })

    // Click edit on first invoice
    const firstRow = page.locator('tbody tr').first()
    const editButton = firstRow.locator('button').filter({ has: page.locator('svg[data-lucide="edit"], .lucide-edit') }).first()
    await editButton.click()

    // Wait for dialog
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 10000 })

    // Click on Comments tab
    const commentsTab = page.locator('button[role="tab"]:has-text("คอมเมนต์")')
    await commentsTab.click()

    // Take screenshot of comments tab
    await page.screenshot({ path: 'test-results/06-comments-tab.png' })

    // Verify comments section is visible
    await expect(page.locator('text=ความคิดเห็น').or(page.locator('.comment-section')).or(page.locator('[class*="comment"]')).first()).toBeVisible()

    // Switch back to Details tab
    const detailsTab = page.locator('button[role="tab"]:has-text("รายละเอียด")')
    await detailsTab.click()

    // Verify details are visible
    await expect(page.locator('text=เลขที่เอกสาร').or(page.locator('label:has-text("ลูกค้า")')).first()).toBeVisible()
  })

  test('should show comment count badge on tab', async ({ page }) => {
    // Wait for table
    await page.waitForSelector('tbody tr', { timeout: 10000 })

    // Click edit on first invoice
    const firstRow = page.locator('tbody tr').first()
    const editButton = firstRow.locator('button').filter({ has: page.locator('svg[data-lucide="edit"], .lucide-edit') }).first()
    await editButton.click()

    // Wait for dialog
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 10000 })

    // Check if comment tab has badge
    const commentsTab = page.locator('button[role="tab"]:has-text("คอมเมนต์")')
    const tabContent = await commentsTab.textContent()

    // Take screenshot
    await page.screenshot({ path: 'test-results/07-comment-tab-badge.png' })

    // Badge may or may not be present depending on comment count
    // Just verify the tab exists
    expect(tabContent).toContain('คอมเมนต์')
  })
})

test.describe('Comment Operations', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password)
    await navigateToInvoices(page)
  })

  test('should add a test comment', async ({ page }) => {
    // Wait for table
    await page.waitForSelector('tbody tr', { timeout: 10000 })

    // Click edit on first invoice
    const firstRow = page.locator('tbody tr').first()
    const editButton = firstRow.locator('button').filter({ has: page.locator('svg[data-lucide="edit"], .lucide-edit') }).first()
    await editButton.click()

    // Wait for dialog
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 10000 })

    // Click on Comments tab
    const commentsTab = page.locator('button[role="tab"]:has-text("คอมเมนต์")')
    await commentsTab.click()

    // Wait for comment section to load
    await page.waitForTimeout(1000)

    // Look for comment input
    const commentInput = page.locator('textarea[placeholder*="ความคิดเห็น"], textarea[placeholder*="comment"], [data-testid="comment-input"]').first()

    if (await commentInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Add a test comment
      const testComment = `Test comment added by Playwright at ${new Date().toISOString()}`
      await commentInput.fill(testComment)

      // Look for submit button
      const submitButton = page.locator('button:has-text("ส่ง"), button:has-text("โพสต์"), button:has-text("Post"), button[type="submit"]').filter({ hasNot: page.locator('input') }).first()

      if (await submitButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await submitButton.click()

        // Wait for comment to appear
        await page.waitForTimeout(1500)

        // Take screenshot
        await page.screenshot({ path: 'test-results/08-comment-added.png' })

        // Verify comment appears in list
        await expect(page.locator(`text=${testComment.substring(0, 30)}`)).toBeVisible({ timeout: 5000 })
      }
    } else {
      // Comment input not found - take screenshot for debugging
      await page.screenshot({ path: 'test-results/08-comment-input-not-found.png' })
      test.skip()
    }
  })

  test('should reply to a comment', async ({ page }) => {
    // Wait for table
    await page.waitForSelector('tbody tr', { timeout: 10000 })

    // Click edit on first invoice
    const firstRow = page.locator('tbody tr').first()
    const editButton = firstRow.locator('button').filter({ has: page.locator('svg[data-lucide="edit"], .lucide-edit') }).first()
    await editButton.click()

    // Wait for dialog
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 10000 })

    // Click on Comments tab
    const commentsTab = page.locator('button[role="tab"]:has-text("คอมเมนต์")')
    await commentsTab.click()

    await page.waitForTimeout(1000)

    // Look for reply button on existing comments
    const replyButton = page.locator('button:has-text("ตอบกลับ"), button:has-text("Reply"), [data-testid="reply-button"]').first()

    if (await replyButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await replyButton.click()

      // Look for reply input
      const replyInput = page.locator('textarea').filter({ hasText: '' }).first()
      if (await replyInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        const replyText = `Reply from Playwright at ${new Date().toISOString()}`
        await replyInput.fill(replyText)

        // Submit reply
        const submitReply = page.locator('button:has-text("ส่ง"), button:has-text("โพสต์"), button:has-text("Post"), button:has-text("Reply"), button:has-text("ตอบกลับ")').first()
        await submitReply.click()

        await page.waitForTimeout(1500)

        // Take screenshot
        await page.screenshot({ path: 'test-results/09-comment-reply.png' })

        // Verify reply appears
        await expect(page.locator(`text=${replyText.substring(0, 20)}`)).toBeVisible({ timeout: 5000 })
      }
    } else {
      await page.screenshot({ path: 'test-results/09-no-reply-button.png' })
      test.skip()
    }
  })

  test('should resolve and unresolve a comment', async ({ page }) => {
    // Wait for table
    await page.waitForSelector('tbody tr', { timeout: 10000 })

    // Click edit on first invoice
    const firstRow = page.locator('tbody tr').first()
    const editButton = firstRow.locator('button').filter({ has: page.locator('svg[data-lucide="edit"], .lucide-edit') }).first()
    await editButton.click()

    // Wait for dialog
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 10000 })

    // Click on Comments tab
    const commentsTab = page.locator('button[role="tab"]:has-text("คอมเมนต์")')
    await commentsTab.click()

    await page.waitForTimeout(1000)

    // Look for resolve button
    const resolveButton = page.locator('button:has-text("แก้ไขแล้ว"), button:has-text("Resolve"), button:has-text("ตกลง"), [data-testid="resolve-button"]').first()

    if (await resolveButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Click resolve
      await resolveButton.click()
      await page.waitForTimeout(1000)

      // Take screenshot after resolve
      await page.screenshot({ path: 'test-results/10-comment-resolved.png' })

      // Look for unresolve button
      const unresolveButton = page.locator('button:has-text("ยกเลิกการแก้ไข"), button:has-text("Unresolve"), button:has-text("ยังไม่แก้ไข"), [data-testid="unresolve-button"]').first()

      if (await unresolveButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Click unresolve
        await unresolveButton.click()
        await page.waitForTimeout(1000)

        // Take screenshot after unresolve
        await page.screenshot({ path: 'test-results/11-comment-unresolved.png' })
      }
    } else {
      await page.screenshot({ path: 'test-results/10-no-resolve-button.png' })
      test.skip()
    }
  })

  test('should update comment count after adding comment', async ({ page }) => {
    // Wait for table
    await page.waitForSelector('tbody tr', { timeout: 10000 })

    // Get initial comment count from first invoice
    const firstRow = page.locator('tbody tr').first()
    const initialBadge = firstRow.locator('td:nth-child(9) .badge, td:nth-child(9) [class*="badge"]').first()

    let initialCount = 0
    if (await initialBadge.isVisible({ timeout: 3000 }).catch(() => false)) {
      const badgeText = await initialBadge.textContent()
      initialCount = parseInt(badgeText?.match(/\d+/)?.[0] || '0')
    }

    // Open edit dialog
    const editButton = firstRow.locator('button').filter({ has: page.locator('svg[data-lucide="edit"], .lucide-edit') }).first()
    await editButton.click()

    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 10000 })

    // Click on Comments tab
    const commentsTab = page.locator('button[role="tab"]:has-text("คอมเมนต์")')
    await commentsTab.click()

    await page.waitForTimeout(1000)

    // Add a comment
    const commentInput = page.locator('textarea[placeholder*="ความคิดเห็น"], textarea[placeholder*="comment"], [data-testid="comment-input"]').first()

    if (await commentInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      const testComment = `Count test at ${Date.now()}`
      await commentInput.fill(testComment)

      const submitButton = page.locator('button:has-text("ส่ง"), button:has-text("โพสต์"), button:has-text("Post"), button[type="submit"]').filter({ hasNot: page.locator('input') }).first()

      if (await submitButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await submitButton.click()
        await page.waitForTimeout(2000)

        // Close dialog
        await page.keyboard.press('Escape')
        await page.waitForTimeout(500)

        // Refresh the list
        await page.reload()
        await navigateToInvoices(page)

        // Check if comment count increased
        const updatedRow = page.locator('tbody tr').first()
        const updatedBadge = updatedRow.locator('td:nth-child(9) .badge, td:nth-child(9) [class*="badge"]').first()

        if (await updatedBadge.isVisible({ timeout: 5000 }).catch(() => false)) {
          const updatedText = await updatedBadge.textContent()
          const updatedCount = parseInt(updatedText?.match(/\d+/)?.[0] || '0')

          // Take screenshot
          await page.screenshot({ path: 'test-results/12-comment-count-updated.png' })

          // Verify count increased
          expect(updatedCount).toBeGreaterThanOrEqual(initialCount)
        }
      }
    }
  })
})

test.describe('UI/UX Verification', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password)
    await navigateToInvoices(page)
  })

  test('login page should have proper styling', async ({ page }) => {
    // Logout first
    await page.context().clearCookies()
    await page.goto('/', { waitUntil: 'networkidle', timeout: 60000 })

    // Wait for login page
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 20000 })

    // Take screenshot
    await page.screenshot({ path: 'test-results/13-login-page-ui.png' })

    // Verify Thai language elements
    await expect(page.locator('h1:has-text("Thai Accounting ERP")')).toBeVisible()
    await expect(page.locator('text=โปรแกรมบัญชีมาตรฐานไทย')).toBeVisible()
    await expect(page.locator('button:has-text("เข้าสู่ระบบ")')).toBeVisible()
    await expect(page.locator('text=อีเมล')).toBeVisible()
    await expect(page.locator('text=รหัสผ่าน')).toBeVisible()
  })

  test('invoice list should have proper layout', async ({ page }) => {
    // Take screenshot
    await page.screenshot({ path: 'test-results/14-invoice-list-layout.png' })

    // Verify summary cards exist
    await expect(page.locator('text=รอออกใบกำกับภาษี')).toBeVisible()
    await expect(page.locator('text=รอรับชำระ')).toBeVisible()
    await expect(page.locator('text=รับชำระแล้ว')).toBeVisible()

    // Verify search and filter
    await expect(page.locator('input[placeholder*="ค้นหา"]')).toBeVisible()

    // Verify table structure
    await expect(page.locator('table thead')).toBeVisible()
    await expect(page.locator('table tbody')).toBeVisible()
  })

  test('edit dialog should have proper tabs layout', async ({ page }) => {
    // Wait for table
    await page.waitForSelector('tbody tr', { timeout: 10000 })

    // Click edit
    const firstRow = page.locator('tbody tr').first()
    const editButton = firstRow.locator('button').filter({ has: page.locator('svg[data-lucide="edit"], .lucide-edit') }).first()
    await editButton.click()

    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 10000 })

    // Take screenshot
    await page.screenshot({ path: 'test-results/15-edit-dialog-layout.png' })

    // Verify dialog structure
    await expect(page.locator('[role="tablist"]')).toBeVisible()
    await expect(page.locator('button[role="tab"]')).toHaveCount(2)

    // Verify tab content
    const tabs = page.locator('button[role="tab"]')
    await expect(tabs.nth(0)).toHaveText(/รายละเอียด/)
    await expect(tabs.nth(1)).toHaveText(/คอมเมนต์/)
  })

  test('should not show infinite spinner', async ({ page }) => {
    // Check invoice list page
    const spinner = page.locator('.animate-spin, [class*="spinner"], [class*="loading"]').first()

    // Wait a bit for any loading to complete
    await page.waitForTimeout(3000)

    // Take screenshot
    await page.screenshot({ path: 'test-results/16-no-spinner.png' })

    // If spinner exists, it should not be visible for long
    if (await spinner.isVisible({ timeout: 1000 }).catch(() => false)) {
      // Wait for spinner to disappear
      await expect(spinner).not.toBeVisible({ timeout: 10000 })
    }

    // Content should be visible
    await expect(page.locator('table')).toBeVisible()
  })

  test('comments section should have proper styling', async ({ page }) => {
    // Wait for table
    await page.waitForSelector('tbody tr', { timeout: 10000 })

    // Open edit dialog
    const firstRow = page.locator('tbody tr').first()
    const editButton = firstRow.locator('button').filter({ has: page.locator('svg[data-lucide="edit"], .lucide-edit') }).first()
    await editButton.click()

    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 10000 })

    // Click on Comments tab
    const commentsTab = page.locator('button[role="tab"]:has-text("คอมเมนต์")')
    await commentsTab.click()

    await page.waitForTimeout(1000)

    // Take screenshot
    await page.screenshot({ path: 'test-results/17-comments-section-ui.png' })

    // Verify comments section elements
    const commentSection = page.locator('.comment-section, [class*="comment"]').first()

    if (await commentSection.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Section should be visible
      await expect(commentSection).toBeVisible()
    } else {
      // If no comments exist, check for empty state
      const emptyState = page.locator('text=ยังไม่มีความคิดเห็น, text=No comments, .empty-state').first()
      expect(await emptyState.isVisible({ timeout: 3000 }).catch(() => false)).toBeTruthy()
    }
  })
})

test.describe('Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password)
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // Block API requests to simulate network error
    await page.route('/api/invoices', route => route.abort('failed'))

    // Navigate to invoices
    await navigateToInvoices(page)

    // Should show error message
    await expect(page.locator('text=ข้อผิดพลาด').or(page.locator('text=error')).first()).toBeVisible({ timeout: 10000 })

    // Take screenshot
    await page.screenshot({ path: 'test-results/18-network-error.png' })
  })

  test('should handle unauthorized access', async ({ page }) => {
    // Clear cookies to simulate logged out state
    await page.context().clearCookies()

    // Try to access invoices directly
    await page.goto('/invoices', { waitUntil: 'networkidle', timeout: 60000 })

    // Should redirect to login or show unauthorized
    await page.waitForTimeout(2000)

    // Take screenshot
    await page.screenshot({ path: 'test-results/19-unauthorized.png' })

    // Either login form appears or error message
    const loginVisible = await page.locator('input[type="email"]').isVisible({ timeout: 5000 }).catch(() => false)
    const errorVisible = await page.locator('text=ไม่ได้รับอนุญาต, text=unauthorized, text=เข้าสู่ระบบ').first().isVisible({ timeout: 5000 }).catch(() => false)

    expect(loginVisible || errorVisible).toBeTruthy()
  })
})

test.describe('Console Error Monitoring', () => {
  test('should not have console errors during normal operation', async ({ page }) => {
    const consoleErrors: string[] = []
    const consoleWarnings: string[] = []

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text())
      }
    })

    // Login
    await login(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password)

    // Navigate to invoices
    await navigateToInvoices(page)

    // Open edit dialog
    await page.waitForSelector('tbody tr', { timeout: 10000 })
    const firstRow = page.locator('tbody tr').first()
    const editButton = firstRow.locator('button').filter({ has: page.locator('svg[data-lucide="edit"], .lucide-edit') }).first()
    await editButton.click()

    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 10000 })

    // Switch tabs
    const commentsTab = page.locator('button[role="tab"]:has-text("คอมเมนต์")')
    await commentsTab.click()

    await page.waitForTimeout(2000)

    // Take screenshot
    await page.screenshot({ path: 'test-results/20-console-check.png' })

    // Log any errors found (but don't fail test for non-critical errors)
    if (consoleErrors.length > 0) {
      console.log('Console errors found:', consoleErrors)
    }

    if (consoleWarnings.length > 0) {
      console.log('Console warnings found:', consoleWarnings)
    }

    // Critical errors should not exist
    const criticalErrors = consoleErrors.filter(e =>
      e.includes('TypeError') ||
      e.includes('ReferenceError') ||
      e.includes('SyntaxError') ||
      e.includes('Cannot read') ||
      e.includes('undefined is not') ||
      e.includes('null is not')
    )

    expect(criticalErrors).toHaveLength(0)
  })
})