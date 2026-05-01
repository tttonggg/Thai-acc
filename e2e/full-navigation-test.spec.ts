import { test, expect } from '@playwright/test';

test.describe('Full Navigation Test', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/');
    await page.fill('input[type="email"]', 'admin@thaiaccounting.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
  });

  const modules = [
    { name: 'Dashboard', selector: 'text=ภาพรวมธุรกิจ' },
    { name: 'Chart of Accounts', selector: 'text=ผังบัญชี' },
    { name: 'Journal', selector: 'text=สมุดรายวัน' },
    { name: 'Invoices', selector: 'text=ใบกำกับภาษี' },
    { name: 'Customers', selector: 'text=ลูกหนี้' },
    { name: 'Vendors', selector: 'text=เจ้าหนี้' },
    { name: 'Products', selector: 'text=สินค้า' },
    { name: 'Inventory', selector: 'text=คลังสินค้า' },
    { name: 'Banking', selector: 'text=ธนาคาร' },
    { name: 'Assets', selector: 'text=ทรัพย์สิน' },
    { name: 'Payroll', selector: 'text=เงินเดือน' },
    { name: 'Petty Cash', selector: 'text=เงินสดย่อย' },
    { name: 'Reports', selector: 'text=รายงาน' },
    { name: 'Settings', selector: 'text=ตั้งค่า' },
  ];

  for (const module of modules) {
    test(`Navigate to ${module.name}`, async ({ page }) => {
      try {
        await page.click(module.selector);
        await page.waitForTimeout(2000);

        // Check for error boundaries
        const errorBoundary = await page.locator('text=เกิดข้อผิดพลาด').count();
        expect(errorBoundary).toBe(0);

        // Take screenshot
        await page.screenshot({
          path: `test-results/${module.name.toLowerCase().replace(/\s+/g, '-')}.png`,
        });

        console.log(`✅ ${module.name} works`);
      } catch (e: any) {
        console.log(`❌ ${module.name} failed:`, e.message);
        throw e;
      }
    });
  }
});
