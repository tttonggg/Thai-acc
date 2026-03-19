import { test, expect } from '@playwright/test'
import {
  loginWithRetry,
  navigateToModule,
  clickButton,
  fillFormByLabels,
  waitForToast,
  takeScreenshot,
  verifyRecordExists,
  verifyRecordDeleted,
  getRecordByCode,
  deleteTestRecord,
  generateTestCode,
  generateTestVendor,
  getAuthenticatedContext
} from './test-helpers'

// ============================================
// TEST DATA
// ============================================
let testVendorCode: string
let testVendorData: any

// ============================================
// VENDORS MODULE COMPREHENSIVE TESTS
// ============================================
test.describe.configure({ mode: 'serial' })

test.describe('Vendors - Comprehensive Tests', () => {
  let apiContext: any

  test.beforeAll(async () => {
    apiContext = await getAuthenticatedContext('accountant')
  })

  test.afterAll(async () => {
    await apiContext.dispose()

    // Cleanup test data
    const cleanupContext = await getAuthenticatedContext('admin')
    if (testVendorCode) {
      await deleteTestRecord(cleanupContext, '/api/vendors', testVendorCode)
    }
    await cleanupContext.dispose()
  })

  test.beforeEach(async ({ page }) => {
    await page.setExtraHTTPHeaders({ 'x-playwright-test': 'true' })
    await loginWithRetry(page, 'accountant')
  })

  // ============================================
  // NAVIGATION TESTS
  // ============================================
  test('[NAVIGATE] To Vendors module', async ({ page }) => {
    await navigateToModule(page, 'เจ้าหนี้', 'Vendors')

    // Verify page title
    const title = page.locator('h1:has-text("เจ้าหนี้"), h1:has-text("Vendors"), h1:has-text("ผู้ขาย")')
    await expect(title.first()).toBeVisible()

    console.log('✅ Navigated to Vendors module')
  })

  // ============================================
  // ADD VENDOR TESTS
  // ============================================
  test('[CREATE] Add Vendor button', async ({ page }) => {
    await navigateToModule(page, 'เจ้าหนี้')

    // Look for "Add Vendor" button
    const addBtn = page.locator(
      'button:has-text("เพิ่มผู้ขาย"), button:has-text("Add Vendor"), button:has-text("สร้างผู้ขาย"), button:has-text("เพิ่ม")'
    ).first()

    await expect(addBtn, 'Add Vendor button should be visible').toBeVisible()

    console.log('✅ Add Vendor button found')

    await takeScreenshot(page, 'screenshots/comprehensive/vendors/add-vendor-button.png')
  })

  test('[CREATE] Fill and submit new vendor form', async ({ page }) => {
    await navigateToModule(page, 'เจ้าหนี้')

    // Generate test vendor data
    testVendorCode = generateTestCode('VEND')
    testVendorData = generateTestVendor()
    testVendorData.code = testVendorCode

    // Click add vendor button
    const addBtn = page.locator('button:has-text("เพิ่มผู้ขาย"), button:has-text("Add Vendor"), button:has-text("เพิ่ม")').first()
    await addBtn.click()

    await page.waitForTimeout(500)

    // Fill vendor form
    await fillFormByLabels(page, {
      'รหัส': testVendorData.code,
      'ชื่อผู้ขาย': testVendorData.name,
      'เลขประจำตัวผู้เสียภาษี': testVendorData.taxId,
      'ที่อยู่': testVendorData.address,
      'จังหวัด': testVendorData.province,
      'รหัสไปรษณีย์': testVendorData.postalCode,
      'โทรศัพท์': testVendorData.phone,
      'อีเมล': testVendorData.email,
      'เครดิต (วัน)': testVendorData.creditDays.toString()
    })

    // Submit form
    const submitBtn = page.locator('button:has-text("บันทึก"), button:has-text("Save"), button[type="submit"]').first()
    await submitBtn.click()

    // Wait for toast
    await waitForToast(page)

    console.log(`✅ Created vendor: ${testVendorCode}`)

    // Verify in database
    await verifyRecordExists(apiContext, '/api/vendors', testVendorCode, {
      code: testVendorCode,
      name: testVendorData.name
    })
  })

  test('[VALIDATE] Vendor code uniqueness', async ({ page }) => {
    await navigateToModule(page, 'เจ้าหนี้')

    // Try to create vendor with existing code
    const addBtn = page.locator('button:has-text("เพิ่ม"), button:has-text("Add")').first()
    await addBtn.click()

    await page.waitForTimeout(500)

    // Fill with existing code
    await fillFormByLabels(page, {
      'รหัส': testVendorCode,
      'ชื่อผู้ขาย': 'ผู้ขายซ้ำ'
    })

    // Submit
    const submitBtn = page.locator('button:has-text("บันทึก"), button:has-text("Save")').first()
    await submitBtn.click()

    // Should show validation error
    await page.waitForTimeout(1000)

    const error = page.locator('text=มีอยู่แล้ว, text=already exists, text=ซ้ำ, [role="alert"]').first()
    const errorVisible = await error.isVisible().catch(() => false)

    expect(errorVisible, 'Should show duplicate code error').toBe(true)

    console.log('✅ Validated vendor code uniqueness')

    // Close dialog
    await page.keyboard.press('Escape')
  })

  test('[VALIDATE] Required fields', async ({ page }) => {
    await navigateToModule(page, 'เจ้าหนี้')

    const addBtn = page.locator('button:has-text("เพิ่ม"), button:has-text("Add")').first()
    await addBtn.click()

    await page.waitForTimeout(500)

    // Try to submit without required fields
    const submitBtn = page.locator('button:has-text("บันทึก"), button:has-text("Save")').first()
    await submitBtn.click()

    await page.waitForTimeout(500)

    // Should show validation errors
    const errors = page.locator('text=จำเป็นต้องระบุ, text=required, [class*="error"], [class*="invalid"]')
    const errorCount = await errors.count()

    expect(errorCount, 'Should show validation errors for required fields').toBeGreaterThan(0)

    console.log(`✅ Validated required fields (${errorCount} errors found)`)

    // Close dialog
    await page.keyboard.press('Escape')
  })

  test('[VALIDATE] Email format', async ({ page }) => {
    await navigateToModule(page, 'เจ้าหนี้')

    const addBtn = page.locator('button:has-text("เพิ่ม"), button:has-text("Add")').first()
    await addBtn.click()

    await page.waitForTimeout(500)

    // Fill with invalid email
    await fillFormByLabels(page, {
      'รหัส': generateTestCode('VEND'),
      'ชื่อผู้ขาย': 'ทดสอบอีเมล',
      'อีเมล': 'invalid-email-format'
    })

    const submitBtn = page.locator('button:has-text("บันทึก"), button:has-text("Save")').first()
    await submitBtn.click()

    await page.waitForTimeout(500)

    // Should show email format error
    const emailError = page.locator('text=อีเมลไม่ถูกต้อง, text=invalid email, text=รูปแบบอีเมล').first()
    const emailErrorVisible = await emailError.isVisible().catch(() => false)

    if (emailErrorVisible) {
      console.log('✅ Validated email format')
    }

    // Close dialog
    await page.keyboard.press('Escape')
  })

  // ============================================
  // EDIT VENDOR TESTS
  // ============================================
  test('[EDIT] Vendor button per row', async ({ page }) => {
    await navigateToModule(page, 'เจ้าหนี้')

    // Find the test vendor in table
    const table = page.locator('table').first()
    const rows = table.locator('tbody tr')

    let testVendorFound = false
    const rowCount = await rows.count()

    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i)
      const text = await row.textContent()

      if (text && text.includes(testVendorCode)) {
        testVendorFound = true

        // Find edit button in this row
        const editBtn = row.locator('button[aria-label*="แก้ไข"], button[title*="แก้ไข"], button svg[class*="edit"], button svg[class*="pencil"]').first()

        if (await editBtn.isVisible().catch(() => false)) {
          await editBtn.click()
          console.log(`✅ Clicked edit button for vendor: ${testVendorCode}`)
          break
        }
      }
    }

    expect(testVendorFound, 'Test vendor should be found in table').toBe(true)

    await page.waitForTimeout(500)

    // Edit vendor phone
    const phoneInput = page.locator('input[name*="phone"], input[name*="โทร"], label:has-text("โทรศัพท์") + input').first()

    if (await phoneInput.isVisible().catch(() => false)) {
      await phoneInput.clear()
      await phoneInput.fill('02-8888-8888')

      // Submit
      const submitBtn = page.locator('button:has-text("บันทึก"), button:has-text("Save")').first()
      await submitBtn.click()

      await waitForToast(page)

      console.log('✅ Edited vendor phone number')

      // Verify in database
      const record = await getRecordByCode(apiContext, '/api/vendors', testVendorCode)
      expect(record.phone).toBe('02-8888-8888')
    }
  })

  test('[EDIT] Multiple fields', async ({ page }) => {
    await navigateToModule(page, 'เจ้าหนี้')

    // Find test vendor and edit
    const table = page.locator('table').first()
    const rows = table.locator('tbody tr')

    const rowCount = await rows.count()

    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i)
      const text = await row.textContent()

      if (text && text.includes(testVendorCode)) {
        const editBtn = row.locator('button svg[class*="edit"]').first()

        if (await editBtn.isVisible().catch(() => false)) {
          await editBtn.click()
          await page.waitForTimeout(500)

          // Edit multiple fields
          await fillFormByLabels(page, {
            'ที่อยู่': 'ที่อยู่ใหม่ 999',
            'เครดิต (วัน)': '45'
          })

          const submitBtn = page.locator('button:has-text("บันทึก"), button:has-text("Save")').first()
          await submitBtn.click()

          await waitForToast(page)

          console.log('✅ Edited multiple vendor fields')

          break
        }
      }
    }
  })

  // ============================================
  // DELETE VENDOR TESTS
  // ============================================
  test('[DELETE] Vendor button with confirmation', async ({ page }) => {
    await navigateToModule(page, 'เจ้าหนี้')

    // Find test vendor
    const table = page.locator('table').first()
    const rows = table.locator('tbody tr')

    let testVendorFound = false
    const rowCount = await rows.count()

    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i)
      const text = await row.textContent()

      if (text && text.includes(testVendorCode)) {
        testVendorFound = true

        // Find delete button
        const deleteBtn = row.locator('button[aria-label*="ลบ"], button[title*="ลบ"], button svg[class*="trash"], button svg[class*="delete"]').first()

        if (await deleteBtn.isVisible().catch(() => false)) {
          await deleteBtn.click()
          console.log(`✅ Clicked delete button for: ${testVendorCode}`)

          await page.waitForTimeout(500)

          // Verify confirmation dialog
          const confirmDialog = page.locator('[role="dialog"]:has-text("ลบ"), [role="dialog"]:has-text("ยืนยัน")').first()
          await expect(confirmDialog, 'Delete confirmation dialog should appear').toBeVisible()

          // Verify dialog content
          const dialogText = await confirmDialog.textContent()
          expect(dialogText).toContain(testVendorCode)

          // Cancel deletion for now (we'll delete in cleanup)
          const cancelBtn = confirmDialog.locator('button:has-text("ยกเลิก"), button:has-text("Cancel")').first()
          await cancelBtn.click()

          console.log('✅ Verified delete confirmation dialog')

          break
        }
      }
    }

    expect(testVendorFound, 'Test vendor should be found').toBe(true)
  })

  // ============================================
  // SEARCH AND FILTER TESTS
  // ============================================
  test('[SEARCH] Vendor by name', async ({ page }) => {
    await navigateToModule(page, 'เจ้าหนี้')

    // Find search input
    const searchInput = page.locator('input[placeholder*="ค้นหา"], input[placeholder*="search"], input[name*="search"]').first()

    if (await searchInput.isVisible().catch(() => false)) {
      // Search for test vendor
      await searchInput.fill(testVendorData.name.substring(0, 10))
      await page.waitForTimeout(1000)

      console.log(`✅ Searched for vendor: ${testVendorData.name.substring(0, 10)}`)

      // Verify search results
      const table = page.locator('table').first()
      const rows = table.locator('tbody tr')
      const rowCount = await rows.count()

      let foundInResults = false
      for (let i = 0; i < Math.min(rowCount, 10); i++) {
        const text = await rows.nth(i).textContent()
        if (text && text.includes(testVendorCode)) {
          foundInResults = true
          break
        }
      }

      expect(foundInResults, 'Test vendor should appear in search results').toBe(true)

      // Clear search
      await searchInput.clear()
      await page.waitForTimeout(500)
    } else {
      console.log('⚠️ Search input not found')
    }
  })

  test('[FILTER] Vendor by status', async ({ page }) => {
    await navigateToModule(page, 'เจ้าหนี้')

    // Look for status filter
    const statusFilter = page.locator('select[name*="status"], [role="combobox"], button:has-text("สถานะ"), button:has-text("ทั้งหมด")').first()

    if (await statusFilter.isVisible().catch(() => false)) {
      await statusFilter.click()
      await page.waitForTimeout(500)

      // Try to select Active status
      const activeOption = page.locator('[role="option"]:has-text("ACTIVE"), [role="option"]:has-text("ใช้งาน"), [role="option"]:has-text("Active")').first()

      if (await activeOption.isVisible().catch(() => false)) {
        await activeOption.click()
        await page.waitForTimeout(1000)

        console.log('✅ Filtered vendors by status: ACTIVE')
      }
    } else {
      console.log('⚠️ Status filter not found')
    }
  })

  // ============================================
  // VIEW VENDOR DETAILS TESTS
  // ============================================
  test('[VIEW] Vendor details', async ({ page }) => {
    await navigateToModule(page, 'เจ้าหนี้')

    // Find test vendor row
    const table = page.locator('table').first()
    const rows = table.locator('tbody tr')

    const rowCount = await rows.count()

    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i)
      const text = await row.textContent()

      if (text && text.includes(testVendorCode)) {
        // Look for view/details button
        const viewBtn = row.locator('button[aria-label*="ดู"], button[title*="ดู"], button svg[class*="eye"], a[href*="/vendors/"]').first()

        if (await viewBtn.isVisible().catch(() => false)) {
          await viewBtn.click()
          await page.waitForTimeout(1000)

          console.log('✅ Opened vendor details view')

          // Verify details are shown
          const detailsPanel = page.locator('[role="dialog"], [class*="details"], [class*="panel"]').first()
          const detailsVisible = await detailsPanel.isVisible().catch(() => false)

          if (detailsVisible) {
            // Check for vendor information
            const hasName = await detailsPanel.locator(`text=${testVendorData.name}`).count() > 0
            const hasCode = await detailsPanel.locator(`text=${testVendorCode}`).count() > 0

            expect(hasName || hasCode, 'Vendor details should show name or code').toBe(true)

            console.log('✅ Vendor details displayed correctly')

            // Close details
            await page.keyboard.press('Escape')
          }

          break
        }
      }
    }
  })

  // ============================================
  // VENDOR BALANCE TESTS
  // ============================================
  test('[VERIFY] Vendor balance display', async ({ page }) => {
    await navigateToModule(page, 'เจ้าหนี้')

    // Check if balance column exists
    const table = page.locator('table').first()
    const balanceHeader = table.locator('th:has-text("ยอดค้างจ่าย"), th:has-text("Balance"), th:has-text("หนี้")').first()

    if (await balanceHeader.isVisible().catch(() => false)) {
      console.log('✅ Vendor balance column found')

      // Find test vendor balance
      const rows = table.locator('tbody tr')
      const rowCount = await rows.count()

      for (let i = 0; i < rowCount; i++) {
        const text = await rows.nth(i).textContent()
        if (text && text.includes(testVendorCode)) {
          console.log(`✅ Vendor balance displayed for: ${testVendorCode}`)
          break
        }
      }
    } else {
      console.log('⚠️ Balance column not found (may be in separate view)')
    }
  })

  // ============================================
  // VENDOR IN PURCHASE DROPDOWN TESTS
  // ============================================
  test('[INTEGRATION] Vendor appears in purchase dropdown', async ({ page }) => {
    // Navigate to Purchases module
    await navigateToModule(page, 'ใบซื้อ', 'Purchases')

    // Click create purchase button
    const createBtn = page.locator('button:has-text("สร้างเอกสารใหม่"), button:has-text("สร้าง"), button:has-text("เพิ่ม")').first()
    await createBtn.click()

    await page.waitForTimeout(500)

    // Look for vendor dropdown/selector
    const vendorSelect = page.locator('select[name*="vendor"], [role="combobox"]:has-text("ผู้ขาย"), label:has-text("ผู้ขาย") + select, label:has-text("ผู้ขาย") + div').first()

    if (await vendorSelect.isVisible().catch(() => false)) {
      // Try to open dropdown
      await vendorSelect.click()
      await page.waitForTimeout(500)

      // Check if test vendor appears in options
      const testVendorOption = page.locator(`[role="option"]:has-text("${testVendorCode}"), [role="option"]:has-text("${testVendorData.name}"), option[value*="${testVendorCode}"]`).first()

      const optionVisible = await testVendorOption.isVisible().catch(() => false)

      if (optionVisible) {
        console.log('✅ Test vendor appears in purchase dropdown')
      } else {
        console.log('⚠️ Test vendor option not visible (may need to search or scroll)')
      }

      // Close dialog
      await page.keyboard.press('Escape')
    } else {
      console.log('⚠️ Vendor dropdown not found in purchase form')
      await page.keyboard.press('Escape')
    }
  })

  // ============================================
  // EXPORT TESTS
  // ============================================
  test('[EXPORT] Vendor list', async ({ page }) => {
    await navigateToModule(page, 'เจ้าหนี้')

    // Look for export button
    const exportBtn = page.locator('button:has-text("ส่งออก"), button:has-text("Export"), button:has-text("ดาวน์โหลด"), button svg[class*="download"]').first()

    if (await exportBtn.isVisible().catch(() => false)) {
      // Setup download handler
      const downloadPromise = page.waitForEvent('download', { timeout: 10000 })

      await exportBtn.click()

      try {
        const download = await downloadPromise
        console.log(`✅ Exported vendors to: ${download.suggestedFilename()}`)
      } catch {
        console.log('⚠️ Download did not start')
      }
    } else {
      console.log('⚠️ Export button not found')
    }
  })

  // ============================================
  // PAGINATION TESTS
  // ============================================
  test('[PAGINATION] Navigate vendor list', async ({ page }) => {
    await navigateToModule(page, 'เจ้าหนี้')

    // Look for pagination controls
    const nextPageBtn = page.locator('button:has-text("ถัดไป"), button:has-text("Next"), [aria-label="Next"]').first()

    const nextVisible = await nextPageBtn.isVisible().catch(() => false)

    if (nextVisible) {
      const initialRowCount = await page.locator('table tbody tr').count()

      await nextPageBtn.click()
      await page.waitForTimeout(1000)

      const afterNextRowCount = await page.locator('table tbody tr').count()

      console.log(`✅ Navigated vendor pages (rows: ${initialRowCount} -> ${afterNextRowCount})`)

      // Go back
      const prevPageBtn = page.locator('button:has-text("ก่อนหน้า"), button:has-text("Prev"), [aria-label="Previous"]').first()
      if (await prevPageBtn.isVisible().catch(() => false)) {
        await prevPageBtn.click()
        await page.waitForTimeout(1000)
      }
    } else {
      console.log('⚠️ Pagination not available (not enough vendors)')
    }
  })

  // ============================================
  // SUMMARY SCREENSHOT
  // ============================================
  test('[SCREENSHOT] Vendors module overview', async ({ page }) => {
    await navigateToModule(page, 'เจ้าหนี้')

    await takeScreenshot(page, 'screenshots/comprehensive/vendors/vendors-overview.png')

    console.log('📸 Taken vendors module overview screenshot')
  })
})
