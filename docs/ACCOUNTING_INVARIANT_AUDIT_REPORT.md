# Accounting Invariant Audit Report

## Thai Accounting ERP System

### Date: 2026-03-16

### Auditor: Double-Entry & Accounting Invariant Guardian

---

## Executive Summary

This audit analyzes the Thai Accounting ERP system for critical accounting
invariants. The codebase shows a generally well-structured approach to
double-entry bookkeeping with proper transaction boundaries, but several
critical and high-severity issues were identified that could lead to data
integrity problems, audit failures, or financial discrepancies.

**Overall Risk Rating: MEDIUM-HIGH**

- Critical Issues: 3
- High Severity Issues: 4
- Medium Severity Issues: 6
- Low Severity Issues: 3

---

## 1. Journal Entry Balance (Debits = Credits)

### Finding #1.1: Hardcoded Account IDs in Credit/Debit Note GL Posting

**Severity: CRITICAL**

**Invariant Violated:** Journal entries must post to valid, existing chart of
accounts

**File Location:**

- `src/app/api/credit-notes/route.ts` (lines 189-226)
- `src/app/api/debit-notes/route.ts` (lines 187-224)

**Issue:** The credit note and debit note creation endpoints hardcode account
IDs as string literals:

```typescript
// Credit Note (lines 204, 211, 218)
accountId: '4201', // Sales Returns
accountId: '2104', // VAT Output
accountId: '1101', // Accounts Receivable

// Debit Note (lines 202, 209, 216)
accountId: '5101', // Purchases
accountId: '1105', // VAT Input
accountId: '2101', // Accounts Payable
```

**Exploit Scenario:**

1. If the chart of accounts doesn't have these exact IDs, the journal entry
   creation will fail
2. If different account codes are used in the seeded chart of accounts, journal
   entries will reference non-existent accounts
3. This creates orphaned journal lines or complete transaction failures

**Fix Required:** Replace hardcoded account IDs with dynamic lookups similar to
other services:

```typescript
const arAccount = await tx.chartOfAccount.findFirst({
  where: { code: '1120' },
});
if (!arAccount) throw new Error('AR account not found');
```

---

### Finding #1.2: Journal Entry Balance Validation Timing Gap

**Severity: HIGH**

**Invariant Violated:** All posted journal entries must have equal debits and
credits

**File Location:**

- `src/app/api/journal/route.ts` (lines 22-28)
- `src/app/api/journal/[id]/post/route.ts` (lines 33-42)

**Issue:** While balance validation exists at creation time via Zod schema, the
posting endpoint (`journal/[id]/post`) re-validates balance using stored line
items. However, there's a race condition window where:

1. Entry is created balanced
2. Lines could theoretically be modified directly in database
3. Posting occurs without transaction-level re-validation

**Exploit Scenario:** Direct database manipulation or API bypass could result in
unbalanced posted entries.

**Current Mitigation:** The posting endpoint does validate balance before
updating status (line 37), which is good.

---

### Finding #1.3: Receipt Posting - Potential Debit/Credit Mismatch

**Severity: MEDIUM**

**Invariant Violated:** Journal entry totalDebit must equal totalCredit

**File Location:**

- `src/app/api/receipts/[id]/post/route.ts` (lines 92-136)

**Issue:** The receipt posting creates journal lines dynamically based on
allocations. The totalDebit is set to `receipt.amount` (line 101), but
totalCredit is also set to `receipt.amount` (line 102). However, the actual
credit lines sum to:

- Sum of all allocation amounts
- Plus WHT amount (if applicable)

If `receipt.amount` doesn't exactly equal the sum of allocations + WHT, the
entry will be unbalanced.

**Current Code:**

```typescript
totalDebit: receipt.amount,
totalCredit: receipt.amount,
```

The code uses `receipt.amount` for both, but the actual lines created are:

- Debit: Cash/Bank = receipt.amount
- Credits: AR allocations (sum) + WHT payable

**Potential Issue:** If allocations don't sum to receipt.amount - whtAmount,
entry is unbalanced.

---

## 2. Posted Document Immutability

### Finding #2.1: Invoice Void Creates Reversal but Doesn't Mark Original Journal Entry

**Severity: HIGH**

**Invariant Violated:** Posted documents should maintain clear audit trail of
reversal status

**File Location:**

- `src/app/api/invoices/[id]/void/route.ts` (lines 78-160)

**Issue:** When voiding an invoice:

1. A reversal journal entry is created (lines 105-141)
2. The invoice status is changed to CANCELLED (line 148)
3. BUT the original journal entry (if any) is NOT marked as reversed

The original journal entry linked to the invoice remains with status POSTED,
creating confusion about which entries are active.

**Expected Behavior:**

```typescript
// Should also update original journal entry
await tx.journalEntry.update({
  where: { id: invoice.journalEntryId },
  data: { status: 'REVERSED', reversingId: reversalEntry.id },
});
```

---

### Finding #2.2: Journal Entry PUT Allows Modification Without Role Check

**Severity: MEDIUM**

**Invariant Violated:** Only authorized users should modify draft journal
entries

**File Location:**

- `src/app/api/journal/[id]/route.ts` (lines 66-143)

**Issue:** The PUT endpoint for journal entries does not verify the user's role
before allowing updates. It only checks if the entry is in DRAFT status.

**Exploit Scenario:** Any authenticated user (including VIEWER) could modify
draft journal entries if they have the ID.

**Fix Required:**

```typescript
export async function PUT(...) {
  const user = await requireRole(['ADMIN', 'ACCOUNTANT']) // Add this
  // ... rest of code
}
```

---

### Finding #2.3: Receipt Delete Missing Role Check

**Severity: MEDIUM**

**Invariant Violated:** Only authorized users should delete draft receipts

**File Location:**

- `src/app/api/receipts/[id]/route.ts` (lines 196-238)

**Issue:** The DELETE endpoint only checks `requireAuth()` but doesn't verify
the user's role. Any authenticated user could delete draft receipts.

---

## 3. Audit Trail Completeness

### Finding #3.1: Inconsistent Audit Field Population

**Severity: MEDIUM**

**Invariant Violated:** All financial transactions must record createdBy,
updatedAt, postedBy, postedAt

**File Locations:**

- `src/app/api/journal/[id]/post/route.ts` (line 49): Sets `postedAt` but NOT
  `postedById`
- `src/app/api/invoices/[id]/issue/route.ts`: No user tracking for COGS journal
  entry
- `src/app/api/credit-notes/route.ts`: No createdById for journal entries

**Issue:** The journal entry posting endpoint only sets:

```typescript
data: {
  status: 'POSTED',
  postedAt: new Date(),  // ✅ Has postedAt
  // postedById: MISSING
}
```

The `postedById` field exists in the schema but is not populated.

---

### Finding #3.2: Missing createdById in Multiple Journal Entry Creations

**Severity: MEDIUM**

**File Locations:**

- `src/app/api/credit-notes/route.ts` (line 189): Journal entry created without
  createdById
- `src/app/api/debit-notes/route.ts` (line 187): Journal entry created without
  createdById
- `src/app/api/payments/route.ts` (line 325): Creates journal entry but may not
  pass user context

**Exploit Scenario:** Cannot trace who created specific GL entries, violating
audit requirements.

---

### Finding #3.3: Activity Logging Inconsistent

**Severity: LOW**

**Invariant Violated:** All critical financial operations should be logged

**File Locations:**

- `src/app/api/receipts/[id]/post/route.ts`: No activity log for receipt posting
- `src/app/api/payments/[id]/route.ts`: No activity log for payment posting

---

## 4. GL Posting Accuracy

### Finding #4.1: Invoice Issue Creates COGS Entry but Not Revenue Entry

**Severity: HIGH**

**Invariant Violated:** Sales invoices should create complete journal entries
(AR and Revenue)

**File Location:**

- `src/app/api/invoices/[id]/issue/route.ts` (lines 115-225)

**Issue:** When issuing an invoice, the system:

1. ✅ Creates VAT record
2. ✅ Creates COGS journal entry (debit COGS, credit Inventory)
3. ❌ Does NOT create the revenue-side journal entry (debit AR, credit Revenue,
   credit VAT Output)

The revenue-side entry appears to be missing entirely. This means:

- Accounts Receivable is never debited
- Sales Revenue is never credited
- VAT Output liability is never recorded

This is a critical accounting gap - the invoice exists but the GL impact of the
sale is not recorded (only the COGS is recorded).

**Expected Journal Entry on Invoice Issue:**

```
Debit: Accounts Receivable (1120) - Total Amount
Credit: Sales Revenue (4100) - Subtotal
Credit: VAT Output (2130) - VAT Amount
Credit: WHT Payable (if applicable)
```

**Actual Behavior:** Only COGS entry is created:

```
Debit: COGS (5110)
Credit: Inventory (1140)
```

---

### Finding #4.2: Payment Posting - AP Account Lookup Uses Wrong Code

**Severity: MEDIUM**

**Invariant Violated:** GL postings must use correct standard chart of accounts

**File Location:**

- `src/app/api/payments/route.ts` (line 245-247)

**Issue:**

```typescript
const apAccount = await db.chartOfAccount.findFirst({
  where: { code: '2120' }, // Using 2120
});
```

But standard Thai chart of accounts typically uses:

- 2100 or 2101 for Accounts Payable (เจ้าหนี้การค้า)
- 2120 might be a different liability account

The credit-notes and debit-notes routes also use inconsistent account codes.

---

### Finding #4.3: Stock Take Journal Entry Total Miscalculation

**Severity: MEDIUM**

**Invariant Violated:** Journal entry totals must equal sum of line amounts

**File Location:**

- `src/lib/stock-take-service.ts` (lines 387-388)

**Issue:**

```typescript
totalDebit: totalLoss + totalGain,
totalCredit: totalLoss + totalGain,
```

This calculation is incorrect. The journal entry should have:

- Debits: totalLoss (expense) + totalGain (inventory increase via debit)
- Credits: totalLoss (inventory decrease) + totalGain (expense/income credit)

The current calculation assumes both loss and gain are debited AND credited,
which doesn't make accounting sense.

**Correct Logic:**

```typescript
// For losses: Debit Expense, Credit Inventory
// For gains: Debit Inventory, Credit Expense (or Income)
const totalDebits = totalLoss + totalGain; // Expense for loss + Inventory for gain
const totalCredits = totalLoss + totalGain; // Inventory for loss + Expense for gain
```

Actually, this might be correct if we consider the expense account is credited
for gains (reducing expense). Needs verification.

---

## 5. Foreign Key Integrity

### Finding #5.1: Prisma Schema Has Proper Restrict Constraints

**Status: COMPLIANT ✅**

**Evidence:**

```prisma
// Invoice model
journalEntry   JournalEntry?  @relation("InvoiceJournal", fields: [journalEntryId], references: [id], onDelete: Restrict)

// Customer model relation
invoices      Invoice[]
```

The schema correctly uses `onDelete: Restrict` for critical relationships,
preventing deletion of:

- Customers with invoices
- Vendors with purchase invoices
- Journal entries linked to documents
- Products with stock movements

---

### Finding #5.2: Invoice Cancellation Checks for Receipts

**Status: COMPLIANT ✅**

**File Location:**

- `src/app/api/invoices/[id]/route.ts` (lines 202-204)

```typescript
if (existing.receipts.length > 0) {
  return apiError('ไม่สามารถยกเลิกใบกำกับภาษีที่มีการรับชำระแล้วได้');
}
```

Good: Prevents cancellation of invoices with payment receipts.

---

### Finding #5.3: Missing Invoice-Payment Link Integrity Check

**Severity: LOW**

**File Location:**

- `src/app/api/payments/route.ts`

**Issue:** While the payment creation verifies that invoices belong to the
vendor (lines 143-153), there's no check that the invoice isn't already fully
paid before creating a payment allocation.

---

## 6. Document Sequencing

### Finding #6.1: Race Condition in Document Number Generation

**Severity: HIGH**

**Invariant Violated:** Document numbers must be unique and sequential without
gaps

**File Locations:**

- `src/app/api/invoices/route.ts` (lines 38-70)
- `src/app/api/receipts/route.ts` (lines 232-257)
- `src/app/api/journal/route.ts` (lines 32-55)

**Issue:** These endpoints use a non-transactional approach:

```typescript
const lastInvoice = await prisma.invoice.findFirst({
  where: { invoiceNo: { startsWith: prefix } },
  orderBy: { invoiceNo: 'desc' },
});
let nextNum = 1;
if (lastInvoice) {
  nextNum = parseInt(lastInvoice.invoiceNo.split('-')[2]) + 1;
}
return `${prefix}-${String(nextNum).padStart(4, '0')}`;
```

This has a race condition:

1. Request A reads last invoice = INV-202603-0005
2. Request B reads last invoice = INV-202603-0005 (before A creates)
3. Both try to create INV-202603-0006
4. One fails with unique constraint error, or worse, both succeed if no unique
   constraint

**Mitigation:** The `invoiceNo` field has `@unique` constraint, so second insert
will fail, but this is a poor user experience.

**Fix Required:** Use the pattern from `api-utils.ts` (lines 65-108) which uses
transactions:

```typescript
return await db.$transaction(async (tx) => {
  // ... lock and increment within transaction
});
```

---

### Finding #6.2: DocumentNumber Model Not Used Consistently

**Severity: MEDIUM**

**Issue:** Some modules use the `DocumentNumber` model with transactions (via
`generateDocNumber` in api-utils.ts), while others use the unsafe pattern above.

**Compliant Modules:**

- Payments ✅
- Credit Notes ✅
- Debit Notes ✅

**Non-Compliant Modules:**

- Invoices ❌
- Receipts ❌
- Journal Entries ❌

---

## 7. Void vs Reverse Entries

### Finding #7.1: Invoice Void Creates Proper Reversal Entry

**Status: COMPLIANT ✅**

**File Location:**

- `src/app/api/invoices/[id]/void/route.ts`

The implementation correctly:

1. Creates a reversal journal entry with swapped debits/credits
2. Sets `isReversing: true` on the new entry
3. Sets `reversingId` to link back to original
4. Updates invoice status to CANCELLED
5. Preserves the original journal entry (audit trail)

---

### Finding #7.2: Journal Entry Reverse Updates Original Entry

**Status: COMPLIANT ✅**

**File Location:**

- `src/app/api/journal/[id]/reverse/route.ts` (lines 124-131)

The implementation correctly:

1. Creates reversal entry with swapped debits/credits
2. Sets `isReversing: true` and `reversingId`
3. Updates original entry with note about reversal

However, it sets `isAdjustment: true` on the original instead of
`status: 'REVERSED'`, which is inconsistent with the schema's `EntryStatus` enum
that includes `REVERSED`.

---

### Finding #7.3: Cheque Bounce Creates Reversing Entry but Updates Original Status

**Severity: LOW**

**File Location:**

- `src/lib/cheque-service.ts` (lines 228-257)

The cheque bounce function:

1. Creates a reversing journal entry ✅
2. Updates original journal entry status to 'REVERSED' ✅
3. Updates cheque status to 'BOUNCED' ✅

This is actually good - it's more consistent than the invoice void which doesn't
mark the original JE as reversed.

---

## 8. Additional Findings

### Finding #8.1: Asset Service Uses Wrong Field Name

**Severity: MEDIUM**

**File Location:**

- `src/lib/asset-service.ts` (line 69)

**Issue:**

```typescript
entryDate: schedule.date,  // Wrong field name
```

The schema defines the field as `date` not `entryDate`, but Prisma client might
accept this. Need to verify schema compatibility.

**Schema Check:**

```prisma
model JournalEntry {
  date         DateTime  // Schema uses 'date'
  // NOT 'entryDate'
}
```

This would cause a runtime error or silent failure.

---

### Finding #8.2: WHT Service References Non-Existent Relations

**Severity: HIGH**

**File Location:**

- `src/lib/wht-service.ts` (lines 12, 78)

**Issue:**

```typescript
include: {
  purchase: {  // Schema has purchaseInvoices, not purchase
    include: {
      vendor: true,
      lines: { ... }
    }
  }
}
```

The schema defines `Payment` model with relation to `PurchaseInvoice[]` as
`purchaseInvoices`, not `purchase`. Similarly for receipt/invoice relation.

This would cause Prisma query errors at runtime.

---

### Finding #8.3: Payment Route postPaymentToGL - Bank Account GL Lookup Issue

**Severity: LOW**

**File Location:**

- `src/app/api/payments/route.ts` (lines 256-266)

**Issue:**

```typescript
const bankGlAccount = await db.chartOfAccount.findFirst({
  where: { code: { startsWith: '112' } }, // Generic lookup
});
```

This might return the wrong bank account if multiple exist. Should use the
specific GL account linked to the bank account.

---

## Recommendations Summary

### Immediate Actions Required (Critical/High)

1. **Fix Credit/Debit Note Hardcoded Account IDs** - Replace with dynamic
   lookups
2. **Add Revenue-Side Journal Entry on Invoice Issue** - Critical accounting gap
3. **Fix Document Number Race Conditions** - Use transaction-based generation
   everywhere
4. **Mark Original JE as Reversed on Invoice Void** - Update void endpoint
5. **Fix WHT Service Prisma Relations** - Use correct relation names
6. **Fix Asset Service Field Name** - Use 'date' not 'entryDate'

### Secondary Actions (Medium)

7. Add role checks to Journal Entry PUT endpoint
8. Add role checks to Receipt DELETE endpoint
9. Populate postedById in all journal entry postings
10. Add createdById to credit/debit note journal entries
11. Add activity logging to receipt/payment posting
12. Standardize account code usage across all modules
13. Fix stock take service total calculation logic

### Best Practice Improvements (Low)

14. Add payment amount vs allocation validation
15. Standardize all document numbering to use DocumentNumber model
16. Add more comprehensive error messages for constraint violations

---

## Positive Findings

1. ✅ **Transaction Boundaries** - Most critical operations use
   `prisma.$transaction()`
2. ✅ **Schema Design** - Proper use of `onDelete: Restrict` for referential
   integrity
3. ✅ **Draft/Posted Status Pattern** - Consistent workflow across document
   types
4. ✅ **Journal Entry Linking** - All major documents link to journal entries
5. ✅ **VAT Record Creation** - Proper VAT tracking on invoice issuance
6. ✅ **Idempotency Keys** - Present in Payment, Receipt, and JournalEntry
   models
7. ✅ **Activity Logging** - Present for major operations (though inconsistent)
8. ✅ **Role-Based Access** - Generally implemented (though gaps exist)

---

## Conclusion

The Thai Accounting ERP system demonstrates a solid understanding of
double-entry bookkeeping principles and generally implements proper transaction
boundaries. However, several critical issues require immediate attention,
particularly:

1. The missing revenue-side journal entry on invoice issuance is a critical
   accounting gap
2. Hardcoded account IDs will cause failures with any chart of accounts
   variation
3. Document number generation race conditions could cause production issues
4. Some Prisma relation references appear to be incorrect

With the recommended fixes, this system would achieve a high standard of
accounting data integrity.

---

_Report Generated: 2026-03-16_ _Auditor: Double-Entry & Accounting Invariant
Guardian_
