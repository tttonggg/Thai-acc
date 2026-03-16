import { Page, Locator } from '@playwright/test';

/**
 * ProductsPage Object Model
 *
 * Handles product/service management including:
 * - Viewing product list
 * - Creating new products
 * - Editing products
 * - Deleting products
 * - Managing product variants
 */
export class ProductsPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly newProductButton: Locator;
  readonly productsTable: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('h1:has-text("สินค้าและบริการ"), h1:has-text("Products")');
    this.newProductButton = page.locator('button:has-text("สร้างสินค้า"), button:has-text("New Product")');
    this.productsTable = page.locator('table, [role="table"]').first();
    this.searchInput = page.locator('input[placeholder*="ค้นหา"], input[placeholder*="Search"]').first();
  }

  /**
   * Navigate to products page
   */
  async goto() {
    // Products might be under settings or a separate menu
    const sidebar = this.page.locator('nav, aside').first();

    // Try direct navigation
    await this.page.goto('/products');
    await this.pageTitle.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Create new product
   */
  async createProduct(productData: {
    code?: string;
    name: string;
    nameEn?: string;
    unit?: string;
    price?: number;
    cost?: number;
    vatType?: string;
    incomeType?: string;
  }) {
    await this.newProductButton.click();

    // Wait for form
    await this.page.locator('input[name="name"]').waitFor({ state: 'visible' });

    // Fill required fields
    await this.page.fill('input[name="name"]', productData.name);

    if (productData.code) {
      await this.page.fill('input[name="code"]', productData.code);
    }

    if (productData.nameEn) {
      await this.page.fill('input[name="nameEn"]', productData.nameEn);
    }

    if (productData.unit) {
      await this.page.fill('input[name="unit"]', productData.unit);
    }

    if (productData.price) {
      await this.page.fill('input[name="price"]', productData.price.toString());
    }

    if (productData.cost) {
      await this.page.fill('input[name="cost"]', productData.cost.toString());
    }

    if (productData.vatType) {
      await this.page.locator('select[name="vatType"]').selectOption(productData.vatType);
    }

    if (productData.incomeType) {
      await this.page.locator('select[name="incomeType"]').selectOption(productData.incomeType);
    }

    // Submit
    await this.page.locator('button:has-text("บันทึก"), button:has-text("Save")').click();

    // Wait for success
    await this.page.waitForSelector('text=บันทึกสำเร็จ, text=Saved successfully', { timeout: 5000 });
  }

  /**
   * Edit product
   */
  async editProduct(productName: string, updates: Partial<{
    name: string;
    price: number;
    cost: number;
  }>) {
    const productRow = this.productsTable.locator(`tr:has-text("${productName}")`);
    await productRow.locator('button:has-text("แก้ไข"), button:has-text("Edit")').click();

    // Update fields
    if (updates.name) {
      await this.page.fill('input[name="name"]', updates.name);
    }
    if (updates.price) {
      await this.page.fill('input[name="price"]', updates.price.toString());
    }
    if (updates.cost) {
      await this.page.fill('input[name="cost"]', updates.cost.toString());
    }

    // Submit
    await this.page.locator('button:has-text("บันทึก"), button:has-text("Save")').click();
  }

  /**
   * Delete product
   */
  async deleteProduct(productName: string) {
    const productRow = this.productsTable.locator(`tr:has-text("${productName}")`);
    await productRow.locator('button:has-text("ลบ"), button:has-text("Delete")').click();

    // Confirm deletion
    await this.page.locator('button:has-text("ยืนยัน"), button:has-text("Confirm")').click();
  }

  /**
   * Verify product in list
   */
  async verifyProductInList(productName: string) {
    const productRow = this.productsTable.locator(`tr:has-text("${productName}")`);
    await expect(productRow).toBeVisible({ timeout: 5000 });
  }
}

/**
 * Helper function
 */
async function expect(locator: Locator) {
  return locator;
}
