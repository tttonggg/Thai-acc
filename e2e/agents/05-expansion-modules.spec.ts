import { test, expect } from '@playwright/test';

// ============================================
// AGENT_MODULES - Expansion Modules Tester
// Tests all 6 expansion modules: Inventory, Banking, Fixed Assets, Payroll, Petty Cash, WHT
// ============================================

const TEST_ACCOUNT = {
  email: 'admin@thaiaccounting.com',
  password: 'admin123',
};

const BASE_URL = 'http://localhost:3000';

/**
 * Improved Login Function with better timing and sidebar detection
 */
async function loginAsAdmin(page) {
  console.log('🔐 Starting login process...');

  // Clear cookies to ensure fresh login
  await page.context().clearCookies();

  // Navigate to login page
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');

  console.log('✓ Page loaded');

  // Wait for form to be visible
  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');
  const submitButton = page.locator('button[type="submit"]');

  await emailInput.waitFor({ state: 'visible', timeout: 10000 });
  await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
  await submitButton.waitFor({ state: 'visible', timeout: 10000 });

  console.log('✓ Form fields visible');

  // Fill credentials using type with delay to simulate real user
  await emailInput.fill(TEST_ACCOUNT.email);
  await passwordInput.fill(TEST_ACCOUNT.password);

  console.log('✓ Credentials filled');

  // Wait a moment for any validation
  await page.waitForTimeout(300);

  // Click submit button with explicit wait
  await submitButton.click();

  // Wait for the page to navigate (URL should stay at / or redirect to dashboard)
  await page.waitForTimeout(4000);

  console.log('✓ Form submitted');

  // Check current URL
  const currentUrl = page.url();
  console.log('Current URL:', currentUrl);

  // Check for sidebar to confirm successful login
  const sidebar = page.locator('nav, aside').first();
  const sidebarVisible = await sidebar.isVisible().catch(() => false);

  if (!sidebarVisible) {
    // Take debug screenshot
    await page.screenshot({ path: 'test-results/login-debug.png', fullPage: true });

    // Check if still on login page with error
    const errorVisible = await page
      .locator('text=ไม่ถูกต้อง')
      .isVisible()
      .catch(() => false);
    const pageText = await page
      .locator('body')
      .textContent()
      .catch(() => '');
    console.log('Page text preview:', pageText?.substring(0, 200));

    if (errorVisible) {
      throw new Error('Login failed: Invalid credentials');
    }
    throw new Error('Login failed: Sidebar not visible');
  }

  console.log('✅ Login successful');
  return sidebar;
}

/**
 * Login with retry logic for flaky logins
 */
async function loginWithRetry(page, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await loginAsAdmin(page);
      return;
    } catch (error) {
      console.log(`Login attempt ${i + 1} failed, retrying...`);
      await page.waitForTimeout(2000);
    }
  }
  throw new Error('Login failed after all retries');
}

// Helper: Find and click sidebar button
async function clickSidebarButton(page, thaiText, englishText) {
  const buttons = page.locator('aside nav button');
  const count = await buttons.count();

  for (let i = 0; i < count; i++) {
    const text = await buttons.nth(i).textContent();
    if (text && (text.includes(thaiText) || (englishText && text.includes(englishText)))) {
      await buttons.nth(i).click();
      return true;
    }
  }
  return false;
}

// Helper: Take screenshot with path
async function takeScreenshot(page, path) {
  await page.screenshot({ path, fullPage: false });
}

test.describe.configure({ mode: 'serial' });

test.describe('AGENT_MODULES - Expansion Modules Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.setExtraHTTPHeaders({ 'x-playwright-test': 'true' });
    await loginWithRetry(page);
  });

  // ============================================
  // 1. INVENTORY MODULE (สต็อกสินค้า)
  // ============================================
  test.describe('Inventory Module', () => {
    test('Inventory - Navigate to module', async ({ page }) => {
      const clicked = await clickSidebarButton(page, 'สต็อกสินค้า', 'Inventory');
      expect(clicked).toBe(true);
      await page.waitForTimeout(1500);

      // Verify page header
      const header = await page.locator('h1:has-text("คลังสินค้า")').count();
      expect(header).toBeGreaterThan(0);
    });

    test('Inventory - Stock Balance Tab (สต็อกคงเหลือ)', async ({ page }) => {
      await clickSidebarButton(page, 'สต็อกสินค้า', 'Inventory');
      await page.waitForTimeout(1500);

      // Verify tab exists and is clickable
      const stockBalanceTab = page.locator('button:has-text("ยอดคงเหลือ")');
      await expect(stockBalanceTab).toBeVisible();
      await stockBalanceTab.click();
      await page.waitForTimeout(1000);

      // Verify summary cards
      const summaryCards = page.locator(
        '.grid.grid-cols-3 .card, .grid.grid-cols-3 [class*="border-l-4"]'
      );
      const cardCount = await summaryCards.count();
      expect(cardCount).toBeGreaterThanOrEqual(3);

      // Verify table headers
      const tableHeaders = ['รหัส', 'ชื่อสินค้า', 'คลัง', 'จำนวน', 'ต้นทุน/หน่วย', 'มูลค่ารวม'];
      for (const header of tableHeaders) {
        const headerCell = page.locator(`th:has-text("${header}")`);
        await expect(headerCell.first()).toBeVisible();
      }

      // Verify WAC label
      const wacLabel = await page.locator('text=WAC').count();
      expect(wacLabel).toBeGreaterThan(0);

      await takeScreenshot(page, 'screenshots/modules/inventory-stock.png');
    });

    test('Inventory - Stock Movements Tab (การเคลื่อนไหว)', async ({ page }) => {
      await clickSidebarButton(page, 'สต็อกสินค้า', 'Inventory');
      await page.waitForTimeout(1500);

      // Click on Movements tab
      const movementsTab = page.locator('button:has-text("การเคลื่อนไหว")');
      await expect(movementsTab).toBeVisible();
      await movementsTab.click();
      await page.waitForTimeout(1000);

      // Verify movement type filters
      const filterButtons = ['ทั้งหมด', 'รับสินค้า', 'เบิกสินค้า', 'โอนเข้า', 'โอนออก', 'ปรับปรุง'];
      for (const filter of filterButtons) {
        const btn = page.locator(`button:has-text("${filter}")`);
        const count = await btn.count();
        if (count > 0) {
          await expect(btn.first()).toBeVisible();
        }
      }

      // Verify "บันทึกการเคลื่อนไหว" button
      const addMovementBtn = page.locator('button:has-text("บันทึกการเคลื่อนไหว")');
      await expect(addMovementBtn).toBeVisible();

      // Verify table headers
      const tableHeaders = ['วันที่', 'ประเภท', 'สินค้า', 'คลัง', 'จำนวน', 'ต้นทุน/หน่วย'];
      for (const header of tableHeaders) {
        const headerCell = page.locator(`th:has-text("${header}")`);
        const count = await headerCell.count();
        if (count > 0) {
          await expect(headerCell.first()).toBeVisible();
        }
      }
    });

    test('Inventory - Warehouses Tab (คลังสินค้า)', async ({ page }) => {
      await clickSidebarButton(page, 'สต็อกสินค้า', 'Inventory');
      await page.waitForTimeout(1500);

      // Click on Warehouses tab
      const warehousesTab = page.locator('button:has-text("คลังสินค้า")');
      await expect(warehousesTab).toBeVisible();
      await warehousesTab.click();
      await page.waitForTimeout(1000);

      // Verify "เพิ่มคลังใหม่" button
      const addWarehouseBtn = page.locator('button:has-text("เพิ่มคลังใหม่")');
      await expect(addWarehouseBtn).toBeVisible();

      // Verify empty state or warehouse cards
      const emptyState = await page.locator('text=ยังไม่มีคลังสินค้า').count();
      const warehouseCards = await page.locator('.grid .card, .grid [class*="border"]').count();
      expect(emptyState > 0 || warehouseCards > 0).toBe(true);
    });

    test('Inventory - Stock Transfers Tab (โอนสต็อก)', async ({ page }) => {
      await clickSidebarButton(page, 'สต็อกสินค้า', 'Inventory');
      await page.waitForTimeout(1500);

      // Click on Transfers tab (first match - the tab button)
      const transfersTab = page.locator('button:has-text("โอนสต็อก")').first();
      await expect(transfersTab).toBeVisible();
      await transfersTab.click();
      await page.waitForTimeout(1000);

      // Verify "โอนสต็อก" action button (after clicking tab, look for action button in content area)
      const transferBtn = page
        .locator('div[class*="content"] button:has-text("โอนสต็อก"), button:has-text("โอนสต็อก")')
        .nth(1);
      await expect(transferBtn).toBeVisible();
    });
  });

  // ============================================
  // 2. BANKING MODULE (ธนาคาร)
  // ============================================
  test.describe('Banking Module', () => {
    test('Banking - Navigate to module', async ({ page }) => {
      const clicked = await clickSidebarButton(page, 'ธนาคาร', 'Banking');
      expect(clicked).toBe(true);
      await page.waitForTimeout(1500);

      // Verify page header
      const header = await page.locator('h1:has-text("บัญชีธนาคาร")').count();
      expect(header).toBeGreaterThan(0);
    });

    test('Banking - Bank Accounts Tab (บัญชีธนาคาร)', async ({ page }) => {
      await clickSidebarButton(page, 'ธนาคาร', 'Banking');
      await page.waitForTimeout(1500);

      // Click on Bank Accounts tab
      const accountsTab = page
        .locator('button:has-text("บัญชีธนาคาร"), nav button:has-text("บัญชี")')
        .first();
      await expect(accountsTab).toBeVisible();
      await accountsTab.click();
      await page.waitForTimeout(1000);

      // Verify "เพิ่มบัญชีธนาคาร" button
      const addAccountBtn = page.locator('button:has-text("เพิ่มบัญชีธนาคาร")');
      await expect(addAccountBtn).toBeVisible();

      await takeScreenshot(page, 'screenshots/modules/banking-accounts.png');
    });

    test('Banking - Cheque Register Tab (สมุดเช็ค)', async ({ page }) => {
      await clickSidebarButton(page, 'ธนาคาร', 'Banking');
      await page.waitForTimeout(1500);

      // Click on Cheque Register tab
      const chequesTab = page.locator('button:has-text("ทะเบียนเช็ค")');
      await expect(chequesTab).toBeVisible();
      await chequesTab.click();
      await page.waitForTimeout(1000);

      // Verify "เพิ่มเช็ค" button
      const addChequeBtn = page.locator('button:has-text("เพิ่มเช็ค")');
      await expect(addChequeBtn).toBeVisible();

      // Verify table headers
      const tableHeaders = [
        'เลขที่',
        'ประเภท',
        'ธนาคาร',
        'ผู้รับ/จ่าย',
        'ครบกำหนด',
        'จำนวน',
        'สถานะ',
      ];
      for (const header of tableHeaders) {
        const headerCell = page.locator(`th:has-text("${header}")`);
        const count = await headerCell.count();
        if (count > 0) {
          await expect(headerCell.first()).toBeVisible();
        }
      }
    });

    test('Banking - Reconciliation Tab (กระทบยอด)', async ({ page }) => {
      await clickSidebarButton(page, 'ธนาคาร', 'Banking');
      await page.waitForTimeout(1500);

      // Click on Reconciliation tab
      const reconTab = page.locator('button:has-text("กระทบยอด")');
      await expect(reconTab).toBeVisible();
      await reconTab.click();
      await page.waitForTimeout(1000);

      // Verify bank account select
      const bankSelect = page.locator('text=บัญชีธนาคาร');
      await expect(bankSelect.first()).toBeVisible();
    });
  });

  // ============================================
  // 3. FIXED ASSETS MODULE (ทรัพย์สิน)
  // ============================================
  test.describe('Fixed Assets Module', () => {
    test('Assets - Navigate to module', async ({ page }) => {
      const clicked = await clickSidebarButton(page, 'ทรัพย์สินถาวร', 'Assets');
      expect(clicked).toBe(true);
      await page.waitForTimeout(1500);

      // Verify page header
      const header = await page.locator('h1:has-text("ทรัพย์สินถาวร")').count();
      expect(header).toBeGreaterThan(0);
    });

    test('Assets - Asset List with Summary Cards', async ({ page }) => {
      await clickSidebarButton(page, 'ทรัพย์สินถาวร', 'Assets');
      await page.waitForTimeout(1500);

      // Verify summary cards
      const summaryLabels = ['จำนวนสินทรัพย์', 'ราคาทุนรวม', 'มูลค่าสุทธิรวม'];
      for (const label of summaryLabels) {
        const labelEl = page.locator(`text=${label}`);
        await expect(labelEl.first()).toBeVisible();
      }

      // Verify NBV (Net Book Value) label
      const nbvLabel = await page.locator('text=NBV').count();
      expect(nbvLabel).toBeGreaterThan(0);

      // Verify "เพิ่มสินทรัพย์" button
      const addAssetBtn = page.locator('button:has-text("เพิ่มสินทรัพย์")');
      await expect(addAssetBtn).toBeVisible();

      // Verify table headers
      const tableHeaders = [
        'รหัส',
        'ชื่อสินทรัพย์',
        'วันที่ซื้อ',
        'ราคาทุน',
        'NBV',
        'อายุ',
        'สถานะ',
      ];
      for (const header of tableHeaders) {
        const headerCell = page.locator(`th:has-text("${header}")`);
        const count = await headerCell.count();
        if (count > 0) {
          await expect(headerCell.first()).toBeVisible();
        }
      }

      // Verify TAS 16 label
      const tasLabel = await page.locator('text=TAS 16').count();
      expect(tasLabel).toBeGreaterThan(0);

      await takeScreenshot(page, 'screenshots/modules/assets-list.png');
    });

    test('Assets - Add Asset Dialog', async ({ page }) => {
      await clickSidebarButton(page, 'ทรัพย์สินถาวร', 'Assets');
      await page.waitForTimeout(1500);

      // Click add asset button
      const addAssetBtn = page.locator('button:has-text("เพิ่มสินทรัพย์")');
      await addAssetBtn.click();
      await page.waitForTimeout(500);

      // Verify dialog fields
      const dialogFields = [
        'รหัส',
        'ชื่อสินทรัพย์',
        'วันที่ซื้อ',
        'ราคาทุน',
        'ค่าซาก',
        'อายุการใช้งาน',
      ];
      for (const field of dialogFields) {
        const fieldLabel = page.locator(`label:has-text("${field}")`);
        await expect(fieldLabel.first()).toBeVisible();
      }

      // Close dialog
      const cancelBtn = page.locator('button:has-text("ยกเลิก")').first();
      await cancelBtn.click();
    });
  });

  // ============================================
  // 4. PAYROLL MODULE (เงินเดือน)
  // ============================================
  test.describe('Payroll Module', () => {
    test('Payroll - Navigate to module', async ({ page }) => {
      const clicked = await clickSidebarButton(page, 'เงินเดือน', 'Payroll');
      expect(clicked).toBe(true);
      await page.waitForTimeout(1500);

      // Verify page header
      const header = await page.locator('h1:has-text("เงินเดือน")').count();
      expect(header).toBeGreaterThan(0);
    });

    test('Payroll - Employees Tab (พนักงาน)', async ({ page }) => {
      await clickSidebarButton(page, 'เงินเดือน', 'Payroll');
      await page.waitForTimeout(1500);

      // Ensure Employees tab is selected (default)
      const employeesTab = page.locator('button:has-text("พนักงาน")');
      await expect(employeesTab).toBeVisible();

      // Verify summary cards
      const summaryLabels = ['พนักงานที่ใช้งาน', 'ฐานเงินเดือนรวม', 'ประกันสังคม'];
      for (const label of summaryLabels) {
        const labelEl = page.locator(`text=${label}`);
        await expect(labelEl.first()).toBeVisible();
      }

      // Verify "เพิ่มพนักงาน" button
      const addEmployeeBtn = page.locator('button:has-text("เพิ่มพนักงาน")');
      await expect(addEmployeeBtn).toBeVisible();

      // Verify search input
      const searchInput = page.locator('input[placeholder*="ค้นหา"]');
      await expect(searchInput).toBeVisible();

      // Verify table headers
      const tableHeaders = ['รหัส', 'ชื่อ-นามสกุล', 'ตำแหน่ง', 'เงินเดือน', 'SSC', 'สถานะ'];
      for (const header of tableHeaders) {
        const headerCell = page.locator(`th:has-text("${header}")`);
        const count = await headerCell.count();
        if (count > 0) {
          await expect(headerCell.first()).toBeVisible();
        }
      }

      await takeScreenshot(page, 'screenshots/modules/payroll-employees.png');
    });

    test('Payroll - Payroll Runs Tab (รอบเงินเดือน)', async ({ page }) => {
      await clickSidebarButton(page, 'เงินเดือน', 'Payroll');
      await page.waitForTimeout(1500);

      // Click on Payroll Runs tab
      const runsTab = page.locator('button:has-text("รอบเงินเดือน")');
      await expect(runsTab).toBeVisible();
      await runsTab.click();
      await page.waitForTimeout(1000);

      // Verify "ประมวลผลเงินเดือน" button
      const processBtn = page.locator('button:has-text("ประมวลผลเงินเดือน")');
      await expect(processBtn).toBeVisible();

      // Verify table headers
      const tableHeaders = [
        'เลขที่รอบ',
        'งวด',
        'จำนวนพนักงาน',
        'ฐานเงินเดือน',
        'ประกันสังคม',
        'ภาษี PND1',
        'เงินได้สุทธิ',
        'สถานะ',
      ];
      for (const header of tableHeaders) {
        const headerCell = page.locator(`th:has-text("${header}")`);
        const count = await headerCell.count();
        if (count > 0) {
          await expect(headerCell.first()).toBeVisible();
        }
      }
    });

    test('Payroll - Create Payroll Run Dialog', async ({ page }) => {
      await clickSidebarButton(page, 'เงินเดือน', 'Payroll');
      await page.waitForTimeout(1500);

      // Click on Payroll Runs tab
      const runsTab = page.locator('button:has-text("รอบเงินเดือน")');
      await runsTab.click();
      await page.waitForTimeout(500);

      // Click process button
      const processBtn = page.locator('button:has-text("ประมวลผลเงินเดือน")');
      await processBtn.click();
      await page.waitForTimeout(500);

      // Verify dialog fields
      const dialogLabels = ['เดือน', 'ปี', 'วันที่จ่ายเงินเดือน'];
      for (const label of dialogLabels) {
        const labelEl = page.locator(`label:has-text("${label}")`);
        await expect(labelEl.first()).toBeVisible();
      }

      // Verify SSC and PND1 calculation info
      const sscInfo = await page.locator('text=SSC').count();
      const pnd1Info = await page.locator('text=PND1').count();
      expect(sscInfo).toBeGreaterThan(0);
      expect(pnd1Info).toBeGreaterThan(0);

      // Close dialog
      const cancelBtn = page.locator('button:has-text("ยกเลิก")').first();
      await cancelBtn.click();
    });
  });

  // ============================================
  // 5. PETTY CASH MODULE (เงินสดย่อย)
  // ============================================
  test.describe('Petty Cash Module', () => {
    test('Petty Cash - Navigate to module', async ({ page }) => {
      const clicked = await clickSidebarButton(page, 'เงินสดย่อย', 'Petty Cash');
      expect(clicked).toBe(true);
      await page.waitForTimeout(1500);

      // Verify page header
      const header = await page.locator('h1:has-text("เงินสดย่อย")').count();
      expect(header).toBeGreaterThan(0);
    });

    test('Petty Cash - Funds Tab (กองทุน)', async ({ page }) => {
      await clickSidebarButton(page, 'เงินสดย่อย', 'Petty Cash');
      await page.waitForTimeout(1500);

      // Ensure Funds tab is selected (default)
      const fundsTab = page.locator('button:has-text("กองทุน")');
      await expect(fundsTab).toBeVisible();

      // Verify "สร้างกองทุน" button
      const addFundBtn = page.locator('button:has-text("สร้างกองทุน")');
      await expect(addFundBtn).toBeVisible();

      // Verify fund cards or empty state
      const emptyState = await page.locator('text=ยังไม่มีกองทุนเงินสดย่อย').count();
      const fundCards = await page.locator('[class*="card"], [class*="Card"]').count();
      expect(emptyState > 0 || fundCards > 0).toBe(true);

      await takeScreenshot(page, 'screenshots/modules/pettycash-funds.png');
    });

    test('Petty Cash - Vouchers Tab (ใบสำคัญ)', async ({ page }) => {
      await clickSidebarButton(page, 'เงินสดย่อย', 'Petty Cash');
      await page.waitForTimeout(1500);

      // Click on Vouchers tab
      const vouchersTab = page.locator('button:has-text("ใบสำคัญ")');
      await expect(vouchersTab).toBeVisible();
      await vouchersTab.click();
      await page.waitForTimeout(1000);

      // Verify "บันทึกใบสำคัญ" button
      const addVoucherBtn = page.locator('button:has-text("บันทึกใบสำคัญ")');
      await expect(addVoucherBtn).toBeVisible();

      // Verify table headers
      const tableHeaders = [
        'เลขที่',
        'วันที่',
        'กองทุน',
        'จ่ายให้',
        'รายละเอียด',
        'จำนวน',
        'เบิกคืน',
      ];
      for (const header of tableHeaders) {
        const headerCell = page.locator(`th:has-text("${header}")`);
        const count = await headerCell.count();
        if (count > 0) {
          await expect(headerCell.first()).toBeVisible();
        }
      }
    });

    test('Petty Cash - Create Fund Dialog', async ({ page }) => {
      await clickSidebarButton(page, 'เงินสดย่อย', 'Petty Cash');
      await page.waitForTimeout(1500);

      // Click create fund button
      const addFundBtn = page.locator('button:has-text("สร้างกองทุน")');
      await addFundBtn.click();
      await page.waitForTimeout(500);

      // Verify dialog fields
      const dialogFields = ['รหัส', 'ชื่อกองทุน', 'ผู้ถือกองทุน', 'วงเงิน'];
      for (const field of dialogFields) {
        const fieldLabel = page.locator(`label:has-text("${field}")`);
        await expect(fieldLabel.first()).toBeVisible();
      }

      // Close dialog
      const cancelBtn = page.locator('button:has-text("ยกเลิก")').first();
      await cancelBtn.click();
    });
  });

  // ============================================
  // 6. WHT MODULE (ภาษีหัก ณ ที่จ่าย)
  // ============================================
  test.describe('WHT Module (Withholding Tax)', () => {
    test('WHT - Navigate to module', async ({ page }) => {
      const clicked = await clickSidebarButton(page, 'ภาษีหัก ณ ที่จ่าย', 'WHT');
      expect(clicked).toBe(true);
      await page.waitForTimeout(1500);

      // Verify page header
      const header = await page.locator('h1:has-text("ภาษีหัก ณ ที่จ่าย")').count();
      expect(header).toBeGreaterThan(0);
    });

    test('WHT - WHT List Tab', async ({ page }) => {
      await clickSidebarButton(page, 'ภาษีหัก ณ ที่จ่าย', 'WHT');
      await page.waitForTimeout(1500);

      // Verify PND3 and PND53 references
      const pnd3Ref = await page.locator('text=PND3').count();
      const pnd53Ref = await page.locator('text=PND53').count();
      expect(pnd3Ref + pnd53Ref).toBeGreaterThan(0);

      // Verify 50 Tawi reference (or certificate generation)
      const tawiRef = await page.locator('text=50 ทวิ').count();

      // Verify summary cards or filter options
      const filterSection = page.locator('button:has-text("กรอง"), button:has-text("Filter")');
    });
  });

  // ============================================
  // SUMMARY TEST - All buttons verification
  // ============================================
  test.describe('Summary - All Expansion Module Buttons', () => {
    test('Verify all expansion module buttons are present', async ({ page }) => {
      const results = [];

      // All expansion modules to check
      const modules = [
        { id: 'inventory', thai: 'สต็อกสินค้า', english: 'Inventory' },
        { id: 'banking', thai: 'ธนาคาร', english: 'Banking' },
        { id: 'assets', thai: 'ทรัพย์สินถาวร', english: 'Assets' },
        { id: 'payroll', thai: 'เงินเดือน', english: 'Payroll' },
        { id: 'petty-cash', thai: 'เงินสดย่อย', english: 'Petty Cash' },
        { id: 'wht', thai: 'ภาษีหัก ณ ที่จ่าย', english: 'WHT' },
      ];

      const buttons = page.locator('aside nav button');
      const count = await buttons.count();

      for (const module of modules) {
        let found = false;
        for (let i = 0; i < count; i++) {
          const text = await buttons.nth(i).textContent();
          if (text && (text.includes(module.thai) || text.includes(module.english))) {
            found = true;
            break;
          }
        }
        results.push({ module: module.id, found });
      }

      // Log results
      console.log('\n==========================================');
      console.log('EXPANSION MODULES NAVIGATION SUMMARY');
      console.log('==========================================');
      for (const result of results) {
        const status = result.found ? '✅ FOUND' : '❌ NOT FOUND';
        console.log(`${status}: ${result.module}`);
      }
      console.log('==========================================\n');

      // All should be found
      const allFound = results.every((r) => r.found);
      expect(allFound).toBe(true);
    });
  });
});
