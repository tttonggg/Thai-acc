<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-04-16 -->

# Fixed Assets Management

## Purpose

Fixed asset lifecycle management — asset registration, depreciation calculation
(straight-line, declining balance), disposal, and GL posting for depreciation
expense.

## Key Files

| File                               | Description                                        |
| ---------------------------------- | -------------------------------------------------- |
| `assets-page.tsx`                  | Main assets page with list, depreciation, disposal |
| `asset-edit-dialog.tsx`            | Asset CRUD with depreciation settings              |
| `depreciation-schedule-viewer.tsx` | View depreciation schedule by asset                |

## For AI Agents

### Working In This Directory

**Fixed Asset Features**

- Asset registration (purchase date, cost, useful life, residual value)
- Depreciation methods: Straight-line, Declining balance (150%, 200%)
- Monthly depreciation posting to GL
- Asset disposal (sale, scrap, loss)
- Asset categories and depreciation rates

**Critical Invariants**

- Asset cost = purchase price + delivery + installation costs (in Satang)
- Depreciable amount = cost - residual value
- Straight-line: annual depreciation = depreciable amount / useful life
- Declining balance: depreciation = book value × rate (rate = 1/useful life ×
  multiplier)
- Accumulated depreciation tracks total depreciation to date
- Net book value = cost - accumulated depreciation
- Disposed assets cannot be depreciated further

**When Adding Features**

1. Update depreciation calculation formulas
2. Apply Satang conversion to all monetary fields
3. Update API routes in `/api/assets/`
4. Handle disposal workflows
5. Add E2E test in `e2e/assets.spec.ts`

### Common Patterns

**Fixed Asset Schema**

```typescript
interface FixedAsset {
  id: string;
  code: string; // AST-XXXX
  name: string;
  categoryId: string; // Building, Machinery, Vehicle, Equipment, Computer
  serialNumber?: string;
  purchaseDate: Date;
  purchasePrice: number; // In Satang
  deliveryCost: number; // In Satang
  installationCost: number; // In Satang
  totalCost: number; // Sum of above (Satang)

  // Depreciation
  method: DepreciationMethod;
  usefulLife: number; // In years
  residualValue: number; // In Satang
  depreciationStartDate: Date;

  // Status
  status: AssetStatus;
  disposedDate?: Date;
  disposalPrice?: number; // In Satang
  disposalType?: 'SALE' | 'SCRAP' | 'LOSS';

  // GL posting
  accountId: string; // Asset GL account
  accumulatedDepreciationAccountId: string;
  depreciationExpenseAccountId: string;

  // Tracking
  accumulatedDepreciation: number; // Total to date (Satang)
  netBookValue: number; // cost - accumulatedDepreciation
}

enum DepreciationMethod {
  STRAIGHT_LINE = 'STRAIGHT_LINE',
  DECLINING_BALANCE_150 = 'DECLINING_BALANCE_150',
  DECLINING_BALANCE_200 = 'DECLINING_BALANCE_200',
}

enum AssetStatus {
  ACTIVE = 'ACTIVE',
  DISPOSED = 'DISPOSED',
  FULLY_DEPRECIATED = 'FULLY_DEPRECIATED',
}
```

**Straight-Line Depreciation**

```typescript
const calculateStraightLineDepreciation = (
  totalCost: number,
  residualValue: number,
  usefulLife: number // In years
): { annualDepreciation: number; monthlyDepreciation: number } => {
  const depreciableAmount = totalCost - residualValue;
  const annualDepreciation = depreciableAmount / usefulLife;
  const monthlyDepreciation = annualDepreciation / 12;

  return { annualDepreciation, monthlyDepreciation };
};

// Example: Vehicle costing 1,000,000 THB, 100,000 THB residual, 5 years
// totalCost = 100,000,000 Satang
// residualValue = 10,000,000 Satang
// depreciableAmount = 90,000,000 Satang
// annualDepreciation = 18,000,000 Satang (180,000 THB/year)
// monthlyDepreciation = 1,500,000 Satang (15,000 THB/month)
```

**Declining Balance Depreciation**

```typescript
const calculateDecliningBalanceDepreciation = (
  bookValue: number, // Current net book value
  usefulLife: number,
  multiplier: 1.5 | 2.0 // 150% or 200%
): number => {
  const rate = (1 / usefulLife) * multiplier;
  return bookValue * rate;
};

// Example: Equipment costing 500,000 THB, 5 years, 200% declining balance
// Year 1: bookValue = 500,000, depreciation = 500,000 × (1/5 × 2) = 200,000
// Year 2: bookValue = 300,000, depreciation = 300,000 × 0.4 = 120,000
// Year 3: bookValue = 180,000, depreciation = 180,000 × 0.4 = 72,000
// Year 4: bookValue = 108,000, depreciation = 108,000 × 0.4 = 43,200
// Year 5: bookValue = 64,800, depreciation = 64,800 × 0.4 = 25,920
```

**Monthly Depreciation Posting**

```typescript
// Run monthly to post depreciation for all active assets
const postMonthlyDepreciation = async (month: Date) => {
  const assets = await prisma.fixedAsset.findMany({
    where: {
      status: 'ACTIVE',
      depreciationStartDate: { lte: month },
    },
  });

  for (const asset of assets) {
    const { monthlyDepreciation } = calculateDepreciation(asset);

    // Create journal entry:
    // Debit: Depreciation Expense
    // Credit: Accumulated Depreciation
    await prisma.journalEntry.create({
      data: {
        date: month,
        description: `ค่าเสื่อมราคา ${asset.name}`,
        lines: {
          create: [
            {
              accountId: asset.depreciationExpenseAccountId,
              debit: monthlyDepreciation,
              credit: 0,
            },
            {
              accountId: asset.accumulatedDepreciationAccountId,
              debit: 0,
              credit: monthlyDepreciation,
            },
          ],
        },
      },
    });

    // Update asset
    await prisma.fixedAsset.update({
      where: { id: asset.id },
      data: {
        accumulatedDepreciation: { increment: monthlyDepreciation },
        netBookValue: { decrement: monthlyDepreciation },
      },
    });
  }
};
```

**Asset Disposal**

```typescript
interface Disposal {
  assetId: string;
  disposalDate: Date;
  disposalType: 'SALE' | 'SCRAP' | 'LOSS';
  disposalPrice: number; // In Satang (0 for scrap/loss)
}

const disposeAsset = async (disposal: Disposal) => {
  await prisma.$transaction(async (tx) => {
    const asset = await tx.fixedAsset.findUnique({
      where: { id: disposal.assetId },
    });

    // Calculate gain/loss on disposal
    const gainLoss = disposal.disposalPrice - asset.netBookValue;

    // Create journal entry:
    // Debit: Cash/Bank (if sold) or 0 (if scrap/loss)
    // Debit: Accumulated Depreciation (reverse)
    // Credit: Fixed Asset (reverse cost)
    // Credit/Loss: Gain/Loss on Disposal
    await tx.journalEntry.create({
      data: {
        date: disposal.disposalDate,
        description: `จำหน่าย ${asset.name}`,
        lines: {
          create: [
            ...(disposal.disposalType === 'SALE'
              ? [
                  {
                    accountId: bankAccountId,
                    debit: disposal.disposalPrice,
                    credit: 0,
                  },
                ]
              : []),
            {
              accountId: asset.accumulatedDepreciationAccountId,
              debit: asset.accumulatedDepreciation,
              credit: 0,
            },
            {
              accountId: asset.accountId,
              debit: 0,
              credit: asset.totalCost,
            },
            ...(gainLoss !== 0
              ? [
                  {
                    accountId:
                      gainLoss > 0
                        ? gainOnDisposalAccount
                        : lossOnDisposalAccount,
                    debit: gainLoss > 0 ? 0 : Math.abs(gainLoss),
                    credit: gainLoss > 0 ? gainLoss : 0,
                  },
                ]
              : []),
          ],
        },
      },
    });

    // Update asset status
    await tx.fixedAsset.update({
      where: { id: disposal.assetId },
      data: {
        status: 'DISPOSED',
        disposalDate: disposal.disposalDate,
        disposalPrice: disposal.disposalPrice,
        disposalType: disposal.disposalType,
      },
    });
  });
};
```

**Depreciation Schedule**

```typescript
interface DepreciationSchedule {
  year: number;
  beginningBookValue: number;
  depreciationExpense: number;
  accumulatedDepreciation: number;
  endingBookValue: number;
}

const generateDepreciationSchedule = (
  asset: FixedAsset
): DepreciationSchedule[] => {
  const schedule: DepreciationSchedule[] = [];
  let bookValue = asset.totalCost;
  let accumulatedDepreciation = 0;

  for (let year = 1; year <= asset.usefulLife; year++) {
    const depreciation = calculateYearlyDepreciation(asset, bookValue);
    accumulatedDepreciation += depreciation;
    bookValue -= depreciation;

    schedule.push({
      year,
      beginningBookValue: bookValue + depreciation,
      depreciationExpense: depreciation,
      accumulatedDepreciation,
      endingBookValue: bookValue,
    });
  }

  return schedule;
};
```

**Asset Categories**

```typescript
interface AssetCategory {
  id: string;
  code: string;
  name: string;
  usefulLife: number; // Default useful life (years)
  depreciationMethod: DepreciationMethod;
  defaultRate: number; // For declining balance
}

// Thai Revenue Department recommended useful lives:
const ASSET_CATEGORIES = [
  {
    code: 'BLDG',
    name: 'อาคารสถานที่',
    usefulLife: 40,
    method: 'STRAIGHT_LINE',
  },
  {
    code: 'MACH',
    name: 'เครื่องจักร',
    usefulLife: 10,
    method: 'DECLINING_BALANCE_200',
  },
  {
    code: 'VEHI',
    name: 'ยานพาหนะ',
    usefulLife: 5,
    method: 'DECLINING_BALANCE_150',
  },
  {
    code: 'EQUIP',
    name: 'อุปกรณ์',
    usefulLife: 5,
    method: 'DECLINING_BALANCE_150',
  },
  {
    code: 'COMP',
    name: 'คอมพิวเตอร์',
    usefulLife: 4,
    method: 'DECLINING_BALANCE_200',
  },
];
```

## Dependencies

### Internal

- `@/lib/currency` - Satang/Baht conversion
- `@/lib/api-utils` - `requireAuth()`, `generateDocNumber()`
- `@/components/ui/*` - Dialog, Form, Table components
- `/api/assets/*` - Asset CRUD, depreciation, disposal
- `prisma/fixedAsset` - Asset tracking
- `prisma/depreciationSchedule` - Depreciation history

### External

- `react-hook-form` v7 - Form handling
- `zod` v4 - Schema validation
- `@tanstack/react-query` v5 - Data fetching
- `date-fns` v4 - Date formatting
- `lucide-react` - Icons
