import { Page, Locator } from '@playwright/test';

/**
 * DashboardPage Object Model
 *
 * Handles interactions with the main dashboard including:
 * - Summary cards verification
 * - Navigation to modules
 * - Quick actions
 * - Charts and metrics
 */
export class DashboardPage {
  readonly page: Page;
  readonly sidebar: Locator;
  readonly mainContent: Locator;
  readonly pageTitle: Locator;

  // Summary cards
  readonly totalRevenueCard: Locator;
  readonly totalExpensesCard: Locator;
  readonly netProfitCard: Locator;
  readonly totalCustomersCard: Locator;
  readonly totalVendorsCard: Locator;

  // Quick action buttons
  readonly newInvoiceButton: Locator;
  readonly newReceiptButton: Locator;
  readonly newPaymentButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sidebar = page.locator('nav, aside').first();
    this.mainContent = page.locator('main, [role="main"]').first();
    this.pageTitle = page.locator('h1:has-text("ภาพรวมธุรกิจ")');

    // Summary cards (adjust selectors based on actual implementation)
    this.totalRevenueCard = page.locator('[data-testid="total-revenue"], .revenue-card').first();
    this.totalExpensesCard = page.locator('[data-testid="total-expenses"], .expenses-card').first();
    this.netProfitCard = page.locator('[data-testid="net-profit"], .profit-card').first();
    this.totalCustomersCard = page
      .locator('[data-testid="total-customers"], .customers-card')
      .first();
    this.totalVendorsCard = page.locator('[data-testid="total-vendors"], .vendors-card').first();

    // Quick actions
    this.newInvoiceButton = page.locator(
      'button:has-text("สร้างใบแจ้งหนี้"), button:has-text("New Invoice")'
    );
    this.newReceiptButton = page.locator(
      'button:has-text("รับเงินเข้า"), button:has-text("New Receipt")'
    );
    this.newPaymentButton = page.locator(
      'button:has-text("จ่ายเงินออก"), button:has-text("New Payment")'
    );
  }

  /**
   * Navigate to specific module
   */
  async navigateTo(module: string) {
    const moduleLabels = {
      dashboard: 'ภาพรวม',
      accounts: 'ผังบัญชี',
      journal: 'บันทึกบัญชี',
      invoices: 'ใบกำกับภาษี',
      vat: 'ภาษีมูลค่าเพิ่ม',
      wht: 'ภาษีหัก ณ ที่จ่าย',
      customers: 'ลูกหนี้',
      vendors: 'เจ้าหนี้',
      inventory: 'สต็อกสินค้า',
      banking: 'ธนาคาร',
      assets: 'ทรัพย์สิน',
      payroll: 'เงินเดือน',
      'petty-cash': 'เงินสดย่อย',
      reports: 'รายงาน',
      settings: 'ตั้งค่า',
      users: 'จัดการผู้ใช้',
    };

    const label = moduleLabels[module] || module;
    const moduleLink = this.sidebar.locator(`text=${label}`);

    await moduleLink.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Verify dashboard is loaded
   */
  async verifyLoaded() {
    await this.pageTitle.waitFor({ state: 'visible', timeout: 10000 });
    await this.sidebar.waitFor({ state: 'visible' });
  }

  /**
   * Get summary card values
   */
  async getSummaryCards() {
    const cards = {
      totalRevenue: await this.getText(this.totalRevenueCard),
      totalExpenses: await this.getText(this.totalExpensesCard),
      netProfit: await this.getText(this.netProfitCard),
      totalCustomers: await this.getText(this.totalCustomersCard),
      totalVendors: await this.getText(this.totalVendorsCard),
    };

    return cards;
  }

  /**
   * Verify specific summary cards are visible
   */
  async verifySummaryCardsVisible() {
    await expect(this.totalRevenueCard).toBeVisible({ timeout: 5000 });
    await expect(this.totalExpensesCard).toBeVisible();
    await expect(this.netProfitCard).toBeVisible();
  }

  /**
   * Click quick action button
   */
  async clickQuickAction(action: 'invoice' | 'receipt' | 'payment') {
    const buttons = {
      invoice: this.newInvoiceButton,
      receipt: this.newReceiptButton,
      payment: this.newPaymentButton,
    };

    await buttons[action].click();
  }

  /**
   * Get user info from header
   */
  async getUserInfo(): Promise<{ name: string; role: string; email: string } | null> {
    const userMenu = this.page.locator('[data-testid="user-menu"], .user-menu').first();

    if (await userMenu.isVisible({ timeout: 3000 }).catch(() => false)) {
      const name = (await userMenu.locator('.user-name').textContent()) || '';
      const email = (await userMenu.locator('.user-email').textContent()) || '';
      return { name, role: '', email };
    }

    return null;
  }

  /**
   * Logout
   */
  async logout() {
    const userMenu = this.page.locator('[data-testid="user-menu"], .user-menu').first();
    await userMenu.click();

    const logoutButton = this.page.locator(
      'button:has-text("ออกจากระบบ"), button:has-text("Logout")'
    );
    await logoutButton.click();

    // Verify back on login page
    await this.page.locator('input[type="email"]').waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * Take screenshot
   */
  async screenshot(path: string) {
    await this.page.screenshot({ path, fullPage: true });
  }

  /**
   * Helper to get text content
   */
  private async getText(locator: Locator): Promise<string> {
    if (await locator.isVisible({ timeout: 2000 }).catch(() => false)) {
      return (await locator.textContent()) || '';
    }
    return '';
  }
}

/**
 * Helper function
 */
async function expect(locator: Locator) {
  return locator;
}
