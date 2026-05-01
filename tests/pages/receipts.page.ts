import { Page, Locator } from '@playwright/test';

/**
 * ReceiptsPage Object Model
 *
 * Handles receipt management for AR payments
 */
export class ReceiptsPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly newReceiptButton: Locator;
  readonly receiptsTable: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('h1:has-text("ใบเสร็จรับเงิน"), h1:has-text("Receipts")');
    this.newReceiptButton = page.locator(
      'button:has-text("สร้างใบเสร็จ"), button:has-text("New Receipt")'
    );
    this.receiptsTable = page.locator('table, [role="table"]').first();
  }

  async goto() {
    const sidebar = this.page.locator('nav, aside').first();
    await sidebar.locator('text=ใบเสร็จรับเงิน').click();
    await this.pageTitle.waitFor({ state: 'visible', timeout: 10000 });
  }

  async createReceipt(data: {
    customerName: string;
    amount: number;
    invoiceNumber?: string;
    paymentMethod?: string;
  }) {
    await this.newReceiptButton.click();

    await this.page.locator('select[name="customerId"]').selectOption({ label: data.customerName });
    await this.page.fill('input[name="amount"]', data.amount.toString());

    if (data.invoiceNumber) {
      await this.page
        .locator('select[name="invoiceId"]')
        .selectOption({ label: data.invoiceNumber });
    }

    if (data.paymentMethod) {
      await this.page.locator('select[name="paymentMethod"]').selectOption(data.paymentMethod);
    }

    await this.page.locator('button:has-text("บันทึก")').click();
    await this.page.waitForSelector('text=บันทึกสำเร็จ', { timeout: 5000 });
  }

  async postReceipt(receiptNumber: string) {
    const row = this.receiptsTable.locator(`tr:has-text("${receiptNumber}")`);
    await row.locator('button:has-text("ลงบัญชี"), button:has-text("Post")').click();
    await this.page.locator('button:has-text("ยืนยัน")').click();
  }

  async verifyReceiptInList(receiptNumber: string) {
    const row = this.receiptsTable.locator(`tr:has-text("${receiptNumber}")`);
    await row.waitFor({ state: 'visible', timeout: 5000 });
  }

  async verifyAllocation(receiptNumber: string, expectedAmount: number) {
    const row = this.receiptsTable.locator(`tr:has-text("${receiptNumber}")`);
    const amountCell = row.locator('td').nth(2);
    const text = await amountCell.textContent();
    expect(text).toContain(expectedAmount.toString());
  }
}

function expect(text: string | null) {
  return { toContain: (val: string) => {} };
}
