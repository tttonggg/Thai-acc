import { test, expect } from '@playwright/test';
import { LoginPage } from '../../tests/pages/login.page';
import { CreditNotesPage } from '../../tests/pages/credit-notes.page';

test.describe('Credit Notes Module - Comprehensive Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAs('ACCOUNTANT');
    await loginPage.verifyLoginSuccess();

    // Then navigate to credit notes
    const creditNotesPage = new CreditNotesPage(page);
    await creditNotesPage.goto();
  });

  test('should create credit note', async ({ page }) => {
    await page.click('button:has-text("สร้างใบลดหนี้")');

    await page.selectOption('select[name="customerId"]', { label: 'Test Customer' });
    await page.selectOption('select[name="invoiceId"]', { label: 'INV-001' });
    await page.selectOption('select[name="reason"]', { label: 'คืนสินค้า' });

    await page.click('button:has-text("เพิ่มรายการ")');
    await page.selectOption('select[name="lines.0.productId"]', { label: 'Test Product' });
    await page.fill('input[name="lines.0.quantity"]', '5');
    await page.check('input[name="lines.0.returnStock"]'); // Return to inventory

    await page.click('button:has-text("ออกใบลดหนี้")');
    await page.waitForSelector('[data-sonner-toast]', { timeout: 10000 });

    // Verify credit note created
    await expect(page.locator('text=ISSUED')).toBeVisible();
  });
});
