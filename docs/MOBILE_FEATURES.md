# Mobile Features Guide

## Overview

Keerati ERP is fully responsive and optimized for mobile devices. You can access
all features from your smartphone or tablet with a touch-friendly interface.

## Mobile Navigation

### Hamburger Menu (Mobile Only)

On mobile devices (screens smaller than 768px), the sidebar transforms into a
slide-out drawer:

1. Tap the **hamburger icon** (☰) in the top-left corner
2. The navigation menu slides in from the left
3. Tap any menu item to navigate
4. The menu automatically closes after selection

**Visual Guide:**

```
┌─────────────────────────┐
│ ☰  Keerati ERP          │  ← Hamburger button
├─────────────────────────┤
│                         │
│   [Main Content]        │
│                         │
└─────────────────────────┘

         ↓ Tap ☰

┌─────────────────────────┐
│ ✕  Navigation           │  ← Close button
├─────────────────────────┤
│ 📊 Dashboard            │
│ 🏪 Sales               │
│   👥 Customers         │
│   📄 Quotations        │
│   🧾 Invoices          │
│ ...                     │
└─────────────────────────┘
```

### Desktop Sidebar

On larger screens (768px and above), you see a full sidebar that can be
collapsed:

- Click the **collapse button** (←) in the sidebar header to minimize
- Collapsed sidebar shows icons only with tooltips
- Click again to expand

## Responsive Tables

Tables on mobile have horizontal scrolling when content is wider than the
screen:

**Desktop (full width):**

```
┌──────────┬──────────┬────────┬──────────┐
│ Invoice  │ Customer  │ Amount │ Status   │
├──────────┼──────────┼────────┼──────────┤
│ INV-001  │ Company A│ ฿10,000│ Paid     │
└──────────┴──────────┴────────┴──────────┘
```

**Mobile (scrollable):**

```
┌──────────┐
│ Invoice  │ ◄─ Swipe left →
├──────────┤     to see more
│ INV-001  │
└──────────┘
```

**How to use:**

- Swipe left/right on the table to view all columns
- All critical columns (like invoice number, amount) remain visible
- Scroll indicator shows when more content exists

## Responsive Dialogs

Dialog windows adapt to mobile screens:

- **Desktop**: Fixed width dialogs (e.g., `max-w-2xl`)
- **Mobile**: Full-width dialogs with small margins (`max-w-[95vw]`)

**Example:**

```
Desktop:              Mobile:
┌──────────────┐     ┌───────────────────┐
│  Dialog      │     │                   │
│  600px wide  │     │  Dialog           │
│              │     │  95% width        │
└──────────────┘     │                   │
                     └───────────────────┘
```

## Responsive Grids

Forms and layouts use responsive grids that stack on mobile:

**Desktop (2-4 columns):**

```
┌─────────┬─────────┐
│ Field 1 │ Field 2 │
├─────────┼─────────┤
│ Field 3 │ Field 4 │
└─────────┴─────────┘
```

**Mobile (1 column):**

```
┌─────────┐
│ Field 1 │
├─────────┤
│ Field 2 │
├─────────┤
│ Field 3 │
├─────────┤
│ Field 4 │
└─────────┘
```

## Touch Targets

All interactive elements meet mobile touch target guidelines:

- **Minimum size**: 44×44 pixels (iOS/Android standard)
- **Buttons**: Full-height tap targets
- **Form inputs**: Adequate spacing for easy tapping
- **Menu items**: Full-width touch areas

## Theme Customization on Mobile

Access the theme customizer:

1. Open the menu (hamburger on mobile)
2. Scroll to the bottom
3. Tap **"ปรับแต่งธีม"** (Theme Customizer)
4. Choose from 8 color themes
5. Toggle dark mode
6. Adjust border radius and accent intensity

**Mobile Theme Dialog:**

- Optimized for touch with larger buttons
- Color palette in a 4×2 grid for easy selection
- Sliders and switches with adequate touch targets

## Supported Breakpoints

| Breakpoint | Width  | Devices                            |
| ---------- | ------ | ---------------------------------- |
| `sm`       | 640px  | Large phones (landscape)           |
| `md`       | 768px  | Tablets (portrait)                 |
| `lg`       | 1024px | Tablets (landscape), small laptops |
| `xl`       | 1280px | Desktops                           |
| `2xl`      | 1536px | Large screens                      |

**Mobile-specific changes:**

- Below 768px (`md`): Hamburger menu, single-column layouts, full-width dialogs
- 768px and above: Full sidebar, multi-column layouts, fixed-width dialogs

## Tips for Mobile Users

1. **Landscape orientation** provides more screen real estate for tables
2. **Pinch-to-zoom** is disabled (app is fully responsive)
3. Use **browser bookmarks** for quick access to frequently used modules
4. **Add to home screen** on iOS/Android for app-like experience
5. Theme settings persist across sessions

## Accessibility Features

- Semantic HTML for screen readers
- ARIA labels on interactive elements
- High contrast mode support
- Keyboard navigation works on mobile with external keyboard
- Focus indicators visible on touch

## Troubleshooting

### Menu won't open

- Ensure JavaScript is enabled
- Try refreshing the page
- Check your internet connection

### Tables hard to read

- Switch to landscape orientation
- Use the theme customizer to increase contrast
- Try dark mode for better visibility

### Dialog too small

- Theme customizer → Border Radius → select "ใหญ่พิเศษ" (XL)
- Use landscape orientation

## Performance Tips

1. Keep your browser updated
2. Clear cache periodically if experiencing slowness
3. Use Wi-Fi for large data exports
4. Close unused browser tabs

---

**Need Help?**

Contact support at support@keerati-erp.com or visit our documentation at
docs.keerati-erp.com
