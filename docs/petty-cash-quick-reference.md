# Petty Cash API Quick Reference

## Base URL

```
/api/petty-cash
```

## Endpoints

### Vouchers

#### List Vouchers

```http
GET /api/petty-cash/vouchers?fundId={id}&isReimbursed={boolean}
```

#### Create Voucher

```http
POST /api/petty-cash/vouchers
Content-Type: application/json

{
  "fundId": "string",
  "payee": "string",
  "description": "string",
  "amount": number,
  "glExpenseAccountId": "string",
  "date": "ISO-8601-date"
}
```

#### Get Voucher

```http
GET /api/petty-cash/vouchers/{id}
```

#### Delete Voucher (unapproved only)

```http
DELETE /api/petty-cash/vouchers/{id}
```

#### Approve Voucher (creates journal entry)

```http
POST /api/petty-cash/vouchers/{id}/approve
```

**Creates Journal Entry**:

- Dr: Expense account
- Cr: Petty cash fund
- Status: POSTED

#### Reimburse Fund

```http
POST /api/petty-cash/vouchers/{id}/reimburse
Content-Type: application/json

{
  "cashBankAccountId": "string"
}
```

**Creates Journal Entry**:

- Dr: Petty cash fund
- Cr: Cash/bank account
- Updates fund balance

### Funds

#### List Funds

```http
GET /api/petty-cash/funds
```

#### Create Fund

```http
POST /api/petty-cash/funds
Content-Type: application/json

{
  "code": "string",
  "name": "string",
  "custodianId": "string",
  "glAccountId": "string",
  "maxAmount": number
}
```

## Response Format

### Success

```json
{
  "success": true,
  "data": { ... },
  "message": "Thai success message"
}
```

### Error

```json
{
  "success": false,
  "error": "Thai error message"
}
```

## Journal Entry Structure

### Approval Entry

```
Description: เบิกเงินสดย่อย {voucherNo} - {description}
Document Type: PETTY_CASH_VOUCHER
Status: POSTED

Line 1:
  Account: {glExpenseAccountId}
  Debit: {amount}
  Credit: 0
  Description: {description} (ค่าใช้จ่าย)

Line 2:
  Account: {pettyCashFundAccountId}
  Debit: 0
  Credit: {amount}
  Description: เงินสดย่อย ({payee})
```

### Reimbursement Entry

```
Description: เติมเงินสดย่อย {fundName} ใบเบิก {voucherNo}
Document Type: PETTY_CASH_REIMBURSEMENT
Status: POSTED

Line 1:
  Account: {pettyCashFundAccountId}
  Debit: {amount}
  Credit: 0
  Description: เติมเงินสดย่อย {fundName}

Line 2:
  Account: {cashBankAccountId}
  Debit: 0
  Credit: {amount}
  Description: เติมเงินสดย่อย ({payee})
```

## Common Errors

| Error                                    | Cause                     | Solution                     |
| ---------------------------------------- | ------------------------- | ---------------------------- |
| เงินสดย่อยไม่เพียงพอ                     | Insufficient fund balance | Reimburse fund first         |
| ได้รับการอนุมัติแล้ว                     | Already approved          | Check existing journal entry |
| ได้รับการเติมเงินแล้ว                    | Already reimbursed        | Cannot reimburse twice       |
| ไม่สามารถลบใบเบิกที่ได้รับการอนุมัติแล้ว | Cannot delete approved    | Use reversing entry          |
| ไม่พบบัญชีเงินสด/ธนาคาร                  | Invalid cash/bank account | Provide valid account ID     |

## Status Flow

```
CREATED
  ↓ (approve)
APPROVED (journalEntryId set)
  ↓ (reimburse)
REIMBURSED (isReimbursed = true)
```

## Database Fields

### PettyCashVoucher

- `id`: Primary key
- `voucherNo`: Unique voucher number
- `fundId`: FK to PettyCashFund
- `journalEntryId`: FK to JournalEntry (after approval)
- `glExpenseAccountId`: FK to ChartOfAccount (expense)
- `amount`: Voucher amount
- `isReimbursed`: Boolean

### PettyCashFund

- `id`: Primary key
- `glAccountId`: FK to ChartOfAccount (asset)
- `currentBalance`: Current fund balance
- `maxAmount`: Maximum fund amount

## Validation Rules

1. Fund balance ≥ voucher amount (at creation)
2. voucher.journalEntryId = null (to approve)
3. voucher.isReimbursed = false (to reimburse)
4. Debits = Credits (journal entry)
5. Cash/Bank account exists (to reimburse)

## Example Workflow

```javascript
// 1. Create voucher
const voucher = await fetch('/api/petty-cash/vouchers', {
  method: 'POST',
  body: JSON.stringify({
    fundId: 'fund_123',
    payee: 'สมชาย ใจดี',
    description: 'ซื้อเอกสาร',
    amount: 500,
    glExpenseAccountId: 'exp_456',
  }),
}).then((r) => r.json());

// 2. Approve (creates journal entry)
await fetch(`/api/petty-cash/vouchers/${voucher.data.id}/approve`, {
  method: 'POST',
});

// 3. Reimburse (optional)
await fetch(`/api/petty-cash/vouchers/${voucher.data.id}/reimburse`, {
  method: 'POST',
  body: JSON.stringify({
    cashBankAccountId: 'cash_789',
  }),
});
```

## TypeScript Types

```typescript
interface PettyCashVoucher {
  id: string;
  voucherNo: string;
  fundId: string;
  date: Date;
  amount: number;
  payee: string;
  description: string;
  glExpenseAccountId: string;
  journalEntryId?: string;
  isReimbursed: boolean;
  createdAt: Date;
}

interface PettyCashFund {
  id: string;
  code: string;
  name: string;
  custodianId: string;
  glAccountId: string;
  maxAmount: number;
  currentBalance: number;
  isActive: boolean;
}
```
