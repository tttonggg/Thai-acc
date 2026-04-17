<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-16 -->

# src/components

## Purpose
Complete React UI layer organization for the Thai Accounting ERP system. This directory contains all UI components organized by feature modules, shared utilities, and layout components.

## Key Files
| File | Description |
|------|-------------|
| `index.ts` | Main barrel export file for shared components and utilities |
| `api-error-boundary.tsx` | Error boundary wrapper for API call failures |
| `async-error-boundary.tsx` | Suspense-compatible error boundary for async operations |
| `error-boundary.tsx` | General-purpose error boundary component |
| `loading-error-boundary.tsx` | Error boundary specifically for loading states |
| `pdf-export-button.tsx` | Specialized button for PDF export functionality |
| `providers.tsx` | React providers for global component dependencies |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `accounting-excellence/` | Advanced accounting features and tools |
| `accounting-periods/` | Accounting period management components |
| `accounts/` | Chart of accounts management (GL accounts) |
| `activity-feed/` | Real-time activity tracking and notifications |
| `admin/` | Administrative panel components |
| `ap/` | Accounts Payable (vendor management) |
| `ar/` | Accounts Receivable (customer management) |
| `assets/` | Fixed assets management |
| `auth/` | Authentication and user management UI |
| `banking/` | Bank account management and cheque operations |
| `budgets/` | Budget planning and tracking components |
| `bulk-operations/` | Bulk actions and selection utilities |
| `credit-notes/` | Credit note management for refunds |
| `currencies/` | Multi-currency support components |
| `dashboard/` | Main dashboard widgets and layouts |
| `debit-notes/` | Debit note management for additional charges |
| `entities/` | Common entity components (customers, vendors, etc.) |
| `examples/` | Example components and demonstrations |
| `filters/` | Advanced filtering and search components |
| `goods-receipt-notes/` | Goods receipt and inventory receiving |
| `help-center/` | Help documentation and support components |
| `inventory/` | Stock management and inventory tracking |
| `invoices/` | Sales invoice management (HOT PATH) |
| `journal/` | Journal entry management and editing |
| `keyboard-shortcuts/` | Keyboard navigation and shortcuts |
| `layout/` | Layout components (sidebar, header, navigation) |
| `mobile/` | Mobile-optimized components |
| `notifications/` | Notification center and alerts |
| `offline-sync/` | Offline sync capabilities |
| `payments/` | Payment processing and management |
| `petty-cash/` | Petty cash voucher management |
| `personalization/` | User preferences and customization |
| `products/` | Product catalog management |
| `purchase-orders/` | Purchase order management |
| `purchase-requests/` | Purchase request workflow |
| `purchases/` | Purchase invoice management |
| `pwa/` | Progressive Web App features |
| `quotation/` | Quote management and creation |
| `receipts/` | Receipt management (HOT PATH) |
| `reports/` | Financial reports and analytics |
| `settings/` | System settings configuration |
| `stock-takes/` | Stock taking and inventory counts |
| `tax-forms/` | Tax form handling and submission |
| `ui/` | shadcn/ui base components (DO NOT MODIFY) |
| `vat/` | Value Added Tax reporting |
| `virtual-scroll/` | Virtual scrolling for large datasets |
| `websocket/` | Real-time communication components |
| `wht/` | Withholding tax management |

## For AI Agents

### Component Organization Principles
- **Feature-based**: Components organized by business domain (e.g., `invoices/`, `payments/`)
- **Reusable**: Common components in `ui/` directory using shadcn/ui
- **Barrel Exports**: Each module has `index.ts` for clean imports
- **TypeScript**: Strict typing throughout with proper interfaces

### When to Use ui/ vs Feature Components
- **Use `ui/` components** for:
  - Standard form elements (input, button, select)
  - Layout primitives (card, table, dialog)
  - Reusable UI patterns (toast, alert, confirmation)
  - Base components that don't contain business logic

- **Use feature components** for:
  - Domain-specific functionality (invoice list, payment form)
  - Complex business logic integration
  - Multi-step workflows (invoice creation wizard)
  - Composite components with multiple related features

### Styling Conventions
- **shadcn/ui**: Base components from New York design system
- **Tailwind CSS**: Utility-first styling with custom variants
- **Thai Language**: Default labels in Thai with English fallbacks
- **Lucide Icons**: Consistent icon system throughout
- **Radix Primitives**: Accessibility-first underlying components

## Common Patterns

### Functional Components
```tsx
'use client' // For components using hooks or state
import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function MyComponent({ id }: { id: string }) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      // API call or business logic
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleClick} disabled={loading}>
      {loading ? 'Processing...' : 'Action'}
    </Button>
  )
}
```

### TypeScript Interfaces
```typescript
export interface InvoiceFormData {
  customerId: string
  items: InvoiceLineItem[]
  taxRate: number
  discount?: number
  notes?: string
}

export interface InvoiceLineItem {
  productId: string
  quantity: number
  unitPrice: number // in Satang
  totalAmount: number // in Satang
}
```

### TanStack Query Integration
```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getInvoices, createInvoice } from '@/lib/api/invoice'

export function InvoiceList() {
  const queryClient = useQueryClient()
  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: getInvoices,
  })

  const mutation = useMutation({
    mutationFn: createInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
  })

  return (
    <div>
      {isLoading ? <LoadingSpinner /> : (
        invoices?.map(invoice => (
          <InvoiceCard key={invoice.id} invoice={invoice} />
        ))
      )}
    </div>
  )
}
```

### Error Boundaries
```tsx
import { ErrorBoundary } from '@/components/error-boundary'

function InvoicePage() {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <InvoiceList />
    </ErrorBoundary>
  )
}
```

## Dependencies

### Core Framework
- **React 19**: Latest React with concurrent features
- **TypeScript 5**: Strong typing and modern features
- **Next.js 16**: App Router framework

### UI & Styling
- **shadcn/ui**: Component library built on Radix UI
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Headless UI primitives for accessibility
- **Lucide React**: Icon library
- **@radix-ui/react-***: Accessibility components

### State & Data
- **TanStack Query v5**: Data fetching and caching
- **Zustand v5**: Global state management
- **React Hook Form**: Form handling
- **Zod v4**: Schema validation

### Platform Features
- **WebSocket**: Real-time updates
- **PWA**: Offline capabilities and install prompts
- **Service Workers**: Background sync and caching

## Development Guidelines

### Component Structure
```
components/invoices/
├── index.ts                    # Barrel exports
├── invoice-list.tsx           # List view
├── invoice-list-virtual.tsx   # Virtualized list
├── invoice-form.tsx           # Create/edit form
├── invoice-detail-page.tsx    # Detail view
├── invoice-edit-dialog.tsx    # Edit dialog
└── line-item-editor.tsx       # Line item editor
```

### Import Patterns
```tsx
// From ui components (base primitives)
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

// From feature modules
import { InvoiceList } from '@/components/invoices'
import { PaymentForm } from '@/components/payments'

// From shared utilities
import { useDeleteConfirm } from '@/hooks/use-delete-confirm'
import { formatCurrency } from '@/lib/currency'
```

### Best Practices
1. **Barrel exports**: Always export from `index.ts` for clean imports
2. **Type safety**: Use TypeScript interfaces for props and state
3. **Error handling**: Use appropriate error boundaries
4. **Loading states**: Show loading indicators during async operations
5. **Accessibility**: Follow WCAG guidelines with ARIA attributes
6. **Responsive design**: Mobile-first approach with breakpoints
7. **Performance**: Use React.memo, useMemo, and useCallback where needed
8. **Testing**: Include unit tests for complex components

### Currency Handling
All monetary values follow the Satang convention:
- **Storage**: Integers in database (฿1,234.56 → 123456)
- **Display**: Convert to Baht for user interface
- **Input**: Accept both formatted and numeric input

```tsx
import { satangToBaht } from '@/lib/currency'

function DisplayAmount({ amountInSatang }: { amountInSatang: number }) {
  return <span>฿{satangToBaht(amountInSatang)}</span>
}
```