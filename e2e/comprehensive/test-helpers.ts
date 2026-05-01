import { Page, request } from '@playwright/test'
import { request as apiRequest } from '@playwright/test'

// ============================================
// TEST CREDENTIALS
// ============================================
export const TEST_CREDENTIALS = {
  admin: {
    email: 'admin@thaiaccounting.com',
    password: 'admin123',
    role: 'ADMIN'
  },
  accountant: {
    email: 'accountant@thaiaccounting.com',
    password: 'acc123',
    role: 'ACCOUNTANT'
  },
  user: {
    email: 'user@thaiaccounting.com',
    password: 'user123',
    role: 'USER'
  },
  viewer: {
    email: 'viewer@thaiaccounting.com',
    password: 'viewer123',
    role: 'VIEWER'
  }
}

export const BASE_URL = 'https://acc.k56mm.uk'

// ============================================
// LOGIN HELPERS
// ============================================

/**
 * Login as a specific user role
 */
export async function loginAs(page: Page, role: keyof typeof TEST_CREDENTIALS) {
  const credentials = TEST_CREDENTIALS[role]

  // Clear cookies to ensure fresh login
  await page.context().clearCookies()

  // Navigate to login page
  await page.goto(BASE_URL)
  await page.waitForLoadState('networkidle')

  // Wait for form to be visible
  const emailInput = page.locator('input[type="email"]')
  const passwordInput = page.locator('input[type="password"]')
  const submitButton = page.locator('button[type="submit"]')

  await emailInput.waitFor({ state: 'visible', timeout: 10000 })
  await passwordInput.waitFor({ state: 'visible', timeout: 10000 })
  await submitButton.waitFor({ state: 'visible', timeout: 10000 })

  // Fill credentials
  await emailInput.fill(credentials.email)
  await passwordInput.fill(credentials.password)

  // Wait a moment for any validation
  await page.waitForTimeout(300)

  // Click submit button
  await submitButton.click()

  // Wait for navigation
  await page.waitForTimeout(4000)

  // Check for sidebar to confirm successful login
  const sidebar = page.locator('nav, aside').first()
  const sidebarVisible = await sidebar.isVisible().catch(() => false)

  if (!sidebarVisible) {
    // Take debug screenshot
    await page.screenshot({ path: 'test-results/login-debug.png', fullPage: true })

    // Check if still on login page with error
    const errorVisible = await page.locator('text=ไม่ถูกต้อง').isVisible().catch(() => false)

    if (errorVisible) {
      throw new Error('Login failed: Invalid credentials')
    }
    throw new Error('Login failed: Sidebar not visible')
  }

  console.log(`✅ Login successful as ${credentials.role}`)
  return sidebar
}

/**
 * Login with retry logic for flaky logins
 */
export async function loginWithRetry(page: Page, role: keyof typeof TEST_CREDENTIALS = 'admin', maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await loginAs(page, role)
      return
    } catch (error) {
      console.log(`Login attempt ${i + 1} failed, retrying...`)
      await page.waitForTimeout(2000)
    }
  }
  throw new Error('Login failed after all retries')
}

/**
 * Get authenticated API context
 */
export async function getAuthenticatedContext(role: keyof typeof TEST_CREDENTIALS = 'admin') {
  const credentials = TEST_CREDENTIALS[role]

  const context = await apiRequest.newContext({
    extraHTTPHeaders: {
      'x-playwright-test': 'true'
    }
  })

  // First get CSRF token
  const csrfResponse = await context.get(`${BASE_URL}/api/auth/csrf`)
  const { csrfToken } = await csrfResponse.json()

  // Login
  const loginResponse = await context.post(`${BASE_URL}/api/auth/callback/credentials`, {
    data: {
      email: credentials.email,
      password: credentials.password,
      csrfToken
    }
  })

  if (!loginResponse.ok()) {
    throw new Error('API Login failed')
  }

  return context
}

// ============================================
// NAVIGATION HELPERS
// ============================================

/**
 * Find and click sidebar button by Thai or English text
 * Handles collapsible sidebar groups and collapsed sidebar states
 */
export async function clickSidebarButton(page: Page, thaiText: string, englishText?: string) {
  // Try direct search first
  const selectors = [
    'aside button',
    'aside nav button',
  ]

  for (const selector of selectors) {
    const buttons = page.locator(selector)
    const count = await buttons.count()

    for (let i = 0; i < count; i++) {
      const text = await buttons.nth(i).textContent()
      if (text && (text.includes(thaiText) || (englishText && text.includes(englishText)))) {
        await buttons.nth(i).click()
        console.log(`✅ Clicked: ${thaiText}`)
        return true
      }
    }
  }

  // Check for collapsed sidebar and expand it
  const collapseBtn = page.locator('button:has-text("ย่อเมนู"), button[title="ขยายเมนู"]').first()
  if (await collapseBtn.isVisible().catch(() => false)) {
    await collapseBtn.click()
    await page.waitForTimeout(1000)
    // Retry after expanding
    for (const selector of selectors) {
      const buttons = page.locator(selector)
      const count = await buttons.count()
      for (let i = 0; i < count; i++) {
        const text = await buttons.nth(i).textContent()
        if (text && (text.includes(thaiText) || (englishText && text.includes(englishText)))) {
          await buttons.nth(i).click()
          console.log(`✅ Clicked after expand: ${thaiText}`)
          return true
        }
      }
    }
  }

  // Try expanding all visible group buttons that could contain sub-items
  const allVisibleButtons = page.locator('aside button')
  const btnCount = await allVisibleButtons.count()

  for (let j = 0; j < btnCount; j++) {
    const btn = allVisibleButtons.nth(j)
    const btnText = await btn.textContent() || ''
    // Skip non-group buttons
    if (btnText.includes('นักบัญชี') || btnText.includes('ทดสอบ') || btnText.includes('ปรับแต่ง') || btnText.includes('ขยาย') || btnText.includes('ย่อ')) {
      continue
    }
    // Click to expand - some groups might need expanding
    await btn.click()
    await page.waitForTimeout(600)
    // Check if target is now visible
    for (const selector of selectors) {
      const buttons = page.locator(selector)
      const cnt = await buttons.count()
      for (let i = 0; i < cnt; i++) {
        const text = await buttons.nth(i).textContent()
        if (text && (text.includes(thaiText) || (englishText && text.includes(englishText)))) {
          await buttons.nth(i).click()
          console.log(`✅ Clicked after expanding "${btnText}": ${thaiText}`)
          return true
        }
      }
    }
  }

  throw new Error(`Sidebar button not found: ${thaiText} / ${englishText}`)
}

/**
 * Navigate to a specific module
 * Uses direct URL navigation since Thai ACC is a SPA with module routes
 */
export async function navigateToModule(page: Page, moduleThai: string, moduleEnglish?: string) {
  // Build URL path from module name
  const moduleMap: Record<string, string> = {
    'ผังบัญชี': '/accounts',
    'Chart of Accounts': '/accounts',
    'ลูกหนี้': '/customers',
    'Customers': '/customers',
    'เจ้าหนี้': '/vendors',
    'Vendors': '/vendors',
    'สินค้าคงคลัง': '/inventory',
    'Inventory': '/inventory',
    'ธนาคาร': '/banking',
    'Banking': '/banking',
    'สินทรัพย์ถาวร': '/assets',
    'Fixed Assets': '/assets',
    'เงินเดือน': '/payroll',
    'Payroll': '/payroll',
    'กระเป๋าเงินสด': '/petty-cash',
    'Petty Cash': '/petty-cash',
    'ใบกำกับภาษี': '/invoices',
    'Invoices': '/invoices',
    'ใบจ่ายเงิน': '/payments',
    'Payments': '/payments',
    'บันทึกบัญชี': '/journal',
    'Journal': '/journal',
  }

  const path = moduleMap[moduleThai] || moduleMap[moduleEnglish || ''] || `/${moduleThai.toLowerCase().replace(/\s+/g, '-')}`

  console.log(`✅ Navigating directly to: ${path}`)

  // Use history.pushState to navigate (SPA pattern) instead of page.goto
  await page.evaluate((path) => {
    window.history.pushState({ path }, '', path)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, path)

  await page.waitForTimeout(3000)
  console.log(`Final URL: ${page.url()}`)

  console.log(`✅ Navigated to: ${moduleThai}`)
}

// ============================================
// DATABASE VERIFICATION HELPERS
// ============================================

/**
 * Verify record exists in database via API
 */
export async function verifyRecordExists(
  context: any,
  endpoint: string,
  code: string,
  expectedFields?: Record<string, any>
) {
  const response = await context.get(`${BASE_URL}${endpoint}`)
  const result = await response.json()

  if (!result.success) {
    throw new Error(`Failed to fetch records from ${endpoint}`)
  }

  const record = result.data.find((r: any) => r.code === code)

  if (!record) {
    throw new Error(`Record not found: ${code} in ${endpoint}`)
  }

  // Verify expected fields if provided
  if (expectedFields) {
    for (const [key, value] of Object.entries(expectedFields)) {
      if (record[key] !== value) {
        throw new Error(
          `Field verification failed for ${code}: ${key} expected ${value} but got ${record[key]}`
        )
      }
    }
  }

  console.log(`✅ Verified record exists: ${code}`)
  return record
}

/**
 * Verify record was deleted
 */
export async function verifyRecordDeleted(context: any, endpoint: string, code: string) {
  const response = await context.get(`${BASE_URL}${endpoint}`)
  const result = await response.json()

  if (!result.success) {
    throw new Error(`Failed to fetch records from ${endpoint}`)
  }

  const record = result.data.find((r: any) => r.code === code)

  if (record) {
    throw new Error(`Record should be deleted but still exists: ${code}`)
  }

  console.log(`✅ Verified record deleted: ${code}`)
}

/**
 * Get record by code
 */
export async function getRecordByCode(context: any, endpoint: string, code: string) {
  const response = await context.get(`${BASE_URL}${endpoint}`)
  const result = await response.json()

  if (!result.success) {
    throw new Error(`Failed to fetch records from ${endpoint}`)
  }

  const record = result.data.find((r: any) => r.code === code)

  if (!record) {
    throw new Error(`Record not found: ${code} in ${endpoint}`)
  }

  return record
}

/**
 * Count records
 */
export async function countRecords(context: any, endpoint: string) {
  const response = await context.get(`${BASE_URL}${endpoint}`)
  const result = await response.json()

  if (!result.success) {
    throw new Error(`Failed to fetch records from ${endpoint}`)
  }

  return result.data.length
}

// ============================================
// UI INTERACTION HELPERS
// ============================================

/**
 * Fill form fields by label
 */
export async function fillFormByLabels(page: Page, fields: Record<string, string>) {
  for (const [label, value] of Object.entries(fields)) {
    const labelElement = page.locator(`label:has-text("${label}")`).first()

    if (await labelElement.isVisible().catch(() => false)) {
      // Find input associated with label
      const inputId = await labelElement.getAttribute('for')
      let input: any

      if (inputId) {
        input = page.locator(`#${inputId}`)
      } else {
        // Try to find input near label
        input = labelElement.locator('..').locator('input, textarea, select').first()
      }

      if (await input.isVisible().catch(() => false)) {
        await input.fill(value)
        console.log(`  ✅ Filled field: ${label} = ${value}`)
      } else {
        console.log(`  ⚠️ Input not found for label: ${label}`)
      }
    } else {
      console.log(`  ⚠️ Label not found: ${label}`)
    }
  }
}

/**
 * Click button by text
 */
export async function clickButton(page: Page, text: string) {
  const button = page.locator(`button:has-text("${text}")`).first()

  if (!(await button.isVisible().catch(() => false))) {
    throw new Error(`Button not found: ${text}`)
  }

  await button.click()
  console.log(`✅ Clicked button: ${text}`)
  await page.waitForTimeout(500)
}

/**
 * Take screenshot with automatic directory creation
 */
export async function takeScreenshot(page: Page, path: string) {
  const fs = require('fs')
  const dir = path.substring(0, path.lastIndexOf('/'))

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  await page.screenshot({ path, fullPage: true })
  console.log(`📸 Screenshot saved: ${path}`)
}

/**
 * Wait for toast notification
 */
export async function waitForToast(page: Page, timeout = 3000) {
  await page.waitForTimeout(500)

  const toast = page.locator('[role="alert"], [class*="toast"], .toast').first()

  try {
    await toast.waitFor({ state: 'visible', timeout })
    const text = await toast.textContent()
    console.log(`🔔 Toast notification: ${text}`)
    return text
  } catch {
    console.log('⚠️ No toast notification found')
    return null
  }
}

/**
 * Verify table has data
 */
export async function verifyTableHasData(page: Page) {
  const table = page.locator('table').first()
  await expect(table, 'Table should be visible').toBeVisible({ timeout: 5000 })

  const rows = table.locator('tbody tr')
  const rowCount = await rows.count()

  if (rowCount === 0) {
    throw new Error('Table has no data')
  }

  console.log(`✅ Table has ${rowCount} rows`)
  return rowCount
}

// ============================================
// TEST DATA GENERATORS
// ============================================

/**
 * Generate unique test code with timestamp
 */
export function generateTestCode(prefix: string) {
  const timestamp = Date.now().toString().slice(-6)
  return `${prefix}${timestamp}`
}

/**
 * Generate test customer data
 */
export function generateTestCustomer() {
  const code = generateTestCode('CUST')
  return {
    code,
    name: `บริษัท ทดสอบ ${code} จำกัด`,
    nameEn: `Test Company ${code}`,
    taxId: `${Math.floor(Math.random() * 1000000000000)}`,
    address: `123 ถนนทดสอบ`,
    subDistrict: 'แขวงทดสอบ',
    district: 'เขตทดสอบ',
    province: 'กรุงเทพมหานคร',
    postalCode: '10100',
    phone: '02-111-1111',
    email: `test${code.toLowerCase()}@company.com`,
    creditLimit: 100000,
    creditDays: 30
  }
}

/**
 * Generate test vendor data
 */
export function generateTestVendor() {
  const code = generateTestCode('VEND')
  return {
    code,
    name: `บริษัท ผู้ขาย ${code} จำกัด`,
    nameEn: `Vendor Company ${code}`,
    taxId: `${Math.floor(Math.random() * 1000000000000)}`,
    address: `789 ถนนผู้ขาย`,
    province: 'กรุงเทพมหานคร',
    postalCode: '10300',
    phone: '02-222-2222',
    email: `vendor${code.toLowerCase()}@company.com`,
    creditDays: 30
  }
}

/**
 * Generate test product data
 */
export function generateTestProduct() {
  const code = generateTestCode('PROD')
  return {
    code,
    name: `สินค้าทดสอบ ${code}`,
    nameEn: `Test Product ${code}`,
    unit: 'ชิ้น',
    price: 1000,
    cost: 500,
    vatType: 'VAT7',
    incomeType: 'service',
    isInventoryItem: true
  }
}

// ============================================
// CLEANUP HELPERS
// ============================================

/**
 * Delete test record by code
 */
export async function deleteTestRecord(context: any, endpoint: string, code: string) {
  try {
    // First get the record to find its ID
    const response = await context.get(`${BASE_URL}${endpoint}`)
    const result = await response.json()

    if (result.success) {
      const record = result.data.find((r: any) => r.code === code)

      if (record) {
        await context.delete(`${BASE_URL}${endpoint}/${record.id}`)
        console.log(`🗑️ Deleted test record: ${code}`)
      }
    }
  } catch (error) {
    console.log(`⚠️ Failed to delete test record ${code}:`, error)
  }
}

/**
 * Clean up all test records with specific prefix
 */
export async function cleanupTestRecords(context: any, endpoint: string, prefix: string) {
  try {
    const response = await context.get(`${BASE_URL}${endpoint}`)
    const result = await response.json()

    if (result.success) {
      const testRecords = result.data.filter((r: any) => r.code && r.code.startsWith(prefix))

      for (const record of testRecords) {
        await context.delete(`${BASE_URL}${endpoint}/${record.id}`)
        console.log(`🗑️ Cleaned up test record: ${record.code}`)
      }
    }
  } catch (error) {
    console.log(`⚠️ Failed to cleanup test records with prefix ${prefix}:`, error)
  }
}
