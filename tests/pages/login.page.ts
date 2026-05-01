import { Page, Locator } from '@playwright/test';

/**
 * LoginPage Object Model
 *
 * Handles all interactions with the login page including:
 * - User authentication
 * - Form validation
 * - Error handling
 * - Session management
 */
export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly pageTitle: Locator;
  readonly subtitleText: Locator;

  constructor(page: Page) {
    this.page = page;

    // Define locators
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('[role="alert"], .alert, [data-testid="error"]');
    this.pageTitle = page.locator('h1:has-text("Thai Accounting ERP")');
    this.subtitleText = page.locator('text=โปรแกรมบัญชีมาตรฐานไทย');
  }

  /**
   * Navigate to login page
   */
  async goto() {
    await this.page.goto('/');
    await this.waitForLoad();
  }

  /**
   * Wait for page to load
   */
  async waitForLoad() {
    await this.emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.passwordInput.waitFor({ state: 'visible' });
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  /**
   * Login as specific user role
   */
  async loginAs(role: 'ADMIN' | 'ACCOUNTANT' | 'USER' | 'VIEWER') {
    const credentials = {
      ADMIN: { email: 'admin@thaiaccounting.com', password: 'admin123' },
      ACCOUNTANT: { email: 'accountant@thaiaccounting.com', password: 'acc123' },
      USER: { email: 'user@thaiaccounting.com', password: 'user123' },
      VIEWER: { email: 'viewer@thaiaccounting.com', password: 'viewer123' },
    };

    const user = credentials[role];
    await this.login(user.email, user.password);
  }

  /**
   * Verify login was successful
   */
  async verifyLoginSuccess() {
    // Check for dashboard or sidebar
    const dashboard = this.page.locator('h1:has-text("ภาพรวมธุรกิจ")');
    const sidebar = this.page.locator('nav, aside').first();

    await Promise.race([
      dashboard.waitFor({ state: 'visible', timeout: 10000 }),
      sidebar.waitFor({ state: 'visible', timeout: 10000 }),
    ]);
  }

  /**
   * Verify error message is displayed
   */
  async verifyErrorMessage(message: string) {
    await expect(this.errorMessage).toContainText(message, { timeout: 5000 });
  }

  /**
   * Get current error message text
   */
  async getErrorMessage(): Promise<string> {
    return (await this.errorMessage.textContent()) || '';
  }

  /**
   * Verify login page is displayed
   */
  async verifyIsDisplayed() {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.subtitleText).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  /**
   * Take screenshot
   */
  async screenshot(path: string) {
    await this.page.screenshot({ path, fullPage: true });
  }
}

/**
 * Helper function for inline import
 */
async function expect(locator: Locator) {
  // Simple wrapper - Playwright's expect is global
  return locator;
}
