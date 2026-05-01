<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-17 -->

# src/hooks

## Purpose

Custom React hooks providing reusable stateful logic across the Thai Accounting
ERP application.

## Key Files

| File                        | Description                                                 |
| --------------------------- | ----------------------------------------------------------- |
| `index.ts`                  | Barrel export for all hooks                                 |
| `use-delete-confirm.ts`     | Delete confirmation dialog hook with UI state management    |
| `use-keyboard-shortcuts.ts` | Keyboard shortcuts including Vim navigation and ERP hotkeys |
| `use-mobile.ts`             | Mobile device detection with 768px breakpoint               |
| `use-toast.ts`              | Custom toast notification system for user feedback          |

## For AI Agents

### Working In This Directory

- All hooks use TypeScript with proper type definitions
- Follow React hooks best practices (conditionally called at top level)
- `use-toast` is a critical utility used across the entire application

### Common Patterns

**use-delete-confirm**

```typescript
const { confirmDelete, deleteDialog } = useDeleteConfirm({
  title: 'Delete Item',
  description: 'Are you sure you want to delete this item?',
  onConfirm: async () => {
    await deleteItem(id);
  },
});
```

**use-keyboard-shortcuts**

```typescript
useKeyboardShortcuts({
  'ctrl+s': () => handleSave(),
  'ctrl+n': () => handleNew(),
  Escape: () => handleCancel(),
});
```

**use-mobile**

```typescript
const isMobile = useMobile();
// Returns true if viewport width < 768px
```

## Dependencies

### Internal

- React 19 - Hooks API
- @tanstack/react-query - Data fetching hooks
- Zustand - State management hooks

### External

- lucide-react - Icons for toast notifications
