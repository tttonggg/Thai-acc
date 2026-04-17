<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-04-17 -->

# Mobile-Optimized Components

## Purpose
Touch-friendly UI components optimized for mobile devices with larger touch targets (44px minimum), responsive layouts, and mobile-specific interactions.

## Key Files
| File | Description |
|------|-------------|
| `mobile-optimized-form.tsx` | Mobile form fields, touch input, bottom sheet, swipeable list, FAB, search bar |
| `index.ts` | Barrel exports |

## For AI Agents

### Working In This Directory

**Key Constants**
```typescript
const TOUCH_TARGET_SIZE = 'min-h-[44px] min-w-[44px]'  // iOS minimum
```

**Components Available**

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `MobileFormField` | Form field with label, error, required indicator | `label, children, error?, required?` |
| `TouchInput` | Input with 16px font-size (prevents iOS zoom) | Standard Input props |
| `MobileBottomSheet` | Bottom sheet dialog for mobile | `isOpen, onClose, title, children` |
| `SwipeableListItem` | List item with swipe actions | `onSwipeLeft?, onSwipeRight?, leftAction?, rightAction?` |
| `MobileNavDrawer` | Side navigation drawer | `isOpen, onClose, title, items[]` |
| `MobileDataList<T>` | Card-based list for mobile | `data[], keyExtractor, renderItem, onItemClick?` |
| `MobileStepper` | Multi-step form progress | `steps[], currentStep, onStepClick?` |
| `useIsMobile` | Hook to detect mobile viewport | `breakpoint?: number` (default 768) |
| `ResponsiveContainer` | Conditional class based on viewport | `mobileClassName?, desktopClassName?` |
| `MobileFab` | Floating action button | `onClick, icon, label?` |
| `MobileSearchBar` | Search input with submit | `value, onChange, placeholder?, onSubmit?` |

**Touch Target Guidelines**
- All interactive elements: minimum 44×44px
- Font size: 16px on inputs (prevents iOS zoom)
- Bottom sheets for dialogs on mobile
- Card-based lists instead of tables on mobile

**iOS Zoom Prevention**
```typescript
// Always set 16px font-size on mobile inputs
style={{ fontSize: '16px' }}
// or className="text-base"
```

**Swipe Gesture Thresholds**
```typescript
const threshold = 80  // Pixels to trigger action
const maxSwipe = 100   // Maximum swipe distance
```

## Dependencies
- `@/lib/utils` - `cn()` utility
- `@/components/ui/*` - shadcn/ui components (Sheet, Button, Input)
- `react` - Touch event handling
