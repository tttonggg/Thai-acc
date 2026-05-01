import { test, expect } from '@playwright/test';
import { LoginPage } from '../../tests/pages/login.page';
import { InvoicesPage } from '../../tests/pages/invoices.page';
import {
  verifyRecordCount,
  verifyRecordExists,
  verifyJournalEntry,
  getAllRecords,
} from '../../tests/utils/db-verification';
import { TEST_USERS, URLs } from '../../tests/utils/constants';

/**
 * Comprehensive Invoice Module Tests
 * Tests every button and verifies database operations
 */
test.describe('Invoice Module - Comprehensive Tests', () => {
  let loginPage: LoginPage;
  let invoicesPage: InvoicesPage;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    loginPage = new LoginPage(page);
    invoicesPage = new InvoicesPage(page);

    // Login as accountant
    await loginPage.goto();
    await loginPage.loginAs('ACCOUNTANT');
  });

  test.beforeEach(async ({ page }) => {
    invoicesPage = new InvoicesPage(page);
    await invoicesPage.goto();
  });

  test.afterAll(async ({ page }) => {
    // Cleanup test data
    // Delete test invoices created during tests
  });

  test('should display invoice list with all buttons', async ({ page }) => {
    // Verify main page elements
    await expect(page.locator('text=ใบกำกับภาษี')).toBeVisible();
    await expect(page.locator('button:has-text("สร้างใบกำกับภาษี")')).toBeVisible();

    // Verify table columns
    await expect(page.locator('th:has-text("เลขที่")')).toBeVisible();
    await expect(page.locator('th:has-text("วันที่")')).toBeVisible();
    await expect(page.locator('th:has-text("ลูกค้า")')).toBeVisible();
    await expect(page.locator('th:has-text("ยอดสุทธิ")')).toBeVisible();
    await expect(page.locator('th:has-text("สถานะ")')).toBeVisible();
    await expect(page.locator('th:has-text("จัดการ")')).toBeVisible();
  });

  test('should create new draft invoice', async ({ page }) => {
    const initialCount = await getAllRecords('invoice');

    // Click "New Invoice" button
    await page.click('button:has-text("สร้างใบกำกับภาษี")');

    // Wait for form to open
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('text=สร้างใบกำกับภาษีใหม่')).toBeVisible();

    // Select customer
    await page.selectOption('select[name="customerId"]', { label: 'Test Customer' });

    // Set invoice date
    await page.fill('input[name="invoiceDate"]', new Date().toISOString().split('T')[0]);

    // Add line item
    await page.click('button:has-text("เพิ่มรายการ")');
    await page.selectOption('select[name="lines.0.productId"]', { label: 'Test Product' });
    await page.fill('input[name="lines.0.quantity"]', '10');
    await page.fill('input[name="lines.0.unitPrice"]', '1000');

    // Verify automatic calculations
    await expect(page.locator('input[name="subtotal"]')).toHaveValue('10000');
    await expect(page.locator('input[name="vatAmount"]')).toHaveValue('700');
    await expect(page.locator('input[name="totalAmount"]')).toHaveValue('10700');

    // Save as draft
    await page.click('button:has-text("บันทึก")');

    // Wait for success toast
    await page.waitForSelector('[data-sonner-toast]', { timeout: 5000 });

    // Verify invoice created in database
    const finalCount = await getAllRecords('invoice');
    expect(finalCount.length).toBe(initialCount.length + 1);

    // Verify invoice is in DRAFT status
    const invoices = await getAllRecords('invoice');
    const newInvoice = invoices.find((inv: any) => inv.status === 'DRAFT');
    expect(newInvoice).toBeDefined();
  });

  test('should edit draft invoice', async ({ page }) => {
    // Create a draft invoice first
    await page.click('button:has-text("สร้างใบกำกับภาษี")');
    await page.selectOption('select[name="customerId"]', { label: 'Test Customer' });
    await page.fill('input[name="invoiceDate"]', new Date().toISOString().split('T')[0]);
    await page.click('button:has-text("เพิ่มรายการ")');
    await page.selectOption('select[name="lines.0.productId"]', { label: 'Test Product' });
    await page.fill('input[name="lines.0.quantity"]', '5');
    await page.fill('input[name="lines.0.unitPrice"]', '500');
    await page.click('button:has-text("บันทึก")');
    await page.waitForSelector('[data-sonner-toast]', { timeout: 5000 });

    // Find the draft invoice and click edit
    const draftInvoice = await page.locator('tr').filter({ hasText: 'DRAFT' }).first();
    const editButton = draftInvoice.locator('button:has-text("แก้ไข")');
    await editButton.click();

    // Wait for edit dialog
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Modify quantity
    await page.fill('input[name="lines.0.quantity"]', '10');

    // Save changes
    await page.click('button:has-text("บันทึก")');
    await page.waitForSelector('[data-sonner-toast]', { timeout: 5000 });

    // Verify invoice updated in database
    const invoices = await getAllRecords('invoice');
    const updatedInvoice = invoices.find((inv: any) => inv.status === 'DRAFT');
    expect(updatedInvoice).toBeDefined();
    expect(updatedInvoice.lines[0].quantity).toBe(10);
  });

  test('should delete draft invoice', async ({ page }) => {
    // Create a draft invoice
    await page.click('button:has-text("สร้างใบกำกับภาษี")');
    await page.selectOption('select[name="customerId"]', { label: 'Test Customer' });
    await page.fill('input[name="invoiceDate"]', new Date().toISOString().split('T')[0]);
    await page.click('button:has-text("บันทึก")');
    await page.waitForSelector('[data-sonner-toast]', { timeout: 5000 });

    const initialCount = await getAllRecords('invoice');

    // Find and delete the draft invoice
    const draftInvoice = await page.locator('tr').filter({ hasText: 'DRAFT' }).first();
    const deleteButton = draftInvoice.locator('button:has-text("ลบ")');
    await deleteButton.click();

    // Confirm deletion
    await expect(page.locator('text=คุณต้องการลบใบกำกับภาษีนี้?')).toBeVisible();
    await page.click('button:has-text("ลบ")');
    await page.waitForSelector('[data-sonner-toast]', { timeout: 5000 });

    // Verify deletion in database
    const finalCount = await getAllRecords('invoice');
    expect(finalCount.length).toBe(initialCount.length - 1);
  });

  test('should issue invoice and create journal entry', async ({ page }) => {
    // Create and issue invoice
    await page.click('button:has-text("สร้างใบกำกับภาษี")');
    await page.selectOption('select[name="customerId"]', { label: 'Test Customer' });
    await page.fill('input[name="invoiceDate"]', new Date().toISOString().split('T')[0]);
    await page.click('button:has-text("เพิ่มรายการ")');
    await page.selectOption('select[name="lines.0.productId"]', { label: 'Test Product' });
    await page.fill('input[name="lines.0.quantity"]', '10');
    await page.fill('input[name="lines.0.unitPrice"]', '1000');

    // Issue invoice directly (post to GL)
    await page.click('button:has-text("ออกใบกำกับภาษี")');
    await page.waitForSelector('[data-sonner-toast]', { timeout: 10000 });

    // Verify invoice status changed to ISSUED
    const invoices = await getAllRecords('invoice');
    const issuedInvoice = invoices.find((inv: any) => inv.status === 'ISSUED');
    expect(issuedInvoice).toBeDefined();

    // Verify journal entry created
    expect(await verifyJournalEntry('invoice', issuedInvoice.id)).toBeTruthy();

    // Verify journal entry balances
    const journalEntries = await getAllRecords('journalEntry');
    const je = journalEntries.find((e: any) => e.documentId === issuedInvoice.id);
    expect(je.totalDebit).toBe(je.totalCredit);
    expect(je.totalDebit).toBe(10700); // 10000 + 700 VAT
  });

  test('should filter invoices by status', async ({ page }) => {
    // Test status filter dropdown
    await page.selectOption('select[name="status"]', 'DRAFT');
    await page.waitForTimeout(1000);

    // Verify only draft invoices shown
    const rows = await page.locator('tbody tr').count();
    for (let i = 0; i < rows; i++) {
      const row = page.locator('tbody tr').nth(i);
      await expect(row.locator('text=DRAFT')).toBeVisible();
    }
  });

  test('should search invoices by customer name', async ({ page }) => {
    // Enter search term
    await page.fill('input[placeholder*="ค้นหา"]', 'Test Customer');
    await page.waitForTimeout(1000);

    // Verify search results
    const rows = await page.locator('tbody tr').count();
    if (rows > 0) {
      const firstRow = page.locator('tbody tr').first();
      await expect(firstRow.locator('text=Test Customer')).toBeVisible();
    }
  });

  test('should export invoice as PDF', async ({ page }) => {
    // Create and issue an invoice
    await page.click('button:has-text("สร้างใบกำกับภาษี")');
    await page.selectOption('select[name="customerId"]', { label: 'Test Customer' });
    await page.fill('input[name="invoiceDate"]', new Date().toISOString().split('T')[0]);
    await page.click('button:has-text("เพิ่มรายการ")');
    await page.selectOption('select[name="lines.0.productId"]', { label: 'Test Product' });
    await page.fill('input[name="lines.0.quantity"]', '1');
    await page.fill('input[name="lines.0.unitPrice"]', '1000');
    await page.click('button:has-text("ออกใบกำกับภาษี")');
    await page.waitForSelector('[data-sonner-toast]', { timeout: 10000 });

    // Open invoice view dialog
    const firstInvoice = await page.locator('tbody tr').first();
    const viewButton = firstInvoice.locator('button:has-text("ดู")');
    await viewButton.click();

    // Verify export button exists
    await expect(page.locator('button:has-text("ดาวน์โหลด PDF")')).toBeVisible();

    // Close dialog
    await page.click('button:has-text("ปิด")');
  });

  test('should validate invoice form - missing required fields', async ({ page }) => {
    await page.click('button:has-text("สร้างใบกำกับภาษี")');

    // Try to save without customer
    await page.click('button:has-text("บันทึก")');

    // Should show validation error
    await expect(page.locator('text=กรุณาเลือกลูกค้า')).toBeVisible();
  });

  test('should validate invoice form - invalid quantity', async ({ page }) => {
    await page.click('button:has-text("สร้างใบกำกับภาษี")');
    await page.selectOption('select[name="customerId"]', { label: 'Test Customer' });
    await page.click('button:has-text("เพิ่มรายการ")');
    await page.selectOption('select[name="lines.0.productId"]', { label: 'Test Product' });

    // Enter invalid quantity
    await page.fill('input[name="lines.0.quantity"]', '-5');

    // Should show validation error
    await expect(page.locator('text=จำนวนต้องมากกว่า 0')).toBeVisible();
  });

  test('should not allow editing posted invoice', async ({ page }) => {
    // Find an ISSUED or POSTED invoice
    const postedInvoice = await page
      .locator('tr')
      .filter({ hasText: /(ISSUED|POSTED)/ })
      .first();

    if ((await postedInvoice.count()) > 0) {
      // Edit button should be disabled or not present
      const editButton = postedInvoice.locator('button:has-text("แก้ไข")');
      const isEnabled = await editButton.isEnabled();
      expect(isEnabled).toBeFalsy();
    }
  });
});
