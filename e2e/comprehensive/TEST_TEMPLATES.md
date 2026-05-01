# Comprehensive E2E Test Templates

This document provides templates and detailed specifications for creating the
remaining comprehensive test files.

## Template Structure

All test files follow this structure:

```typescript
import { test, expect } from '@playwright/test';
import {} from /* test helpers */ './test-helpers';

// Test data variables
let testRecordCode: string;
let testRecordData: any;

test.describe.configure({ mode: 'serial' });

test.describe('Module Name - Comprehensive Tests', () => {
  let apiContext: any;

  test.beforeAll(async () => {
    apiContext = await getAuthenticatedContext('accountant');
  });

  test.afterAll(async () => {
    await apiContext.dispose();
    // Cleanup test data
  });

  test.beforeEach(async ({ page }) => {
    await page.setExtraHTTPHeaders({ 'x-playwright-test': 'true' });
    await loginWithRetry(page, 'accountant');
  });

  // Test sections...
});
```

---

## 5. Invoices Test Template (`invoices.spec.ts`)

### Key Data Structures

```typescript
let testInvoiceNumber: string;
let testCustomerCode: string; // Use existing customer
let testProductCode: string; // Use existing product
```

### Test Sections

1. **Navigation Tests**
   - Navigate to Invoices module
   - Verify page title and summary cards

2. **Create Invoice Tests**
   - Test "New Invoice" button
   - Create draft invoice with customer
   - Add line items with product
   - Verify totals calculation (subtotal, VAT, grand total)
   - Verify invoice in database (DRAFT status)

3. **Edit Invoice Tests**
   - Test "Edit" button on draft invoice
   - Modify line items
   - Change quantities and prices
   - Verify totals recalculated
   - Verify update in database

4. **Delete Invoice Tests**
   - Test "Delete" button on draft invoice
   - Verify confirmation dialog
   - Verify deletion in database

5. **Issue/Post Invoice Tests**
   - Test "Issue" button on draft invoice
   - Verify status changed to ISSUED
   - Verify journal entry created in database
   - Verify VAT record created (output tax)
   - Verify stock movement created (if inventory item)
   - Verify customer balance updated (debit AR)

6. **Invoice Status Workflow Tests**
   - DRAFT → ISSUED → PARTIAL → PAID
   - Test status filters
   - Verify status badges

7. **Search and Filter Tests**
   - Search by invoice number
   - Search by customer name
   - Filter by status
   - Filter by date range

8. **Invoice PDF Tests**
   - Test "Download PDF" button
   - Verify PDF contains invoice details
   - Verify PDF has Thai font rendering

9. **Invoice Line Item Tests**
   - Add multiple line items
   - Remove line items
   - Change line item quantities
   - Verify line item calculations

10. **Integration Tests**
    - Verify invoice appears in customer balance
    - Verify invoice appears in VAT report
    - Verify invoice appears in sales report

### Database Verification Points

- Invoice record created with correct status
- Journal entry created with debit AR, credit Sales, credit VAT
- VAT record created with output tax
- Stock movement created (type: ISSUE) if inventory item
- Customer balance increased

### Critical Assertions

```typescript
// Invoice created
await verifyRecordExists(apiContext, '/api/invoices', invoiceNumber, {
  status: 'DRAFT',
  customerId: testCustomerCode,
});

// Journal entry posted
const journalEntry = await apiContext.get(
  `/api/journal-entries?invoiceNumber=${invoiceNumber}`
);
expect(journalEntry.data.length).toBeGreaterThan(0);

// VAT record created
const vatRecord = await apiContext.get(
  `/api/vat-records?invoiceNumber=${invoiceNumber}`
);
expect(vatRecord.data.length).toBeGreaterThan(0);
```

---

## 6. Purchase Invoices Test Template (`purchases.spec.ts`)

### Test Sections

1. **Navigation Tests**
   - Navigate to Purchases module
   - Verify page title

2. **Create Purchase Tests**
   - Test "New Purchase" button
   - Create draft purchase with vendor
   - Add line items
   - Verify totals calculation
   - Verify purchase in database (DRAFT status)

3. **Edit Purchase Tests**
   - Test "Edit" button on draft purchase
   - Modify line items
   - Verify totals recalculated

4. **Delete Purchase Tests**
   - Test "Delete" button on draft purchase
   - Verify deletion in database

5. **Issue/Post Purchase Tests**
   - Test "Issue" button
   - Verify status changed to ISSUED
   - Verify journal entry created (debit Purchases, debit VAT, credit AP)
   - Verify VAT input record created
   - Verify stock movement created (type: RECEIVE)
   - Verify vendor balance updated

6. **Purchase Status Workflow Tests**
   - DRAFT → ISSUED → PARTIAL → PAID

7. **Search and Filter Tests**
   - Search by purchase number
   - Search by vendor name
   - Filter by status

### Database Verification Points

- Purchase record created
- Journal entry created (debit Purchases/VAT Input, credit AP)
- VAT input record created
- Stock movement created (type: RECEIVE)
- Vendor balance increased

---

## 7. Receipts Test Template (`receipts.spec.ts`)

### Test Sections

1. **Create Receipt Tests**
   - Test "New Receipt" button
   - Select customer
   - View unpaid invoices list
   - Allocate payment to single invoice
   - Verify allocation in database

2. **Multiple Invoice Allocation Tests**
   - Allocate payment to multiple invoices
   - Verify prorated allocation
   - Verify allocations in database

3. **WHT Deduction Tests**
   - Add WHT deduction to receipt
   - Verify WHT record created
   - Verify WHT amount calculated correctly

4. **Post Receipt Tests**
   - Test "Post" button
   - Verify journal entry created:
     - Debit Cash/Bank
     - Credit AR
     - Credit WHT Payable (if WHT deducted)
   - Verify invoice balance updated
   - Verify invoice status changed (PAID or PARTIAL)

5. **Receipt Payment Methods Tests**
   - Test cash payment
   - Test cheque payment
   - Test bank transfer
   - Verify payment method recorded

6. **Search and Filter Tests**
   - Search by receipt number
   - Filter by customer
   - Filter by date range

### Database Verification Points

- Receipt record created
- ReceiptAllocation records created (linked to invoices)
- WHT record created (if applicable)
- Journal entry created
- Invoice balances updated
- Invoice statuses updated

---

## 8. Payments Test Template (`payments.spec.ts`)

### Test Sections

1. **Create Payment Tests**
   - Test "New Payment" button
   - Select vendor
   - View unpaid purchase invoices
   - Allocate payment to single invoice
   - Verify allocation in database

2. **Multiple Invoice Allocation Tests**
   - Allocate payment to multiple invoices
   - Verify allocations

3. **WHT Deduction Tests**
   - Add WHT deduction (PND53)
   - Select WHT rate (service, rent, professional, etc.)
   - Verify WHT calculated correctly
   - Verify WHT record created

4. **Post Payment Tests**
   - Test "Post" button
   - Verify journal entry created:
     - Credit Cash/Bank
     - Debit AP
     - Debit WHT Payable (if WHT deducted)
   - Verify purchase invoice balance updated
   - Verify invoice status updated

5. **Payment by Cheque Tests**
   - Create payment with cheque
   - Verify cheque record created
   - Verify cheque details (number, date, bank)
   - Link cheque to payment

6. **Cheque Workflow Tests**
   - Test cheque status: ON_HAND → DEPOSITED → CLEARED/BOUNCED

### Database Verification Points

- Payment record created
- PaymentAllocation records created
- WHT record created (if applicable)
- Journal entry created
- Cheque record created (if applicable)
- Purchase invoice balances updated

---

## 9. Assets Test Template (`assets.spec.ts`)

### Test Sections

1. **Create Asset Tests**
   - Test "Add Asset" button
   - Fill asset details:
     - Code, Name
     - Purchase date
     - Cost (ราคาทุน)
     - Salvage value (ค่าซาก)
     - Useful life (อายุการใช้งาน) in years
   - Verify asset created in database
   - Verify depreciation schedule created
   - Verify NBV (Net Book Value) calculated

2. **Depreciation Schedule Tests**
   - Test "View" button to see schedule
   - Verify monthly depreciation amount
   - Verify straight-line calculation
   - Verify schedule has correct number of periods

3. **Edit Asset Tests**
   - Test "Edit" button
   - Modify asset details
   - Verify update in database

4. **Delete Asset Tests**
   - Test "Delete" button with validation
   - Verify cannot delete if has depreciation entries

5. **Status Toggle Tests**
   - Test activate/deactivate asset
   - Verify status updated in database

6. **Asset Summary Tests**
   - Verify summary cards:
     - Total assets count
     - Total cost
     - Total NBV (Net Book Value)

7. **Search and Filter Tests**
   - Search by asset code/name
   - Filter by status (active/inactive)

### Database Verification Points

- Asset record created
- DepreciationSchedule records created (one per month)
- NBV calculated correctly: Cost - Accumulated Depreciation
- Monthly depreciation = (Cost - Salvage Value) / Useful Life (months)

---

## 10. Banking Test Template (`banking.spec.ts`)

### Test Sections - Bank Accounts Tab

1. **Create Bank Account Tests**
   - Test "Add Bank Account" button
   - Fill account details:
     - Code, Name
     - Bank name
     - Account number
     - Account type (Savings, Current, Fixed)
     - Opening balance
   - Verify account created

2. **Edit Bank Account Tests**
   - Test "Edit" button
   - Modify account details

3. **Delete Bank Account Tests**
   - Test "Delete" button with validation

### Test Sections - Cheques Tab

4. **Create Cheque Tests**
   - Test "Add Cheque" button
   - Fill cheque details:
     - Cheque number
     - Date
     - Bank name
     - Payee/Recipient
     - Amount
     - Type (received/issued)
   - Verify cheque created

5. **Cheque Actions Tests**
   - Test "Deposit" quick action
     - Verify status changed to DEPOSITED
   - Test "Clear" quick action
     - Verify status changed to CLEARED
     - Verify journal entry created (debit bank, credit clearing)
   - Test "Bounce" quick action
     - Verify status changed to BOUNCED
     - Verify reversal journal entry created

6. **Cheque Search Tests**
   - Search by cheque number
   - Filter by status
   - Filter by bank

### Test Sections - Reconciliation Tab

7. **Bank Reconciliation Tests**
   - Select bank account
   - Enter statement date
   - Enter statement balance
   - Match transactions
   - Create reconciliation record
   - Verify reconciliation saved

### Database Verification Points

- BankAccount record created
- Cheque record created
- Cheque status workflow: ON_HAND → DEPOSITED → CLEARED/BOUNCED → CANCELLED
- Journal entries for cleared cheques
- Reconciliation record created

---

## 11. Payroll Test Template (`payroll.spec.ts`)

### Test Sections - Employees Tab

1. **Create Employee Tests**
   - Test "Add Employee" button
   - Fill employee details:
     - Code, Name (Thai and English)
     - Position
     - Department
     - Start date
     - Base salary
     - SSC number
     - Tax ID
     - Address (Thai format)
   - Verify employee created

2. **Edit Employee Tests**
   - Test "Edit" button
   - Modify employee details

3. **Delete Employee Tests**
   - Test "Delete" button with validation

### Test Sections - Payroll Runs Tab

4. **Create Payroll Run Tests**
   - Test "Create Payroll Run" button
   - Select month/year
   - Select payment date
   - Select employees to include
   - Verify calculations:
     - **SSC (Social Security)**:
       - Employee: 5% of salary, capped at ฿750/month
       - Employer: 5% of salary, capped at ฿750/month
     - **PND1 (Withholding Tax)**:
       - Use 2024 progressive rates
       - Apply personal allowance (฿60,000/year)
       - Convert monthly to annual for calculation
     - **Net Pay**:
       - Base Salary - SSC - PND1
   - Create payroll run
   - Verify payroll records in database

5. **Approve Payroll Tests**
   - Test "Approve" button
   - Verify journal entry created:
     - Debit Salary Expense
     - Credit SSC Payable (employee portion)
     - Credit PND1 Payable
     - Credit Net Pay/Salaries Payable
     - Debit SSC Expense (employer portion)
     - Credit SSC Payable (employer portion)

6. **Mark Paid Tests**
   - Test "Mark Paid" button
   - Verify status changed to PAID
   - Verify payment records created

7. **Payroll Search Tests**
   - Search by employee name
   - Filter by month/year
   - Filter by status

### Database Verification Points

- Employee record created
- PayrollRun record created
- Payroll records created (one per employee)
- SSC calculations: 5% capped at ฿750
- PND1 calculations: 2024 progressive rates
- Journal entry created with correct accounts

### SSC Calculation Example

```typescript
// Employee salary: ฿20,000
// Employee SSC: 5% of 20,000 = ฿1,000 → capped at ฿750
// Employer SSC: 5% of 20,000 = ฿1,000 → capped at ฿750

const employeeSSC = Math.min(salary * 0.05, 750);
const employerSSC = Math.min(salary * 0.05, 750);
```

### PND1 Progressive Rates (2024)

```
0 - 150,000:   0%
150,001 - 500,000:   5%
500,001 - 1,000,000:  10%
1,000,001 - 2,000,000: 15%
2,000,001 - 5,000,000: 20%
5,000,001+:  35%
```

---

## 12. Petty Cash Test Template (`petty-cash.spec.ts`)

### Test Sections - Funds Tab

1. **Create Fund Tests**
   - Test "Add Fund" button
   - Fill fund details:
     - Code, Name
     - Custodian (ผู้ถือกองทุน)
     - Initial amount (วงเงิน)
     - Department/Location
   - Verify fund created
   - Verify fund balance equals initial amount

2. **Edit Fund Tests**
   - Test "Edit" button
   - Modify fund details

3. **Delete Fund Tests**
   - Test "Delete" button with validation
   - Verify cannot delete if has vouchers

4. **Fund Balance Tests**
   - Verify fund balance display
   - Verify balance progress bar
   - Verify low balance warning (>80% used)

### Test Sections - Vouchers Tab

5. **Create Voucher Tests**
   - Test "Add Voucher" button
   - Select fund
   - Fill voucher details:
     - Date
     - Pay to (จ่ายให้)
     - Description
     - Amount
     - Category (expense account)
   - Verify voucher created
   - Verify fund balance decreased

6. **Edit Voucher Tests**
   - Test "Edit" button (only if PENDING status)
   - Modify voucher details
   - Verify fund balance updated

7. **Delete Voucher Tests**
   - Test "Delete" button (only if PENDING status)
   - Verify fund balance restored

8. **Approve Voucher Tests**
   - Test "Approve" button
   - Verify voucher status changed to APPROVED
   - Verify journal entry created:
     - Debit Expense Account
     - Credit Petty Cash Account
   - Verify fund balance decreased (permanent)

9. **Reimburse Voucher Tests**
   - Test "Reimburse" button
   - Enter reimbursement amount
   - Verify reimbursement journal entry created:
     - Debit Petty Cash Account
     - Credit Cash/Bank
   - Verify fund balance restored

### Database Verification Points

- PettyCashFund record created
- PettyCashVoucher record created
- Fund balance tracked correctly
- Journal entries created on approve/reimburse
- Voucher status workflow: PENDING → APPROVED → REIMBURSED

---

## 13. Inventory Test Template (`inventory.spec.ts`)

### Test Sections - Stock Balances Tab

1. **View Stock Tests**
   - Verify stock levels displayed
   - Verify WAC (Weighted Average Cost) calculated
   - Verify total stock value

2. **Adjust Stock Tests**
   - Test "Adjust" button
   - Select product
   - Select warehouse
   - Enter adjustment quantity (positive or negative)
   - Enter reason
   - Create adjustment
   - Verify stock movement created (type: ADJUST)
   - Verify stock balance updated
   - Verify WAC cost recalculated

### Test Sections - Stock Movements Tab

3. **View Movements Tests**
   - View movement history
   - Verify movement details:
     - Date, Type, Product, Warehouse, Quantity, Cost
   - Filter by movement type

4. **Movement Type Filters Tests**
   - Filter by: RECEIVE, ISSUE, TRANSFER_OUT, TRANSFER_IN, ADJUST, COUNT

5. **Edit Movement Tests**
   - Test "Edit" button
   - Modify movement notes
   - Verify update in database

6. **Reverse Movement Tests**
   - Test "Reverse" button
   - Verify correcting movement created
   - Verify stock balance corrected

### Test Sections - Warehouses Tab

7. **Create Warehouse Tests**
   - Test "Add Warehouse" button
   - Fill warehouse details:
     - Code, Name
     - Location
     - Manager
   - Verify warehouse created

8. **Edit Warehouse Tests**
   - Test "Edit" button
   - Modify warehouse details

9. **Delete Warehouse Tests**
   - Test "Delete" button with validation
   - Verify cannot delete if has stock

### Test Sections - Transfers Tab

10. **Create Transfer Tests**
    - Test "Create Transfer" button
    - Select source warehouse
    - Select destination warehouse
    - Select product
    - Enter quantity
    - Create transfer
    - Verify TRANSFER_OUT movement created
    - Verify stock decreased at source

11. **Complete Transfer Tests**
    - Test "Complete" button
    - Verify TRANSFER_IN movement created
    - Verify stock increased at destination
    - Verify transfer status changed to COMPLETED

### Database Verification Points

- StockBalance records created/updated
- StockMovement records created with correct type
- WAC cost recalculated after each movement
- Warehouse records created
- Transfer records created with status

### WAC Calculation Example

```typescript
// Initial: 10 units @ ฿100 = ฿1,000
// Receive: 20 units @ ฿120 = ฿2,400
// New WAC = (1,000 + 2,400) / (10 + 20) = ฿113.33

const newWAC = (totalCost + incomingCost) / (totalQty + incomingQty);
```

---

## 14. Credit Notes Test Template (`credit-notes.spec.ts`)

### Test Sections

1. **Create Credit Note Tests**
   - Test "New Credit Note" button
   - Select customer
   - Select invoice to credit
   - Add line items with quantities
   - Check "Return Stock" if applicable
   - Verify totals calculated
   - Create credit note
   - Verify credit note in database

2. **Issue Credit Note Tests**
   - Test "Issue" button
   - Verify journal entry created:
     - Debit Sales Returns
     - Debit VAT (if applicable)
     - Credit AR
   - Verify stock added back (if return stock checked)
   - Verify invoice balance decreased
   - Verify invoice status updated

3. **Search and Filter Tests**
   - Search by credit note number
   - Filter by customer
   - Filter by status

4. **Credit Note PDF Tests**
   - Test "Download PDF" button
   - Verify PDF contains credit note details

### Database Verification Points

- CreditNote record created
- Journal entry created (debit Sales Returns, credit AR)
- Stock movement created (type: RECEIVE) if return stock
- Invoice balance decreased
- Invoice status updated

---

## 15. Debit Notes Test Template (`debit-notes.spec.ts`)

### Test Sections

1. **Create Debit Note Tests**
   - Test "New Debit Note" button
   - Select vendor
   - Select purchase invoice to debit
   - Add line items with quantities
   - Verify totals calculated
   - Create debit note
   - Verify debit note in database

2. **Issue Debit Note Tests**
   - Test "Issue" button
   - Verify journal entry created:
     - Debit Purchases (or relevant expense account)
     - Debit VAT (if applicable)
     - Credit AP
   - Verify stock updated (if applicable)
   - Verify purchase invoice balance decreased
   - Verify invoice status updated

3. **Search and Filter Tests**
   - Search by debit note number
   - Filter by vendor
   - Filter by status

4. **Debit Note PDF Tests**
   - Test "Download PDF" button
   - Verify PDF contains debit note details

### Database Verification Points

- DebitNote record created
- Journal entry created (debit Purchases, credit AP)
- Stock movement created (if applicable)
- Purchase invoice balance decreased
- Invoice status updated

---

## Quick Reference: Thai Accounting Terms

| Thai              | English             | Context               |
| ----------------- | ------------------- | --------------------- |
| บัญชี             | Account             | Chart of Accounts     |
| ลูกหนี้           | Accounts Receivable | Customers             |
| เจ้าหนี้          | Accounts Payable    | Vendors               |
| ใบกำกับภาษี       | Tax Invoice         | Sales Invoice         |
| ใบซื้อ            | Purchase Invoice    | Purchase              |
| ใบเสร็จรับเงิน    | Receipt             | Payment from customer |
| ใบจ่ายเงิน        | Payment Voucher     | Payment to vendor     |
| ใบลดหนี้          | Credit Note         | Sales return          |
| ใบเพิ่มหนี้       | Debit Note          | Purchase return       |
| ภาษีมูลค่าเพิ่ม   | VAT                 | Value Added Tax       |
| ภาษีหัก ณ ที่จ่าย | WHT                 | Withholding Tax       |
| ประกันสังคม       | SSC                 | Social Security       |
| สต็อกสินค้า       | Inventory           | Stock management      |
| ทรัพย์สินถาวร     | Fixed Assets        | Assets                |
| เงินสดย่อย        | Petty Cash          | Petty cash            |
| คลังสินค้า        | Warehouse           | Inventory location    |
| ต้นทุนเฉลี่ย      | WAC                 | Weighted Average Cost |

---

## Implementation Checklist

For each test file, ensure:

- [ ] All buttons are clicked and tested
- [ ] All form fields are filled with valid and invalid data
- [ ] All validation rules are tested
- [ ] Database state is verified after each operation
- [ ] Toast notifications are checked
- [ ] Error messages are verified
- [ ] Search and filter functionality tested
- [ ] Pagination tested (if applicable)
- [ ] Export functionality tested
- [ ] Integration with related modules tested
- [ ] Screenshots captured for main views
- [ ] Test data cleaned up in afterAll
- [ ] Comments added for complex logic
- [ ] Thai and English UI elements tested

---

## Running Tests

```bash
# Run all comprehensive tests
bun run test:e2e e2e/comprehensive

# Run specific test file
bun run test:e2e e2e/comprehensive/invoices.spec.ts

# Run with UI mode
bun run test:e2e:ui e2e/comprehensive

# Run specific test
bun run test:e2e e2e/comprehensive/invoices.spec.ts -g "CREATE"
```
