import { test, expect } from '@playwright/test';

/**
 * E2E Test to Verify Payment Form Unpaid Invoices Loading Fix
 *
 * This test verifies that unpaid invoices load correctly when a vendor is selected
 * in the payment form.
 *
 * Issue: https://github.com/your-org/thai-acc/issues/XXX
 * Fix: Corrected API response parsing in payment-form.tsx
 */

test.describe('Payment Form - Unpaid Invoices Loading', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('http://localhost:3000');
    await page.fill('input[name="email"]', 'admin@thaiaccounting.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL('http://localhost:3000/');
    await page.waitForTimeout(1000);
  });

  test('[CRITICAL] Should load unpaid invoices when vendor V002 is selected', async ({ page }) => {
    // Navigate to Payments page
    await page.click('aside nav button:has-text("ใบจ่ายเงิน")');
    await page.waitForURL('http://localhost:3000/payments');

    // Click "Create New Payment" button
    await page.click('button:has-text("สร้างใบจ่ายเงินใหม่")');

    // Wait for dialog to open
    await page.waitForSelector('dialog[open]', { timeout: 5000 });

    // Select vendor V002 (บริษัท โลจิสติกส์ไทย จำกัด)
    await page.click('#vendorId');
    await page.click('div[role="option"]:has-text("V002")');

    // Wait for unpaid invoices to load (API call completes)
    await page.waitForTimeout(1000);

    // CRITICAL: Verify unpaid invoices section is NOT showing "ไม่พบยอดค้างจ่าย"
    const noBalanceText = page.locator('p:has-text("ไม่พบยอดค้างจ่าย")');
    await expect(noBalanceText).not.toBeVisible();

    // CRITICAL: Verify unpaid invoices are displayed
    const invoiceCards = page.locator('div[class*="border"][class*="rounded"]').filter({
      hasText: /PO202603-0001|PO202603-0002/,
    });
    await expect(invoiceCards.first()).toBeVisible({ timeout: 5000 });

    // Verify first invoice details
    await expect(page.locator('text=PO202603-0001')).toBeVisible();
    await expect(page.locator('text=/ค้างจ่าย.*292,214/')).toBeVisible();

    // Verify second invoice details
    await expect(page.locator('text=PO202603-0002')).toBeVisible();
    await expect(page.locator('text=/ค้างจ่าย.*269,640/')).toBeVisible();

    // Verify total AP balance is displayed
    await expect(page.locator('text=/ยอดค้างจ่าย.*561,854/')).toBeVisible();

    // Verify "Auto Allocate" button is enabled
    const autoAllocateButton = page.locator('button:has-text("จัดสรรอัตโนมัติ")');
    await expect(autoAllocateButton).toBeEnabled();
  });

  test('[CRITICAL] Should auto-allocate payment to unpaid invoices', async ({ page }) => {
    // Navigate to Payments page
    await page.click('aside nav button:has-text("ใบจ่ายเงิน")');
    await page.waitForURL('http://localhost:3000/payments');

    // Click "Create New Payment" button
    await page.click('button:has-text("สร้างใบจ่ายเงินใหม่")');

    // Wait for dialog to open
    await page.waitForSelector('dialog[open]', { timeout: 5000 });

    // Select vendor V002
    await page.click('#vendorId');
    await page.click('div[role="option"]:has-text("V002")');

    // Wait for unpaid invoices to load
    await page.waitForTimeout(1000);

    // Enter payment amount
    await page.fill('input[name="amount"]', '500000');

    // Click "Auto Allocate" button
    await page.click('button:has-text("จัดสรรอัตโนมัติ")');

    // Wait for allocations to populate
    await page.waitForTimeout(500);

    // Verify allocation fields are populated
    const allocationInputs = page.locator('input[type="number"][placeholder="0.00"]');
    const firstInputValue = await allocationInputs.first().inputValue();
    const secondInputValue = await allocationInputs.nth(1).inputValue();

    // Verify allocations sum to payment amount (or less if invoices are fully paid)
    const totalAllocated = parseFloat(firstInputValue || '0') + parseFloat(secondInputValue || '0');
    expect(totalAllocated).toBeGreaterThan(0);
    expect(totalAllocated).toBeLessThanOrEqual(500000);

    // Verify "Save" button is enabled
    const saveButton = page.locator('button:has-text("บันทิก")');
    await expect(saveButton).toBeEnabled();
  });

  test('[CRITICAL] Should show empty state when vendor has no unpaid invoices', async ({
    page,
  }) => {
    // Navigate to Payments page
    await page.click('aside nav button:has-text("ใบจ่ายเงิน")');
    await page.waitForURL('http://localhost:3000/payments');

    // Click "Create New Payment" button
    await page.click('button:has-text("สร้างใบจ่ายเงินใหม่")');

    // Wait for dialog to open
    await page.waitForSelector('dialog[open]', { timeout: 5000 });

    // Select a vendor with no unpaid invoices (if exists)
    // This test assumes V001 might not have unpaid invoices
    await page.click('#vendorId');
    const vendorOption = page.locator('div[role="option"]:has-text("V001")').first();

    if (await vendorOption.isVisible()) {
      await vendorOption.click();
      await page.waitForTimeout(1000);

      // Verify "No unpaid invoices" message is shown
      await expect(page.locator('p:has-text("ไม่มีใบซื้อค้างจ่าย")')).toBeVisible();

      // Verify "Auto Allocate" button is disabled
      const autoAllocateButton = page.locator('button:has-text("จัดสรรอัตโนมัติ")');
      await expect(autoAllocateButton).toBeDisabled();
    } else {
      test.skip('No vendor without unpaid invoices found');
    }
  });

  test('[DEBUG] Should verify API response structure', async ({ page }) => {
    // Navigate to Payments page
    await page.click('aside nav button:has-text("ใบจ่ายเงิน")');
    await page.waitForURL('http://localhost:3000/payments');

    // Click "Create New Payment" button
    await page.click('button:has-text("สร้างใบจ่ายเงินใหม่")');

    // Wait for dialog to open
    await page.waitForSelector('dialog[open]', { timeout: 5000 });

    // Setup API response listener
    const apiResponses: any[] = [];
    page.on('response', async (response) => {
      if (response.url().includes('/api/payments/unpaid-invoices')) {
        try {
          const body = await response.json();
          apiResponses.push(body);
          console.log('API Response:', JSON.stringify(body, null, 2));
        } catch (e) {
          console.error('Failed to parse API response:', e);
        }
      }
    });

    // Select vendor V002
    await page.click('#vendorId');
    await page.click('div[role="option"]:has-text("V002")');

    // Wait for API call
    await page.waitForTimeout(2000);

    // Verify API was called and response structure is correct
    expect(apiResponses.length).toBeGreaterThan(0);

    const response = apiResponses[0];
    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
    expect(response.data.invoices).toBeDefined();
    expect(Array.isArray(response.data.invoices)).toBe(true);
    expect(response.data.totalAPBalance).toBeDefined();
    expect(response.data.totalAPBalance).toBe(561854);
    expect(response.data.invoices.length).toBe(2);
    expect(response.data.invoices[0].invoiceNo).toBe('PO202603-0001');
    expect(response.data.invoices[1].invoiceNo).toBe('PO202603-0002');
  });
});
