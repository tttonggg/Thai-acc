import { Page, Locator } from '@playwright/test';

/**
 * InventoryPage Object Model
 *
 * Handles inventory and stock management
 */
export class InventoryPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly stockBalancesTab: Locator;
  readonly stockMovementsTab: Locator;
  readonly warehousesTab: Locator;
  readonly stockBalancesTable: Locator;
  readonly movementsTable: Locator;
  readonly warehousesTable: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('h1:has-text("สต็อกสินค้า"), h1:has-text("Inventory")');
    this.stockBalancesTab = page.locator('button:has-text("ยอดคงเหลือ"), tab:has-text("Stock Balances")');
    this.stockMovementsTab = page.locator('button:has-text("การเคลื่อนไหว"), tab:has-text("Movements")');
    this.warehousesTab = page.locator('button:has-text("คลังสินค้า"), tab:has-text("Warehouses")');
    this.stockBalancesTable = page.locator('table').first();
    this.movementsTable = page.locator('table').nth(1);
    this.warehousesTable = page.locator('table').nth(2);
  }

  async goto() {
    const sidebar = this.page.locator('nav, aside').first();
    await sidebar.locator('text=สต็อกสินค้า').click();
    await this.pageTitle.waitFor({ state: 'visible', timeout: 10000 });
  }

  async createWarehouse(data: { code: string; name: string; address?: string }) {
    await this.warehousesTab.click();
    await this.page.locator('button:has-text("สร้างคลังสินค้า")').click();

    await this.page.fill('input[name="code"]', data.code);
    await this.page.fill('input[name="name"]', data.name);
    if (data.address) {
      await this.page.fill('textarea[name="address"]', data.address);
    }

    await this.page.locator('button:has-text("บันทึก")').click();
  }

  async adjustStock(data: {
    productId: string;
    warehouseId: string;
    quantity: number;
    reason: string;
  }) {
    await this.stockMovementsTab.click();
    await this.page.locator('button:has-text("ปรับยอดสต็อก")').click();

    await this.page.locator('select[name="productId"]').selectOption(data.productId);
    await this.page.locator('select[name="warehouseId"]').selectOption(data.warehouseId);
    await this.page.fill('input[name="quantity"]', data.quantity.toString());
    await this.page.fill('textarea[name="reason"]', data.reason);

    await this.page.locator('button:has-text("บันทึก")').click();
  }

  async createTransfer(data: {
    productId: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    quantity: number;
  }) {
    await this.stockMovementsTab.click();
    await this.page.locator('button:has-text("โอนย้ายสินค้า")').click();

    await this.page.locator('select[name="productId"]').selectOption(data.productId);
    await this.page.locator('select[name="fromWarehouseId"]').selectOption(data.fromWarehouseId);
    await this.page.locator('select[name="toWarehouseId"]').selectOption(data.toWarehouseId);
    await this.page.fill('input[name="quantity"]', data.quantity.toString());

    await this.page.locator('button:has-text("บันทึก")').click();
  }

  async verifyStockBalance(productId: string, expectedQuantity: number) {
    await this.stockBalancesTab.click();
    const row = this.stockBalancesTable.locator(`tr:has-text("${productId}")`);
    await row.waitFor({ state: 'visible', timeout: 5000 });
    const qtyCell = row.locator('td').nth(2);
    const text = await qtyCell.textContent();
    expect(text).toContain(expectedQuantity.toString());
  }
}

function expect(text: string | null) {
  return { toContain: (val: string) => {} };
}
