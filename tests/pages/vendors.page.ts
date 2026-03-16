import { Page, Locator } from '@playwright/test';

/**
 * VendorsPage Object Model
 *
 * Handles vendor management including:
 * - Viewing vendor list
 * - Creating new vendors
 * - Editing vendors
 * - Deleting vendors
 * - Viewing vendor details
 */
export class VendorsPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly newVendorButton: Locator;
  readonly vendorsTable: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('h1:has-text("เจ้าหนี้"), h1:has-text("Vendors")');
    this.newVendorButton = page.locator('button:has-text("สร้างเจ้าหนี้"), button:has-text("New Vendor")');
    this.vendorsTable = page.locator('table, [role="table"]').first();
    this.searchInput = page.locator('input[placeholder*="ค้นหา"], input[placeholder*="Search"]').first();
  }

  /**
   * Navigate to vendors page
   */
  async goto() {
    const sidebar = this.page.locator('nav, aside').first();
    await sidebar.locator('text=เจ้าหนี้').click();
    await this.pageTitle.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Create new vendor
   */
  async createVendor(vendorData: {
    code?: string;
    name: string;
    nameEn?: string;
    taxId?: string;
    address?: string;
    province?: string;
    postalCode?: string;
    phone?: string;
    email?: string;
    creditDays?: number;
  }) {
    await this.newVendorButton.click();

    // Wait for form
    await this.page.locator('input[name="name"]').waitFor({ state: 'visible' });

    // Fill required fields
    await this.page.fill('input[name="name"]', vendorData.name);

    if (vendorData.code) {
      await this.page.fill('input[name="code"]', vendorData.code);
    }

    if (vendorData.nameEn) {
      await this.page.fill('input[name="nameEn"]', vendorData.nameEn);
    }

    if (vendorData.taxId) {
      await this.page.fill('input[name="taxId"]', vendorData.taxId);
    }

    if (vendorData.address) {
      await this.page.fill('textarea[name="address"], input[name="address"]', vendorData.address);
    }

    if (vendorData.province) {
      await this.page.locator('select[name="province"]').selectOption(vendorData.province);
    }

    if (vendorData.postalCode) {
      await this.page.fill('input[name="postalCode"]', vendorData.postalCode);
    }

    if (vendorData.phone) {
      await this.page.fill('input[name="phone"]', vendorData.phone);
    }

    if (vendorData.email) {
      await this.page.fill('input[name="email"]', vendorData.email);
    }

    if (vendorData.creditDays) {
      await this.page.fill('input[name="creditDays"]', vendorData.creditDays.toString());
    }

    // Submit
    await this.page.locator('button:has-text("บันทึก"), button:has-text("Save")').click();

    // Wait for success
    await this.page.waitForSelector('text=บันทึกสำเร็จ, text=Saved successfully', { timeout: 5000 });
  }

  /**
   * Edit vendor
   */
  async editVendor(vendorName: string, updates: Partial<{
    name: string;
    phone: string;
    email: string;
  }>) {
    const vendorRow = this.vendorsTable.locator(`tr:has-text("${vendorName}")`);
    await vendorRow.locator('button:has-text("แก้ไข"), button:has-text("Edit")').click();

    // Update fields
    if (updates.name) {
      await this.page.fill('input[name="name"]', updates.name);
    }
    if (updates.phone) {
      await this.page.fill('input[name="phone"]', updates.phone);
    }
    if (updates.email) {
      await this.page.fill('input[name="email"]', updates.email);
    }

    // Submit
    await this.page.locator('button:has-text("บันทึก"), button:has-text("Save")').click();
  }

  /**
   * Delete vendor
   */
  async deleteVendor(vendorName: string) {
    const vendorRow = this.vendorsTable.locator(`tr:has-text("${vendorName}")`);
    await vendorRow.locator('button:has-text("ลบ"), button:has-text("Delete")').click();

    // Confirm deletion
    await this.page.locator('button:has-text("ยืนยัน"), button:has-text("Confirm")').click();
  }

  /**
   * Verify vendor in list
   */
  async verifyVendorInList(vendorName: string) {
    const vendorRow = this.vendorsTable.locator(`tr:has-text("${vendorName}")`);
    await expect(vendorRow).toBeVisible({ timeout: 5000 });
  }

  /**
   * Search vendors
   */
  async searchVendors(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500);
  }

  /**
   * Get vendor count
   */
  async getVendorCount(): Promise<number> {
    const rows = await this.vendorsTable.locator('tbody tr').all();
    return rows.length;
  }
}

/**
 * Helper function
 */
async function expect(locator: Locator) {
  return locator;
}
