import { Page, Locator } from '@playwright/test';

/**
 * CustomersPage Object Model
 *
 * Handles customer management including:
 * - Viewing customer list
 * - Creating new customers
 * - Editing customers
 * - Deleting customers
 * - Viewing customer details
 */
export class CustomersPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly newCustomerButton: Locator;
  readonly customersTable: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('h1:has-text("ลูกหนี้"), h1:has-text("Customers")');
    this.newCustomerButton = page.locator(
      'button:has-text("สร้างลูกค้า"), button:has-text("New Customer")'
    );
    this.customersTable = page.locator('table, [role="table"]').first();
    this.searchInput = page
      .locator('input[placeholder*="ค้นหา"], input[placeholder*="Search"]')
      .first();
  }

  /**
   * Navigate to customers page
   */
  async goto() {
    const sidebar = this.page.locator('nav, aside').first();
    await sidebar.locator('text=ลูกหนี้').click();
    await this.pageTitle.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Create new customer
   */
  async createCustomer(customerData: {
    code?: string;
    name: string;
    nameEn?: string;
    taxId?: string;
    address?: string;
    province?: string;
    postalCode?: string;
    phone?: string;
    email?: string;
    creditLimit?: number;
    creditDays?: number;
  }) {
    await this.newCustomerButton.click();

    // Wait for form
    await this.page.locator('input[name="name"]').waitFor({ state: 'visible' });

    // Fill required fields
    await this.page.fill('input[name="name"]', customerData.name);

    if (customerData.code) {
      await this.page.fill('input[name="code"]', customerData.code);
    }

    if (customerData.nameEn) {
      await this.page.fill('input[name="nameEn"]', customerData.nameEn);
    }

    if (customerData.taxId) {
      await this.page.fill('input[name="taxId"]', customerData.taxId);
    }

    if (customerData.address) {
      await this.page.fill('textarea[name="address"], input[name="address"]', customerData.address);
    }

    if (customerData.province) {
      await this.page.locator('select[name="province"]').selectOption(customerData.province);
    }

    if (customerData.postalCode) {
      await this.page.fill('input[name="postalCode"]', customerData.postalCode);
    }

    if (customerData.phone) {
      await this.page.fill('input[name="phone"]', customerData.phone);
    }

    if (customerData.email) {
      await this.page.fill('input[name="email"]', customerData.email);
    }

    if (customerData.creditLimit) {
      await this.page.fill('input[name="creditLimit"]', customerData.creditLimit.toString());
    }

    if (customerData.creditDays) {
      await this.page.fill('input[name="creditDays"]', customerData.creditDays.toString());
    }

    // Submit
    await this.page.locator('button:has-text("บันทึก"), button:has-text("Save")').click();

    // Wait for success
    await this.page.waitForSelector('text=บันทึกสำเร็จ, text=Saved successfully', {
      timeout: 5000,
    });
  }

  /**
   * Edit customer
   */
  async editCustomer(
    customerName: string,
    updates: Partial<{
      name: string;
      phone: string;
      email: string;
    }>
  ) {
    const customerRow = this.customersTable.locator(`tr:has-text("${customerName}")`);
    await customerRow.locator('button:has-text("แก้ไข"), button:has-text("Edit")').click();

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
   * Delete customer
   */
  async deleteCustomer(customerName: string) {
    const customerRow = this.customersTable.locator(`tr:has-text("${customerName}")`);
    await customerRow.locator('button:has-text("ลบ"), button:has-text("Delete")').click();

    // Confirm deletion
    await this.page.locator('button:has-text("ยืนยัน"), button:has-text("Confirm")').click();
  }

  /**
   * Verify customer in list
   */
  async verifyCustomerInList(customerName: string) {
    const customerRow = this.customersTable.locator(`tr:has-text("${customerName}")`);
    await expect(customerRow).toBeVisible({ timeout: 5000 });
  }

  /**
   * Search customers
   */
  async searchCustomers(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500);
  }

  /**
   * Get customer count
   */
  async getCustomerCount(): Promise<number> {
    const rows = await this.customersTable.locator('tbody tr').all();
    return rows.length;
  }

  /**
   * View customer details
   */
  async viewCustomerDetails(customerName: string) {
    const customerRow = this.customersTable.locator(`tr:has-text("${customerName}")`);
    await customerRow.locator('a, button').filter({ hasText: customerName }).first().click();
  }
}

/**
 * Helper function
 */
async function expect(locator: Locator) {
  return locator;
}
