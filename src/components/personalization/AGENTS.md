<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-04-17 -->

# Personalization

## Purpose

User preferences, recent items tracking, and UI customization for personalized
experience.

## Key Files

| File                   | Description                   |
| ---------------------- | ----------------------------- |
| `user-preferences.tsx` | User preference settings form |
| `recent-items.tsx`     | Recently accessed items list  |
| `index.ts`             | Component exports             |

## For AI Agents

### Personalization Features

- Theme selection (8 color variants)
- Date/number format preferences
- Language settings
- Density settings (compact/comfortable/spacious)
- Notification preferences
- Accessibility options

### User Preferences Store

```typescript
interface UserPreferences {
  theme: string;
  language: 'th' | 'en';
  dateFormat: string;
  numberFormat: string;
  density: 'compact' | 'comfortable' | 'spacious';
  notifications: boolean;
  accessibility: {
    fontSize: number;
    highContrast: boolean;
  };
}
```

### Recent Items

Tracks last 10 accessed items for quick navigation:

- Invoices, receipts, payments
- Journal entries
- Reports

## Dependencies

### Internal

- @/stores/preferences-store - User preferences state
- @/stores/theme-store - Theme state
- @/components/ui/\* - Form components

### External

- react-hook-form v7 - Form handling
- lucide-react - Icons
