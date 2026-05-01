import { test, expect } from '@playwright/test';

// Helper function to login
async function loginAsAdmin(page: any) {
  await page.setExtraHTTPHeaders({
    'x-playwright-test': 'true',
  });

  await page.goto('/');
  await page.waitForTimeout(1000);

  const sidebar = page.locator('aside nav').first();
  const hasSidebar = await sidebar.isVisible().catch(() => false);

  if (hasSidebar) {
    return;
  }

  await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
  await page.fill('input[type="email"]', 'admin@thaiaccounting.com');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');

  await page.waitForTimeout(4000);
  await expect(sidebar).toBeVisible({ timeout: 10000 });
}

test.describe.configure({ mode: 'serial' });

test.describe('All Modules - Sequential Test', () => {
  // All modules to test
  const modules = [
    { id: 'dashboard', label: 'Dashboard', thai: 'ภาพรวม' },
    { id: 'accounts', label: 'Chart of Accounts', thai: 'ผังบัญชี' },
    { id: 'journal', label: 'Journal', thai: 'บันทึกบัญชี' },
    { id: 'invoices', label: 'Invoices', thai: 'ใบกำกับภาษี' },
    { id: 'vat', label: 'VAT', thai: 'ภาษีมูลค่าเพิ่ม' },
    { id: 'wht', label: 'WHT', thai: 'ภาษีหัก ณ ที่จ่าย' },
    { id: 'customers', label: 'Customers', thai: 'ลูกหนี้ (AR)' },
    { id: 'vendors', label: 'Vendors', thai: 'เจ้าหนี้ (AP)' },
    { id: 'inventory', label: 'Inventory', thai: 'สต็อกสินค้า' },
    { id: 'banking', label: 'Banking', thai: 'ธนาคาร' },
    { id: 'assets', label: 'Assets', thai: 'ทรัพย์สินถาวร' },
    { id: 'payroll', label: 'Payroll', thai: 'เงินเดือน' },
    { id: 'petty-cash', label: 'Petty Cash', thai: 'เงินสดย่อย' },
    { id: 'reports', label: 'Reports', thai: 'รายงาน' },
    { id: 'settings', label: 'Settings', thai: 'ตั้งค่า' },
    { id: 'users', label: 'Users', thai: 'จัดการผู้ใช้' },
  ];

  const results: any[] = [];

  test('[LOGIN] Login once', async ({ page }) => {
    await loginAsAdmin(page);
    console.log('✅ Logged in');

    // Get all buttons first
    const buttons = page.locator('aside nav button');
    const count = await buttons.count();
    console.log(`Found ${count} navigation buttons`);

    for (let i = 0; i < count; i++) {
      const text = await buttons.nth(i).textContent();
      console.log(`  ${i + 1}. "${text?.trim()}"`);
    }
  });

  for (const module of modules) {
    test(`[NAV] ${module.id} - ${module.label}`, async ({ page }) => {
      // Don't navigate away - stay on the same page
      // Just find and click the button
      const buttons = page.locator('aside nav button');

      // Find the button by text
      let buttonIndex = -1;
      const count = await buttons.count();

      for (let i = 0; i < count; i++) {
        const text = await buttons.nth(i).textContent();
        if (text && (text.includes(module.thai) || text.includes(module.label))) {
          buttonIndex = i;
          break;
        }
      }

      if (buttonIndex === -1) {
        results.push({ module: module.id, status: 'NOT FOUND', label: module.label });
        console.log(`❌ ${module.id} (${module.label}) - Button not found`);
        return;
      }

      const button = buttons.nth(buttonIndex);

      // Click the button
      await button.click();
      await page.waitForTimeout(2000);

      // Check if we're still on the page
      const url = page.url();
      const isValid = url.includes('localhost');

      if (!isValid) {
        results.push({ module: module.id, status: 'CRASHED', label: module.label });
        console.log(`💥 ${module.id} (${module.label}) - Page CRASHED`);
        throw new Error(`Page crashed when loading ${module.id}`);
      }

      // Check for error messages
      const errorElements = await page
        .locator('text=Error, text=เกิดข้อผิดพลาด, text=error, text=เกิดข้อผิดพลาดในการดึงข้อมูล')
        .count();

      if (errorElements > 0) {
        results.push({ module: module.id, status: 'HAS ERRORS', label: module.label });
        console.log(`⚠️  ${module.id} (${module.label}) - Has errors on page`);
      } else {
        results.push({ module: module.id, status: 'OK', label: module.label });
        console.log(`✅ ${module.id} (${module.label}) - Working`);
      }

      // Take screenshot
      await page.screenshot({
        path: `test-results/modules/${module.id}.png`,
        fullPage: false,
      });
    });
  }

  test('[REPORT] Summary', async ({ page }) => {
    console.log('\n==========================================');
    console.log('MODULE TEST RESULTS');
    console.log('==========================================');

    const ok = results.filter((r) => r.status === 'OK');
    const failed = results.filter((r) => r.status !== 'OK');

    console.log(`\nTotal: ${results.length}`);
    console.log(`Working: ${ok.length}`);
    console.log(`Failed: ${failed.length}`);

    if (failed.length > 0) {
      console.log('\n❌ FAILED MODULES:');
      for (const f of failed) {
        console.log(`  - ${f.module} (${f.label}): ${f.status}`);
      }
    }

    if (ok.length > 0) {
      console.log('\n✅ WORKING MODULES:');
      for (const o of ok) {
        console.log(`  - ${o.module} (${o.label})`);
      }
    }

    console.log('==========================================\n');

    // Screenshot for final state
    await page.screenshot({
      path: 'test-results/modules/all-modules-final.png',
      fullPage: false,
    });

    // Log detailed results
    console.log('DETAILED RESULTS:');
    for (const r of results) {
      console.log(`  ${r.module}: ${r.status}`);
    }
  });
});
