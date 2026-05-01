import { test as base, Page, TestInfo } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

/**
 * Test user credentials
 */
export const TEST_USERS = {
  ADMIN: {
    email: 'admin@thaiaccounting.com',
    password: 'admin123',
    role: 'ADMIN',
    name: 'ผู้ดูแลระบบ',
  },
  ACCOUNTANT: {
    email: 'accountant@thaiaccounting.com',
    password: 'acc123',
    role: 'ACCOUNTANT',
    name: 'นักบัญชี ทดสอบ',
  },
  USER: {
    email: 'user@thaiaccounting.com',
    password: 'user123',
    role: 'USER',
    name: 'ผู้ใช้ทั่วไป',
  },
  VIEWER: {
    email: 'viewer@thaiaccounting.com',
    password: 'viewer123',
    role: 'VIEWER',
    name: 'ผู้ชมเท่านั้น',
  },
} as const;

/**
 * Base test fixture with database, helpers, and test data management
 */
export const test = base.extend<{
  page: Page;
  db: PrismaClient;
  testInfo: TestInfo;
  screenshotPath: string;
  cleanupTestData: () => Promise<void>;
  loginAs: (role: keyof typeof TEST_USERS) => Promise<void>;
  waitForSelector: (selector: string, timeout?: number) => Promise<void>;
}>({
  page: async ({ page }, use) => {
    // Set default timeout for all actions
    page.setDefaultTimeout(30000);

    // Handle console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error('Browser Console Error:', msg.text());
      }
    });

    // Handle page errors
    page.on('pageerror', (exception) => {
      console.error('Page Error:', exception);
    });

    await use(page);
  },

  db: async ({}, use) => {
    const prisma = new PrismaClient({
      log: ['error', 'warn'],
    });

    await use(prisma);

    // Cleanup: disconnect from database
    await prisma.$disconnect();
  },

  screenshotPath: async ({ testInfo }, use) => {
    const screenshotsDir = path.join(testInfo.project.outputDir, 'screenshots', testInfo.title);

    // Create directory if it doesn't exist
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    await use(screenshotsDir);
  },

  cleanupTestData: async ({ db }, use) => {
    // Store test data for cleanup
    const testData: {
      customers?: string[];
      vendors?: string[];
      products?: string[];
      invoices?: string[];
      receipts?: string[];
      payments?: string[];
      journalEntries?: number[];
    } = {};

    // Provide cleanup function
    const cleanup = async () => {
      try {
        // Clean up in reverse order of dependencies
        if (testData.journalEntries?.length) {
          await prisma.$executeRawUnsafe(
            `DELETE FROM JournalLine WHERE journalEntryId IN (${testData.journalEntries.join(',')})`
          );
          await prisma.journalEntry.deleteMany({
            where: { id: { in: testData.journalEntries } },
          });
        }

        if (testData.payments?.length) {
          await prisma.payment.deleteMany({
            where: { id: { in: testData.payments } },
          });
        }

        if (testData.receipts?.length) {
          await prisma.receipt.deleteMany({
            where: { id: { in: testData.receipts } },
          });
        }

        if (testData.invoices?.length) {
          await prisma.invoice.deleteMany({
            where: { id: { in: testData.invoices } },
          });
        }

        if (testData.products?.length) {
          await prisma.product.deleteMany({
            where: { id: { in: testData.products } },
          });
        }

        if (testData.vendors?.length) {
          await prisma.vendor.deleteMany({
            where: { id: { in: testData.vendors } },
          });
        }

        if (testData.customers?.length) {
          await prisma.customer.deleteMany({
            where: { id: { in: testData.customers } },
          });
        }
      } catch (error) {
        console.error('Error cleaning up test data:', error);
      }
    };

    await use(cleanup);
  },

  loginAs: async ({ page }, use) => {
    const login = async (role: keyof typeof TEST_USERS) => {
      const user = TEST_USERS[role];

      // Navigate to login page
      await page.goto('/');

      // Fill in credentials
      await page.fill('input[type="email"]', user.email);
      await page.fill('input[type="password"]', user.password);

      // Submit form
      await page.click('button[type="submit"]');

      // Wait for dashboard
      await page.waitForSelector('h1:has-text("ภาพรวมธุรกิจ"), nav, aside', { timeout: 10000 });

      console.log(`✅ Logged in as ${user.role}`);
    };

    await use(login);
  },

  waitForSelector: async ({ page }, use) => {
    const waitFor = async (selector: string, timeout: number = 10000) => {
      await page.waitForSelector(selector, { timeout });
    };

    await use(waitFor);
  },
});

/**
 * Test data generators
 */
export class TestDataGenerator {
  /**
   * Generate random customer data
   */
  static generateCustomer(overrides?: Partial<any>) {
    const timestamp = Date.now();
    return {
      code: `CUST${timestamp}`,
      name: `บริษัท ทดสอบ ${timestamp} จำกัด`,
      nameEn: `Test Company ${timestamp} Ltd.`,
      taxId: `${timestamp}123456789`,
      address: '123 ถนนทดสอบ',
      subDistrict: 'แขวงทดสอบ',
      district: 'เขตทดสอบ',
      province: 'กรุงเทพมหานคร',
      postalCode: '10100',
      phone: '02-111-1111',
      email: `test${timestamp}@company.com`,
      creditLimit: 100000,
      creditDays: 30,
      ...overrides,
    };
  }

  /**
   * Generate random vendor data
   */
  static generateVendor(overrides?: Partial<any>) {
    const timestamp = Date.now();
    return {
      code: `VEND${timestamp}`,
      name: `บริษัท ผู้ขาย ${timestamp} จำกัด`,
      nameEn: `Vendor Company ${timestamp} Ltd.`,
      taxId: `${timestamp}987654321`,
      address: '789 ถนนผู้ขาย',
      province: 'กรุงเทพมหานคร',
      postalCode: '10300',
      phone: '02-222-2222',
      email: `vendor${timestamp}@company.com`,
      creditDays: 30,
      ...overrides,
    };
  }

  /**
   * Generate random product data
   */
  static generateProduct(overrides?: Partial<any>) {
    const timestamp = Date.now();
    return {
      code: `PROD${timestamp}`,
      name: `สินค้าทดสอบ ${timestamp}`,
      nameEn: `Test Product ${timestamp}`,
      unit: 'ชิ้น',
      price: 1000,
      cost: 800,
      vatType: 'VAT_7',
      incomeType: 'SERVICE',
      ...overrides,
    };
  }

  /**
   * Generate random invoice data
   */
  static generateInvoice(overrides?: Partial<any>) {
    const timestamp = Date.now();
    return {
      customerId: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: [
        {
          productId: '',
          quantity: 1,
          price: 1000,
          vatAmount: 70,
        },
      ],
      ...overrides,
    };
  }
}

/**
 * Database verification helpers
 */
export class DatabaseVerifier {
  constructor(private db: PrismaClient) {}

  /**
   * Verify customer exists in database
   */
  async verifyCustomerExists(code: string): Promise<boolean> {
    const customer = await this.db.customer.findUnique({
      where: { code },
    });
    return !!customer;
  }

  /**
   * Verify vendor exists in database
   */
  async verifyVendorExists(code: string): Promise<boolean> {
    const vendor = await this.db.vendor.findUnique({
      where: { code },
    });
    return !!vendor;
  }

  /**
   * Verify journal entry exists and balances
   */
  async verifyJournalEntry(journalEntryId: number): Promise<{
    exists: boolean;
    balances: boolean;
    details?: any;
  }> {
    const journalEntry = await this.db.journalEntry.findUnique({
      where: { id: journalEntryId },
      include: { lines: true },
    });

    if (!journalEntry) {
      return { exists: false, balances: false };
    }

    const totalDebit = journalEntry.lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
    const totalCredit = journalEntry.lines.reduce((sum, line) => sum + Number(line.credit || 0), 0);

    return {
      exists: true,
      balances: Math.abs(totalDebit - totalCredit) < 0.01,
      details: {
        totalDebit,
        totalCredit,
        lineCount: journalEntry.lines.length,
      },
    };
  }

  /**
   * Get account balance
   */
  async getAccountBalance(accountCode: string): Promise<{
    debit: number;
    credit: number;
    balance: number;
  }> {
    const lines = await this.db.journalLine.findMany({
      where: { accountCode },
      include: { journalEntry: true },
    });

    const filteredLines = lines.filter((line) => line.journalEntry.status === 'POSTED');

    const totalDebit = filteredLines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
    const totalCredit = filteredLines.reduce((sum, line) => sum + Number(line.credit || 0), 0);

    return {
      debit: totalDebit,
      credit: totalCredit,
      balance: totalDebit - totalCredit,
    };
  }
}

/**
 * Screenshot helpers
 */
export class ScreenshotHelper {
  static async captureFailure(
    page: Page,
    testInfo: TestInfo,
    screenshotPath: string
  ): Promise<void> {
    const filename = `failure-${Date.now()}.png`;
    const filepath = path.join(screenshotPath, filename);

    await page.screenshot({
      path: filepath,
      fullPage: true,
    });

    console.log(`📸 Screenshot saved: ${filepath}`);
    testInfo.attachments.push({
      name: 'screenshot',
      path: filepath,
      contentType: 'image/png',
    });
  }

  static async captureSuccess(
    page: Page,
    testInfo: TestInfo,
    screenshotPath: string,
    name: string
  ): Promise<void> {
    const filename = `${name}-${Date.now()}.png`;
    const filepath = path.join(screenshotPath, filename);

    await page.screenshot({
      path: filepath,
      fullPage: true,
    });

    console.log(`📸 Screenshot saved: ${filepath}`);
  }
}

/**
 * API test helpers
 */
export class ApiTestHelper {
  /**
   * Login and get authenticated context
   */
  static async loginAndGetContext(
    request: any,
    baseURL: string,
    credentials: { email: string; password: string }
  ) {
    const context = await request.newContext({
      extraHTTPHeaders: {
        'x-playwright-test': 'true',
      },
    });

    // Get CSRF token
    const csrfResponse = await context.get(`${baseURL}/api/auth/csrf`);
    const { csrfToken } = await csrfResponse.json();

    // Login
    const loginResponse = await context.post(`${baseURL}/api/auth/callback/credentials`, {
      data: {
        email: credentials.email,
        password: credentials.password,
        csrfToken,
      },
    });

    if (!loginResponse.ok()) {
      throw new Error('Login failed');
    }

    return context;
  }

  /**
   * Make authenticated API request
   */
  static async apiRequest(
    request: any,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    url: string,
    data?: any,
    baseURL: string = 'http://localhost:3000'
  ) {
    const context = await this.loginAndGetContext(request, baseURL, TEST_USERS.ADMIN);

    let response;
    switch (method) {
      case 'GET':
        response = await context.get(`${baseURL}${url}`);
        break;
      case 'POST':
        response = await context.post(`${baseURL}${url}`, { data });
        break;
      case 'PUT':
        response = await context.put(`${baseURL}${url}`, { data });
        break;
      case 'DELETE':
        response = await context.delete(`${baseURL}${url}`);
        break;
    }

    return response;
  }
}

export { expect } from '@playwright/test';
