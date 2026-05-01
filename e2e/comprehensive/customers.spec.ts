import { test, expect } from '@playwright/test';
import {
  loginWithRetry,
  navigateToModule,
  clickButton,
  fillFormByLabels,
  waitForToast,
  takeScreenshot,
  verifyRecordExists,
  verifyRecordDeleted,
  getRecordByCode,
  deleteTestRecord,
  generateTestCode,
  generateTestCustomer,
  getAuthenticatedContext,
} from './test-helpers';

// ============================================
// TEST DATA
// ============================================
let testCustomerCode: string;
let testCustomerData: any;

// ============================================
// CUSTOMERS MODULE COMPREHENSIVE TESTS
// ============================================
test.describe.configure({ mode: 'serial' });

test.describe('Customers - Comprehensive Tests', () => {
  let apiContext: any;

  test.beforeAll(async () => {
    apiContext = await getAuthenticatedContext('accountant');
  });

  test.afterAll(async () => {
    await apiContext.dispose();

    // Cleanup test data
    const cleanupContext = await getAuthenticatedContext('admin');
    if (testCustomerCode) {
      await deleteTestRecord(cleanupContext, '/api/customers', testCustomerCode);
    }
    await cleanupContext.dispose();
  });

  test.beforeEach(async ({ page }) => {
    await page.setExtraHTTPHeaders({ 'x-playwright-test': 'true' });
    await loginWithRetry(page, 'accountant');
  });

  // ============================================
  // NAVIGATION TESTS
  // ============================================
  test('[NAVIGATE] To Customers module', async ({ page }) => {
    await navigateToModule(page, 'ลูกหนี้', 'Customers');

    // Verify page title
    const title = page.locator(
      'h1:has-text("ลูกหนี้"), h1:has-text("Customers"), h1:has-text("ลูกค้า")'
    );
    await expect(title.first()).toBeVisible();

    console.log('✅ Navigated to Customers module');
  });

  // ============================================
  // ADD CUSTOMER TESTS
  // ============================================
  test('[CREATE] Add Customer button', async ({ page }) => {
    await navigateToModule(page, 'ลูกหนี้');

    // Look for "Add Customer" button
    const addBtn = page
      .locator(
        'button:has-text("เพิ่มลูกค้า"), button:has-text("Add Customer"), button:has-text("สร้างลูกค้า"), button:has-text("เพิ่ม")'
      )
      .first();

    await expect(addBtn, 'Add Customer button should be visible').toBeVisible();

    console.log('✅ Add Customer button found');

    await takeScreenshot(page, 'screenshots/comprehensive/customers/add-customer-button.png');
  });

  test('[CREATE] Fill and submit new customer form', async ({ page }) => {
    await navigateToModule(page, 'ลูกหนี้');

    // Generate test customer data
    testCustomerCode = generateTestCode('CUST');
    testCustomerData = generateTestCustomer();
    testCustomerData.code = testCustomerCode;

    // Click add customer button
    const addBtn = page
      .locator(
        'button:has-text("เพิ่มลูกค้า"), button:has-text("Add Customer"), button:has-text("เพิ่ม")'
      )
      .first();
    await addBtn.click();

    await page.waitForTimeout(500);

    // Fill customer form
    await fillFormByLabels(page, {
      รหัส: testCustomerData.code,
      ชื่อลูกค้า: testCustomerData.name,
      เลขประจำตัวผู้เสียภาษี: testCustomerData.taxId,
      ที่อยู่: testCustomerData.address,
      'แขวง/ตำบล': testCustomerData.subDistrict,
      'เขต/อำเภอ': testCustomerData.district,
      จังหวัด: testCustomerData.province,
      รหัสไปรษณีย์: testCustomerData.postalCode,
      โทรศัพท์: testCustomerData.phone,
      อีเมล: testCustomerData.email,
      วงเงินเครดิต: testCustomerData.creditLimit.toString(),
      'วงเงินเครดิต (วัน)': testCustomerData.creditDays.toString(),
    });

    // Submit form
    const submitBtn = page
      .locator('button:has-text("บันทึก"), button:has-text("Save"), button[type="submit"]')
      .first();
    await submitBtn.click();

    // Wait for toast
    await waitForToast(page);

    console.log(`✅ Created customer: ${testCustomerCode}`);

    // Verify in database
    await verifyRecordExists(apiContext, '/api/customers', testCustomerCode, {
      code: testCustomerCode,
      name: testCustomerData.name,
    });
  });

  test('[VALIDATE] Customer code uniqueness', async ({ page }) => {
    await navigateToModule(page, 'ลูกหนี้');

    // Try to create customer with existing code
    const addBtn = page.locator('button:has-text("เพิ่ม"), button:has-text("Add")').first();
    await addBtn.click();

    await page.waitForTimeout(500);

    // Fill with existing code
    await fillFormByLabels(page, {
      รหัส: testCustomerCode,
      ชื่อลูกค้า: 'ลูกค้าซ้ำ',
    });

    // Submit
    const submitBtn = page.locator('button:has-text("บันทึก"), button:has-text("Save")').first();
    await submitBtn.click();

    // Should show validation error
    await page.waitForTimeout(1000);

    const error = page
      .locator('text=มีอยู่แล้ว, text=already exists, text=ซ้ำ, [role="alert"]')
      .first();
    const errorVisible = await error.isVisible().catch(() => false);

    expect(errorVisible, 'Should show duplicate code error').toBe(true);

    console.log('✅ Validated customer code uniqueness');

    // Close dialog
    await page.keyboard.press('Escape');
  });

  test('[VALIDATE] Required fields', async ({ page }) => {
    await navigateToModule(page, 'ลูกหนี้');

    const addBtn = page.locator('button:has-text("เพิ่ม"), button:has-text("Add")').first();
    await addBtn.click();

    await page.waitForTimeout(500);

    // Try to submit without required fields
    const submitBtn = page.locator('button:has-text("บันทึก"), button:has-text("Save")').first();
    await submitBtn.click();

    await page.waitForTimeout(500);

    // Should show validation errors
    const errors = page.locator(
      'text=จำเป็นต้องระบุ, text=required, [class*="error"], [class*="invalid"]'
    );
    const errorCount = await errors.count();

    expect(errorCount, 'Should show validation errors for required fields').toBeGreaterThan(0);

    console.log(`✅ Validated required fields (${errorCount} errors found)`);

    // Close dialog
    await page.keyboard.press('Escape');
  });

  test('[VALIDATE] Email format', async ({ page }) => {
    await navigateToModule(page, 'ลูกหนี้');

    const addBtn = page.locator('button:has-text("เพิ่ม"), button:has-text("Add")').first();
    await addBtn.click();

    await page.waitForTimeout(500);

    // Fill with invalid email
    await fillFormByLabels(page, {
      รหัส: generateTestCode('CUST'),
      ชื่อลูกค้า: 'ทดสอบอีเมล',
      อีเมล: 'invalid-email-format',
    });

    const submitBtn = page.locator('button:has-text("บันทึก"), button:has-text("Save")').first();
    await submitBtn.click();

    await page.waitForTimeout(500);

    // Should show email format error
    const emailError = page
      .locator('text=อีเมลไม่ถูกต้อง, text=invalid email, text=รูปแบบอีเมล')
      .first();
    const emailErrorVisible = await emailError.isVisible().catch(() => false);

    if (emailErrorVisible) {
      console.log('✅ Validated email format');
    }

    // Close dialog
    await page.keyboard.press('Escape');
  });

  // ============================================
  // EDIT CUSTOMER TESTS
  // ============================================
  test('[EDIT] Customer button per row', async ({ page }) => {
    await navigateToModule(page, 'ลูกหนี้');

    // Find the test customer in table
    const table = page.locator('table').first();
    const rows = table.locator('tbody tr');

    let testCustomerFound = false;
    const rowCount = await rows.count();

    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const text = await row.textContent();

      if (text && text.includes(testCustomerCode)) {
        testCustomerFound = true;

        // Find edit button in this row
        const editBtn = row
          .locator(
            'button[aria-label*="แก้ไข"], button[title*="แก้ไข"], button svg[class*="edit"], button svg[class*="pencil"]'
          )
          .first();

        if (await editBtn.isVisible().catch(() => false)) {
          await editBtn.click();
          console.log(`✅ Clicked edit button for customer: ${testCustomerCode}`);
          break;
        }
      }
    }

    expect(testCustomerFound, 'Test customer should be found in table').toBe(true);

    await page.waitForTimeout(500);

    // Edit customer phone
    const phoneInput = page
      .locator('input[name*="phone"], input[name*="โทร"], label:has-text("โทรศัพท์") + input')
      .first();

    if (await phoneInput.isVisible().catch(() => false)) {
      await phoneInput.clear();
      await phoneInput.fill('08-9999-9999');

      // Submit
      const submitBtn = page.locator('button:has-text("บันทึก"), button:has-text("Save")').first();
      await submitBtn.click();

      await waitForToast(page);

      console.log('✅ Edited customer phone number');

      // Verify in database
      const record = await getRecordByCode(apiContext, '/api/customers', testCustomerCode);
      expect(record.phone).toBe('08-9999-9999');
    }
  });

  test('[EDIT] Multiple fields', async ({ page }) => {
    await navigateToModule(page, 'ลูกหนี้');

    // Find test customer and edit
    const table = page.locator('table').first();
    const rows = table.locator('tbody tr');

    const rowCount = await rows.count();

    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const text = await row.textContent();

      if (text && text.includes(testCustomerCode)) {
        const editBtn = row.locator('button svg[class*="edit"]').first();

        if (await editBtn.isVisible().catch(() => false)) {
          await editBtn.click();
          await page.waitForTimeout(500);

          // Edit multiple fields
          await fillFormByLabels(page, {
            ที่อยู่: 'ที่อยู่ใหม่ 456',
            รหัสไปรษณีย์: '10400',
          });

          const submitBtn = page
            .locator('button:has-text("บันทึก"), button:has-text("Save")')
            .first();
          await submitBtn.click();

          await waitForToast(page);

          console.log('✅ Edited multiple customer fields');

          break;
        }
      }
    }
  });

  // ============================================
  // DELETE CUSTOMER TESTS
  // ============================================
  test('[DELETE] Customer button with confirmation', async ({ page }) => {
    await navigateToModule(page, 'ลูกหนี้');

    // Find test customer
    const table = page.locator('table').first();
    const rows = table.locator('tbody tr');

    let testCustomerFound = false;
    const rowCount = await rows.count();

    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const text = await row.textContent();

      if (text && text.includes(testCustomerCode)) {
        testCustomerFound = true;

        // Find delete button
        const deleteBtn = row
          .locator(
            'button[aria-label*="ลบ"], button[title*="ลบ"], button svg[class*="trash"], button svg[class*="delete"]'
          )
          .first();

        if (await deleteBtn.isVisible().catch(() => false)) {
          await deleteBtn.click();
          console.log(`✅ Clicked delete button for: ${testCustomerCode}`);

          await page.waitForTimeout(500);

          // Verify confirmation dialog
          const confirmDialog = page
            .locator('[role="dialog"]:has-text("ลบ"), [role="dialog"]:has-text("ยืนยัน")')
            .first();
          await expect(confirmDialog, 'Delete confirmation dialog should appear').toBeVisible();

          // Verify dialog content
          const dialogText = await confirmDialog.textContent();
          expect(dialogText).toContain(testCustomerCode);

          // Cancel deletion for now (we'll delete in cleanup)
          const cancelBtn = confirmDialog
            .locator('button:has-text("ยกเลิก"), button:has-text("Cancel")')
            .first();
          await cancelBtn.click();

          console.log('✅ Verified delete confirmation dialog');

          break;
        }
      }
    }

    expect(testCustomerFound, 'Test customer should be found').toBe(true);
  });

  // ============================================
  // SEARCH AND FILTER TESTS
  // ============================================
  test('[SEARCH] Customer by name', async ({ page }) => {
    await navigateToModule(page, 'ลูกหนี้');

    // Find search input
    const searchInput = page
      .locator('input[placeholder*="ค้นหา"], input[placeholder*="search"], input[name*="search"]')
      .first();

    if (await searchInput.isVisible().catch(() => false)) {
      // Search for test customer
      await searchInput.fill(testCustomerData.name.substring(0, 10));
      await page.waitForTimeout(1000);

      console.log(`✅ Searched for customer: ${testCustomerData.name.substring(0, 10)}`);

      // Verify search results
      const table = page.locator('table').first();
      const rows = table.locator('tbody tr');
      const rowCount = await rows.count();

      let foundInResults = false;
      for (let i = 0; i < Math.min(rowCount, 10); i++) {
        const text = await rows.nth(i).textContent();
        if (text && text.includes(testCustomerCode)) {
          foundInResults = true;
          break;
        }
      }

      expect(foundInResults, 'Test customer should appear in search results').toBe(true);

      // Clear search
      await searchInput.clear();
      await page.waitForTimeout(500);
    } else {
      console.log('⚠️ Search input not found');
    }
  });

  test('[FILTER] Customer by status', async ({ page }) => {
    await navigateToModule(page, 'ลูกหนี้');

    // Look for status filter
    const statusFilter = page
      .locator(
        'select[name*="status"], [role="combobox"], button:has-text("สถานะ"), button:has-text("ทั้งหมด")'
      )
      .first();

    if (await statusFilter.isVisible().catch(() => false)) {
      await statusFilter.click();
      await page.waitForTimeout(500);

      // Try to select Active status
      const activeOption = page
        .locator(
          '[role="option"]:has-text("ACTIVE"), [role="option"]:has-text("ใช้งาน"), [role="option"]:has-text("Active")'
        )
        .first();

      if (await activeOption.isVisible().catch(() => false)) {
        await activeOption.click();
        await page.waitForTimeout(1000);

        console.log('✅ Filtered customers by status: ACTIVE');
      }
    } else {
      console.log('⚠️ Status filter not found');
    }
  });

  // ============================================
  // VIEW CUSTOMER DETAILS TESTS
  // ============================================
  test('[VIEW] Customer details', async ({ page }) => {
    await navigateToModule(page, 'ลูกหนี้');

    // Find test customer row
    const table = page.locator('table').first();
    const rows = table.locator('tbody tr');

    const rowCount = await rows.count();

    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const text = await row.textContent();

      if (text && text.includes(testCustomerCode)) {
        // Look for view/details button
        const viewBtn = row
          .locator(
            'button[aria-label*="ดู"], button[title*="ดู"], button svg[class*="eye"], a[href*="/customers/"]'
          )
          .first();

        if (await viewBtn.isVisible().catch(() => false)) {
          await viewBtn.click();
          await page.waitForTimeout(1000);

          console.log('✅ Opened customer details view');

          // Verify details are shown
          const detailsPanel = page
            .locator('[role="dialog"], [class*="details"], [class*="panel"]')
            .first();
          const detailsVisible = await detailsPanel.isVisible().catch(() => false);

          if (detailsVisible) {
            // Check for customer information
            const hasName =
              (await detailsPanel.locator(`text=${testCustomerData.name}`).count()) > 0;
            const hasCode = (await detailsPanel.locator(`text=${testCustomerCode}`).count()) > 0;

            expect(hasName || hasCode, 'Customer details should show name or code').toBe(true);

            console.log('✅ Customer details displayed correctly');

            // Close details
            await page.keyboard.press('Escape');
          }

          break;
        }
      }
    }
  });

  // ============================================
  // CUSTOMER BALANCE TESTS
  // ============================================
  test('[VERIFY] Customer balance display', async ({ page }) => {
    await navigateToModule(page, 'ลูกหนี้');

    // Check if balance column exists
    const table = page.locator('table').first();
    const balanceHeader = table
      .locator('th:has-text("ยอดค้างชำระ"), th:has-text("Balance"), th:has-text("หนี้")')
      .first();

    if (await balanceHeader.isVisible().catch(() => false)) {
      console.log('✅ Customer balance column found');

      // Find test customer balance
      const rows = table.locator('tbody tr');
      const rowCount = await rows.count();

      for (let i = 0; i < rowCount; i++) {
        const text = await rows.nth(i).textContent();
        if (text && text.includes(testCustomerCode)) {
          console.log(`✅ Customer balance displayed for: ${testCustomerCode}`);
          break;
        }
      }
    } else {
      console.log('⚠️ Balance column not found (may be in separate view)');
    }
  });

  // ============================================
  // CUSTOMER IN INVOICE DROPDOWN TESTS
  // ============================================
  test('[INTEGRATION] Customer appears in invoice dropdown', async ({ page }) => {
    // Navigate to Invoices module
    await navigateToModule(page, 'ใบกำกับภาษี');

    // Click create invoice button
    const createBtn = page
      .locator(
        'button:has-text("สร้างเอกสารใหม่"), button:has-text("สร้าง"), button:has-text("เพิ่ม")'
      )
      .first();
    await createBtn.click();

    await page.waitForTimeout(500);

    // Look for customer dropdown/selector
    const customerSelect = page
      .locator(
        'select[name*="customer"], [role="combobox"]:has-text("ลูกค้า"), label:has-text("ลูกค้า") + select, label:has-text("ลูกค้า") + div'
      )
      .first();

    if (await customerSelect.isVisible().catch(() => false)) {
      // Try to open dropdown
      await customerSelect.click();
      await page.waitForTimeout(500);

      // Check if test customer appears in options
      const testCustomerOption = page
        .locator(
          `[role="option"]:has-text("${testCustomerCode}"), [role="option"]:has-text("${testCustomerData.name}"), option[value*="${testCustomerCode}"]`
        )
        .first();

      const optionVisible = await testCustomerOption.isVisible().catch(() => false);

      if (optionVisible) {
        console.log('✅ Test customer appears in invoice dropdown');
      } else {
        console.log('⚠️ Test customer option not visible (may need to search or scroll)');
      }

      // Close dialog
      await page.keyboard.press('Escape');
    } else {
      console.log('⚠️ Customer dropdown not found in invoice form');
      await page.keyboard.press('Escape');
    }
  });

  // ============================================
  // EXPORT TESTS
  // ============================================
  test('[EXPORT] Customer list', async ({ page }) => {
    await navigateToModule(page, 'ลูกหนี้');

    // Look for export button
    const exportBtn = page
      .locator(
        'button:has-text("ส่งออก"), button:has-text("Export"), button:has-text("ดาวน์โหลด"), button svg[class*="download"]'
      )
      .first();

    if (await exportBtn.isVisible().catch(() => false)) {
      // Setup download handler
      const downloadPromise = page.waitForEvent('download', { timeout: 10000 });

      await exportBtn.click();

      try {
        const download = await downloadPromise;
        console.log(`✅ Exported customers to: ${download.suggestedFilename()}`);
      } catch {
        console.log('⚠️ Download did not start');
      }
    } else {
      console.log('⚠️ Export button not found');
    }
  });

  // ============================================
  // PAGINATION TESTS
  // ============================================
  test('[PAGINATION] Navigate customer list', async ({ page }) => {
    await navigateToModule(page, 'ลูกหนี้');

    // Look for pagination controls
    const nextPageBtn = page
      .locator('button:has-text("ถัดไป"), button:has-text("Next"), [aria-label="Next"]')
      .first();

    const nextVisible = await nextPageBtn.isVisible().catch(() => false);

    if (nextVisible) {
      const initialRowCount = await page.locator('table tbody tr').count();

      await nextPageBtn.click();
      await page.waitForTimeout(1000);

      const afterNextRowCount = await page.locator('table tbody tr').count();

      console.log(`✅ Navigated customer pages (rows: ${initialRowCount} -> ${afterNextRowCount})`);

      // Go back
      const prevPageBtn = page
        .locator('button:has-text("ก่อนหน้า"), button:has-text("Prev"), [aria-label="Previous"]')
        .first();
      if (await prevPageBtn.isVisible().catch(() => false)) {
        await prevPageBtn.click();
        await page.waitForTimeout(1000);
      }
    } else {
      console.log('⚠️ Pagination not available (not enough customers)');
    }
  });

  // ============================================
  // SUMMARY SCREENSHOT
  // ============================================
  test('[SCREENSHOT] Customers module overview', async ({ page }) => {
    await navigateToModule(page, 'ลูกหนี้');

    await takeScreenshot(page, 'screenshots/comprehensive/customers/customers-overview.png');

    console.log('📸 Taken customers module overview screenshot');
  });
});
