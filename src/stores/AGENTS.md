<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-17 -->

# src/stores

## Purpose
Zustand v5 global state management stores for the Thai Accounting ERP application.

## Key Files
| File | Description |
|------|-------------|
| `auth-store.ts` | Authentication state + role-based permissions (ADMIN/ACCOUNTANT/USER/VIEWER hierarchy, PERMISSIONS object) |
| `preferences-store.ts` | User preferences (theme, language, density, date/number formats, notifications, accessibility) |
| `theme-store.ts` | Keerati ERP theme customization (8 variants: default/mint/lavender/peach/sky/lemon/coral/professional) |

## For AI Agents

### Working In This Directory
- Zustand stores use TypeScript with strict typing
- State changes trigger re-renders via React hooks integration
- Theme store controls visual appearance across the application

### Role Hierarchy (from auth-store.ts)
```
ADMIN > ACCOUNTANT > USER > VIEWER
```
Each role has progressively fewer permissions. The PERMISSIONS object maps each module to allowed roles.

### Theme Variants
| Variant | Description |
|---------|-------------|
| default | Standard Keerati theme |
| mint | Mint green accent |
| lavender | Lavender accent |
| peach | Peach accent |
| sky | Sky blue accent |
| lemon | Lemon yellow accent |
| coral | Coral accent |
| professional | Professional blue-gray |

### Common Patterns

**Using auth store**
```typescript
import { useAuthStore } from '@/stores/auth-store'

const { user, isAuthenticated, hasPermission } = useAuthStore()

if (hasPermission('invoices', 'create')) {
  // Show create button
}
```

**Using theme store**
```typescript
import { useThemeStore } from '@/stores/theme-store'

const { theme, setTheme } = useThemeStore()
setTheme('mint')
```

## Dependencies

### Internal
- zustand v5 - State management
- React 19 - useStore hooks

### External
- crypto-js - Encryption for sensitive state
- speakeasy - TOTP secret generation