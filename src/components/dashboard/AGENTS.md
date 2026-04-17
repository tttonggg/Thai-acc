<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-04-17 -->

# Dashboard

## Purpose
Main dashboard widgets, layouts, and customization options for the Thai Accounting ERP home screen.

## Key Files
| File | Description |
|------|-------------|
| `dashboard.tsx` | Main dashboard with KPI widgets, charts, and recent activity |
| `dashboard-customizer.tsx` | User-customizable widget layout |
| `enhanced-dashboard.tsx` | Enhanced dashboard with additional features |
| `index.ts` | Component exports |

## For AI Agents

### Dashboard Features
- KPI widgets showing financial metrics
- Chart visualizations (revenue, expenses, cash flow)
- Recent transactions and activities
- Quick action buttons
- Customizable widget positions

### Customization
Users can customize their dashboard via `dashboard-customizer.tsx`:
- Add/remove widgets
- Rearrange widget positions
- Set default date ranges
- Configure notification preferences

### Data Refresh
Dashboard data refreshes every 5 minutes via TanStack Query with stale time configuration.

## Dependencies

### Internal
- @/lib/api-utils - Dashboard data APIs
- @/components/ui/* - Card, Chart, Table components
- @/components/dashboard - Widget components
- @/stores/preferences-store - User preferences

### External
- recharts - Chart library
- date-fns v4 - Date formatting
- lucide-react - Icons