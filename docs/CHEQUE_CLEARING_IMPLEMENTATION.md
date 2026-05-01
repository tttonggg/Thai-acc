# Cheque Clearing GL Implementation

## Overview

This implementation adds automatic GL journal entry generation when cheques are
cleared or bounced in the Thai Accounting ERP System.

## Schema Changes

### Updated `Cheque` Model

Added `journalEntryId` field to track the GL journal entry created when a cheque
clears.

```prisma
model Cheque {
  id             String       @id @default(cuid())
  chequeNo       String       @unique
  type           ChequeType   // RECEIVE, PAY
  bankAccountId  String
  bankAccount    BankAccount  @relation(fields: [bankAccountId], references: [id])
  dueDate        DateTime
  amount         Float
  payeeName      String?
  status         ChequeStatus // ON_HAND, DEPOSITED, CLEARED, BOUNCED, CANCELLED
  documentRef    String?
  clearedDate    DateTime?
  journalEntryId String?      // NEW: ID บันทึกบัญชีเมื่อเช็คผ่าน
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
}
```

## New Files

### 1. `/src/lib/cheque-service.ts`

Core service library containing all cheque clearing logic with GL journal entry
generation.

#### Functions

**`clearCheque(chequeId, clearedDate, userId?)`** Main function that routes to
appropriate handler based on cheque type.

**`createReceivedChequeJournalEntry(chequeId, clearedDate, userId?)`** Creates
GL entry when a RECEIVED cheque clears:

- **Debit**: Bank Account (Asset increases)
- **Credit**: Accounts Receivable (Asset decreases)

Example entry:

```
เช็ครับเลขที่ CHK001 ผ่าน ธนาคารกรุงเทพ

Dr. 1111 เงินสด - ธนาคารกรุงเทพ    10,000.00
Cr. 1121 ลูกหนี้การค้า                      10,000.00
```

**`createPaymentChequeJournalEntry(chequeId, clearedDate, userId?)`** Creates GL
entry when a PAYMENT cheque clears:

- **Debit**: Accounts Payable (Liability decreases)
- **Credit**: Bank Account (Asset decreases)

Example entry:

```
เช็คจ่ายเลขที่ CHK002 ผ่าน ธนาคารกรุงเทพ

Dr. 2110 เจ้าหนี้การค้า               5,000.00
Cr. 1111 เงินสด - ธนาคารกรุงเทพ     5,000.00
```

**`bounceCheque(chequeId, bouncedDate, reason?, userId?)`** Creates reversing
entry when a cheque bounces:

- Reverses the original clearing entry
- Marks original entry as REVERSED
- Updates cheque status to BOUNCED

Example reversing entry:

```
เช็คเลขที่ CHK001 เด้ง ( insufficient funds )

Dr. 1121 ลูกหนี้การค้า                10,000.00
Cr. 1111 เงินสด - ธนาคารกรุงเทพ   10,000.00
```

### 2. `/src/app/api/cheques/[id]/route.ts`

RESTful API endpoint for managing individual cheques.

#### Endpoints

**GET `/api/cheques/[id]`** Retrieve a single cheque by ID with bank account
details.

**PATCH `/api/cheques/[id]`** Update cheque status with automatic GL entry
generation.

Request body:

```json
{
  "status": "CLEARED" | "DEPOSITED" | "BOUNCED" | "CANCELLED",
  "clearedDate": "2026-03-15",  // Optional, defaults to now
  "bounceReason": "insufficient funds"  // Optional for bounced cheques
}
```

Response:

```json
{
  "success": true,
  "data": {
    "cheque": {
      /* updated cheque with journalEntryId */
    },
    "journalEntry": {
      /* created GL entry */
    }
  }
}
```

**DELETE `/api/cheques/[id]`** Delete a cheque (only allowed if no journal entry
exists).

## Cheque Workflow

### Received Cheques (เช็ครับ)

1. **ON_HAND** - Cheque received from customer, waiting to deposit
2. **DEPOSITED** - Cheque deposited to bank (optional status)
3. **CLEARED** - Cheque cleared by bank → GL entry created:
   - Dr. Bank Account (asset increases)
   - Cr. Accounts Receivable (AR decreases)
4. **BOUNCED** - Cheque bounced → Reversing entry created

### Payment Cheques (เช็คจ่าย)

1. **ON_HAND** - Cheque issued to vendor
2. **DEPOSITED** - Vendor deposited cheque (optional status)
3. **CLEARED** - Cheque cleared by bank → GL entry created:
   - Dr. Accounts Payable (AP decreases)
   - Cr. Bank Account (asset decreases)
4. **BOUNCED** - Cheque bounced → Reversing entry created

## GL Account Codes Used

- **1111** - เงินสด - ธนาคารกรุงเทพ (Cash - Bangkok Bank)
- **1121** - ลูกหนี้การค้า (Accounts Receivable)
- **2110** - เจ้าหนี้การค้า (Accounts Payable)

Note: Bank accounts are dynamically selected based on the cheque's
`bankAccount.glAccountId`.

## Usage Examples

### Clear a Received Cheque

```typescript
// API call
fetch('/api/cheques/cheque-id-123', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: 'CLEARED',
    clearedDate: '2026-03-15',
  }),
});

// Programmatic usage
import { clearCheque } from '@/lib/cheque-service';

const journalEntry = await clearCheque('cheque-id-123', new Date(), 'user-id');
```

### Clear a Payment Cheque

```typescript
fetch('/api/cheques/cheque-id-456', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: 'CLEARED',
    clearedDate: '2026-03-15',
  }),
});
```

### Bounce a Cheque

```typescript
fetch('/api/cheques/cheque-id-123', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: 'BOUNCED',
    clearedDate: '2026-03-16',
    bounceReason: 'insufficient funds',
  }),
});

// Programmatic usage
import { bounceCheque } from '@/lib/cheque-service';

const reversingEntry = await bounceCheque(
  'cheque-id-123',
  new Date(),
  'insufficient funds',
  'user-id'
);
```

## Double-Entry Validation

All journal entries created by the cheque clearing service are guaranteed to
balance:

- **Total Debit** always equals **Total Credit**
- Each entry has exactly 2 lines (one debit, one credit)
- Amounts match the cheque amount exactly

## Error Handling

The service validates:

1. ✓ Cheque exists
2. ✓ Cheque type matches operation (RECEIVE vs PAY)
3. ✓ Cheque not already cleared (for clearing operations)
4. ✓ Cheque has journal entry (for bounce operations)
5. ✓ Required GL accounts exist (1121 for AR, 2110 for AP)

Error messages are returned in Thai with HTTP status codes:

- `400` - Bad request (validation error)
- `404` - Cheque not found
- `500` - Server error

## Database Impact

### New Journal Entries

Each cleared/bounced cheque creates:

- 1 `JournalEntry` record
- 2 `JournalLine` records (debit & credit)

### Updated Records

- `Cheque.journalEntryId` is set when cleared
- `Cheque.status` and `Cheque.clearedDate` are updated
- Original `JournalEntry.status` set to 'REVERSED' when bounced

## Testing Checklist

- [ ] Clear received cheque → Verify bank balance increases, AR decreases
- [ ] Clear payment cheque → Verify bank balance decreases, AP decreases
- [ ] Bounce cleared cheque → Verify reversing entry created
- [ ] Attempt to clear already cleared cheque → Should error
- [ ] Attempt to delete cheque with journal entry → Should error
- [ ] Verify journal entries balance (debit = credit)
- [ ] Check audit trail (createdById, dates)

## Future Enhancements

Potential improvements:

1. **Multi-line support** - Split cheques across multiple GL accounts
2. **Bank fees** - Auto-record bank charges on clearance
3. **Cheque hold periods** - Enforce minimum days before clearing
4. **Batch clearing** - Clear multiple cheques in one transaction
5. **Notification system** - Alert on due date or clearance
6. **Reconciliation** - Auto-match with bank statement imports

## Compliance

This implementation follows Thai Accounting Standards:

- ✓ Double-entry bookkeeping
- ✓ Proper audit trail
- ✓ Transaction dates
- ✓ Document references
- ✓ Reversal entries for corrections
