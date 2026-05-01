# Theme Customization Guide

## Overview

Keerati ERP includes 8 built-in color themes with full dark mode support.
Customize your experience with the Theme Customizer dialog.

## Available Themes

### 1. Pink Blossom (ชมพูพาสเทล) - Default

- Soft pastel pink gradient
- Friendly and approachable
- Great for general use

### 2. Fresh Mint (มิ้นท์สดชื่น)

- Cool mint green gradient
- Calming and refreshing
- Good for long sessions

### 3. Lavender Dream (ลาเวนเดอร์)

- Soft purple lavender gradient
- Elegant and professional
- Reduces eye strain

### 4. Sweet Peach (พีชหวาน)

- Warm peach gradient
- Cozy and welcoming
- Great for customer-facing displays

### 5. Sky Blue (ฟ้าสดใส)

- Bright sky blue gradient
- Clean and modern
- Professional appearance

### 6. Lemon Zest (เลมอนสด)

- Cheerful yellow gradient
- Energizing and positive
- Good for creative work

### 7. Coral Reef (คอรัลพีช)

- Vibrant coral gradient
- Bold and confident
- High visibility

### 8. Professional Amber (อาชีพแอมเบอร์)

- Warm amber gradient
- Business-appropriate
- Best for formal settings

## Accessing Theme Customizer

### Desktop

1. Look at the bottom of the sidebar
2. Click **"ปรับแต่งธีม"** (Theme Customizer)
3. Dialog opens with all options

### Mobile

1. Open hamburger menu (☰)
2. Scroll to bottom
3. Tap **"ปรับแต่งธีม"**
4. Full-screen dialog appears

## Theme Options

### Dark Mode Toggle

Switch between light and dark modes:

- **Light mode**: Bright backgrounds, dark text (default)
- **Dark mode**: Dark backgrounds, light text (reduces eye strain at night)

**Icon indicator:**

- ☀️ Sun = Light mode active
- 🌙 Moon = Dark mode active

### Animation Effects

Toggle interface animations:

- **Enabled**: Smooth transitions, hover effects (default)
- **Disabled**: Instant changes, reduces motion for accessibility

**When to disable:**

- Prefer reduced motion
- Older devices
- Battery conservation

### Color Theme Selection

Choose from 8 color themes:

```
┌────┬────┬────┬────┐
│ 💗 │ 🌿 │ 💜 │ 🍑 │
└────┴────┴────┴────┘
┌────┬────┬────┬────┐
│ 🌤 │ 🍋 │ 🪸 │ 🟠 │
└────┴────┴────┴────┘
```

Active theme shows a heart icon (💗).

### Border Radius

Adjust roundness of UI elements:

| Option | Thai      | Radius | Best For           |
| ------ | --------- | ------ | ------------------ |
| Small  | เล็ก      | 6px    | Compact layouts    |
| Medium | ปานกลาง   | 8px    | Balanced (default) |
| Large  | ใหญ่      | 12px   | Modern, friendly   |
| XL     | ใหญ่พิเศษ | 16px   | Playful, casual    |

**Affects:** Buttons, cards, dialogs, inputs

### Accent Intensity

Control color saturation:

| Option  | Thai | Effect                     |
| ------- | ---- | -------------------------- |
| Soft    | อ่อน | Muted colors, subtle       |
| Medium  | กลาง | Balanced (default)         |
| Vibrant | เข้ม | Bold colors, high contrast |

## Theme Persistence

All theme settings save automatically:

- Stored in browser's localStorage
- Persists across sessions
- Syncs across tabs
- No account required

**Storage key:** `keerati-theme-storage`

## CSS Variables Reference

Themes use CSS custom properties. Advanced users can override these:

### Core Colors

```css
/* Backgrounds */
--background: #fefdfb; /* Main background */
--card: #ffffff; /* Card background */
--popover: #ffffff; /* Tooltip/popover */
--muted: #f5f3f7; /* Disabled states */

/* Text */
--foreground: #1a1a2e; /* Main text */
--card-foreground: #1a1a2e; /* Card text */
--muted-foreground: #4a4a5a; /* Secondary text */

/* Primary (brand color) */
--primary: #ffb6c1; /* Theme pink */
--primary-foreground: #3d1f24; /* Text on primary */
```

### Semantic Colors

```css
/* Status colors */
--destructive: #ef4444; /* Error/delete */
--success: #22c55e; /* Success */
--warning: #f59e0b; /* Warning */
--info: #3b82f6; /* Info */

/* Borders */
--border: #e2e2e2; /* Default border */
--input: #e2e2e2; /* Input border */
--ring: #ffb6c1; /* Focus ring */
```

### Sidebar Colors

```css
--sidebar: #ffffff; /* Sidebar background */
--sidebar-foreground: #1a1a2e; /* Sidebar text */
--sidebar-primary: #ffb6c1; /* Active item */
--sidebar-accent: #f5f3f7; /* Hover state */
--sidebar-border: #e2e2e2; /* Separator */
```

### Radius

```css
--radius: 0.75rem; /* Default border radius */
--radius-sm: calc(var(--radius) - 4px);
--radius-md: calc(var(--radius) - 2px);
--radius-lg: var(--radius);
--radius-xl: calc(var(--radius) + 4px);
```

## Dark Mode Variables

Dark mode automatically adjusts all colors:

```css
.dark {
  --background: #1a1a2e; /* Dark background */
  --foreground: #f0f0f0; /* Light text */
  --card: #252540; /* Slightly lighter */
  --border: #3a3a4a; /* Darker borders */
  /* ... all other colors adjust automatically */
}
```

## Creating Custom Themes

Developers can add new themes by editing `src/stores/theme-store.ts`:

```typescript
// 1. Add to ThemeVariant type
export type ThemeVariant =
  | 'default'
  | 'mint'
  | 'lavender'
  | 'peach'
  | 'sky'
  | 'lemon'
  | 'coral'
  | 'professional'
  | 'my-custom-theme'; // ← Add here

// 2. Add to themeColors object
export const themeColors: Record<ThemeVariant, {...}> = {
  // ... existing themes ...
  'my-custom-theme': {
    name: 'My Custom Theme',
    nameTh: 'ธีมของฉัน',
    color: '#FF6B6B',
    gradient: 'linear-gradient(135deg, #FF6B6B, #FFE66D)',
  },
}

// 3. Add CSS variables in src/app/globals.css
[data-theme="my-custom-theme"] {
  --primary: #FF6B6B;
  --primary-foreground: #ffffff;
  /* ... other color overrides ... */
}
```

## Theme Switching Programmatically

For developers who want to control themes via code:

```typescript
import { useThemeStore } from '@/stores/theme-store'

function MyComponent() {
  const { setTheme, toggleDarkMode } = useThemeStore()

  // Switch to specific theme
  const handleThemeChange = () => {
    setTheme('lavender')
  }

  // Toggle dark mode
  const handleDarkMode = () => {
    toggleDarkMode()
  }

  return (
    <>
      <button onClick={handleThemeChange}>
        Switch to Lavender
      </button>
      <button onClick={handleDarkMode}>
        Toggle Dark Mode
      </button>
    </>
  )
}
```

## Accessibility Features

### High Contrast Mode

Themes maintain WCAG AA contrast ratios (4.5:1 minimum):

- All text meets contrast requirements
- Interactive elements have clear focus states
- Color not used as only indicator

### Reduced Motion

Disable animations for accessibility:

```typescript
const { toggleAnimations } = useThemeStore()

// Or via system preference
@media (prefers-reduced-motion: reduce) {
  /* Automatically respects system setting */
}
```

## Theme Preview

Test themes without committing:

1. Open Theme Customizer
2. Click any theme color
3. Changes apply instantly
4. Close dialog to keep, or switch again

## Reset to Defaults

Clear all customizations:

```javascript
// In browser console
localStorage.removeItem('keerati-theme-storage');
location.reload();
```

This resets to:

- Theme: Pink Blossom (default)
- Mode: Light
- Border radius: Large (lg)
- Accent intensity: Medium
- Animations: Enabled

## Troubleshooting

### Theme Not Applying

**Problem:** Theme colors don't change after selection

**Solutions:**

1. Clear browser cache
2. Check browser console for errors
3. Ensure localStorage is enabled
4. Try private/incognito mode

### Dark Mode Not Working

**Problem:** Dark mode toggle has no effect

**Solutions:**

1. Check if `.dark` class is on `<html>` element
2. Verify CSS variables are loading
3. Check for conflicting CSS overrides

### Custom Theme Not Showing

**Problem:** Added custom theme but it doesn't appear

**Solutions:**

1. Rebuild app (`bun run build`)
2. Check for TypeScript errors
3. Verify CSS selector matches `[data-theme="my-custom-theme"]`

## Best Practices

1. **Consistency**: Keep theme settings consistent across your organization
2. **Accessibility**: Test with screen readers and keyboard navigation
3. **Performance**: Themes use CSS variables (fast, no re-render needed)
4. **User Preference**: Respect user's system dark mode preference

## API Reference

### useThemeStore Hook

```typescript
const {
  theme, // Current theme variant
  setTheme, // Change theme
  isDarkMode, // Dark mode state
  toggleDarkMode, // Toggle dark mode
  isSidebarCollapsed, // Sidebar state
  toggleSidebar, // Toggle sidebar
  expandedGroups, // Menu group expansion
  toggleGroup, // Toggle menu group
  accentIntensity, // Color saturation
  setAccentIntensity, // Change saturation
  borderRadius, // Corner roundness
  setBorderRadius, // Change roundness
  animationsEnabled, // Animation state
  toggleAnimations, // Toggle animations
} = useThemeStore();
```

### next-themes Integration

The app uses `next-themes` for SSR-safe dark mode:

```typescript
import { useTheme } from 'next-themes';

const { theme, setTheme } = useTheme();
// theme = 'light' | 'dark' | 'system'
```

## Resources

- [Tailwind CSS Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [WCAG Color Contrast](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)

---

**Experiment with themes to find what works best for you!**
