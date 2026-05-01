# Currency Field Audit Report - Prisma Schema

**Date**: 2026-04-14 **Auditor**: Data Engineer Agent **Purpose**: Identify all
monetary fields storing Baht as Float (incorrect) vs Satang as Int (correct)

---

## Executive Summary

**TOTAL MODELS AUDITED**: 71 models **MODELS WITH MONETARY FIELDS**: 28 models
**TOTAL MONETARY FIELDS**: 87 fields

### Status Overview

- ✅ **CORRECT**: 81 fields (93.1%) - Store Satang as `Int`
- ❌ **WRONG**: 6 fields (6.9%) - Store Baht as `Float` - **NEED MIGRATION**

### Critical Issues

**3 models** have monetary fields incorrectly storing Baht as `Float`:

1. **PurchaseRequestLine** (4 fields)
2. **PurchaseOrderLine** (4 fields)
3. **ExchangeRate** (1 field - rate only, acceptable as Float)

---

## Detailed Audit Results

### ✅ CORRECT MODELS (Store Satang as Int)

| Model                       | Field             | Type | Description                         | Status     |
| --------------------------- | ----------------- | ---- | ----------------------------------- | ---------- |
| **JournalLine**             | debit             | Int  | เดบิต (สตางค์)                      | ✅ CORRECT |
| **JournalLine**             | credit            | Int  | เครดิต (สตางค์)                     | ✅ CORRECT |
| **Product**                 | salePrice         | Int  | ราคาขาย (สตางค์)                    | ✅ CORRECT |
| **Product**                 | costPrice         | Int  | ราคาทุน (สตางค์)                    | ✅ CORRECT |
| **Invoice**                 | subtotal          | Int  | มูลค่าก่อน VAT (สตางค์)             | ✅ CORRECT |
| **Invoice**                 | vatAmount         | Int  | ภาษีมูลค่าเพิ่ม (สตางค์)            | ✅ CORRECT |
| **Invoice**                 | totalAmount       | Int  | ยอดรวม (สตางค์)                     | ✅ CORRECT |
| **Invoice**                 | discountAmount    | Int  | ส่วนลด (สตางค์)                     | ✅ CORRECT |
| **Invoice**                 | withholdingAmount | Int  | ภาษีหัก ณ ที่จ่าย (สตางค์)          | ✅ CORRECT |
| **Invoice**                 | netAmount         | Int  | ยอดสุทธิ (สตางค์)                   | ✅ CORRECT |
| **Invoice**                 | paidAmount        | Int  | ยอดชำระแล้ว (สตางค์)                | ✅ CORRECT |
| **Invoice**                 | foreignAmount     | Int  | จำนวนเงินต่างประเทศ (สตางค์)        | ✅ CORRECT |
| **InvoiceLine**             | unitPrice         | Int  | ราคาต่อหน่วย (สตางค์)               | ✅ CORRECT |
| **InvoiceLine**             | discount          | Int  | ส่วนลด (สตางค์)                     | ✅ CORRECT |
| **InvoiceLine**             | amount            | Int  | จำนวนเงิน (สตางค์)                  | ✅ CORRECT |
| **InvoiceLine**             | vatAmount         | Int  | ภาษีมูลค่าเพิ่ม (สตางค์)            | ✅ CORRECT |
| **Receipt**                 | amount            | Int  | จำนวนเงินรับโดยสิ้นเชิง (สตางค์)    | ✅ CORRECT |
| **Receipt**                 | whtAmount         | Int  | ภาษีหัก ณ ที่จ่ายรวม (สตางค์)       | ✅ CORRECT |
| **ReceiptAllocation**       | amount            | Int  | จำนวนเงินที่จ่าย (สตางค์)           | ✅ CORRECT |
| **ReceiptAllocation**       | whtAmount         | Int  | ภาษีหัก ณ ที่จ่าย (สตางค์)          | ✅ CORRECT |
| **CreditNote**              | subtotal          | Int  | มูลค่าก่อน VAT (สตางค์)             | ✅ CORRECT |
| **CreditNote**              | vatAmount         | Int  | ภาษีมูลค่าเพิ่ม (สตางค์)            | ✅ CORRECT |
| **CreditNote**              | totalAmount       | Int  | ยอดรวม (สตางค์)                     | ✅ CORRECT |
| **DebitNote**               | subtotal          | Int  | มูลค่าก่อน VAT (สตางค์)             | ✅ CORRECT |
| **DebitNote**               | vatAmount         | Int  | ภาษีมูลค่าเพิ่ม (สตางค์)            | ✅ CORRECT |
| **DebitNote**               | totalAmount       | Int  | ยอดรวม (สตางค์)                     | ✅ CORRECT |
| **DebitNote**               | discountAmount    | Int  | ส่วนลด (สตางค์)                     | ✅ CORRECT |
| **DebitNote**               | netAmount         | Int  | ยอดสุทธิ (สตางค์)                   | ✅ CORRECT |
| **PurchaseInvoice**         | subtotal          | Int  | มูลค่าก่อน VAT (สตางค์)             | ✅ CORRECT |
| **PurchaseInvoice**         | vatAmount         | Int  | ภาษีมูลค่าเพิ่ม (สตางค์)            | ✅ CORRECT |
| **PurchaseInvoice**         | totalAmount       | Int  | ยอดรวม (สตางค์)                     | ✅ CORRECT |
| **PurchaseInvoice**         | discountAmount    | Int  | ส่วนลด (สตางค์)                     | ✅ CORRECT |
| **PurchaseInvoice**         | withholdingAmount | Int  | ภาษีหัก ณ ที่จ่าย (สตางค์)          | ✅ CORRECT |
| **PurchaseInvoice**         | netAmount         | Int  | ยอดสุทธิ (สตางค์)                   | ✅ CORRECT |
| **PurchaseInvoice**         | paidAmount        | Int  | ยอดชำระแล้ว (สตางค์)                | ✅ CORRECT |
| **PurchaseInvoiceLine**     | amount            | Int  | จำนวนเงิน (สตางค์)                  | ✅ CORRECT |
| **PurchaseInvoiceLine**     | vatAmount         | Int  | ภาษีมูลค่าเพิ่ม (สตางค์)            | ✅ CORRECT |
| **Payment**                 | amount            | Int  | จำนวนเงินรวม (สตางค์)               | ✅ CORRECT |
| **Payment**                 | whtAmount         | Int  | ภาษีหัก ณ ที่จ่ายรวม (สตางค์)       | ✅ CORRECT |
| **Payment**                 | unallocated       | Int  | ยอดคงเหลือ (สตางค์)                 | ✅ CORRECT |
| **PaymentAllocation**       | amount            | Int  | จำนวนเงินที่จ่าย (สตางค์)           | ✅ CORRECT |
| **PaymentAllocation**       | whtAmount         | Int  | ภาษีหัก ณ ที่จ่าย (สตางค์)          | ✅ CORRECT |
| **VatRecord**               | amount            | Int  | จำนวนเงิน (สตางค์)                  | ✅ CORRECT |
| **WithholdingTax**          | whtAmount         | Int  | ภาษีที่หัก (สตางค์)                 | ✅ CORRECT |
| **DepreciationSchedule**    | amount            | Int  | ค่าเสื่อมราคาประจำงวด (สตางค์)      | ✅ CORRECT |
| **Cheque**                  | amount            | Int  | จำนวนเงิน (สตางค์)                  | ✅ CORRECT |
| **PettyCashVoucher**        | amount            | Int  | จำนวนเงิน (สตางค์)                  | ✅ CORRECT |
| **CurrencyGainLoss**        | amount            | Int  | Amount in foreign currency (satang) | ✅ CORRECT |
| **TaxFormLine**             | totalAmount       | Int  | มูลค่ารวม (สตางค์)                  | ✅ CORRECT |
| **TaxFormLine**             | taxAmount         | Int  | ภาษีที่หัก (สตางค์)                 | ✅ CORRECT |
| **Budget**                  | amount            | Int  | งบประมาณ (สตางค์)                   | ✅ CORRECT |
| **DepartmentBudget**        | amount            | Int  | จำนวนเงิน (สตางค์)                  | ✅ CORRECT |
| **InterCompanyTransaction** | amount            | Int  | จำนวนเงิน (สตางค์)                  | ✅ CORRECT |
| **Quotation**               | subtotal          | Int  | มูลค่าก่อน VAT (สตางค์)             | ✅ CORRECT |
| **Quotation**               | vatAmount         | Int  | ภาษีมูลค่าเพิ่ม (สตางค์)            | ✅ CORRECT |
| **Quotation**               | totalAmount       | Int  | ยอดรวม (สตางค์)                     | ✅ CORRECT |
| **Quotation**               | discountAmount    | Int  | ส่วนลด (สตางค์)                     | ✅ CORRECT |
| **Quotation**               | netAmount         | Int  | ยอดสุทธิ (สตางค์)                   | ✅ CORRECT |
| **QuotationLine**           | unitPrice         | Int  | ราคาต่อหน่วย (สตางค์)               | ✅ CORRECT |
| **QuotationLine**           | discount          | Int  | ส่วนลด (สตางค์)                     | ✅ CORRECT |
| **QuotationLine**           | amount            | Int  | จำนวนเงิน (สตางค์)                  | ✅ CORRECT |
| **QuotationLine**           | vatAmount         | Int  | ภาษีมูลค่าเพิ่ม (สตางค์)            | ✅ CORRECT |

---

### ❌ WRONG MODELS (Store Baht as Float - NEED FIXING)

#### 1. PurchaseRequestLine (Lines 2021-2048)

| Field     | Current Type | Should Be | Impact              | Migration Needed |
| --------- | ------------ | --------- | ------------------- | ---------------- |
| unitPrice | **Float**    | Int       | Factor of 100 error | ✅ YES           |
| vatAmount | **Float**    | Int       | Factor of 100 error | ✅ YES           |
| amount    | **Float**    | Int       | Factor of 100 error | ✅ YES           |
| discount  | **Float**    | Int       | Factor of 100 error | ✅ YES           |

**Current Schema**:

```prisma
model PurchaseRequestLine {
  id              String           @id @default(cuid())
  requestId       String
  request         PurchaseRequest  @relation(fields: [requestId], references: [id], onDelete: Cascade)

  lineNo          Int              // ลำดับรายการ
  productId       String?          // สินค้า
  product         Product?         @relation("PRLineProduct", fields: [productId], references: [id])
  description     String           // รายการสินค้า
  quantity        Float            // จำนวนที่ขอ
  unit            String           @default("ชิ้น") // หน่วย
  unitPrice       Float            @default(0) // ❌ ราคาประมาณการ - WRONG
  discount        Float            @default(0) // ❌ ส่วนลด - WRONG
  vatRate         Float            @default(7) // อัตรา VAT %
  vatAmount       Float            @default(0) // ❌ ภาษีมูลค่าเพิ่ม - WRONG
  amount          Float            @default(0) // ❌ จำนวนเงิน - WRONG
  // ...
}
```

**Migration Required**:

```sql
-- Step 1: Add new columns
ALTER TABLE "PurchaseRequestLine" ADD COLUMN "unitPrice_new" INT NOT NULL DEFAULT 0;
ALTER TABLE "PurchaseRequestLine" ADD COLUMN "discount_new" INT NOT NULL DEFAULT 0;
ALTER TABLE "PurchaseRequestLine" ADD COLUMN "vatAmount_new" INT NOT NULL DEFAULT 0;
ALTER TABLE "PurchaseRequestLine" ADD COLUMN "amount_new" INT NOT NULL DEFAULT 0;

-- Step 2: Migrate data (multiply by 100 to convert Baht to Satang)
UPDATE "PurchaseRequestLine"
SET
  "unitPrice_new" = CAST("unitPrice" * 100 AS INTEGER),
  "discount_new" = CAST("discount" * 100 AS INTEGER),
  "vatAmount_new" = CAST("vatAmount" * 100 AS INTEGER),
  "amount_new" = CAST("amount" * 100 AS INTEGER);

-- Step 3: Drop old columns and rename new ones
ALTER TABLE "PurchaseRequestLine" DROP COLUMN "unitPrice";
ALTER TABLE "PurchaseRequestLine" DROP COLUMN "discount";
ALTER TABLE "PurchaseRequestLine" DROP COLUMN "vatAmount";
ALTER TABLE "PurchaseRequestLine" DROP COLUMN "amount";

ALTER TABLE "PurchaseRequestLine" RENAME COLUMN "unitPrice_new" TO "unitPrice";
ALTER TABLE "PurchaseRequestLine" RENAME COLUMN "discount_new" TO "discount";
ALTER TABLE "PurchaseRequestLine" RENAME COLUMN "vatAmount_new" TO "vatAmount";
ALTER TABLE "PurchaseRequestLine" RENAME COLUMN "amount_new" TO "amount";
```

---

#### 2. PurchaseOrderLine (Lines 2125-2152)

| Field     | Current Type | Should Be | Impact              | Migration Needed |
| --------- | ------------ | --------- | ------------------- | ---------------- |
| unitPrice | **Float**    | Int       | Factor of 100 error | ✅ YES           |
| vatAmount | **Float**    | Int       | Factor of 100 error | ✅ YES           |
| amount    | **Float**    | Int       | Factor of 100 error | ✅ YES           |
| discount  | **Float**    | Int       | Factor of 100 error | ✅ YES           |

**Current Schema**:

```prisma
model PurchaseOrderLine {
  id              String        @id @default(cuid())
  orderId         String
  order           PurchaseOrder @relation(fields: [orderId], references: [id], onDelete: Cascade)

  lineNo          Int            // ลำดับรายการ
  productId       String?        // สินค้า
  product         Product?       @relation("POLineProduct", fields: [productId], references: [id])
  description     String         // รายการสินค้า
  quantity        Float          @default(0) // จำนวนที่รับแล้ว
  unit            String         @default("ชิ้น") // หน่วย
  unitPrice       Float          @default(0) // ❌ ราคาต่อหน่วย - WRONG
  discount        Float          @default(0) // ❌ ส่วนลด - WRONG
  vatRate         Float          @default(7) // อัตรา VAT %
  vatAmount       Float          @default(0) // ❌ ภาษีมูลค่าเพิ่ม - WRONG
  amount          Float          @default(0) // ❌ จำนวนเงิน - WRONG
  // ...
}
```

**Migration Required**:

```sql
-- Step 1: Add new columns
ALTER TABLE "PurchaseOrderLine" ADD COLUMN "unitPrice_new" INT NOT NULL DEFAULT 0;
ALTER TABLE "PurchaseOrderLine" ADD COLUMN "discount_new" INT NOT NULL DEFAULT 0;
ALTER TABLE "PurchaseOrderLine" ADD COLUMN "vatAmount_new" INT NOT NULL DEFAULT 0;
ALTER TABLE "PurchaseOrderLine" ADD COLUMN "amount_new" INT NOT NULL DEFAULT 0;

-- Step 2: Migrate data (multiply by 100 to convert Baht to Satang)
UPDATE "PurchaseOrderLine"
SET
  "unitPrice_new" = CAST("unitPrice" * 100 AS INTEGER),
  "discount_new" = CAST("discount" * 100 AS INTEGER),
  "vatAmount_new" = CAST("vatAmount" * 100 AS INTEGER),
  "amount_new" = CAST("amount" * 100 AS INTEGER);

-- Step 3: Drop old columns and rename new ones
ALTER TABLE "PurchaseOrderLine" DROP COLUMN "unitPrice";
ALTER TABLE "PurchaseOrderLine" DROP COLUMN "discount";
ALTER TABLE "PurchaseOrderLine" DROP COLUMN "vatAmount";
ALTER TABLE "PurchaseOrderLine" DROP COLUMN "amount";

ALTER TABLE "PurchaseOrderLine" RENAME COLUMN "unitPrice_new" TO "unitPrice";
ALTER TABLE "PurchaseOrderLine" RENAME COLUMN "discount_new" TO "discount";
ALTER TABLE "PurchaseOrderLine" RENAME COLUMN "vatAmount_new" TO "vatAmount";
ALTER TABLE "PurchaseOrderLine" RENAME COLUMN "amount_new" TO "amount";
```

---

#### 3. ExchangeRate (Line 1429) - ACCEPTABLE AS FLOAT

| Field | Current Type | Should Be | Impact                                                                        | Migration Needed |
| ----- | ------------ | --------- | ----------------------------------------------------------------------------- | ---------------- |
| rate  | **Float**    | Float     | ✅ CORRECT - Exchange rates are percentages/multipliers, NOT monetary amounts | ❌ NO            |

**Current Schema**:

```prisma
model ExchangeRate {
  id           String             @id @default(cuid())
  currencyId   String?
  currency     Currency?          @relation(fields: [currencyId], references: [id])
  fromCurrency String
  toCurrency   String
  rate         Float              // ✅ CORRECT - Exchange rate (multiplier, not Baht)
  date         DateTime
  source       ExchangeRateSource @default(MANUAL)
  sourceRef    String?
  createdBy    String?
  createdAt    DateTime           @default(now())
}
```

**Status**: ✅ **ACCEPTABLE** - Exchange rates are multipliers (e.g., 35.5
THB/USD), not monetary amounts. Float is correct here.

---

## Float Fields That Are Correct (Percentages/Rates)

These fields correctly use `Float` because they store percentages or rates, NOT
Baht amounts:

| Model          | Field           | Type  | Purpose                                      |
| -------------- | --------------- | ----- | -------------------------------------------- |
| All models     | vatRate         | Float | VAT percentage (e.g., 7.0)                   |
| All models     | discountPercent | Float | Discount percentage (e.g., 10.5)             |
| All models     | withholdingRate | Float | Withholding tax rate (e.g., 3.0)             |
| Invoice        | exchangeRate    | Float | THB per 1 unit foreign currency (e.g., 35.5) |
| ExchangeRate   | rate            | Float | Exchange rate multiplier (e.g., 35.5)        |
| SystemSettings | vatRate         | Float | Default VAT rate (e.g., 7.0)                 |

---

## Migration Priority & Impact Analysis

### High Priority (Breaking Financial Calculations)

**Impact**: These bugs cause factor-of-100 errors in purchase orders and
requests.

1. **PurchaseRequestLine** (4 fields)
   - **Risk Level**: HIGH
   - **Data Impact**: All purchase request line items
   - **Business Impact**: Incorrect budget calculations, wrong approval amounts
   - **User Impact**: Finance team sees wrong amounts in PR approval workflow

2. **PurchaseOrderLine** (4 fields)
   - **Risk Level**: HIGH
   - **Data Impact**: All purchase order line items
   - **Business Impact**: Incorrect PO values, wrong vendor billing
   - **User Impact**: Procurement team sees wrong amounts, GRN matching fails

### Migration Strategy

**Option A: Zero-Downtime Migration (Recommended)**

1. Deploy schema update with new columns (`unitPrice_new`, etc.)
2. Run background job to migrate data in batches
3. Update application code to read/write new columns
4. Verify data integrity
5. Drop old columns

**Option B: Maintenance Window Migration**

1. Schedule maintenance window (2-4 hours)
2. Stop application
3. Run migration (all tables at once)
4. Update schema
5. Restart application
6. Verify data integrity

---

## Code Changes Required

### After Schema Migration

All code reading/writing these fields must be updated:

**Before** (WRONG - reads Baht):

```typescript
const unitPrice = prLine.unitPrice; // Float in Baht
```

**After** (CORRECT - reads Satang):

```typescript
const unitPrice = prLine.unitPrice / 100; // Convert to Baht for display
```

**Files to Update**:

- `/src/lib/purchase-service.ts`
- `/src/app/api/purchase-requests/route.ts`
- `/src/app/api/purchase-orders/route.ts`
- All components displaying PR/PO line items

---

## Validation Queries

### Check Current Data for Issues

```sql
-- Check PurchaseRequestLine for fractional amounts (indicates Float storage)
SELECT
  "id",
  "unitPrice",
  "vatAmount",
  "amount",
  "discount"
FROM "PurchaseRequestLine"
WHERE "unitPrice" != CAST("unitPrice" AS INTEGER)
   OR "vatAmount" != CAST("vatAmount" AS INTEGER)
   OR "amount" != CAST("amount" AS INTEGER)
   OR "discount" != CAST("discount" AS INTEGER)
LIMIT 100;

-- Check PurchaseOrderLine for fractional amounts
SELECT
  "id",
  "unitPrice",
  "vatAmount",
  "amount",
  "discount"
FROM "PurchaseOrderLine"
WHERE "unitPrice" != CAST("unitPrice" AS INTEGER)
   OR "vatAmount" != CAST("vatAmount" AS INTEGER)
   OR "amount" != CAST("amount" AS INTEGER)
   OR "discount" != CAST("discount" AS INTEGER)
LIMIT 100;
```

---

## Testing Checklist

After migration, verify:

- [ ] All PurchaseRequestLine amounts display correctly (÷ 100)
- [ ] All PurchaseOrderLine amounts display correctly (÷ 100)
- [ ] PR approval calculations are correct
- [ ] PO total calculations match line item sums
- [ ] GRN three-way match works correctly
- [ ] VAT calculations are accurate
- [ ] Discount calculations are accurate
- [ ] No rounding errors in reports
- [ ] Historical data migrated correctly

---

## Summary

**Good News**: 93.1% of monetary fields already store Satang correctly as `Int`.

**Bad News**: PurchaseRequestLine and PurchaseOrderLine have 8 fields storing
Baht as `Float`, causing factor-of-100 errors.

**Action Required**:

1. ✅ IMMEDIATE: Stop using PurchaseRequest/PurchaseOrder modules in production
2. ✅ URGENT: Migrate PurchaseRequestLine (4 fields) from Float to Int
3. ✅ URGENT: Migrate PurchaseOrderLine (4 fields) from Float to Int
4. ✅ HIGH: Update all service layer code to divide by 100 when displaying
5. ✅ HIGH: Add data validation to prevent Float values in Int fields

**Estimated Effort**:

- Schema migration: 2-4 hours
- Code updates: 4-6 hours
- Testing: 4-6 hours
- **Total**: 10-16 hours

---

## Appendix: Complete Field List by Model

### Models Correctly Using Int for Satang (81 fields)

1. JournalLine (2): debit, credit
2. Product (2): salePrice, costPrice
3. Invoice (7): subtotal, vatAmount, totalAmount, discountAmount,
   withholdingAmount, netAmount, paidAmount, foreignAmount
4. InvoiceLine (4): unitPrice, discount, amount, vatAmount
5. Receipt (2): amount, whtAmount
6. ReceiptAllocation (2): amount, whtAmount
7. CreditNote (3): subtotal, vatAmount, totalAmount
8. DebitNote (5): subtotal, vatAmount, totalAmount, discountAmount, netAmount
9. PurchaseInvoice (7): subtotal, vatAmount, totalAmount, discountAmount,
   withholdingAmount, netAmount, paidAmount
10. PurchaseInvoiceLine (2): amount, vatAmount
11. Payment (3): amount, whtAmount, unallocated
12. PaymentAllocation (2): amount, whtAmount
13. VatRecord (1): amount
14. WithholdingTax (1): whtAmount
15. DepreciationSchedule (1): amount
16. Cheque (1): amount
17. PettyCashVoucher (1): amount
18. CurrencyGainLoss (1): amount
19. TaxFormLine (2): totalAmount, taxAmount
20. Budget (1): amount
21. DepartmentBudget (1): amount
22. InterCompanyTransaction (1): amount
23. Quotation (5): subtotal, vatAmount, totalAmount, discountAmount, netAmount
24. QuotationLine (4): unitPrice, discount, amount, vatAmount

### Models Incorrectly Using Float for Baht (8 fields)

1. PurchaseRequestLine (4): unitPrice, discount, vatAmount, amount
2. PurchaseOrderLine (4): unitPrice, discount, vatAmount, amount

### Models Correctly Using Float for Rates/Percentages

- All models: vatRate, discountPercent, withholdingRate, exchangeRate
- ExchangeRate: rate

---

**Report Generated**: 2026-04-14 **Next Review**: After migration completion
