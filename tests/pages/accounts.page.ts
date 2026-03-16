import { Page, Locator } from '@playwright/test';

/**
 * AccountsPage Object Model
 *
 * Handles chart of accounts management including:
 * - Viewing accounts list
 * - Creating new accounts
 * - Editing accounts
 * - Deleting accounts
 */
export class AccountsPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly newAccountButton: Locator;
  readonly accountsTable: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('h1:has-text("ผังบัญชี"), h1:has-text("Chart of Accounts")');
    this.newAccountButton = page.locator('button:has-text("สร้างบัญชี"), button:has-text("New Account")');
    this.accountsTable = page.locator('table, [role="table"]').first();
    this.searchInput = page.locator('input[placeholder*="ค้นหา"], input[placeholder*="Search"]').first();
  }

  /**
   * Navigate to accounts page
   */
  async goto() {
    const sidebar = this.page.locator('nav, aside').first();
    await sidebar.locator('text=ผังบัญชี').click();
    await this.pageTitle.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Create new account
   */
  async createAccount(accountData: {
    code: string;
    name: string;
    nameEn?: string;
    type: string;
    parentId?: string;
  }) {
    await this.newAccountButton.click();

    // Wait for form
    await this.page.locator('input[name="code"]').waitFor({ state: 'visible' });

    // Fill form
    await this.page.fill('input[name="code"]', accountData.code);
    await this.page.fill('input[name="name"]', accountData.name);
    if (accountData.nameEn) {
      await this.page.fill('input[name="nameEn"]', accountData.nameEn);
    }

    // Select type
    await this.page.locator(`select[name="type"]`).selectOption(accountData.type);

    // Submit
    await this.page.locator('button:has-text("บันทึก"), button:has-text("Save")').click();

    // Wait for success
    await this.page.waitForSelector('text=บันทึกสำเร็จ, text=Saved successfully', { timeout: 5000 });
  }

  /**
   * Edit account
   */
  async editAccount(accountCode: string, updates: Partial<{
    name: string;
    nameEn: string;
  }>) {
    const accountRow = this.accountsTable.locator(`tr:has-text("${accountCode}")`);
    await accountRow.locator('button:has-text("แก้ไข"), button:has-text("Edit")').click();

    // Update fields
    if (updates.name) {
      await this.page.fill('input[name="name"]', updates.name);
    }
    if (updates.nameEn) {
      await this.page.fill('input[name="nameEn"]', updates.nameEn);
    }

    // Submit
    await this.page.locator('button:has-text("บันทึก"), button:has-text("Save")').click();
  }

  /**
   * Delete account
   */
  async deleteAccount(accountCode: string) {
    const accountRow = this.accountsTable.locator(`tr:has-text("${accountCode}")`);
    await accountRow.locator('button:has-text("ลบ"), button:has-text("Delete")').click();

    // Confirm deletion
    await this.page.locator('button:has-text("ยืนยัน"), button:has-text("Confirm")').click();
  }

  /**
   * Verify account in list
   */
  async verifyAccountInList(accountCode: string) {
    const accountRow = this.accountsTable.locator(`tr:has-text("${accountCode}")`);
    await expect(accountRow).toBeVisible({ timeout: 5000 });
  }

  /**
   * Search accounts
   */
  async searchAccounts(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500); // Wait for debounce
  }

  /**
   * Get account count
   */
  async getAccountCount(): Promise<number> {
    const rows = await this.accountsTable.locator('tbody tr').all();
    return rows.length;
  }
}

/**
 * Helper function
 */
async function expect(locator: Locator) {
  return locator;
}
