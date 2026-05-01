import { test, expect } from '@playwright/test';
import { LoginPage } from '../../tests/pages/login.page';
import { PurchasesPage } from '../../tests/pages/purchases.page';
import {
  verifyRecordCount,
  verifyJournalEntry,
  getAllRecords,
} from '../../tests/utils/db-verification';
import { TEST_USERS, URLs } from '../../tests/utils/constants';

/**
 * Comprehensive Purchase Invoice Module Tests
 * Tests every button and verifies database operations
 */
test.describe('Purchase Invoice Module - Comprehensive Tests', () => {
  let loginPage: LoginPage;
  let purchasesPage: PurchasesPage;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    loginPage = new LoginPage(page);
    purchasesPage = new PurchasesPage(page);

    // Login as accountant
    await loginPage.goto();
    await loginPage.loginAs('ACCOUNTANT');
  });

  test.beforeEach(async ({ page }) => {
    purchasesPage = new PurchasesPage(page);
    await purchasesPage.goto();
  });

  test.afterAll(async ({ page }) => {
    // Cleanup test data
  });

  test('should display purchase list with all buttons', async ({ page }) => {
    await expect(page.locator('text=ใบซื้อ')).toBeVisible();
    await expect(page.locator('button:has-text("สร้างใบซื้อ")')).toBeVisible();

    await expect(page.locator('th:has-text("เลขที่")')).toBeVisible();
    await expect(page.locator('th:has-text("ผู้ขาย")')).toBeVisible();
    await expect(page.locator('th:has-text("ยอดสุทธิ")')).toBeVisible();
    await expect(page.locator('th:has-text("สถานะ")')).toBeVisible();
  });

  test('should create new draft purchase invoice', async ({ page }) => {
    const initialCount = await getAllRecords('purchaseInvoice');

    await page.click('button:has-text("สร้างใบซื้อ")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Select vendor
    await page.selectOption('select[name="vendorId"]', { label: 'Test Vendor' });

    // Set purchase date
    await page.fill('input[name="purchaseDate"]', new Date().toISOString().split('T')[0]);

    // Add line item
    await page.click('button:has-text("เพิ่มรายการ")');
    await page.selectOption('select[name="lines.0.productId"]', { label: 'Test Product' });
    await page.fill('input[name="lines.0.quantity"]', '10');
    await page.fill('input[name="lines.0.unitPrice"]', '1000');

    // Save as draft
    await page.click('button:has-text("บันทึก")');
    await page.waitForSelector('[data-sonner-toast]', { timeout: 5000 });

    // Verify purchase created
    const finalCount = await getAllRecords('purchaseInvoice');
    expect(finalCount.length).toBe(initialCount.length + 1);
  });

  test('should edit draft purchase invoice', async ({ page }) => {
    // Create draft
    await page.click('button:has-text("สร้างใบซื้อ")');
    await page.selectOption('select[name="vendorId"]', { label: 'Test Vendor' });
    await page.fill('input[name="purchaseDate"]', new Date().toISOString().split('T')[0]);
    await page.click('button:has-text("เพิ่มรายการ")');
    await page.selectOption('select[name="lines.0.productId"]', { label: 'Test Product' });
    await page.fill('input[name="lines.0.quantity"]', '5');
    await page.click('button:has-text("บันทึก")');
    await page.waitForSelector('[data-sonner-toast]', { timeout: 5000 });

    // Edit draft
    const draftPurchase = await page.locator('tr').filter({ hasText: 'DRAFT' }).first();
    await draftPurchase.locator('button:has-text("แก้ไข")').click();

    await page.fill('input[name="lines.0.quantity"]', '10');
    await page.click('button:has-text("บันทึก")');
    await page.waitForSelector('[data-sonner-toast]', { timeout: 5000 });

    // Verify update
    const purchases = await getAllRecords('purchaseInvoice');
    const updated = purchases.find((p: any) => p.status === 'DRAFT');
    expect(updated.lines[0].quantity).toBe(10);
  });

  test('should delete draft purchase invoice', async ({ page }) => {
    const initialCount = await getAllRecords('purchaseInvoice');

    // Create draft
    await page.click('button:has-text("สร้างใบซื้อ")');
    await page.selectOption('select[name="vendorId"]', { label: 'Test Vendor' });
    await page.click('button:has-text("บันทึก")');
    await page.waitForSelector('[data-sonner-toast]', { timeout: 5000 });

    // Delete
    const draftPurchase = await page.locator('tr').filter({ hasText: 'DRAFT' }).first();
    await draftPurchase.locator('button:has-text("ลบ")').click();
    await page.click('button:has-text("ลบ")');
    await page.waitForSelector('[data-sonner-toast]', { timeout: 5000 });

    // Verify deletion
    const finalCount = await getAllRecords('purchaseInvoice');
    expect(finalCount.length).toBe(initialCount.length);
  });

  test('should issue purchase and create journal entry', async ({ page }) => {
    await page.click('button:has-text("สร้างใบซื้อ")');
    await page.selectOption('select[name="vendorId"]', { label: 'Test Vendor' });
    await page.click('button:has-text("เพิ่มรายการ")');
    await page.selectOption('select[name="lines.0.productId"]', { label: 'Test Product' });
    await page.fill('input[name="lines.0.quantity"]', '10');
    await page.fill('input[name="lines.0.unitPrice"]', '1000');

    // Issue purchase
    await page.click('button:has-text("ออกใบซื้อ")');
    await page.waitForSelector('[data-sonner-toast]', { timeout: 10000 });

    // Verify journal entry
    const purchases = await getAllRecords('purchaseInvoice');
    const issued = purchases.find((p: any) => p.status === 'ISSUED');
    expect(issued).toBeDefined();
    expect(await verifyJournalEntry('purchaseInvoice', issued.id)).toBeTruthy();
  });
});
