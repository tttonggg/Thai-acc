# Petty Cash Voucher Flow

## Voucher Lifecycle

```
┌──────────────────────────────────────────────────────────────┐
│                     CREATE VOUCHER                           │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────┐
        │   DRAFT VOUCHER    │
        │   - No JE created  │
        │   - Fund ↓ amount  │
        └─────────┬──────────┘
                  │
                  │ Can be deleted
                  │ (restores fund balance)
                  │
        ┌─────────▼──────────┐
        │                    │
        │   APPROVE          │
        │   ┌──────────────┐ │
        │   │ Creates JE   │ │
        │   │ Dr: Expense  │ │
        │   │ Cr: Petty CF │ │
        │   └──────────────┘ │
        │                    │
        └─────────┬──────────┘
                  │
                  ▼
        ┌────────────────────┐
        │  APPROVED VOUCHER  │
        │  - JE linked       │
        │  - Cannot delete   │
        └─────────┬──────────┘
                  │
                  │
        ┌─────────▼──────────┐
        │                    │
        │   REIMBURSE        │
        │   ┌──────────────┐ │
        │   │ Creates JE   │ │
        │   │ Dr: Petty CF │ │
        │   │ Cr: Cash/Bank│ │
        │   └──────────────┘ │
        │   - Fund ↑ amount  │
        │                    │
        └─────────┬──────────┘
                  │
                  ▼
        ┌────────────────────┐
        │ REIMBURSED VOUCHER │
        └────────────────────┘
```

## Journal Entry Flow

### Approval Journal Entry
```
┌─────────────────────────────────────────────┐
│  Journal Entry: JV-202603-0001              │
│  Date: 2026-03-11                           │
│  Description: เบิกเงินสดย่อย PCV-2026-0001  │
│  Document: PETTY_CASH_VOUCHER               │
├─────────────────────────────────────────────┤
│ Line 1:                                     │
│   Account: 5xxx - Office Supplies (Expense) │
│   Debit: 1,000.00                           │
│   Credit: 0.00                              │
├─────────────────────────────────────────────┤
│ Line 2:                                     │
│   Account: 1xxx - Petty Cash Fund (Asset)   │
│   Debit: 0.00                               │
│   Credit: 1,000.00                          │
├─────────────────────────────────────────────┤
│  Total Debit:  1,000.00                     │
│  Total Credit: 1,000.00                     │
│  Status: POSTED                             │
└─────────────────────────────────────────────┘
```

### Reimbursement Journal Entry
```
┌─────────────────────────────────────────────┐
│  Journal Entry: JV-202603-0002              │
│  Date: 2026-03-11                           │
│  Description: เติมเงินสดย่อย Main Fund...    │
│  Document: PETTY_CASH_REIMBURSEMENT         │
├─────────────────────────────────────────────┤
│ Line 1:                                     │
│   Account: 1xxx - Petty Cash Fund (Asset)   │
│   Debit: 1,000.00                           │
│   Credit: 0.00                              │
├─────────────────────────────────────────────┤
│ Line 2:                                     │
│   Account: 1xxx - Cash at Bank (Asset)      │
│   Debit: 0.00                               │
│   Credit: 1,000.00                          │
├─────────────────────────────────────────────┤
│  Total Debit:  1,000.00                     │
│  Total Credit: 1,000.00                     │
│  Status: POSTED                             │
└─────────────────────────────────────────────┘
```

## API Endpoints

```
/api/petty-cash
│
├── /funds
│   └── GET    - List all petty cash funds
│   └── POST   - Create new fund
│
└── /vouchers
    ├── GET              - List all vouchers
    ├── POST             - Create new voucher
    │
    └── /[id]
        ├── GET          - Get single voucher
        ├── DELETE       - Delete voucher (if not approved)
        │
        ├── /approve
        │   └── POST     - Approve voucher & create JE
        │
        └── /reimburse
            └── POST     - Reimburse fund & create JE
```

## State Transitions

```
Voucher States:
┌──────────────┐
│   CREATED    │ ← voucher.journalEntryId = null
│   isReimbursed = false
└──────┬───────┘
       │
       │ POST /api/petty-cash/vouchers/[id]/approve
       │
       ▼
┌──────────────┐
│   APPROVED   │ ← voucher.journalEntryId = "je_xxx"
│   isReimbursed = false
└──────┬───────┘
       │
       │ POST /api/petty-cash/vouchers/[id]/reimburse
       │
       ▼
┌──────────────┐
│ REIMBURSED   │ ← voucher.journalEntryId = "je_xxx"
│   isReimbursed = true
└──────────────┘
```

## Fund Balance Changes

```
Initial Fund: 5,000.00

┌────────────────────────────────────────┐
│ Create Voucher: 1,000.00               │
│ Fund Balance: 5,000.00 - 1,000.00 = 4,000.00
└────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────┐
│ Approve Voucher                        │
│ Fund Balance: 4,000.00 (no change)     │
│ Journal Entry Created                  │
└────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────┐
│ Reimburse Fund: 1,000.00               │
│ Fund Balance: 4,000.00 + 1,000.00 = 5,000.00
└────────────────────────────────────────┘
```

## Database Relationships

```
PettyCashVoucher
│
├── id (PK)
├── voucherNo
├── fundId (FK) → PettyCashFund
├── journalEntryId (FK) → JournalEntry (after approval)
├── amount
├── glExpenseAccountId (FK) → ChartOfAccount
├── isReimbursed (boolean)
│
PettyCashFund
│
├── id (PK)
├── glAccountId (FK) → ChartOfAccount
├── currentBalance
│
JournalEntry
│
├── id (PK)
├── documentType = "PETTY_CASH_VOUCHER" or "PETTY_CASH_REIMBURSEMENT"
├── documentId (FK) → PettyCashVoucher
├── lines (JournalLine[])
│
JournalLine
│
├── accountId (FK) → ChartOfAccount
├── debit
├── credit
```

## Error Handling

```
Common Errors:

1. Insufficient Fund Balance
   Error: "เงินสดย่อยไม่เพียงพอ (คงเหลือ ฿1,000)"
   Solution: Reimburse fund first

2. Already Approved
   Error: "ใบเบิกเงินสดย่อยนี้ได้รับการอนุมัติแล้ว"
   Solution: Check journal entry instead

3. Already Reimbursed
   Error: "ใบเบิกเงินสดย่อยนี้ได้รับการเติมเงินแล้ว"
   Solution: Cannot reimburse twice

4. Cannot Delete Approved
   Error: "ไม่สามารถลบใบเบิกที่ได้รับการอนุมัติแล้ว"
   Solution: Create reversing journal entry

5. Invalid Cash/Bank Account
   Error: "ไม่พบบัญชีเงินสด/ธนาคาร"
   Solution: Provide valid account ID
```

## Accounting Equations

### Double-Entry Verification

**Approval:**
```
Assets (Petty Cash Fund) ↓ by voucher amount
Expenses ↑ by voucher amount

Accounting Equation:
Assets = Liabilities + Equity + Revenue - Expenses
-1,000 = 0 + 0 + 0 - 1,000  ✓ Balanced
```

**Reimbursement:**
```
Assets (Petty Cash Fund) ↑ by voucher amount
Assets (Cash/Bank) ↓ by voucher amount

Accounting Equation:
Assets = Liabilities + Equity + Revenue - Expenses
+1,000 - 1,000 = 0  ✓ Balanced
```
