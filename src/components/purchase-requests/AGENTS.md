<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-04-17 -->

# Purchase Requests

## Purpose

Purchase request workflow - employees request purchases, managers approve,
converts to PO.

## Key Files

| File                        | Description                    |
| --------------------------- | ------------------------------ |
| `purchase-request-form.tsx` | PR creation with item details  |
| `purchase-request-list.tsx` | PR list with approval workflow |

## For AI Agents

### Purchase Request Workflow

```
DRAFT → PENDING_APPROVAL → APPROVED → CONVERTED_TO_PO
                        ↓
                    REJECTED
```

**Key Features**

- Employee submits PR with justification
- Manager reviews and approves/rejects
- Approved PR converts to Purchase Order
- Budget validation before approval

### PR Fields

```typescript
interface PurchaseRequest {
  id: string;
  requesterId: string;
  date: Date;
  items: PRItem[];
  totalAmount: number; // In Satang
  status: PRStatus;
  reason: string;
  department: string;
  budgetCode?: string;
  approvedBy?: string;
  approvedAt?: Date;
}
```

## Dependencies

### Internal

- @/lib/currency - Satang/Baht conversion
- @/lib/api-utils - PR API endpoints
- @/components/purchase-orders - PO conversion
- @/stores/auth-store - Approval permissions

### External

- react-hook-form v7 - Form handling
- @tanstack/react-query v5 - Data fetching
- lucide-react - Icons
