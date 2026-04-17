<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-04-17 -->

# Multi-Currency Support

## Purpose
Currency management and exchange rate handling for multi-currency transactions.

## Key Files
| File | Description |
|------|-------------|
| `currency-management.tsx` | Currency configuration and exchange rate management |

## For AI Agents

### Multi-Currency Features
- Define multiple currencies (THB, USD, EUR, etc.)
- Set daily exchange rates
- Convert between currencies for transactions
- Generate reports in base currency or original currency

### Exchange Rate Management
```typescript
interface ExchangeRate {
  currencyId: string
  date: Date
  rate: number  // Units of base currency per 1 foreign currency
  source: string  // Bank or source of rate
}
```

### Currency Conversion Pattern
```typescript
// Convert foreign currency to base (THB)
const amountInBase = foreignAmount * exchangeRate

// Convert base to foreign currency
const foreignAmount = amountInBase / exchangeRate
```

## Dependencies

### Internal
- @/lib/currency - Currency utilities
- @/lib/api-utils - API endpoints for currency data
- @/components/ui/* - Dialog, Table, Form components

### External
- react-hook-form v7 - Form handling
- @tanstack/react-query v5 - Data fetching
- lucide-react - Icons