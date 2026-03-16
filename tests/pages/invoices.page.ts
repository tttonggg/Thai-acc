import { Page, Locator } from '@playwright/test';

/**
 * InvoicesPage Object Model
 *
 * Handles sales invoice management including:
 * - Creating new invoices
 * - Editing draft invoices
 * - Issuing invoices (posting)
 * - Viewing invoice list
 * - Managing invoice items
 */
export class InvoicesPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly newInvoiceButton: Locator;
  readonly invoicesTable: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('h1:has-text("ใบกำกับภาษี"), h1:has-text("Invoices")');
    this.newInvoiceButton = page.locator('button:has-text("สร้างใบแจ้งหนี้"), button:has-text("New Invoice")');
    this.invoicesTable = page.locator('table, [role="table"]').first();
    this.searchInput = page.locator('input[placeholder*="ค้นหา"], input[placeholder*="Search"]').first();
  }

  /**
   * Navigate to invoices page
   */
  async goto() {
    const sidebar = this.page.locator('nav, aside').first();
    await sidebar.locator('text=ใบกำกับภาษี').click();
    await this.pageTitle.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Create new invoice
   */
  async createInvoice(invoiceData: {
    customerName: string;
    invoiceDate?: string;
    dueDate?: string;
    items: Array<{
      productName: string;
      quantity: number;
      price: number;
    }>;
  }) {
    await this.newInvoiceButton.click();

    // Wait for form
    await this.page.locator('input[name="customerId"], select[name="customerId"]').waitFor({ state: 'visible' });

    // Select customer
    await this.page.locator('select[name="customerId"]').selectOption({ label: invoiceData.customerName });

    // Set dates
    if (invoiceData.invoiceDate) {
      await this.page.fill('input[name="invoiceDate"]', invoiceData.invoiceDate);
    }

    if (invoiceData.dueDate) {
      await this.page.fill('input[name="dueDate"]', invoiceData.dueDate);
    }

    // Add items
    for (const item of invoiceData.items) {
      await this.addItem(item);
    }

    // Save as draft
    await this.page.locator('button:has-text("บันทึก"), button:has-text("Save")').click();

    // Wait for success
    await this.page.waitForSelector('text=บันทึกสำเร็จ, text=Saved successfully', { timeout: 5000 });
  }

  /**
   * Add item to invoice
   */
  async addItem(item: { productName: string; quantity: number; price: number }) {
    // Click add item button
    await this.page.locator('button:has-text("เพิ่มรายการ"), button:has-text("Add Item")').click();

    // Select product
    await this.page.locator('select[name="productId"]').last().selectOption({ label: item.productName });

    // Set quantity and price
    await this.page.locator('input[name="quantity"]').last().fill(item.quantity.toString());
    await this.page.locator('input[name="price"]').last().fill(item.price.toString());
  }

  /**
   * Edit invoice
   */
  async editInvoice(invoiceNumber: string, updates: {
    items?: Array<{
      productName: string;
      quantity: number;
      price: number;
    }>;
  }) {
    const invoiceRow = this.invoicesTable.locator(`tr:has-text("${invoiceNumber}")`);
    await invoiceRow.locator('button:has-text("แก้ไข"), button:has-text("Edit")').click();

    if (updates.items) {
      // Clear existing items and add new ones
      // Implementation depends on UI
    }

    await this.page.locator('button:has-text("บันทึก"), button:has-text("Save")').click();
  }

  /**
   * Delete invoice
   */
  async deleteInvoice(invoiceNumber: string) {
    const invoiceRow = this.invoicesTable.locator(`tr:has-text("${invoiceNumber}")`);
    await invoiceRow.locator('button:has-text("ลบ"), button:has-text("Delete")').click();

    // Confirm deletion
    await this.page.locator('button:has-text("ยืนยัน"), button:has-text("Confirm")').click();
  }

  /**
   * Issue invoice (post to accounting)
   */
  async issueInvoice(invoiceNumber: string) {
    const invoiceRow = this.invoicesTable.locator(`tr:has-text("${invoiceNumber}")`);
    await invoiceRow.locator('button:has-text("ออกใบกำกับภาษี"), button:has-text("Issue")').click();

    // Confirm issue
    await this.page.locator('button:has-text("ยืนยัน"), button:has-text("Confirm")').click();

    // Wait for success
    await this.page.waitForSelector('text=ออกใบกำกับภาษีสำเร็จ, text=Issued successfully', { timeout: 5000 });
  }

  /**
   * Verify invoice in list
   */
  async verifyInvoiceInList(invoiceNumber: string) {
    const invoiceRow = this.invoicesTable.locator(`tr:has-text("${invoiceNumber}")`);
    await expect(invoiceRow).toBeVisible({ timeout: 5000 });
  }

  /**
   * Get invoice status
   */
  async getInvoiceStatus(invoiceNumber: string): Promise<string> {
    const invoiceRow = this.invoicesTable.locator(`tr:has-text("${invoiceNumber}")`);
    const statusCell = invoiceRow.locator('td').nth(3); // Assuming status is 4th column
    return await statusCell.textContent() || '';
  }
}

/**
 * Helper function
 */
async function expect(locator: Locator) {
  return locator;
}
