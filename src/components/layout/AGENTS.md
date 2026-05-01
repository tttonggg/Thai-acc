<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-04-17 -->

# Layout Components

## Purpose

Global layout shell — sidebar navigation, header, and module routing. SPA
pattern using `activeModule` state (not standard Next.js file routing).

## Key Files

| File                   | Description                                                       |
| ---------------------- | ----------------------------------------------------------------- |
| `sidebar.tsx`          | Basic sidebar navigation                                          |
| `keerati-sidebar.tsx`  | Enhanced sidebar with Keerati branding, module icons, collapsible |
| `enhanced-sidebar.tsx` | Enhanced sidebar with more features                               |
| `header.tsx`           | Top header with user menu, notifications, search                  |

## For AI Agents

### Working In This Directory

**SPA Routing Pattern**

```typescript
// URL → Module mapping (in src/app/page.tsx)
const moduleToPath = {
  dashboard: '/',
  invoices: '/invoices',
  receipts: '/receipts',
  // ... etc
};

// Module types
type Module =
  | 'dashboard'
  | 'invoices'
  | 'receipts'
  | 'payments'
  | 'purchases'
  | 'inventory'
  | 'assets'
  | 'banking'
  | 'petty_cash'
  | 'payroll'
  | 'wht'
  | 'quotations'
  | 'journal'
  | 'reports'
  | 'settings'
  | 'admin';
```

**Adding New Module to Sidebar**

1. Add button in `keerati-sidebar.tsx`
2. Add route in `src/app/page.tsx` moduleToPath/pathToModule maps
3. Add render case in `renderModule()` switch
4. Create API route in `/api/your-module/route.ts`

**Critical Invariants**

- Sidebar buttons must match Module type union
- Active state highlights current module
- Navigation uses `window.history.pushState()` (not `<Link>`)
- Sidebar collapse state persisted in localStorage

## Dependencies

### Internal

- `@/store/app` - Active module state (Zustand)
- `@/components/ui/*` - Button, Avatar, DropdownMenu
- `src/app/page.tsx` - Module routing logic

### External

- `lucide-react` - Icons
- `tailwindcss` - Styling
