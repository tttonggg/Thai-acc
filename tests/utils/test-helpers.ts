/**
 * Test Helpers for E2E Testing
 *
 * Provides utility functions to interact with the UI during E2E tests.
 * Includes functions for navigation, form interactions, and assertions.
 */

import { Page, Locator } from '@playwright/test';
import { TIMEOUTS, TEST_USERS, URLs, SELECTORS } from './constants';

/**
 * Login as a test user
 *
 * @param page - Playwright Page object
 * @param role - User role (ADMIN, ACCOUNTANT, USER, VIEWER)
 */
export async function loginAs(page: Page, role: keyof typeof TEST_USERS): Promise<void> {
  const user = TEST_USERS[role];

  await page.goto(URLs.BASE + URLs.LOGIN);

  // Wait for login form to load
  await page.waitForSelector('input[type="email"]', { timeout: TIMEOUTS.MEDIUM });

  // Fill login form
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for navigation to dashboard
  await page.waitForURL(URLs.BASE + '/', { timeout: TIMEOUTS.NAVIGATION });

  // Verify login success by checking for sidebar
  await page.waitForSelector(SELECTORS.SIDEBAR, { timeout: TIMEOUTS.MEDIUM });
}

/**
 * Logout from current session
 *
 * @param page - Playwright Page object
 */
export async function logout(page: Page): Promise<void> {
  // Click user menu/avatar
  const userMenuButton = page.locator('[data-user-menu]').first();
  await userMenuButton.click();

  // Wait for dropdown to appear
  await page.waitForTimeout(TIMEOUTS.SHORT);

  // Click logout button
  const logoutButton = page.locator('button:has-text("ออกจากระบบ"), button:has-text("Logout")');
  await logoutButton.click();

  // Wait for navigation to login page
  await page.waitForURL(URLs.BASE + URLs.LOGIN, { timeout: TIMEOUTS.NAVIGATION });
}

/**
 * Wait for toast notification to appear
 *
 * @param page - Playwright Page object
 * @param timeout - Optional timeout in milliseconds
 */
export async function waitForToast(page: Page, timeout: number = TIMEOUTS.TOAST): Promise<void> {
  await page.waitForSelector(SELECTORS.TOAST, { timeout });
}

/**
 * Get toast notification message
 *
 * @param page - Playwright Page object
 * @returns Toast message text
 */
export async function getToastMessage(page: Page): Promise<string> {
  await waitForToast(page);

  const titleElement = page.locator(SELECTORS.TOAST_TITLE).first();
  const messageElement = page.locator(SELECTORS.TOAST_MESSAGE).first();

  const title = await titleElement.textContent().catch(() => '');
  const message = await messageElement.textContent().catch(() => '');

  return `${title || ''} ${message || ''}`.trim();
}

/**
 * Wait for toast notification to disappear
 *
 * @param page - Playwright Page object
 */
export async function waitForToastToDisappear(page: Page): Promise<void> {
  await page.waitForSelector(SELECTORS.TOAST, { state: 'hidden', timeout: TIMEOUTS.TOAST });
}

/**
 * Click button with specific text
 *
 * @param page - Playwright Page object
 * @param text - Button text
 * @param exact - Whether to match exact text (default: false)
 */
export async function clickButton(page: Page, text: string, exact: boolean = false): Promise<void> {
  const selector = exact
    ? `${SELECTORS.BUTTON}:has-text("${text}")`
    : `${SELECTORS.BUTTON}:text-is("${text}")`;

  await page.click(selector);
}

/**
 * Click button containing specific text (more flexible)
 *
 * @param page - Playwright Page object
 * @param text - Button text or substring
 */
export async function clickButtonContaining(page: Page, text: string): Promise<void> {
  const selector = `${SELECTORS.BUTTON}:has-text("${text}")`;
  await page.click(selector);
}

/**
 * Fill form field by label
 *
 * @param page - Playwright Page object
 * @param label - Field label text
 * @param value - Value to enter
 */
export async function fillField(page: Page, label: string, value: string): Promise<void> {
  // Find input by associated label
  const input = page.locator(`${SELECTORS.LABEL}:text-is("${label}")`).locator('..').locator('input');
  await input.fill(value);
}

/**
 * Fill form field by placeholder
 *
 * @param page - Playwright Page object
 * @param placeholder - Input placeholder text
 * @param value - Value to enter
 */
export async function fillFieldByPlaceholder(page: Page, placeholder: string, value: string): Promise<void> {
  const input = page.locator(`${SELECTORS.INPUT}[placeholder="${placeholder}"]`);
  await input.fill(value);
}

/**
 * Select dropdown option by label
 *
 * @param page - Playwright Page object
 * @param label - Field label text
 * @param value - Option value to select
 */
export async function selectOption(page: Page, label: string, value: string): Promise<void> {
  // Find select by associated label
  const select = page.locator(`${SELECTORS.LABEL}:text-is("${label}")`).locator('..').locator('select');
  await select.selectOption(value);
}

/**
 * Select dropdown option by placeholder
 *
 * @param page - Playwright Page object
 * @param placeholder - Input placeholder text
 * @param value - Option value to select
 */
export async function selectOptionByPlaceholder(page: Page, placeholder: string, value: string): Promise<void> {
  const select = page.locator(`${SELECTORS.SELECT}[placeholder="${placeholder}"]`);
  await select.selectOption(value);
}

/**
 * Verify table row count
 *
 * @param page - Playwright Page object
 * @param selector - Table selector (default: SELECTORS.TABLE)
 * @param expected - Expected row count
 */
export async function verifyTableRowCount(
  page: Page,
  selector: string = SELECTORS.TABLE,
  expected: number
): Promise<void> {
  const table = page.locator(selector);
  const rows = table.locator(`${SELECTORS.TABLE_BODY} ${SELECTORS.TABLE_ROW}`);

  const count = await rows.count();
  if (count !== expected) {
    throw new Error(`Expected ${expected} table rows, but found ${count}`);
  }
}

/**
 * Get table row data as object
 *
 * @param page - Playwright Page object
 * @param rowIndex - Row index (0-based)
 * @param selector - Table selector (default: SELECTORS.TABLE)
 * @returns Object mapping column headers to cell values
 */
export async function getTableRowData(
  page: Page,
  rowIndex: number,
  selector: string = SELECTORS.TABLE
): Promise<Record<string, string>> {
  const table = page.locator(selector);

  // Get headers
  const headers = await table.locator('thead th').allTextContents();

  // Get row cells
  const row = table.locator(`${SELECTORS.TABLE_BODY} ${SELECTORS.TABLE_ROW}`).nth(rowIndex);
  const cells = await row.locator(SELECTORS.TABLE_CELL).allTextContents();

  // Map headers to cell values
  const rowData: Record<string, string> = {};
  headers.forEach((header, index) => {
    rowData[header.trim()] = cells[index]?.trim() || '';
  });

  return rowData;
}

/**
 * Find table row by cell text
 *
 * @param page - Playwright Page object
 * @param searchText - Text to search for in any cell
 * @param selector - Table selector (default: SELECTORS.TABLE)
 * @returns Row index or -1 if not found
 */
export async function findTableRowByText(
  page: Page,
  searchText: string,
  selector: string = SELECTORS.TABLE
): Promise<number> {
  const table = page.locator(selector);
  const rows = table.locator(`${SELECTORS.TABLE_BODY} ${SELECTORS.TABLE_ROW}`);

  const count = await rows.count();
  for (let i = 0; i < count; i++) {
    const row = rows.nth(i);
    const text = await row.textContent();
    if (text?.includes(searchText)) {
      return i;
    }
  }

  return -1;
}

/**
 * Wait for page navigation
 *
 * @param page - Playwright Page object
 * @param url - Optional expected URL
 */
export async function waitForNavigation(page: Page, url?: string): Promise<void> {
  if (url) {
    await page.waitForURL(url, { timeout: TIMEOUTS.NAVIGATION });
  } else {
    await page.waitForLoadState('networkidle', { timeout: TIMEOUTS.NAVIGATION });
  }
}

/**
 * Navigate to a specific page
 *
 * @param page - Playwright Page object
 * @param path - URL path (e.g., '/customers')
 */
export async function navigateTo(page: Page, path: string): Promise<void> {
  await page.goto(URLs.BASE + path);
  await page.waitForLoadState('networkidle', { timeout: TIMEOUTS.NAVIGATION });
}

/**
 * Click sidebar navigation item
 *
 * @param page - Playwright Page object
 * @param text - Navigation item text
 */
export async function clickSidebarNavItem(page: Page, text: string): Promise<void> {
  const navItem = page.locator(`${SELECTORS.SIDEBAR_ITEM}:has-text("${text}")`);
  await navItem.click();
  await page.waitForLoadState('networkidle', { timeout: TIMEOUTS.NAVIGATION });
}

/**
 * Take screenshot on failure
 *
 * @param page - Playwright Page object
 * @param testName - Test name for filename
 * @param fullPage - Whether to capture full page (default: false)
 */
export async function screenshotOnFailure(
  page: Page,
  testName: string,
  fullPage: boolean = false
): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `screenshots/${testName}-${timestamp}.png`;

  await page.screenshot({
    path: filename,
    fullPage
  });

  console.log(`Screenshot saved: ${filename}`);
}

/**
 * Fill form with data object
 *
 * @param page - Playwright Page object
 * @param formData - Object mapping field labels to values
 */
export async function fillForm(page: Page, formData: Record<string, string>): Promise<void> {
  for (const [label, value] of Object.entries(formData)) {
    await fillField(page, label, value);
  }
}

/**
 * Submit form
 *
 * @param page - Playwright Page object
 */
export async function submitForm(page: Page): Promise<void> {
  await page.click(SELECTORS.SUBMIT_BUTTON);
  await page.waitForLoadState('networkidle', { timeout: TIMEOUTS.MEDIUM });
}

/**
 * Cancel form
 *
 * @param page - Playwright Page object
 */
export async function cancelForm(page: Page): Promise<void> {
  await page.click(SELECTORS.CANCEL_BUTTON);
}

/**
 * Open dialog by clicking trigger button
 *
 * @param page - Playwright Page object
 * @param triggerText - Button text that opens dialog
 */
export async function openDialog(page: Page, triggerText: string): Promise<void> {
  await clickButton(page, triggerText);
  await page.waitForSelector(SELECTORS.DIALOG, { timeout: TIMEOUTS.MEDIUM });
}

/**
 * Close dialog
 *
 * @param page - Playwright Page object
 */
export async function closeDialog(page: Page): Promise<void> {
  const closeButton = page.locator(`${SELECTORS.DIALOG} button[aria-label="Close"]`);
  await closeButton.click();
  await page.waitForSelector(SELECTORS.DIALOG, { state: 'hidden', timeout: TIMEOUTS.MEDIUM });
}

/**
 * Verify element is visible
 *
 * @param page - Playwright Page object
 * @param selector - Element selector
 * @param timeout - Optional timeout
 */
export async function verifyVisible(
  page: Page,
  selector: string,
  timeout: number = TIMEOUTS.SHORT
): Promise<void> {
  await page.waitForSelector(selector, { state: 'visible', timeout });
}

/**
 * Verify element is hidden
 *
 * @param page - Playwright Page object
 * @param selector - Element selector
 * @param timeout - Optional timeout
 */
export async function verifyHidden(
  page: Page,
  selector: string,
  timeout: number = TIMEOUTS.SHORT
): Promise<void> {
  await page.waitForSelector(selector, { state: 'hidden', timeout });
}

/**
 * Get element text content
 *
 * @param page - Playwright Page object
 * @param selector - Element selector
 * @returns Text content
 */
export async function getText(page: Page, selector: string): Promise<string> {
  const element = page.locator(selector).first();
  return (await element.textContent())?.trim() || '';
}

/**
 * Verify element text content
 *
 * @param page - Playwright Page object
 * @param selector - Element selector
 * @param expectedText - Expected text
 */
export async function verifyText(
  page: Page,
  selector: string,
  expectedText: string
): Promise<void> {
  const actualText = await getText(page, selector);
  if (actualText !== expectedText) {
    throw new Error(`Expected text "${expectedText}", but got "${actualText}"`);
  }
}

/**
 * Verify element contains text
 *
 * @param page - Playwright Page object
 * @param selector - Element selector
 * @param searchText - Text to search for
 */
export async function verifyContainsText(
  page: Page,
  selector: string,
  searchText: string
): Promise<void> {
  const actualText = await getText(page, selector);
  if (!actualText.includes(searchText)) {
    throw new Error(`Expected text to contain "${searchText}", but got "${actualText}"`);
  }
}

/**
 * Wait for element to be enabled
 *
 * @param page - Playwright Page object
 * @param selector - Element selector
 * @param timeout - Optional timeout
 */
export async function waitForEnabled(
  page: Page,
  selector: string,
  timeout: number = TIMEOUTS.MEDIUM
): Promise<void> {
  await page.waitForSelector(selector, { state: 'attached', timeout });

  const element = page.locator(selector).first();
  await element.waitFor({ state: 'visible' });

  // Check if enabled
  const isEnabled = await element.isEnabled();
  if (!isEnabled) {
    throw new Error(`Element ${selector} is disabled`);
  }
}

/**
 * Wait for loading to complete
 *
 * @param page - Playwright Page object
 */
export async function waitForLoading(page: Page): Promise<void> {
  // Wait for loading spinner to disappear
  const loadingSpinner = page.locator(SELECTORS.LOADING);
  const isVisible = await loadingSpinner.isVisible().catch(() => false);

  if (isVisible) {
    await loadingSpinner.waitFor({ state: 'hidden', timeout: TIMEOUTS.LONG });
  }
}

/**
 * Get current URL
 *
 * @param page - Playwright Page object
 * @returns Current URL
 */
export function getCurrentUrl(page: Page): string {
  return page.url();
}

/**
 * Verify current URL
 *
 * @param page - Playwright Page object
 * @param expectedPath - Expected URL path
 */
export async function verifyUrl(page: Page, expectedPath: string): Promise<void> {
  const currentUrl = getCurrentUrl(page);
  const expectedUrl = URLs.BASE + expectedPath;

  if (currentUrl !== expectedUrl) {
    throw new Error(`Expected URL "${expectedUrl}", but got "${currentUrl}"`);
  }
}

/**
 * Wait for API response
 *
 * @param page - Playwright Page object
 * @param urlPattern - URL pattern to match
 * @param callback - Function to execute that triggers the API call
 * @returns Response object
 */
export async function waitForApiResponse(
  page: Page,
  urlPattern: string,
  callback: () => Promise<void>
): Promise<any> {
  const [response] = await Promise.all([
    page.waitForResponse(resp => resp.url().includes(urlPattern)),
    callback()
  ]);

  return response.json();
}

/**
 * Retry function with exponential backoff
 *
 * @param fn - Function to retry
 * @param maxRetries - Maximum number of retries
 * @param delay - Initial delay in milliseconds
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = TIMEOUTS.SHORT
): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }

  throw lastError;
}

/**
 * Pause test execution (useful for debugging)
 *
 * @param page - Playwright Page object
 * @param message - Optional message to display
 */
export async function pause(page: Page, message?: string): Promise<void> {
  console.log(`PAUSED: ${message || 'Test paused'}`);
  await page.pause();
}

/**
 * Add headers to bypass rate limiting for tests
 *
 * @param page - Playwright Page object
 */
export function bypassRateLimiting(page: Page): void {
  page.setExtraHTTPHeaders({
    'x-playwright-test': 'true'
  });
}

/**
 * Setup test environment
 * Call this at the beginning of each test
 *
 * @param page - Playwright Page object
 * @param options - Setup options
 */
export async function setupTest(
  page: Page,
  options: {
    bypassRateLimit?: boolean;
    viewport?: { width: number; height: number };
  } = {}
): Promise<void> {
  // Set viewport
  if (options.viewport) {
    await page.setViewportSize(options.viewport);
  }

  // Bypass rate limiting
  if (options.bypassRateLimit !== false) {
    bypassRateLimiting(page);
  }

  // Clear cookies and storage
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}
