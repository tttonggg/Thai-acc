import { test, expect } from '@playwright/test';
import { LoginPage } from '../../tests/pages/login.page';
import { PettyCashPage } from '../../tests/pages/petty-cash.page';

test.describe('Petty Cash Module - Comprehensive Tests', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAs('ACCOUNTANT');
    await loginPage.verifyLoginSuccess();

    const pettyCashPage = new PettyCashPage(page);
    await pettyCashPage.goto();
  });

  test('should create petty cash fund', async ({ page }) => {
    await page.click('button:has-text("เงินทุน")');

    await page.click('button:has-text("เพิ่มเงินทุน")');
    await page.fill('input[name="code"]', 'PCF001');
    await page.fill('input[name="name"]', 'General Fund');
    await page.fill('input[name="maxAmount"]', '10000');
    await page.selectOption('select[name="custodianId"]', { label: 'Admin' });

    await page.click('button:has-text("บันทึก")');
    await page.waitForSelector('[data-sonner-toast]', { timeout: 5000 });
  });

  test('should create petty cash voucher', async ({ page }) => {
    await page.click('button:has-text("ใบสำคัญจ่าย")');

    await page.click('button:has-text("สร้างใบสำคัญ")');
    await page.selectOption('select[name="fundId"]', { label: 'General Fund' });
    await page.fill('input[name="amount"]', '500');
    await page.fill('input[name="payee"]', 'Test Payee');
    await page.fill('input[name="description"]', 'Office supplies');

    await page.click('button:has-text("บันทึก")');
    await page.waitForSelector('[data-sonner-toast]', { timeout: 5000 });
  });

  test('should approve voucher', async ({ page }) => {
    await page.click('button:has-text("ใบสำคัญจ่าย")');

    const pendingVoucher = await page.locator('tr').filter({ hasText: 'รออนุมัติ' }).first();

    if ((await pendingVoucher.count()) > 0) {
      await pendingVoucher.locator('button:has-text("อนุมัติ")').click();
      await page.waitForSelector('[data-sonner-toast]', { timeout: 5000 });

      await expect(page.locator('text=อนุมัติแล้ว')).toBeVisible();
    }
  });

  test('should reimburse voucher', async ({ page }) => {
    await page.click('button:has-text("ใบสำคัญจ่าย")');

    const approvedVoucher = await page.locator('tr').filter({ hasText: 'อนุมัติแล้ว' }).first();

    if ((await approvedVoucher.count()) > 0) {
      await approvedVoucher.locator('button:has-text("เติมเงิน")').click();

      await page.click('button:has-text("ยืนยัน")');
      await page.waitForSelector('[data-sonner-toast]', { timeout: 5000 });

      await expect(page.locator('text=เติมแล้ว')).toBeVisible();
    }
  });
});
