import { test, expect } from '@playwright/test';
import { LoginPage } from '../../tests/pages/login.page';
import { PayrollPage } from '../../tests/pages/payroll.page';

test.describe('Payroll Module - Comprehensive Tests', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAs('ACCOUNTANT');
    await loginPage.verifyLoginSuccess();

    const payrollPage = new PayrollPage(page);
    await payrollPage.goto();
  });

  test('should create employee', async ({ page }) => {
    await page.click('button:has-text="พนักงาน")');

    await page.click('button:has-text("เพิ่มพนักงาน")');
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'Employee');
    await page.fill('input[name="employeeCode"]', 'EMP001');
    await page.fill('input[name="baseSalary"]', '30000');

    await page.click('button:has-text("บันทึก")');
    await page.waitForSelector('[data-sonner-toast]', { timeout: 5000 });
  });

  test('should edit employee', async ({ page }) => {
    await page.click('button:has-text("พนักงาน")');

    const firstEmployee = await page.locator('tbody tr').first();
    await firstEmployee.locator('button:has-text("แก้ไข")').click();

    await page.fill('input[name="baseSalary"]', '35000');
    await page.click('button:has-text("บันทึก")');
    await page.waitForSelector('[data-sonner-toast]', { timeout: 5000 });
  });

  test('should create payroll run', async ({ page }) => {
    await page.click('button:has-text("รอบคำนวณเงินเดือน")');

    await page.click('button:has-text("สร้างรอบเงินเดือน")');
    await page.selectOption('select[name="periodMonth"]', '3');
    await page.selectOption('select[name="periodYear"]', '2026');

    await page.click('button:has-text("คำนวณ")');
    await page.waitForTimeout(2000);

    await page.click('button:has-text("บันทึก")');
    await page.waitForSelector('[data-sonner-toast]', { timeout: 5000 });
  });

  test('should approve payroll run', async ({ page }) => {
    await page.click('button:has-text("รอบคำนวณเงินเดือน")');

    const draftPayroll = await page.locator('tr').filter({ hasText: 'DRAFT' }).first();

    if ((await draftPayroll.count()) > 0) {
      await draftPayroll.locator('button[title="จัดการ"]').click();

      // Approve payroll
      await page.click('button:has-text("อนุมัติ")');
      await page.waitForSelector('[data-sonner-toast]', { timeout: 10000 });

      // Verify status changed
      await expect(page.locator('text=APPROVED')).toBeVisible();
    }
  });
});
