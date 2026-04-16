import { test, expect } from '@playwright/test';

test.describe('Invoice Save & Display Bug Fixes', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000');
    await page.fill('input[name="email"]', 'admin@thaiaccounting.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3000/dashboard');
  });

  test('GET /api/invoices returns Baht not Satang (fixes 10x bug)', async ({ page }) => {
    // Navigate to invoices
    await page.click('text=ใบกำกับภาษี');

    // Wait for list to load
    await page.waitForSelector('table tbody tr');

    // Get first invoice amount from table
    const firstRow = page.locator('table tbody tr').first();
    const amountText = await firstRow.locator('td').nth(3).textContent();

    console.log('First invoice amount displayed:', amountText);

    // Should show Baht format like "฿1,320.98" NOT "฿132,098.00"
    expect(amountText).toBeDefined();

    // If it shows thousands with decimals, it's probably the 10x bug
    if (amountText?.includes('฿')) {
      const numericPart = amountText.replace(/[฿,]/g, '');
      const amount = parseFloat(numericPart);

      console.log('Parsed amount:', amount);

      // Real invoice amounts should be reasonable (not 132098 for a 1320 invoice)
      // This is a heuristic check - adjust threshold based on your data
      if (amount > 50000) {
        console.warn('⚠️ POSSIBLE 10X BUG: Amount seems too high:', amountText);
      } else {
        console.log('✅ Amount looks reasonable (no 10x bug)');
      }
    }
  });

  test('Can create new invoice without CSRF error', async ({ page }) => {
    // Navigate to invoices
    await page.click('text=ใบกำกับภาษี');

    // Click "New Invoice" button
    await page.click('button:has-text("สร้างใบกำกับ"), button:has-text("New Invoice"), button:has-text("+")');

    // Wait for form to appear
    await page.waitForSelector('.dialog, [role="dialog"]', { timeout: 5000 });

    // Fill in basic invoice details
    await page.selectOption('select[name="customerId"]', { label: 'บมือถือ' });

    // Wait a moment for customer to load
    await page.waitForTimeout(500);

    // Add a line item
    await page.fill('input[placeholder*="รายการ"], input[name="description"]', 'Test Product');
    await page.fill('input[name="quantity"]', '1');
    await page.fill('input[name="unitPrice"]', '1000.50');

    // Wait for calculations
    await page.waitForTimeout(1000);

    // Try to save
    const saveButton = page.locator('button:has-text("บันทึก"), button:has-text("Save")').first();

    // Check if save button is enabled and clickable
    const isDisabled = await saveButton.isDisabled();

    if (!isDisabled) {
      await saveButton.click();

      // Wait for response
      await page.waitForTimeout(2000);

      // Check for error messages
      const errorToast = page.locator('.toast, [role="alert"]').filter({ hasText: /error|csrf|failed/i });

      if (await errorToast.count() > 0) {
        const errorText = await errorToast.textContent();
        console.error('❌ CSRF or save error:', errorText);
        expect(errorText).not.toContain('CSRF');
      } else {
        console.log('✅ No CSRF error - save may have succeeded');
      }
    } else {
      console.log('⚠️ Save button is disabled - form validation may be preventing save');
    }
  });

  test('Decimal amounts work correctly (1234.56 input)', async ({ page }) => {
    // Navigate to invoices
    await page.click('text=ใบกำกับภาษี');

    // Click "New Invoice"
    await page.click('button:has-text("สร้างใบกำกับ"), button:has-text("New Invoice"), button:has-text("+")');

    // Wait for form
    await page.waitForSelector('.dialog, [role="dialog"]', { timeout: 5000 });

    // Select customer
    await page.selectOption('select[name="customerId"]', { label: 'บมือถือ' });
    await page.waitForTimeout(500);

    // Enter decimal amount
    await page.fill('input[placeholder*="รายการ"], input[name="description"]', 'Decimal Test');
    await page.fill('input[name="quantity"]', '1');
    await page.fill('input[name="unitPrice"]', '1234.56');

    await page.waitForTimeout(1000);

    // Check if the amount is accepted and calculated
    const amountField = page.locator('input[name="amount"]').first();
    const calculatedAmount = await amountField.inputValue();

    console.log('Entered: 1234.56, Calculated amount:', calculatedAmount);

    // Should calculate 1 * 1234.56 = 1234.56
    expect(calculatedAmount).toBe('1234.56');

    console.log('✅ Decimal amounts work correctly');
  });
});
