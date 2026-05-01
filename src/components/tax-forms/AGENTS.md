<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-04-17 -->

# Tax Forms

## Purpose

Thai tax form generation and management - PND1, PND3, PND53, PP30, PP36 for
Revenue Department compliance.

## Key Files

| File                      | Description                              |
| ------------------------- | ---------------------------------------- |
| `tax-form-management.tsx` | Tax form generation and filing interface |

## For AI Agents

### Thai Tax Forms

| Form  | Purpose                        | Frequency |
| ----- | ------------------------------ | --------- |
| PND1  | Withholding tax (salary)       | Monthly   |
| PND3  | Withholding tax (contractor)   | Monthly   |
| PND53 | Withholding tax (professional) | Monthly   |
| PP30  | VAT monthly return             | Monthly   |
| PP36  | VAT quarterly return           | Quarterly |

### Tax Calculation

```typescript
// WHT Calculation (PND3 progressive rates)
const calculateWHT = (amount: number, rates: number[]) => {
  let remaining = amount;
  let tax = 0;
  for (const rate of rates) {
    const tierAmount = getCurrentTierAmount(remaining, rate);
    tax += tierAmount * rate;
    remaining -= tierAmount;
  }
  return tax;
};

// SSC Calculation (5% capped at 750/month)
const calculateSSC = (salary: number) => {
  return Math.min(salary * 0.05, 750);
};
```

### Filing Deadlines

- WHT (PND3/PND53): 7th of following month
- VAT (PP30): 15th of following month
- Late filing penalties apply

## Dependencies

### Internal

- @/lib/thai-accounting - Thai tax functions
- @/lib/wht-service - WHT calculations
- @/lib/payroll-service - SSC calculations
- @/lib/currency - Satang/Baht conversion

### External

- jsPDF - PDF generation for tax forms
- react-hook-form v7 - Form handling
- lucide-react - Icons
