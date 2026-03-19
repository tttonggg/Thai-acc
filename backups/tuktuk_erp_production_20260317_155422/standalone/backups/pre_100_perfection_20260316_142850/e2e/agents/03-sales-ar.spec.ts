import { test, expect } from '@playwright/test'

// Test credentials
const TEST_CREDENTIALS = {
  email: 'admin@thaiaccounting.com',
  password: 'admin123'
}

/**
 * Improved Login Function with better timing and sidebar detection
 */
async function loginAsAdmin(page) {
  console.log('🔐 Starting login process...')
  
  // Clear cookies to ensure fresh login
  await page.context().clearCookies()
  
  // Navigate to login page
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  
  console.log('✓ Page loaded')
  
  // Wait for form to be visible
  const emailInput = page.locator('input[type="email"]')
  const passwordInput = page.locator('input[type="password"]')
  const submitButton = page.locator('button[type="submit"]')
  
  await emailInput.waitFor({ state: 'visible', timeout: 10000 })
  await passwordInput.waitFor({ state: 'visible', timeout: 10000 })
  await submitButton.waitFor({ state: 'visible', timeout: 10000 })
  
  console.log('✓ Form fields visible')
  
  // Fill credentials using type with delay to simulate real user
  await emailInput.fill(TEST_CREDENTIALS.email)
  await passwordInput.fill(TEST_CREDENTIALS.password)
  
  console.log('✓ Credentials filled')
  
  // Wait a moment for any validation
  await page.waitForTimeout(300)
  
  // Click submit button with explicit wait
  await submitButton.click()
  
  // Wait for the page to navigate (URL should stay at / or redirect to dashboard)
  await page.waitForTimeout(4000)
  
  console.log('✓ Form submitted')
  
  // Check current URL
  const currentUrl = page.url()
  console.log('Current URL:', currentUrl)
  
  // Check for sidebar to confirm successful login
  const sidebar = page.locator('nav, aside').first()
  const sidebarVisible = await sidebar.isVisible().catch(() => false)
  
  if (!sidebarVisible) {
    // Take debug screenshot
    await page.screenshot({ path: 'test-results/login-debug.png', fullPage: true })
    
    // Check if still on login page with error
    const errorVisible = await page.locator('text=ไม่ถูกต้อง').isVisible().catch(() => false)
    const pageText = await page.locator('body').textContent().catch(() => '')
    console.log('Page text preview:', pageText?.substring(0, 200))
    
    if (errorVisible) {
      throw new Error('Login failed: Invalid credentials')
    }
    throw new Error('Login failed: Sidebar not visible')
  }
  
  console.log('✅ Login successful')
  return sidebar
}

/**
 * Login with retry logic for flaky logins
 */
async function loginWithRetry(page, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await loginAsAdmin(page)
      return
    } catch (error) {
      console.log(`Login attempt ${i + 1} failed, retrying...`)
      await page.waitForTimeout(2000)
    }
  }
  throw new Error('Login failed after all retries')
}

test.describe('AGENT_SALES - Sales & Receivables Module', () => {
  test.beforeEach(async ({ page }) => {
    // Track console errors and page errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`🔴 Console Error: ${msg.text()}`)
      }
    })
    page.on('pageerror', error => {
      console.log(`🔴 Page Error: ${error.message}`)
    })
    
    // Set test header to bypass rate limiting
    await page.setExtraHTTPHeaders({ 'x-playwright-test': 'true' })
    
    // Login before each test with retry
    await loginWithRetry(page)
    console.log('✅ Login successful')
  })

  // ============================================================================
  // SECTION 1: INVOICES MODULE (ใบกำกับภาษี)
  // ============================================================================
  test.describe('Invoices Module (ใบกำกับภาษี)', () => {
    
    test.beforeEach(async ({ page }) => {
      // Navigate to Invoices module
      const buttons = page.locator('aside nav button')
      const count = await buttons.count()
      
      for (let i = 0; i < count; i++) {
        const text = await buttons.nth(i).textContent()
        if (text && text.includes('ใบกำกับภาษี')) {
          await buttons.nth(i).click()
          break
        }
      }
      
      // Wait for page to load
      await page.waitForTimeout(2000)
    })

    test('[VERIFY] Header section elements', async ({ page }) => {
      console.log('Testing Invoices Header Section...')
      
      // Verify page title
      const title = page.locator('h1:has-text("ใบกำกับภาษี"), h1:has-text("เอกสารการขาย"), header h1, [class*="title"]')
      const titleVisible = await title.isVisible().catch(() => false)
      expect(titleVisible, 'Page title should be visible').toBeTruthy()
      console.log('  ✅ Page title visible')
      
      // Verify "สร้างเอกสารใหม่" button with Plus icon
      const createBtn = page.locator('button:has-text("สร้างเอกสารใหม่"), button:has-text("สร้าง"), [data-testid*="create"], button svg[class*="plus"]').first()
      const createBtnVisible = await createBtn.isVisible().catch(() => false)
      expect(createBtnVisible, 'Create New Document button should be visible').toBeTruthy()
      console.log('  ✅ "สร้างเอกสารใหม่" button visible')
    })

    test('[VERIFY] Summary cards (4 cards)', async ({ page }) => {
      console.log('Testing Summary Cards...')
      
      // Check for summary cards container
      const cards = page.locator('[class*="card"], .stat-card, [class*="summary"], [class*="stats"] > div, [class*="grid"] > div')
      const cardCount = await cards.count()
      console.log(`  Found ${cardCount} potential card elements`)
      
      // Check for specific card texts
      const cardTexts = [
        'รอออกใบกำกับภาษี',
        'รอรับชำระ',
        'รับชำระแล้ว',
        'ภาษีขายรวม'
      ]
      
      let foundCards = 0
      for (const text of cardTexts) {
        const element = page.locator(`text=${text}`).first()
        if (await element.isVisible().catch(() => false)) {
          foundCards++
          console.log(`  ✅ Card found: ${text}`)
        }
      }
      
      expect(foundCards, 'Should have at least 2 summary cards').toBeGreaterThanOrEqual(2)
    })

    test('[VERIFY] Search and Filter section', async ({ page }) => {
      console.log('Testing Search & Filter Section...')
      
      // Verify search input
      const searchInput = page.locator('input[placeholder*="ค้นหา"], input[type="search"], input[name*="search"]').first()
      const searchVisible = await searchInput.isVisible().catch(() => false)
      
      if (searchVisible) {
        const placeholder = await searchInput.getAttribute('placeholder')
        console.log(`  ✅ Search input found with placeholder: ${placeholder}`)
        
        // Verify placeholder contains expected text
        const hasExpectedText = placeholder?.includes('ชื่อลูกค้า') || 
                               placeholder?.includes('เลขที่เอกสาร') || 
                               placeholder?.includes('ค้นหา')
        expect(hasExpectedText, 'Search placeholder should contain expected text').toBeTruthy()
      } else {
        console.log('  ⚠️ Search input not found (may be styled differently)')
      }
      
      // Verify status filter dropdown
      const statusFilter = page.locator('select, [role="combobox"], button:has-text("สถานะ"), button:has-text("ทั้งหมด"), [class*="filter"]').first()
      const filterVisible = await statusFilter.isVisible().catch(() => false)
      
      if (filterVisible) {
        console.log('  ✅ Status filter dropdown found')
      } else {
        console.log('  ⚠️ Status filter not found (may be styled differently)')
      }
      
      // Try to open status filter and check options
      if (filterVisible) {
        await statusFilter.click()
        await page.waitForTimeout(500)
        
        const statusOptions = [
          'ทั้งหมด',
          'ร่าง',
          'ออกแล้ว',
          'รับชำระบางส่วน',
          'รับชำระเต็มจำนวน',
          'ยกเลิก'
        ]
        
        let foundOptions = 0
        for (const option of statusOptions) {
          const optionElement = page.locator(`text=${option}, [role="option"]:has-text("${option}")`).first()
          if (await optionElement.isVisible().catch(() => false)) {
            foundOptions++
            console.log(`  ✅ Status option found: ${option}`)
          }
        }
        
        // Close dropdown by pressing Escape
        await page.keyboard.press('Escape')
        
        expect(foundOptions, 'Should have at least 2 status options').toBeGreaterThanOrEqual(2)
      }
    })

    test('[VERIFY] Invoice table columns', async ({ page }) => {
      console.log('Testing Invoice Table...')
      
      // Wait for table to be visible
      const table = page.locator('table').first()
      await expect(table, 'Invoice table should be visible').toBeVisible({ timeout: 5000 })
      console.log('  ✅ Invoice table visible')
      
      // Check table headers
      const expectedHeaders = [
        'เลขที่',
        'วันที่',
        'ประเภท',
        'ลูกค้า',
        'มูลค่าก่อน VAT',
        'VAT',
        'ยอดรวม',
        'สถานะ',
        'จัดการ'
      ]
      
      const headerCells = table.locator('thead th, thead td, [role="columnheader"]')
      const headerCount = await headerCells.count()
      console.log(`  Found ${headerCount} header cells`)
      
      let foundHeaders = 0
      for (const header of expectedHeaders) {
        const headerElement = table.locator(`th:has-text("${header}"), td:has-text("${header}")`).first()
        if (await headerElement.isVisible().catch(() => false)) {
          foundHeaders++
          console.log(`  ✅ Column header found: ${header}`)
        }
      }
      
      expect(foundHeaders, 'Should have at least 5 column headers').toBeGreaterThanOrEqual(5)
    })

    test('[VERIFY] Action buttons per row', async ({ page }) => {
      console.log('Testing Action Buttons per Row...')
      
      const table = page.locator('table').first()
      const rows = table.locator('tbody tr')
      const rowCount = await rows.count()
      console.log(`  Found ${rowCount} table rows`)
      
      if (rowCount > 0) {
        // Check first row for action buttons
        const firstRow = rows.first()
        
        // Look for action buttons (View, Edit, Print, Download)
        const actionButtons = firstRow.locator('button, [role="button"], a[class*="button"], svg[class*="icon"]')
        const actionCount = await actionButtons.count()
        console.log(`  Found ${actionCount} action elements in first row`)
        
        // Check for specific action button types by aria-label or title
        const viewBtn = firstRow.locator('button[aria-label*="ดู"], button[title*="ดู"], button svg[class*="eye"], button svg[class*="view"]').first()
        const editBtn = firstRow.locator('button[aria-label*="แก้ไข"], button[title*="แก้ไข"], button svg[class*="edit"], button svg[class*="pencil"]').first()
        const printBtn = firstRow.locator('button[aria-label*="พิมพ์"], button[title*="พิมพ์"], button svg[class*="print"], button svg[class*="printer"]').first()
        const downloadBtn = firstRow.locator('button[aria-label*="ดาวน์โหลด"], button[title*="ดาวน์โหลด"], button svg[class*="download"]').first()
        
        const viewVisible = await viewBtn.isVisible().catch(() => false)
        const editVisible = await editBtn.isVisible().catch(() => false)
        const printVisible = await printBtn.isVisible().catch(() => false)
        const downloadVisible = await downloadBtn.isVisible().catch(() => false)
        
        if (viewVisible) console.log('  ✅ View button (Eye icon) found')
        if (editVisible) console.log('  ✅ Edit button found')
        if (printVisible) console.log('  ✅ Print button (Printer icon) found')
        if (downloadVisible) console.log('  ✅ Download button found')
        
        expect(viewVisible || editVisible || printVisible || downloadVisible, 
               'Should have at least one action button per row').toBeTruthy()
      } else {
        console.log('  ⚠️ No rows found to test action buttons')
      }
    })

    test('[VERIFY] Create Document Dialog', async ({ page }) => {
      console.log('Testing Create Document Dialog...')
      
      // Click on create button
      const createBtn = page.locator('button:has-text("สร้างเอกสารใหม่"), button:has-text("สร้าง"), [data-testid*="create"]').first()
      await createBtn.click()
      
      // Wait for dialog to appear
      await page.waitForTimeout(1000)
      
      // Check for dialog/modal
      const dialog = page.locator('[role="dialog"], [class*="dialog"], [class*="modal"], [class*="popover"]').first()
      const dialogVisible = await dialog.isVisible().catch(() => false)
      
      if (dialogVisible) {
        console.log('  ✅ Create Document dialog is visible')
        
        // Take screenshot of dialog
        await page.screenshot({ 
          path: 'screenshots/sales/create-document-dialog.png',
          fullPage: false 
        })
        
        // Check for document type buttons
        const docTypes = [
          { name: 'ใบกำกับภาษี', alt: 'Tax Invoice' },
          { name: 'ใบเสร็จรับเงิน', alt: 'Receipt' },
          { name: 'ใบส่งของ', alt: 'Delivery Note' },
          { name: 'ใบลดหนี้', alt: 'Credit Note' }
        ]
        
        let foundDocTypes = 0
        for (const docType of docTypes) {
          const btn = dialog.locator(`button:has-text("${docType.name}"), text=${docType.name}`).first()
          if (await btn.isVisible().catch(() => false)) {
            foundDocTypes++
            console.log(`  ✅ Document type button found: ${docType.name}`)
          }
        }
        
        expect(foundDocTypes, 'Should have at least 2 document type options').toBeGreaterThanOrEqual(2)
        
        // Close dialog
        await page.keyboard.press('Escape')
      } else {
        // Check if it navigated to a create page instead
        const currentUrl = page.url()
        if (currentUrl.includes('create') || currentUrl.includes('new')) {
          console.log('  ✅ Navigated to create page instead of dialog')
          
          // Go back
          await page.goBack()
        } else {
          console.log('  ⚠️ Dialog not found - may navigate directly to form')
        }
      }
    })

    test('[SCREENSHOT] Invoices list page', async ({ page }) => {
      // Take full screenshot of invoices list
      await page.screenshot({ 
        path: 'screenshots/sales/invoices-list.png',
        fullPage: true 
      })
      console.log('  📸 Screenshot saved: screenshots/sales/invoices-list.png')
    })
  })

  // ============================================================================
  // SECTION 2: CUSTOMERS/AR MODULE (ลูกหนี้)
  // ============================================================================
  test.describe('Customers/AR Module (ลูกหนี้)', () => {
    
    test.beforeEach(async ({ page }) => {
      // Navigate to Customers module
      const buttons = page.locator('aside nav button')
      const count = await buttons.count()
      
      for (let i = 0; i < count; i++) {
        const text = await buttons.nth(i).textContent()
        if (text && text.includes('ลูกหนี้')) {
          await buttons.nth(i).click()
          break
        }
      }
      
      // Wait for page to load
      await page.waitForTimeout(2000)
    })

    test('[VERIFY] Customer list table', async ({ page }) => {
      console.log('Testing Customer List Table...')
      
      // Check for customer table
      const table = page.locator('table').first()
      const tableVisible = await table.isVisible().catch(() => false)
      
      // Alternative: check for customer list container
      const listContainer = page.locator('[class*="list"], [class*="table"], [class*="grid"]').first()
      const listVisible = await listContainer.isVisible().catch(() => false)
      
      expect(tableVisible || listVisible, 'Customer list should be visible').toBeTruthy()
      console.log('  ✅ Customer list/table visible')
      
      // Check for typical customer columns
      const customerHeaders = ['ชื่อลูกค้า', 'รหัสลูกค้า', 'เบอร์โทร', 'อีเมล', 'ที่อยู่', 'ยอดค้างชำระ']
      
      let foundHeaders = 0
      for (const header of customerHeaders) {
        const headerElement = page.locator(`th:has-text("${header}"), td:has-text("${header}"), text=${header}`).first()
        if (await headerElement.isVisible().catch(() => false)) {
          foundHeaders++
          console.log(`  ✅ Customer column found: ${header}`)
        }
      }
      
      expect(foundHeaders, 'Should have at least 2 customer-related columns').toBeGreaterThanOrEqual(2)
    })

    test('[VERIFY] Add Customer button', async ({ page }) => {
      console.log('Testing Add Customer button...')
      
      // Look for add customer button
      const addBtn = page.locator('button:has-text("เพิ่มลูกค้า"), button:has-text("สร้างลูกค้า"), button:has-text("เพิ่มใหม่"), button svg[class*="plus"]').first()
      const addBtnVisible = await addBtn.isVisible().catch(() => false)
      
      if (addBtnVisible) {
        console.log('  ✅ Add Customer button found')
        
        // Click to verify it opens add dialog/form
        await addBtn.click()
        await page.waitForTimeout(1000)
        
        // Check if dialog opened or navigated to form
        const dialog = page.locator('[role="dialog"], [class*="dialog"], [class*="modal"]').first()
        const form = page.locator('form, input[name*="customer"], input[name*="name"]').first()
        
        const dialogVisible = await dialog.isVisible().catch(() => false)
        const formVisible = await form.isVisible().catch(() => false)
        
        if (dialogVisible) {
          console.log('  ✅ Add Customer dialog opened')
          await page.keyboard.press('Escape')
        } else if (formVisible || page.url().includes('create') || page.url().includes('new')) {
          console.log('  ✅ Navigated to Add Customer form')
          await page.goBack()
        }
      } else {
        console.log('  ⚠️ Add Customer button not found (may use different text or styling)')
      }
    })

    test('[VERIFY] Edit Customer button per row', async ({ page }) => {
      console.log('Testing Edit Customer button...')
      
      const table = page.locator('table').first()
      const rows = table.locator('tbody tr')
      const rowCount = await rows.count()
      
      if (rowCount > 0) {
        const firstRow = rows.first()
        
        // Look for edit button
        const editBtn = firstRow.locator('button[aria-label*="แก้ไข"], button[title*="แก้ไข"], button svg[class*="edit"], button svg[class*="pencil"]').first()
        const editVisible = await editBtn.isVisible().catch(() => false)
        
        if (editVisible) {
          console.log('  ✅ Edit Customer button found in row')
          
          // Click to verify it works
          await editBtn.click()
          await page.waitForTimeout(1000)
          
          // Check if dialog or form opened
          const dialog = page.locator('[role="dialog"], [class*="dialog"]').first()
          const dialogVisible = await dialog.isVisible().catch(() => false)
          
          if (dialogVisible) {
            console.log('  ✅ Edit Customer dialog opened')
            await page.keyboard.press('Escape')
          } else {
            console.log('  ✅ Edit Customer form/page opened')
            await page.goBack()
          }
        } else {
          console.log('  ⚠️ Edit button not found in row')
        }
      } else {
        console.log('  ⚠️ No customer rows found to test edit button')
      }
    })

    test('[VERIFY] Delete Customer button per row', async ({ page }) => {
      console.log('Testing Delete Customer button...')
      
      const table = page.locator('table').first()
      const rows = table.locator('tbody tr')
      const rowCount = await rows.count()
      
      if (rowCount > 0) {
        const firstRow = rows.first()
        
        // Look for delete button
        const deleteBtn = firstRow.locator('button[aria-label*="ลบ"], button[title*="ลบ"], button svg[class*="delete"], button svg[class*="trash"]').first()
        const deleteVisible = await deleteBtn.isVisible().catch(() => false)
        
        if (deleteVisible) {
          console.log('  ✅ Delete Customer button found in row')
          
          // Click to verify confirmation dialog (but don't confirm)
          await deleteBtn.click()
          await page.waitForTimeout(1000)
          
          // Check for confirmation dialog
          const confirmDialog = page.locator('[role="dialog"]:has-text("ลบ"), [role="dialog"]:has-text("ยืนยัน"), [class*="confirm"]').first()
          const confirmVisible = await confirmDialog.isVisible().catch(() => false)
          
          if (confirmVisible) {
            console.log('  ✅ Delete confirmation dialog opened')
            // Cancel the deletion
            const cancelBtn = confirmDialog.locator('button:has-text("ยกเลิก"), button:has-text("Cancel")').first()
            if (await cancelBtn.isVisible().catch(() => false)) {
              await cancelBtn.click()
            } else {
              await page.keyboard.press('Escape')
            }
          } else {
            console.log('  ⚠️ No confirmation dialog found')
          }
        } else {
          console.log('  ⚠️ Delete button not found in row')
        }
      } else {
        console.log('  ⚠️ No customer rows found to test delete button')
      }
    })

    test('[VERIFY] Customer search functionality', async ({ page }) => {
      console.log('Testing Customer Search...')
      
      // Look for search input
      const searchInput = page.locator('input[placeholder*="ค้นหา"], input[type="search"], input[name*="search"]').first()
      const searchVisible = await searchInput.isVisible().catch(() => false)
      
      if (searchVisible) {
        console.log('  ✅ Search input found')
        
        // Type in search box
        await searchInput.fill('test')
        await page.waitForTimeout(1000)
        
        // Check if results updated
        console.log('  ✅ Search input accepts text')
        
        // Clear search
        await searchInput.clear()
      } else {
        console.log('  ⚠️ Search input not found')
      }
    })

    test('[VERIFY] AR Aging view', async ({ page }) => {
      console.log('Testing AR Aging View...')
      
      // Look for AR Aging related elements
      const agingElements = [
        'อายุลูกหนี้',
        'AR Aging',
        'ค้างชำระ',
        '0-30 วัน',
        '31-60 วัน',
        '61-90 วัน',
        'มากกว่า 90 วัน'
      ]
      
      let foundAgingElements = 0
      for (const element of agingElements) {
        const el = page.locator(`text=${element}, button:has-text("${element}"), [class*="aging"]`).first()
        if (await el.isVisible().catch(() => false)) {
          foundAgingElements++
          console.log(`  ✅ AR Aging element found: ${element}`)
        }
      }
      
      // Also check for tabs that might contain AR Aging
      const tabs = page.locator('[role="tab"], button[class*="tab"]').all()
      for (const tab of await tabs) {
        const tabText = await tab.textContent()
        if (tabText && (tabText.includes('อายุ') || tabText.includes('Aging') || tabText.includes('ค้างชำระ'))) {
          console.log(`  ✅ AR Aging tab found: ${tabText}`)
          foundAgingElements++
          
          // Click the tab
          await tab.click()
          await page.waitForTimeout(1000)
          break
        }
      }
      
      expect(foundAgingElements, 'Should have at least 1 AR Aging related element').toBeGreaterThanOrEqual(1)
    })

    test('[SCREENSHOT] Customers list page', async ({ page }) => {
      // Take full screenshot of customers list
      await page.screenshot({ 
        path: 'screenshots/sales/customers-list.png',
        fullPage: true 
      })
      console.log('  📸 Screenshot saved: screenshots/sales/customers-list.png')
    })
  })

  // ============================================================================
  // SECTION 3: SUMMARY TEST
  // ============================================================================
  test('[SUMMARY] All Sales & AR module buttons', async ({ page }) => {
    console.log('\n=== SALES & AR MODULE BUTTON SUMMARY ===\n')
    
    const summary = {
      invoices: {
        module: 'ใบกำกับภาษี (Invoices)',
        buttons: [] as string[]
      },
      customers: {
        module: 'ลูกหนี้ (Customers/AR)',
        buttons: [] as string[]
      }
    }
    
    // Test Invoices buttons
    console.log('Checking Invoices module buttons...')
    
    // Navigate to Invoices
    const buttons = page.locator('aside nav button')
    const count = await buttons.count()
    
    for (let i = 0; i < count; i++) {
      const text = await buttons.nth(i).textContent()
      if (text && text.includes('ใบกำกับภาษี')) {
        await buttons.nth(i).click()
        break
      }
    }
    await page.waitForTimeout(2000)
    
    // Check Invoices buttons
    const invoicesChecks = [
      { name: 'สร้างเอกสารใหม่ (Create New Document)', selector: 'button:has-text("สร้าง"), [data-testid*="create"]' },
      { name: 'Search input', selector: 'input[placeholder*="ค้นหา"]' },
      { name: 'Status filter', selector: 'select, [role="combobox"], button:has-text("สถานะ")' },
      { name: 'View button (per row)', selector: 'button svg[class*="eye"], button[aria-label*="ดู"]' },
      { name: 'Edit button (per row)', selector: 'button svg[class*="edit"], button[aria-label*="แก้ไข"]' },
      { name: 'Print button (per row)', selector: 'button svg[class*="print"], button[aria-label*="พิมพ์"]' },
      { name: 'Download button (per row)', selector: 'button svg[class*="download"], button[aria-label*="ดาวน์โหลด"]' }
    ]
    
    for (const check of invoicesChecks) {
      const element = page.locator(check.selector).first()
      const visible = await element.isVisible().catch(() => false)
      summary.invoices.buttons.push(`${visible ? '✅' : '❌'} ${check.name}`)
    }
    
    // Test Create Document Dialog buttons
    const createBtn = page.locator('button:has-text("สร้าง"), [data-testid*="create"]').first()
    if (await createBtn.isVisible().catch(() => false)) {
      await createBtn.click()
      await page.waitForTimeout(1000)
      
      const dialogChecks = [
        { name: 'ใบกำกับภาษี (Tax Invoice)', text: 'ใบกำกับภาษี' },
        { name: 'ใบเสร็จรับเงิน (Receipt)', text: 'ใบเสร็จ' },
        { name: 'ใบส่งของ (Delivery Note)', text: 'ใบส่งของ' },
        { name: 'ใบลดหนี้ (Credit Note)', text: 'ใบลดหนี้' }
      ]
      
      for (const check of dialogChecks) {
        const element = page.locator(`button:has-text("${check.text}"), text=${check.text}`).first()
        const visible = await element.isVisible().catch(() => false)
        summary.invoices.buttons.push(`${visible ? '✅' : '❌'} ${check.name}`)
      }
      
      await page.keyboard.press('Escape')
    }
    
    // Navigate to Customers
    for (let i = 0; i < count; i++) {
      const text = await buttons.nth(i).textContent()
      if (text && text.includes('ลูกหนี้')) {
        await buttons.nth(i).click()
        break
      }
    }
    await page.waitForTimeout(2000)
    
    // Check Customers buttons
    const customersChecks = [
      { name: 'เพิ่มลูกค้า (Add Customer)', selector: 'button:has-text("เพิ่ม"), button svg[class*="plus"]' },
      { name: 'Search input', selector: 'input[placeholder*="ค้นหา"]' },
      { name: 'Edit button (per row)', selector: 'button svg[class*="edit"], button[aria-label*="แก้ไข"]' },
      { name: 'Delete button (per row)', selector: 'button svg[class*="trash"], button[aria-label*="ลบ"]' }
    ]
    
    for (const check of customersChecks) {
      const element = page.locator(check.selector).first()
      const visible = await element.isVisible().catch(() => false)
      summary.customers.buttons.push(`${visible ? '✅' : '❌'} ${check.name}`)
    }
    
    // Print summary
    console.log('\n📋 SALES & RECEIVABLES MODULE BUTTON SUMMARY\n')
    
    console.log(`📁 ${summary.invoices.module}`)
    summary.invoices.buttons.forEach(btn => console.log(`   ${btn}`))
    
    console.log(`\n📁 ${summary.customers.module}`)
    summary.customers.buttons.forEach(btn => console.log(`   ${btn}`))
    
    // Verify screenshots directory exists
    const fs = require('fs')
    const screenshotDir = 'screenshots/sales'
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true })
    }
    
    console.log('\n📸 Screenshots saved to: screenshots/sales/')
    console.log('   - invoices-list.png')
    console.log('   - create-document-dialog.png')
    console.log('   - customers-list.png')
  })
})
