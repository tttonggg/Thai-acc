/**
 * Journal Entry Workflow E2E Tests
 * Tests for double-entry bookkeeping workflows
 */

import { test, expect } from '@playwright/test';

test.describe('Journal Entry Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'admin@thaiaccounting.com');
    await page.fill('[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('create and post balanced journal entry', async ({ page }) => {
    // Navigate to journal entries
    await page.click('text=สมุดรายวัน');
    await page.click('text=รายการบัญชี');

    // Create new entry
    await page.click('text=สร้างรายการ');
    await page.waitForSelector('form, [data-testid="journal-form"]');

    // Set date and description
    await page.fill('[data-testid="entry-date"]', '15/03/2567');
    await page.fill('[data-testid="description"]', 'ค่าเช่าออฟฟิศเดือนมีนาคม');

    // Add debit line
    await page.click('[data-testid="add-line"]');
    await page.click('[data-testid="line-0-account"]');
    await page.fill('[data-testid="line-0-account-search"]', 'ค่าเช่า');
    await page.click('[data-testid="account-option"]:has-text("ค่าเช่า")');
    await page.fill('[data-testid="line-0-debit"]', '15000');

    // Add credit line
    await page.click('[data-testid="add-line"]');
    await page.click('[data-testid="line-1-account"]');
    await page.fill('[data-testid="line-1-account-search"]', 'เงินสด');
    await page.click('[data-testid="account-option"]:has-text("เงินสด")');
    await page.fill('[data-testid="line-1-credit"]', '15000');

    // Verify balance
    const totalDebit = await page.locator('[data-testid="total-debit"]').textContent();
    const totalCredit = await page.locator('[data-testid="total-credit"]').textContent();
    expect(totalDebit).toBe(totalCredit);

    // Save
    await page.click('button:has-text("บันทึก")');
    await page.waitForSelector('text=บันทึกสำเร็จ');

    // Post entry
    await page.click('button:has-text("บันทึกบัญชี")');
    await page.waitForSelector('text=บันทึกบัญชีสำเร็จ');
  });

  test('reject unbalanced journal entry', async ({ page }) => {
    await page.click('text=สมุดรายวัน');
    await page.click('text=รายการบัญชี');
    await page.click('text=สร้างรายการ');

    await page.fill('[data-testid="entry-date"]', '15/03/2567');
    await page.fill('[data-testid="description"]', 'Test unbalanced');

    // Add unbalanced lines
    await page.click('[data-testid="add-line"]');
    await page.click('[data-testid="line-0-account"]');
    await page.click('[data-testid="account-option"]:first-child');
    await page.fill('[data-testid="line-0-debit"]', '10000');

    await page.click('[data-testid="add-line"]');
    await page.click('[data-testid="line-1-account"]');
    await page.click('[data-testid="account-option"]:nth-child(2)');
    await page.fill('[data-testid="line-1-credit"]', '5000'); // Doesn't balance

    // Try to save
    await page.click('button:has-text("บันทึก")');

    // Should show error
    await page.waitForSelector('text=ยอดเดบิตไม่เท่ากับเครดิต');
  });

  test('multi-line journal entry', async ({ page }) => {
    await page.click('text=สมุดรายวัน');
    await page.click('text=รายการบัญชี');
    await page.click('text=สร้างรายการ');

    await page.fill('[data-testid="entry-date"]', '31/03/2567');
    await page.fill('[data-testid="description"]', 'ปิดบัญชีเดือนมีนาคม');

    // Multiple debit lines
    await page.click('[data-testid="add-line"]');
    await page.click('[data-testid="line-0-account"]');
    await page.click('[data-testid="account-option"]:has-text("ลูกหนี้")');
    await page.fill('[data-testid="line-0-debit"]', '50000');

    await page.click('[data-testid="add-line"]');
    await page.click('[data-testid="line-1-account"]');
    await page.click('[data-testid="account-option"]:has-text("ภาษี")');
    await page.fill('[data-testid="line-1-debit"]', '3500');

    // Single credit line
    await page.click('[data-testid="add-line"]');
    await page.click('[data-testid="line-2-account"]');
    await page.click('[data-testid="account-option"]:has-text("ขาย")');
    await page.fill('[data-testid="line-2-credit"]', '53500');

    // Verify total
    const totalDebit = await page.locator('[data-testid="total-debit"]').textContent();
    expect(totalDebit).toContain('53,500');

    await page.click('button:has-text("บันทึก")');
    await page.waitForSelector('text=บันทึกสำเร็จ');
  });

  test('reverse journal entry', async ({ page }) => {
    await page.click('text=สมุดรายวัน');
    await page.click('text=รายการบัญชี');

    // Find a posted entry
    await page.selectOption('[data-testid="status-filter"]', 'POSTED');
    await page.click('table tbody tr:first-child');
    await page.waitForSelector('[data-testid="journal-details"]');

    // Click reverse
    await page.click('button:has-text("ยกเลิก")');
    await page.waitForSelector('[data-testid="reverse-dialog"]');

    // Enter reason
    await page.fill('[data-testid="reverse-reason"]', 'รายการผิดพลาด');
    await page.click('button:has-text("ยืนยัน")');
    await page.waitForSelector('text=ยกเลิกรายการสำเร็จ');

    // Verify reversing entry created
    await page.waitForSelector('text=REV'); // Reversing entry prefix
  });

  test('recurring journal entry', async ({ page }) => {
    await page.click('text=สมุดรายวัน');
    await page.click('text=รายการประจำ');

    // Create recurring template
    await page.click('text=สร้างรายการประจำ');
    await page.fill('[data-testid="template-name"]', 'ค่าเช่าประจำเดือน');

    await page.click('[data-testid="add-line"]');
    await page.click('[data-testid="line-0-account"]');
    await page.click('[data-testid="account-option"]:has-text("ค่าเช่า")');
    await page.fill('[data-testid="line-0-debit"]', '15000');

    await page.click('[data-testid="add-line"]');
    await page.click('[data-testid="line-1-account"]');
    await page.click('[data-testid="account-option"]:has-text("เงินฝาก")');
    await page.fill('[data-testid="line-1-credit"]', '15000');

    await page.click('button:has-text("บันทึก")');
    await page.waitForSelector('text=บันทึกสำเร็จ');

    // Use template
    await page.click('text=ใช้รายการ');
    await page.waitForSelector('[data-testid="journal-form"]');

    // Verify pre-filled
    const description = await page.locator('[data-testid="description"]').inputValue();
    expect(description).toBe('ค่าเช่าประจำเดือน');
  });

  test('journal entry search and filter', async ({ page }) => {
    await page.click('text=สมุดรายวัน');
    await page.click('text=รายการบัญชี');

    // Search by description
    await page.fill('[data-testid="search-input"]', 'ค่าเช่า');
    await page.press('[data-testid="search-input"]', 'Enter');
    await page.waitForTimeout(1000);

    // Filter by date
    await page.fill('[data-testid="date-from"]', '01/01/2567');
    await page.fill('[data-testid="date-to"]', '31/03/2567');
    await page.click('button:has-text("ค้นหา")');
    await page.waitForTimeout(1000);

    // Filter by account
    await page.click('[data-testid="account-filter"]');
    await page.click('[data-testid="account-option"]:has-text("เงินสด")');
    await page.waitForTimeout(1000);

    // Clear filters
    await page.click('button:has-text("ล้าง")');
  });
});
