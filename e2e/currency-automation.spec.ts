/**
 * Currency Fixes Automation Test Suite
 *
 * Validates entire stack: UI → API → Database → API → UI
 * Tracks expected vs actual values for each stage
 *
 * Run: npx playwright test currency-automation.spec.ts --headed
 */

import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Test data
const TEST_DATA = {
  invoice: {
    customerName: 'ทดสอบระบบอัตโนมัติ',
    description: 'ทดสอบทศนิยม',
    quantity: 1,
    unitPrice: 1234.56, // Baht with decimals
    vatRate: 7,
  },
  receipt: {
    amount: 1500.0,
    whtRate: 3,
  },
  payment: {
    amount: 50000.0,
    whtCategory: 'ค่าบริการวิชาชีพ (Professional)',
  },
};

// Expected results (in Satang)
const EXPECTED = {
  invoice: {
    unitPrice: 123456, // 1234.56 * 100
    vatAmount: 8642, // 123456 * 0.07
    amount: 123456,
    totalAmount: 132098, // 123456 + 8642
  },
  receipt: {
    amount: 150000, // 1500.00 * 100
    allocation: 132098,
    whtAmount: 3963, // 132098 * 0.03
    netPayment: 128135, // 132098 - 3963
    remaining: 17902, // 150000 - 132098
  },
  payment: {
    amount: 5000000, // 50000.00 * 100
    whtAmount: 150000, // 5000000 * 0.03
    netPayment: 4850000, // 5000000 - 150000
  },
};

test.describe('Currency Automation Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000');
    await page.fill('input[type="email"]', 'admin@thaiaccounting.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3000');
    await page.waitForTimeout(1000);
  });

  test.afterEach(async () => {
    // Cleanup test data
    await prisma.invoice.deleteMany({
      where: { customer: { name: { contains: 'ทดสอบ' } } },
    });
    await prisma.receipt.deleteMany({
      where: { customer: { name: { contains: 'ทดสอบ' } } },
    });
    await prisma.payment.deleteMany({
      where: { vendor: { name: { contains: 'ทดสอบ' } } },
    });
  });

  test('Test 1: Invoice with decimal amounts', async ({ page }) => {
    console.log('\n=== Test 1: Invoice Decimal Amounts ===\n');

    // Navigate to invoices
    await page.click('text=ใบกำกับภาษี');
    await page.waitForTimeout(500);

    // Create invoice
    await page.click('button:has-text("สร้างใบกำกับภาษี")');
    await page.waitForTimeout(500);

    // Fill form
    await page.selectOption('select[name="customerId"]', { label: 'บ.สยามพาเวอร์' });
    await page.fill('input[placeholder*="รายละเอียด"]', TEST_DATA.invoice.description);
    await page.fill('input[name="quantity"]', TEST_DATA.invoice.quantity.toString());
    await page.fill('input[name="unitPrice"]', TEST_DATA.invoice.unitPrice.toString());

    // Wait for auto-calculation
    await page.waitForTimeout(500);

    // Get UI values before submit
    const uiUnitPrice = await page.inputValue('input[name="unitPrice"]');
    const uiVatAmount = await page.textContent('[data-testid="vatAmount"]');
    const uiTotalAmount = await page.textContent('[data-testid="totalAmount"]');

    console.log('UI Input (Baht):', {
      unitPrice: uiUnitPrice,
      vatAmount: uiVatAmount,
      totalAmount: uiTotalAmount,
    });

    // Submit
    await page.click('button:has-text("บันทึก")');
    await page.waitForTimeout(2000);

    // Get invoice number from success message
    const invoiceNo = await page.textContent('[data-testid="success-invoice-no"]');
    console.log('Created invoice:', invoiceNo);

    // Query database
    const dbInvoice = await prisma.invoice.findFirst({
      where: { invoiceNo: (invoiceNo || '').toString() },
      include: { lines: true },
    });

    expect(dbInvoice).toBeTruthy();

    // Compare expected vs actual
    const results = {
      'DB unitPrice (Satang)': {
        expected: EXPECTED.invoice.unitPrice,
        actual: dbInvoice!.lines[0].unitPrice,
        pass: dbInvoice!.lines[0].unitPrice === EXPECTED.invoice.unitPrice,
      },
      'DB vatAmount (Satang)': {
        expected: EXPECTED.invoice.vatAmount,
        actual: dbInvoice!.vatAmount,
        pass: dbInvoice!.vatAmount === EXPECTED.invoice.vatAmount,
      },
      'DB totalAmount (Satang)': {
        expected: EXPECTED.invoice.totalAmount,
        actual: dbInvoice!.totalAmount,
        pass: dbInvoice!.totalAmount === EXPECTED.invoice.totalAmount,
      },
    };

    // Print results
    console.log('\n📊 Test Results:');
    for (const [field, result] of Object.entries(results)) {
      const status = result.pass ? '✅' : '❌';
      console.log(`${status} ${field}`);
      console.log(`   Expected: ${result.expected}`);
      console.log(`   Actual: ${result.actual}`);
      if (!result.pass) {
        console.log(`   Difference: ${result.actual - result.expected}`);
      }
    }

    // Assertions
    expect(dbInvoice!.lines[0].unitPrice).toBe(EXPECTED.invoice.unitPrice);
    expect(dbInvoice!.vatAmount).toBe(EXPECTED.invoice.vatAmount);
    expect(dbInvoice!.totalAmount).toBe(EXPECTED.invoice.totalAmount);

    // Verify list view
    await page.click('text=ใบกำกับภาษี');
    await page.waitForTimeout(500);

    // Find the invoice in list
    const pageContent = await page.content();
    const invoiceInList = pageContent.includes(invoiceNo || '');
    expect(invoiceInList).toBe(true);

    // Check display format (should be Baht, not Satang)
    const listText = await page.textContent('table');
    expect(listText).toContain('1,320.98'); // Baht format
    expect(listText).not.toContain('132,098'); // NOT Satang format
    expect(listText).not.toContain('13.21'); // NOT double-divided
  });

  test('Test 2: Receipt with WHT calculation', async ({ page }) => {
    console.log('\n=== Test 2: Receipt WHT Calculation ===\n');

    // First create an invoice (reusing Test 1 logic)
    await page.click('text=ใบกำกับภาษี');
    await page.click('button:has-text("สร้างใบกำกับภาษี")');
    await page.selectOption('select[name="customerId"]', { label: 'บ.สยามพาเวอร์' });
    await page.fill('input[placeholder*="รายละเอียด"]', 'ทดสอบ WHT');
    await page.fill('input[name="quantity"]', '1');
    await page.fill('input[name="unitPrice"]', '1234.56');
    await page.waitForTimeout(500);
    await page.click('button:has-text("บันทึก")');
    await page.waitForTimeout(2000);

    // Create receipt
    await page.click('text=รับเงิน');
    await page.click('button:has-text("รับเงิน")');
    await page.waitForTimeout(500);

    // Fill receipt form
    await page.selectOption('select[name="customerId"]', { label: 'บ.สยามพาเวอร์' });
    await page.fill('input[name="amount"]', TEST_DATA.receipt.amount.toString());
    await page.waitForTimeout(500);

    // Select invoice to allocate
    await page.click('[data-testid="allocate-invoice-checkbox"]');
    await page.selectOption('select[name="whtRate"]', TEST_DATA.receipt.whtRate.toString());

    // Check calculated values
    const uiWhtAmount = await page.textContent('[data-testid="wht-amount"]');
    const uiNetPayment = await page.textContent('[data-testid="net-payment"]');
    const uiRemaining = await page.textContent('[data-testid="remaining-amount"]');

    console.log('UI Calculations:', {
      whtAmount: uiWhtAmount,
      netPayment: uiNetPayment,
      remaining: uiRemaining,
    });

    // Submit
    await page.click('button:has-text("บันทึก")');
    await page.waitForTimeout(2000);

    // Query database
    const receipt = await prisma.receipt.findFirst({
      where: { customer: { name: 'บ.สยามพาเวอร์' } },
      include: { allocations: true },
    });

    expect(receipt).toBeTruthy();

    // Verify allocations
    const allocation = receipt!.allocations[0];
    const results = {
      'Receipt amount (Satang)': {
        expected: EXPECTED.receipt.amount,
        actual: receipt!.amount,
        pass: receipt!.amount === EXPECTED.receipt.amount,
      },
      'Allocation amount (Satang)': {
        expected: EXPECTED.receipt.allocation,
        actual: allocation.amount,
        pass: allocation.amount === EXPECTED.receipt.allocation,
      },
      'WHT amount (Satang)': {
        expected: EXPECTED.receipt.whtAmount,
        actual: allocation.whtAmount,
        pass: allocation.whtAmount === EXPECTED.receipt.whtAmount,
      },
      'Net payment (Satang)': {
        expected: EXPECTED.receipt.netPayment,
        actual: allocation.netPayment,
        pass: allocation.netPayment === EXPECTED.receipt.netPayment,
      },
    };

    console.log('\n📊 Test Results:');
    for (const [field, result] of Object.entries(results)) {
      const status = result.pass ? '✅' : '❌';
      console.log(`${status} ${field}`);
      console.log(`   Expected: ${result.expected}`);
      console.log(`   Actual: ${result.actual}`);
    }

    // Assertions
    expect(receipt!.amount).toBe(EXPECTED.receipt.amount);
    expect(allocation.amount).toBe(EXPECTED.receipt.allocation);
    expect(allocation.whtAmount).toBe(EXPECTED.receipt.whtAmount);
    expect(allocation.netPayment).toBe(EXPECTED.receipt.netPayment);
  });

  test('Test 3: Payment with WHT category', async ({ page }) => {
    console.log('\n=== Test 3: Payment WHT Category ===\n');

    // Navigate to payments
    await page.click('text=จ่ายเหนื่อย');
    await page.click('button:has-text("จ่ายเหนื่อย")');
    await page.waitForTimeout(500);

    // Fill payment form
    await page.selectOption('select[name="vendorId"]', { label: 'บ.มิตรภาพ' });
    await page.fill('input[name="amount"]', TEST_DATA.payment.amount.toString());

    // Check WHT category dropdown
    const whtCategorySelect = await page.locator('select[name="whtCategory"]');
    const options = await whtCategorySelect.locator('option').allTextContents();

    console.log('WHT Categories available:', options.length);
    expect(options.length).toBeGreaterThan(5); // Should have 6 categories

    // Select Professional category
    await page.selectOption('select[name="whtCategory"]', {
      label: TEST_DATA.payment.whtCategory,
    });

    // Verify rate auto-populates
    const whtRate = await page.inputValue('select[name="whtRate"]');
    console.log('Auto-populated WHT rate:', whtRate, '%');
    expect(whtRate).toBe('3'); // Professional = 3%

    // Check WHT tooltip
    await page.click('[data-testid="wht-info-tooltip"]');
    const tooltipContent = await page.textContent('[data-testid="wht-tooltip-content"]');
    expect(tooltipContent).toContain('ค่าบริการวิชาชีพ');
    expect(tooltipContent).toContain('3%');

    // Submit
    await page.click('button:has-text("บันทึก")');
    await page.waitForTimeout(2000);

    // Query database
    const payment = await prisma.payment.findFirst({
      where: { vendor: { name: 'บ.มิตรภาพ' } },
      include: { allocations: true },
    });

    expect(payment).toBeTruthy();

    // Verify WHT calculation
    const results = {
      'Payment amount (Satang)': {
        expected: EXPECTED.payment.amount,
        actual: payment!.amount,
        pass: payment!.amount === EXPECTED.payment.amount,
      },
      'WHT amount (Satang)': {
        expected: EXPECTED.payment.whtAmount,
        actual: payment!.whtAmount,
        pass: payment!.whtAmount === EXPECTED.payment.whtAmount,
      },
      'Unallocated (Satang)': {
        expected: EXPECTED.payment.whtAmount,
        actual: payment!.unallocated,
        pass: payment!.unallocated === EXPECTED.payment.whtAmount,
      },
    };

    console.log('\n📊 Test Results:');
    for (const [field, result] of Object.entries(results)) {
      const status = result.pass ? '✅' : '❌';
      console.log(`${status} ${field}`);
      console.log(`   Expected: ${result.expected}`);
      console.log(`   Actual: ${result.actual}`);
    }

    expect(payment!.amount).toBe(EXPECTED.payment.amount);
    expect(payment!.whtAmount).toBe(EXPECTED.payment.whtAmount);
  });

  test('Test 4: Reports (no 100x bug)', async ({ page }) => {
    console.log('\n=== Test 4: Reports 100x Bug Check ===\n');

    // Create some test data first
    await page.click('text=ใบกำกับภาษี');
    await page.click('button:has-text("สร้างใบกำกับภาษี")');
    await page.selectOption('select[name="customerId"]', { label: 'บ.สยามพาเวอร์' });
    await page.fill('input[placeholder*="รายละเอียด"]', 'ทดสอบรายงาน');
    await page.fill('input[name="quantity"]', '1');
    await page.fill('input[name="unitPrice"]', '10000');
    await page.waitForTimeout(500);
    await page.click('button:has-text("บันทึก")');
    await page.waitForTimeout(2000);

    // Run VAT report
    await page.click('text=รายงาน/ภาษี');
    await page.click('text=VAT Report');
    await page.waitForTimeout(2000);

    // Get report content
    const reportText = await page.textContent('[data-testid="vat-report-table"]');

    // Query database for comparison
    const dbVatTotal = await prisma.invoice.aggregate({
      where: { deletedAt: null },
      _sum: { vatAmount: true },
    });

    const expectedDisplay = `฿${(dbVatTotal._sum.vatAmount! / 100).toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

    console.log('DB VAT total (Satang):', dbVatTotal._sum.vatAmount);
    console.log('Expected display:', expectedDisplay);
    console.log('Report contains:', reportText?.substring(0, 100));

    // Check for 100x bug
    const has100xBug = reportText?.includes('฿107,000'); // Should be ฿1,070.00
    const has0Bug = reportText?.includes('฿0.00');

    const results = {
      'No 100x bug': {
        expected: false,
        actual: has100xBug,
        pass: !has100xBug,
      },
      'No 0.00 bug': {
        expected: false,
        actual: has0Bug,
        pass: !has0Bug,
      },
      'Shows correct format': {
        expected: expectedDisplay.substring(0, 10),
        actual: reportText?.substring(0, 10),
        pass: reportText?.includes('฿'),
      },
    };

    console.log('\n📊 Test Results:');
    for (const [field, result] of Object.entries(results)) {
      const status = result.pass ? '✅' : '❌';
      console.log(`${status} ${field}`);
      console.log(`   Expected: ${result.expected}`);
      console.log(`   Actual: ${result.actual}`);
    }

    expect(has100xBug).toBe(false);
    expect(has0Bug).toBe(false);
    expect(reportText).toContain('฿');
  });

  test('Test 5: Dashboard (no 0.00 bug)', async ({ page }) => {
    console.log('\n=== Test 5: Dashboard 0.00 Bug Check ===\n');

    // Navigate to dashboard
    await page.click('text=Dashboard');
    await page.waitForTimeout(1000);

    // Get AR total
    const arTotalText = await page.textContent('[data-testid="ar-total"]');

    // Query database
    const dbArTotal = await prisma.invoice.aggregate({
      where: {
        deletedAt: null,
        status: { in: ['DRAFT', 'ISSUED'] },
      },
      _sum: { totalAmount: true },
    });

    const expectedAr = `฿${(dbArTotal._sum.totalAmount! / 100).toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

    console.log('DB AR total (Satang):', dbArTotal._sum.totalAmount);
    console.log('Expected display:', expectedAr);
    console.log('Actual display:', arTotalText);

    // Check for 0.00 bug
    const has0Bug = arTotalText === '฿0.00' || arTotalText === '0.00';

    const results = {
      'AR not 0.00': {
        expected: true,
        actual: !has0Bug,
        pass: !has0Bug,
      },
      'AR has Baht symbol': {
        expected: true,
        actual: arTotalText?.includes('฿'),
        pass: arTotalText?.includes('฿'),
      },
    };

    console.log('\n📊 Test Results:');
    for (const [field, result] of Object.entries(results)) {
      const status = result.pass ? '✅' : '❌';
      console.log(`${status} ${field}`);
      console.log(`   Expected: ${result.expected}`);
      console.log(`   Actual: ${result.actual}`);
    }

    expect(has0Bug).toBe(false);
    expect(arTotalText).toContain('฿');
  });

  test('Test 6: Purchase Order Float→Int migration', async ({ page }) => {
    console.log('\n=== Test 6: PO Float→Int Migration ===\n');

    // Navigate to PO
    await page.click('text=ซื้อ');
    await page.click('text=ใบสั่งซื้อ');
    await page.click('button:has-text("สร้างใบสั่งซื้อ")');
    await page.waitForTimeout(500);

    // Fill PO form with decimal
    await page.selectOption('select[name="vendorId"]', { label: 'บ.มิตรภาพ' });
    await page.fill('input[placeholder*="รายละเอียด"]', 'กระดาษ A4');
    await page.fill('input[name="quantity"]', '100');
    await page.fill('input[name="unitPrice"]', '2.50'); // Decimal input
    await page.waitForTimeout(500);

    // Get UI calculated amount
    const uiAmount = await page.textContent('[data-testid="line-amount"]');
    console.log('UI Line Amount:', uiAmount);

    // Submit
    await page.click('button:has-text("บันทึก")');
    await page.waitForTimeout(2000);

    // Query database
    const poLine = await prisma.purchaseOrderLine.findFirst({
      include: { order: true },
    });

    expect(poLine).toBeTruthy();

    // Verify storage as Int
    const results = {
      'unitPrice is INTEGER': {
        expected: 'number',
        actual: typeof poLine!.unitPrice,
        pass: Number.isInteger(poLine!.unitPrice),
      },
      'unitPrice value (Satang)': {
        expected: 250, // 2.50 * 100
        actual: poLine!.unitPrice,
        pass: poLine!.unitPrice === 250,
      },
      'amount is INTEGER': {
        expected: 'number',
        actual: typeof poLine!.amount,
        pass: Number.isInteger(poLine!.amount),
      },
      'amount value (Satang)': {
        expected: 25000, // 100 * 250
        actual: poLine!.amount,
        pass: poLine!.amount === 25000,
      },
    };

    console.log('\n📊 Test Results:');
    for (const [field, result] of Object.entries(results)) {
      const status = result.pass ? '✅' : '❌';
      console.log(`${status} ${field}`);
      console.log(`   Expected: ${result.expected}`);
      console.log(`   Actual: ${result.actual}`);
    }

    // Assertions
    expect(Number.isInteger(poLine!.unitPrice)).toBe(true);
    expect(poLine!.unitPrice).toBe(250);
    expect(Number.isInteger(poLine!.amount)).toBe(true);
    expect(poLine!.amount).toBe(25000);
  });
});

test.afterAll(async () => {
  await prisma.$disconnect();
});
