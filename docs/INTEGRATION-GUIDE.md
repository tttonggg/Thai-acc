# Custom Report Builder - Integration Guide

## Quick Start

### 1. Add to Navigation

Update the sidebar menu in `src/app/page.tsx` to include the custom report
builder:

```typescript
{
  id: 'custom_reports',
  name: 'สร้างรายงานแบบกำหนดเอง',
  path: '/reports/custom',
  icon: Sparkles,
  roles: ['ADMIN', 'ACCOUNTANT'],
}
```

### 2. Create Page Route

Create `src/app/reports/custom/page.tsx`:

```tsx
import { CustomReportBuilder } from '@/components/reports/custom-report-builder';

export default function CustomReportPage() {
  return <CustomReportBuilder />;
}
```

### 3. Test the Component

Navigate to `/reports/custom` in your application to test the custom report
builder.

## API Testing

### Test Custom Report Generation

```bash
curl -X POST http://localhost:3000/api/reports/custom \
  -H "Content-Type: application/json" \
  -d '{
    "reportType": "TRIAL_BALANCE",
    "reportName": "Test Report",
    "dateTo": "2024-12-31",
    "outputFormat": "preview"
  }'
```

### Test Template Saving

```bash
curl -X POST http://localhost:3000/api/reports/templates \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Template",
    "config": {
      "reportType": "TRIAL_BALANCE",
      "includeZeroBalances": false
    }
  }'
```

### Test Template Retrieval

```bash
curl -X GET http://localhost:3000/api/reports/templates
```

## Features Checklist

- [x] Report Type Selection (6 types)
- [x] Report Options Panel
  - [x] Date Range (From/To)
  - [x] Comparison with previous period
  - [x] Include zero balances
  - [x] Account level filter
- [x] Column Selection (9 columns)
- [x] Filter Section
  - [x] Account type filter
  - [x] Account range filter
- [x] Output Options
  - [x] PDF Export
  - [x] Excel Export
  - [x] Screen Preview
- [x] Save as Template
- [x] Thai Language Support

## Component Props

The `CustomReportBuilder` component doesn't require any props. It's
self-contained and handles all state internally.

## Dependencies

Make sure these dependencies are installed:

```json
{
  "dependencies": {
    "react-hook-form": "^7.x",
    "@hookform/resolvers": "^3.x",
    "zod": "^3.x",
    "lucide-react": "^0.x",
    "@radix-ui/react-dialog": "^1.x",
    "@radix-ui/react-select": "^2.x",
    "@radix-ui/react-checkbox": "^1.x"
  }
}
```

## File Locations

- Component: `src/components/reports/custom-report-builder.tsx` (843 lines)
- API: `src/app/api/reports/custom/route.ts` (777 lines)
- Templates API: `src/app/api/reports/templates/route.ts` (138 lines)
- Documentation: `CUSTOM-REPORT-BUILDER.md`

## Next Steps

1. Add navigation link to sidebar
2. Create page route at `/reports/custom`
3. Test all report types
4. Test template saving/loading
5. Verify PDF and Excel exports
6. Test with different date ranges and filters

## Notes

- All existing report endpoints (trial-balance, balance-sheet, etc.) are reused
  for PDF/Excel exports
- Template storage uses the existing `ScheduledReport` Prisma model
- The component follows the existing shadcn/ui patterns used throughout the app
- Thai language is used for all UI elements
- Error handling includes Thai error messages
