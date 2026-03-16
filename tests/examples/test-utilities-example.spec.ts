/**
 * Example E2E Test Using Test Utilities
 *
 * This file demonstrates how to use the test utilities for E2E testing.
 * It's not meant to be run as an actual test, but serves as documentation
 * and examples for writing real E2E tests.
 */

import { test, expect } from '@playwright/test';
import {
  // Constants
  TEST_USERS,
  URLs,
  TIMEOUTS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,

  // Test Helpers
  loginAs,
  logout,
  setupTest,
  navigateTo,
  clickSidebarNavItem,
  waitForToast,
  getToastMessage,
  clickButton,
  fillField,
  fillForm,
  submitForm,
  verifyTableRowCount,
  getTableRowData,
  findTableRowByText,
  screenshotOnFailure,
  waitForApiResponse,

  // Database Verification
  verifyRecordCount,
  verifyRecordExists,
  verifyRecordValues,
  verifyJournalEntry,
  verifyJournalEntryBalances,
  getRecordCount,
  getAllRecords,
  getRecordById,
  seedTestData,
  getTestDataIds,
  clearTestData,
  disconnectDatabase,
  getAccountBalance,

  // Test Data Factory
  createTestCustomer,
  createTestVendor,
  createTestProduct,
  createTestInvoice,
  createTestReceipt,
  createTestPayment,
  createTestScenario,
  deleteTestData,

  // Utilities
  createTestContext,
  createTestWithDb,
  sleep,
  formatThaiDate,
  formatCurrency
} from '../utils';

test.describe('Example Test Suite', () => {
  // Setup and teardown
  test.beforeAll(async () => {
    // Seed database with initial test data
    await seedTestData();
  });

  test.afterAll(async () => {
    // Clean up database
    await clearTestData();
    await disconnectDatabase();
  });

  test.beforeEach(async ({ page }) => {
    // Setup test environment
    await setupTest(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    // Take screenshot on failure
    if (testInfo.status === 'failed') {
      await screenshotOnFailure(page, testInfo.title);
    }
  });

  test('Example: Login and navigate to dashboard', async ({ page }) => {
    // Login as admin
    await loginAs(page, 'ADMIN');

    // Verify we're on dashboard
    await verifyUrl(page, URLs.DASHBOARD);

    // Wait for sidebar to be visible
    await expect(page.locator('[data-sidebar]')).toBeVisible();
  });

  test('Example: Create a customer via UI', async ({ page }) => {
    // Login
    await loginAs(page, 'ACCOUNTANT');

    // Navigate to customers page
    await navigateTo(page, URLs.CUSTOMERS);

    // Click "New Customer" button
    await clickButton(page, 'สร้างลูกค้าใหม่');

    // Fill customer form
    await fillForm(page, {
      'ชื่อลูกค้า': 'Test Customer UI',
      'เลขประจำตัวผู้เสียภาษี': '1234567890123',
      'อีเมล': 'test@example.com',
      'เบอร์โทรศัพท์': '0812345678',
      'ที่อยู่': '123 Test Street',
      'จังหวัด': 'Bangkok',
      'รหัสไปรษณีย์': '10100',
      'วงเงินเครดิต': '50000'
    });

    // Submit form
    await submitForm(page);

    // Wait for success toast
    await waitForToast(page);
    const toastMessage = await getToastMessage(page);
    expect(toastMessage).toContain(SUCCESS_MESSAGES.CREATED);

    // Verify customer was created in database
    const customers = await getAllRecords('customer');
    const testCustomer = customers.find((c: any) => c.name === 'Test Customer UI');
    expect(testCustomer).toBeDefined();
  });

  test('Example: Create invoice and verify journal entry', async ({ page }) => {
    // Login
    await loginAs(page, 'ACCOUNTANT');

    // Get test data IDs
    const testIds = await getTestDataIds();

    // Navigate to invoices page
    await navigateTo(page, URLs.INVOICES);

    // Click "New Invoice" button
    await clickButtonContaining(page, 'สร้างใบกำกับภาษี');

    // Fill invoice form
    await fillField(page, 'ลูกค้า', testIds.customerId); // Select customer
    await fillFieldByPlaceholder(page, 'วันที่ออกเอกสาร', formatThaiDate(new Date()));
    await fillFieldByPlaceholder(page, 'วันครบกำหนด', formatThaiDate(new Date()));

    // Add invoice item
    await clickButton(page, 'เพิ่มรายการ');

    // Wait for API response
    const response = await waitForApiResponse(
      page,
      '/api/invoices',
      async () => {
        await submitForm(page);
      }
    );

    expect(response.success).toBe(true);

    // Wait for toast
    await waitForToast(page);
    const toastMessage = await getToastMessage(page);
    expect(toastMessage).toContain('สร้างสำเร็จ');

    // Verify invoice was created in database
    const invoices = await getAllRecords('invoice');
    expect(invoices.length).toBeGreaterThan(0);

    const invoice = invoices[invoices.length - 1];
    expect(invoice.status).toBe('POSTED');

    // Verify journal entry was created
    const hasJournalEntry = await verifyJournalEntry('invoice', invoice.id);
    expect(hasJournalEntry).toBe(true);

    // Verify journal entry balances
    if (invoice.journalEntryId) {
      const balances = await verifyJournalEntryBalances(invoice.journalEntryId);
      expect(balances).toBe(true);
    }
  });

  test('Example: Test data factory usage', async ({ page }) => {
    // Create test scenario with all related data
    const scenario = await createTestScenario();

    // Verify data was created
    expect(scenario.customer).toBeDefined();
    expect(scenario.vendor).toBeDefined();
    expect(scenario.products).toHaveLength(3);
    expect(scenario.invoice).toBeDefined();
    expect(scenario.receipt).toBeDefined();
    expect(scenario.payment).toBeDefined();

    // Login and verify invoice appears in UI
    await loginAs(page, 'ACCOUNTANT');
    await navigateTo(page, URLs.INVOICES);

    // Find invoice in table
    const rowIndex = await findTableRowByText(page, scenario.invoice.invoiceNumber);
    expect(rowIndex).toBeGreaterThanOrEqual(0);

    // Get row data
    const rowData = await getTableRowData(page, rowIndex);
    expect(rowData['เลขที่เอกสาร']).toBe(scenario.invoice.invoiceNumber);
    expect(rowData['ชื่อลูกค้า']).toBe(scenario.customer.name);

    // Cleanup
    await deleteTestData();
  });

  test('Example: Database verification', async ({ page }) => {
    // Create test customer via factory
    const customer = await createTestCustomer({
      name: 'DB Verification Test',
      email: 'db-test@example.com'
    });

    // Verify customer exists
    const exists = await verifyRecordExists('customer', customer.id);
    expect(exists).toBe(true);

    // Verify customer values
    const valuesMatch = await verifyRecordValues('customer', customer.id, {
      name: 'DB Verification Test',
      email: 'db-test@example.com'
    });
    expect(valuesMatch).toBe(true);

    // Update customer (simulate UI action)
    await loginAs(page, 'ACCOUNTANT');
    await navigateTo(page, URLs.CUSTOMERS);

    const rowIndex = await findTableRowByText(page, customer.name);
    expect(rowIndex).toBeGreaterThanOrEqual(0);

    // Click edit, update, and verify
    // ... (actual UI interactions here)

    // Verify update in database
    const updatedCustomer = await getRecordById('customer', customer.id);
    expect(updatedCustomer).toBeDefined();

    // Delete customer
    await deleteTestData();
    const deleted = await verifyRecordDeleted('customer', customer.id);
    expect(deleted).toBe(true);
  });

  test('Example: Account balance verification', async ({ page }) => {
    // Create test invoice
    const invoice = await createTestInvoice();

    // Verify journal entry was created
    const hasJournalEntry = await verifyJournalEntry('invoice', invoice.id);
    expect(hasJournalEntry).toBe(true);

    // Get account balances
    const arBalance = await getAccountBalance('1201'); // Accounts Receivable
    const salesBalance = await getAccountBalance('4101'); // Sales Revenue

    // Verify balances increased
    expect(arBalance).toBeGreaterThan(0);
    expect(salesBalance).toBeGreaterThan(0);

    console.log('AR Balance:', formatCurrency(arBalance));
    console.log('Sales Balance:', formatCurrency(salesBalance));

    // Cleanup
    await deleteTestData();
  });

  test('Example: Using test context helper', async ({ page }) => {
    // Use context helper for automatic setup/teardown
    const context = await createTestContext(page, 'ADMIN');

    // Test is ready to run
    await navigateTo(page, URLs.DASHBOARD);
    await verifyUrl(page, URLs.DASHBOARD);

    // Cleanup happens automatically
    await context.cleanup();
  });

  test('Example: Using test with database helper', async ({ page }) => {
    // This helper logs in and seeds test data
    const { page: p, testIds, cleanup } = await createTestWithDb(page, 'ACCOUNTANT');

    // Use test IDs directly
    await navigateTo(p, URLs.INVOICES);
    await clickButton(p, 'สร้างใบกำกับภาษี');

    // Fill form with test data
    await fillField(p, 'ลูกค้า', testIds.customerId);

    // ... continue test

    // Cleanup happens automatically
    await cleanup();
  });

  test('Example: Retry flaky operations', async ({ page }) => {
    await loginAs(page, 'ADMIN');

    // Use retry utility for potentially flaky operations
    const customerCount = await retry(async () => {
      await navigateTo(page, URLs.CUSTOMERS);
      await page.waitForLoadState('networkidle');
      return await getRecordCount('customer');
    }, 3, 1000);

    expect(customerCount).toBeGreaterThan(0);
  });

  test('Example: Working with toasts', async ({ page }) => {
    await loginAs(page, 'ACCOUNTANT');

    // Create something that triggers a toast
    await navigateTo(page, URLs.CUSTOMERS);
    await clickButton(page, 'สร้างลูกค้าใหม่');

    // Fill minimal required fields
    await fillField(page, 'ชื่อลูกค้า', 'Toast Test Customer');
    await submitForm(page);

    // Wait for toast and get message
    await waitForToast(page);
    const message = await getToastMessage(page);
    console.log('Toast message:', message);

    // Wait for toast to disappear
    await waitForToastToDisappear(page);

    // Verify toast is gone
    const toastVisible = await page.locator('[data-sonner-toast]').isVisible().catch(() => false);
    expect(toastVisible).toBe(false);
  });

  test('Example: Table operations', async ({ page }) => {
    // Create test data
    await createTestCustomers(5);

    await loginAs(page, 'ACCOUNTANT');
    await navigateTo(page, URLs.CUSTOMERS);

    // Verify row count
    await verifyTableRowCount(page, 'table', 5);

    // Get data from first row
    const firstRowData = await getTableRowData(page, 0);
    console.log('First row:', firstRowData);

    // Find specific row
    const rowIndex = await findTableRowByText(page, 'Bulk Customer 3');
    expect(rowIndex).toBe(2); // Should be 3rd row (index 2)

    // Get that row's data
    const rowData = await getTableRowData(page, rowIndex);
    expect(rowData['ชื่อลูกค้า']).toContain('Bulk Customer 3');

    // Cleanup
    await deleteTestData();
  });

  test('Example: Working with dates and currency', async ({ page }) => {
    const today = new Date();
    const thaiDate = formatThaiDate(today);
    const amount = 15000.50;
    const formattedCurrency = formatCurrency(amount);

    console.log('Thai date:', thaiDate); // e.g., 13/03/2569
    console.log('Currency:', formattedCurrency); // e.g., ฿15,000.50

    await loginAs(page, 'ACCOUNTANT');
    await navigateTo(page, URLs.INVOICES);
    await clickButton(page, 'สร้างใบกำกับภาษี');

    // Use formatted date in form
    await fillFieldByPlaceholder(page, 'วันที่ออกเอกสาร', thaiDate);

    // Verify currency formatting in UI
    // ... (actual verification here)
  });

  test('Example: Error handling', async ({ page }) => {
    await loginAs(page, 'ACCOUNTANT');

    // Navigate to customers
    await navigateTo(page, URLs.CUSTOMERS);
    await clickButton(page, 'สร้างลูกค้าใหม่');

    // Try to submit form without required fields
    await clickButton(page, 'บันทึก');

    // Wait for error toast
    await waitForToast(page);
    const toastMessage = await getToastMessage(page);

    // Verify error message
    expect(toastMessage).toContain(ERROR_MESSAGES.REQUIRED_FIELD);
  });

  test('Example: Performance timing', async ({ page }) => {
    await loginAs(page, 'ADMIN');

    // Measure navigation time
    const startTime = Date.now();
    await navigateTo(page, URLs.CUSTOMERS);
    const endTime = Date.now();

    const navigationTime = endTime - startTime;
    console.log(`Navigation took ${navigationTime}ms`);

    // Assert navigation is reasonably fast
    expect(navigationTime).toBeLessThan(TIMEOUTS.LONG);
  });

  test('Example: Working with multiple tabs/windows', async ({ page }) => {
    await loginAs(page, 'ADMIN');

    // Open new tab
    const newPage = await page.context().newPage();
    await newPage.goto(URLs.BASE + URLs.CUSTOMERS);

    // Switch back to original page
    await page.bringToFront();

    // Close new tab
    await newPage.close();
  });

  test('Example: Storage and cookies', async ({ page }) => {
    await loginAs(page, 'ADMIN');

    // Get localStorage
    const localStorage = await page.evaluate(() => {
      return JSON.stringify(localStorage);
    });
    console.log('LocalStorage:', localStorage);

    // Get cookies
    const cookies = await page.context().cookies();
    console.log('Cookies:', cookies);

    // Verify session exists
    expect(cookies.some(c => c.name.includes('session'))).toBe(true);
  });

  test('Example: API response testing', async ({ page }) => {
    await loginAs(page, 'ACCOUNTANT');

    // Create customer via UI and capture API response
    await navigateTo(page, URLs.CUSTOMERS);
    await clickButton(page, 'สร้างลูกค้าใหม่');

    const response = await waitForApiResponse(
      page,
      '/api/customers',
      async () => {
        await fillField(page, 'ชื่อลูกค้า', 'API Test Customer');
        await submitForm(page);
      }
    );

    // Verify response structure
    expect(response).toHaveProperty('success');
    expect(response.success).toBe(true);
    expect(response.data).toHaveProperty('id');
    expect(response.data.name).toBe('API Test Customer');
  });
});

/**
 * Tips for writing E2E tests:
 *
 * 1. Always use test helpers for common operations (login, navigation, etc.)
 * 2. Verify both UI and database state
 * 3. Use data factory for creating test data
 * 4. Clean up test data after each test
 * 5. Take screenshots on failures
 * 6. Use wait helpers instead of fixed timeouts
 * 7. Group related tests with test.describe()
 * 8. Use test.beforeEach/test.afterEach for setup/teardown
 * 9. Make tests independent - they should run in any order
 * 10. Use descriptive test names that explain what is being tested
 *
 * Performance tips:
 * - Use waitForApiResponse for network requests
 * - Avoid unnecessary sleep() calls
 * - Reuse test data where possible
 * - Use page.context() for shared state between tabs
 *
 * Debugging tips:
 * - Use pause() to stop execution and inspect state
 * - Use screenshotOnFailure() automatically
 * - Enable DEBUG=true environment variable for verbose logging
 * - Use Playwright Inspector with --debug flag
 */
