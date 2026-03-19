# Test Cases: Document Creation
**Thai Accounting ERP System**
**Department**: Quality Assurance (Manual)
**Task**: 4.1.1 - Document Creation Test Cases
**Version**: 1.0
**Last Updated**: 2026-03-11

---

## Table of Contents
1. [Invoice Creation Test Cases](#invoice-creation) - 15 test cases
2. [Journal Entry Test Cases](#journal-entry) - 10 test cases
3. [Appendix: Test Data Reference](#appendix)

---

## Invoice Creation Test Cases {#invoice-creation}

### TC-INV-001: Create invoice with single item (happy path)

**Priority**: High
**Preconditions**:
- User is logged in with accounting role
- At least one customer exists in database
- At least one product/service exists

**Test Data**:
- Customer: บริษัท ไทย ทรายด์ จำกัด (Thai Trade Co., Ltd.)
- Product: บริการให้คำปรึกษา (Consulting Service)
- Quantity: 1
- Price: 10,000.00 THB
- VAT Rate: 7%

**Steps**:
1. Navigate to "ลูกหนี้" (Accounts Receivable) > "ใบกำกับภาษี" (Invoices)
2. Click "สร้างใบกำกับภาษี" (Create Invoice) button
3. Select customer from dropdown
4. Select invoice date (today)
5. Click "เพิ่มรายการ" (Add Item)
6. Select product from dropdown
7. Enter quantity: 1
8. Verify price auto-fills: 10,000.00
9. Click "บันทึก" (Save) button

**Expected Result**:
- Invoice is created successfully
- Invoice number is auto-generated (format: INV-YYYY-NNNN)
- Status shows as "DRAFT" (ร่าง)
- Subtotal: 10,000.00 THB
- VAT (7%): 700.00 THB
- Total: 10,700.00 THB
- Invoice appears in invoice list
- Success message displays: "บันทึกใบกำกับภาษีเรียบร้อยแล้ว"

**Actual Result**: [Leave blank for execution]
**Status**: Pass/Fail/Blocked
**Notes**: [Any observations]

---

### TC-INV-002: Create invoice with multiple items

**Priority**: High
**Preconditions**:
- User is logged in
- Customer exists
- At least 3 products exist

**Test Data**:
- Customer: ABC Company
- Item 1: คอมพิวเตอร์ (Computer) - 2 units @ 25,000 THB
- Item 2: ติดตั้งโปรแกรม (Software Installation) - 1 unit @ 5,000 THB
- Item 3: บริการซ่อมบำรุง (Maintenance Service) - 1 unit @ 3,000 THB

**Steps**:
1. Navigate to Invoices page
2. Click Create Invoice
3. Select customer
4. Add first item: Computer, qty 2, price 25,000
5. Click "Add Item" to add second line
6. Add second item: Installation, qty 1, price 5,000
7. Click "Add Item" to add third line
8. Add third item: Maintenance, qty 1, price 3,000
9. Verify line totals calculate correctly
10. Click Save

**Expected Result**:
- All 3 line items display correctly
- Line totals:
  - Item 1: 50,000.00 THB
  - Item 2: 5,000.00 THB
  - Item 3: 3,000.00 THB
- Subtotal: 58,000.00 THB
- VAT (7%): 4,060.00 THB
- Total: 62,060.00 THB
- Invoice saves successfully
- All items visible in invoice detail view

**Actual Result**: [Leave blank for execution]
**Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-INV-003: Create invoice with 7% VAT

**Priority**: High
**Preconditions**:
- User is logged in
- Customer and product exist

**Test Data**:
- Product with VAT type: EXCLUSIVE (ยังไม่รวม VAT)
- Price: 20,000 THB
- VAT Rate: 7%

**Steps**:
1. Create new invoice
2. Select customer
3. Add product with EXCLUSIVE VAT type
4. Enter price: 20,000
5. Verify VAT calculation displays
6. Save invoice

**Expected Result**:
- Subtotal: 20,000.00 THB
- VAT Rate: 7%
- VAT Amount: 1,400.00 THB
- Total Amount: 21,400.00 THB
- VAT breakdown visible on invoice
- Thai label: "ภาษีมูลค่าเพิ่ม 7%"

**Actual Result**: [Leave blank for execution]
**Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-INV-004: Create invoice with 0% VAT (exempt)

**Priority**: Medium
**Preconditions**:
- User is logged in
- Product with 0% VAT exists

**Test Data**:
- Product: Export service (บริการส่งออก - ไม่มี VAT)
- Price: 50,000 THB
- VAT Rate: 0%

**Steps**:
1. Create new invoice
2. Select customer
3. Add product with 0% VAT rate
4. Enter price: 50,000
5. Verify VAT shows as 0
6. Save invoice

**Expected Result**:
- Subtotal: 50,000.00 THB
- VAT Rate: 0%
- VAT Amount: 0.00 THB
- Total Amount: 50,000.00 THB
- Invoice shows "ไม่มีภาษีมูลค่าเพิ่ม" (No VAT)
- Saves successfully

**Actual Result**: [Leave blank for execution]
**Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-INV-005: Create invoice with discount

**Priority**: Medium
**Preconditions**:
- User is logged in
- Customer exists

**Test Data**:
- Product: Service package
- Quantity: 1
- Price: 100,000 THB
- Discount: 10%

**Steps**:
1. Create new invoice
2. Select customer
3. Add product: 100,000 THB
4. Enter discount percentage: 10
5. Verify calculations update
6. Save invoice

**Expected Result**:
- Subtotal before discount: 100,000.00 THB
- Discount (10%): 10,000.00 THB
- Subtotal after discount: 90,000.00 THB
- VAT (7% on 90,000): 6,300.00 THB
- Total: 96,300.00 THB
- Discount line visible on invoice
- Correct calculation sequence: discount before VAT

**Actual Result**: [Leave blank for execution]
**Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-INV-006: Create invoice without customer (should fail)

**Priority**: High
**Preconditions**:
- User is logged in

**Test Data**:
- No customer selected

**Steps**:
1. Navigate to Create Invoice page
2. Leave customer field empty
3. Add product item
4. Attempt to click Save

**Expected Result**:
- Save button should be disabled OR
- Error message displays: "กรุณาเลือกลูกค้า" (Please select customer)
- Invoice does not save
- Customer field highlighted in red
- Validation prevents submission

**Actual Result**: [Leave blank for execution]
**Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-INV-007: Create invoice with zero quantity (should fail)

**Priority**: High
**Preconditions**:
- User is logged in
- Customer selected

**Test Data**:
- Product: Any product
- Quantity: 0

**Steps**:
1. Create new invoice
2. Select customer
3. Add product line
4. Enter quantity: 0
5. Attempt to save

**Expected Result**:
- Validation error: "จำนวนต้องมากกว่า 0" (Quantity must be greater than 0)
- OR line item is automatically removed
- OR Save button disabled
- Invoice does not save
- Error message in Thai

**Actual Result**: [Leave blank for execution]
**Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-INV-008: Create invoice with negative price (should fail)

**Priority**: High
**Preconditions**:
- User is logged in
- Customer selected

**Test Data**:
- Product: Any product
- Price: -1000 (negative)

**Steps**:
1. Create new invoice
2. Select customer
3. Add product line
4. Enter price: -1000
5. Attempt to save

**Expected Result**:
- Validation error: "ราคาต้องไม่ติดลบ" (Price cannot be negative)
- Price field highlighted
- Invoice does not save
- System prevents negative prices
- Clear error message

**Actual Result**: [Leave blank for execution]
**Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-INV-009: Create invoice - verify auto-numbering

**Priority**: High
**Preconditions**:
- User is logged in
- Previous invoices exist

**Test Data**:
- Last invoice number: INV-2026-0015

**Steps**:
1. Check last invoice number in database
2. Create new invoice with valid data
3. Save invoice
4. Note the generated invoice number
5. Create second invoice
6. Note the second invoice number

**Expected Result**:
- First new invoice: INV-2026-0016
- Second new invoice: INV-2026-0017
- Numbers increment sequentially
- Format: INV-YYYY-NNNN
- No gaps in numbering
- Numbers are unique
- Year matches current fiscal year

**Actual Result**: [Leave blank for execution]
**Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-INV-010: Create invoice - verify balance check

**Priority**: High
**Preconditions**:
- User is logged in
- Customer exists

**Test Data**:
- Customer with credit limit: 100,000 THB
- Current balance: 80,000 THB
- New invoice: 30,000 THB

**Steps**:
1. Select customer: ABC Company (credit limit 100k, current 80k)
2. Create invoice for 30,000 THB
3. Attempt to save
4. Check if warning appears

**Expected Result**:
- Invoice saves but displays warning: "ยอดหนี้เกินวงเงินเครดิต" (Balance exceeds credit limit)
- Warning shows: Current balance + New invoice = 110,000 > 100,000 limit
- User can choose to proceed or cancel
- Warning clearly displayed in Thai
- Credit status highlighted

**Actual Result**: [Leave blank for execution]
**Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-INV-011: Create invoice - verify VAT calculation

**Priority**: High
**Preconditions**:
- User is logged in

**Test Data**:
- Product 1: 10,000 THB (7% VAT)
- Product 2: 5,000 THB (7% VAT)
- Product 3: 15,000 THB (0% VAT - exempt)

**Steps**:
1. Create invoice with 3 items
2. Item 1: 10,000 THB with 7% VAT
3. Item 2: 5,000 THB with 7% VAT
4. Item 3: 15,000 THB with 0% VAT (exempt)
5. Save invoice
6. Verify calculations

**Expected Result**:
- Subtotal (before VAT): 30,000.00 THB
- VAT on item 1: 700.00 THB
- VAT on item 2: 350.00 THB
- VAT on item 3: 0.00 THB
- Total VAT: 1,050.00 THB
- Grand Total: 31,050.00 THB
- Per-item VAT calculation correct
- System handles mixed VAT rates

**Actual Result**: [Leave blank for execution]
**Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-INV-012: Create invoice with special characters in description

**Priority**: Medium
**Preconditions**:
- User is logged in
- Customer exists

**Test Data**:
- Description: "บริการติดตั้งเครื่องทำความเย็น (Air Conditioner) @ สำนักงานใหญ่ # 001"

**Steps**:
1. Create new invoice
2. Select customer
3. Add item with description containing:
   - Thai characters: บริการติดตั้งเครื่องทำความเย็น
   - Parentheses: (Air Conditioner)
   - Special symbols: @
   - Hash symbol: #
   - Numbers: 001
4. Save invoice

**Expected Result**:
- Special characters saved correctly
- Thai text displays properly
- No encoding issues
- Description readable in invoice list
- Description readable in invoice detail
- PDF export shows characters correctly
- No database errors

**Actual Result**: [Leave blank for execution]
**Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-INV-013: Create invoice with maximum line items

**Priority**: Low
**Preconditions**:
- User is logged in
- At least 20 products exist

**Test Data**:
- 20 different line items
- Various quantities and prices

**Steps**:
1. Create new invoice
2. Select customer
3. Add 20 line items
4. Enter varying quantities (1-10)
5. Enter varying prices (100-50,000)
6. Scroll through all items
7. Save invoice

**Expected Result**:
- All 20 items save correctly
- No data loss
- Calculations accurate across all lines
- Scroll works smoothly
- Performance acceptable (< 3 seconds to save)
- All items visible in detail view
- PDF handles multiple pages if needed

**Actual Result**: [Leave blank for execution]
**Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-INV-014: Create invoice - verify database save

**Priority**: High
**Preconditions**:
- User is logged in
- Database access available

**Test Data**:
- Invoice data: Customer XYZ, 2 items, total 25,000 THB

**Steps**:
1. Create invoice via UI with specific data
2. Note the invoice number
3. Save invoice
4. Query database directly:
   ```sql
   SELECT * FROM Invoice WHERE invoiceNo = 'INV-2026-XXXX';
   SELECT * FROM InvoiceLine WHERE invoiceId = '...';
   ```
5. Verify all fields saved correctly
6. Check timestamps

**Expected Result**:
- Invoice record exists in Invoice table
- All fields match UI input:
  - customerId matches
  - subtotal exact
  - vatAmount exact
  - totalAmount exact
  - status = 'DRAFT'
- Invoice lines saved in InvoiceLine table
- createdAt timestamp set correctly
- updatedAt = createdAt
- No orphaned records

**Actual Result**: [Leave blank for execution]
**Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-INV-015: Create invoice - verify list refresh

**Priority**: High
**Preconditions**:
- User is logged in
- Invoice list page shows existing invoices

**Test Data**:
- New invoice data

**Steps**:
1. Navigate to invoice list page
2. Note the last invoice in list
3. Click "Create Invoice"
4. Create and save new invoice
5. Note the new invoice number
6. Return to invoice list (or wait for auto-refresh)
7. Verify new invoice appears

**Expected Result**:
- After saving, redirected to list OR
- List auto-refreshes OR
- Manual refresh shows new invoice
- New invoice appears at top of list
- Invoice number matches
- Customer name displays correctly
- Total amount displays correctly
- Status shows as "DRAFT"
- List sorted by date descending (newest first)

**Actual Result**: [Leave blank for execution]
**Status**: Pass/Fail/Blocked
**Notes**:

---

## Journal Entry Test Cases {#journal-entry}

### TC-JRNL-001: Create balanced entry (happy path)

**Priority**: High
**Preconditions**:
- User is logged in with accounting role
- Chart of accounts exists with detail accounts

**Test Data**:
- Date: 2026-03-11
- Description: "บันทึกค่าเช่ารายเดือน" (Monthly rent)
- Line 1: Debit ค่าเช่า (Expense account) - 50,000 THB
- Line 2: Credit เงินสด (Asset account) - 50,000 THB

**Steps**:
1. Navigate to "บัญชีรายวัน" (Journal Entry) page
2. Click "สร้างบันทึกบัญชี" (Create Journal Entry)
3. Enter date: today
4. Enter description
5. Add first line:
   - Select account: ค่าเช่า (5100)
   - Debit: 50,000
6. Add second line:
   - Select account: เงินสด (1100)
   - Credit: 50,000
7. Verify balance indicator shows: "Balance: 0.00"
8. Click "บันทึก" (Save)

**Expected Result**:
- Journal entry saves successfully
- Entry number auto-generated (format: JE-YYYY-NNNN)
- Status: DRAFT (ร่าง)
- Total Debit: 50,000.00 THB
- Total Credit: 50,000.00 THB
- Balance: 0.00 THB (balanced)
- Two journal lines saved
- Entry appears in recent entries list
- Success message: "บันทึกบัญชีบันทึกเรียบร้อยแล้ว"

**Actual Result**: [Leave blank for execution]
**Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-JRNL-002: Create entry with unbalanced amounts (should fail)

**Priority**: High
**Preconditions**:
- User is logged in

**Test Data**:
- Line 1: Debit - 50,000 THB
- Line 2: Credit - 45,000 THB
- Difference: 5,000 THB (unbalanced)

**Steps**:
1. Create new journal entry
2. Add debit line: 50,000 THB
3. Add credit line: 45,000 THB
4. Check balance indicator
5. Attempt to click Save

**Expected Result**:
- Save button is disabled OR
- Error message: "Debit ไม่เท่ากับ Credit" (Debit does not equal Credit)
- Balance indicator shows: "Difference: 5,000.00 THB"
- Difference highlighted in red
- Entry does not save
- User warned about imbalance
- Thai error message

**Actual Result**: [Leave blank for execution]
**Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-JRNL-003: Create entry with only 1 line (should fail)

**Priority**: High
**Preconditions**:
- User is logged in

**Test Data**:
- Only 1 journal line

**Steps**:
1. Create new journal entry
2. Add only one line:
   - Account: เงินสด
   - Debit: 10,000 THB
3. Attempt to save

**Expected Result**:
- Validation error: "ต้องมีอย่างน้อย 2 รายการ" (Must have at least 2 lines)
- OR Save button disabled
- Double-entry accounting rule enforced
- Cannot save single-line entry
- Clear error message in Thai

**Actual Result**: [Leave blank for execution]
**Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-JRNL-004: Create multi-line entry (5+ lines)

**Priority**: Medium
**Preconditions**:
- User is logged in
- Multiple accounts exist

**Test Data**:
- Line 1: Debit ค่าเช่า - 50,000
- Line 2: Debit ค่าไฟฟ้า - 5,000
- Line 3: Debit ค่าน้ำ - 2,000
- Line 4: Credit เงินสด - 47,000
- Line 5: Credit เจ้าหนี้ - 10,000

**Steps**:
1. Create new journal entry
2. Add 5 journal lines
3. Enter accounts and amounts as above
4. Verify balance
5. Save entry

**Expected Result**:
- All 5 lines save correctly
- Total Debit: 57,000.00 THB (50,000 + 5,000 + 2,000)
- Total Credit: 57,000.00 THB (47,000 + 10,000)
- Balance: 0.00 THB
- All lines visible in detail view
- Entry saves successfully
- Performance acceptable

**Actual Result**: [Leave blank for execution]
**Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-JRNL-005: Create entry - verify auto-numbering

**Priority**: High
**Preconditions**:
- User is logged in
- Previous entries exist

**Test Data**:
- Last entry number: JE-2026-0025

**Steps**:
1. Check last journal entry number
2. Create balanced entry (2 lines)
3. Save
4. Note generated number
5. Create second entry
6. Note second number

**Expected Result**:
- First new entry: JE-2026-0026
- Second new entry: JE-2026-0027
- Sequential numbering
- Format: JE-YYYY-NNNN
- Unique numbers
- Year matches fiscal year
- No gaps

**Actual Result**: [Leave blank for execution]
**Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-JRNL-006: Create entry - verify ledger posting

**Priority**: High
**Preconditions**:
- User is logged in
- Entry is in DRAFT status

**Test Data**:
- Journal entry to be posted

**Steps**:
1. Create journal entry (DRAFT)
2. Note entry number
3. Click "ลงบัญชี" (Post) button
4. Confirm posting
5. Check account balances:
   ```sql
   SELECT * FROM AccountBalance WHERE accountId IN (...);
   ```
6. Verify ledger tables updated

**Expected Result**:
- Status changes from DRAFT to POSTED
- Current date/time recorded in postedAt
- Account balances updated:
  - Debit account balance increased
  - Credit account balance decreased (for assets) or increased (for liabilities)
- General ledger entries created
- Audit trail created
- Cannot edit after posting
- Success message: "ลงบัญชีเรียบร้อยแล้ว"

**Actual Result**: [Leave blank for execution]
**Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-JRNL-007: Create entry with all account types

**Priority**: Medium
**Preconditions**:
- User is logged in
- All account types exist

**Test Data**:
- Asset account: เงินสด (1100)
- Liability account: เจ้าหนี้ (2100)
- Equity account: ทุน (3100)
- Revenue account: รายได้ (4100)
- Expense account: ค่าใช้จ่าย (5100)

**Steps**:
1. Create journal entry with 5 lines
2. Line 1: Debit Asset (เงินสด) - 100,000
3. Line 2: Credit Revenue (รายได้) - 100,000
4. Save entry 1
5. Create entry 2:
   - Debit Expense (ค่าใช้จ่าย) - 50,000
   - Credit Liability (เจ้าหนี้) - 50,000
6. Save entry 2
7. Verify all account types work

**Expected Result**:
- Asset account accepts debit
- Liability account accepts credit
- Equity account accessible
- Revenue account accepts credit
- Expense account accepts debit
- All entries save successfully
- Balance calculations correct
- Account types validated

**Actual Result**: [Leave blank for execution]
**Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-JRNL-008: Create entry with zero amounts (should fail)

**Priority**: Medium
**Preconditions**:
- User is logged in

**Test Data**:
- Journal line with 0.00 amount

**Steps**:
1. Create new journal entry
2. Add first line: Debit 10,000
3. Add second line: Credit 0 (zero)
4. Attempt to save

**Expected Result**:
- Validation error: "ยอดเงินต้องไม่เป็นศูนย์" (Amount cannot be zero)
- OR Line with zero removed automatically
- OR Save button disabled
- Clear error message
- Entry does not save
- System prevents zero amounts

**Actual Result**: [Leave blank for execution]
**Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-JRNL-009: Create entry - verify database save

**Priority**: High
**Preconditions**:
- User is logged in
- Database access available

**Test Data**:
- Journal entry: 3 lines, total 75,000 THB

**Steps**:
1. Create journal entry via UI
2. Note entry number and details
3. Save
4. Query database:
   ```sql
   SELECT * FROM JournalEntry WHERE entryNo = 'JE-2026-XXXX';
   SELECT * FROM JournalLine WHERE entryId = '...';
   ```
5. Verify all data

**Expected Result**:
- JournalEntry record created:
  - entryNo matches
  - date matches
  - description saved
  - totalDebit = 75,000
  - totalCredit = 75,000
  - status = 'DRAFT'
- JournalLine records created (3 lines)
  - All accountIds correct
  - All debits/credits match
  - Line numbers sequential
- createdAt timestamp set
- No orphaned records
- Foreign keys intact

**Actual Result**: [Leave blank for execution]
**Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-JRNL-010: Create entry - verify recent entries list

**Priority**: Medium
**Preconditions**:
- User is logged in
- Journal entry page shows recent entries

**Test Data**:
- New journal entry

**Steps**:
1. Navigate to journal entry page
2. Note last entry in list
3. Click "Create Journal Entry"
4. Create and save new entry
5. Note new entry number
6. Check recent entries list

**Expected Result**:
- New entry appears in list
- Entry number matches
- Description displays
- Total amount shows
- Date displays correctly (Thai format)
- Status shows
- List sorted by date descending
- Can click to view detail

**Actual Result**: [Leave blank for execution]
**Status**: Pass/Fail/Blocked
**Notes**:

---

## Appendix: Test Data Reference {#appendix}

### Sample Customers
1. บริษัท ไทย ทรายด์ จำกัด - Tax ID: 0105551234567
2. ABC Company Limited - Tax ID: 0106662345678
3. ร้าน สมชาย การค้า - Tax ID: 3129987654321

### Sample Products
1. คอมพิวเตอร์ (Computer) - 25,000 THB - 7% VAT
2. บริการให้คำปรึกษา (Consulting) - 10,000 THB - 7% VAT
3. บริการส่งออก (Export Service) - 50,000 THB - 0% VAT
4. ติดตั้งโปรแกรม (Software Installation) - 5,000 THB - 7% VAT

### Sample Accounts
- 1100: เงินสด (Cash) - Asset
- 1200: ลูกหนี้การค้า (Accounts Receivable) - Asset
- 2100: เจ้าหนี้การค้า (Accounts Payable) - Liability
- 3100: ทุนจดทะเบียน (Registered Capital) - Equity
- 4100: รายได้จากการขาย (Sales Revenue) - Revenue
- 5100: ค่าเช่า (Rent Expense) - Expense

### Thai Date Formats
- Short: 11/03/2566 (DD/MM/YYYY - Buddhist era)
- Long: 11 มีนาคม 2566 (Full month name, Buddhist year)

### Currency Format
- Thai Baht: ฿1,234.56
- Text: หนึ่งพันสองร้อยสามสิบสี่บาทห้าสิบหกสตางค์

---

**Test Case Summary**:
- Total Invoice Test Cases: 15
- Total Journal Entry Test Cases: 10
- Total Test Cases: 25

**Execution Guidelines**:
1. Execute test cases in order
2. Document actual results
3. Attach screenshots for failures
4. Report bugs immediately
5. Update test data as needed

**Approach**:
- Start with happy paths (TC-001)
- Progress to edge cases
- End with validation tests
- Execute all high priority tests first

---

*Document Version: 1.0*
*Last Updated: 2026-03-11*
*QA Engineer: [Your Name]*
*Reviewer: [Manager Name]*
