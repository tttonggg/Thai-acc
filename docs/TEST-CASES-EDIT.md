# Test Cases: Edit Functions
**Thai Accounting ERP System**
**Department**: Quality Assurance (Manual)
**Task**: 4.1.3 - Edit Function Test Cases
**Version**: 1.0
**Last Updated**: 2026-03-11

---

## Table of Contents
1. [Invoice Edit Test Cases](#invoice-edit) - 10 test cases
2. [Customer Edit Test Cases](#customer-edit) - 5 test cases
3. [Vendor Edit Test Cases](#vendor-edit) - 5 test cases
4. [Appendix: Edit Validation Rules](#appendix)

---

## Invoice Edit Test Cases {#invoice-edit}

### TC-EDIT-INV-001: Edit invoice - Change customer

**Priority**: High
**Preconditions**:
- User is logged in with accounting role
- Invoice exists in DRAFT status
- At least 2 customers exist in database

**Test Data**:
- Invoice: INV-2026-0001
- Current customer: บริษัท ไทย ทรายด์ จำกัด
- New customer: ABC Company Limited

**Steps**:
1. Navigate to Invoices list
2. Locate invoice INV-2026-0001 (DRAFT status)
3. Click "Edit" button (icon: pencil/edit)
4. Edit dialog opens with current data pre-populated
5. Click customer dropdown
6. Select new customer: ABC Company Limited
7. Verify customer details update (tax ID, address)
8. Click "Save" or "Update" button
9. Verify success message
10. Return to invoice list

**Expected Result**:
- Edit dialog opens smoothly
- All current data displays correctly
- Customer dropdown shows all customers
- Can select different customer
- Customer details auto-update when changed:
  - Tax ID changes
  - Address changes
  - Contact info changes
- Save button enabled
- Success message: "อัปเดตใบกำกับภาษีเรียบร้อยแล้ว" (Invoice updated successfully)
- Invoice list refreshes automatically
- Customer name updated in list
- Invoice detail shows new customer
- Invoice number unchanged (INV-2026-0001)
- Total amount unchanged
- Database updated with new customerId

**Actual Result**: [Leave blank for execution]
**Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-EDIT-INV-002: Edit invoice - Add line item

**Priority**: High
**Preconditions**:
- Invoice in DRAFT status
- Additional products exist

**Test Data**:
- Invoice with 2 line items
- New product to add: บริการซ่อมบำรุง (Maintenance Service)

**Steps**:
1. Open invoice INV-2026-0002 in edit mode
2. Note current total
3. Click "Add Item" or "เพิ่มรายการ" button
4. New blank line appears
5. Select product from dropdown
6. Enter quantity: 1
7. Verify price auto-fills
8. Click Save
9. Verify totals updated

**Expected Result**:
- New line item row appears
- Line number increments (3)
- Product dropdown shows available products
- Price auto-fills from product master
- Line total calculates: quantity × price
- Subtotal updates:
  - Old subtotal + new line total
- VAT recalculates: 7% of new subtotal
- Total amount updates
- All calculations accurate
- Invoice saves successfully
- 3 items visible in detail view
- Totals in database updated

**Actual Result**: [Leave blank for execution]
**Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-EDIT-INV-003: Edit invoice - Remove line item

**Priority**: High
**Preconditions**:
- Invoice in DRAFT status with 3+ items

**Test Data**:
- Invoice with 3 items
- Remove middle item

**Steps**:
1. Open invoice with 3 line items in edit mode
2. Note current items and totals
3. Locate line 2 (middle item)
4. Click "Remove" or "Delete" button (trash icon)
5. Confirm deletion if prompted
6. Verify line removed
7. Click Save
8. Check updated totals

**Expected Result**:
- Confirmation dialog appears: "ต้องการลบรายการนี้?" (Delete this item?)
- OR line removed immediately without confirmation
- Line 2 removed from display
- Remaining lines renumber:
  - Old line 1 → line 1
  - Old line 3 → line 2
- Subtotal decreases by removed line amount
- VAT recalculates
- Total decreases accordingly
- Invoice saves successfully
- Only 2 items remain in detail view
- Line items in database updated (one deleted)
- Totals in database updated
- No orphaned line records

**Actual Result**: [Leave blank for execution]
**Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-EDIT-INV-004: Edit invoice - Change quantity

**Priority**: High
**Preconditions**:
- Invoice in DRAFT status

**Test Data**:
- Item: Computer
- Current quantity: 2
- New quantity: 5

**Steps**:
1. Open invoice in edit mode
2. Locate item line with quantity: 2
3. Click quantity field
4. Change from 2 to 5
5. Press Tab or click away
6. Verify line total updates
7. Verify invoice total updates
8. Click Save

**Expected Result**:
- Quantity field editable
- Can enter new value
- Validation accepts positive integers
- Line total recalculates:
  - Old: 2 × 25,000 = 50,000
  - New: 5 × 25,000 = 125,000
- Invoice subtotal increases by 75,000
- VAT increases by 5,250 (7% of 75,000)
- Total increases by 80,250
- All calculations instant or near-instant
- Invoice saves successfully
- Database updated with new quantity
- Totals in database updated

**Actual Result**: [Leave blank for execution]
**Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-EDIT-INV-005: Edit invoice - Change price

**Priority**: High
**Preconditions**:
- Invoice in DRAFT status
- User has permission to edit prices

**Test Data**:
- Item with price: 10,000 THB
- New price: 12,000 THB

**Steps**:
1. Open invoice in edit mode
2. Locate item line
3. Click price field
4. Change from 10,000 to 12,000
5. Verify calculations update
6. Click Save
7. Confirm change saved

**Expected Result**:
- Price field editable
- Accepts numeric input
- Validates: must be > 0
- Line total updates: 1 × 12,000 = 12,000
- Subtotal increases by 2,000
- VAT increases by 140
- Total increases by 2,140
- Warning: "ราคาแตกต่างจากราคามาตรฐาน" (Price differs from standard) - optional
- Invoice saves successfully
- Database updated with new price
- Product master price unchanged (12,000 only for this invoice)

**Actual Result**: [Leave blank for execution]
**Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-EDIT-INV-006: Edit invoice - Verify recalculation

**Priority**: High
**Preconditions**:
- Invoice with multiple edits needed

**Test Data**:
- Invoice with 3 items
- Make multiple changes simultaneously

**Steps**:
1. Open invoice in edit mode
2. Change item 1 quantity: 1 → 3
3. Change item 2 price: 5,000 → 6,000
4. Remove item 3
5. Add new item 4
6. Verify all calculations update correctly
7. Click Save
8. Verify final totals

**Expected Result**:
- All changes accepted
- Calculations update dynamically:
  - Item 1: 3 × 10,000 = 30,000 (was 10,000)
  - Item 2: 1 × 6,000 = 6,000 (was 5,000)
  - Item 3: removed (was 3,000)
  - Item 4: 1 × 8,000 = 8,000 (new)
- New subtotal: 30,000 + 6,000 + 8,000 = 44,000
- VAT (7%): 3,080
- New total: 47,080
- Real-time calculation (no lag)
- Invoice saves successfully
- All changes persisted
- Database totals match UI totals
- No calculation errors

**Actual Result**: [Leave blank for execution]
**Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-EDIT-INV-007: Edit paid invoice (should be restricted)

**Priority**: High
**Preconditions**:
- Invoice exists with status: PAID
- Partial or full payments received

**Test Data**:
- Invoice: INV-2026-0010
- Status: PAID
- Paid amount: 50,000 THB

**Steps**:
1. Navigate to invoice list
2. Locate paid invoice INV-2026-0010
3. Check if Edit button is visible
4. If visible, click Edit
5. Attempt to make changes
6. Try to save

**Expected Result**:
- Scenario A - Edit button hidden:
  - Edit button not visible or disabled
  - Grayed out with tooltip: "ไม่สามารถแก้ไขใบแจ้งหนี้ที่ชำระแล้ว" (Cannot edit paid invoice)

- Scenario B - Edit opens but warns:
  - Edit dialog opens
  - Warning message: "ใบกำกับภาษีนี้ถูกชำระแล้ว การแก้ไขอาจกระทบการรับชำระ" (This invoice is paid. Editing may affect payments)
  - Requires confirmation
  - OR completely blocks editing

- Scenario C - Only notes editable:
  - All fields locked
  - Only internal notes editable

- Recommended: Scenario A or B
- Changes should NOT save
- Error message if attempted
- Database unchanged

**Actual Result**: [Leave blank for execution]
**Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-EDIT-INV-008: Edit cancelled invoice (should be restricted)

**Priority**: High
**Preconditions**:
- Invoice exists with status: CANCELLED

**Test Data**:
- Invoice: INV-2026-0015
- Status: CANCELLED

**Steps**:
1. Navigate to invoice list
2. Locate cancelled invoice
3. Check Edit button availability
4. Attempt to edit if possible

**Expected Result**:
- Edit button hidden or disabled
- Warning message: "ไม่สามารถแก้ไขใบกำกับภาษีที่ยกเลิกแล้ว" (Cannot edit cancelled invoice)
- All fields locked if dialog opens
- Cannot save changes
- Database unchanged
- Cancellation date visible
- Cancellation reason visible (read-only)

**Actual Result**: [Leave blank for execution]
**Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-EDIT-INV-009: Edit invoice - Verify database update

**Priority**: High
**Preconditions**:
- Invoice in DRAFT status
- Database access available

**Test Data**:
- Invoice: INV-2026-0020
- Make specific changes

**Steps**:
1. Query database before edit:
   ```sql
   SELECT * FROM Invoice WHERE invoiceNo = 'INV-2026-0020';
   SELECT * FROM InvoiceLine WHERE invoiceId = '...';
   ```
2. Note all values
3. Open invoice in edit mode
4. Change customer
5. Change quantity on item 1: 2 → 4
6. Change price on item 2: 5,000 → 5,500
7. Add new item 3
8. Save changes
9. Query database again
10. Compare before/after

**Expected Result**:
Before edit:
- CustomerId: A
- Line 1: qty 2, price 10,000
- Line 2: qty 1, price 5,000
- Total lines: 2
- Subtotal: 25,000
- VAT: 1,750
- Total: 26,750

After edit:
- CustomerId: B (updated)
- Line 1: qty 4, price 10,000 (updated)
- Line 2: qty 1, price 5,500 (updated)
- Line 3: new item (inserted)
- Total lines: 3
- Subtotal: recalculated correctly
- VAT: recalculated correctly
- Total: recalculated correctly
- updatedAt timestamp updated
- createdById unchanged
- No orphaned records
- All foreign keys intact

**Actual Result**: [Leave blank for execution]
**Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-EDIT-INV-010: Edit invoice - Verify list updates

**Priority**: High
**Preconditions**:
- Invoice list page open

**Test Data**:
- Invoice in DRAFT status

**Steps**:
1. Navigate to invoice list page
2. Note invoice INV-2026-0025 details:
   - Customer name
   - Total amount
   - Status
3. Click Edit
4. Change customer to different one
5. Change items to increase total
6. Save changes
7. Return to list (or wait for refresh)
8. Verify updated information

**Expected Result**:
- After save, redirected to list OR
- List auto-refreshes within 2-3 seconds OR
- Manual refresh shows updates
- Customer name updated in list
- Total amount updated in list
- Status unchanged (still DRAFT)
- Invoice number unchanged
- Updated timestamp visible
- Changes visible without page reload (if using SPA)
- OR page refresh required (if traditional)
- Sort order may change if sorting by amount/date
- No duplicate entries
- Old data not displayed

**Actual Result**: [Leave blank for execution]
**Status**: Pass/Fail/Blocked
**Notes**:

---

## Customer Edit Test Cases {#customer-edit}

### TC-EDIT-CUST-001: Edit customer - Basic information

**Priority**: High
**Preconditions**:
- User logged in
- Customer exists
- No invoices linked OR customer not used in transactions

**Test Data**:
- Customer: ABC Company
- New name: ABC Corporation

**Steps**:
1. Navigate to Customers (ลูกค้า)
2. Locate ABC Company
3. Click Edit button
4. Change name: ABC Company → ABC Corporation
5. Update phone number
6. Update email
7. Click Save

**Expected Result**:
- Edit dialog opens with current data
- Name field editable
- Phone field editable
- Email field editable
- Form validation works
- Save succeeds
- Success message: "อัปเดตข้อมูลลูกค้าเรียบร้อยแล้ว"
- List updates with new name
- Database updated
- Customer code unchanged

**Actual Result**: [Leave blank for execution]
**Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-EDIT-CUST-002: Edit customer - Change address

**Priority**: Medium
**Preconditions**:
- Customer exists

**Test Data**:
- New address details

**Steps**:
1. Open customer in edit mode
2. Update address fields:
   - Address: 123/45 ถนนสุขุมวิท
   - Sub-district: คลองตัน
   - District: คลองเตย
   - Province: กรุงเทพมหานคร
   - Postal code: 10110
3. Click Save
4. Verify changes

**Expected Result**:
- All address fields editable
- Thai address fields accept Thai text
- Postal code validates (5 digits)
- Save successful
- Address updates in database
- Invoices show new address on future exports

**Actual Result**: [Leave blank for execution]
**Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-EDIT-CUST-003: Edit customer - Tax ID validation

**Priority**: High
**Preconditions**:
- Customer exists

**Test Data**:
- Current Tax ID: 0105551234567
- Invalid Tax ID: 010555123456 (12 digits)

**Steps**:
1. Edit customer
2. Change Tax ID to 12 digits
3. Attempt to save
4. Try valid 13-digit Tax ID

**Expected Result**:
- Validation on Tax ID field
- Error: "เลขประจำตัวผู้เสียภาษีต้องมี 13 หลัก" (Tax ID must be 13 digits)
- Cannot save with invalid Tax ID
- Valid 13-digit Tax ID accepted
- Tax ID format validated (digits only)
- Save successful with valid Tax ID

**Actual Result**: [Leave blank for execution]
**Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-EDIT-CUST-004: Edit customer - Update credit terms

**Priority**: Medium
**Preconditions**:
- Customer exists

**Test Data**:
- Current credit limit: 100,000 THB
- Current credit days: 30 days
- New credit limit: 150,000 THB
- New credit days: 45 days

**Steps**:
1. Edit customer
2. Change credit limit: 100,000 → 150,000
3. Change credit days: 30 → 45
4. Save changes
5. Verify updated

**Expected Result**:
- Credit limit field accepts numeric input
- Credit days field accepts integers
- Validation: credit limit ≥ 0
- Validation: credit days ≥ 0
- Save successful
- Credit terms updated in database
- Future invoices use new terms
- Warning if current balance > new limit

**Actual Result**: [Leave blank for execution]
**Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-EDIT-CUST-005: Edit customer - Used in transactions (restriction)

**Priority**: High
**Preconditions**:
- Customer has invoices
- Customer has payments

**Test Data**:
- Customer with existing transactions

**Steps**:
1. Try to edit customer code
2. Try to edit customer name
3. Try to edit Tax ID
4. Save changes
5. Check what fields are editable

**Expected Result**:
- Scenario A - All fields editable:
  - Changes allowed
  - Historical invoices show old name (snapshot)
  - New invoices show new name
  - Audit trail tracks changes

- Scenario B - Key fields locked:
  - Customer code locked (used in foreign keys)
  - Tax ID locked (used in invoices)
  - Name and address editable
  - Warning: "ลูกค้านี้มีธุรกรรมอยู่ บางฟิลด์ไม่สามารถแก้ไข" (Customer has transactions, some fields locked)

- Scenario C - Create new version:
  - Cannot edit existing
  - Must create new customer record
  - Old record marked inactive

- Recommended: Scenario A with audit trail
- Cannot delete customer
- Can mark inactive

**Actual Result**: [Leave blank for execution]
**Status**: Pass/Fail/Blocked
**Notes**:

---

## Vendor Edit Test Cases {#vendor-edit}

### TC-EDIT-VEND-001: Edit vendor - Basic information

**Priority**: High
**Preconditions**:
- User logged in
- Vendor exists

**Test Data**:
- Vendor: บริษัทซัพพลายเจ้าขาย
- New name: บริษัทซัพพลายโกลบอล

**Steps**:
1. Navigate to Vendors (เจ้าหนี้/ผู้ขาย)
2. Locate vendor
3. Click Edit
4. Update name
5. Update contact info
6. Save

**Expected Result**:
- Edit dialog opens
- Name editable
- Contact name editable
- Phone editable
- Save successful
- List updates
- Database updated
- Success message in Thai

**Actual Result**: [Leave blank for execution]
**Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-EDIT-VEND-002: Edit vendor - Bank information

**Priority**: Medium
**Preconditions**:
- Vendor exists

**Test Data**:
- Bank: กรุงไทย
- Account: 123-4-56789-0
- Account name: บริษัทซัพพลาย

**Steps**:
1. Edit vendor
2. Update bank name
3. Update account number
4. Update account name
5. Save
6. Verify changes

**Expected Result**:
- Bank field editable (dropdown or text)
- Account number accepts formats
- Account name editable
- Validation on account number
- Save successful
- Bank info updated
- Payment vouchers use new info

**Actual Result**: [Leave blank for execution]
**Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-EDIT-VEND-003: Edit vendor - Address and contact

**Priority**: Medium
**Preconditions**:
- Vendor exists

**Test Data**:
- New address details
- New contact person

**Steps**:
1. Edit vendor
2. Update full address
3. Update contact name
4. Update contact phone
5. Update email
6. Save

**Expected Result**:
- All address fields editable
- Thai address supported
- Contact info editable
- Email validation (format)
- Phone validation
- Save successful
- Updates reflect in purchase orders

**Actual Result**: [Leave blank for execution]
**Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-EDIT-VEND-004: Edit vendor - Tax ID validation

**Priority**: High
**Preconditions**:
- Vendor exists

**Test Data**:
- Valid Tax ID: 0105551234567
- Invalid Tax ID: ABC1234567890

**Steps**:
1. Edit vendor
2. Change Tax ID to invalid format
3. Attempt save
4. Enter valid Tax ID
5. Save

**Expected Result**:
- Tax ID validation: 13 digits
- Error on invalid format
- Thai error message
- Cannot save with invalid Tax ID
- Valid Tax ID accepted
- Format: digits only

**Actual Result**: [Leave blank for execution]
**Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-EDIT-VEND-005: Edit vendor - Used in transactions

**Priority**: High
**Preconditions**:
- Vendor has purchase invoices
- Vendor has payments

**Test Data**:
- Vendor with transactions

**Steps**:
1. Try to edit vendor code
2. Try to edit Tax ID
3. Try to edit name
4. Check restrictions

**Expected Result**:
- Similar to customer editing rules
- Code may be locked (foreign key)
- Tax ID may be locked
- Name and address editable
- Audit trail maintained
- Cannot delete if used
- Can mark inactive
- Warning about existing transactions

**Actual Result**: [Leave blank for execution]
**Status**: Pass/Fail/Blocked
**Notes**:

---

## Appendix: Edit Validation Rules {#appendix}

### Invoice Edit Rules

**Status-Based Permissions**:

| Invoice Status | Can Edit? | Fields Editable | Notes |
|---------------|-----------|----------------|-------|
| DRAFT | Yes | All fields | Full edit capability |
| ISSUED | Limited | Notes only | Requires special permission |
| PAID | No | None | Completely locked |
| PARTIAL | Limited | Notes only | Only internal notes |
| CANCELLED | No | None | Cannot edit cancelled |

**Field Edit Rules**:

| Field | DRAFT | ISSUED | PAID |
|-------|-------|--------|------|
| Customer | Yes | No | No |
| Date | Yes | No | No |
| Line items | Yes | No | No |
| Quantities | Yes | No | No |
| Prices | Yes | No | No |
| VAT rate | Yes | No | No |
| Discount | Yes | No | No |
| Notes | Yes | Yes | Internal only |
| Internal notes | Yes | Yes | Yes |

**Validation Messages (Thai)**:

- "ไม่สามารถแก้ไขใบกำกับภาษีที่ชำระแล้ว" (Cannot edit paid invoice)
- "ไม่สามารถแก้ไขใบกำกับภาษีที่ยกเลิกแล้ว" (Cannot edit cancelled invoice)
- "ต้องการแก้ไขใบกำกับภาษีที่ออกแล้ว?" (Edit issued invoice?)
- "การแก้ไขอาจกระทบงบการเงิน" (Editing may affect financial statements)

### Customer/Vendor Edit Rules

**When NOT Linked to Transactions**:
- All fields editable
- Code editable if no references
- Tax ID editable
- Name, address, contacts editable

**When Linked to Transactions**:
- Code: Locked (foreign key constraint)
- Tax ID: Locked (historical accuracy)
- Name: Editable (with audit trail)
- Address: Editable (affects future transactions only)
- Contacts: Editable
- Credit terms: Editable
- Cannot delete: Must mark inactive instead

**Audit Trail Requirements**:
- Track all changes to customer/vendor
- Record who made change
- Record when change made
- Record before/after values
- Maintain history for tax audits (10 years in Thailand)

### Edit Workflow

**Best Practice Flow**:
1. User clicks Edit button
2. System checks status
3. If editable:
   - Open edit dialog
   - Pre-populate current data
   - Enable appropriate fields
   - Disable locked fields
4. User makes changes
5. Validation on field change
6. User clicks Save
7. Final validation
8. Confirm if critical fields changed
9. Save to database
10. Update audit trail
11. Refresh list/detail views
12. Show success message

**Error Handling**:
- Show validation errors inline
- Highlight problem fields
- Provide clear error messages in Thai
- Don't lose user's edits (allow fix and retry)
- Log errors for support

**Concurrency Control**:
- Check if record changed since loaded
- Show "Record modified by another user" if conflict
- Offer options: Reload, Overwrite, Cancel
- Prevent lost updates

### Test Execution Checklist

**Pre-Test Setup**:
- [ ] Test environment ready
- [ ] Database backed up
- [ ] Test data loaded
- [ ] User account with appropriate permissions
- [ ] Browser/Excel/PDF viewers ready

**During Test**:
- [ ] Follow steps exactly
- [ ] Document actual results
- [ ] Take screenshots of failures
- [ ] Note any deviations
- [ ] Record error messages

**Post-Test**:
- [ ] Update test status
- [ ] Log bugs if needed
- [ ] Clean up test data (if required)
- [ ] Report results to lead QA

**Edge Cases to Consider**:
- Editing while another user views the record
- Editing with unstable network
- Editing very large invoices (50+ lines)
- Editing with special characters
- Editing with Thai + English mixed text
- Browser refresh during edit
- Multiple edits in quick succession

---

**Test Case Summary**:
- Invoice Edit Test Cases: 10
- Customer Edit Test Cases: 5
- Vendor Edit Test Cases: 5
- Total Edit Test Cases: 20

**Execution Priority**:
1. **High**: All invoice edit tests (TC-EDIT-INV-001 to -010)
2. **High**: Customer/Vendor used in transactions (-005 each)
3. **Medium**: Customer/Vendor basic edits (-001 to -004 each)

**Execution Guidelines**:
1. Start with happy path (TC-001)
2. Test restrictions before flexibility
3. Verify database updates
4. Check UI updates
5. Test validation thoroughly
6. Document all behaviors

**Acceptance Criteria**:
- All high priority tests pass
- No data corruption
- Audit trail works
- UI updates correctly
- Validation prevents invalid data
- Appropriate restrictions enforced
- Thai error messages clear

---

*Document Version: 1.0*
*Last Updated: 2026-03-11*
*QA Engineer: [Your Name]*
*Reviewer: [Manager Name]*
