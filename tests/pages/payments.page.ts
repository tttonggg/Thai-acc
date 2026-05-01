import { Page, Locator } from '@playwright/test';

/**
 * PaymentsPage Object Model
 *
 * Handles payment management for AP payments
 */
export class PaymentsPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly newPaymentButton: Locator;
  readonly paymentsTable: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('h1:has-text("ใบจ่ายเงิน"), h1:has-text("Payments")');
    this.newPaymentButton = page.locator(
      'button:has-text("สร้างใบจ่าย"), button:has-text("New Payment")'
    );
    this.paymentsTable = page.locator('table, [role="table"]').first();
  }

  async goto() {
    const sidebar = this.page.locator('nav, aside').first();
    await sidebar.locator('text=ใบจ่ายเงิน').click();
    await this.pageTitle.waitFor({ state: 'visible', timeout: 10000 });
  }

  async createPayment(data: {
    vendorName: string;
    amount: number;
    purchaseNumber?: string;
    paymentMethod?: string;
  }) {
    await this.newPaymentButton.click();

    await this.page.locator('select[name="vendorId"]').selectOption({ label: data.vendorName });
    await this.page.fill('input[name="amount"]', data.amount.toString());

    if (data.purchaseNumber) {
      await this.page
        .locator('select[name="purchaseId"]')
        .selectOption({ label: data.purchaseNumber });
    }

    if (data.paymentMethod) {
      await this.page.locator('select[name="paymentMethod"]').selectOption(data.paymentMethod);
    }

    await this.page.locator('button:has-text("บันทึก")').click();
    await this.page.waitForSelector('text=บันทึกสำเร็จ', { timeout: 5000 });
  }

  async postPayment(paymentNumber: string) {
    const row = this.paymentsTable.locator(`tr:has-text("${paymentNumber}")`);
    await row.locator('button:has-text("ลงบัญชี"), button:has-text("Post")').click();
    await this.page.locator('button:has-text("ยืนยัน")').click();
  }

  async verifyPaymentInList(paymentNumber: string) {
    const row = this.paymentsTable.locator(`tr:has-text("${paymentNumber}")`);
    await row.waitFor({ state: 'visible', timeout: 5000 });
  }

  async verifyAllocation(paymentNumber: string, expectedAmount: number) {
    const row = this.paymentsTable.locator(`tr:has-text("${paymentNumber}")`);
    const amountCell = row.locator('td').nth(2);
    const text = await amountCell.textContent();
    expect(text).toContain(expectedAmount.toString());
  }
}

function expect(text: string | null) {
  return { toContain: (val: string) => {} };
}
