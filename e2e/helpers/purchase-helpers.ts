/**
 * Purchase Workflow Test Helpers
 * ฟังก์ชันช่วยเหลือสำหรับการทดสอบ Purchase Request และ Purchase Order
 */

import { Page, APIRequestContext } from '@playwright/test';
import { TEST_USERS } from '../../tests/utils/constants';

// ============================================
// Types
// ============================================

export interface PRLineItem {
  description: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  discount?: number;
  vatRate?: number;
  productId?: string;
}

export interface PurchaseRequestData {
  reason: string;
  priority?: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';
  departmentId?: string;
  budgetId?: string;
  requiredDate?: string;
  notes?: string;
  lines: PRLineItem[];
}

export interface POLineItem {
  description: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  discount?: number;
  vatRate?: number;
  productId?: string;
}

export interface PurchaseOrderData {
  vendorId: string;
  orderDate?: string;
  expectedDate?: string;
  vendorContact?: string;
  vendorEmail?: string;
  vendorPhone?: string;
  shippingTerms?: string;
  paymentTerms?: string;
  deliveryAddress?: string;
  budgetId?: string;
  purchaseRequestId?: string;
  notes?: string;
  lines: POLineItem[];
}

export interface TestVendor {
  id: string;
  name: string;
  code: string;
  taxId?: string;
}

export interface TestProduct {
  id: string;
  name: string;
  code: string;
}

// ============================================
// Authentication Helpers
// ============================================

/**
 * Login as admin user
 * เข้าสู่ระบบในฐานะผู้ดูแลระบบ
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto('/');
  await page.fill('input[type="email"]', TEST_USERS.ADMIN.email);
  await page.fill('input[type="password"]', TEST_USERS.ADMIN.password);
  await page.click('button[type="submit"]');

  // Wait for dashboard to load
  await page.waitForSelector('text=ภาพรวมธุรกิจ, nav, aside', { timeout: 10000 });
}

/**
 * Login as accountant
 * เข้าสู่ระบบในฐานะนักบัญชี
 */
export async function loginAsAccountant(page: Page): Promise<void> {
  await page.goto('/');
  await page.fill('input[type="email"]', TEST_USERS.ACCOUNTANT.email);
  await page.fill('input[type="password"]', TEST_USERS.ACCOUNTANT.password);
  await page.click('button[type="submit"]');

  await page.waitForSelector('text=ภาพรวมธุรกิจ, nav, aside', { timeout: 10000 });
}

// ============================================
// Test Data Generation
// ============================================

/**
 * Generate unique test data with timestamp
 * สร้างข้อมูลทดสอบที่ไม่ซ้ำกันโดยใช้ timestamp
 */
export function generateUniqueData(prefix: string): {
  reason: string;
  description: string;
  timestamp: string;
} {
  const timestamp = new Date().getTime().toString();
  return {
    timestamp,
    reason: `${prefix} - ทดสอบ ${timestamp}`,
    description: `สินค้าทดสอบ ${prefix} ${timestamp}`,
  };
}

/**
 * Get current date in YYYY-MM-DD format
 * รับวันที่ปัจจุบันในรูปแบบ YYYY-MM-DD
 */
export function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get future date in YYYY-MM-DD format
 * รับวันที่ในอนาคตในรูปแบบ YYYY-MM-DD
 */
export function getFutureDate(days: number = 30): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

// ============================================
// API Helpers
// ============================================

/**
 * Create test vendor via API
 * สร้างผู้ขายทดสอบผ่าน API
 */
export async function createTestVendor(
  request: APIRequestContext,
  suffix: string = ''
): Promise<TestVendor> {
  const timestamp = new Date().getTime();
  const response = await request.post('/api/vendors', {
    data: {
      code: `TEST-VEN-${timestamp}`,
      name: `Vendor Test ${suffix} ${timestamp}`,
      taxId: '1234567890123',
      address: '123 Test Street',
      phone: '0812345678',
      email: `vendor${timestamp}@test.com`,
      isActive: true,
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to create test vendor: ${await response.text()}`);
  }

  const result = await response.json();
  return {
    id: result.data.id,
    name: result.data.name,
    code: result.data.code,
    taxId: result.data.taxId,
  };
}

/**
 * Create test product via API
 * สร้างสินค้าทดสอบผ่าน API
 */
export async function createTestProduct(
  request: APIRequestContext,
  suffix: string = ''
): Promise<TestProduct> {
  const timestamp = new Date().getTime();
  const response = await request.post('/api/products', {
    data: {
      code: `TEST-PROD-${timestamp}`,
      name: `Product Test ${suffix} ${timestamp}`,
      description: 'Test product for purchase workflow',
      unit: 'ชิ้น',
      type: 'PRODUCT',
      salePrice: 1000,
      costPrice: 500,
      vatRate: 7,
      isInventory: true,
      isActive: true,
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to create test product: ${await response.text()}`);
  }

  const result = await response.json();
  return {
    id: result.data.id,
    name: result.data.name,
    code: result.data.code,
  };
}

/**
 * Create Purchase Request via API
 * สร้างใบขอซื้อผ่าน API
 */
export async function createPurchaseRequestViaAPI(
  request: APIRequestContext,
  data: PurchaseRequestData
): Promise<{ id: string; requestNo: string }> {
  const response = await request.post('/api/purchase-requests', {
    data: {
      reason: data.reason,
      priority: data.priority || 'NORMAL',
      departmentId: data.departmentId,
      budgetId: data.budgetId,
      requiredDate: data.requiredDate,
      notes: data.notes,
      lines: data.lines.map((line, index) => ({
        lineNo: index + 1,
        description: line.description,
        quantity: line.quantity,
        unit: line.unit || 'ชิ้น',
        unitPrice: line.unitPrice,
        discount: line.discount || 0,
        vatRate: line.vatRate || 7,
        productId: line.productId,
      })),
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to create PR: ${await response.text()}`);
  }

  const result = await response.json();
  return {
    id: result.data.id,
    requestNo: result.data.requestNo,
  };
}

/**
 * Submit PR for approval via API
 * ส่งใบขอซื้อเพื่อขออนุมัติผ่าน API
 */
export async function submitPRViaAPI(request: APIRequestContext, prId: string): Promise<void> {
  const response = await request.post(`/api/purchase-requests/${prId}/submit`, {
    data: {},
  });

  if (!response.ok()) {
    throw new Error(`Failed to submit PR: ${await response.text()}`);
  }
}

/**
 * Approve PR via API
 * อนุมัติใบขอซื้อผ่าน API
 */
export async function approvePRViaAPI(
  request: APIRequestContext,
  prId: string,
  notes?: string
): Promise<void> {
  const response = await request.post(`/api/purchase-requests/${prId}/approve`, {
    data: { notes },
  });

  if (!response.ok()) {
    throw new Error(`Failed to approve PR: ${await response.text()}`);
  }
}

/**
 * Reject PR via API
 * ปฏิเสธใบขอซื้อผ่าน API
 */
export async function rejectPRViaAPI(
  request: APIRequestContext,
  prId: string,
  reason: string
): Promise<void> {
  const response = await request.post(`/api/purchase-requests/${prId}/reject`, {
    data: { reason },
  });

  if (!response.ok()) {
    throw new Error(`Failed to reject PR: ${await response.text()}`);
  }
}

/**
 * Create Purchase Order via API
 * สร้างใบสั่งซื้อผ่าน API
 */
export async function createPurchaseOrderViaAPI(
  request: APIRequestContext,
  data: PurchaseOrderData
): Promise<{ id: string; orderNo: string }> {
  const response = await request.post('/api/purchase-orders', {
    data: {
      vendorId: data.vendorId,
      orderDate: data.orderDate || getCurrentDate(),
      expectedDate: data.expectedDate,
      vendorContact: data.vendorContact,
      vendorEmail: data.vendorEmail,
      vendorPhone: data.vendorPhone,
      shippingTerms: data.shippingTerms,
      paymentTerms: data.paymentTerms,
      deliveryAddress: data.deliveryAddress,
      budgetId: data.budgetId,
      purchaseRequestId: data.purchaseRequestId,
      notes: data.notes,
      lines: data.lines.map((line, index) => ({
        lineNo: index + 1,
        description: line.description,
        quantity: line.quantity,
        unit: line.unit || 'ชิ้น',
        unitPrice: line.unitPrice,
        discount: line.discount || 0,
        vatRate: line.vatRate || 7,
        productId: line.productId,
      })),
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to create PO: ${await response.text()}`);
  }

  const result = await response.json();
  return {
    id: result.data.id,
    orderNo: result.data.orderNo,
  };
}

/**
 * Submit PO to vendor via API
 * ส่งใบสั่งซื้อให้ผู้ขายผ่าน API
 */
export async function submitPOViaAPI(request: APIRequestContext, poId: string): Promise<void> {
  const response = await request.post(`/api/purchase-orders/${poId}/submit`, {
    data: {},
  });

  if (!response.ok()) {
    throw new Error(`Failed to submit PO: ${await response.text()}`);
  }
}

/**
 * Confirm PO via API
 * ยืนยันใบสั่งซื้อผ่าน API
 */
export async function confirmPOViaAPI(request: APIRequestContext, poId: string): Promise<void> {
  const response = await request.post(`/api/purchase-orders/${poId}/confirm`, {
    data: {},
  });

  if (!response.ok()) {
    throw new Error(`Failed to confirm PO: ${await response.text()}`);
  }
}

/**
 * Ship PO via API
 * ทำเครื่องหมายใบสั่งซื้อว่าจัดส่งแล้วผ่าน API
 */
export async function shipPOViaAPI(
  request: APIRequestContext,
  poId: string,
  trackingInfo?: { trackingNumber?: string; shippingMethod?: string }
): Promise<void> {
  const response = await request.post(`/api/purchase-orders/${poId}/ship`, {
    data: trackingInfo || {},
  });

  if (!response.ok()) {
    throw new Error(`Failed to ship PO: ${await response.text()}`);
  }
}

/**
 * Receive PO via API
 * รับสินค้าจากใบสั่งซื้อผ่าน API
 */
export async function receivePOViaAPI(
  request: APIRequestContext,
  poId: string,
  lines: Array<{ lineId: string; receivedQty: number; notes?: string }>
): Promise<void> {
  const response = await request.post(`/api/purchase-orders/${poId}/receive`, {
    data: { lines },
  });

  if (!response.ok()) {
    throw new Error(`Failed to receive PO: ${await response.text()}`);
  }
}

/**
 * Cancel PO via API
 * ยกเลิกใบสั่งซื้อผ่าน API
 */
export async function cancelPOViaAPI(
  request: APIRequestContext,
  poId: string,
  reason: string
): Promise<void> {
  const response = await request.post(`/api/purchase-orders/${poId}/cancel`, {
    data: { reason },
  });

  if (!response.ok()) {
    throw new Error(`Failed to cancel PO: ${await response.text()}`);
  }
}

// ============================================
// UI Helpers
// ============================================

/**
 * Navigate to Purchase Requests module
 * นำทางไปยังโมดูลใบขอซื้อ
 */
export async function navigateToPR(page: Page): Promise<void> {
  // Click on purchases menu
  await page.click('text=งานซื้อ, button:has-text("งานซื้อ"), [data-menu="purchases"]', {
    timeout: 5000,
  });

  // Click on PR submenu
  await page.click('text=ใบขอซื้อ (PR), a:has-text("ใบขอซื้อ")', { timeout: 5000 });

  // Wait for PR list to load
  await page.waitForSelector('text=ใบขอซื้อ (Purchase Request), table', { timeout: 10000 });
}

/**
 * Navigate to Purchase Orders module
 * นำทางไปยังโมดูลใบสั่งซื้อ
 */
export async function navigateToPO(page: Page): Promise<void> {
  // Click on purchases menu
  await page.click('text=งานซื้อ, button:has-text("งานซื้อ"), [data-menu="purchases"]', {
    timeout: 5000,
  });

  // Click on PO submenu
  await page.click('text=ใบสั่งซื้อ (PO), a:has-text("ใบสั่งซื้อ")', { timeout: 5000 });

  // Wait for PO list to load
  await page.waitForSelector('text=ใบสั่งซื้อ (Purchase Order), table', { timeout: 10000 });
}

/**
 * Take screenshot with timestamp
 * ถ่ายภาพหน้าจอพร้อม timestamp
 */
export async function takeScreenshot(page: Page, name: string): Promise<void> {
  const timestamp = new Date().getTime();
  await page.screenshot({
    path: `test-results/${name}-${timestamp}.png`,
    fullPage: true,
  });
}

// ============================================
// Cleanup Helpers
// ============================================

/**
 * Cleanup test data
 * ล้างข้อมูลทดสอบ
 */
export async function cleanupTestData(
  request: APIRequestContext,
  ids: {
    vendorIds?: string[];
    productIds?: string[];
    prIds?: string[];
    poIds?: string[];
  }
): Promise<void> {
  // Delete POs first (to avoid FK constraints)
  if (ids.poIds) {
    for (const id of ids.poIds) {
      try {
        await request.delete(`/api/purchase-orders/${id}`);
      } catch {
        // Ignore errors
      }
    }
  }

  // Delete PRs
  if (ids.prIds) {
    for (const id of ids.prIds) {
      try {
        await request.delete(`/api/purchase-requests/${id}`);
      } catch {
        // Ignore errors
      }
    }
  }

  // Delete products
  if (ids.productIds) {
    for (const id of ids.productIds) {
      try {
        await request.delete(`/api/products/${id}`);
      } catch {
        // Ignore errors
      }
    }
  }

  // Delete vendors
  if (ids.vendorIds) {
    for (const id of ids.vendorIds) {
      try {
        await request.delete(`/api/vendors/${id}`);
      } catch {
        // Ignore errors
      }
    }
  }
}

/**
 * Wait for toast notification
 * รอการแจ้งเตือน toast
 */
export async function waitForToast(
  page: Page,
  message?: string,
  timeout: number = 5000
): Promise<void> {
  const selector = message ? `[data-sonner-toast]:has-text("${message}")` : '[data-sonner-toast]';

  await page.waitForSelector(selector, { timeout });
}

/**
 * Get toast message
 * รับข้อความจาก toast
 */
export async function getToastMessage(page: Page): Promise<string> {
  const toast = page.locator('[data-sonner-toast]').first();
  return (await toast.textContent()) || '';
}
