# Test Cases: Export Functions

**Thai Accounting ERP System** **Department**: Quality Assurance (Manual)
**Task**: 4.1.2 - Export Function Test Cases **Version**: 1.0 **Last Updated**:
2026-03-11

---

## Table of Contents

1. [PDF Export Test Cases](#pdf-export) - 25 test cases (5 per document type)
2. [Excel Export Test Cases](#excel-export) - 25 test cases (5 per report)
3. [Appendix: File Verification](#appendix)

---

## PDF Export Test Cases {#pdf-export}

### TC-PDF-INV-001: Export invoice to PDF - Basic functionality

**Priority**: High **Preconditions**:

- Invoice exists in DRAFT or ISSUED status
- User has accounting role
- PDF generation service is running

**Test Data**:

- Invoice: INV-2026-0001
- Customer: บริษัท ไทย ทรายด์ จำกัด
- 2 line items, total 21,400 THB

**Steps**:

1. Navigate to Invoices list
2. Locate invoice INV-2026-0001
3. Click "Export PDF" button (icon: PDF/download)
4. Wait for generation (spinner/loading indicator)
5. Verify file downloads automatically
6. Open downloaded PDF file

**Expected Result**:

- File downloads to default download folder
- Filename: INV-2026-0001.pdf OR
- Filename: INV-2026-0001_บริษัทไทยทรายด์.pdf
- File size: 50-500 KB (reasonable range)
- File opens in default PDF viewer
- No corruption errors
- Loading indicator shows during generation
- Success message: "ส่งออก PDF เรียบร้อยแล้ว"

**Actual Result**: [Leave blank for execution] **Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-PDF-INV-002: Export invoice to PDF - Thai font display

**Priority**: High **Preconditions**:

- Invoice with Thai text exists
- PDF generation service running

**Test Data**:

- Invoice with Thai customer name
- Thai product descriptions
- Thai labels in template

**Steps**:

1. Select invoice with Thai content
2. Click Export PDF
3. Open downloaded PDF
4. Inspect all text elements
5. Check for font rendering issues

**Expected Result**:

- All Thai characters render correctly
- No "tofu" boxes (□□□) for missing glyphs
- Font appears smooth and readable
- Customer name displays correctly: "บริษัท ไทย ทรายด์ จำกัด"
- Product descriptions readable
- Thai labels readable:
  - "ใบกำกับภาษี" (Tax Invoice)
  - "เลขที่" (No.)
  - "วันที่" (Date)
  - "ลูกค้า" (Customer)
  - "รายการ" (Description)
  - "จำนวน" (Quantity)
  - "ราคา" (Price)
  - "ยอดรวม" (Total)
- Font size appropriate (10-14pt for body text)
- Bold text renders correctly

**Actual Result**: [Leave blank for execution] **Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-PDF-INV-003: Export invoice to PDF - All data visible

**Priority**: High **Preconditions**:

- Invoice with complete data exists

**Test Data**:

- Invoice with:
  - Header info (invoice no, date, due date)
  - Customer details
  - 3 line items
  - VAT calculation
  - Totals
  - Terms and conditions

**Steps**:

1. Select comprehensive invoice
2. Export to PDF
3. Open PDF
4. Verify all sections present:
   - Company header
   - Invoice number and date
   - Customer details
   - Line items table
   - Subtotal, VAT, Total
   - Payment terms
5. Scroll through entire document

**Expected Result**:

- Company name/logo visible
- Invoice number: INV-2026-XXXX clearly displayed
- Invoice date: 11/03/2566 (Thai format)
- Due date displayed if set
- Customer details:
  - Name: บริษัท ไทย ทรายด์ จำกัด
  - Address: 123 ถนนสุขุมวิท...
  - Tax ID: 0105551234567
- Line items table with columns:
  - ลำดับ (No.)
  - รายการ (Description)
  - จำนวน (Qty)
  - ราคาต่อหน่วย (Unit Price)
  - จำนวนเงิน (Amount)
- All 3 items listed
- Subtotal: 58,000.00 THB
- VAT (7%): 4,060.00 THB
- Total: 62,060.00 THB
- Payment terms text visible
- No data truncated
- No missing fields

**Actual Result**: [Leave blank for execution] **Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-PDF-INV-004: Export invoice to PDF - Format matches template

**Priority**: High **Preconditions**:

- Approved PDF template exists
- Invoice data available

**Test Data**:

- Standard invoice template reference
- Test invoice

**Steps**:

1. Open approved PDF template design (Figma/Word reference)
2. Export test invoice to PDF
3. Compare layout element by element:
   - Header section
   - Company logo position
   - Invoice metadata placement
   - Customer info section
   - Table layout
   - Totals section
   - Footer
4. Check spacing and alignment
5. Verify colors and fonts

**Expected Result**:

- Header aligned left or center (per design)
- Company logo: Top-left or center, appropriate size
- Invoice title: "ใบกำกับภาษี" bold, larger font (18-24pt)
- Invoice number: Top-right, prominent
- Table headers: Bold, light gray background
- Table rows: Alternating colors (optional)
- Currency aligned right
- Totals section: Right-aligned, bold
- Border lines at appropriate positions
- Page footer: Page numbers, company info
- Colors match branding (primary blue/black)
- Margins: 0.5-1 inch on all sides
- Professional appearance
- Matches approved template exactly

**Actual Result**: [Leave blank for execution] **Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-PDF-INV-005: Export invoice to PDF - Can open in PDF viewer

**Priority**: Medium **Preconditions**:

- PDF file generated
- Multiple PDF viewers available

**Test Data**:

- Exported invoice PDF

**Steps**:

1. Export invoice to PDF
2. Try opening in different viewers:
   - Adobe Acrobat Reader
   - Preview (Mac)
   - Chrome browser
   - Edge browser
   - Foxit Reader (if available)
3. Verify each viewer opens file correctly
4. Test printing from viewer
5. Test copy/paste text

**Expected Result**:

- Adobe Acrobat: Opens without errors
- Preview (Mac): Opens correctly
- Chrome: Displays in browser
- Edge: Displays in browser
- No "file corrupted" errors
- No "unsupported format" errors
- Text is selectable (not image-only)
- Can print from all viewers
- Page breaks correct
- Fonts embedded properly
- File size reasonable (< 500 KB)
- PDF version compatible (1.4-1.7)

**Actual Result**: [Leave blank for execution] **Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-PDF-JRNL-001: Export journal entry to PDF - Basic functionality

**Priority**: Medium **Preconditions**:

- Journal entry exists in POSTED status
- User has accounting role

**Test Data**:

- Journal Entry: JE-2026-0015
- 5 line items
- Balanced entry

**Steps**:

1. Navigate to Journal Entries
2. Select entry JE-2026-0015
3. Click Export PDF
4. Wait for download
5. Open PDF file
6. Verify content

**Expected Result**:

- File downloads: JE-2026-0015.pdf
- File opens successfully
- Entry number prominent
- Date displayed
- Description visible
- Journal lines in table format:
  - Account code and name
  - Description
  - Debit column
  - Credit column
- Totals at bottom
- Debits = Credits
- Posted status indicator
- Approval signature line (if posted)
- Professional format

**Actual Result**: [Leave blank for execution] **Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-PDF-JRNL-002: Export journal entry to PDF - Thai fonts

**Priority**: Medium **Preconditions**:

- Journal entry with Thai descriptions

**Test Data**:

- Entry: "บันทึกค่าเช่ารายเดือนเดือนมีนาคม"
- Thai account names

**Steps**:

1. Select journal entry with Thai text
2. Export to PDF
3. Open PDF
4. Check all Thai text renders

**Expected Result**:

- Thai description renders correctly
- Account names in Thai readable
- Column headers in Thai:
  - "บัญชี" (Account)
  - "รายการ" (Description)
  - "เดบิต" (Debit)
  - "เครดิต" (Credit)
- No missing glyphs
- Font smooth and clear
- Bold text works
- Numbers align correctly

**Actual Result**: [Leave blank for execution] **Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-PDF-JRNL-003: Export journal entry to PDF - All data visible

**Priority**: Medium **Preconditions**:

- Journal entry with multiple lines

**Test Data**:

- Entry with 8 lines
- Various account types

**Steps**:

1. Export multi-line journal entry
2. Open PDF
3. Verify all lines present
4. Check totals
5. Verify balance

**Expected Result**:

- All 8 lines visible
- Account codes and names complete
- Descriptions not truncated
- Debit amounts visible
- Credit amounts visible
- Running totals visible (optional)
- Final totals:
  - Total Debit: XXX,XXX.XX
  - Total Credit: XXX,XXX.XX
  - Balanced indicator
- Entry status shown
- Approver name if posted
- Posted date if applicable

**Actual Result**: [Leave blank for execution] **Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-PDF-JRNL-004: Export journal entry to PDF - Format matches template

**Priority**: Medium **Preconditions**:

- Journal entry template exists

**Test Data**:

- Approved template design

**Steps**:

1. Compare PDF with template
2. Check layout:
   - Header
   - Entry metadata
   - Table structure
   - Totals section
   - Footer
3. Verify alignment
4. Check fonts and sizes

**Expected Result**:

- Title: "บันทึกบัญชีรายวัน" (Journal Entry)
- Entry number and date top-right
- Two-column table for Debit/Credit
- Account codes left-aligned
- Amounts right-aligned
- Grid lines between rows
- Totals section clearly separated
- Footer with page numbers
- Matches approved design
- Professional appearance
- Consistent with other documents

**Actual Result**: [Leave blank for execution] **Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-PDF-JRNL-005: Export journal entry to PDF - Can open in viewer

**Priority**: Low **Preconditions**:

- PDF generated

**Test Data**:

- Journal entry PDF

**Steps**:

1. Open in Adobe Acrobat
2. Open in Preview
3. Open in browser
4. Verify display
5. Test print

**Expected Result**:

- Opens in all viewers
- No corruption
- Text selectable
- Prints correctly
- Fonts embedded
- File size reasonable

**Actual Result**: [Leave blank for execution] **Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-PDF-TB-001: Export trial balance to PDF - Basic functionality

**Priority**: High **Preconditions**:

- Trial balance report available
- User has accounting role

**Test Data**:

- Trial balance as of 2026-03-11
- 20+ accounts with balances

**Steps**:

1. Navigate to Reports > Trial Balance
2. Select date: 2026-03-11
3. Click Generate Report
4. Click Export PDF
5. Wait for generation
6. Open PDF

**Expected Result**:

- File downloads: Trial-Balance-2026-03-11.pdf
- Report title: "งบทดลอง" (Trial Balance)
- As of date: "ณ วันที่ 11 มีนาคม 2566"
- Table shows:
  - Account code
  - Account name
  - Debit balance
  - Credit balance
- All accounts listed
- Totals at bottom
- Debit total = Credit total
- Sorted by account code

**Actual Result**: [Leave blank for execution] **Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-PDF-TB-002: Export trial balance to PDF - Thai fonts

**Priority**: High **Preconditions**:

- Trial balance with Thai account names

**Test Data**:

- Standard Thai chart of accounts

**Steps**:

1. Generate trial balance
2. Export PDF
3. Verify Thai text

**Expected Result**:

- All Thai account names render
- Column headers in Thai:
  - "รหัสบัญชี" (Account Code)
  - "ชื่อบัญชี" (Account Name)
  - "เดบิต" (Debit)
  - "เครดิต" (Credit)
- No missing glyphs
- Clear text
- Professional fonts

**Actual Result**: [Leave blank for execution] **Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-PDF-TB-003: Export trial balance to PDF - All data visible

**Priority**: High **Preconditions**:

- Trial balance generated

**Test Data**:

- All accounts with balances

**Steps**:

1. Export trial balance
2. Verify completeness

**Expected Result**:

- All asset accounts listed (1xxx)
- All liability accounts listed (2xxx)
- All equity accounts listed (3xxx)
- All revenue accounts listed (4xxx)
- All expense accounts listed (5xxx)
- Accounts with zero balance shown (optional)
- Total debits: XXX,XXX.XX
- Total credits: XXX,XXX.XX
- Totals match
- No truncation
- Multi-page if needed with page numbers

**Actual Result**: [Leave blank for execution] **Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-PDF-TB-004: Export trial balance to PDF - Format matches template

**Priority**: Medium **Preconditions**:

- Trial balance template exists

**Test Data**:

- Approved design

**Steps**:

1. Compare with template
2. Check layout
3. Verify formatting

**Expected Result**:

- Company header
- Report title prominent
- Date range visible
- Table structure:
  - Account code column (80-100px)
  - Account name column (300px)
  - Debit column (150px)
  - Credit column (150px)
- Headers bold with background
- Numbers right-aligned
- Totals row bold
- Double underline for totals
- Currency symbol: ฿
- Footer with generation timestamp
- Professional format

**Actual Result**: [Leave blank for execution] **Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-PDF-TB-005: Export trial balance to PDF - Can open in viewer

**Priority**: Low **Preconditions**:

- PDF generated

**Test Data**:

- Trial balance PDF

**Steps**:

1. Test in multiple viewers
2. Verify display
3. Test print

**Expected Result**:

- Opens successfully
- Multi-page handling correct
- Page numbers visible
- Headers repeat on each page (optional)
- Prints correctly
- No corruption

**Actual Result**: [Leave blank for execution] **Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-PDF-IS-001: Export income statement to PDF - Basic functionality

**Priority**: High **Preconditions**:

- Income statement report available

**Test Data**:

- Income statement for period: Jan-Mar 2026

**Steps**:

1. Navigate to Reports > Income Statement
2. Select period: 01/01/2566 - 31/03/2566
3. Click Generate
4. Click Export PDF
5. Open PDF

**Expected Result**:

- File: Income-Statement-Q1-2026.pdf
- Title: "งบกำไรขาดทุน" (Income Statement)
- Period shown: "1 มกราคม - 31 มีนาคม 2566"
- Sections:
  - Revenue (รายได้)
  - Cost of Goods Sold (ต้นทุนขาย)
  - Gross Profit (กำไรขั้นต้น)
  - Operating Expenses (ค่าใช้จ่ายในการดำเนินงาน)
  - Net Profit (กำไรสุทธิ)
- All amounts visible
- Calculations correct

**Actual Result**: [Leave blank for execution] **Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-PDF-IS-002: Export income statement to PDF - Thai fonts

**Priority**: High **Preconditions**:

- Income statement generated

**Test Data**:

- Thai account names

**Steps**:

1. Export income statement
2. Verify Thai text

**Expected Result**:

- All Thai labels render:
  - "รายได้จากการขาย" (Sales Revenue)
  - "รายได้อื่นๆ" (Other Income)
  - "ต้นทุนขาย" (Cost of Goods Sold)
  - "ค่าใช้จ่าย" (Expenses)
  - "กำไรสุทธิ" (Net Profit)
- Account names readable
- No missing glyphs
- Clear fonts

**Actual Result**: [Leave blank for execution] **Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-PDF-IS-003: Export income statement to PDF - All data visible

**Priority**: High **Preconditions**:

- Income statement with all accounts

**Test Data**:

- Complete P&L data

**Steps**:

1. Export report
2. Verify all sections

**Expected Result**:

- Revenue section:
  - Sales: XXX,XXX.XX
  - Service revenue: XXX,XXX.XX
  - Other income: XXX,XXX.XX
  - Total revenue: XXX,XXX.XX
- COGS section:
  - Material cost: XXX,XXX.XX
  - Labor cost: XXX,XXX.XX
  - Total COGS: XXX,XXX.XX
- Gross profit: XXX,XXX.XX (Revenue - COGS)
- Operating expenses:
  - Rent: XXX,XXX.XX
  - Salaries: XXX,XXX.XX
  - Utilities: XXX,XXX.XX
  - Total expenses: XXX,XXX.XX
- Net profit: XXX,XXX.XX
- Percentage calculations (optional)
- No data missing

**Actual Result**: [Leave blank for execution] **Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-PDF-IS-004: Export income statement to PDF - Format matches template

**Priority**: Medium **Preconditions**:

- Template exists

**Test Data**:

- Approved design

**Steps**:

1. Compare layout
2. Check formatting

**Expected Result**:

- Title centered, bold
- Period prominent
- Hierarchical layout:
  - Main categories bold
  - Sub-accounts indented
  - Totals underlined
- Right-aligned numbers
- Negative amounts in parentheses (optional)
- Bottom line (Net Profit) prominent
- Currency symbol: ฿
- Professional format

**Actual Result**: [Leave blank for execution] **Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-PDF-IS-005: Export income statement to PDF - Can open in viewer

**Priority**: Low **Preconditions**:

- PDF generated

**Test Data**:

- Income statement PDF

**Steps**:

1. Open in viewers
2. Test print

**Expected Result**:

- Opens successfully
- Prints correctly
- No corruption
- Text selectable

**Actual Result**: [Leave blank for execution] **Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-PDF-BS-001: Export balance sheet to PDF - Basic functionality

**Priority**: High **Preconditions**:

- Balance sheet report available

**Test Data**:

- Balance sheet as of 31/03/2566

**Steps**:

1. Navigate to Reports > Balance Sheet
2. Select date: 31/03/2566
3. Click Generate
4. Click Export PDF
5. Open PDF

**Expected Result**:

- File: Balance-Sheet-2026-03-31.pdf
- Title: "งบดุล" (Balance Sheet)
- As of date: "ณ วันที่ 31 มีนาคม 2566"
- Two main sections:
  - Assets (สินทรัพย์)
  - Liabilities & Equity (หนี้สินและส่วนของเจ้าของ)
- Subtotals for each section
- Totals balance: Assets = Liabilities + Equity

**Actual Result**: [Leave blank for execution] **Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-PDF-BS-002: Export balance sheet to PDF - Thai fonts

**Priority**: High **Preconditions**:

- Balance sheet generated

**Test Data**:

- Thai account names

**Steps**:

1. Export balance sheet
2. Verify Thai text

**Expected Result**:

- Thai labels render:
  - "สินทรัพย์" (Assets)
  - "สินทรัพย์หมุนเวียน" (Current Assets)
  - "สินทรัพย์ไม่หมุนเวียน" (Non-current Assets)
  - "หนี้สิน" (Liabilities)
  - "ส่วนของเจ้าของ" (Equity)
- Account names readable
- No missing glyphs

**Actual Result**: [Leave blank for execution] **Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-PDF-BS-003: Export balance sheet to PDF - All data visible

**Priority**: High **Preconditions**:

- Complete balance sheet data

**Test Data**:

- All accounts

**Steps**:

1. Export report
2. Verify sections

**Expected Result**:

- Assets section:
  - Current assets:
    - Cash: XXX,XXX.XX
    - Accounts receivable: XXX,XXX.XX
    - Inventory: XXX,XXX.XX
    - Total current assets: XXX,XXX.XX
  - Non-current assets:
    - Fixed assets: XXX,XXX.XX
    - Total non-current: XXX,XXX.XX
  - Total assets: XXX,XXX.XX
- Liabilities section:
  - Current liabilities:
    - Accounts payable: XXX,XXX.XX
    - Total current: XXX,XXX.XX
  - Long-term liabilities: XXX,XXX.XX
  - Total liabilities: XXX,XXX.XX
- Equity section:
  - Capital: XXX,XXX.XX
  - Retained earnings: XXX,XXX.XX
  - Total equity: XXX,XXX.XX
- Total Liabilities & Equity: XXX,XXX.XX
- Balances: Assets = Liabilities + Equity

**Actual Result**: [Leave blank for execution] **Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-PDF-BS-004: Export balance sheet to PDF - Format matches template

**Priority**: Medium **Preconditions**:

- Template exists

**Test Data**:

- Approved design

**Steps**:

1. Compare layout
2. Check format

**Expected Result**:

- Title centered
- Two-column layout:
  - Left: Assets
  - Right: Liabilities & Equity
- Category headers bold
- Sub-accounts indented
- Subtotals underlined
- Final totals bold, double underlined
- Right-aligned numbers
- Balanced verification line
- Professional appearance

**Actual Result**: [Leave blank for execution] **Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-PDF-BS-005: Export balance sheet to PDF - Can open in viewer

**Priority**: Low **Preconditions**:

- PDF generated

**Test Data**:

- Balance sheet PDF

**Steps**:

1. Open in viewers
2. Test print

**Expected Result**:

- Opens successfully
- Two-column layout preserved
- Prints correctly
- No corruption

**Actual Result**: [Leave blank for execution] **Status**: Pass/Fail/Blocked
**Notes**:

---

## Excel Export Test Cases {#excel-export}

### TC-XLS-TB-001: Export trial balance to Excel - Basic functionality

**Priority**: High **Preconditions**:

- Trial balance report generated
- User has accounting role

**Test Data**:

- Trial balance as of 2026-03-11

**Steps**:

1. Navigate to Reports > Trial Balance
2. Generate report
3. Click "Export Excel" button
4. Wait for download
5. Open in Excel/Google Sheets
6. Verify file structure

**Expected Result**:

- File downloads: Trial-Balance-2026-03-11.xlsx
- File size: 20-200 KB
- Opens in Excel without errors
- Opens in Google Sheets
- Opens in LibreOffice Calc (if available)
- Sheet 1 named: "Trial Balance" or "งบทดลอง"
- Data in tabular format:
  - Column A: Account Code
  - Column B: Account Name
  - Column C: Debit
  - Column D: Credit
- Header row in row 1
- Data starts in row 2
- Totals in last row
- No corrupted characters

**Actual Result**: [Leave blank for execution] **Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-XLS-TB-002: Export trial balance to Excel - Thai language support

**Priority**: High **Preconditions**:

- Trial balance with Thai data

**Test Data**:

- Thai account names

**Steps**:

1. Export trial balance to Excel
2. Open file
3. Check Thai text rendering
4. Test on different Excel versions:
   - Excel 2016
   - Excel 2019
   - Excel 365
   - Google Sheets

**Expected Result**:

- All Thai account names display correctly
- Column headers in Thai:
  - รหัสบัญชี
  - ชื่อบัญชี
  - เดบิต
  - เครดิต
- No "???" or garbled text
- UTF-8 encoding
- Fonts render correctly on all Excel versions
- Column widths sufficient for Thai text
- Text wrapping enabled if needed
- Copy/paste works to other applications

**Actual Result**: [Leave blank for execution] **Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-XLS-TB-003: Export trial balance to Excel - Calculations work

**Priority**: High **Preconditions**:

- Excel file exported

**Test Data**:

- Trial balance Excel file

**Steps**:

1. Open exported Excel file
2. Click on total debit cell
3. Verify formula: =SUM(C2:CXX)
4. Click on total credit cell
5. Verify formula: =SUM(D2:DXX)
6. Change one debit amount
7. Verify totals update automatically
8. Test adding a new row

**Expected Result**:

- Totals are formulas, not hardcoded values
- SUM formulas correct
- Totals update when data changes
- Cell references correct
- No broken formulas
- Can add new rows
- Can edit values
- Formulas include new rows if added
- Conditional formatting (optional):
  - Highlight non-zero balances
  - Color code account types
- Print preview works

**Actual Result**: [Leave blank for execution] **Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-XLS-TB-004: Export trial balance to Excel - Formatting

**Priority**: Medium **Preconditions**:

- Excel file exported

**Test Data**:

- Exported file

**Steps**:

1. Open Excel file
2. Check formatting:
   - Font size and type
   - Number formatting
   - Column widths
   - Row heights
   - Cell borders
   - Header styling

**Expected Result**:

- Font: Arial, Calibri, or TH Sarabun (Thai font)
- Font size: 10-12pt
- Header row: Bold, background color
- Numbers formatted as:
  - Currency: ฿#,##0.00 or
  - Accounting: _(฿\* #,##0.00_)
- Column widths:
  - Account code: 80-100px
  - Account name: 300-400px (wider for Thai)
  - Debit: 120px
  - Credit: 120px
- Grid lines visible
- Header freeze enabled (optional)
- Print area set
- Landscape orientation
- Fit to 1 page wide (optional)

**Actual Result**: [Leave blank for execution] **Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-XLS-TB-005: Export trial balance to Excel - Data integrity

**Priority**: High **Preconditions**:

- Trial balance data in system

**Test Data**:

- Compare PDF vs Excel

**Steps**:

1. Export trial balance to PDF
2. Export trial balance to Excel
3. Open both files
4. Compare account counts
5. Compare totals
6. Verify all accounts present

**Expected Result**:

- Same number of accounts in both files
- Same total debits
- Same total credits
- All account codes match
- All account names match
- All amounts match
- No missing accounts
- No extra accounts
- Data type consistency (numbers, not text)
- No truncation
- Accuracy: 100%

**Actual Result**: [Leave blank for execution] **Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-XLS-IS-001: Export income statement to Excel - Basic functionality

**Priority**: High **Preconditions**:

- Income statement available

**Test Data**:

- P&L for Jan-Mar 2026

**Steps**:

1. Navigate to Reports > Income Statement
2. Select period
3. Click Export Excel
4. Open file

**Expected Result**:

- File: Income-Statement-Q1-2026.xlsx
- Opens successfully
- Title row: "งบกำไรขาดทุน"
- Period row: "1 มกราคม - 31 มีนาคม 2566"
- Hierarchical structure:
  - Main categories (Revenue, Expenses)
  - Sub-accounts
  - Totals
- Columns:
  - Account code (optional)
  - Account name
  - Amount
  - Percentage (optional)
- Indentation for hierarchy

**Actual Result**: [Leave blank for execution] **Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-XLS-IS-002: Export income statement to Excel - Thai support

**Priority**: High **Preconditions**:

- Income statement with Thai data

**Test Data**:

- Thai account names

**Steps**:

1. Export to Excel
2. Verify Thai text

**Expected Result**:

- All Thai labels render
- Account names readable
- No encoding issues
- UTF-8 support
- Works in Excel/Google Sheets

**Actual Result**: [Leave blank for execution] **Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-XLS-IS-003: Export income statement to Excel - Calculations

**Priority**: High **Preconditions**:

- Excel file exported

**Test Data**:

- P&L Excel file

**Steps**:

1. Open file
2. Check formulas:
   - Total revenue
   - Gross profit
   - Net profit
3. Change a value
4. Verify recalculations

**Expected Result**:

- Totals use formulas
- Gross Profit = Revenue - COGS
- Net Profit = Gross Profit - Expenses
- Formulas update on change
- Can add rows
- Can edit values
- Conditional formatting for profit/loss

**Actual Result**: [Leave blank for execution] **Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-XLS-IS-004: Export income statement to Excel - Formatting

**Priority**: Medium **Preconditions**:

- Excel file exported

**Test Data**:

- Exported file

**Steps**:

1. Check formatting
2. Verify hierarchy
3. Check print layout

**Expected Result**:

- Indentation for sub-accounts
- Bold totals
- Currency format
- Negative numbers in red or parentheses
- Professional appearance

**Actual Result**: [Leave blank for execution] **Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-XLS-IS-005: Export income statement to Excel - Data integrity

**Priority**: High **Preconditions**:

- Income statement data

**Test Data**:

- PDF and Excel exports

**Steps**:

1. Compare PDF vs Excel
2. Verify all amounts match
3. Check totals

**Expected Result**:

- 100% data accuracy
- All accounts present
- Totals match
- No discrepancies

**Actual Result**: [Leave blank for execution] **Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-XLS-BS-001: Export balance sheet to Excel - Basic functionality

**Priority**: High **Preconditions**:

- Balance sheet available

**Test Data**:

- As of 31/03/2566

**Steps**:

1. Navigate to Reports > Balance Sheet
2. Select date
3. Export Excel
4. Open file

**Expected Result**:

- File: Balance-Sheet-2026-03-31.xlsx
- Two-column layout:
  - Left: Assets
  - Right: Liabilities & Equity
- Categories and subtotals
- Balancing totals

**Actual Result**: [Leave blank for execution] **Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-XLS-BS-002: Export balance sheet to Excel - Thai support

**Priority**: High **Preconditions**:

- Balance sheet data

**Test Data**:

- Thai accounts

**Steps**:

1. Export to Excel
2. Verify Thai text

**Expected Result**:

- All Thai labels render
- No encoding issues
- Readable in Excel/Google Sheets

**Actual Result**: [Leave blank for execution] **Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-XLS-BS-003: Export balance sheet to Excel - Calculations

**Priority**: High **Preconditions**:

- Excel file exported

**Test Data**:

- Balance sheet Excel

**Steps**:

1. Open file
2. Check formulas
3. Test edits
4. Verify balance check

**Expected Result**:

- Subtotals use formulas
- Total Assets formula
- Total Liabilities & Equity formula
- Balance verification
- Formulas update on edit

**Actual Result**: [Leave blank for execution] **Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-XLS-BS-004: Export balance sheet to Excel - Formatting

**Priority**: Medium **Preconditions**:

- Excel file

**Test Data**:

- Exported file

**Steps**:

1. Check two-column layout
2. Verify formatting
3. Test print

**Expected Result**:

- Two distinct columns
- Clear section headers
- Professional format
- Print-ready

**Actual Result**: [Leave blank for execution] **Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-XLS-BS-005: Export balance sheet to Excel - Data integrity

**Priority**: High **Preconditions**:

- Balance sheet data

**Test Data**:

- PDF and Excel

**Steps**:

1. Compare exports
2. Verify balances
3. Check totals

**Expected Result**:

- 100% accuracy
- Assets = Liabilities + Equity
- All data present

**Actual Result**: [Leave blank for execution] **Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-XLS-AR-001: Export AR aging to Excel - Basic functionality

**Priority**: Medium **Preconditions**:

- AR aging report available

**Test Data**:

- AR aging as of today

**Steps**:

1. Navigate to Reports > AR Aging
2. Export Excel
3. Open file

**Expected Result**:

- File: AR-Aging-2026-03-11.xlsx
- Customer list
- Aging columns:
  - Current
  - 1-30 days
  - 31-60 days
  - 61-90 days
  - 90+ days
  - Total

**Actual Result**: [Leave blank for execution] **Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-XLS-AR-002: Export AR aging to Excel - Thai support

**Priority**: Medium **Preconditions**:

- AR data with Thai names

**Test Data**:

- Thai customer names

**Steps**:

1. Export AR aging
2. Verify Thai text

**Expected Result**:

- Thai customer names render
- Column headers in Thai
- No encoding issues

**Actual Result**: [Leave blank for execution] **Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-XLS-AR-003: Export AR aging to Excel - Calculations

**Priority**: Medium **Preconditions**:

- Excel file exported

**Test Data**:

- AR aging Excel

**Steps**:

1. Open file
2. Check total formulas
3. Verify aging calculations

**Expected Result**:

- Row totals use SUM
- Column totals use SUM
- Formulas update on edit
- Conditional formatting (overdue highlighting)

**Actual Result**: [Leave blank for execution] **Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-XLS-AR-004: Export AR aging to Excel - Formatting

**Priority**: Low **Preconditions**:

- Excel file

**Test Data**:

- Exported file

**Steps**:

1. Check formatting
2. Verify color coding

**Expected Result**:

- Currency format
- Color-coded aging periods
- Professional layout

**Actual Result**: [Leave blank for execution] **Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-XLS-AR-005: Export AR aging to Excel - Data integrity

**Priority**: Medium **Preconditions**:

- AR data

**Test Data**:

- System data vs Excel

**Steps**:

1. Compare with system
2. Verify calculations
3. Check totals

**Expected Result**:

- Accurate aging calculations
- Correct totals
- All customers listed

**Actual Result**: [Leave blank for execution] **Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-XLS-AP-001: Export AP aging to Excel - Basic functionality

**Priority**: Medium **Preconditions**:

- AP aging report available

**Test Data**:

- AP aging as of today

**Steps**:

1. Navigate to Reports > AP Aging
2. Export Excel
3. Open file

**Expected Result**:

- File: AP-Aging-2026-03-11.xlsx
- Vendor list
- Aging columns
- Totals

**Actual Result**: [Leave blank for execution] **Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-XLS-AP-002: Export AP aging to Excel - Thai support

**Priority**: Medium **Preconditions**:

- AP data with Thai vendors

**Test Data**:

- Thai vendor names

**Steps**:

1. Export AP aging
2. Verify Thai text

**Expected Result**:

- Thai vendor names render
- Headers in Thai
- No encoding issues

**Actual Result**: [Leave blank for execution] **Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-XLS-AP-003: Export AP aging to Excel - Calculations

**Priority**: Medium **Preconditions**:

- Excel file exported

**Test Data**:

- AP aging Excel

**Steps**:

1. Open file
2. Check formulas
3. Test edits

**Expected Result**:

- SUM formulas for totals
- Formulas update
- Calculations correct

**Actual Result**: [Leave blank for execution] **Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-XLS-AP-004: Export AP aging to Excel - Formatting

**Priority**: Low **Preconditions**:

- Excel file

**Test Data**:

- Exported file

**Steps**:

1. Check formatting
2. Verify layout

**Expected Result**:

- Currency format
- Color coding
- Professional layout

**Actual Result**: [Leave blank for execution] **Status**: Pass/Fail/Blocked
**Notes**:

---

### TC-XLS-AP-005: Export AP aging to Excel - Data integrity

**Priority**: Medium **Preconditions**:

- AP data

**Test Data**:

- System vs Excel

**Steps**:

1. Compare data
2. Verify totals
3. Check accuracy

**Expected Result**:

- 100% accurate
- All vendors listed
- Correct aging

**Actual Result**: [Leave blank for execution] **Status**: Pass/Fail/Blocked
**Notes**:

---

## Appendix: File Verification {#appendix}

### PDF File Verification Checklist

**Basic Checks**:

- [ ] File downloads completely
- [ ] File size reasonable
- [ ] Opens in PDF viewer
- [ ] No corruption errors

**Content Checks**:

- [ ] All text visible
- [ ] Thai fonts render correctly
- [ ] No missing characters
- [ ] Images/logos visible
- [ ] Tables formatted correctly
- [ ] Numbers accurate
- [ ] Calculations correct

**Layout Checks**:

- [ ] Professional appearance
- [ ] Consistent margins
- [ ] Proper alignment
- [ ] Page breaks logical
- [ ] Headers/footers present

**Technical Checks**:

- [ ] PDF version compatible
- [ ] Fonts embedded
- [ ] Text selectable
- [ ] File not password protected (unless required)
- [ ] File size optimized

### Excel File Verification Checklist

**Basic Checks**:

- [ ] File downloads
- [ ] Opens in Excel/Sheets
- [ ] No corruption
- [ ] Multiple sheets if needed

**Content Checks**:

- [ ] All data present
- [ ] Thai text displays
- [ ] No encoding issues
- [ ] Numbers formatted correctly

**Formula Checks**:

- [ ] Totals use SUM formulas
- [ ] Formulas reference correct cells
- [ ] Formulas update on edit
- [ ] No broken formulas

**Formatting Checks**:

- [ ] Professional fonts
- [ ] Appropriate column widths
- [ ] Currency format applied
- [ ] Headers styled
- [ ] Print-ready

### Cross-Platform Testing

**Windows**:

- [ ] Excel 2016
- [ ] Excel 2019
- [ ] Excel 365
- [ ] Adobe Acrobat Reader DC

**macOS**:

- [ ] Excel for Mac
- [ ] Numbers (Apple)
- [ ] Preview (PDF)
- [ ] Adobe Acrobat Reader

**Web**:

- [ ] Google Sheets
- [ ] Excel Online
- [ ] Browser PDF viewers

**Mobile** (optional):

- [ ] Excel app (iOS/Android)
- [ ] Sheets app (iOS/Android)
- [ ] PDF viewers on mobile

---

**Test Case Summary**:

- PDF Export Test Cases: 25 (5 per document type × 5 types)
- Excel Export Test Cases: 25 (5 per report × 5 reports)
- Total Export Test Cases: 50

**Execution Priority**:

1. High Priority: Core reports (TB, IS, BS, Invoices)
2. Medium Priority: Aging reports
3. Low Priority: Nice-to-have features

**Execution Guidelines**:

1. Test PDF exports before Excel exports
2. Verify Thai language support thoroughly
3. Test on multiple platforms
4. Document any formatting issues
5. Report corruption immediately

---

_Document Version: 1.0_ _Last Updated: 2026-03-11_ _QA Engineer: [Your Name]_
_Reviewer: [Manager Name]_
