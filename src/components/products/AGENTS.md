<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-04-17 -->

# Product Catalog Management

## Purpose
Product and service catalog — product CRUD, categories, units, pricing (cost/sale), VAT rates, inventory tracking settings, and costing methods.

## Key Files
| File | Description |
|------|-------------|
| `product-form.tsx` | Product creation/editing with full schema |
| `product-list.tsx` | Product list with search, category filtering |
| `product-list-virtual.tsx` | Virtualized list for large catalogs |
| `product-view-dialog.tsx` | Product detail view |
| `product-edit-dialog.tsx` | Quick edit dialog |
| `products-page.tsx` | Main products page routing |

## For AI Agents

### Working In This Directory

**Product Data Model**
```typescript
interface Product {
  id: string
  code: string
  name: string
  nameEn?: string
  description?: string
  category?: string
  unit: string              // Unit of measure (ชิ้น, กล่อง, etc.)
  type: 'PRODUCT' | 'SERVICE'
  salePrice: number         // In Satang
  costPrice: number         // In Satang
  vatRate: number           // 0 or 7
  vatType: 'EXCLUSIVE' | 'INCLUSIVE' | 'NONE'
  isInventory: boolean      // Track stock?
  quantity?: number         // Current stock (if isInventory)
  minQuantity?: number      // Reorder point
  incomeType?: string      // For revenue recognition
  costingMethod: 'WEIGHTED_AVERAGE' | 'FIFO'
  isActive: boolean
  notes?: string
}
```

**Critical Invariants**
- Product code must be unique
- Sale price ≥ 0 (in Satang)
- Cost price ≥ 0 (in Satang)
- VAT type determines if price includes VAT
- Inventory products track stock movements
- Service products do not track inventory

**Common Patterns**
```typescript
// VAT calculation based on type
const calculateVat = (price: number, vatRate: number, vatType: VatType) => {
  if (vatType === 'INCLUSIVE') {
    return price - (price / (1 + vatRate))
  } else if (vatType === 'EXCLUSIVE') {
    return price * vatRate
  }
  return 0 // NONE
}

// Costing method selection
const costingMethodOptions = [
  { value: 'WEIGHTED_AVERAGE', label: 'Weighted Average Cost' },
  { value: 'FIFO', label: 'First In First Out' }
]
```

**When Adding Features**
1. Add product to invoice/purchase line items
2. Update inventory tracking on stock movements
3. Calculate weighted average cost on purchase
4. Update API route `/api/products/route.ts`
5. Add E2E test in `e2e/products.spec.ts`

## Dependencies

### Internal
- `@/lib/currency` - Satang conversion
- `@/components/ui/*` - Dialog, Form, Table, Select
- `/api/products` - Product CRUD
- `prisma/product` - Database model

### External
- `react-hook-form` v7 - Form handling
- `@tanstack/react-query` v5 - Data fetching
- `lucide-react` - Icons
