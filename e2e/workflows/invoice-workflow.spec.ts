/**
 * Invoice Workflow E2E Tests
 * Complete invoice lifecycle testing
 */

import { test, expect } from '@playwright/test';

test.describe('Invoice Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'admin@thaiaccounting.com');
    await page.fill('[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('complete invoice lifecycle: create → post → print', async ({ page }) => {
    // Navigate to invoices
    await page.click('text=ใบกำกับภาษี');
    await page.waitForSelector('table, [data-testid="invoices-list"]');

    // Create new invoice
    await page.click('text=สร้างใบกำกับภาษี');
    await page.waitForSelector('form, [data-testid="invoice-form"]');

    // Select customer
    await page.click('[data-testid="customer-select"]');
    await page.fill('[data-testid="customer-search"]', 'ลูกค้า');
    await page.click('[data-testid="customer-option"]:first-child');

    // Set invoice date
    await page.fill('[data-testid="invoice-date"]', '15/03/2567');

    // Add line item
    await page.click('[data-testid="add-line"]');
    await page.fill('[data-testid="line-0-description"]', 'สินค้าทดสอบ');
    await page.fill('[data-testid="line-0-quantity"]', '10');
    await page.fill('[data-testid="line-0-price"]', '1000');

    // Verify calculations
    const subtotal = await page.locator('[data-testid="subtotal"]').textContent();
    expect(subtotal).toContain('10,000');

    const vat = await page.locator('[data-testid="vat-amount"]').textContent();
    expect(vat).toContain('700');

    const total = await page.locator('[data-testid="total"]').textContent();
    expect(total).toContain('10,700');

    // Save invoice
    await page.click('button:has-text("บันทึก")');
    await page.waitForSelector('text=บันทึกสำเร็จ', { timeout: 5000 });

    // Get invoice number
    const invoiceNo = await page.locator('[data-testid="invoice-number"]').textContent();
    expect(invoiceNo).toBeTruthy();

    // Post invoice
    await page.click('button:has-text("บันทึกบัญชี")');
    await page.waitForSelector('text=บันทึกบัญชีสำเร็จ', { timeout: 5000 });

    // Verify status changed
    const status = await page.locator('[data-testid="invoice-status"]').textContent();
    expect(status).toContain('POSTED');

    // Print preview
    await page.click('button:has-text("พิมพ์")');
    await page.waitForSelector('[data-testid="print-preview"]', { timeout: 5000 });
  });

  test('invoice with discount and withholding tax', async ({ page }) => {
    await page.click('text=ใบกำกับภาษี');
    await page.click('text=สร้างใบกำกับภาษี');

    // Select customer
    await page.click('[data-testid="customer-select"]');
    await page.click('[data-testid="customer-option"]:first-child');

    // Add service line
    await page.click('[data-testid="add-line"]');
    await page.fill('[data-testid="line-0-description"]', 'ค่าบริการ');
    await page.fill('[data-testid="line-0-quantity"]', '1');
    await page.fill('[data-testid="line-0-price"]', '10000');

    // Apply discount
    await page.fill('[data-testid="discount-amount"]', '1000');

    // Verify subtotal after discount
    const subtotal = await page.locator('[data-testid="subtotal"]').textContent();
    expect(subtotal).toContain('9,000');

    // Set withholding tax
    await page.fill('[data-testid="withholding-rate"]', '3');

    // Verify withholding amount
    const wht = await page.locator('[data-testid="withholding-amount"]').textContent();
    expect(wht).toContain('270');

    // Save
    await page.click('button:has-text("บันทึก")');
    await page.waitForSelector('text=บันทึกสำเร็จ');
  });

  test('invoice with multiple lines and VAT inclusive', async ({ page }) => {
    await page.click('text=ใบกำกับภาษี');
    await page.click('text=สร้างใบกำกับภาษี');

    // Select customer
    await page.click('[data-testid="customer-select"]');
    await page.click('[data-testid="customer-option"]:first-child');

    // Add multiple lines
    await page.click('[data-testid="add-line"]');
    await page.fill('[data-testid="line-0-description"]', 'สินค้า A');
    await page.fill('[data-testid="line-0-quantity"]', '5');
    await page.fill('[data-testid="line-0-price"]', '1000');

    await page.click('[data-testid="add-line"]');
    await page.fill('[data-testid="line-1-description"]', 'สินค้า B');
    await page.fill('[data-testid="line-1-quantity"]', '3');
    await page.fill('[data-testid="line-1-price"]', '2000');

    // Change to VAT inclusive
    await page.selectOption('[data-testid="vat-type"]', 'INCLUSIVE');

    // Verify totals
    const total = await page.locator('[data-testid="total"]').textContent();
    expect(total).toContain('11,214'); // (5000+6000)*1.07 / 1.07 = ~11214

    await page.click('button:has-text("บันทึก")');
    await page.waitForSelector('text=บันทึกสำเร็จ');
  });

  test('search and filter invoices', async ({ page }) => {
    await page.click('text=ใบกำกับภาษี');

    // Search by invoice number
    await page.fill('[data-testid="search-input"]', 'INV');
    await page.press('[data-testid="search-input"]', 'Enter');
    await page.waitForTimeout(1000);

    // Filter by date
    await page.fill('[data-testid="date-from"]', '01/01/2567');
    await page.fill('[data-testid="date-to"]', '31/12/2567');
    await page.click('button:has-text("ค้นหา")');
    await page.waitForTimeout(1000);

    // Filter by status
    await page.selectOption('[data-testid="status-filter"]', 'POSTED');
    await page.waitForTimeout(1000);

    // Clear filters
    await page.click('button:has-text("ล้าง")');
    await page.waitForTimeout(1000);
  });

  test('edit draft invoice', async ({ page }) => {
    // Create a draft invoice first
    await page.click('text=ใบกำกับภาษี');
    await page.click('text=สร้างใบกำกับภาษี');
    await page.click('[data-testid="customer-select"]');
    await page.click('[data-testid="customer-option"]:first-child');
    await page.click('[data-testid="add-line"]');
    await page.fill('[data-testid="line-0-description"]', 'สินค้า');
    await page.fill('[data-testid="line-0-quantity"]', '1');
    await page.fill('[data-testid="line-0-price"]', '1000');
    await page.click('button:has-text("บันทึก")');
    await page.waitForSelector('text=บันทึกสำเร็จ');

    // Go back to list
    await page.click('text=ใบกำกับภาษี');

    // Find and edit the draft
    await page.click('table tbody tr:first-child td:first-child');
    await page.waitForSelector('[data-testid="invoice-form"]');

    // Edit line
    await page.fill('[data-testid="line-0-quantity"]', '5');

    // Add note
    await page.fill('[data-testid="notes"]', 'Updated notes');

    // Save
    await page.click('button:has-text("บันทึก")');
    await page.waitForSelector('text=บันทึกสำเร็จ');
  });

  test('invoice cancellation and credit note', async ({ page }) => {
    await page.click('text=ใบกำกับภาษี');

    // Open an existing invoice
    await page.click('table tbody tr:first-child');
    await page.waitForSelector('[data-testid="invoice-details"]');

    // Click cancel
    await page.click('button:has-text("ยกเลิก")');
    await page.waitForSelector('[data-testid="cancel-dialog"]');

    // Confirm cancellation with reason
    await page.fill('[data-testid="cancel-reason"]', 'รายการผิดพลาด');
    await page.click('button:has-text("ยืนยัน")');
    await page.waitForSelector('text=ยกเลิกสำเร็จ');

    // Verify credit note created
    await page.click('text=ใบลดหนี้');
    await page.waitForSelector('text=CN'); // Credit note number prefix
  });
});
