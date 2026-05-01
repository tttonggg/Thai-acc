# Quick Reference: Mobile & Theme

## Mobile Patterns (Copy-Paste Ready)

### Responsive Grid

```tsx
<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
  {/* Content */}
</div>
```

### Responsive Dialog

```tsx
<DialogContent className="max-w-[95vw] md:max-w-2xl">
  {/* Content */}
</DialogContent>
```

### Table Scroll Wrapper

```tsx
<div className="w-full overflow-x-auto">
  <Table>...</Table>
</div>
```

### Mobile Navigation

```tsx
<div className="fixed left-4 top-4 z-50 md:hidden">
  <Sheet open={open} onOpenChange={setOpen}>
    <SheetTrigger>
      <button>
        <Menu size={24} />
      </button>
    </SheetTrigger>
    <SheetContent side="left" className="w-80">
      <Sidebar onCloseMobile={() => setOpen(false)} />
    </SheetContent>
  </Sheet>
</div>
```

### Touch-Friendly Button

```tsx
<button className="min-h-[44px] min-w-[44px] p-3">
  <Icon size={20} />
</button>
```

## Theme Customization

### Switch Theme

```typescript
import { useThemeStore } from '@/stores/theme-store';
const { setTheme } = useThemeStore();
setTheme('lavender');
```

### Toggle Dark Mode

```typescript
const { toggleDarkMode } = useThemeStore();
toggleDarkMode();
```

### Available Themes

`default` | `mint` | `lavender` | `peach` | `sky` | `lemon` | `coral` |
`professional`

## Testing Commands

```bash
# Mobile viewport tests
npx playwright test --project="Mobile Chrome"

# Test specific device
npx playwright test --project="iPhone SE"

# All tests
bun run test:quick
```

## Breakpoints

| Name | Width  | Devices      |
| ---- | ------ | ------------ |
| `sm` | 640px  | Large phones |
| `md` | 768px  | Tablets      |
| `lg` | 1024px | Laptops      |
| `xl` | 1280px | Desktops     |

## Touch Target Size

**Minimum**: 44×44px (iOS/Android standard)

## Common Issues

| Issue                      | Fix                           |
| -------------------------- | ----------------------------- |
| Table overflows mobile     | Add `overflow-x-auto` wrapper |
| Dialog too small on mobile | Use `max-w-[95vw]`            |
| Button hard to tap         | Increase padding to `p-3`     |
| Horizontal scroll on body  | Check for fixed widths >100vw |

## Documentation Files

- **MOBILE_FEATURES.md** - User guide
- **DEVELOPER_MOBILE_GUIDE.md** - Developer patterns
- **THEME_CUSTOMIZATION.md** - Theme system
- **TESTING_CHECKLIST.md** - QA checklist
- **CLAUDE.md** - Project docs (updated)

## Key Files

- `/src/app/page.tsx` - Mobile hamburger (lines 452-474)
- `/src/components/layout/keerati-sidebar.tsx` - Responsive sidebar
- `/src/app/globals.css` - Theme CSS variables
- `/src/stores/theme-store.ts` - Zustand theme store

## Quick Checklist

For new components:

- [ ] Mobile layout (single column)
- [ ] Desktop layout (multi-column)
- [ ] Touch targets ≥44×44px
- [ ] Dialog: `max-w-[95vw] md:max-w-???`
- [ ] Tables: `overflow-x-auto` wrapper
- [ ] Test on 375px, 768px, 1024px

---

**Full Documentation**: See MOBILE_FEATURES.md, DEVELOPER_MOBILE_GUIDE.md,
THEME_CUSTOMIZATION.md, TESTING_CHECKLIST.md
