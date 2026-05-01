/**
 * Payroll Workflow E2E Tests
 * Tests for employee payroll processing
 */

import { test, expect } from '@playwright/test';

test.describe('Payroll Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'admin@thaiaccounting.com');
    await page.fill('[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('create employee and process payroll', async ({ page }) => {
    // Navigate to payroll
    await page.click('text=พนักงานและเงินเดือน');
    await page.click('text=พนักงาน');

    // Create new employee
    await page.click('text=เพิ่มพนักงาน');
    await page.fill('[data-testid="employee-code"]', `EMP-${Date.now()}`);
    await page.fill('[data-testid="first-name"]', 'สมชาย');
    await page.fill('[data-testid="last-name"]', 'ใจดี');
    await page.fill('[data-testid="id-card"]', '1234567890123');
    await page.fill('[data-testid="start-date"]', '01/01/2567');
    await page.fill('[data-testid="base-salary"]', '25000');
    await page.click('button:has-text("บันทึก")');
    await page.waitForSelector('text=บันทึกสำเร็จ');

    // Create payroll run
    await page.click('text=เงินเดือน');
    await page.click('text=สร้างรอบเงินเดือน');
    await page.selectOption('[data-testid="period-month"]', '3');
    await page.fill('[data-testid="period-year"]', '2567');
    await page.fill('[data-testid="payment-date"]', '31/03/2567');
    await page.click('button:has-text("ถัดไป")');

    // Add employee to payroll
    await page.click('[data-testid="add-employee"]');
    await page.click('[data-testid="employee-option"]:has-text("สมชาย")');

    // Verify auto-calculated values
    const ssc = await page.locator('[data-testid="ssc-amount"]').textContent();
    expect(ssc).toContain('750'); // 5% of 15000 (capped)

    const tax = await page.locator('[data-testid="tax-amount"]').textContent();
    expect(tax).toBeTruthy();

    const netPay = await page.locator('[data-testid="net-pay"]').textContent();
    expect(netPay).toBeTruthy();

    // Save payroll
    await page.click('button:has-text("บันทึก")');
    await page.waitForSelector('text=บันทึกรอบเงินเดือนสำเร็จ');

    // Process payroll
    await page.click('button:has-text("ประมวลผล")');
    await page.waitForSelector('text=ประมวลผลสำเร็จ');

    // Post to GL
    await page.click('button:has-text("บันทึกบัญชี")');
    await page.waitForSelector('text=บันทึกบัญชีสำเร็จ');
  });

  test('calculate SSC correctly', async ({ page }) => {
    await page.click('text=พนักงานและเงินเดือน');
    await page.click('text=พนักงาน');

    // Create employee with high salary
    await page.click('text=เพิ่มพนักงาน');
    await page.fill('[data-testid="employee-code"]', `EMP-HIGH-${Date.now()}`);
    await page.fill('[data-testid="first-name"]', 'สมหญิง');
    await page.fill('[data-testid="last-name"]', 'รวยมาก');
    await page.fill('[data-testid="base-salary"]', '100000');
    await page.click('button:has-text("บันทึก")');
    await page.waitForSelector('text=บันทึกสำเร็จ');

    // Create payroll
    await page.click('text=เงินเดือน');
    await page.click('text=สร้างรอบเงินเดือน');
    await page.selectOption('[data-testid="period-month"]', '3');
    await page.fill('[data-testid="period-year"]', '2567');
    await page.click('button:has-text("ถัดไป")');

    // Add employee
    await page.click('[data-testid="add-employee"]');
    await page.click('[data-testid="employee-option"]:has-text("สมหญิง")');

    // Verify SSC is capped at 750
    const ssc = await page.locator('[data-testid="ssc-amount"]').textContent();
    expect(ssc).toContain('750'); // Not 5000

    // Cleanup
    await page.click('button:has-text("ยกเลิก")');
  });

  test('calculate PND1 tax correctly', async ({ page }) => {
    await page.click('text=พนักงานและเงินเดือน');
    await page.click('text=พนักงาน');

    // Test different salary levels
    const testCases = [
      { salary: 15000, expectedTax: 0 }, // Below threshold
      { salary: 30000, expectedTax: 250 }, // Low bracket
      { salary: 50000, expectedTax: 833 }, // Mid bracket (approx)
    ];

    for (const testCase of testCases) {
      // Create employee
      await page.click('text=เพิ่มพนักงาน');
      const code = `EMP-TAX-${Date.now()}-${testCase.salary}`;
      await page.fill('[data-testid="employee-code"]', code);
      await page.fill('[data-testid="first-name"]', 'พนักงาน');
      await page.fill('[data-testid="last-name"]', `${testCase.salary}`);
      await page.fill('[data-testid="base-salary"]', testCase.salary.toString());
      await page.click('button:has-text("บันทึก")');
      await page.waitForSelector('text=บันทึกสำเร็จ');

      // Quick calculate tax
      await page.click('text=คำนวณภาษี');
      await page.fill('[data-testid="calc-salary"]', testCase.salary.toString());
      await page.click('button:has-text("คำนวณ")');

      const tax = await page.locator('[data-testid="calculated-tax"]').textContent();
      const taxAmount = parseInt(tax?.replace(/[^0-9]/g, '') || '0');

      // Allow some tolerance for calculation differences
      expect(Math.abs(taxAmount - testCase.expectedTax)).toBeLessThan(50);

      // Close dialog
      await page.click('button:has-text("ปิด")');
    }
  });

  test('payslip generation', async ({ page }) => {
    await page.click('text=พนักงานและเงินเดือน');
    await page.click('text=เงินเดือน');

    // Find a processed payroll
    await page.click('table tbody tr:first-child');
    await page.waitForSelector('[data-testid="payroll-details"]');

    // Generate payslip
    await page.click('button:has-text("สลิปเงินเดือน")');
    await page.waitForSelector('[data-testid="payslip-preview"]');

    // Verify payslip content
    await page.waitForSelector('text=เงินเดือนประจำเดือน');
    await page.waitForSelector('text=รายรับ');
    await page.waitForSelector('text=รายหัก');
    await page.waitForSelector('text=เงินรับสุทธิ');

    // Download PDF
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("ดาวน์โหลด PDF")');
    await downloadPromise;
  });

  test('social security report', async ({ page }) => {
    await page.click('text=พนักงานและเงินเดือน');
    await page.click('text=รายงาน');

    // Generate SPS 1-10 form
    await page.click('text=รายงานประกันสังคม');
    await page.selectOption('[data-testid="report-month"]', '3');
    await page.fill('[data-testid="report-year"]', '2567');
    await page.click('button:has-text("สร้างรายงาน")');
    await page.waitForSelector('text=รายงานประกันสังคม');

    // Verify report structure
    await page.waitForSelector('text=แบบแสดงรายการส่งเงินสมทบ');
    await page.waitForSelector('text=สปส.1-10');
    await page.waitForSelector('th:has-text("เลขที่บัตร")');
    await page.waitForSelector('th:has-text("เงินเดือน")');
    await page.waitForSelector('th:has-text("เงินสมทบ")');
  });

  test('payroll reversal', async ({ page }) => {
    await page.click('text=พนักงานและเงินเดือน');
    await page.click('text=เงินเดือน');

    // Find a posted payroll
    await page.selectOption('[data-testid="status-filter"]', 'POSTED');
    await page.click('table tbody tr:first-child');
    await page.waitForSelector('[data-testid="payroll-details"]');

    // Reverse payroll
    await page.click('button:has-text("ยกเลิก")');
    await page.waitForSelector('[data-testid="reverse-dialog"]');
    await page.fill('[data-testid="reverse-reason"]', 'คำนวณผิดพลาด');
    await page.click('button:has-text("ยืนยัน")');
    await page.waitForSelector('text=ยกเลิกสำเร็จ');

    // Verify status changed
    const status = await page.locator('[data-testid="payroll-status"]').textContent();
    expect(status).toContain('CANCELLED');
  });
});
