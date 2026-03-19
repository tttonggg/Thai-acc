import { test, expect } from '@playwright/test';
import { LoginPage } from '../../tests/pages/login.page';
import { AssetsPage } from '../../tests/pages/assets.page';
import { verifyRecordExists, getAllRecords } from '../../tests/utils/db-verification';

test.describe('Assets Module - Comprehensive Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAs('ACCOUNTANT');
    await loginPage.verifyLoginSuccess();

    // Then navigate to assets
    const assetsPage = new AssetsPage(page);
    await assetsPage.goto();
  });

  test('should create new asset', async ({ page }) => {
    const initialCount = await getAllRecords('asset');

    await page.click('button:has-text("เพิ่มสินทรัพย์ถาวร")');

    // Fill asset details
    await page.fill('input[name="code"]', 'AST001');
    await page.fill('input[name="name"]', 'Test Asset');
    await page.fill('input[name="purchaseCost"]', '100000');
    await page.fill('input[name="salvageValue"]', '10000');
    await page.fill('input[name="usefulLifeYears"]', '5');

    await page.click('button:has-text("บันทึก")');
    await page.waitForSelector('[data-sonner-toast]', { timeout: 5000 });

    const finalCount = await getAllRecords('asset');
    expect(finalCount.length).toBe(initialCount.length + 1);
  });

  test('should edit asset', async ({ page }) => {
    const firstAsset = await page.locator('tbody tr').first();
    await firstAsset.locator('button:has-text("แก้ไข")').click();

    await page.fill('input[name="name"]', 'Updated Asset Name');
    await page.click('button:has-text("บันทึก")');
    await page.waitForSelector('[data-sonner-toast]', { timeout: 5000 });
  });

  test('should toggle asset status', async ({ page }) => {
    const firstAsset = await page.locator('tbody tr').first();
    const statusBadge = firstAsset.locator('[data-status]');

    const initialStatus = await statusBadge.getAttribute('data-status');
    await statusBadge.click();
    await page.waitForTimeout(1000);

    // Verify status changed
    const newStatus = await statusBadge.getAttribute('data-status');
    expect(newStatus).not.toBe(initialStatus);
  });

  test('should view depreciation schedule', async ({ page }) => {
    const firstAsset = await page.locator('tbody tr').first();
    await firstAsset.locator('button:has-text("ดู")').click();

    // Verify schedule dialog
    await expect(page.locator('text=ตารางการคิดค่าเสื่อม')).toBeVisible();
    await expect(page.locator('table')).toBeVisible();

    await page.click('button:has-text("ปิด")');
  });
});
