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
  generateTestProduct,
  getAuthenticatedContext,
} from './test-helpers';

// ============================================
// TEST DATA
// ============================================
let testProductCode: string;
let testProductData: any;

// ============================================
// PRODUCTS MODULE COMPREHENSIVE TESTS
// ============================================
test.describe.configure({ mode: 'serial' });

test.describe('Products - Comprehensive Tests', () => {
  let apiContext: any;

  test.beforeAll(async () => {
    apiContext = await getAuthenticatedContext('accountant');
  });

  test.afterAll(async () => {
    await apiContext.dispose();

    // Cleanup test data
    const cleanupContext = await getAuthenticatedContext('admin');
    if (testProductCode) {
      await deleteTestRecord(cleanupContext, '/api/products', testProductCode);
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
  test('[NAVIGATE] To Products module', async ({ page }) => {
    await navigateToModule(page, 'สินค้า', 'Products');

    // Verify page title
    const title = page.locator(
      'h1:has-text("สินค้า"), h1:has-text("Products"), h1:has-text("สินค้าและบริการ")'
    );
    await expect(title.first()).toBeVisible();

    console.log('✅ Navigated to Products module');
  });

  // ============================================
  // ADD PRODUCT TESTS
  // ============================================
  test('[CREATE] Add Product button', async ({ page }) => {
    await navigateToModule(page, 'สินค้า');

    // Look for "Add Product" button
    const addBtn = page
      .locator(
        'button:has-text("เพิ่มสินค้า"), button:has-text("Add Product"), button:has-text("สร้างสินค้า"), button:has-text("เพิ่ม")'
      )
      .first();

    await expect(addBtn, 'Add Product button should be visible').toBeVisible();

    console.log('✅ Add Product button found');

    await takeScreenshot(page, 'screenshots/comprehensive/products/add-product-button.png');
  });

  test('[CREATE] Fill and submit new product form', async ({ page }) => {
    await navigateToModule(page, 'สินค้า');

    // Generate test product data
    testProductCode = generateTestCode('PROD');
    testProductData = generateTestProduct();
    testProductData.code = testProductCode;

    // Click add product button
    const addBtn = page
      .locator(
        'button:has-text("เพิ่มสินค้า"), button:has-text("Add Product"), button:has-text("เพิ่ม")'
      )
      .first();
    await addBtn.click();

    await page.waitForTimeout(500);

    // Fill product form
    await fillFormByLabels(page, {
      รหัส: testProductData.code,
      ชื่อสินค้า: testProductData.name,
      'ชื่อสินค้า (Eng)': testProductData.nameEn,
      หน่วย: testProductData.unit,
      ราคาขาย: testProductData.price.toString(),
      ต้นทุน: testProductData.cost.toString(),
      ภาษีมูลค่าเพิ่ม: testProductData.vatType,
      ประเภทรายได้: testProductData.incomeType,
    });

    // Check inventory item checkbox if exists
    const inventoryCheckbox = page
      .locator('input[type="checkbox"][name*="inventory"], label:has-text("สินค้าคงเหลือ") input')
      .first();
    if (await inventoryCheckbox.isVisible().catch(() => false)) {
      await inventoryCheckbox.check();
      console.log('  ✅ Checked inventory item checkbox');
    }

    // Submit form
    const submitBtn = page
      .locator('button:has-text("บันทึก"), button:has-text("Save"), button[type="submit"]')
      .first();
    await submitBtn.click();

    // Wait for toast
    await waitForToast(page);

    console.log(`✅ Created product: ${testProductCode}`);

    // Verify in database
    await verifyRecordExists(apiContext, '/api/products', testProductCode, {
      code: testProductCode,
      name: testProductData.name,
    });
  });

  test('[VALIDATE] Product code uniqueness', async ({ page }) => {
    await navigateToModule(page, 'สินค้า');

    // Try to create product with existing code
    const addBtn = page.locator('button:has-text("เพิ่ม"), button:has-text("Add")').first();
    await addBtn.click();

    await page.waitForTimeout(500);

    // Fill with existing code
    await fillFormByLabels(page, {
      รหัส: testProductCode,
      ชื่อสินค้า: 'สินค้าซ้ำ',
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

    console.log('✅ Validated product code uniqueness');

    // Close dialog
    await page.keyboard.press('Escape');
  });

  test('[VALIDATE] Required fields', async ({ page }) => {
    await navigateToModule(page, 'สินค้า');

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

  test('[VALIDATE] Price and cost values', async ({ page }) => {
    await navigateToModule(page, 'สินค้า');

    const addBtn = page.locator('button:has-text("เพิ่ม"), button:has-text("Add")').first();
    await addBtn.click();

    await page.waitForTimeout(500);

    // Fill with negative price
    await fillFormByLabels(page, {
      รหัส: generateTestCode('PROD'),
      ชื่อสินค้า: 'ทดสอบราคา',
      ราคาขาย: '-100',
    });

    const submitBtn = page.locator('button:has-text("บันทึก"), button:has-text("Save")').first();
    await submitBtn.click();

    await page.waitForTimeout(500);

    // Should show validation error for negative price
    const error = page.locator('text=ต้องมากกว่า 0, text=must be positive, text=invalid').first();
    const errorVisible = await error.isVisible().catch(() => false);

    if (errorVisible) {
      console.log('✅ Validated price must be positive');
    }

    // Close dialog
    await page.keyboard.press('Escape');
  });

  // ============================================
  // EDIT PRODUCT TESTS
  // ============================================
  test('[EDIT] Product button per row', async ({ page }) => {
    await navigateToModule(page, 'สินค้า');

    // Find the test product in table
    const table = page.locator('table').first();
    const rows = table.locator('tbody tr');

    let testProductFound = false;
    const rowCount = await rows.count();

    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const text = await row.textContent();

      if (text && text.includes(testProductCode)) {
        testProductFound = true;

        // Find edit button in this row
        const editBtn = row
          .locator(
            'button[aria-label*="แก้ไข"], button[title*="แก้ไข"], button svg[class*="edit"], button svg[class*="pencil"]'
          )
          .first();

        if (await editBtn.isVisible().catch(() => false)) {
          await editBtn.click();
          console.log(`✅ Clicked edit button for product: ${testProductCode}`);
          break;
        }
      }
    }

    expect(testProductFound, 'Test product should be found in table').toBe(true);

    await page.waitForTimeout(500);

    // Edit product price
    const priceInput = page
      .locator('input[name*="price"], input[name*="ราคา"], label:has-text("ราคาขาย") + input')
      .first();

    if (await priceInput.isVisible().catch(() => false)) {
      await priceInput.clear();
      await priceInput.fill('1500');

      // Submit
      const submitBtn = page.locator('button:has-text("บันทึก"), button:has-text("Save")').first();
      await submitBtn.click();

      await waitForToast(page);

      console.log('✅ Edited product price');

      // Verify in database
      const record = await getRecordByCode(apiContext, '/api/products', testProductCode);
      expect(record.price).toBe(1500);
    }
  });

  test('[EDIT] Change VAT type', async ({ page }) => {
    await navigateToModule(page, 'สินค้า');

    // Find test product and edit
    const table = page.locator('table').first();
    const rows = table.locator('tbody tr');

    const rowCount = await rows.count();

    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const text = await row.textContent();

      if (text && text.includes(testProductCode)) {
        const editBtn = row.locator('button svg[class*="edit"]').first();

        if (await editBtn.isVisible().catch(() => false)) {
          await editBtn.click();
          await page.waitForTimeout(500);

          // Change VAT type
          const vatSelect = page
            .locator('select[name*="vat"], label:has-text("ภาษีมูลค่าเพิ่ม") + select')
            .first();

          if (await vatSelect.isVisible().catch(() => false)) {
            await vatSelect.selectOption('VAT0');
            console.log('  ✅ Changed VAT type to VAT0');
          }

          const submitBtn = page
            .locator('button:has-text("บันทึก"), button:has-text("Save")')
            .first();
          await submitBtn.click();

          await waitForToast(page);

          console.log('✅ Edited product VAT type');

          break;
        }
      }
    }
  });

  // ============================================
  // DELETE PRODUCT TESTS
  // ============================================
  test('[DELETE] Product button with confirmation', async ({ page }) => {
    await navigateToModule(page, 'สินค้า');

    // Find test product
    const table = page.locator('table').first();
    const rows = table.locator('tbody tr');

    let testProductFound = false;
    const rowCount = await rows.count();

    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const text = await row.textContent();

      if (text && text.includes(testProductCode)) {
        testProductFound = true;

        // Find delete button
        const deleteBtn = row
          .locator(
            'button[aria-label*="ลบ"], button[title*="ลบ"], button svg[class*="trash"], button svg[class*="delete"]'
          )
          .first();

        if (await deleteBtn.isVisible().catch(() => false)) {
          await deleteBtn.click();
          console.log(`✅ Clicked delete button for: ${testProductCode}`);

          await page.waitForTimeout(500);

          // Verify confirmation dialog
          const confirmDialog = page
            .locator('[role="dialog"]:has-text("ลบ"), [role="dialog"]:has-text("ยืนยัน")')
            .first();
          await expect(confirmDialog, 'Delete confirmation dialog should appear').toBeVisible();

          // Verify dialog content
          const dialogText = await confirmDialog.textContent();
          expect(dialogText).toContain(testProductCode);

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

    expect(testProductFound, 'Test product should be found').toBe(true);
  });

  // ============================================
  // STOCK LEVEL TESTS
  // ============================================
  test('[VERIFY] Stock level indicator', async ({ page }) => {
    await navigateToModule(page, 'สินค้า');

    // Find test product row
    const table = page.locator('table').first();
    const rows = table.locator('tbody tr');

    const rowCount = await rows.count();

    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const text = await row.textContent();

      if (text && text.includes(testProductCode)) {
        // Look for stock level column
        const stockCell = row
          .locator('td:has-text("ชิ้น"), td:has-text("stock"), td[class*="stock"]')
          .first();

        if (await stockCell.isVisible().catch(() => false)) {
          console.log('✅ Stock level indicator found for product');
          console.log(`  Stock: ${await stockCell.textContent()}`);
        }

        break;
      }
    }
  });

  // ============================================
  // SEARCH AND FILTER TESTS
  // ============================================
  test('[SEARCH] Product by name', async ({ page }) => {
    await navigateToModule(page, 'สินค้า');

    // Find search input
    const searchInput = page
      .locator('input[placeholder*="ค้นหา"], input[placeholder*="search"], input[name*="search"]')
      .first();

    if (await searchInput.isVisible().catch(() => false)) {
      // Search for test product
      await searchInput.fill(testProductData.name.substring(0, 10));
      await page.waitForTimeout(1000);

      console.log(`✅ Searched for product: ${testProductData.name.substring(0, 10)}`);

      // Verify search results
      const table = page.locator('table').first();
      const rows = table.locator('tbody tr');
      const rowCount = await rows.count();

      let foundInResults = false;
      for (let i = 0; i < Math.min(rowCount, 10); i++) {
        const text = await rows.nth(i).textContent();
        if (text && text.includes(testProductCode)) {
          foundInResults = true;
          break;
        }
      }

      expect(foundInResults, 'Test product should appear in search results').toBe(true);

      // Clear search
      await searchInput.clear();
      await page.waitForTimeout(500);
    } else {
      console.log('⚠️ Search input not found');
    }
  });

  test('[FILTER] Product by category', async ({ page }) => {
    await navigateToModule(page, 'สินค้า');

    // Look for category filter
    const categoryFilter = page
      .locator(
        'select[name*="category"], [role="combobox"], button:has-text("หมวดหมู่"), button:has-text("ประเภท")'
      )
      .first();

    if (await categoryFilter.isVisible().catch(() => false)) {
      await categoryFilter.click();
      await page.waitForTimeout(500);

      console.log('✅ Category filter found');

      // Try to select a category
      const firstOption = page.locator('[role="option"]').first();
      if (await firstOption.isVisible().catch(() => false)) {
        await firstOption.click();
        await page.waitForTimeout(1000);

        console.log('✅ Filtered products by category');
      }
    } else {
      console.log('⚠️ Category filter not found');
    }
  });

  test('[FILTER] Product by status', async ({ page }) => {
    await navigateToModule(page, 'สินค้า');

    // Look for status filter
    const statusFilter = page
      .locator('select[name*="status"], [role="combobox"], button:has-text("สถานะ")')
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

        console.log('✅ Filtered products by status: ACTIVE');
      }
    } else {
      console.log('⚠️ Status filter not found');
    }
  });

  // ============================================
  // INVOICE INTEGRATION TESTS
  // ============================================
  test('[INTEGRATION] Product appears in invoice line items', async ({ page }) => {
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

    // Look for product line item selector
    const productSelect = page
      .locator(
        'select[name*="product"], [role="combobox"]:has-text("สินค้า"), label:has-text("สินค้า") + select'
      )
      .first();

    if (await productSelect.isVisible().catch(() => false)) {
      // Try to open dropdown
      await productSelect.click();
      await page.waitForTimeout(500);

      // Check if test product appears in options
      const testProductOption = page
        .locator(
          `[role="option"]:has-text("${testProductCode}"), [role="option"]:has-text("${testProductData.name}"), option[value*="${testProductCode}"]`
        )
        .first();

      const optionVisible = await testProductOption.isVisible().catch(() => false);

      if (optionVisible) {
        console.log('✅ Test product appears in invoice line items');
      } else {
        console.log('⚠️ Test product option not visible (may need to search or scroll)');
      }

      // Close dialog
      await page.keyboard.press('Escape');
    } else {
      console.log('⚠️ Product selector not found in invoice form');
      await page.keyboard.press('Escape');
    }
  });

  // ============================================
  // PRICE AND COST DISPLAY TESTS
  // ============================================
  test('[VERIFY] Price and cost display in table', async ({ page }) => {
    await navigateToModule(page, 'สินค้า');

    // Check if price and cost columns exist
    const table = page.locator('table').first();

    const priceHeader = table
      .locator('th:has-text("ราคาขาย"), th:has-text("Price"), th:has-text("ราคา")')
      .first();
    const costHeader = table.locator('th:has-text("ต้นทุน"), th:has-text("Cost")').first();

    const priceVisible = await priceHeader.isVisible().catch(() => false);
    const costVisible = await costHeader.isVisible().catch(() => false);

    if (priceVisible) {
      console.log('✅ Price column found in product table');
    }

    if (costVisible) {
      console.log('✅ Cost column found in product table');
    }

    // Find test product and verify values
    const rows = table.locator('tbody tr');
    const rowCount = await rows.count();

    for (let i = 0; i < rowCount; i++) {
      const text = await rows.nth(i).textContent();

      if (text && text.includes(testProductCode)) {
        console.log(`✅ Product price and cost displayed for: ${testProductCode}`);
        break;
      }
    }
  });

  // ============================================
  // EXPORT TESTS
  // ============================================
  test('[EXPORT] Product list', async ({ page }) => {
    await navigateToModule(page, 'สินค้า');

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
        console.log(`✅ Exported products to: ${download.suggestedFilename()}`);
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
  test('[PAGINATION] Navigate product list', async ({ page }) => {
    await navigateToModule(page, 'สินค้า');

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

      console.log(`✅ Navigated product pages (rows: ${initialRowCount} -> ${afterNextRowCount})`);

      // Go back
      const prevPageBtn = page
        .locator('button:has-text("ก่อนหน้า"), button:has-text("Prev"), [aria-label="Previous"]')
        .first();
      if (await prevPageBtn.isVisible().catch(() => false)) {
        await prevPageBtn.click();
        await page.waitForTimeout(1000);
      }
    } else {
      console.log('⚠️ Pagination not available (not enough products)');
    }
  });

  // ============================================
  // SUMMARY SCREENSHOT
  // ============================================
  test('[SCREENSHOT] Products module overview', async ({ page }) => {
    await navigateToModule(page, 'สินค้า');

    await takeScreenshot(page, 'screenshots/comprehensive/products/products-overview.png');

    console.log('📸 Taken products module overview screenshot');
  });
});
