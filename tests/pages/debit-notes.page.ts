import { Page, Locator } from '@playwright/test';

/**
 * DebitNotesPage Object Model
 *
 * Handles purchase debit notes (AP reductions)
 */
export class DebitNotesPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly newDebitNoteButton: Locator;
  readonly debitNotesTable: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('h1:has-text("ใบเพิ่มหนี้"), h1:has-text("Debit Notes")');
    this.newDebitNoteButton = page.locator('button:has-text("สร้างใบเพิ่มหนี้")');
    this.debitNotesTable = page.locator('table').first();
  }

  async goto() {
    await this.page.goto('/debit-notes');
    await this.pageTitle.waitFor({ state: 'visible', timeout: 10000 });
  }

  async createDebitNote(data: {
    vendorName: string;
    purchaseNumber: string;
    amount: number;
    reason: string;
  }) {
    await this.newDebitNoteButton.click();

    await this.page.locator('select[name="vendorId"]').selectOption({ label: data.vendorName });
    await this.page
      .locator('select[name="purchaseId"]')
      .selectOption({ label: data.purchaseNumber });
    await this.page.fill('input[name="amount"]', data.amount.toString());
    await this.page.fill('textarea[name="reason"]', data.reason);

    await this.page.locator('button:has-text("บันทึก")').click();
    await this.page.waitForSelector('text=บันทึกสำเร็จ', { timeout: 5000 });
  }

  async postDebitNote(debitNoteNumber: string) {
    const row = this.debitNotesTable.locator(`tr:has-text("${debitNoteNumber}")`);
    await row.locator('button:has-text("ลงบัญชี")').click();
    await this.page.locator('button:has-text("ยืนยัน")').click();
  }

  async verifyDebitNoteInList(debitNoteNumber: string) {
    const row = this.debitNotesTable.locator(`tr:has-text("${debitNoteNumber}")`);
    await row.waitFor({ state: 'visible', timeout: 5000 });
  }
}
