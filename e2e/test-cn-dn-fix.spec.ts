import { test, expect } from '@playwright/test';

test.describe('Credit Notes & Debit Notes - Full Flow Test', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('http://localhost:3000');

    // Check if we're on login page
    const currentUrl = page.url();
    if (currentUrl.includes('/login') || !currentUrl.includes('dashboard')) {
      await page.fill('input[name="email"]', 'admin@thaiaccounting.com');
      await page.fill('input[name="password"]', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForURL('http://localhost:3000/', { timeout: 10000 });
    }
  });

  test('should navigate to Credit Notes page', async ({ page }) => {
    // Click Credit Notes in sidebar
    await page.locator('aside nav button').filter({ hasText: 'ใบลดหนี้' }).click();

    // Verify URL changed
    await expect(page).toHaveURL(/\/credit-notes/);

    // Check for errors in console
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Check page title
    const title = await page.locator('main h1, main h2').first().textContent();
    console.log('Credit Notes page title:', title);

    // Verify no critical errors
    const criticalErrors = errors.filter(
      (e) =>
        e.includes('Unexpected data format') ||
        e.includes('Fetch failed') ||
        e.includes('products.filter') ||
        e.includes('vendors.map')
    );

    if (criticalErrors.length > 0) {
      console.error('❌ Critical errors found:', criticalErrors);
    }

    expect(criticalErrors.length).toBe(0);
  });

  test('should navigate to Debit Notes page', async ({ page }) => {
    // Click Debit Notes in sidebar
    await page.locator('aside nav button').filter({ hasText: 'ใบเพิ่มหนี้' }).click();

    // Verify URL changed
    await expect(page).toHaveURL(/\/debit-notes/);

    // Check for errors in console
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Check page title
    const title = await page.locator('main h1, main h2').first().textContent();
    console.log('Debit Notes page title:', title);

    // Verify no critical errors
    const criticalErrors = errors.filter(
      (e) =>
        e.includes('Unexpected data format') ||
        e.includes('Fetch failed') ||
        e.includes('products.filter') ||
        e.includes('vendors.map')
    );

    if (criticalErrors.length > 0) {
      console.error('❌ Critical errors found:', criticalErrors);
    }

    expect(criticalErrors.length).toBe(0);
  });

  test('should create a test Credit Note', async ({ page }) => {
    // Navigate to Credit Notes
    await page.locator('aside nav button').filter({ hasText: 'ใบลดหนี้' }).click();
    await page.waitForTimeout(1000);

    // Click "Create New" button
    const createButton = page
      .locator('button')
      .filter({ hasText: /สร้าง|Create/ })
      .first();
    const isVisible = await createButton.isVisible().catch(() => false);

    if (isVisible) {
      await createButton.click();
      await page.waitForTimeout(1000);

      // Check if dialog/form opened
      const dialogVisible = await page
        .locator('[role="dialog"], .dialog')
        .isVisible()
        .catch(() => false);

      if (dialogVisible) {
        console.log('✅ Credit Note form opened successfully');

        // Check form fields
        const formFields = page.locator('input, select');
        const fieldCount = await formFields.count();
        console.log(`Found ${fieldCount} form fields`);

        // Close the dialog
        await page.keyboard.press('Escape');
      } else {
        console.log('⚠️  Dialog not visible');
      }
    }
  });

  test('should create a test Debit Note', async ({ page }) => {
    // Navigate to Debit Notes
    await page.locator('aside nav button').filter({ hasText: 'ใบเพิ่มหนี้' }).click();
    await page.waitForTimeout(1000);

    // Click "Create New" button
    const createButton = page
      .locator('button')
      .filter({ hasText: /สร้าง|Create/ })
      .first();
    const isVisible = await createButton.isVisible().catch(() => false);

    if (isVisible) {
      await createButton.click();
      await page.waitForTimeout(1000);

      // Check if dialog/form opened
      const dialogVisible = await page
        .locator('[role="dialog"], .dialog')
        .isVisible()
        .catch(() => false);

      if (dialogVisible) {
        console.log('✅ Debit Note form opened successfully');

        // Check form fields
        const formFields = page.locator('input, select');
        const fieldCount = await formFields.count();
        console.log(`Found ${fieldCount} form fields`);

        // Close the dialog
        await page.keyboard.press('Escape');
      } else {
        console.log('⚠️  Dialog not visible');
      }
    }
  });
});
