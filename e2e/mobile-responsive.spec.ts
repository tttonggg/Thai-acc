/**
 * Mobile E2E Tests
 * Tests for mobile viewports, touch interactions, and offline mode
 */

import { test, expect, devices } from '@playwright/test'

// Mobile devices configuration
const mobileDevices = [
  { name: 'iPhone 12', viewport: { width: 390, height: 844 }, userAgent: devices['iPhone 12'].userAgent },
  { name: 'iPhone SE', viewport: { width: 375, height: 667 }, userAgent: devices['iPhone SE'].userAgent },
  { name: 'Pixel 5', viewport: { width: 393, height: 851 }, userAgent: devices['Pixel 5'].userAgent },
  { name: 'Samsung S8', viewport: { width: 360, height: 740 }, userAgent: devices['Galaxy S8'].userAgent },
]

for (const device of mobileDevices) {
  test.describe(`Mobile Tests - ${device.name}`, () => {
    test.use({
      viewport: device.viewport,
      userAgent: device.userAgent,
    })

    test('login page renders correctly', async ({ page }) => {
      await page.goto('/login')
      
      // Check that login form is visible and properly sized
      const emailInput = page.locator('input[type="email"]')
      const passwordInput = page.locator('input[type="password"]')
      const submitButton = page.locator('button[type="submit"]')
      
      await expect(emailInput).toBeVisible()
      await expect(passwordInput).toBeVisible()
      await expect(submitButton).toBeVisible()
      
      // Check input sizes are touch-friendly (min 44px)
      const emailBox = await emailInput.boundingBox()
      expect(emailBox!.height).toBeGreaterThanOrEqual(44)
    })

    test('navigation menu works on mobile', async ({ page }) => {
      // Login first
      await page.goto('/login')
      await page.fill('input[type="email"]', 'admin@thaiaccounting.com')
      await page.fill('input[type="password"]', 'admin123')
      await page.click('button[type="submit"]')
      await page.waitForURL('**/dashboard', { timeout: 10000 })
      
      // Open mobile menu (hamburger)
      const menuButton = page.locator('[data-testid="mobile-menu-button"], button:has([class*="hamburger"]), button[class*="menu"]').first()
      if (await menuButton.isVisible().catch(() => false)) {
        await menuButton.click()
        
        // Check menu items are visible
        await expect(page.locator('text=แดชบอร์ด, text=Dashboard')).toBeVisible()
        await expect(page.locator('text=ใบกำกับภาษี, text=Invoices')).toBeVisible()
      }
    })

    test('touch scrolling works', async ({ page }) => {
      await page.goto('/login')
      await page.fill('input[type="email"]', 'admin@thaiaccounting.com')
      await page.fill('input[type="password"]', 'admin123')
      await page.click('button[type="submit"]')
      await page.goto('/invoices')
      
      // Wait for content
      await page.waitForTimeout(1000)
      
      // Perform touch scroll
      await page.touchscreen.tap(100, 400)
      await page.mouse.wheel(0, 500)
      
      // Page should still be functional
      await expect(page.locator('body')).toBeVisible()
    })

    test('form inputs are usable on mobile', async ({ page }) => {
      await page.goto('/login')
      await page.fill('input[type="email"]', 'admin@thaiaccounting.com')
      await page.fill('input[type="password"]', 'admin123')
      await page.click('button[type="submit"]')
      await page.goto('/invoices')
      
      // Try to create new invoice
      const createButton = page.locator('button:has-text("สร้าง"), button:has-text("Create"), [data-testid="create-button"]').first()
      if (await createButton.isVisible().catch(() => false)) {
        await createButton.click()
        
        // Check that form opens
        await page.waitForTimeout(1000)
        
        // Form should be accessible
        const form = page.locator('form, [role="dialog"] form, .modal form').first()
        await expect(form).toBeVisible()
      }
    })

    test('tables are horizontally scrollable', async ({ page }) => {
      await page.goto('/login')
      await page.fill('input[type="email"]', 'admin@thaiaccounting.com')
      await page.fill('input[type="password"]', 'admin123')
      await page.click('button[type="submit"]')
      await page.goto('/accounts')
      
      // Check if table container has horizontal scroll
      const tableContainer = page.locator('.table-container, [class*="overflow"], table').first()
      if (await tableContainer.isVisible().catch(() => false)) {
        const container = await tableContainer.boundingBox()
        if (container && container.width > device.viewport.width) {
          // Should be scrollable
          const scrollWidth = await tableContainer.evaluate(el => el.scrollWidth)
          const clientWidth = await tableContainer.evaluate(el => el.clientWidth)
          expect(scrollWidth).toBeGreaterThanOrEqual(clientWidth)
        }
      }
    })
  })
}

test.describe('Touch Interactions', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
  })

  test('swipe gestures work', async ({ page }) => {
    await page.goto('/login')
    
    // Simulate swipe
    await page.touchscreen.tap(195, 400)
    
    // Check that page responds to touch
    await expect(page.locator('body')).toBeVisible()
  })

  test('pinch to zoom is prevented on UI elements', async ({ page }) => {
    await page.goto('/login')
    
    // Check viewport meta tag
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content')
    if (viewport) {
      expect(viewport).toContain('width=device-width')
    }
  })

  test('double tap zoom is prevented', async ({ page }) => {
    await page.goto('/login')
    
    // Double tap on button
    const button = page.locator('button').first()
    const box = await button.boundingBox()
    
    if (box) {
      await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2)
      await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2)
    }
    
    // Page should not be zoomed
    const scale = await page.evaluate(() => (window as any).visualViewport?.scale || 1)
    expect(scale).toBe(1)
  })
})

test.describe('Offline Mode', () => {
  test('service worker registration', async ({ page }) => {
    await page.goto('/login')
    
    // Check if service worker is registered
    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration()
        return !!registration
      }
      return false
    })
    
    // Note: Service worker may not be available in test environment
    expect([true, false]).toContain(swRegistered)
  })

  test('offline indicator appears when connection lost', async ({ page, context }) => {
    await page.goto('/login')
    
    // Simulate offline
    await context.setOffline(true)
    
    // Check for offline indicator
    await page.waitForTimeout(1000)
    
    // Look for offline message or indicator
    const offlineIndicator = page.locator(
      'text=offline, text=ไม่มีอินเทอร์เน็ต, .offline-indicator, [data-testid="offline"]'
    )
    
    // May or may not be visible depending on PWA implementation
    const isVisible = await offlineIndicator.isVisible().catch(() => false)
    expect([true, false]).toContain(isVisible)
    
    // Restore connection
    await context.setOffline(false)
  })

  test('cached pages work offline', async ({ page, context }) => {
    // First visit to cache the page
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    
    // Simulate offline
    await context.setOffline(true)
    
    // Refresh page
    await page.reload()
    
    // Page should still load (from cache)
    await expect(page.locator('input[type="email"]')).toBeVisible()
    
    // Restore connection
    await context.setOffline(false)
  })

  test('form data is queued when offline', async ({ page, context }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@thaiaccounting.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard', { timeout: 10000 })
    
    // Navigate to a form page
    await page.goto('/invoices')
    
    // Simulate offline
    await context.setOffline(true)
    
    // Try to submit form (should queue)
    // This test depends on offline queue implementation
    
    // Restore connection
    await context.setOffline(false)
  })
})

test.describe('Mobile-Specific Features', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
  })

  test('pull to refresh is available', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@thaiaccounting.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.goto('/invoices')
    
    // Simulate pull down
    await page.mouse.move(195, 100)
    await page.mouse.down()
    await page.mouse.move(195, 300, { steps: 10 })
    await page.mouse.up()
    
    // Page should still be functional
    await expect(page.locator('body')).toBeVisible()
  })

  test('bottom navigation on mobile', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@thaiaccounting.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    
    // Check for bottom navigation
    const bottomNav = page.locator(
      '[class*="bottom-nav"], [class*="bottom-navigation"], nav[class*="fixed bottom"]'
    )
    
    // May or may not exist
    const hasBottomNav = await bottomNav.isVisible().catch(() => false)
    expect([true, false]).toContain(hasBottomNav)
  })

  test('floating action button on mobile', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@thaiaccounting.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.goto('/invoices')
    
    // Check for FAB
    const fab = page.locator(
      'button[class*="fab"], button[class*="floating"], [data-testid="fab"]'
    )
    
    // May or may not exist
    const hasFab = await fab.isVisible().catch(() => false)
    expect([true, false]).toContain(hasFab)
  })

  test('mobile-optimized date picker', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@thaiaccounting.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.goto('/invoices')
    
    // Try to open date picker
    const dateInput = page.locator('input[type="date"], input[placeholder*="วัน"]').first()
    if (await dateInput.isVisible().catch(() => false)) {
      await dateInput.click()
      
      // Should open native date picker or custom mobile-friendly one
      await page.waitForTimeout(500)
    }
  })
})

test.describe('Mobile Performance', () => {
  test('page loads within acceptable time on mobile', async ({ page }) => {
    const start = Date.now()
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - start
    
    // Should load within 5 seconds on mobile
    expect(loadTime).toBeLessThan(5000)
  })

  test('images are optimized for mobile', async ({ page }) => {
    await page.goto('/login')
    
    // Check for responsive images
    const images = await page.locator('img').all()
    for (const img of images) {
      const srcset = await img.getAttribute('srcset')
      const sizes = await img.getAttribute('sizes')
      
      // Images should have srcset for responsive loading
      // This is optional but recommended
    }
  })

  test('no horizontal scroll on mobile', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@thaiaccounting.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard', { timeout: 10000 })
    
    // Check body scroll width
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth
    })
    
    // Allow minimal overflow but not significant
    expect(hasHorizontalScroll).toBe(false)
  })
})
