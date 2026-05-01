<!-- Parent: ./AGENTS.md -->
<!-- Generated: 2026-04-17 -->

# design-system/

## Purpose

Design system assets and configuration for the Thai Accounting ERP application.

## Key Files

| File                   | Description                |
| ---------------------- | -------------------------- |
| `thai-accounting-erp/` | Design system subdirectory |

## For AI Agents

### Design System

The project uses shadcn/ui (New York style) as the base component library.
Custom theming is implemented via `src/stores/theme-store.ts` with 8 color
variants.

### Related Files

- `src/stores/theme-store.ts` - Theme state management
- `src/components/ui/` - shadcn/ui components
- `tailwind.config.ts` - Tailwind CSS configuration
