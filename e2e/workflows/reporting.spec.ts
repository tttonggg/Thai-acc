/**
 * Reporting E2E Tests
 * Tests for financial reports and tax reports
 */

import { test, expect } from '@playwright/test'

test.describe('Reporting Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('[name="email"]', 'admin@thaiaccounting.com')
    await page.fill('[name="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')
  })

  test('generate and view trial balance', async ({ page }) => {
    await page.click('text=รายงาน')
    await page.click('text=งบทดลอง')

    // Set date range
    await page.fill('[data-testid="date-as-of"]', '31/03/2567')
    await page.click('button:has-text("สร้างรายงาน")')

    // Verify report loads
    await page.waitForSelector('table')
    await page.waitForSelector('th:has-text("รหัสบัญชี")')
    await page.waitForSelector('th:has-text("ชื่อบัญชี")')
    await page.waitForSelector('th:has-text("เดบิต")')
    await page.waitForSelector('th:has-text("เครดิต")')

    // Verify totals balance
    const totalDebit = await page.locator('[data-testid="total-debit"]').textContent()
    const totalCredit = await page.locator('[data-testid="total-credit"]').textContent()
    expect(totalDebit).toBe(totalCredit)

    // Export to Excel
    const downloadPromise = page.waitForEvent('download')
    await page.click('button:has-text("Excel")')
    const download = await downloadPromise
    expect(download.suggestedFilename()).toContain('.xlsx')
  })

  test('generate balance sheet', async ({ page }) => {
    await page.click('text=รายงาน')
    await page.click('text=งบดุล')

    // Set date
    await page.fill('[data-testid="date-as-of"]', '31/03/2567')
    await page.click('button:has-text("สร้างรายงาน")')

    // Verify sections
    await page.waitForSelector('text=สินทรัพย์')
    await page.waitForSelector('text=หนี้สิน')
    await page.waitForSelector('text=ส่วนของผู้ถือหุ้น')

    // Verify accounting equation: Assets = Liabilities + Equity
    const assets = await page.locator('[data-testid="total-assets"]').textContent()
    const liabilities = await page.locator('[data-testid="total-liabilities"]').textContent()
    const equity = await page.locator('[data-testid="total-equity"]').textContent()

    const assetsValue = parseFloat(assets?.replace(/[^0-9.-]/g, '') || '0')
    const liabilitiesValue = parseFloat(liabilities?.replace(/[^0-9.-]/g, '') || '0')
    const equityValue = parseFloat(equity?.replace(/[^0-9.-]/g, '') || '0')

    expect(Math.abs(assetsValue - (liabilitiesValue + equityValue))).toBeLessThan(0.01)
  })

  test('generate income statement', async ({ page }) => {
    await page.click('text=รายงาน')
    await page.click('text=งบกำไรขาดทุน')

    // Set date range
    await page.fill('[data-testid="date-from"]', '01/01/2567')
    await page.fill('[data-testid="date-to"]', '31/03/2567')
    await page.click('button:has-text("สร้างรายงาน")')

    // Verify sections
    await page.waitForSelector('text=รายได้')
    await page.waitForSelector('text=ค่าใช้จ่าย')
    await page.waitForSelector('text=กำไรขาดทุนสุทธิ')

    // Verify net income calculation
    const revenue = await page.locator('[data-testid="total-revenue"]').textContent()
    const expense = await page.locator('[data-testid="total-expense"]').textContent()
    const netIncome = await page.locator('[data-testid="net-income"]').textContent()

    const revenueValue = parseFloat(revenue?.replace(/[^0-9.-]/g, '') || '0')
    const expenseValue = parseFloat(expense?.replace(/[^0-9.-]/g, '') || '0')
    const netIncomeValue = parseFloat(netIncome?.replace(/[^0-9.-]/g, '') || '0')

    expect(Math.abs(netIncomeValue - (revenueValue - expenseValue))).toBeLessThan(0.01)
  })

  test('generate VAT report (ภพ.30)', async ({ page }) => {
    await page.click('text=รายงาน')
    await page.click('text=ภาษีมูลค่าเพิ่ม')

    // Select month
    await page.selectOption('[data-testid="tax-month"]', '3')
    await page.fill('[data-testid="tax-year"]', '2567')
    await page.click('button:has-text("สร้างรายงาน")')

    // Verify VAT report structure
    await page.waitForSelector('text=ภ.พ.30')
    await page.waitForSelector('th:has-text("ภาษีขาย")')
    await page.waitForSelector('th:has-text("ภาษีซื้อ")')
    await page.waitForSelector('th:has-text("ภาษีต้องชำระ")')

    // Verify calculations
    const outputVat = await page.locator('[data-testid="output-vat"]').textContent()
    const inputVat = await page.locator('[data-testid="input-vat"]').textContent()
    const netVat = await page.locator('[data-testid="net-vat"]').textContent()

    const outputValue = parseFloat(outputVat?.replace(/[^0-9.-]/g, '') || '0')
    const inputValue = parseFloat(inputVat?.replace(/[^0-9.-]/g, '') || '0')
    const netValue = parseFloat(netVat?.replace(/[^0-9.-]/g, '') || '0')

    expect(Math.abs(netValue - (outputValue - inputValue))).toBeLessThan(0.01)

    // Export PDF
    const downloadPromise = page.waitForEvent('download')
    await page.click('button:has-text("PDF")')
    await downloadPromise
  })

  test('generate withholding tax report (50 Tawi)', async ({ page }) => {
    await page.click('text=รายงาน')
    await page.click('text=ภาษีหัก ณ ที่จ่าย')

    // Select criteria
    await page.selectOption('[data-testid="report-type"]', '50_TAWI')
    await page.selectOption('[data-testid="tax-month"]', '3')
    await page.fill('[data-testid="tax-year"]', '2567')
    await page.click('button:has-text("สร้างรายงาน")')

    // Verify 50 Tawi report structure
    await page.waitForSelector('text=หนังสือรับรองการหักภาษี ณ ที่จ่าย')
    await page.waitForSelector('text=50 ทวิ')

    // Verify all WHT records included
    const rows = await page.locator('table tbody tr').count()
    expect(rows).toBeGreaterThan(0)

    // Export to PDF
    const downloadPromise = page.waitForEvent('download')
    await page.click('button:has-text("พิมพ์ 50 ทวิ")')
    await downloadPromise
  })

  test('generate PND1 report', async ({ page }) => {
    await page.click('text=รายงาน')
    await page.click('text=ภ.ง.ด.1')

    // Set month
    await page.selectOption('[data-testid="tax-month"]', '3')
    await page.fill('[data-testid="tax-year"]', '2567')
    await page.click('button:has-text("สร้างรายงาน")')

    // Verify PND1 structure
    await page.waitForSelector('text=ภ.ง.ด.1')
    await page.waitForSelector('th:has-text("เงินได้")')
    await page.waitForSelector('th:has-text("ภาษีที่หัก")')

    // Verify total
    const totalIncome = await page.locator('[data-testid="total-income"]').textContent()
    const totalTax = await page.locator('[data-testid="total-tax"]').textContent()

    expect(totalIncome).toBeTruthy()
    expect(totalTax).toBeTruthy()
  })

  test('generate PND53 report', async ({ page }) => {
    await page.click('text=รายงาน')
    await page.click('text=ภ.ง.ด.53')

    // Set month
    await page.selectOption('[data-testid="tax-month"]', '3')
    await page.fill('[data-testid="tax-year"]', '2567')
    await page.click('button:has-text("สร้างรายงาน")')

    // Verify PND53 structure
    await page.waitForSelector('text=ภ.ง.ด.53')
    await page.waitForSelector('th:has-text("เงินได้พึงประเมิน")')
    await page.waitForSelector('th:has-text("อัตราภาษี")')
  })

  test('general ledger report', async ({ page }) => {
    await page.click('text=รายงาน')
    await page.click('text=บัญชีแยกประเภท')

    // Select account
    await page.click('[data-testid="account-select"]')
    await page.click('[data-testid="account-option"]:first-child')

    // Set date range
    await page.fill('[data-testid="date-from"]', '01/01/2567')
    await page.fill('[data-testid="date-to"]', '31/03/2567')
    await page.click('button:has-text("สร้างรายงาน")')

    // Verify GL structure
    await page.waitForSelector('th:has-text("วันที่")')
    await page.waitForSelector('th:has-text("เลขที่เอกสาร")')
    await page.waitForSelector('th:has-text("รายการ")')
    await page.waitForSelector('th:has-text("เดบิต")')
    await page.waitForSelector('th:has-text("เครดิต")')
    await page.waitForSelector('th:has-text("ยอดคงเหลือ")')

    // Verify running balance
    const rows = await page.locator('table tbody tr').count()
    if (rows > 0) {
      const balance = await page.locator('table tbody tr:last-child td:last-child').textContent()
      expect(balance).toBeTruthy()
    }
  })

  test('customer aging report', async ({ page }) => {
    await page.click('text=รายงาน')
    await page.click('text=อายุลูกหนี้')

    // Set as of date
    await page.fill('[data-testid="date-as-of"]', '31/03/2567')
    await page.click('button:has-text("สร้างรายงาน")')

    // Verify aging structure
    await page.waitForSelector('th:has-text("ลูกค้า")')
    await page.waitForSelector('th:has-text("ปัจจุบัน")')
    await page.waitForSelector('th:has-text("30 วัน")')
    await page.waitForSelector('th:has-text("60 วัน")')
    await page.waitForSelector('th:has-text("90 วัน")')
    await page.waitForSelector('th:has-text("เกิน 90 วัน")')
    await page.waitForSelector('th:has-text("รวม")')

    // Verify totals row
    const total = await page.locator('[data-testid="grand-total"]').textContent()
    expect(total).toBeTruthy()
  })

  test('cash flow statement', async ({ page }) => {
    await page.click('text=รายงาน')
    await page.click('text=งบกระแสเงินสด')

    // Set period
    await page.fill('[data-testid="date-from"]', '01/01/2567')
    await page.fill('[data-testid="date-to"]', '31/03/2567')
    await page.click('button:has-text("สร้างรายงาน")')

    // Verify cash flow sections
    await page.waitForSelector('text=กิจกรรมดำเนินงาน')
    await page.waitForSelector('text=กิจกรรมลงทุน')
    await page.waitForSelector('text=กิจกรรมจัดหาเงิน')
    await page.waitForSelector('text=เงินสดสุทธิ')
  })
})
