import { Page, Locator } from '@playwright/test';

/**
 * CreditNotesPage Object Model
 *
 * Handles sales credit notes (AR reductions)
 */
export class CreditNotesPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly newCreditNoteButton: Locator;
  readonly creditNotesTable: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('h1:has-text("ใบลดหนี้"), h1:has-text("Credit Notes")');
    this.newCreditNoteButton = page.locator('button:has-text("สร้างใบลดหนี้")');
    this.creditNotesTable = page.locator('table').first();
  }

  async goto() {
    await this.page.goto('/credit-notes');
    await this.pageTitle.waitFor({ state: 'visible', timeout: 10000 });
  }

  async createCreditNote(data: {
    customerName: string;
    invoiceNumber: string;
    amount: number;
    reason: string;
  }) {
    await this.newCreditNoteButton.click();

    await this.page.locator('select[name="customerId"]').selectOption({ label: data.customerName });
    await this.page.locator('select[name="invoiceId"]').selectOption({ label: data.invoiceNumber });
    await this.page.fill('input[name="amount"]', data.amount.toString());
    await this.page.fill('textarea[name="reason"]', data.reason);

    await this.page.locator('button:has-text("บันทึก")').click();
    await this.page.waitForSelector('text=บันทึกสำเร็จ', { timeout: 5000 });
  }

  async postCreditNote(creditNoteNumber: string) {
    const row = this.creditNotesTable.locator(`tr:has-text("${creditNoteNumber}")`);
    await row.locator('button:has-text("ลงบัญชี")').click();
    await this.page.locator('button:has-text("ยืนยัน")').click();
  }

  async verifyCreditNoteInList(creditNoteNumber: string) {
    const row = this.creditNotesTable.locator(`tr:has-text("${creditNoteNumber}")`);
    await row.waitFor({ state: 'visible', timeout: 5000 });
  }
}
