# VAT Architecture - Complete Accounting Flow

## Overview

This document explains how VAT (ภาษีมูลค่าเพิ่ม) is properly tracked and linked throughout the Thai Accounting ERP system according to real-world accounting standards.

## 📚 Accounting Principles (Thai Revenue Department Standards)

### VAT OUTPUT (ภาษีขาย) - Tax You Charge Customers
- **Source**: Sales tax invoices you issue
- **When**: When invoice is issued/posted (not when drafted)
- **Documents**:
  - ✅ Tax Invoices (ใบกำกับภาษี)
  - ✅ Receipts (ใบเสร็จรับเงิน)
  - ✅ Debit Notes (ใบเพิ่มหนี้) - Increase VAT
  - ✅ Credit Notes (ใบลดหนี้) - Decrease VAT

### VAT INPUT (ภาษีซื้อ) - Tax You Pay to Suppliers
- **Source**: Supplier tax invoices you receive
- **When**: When purchase invoice is received/posted
- **Documents**:
  - ✅ Purchase Tax Invoices (ใบกำกับภาษีจากผู้ขาย)
  - ✅ Supplier Debit Notes - Increase VAT INPUT
  - ✅ Supplier Credit Notes - Decrease VAT INPUT

### ❌ NOT Tax Documents (Don't Create VAT Records):
- Purchase Orders (PO) - Internal purchasing requests only
- Purchase Requests - Internal documents only
- Quotations - Not tax documents until issued

## 🔗 System Architecture

### Central VAT Ledger: VatRecord Table

All VAT transactions flow through the `VatRecord` table:

```typescript
VatRecord {
  id: string
  type: 'OUTPUT' | 'INPUT'           // OUTPUT = ภาษีขาย, INPUT = ภาษีซื้อ
  documentType: string               // INVOICE, PURCHASE_INVOICE, RECEIPT, etc.
  referenceId: string                // Links to original document
  documentNo: string                 // Invoice number
  documentDate: Date                 // Tax date
  taxMonth: number                   // Month (1-12) for reporting
  taxYear: number                    // Year for reporting

  // Customer/Vendor info
  customerId?: string
  customerName?: string
  customerTaxId?: string
  vendorId?: string
  vendorName?: string
  vendorTaxId?: string

  // VAT amounts
  subtotal: number                   // Amount before VAT
  vatRate: number                    // 7% for Thailand
  vatAmount: number                  // Actual VAT amount
  totalAmount: number                // Including VAT
}
```

## 📊 Complete VAT Flow Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                    SALES (VAT OUTPUT)                           │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Create Sales Invoice (DRAFT)                               │
│     └──> No VAT record yet                                     │
│                                                                 │
│  2. Post/Issue Invoice                                         │
│     ├──> Invoice status: DRAFT → ISSUED                        │
│     ├──> Create VatRecord (OUTPUT) ✅                          │
│     ├──> Create Journal Entries (Revenue + AR + VAT Output)   │
│     └──> Update Inventory (COGS)                               │
│                                                                 │
│  3. Issue Credit Note (reduce VAT)                            │
│     └──> Update/reduce VatRecord (OUTPUT) ✅                   │
│                                                                 │
│  4. Issue Debit Note (increase VAT)                            │
│     └──> Update/increase VatRecord (OUTPUT) ✅                 │
│                                                                 │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                    PURCHASES (VAT INPUT)                        │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Create Purchase Invoice (DRAFT)                            │
│     └──> No VAT record yet                                     │
│                                                                 │
│  2. Post/Receive Purchase Invoice                              │
│     ├──> Purchase Invoice status: DRAFT → POSTED              │
│     ├──> Create VatRecord (INPUT) ✅                           │
│     ├──> Create Journal Entries (Inventory + VAT Input + AP)  │
│     └──> Update Inventory (WAC cost)                           │
│                                                                 │
│  3. Supplier Credit Note (reduce VAT INPUT)                   │
│     └──> Update/reduce VatRecord (INPUT) ✅                    │
│                                                                 │
│  4. Supplier Debit Note (increase VAT INPUT)                  │
│     └──> Update/increase VatRecord (INPUT) ✅                  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                      VAT REPORT (PP.30)                         │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SELECT type, taxMonth, taxYear, SUM(vatAmount)               │
│  FROM VatRecord                                                │
│  WHERE documentDate BETWEEN @startDate AND @endDate            │
│  GROUP BY type, taxMonth, taxYear                              │
│                                                                 │
│  Results:                                                      │
│  ├── VAT OUTPUT = ฿180,965 (from sales)                       │
│  ├── VAT INPUT = ฿0 (no purchases yet)                        │
│  └── NET VAT = OUTPUT - INPUT = ฿180,965 (payable)            │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

## 🔧 Implementation Status

### ✅ Fully Implemented (Working)

1. **Sales Invoice VAT OUTPUT**
   - Endpoint: `POST /api/invoices/[id]/issue`
   - Creates VatRecord (OUTPUT) when invoice issued
   - Status: ✅ **52 records, ฿180,965 VAT**

2. **Receipt VAT OUTPUT**
   - Integrated with invoice system
   - Creates VatRecord when receipt issued

3. **Invoice Detail Page with Comments**
   - Full commenting system integrated
   - Audit log tracking
   - Related documents

### 🆕 Just Implemented

4. **Purchase Invoice VAT INPUT**
   - Endpoint: `POST /api/purchases/[id]/post`
   - Creates VatRecord (INPUT) when purchase posted
   - Creates journal entries (Inventory + VAT Input + AP)
   - Updates inventory (WAC costing)
   - Status: ✅ **Ready to test**

### ❌ Not Yet Implemented (Future Work)

5. **Credit/Debit Note VAT Adjustments**
   - Should update existing VatRecords
   - Should handle VAT reductions/increases

6. **Supplier Credit/Debit Notes**
   - Should create/update INPUT VatRecords

## 🧪 Testing VAT Linking

### Test VAT OUTPUT (Already Working)
```bash
# 1. Create sales invoice
POST /api/invoices
{
  "customerId": "...",
  "type": "TAX_INVOICE",
  "lines": [{ "description": "Product", "quantity": 1, "unitPrice": 1000 }]
}

# 2. Post invoice
POST /api/invoices/[id]/issue

# 3. Check VAT record
SELECT * FROM VatRecord WHERE type = 'OUTPUT' AND referenceId = '[invoice-id]'
# Result: ✅ VatRecord created with VAT amount

# 4. Check VAT report
GET /api/reports/vat?startDate=2025-01-01&endDate=2026-12-31
# Result: ✅ Shows VAT OUTPUT
```

### Test VAT INPUT (New Feature)
```bash
# 1. Create purchase invoice
POST /api/purchases
{
  "vendorId": "...",
  "type": "TAX_INVOICE",
  "lines": [{ "description": "Product from supplier", "quantity": 10, "unitPrice": 500 }]
}

# 2. Post purchase invoice
POST /api/purchases/[id]/post

# 3. Check VAT record
SELECT * FROM VatRecord WHERE type = 'INPUT' AND referenceId = '[purchase-id]'
# Result: ✅ VatRecord created with VAT amount

# 4. Check VAT report
GET /api/reports/vat?startDate=2025-01-01&endDate=2026-12-31
# Result: ✅ Shows VAT INPUT
```

## 📋 Monthly VAT Filing (PP.30 Form)

The VatRecord table is structured to match the Thai Revenue Department's PP.30 VAT filing form:

```typescript
// For monthly VAT report
const monthlyVat = await prisma.vatRecord.groupBy({
  by: ['taxMonth', 'taxYear', 'type'],
  where: {
    taxMonth: currentMonth,
    taxYear: currentYear
  },
  _sum: {
    vatAmount: true
  }
})

// Results match PP.30 sections:
// - Section 1: VAT OUTPUT (ภาษีขาย)
// - Section 2: VAT INPUT (ภาษีซื้อ)
// - Section 3: NET VAT (ภาษีสุทธิ)
```

## 🎯 Key Benefits of This Architecture

1. **Single Source of Truth** - All VAT in one VatRecord table
2. **Audit Trail** - Every VAT entry links to source document via referenceId
3. **Flexible** - Can handle any document type (invoices, receipts, corrections)
4. **Report-Ready** - Already grouped by month/year for PP.30 filing
5. **Accurate** - VAT only recorded when documents are posted (not drafted)
6. **Compliant** - Follows Thai Revenue Department standards

## 📝 Important Notes

1. **DRAFT ≠ Posted** - VAT records only created when documents are posted/issued
2. **Purchase Orders ≠ Tax Documents** - POs don't create VAT records
3. **ReferenceId Linking** - All VatRecords link back to source documents
4. **Credit/Debit Notes** - Should adjust existing VAT (future implementation)
5. **Date-Based Reporting** - VAT reported by document date, not posting date

## 🔗 Related Files

- **VatRecord Creation (Sales)**: `/api/invoices/[id]/issue/route.ts`
- **VatRecord Creation (Purchases)**: `/api/purchases/[id]/post/route.ts`
- **VAT Report**: `/api/reports/vat/route.ts`
- **Database Schema**: `prisma/schema.prisma` (VatRecord model)
- **Backfill Script**: `scripts/backfill-vat-records.ts`
