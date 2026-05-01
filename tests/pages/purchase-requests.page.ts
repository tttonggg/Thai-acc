import { Page, Locator, expect } from '@playwright/test';
import { PRLineItem, PurchaseRequestData } from '../../e2e/helpers/purchase-helpers';

/**
 * PurchaseRequestsPage Object Model
 *
 * Handles all interactions with the Purchase Requests module including:
 * - Creating, viewing, editing PRs
 * - Submitting for approval
 * - Approving/rejecting PRs
 * - Converting to PO
 */
export class PurchaseRequestsPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly createButton: Locator;
  readonly searchInput: Locator;
  readonly statusFilter: Locator;
  readonly priorityFilter: Locator;
  readonly prTable: Locator;
  readonly prTableBody: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('h1:has-text("ใบขอซื้อ"), h1:has-text("Purchase Request")');
    this.createButton = page.locator(
      'button:has-text("สร้างใบขอซื้อ"), button:has-text("Create PR")'
    );
    this.searchInput = page.locator('input[placeholder*="ค้นหา"], input[placeholder*="Search"]');
    this.statusFilter = page
      .locator('select')
      .filter({ hasText: /สถานะ|Status|ทุกสถานะ|All Status/ });
    this.priorityFilter = page
      .locator('select')
      .filter({ hasText: /ความสำคัญ|Priority|ทุกความสำคัญ|All Priority/ });
    this.prTable = page.locator('table');
    this.prTableBody = page.locator('table tbody');
  }

  /**
   * Navigate to Purchase Requests page
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

    // Click on ใบขอซื้อ submenu
    await this.page.click('text=ใบขอซื้อ (PR), a:has-text("ใบขอซื้อ")');

    // Wait for page to load
    await this.pageTitle.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Click create new PR button
   */
  async clickCreate(): Promise<void> {
    await this.createButton.click();
    await this.page.waitForSelector('[role="dialog"]', { timeout: 5000 });
  }

  /**
   * Fill PR form with data
   */
  async fillForm(data: PurchaseRequestData): Promise<void> {
    // Fill reason
    if (data.reason) {
      await this.page.fill('input[name="reason"], textarea[name="reason"]', data.reason);
    }

    // Select priority
    if (data.priority) {
      await this.page.selectOption('select[name="priority"]', data.priority);
    }

    // Select department
    if (data.departmentId) {
      await this.page.selectOption('select[name="departmentId"]', data.departmentId);
    }

    // Select budget
    if (data.budgetId) {
      await this.page.selectOption('select[name="budgetId"]', data.budgetId);
    }

    // Fill required date
    if (data.requiredDate) {
      await this.page.fill('input[name="requiredDate"]', data.requiredDate);
    }

    // Fill notes
    if (data.notes) {
      await this.page.fill('textarea[name="notes"]', data.notes);
    }
  }

  /**
   * Add line item to PR
   */
  async addLineItem(line: PRLineItem, index: number = 0): Promise<void> {
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
   * Save PR (create or update)
   */
  async save(): Promise<void> {
    await this.page.click(
      'button[type="submit"], button:has-text("บันทึก"), button:has-text("Save")'
    );
    await this.page.waitForSelector('[data-sonner-toast]', { timeout: 5000 });
  }

  /**
   * Create a complete PR
   */
  async createPR(data: PurchaseRequestData): Promise<{ id: string; requestNo: string }> {
    await this.clickCreate();
    await this.fillForm(data);

    // Add line items
    for (let i = 0; i < data.lines.length; i++) {
      await this.addLineItem(data.lines[i], i);
    }

    await this.save();

    // Get the created PR info from toast or page
    const toast = this.page.locator('[data-sonner-toast]').first();
    const toastText = (await toast.textContent()) || '';

    // Extract PR number from toast or look for it in the table
    await this.page.waitForTimeout(500);

    // Find the newly created PR in the table
    const row = this.prTableBody.locator('tr').filter({ hasText: data.reason }).first();
    const requestNo = (await row.locator('td').first().textContent()) || '';

    // Get the PR ID from the view/edit button
    const viewButton = row.locator('button').first();
    const onclick = (await viewButton.getAttribute('onclick')) || '';
    const idMatch = onclick.match(/['"]([a-zA-Z0-9_-]+)['"]/);
    const id = idMatch ? idMatch[1] : '';

    return { id, requestNo: requestNo.trim() };
  }

  /**
   * Find PR row by reason
   */
  async findPRRow(reason: string): Promise<Locator | null> {
    const row = this.prTableBody.locator('tr').filter({ hasText: reason }).first();
    if (await row.isVisible().catch(() => false)) {
      return row;
    }
    return null;
  }

  /**
   * Open PR detail/view dialog
   */
  async openPRDetail(requestNo: string): Promise<void> {
    const row = this.prTableBody.locator('tr').filter({ hasText: requestNo }).first();
    await row.locator('button').first().click();
    await this.page.waitForSelector('[role="dialog"]', { timeout: 5000 });
  }

  /**
   * Submit PR for approval
   */
  async submitPR(requestNo: string): Promise<void> {
    await this.openPRDetail(requestNo);

    // Click submit button in dialog
    await this.page.click('button:has-text("ส่งอนุมัติ"), button:has-text("Submit")');

    // Wait for success toast
    await this.page.waitForSelector('[data-sonner-toast]:has-text("ส่งอนุมัติ")', {
      timeout: 5000,
    });
  }

  /**
   * Approve PR
   */
  async approvePR(requestNo: string, notes?: string): Promise<void> {
    await this.openPRDetail(requestNo);

    // Click approve button
    await this.page.click('button:has-text("อนุมัติ"), button:has-text("Approve")');

    // Fill approval notes if provided
    if (notes) {
      await this.page.fill('textarea[name="approvalNotes"], textarea[name="notes"]', notes);
    }

    // Confirm approval
    await this.page.click('button:has-text("ยืนยัน"), button:has-text("Confirm")');

    // Wait for success toast
    await this.page.waitForSelector('[data-sonner-toast]:has-text("อนุมัติ")', { timeout: 5000 });
  }

  /**
   * Reject PR
   */
  async rejectPR(requestNo: string, reason: string): Promise<void> {
    await this.openPRDetail(requestNo);

    // Click reject button
    await this.page.click('button:has-text("ปฏิเสธ"), button:has-text("Reject")');

    // Fill rejection reason
    await this.page.fill('textarea[name="rejectionReason"], textarea[name="reason"]', reason);

    // Confirm rejection
    await this.page.click('button:has-text("ยืนยัน"), button:has-text("Confirm")');

    // Wait for success toast
    await this.page.waitForSelector('[data-sonner-toast]:has-text("ปฏิเสธ")', { timeout: 5000 });
  }

  /**
   * Convert PR to PO
   */
  async convertToPO(
    requestNo: string,
    vendorId?: string
  ): Promise<{ poId: string; orderNo: string }> {
    await this.openPRDetail(requestNo);

    // Click convert button
    await this.page.click('button:has-text("แปลงเป็น PO"), button:has-text("Convert to PO")');

    // Select vendor if not pre-selected
    if (vendorId) {
      await this.page.selectOption('select[name="vendorId"]', vendorId);
    }

    // Confirm conversion
    await this.page.click('button:has-text("ยืนยัน"), button:has-text("Confirm")');

    // Wait for success toast
    await this.page.waitForSelector(
      '[data-sonner-toast]:has-text("แปลง"), [data-sonner-toast]:has-text("PO")',
      { timeout: 5000 }
    );

    // Get the created PO number
    const toast = this.page.locator('[data-sonner-toast]').first();
    const toastText = (await toast.textContent()) || '';

    // Extract PO number from toast
    const poMatch = toastText.match(/PO\d{6}-\d{4}/);
    const orderNo = poMatch ? poMatch[0] : '';

    return { poId: '', orderNo };
  }

  /**
   * Delete PR
   */
  async deletePR(requestNo: string): Promise<void> {
    const row = this.prTableBody.locator('tr').filter({ hasText: requestNo }).first();

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
   * Search for PR
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
   * Filter by priority
   */
  async filterByPriority(priority: string): Promise<void> {
    await this.page.selectOption(
      'select:has-text("ความสำคัญ"), select:has-text("Priority")',
      priority
    );
    await this.page.waitForTimeout(500);
  }

  /**
   * Get PR count from stats
   */
  async getPRCountByStatus(
    status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CONVERTED'
  ): Promise<number> {
    const statusLabels: Record<string, string> = {
      DRAFT: 'ฉบับร่าง',
      PENDING: 'รออนุมัติ',
      APPROVED: 'อนุมัติแล้ว',
      REJECTED: 'ปฏิเสธ',
      CONVERTED: 'แปลงเป็น PO',
    };

    const card = this.page.locator('.card, [data-card]').filter({ hasText: statusLabels[status] });
    const countText = (await card.locator('.text-2xl, [data-count]').textContent()) || '0';
    return parseInt(countText, 10);
  }

  /**
   * Verify PR exists in list
   */
  async verifyPRExists(requestNo: string): Promise<boolean> {
    const row = this.prTableBody.locator('tr').filter({ hasText: requestNo });
    return await row.isVisible().catch(() => false);
  }

  /**
   * Verify PR status
   */
  async verifyPRStatus(requestNo: string, expectedStatus: string): Promise<boolean> {
    const row = this.prTableBody.locator('tr').filter({ hasText: requestNo });
    const statusCell = row.locator('td').filter({ hasText: expectedStatus });
    return await statusCell.isVisible().catch(() => false);
  }

  /**
   * Wait for page load
   */
  async waitForLoad(): Promise<void> {
    await this.pageTitle.waitFor({ state: 'visible', timeout: 10000 });
    await this.prTable.waitFor({ state: 'visible', timeout: 10000 });
  }
}
