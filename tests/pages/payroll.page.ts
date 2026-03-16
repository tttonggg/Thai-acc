import { Page, Locator } from '@playwright/test';

/**
 * PayrollPage Object Model
 *
 * Handles employee and payroll management
 */
export class PayrollPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly employeesTab: Locator;
  readonly payrollTab: Locator;
  readonly newEmployeeButton: Locator;
  readonly newPayrollRunButton: Locator;
  readonly employeesTable: Locator;
  readonly payrollTable: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('h1:has-text("เงินเดือน"), h1:has-text("Payroll")');
    this.employeesTab = page.locator('button:has-text("พนักงาน"), tab:has-text("Employees")');
    this.payrollTab = page.locator('button:has-text("รอบจ่ายเงิน"), tab:has-text("Payroll")');
    this.newEmployeeButton = page.locator('button:has-text("สร้างพนักงาน")');
    this.newPayrollRunButton = page.locator('button:has-text("สร้างรอบจ่ายเงิน")');
    this.employeesTable = page.locator('table').first();
    this.payrollTable = page.locator('table').nth(1);
  }

  async goto() {
    const sidebar = this.page.locator('nav, aside').first();
    await sidebar.locator('text=เงินเดือน').click();
    await this.pageTitle.waitFor({ state: 'visible', timeout: 10000 });
  }

  async createEmployee(data: {
    firstName: string;
    lastName: string;
    firstNameEn: string;
    lastNameEn: string;
    citizenId: string;
    salary: number;
    startDate: string;
  }) {
    await this.employeesTab.click();
    await this.newEmployeeButton.click();

    await this.page.fill('input[name="firstName"]', data.firstName);
    await this.page.fill('input[name="lastName"]', data.lastName);
    await this.page.fill('input[name="firstNameEn"]', data.firstNameEn);
    await this.page.fill('input[name="lastNameEn"]', data.lastNameEn);
    await this.page.fill('input[name="citizenId"]', data.citizenId);
    await this.page.fill('input[name="salary"]', data.salary.toString());
    await this.page.fill('input[name="startDate"]', data.startDate);

    await this.page.locator('button:has-text("บันทึก")').click();
    await this.page.waitForSelector('text=บันทึกสำเร็จ', { timeout: 5000 });
  }

  async editEmployee(employeeName: string, updates: Partial<{ salary: number }>) {
    await this.employeesTab.click();
    const row = this.employeesTable.locator(`tr:has-text("${employeeName}")`);
    await row.locator('button:has-text("แก้ไข")').click();

    if (updates.salary) {
      await this.page.fill('input[name="salary"]', updates.salary.toString());
    }

    await this.page.locator('button:has-text("บันทึก")').click();
  }

  async createPayrollRun(month: string, year: string) {
    await this.payrollTab.click();
    await this.newPayrollRunButton.click();

    await this.page.locator('select[name="month"]').selectOption(month);
    await this.page.locator('select[name="year"]').selectOption(year);

    await this.page.locator('button:has-text("สร้าง")').click();
    await this.page.waitForSelector('text=สร้างรอบจ่ายเงินสำเร็จ', { timeout: 5000 });
  }

  async approvePayroll(payrollId: string) {
    await this.payrollTab.click();
    const row = this.payrollTable.locator(`tr:has-text("${payrollId}")`);
    await row.locator('button:has-text("อนุมัติ")').click();
    await this.page.locator('button:has-text("ยืนยัน")').click();
  }

  async verifyEmployeeInList(employeeName: string) {
    const row = this.employeesTable.locator(`tr:has-text("${employeeName}")`);
    await row.waitFor({ state: 'visible', timeout: 5000 });
  }
}
