/**
 * Visual Regression Tests with Percy
 * Tests for critical page visual consistency
 */

import { test, expect } from '@playwright/test';

// Percy snapshot helper (requires @percy/playwright for actual implementation)
const percySnapshot = async (page: any, name: string) => {
  // In real implementation, this would be:
  // await percySnapshot(page, name)
  console.log(`[Percy] Would capture snapshot: ${name}`);

  // For now, just take a regular screenshot for comparison
  await page.screenshot({ path: `test-results/visual/${name}.png`, fullPage: true });
};

test.describe('Visual Regression - Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
  });

  test('login page initial state', async ({ page }) => {
    await percySnapshot(page, 'login-initial');

    // Verify key elements are visible
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('login page with validation error', async ({ page }) => {
    await page.click('button[type="submit"]');
    await page.waitForSelector('[role="alert"], .error, .text-red-500', { timeout: 5000 });

    await percySnapshot(page, 'login-validation-error');
  });

  test('login page with filled fields', async ({ page }) => {
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');

    await percySnapshot(page, 'login-filled');
  });
});

test.describe('Visual Regression - Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@thaiaccounting.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  test('dashboard overview', async ({ page }) => {
    await percySnapshot(page, 'dashboard-overview');

    // Verify key widgets
    await expect(page.locator('text=ยอดขาย')).toBeVisible();
    await expect(page.locator('text=ลูกหนี้')).toBeVisible();
    await expect(page.locator('text=กำไร/ขาดทุน')).toBeVisible();
  });

  test('dashboard with expanded sidebar', async ({ page }) => {
    // Ensure sidebar is expanded
    await page.click('[data-testid="sidebar-toggle"]');
    await page.waitForTimeout(500);

    await percySnapshot(page, 'dashboard-expanded-sidebar');
  });

  test('dashboard with data loaded', async ({ page }) => {
    // Wait for charts to render
    await page.waitForSelector('canvas, svg', { timeout: 10000 });

    await percySnapshot(page, 'dashboard-with-data');
  });
});

test.describe('Visual Regression - Invoice List', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@thaiaccounting.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.goto('/invoices');
    await page.waitForLoadState('networkidle');
  });

  test('invoice list page', async ({ page }) => {
    await percySnapshot(page, 'invoice-list');

    await expect(page.locator('text=ใบกำกับภาษี')).toBeVisible();
  });

  test('invoice list with filters', async ({ page }) => {
    // Open filters
    await page.click('text=ตัวกรอง, [data-testid="filter-button"]');
    await page.waitForTimeout(500);

    await percySnapshot(page, 'invoice-list-filters');
  });

  test('invoice create modal', async ({ page }) => {
    await page.click('text=สร้างใหม่, button:has-text("+"), [data-testid="create-button"]');
    await page.waitForSelector('[role="dialog"], .modal, .dialog', { timeout: 5000 });

    await percySnapshot(page, 'invoice-create-modal');
  });
});

test.describe('Visual Regression - Chart of Accounts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@thaiaccounting.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.goto('/accounts');
    await page.waitForLoadState('networkidle');
  });

  test('chart of accounts tree view', async ({ page }) => {
    await percySnapshot(page, 'chart-of-accounts');

    await expect(page.locator('text=ผังบัญชี')).toBeVisible();
  });

  test('account edit dialog', async ({ page }) => {
    // Click on first account
    await page.click('table tbody tr:first-child, .account-item:first-child');
    await page.waitForSelector('[role="dialog"], .modal', { timeout: 5000 });

    await percySnapshot(page, 'account-edit-dialog');
  });
});

test.describe('Visual Regression - Journal Entries', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@thaiaccounting.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.goto('/journal');
    await page.waitForLoadState('networkidle');
  });

  test('journal entry list', async ({ page }) => {
    await percySnapshot(page, 'journal-list');
  });

  test('journal entry create form', async ({ page }) => {
    await page.click('text=สร้างรายการ, button:has-text("+")');
    await page.waitForTimeout(1000);

    await percySnapshot(page, 'journal-entry-create');
  });
});

test.describe('Visual Regression - Reports', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@thaiaccounting.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');
  });

  test('reports page', async ({ page }) => {
    await percySnapshot(page, 'reports-page');
  });

  test('balance sheet report', async ({ page }) => {
    await page.click('text=งบดุล, text=Balance Sheet');
    await page.waitForLoadState('networkidle');

    await percySnapshot(page, 'balance-sheet-report');
  });

  test('profit loss report', async ({ page }) => {
    await page.click('text=งบกำไรขาดทุน, text=Profit & Loss');
    await page.waitForLoadState('networkidle');

    await percySnapshot(page, 'profit-loss-report');
  });
});

test.describe('Visual Regression - Dark Mode', () => {
  test('dashboard in dark mode', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@thaiaccounting.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Toggle dark mode
    await page.click('[data-testid="theme-toggle"], button:has-text("🌙"), button:has-text("☀️")');
    await page.waitForTimeout(500);

    await percySnapshot(page, 'dashboard-dark-mode');
  });
});

test.describe('Visual Regression - Responsive', () => {
  test('mobile view', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await percySnapshot(page, 'login-mobile');
  });

  test('tablet view', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await percySnapshot(page, 'login-tablet');
  });

  test('desktop view', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await percySnapshot(page, 'login-desktop');
  });
});

test.describe('Visual Regression - Error States', () => {
  test('404 error page', async ({ page }) => {
    await page.goto('/non-existent-page');
    await page.waitForLoadState('networkidle');

    await percySnapshot(page, 'error-404');
  });

  test('loading state', async ({ page }) => {
    await page.goto('/login');

    // Navigate to a page that loads data
    await page.fill('input[type="email"]', 'admin@thaiaccounting.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Capture loading state
    await percySnapshot(page, 'loading-state');
  });
});
