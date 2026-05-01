import { Page, Locator } from '@playwright/test';

/**
 * PettyCashPage Object Model
 *
 * Handles petty cash fund and voucher management
 */
export class PettyCashPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly fundsTab: Locator;
  readonly vouchersTab: Locator;
  readonly newFundButton: Locator;
  readonly newVoucherButton: Locator;
  readonly fundsTable: Locator;
  readonly vouchersTable: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('h1:has-text("เงินสดย่อย"), h1:has-text("Petty Cash")');
    this.fundsTab = page.locator('button:has-text("กองทุน"), tab:has-text("Funds")');
    this.vouchersTab = page.locator('button:has-text("ใบสำคัญ"), tab:has-text("Vouchers")');
    this.newFundButton = page.locator('button:has-text("สร้างกองทุน")');
    this.newVoucherButton = page.locator('button:has-text("สร้างใบสำคัญ")');
    this.fundsTable = page.locator('table').first();
    this.vouchersTable = page.locator('table').nth(1);
  }

  async goto() {
    const sidebar = this.page.locator('nav, aside').first();
    await sidebar.locator('text=เงินสดย่อย').click();
    await this.pageTitle.waitFor({ state: 'visible', timeout: 10000 });
  }

  async createFund(data: { name: string; custodian: string; initialAmount: number }) {
    await this.fundsTab.click();
    await this.newFundButton.click();

    await this.page.fill('input[name="name"]', data.name);
    await this.page.fill('input[name="custodian"]', data.custodian);
    await this.page.fill('input[name="initialAmount"]', data.initialAmount.toString());

    await this.page.locator('button:has-text("บันทึก")').click();
    await this.page.waitForSelector('text=บันทึกสำเร็จ', { timeout: 5000 });
  }

  async createVoucher(data: {
    fundId: string;
    amount: number;
    description: string;
    categoryId: string;
  }) {
    await this.vouchersTab.click();
    await this.newVoucherButton.click();

    await this.page.locator('select[name="fundId"]').selectOption(data.fundId);
    await this.page.fill('input[name="amount"]', data.amount.toString());
    await this.page.fill('textarea[name="description"]', data.description);
    await this.page.locator('select[name="categoryId"]').selectOption(data.categoryId);

    await this.page.locator('button:has-text("บันทึก")').click();
  }

  async approveVoucher(voucherNumber: string) {
    await this.vouchersTab.click();
    const row = this.vouchersTable.locator(`tr:has-text("${voucherNumber}")`);
    await row.locator('button:has-text("อนุมัติ")').click();
  }

  async reimburseVoucher(voucherNumber: string, amount: number) {
    await this.vouchersTab.click();
    const row = this.vouchersTable.locator(`tr:has-text("${voucherNumber}")`);
    await row.locator('button:has-text("เติมเงิน")').click();
    await this.page.fill('input[name="amount"]', amount.toString());
    await this.page.locator('button:has-text("บันทึก")').click();
  }

  async verifyFundInList(fundName: string) {
    const row = this.fundsTable.locator(`tr:has-text("${fundName}")`);
    await row.waitFor({ state: 'visible', timeout: 5000 });
  }
}
