/**
 * Inventory Workflow E2E Tests
 * Tests for stock management and costing
 */

import { test, expect } from '@playwright/test';

test.describe('Inventory Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'admin@thaiaccounting.com');
    await page.fill('[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('complete inventory flow: receive → issue → adjust', async ({ page }) => {
    // Navigate to inventory
    await page.click('text=สินค้าและคลังสินค้า');
    await page.click('text=สินค้า');

    // Create new product
    await page.click('text=สร้างสินค้า');
    await page.fill('[data-testid="product-code"]', `PROD-${Date.now()}`);
    await page.fill('[data-testid="product-name"]', 'สินค้าทดสอบ');
    await page.selectOption('[data-testid="product-type"]', 'PRODUCT');
    await page.fill('[data-testid="sale-price"]', '1000');
    await page.fill('[data-testid="cost-price"]', '600');
    await page.check('[data-testid="is-inventory"]');
    await page.click('button:has-text("บันทึก")');
    await page.waitForSelector('text=บันทึกสำเร็จ');

    // Record stock receipt
    await page.click('text=รับสินค้าเข้า');
    await page.click('[data-testid="warehouse-select"]');
    await page.click('[data-testid="warehouse-option"]:first-child');
    await page.click('[data-testid="product-select"]');
    await page.click('[data-testid="product-option"]:has-text("สินค้าทดสอบ")');
    await page.fill('[data-testid="quantity"]', '100');
    await page.fill('[data-testid="unit-cost"]', '600');
    await page.fill('[data-testid="reference"]', 'GR-2024-001');
    await page.click('button:has-text("บันทึก")');
    await page.waitForSelector('text=รับสินค้าเข้าสำเร็จ');

    // Verify stock balance
    await page.click('text=สินค้า');
    await page.click('text=สินค้าทดสอบ');
    const stock = await page.locator('[data-testid="stock-quantity"]').textContent();
    expect(stock).toContain('100');

    // Issue stock
    await page.click('text=เบิกสินค้า');
    await page.click('[data-testid="warehouse-select"]');
    await page.click('[data-testid="warehouse-option"]:first-child');
    await page.click('[data-testid="product-select"]');
    await page.click('[data-testid="product-option"]:has-text("สินค้าทดสอบ")');
    await page.fill('[data-testid="quantity"]', '20');
    await page.fill('[data-testid="reference"]', 'DO-2024-001');
    await page.click('button:has-text("บันทึก")');
    await page.waitForSelector('text=เบิกสินค้าสำเร็จ');

    // Verify updated stock
    await page.click('text=สินค้า');
    await page.click('text=สินค้าทดสอบ');
    const newStock = await page.locator('[data-testid="stock-quantity"]').textContent();
    expect(newStock).toContain('80');

    // Stock adjustment
    await page.click('text=ปรับสต็อก');
    await page.click('[data-testid="product-select"]');
    await page.click('[data-testid="product-option"]:has-text("สินค้าทดสอบ")');
    await page.fill('[data-testid="adjustment-qty"]', '5'); // +5
    await page.fill('[data-testid="reason"]', 'นับสต็อก');
    await page.click('button:has-text("บันทึก")');
    await page.waitForSelector('text=ปรับสต็อกสำเร็จ');

    // Final verification
    await page.click('text=สินค้า');
    await page.click('text=สินค้าทดสอบ');
    const finalStock = await page.locator('[data-testid="stock-quantity"]').textContent();
    expect(finalStock).toContain('85');
  });

  test('weighted average cost calculation', async ({ page }) => {
    await page.click('text=สินค้าและคลังสินค้า');
    await page.click('text=สินค้า');

    // Create product with WAC costing
    await page.click('text=สร้างสินค้า');
    const code = `WAC-${Date.now()}`;
    await page.fill('[data-testid="product-code"]', code);
    await page.fill('[data-testid="product-name"]', 'สินค้า WAC');
    await page.selectOption('[data-testid="costing-method"]', 'WEIGHTED_AVERAGE');
    await page.check('[data-testid="is-inventory"]');
    await page.click('button:has-text("บันทึก")');
    await page.waitForSelector('text=บันทึกสำเร็จ');

    // First receipt: 100 units @ 500
    await page.click('text=รับสินค้าเข้า');
    await page.click('[data-testid="product-select"]');
    await page.click(`[data-testid="product-option"]:has-text("${code}")`);
    await page.fill('[data-testid="quantity"]', '100');
    await page.fill('[data-testid="unit-cost"]', '500');
    await page.click('button:has-text("บันทึก")');
    await page.waitForSelector('text=รับสินค้าเข้าสำเร็จ');

    // Check WAC = 500
    await page.click('text=สินค้า');
    await page.click(`text=${code}`);
    let wac = await page.locator('[data-testid="unit-cost"]').textContent();
    expect(wac).toContain('500');

    // Second receipt: 100 units @ 700
    await page.click('text=รับสินค้าเข้า');
    await page.click('[data-testid="product-select"]');
    await page.click(`[data-testid="product-option"]:has-text("${code}")`);
    await page.fill('[data-testid="quantity"]', '100');
    await page.fill('[data-testid="unit-cost"]', '700');
    await page.click('button:has-text("บันทึก")');
    await page.waitForSelector('text=รับสินค้าเข้าสำเร็จ');

    // Check WAC = (100*500 + 100*700) / 200 = 600
    await page.click('text=สินค้า');
    await page.click(`text=${code}`);
    wac = await page.locator('[data-testid="unit-cost"]').textContent();
    expect(wac).toContain('600');
  });

  test('low stock alert', async ({ page }) => {
    await page.click('text=สินค้าและคลังสินค้า');
    await page.click('text=สินค้า');

    // Create product with minimum stock
    await page.click('text=สร้างสินค้า');
    await page.fill('[data-testid="product-code"]', `LOW-${Date.now()}`);
    await page.fill('[data-testid="product-name"]', 'สินค้าใกล้หมด');
    await page.fill('[data-testid="min-quantity"]', '50');
    await page.check('[data-testid="is-inventory"]');
    await page.click('button:has-text("บันทึก")');
    await page.waitForSelector('text=บันทึกสำเร็จ');

    // Add small stock (below minimum)
    await page.click('text=รับสินค้าเข้า');
    await page.click('[data-testid="product-select"]');
    await page.click('[data-testid="product-option"]:has-text("สินค้าใกล้หมด")');
    await page.fill('[data-testid="quantity"]', '30');
    await page.click('button:has-text("บันทึก")');
    await page.waitForSelector('text=รับสินค้าเข้าสำเร็จ');

    // Check low stock report
    await page.click('text=รายงาน');
    await page.click('text=สินค้าใกล้หมด');
    await page.waitForSelector('text=สินค้าใกล้หมด');

    // Should show our product
    const productInReport = await page.locator('text=สินค้าใกล้หมด').first().isVisible();
    expect(productInReport).toBe(true);
  });

  test('stock transfer between warehouses', async ({ page }) => {
    await page.click('text=สินค้าและคลังสินค้า');
    await page.click('text=โอนย้ายสินค้า');

    // Select source warehouse
    await page.click('[data-testid="source-warehouse"]');
    await page.click('[data-testid="warehouse-option"]:first-child');

    // Select destination warehouse
    await page.click('[data-testid="dest-warehouse"]');
    await page.click('[data-testid="warehouse-option"]:nth-child(2)');

    // Select product
    await page.click('[data-testid="product-select"]');
    await page.click('[data-testid="product-option"]:first-child');

    // Enter quantity
    await page.fill('[data-testid="quantity"]', '50');
    await page.fill('[data-testid="reference"]', 'TF-2024-001');

    await page.click('button:has-text("บันทึก")');
    await page.waitForSelector('text=โอนย้ายสำเร็จ');

    // Verify stock movement created
    await page.click('text=ประวัติการเคลื่อนไหว');
    await page.waitForSelector('text=TRANSFER_OUT');
    await page.waitForSelector('text=TRANSFER_IN');
  });

  test('physical stock count', async ({ page }) => {
    await page.click('text=สินค้าและคลังสินค้า');
    await page.click('text=นับสต็อก');

    // Create stock count session
    await page.click('text=สร้างรอบนับสต็อก');
    await page.fill('[data-testid="count-date"]', '31/03/2567');
    await page.click('[data-testid="warehouse-select"]');
    await page.click('[data-testid="warehouse-option"]:first-child');
    await page.click('button:has-text("ถัดไป")');

    // Add products to count
    await page.click('[data-testid="add-product"]');
    await page.click('[data-testid="product-option"]:first-child');

    // Enter counted quantity
    await page.fill('[data-testid="counted-qty"]', '95');
    await page.click('button:has-text("บันทึก")');
    await page.waitForSelector('text=บันทึกรอบนับสต็อกสำเร็จ');

    // Complete count and create adjustment
    await page.click('button:has-text("ปิดรอบ")');
    await page.waitForSelector('text=ปิดรอบนับสต็อกสำเร็จ');

    // Verify adjustment created
    await page.click('text=ปรับสต็อก');
    await page.waitForSelector('text=ADJUST');
  });
});
