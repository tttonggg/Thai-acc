import { Page, Locator } from '@playwright/test';

/**
 * AssetsPage Object Model
 *
 * Handles fixed asset management
 */
export class AssetsPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly newAssetButton: Locator;
  readonly assetsTable: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('h1:has-text("ทรัพย์สินถาวร"), h1:has-text("Fixed Assets")');
    this.newAssetButton = page.locator(
      'button:has-text("สร้างทรัพย์สิน"), button:has-text("New Asset")'
    );
    this.assetsTable = page.locator('table, [role="table"]').first();
  }

  async goto() {
    const sidebar = this.page.locator('nav, aside').first();
    await sidebar.locator('text=ทรัพย์สิน').click();
    await this.pageTitle.waitFor({ state: 'visible', timeout: 10000 });
  }

  async createAsset(data: {
    name: string;
    code?: string;
    acquisitionDate: string;
    cost: number;
    usefulLife: number;
    depreciationMethod: string;
  }) {
    await this.newAssetButton.click();

    await this.page.fill('input[name="name"]', data.name);
    if (data.code) {
      await this.page.fill('input[name="code"]', data.code);
    }
    await this.page.fill('input[name="acquisitionDate"]', data.acquisitionDate);
    await this.page.fill('input[name="cost"]', data.cost.toString());
    await this.page.fill('input[name="usefulLife"]', data.usefulLife.toString());
    await this.page
      .locator('select[name="depreciationMethod"]')
      .selectOption(data.depreciationMethod);

    await this.page.locator('button:has-text("บันทึก")').click();
    await this.page.waitForSelector('text=บันทึกสำเร็จ', { timeout: 5000 });
  }

  async editAsset(assetName: string, updates: Partial<{ name: string; cost: number }>) {
    const row = this.assetsTable.locator(`tr:has-text("${assetName}")`);
    await row.locator('button:has-text("แก้ไข")').click();

    if (updates.name) {
      await this.page.fill('input[name="name"]', updates.name);
    }
    if (updates.cost) {
      await this.page.fill('input[name="cost"]', updates.cost.toString());
    }

    await this.page.locator('button:has-text("บันทึก")').click();
  }

  async deleteAsset(assetName: string) {
    const row = this.assetsTable.locator(`tr:has-text("${assetName}")`);
    await row.locator('button:has-text("ลบ")').click();
    await this.page.locator('button:has-text("ยืนยัน")').click();
  }

  async verifyAssetInList(assetName: string) {
    const row = this.assetsTable.locator(`tr:has-text("${assetName}")`);
    await row.waitFor({ state: 'visible', timeout: 5000 });
  }
}
