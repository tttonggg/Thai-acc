<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-04-17 -->

# VAT Reporting

## Purpose

Value Added Tax (VAT) reporting for Thai Revenue Department compliance - PP30,
PP36 forms and VAT return calculations.

## Key Files

| File             | Description                                  |
| ---------------- | -------------------------------------------- |
| `vat-report.tsx` | VAT reporting with PP30/PP36 form generation |

## For AI Agents

### Working In This Directory

**Thai VAT Compliance**

- VAT rate: 7% (standard)
- PP30 form: Monthly VAT submission
- PP36 form: Quarterly VAT return
- Filing deadline: 15th of following month (PP30), end of following month (PP36)

**Critical Calculations**

- Output VAT: Collected from customers on sales
- Input VAT: Paid to suppliers on purchases
- VAT payable = Output VAT - Input VAT
- Rounding to 2 decimal satang

### VAT Calculation Pattern

```typescript
// Calculate VAT from gross amount
const vatAmount = (grossAmount / 107) * 7; // Extract VAT from inclusive

// Calculate gross from net
const grossAmount = netAmount * 1.07; // Add VAT to exclusive
```

### Common Invariants

- VAT returns must be filed on time (penalty for late filing)
- Sales invoices with VAT must have proper PP30 format
- Purchase VAT credits require valid tax invoice
- Zero-rated and exempt supplies reported separately

## Dependencies

### Internal

- @/lib/thai-accounting - Thai date and tax functions
- @/lib/currency - Satang/Baht conversion
- @/components/invoices - Invoice data for VAT calculation
- @/components/ui/\* - Form and table components

### External

- date-fns v4 - Date formatting
- react-hook-form v7 - Form handling
- lucide-react - Icons
