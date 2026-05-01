import { Page, Locator } from '@playwright/test';

/**
 * BankingPage Object Model
 *
 * Handles bank account and cheque management
 */
export class BankingPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly newBankAccountButton: Locator;
  readonly bankAccountsTab: Locator;
  readonly chequesTab: Locator;
  readonly bankAccountsTable: Locator;
  readonly chequesTable: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('h1:has-text("ธนาคาร"), h1:has-text("Banking")');
    this.newBankAccountButton = page.locator('button:has-text("สร้างบัญชีธนาคาร")');
    this.bankAccountsTab = page.locator(
      'button:has-text("บัญชีธนาคาร"), tab:has-text("Bank Accounts")'
    );
    this.chequesTab = page.locator('button:has-text("เช็ค"), tab:has-text("Cheques")');
    this.bankAccountsTable = page.locator('table').first();
    this.chequesTable = page.locator('table').nth(1);
  }

  async goto() {
    const sidebar = this.page.locator('nav, aside').first();
    await sidebar.locator('text=ธนาคาร').click();
    await this.pageTitle.waitFor({ state: 'visible', timeout: 10000 });
  }

  async createBankAccount(data: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    accountType: string;
  }) {
    await this.newBankAccountButton.click();

    await this.page.fill('input[name="bankName"]', data.bankName);
    await this.page.fill('input[name="accountNumber"]', data.accountNumber);
    await this.page.fill('input[name="accountName"]', data.accountName);
    await this.page.locator('select[name="accountType"]').selectOption(data.accountType);

    await this.page.locator('button:has-text("บันทึก")').click();
    await this.page.waitForSelector('text=บันทึกสำเร็จ', { timeout: 5000 });
  }

  async createCheque(data: {
    bankAccountId: string;
    chequeNumber: string;
    amount: number;
    dueDate: string;
    payeeName: string;
  }) {
    await this.chequesTab.click();
    await this.page.locator('button:has-text("สร้างเช็ค")').click();

    await this.page.locator('select[name="bankAccountId"]').selectOption(data.bankAccountId);
    await this.page.fill('input[name="chequeNumber"]', data.chequeNumber);
    await this.page.fill('input[name="amount"]', data.amount.toString());
    await this.page.fill('input[name="dueDate"]', data.dueDate);
    await this.page.fill('input[name="payeeName"]', data.payeeName);

    await this.page.locator('button:has-text("บันทึก")').click();
  }

  async updateChequeStatus(
    chequeNumber: string,
    newStatus: 'DEPOSITED' | 'CLEARED' | 'BOUNCED' | 'CANCELLED'
  ) {
    await this.chequesTab.click();
    const row = this.chequesTable.locator(`tr:has-text("${chequeNumber}")`);
    await row.locator('button:has-text("อัพเดทสถานะ")').click();
    await this.page.locator('select[name="status"]').selectOption(newStatus);
    await this.page.locator('button:has-text("บันทึก")').click();
  }

  async verifyAccountInList(accountNumber: string) {
    const row = this.bankAccountsTable.locator(`tr:has-text("${accountNumber}")`);
    await row.waitFor({ state: 'visible', timeout: 5000 });
  }
}
