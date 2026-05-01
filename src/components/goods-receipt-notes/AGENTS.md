<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-04-17 -->

# Goods Receipt Note (GRN) Management

## Purpose

GRN is part of the procure-to-pay cycle — receiving goods from vendors against
purchase orders. Tracks incoming inventory, inspection status, and posts GL
entries when received goods are verified.

## Key Files

| File                    | Description                                                             |
| ----------------------- | ----------------------------------------------------------------------- |
| `grn-list.tsx`          | GRN list with status filtering, quick filters, and workflow actions     |
| `grn-form.tsx`          | 3-step wizard: PO selection -> Quantity confirmation -> Journal preview |
| `grn-detail-dialog.tsx` | Full GRN detail view with print/download and PO relationship            |
| `index.ts`              | Module exports                                                          |

## Data Flow

```
Purchase Order (CONFIRMED/SHIPPED)
    |
    v
Goods Receipt Note (DRAFT -> RECEIVED -> INSPECTED -> POSTED)
    |                                     |
    v                                     v
Inventory Update                    Journal Entry Created
(PO receivedQty updated)           DR Inventory (1140)
                                    CR GR/IR (2160)
```

**Three-Way Match**: PO -> GRN -> Purchase Invoice

## Workflow States

| Status      | Thai        | Description                                   |
| ----------- | ----------- | --------------------------------------------- |
| `RECEIVED`  | รับแล้ว     | Goods physically received, pending inspection |
| `INSPECTED` | ตรวจสอบแล้ว | Goods verified and accepted                   |
| `POSTED`    | ลงบัญชีแล้ว | GL entry created                              |
| `CANCELLED` | ยกเลิก      | GRN cancelled, journal reversed               |

## API Endpoints

### GET /api/goods-receipt-notes

List GRNs with pagination and filtering.

**Query Parameters** | Param | Type | Description |
|-------|------|-------------| | `page` | number | Page number (default: 1) | |
`limit` | number | Items per page (default: 20) | | `poId` | string | Filter by
PO | | `vendorId` | string | Filter by vendor | | `warehouseId` | string |
Filter by warehouse | | `status` | string | Filter by status | | `startDate` |
string | Filter by date range | | `endDate` | string | Filter by date range |

**Response 200**

```json
{
  "success": true,
  "data": [{ "id": "...", "grnNo": "GRN-2026-00001", "status": "RECEIVED", ... }],
  "pagination": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 }
}
```

### POST /api/goods-receipt-notes

Create new GRN. Automatically creates journal entry.

**Request**

```json
{
  "date": "2026-04-17",
  "poId": "clx...",
  "vendorId": "clx...",
  "warehouseId": "clx...",
  "notes": "optional",
  "lines": [
    {
      "poLineId": "clx...",
      "productId": "clx...",
      "description": "สินค้าตาม PO",
      "unit": "ชิ้น",
      "qtyOrdered": 100,
      "qtyReceived": 100,
      "qtyRejected": 0,
      "unitCost": 5000,
      "amount": 500000,
      "notes": ""
    }
  ]
}
```

**Response 201**

```json
{ "success": true, "data": { "id": "clx...", "grnNo": "GRN-2026-00001" } }
```

**Errors** | Code | Reason | |------|--------| | 400 | Validation failed or PO
not in CONFIRMED/SHIPPED status | | 403 | VIEWER role cannot create | | 404 | PO
or vendor not found |

### GET /api/goods-receipt-notes/[id]

Get single GRN with lines, vendor, warehouse, PO, and journal entry.

**Response 200**

```json
{
  "data": {
    "id": "clx...",
    "grnNo": "GRN-2026-00001",
    "status": "RECEIVED",
    "purchaseOrder": { "id": "...", "orderNo": "PO-2026-00001" },
    "lines": [{ "id": "...", "description": "...", "qtyReceived": 100 }],
    "vendor": { "code": "...", "name": "..." },
    "journalEntry": { "entryNo": "JE-2026-00001" }
  }
}
```

### PUT /api/goods-receipt-notes/[id]

Update GRN status and rejected quantities. Triggers PO receivedQty update on
INSPECTED transition.

**Request**

```json
{
  "status": "INSPECTED",
  "notes": "optional",
  "lines": [{ "id": "clx...", "qtyRejected": 2, "notes": "damaged" }]
}
```

**Errors** | Code | Reason | |------|--------| | 400 | CANCELLED GRN cannot be
modified | | 403 | VIEWER role cannot modify | | 404 | GRN not found |

### DELETE /api/goods-receipt-notes/[id]

Cancel GRN. Creates reversal journal entry (debit/credit swap), restores PO
receivedQty.

**Errors** | Code | Reason | |------|--------| | 400 | Cannot cancel INSPECTED
or already CANCELLED GRN | | 403 | Requires ADMIN or ACCOUNTANT role | | 404 |
GRN not found |

## UI Components

### GRNForm (grn-form.tsx)

3-step wizard dialog:

1. **Step 1**: Select PO from list of OPEN POs
2. **Step 2**: Confirm receiving quantities (with 5% over-receive tolerance),
   see variance badges
3. **Step 3**: Review journal entry preview (DR Inventory, CR GR/IR), then
   submit

Key features:

- Pre-fills quantities with remaining (ordered - previously received)
- Variance tracking: shows over/under receive badges
- Journal preview before submission

### GRNList (grn-list.tsx)

Main list view with:

- Summary cards: Pending (RECEIVED), Inspected, Posted, Total
- Quick filter buttons: ทั้งหมด, รอตรวจสอบ, ตรวจสอบแล้ว, ลงบัญชีแล้ว
- Search by GRN number, vendor, or PO
- Inline actions: Inspect (RECEIVED -> INSPECTED), Post (INSPECTED -> POSTED),
  View, Print
- Print generates self-printing HTML document

### GRNDetailDialog (grn-detail-dialog.tsx)

Full detail view with:

- PO relationship card (linked PO, related purchase invoices)
- Vendor info card
- Line items table with variance badges
- Totals section (subtotal, discount, VAT, net)
- Quick action: Create Purchase Invoice button (when INSPECTED)
- Print and download actions

## Journal Entry

When GRN is created, it automatically posts:

```
DR  Inventory (1140)           [Total amount in Satang]
     CR  GR/IR Clearing (2160) [Total amount in Satang]
```

**On Cancellation**: Reversal entry swaps debit/credit and links via
`reversingId`.

## For AI Agents

### Working In This Directory

**GRN Data Model**

```typescript
interface GoodsReceiptNote {
  id: string;
  grnNo: string; // Generated: GRN-YYYY-NNNNN
  date: Date;
  status: 'RECEIVED' | 'INSPECTED' | 'POSTED' | 'CANCELLED';
  poId: string | null; // Linked PO (optional for ad-hoc GRN)
  vendorId: string | null;
  warehouseId: string | null;
  notes: string | null;
  receivedById: string;
  journalEntryId: string | null;
  lines: GoodsReceiptNoteLine[];
}

interface GoodsReceiptNoteLine {
  id: string;
  grnId: string;
  poLineId: string | null;
  productId: string | null;
  description: string;
  unit: string | null;
  qtyOrdered: number;
  qtyReceived: number;
  qtyRejected: number; // Rejected goods (reduces accepted qty)
  unitCost: number; // In Satang
  amount: number; // In Satang
}
```

**Critical Invariants**

- GRN is created with RECEIVED status (not DRAFT)
- Journal entry is created immediately on POST (not on INSPECTED)
- PO receivedQty is updated on INSPECTED transition (not on RECEIVED or POST)
- Cancellation requires INSPECTED status to be reversible
- Over-receive tolerance: max 105% of ordered quantity

**When Adding Features**

1. Update PO receivedQty calculation in `PUT /api/goods-receipt-notes/[id]`
2. Handle three-way match validation against PO lines
3. Update journal entry logic if accounts change (1140 = Inventory, 2160 =
   GR/IR)
4. Add E2E test in `e2e/goods-receipt-notes.spec.ts`

### Common Patterns

**GRN Creation with PO**

```typescript
// Step 1: Validate PO status
const po = await tx.purchaseOrder.findUnique({
  where: { id: poId },
  include: { lines: true },
});
if (!['CONFIRMED', 'SHIPPED'].includes(po.status)) {
  throw new Error('PO must be CONFIRMED or SHIPPED');
}

// Step 2: Create GRN with lines
const grn = await tx.goodsReceiptNote.create({
  data: {
    grnNo,
    status: 'RECEIVED',
    poId,
    vendorId,
    lines: {
      create: lines.map((line) => ({
        poLineId: line.poLineId,
        qtyReceived: line.qtyReceived,
        // ...
      })),
    },
  },
});

// Step 3: Create journal entry
await tx.journalEntry.create({
  data: {
    entryNo,
    documentType: 'GOODS_RECEIPT_NOTE',
    documentId: grn.id,
    lines: {
      create: [
        { accountId: inventoryAccount.id, debit: total, credit: 0 },
        { accountId: grirAccount.id, debit: 0, credit: total },
      ],
    },
  },
});
```

**PO Received Qty Update (on INSPECTED)**

```typescript
for (const grnLine of grnLines) {
  const acceptedQty = grnLine.qtyReceived - grnLine.qtyRejected;
  await tx.purchaseOrderLine.update({
    where: { id: grnLine.poLineId },
    data: {
      receivedQty: grnLine.poLine.receivedQty + acceptedQty,
    },
  });
}
```

**GRN Cancellation with Reversal**

```typescript
// Create reversal (swap debit/credit)
await tx.journalEntry.create({
  data: {
    reference: grnNo,
    reversingId: originalJournalEntryId,
    lines: {
      create: originalLines.map((line) => ({
        accountId: line.accountId,
        debit: line.credit, // Swapped
        credit: line.debit, // Swapped
      })),
    },
  },
});
```

## Dependencies

### Internal

- `@/lib/currency` - Satang conversion
- `@/lib/api-utils` - `requireAuth()`, `generateDocNumber()`
- `@/components/ui/*` - Dialog, Form, Table, Card, Badge
- `/api/goods-receipt-notes` - GRN CRUD
- `/api/purchase-orders` - PO lookup and status validation
- `/api/document-numbers` - GRN number generation
- `prisma/goodsReceiptNote` - Database model

### External

- `react-hook-form` v7 - Form handling
- `zod` v4 - Schema validation
- `@tanstack/react-query` v5 - Data fetching
- `date-fns` v4 - Date formatting
- `lucide-react` - Icons

## Related Modules

- **Purchase Orders**: GRN is created against POs; PO receivedQty updated on
  INSPECTED
- **Purchase Invoices**: Created from GRN (three-way match: PO -> GRN ->
  Invoice)
- **Inventory**: GRN increases inventory stock (via journal entry posting)
- **Warehouses**: GRN can specify which warehouse receives goods
- **Journal Entries**: GRN auto-creates journal entries (DR Inventory, CR GR/IR)
