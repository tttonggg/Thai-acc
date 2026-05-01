# Developer Guide: Mobile Responsiveness

## Overview

This guide explains the mobile-responsive patterns used in Keerati ERP and how
to apply them when building new components.

## Core Principles

1. **Mobile-First Approach**: Design for mobile, then enhance for desktop
2. **Touch-Friendly**: All interactive elements meet 44×44px minimum touch
   target
3. **Responsive Grids**: Use Tailwind's responsive utilities (`md:`, `lg:`)
4. **Progressive Enhancement**: Start simple, add complexity for larger screens

## Tailwind Breakpoints

```javascript
// tailwind.config.js (defaults)
breakpoints: {
  'sm': '640px',   // Large phones landscape
  'md': '768px',   // Tablets portrait
  'lg': '1024px',  // Tablets landscape, small laptops
  'xl': '1280px',  // Desktops
  '2xl': '1536px', // Large screens
}
```

**Key Breakpoint for Mobile:**

- Below `768px` (md): Mobile layout
- `768px` and above: Desktop layout

## Common Patterns

### 1. Responsive Grids

**Pattern: Single column on mobile, multiple on desktop**

```tsx
// Form fields - 1 column mobile, 2 columns tablet, 3 columns desktop
<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
  <FormField label="Field 1" />
  <FormField label="Field 2" />
  <FormField label="Field 3" />
</div>
```

**When to use:**

- Forms with multiple fields
- Dashboard cards
- Settings panels

### 2. Responsive Dialogs

**Pattern: Fixed width on desktop, full-width on mobile**

```tsx
// Dialog responsive sizing
<DialogContent className="max-w-[95vw] md:max-w-2xl">
  {/* Content */}
</DialogContent>
```

**Available sizes:**

```tsx
max-w-[95vw] md:max-w-sm      // Small (384px)
max-w-[95vw] md:max-w-md      // Medium (448px)
max-w-[95vw] md:max-w-lg      // Large (512px)
max-w-[95vw] md:max-w-xl      // XL (576px)
max-w-[95vw] md:max-w-2xl     // 2XL (672px)
max-w-[95vw] md:max-w-3xl     // 3XL (768px)
```

### 3. Responsive Tables

**Pattern: Horizontal scroll wrapper**

```tsx
<div className="w-full overflow-x-auto">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Column 1</TableHead>
        <TableHead>Column 2</TableHead>
        {/* ... more columns */}
      </TableRow>
    </TableHeader>
    <TableBody>{/* Table rows */}</TableBody>
  </Table>
</div>
```

**Alternative: Card layout for mobile**

```tsx
<div className="md:hidden">
  {/* Card layout for mobile */}
  {data.map((item) => (
    <Card key={item.id} className="mb-4">
      <CardContent className="pt-6">
        <div className="space-y-2">
          <div><strong>Name:</strong> {item.name}</div>
          <div><strong>Status:</strong> {item.status}</div>
        </div>
      </CardContent>
    </Card>
  ))}
</div>

<Table className="hidden md:table">
  {/* Table for desktop */}
</Table>
```

### 4. Mobile Navigation

**Pattern: Hamburger menu on mobile, sidebar on desktop**

```tsx
// In page.tsx
<div className="flex h-screen">
  {/* Mobile Hamburger */}
  <div className="fixed left-4 top-4 z-50 md:hidden">
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetTrigger asChild>
        <button className="rounded-lg border bg-background p-2">
          <Menu size={24} />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <Sidebar onCloseMobile={() => setMobileMenuOpen(false)} />
      </SheetContent>
    </Sheet>
  </div>

  {/* Desktop Sidebar */}
  <div className="hidden md:block">
    <Sidebar />
  </div>

  {/* Main Content - Add top padding on mobile for hamburger space */}
  <main className="flex-1 overflow-auto p-6 pt-16 md:pt-6">{content}</main>
</div>
```

### 5. Responsive Spacing

**Pattern: Reduce spacing on mobile**

```tsx
// Less padding on mobile
<div className="p-4 md:p-6 lg:p-8">
  {/* Content */}
</div>

// Responsive gaps
<div className="gap-2 md:gap-4 lg:gap-6">
  {/* Items */}
</div>
```

### 6. Hidden/Visible Elements

**Pattern: Show/hide based on breakpoint**

```tsx
// Mobile only
<div className="md:hidden">
  {/* Only visible on mobile */}
</div>

// Desktop only
<div className="hidden md:block">
  {/* Only visible on desktop */}
</div>

// Tablet and up
<div className="hidden md:block lg:hidden">
  {/* Only visible on tablet */}
</div>
```

### 7. Responsive Text

**Pattern: Smaller text on mobile**

```tsx
<h1 className="text-2xl md:text-3xl lg:text-4xl">Heading</h1>
<p className="text-sm md:text-base">Body text</p>
```

### 8. Responsive Images

**Pattern: Fluid images with max width**

```tsx
<img
  src="/logo.png"
  alt="Logo"
  className="h-auto w-full max-w-[200px] md:max-w-[300px]"
/>
```

## Touch Targets

**Minimum size: 44×44px** (iOS/Android guideline)

```tsx
// ❌ Bad - Too small
<button className="p-1">
  <Icon size={16} />
</button>

// ✅ Good - Adequate touch target
<button className="p-3 min-h-[44px] min-w-[44px]">
  <Icon size={20} />
</button>

// ✅ Good - Full-width button
<button className="w-full py-3 px-4 min-h-[44px]">
  Click me
</button>
```

## Form Input Spacing

```tsx
// Adequate spacing between inputs
<div className="space-y-4">
  <Input />
  <Input />
  <Input />
</div>

// Responsive form grid
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <FormField />
  <FormField />
</div>
```

## Mobile-Specific Components

### Sheet Component (Mobile Drawer)

```tsx
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

<Sheet open={open} onOpenChange={setOpen}>
  <SheetTrigger asChild>
    <button>Open</button>
  </SheetTrigger>
  <SheetContent side="left" className="w-80">
    {/* Sidebar content */}
  </SheetContent>
</Sheet>;
```

### Responsive Button Groups

```tsx
<div className="flex flex-col gap-2 md:flex-row">
  <Button className="w-full md:w-auto">Primary</Button>
  <Button variant="outline" className="w-full md:w-auto">
    Secondary
  </Button>
</div>
```

## CSS Variables for Theming

```css
/* Mobile-safe CSS variables */
:root {
  --radius: 0.75rem; /* Affects all rounded corners */

  /* Use in components */
  --mobile-padding: 1rem;
  --desktop-padding: 1.5rem;
}
```

## Testing Responsiveness

### Browser DevTools

1. Open DevTools (F12 or Cmd+Option+I)
2. Click device toolbar icon (Ctrl+Shift+M or Cmd+Shift+M)
3. Select device presets or enter custom dimensions

**Key test sizes:**

- iPhone SE: 375×667px
- iPhone 12 Pro: 390×844px
- iPad: 768×1024px
- Desktop: 1920×1080px

### Command Line Testing

```bash
# Test with Playwright (mobile emulation)
bun run test:quick --project="Mobile Chrome"

# Test specific device
npx playwright test --project="iPhone SE"
```

## Accessibility Considerations

1. **Touch targets**: Minimum 44×44px
2. **Focus indicators**: Visible on touch devices
3. **Semantic HTML**: Use proper elements (`<button>`, `<input>`)
4. **ARIA labels**: For icon-only buttons
5. **Keyboard navigation**: Works with external keyboards

```tsx
// Icon button with ARIA label
<button aria-label="Open menu" className="p-3">
  <Menu size={24} />
</button>

// Form field with proper labeling
<label htmlFor="email">Email</label>
<Input id="email" type="email" />
```

## Performance Tips

1. **Lazy load images**: Use `loading="lazy"`
2. **Optimize images**: WebP format, responsive sizes
3. **Minimize JavaScript**: Code splitting for mobile
4. **Avoid large libraries**: Use tree-shaking

```tsx
// Lazy loading component
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Loader />,
  ssr: false, // Skip SSR for client-only
});
```

## Common Mistakes to Avoid

### 1. Fixed Widths

```tsx
// ❌ Bad - Fixed width breaks on mobile
<div style={{ width: '1200px' }}>

// ✅ Good - Responsive width
<div className="w-full max-w-7xl mx-auto">
```

### 2. Missing Mobile Padding

```tsx
// ❌ Bad - Content touches edges
<div className="p-6 md:p-8">

// ✅ Good - Adequate padding on all devices
<div className="p-4 md:p-6 lg:p-8">
```

### 3. Too Small Touch Targets

```tsx
// ❌ Bad - Icon only, too small
<button onClick={action}>
  <Trash size={14} />
</button>

// ✅ Good - Adequate padding
<button
  onClick={action}
  className="p-3 min-h-[44px] min-w-[44px]"
  aria-label="Delete"
>
  <Trash size={18} />
</button>
```

### 4. Horizontal Scroll on Body

```tsx
// ❌ Bad - Causes horizontal scroll
<div className="w-[1200px]">

// ✅ Good - Constrained width
<div className="w-full overflow-x-auto">
```

## Checklist for New Components

- [ ] Mobile layout (single column, stacked)
- [ ] Desktop layout (multi-column, grid)
- [ ] Touch targets ≥44×44px
- [ ] Adequate spacing between interactive elements
- [ ] Responsive dialog/table widths
- [ ] Test on actual devices (or DevTools)
- [ ] Accessibility (ARIA labels, keyboard nav)
- [ ] Performance (lazy loading, optimization)

## Resources

- [Tailwind Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [Mobile Touch Target Size](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
- [Responsive Design Patterns](https://bradfrost.github.io/this-is-responsive/patterns.html)

---

**Remember**: Test on real devices whenever possible. Emulators don't always
catch touch-related issues.
