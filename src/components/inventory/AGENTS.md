<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-04-16 -->

# Inventory Management

## Purpose

Stock management — multi-warehouse inventory tracking, stock movements
(IN/OUT/TRANSFER), stock takes (physical counts), adjustments, and unit cost
calculation. TAS 2 compliant for Thai revenue department.

## Key Files

| File                                 | Description                                  |
| ------------------------------------ | -------------------------------------------- | --------- | ---------- | --------- |
| `inventory-page.tsx`                 | Main inventory page with tabs: Stock Balance | Movements | Warehouses | Transfers |
| `stock-take-page.tsx`                | Stock take (physical count) management       |
| `stock-adjustment-dialog.tsx`        | Stock adjustment form (gain/loss)            |
| `stock-transfer-complete-dialog.tsx` | Complete stock transfer between warehouses   |
| `stock-take-create-dialog.tsx`       | Create new stock take session                |
| `stock-take-view-dialog.tsx`         | View stock take results and variances        |
| `stock-movement-edit-dialog.tsx`     | Edit stock movement details                  |
| `warehouse-edit-dialog.tsx`          | Warehouse CRUD operations                    |

## For AI Agents

### Working In This Directory

**TAS 2 Compliance Requirements**

- Maintain perpetual inventory system
- Track all movements (IN, OUT, TRANSFER, ADJUSTMENT)
- Stock takes must reconcile with book quantities
- Calculate variances (book vs physical count)
- Maintain unit cost using weighted average (WAC)
- Support multiple warehouses

**Critical Invariants**

- Stock balance = Σ(IN) - Σ(OUT) - Σ(OUTBOUND TRANSFERS) + Σ(INBOUND TRANSFERS)
- Unit cost = Total cost / Quantity (weighted average)
- Cannot have negative stock balance (unless configured)
- Stock take variance = Physical count - Book quantity
- Adjustment requires reason code (damage, loss, expiration, etc.)
- Transfer items move between warehouses (not created/destroyed)

**When Adding Features**

1. Update stock movement tracking
2. Calculate unit cost changes (WAC method)
3. Update API routes in `/api/inventory/`
4. Handle multi-warehouse logic
5. Add E2E test in `e2e/inventory.spec.ts`

### Common Patterns

**Stock Movement Types**

```typescript
enum MovementType {
  IN = 'IN', // Purchase, production
  OUT = 'OUT', // Sale, consumption
  TRANSFER_OUT = 'TRANSFER_OUT', // To another warehouse
  TRANSFER_IN = 'TRANSFER_IN', // From another warehouse
  ADJUSTMENT = 'ADJUSTMENT', // Stock gain/loss
}

interface StockMovement {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number; // Positive for IN, negative for OUT
  unitCost: number; // In Satang
  movementType: MovementType;
  referenceType?: string; // 'PURCHASE', 'SALE', 'TRANSFER', 'ADJUSTMENT'
  referenceId?: string;
  notes?: string;
}
```

**Weighted Average Cost (WAC) Calculation**

```typescript
const calculateUnitCost = async (productId: string, warehouseId: string) => {
  // Get all IN movements (purchases, transfers in, positive adjustments)
  const movements = await prisma.stockMovement.findMany({
    where: {
      productId,
      warehouseId,
      quantity: { gt: 0 },
    },
  });

  const totalCost = movements.reduce(
    (sum, m) => sum + m.unitCost * m.quantity,
    0
  );
  const totalQuantity = movements.reduce((sum, m) => sum + m.quantity, 0);

  return totalQuantity > 0 ? totalCost / totalQuantity : 0;
};
```

**Stock Balance Calculation**

```typescript
const getStockBalance = async (productId: string, warehouseId: string) => {
  const movements = await prisma.stockMovement.findMany({
    where: { productId, warehouseId },
  });

  // Σ(positive quantities) - Σ(negative quantities)
  const balance = movements.reduce((sum, m) => sum + m.quantity, 0);

  return balance;
};
```

**Stock Take Variance**

```typescript
const calculateVariance = (physicalCount: number, bookQuantity: number) => {
  const variance = physicalCount - bookQuantity;

  return {
    quantity: variance,
    value: variance * unitCost, // In Satang
    percentage: bookQuantity > 0 ? (variance / bookQuantity) * 100 : 0,
  };
};

// Variance > 0: Gain (extra stock)
// Variance < 0: Loss (missing stock)
```

**Stock Transfer Flow**

```typescript
// Step 1: Create outbound movement (from warehouse)
await prisma.stockMovement.create({
  data: {
    productId,
    warehouseId: fromWarehouseId,
    quantity: -quantity, // Negative
    movementType: 'TRANSFER_OUT',
    referenceId: transferId,
  },
});

// Step 2: Create inbound movement (to warehouse)
await prisma.stockMovement.create({
  data: {
    productId,
    warehouseId: toWarehouseId,
    quantity: quantity, // Positive
    movementType: 'TRANSFER_IN',
    referenceId: transferId,
  },
});
```

**Adjustment with Reason Code**

```typescript
const adjustmentSchema = z.object({
  productId: z.string(),
  warehouseId: z.string(),
  quantity: z.number(),
  reasonCode: z.enum([
    'DAMAGED', // ชำรุดเสียหาย
    'EXPIRED', // หมดอายุ
    'LOST', // สูญหาย
    'FOUND', // พบเพิ่ม
    'COUNT_ERROR', // นับผิด
  ]),
  notes: z.string().optional(),
});
```

**Multi-Warehouse Stock Query**

```typescript
// Get stock across all warehouses
const stockBalances = await prisma.stockBalance.groupBy({
  by: ['productId', 'warehouseId'],
  where: {
    quantity: { gt: 0 }, // Only in-stock items
  },
  having: {
    quantity: { _sum: { gt: 0 } },
  },
});
```

## Dependencies

### Internal

- `@/lib/currency` - Satang conversion for unit costs
- `@/lib/api-utils` - `requireAuth()`
- `@/components/ui/*` - Dialog, Form, Table components
- `/api/inventory/*` - Stock movements, balances, stock takes
- `prisma/stockMovement` - Movement tracking
- `prisma/stockBalance` - Current balances

### External

- `react-hook-form` v7 - Form handling
- `zod` v4 - Schema validation
- `@tanstack/react-query` v5 - Data fetching
- `date-fns` v4 - Date formatting
- `lucide-react` - Icons
