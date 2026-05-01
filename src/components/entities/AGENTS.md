<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-04-17 -->

# Entity Management

## Purpose

Common entity management components for customers, vendors, and other business
partners.

## Key Files

| File                    | Description                                      |
| ----------------------- | ------------------------------------------------ |
| `entity-management.tsx` | Unified interface for managing business entities |

## For AI Agents

### Entity Types

- **Customers (AR)**: Accounts receivable parties
- **Vendors (AP)**: Accounts payable parties
- **Partners**: Other business relationships

### Common Entity Fields

```typescript
interface Entity {
  id: string;
  code: string; // Entity code
  name: string; // Business name
  taxId?: string; // Thai Tax ID (13 digits)
  email?: string;
  phone?: string;
  address?: string;
  creditLimit?: number; // In Satang
  paymentTerms?: number; // Days
  active: boolean;
  deletedAt?: DateTime; // Soft delete
}
```

### Entity-Specific Modules

- `src/components/ar/` - Customer management
- `src/components/ap/` - Vendor management

## Dependencies

### Internal

- @/lib/api-utils - Entity API endpoints
- @/components/ui/\* - Dialog, Table, Form components
- @/components/entities - Common entity components

### External

- react-hook-form v7 - Form handling
- zod v4 - Schema validation
- @tanstack/react-query v5 - Data fetching
