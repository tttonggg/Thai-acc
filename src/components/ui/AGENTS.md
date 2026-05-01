<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-04-17 -->

# UI Components

## Purpose

shadcn/ui base component library (New York style). **DO NOT MODIFY** - use
`npx shadcn add` for adding/updating components.

## Key Files

This directory contains 50+ shadcn/ui components including:

- Form components: input, label, checkbox, select, textarea, etc.
- Layout components: card, dialog, drawer, sheet, etc.
- Feedback components: alert, toast, progress, skeleton, etc.
- Navigation components: tabs, breadcrumbs, sidebar, menu, etc.
- Data display: table, list, badge, avatar, calendar, chart, etc.

## For AI Agents

### DO NOT MODIFY

These components are managed by shadcn/ui CLI. Manual edits will be overwritten
on next update.

### Adding Components

```bash
# Add new shadcn/ui component
npx shadcn add button
npx shadcn add dialog
```

### Customizing

To customize, create wrapper components in feature directories that import and
configure these base components.

### Important Files

- `index.ts` - Barrel export for all UI components
- `README.md` - Component documentation

## Dependencies

### External

- @radix-ui/react-\* - Headless UI primitives
- tailwindcss - Styling
- lucide-react - Icons
- class-variance-authority - Component variants
- clsx - Conditional class names
