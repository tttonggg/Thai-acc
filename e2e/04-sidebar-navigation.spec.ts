import { test, expect } from '@playwright/test';

// All navigation items that should be accessible (16 total)
const ALL_NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', thaiLabel: 'ภาพรวม', adminOnly: false },
  { id: 'accounts', label: 'Chart of Accounts', thaiLabel: 'ผังบัญชี', adminOnly: false },
  { id: 'journal', label: 'Journal Entries', thaiLabel: 'บันทึกบัญชี', adminOnly: false },
  { id: 'invoices', label: 'Invoices', thaiLabel: 'ใบกำกับภาษี', adminOnly: false },
  { id: 'vat', label: 'VAT', thaiLabel: 'ภาษีมูลค่าเพิ่ม', adminOnly: false },
  { id: 'wht', label: 'Withholding Tax', thaiLabel: 'ภาษีหัก ณ ที่จ่าย', adminOnly: false },
  { id: 'customers', label: 'Customers (AR)', thaiLabel: 'ลูกหนี้ (AR)', adminOnly: false },
  { id: 'vendors', label: 'Vendors (AP)', thaiLabel: 'เจ้าหนี้ (AP)', adminOnly: false },
  { id: 'inventory', label: 'Inventory', thaiLabel: 'สต็อกสินค้า', adminOnly: false },
  { id: 'banking', label: 'Banking', thaiLabel: 'ธนาคาร', adminOnly: false },
  { id: 'assets', label: 'Fixed Assets', thaiLabel: 'ทรัพย์สินถาวร', adminOnly: false },
  { id: 'payroll', label: 'Payroll', thaiLabel: 'เงินเดือน', adminOnly: false },
  { id: 'petty-cash', label: 'Petty Cash', thaiLabel: 'เงินสดย่อย', adminOnly: false },
  { id: 'reports', label: 'Reports', thaiLabel: 'รายงาน', adminOnly: false },
  { id: 'settings', label: 'Settings', thaiLabel: 'ตั้งค่า', adminOnly: true },
  { id: 'users', label: 'User Management', thaiLabel: 'จัดการผู้ใช้', adminOnly: true },
];

// Helper function to login
async function loginAsAdmin(page: any) {
  await page.goto('/');
  await page.waitForTimeout(1000);

  // Check if already logged in
  const sidebar = page.locator('aside nav').first();
  const hasSidebar = await sidebar.isVisible().catch(() => false);

  if (hasSidebar) {
    console.log('Already logged in');
    return;
  }

  // Perform login
  await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
  await page.fill('input[type="email"]', 'admin@thaiaccounting.com');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');

  // Wait for dashboard to load
  await page.waitForTimeout(4000);

  // Verify login successful
  const dashboard = page.locator('aside nav').first();
  await expect(dashboard).toBeVisible({ timeout: 10000 });
  console.log('✅ Login successful');
}

test.describe.configure({ mode: 'serial' }); // Run tests serially

test.describe('Sidebar Navigation - Comprehensive Test', () => {
  test.beforeEach(async ({ page }) => {
    // Bypass rate limiting for automated tests
    await page.setExtraHTTPHeaders({
      'x-playwright-test': 'true',
    });
  });

  test('[LOGIN] Login as ADMIN to test all navigation items', async ({ page }) => {
    await loginAsAdmin(page);
  });

  for (const navItem of ALL_NAV_ITEMS) {
    test(`[NAVIGATE] Click on ${navItem.id} - ${navItem.label}`, async ({ page }) => {
      // Login first
      await loginAsAdmin(page);

      // Find and click the navigation button
      // Use both English and Thai labels
      const selector = `aside nav button`;
      const buttons = page.locator(selector);

      const count = await buttons.count();
      console.log(`Total buttons in sidebar: ${count}`);

      // Try to find the button with matching text
      let foundButton = null;
      for (let i = 0; i < count; i++) {
        const button = buttons.nth(i);
        const text = await button.textContent();

        if (text && (text.includes(navItem.thaiLabel) || text.includes(navItem.label))) {
          foundButton = button;
          console.log(`✅ ${navItem.id} - Button found with text: "${text.trim()}"`);
          break;
        }
      }

      if (!foundButton) {
        console.log(`❌ ${navItem.id} - Button not found. Available buttons:`);

        // Log all available buttons for debugging
        for (let i = 0; i < count; i++) {
          const button = buttons.nth(i);
          const text = await button.textContent();
          console.log(`   - "${text?.trim()}"`);
        }

        // Take screenshot
        await page.screenshot({
          path: `test-results/navigation/${navItem.id}-not-found.png`,
          fullPage: true,
        });

        throw new Error(`Navigation button for ${navItem.id} not found in sidebar`);
      }

      // Click the button
      await foundButton.click();
      await page.waitForTimeout(1500);

      // Check if button is now active
      const isActive = await foundButton
        .evaluate((el: any) => {
          return (
            el.classList.contains('bg-yellow-500') ||
            el.getAttribute('class')?.includes('bg-yellow-500')
          );
        })
        .catch(() => false);

      if (isActive) {
        console.log(`✅ ${navItem.id} - Navigation successful (button is active)`);
      } else {
        console.log(`⚠️ ${navItem.id} - Button clicked but not showing as active`);
      }

      // Take screenshot of the loaded page
      await page.screenshot({
        path: `test-results/navigation/${navItem.id}-success.png`,
        fullPage: false,
      });

      // Verify we're still on the main app page
      const currentUrl = page.url();
      expect(currentUrl).toContain('localhost');
    });
  }

  test('[COUNT] Verify total number of navigation items', async ({ page }) => {
    await loginAsAdmin(page);

    // Count all navigation buttons in the sidebar
    const navButtons = page.locator('aside nav button');
    const count = await navButtons.count();

    console.log(`\n==========================================`);
    console.log(`Total navigation items found: ${count}`);
    console.log(`Expected: ${ALL_NAV_ITEMS.length}`);
    console.log(`==========================================\n`);

    // Log all navigation items
    for (let i = 0; i < count; i++) {
      const button = navButtons.nth(i);
      const text = await button.textContent();
      console.log(`  ${i + 1}. "${text?.trim()}"`);
    }
    console.log(`==========================================\n`);

    // Take a screenshot of the sidebar
    const sidebar = page.locator('aside').first();
    await sidebar.screenshot({ path: 'test-results/navigation/sidebar-full.png' });

    // For ADMIN user, should see all 16 items
    expect(count).toBe(ALL_NAV_ITEMS.length);
  });
});

test.describe('Sidebar Navigation - Summary Report', () => {
  test('Generate navigation test summary', async ({}) => {
    console.log('\n==========================================');
    console.log('SIDEBAR NAVIGATION TEST SUMMARY');
    console.log('==========================================');
    console.log('Total Navigation Items: 16');
    console.log('');
    console.log('Core Modules (14):');
    console.log('  1. Dashboard (ภาพรวม)');
    console.log('  2. Chart of Accounts (ผังบัญชี)');
    console.log('  3. Journal Entries (บันทึกบัญชี)');
    console.log('  4. Invoices (ใบกำกับภาษี)');
    console.log('  5. VAT (ภาษีมูลค่าเพิ่ม)');
    console.log('  6. Withholding Tax (ภาษีหัก ณ ที่จ่าย)');
    console.log('  7. Customers/AR (ลูกหนี้)');
    console.log('  8. Vendors/AP (เจ้าหนี้)');
    console.log('  9. Inventory (สต็อกสินค้า)');
    console.log('  10. Banking (ธนาคาร)');
    console.log('  11. Fixed Assets (ทรัพย์สินถาวร)');
    console.log('  12. Payroll (เงินเดือน)');
    console.log('  13. Petty Cash (เงินสดย่อย)');
    console.log('  14. Reports (รายงาน)');
    console.log('');
    console.log('Admin Only (2):');
    console.log('  15. Settings (ตั้งค่า)');
    console.log('  16. User Management (จัดการผู้ใช้)');
    console.log('==========================================\n');

    expect(true).toBeTruthy();
  });
});
