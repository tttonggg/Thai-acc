import { Page, Locator } from '@playwright/test';

/**
 * PurchasesPage Object Model
 *
 * Handles purchase invoice management
 */
export class PurchasesPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly newPurchaseButton: Locator;
  readonly purchasesTable: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('h1:has-text("ใบซื้อ"), h1:has-text("Purchases")');
    this.newPurchaseButton = page.locator('button:has-text("สร้างใบซื้อ"), button:has-text("New Purchase")');
    this.purchasesTable = page.locator('table, [role="table"]').first();
  }

  async goto() {
    await this.page.goto('/purchases');
    await this.pageTitle.waitFor({ state: 'visible', timeout: 10000 });
  }

  async createPurchase(data: { vendorName: string; items: Array<{ productName: string; quantity: number; price: number }> }) {
    await this.newPurchaseButton.click();
    await this.page.locator('select[name="vendorId"]').selectOption({ label: data.vendorName });

    for (const item of data.items) {
      await this.page.locator('button:has-text("เพิ่มรายการ")').click();
      await this.page.locator('select[name="productId"]').last().selectOption({ label: item.productName });
      await this.page.locator('input[name="quantity"]').last().fill(item.quantity.toString());
      await this.page.locator('input[name="price"]').last().fill(item.price.toString());
    }

    await this.page.locator('button:has-text("บันทึก")').click();
    await this.page.waitForSelector('text=บันทึกสำเร็จ', { timeout: 5000 });
  }

  async issuePurchase(purchaseNumber: string) {
    const row = this.purchasesTable.locator(`tr:has-text("${purchaseNumber}")`);
    await row.locator('button:has-text("รับใบกำกับภาษี")').click();
    await this.page.locator('button:has-text("ยืนยัน")').click();
  }

  async verifyPurchaseInList(purchaseNumber: string) {
    const row = this.purchasesTable.locator(`tr:has-text("${purchaseNumber}")`);
    await row.waitFor({ state: 'visible', timeout: 5000 });
  }
}
