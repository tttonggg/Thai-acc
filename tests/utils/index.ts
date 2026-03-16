/**
 * Test Utilities Index
 *
 * Central export point for all E2E test utilities.
 * Import from this file for convenience:
 *
 * ```typescript
 * import { loginAs, verifyRecordCount, createTestCustomer } from '@/tests/utils';
 * ```
 */

// Export constants
export * from './constants';

// Export database verification utilities
export * from './db-verification';

// Export test data factory
export * from './test-data-factory';

// Export test helpers
export * from './test-helpers';

// Re-export commonly used utilities for convenience
export { TEST_USERS, URLs, TIMEOUTS, SELECTORS } from './constants';
export {
  verifyRecordCount,
  verifyRecordExists,
  verifyRecordValues,
  verifyRecordDeleted,
  getRecordCount,
  getAllRecords,
  getRecordById,
  verifyJournalEntry,
  verifyJournalEntryBalances,
  verifyStockMovement,
  getStockBalance,
  clearTestData,
  seedTestData,
  getTestDataIds,
  verifyDocumentStatus,
  getAccountBalance,
  disconnectDatabase
} from './db-verification';

export {
  createTestCustomer,
  createTestVendor,
  createTestProduct,
  createTestWarehouse,
  createTestInvoice,
  createTestReceipt,
  createTestPayment,
  createTestPettyCashFund,
  createTestScenario,
  createTestCustomers,
  createTestProducts,
  deleteTestData
} from './test-data-factory';

export {
  loginAs,
  logout,
  waitForToast,
  getToastMessage,
  waitForToastToDisappear,
  clickButton,
  clickButtonContaining,
  fillField,
  fillFieldByPlaceholder,
  selectOption,
  selectOptionByPlaceholder,
  verifyTableRowCount,
  getTableRowData,
  findTableRowByText,
  waitForNavigation,
  navigateTo,
  clickSidebarNavItem,
  screenshotOnFailure,
  fillForm,
  submitForm,
  cancelForm,
  openDialog,
  closeDialog,
  verifyVisible,
  verifyHidden,
  getText,
  verifyText,
  verifyContainsText,
  waitForEnabled,
  waitForLoading,
  getCurrentUrl,
  verifyUrl,
  waitForApiResponse,
  retry,
  pause,
  bypassRateLimiting,
  setupTest
} from './test-helpers';

/**
 * Utility to create a test context
 * Combines common setup tasks
 */
export async function createTestContext(page: any, role: string = 'ADMIN') {
  const { setupTest, loginAs, logout } = await import('./test-helpers');
  const { deleteTestData } = await import('./test-data-factory');

  await setupTest(page);
  await loginAs(page, role);

  return {
    page,
    cleanup: async () => {
      await logout(page);
      await deleteTestData();
    }
  };
}

/**
 * Utility to create a test with database verification
 */
export async function createTestWithDb(page: any, role: string = 'ADMIN') {
  const { setupTest, loginAs, logout } = await import('./test-helpers');
  const { seedTestData, getTestDataIds } = await import('./db-verification');
  const { clearTestData, disconnectDatabase } = await import('./db-verification');

  await setupTest(page);
  await loginAs(page, role);

  // Seed test data
  await seedTestData();

  return {
    page,
    testIds: await getTestDataIds(),
    cleanup: async () => {
      await logout(page);
      await clearTestData();
      await disconnectDatabase();
    }
  };
}

/**
 * Sleep utility for waiting
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Format date for Thai locale
 */
export function formatThaiDate(date: Date): string {
  return date.toLocaleDateString('th-TH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Format currency for Thai locale
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB'
  }).format(amount);
}

/**
 * Generate random test email
 */
export function generateTestEmail(prefix: string = 'test'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}-${timestamp}-${random}@example.com`;
}

/**
 * Generate random test phone number
 */
export function generateTestPhone(): string {
  const prefix = '08';
  const middle = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  return prefix + middle;
}

/**
 * Generate random test tax ID (13 digits)
 */
export function generateTestTaxId(): string {
  return Math.floor(Math.random() * 10000000000000).toString().padStart(13, '0');
}
