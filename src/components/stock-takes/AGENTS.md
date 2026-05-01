<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-04-17 -->

# Stock Takes

## Purpose

Physical inventory counting and variance analysis. Creates adjustment journal
entries for discrepancies.

## Key Files

| File                  | Description                                |
| --------------------- | ------------------------------------------ |
| `stock-take-page.tsx` | Stock take management with counting sheets |

## For AI Agents

### Stock Take Process

1. Create stock take with date and warehouse
2. Generate counting sheets
3. Staff count physical inventory
4. Enter counted quantities
5. System calculates variance
6. Manager approves adjustments
7. Adjustment journal entry created

### Stock Adjustment Pattern

```typescript
// Calculate variance and create adjustment
const variance = countedQty - systemQty;
const adjustmentValue = variance * unitCost; // In Satang

if (variance !== 0) {
  await createAdjustmentJournalEntry({
    warehouseId,
    varianceAccountId,
    debit: variance > 0 ? adjustmentValue : 0,
    credit: variance < 0 ? Math.abs(adjustmentValue) : 0,
  });
}
```

### Critical Invariants

- System quantities locked after stock take starts
- Variance threshold for investigation (e.g., >5% or >10,000 Baht)
- All adjustments require manager approval
- Stock take must be completed before new transactions in warehouse

## Dependencies

### Internal

- @/lib/currency - Satang/Baht conversion
- @/lib/stock-take-service - Stock take logic
- @/components/inventory - Warehouse and product lookup
- @/components/journal - Adjustment journal entries

### External

- react-hook-form v7 - Form handling
- @tanstack/react-query v5 - Data fetching
- lucide-react - Icons
