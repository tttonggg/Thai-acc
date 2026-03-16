import { test, expect } from '@playwright/test';
import { LoginPage } from '../../tests/pages/login.page';
import { InventoryPage } from '../../tests/pages/inventory.page';

test.describe('Inventory Module - Comprehensive Tests', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAs('ACCOUNTANT');
    await loginPage.verifyLoginSuccess();

    const inventoryPage = new InventoryPage(page);
    await inventoryPage.goto();
  });

  test('should create warehouse', async ({ page }) => {
    await page.click('button:has-text("คลังสินค้า")');

    await page.click('button:has-text("เพิ่มคลัง")');
    await page.fill('input[name="code"]', 'WH001');
    await page.fill('input[name="name"]', 'Test Warehouse');
    await page.selectOption('select[name="type"]', { label: 'คลังหลัก' });

    await page.click('button:has-text("บันทึก")');
    await page.waitForSelector('[data-sonner-toast]', { timeout: 5000 });
  });

  test('should adjust stock quantity', async ({ page }) => {
    await page.click('button:has-text("ยอดคงเหลือ")');

    const firstStock = await page.locator('tbody tr').first();
    await firstStock.locator('button:has-text("ปรับจำนวน")').click();

    await page.fill('input[name="newQuantity"]', '100');
    await page.selectOption('select[name="reason"]', { label: 'นับจำนวนจริง' });
    await page.fill('input[name="notes"]', 'Stock adjustment test');

    await page.click('button:has-text("บันทึก")');
    await page.waitForSelector('[data-sonner-toast]', { timeout: 5000 });
  });

  test('should create stock transfer', async ({ page }) => {
    await page.click('button:has-text("โอนย้ายสินค้า")');

    await page.click('button:has-text("สร้างโอนย้าย")');
    await page.selectOption('select[name="fromWarehouseId"]', { label: 'Warehouse A' });
    await page.selectOption('select[name="toWarehouseId"]', { label: 'Warehouse B' });

    // Add transfer line
    await page.click('button:has-text("เพิ่มรายการ")');
    await page.selectOption('select[name="lines.0.productId"]', { label: 'Test Product' });
    await page.fill('input[name="lines.0.quantity"]', '10');

    await page.click('button:has-text("บันทึก")');
    await page.waitForSelector('[data-sonner-toast]', { timeout: 5000 });
  });

  test('should complete stock transfer', async ({ page }) => {
    await page.click('button:has-text("โอนย้ายสินค้า")');

    const inTransitTransfer = await page.locator('tr').filter({ hasText: 'IN_TRANSIT' }).first();

    if (await inTransitTransfer.count() > 0) {
      await inTransitTransfer.locator('button:has-text("ดำเนินการ")').click();

      // Complete transfer
      await page.click('button:has-text("ยืนยันการรับ")');
      await page.waitForSelector('[data-sonner-toast]', { timeout: 5000 });

      await expect(page.locator('text=COMPLETED')).toBeVisible();
    }
  });
});
