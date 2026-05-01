# Thai Accounting ERP - Database Cascading Rules Reference

# โปรแกรมบัญชีมาตรฐานไทย - เอกสารอ้างอิงกฎการ Cascade

## Overview

This document describes all cascading delete and update rules in the Thai
Accounting ERP database schema.

## Cascade Rules by Model

### 1. ChartOfAccount

| Relationship    | Direction      | On Delete | Description                                |
| --------------- | -------------- | --------- | ------------------------------------------ |
| parent/children | Self-reference | -         | No cascade - manual handling required      |
| journalLines    | 1:N            | Restrict  | Cannot delete account with journal entries |

**Business Rule:** Accounts with transaction history cannot be deleted. Use soft
delete (`isActive = false`) instead.

### 2. JournalEntry

| Relationship      | Direction | On Delete | Description                               |
| ----------------- | --------- | --------- | ----------------------------------------- |
| lines             | 1:N       | Cascade   | Journal lines deleted with entry          |
| invoices          | 1:N       | Restrict  | Cannot delete entry linked to invoice     |
| purchaseInvoices  | 1:N       | Restrict  | Cannot delete entry linked to purchase    |
| receipts          | 1:N       | Restrict  | Cannot delete entry linked to receipt     |
| payments          | 1:N       | Restrict  | Cannot delete entry linked to payment     |
| creditNotes       | 1:N       | Restrict  | Cannot delete entry linked to credit note |
| debitNotes        | 1:N       | Restrict  | Cannot delete entry linked to debit note  |
| cheques           | 1:N       | Restrict  | Cannot delete entry linked to cheque      |
| pettyCashVouchers | 1:N       | Restrict  | Cannot delete entry linked to voucher     |
| stockTakes        | 1:N       | Restrict  | Cannot delete entry linked to stock take  |
| payrollRuns       | 1:N       | Restrict  | Cannot delete entry linked to payroll     |

**Business Rule:** Posted journal entries cannot be deleted. Must reverse with
reversing entry.

### 3. Customer

| Relationship | Direction | On Delete | Description                              |
| ------------ | --------- | --------- | ---------------------------------------- |
| invoices     | 1:N       | Restrict  | Cannot delete customer with invoices     |
| receipts     | 1:N       | Restrict  | Cannot delete customer with receipts     |
| creditNotes  | 1:N       | Restrict  | Cannot delete customer with credit notes |

**Business Rule:** Customers with transaction history cannot be deleted. Use
soft delete.

### 4. Vendor

| Relationship     | Direction | On Delete | Description                                 |
| ---------------- | --------- | --------- | ------------------------------------------- |
| purchaseInvoices | 1:N       | Restrict  | Cannot delete vendor with purchase invoices |
| payments         | 1:N       | Restrict  | Cannot delete vendor with payments          |
| debitNotes       | 1:N       | Restrict  | Cannot delete vendor with debit notes       |

**Business Rule:** Vendors with transaction history cannot be deleted. Use soft
delete.

### 5. Product

| Relationship         | Direction | On Delete | Description                                   |
| -------------------- | --------- | --------- | --------------------------------------------- |
| invoiceLines         | 1:N       | Set Null  | Product reference cleared from invoice lines  |
| purchaseLines        | 1:N       | Set Null  | Product reference cleared from purchase lines |
| stockBalances        | 1:N       | Cascade   | Stock balances deleted with product           |
| stockMovements       | 1:N       | Restrict  | Cannot delete product with stock movements    |
| stockTransferLines   | 1:N       | Cascade   | Transfer lines deleted with product           |
| stockTakeLines       | 1:N       | Cascade   | Stock take lines deleted with product         |
| productCostHistories | 1:N       | Cascade   | Cost history deleted with product             |

**Business Rule:** Products with inventory movements cannot be deleted. Archive
instead.

### 6. Invoice

| Relationship       | Direction | On Delete | Description                             |
| ------------------ | --------- | --------- | --------------------------------------- |
| lines              | 1:N       | Cascade   | Invoice lines deleted with invoice      |
| receiptAllocations | 1:N       | Cascade   | Allocations deleted with invoice        |
| creditNotes        | 1:N       | Restrict  | Cannot delete invoice with credit notes |
| journalEntry       | N:1       | Restrict  | Journal entry blocks invoice delete     |

**Business Rule:** Posted/issued invoices cannot be deleted. Create credit note
instead.

### 7. Receipt

| Relationship | Direction | On Delete | Description                         |
| ------------ | --------- | --------- | ----------------------------------- |
| allocations  | 1:N       | Cascade   | Allocations deleted with receipt    |
| journalEntry | N:1       | Restrict  | Journal entry blocks receipt delete |

**Business Rule:** Posted receipts cannot be deleted.

### 8. PurchaseInvoice

| Relationship       | Direction | On Delete | Description                            |
| ------------------ | --------- | --------- | -------------------------------------- |
| lines              | 1:N       | Cascade   | Purchase lines deleted with invoice    |
| paymentAllocations | 1:N       | Cascade   | Allocations deleted with invoice       |
| debitNotes         | 1:N       | Restrict  | Cannot delete invoice with debit notes |
| journalEntry       | N:1       | Restrict  | Journal entry blocks invoice delete    |

### 9. Payment

| Relationship | Direction | On Delete | Description                         |
| ------------ | --------- | --------- | ----------------------------------- |
| allocations  | 1:N       | Cascade   | Allocations deleted with payment    |
| cheques      | 1:N       | Set Null  | Cheque reference cleared            |
| journalEntry | N:1       | Restrict  | Journal entry blocks payment delete |

### 10. CreditNote / DebitNote

| Relationship            | Direction | On Delete | Description                     |
| ----------------------- | --------- | --------- | ------------------------------- |
| invoice/purchaseInvoice | N:1       | Restrict  | Linked document blocks deletion |
| journalEntry            | N:1       | Restrict  | Journal entry blocks deletion   |

### 11. Warehouse

| Relationship   | Direction | On Delete | Description                              |
| -------------- | --------- | --------- | ---------------------------------------- |
| zones          | 1:N       | Cascade   | Warehouse zones deleted with warehouse   |
| balances       | 1:N       | Cascade   | Stock balances deleted with warehouse    |
| stockMovements | 1:N       | Restrict  | Cannot delete warehouse with movements   |
| stockTakes     | 1:N       | Restrict  | Cannot delete warehouse with stock takes |

### 12. WarehouseZone

| Relationship | Direction | On Delete | Description                 |
| ------------ | --------- | --------- | --------------------------- |
| warehouse    | N:1       | Cascade   | Zone deleted with warehouse |

### 13. StockTransfer

| Relationship | Direction | On Delete | Description                          |
| ------------ | --------- | --------- | ------------------------------------ |
| lines        | 1:N       | Cascade   | Transfer lines deleted with transfer |

### 14. StockTake

| Relationship | Direction | On Delete | Description                              |
| ------------ | --------- | --------- | ---------------------------------------- |
| lines        | 1:N       | Cascade   | Stock take lines deleted with stock take |
| journalEntry | N:1       | Restrict  | Journal entry blocks stock take delete   |

### 15. Asset

| Relationship | Direction | On Delete | Description                               |
| ------------ | --------- | --------- | ----------------------------------------- |
| schedules    | 1:N       | Cascade   | Depreciation schedules deleted with asset |

### 16. DepreciationSchedule

| Relationship | Direction | On Delete | Description                 |
| ------------ | --------- | --------- | --------------------------- |
| asset        | N:1       | Cascade   | Schedule deleted with asset |

### 17. BankAccount

| Relationship    | Direction | On Delete | Description                                |
| --------------- | --------- | --------- | ------------------------------------------ |
| cheques         | 1:N       | Restrict  | Cannot delete account with cheques         |
| receipts        | 1:N       | Restrict  | Cannot delete account with receipts        |
| payments        | 1:N       | Restrict  | Cannot delete account with payments        |
| reconciliations | 1:N       | Restrict  | Cannot delete account with reconciliations |

### 18. Cheque

| Relationship   | Direction | On Delete | Description                        |
| -------------- | --------- | --------- | ---------------------------------- |
| bankAccount    | N:1       | Restrict  | Bank account blocks cheque delete  |
| payment        | N:1       | Set Null  | Payment reference cleared          |
| reconciliation | N:1       | Set Null  | Reconciliation reference cleared   |
| journalEntry   | N:1       | Restrict  | Journal entry blocks cheque delete |

### 19. BankReconciliation

| Relationship | Direction | On Delete | Description                         |
| ------------ | --------- | --------- | ----------------------------------- |
| bankAccount  | N:1       | Cascade   | Reconciliation deleted with account |
| cheques      | 1:N       | Set Null  | Cheque references cleared           |

### 20. PettyCashFund

| Relationship     | Direction | On Delete | Description                      |
| ---------------- | --------- | --------- | -------------------------------- |
| custodian (User) | N:1       | Restrict  | User blocks fund delete          |
| vouchers         | 1:N       | Restrict  | Cannot delete fund with vouchers |

### 21. PettyCashVoucher

| Relationship | Direction | On Delete | Description                         |
| ------------ | --------- | --------- | ----------------------------------- |
| fund         | N:1       | Cascade   | Voucher deleted with fund           |
| journalEntry | N:1       | Restrict  | Journal entry blocks voucher delete |

### 22. Employee

| Relationship | Direction | On Delete | Description                                 |
| ------------ | --------- | --------- | ------------------------------------------- |
| payrolls     | 1:N       | Restrict  | Cannot delete employee with payroll records |

### 23. PayrollRun

| Relationship | Direction | On Delete | Description                             |
| ------------ | --------- | --------- | --------------------------------------- |
| payrolls     | 1:N       | Cascade   | Payroll records deleted with run        |
| journalEntry | N:1       | Restrict  | Journal entry blocks payroll run delete |

### 24. Payroll

| Relationship | Direction | On Delete | Description                    |
| ------------ | --------- | --------- | ------------------------------ |
| payrollRun   | N:1       | Cascade   | Payroll deleted with run       |
| employee     | N:1       | Restrict  | Employee blocks payroll delete |

### 25. User

| Relationship   | Direction | On Delete | Description                              |
| -------------- | --------- | --------- | ---------------------------------------- |
| pettyCashFunds | 1:N       | Restrict  | Cannot delete user with petty cash funds |
| dataImports    | 1:N       | Set Null  | Import references cleared                |
| activityLogs   | 1:N       | Cascade   | Activity logs deleted with user          |

### 26. Company

| Relationship   | Direction | On Delete | Description                   |
| -------------- | --------- | --------- | ----------------------------- |
| systemSettings | 1:1       | Cascade   | Settings deleted with company |

### 27. ScheduledReport

| Relationship | Direction | On Delete | Description                               |
| ------------ | --------- | --------- | ----------------------------------------- |
| runs         | 1:N       | Cascade   | Report runs deleted with scheduled report |

### 28. ScheduledReportRun

| Relationship    | Direction | On Delete | Description                       |
| --------------- | --------- | --------- | --------------------------------- |
| scheduledReport | N:1       | Cascade   | Run deleted with scheduled report |

## Soft Delete Pattern

For entities that cannot be hard-deleted due to referential integrity:

```typescript
// Instead of:
await prisma.customer.delete({ where: { id } });

// Use:
await prisma.customer.update({
  where: { id },
  data: {
    isActive: false,
    deletedAt: new Date(),
    deletedBy: currentUserId,
  },
});
```

## Query Patterns

### Exclude Deleted Records

```typescript
// Always filter out soft-deleted records
const customers = await prisma.customer.findMany({
  where: {
    isActive: true,
    deletedAt: null,
  },
});
```

### Cascade Soft Delete

```typescript
// When soft-deleting a customer, also soft-delete related entities
await prisma.$transaction([
  prisma.customer.update({
    where: { id },
    data: { isActive: false, deletedAt: new Date() },
  }),
  prisma.invoice.updateMany({
    where: { customerId: id, status: 'DRAFT' },
    data: { isActive: false, deletedAt: new Date() },
  }),
]);
```

## Validation Rules

### Before Delete

```typescript
async function canDeleteCustomer(customerId: string): Promise<boolean> {
  const [invoices, receipts] = await Promise.all([
    prisma.invoice.count({ where: { customerId, status: { not: 'DRAFT' } } }),
    prisma.receipt.count({ where: { customerId } }),
  ]);

  return invoices === 0 && receipts === 0;
}
```

### Trigger-Based Protection

```sql
-- PostgreSQL trigger to prevent deletion of posted documents
CREATE OR REPLACE FUNCTION prevent_posted_deletion()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'POSTED' OR OLD."journalEntryId" IS NOT NULL THEN
        RAISE EXCEPTION 'Cannot delete posted document';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;
```

## Summary Table

| Entity         | Can Hard Delete | Soft Delete | Archive Instead         |
| -------------- | --------------- | ----------- | ----------------------- |
| Customer       | ❌              | ✅          | -                       |
| Vendor         | ❌              | ✅          | -                       |
| Product        | ❌              | ✅          | With inventory          |
| Invoice        | ❌              | ❌          | Create Credit Note      |
| JournalEntry   | ❌              | ❌          | Create Reversing Entry  |
| ChartOfAccount | ❌              | ✅          | With transactions       |
| Employee       | ❌              | ✅          | With payroll            |
| Warehouse      | ❌              | ✅          | With movements          |
| BankAccount    | ❌              | ✅          | With transactions       |
| Asset          | ✅              | -           | With schedules          |
| StockTransfer  | ✅              | -           | -                       |
| Receipt        | ❌              | ❌          | Cannot delete if posted |
| Payment        | ❌              | ❌          | Cannot delete if posted |

## Best Practices

1. **Always use soft delete** for master data (customers, vendors, products,
   accounts)
2. **Never delete posted transactions** - use reversing entries instead
3. **Check dependencies** before any delete operation
4. **Use transactions** for multi-table operations
5. **Log deletions** in activity log for audit trail
6. **Consider archiving** old data rather than deleting
