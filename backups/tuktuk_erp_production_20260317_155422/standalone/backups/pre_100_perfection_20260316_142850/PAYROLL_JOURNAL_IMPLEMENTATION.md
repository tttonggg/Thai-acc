# Payroll GL Journal Entry Implementation

## Overview
Implemented automatic GL journal entry generation for payroll transactions in the Thai Accounting ERP System. When payroll is approved, a balanced journal entry is automatically created following Thai accounting standards.

## Files Modified

### 1. `/Users/tong/Thai-acc/src/lib/payroll-service.ts`
**Added Function**: `createPayrollJournalEntry()`

This function creates a complete journal entry when payroll is approved/posted with the following breakdown:

#### Journal Entry Structure

**Debit Entries (Expenses):**
1. **Salary Expense (5310 - เงินเดือนและค่าจ้าง)**
   - Amount: Total gross salary
   - Description: "เงินเดือนและค่าจ้าง MM/YYYY"

2. **Employer SSC Expense (5310 - เงินเดือนและค่าจ้าง)**
   - Amount: Total employer Social Security contribution
   - Description: "ประกันสังคมส่วนนายจ้าง MM/YYYY"
   - Calculation: 5% of each employee's base salary, capped at ฿750/month

**Credit Entries (Liabilities):**
1. **SSC Payable (2133 - ประกันสังคมต้องจ่าย)**
   - Amount: Total employee SSC deducted
   - Description: "ประกันสังคมส่วนลูกจ้าง MM/YYYY"
   - This is the employee's portion deducted from gross salary

2. **WHT Payable (2131 - ภาษีเงินได้หัก ณ ที่จ่าย)**
   - Amount: Total income tax withheld (PND1)
   - Description: "ภาษีเงินได้หัก ณ ที่จ่าย (ภงด.1) MM/YYYY"
   - This is the PND1 withholding tax deducted from employees

3. **Wages Payable (2140 - เงินเดือนต้องจ่าย)**
   - Amount: Total net salary payable to employees
   - Description: "เงินเดือนต้องจ่าย MM/YYYY"
   - This is the net amount to be paid to employees

#### Double-Entry Validation
The function ensures that:
```
Total Debit = Total Credit
(Gross Salary + Employer SSC) = (Employee SSC + WHT + Net Pay)
```

### 2. `/Users/tong/Thai-acc/src/app/api/payroll/[id]/route.ts`
**New File**: Individual payroll run operations endpoint

#### PATCH Endpoint
**URL**: `PATCH /api/payroll/[id]`

**Request Body**:
```json
{
  "action": "approve" | "post" | "markPaid"
}
```

**Actions**:

1. **approve/post** - Approve payroll and create journal entry
   - Validates: Status must be DRAFT
   - Creates: Journal entry via `createPayrollJournalEntry()`
   - Updates: Status to APPROVED
   - Returns: Updated payroll run + journal entry

2. **markPaid** - Mark payroll as paid
   - Validates: Status must be APPROVED
   - Updates: Status to PAID
   - Returns: Updated payroll run

#### GET Endpoint
**URL**: `GET /api/payroll/[id]`

Returns a single payroll run with all employee details included.

## Account Codes Used

| Account Code | Account Name (TH) | Account Name (EN) | Type |
|--------------|-------------------|-------------------|------|
| 5310 | เงินเดือนและค่าจ้าง | Salaries and Wages | EXPENSE |
| 2133 | ประกันสังคมต้องจ่าย | Social Security Payable | LIABILITY |
| 2131 | ภาษีเงินได้หัก ณ ที่จ่าย | Withholding Tax Payable | LIABILITY |
| 2140 | เงินเดือนต้องจ่าย | Wages Payable | LIABILITY |

## Journal Entry Number Format

Format: `PAY-YYYYMM-NNNN`

Example: `PAY-202603-0001`
- `PAY` - Prefix for payroll entries
- `202603` - Year and month (2026, March)
- `0001` - Sequential number

## Usage Example

### 1. Create a Payroll Run
```bash
POST /api/payroll
{
  "periodMonth": 3,
  "periodYear": 2026,
  "paymentDate": "2026-03-25"
}
```

Response includes payroll run ID (e.g., `clx123abc`).

### 2. Approve Payroll (Creates Journal Entry)
```bash
PATCH /api/payroll/clx123abc
{
  "action": "approve"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "payrollRun": {
      "id": "clx123abc",
      "runNo": "PAY-202603-001",
      "status": "APPROVED",
      "journalEntryId": "clx456def",
      ...
    },
    "journalEntry": {
      "id": "clx456def",
      "entryNo": "PAY-202603-0001",
      "totalDebit": 150000.00,
      "totalCredit": 150000.00,
      "lines": [...]
    }
  }
}
```

### 3. Mark as Paid
```bash
PATCH /api/payroll/clx123abc
{
  "action": "markPaid"
}
```

## Validation

The implementation includes comprehensive validation:

1. **Account Existence**: All required GL accounts must exist
2. **Double-Entry Balance**: Debits must equal credits (within 0.01 tolerance)
3. **Status Transitions**:
   - DRAFT → APPROVED (with journal entry creation)
   - APPROVED → PAID
4. **Duplicate Prevention**: Cannot create journal entry if one already exists

## Thai Tax Compliance

The implementation follows Thai tax regulations:

1. **Social Security (ประกันสังคม)**
   - Employee: 5% of base salary, capped at ฿750/month
   - Employer: 5% of base salary, capped at ฿750/month
   - Reference: Thai Social Security Act

2. **PND1 Withholding Tax (ภงด.1)**
   - Progressive rates based on annual income
   - Personal allowance: ฿60,000
   - Monthly calculation from annual income

3. **Employer SSC as Expense**
   - Employer's portion is recorded as additional salary expense
   - This is the correct accounting treatment per Thai standards

## Database Schema Links

- `PayrollRun.journalEntryId` → `JournalEntry.id` (foreign key)
- `JournalEntry.documentId` → `PayrollRun.id` (back-reference)
- `JournalEntry.documentType` = `'PAYROLL'`

## Testing

To test the implementation:

1. Ensure test employees exist in the database
2. Create a payroll run via POST /api/payroll
3. Approve via PATCH /api/payroll/[id] with action="approve"
4. Verify journal entry was created with balanced debits/credits
5. Check that PayrollRun.journalEntryId is populated

## Notes

- Journal entries are created with `status: 'POSTED'` automatically
- The entry date uses the payroll payment date
- All amounts are in Thai Baht (฿) with 2 decimal places (Satang)
- Employer SSC is calculated separately and added to the debit total
- The implementation follows the same pattern as asset depreciation (reference: `/Users/tong/Thai-acc/src/lib/asset-service.ts`)
