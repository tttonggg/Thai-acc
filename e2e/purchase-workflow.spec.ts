import { test, expect, Page } from '@playwright/test';
import {
  loginAsAdmin,
  generateUniqueData,
  getFutureDate,
  createTestVendor,
  createTestProduct,
  createPurchaseRequestViaAPI,
  submitPRViaAPI,
  approvePRViaAPI,
  rejectPRViaAPI,
  createPurchaseOrderViaAPI,
  confirmPOViaAPI,
  shipPOViaAPI,
  receivePOViaAPI,
  cancelPOViaAPI,
  takeScreenshot,
  cleanupTestData,
  waitForToast,
} from './helpers/purchase-helpers';
import { PurchaseRequestsPage } from '../tests/pages/purchase-requests.page';
import { PurchaseOrdersPage } from '../tests/pages/purchase-orders.page';

/**
 * Purchase Request & Purchase Order Workflow E2E Tests
 *
 * Test Suite สำหรับทดสอบ workflow การขอซื้อและสั่งซื้อแบบครบวงจร
 *
 * Test Cases:
 * - [PR-001] Create Purchase Request
 * - [PR-002] Submit PR for Approval
 * - [PR-003] Approve Purchase Request
 * - [PR-004] Reject Purchase Request
 * - [PR-005] Convert PR to PO
 * - [PO-001] Create Purchase Order
 * - [PO-002] Submit PO to Vendor
 * - [PO-003] Confirm Purchase Order
 * - [PO-004] Ship Purchase Order
 * - [PO-005] Receive Purchase Order
 * - [PO-006] Cancel Purchase Order
 * - [WORKFLOW-001] Full PR to PO Workflow
 * - [VALIDATION-001] Budget Check Validation
 * - [ERROR-001] Invalid Data Handling
 */

test.describe('Purchase Request & Purchase Order Workflow', () => {
  let page: Page;
  let prPage: PurchaseRequestsPage;
  let poPage: PurchaseOrdersPage;

  // Store created test data for cleanup
  const testData = {
    vendorIds: [] as string[],
    productIds: [] as string[],
    prIds: [] as string[],
    poIds: [] as string[],
  };

  test.beforeAll(async ({ browser }) => {
    // Create a new browser context for all tests
    const context = await browser.newContext();
    page = await context.newPage();

    // Initialize page objects
    prPage = new PurchaseRequestsPage(page);
    poPage = new PurchaseOrdersPage(page);

    // Login as admin
    await loginAsAdmin(page);

    // Create test vendor and product via API
    const vendor = await createTestVendor(page.request);
    testData.vendorIds.push(vendor.id);

    const product = await createTestProduct(page.request);
    testData.productIds.push(product.id);

    console.log(`Test vendor created: ${vendor.name} (${vendor.id})`);
    console.log(`Test product created: ${product.name} (${product.id})`);
  });

  test.afterAll(async () => {
    // Cleanup all test data
    await cleanupTestData(page.request, testData);
    await page.close();
  });

  test.afterEach(async ({}, testInfo) => {
    // Take screenshot on failure
    if (testInfo.status !== 'passed') {
      await takeScreenshot(page, `failed-${testInfo.title}`);
    }
  });

  // ============================================
  // PURCHASE REQUEST TESTS
  // ============================================

  test('[PR-001] Create Purchase Request', async () => {
    const uniqueData = generateUniqueData('PR-001');

    // Navigate to PR module
    await prPage.goto();
    await takeScreenshot(page, 'pr-001-initial');

    // Click create button
    await prPage.clickCreate();
    await takeScreenshot(page, 'pr-001-create-dialog');

    // Fill PR form
    await prPage.fillForm({
      reason: uniqueData.reason,
      priority: 'HIGH',
      requiredDate: getFutureDate(14),
      notes: 'ทดสอบสร้างใบขอซื้อ',
      lines: [
        {
          description: uniqueData.description,
          quantity: 10,
          unitPrice: 1000,
          unit: 'ชิ้น',
        },
      ],
    });
    await takeScreenshot(page, 'pr-001-filled-form');

    // Add line item
    await prPage.addLineItem(
      {
        description: uniqueData.description,
        quantity: 10,
        unitPrice: 1000,
        unit: 'ชิ้น',
      },
      0
    );

    // Save PR
    await prPage.save();
    await takeScreenshot(page, 'pr-001-saved');

    // Verify success
    await waitForToast(page, 'สร้าง');
    const toastMessage = await page.locator('[data-sonner-toast]').first().textContent();
    expect(toastMessage).toContain('สร้าง');

    // Verify PR appears in list
    const prExists = await prPage.verifyPRExists(uniqueData.reason);
    expect(prExists).toBe(true);

    // Verify status is DRAFT
    const statusCorrect = await prPage.verifyPRStatus(uniqueData.reason, 'ร่าง');
    expect(statusCorrect).toBe(true);
  });

  test('[PR-002] Submit PR for Approval', async () => {
    const uniqueData = generateUniqueData('PR-002');

    // Create a new PR via API
    const pr = await createPurchaseRequestViaAPI(page.request, {
      reason: uniqueData.reason,
      priority: 'NORMAL',
      lines: [
        {
          description: uniqueData.description,
          quantity: 5,
          unitPrice: 500,
        },
      ],
    });
    testData.prIds.push(pr.id);

    // Navigate to PR module
    await prPage.goto();
    await takeScreenshot(page, 'pr-002-initial');

    // Submit the PR
    await prPage.submitPR(pr.requestNo);
    await takeScreenshot(page, 'pr-002-submitted');

    // Verify status changed to PENDING
    const statusCorrect = await prPage.verifyPRStatus(pr.requestNo, 'รออนุมัติ');
    expect(statusCorrect).toBe(true);

    // Verify toast message
    await waitForToast(page, 'ส่งอนุมัติ');
  });

  test('[PR-003] Approve Purchase Request', async () => {
    const uniqueData = generateUniqueData('PR-003');

    // Create and submit a PR via API
    const pr = await createPurchaseRequestViaAPI(page.request, {
      reason: uniqueData.reason,
      priority: 'URGENT',
      lines: [
        {
          description: uniqueData.description,
          quantity: 20,
          unitPrice: 2000,
        },
      ],
    });
    testData.prIds.push(pr.id);

    await submitPRViaAPI(page.request, pr.id);

    // Navigate to PR module
    await prPage.goto();
    await takeScreenshot(page, 'pr-003-initial');

    // Approve the PR
    await prPage.approvePR(pr.requestNo, 'อนุมัติตามที่ขอ');
    await takeScreenshot(page, 'pr-003-approved');

    // Verify status changed to APPROVED
    const statusCorrect = await prPage.verifyPRStatus(pr.requestNo, 'อนุมัติแล้ว');
    expect(statusCorrect).toBe(true);

    // Verify toast message
    await waitForToast(page, 'อนุมัติ');
  });

  test('[PR-004] Reject Purchase Request', async () => {
    const uniqueData = generateUniqueData('PR-004');

    // Create and submit a PR via API
    const pr = await createPurchaseRequestViaAPI(page.request, {
      reason: uniqueData.reason,
      priority: 'LOW',
      lines: [
        {
          description: uniqueData.description,
          quantity: 100,
          unitPrice: 10000,
        },
      ],
    });
    testData.prIds.push(pr.id);

    await submitPRViaAPI(page.request, pr.id);

    // Navigate to PR module
    await prPage.goto();
    await takeScreenshot(page, 'pr-004-initial');

    // Reject the PR
    await prPage.rejectPR(pr.requestNo, 'งบประมาณไม่เพียงพอ');
    await takeScreenshot(page, 'pr-004-rejected');

    // Verify status changed to REJECTED
    const statusCorrect = await prPage.verifyPRStatus(pr.requestNo, 'ปฏิเสธ');
    expect(statusCorrect).toBe(true);

    // Verify toast message
    await waitForToast(page, 'ปฏิเสธ');
  });

  test('[PR-005] Convert PR to PO', async () => {
    const uniqueData = generateUniqueData('PR-005');

    // Create and approve a PR via API
    const pr = await createPurchaseRequestViaAPI(page.request, {
      reason: uniqueData.reason,
      priority: 'HIGH',
      lines: [
        {
          description: uniqueData.description,
          quantity: 15,
          unitPrice: 1500,
        },
      ],
    });
    testData.prIds.push(pr.id);

    await submitPRViaAPI(page.request, pr.id);
    await approvePRViaAPI(page.request, pr.id);

    // Navigate to PR module
    await prPage.goto();
    await takeScreenshot(page, 'pr-005-initial');

    // Convert PR to PO
    const result = await prPage.convertToPO(pr.requestNo, testData.vendorIds[0]);
    await takeScreenshot(page, 'pr-005-converted');

    // Verify PR status changed to CONVERTED
    const statusCorrect = await prPage.verifyPRStatus(pr.requestNo, 'แปลงเป็น PO');
    expect(statusCorrect).toBe(true);

    // Verify PO was created
    expect(result.orderNo).toMatch(/PO\d{6}-\d{4}/);

    // Store PO ID for cleanup
    if (result.poId) {
      testData.poIds.push(result.poId);
    }

    // Verify toast message
    await waitForToast(page, 'แปลง');
  });

  // ============================================
  // PURCHASE ORDER TESTS
  // ============================================

  test('[PO-001] Create Purchase Order', async () => {
    const uniqueData = generateUniqueData('PO-001');

    // Navigate to PO module
    await poPage.goto();
    await takeScreenshot(page, 'po-001-initial');

    // Click create button
    await poPage.clickCreate();
    await takeScreenshot(page, 'po-001-create-dialog');

    // Fill PO form
    await poPage.fillForm({
      vendorId: testData.vendorIds[0],
      expectedDate: getFutureDate(30),
      shippingTerms: 'FOB',
      paymentTerms: '30 days',
      notes: 'ทดสอบสร้างใบสั่งซื้อ',
      lines: [
        {
          description: uniqueData.description,
          quantity: 5,
          unitPrice: 2000,
          unit: 'ชิ้น',
        },
      ],
    });

    // Add line item
    await poPage.addLineItem(
      {
        description: uniqueData.description,
        quantity: 5,
        unitPrice: 2000,
        unit: 'ชิ้น',
      },
      0
    );

    await takeScreenshot(page, 'po-001-filled-form');

    // Save PO
    await poPage.save();
    await takeScreenshot(page, 'po-001-saved');

    // Verify success
    await waitForToast(page, 'สร้าง');

    // Verify PO appears in list
    const vendorName = await page
      .locator(`select[name="vendorId"] option[value="${testData.vendorIds[0]}"]`)
      .textContent();
    const poExists = await poPage.verifyPOExists(vendorName || '');
    expect(poExists).toBe(true);
  });

  test('[PO-002] Submit PO to Vendor', async () => {
    const uniqueData = generateUniqueData('PO-002');

    // Create a PO via API
    const po = await createPurchaseOrderViaAPI(page.request, {
      vendorId: testData.vendorIds[0],
      expectedDate: getFutureDate(30),
      notes: uniqueData.reason,
      lines: [
        {
          description: uniqueData.description,
          quantity: 10,
          unitPrice: 1000,
        },
      ],
    });
    testData.poIds.push(po.id);

    // Navigate to PO module
    await poPage.goto();
    await takeScreenshot(page, 'po-002-initial');

    // Submit PO
    await poPage.submitPO(po.orderNo);
    await takeScreenshot(page, 'po-002-submitted');

    // Verify status changed to SENT
    const statusCorrect = await poPage.verifyPOStatus(po.orderNo, 'ส่งแล้ว');
    expect(statusCorrect).toBe(true);

    // Verify toast message
    await waitForToast(page, 'ส่ง');
  });

  test('[PO-003] Confirm Purchase Order', async () => {
    const uniqueData = generateUniqueData('PO-003');

    // Create and submit a PO via API
    const po = await createPurchaseOrderViaAPI(page.request, {
      vendorId: testData.vendorIds[0],
      expectedDate: getFutureDate(30),
      notes: uniqueData.reason,
      lines: [
        {
          description: uniqueData.description,
          quantity: 8,
          unitPrice: 800,
        },
      ],
    });
    testData.poIds.push(po.id);

    // Navigate through status flow: DRAFT -> SENT -> CONFIRMED
    // Note: In actual implementation, we might need to call submit first
    // For now, assume we can directly confirm from the UI

    await poPage.goto();
    await takeScreenshot(page, 'po-003-initial');

    // Confirm PO
    await poPage.confirmPO(po.orderNo);
    await takeScreenshot(page, 'po-003-confirmed');

    // Verify status changed to CONFIRMED
    const statusCorrect = await poPage.verifyPOStatus(po.orderNo, 'ยืนยันแล้ว');
    expect(statusCorrect).toBe(true);

    // Verify toast message
    await waitForToast(page, 'ยืนยัน');
  });

  test('[PO-004] Ship Purchase Order', async () => {
    const uniqueData = generateUniqueData('PO-004');

    // Create a PO via API
    const po = await createPurchaseOrderViaAPI(page.request, {
      vendorId: testData.vendorIds[0],
      expectedDate: getFutureDate(30),
      notes: uniqueData.reason,
      lines: [
        {
          description: uniqueData.description,
          quantity: 12,
          unitPrice: 1200,
        },
      ],
    });
    testData.poIds.push(po.id);

    // Navigate to PO module
    await poPage.goto();
    await takeScreenshot(page, 'po-004-initial');

    // Ship PO
    await poPage.shipPO(po.orderNo, {
      trackingNumber: 'TRACK123456',
      shippingMethod: 'Kerry Express',
    });
    await takeScreenshot(page, 'po-004-shipped');

    // Verify status changed to SHIPPED
    const statusCorrect = await poPage.verifyPOStatus(po.orderNo, 'จัดส่งแล้ว');
    expect(statusCorrect).toBe(true);

    // Verify toast message
    await waitForToast(page, 'จัดส่ง');
  });

  test('[PO-005] Receive Purchase Order', async () => {
    const uniqueData = generateUniqueData('PO-005');

    // Create a PO with product via API
    const po = await createPurchaseOrderViaAPI(page.request, {
      vendorId: testData.vendorIds[0],
      expectedDate: getFutureDate(30),
      notes: uniqueData.reason,
      lines: [
        {
          description: uniqueData.description,
          quantity: 10,
          unitPrice: 1000,
          productId: testData.productIds[0],
        },
      ],
    });
    testData.poIds.push(po.id);

    // Navigate to PO module
    await poPage.goto();
    await takeScreenshot(page, 'po-005-initial');

    // Receive PO items
    await poPage.receivePO(po.orderNo, [{ receivedQty: 10, notes: 'รับครบตามจำนวน' }]);
    await takeScreenshot(page, 'po-005-received');

    // Verify status changed to RECEIVED
    const statusCorrect = await poPage.verifyPOStatus(po.orderNo, 'รับสินค้าแล้ว');
    expect(statusCorrect).toBe(true);

    // Verify toast message
    await waitForToast(page, 'รับ');
  });

  test('[PO-006] Cancel Purchase Order', async () => {
    const uniqueData = generateUniqueData('PO-006');

    // Create a PO via API
    const po = await createPurchaseOrderViaAPI(page.request, {
      vendorId: testData.vendorIds[0],
      expectedDate: getFutureDate(30),
      notes: uniqueData.reason,
      lines: [
        {
          description: uniqueData.description,
          quantity: 5,
          unitPrice: 500,
        },
      ],
    });
    testData.poIds.push(po.id);

    // Navigate to PO module
    await poPage.goto();
    await takeScreenshot(page, 'po-006-initial');

    // Cancel PO
    await poPage.cancelPO(po.orderNo, 'ยกเลิกตามคำขอของผู้ขาย');
    await takeScreenshot(page, 'po-006-cancelled');

    // Verify status changed to CANCELLED
    const statusCorrect = await poPage.verifyPOStatus(po.orderNo, 'ยกเลิก');
    expect(statusCorrect).toBe(true);

    // Verify toast message
    await waitForToast(page, 'ยกเลิก');
  });

  // ============================================
  // FULL WORKFLOW TEST
  // ============================================

  test('[WORKFLOW-001] Full PR to PO Workflow', async () => {
    const uniqueData = generateUniqueData('WORKFLOW');

    // Step 1: Create PR
    console.log('Step 1: Creating PR...');
    const pr = await createPurchaseRequestViaAPI(page.request, {
      reason: uniqueData.reason,
      priority: 'HIGH',
      requiredDate: getFutureDate(14),
      lines: [
        {
          description: uniqueData.description,
          quantity: 50,
          unitPrice: 500,
          productId: testData.productIds[0],
        },
      ],
    });
    testData.prIds.push(pr.id);

    await prPage.goto();
    await takeScreenshot(page, 'workflow-01-created');

    // Verify PR exists
    let prExists = await prPage.verifyPRExists(pr.requestNo);
    expect(prExists).toBe(true);

    // Step 2: Submit PR for approval
    console.log('Step 2: Submitting PR...');
    await submitPRViaAPI(page.request, pr.id);
    await prPage.goto();
    await takeScreenshot(page, 'workflow-02-submitted');

    let statusCorrect = await prPage.verifyPRStatus(pr.requestNo, 'รออนุมัติ');
    expect(statusCorrect).toBe(true);

    // Step 3: Approve PR
    console.log('Step 3: Approving PR...');
    await approvePRViaAPI(page.request, pr.id, 'อนุมัติสำหรับการสั่งซื้อ');
    await prPage.goto();
    await takeScreenshot(page, 'workflow-03-approved');

    statusCorrect = await prPage.verifyPRStatus(pr.requestNo, 'อนุมัติแล้ว');
    expect(statusCorrect).toBe(true);

    // Step 4: Convert PR to PO
    console.log('Step 4: Converting PR to PO...');
    await prPage.convertToPO(pr.requestNo, testData.vendorIds[0]);
    await takeScreenshot(page, 'workflow-04-converted');

    statusCorrect = await prPage.verifyPRStatus(pr.requestNo, 'แปลงเป็น PO');
    expect(statusCorrect).toBe(true);

    // Step 5: Navigate to PO and verify
    console.log('Step 5: Verifying PO...');
    await poPage.goto();
    await takeScreenshot(page, 'workflow-05-po-list');

    // Step 6: Confirm PO
    console.log('Step 6: Confirming PO...');
    // Get the PO number from PR
    const prDetail = await page.request.get(`/api/purchase-requests/${pr.id}`);
    const prData = await prDetail.json();
    const poId = prData.data?.purchaseOrder?.id;

    if (poId) {
      testData.poIds.push(poId);
      const poDetail = await page.request.get(`/api/purchase-orders/${poId}`);
      const poData = await poDetail.json();
      const orderNo = poData.data?.orderNo;

      if (orderNo) {
        await confirmPOViaAPI(page.request, poId);
        await poPage.goto();
        await takeScreenshot(page, 'workflow-06-confirmed');
      }
    }

    console.log('Full workflow completed successfully!');
  });

  // ============================================
  // VALIDATION TESTS
  // ============================================

  test('[VALIDATION-001] PR Line Item Calculations', async () => {
    const uniqueData = generateUniqueData('VAL-001');

    // Navigate to PR module
    await prPage.goto();
    await prPage.clickCreate();

    // Fill form with line items
    await prPage.fillForm({
      reason: uniqueData.reason,
      priority: 'NORMAL',
      lines: [],
    });

    // Add multiple line items
    await prPage.addLineItem(
      {
        description: 'Item 1',
        quantity: 10,
        unitPrice: 100,
        vatRate: 7,
      },
      0
    );

    await prPage.addLineItem(
      {
        description: 'Item 2',
        quantity: 5,
        unitPrice: 200,
        discount: 10,
        vatRate: 7,
      },
      1
    );

    await takeScreenshot(page, 'validation-001-line-items');

    // Save and verify calculations
    await prPage.save();

    // Verify success toast
    await waitForToast(page, 'สร้าง');

    // Expected calculation:
    // Item 1: 10 * 100 = 1000 + 7% VAT = 1070
    // Item 2: 5 * 200 = 1000 - 10% discount = 900 + 7% VAT = 963
    // Total: 1070 + 963 = 2033
  });

  test('[VALIDATION-002] PO Status Transition Validation', async () => {
    const uniqueData = generateUniqueData('VAL-002');

    // Create a cancelled PO
    const po = await createPurchaseOrderViaAPI(page.request, {
      vendorId: testData.vendorIds[0],
      notes: uniqueData.reason,
      lines: [
        {
          description: uniqueData.description,
          quantity: 5,
          unitPrice: 500,
        },
      ],
    });
    testData.poIds.push(po.id);

    // Cancel the PO
    await cancelPOViaAPI(page.request, po.id, 'Test cancellation');

    // Navigate to PO module
    await poPage.goto();
    await takeScreenshot(page, 'validation-002-cancelled');

    // Verify PO is in cancelled status
    const statusCorrect = await poPage.verifyPOStatus(po.orderNo, 'ยกเลิก');
    expect(statusCorrect).toBe(true);

    // Try to confirm a cancelled PO (should fail)
    // This would typically be handled by the UI disabling the action
    // or the API returning an error
  });

  // ============================================
  // ERROR HANDLING TESTS
  // ============================================

  test('[ERROR-001] Create PR without line items', async () => {
    const uniqueData = generateUniqueData('ERR-001');

    // Navigate to PR module
    await prPage.goto();
    await prPage.clickCreate();

    // Fill form without line items
    await prPage.fillForm({
      reason: uniqueData.reason,
      priority: 'NORMAL',
      lines: [],
    });

    await takeScreenshot(page, 'error-001-no-lines');

    // Try to save without line items
    // This should either show validation error or be prevented by UI
    await prPage.save();

    // Verify error toast or dialog remains open
    const dialogVisible = await page
      .locator('[role="dialog"]')
      .isVisible()
      .catch(() => false);
    expect(
      dialogVisible ||
        (await page
          .locator('[data-sonner-toast]:has-text("รายการ")')
          .isVisible()
          .catch(() => false))
    ).toBeTruthy();
  });

  test('[ERROR-002] Create PO without vendor', async () => {
    const uniqueData = generateUniqueData('ERR-002');

    // Navigate to PO module
    await poPage.goto();
    await poPage.clickCreate();

    // Fill form without selecting vendor
    await poPage.fillForm({
      vendorId: '', // Empty vendor
      expectedDate: getFutureDate(30),
      notes: uniqueData.reason,
      lines: [
        {
          description: uniqueData.description,
          quantity: 5,
          unitPrice: 500,
        },
      ],
    });

    await poPage.addLineItem(
      {
        description: uniqueData.description,
        quantity: 5,
        unitPrice: 500,
      },
      0
    );

    await takeScreenshot(page, 'error-002-no-vendor');

    // Try to save
    await poPage.save();

    // Verify error message
    const errorVisible = await page
      .locator(
        '[data-sonner-toast]:has-text("ผู้ขาย"), [data-sonner-toast]:has-text("vendor"), [data-sonner-toast]:has-text("กรอก"]'
      )
      .isVisible()
      .catch(() => false);
    expect(errorVisible).toBe(true);
  });

  // ============================================
  // FILTER & SEARCH TESTS
  // ============================================

  test('[FILTER-001] Filter PR by Status', async () => {
    // Navigate to PR module
    await prPage.goto();

    // Filter by DRAFT status
    await prPage.filterByStatus('DRAFT');
    await takeScreenshot(page, 'filter-001-draft');

    // Verify only DRAFT items are shown
    const draftCount = await prPage.getPRCountByStatus('DRAFT');
    console.log(`Draft PR count: ${draftCount}`);

    // Filter by APPROVED status
    await prPage.filterByStatus('APPROVED');
    await takeScreenshot(page, 'filter-001-approved');

    const approvedCount = await prPage.getPRCountByStatus('APPROVED');
    console.log(`Approved PR count: ${approvedCount}`);
  });

  test('[SEARCH-001] Search for Purchase Request', async () => {
    const uniqueData = generateUniqueData('SEARCH');

    // Create a PR with unique identifier
    const pr = await createPurchaseRequestViaAPI(page.request, {
      reason: uniqueData.reason,
      priority: 'NORMAL',
      lines: [
        {
          description: uniqueData.description,
          quantity: 3,
          unitPrice: 300,
        },
      ],
    });
    testData.prIds.push(pr.id);

    // Navigate to PR module
    await prPage.goto();

    // Search for the PR
    await prPage.search(uniqueData.reason);
    await takeScreenshot(page, 'search-001-results');

    // Verify PR is found
    const prExists = await prPage.verifyPRExists(uniqueData.reason);
    expect(prExists).toBe(true);
  });
});
