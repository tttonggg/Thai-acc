import { test, expect } from '@playwright/test';
import { LoginPage } from '../../tests/pages/login.page';
import { BankingPage } from '../../tests/pages/banking.page';

test.describe('Banking Module - Comprehensive Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAs('ACCOUNTANT');
    await loginPage.verifyLoginSuccess();

    // Then navigate to banking
    const bankingPage = new BankingPage(page);
    await bankingPage.goto();
  });

  test('should create bank account', async ({ page }) => {
    await page.click('button:has-text("บัญชีธนาคาร")');

    await page.click('button:has-text("เพิ่มบัญชี")');
    await page.fill('input[name="bankName"]', 'Test Bank');
    await page.fill('input[name="accountNumber"]', '1234567890');
    await page.fill('input[name="accountName"]', 'Test Account');

    await page.click('button:has-text("บันทึก")');
    await page.waitForSelector('[data-sonner-toast]', { timeout: 5000 });
  });

  test('should create cheque', async ({ page }) => {
    await page.click('button:has-text("เช็ครับโอน")');

    await page.click('button:has-text("สร้างเช็ค")');
    await page.fill('input[name="chequeNo"]', 'CHK001');
    await page.fill('input[name="amount"]', '10000');
    await page.selectOption('select[name="bankAccountId"]', { label: 'Test Bank' });

    await page.click('button:has-text("บันทึก")');
    await page.waitForSelector('[data-sonner-toast]', { timeout: 5000 });
  });

  test('should deposit cheque', async ({ page }) => {
    const onHandCheque = await page.locator('tr').filter({ hasText: 'ON_HAND' }).first();

    if (await onHandCheque.count() > 0) {
      await onHandCheque.locator('button:has-text("ฝาก")').click();
      await page.waitForSelector('[data-sonner-toast]', { timeout: 5000 });

      // Verify status changed to DEPOSITED
      await expect(page.locator('text=DEPOSITED')).toBeVisible();
    }
  });

  test('should clear deposited cheque', async ({ page }) => {
    const depositedCheque = await page.locator('tr').filter({ hasText: 'DEPOSITED' }).first();

    if (await depositedCheque.count() > 0) {
      await depositedCheque.locator('button:has-text("ผ่าน")').click();
      await page.waitForSelector('[data-sonner-toast]', { timeout: 5000 });

      // Verify status changed to CLEARED
      await expect(page.locator('text=CLEARED')).toBeVisible();
    }
  });
});
