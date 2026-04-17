<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-04-17 -->

# Purchase Orders

## Purpose
Purchase order management - create, approve, receive goods against PO. Integrates with inventory and 3-way matching.

## Key Files
| File | Description |
|------|-------------|
| `purchase-order-form.tsx` | PO creation/editing form |
| `purchase-order-list.tsx` | PO list with filtering and status |
| `purchase-order-edit-dialog.tsx` | Quick edit dialog |
| `purchase-order-view-dialog.tsx` | PO detail view |
| `index.ts` | Component exports |

## For AI Agents

### Working In This Directory

**Purchase Order Workflow**
```
DRAFT → APPROVED → RECEIVED → PARTIALLY_INVOICED → COMPLETED
                ↓
            CANCELLED
```

**Critical Invariants**
- PO creates GRN (Goods Receipt Note) when items received
- 3-way matching: PO vs GRN vs Purchase Invoice
- PO amounts in Satang
- Vendor pricing affects purchase costs

### 3-Way Matching Pattern
```typescript
// Match PO line with GRN quantity and Invoice amount
const match = {
  poLine: poLine.quantity,
  grnReceived: grnLine.receivedQty,
  invoiceAmount: invoiceLine.amount,
  variance: calculateVariance(poLine, grnLine, invoiceLine)
}
```

## Dependencies

### Internal
- @/lib/currency - Satang/Baht conversion
- @/lib/api-utils - PO API endpoints
- @/components/purchases - Purchase invoice matching
- @/components/inventory - GRN creation

### External
- react-hook-form v7 - Form handling
- @tanstack/react-query v5 - Data fetching
- lucide-react - Icons