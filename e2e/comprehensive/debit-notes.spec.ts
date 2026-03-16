import { test, expect } from '@playwright/test';
import { LoginPage } from '../../tests/pages/login.page';
import { DebitNotesPage } from '../../tests/pages/debit-notes.page';

test.describe('Debit Notes Module - Comprehensive Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAs('ACCOUNTANT');
    await loginPage.verifyLoginSuccess();

    // Then navigate
    const debitNotesPage = new DebitNotesPage(page);
    await debitNotesPage.goto();
  });

  test('should create debit note', async ({ page }) => {
    await page.click('button:has-text("สร้างใบเพิ่มหนี้")');

    await page.selectOption('select[name="vendorId"]', { label: 'Test Vendor' });
    await page.selectOption('select[name="purchaseInvoiceId"]', { label: 'PO-001' });
    await page.selectOption('select[name="reason"]', { label: 'ค่าใช้จ่ายเพิ่มเติม' });

    await page.click('button:has-text("เพิ่มรายการ")');
    await page.selectOption('select[name="lines.0.productId"]', { label: 'Test Product' });
    await page.fill('input[name="lines.0.quantity"]', '5');

    await page.click('button:has-text("ออกใบเพิ่มหนี้")');
    await page.waitForSelector('[data-sonner-toast]', { timeout: 10000 });

    // Verify debit note created
    await expect(page.locator('text=ISSUED')).toBeVisible();
  });
});
