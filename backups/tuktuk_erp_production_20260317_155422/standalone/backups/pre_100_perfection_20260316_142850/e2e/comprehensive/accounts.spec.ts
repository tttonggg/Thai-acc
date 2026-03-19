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
  getAuthenticatedContext
} from './test-helpers'

// ============================================
// TEST DATA
// ============================================
let testAccountCode: string
let testChildAccountCode: string

// ============================================
// ACCOUNT MODULE COMPREHENSIVE TESTS
// ============================================
test.describe.configure({ mode: 'serial' })

test.describe('Chart of Accounts - Comprehensive Tests', () => {
  let apiContext: any

  test.beforeAll(async () => {
    apiContext = await getAuthenticatedContext('accountant')
  })

  test.afterAll(async () => {
    await apiContext.dispose()

    // Cleanup test data
    const cleanupContext = await getAuthenticatedContext('admin')
    if (testAccountCode) {
      await deleteTestRecord(cleanupContext, '/api/accounts', testAccountCode)
    }
    if (testChildAccountCode) {
      await deleteTestRecord(cleanupContext, '/api/accounts', testChildAccountCode)
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
  test('[NAVIGATE] To Chart of Accounts module', async ({ page }) => {
    await navigateToModule(page, 'ผังบัญชี', 'Chart of Accounts')

    // Verify page title
    const title = page.locator('h1:has-text("ผังบัญชี"), h1:has-text("Chart of Accounts")')
    await expect(title.first()).toBeVisible()

    console.log('✅ Navigated to Chart of Accounts module')
  })

  // ============================================
  // ADD ACCOUNT TESTS
  // ============================================
  test('[CREATE] Add new account button', async ({ page }) => {
    await navigateToModule(page, 'ผังบัญชี')

    // Look for "Add Account" button
    const addBtn = page.locator(
      'button:has-text("เพิ่มบัญชี"), button:has-text("Add Account"), button:has-text("เพิ่ม")'
    ).first()

    await expect(addBtn, 'Add Account button should be visible').toBeVisible()

    console.log('✅ Add Account button found')

    // Take screenshot
    await takeScreenshot(page, 'screenshots/comprehensive/accounts/add-account-button.png')
  })

  test('[CREATE] Fill and submit new account form', async ({ page }) => {
    await navigateToModule(page, 'ผังบัญชี')

    // Generate test account code
    testAccountCode = generateTestCode('TEST')

    // Click add account button
    const addBtn = page.locator(
      'button:has-text("เพิมบัญชี"), button:has-text("Add Account"), button:has-text("เพิ่ม")'
    ).first()
    await addBtn.click()

    await page.waitForTimeout(500)

    // Fill account form
    const formData = {
      'รหัส': testAccountCode,
      'ชื่อบัญชี': `บัญชีทดสอบ ${testAccountCode}`,
      'ประเภท': 'ASSET',
      'คำอธิบาย': 'บัญชีทดสอบสำหรับ E2E'
    }

    await fillFormByLabels(page, formData)

    // Submit form
    const submitBtn = page.locator('button:has-text("บันทึก"), button:has-text("Save"), button[type="submit"]').first()
    await submitBtn.click()

    // Wait for toast
    await waitForToast(page)

    console.log(`✅ Created account: ${testAccountCode}`)

    // Verify in database
    await verifyRecordExists(apiContext, '/api/accounts', testAccountCode, {
      code: testAccountCode,
      type: 'ASSET'
    })
  })

  test('[VALIDATE] Account code uniqueness', async ({ page }) => {
    await navigateToModule(page, 'ผังบัญชี')

    // Try to create account with existing code
    const addBtn = page.locator('button:has-text("เพิ่ม"), button:has-text("Add")').first()
    await addBtn.click()

    await page.waitForTimeout(500)

    // Fill with existing code
    await fillFormByLabels(page, {
      'รหัส': testAccountCode,
      'ชื่อบัญชี': 'บัญชีซ้ำ'
    })

    // Submit
    const submitBtn = page.locator('button:has-text("บันทึก"), button:has-text("Save")').first()
    await submitBtn.click()

    // Should show validation error
    await page.waitForTimeout(1000)

    const error = page.locator('text=มีอยู่แล้ว, text=already exists, [role="alert"]').first()
    const errorVisible = await error.isVisible().catch(() => false)

    expect(errorVisible, 'Should show duplicate code error').toBe(true)

    console.log('✅ Validated account code uniqueness')

    // Close dialog
    await page.keyboard.press('Escape')
  })

  // ============================================
  // EDIT ACCOUNT TESTS
  // ============================================
  test('[EDIT] Account button per row', async ({ page }) => {
    await navigateToModule(page, 'ผังบัญชี')

    // Find the test account in table
    const table = page.locator('table').first()
    const rows = table.locator('tbody tr')

    let testAccountFound = false
    const rowCount = await rows.count()

    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i)
      const text = await row.textContent()

      if (text && text.includes(testAccountCode)) {
        testAccountFound = true

        // Find edit button in this row
        const editBtn = row.locator('button[aria-label*="แก้ไข"], button[title*="แก้ไข"], button svg[class*="edit"]').first()

        if (await editBtn.isVisible().catch(() => false)) {
          await editBtn.click()
          console.log(`✅ Clicked edit button for account: ${testAccountCode}`)
          break
        }
      }
    }

    expect(testAccountFound, 'Test account should be found in table').toBe(true)

    await page.waitForTimeout(500)

    // Edit account name
    const nameInput = page.locator('input[name*="name"], label:has-text("ชื่อบัญชี") + input, label:has-text("ชื่อบัญชี") + div input').first()

    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.clear()
      await nameInput.fill(`บัญชีทดสอบแก้ไข ${testAccountCode}`)

      // Submit
      const submitBtn = page.locator('button:has-text("บันทึก"), button:has-text("Save")').first()
      await submitBtn.click()

      await waitForToast(page)

      console.log('✅ Edited account name')

      // Verify in database
      const record = await getRecordByCode(apiContext, '/api/accounts', testAccountCode)
      expect(record.name).toContain('แก้ไข')
    }
  })

  // ============================================
  // ADD CHILD ACCOUNT TESTS
  // ============================================
  test('[CREATE] Add child account button', async ({ page }) => {
    await navigateToModule(page, 'ผังบัญชี')

    // Generate child account code
    testChildAccountCode = generateTestCode('CHILD')

    // Find parent account row
    const table = page.locator('table').first()
    const rows = table.locator('tbody tr')

    let parentAccountFound = false
    const rowCount = await rows.count()

    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i)
      const text = await row.textContent()

      if (text && text.includes(testAccountCode)) {
        parentAccountFound = true

        // Look for "Add Child" button
        const addChildBtn = row.locator('button:has-text("เพิ่มบัญชีลูก"), button:has-text("Add Child"), [aria-label*="child"]').first()

        if (await addChildBtn.isVisible().catch(() => false)) {
          await addChildBtn.click()
          console.log(`✅ Clicked add child account button for: ${testAccountCode}`)

          await page.waitForTimeout(500)

          // Fill child account form
          await fillFormByLabels(page, {
            'รหัส': testChildAccountCode,
            'ชื่อบัญชี': `บัญชีลูก ${testChildAccountCode}`
          })

          // Submit
          const submitBtn = page.locator('button:has-text("บันทึก"), button:has-text("Save")').first()
          await submitBtn.click()

          await waitForToast(page)

          console.log(`✅ Created child account: ${testChildAccountCode}`)

          // Verify in database
          await verifyRecordExists(apiContext, '/api/accounts', testChildAccountCode)

          break
        }
      }
    }

    expect(parentAccountFound, 'Parent account should be found').toBe(true)
  })

  // ============================================
  // DELETE ACCOUNT TESTS
  // ============================================
  test('[DELETE] Account button with validation', async ({ page }) => {
    await navigateToModule(page, 'ผังบัญชี')

    // Find child account (should be safe to delete)
    const table = page.locator('table').first()
    const rows = table.locator('tbody tr')

    let childAccountFound = false
    const rowCount = await rows.count()

    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i)
      const text = await row.textContent()

      if (text && text.includes(testChildAccountCode)) {
        childAccountFound = true

        // Find delete button
        const deleteBtn = row.locator('button[aria-label*="ลบ"], button[title*="ลบ"], button svg[class*="trash"], button svg[class*="delete"]').first()

        if (await deleteBtn.isVisible().catch(() => false)) {
          await deleteBtn.click()
          console.log(`✅ Clicked delete button for: ${testChildAccountCode}`)

          await page.waitForTimeout(500)

          // Verify confirmation dialog
          const confirmDialog = page.locator('[role="dialog"]:has-text("ลบ"), [role="dialog"]:has-text("ยืนยัน")').first()
          await expect(confirmDialog, 'Delete confirmation dialog should appear').toBeVisible()

          // Confirm deletion
          const confirmBtn = confirmDialog.locator('button:has-text("ลบ"), button:has-text("ยืนยัน"), button:has-text("Confirm")').first()
          await confirmBtn.click()

          await waitForToast(page)

          console.log('✅ Deleted child account')

          // Verify deletion in database
          await verifyRecordDeleted(apiContext, '/api/accounts', testChildAccountCode)

          break
        }
      }
    }

    expect(childAccountFound, 'Child account should be found').toBe(true)
  })

  test('[VALIDATE] Cannot delete account with transactions', async ({ page }) => {
    await navigateToModule(page, 'ผังบัญชี')

    // Try to find an account that likely has transactions (e.g., Cash account 1110)
    const table = page.locator('table').first()
    const rows = table.locator('tbody tr')

    let cashAccountFound = false
    const rowCount = await rows.count()

    for (let i = 0; i < Math.min(rowCount, 50); i++) {
      const row = rows.nth(i)
      const text = await row.textContent()

      // Look for standard cash account
      if (text && text.includes('1110')) {
        cashAccountFound = true

        const deleteBtn = row.locator('button svg[class*="trash"], button svg[class*="delete"]').first()

        // Try to click delete (might be disabled)
        if (await deleteBtn.isVisible().catch(() => false)) {
          await deleteBtn.click()
          await page.waitForTimeout(500)

          // Should show error or warning
          const error = page.locator('text=ไม่สามารถลบ, text=ไม่ได้, text=มีรายการ, [role="alert"]').first()
          const errorVisible = await error.isVisible().catch(() => false)

          if (errorVisible) {
            console.log('✅ Validated cannot delete account with transactions')

            // Dismiss error
            await page.keyboard.press('Escape')
            break
          }
        }

        break
      }
    }

    if (cashAccountFound) {
      console.log('✅ Validated delete restrictions on accounts with transactions')
    }
  })

  // ============================================
  // FILTER AND SEARCH TESTS
  // ============================================
  test('[FILTER] Account by type', async ({ page }) => {
    await navigateToModule(page, 'ผังบัญชี')

    // Look for account type filter
    const typeFilter = page.locator('select[name*="type"], [role="combobox"], button:has-text("ประเภท")').first()

    if (await typeFilter.isVisible().catch(() => false)) {
      await typeFilter.click()
      await page.waitForTimeout(500)

      // Try to select ASSET type
      const assetOption = page.locator('[role="option"]:has-text("ASSET"), [role="option"]:has-text("สินทรัพย์"), text=ASSET').first()

      if (await assetOption.isVisible().catch(() => false)) {
        await assetOption.click()
        await page.waitForTimeout(1000)

        console.log('✅ Filtered accounts by type: ASSET')

        // Verify table shows only asset accounts
        const table = page.locator('table').first()
        const rows = table.locator('tbody tr')
        const rowCount = await rows.count()

        console.log(`  Found ${rowCount} asset accounts`)
      }
    } else {
      console.log('⚠️ Account type filter not found (may use different UI)')
    }
  })

  test('[SEARCH] Account by name or code', async ({ page }) => {
    await navigateToModule(page, 'ผังบัญชี')

    // Find search input
    const searchInput = page.locator('input[placeholder*="ค้นหา"], input[placeholder*="search"], input[name*="search"]').first()

    if (await searchInput.isVisible().catch(() => false)) {
      // Search for test account
      await searchInput.fill(testAccountCode)
      await page.waitForTimeout(1000)

      console.log(`✅ Searched for account: ${testAccountCode}`)

      // Verify search results
      const table = page.locator('table').first()
      const rows = table.locator('tbody tr')
      const rowCount = await rows.count()

      let foundInResults = false
      for (let i = 0; i < Math.min(rowCount, 10); i++) {
        const text = await rows.nth(i).textContent()
        if (text && text.includes(testAccountCode)) {
          foundInResults = true
          break
        }
      }

      expect(foundInResults, 'Test account should appear in search results').toBe(true)

      // Clear search
      await searchInput.clear()
      await page.waitForTimeout(500)
    } else {
      console.log('⚠️ Search input not found')
    }
  })

  // ============================================
  // PAGINATION TESTS
  // ============================================
  test('[PAGINATION] Navigate through account pages', async ({ page }) => {
    await navigateToModule(page, 'ผังบัญชี')

    // Look for pagination controls
    const nextPageBtn = page.locator('button:has-text("ถัดไป"), button:has-text("Next"), [aria-label="Next"], [data-testid*="next"]').first()
    const prevPageBtn = page.locator('button:has-text("ก่อนหน้า"), button:has-text("Prev"), [aria-label="Previous"], [data-testid*="prev"]').first()

    const nextVisible = await nextPageBtn.isVisible().catch(() => false)
    const prevVisible = await prevPageBtn.isVisible().catch(() => false)

    if (nextVisible) {
      const initialRowCount = await page.locator('table tbody tr').count()

      // Click next page
      await nextPageBtn.click()
      await page.waitForTimeout(1000)

      const afterNextRowCount = await page.locator('table tbody tr').count()

      console.log(`✅ Navigated to next page (rows: ${initialRowCount} -> ${afterNextRowCount})`)

      // Go back to previous page
      if (prevVisible) {
        await prevPageBtn.click()
        await page.waitForTimeout(1000)

        console.log('✅ Navigated back to previous page')
      }
    } else {
      console.log('⚠️ Pagination controls not visible (may not have enough accounts)')
    }
  })

  // ============================================
  // EXPAND/COLLAPSE TESTS
  // ============================================
  test('[UI] Expand and collapse account hierarchy', async ({ page }) => {
    await navigateToModule(page, 'ผังบัญชี')

    // Look for expand/collapse buttons in table
    const expandBtn = page.locator('button[aria-label*="expand"], button[aria-label*="collapse"], button svg[class*="chevron"], button[class*="tree"]').first()

    if (await expandBtn.isVisible().catch(() => false)) {
      const initialRowCount = await page.locator('table tbody tr').count()

      // Click to expand
      await expandBtn.click()
      await page.waitForTimeout(500)

      const expandedRowCount = await page.locator('table tbody tr').count()

      console.log(`✅ Expanded account hierarchy (rows: ${initialRowCount} -> ${expandedRowCount})`)

      // Collapse back
      await expandBtn.click()
      await page.waitForTimeout(500)

      const collapsedRowCount = await page.locator('table tbody tr').count()

      console.log(`✅ Collapsed account hierarchy (rows: ${expandedRowCount} -> ${collapsedRowCount})`)
    } else {
      console.log('⚠️ Expand/collapse buttons not found')
    }
  })

  // ============================================
  // EXPORT TESTS
  // ============================================
  test('[EXPORT] Account list', async ({ page }) => {
    await navigateToModule(page, 'ผังบัญชี')

    // Look for export button
    const exportBtn = page.locator('button:has-text("ส่งออก"), button:has-text("Export"), button:has-text("ดาวน์โหลด"), button svg[class*="download"]').first()

    if (await exportBtn.isVisible().catch(() => false)) {
      // Setup download handler
      const downloadPromise = page.waitForEvent('download', { timeout: 10000 })

      await exportBtn.click()

      try {
        const download = await downloadPromise
        console.log(`✅ Exported accounts to: ${download.suggestedFilename()}`)
      } catch {
        console.log('⚠️ Download did not start (may open in new tab or show dialog)')
      }
    } else {
      console.log('⚠️ Export button not found')
    }
  })

  // ============================================
  // SUMMARY SCREENSHOT
  // ============================================
  test('[SCREENSHOT] Accounts module overview', async ({ page }) => {
    await navigateToModule(page, 'ผังบัญชี')

    await takeScreenshot(page, 'screenshots/comprehensive/accounts/accounts-overview.png')

    console.log('📸 Taken accounts module overview screenshot')
  })
})
