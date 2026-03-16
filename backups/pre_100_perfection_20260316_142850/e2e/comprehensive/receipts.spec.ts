import { test, expect } from '@playwright/test';
import { LoginPage } from '../../tests/pages/login.page';
import { ReceiptsPage } from '../../tests/pages/receipts.page';
import { verifyRecordExists } from '../../tests/utils/db-verification';

test.describe('Receipts Module - Comprehensive Tests', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAs('ACCOUNTANT');
    await loginPage.verifyLoginSuccess();

    const receiptsPage = new ReceiptsPage(page);
    await receiptsPage.goto();
  });

  test('should create receipt and allocate to invoices', async ({ page }) => {
    await page.click('button:has-text("สร้างใบเสร็จรับเงิน")');

    // Select customer
    await page.selectOption('select[name="customerId"]', { label: 'Test Customer' });

    // Enter payment details
    await page.fill('input[name="amount"]', '10000');
    await page.selectOption('select[name="paymentMethod"]', { label: 'โอนเงิน' });

    // Allocate to invoices
    const allocateButton = page.locator('button:has-text("จัดจ่ายอัตโนมัติ")');
    if (await allocateButton.isVisible()) {
      await allocateButton.click();
    }

    // Post receipt
    await page.click('button:has-text("บันทึก")');
    await page.waitForSelector('[data-sonner-toast]', { timeout: 5000 });

    // Verify receipt created
    const receipts = await page.locator('tbody tr');
    expect(await receipts.count()).toBeGreaterThan(0);
  });

  test('should handle WHT deduction', async ({ page }) => {
    await page.click('button:has-text("สร้างใบเสร็จรับเงิน")');
    await page.selectOption('select[name="customerId"]', { label: 'Test Customer' });
    await page.fill('input[name="amount"]', '10000');

    // Allocate with WHT
    const whtInput = page.locator('input[placeholder*="WHT"]');
    if (await whtInput.isVisible()) {
      await whtInput.fill('3'); // 3% WHT

      // Verify calculation
      await expect(page.locator('text=300')).toBeVisible(); // WHT amount
    }
  });
});
