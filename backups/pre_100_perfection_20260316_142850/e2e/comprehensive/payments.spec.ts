import { test, expect } from '@playwright/test';
import { LoginPage } from '../../tests/pages/login.page';
import { PaymentsPage } from '../../tests/pages/payments.page';

test.describe('Payments Module - Comprehensive Tests', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAs('ACCOUNTANT');
    await loginPage.verifyLoginSuccess();

    const paymentsPage = new PaymentsPage(page);
    await paymentsPage.goto();
  });

  test('should create payment and allocate to invoices', async ({ page }) => {
    await page.click('button:has-text("สร้างใบจ่ายเงิน")');

    await page.selectOption('select[name="vendorId"]', { label: 'Test Vendor' });
    await page.fill('input[name="amount"]', '10000');
    await page.selectOption('select[name="paymentMethod"]', { label: 'โอนเงิน' });

    // Allocate to invoices
    const allocateButton = page.locator('button:has-text("จัดจ่ายอัตโนมัติ")');
    if (await allocateButton.isVisible()) {
      await allocateButton.click();
    }

    await page.click('button:has-text("บันทึก")');
    await page.waitForSelector('[data-sonner-toast]', { timeout: 5000 });
  });

  test('should create payment by cheque', async ({ page }) => {
    await page.click('button:has-text("สร้างใบจ่ายเงิน")');
    await page.selectOption('select[name="vendorId"]', { label: 'Test Vendor' });
    await page.fill('input[name="amount"]', '10000');

    // Select cheque payment method
    await page.selectOption('select[name="paymentMethod"]', { label: 'เช็ค' });

    // Cheque details should appear
    await expect(page.locator('input[name="chequeNo"]')).toBeVisible();
    await expect(page.locator('input[name="chequeDate"]')).toBeVisible();
    await page.selectOption('select[name="bankAccountId"]', { label: 'Test Bank' });

    await page.fill('input[name="chequeNo"]', 'CHK001');
    await page.fill('input[name="chequeDate"]', new Date().toISOString().split('T')[0]);

    await page.click('button:has-text("บันทึก")');
    await page.waitForSelector('[data-sonner-toast]', { timeout: 5000 });
  });
});
