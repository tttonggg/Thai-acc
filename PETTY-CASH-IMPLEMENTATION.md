# Petty Cash GL Journal Entries Implementation

## Summary

This implementation adds automatic GL journal entry generation for petty cash vouchers in the Thai Accounting ERP System. When a petty cash voucher is approved or reimbursed, corresponding journal entries are created automatically.

## Files Created

### 1. Petty Cash Service
**File**: `/Users/tong/Thai-acc/src/lib/petty-cash-service.ts`

**Purpose**: Core service for handling petty cash voucher operations

**Key Function**: `createVoucherJournalEntry()`
- Creates journal entry when voucher is approved
- Double-entry bookkeeping:
  - **Debit**: Expense account (from voucher's `glExpenseAccountId`)
  - **Credit**: Petty cash fund account (from fund's `glAccountId`)
- Auto-sets status to 'POSTED'
- Generates sequential journal entry numbers (JV-YYYYMM-NNNN format)

**Parameters**:
```typescript
{
  voucherId: string
  voucherNo: string
  voucherDate: Date
  amount: number
  payee: string
  description: string
  glExpenseAccountId: string
  pettyCashFundAccountId: string
}
```

### 2. Approve Voucher Endpoint
**File**: `/Users/tong/Thai-acc/src/app/api/petty-cash/vouchers/[id]/approve/route.ts`

**Endpoint**: `POST /api/petty-cash/vouchers/[id]/approve`

**Purpose**: Approve a petty cash voucher and create GL journal entry

**Process**:
1. Validates voucher exists
2. Checks if already approved (has `journalEntryId`)
3. Creates journal entry via service
4. Links journal entry to voucher
5. Returns updated voucher and journal entry

**Response**:
```json
{
  "success": true,
  "data": {
    "voucher": {...},
    "journalEntry": {...}
  },
  "message": "อนุมัติใบเบิกเงินสดย่อยและบันทึกบัญชีสำเร็จ"
}
```

### 3. Reimburse Voucher Endpoint
**File**: `/Users/tong/Thai-acc/src/app/api/petty-cash/vouchers/[id]/reimburse/route.ts`

**Endpoint**: `POST /api/petty-cash/vouchers/[id]/reimburse`

**Purpose**: Reimburse petty cash fund (replenish from cash/bank)

**Request Body**:
```json
{
  "cashBankAccountId": "string" // ID of cash/bank account to credit
}
```

**Process**:
1. Validates voucher exists
2. Checks if already reimbursed
3. Creates reimbursement journal entry:
   - **Debit**: Petty cash fund (increase fund balance)
   - **Credit**: Cash/Bank account (decrease cash/bank)
4. Marks voucher as `isReimbursed: true`
5. Updates fund's `currentBalance`

**Response**:
```json
{
  "success": true,
  "data": {
    "voucher": {...},
    "journalEntry": {...},
    "newBalance": 5000
  },
  "message": "เติมเงินสดย่อยสำเร็จ"
}
```

### 4. Voucher Details Endpoint
**File**: `/Users/tong/Thai-acc/src/app/api/petty-cash/vouchers/[id]/route.ts`

**Endpoints**:
- `GET /api/petty-cash/vouchers/[id]` - Get single voucher details
- `DELETE /api/petty-cash/vouchers/[id]` - Delete voucher (only if not approved)

**Delete Protection**:
- Cannot delete voucher if it has a journal entry (already approved)
- Restores fund balance when deleting unapproved vouchers
- Returns error if attempting to delete approved voucher

## Accounting Logic

### Journal Entry for Voucher Approval
```
เบิกเงินสดย่อย PCV-2026-0001 - Office Supplies

Dr. ค่าใช้จ่าย (Expense Account)      1,000.00
     5xxx - GL Expense Account

   Cr. เงินสดย่อย (Petty Cash Fund)   1,000.00
     1xxx - Petty Cash Fund Account

─────────────────────────────────────
      Total: 1,000.00  =  1,000.00
```

### Journal Entry for Fund Reimbursement
```
เติมเงินสดย่อย Petty Cash Fund A ใบเบิก PCV-2026-0001

Dr. เงินสดย่อย (Petty Cash Fund)    1,000.00
     1xxx - Petty Cash Fund Account

   Cr. เงินสด/ธนาคาร (Cash/Bank)     1,000.00
     1xxx - Cash/Bank Account

─────────────────────────────────────
      Total: 1,000.00  =  1,000.00
```

## Database Schema Used

### PettyCashVoucher Model
```prisma
model PettyCashVoucher {
  id                 String        @id @default(cuid())
  voucherNo          String        @unique
  fundId             String
  fund               PettyCashFund @relation(fields: [fundId], references: [id])
  date               DateTime
  amount             Float
  payee              String
  description        String
  glExpenseAccountId String
  journalEntryId     String?       // NEW: Links to journal entry
  isReimbursed       Boolean       @default(false)
  createdAt          DateTime      @default(now())
}
```

### JournalEntry Model (Existing)
```prisma
model JournalEntry {
  id           String        @id @default(cuid())
  entryNo      String        @unique
  date         DateTime
  description  String?
  reference    String?
  documentType String?       // "PETTY_CASH_VOUCHER" or "PETTY_CASH_REIMBURSEMENT"
  documentId   String?       // Voucher ID
  totalDebit   Float         @default(0)
  totalCredit  Float         @default(0)
  status       EntryStatus   @default(DRAFT) // Auto-set to POSTED
  lines        JournalLine[]
  // ... other fields
}
```

## Usage Example

### 1. Create Voucher (Existing Endpoint)
```bash
POST /api/petty-cash/vouchers
{
  "fundId": "fund_123",
  "payee": "สมชาย ใจดี",
  "description": "ซื้อเอกสารสำนักงาน",
  "amount": 500,
  "glExpenseAccountId": "expense_567",
  "date": "2026-03-11"
}
```

### 2. Approve Voucher (New)
```bash
POST /api/petty-cash/vouchers/{voucherId}/approve
```

**Result**: Creates journal entry and links to voucher

### 3. Reimburse Fund (New)
```bash
POST /api/petty-cash/vouchers/{voucherId}/reimburse
{
  "cashBankAccountId": "cash_bank_789"
}
```

**Result**: Marks voucher reimbursed, updates fund balance, creates reimbursement journal entry

## Validation

### Double-Entry Bookkeeping Verification
- Debits always equal credits
- Total debit = Total credit for each journal entry
- Validation happens at journal entry creation

### Business Rules
1. Cannot approve already approved voucher
2. Cannot reimburse already reimbursed voucher
3. Cannot delete approved voucher (must create reversing entry)
4. Fund balance checked before voucher creation
5. Cash/Bank account must exist before reimbursement

## API Response Format

### Success Response
```json
{
  "success": true,
  "data": {...},
  "message": "Thai success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Thai error message"
}
```

## Testing Checklist

- [x] Voucher creation reduces fund balance
- [x] Approving voucher creates journal entry
- [x] Journal entry has correct debit (expense) and credit (petty cash)
- [x] Journal entry is auto-posted (status: POSTED)
- [x] Voucher is linked to journal entry via `journalEntryId`
- [x] Reimbursing creates separate journal entry
- [x] Reimbursement updates fund balance
- [x] Cannot delete approved voucher
- [x] Deleting unapproved voucher restores fund balance

## Future Enhancements

1. **Batch Approval**: Approve multiple vouchers at once
2. **Auto-Reimbursement**: Auto-reimburse when fund falls below threshold
3. **Voucher Reversal**: Create reversing journal entry for approved vouchers
4. **Reporting**: Petty cash reconciliation reports
5. **Approval Workflow**: Multi-level approval for large amounts

## Files Modified/Created

**Created**:
- `/Users/tong/Thai-acc/src/lib/petty-cash-service.ts`
- `/Users/tong/Thai-acc/src/app/api/petty-cash/vouchers/[id]/route.ts`
- `/Users/tong/Thai-acc/src/app/api/petty-cash/vouchers/[id]/approve/route.ts`
- `/Users/tong/Thai-acc/src/app/api/petty-cash/vouchers/[id]/reimburse/route.ts`

**No modifications needed to**:
- Schema (already has `journalEntryId` and `isReimbursed` fields)
- Existing voucher creation endpoint
- Existing fund management endpoints

## Notes

- All journal entries use Thai descriptions for local compliance
- Journal entry numbers follow sequential format: JV-YYYYMM-NNNN
- Document types: "PETTY_CASH_VOUCHER" and "PETTY_CASH_REIMBURSEMENT"
- All endpoints require authentication
- Uses transactions for data consistency
