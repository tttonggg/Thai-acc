import { Page, Locator, expect } from '@playwright/test';
import { POLineItem, PurchaseOrderData } from '../../e2e/helpers/purchase-helpers';

/**
 * PurchaseOrdersPage Object Model
 *
 * Handles all interactions with the Purchase Orders module including:
 * - Creating, viewing, editing POs
 * - Submitting to vendor
 * - Confirming, shipping, receiving
 * - Canceling POs
 */
export class PurchaseOrdersPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly createButton: Locator;
  readonly searchInput: Locator;
  readonly statusFilter: Locator;
  readonly poTable: Locator;
  readonly poTableBody: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('h1:has-text("ใบสั่งซื้อ"), h1:has-text("Purchase Order")');
    this.createButton = page.locator(
      'button:has-text("สร้างใบสั่งซื้อ"), button:has-text("Create PO")'
    );
    this.searchInput = page.locator('input[placeholder*="ค้นหา"], input[placeholder*="Search"]');
    this.statusFilter = page
      .locator('select')
      .filter({ hasText: /สถานะ|Status|ทุกสถานะ|All Status/ });
    this.poTable = page.locator('table');
    this.poTableBody = page.locator('table tbody');
  }

  /**
   * Navigate to Purchase Orders page
   */
  async goto(): Promise<void> {
    // Navigate via sidebar menu
    await this.page.goto('/');

    // Click on งานซื้อ menu
    const purchasesMenu = this.page
      .locator('text=งานซื้อ, button:has-text("งานซื้อ"), [data-testid="purchases-menu"]')
      .first();
    if (await purchasesMenu.isVisible().catch(() => false)) {
      await purchasesMenu.click();
    }

    // Click on ใบสั่งซื้อ submenu
    await this.page.click('text=ใบสั่งซื้อ (PO), a:has-text("ใบสั่งซื้อ")');

    // Wait for page to load
    await this.pageTitle.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Click create new PO button
   */
  async clickCreate(): Promise<void> {
    await this.createButton.click();
    await this.page.waitForSelector('[role="dialog"]', { timeout: 5000 });
  }

  /**
   * Fill PO form with data
   */
  async fillForm(data: PurchaseOrderData): Promise<void> {
    // Select vendor
    if (data.vendorId) {
      await this.page.selectOption('select[name="vendorId"]', data.vendorId);
    }

    // Fill order date
    if (data.orderDate) {
      await this.page.fill('input[name="orderDate"]', data.orderDate);
    }

    // Fill expected date
    if (data.expectedDate) {
      await this.page.fill('input[name="expectedDate"]', data.expectedDate);
    }

    // Fill vendor contact
    if (data.vendorContact) {
      await this.page.fill('input[name="vendorContact"]', data.vendorContact);
    }

    // Fill vendor email
    if (data.vendorEmail) {
      await this.page.fill('input[name="vendorEmail"]', data.vendorEmail);
    }

    // Fill vendor phone
    if (data.vendorPhone) {
      await this.page.fill('input[name="vendorPhone"]', data.vendorPhone);
    }

    // Fill shipping terms
    if (data.shippingTerms) {
      await this.page.fill(
        'input[name="shippingTerms"], textarea[name="shippingTerms"]',
        data.shippingTerms
      );
    }

    // Fill payment terms
    if (data.paymentTerms) {
      await this.page.fill('input[name="paymentTerms"]', data.paymentTerms);
    }

    // Fill delivery address
    if (data.deliveryAddress) {
      await this.page.fill('textarea[name="deliveryAddress"]', data.deliveryAddress);
    }

    // Select budget
    if (data.budgetId) {
      await this.page.selectOption('select[name="budgetId"]', data.budgetId);
    }

    // Fill notes
    if (data.notes) {
      await this.page.fill('textarea[name="notes"]', data.notes);
    }
  }

  /**
   * Add line item to PO
   */
  async addLineItem(line: POLineItem, index: number = 0): Promise<void> {
    // Click add line button
    await this.page.click('button:has-text("เพิ่มรายการ"), button:has-text("Add Line")');

    const linePrefix = `lines[${index}]`;

    // Fill description
    await this.page.fill(
      `input[name="${linePrefix}.description"], textarea[name="${linePrefix}.description"]`,
      line.description
    );

    // Select product if provided
    if (line.productId) {
      await this.page.selectOption(`select[name="${linePrefix}.productId"]`, line.productId);
    }

    // Fill quantity
    await this.page.fill(`input[name="${linePrefix}.quantity"]`, line.quantity.toString());

    // Fill unit price
    await this.page.fill(`input[name="${linePrefix}.unitPrice"]`, line.unitPrice.toString());

    // Fill unit if applicable
    if (line.unit) {
      await this.page.fill(`input[name="${linePrefix}.unit"]`, line.unit);
    }

    // Fill discount if applicable
    if (line.discount) {
      await this.page.fill(`input[name="${linePrefix}.discount"]`, line.discount.toString());
    }
  }

  /**
   * Save PO (create or update)
   */
  async save(): Promise<void> {
    await this.page.click(
      'button[type="submit"], button:has-text("บันทึก"), button:has-text("Save")'
    );
    await this.page.waitForSelector('[data-sonner-toast]', { timeout: 5000 });
  }

  /**
   * Create a complete PO
   */
  async createPO(data: PurchaseOrderData): Promise<{ id: string; orderNo: string }> {
    await this.clickCreate();
    await this.fillForm(data);

    // Add line items
    for (let i = 0; i < data.lines.length; i++) {
      await this.addLineItem(data.lines[i], i);
    }

    await this.save();

    // Get the created PO info
    await this.page.waitForTimeout(500);

    // Find the newly created PO in the table
    const vendorName = await this.page
      .locator(`select[name="vendorId"] option[value="${data.vendorId}"]`)
      .textContent()
      .catch(() => '');
    const row = this.poTableBody.locator('tr').filter({ hasText: vendorName }).first();
    const orderNo = (await row.locator('td').first().textContent()) || '';

    return { id: '', orderNo: orderNo.trim() };
  }

  /**
   * Find PO row by order number
   */
  async findPORow(orderNo: string): Promise<Locator | null> {
    const row = this.poTableBody.locator('tr').filter({ hasText: orderNo }).first();
    if (await row.isVisible().catch(() => false)) {
      return row;
    }
    return null;
  }

  /**
   * Open PO detail/view dialog
   */
  async openPODetail(orderNo: string): Promise<void> {
    const row = this.poTableBody.locator('tr').filter({ hasText: orderNo }).first();
    await row.locator('button').first().click();
    await this.page.waitForSelector('[role="dialog"]', { timeout: 5000 });
  }

  /**
   * Submit PO to vendor
   */
  async submitPO(orderNo: string): Promise<void> {
    await this.openPODetail(orderNo);

    // Click submit button
    await this.page.click(
      'button:has-text("ส่งให้ผู้ขาย"), button:has-text("Submit"), button:has-text("Send")'
    );

    // Confirm submission
    await this.page.click('button:has-text("ยืนยัน"), button:has-text("Confirm")');

    // Wait for success toast
    await this.page.waitForSelector(
      '[data-sonner-toast]:has-text("ส่ง"), [data-sonner-toast]:has-text("Sent")',
      { timeout: 5000 }
    );
  }

  /**
   * Confirm PO
   */
  async confirmPO(orderNo: string): Promise<void> {
    await this.openPODetail(orderNo);

    // Click confirm button
    await this.page.click('button:has-text("ยืนยัน"), button:has-text("Confirm")');

    // Wait for success toast
    await this.page.waitForSelector(
      '[data-sonner-toast]:has-text("ยืนยัน"), [data-sonner-toast]:has-text("Confirmed")',
      { timeout: 5000 }
    );
  }

  /**
   * Mark PO as shipped
   */
  async shipPO(
    orderNo: string,
    trackingInfo?: { trackingNumber?: string; shippingMethod?: string }
  ): Promise<void> {
    await this.openPODetail(orderNo);

    // Click ship button
    await this.page.click('button:has-text("จัดส่ง"), button:has-text("Ship")');

    // Fill tracking info if provided
    if (trackingInfo?.trackingNumber) {
      await this.page.fill('input[name="trackingNumber"]', trackingInfo.trackingNumber);
    }

    if (trackingInfo?.shippingMethod) {
      await this.page.fill('input[name="shippingMethod"]', trackingInfo.shippingMethod);
    }

    // Confirm
    await this.page.click('button:has-text("ยืนยัน"), button:has-text("Confirm")');

    // Wait for success toast
    await this.page.waitForSelector(
      '[data-sonner-toast]:has-text("จัดส่ง"), [data-sonner-toast]:has-text("Shipped")',
      { timeout: 5000 }
    );
  }

  /**
   * Receive PO items
   */
  async receivePO(
    orderNo: string,
    receivedItems: Array<{ lineId?: string; receivedQty: number; notes?: string }>
  ): Promise<void> {
    await this.openPODetail(orderNo);

    // Click receive button
    await this.page.click('button:has-text("รับสินค้า"), button:has-text("Receive")');

    // Fill received quantities
    for (let i = 0; i < receivedItems.length; i++) {
      const item = receivedItems[i];
      await this.page.fill(`input[name="receivedQty[${i}]"]`, item.receivedQty.toString());

      if (item.notes) {
        await this.page.fill(`textarea[name="notes[${i}]"]`, item.notes);
      }
    }

    // Confirm receipt
    await this.page.click('button:has-text("ยืนยัน"), button:has-text("Confirm")');

    // Wait for success toast
    await this.page.waitForSelector(
      '[data-sonner-toast]:has-text("รับ"), [data-sonner-toast]:has-text("Received")',
      { timeout: 5000 }
    );
  }

  /**
   * Cancel PO
   */
  async cancelPO(orderNo: string, reason: string): Promise<void> {
    await this.openPODetail(orderNo);

    // Click cancel button
    await this.page.click('button:has-text("ยกเลิก"), button:has-text("Cancel")');

    // Fill cancellation reason
    await this.page.fill('textarea[name="reason"], textarea[name="cancellationReason"]', reason);

    // Confirm cancellation
    await this.page.click('button:has-text("ยืนยัน"), button:has-text("Confirm")');

    // Wait for success toast
    await this.page.waitForSelector(
      '[data-sonner-toast]:has-text("ยกเลิก"), [data-sonner-toast]:has-text("Cancelled")',
      { timeout: 5000 }
    );
  }

  /**
   * Delete PO
   */
  async deletePO(orderNo: string): Promise<void> {
    const row = this.poTableBody.locator('tr').filter({ hasText: orderNo }).first();

    // Click delete button
    await row.locator('button:has-text("ลบ"), button:has-text("Delete")').click();

    // Confirm deletion
    await this.page.click(
      'button:has-text("ยืนยัน"), button:has-text("Confirm"), button:has-text("ลบ")'
    );

    // Wait for success toast
    await this.page.waitForSelector('[data-sonner-toast]:has-text("ลบ")', { timeout: 5000 });
  }

  /**
   * Search for PO
   */
  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(500);
  }

  /**
   * Filter by status
   */
  async filterByStatus(status: string): Promise<void> {
    await this.page.selectOption('select:has-text("สถานะ"), select:has-text("Status")', status);
    await this.page.waitForTimeout(500);
  }

  /**
   * Get PO count from stats
   */
  async getPOCountByStatus(
    status: 'DRAFT' | 'SENT' | 'CONFIRMED' | 'SHIPPED' | 'RECEIVED' | 'CANCELLED'
  ): Promise<number> {
    const statusLabels: Record<string, string> = {
      DRAFT: 'ฉบับร่าง',
      SENT: 'ส่งแล้ว',
      CONFIRMED: 'ยืนยันแล้ว',
      SHIPPED: 'จัดส่งแล้ว',
      RECEIVED: 'รับสินค้าแล้ว',
      CANCELLED: 'ยกเลิก',
    };

    const card = this.page.locator('.card, [data-card]').filter({ hasText: statusLabels[status] });
    const countText = (await card.locator('.text-2xl, [data-count]').textContent()) || '0';
    return parseInt(countText, 10);
  }

  /**
   * Verify PO exists in list
   */
  async verifyPOExists(orderNo: string): Promise<boolean> {
    const row = this.poTableBody.locator('tr').filter({ hasText: orderNo });
    return await row.isVisible().catch(() => false);
  }

  /**
   * Verify PO status
   */
  async verifyPOStatus(orderNo: string, expectedStatus: string): Promise<boolean> {
    const row = this.poTableBody.locator('tr').filter({ hasText: orderNo });
    const statusCell = row.locator('td').filter({ hasText: expectedStatus });
    return await statusCell.isVisible().catch(() => false);
  }

  /**
   * Get PO total amount
   */
  async getPOTotal(orderNo: string): Promise<number> {
    const row = this.poTableBody.locator('tr').filter({ hasText: orderNo });
    const amountCell = row.locator('td').filter({ hasText: '฿' });
    const amountText = (await amountCell.textContent()) || '0';

    // Parse amount (remove currency symbol and commas)
    return parseFloat(amountText.replace(/[฿,]/g, ''));
  }

  /**
   * Wait for page load
   */
  async waitForLoad(): Promise<void> {
    await this.pageTitle.waitFor({ state: 'visible', timeout: 10000 });
    await this.poTable.waitFor({ state: 'visible', timeout: 10000 });
  }
}
