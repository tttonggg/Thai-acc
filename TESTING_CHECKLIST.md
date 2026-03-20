# Mobile & Theme Testing Checklist

## Overview

Use this checklist to verify mobile responsiveness and theme functionality across all devices and configurations.

## Testing Prerequisites

### Required Tools
- [ ] Chrome DevTools (Device Toolbar)
- [ ] Real mobile device (optional but recommended)
- [ ] Multiple browsers (Chrome, Firefox, Safari)
- [ ] Playwright test suite

### Test Accounts
- [ ] Admin account for full access
- [ ] Regular user account for role-based testing

## Mobile Breakpoint Testing

### Small Mobile (375px - iPhone SE)
- [ ] Hamburger menu appears
- [ ] Menu slides in from left
- [ ] Menu closes after selection
- [ ] Content has 16px top padding (space for hamburger)
- [ ] All tables scroll horizontally
- [ ] Dialogs are 95% viewport width
- [ ] Forms use single-column layout
- [ ] Text is readable without zoom
- [ ] Touch targets are ≥44×44px

### Large Mobile (390px - iPhone 12 Pro)
- [ ] All Small Mobile tests pass
- [ ] Two-column grids work in landscape
- [ ] Images scale properly
- [ ] No horizontal scroll on body

### Tablet Portrait (768px - iPad)
- [ ] Sidebar appears (no hamburger)
- [ ] Tables show more columns
- [ ] Forms use 2-column grids
- [ ] Dialogs use fixed width (not 95vw)
- [ ] Navigation is fully expanded

### Tablet Landscape (1024px)
- [ ] All Tablet Portrait tests pass
- [ ] Forms use 3-column grids
- [ ] Dashboard cards show 4 columns
- [ ] Tables fit better on screen

## Theme Testing Checklist

### Light Mode Testing

For each of 8 themes (default, mint, lavender, peach, sky, lemon, coral, professional):

- [ ] Primary color displays correctly
- [ ] All buttons use theme color
- [ ] Sidebar gradient matches theme
- [ ] Focus rings use theme color
- [ ] Hover states work
- [ ] Text contrast meets WCAG AA (4.5:1)
- [ ] Card backgrounds are readable
- [ ] Borders are visible
- [ ] Links are distinguishable

**Quick Test Script:**
```javascript
// In browser console, cycle through all themes
const themes = ['default', 'mint', 'lavender', 'peach', 'sky', 'lemon', 'coral', 'professional']
themes.forEach((theme, i) => {
  setTimeout(() => {
    document.documentElement.setAttribute('data-theme', theme)
    console.log(`Testing theme: ${theme}`)
  }, i * 2000)
})
```

### Dark Mode Testing

For each of 8 themes in dark mode:

- [ ] Dark mode toggle works
- [ ] Background is dark (#1a1a2e or similar)
- [ ] Text is light (#f0f0f0 or similar)
- [ ] Contrast ratio maintained (4.5:1 minimum)
- [ ] Cards are slightly lighter than background
- [ ] Borders are visible
- [ ] Primary color adjusted for dark mode
- [ ] No color inversion issues
- [ ] Sidebar colors readable
- [ ] Tables readable

**Dark Mode Test:**
```javascript
// Toggle dark mode
document.documentElement.classList.toggle('dark')
```

## Touch Target Testing

### Minimum Size: 44×44px

Test these elements on mobile:

**Navigation:**
- [ ] Hamburger menu button
- [ ] All menu items in sidebar
- [ ] Collapse/expand buttons
- [ ] Close buttons (X)

**Forms:**
- [ ] Input fields (height ≥44px)
- [ ] Submit buttons
- [ ] Dropdown triggers
- [ ] Checkbox/toggle areas
- [ ] Date picker triggers
- [ ] File upload buttons

**Tables:**
- [ ] Action buttons (edit, delete, view)
- [ ] Checkbox cells
- [ ] Sort indicators

**Dialogs:**
- [ ] Close button (top-right)
- [ ] Save/Cancel buttons
- [ ] All form inputs inside

**Cards:**
- [ ] Card click areas
- [ ] Action buttons on cards

### Touch Target Spacing

- [ ] At least 8px gap between adjacent targets
- [ ] No overlapping touch areas
- [ ] Clear visual feedback on touch

## Table Scrolling Testing

### Horizontal Scroll Behavior

For each table in the app:

- [ ] Table wrapper has `overflow-x-auto`
- [ ] Scroll indicator visible (shadow or hint)
- [ ] Swipe gesture works smoothly
- [ ] Momentum scrolling works (iOS)
- [ ] Fixed columns stay in place (if implemented)
- [ ] No horizontal scroll on page body

### Critical Columns Visibility

Ensure these columns are always visible:

**Invoices:**
- [ ] Invoice number
- [ ] Date
- [ ] Customer name
- [ ] Amount
- [ ] Status

**Customers/Vendors:**
- [ ] Name
- [ ] Code
- [ ] Contact
- [ ] Balance

**Products:**
- [ ] Product code
- [ ] Name
- [ ] Price
- [ ] Stock

### Table Responsiveness

- [ ] Text doesn't overflow cells
- [ ] Numbers align properly
- [ ] Status badges are readable
- [ ] Actions buttons are accessible

## Dialog Testing

### Mobile Dialogs (≤767px)

- [ ] Dialog width is 95% of viewport
- [ ] Adequate padding (16px minimum)
- [ ] Close button accessible (top-right or back button)
- [ ] Forms use single column
- [ ] No horizontal scroll
- [ ] Keyboard appears without shifting dialog off-screen
- [ ] Save/Cancel buttons are full-width or stacked

### Desktop Dialogs (≥768px)

- [ ] Dialog uses fixed width (max-w-2xl, etc.)
- [ ] Centered on screen
- [ ] Backdrop overlay visible
- [ ] Close on backdrop click
- [ ] Close on Escape key
- [ ] Forms use multi-column layout

### Dialog Content

Test each dialog type:

**Edit Dialogs:**
- [ ] Invoice edit dialog
- [ ] Customer edit dialog
- [ ] Vendor edit dialog
- [ ] Product edit dialog

**View Dialogs:**
- [ ] Invoice preview
- [ ] Receipt view
- [ ] Payment view

**Create Dialogs:**
- [ ] New invoice
- [ ] New customer
- [ ] New product

## Form Layout Testing

### Mobile Forms

- [ ] Single column layout
- [ ] Input height ≥44px
- [ ] Labels above inputs (not beside)
- [ ] Adequate spacing between fields
- [ ] Submit button full-width
- [ ] Validation messages visible
- [ ] No horizontal scroll

### Desktop Forms

- [ ] Multi-column layout (2-4 columns)
- [ ] Labels beside inputs (when appropriate)
- [ ] Submit button normal width
- [ ] Proper alignment

### Form Fields

Test each field type:

- [ ] Text inputs
- [ ] Number inputs
- [ ] Date pickers
- [ ] Dropdown selects
- [ ] Multi-selects
- [ ] Checkboxes
- [ ] Radio buttons
- [ ] Textareas
- [ ] File uploads
- [ ] Currency inputs

## Accessibility Testing

### Screen Reader Testing

- [ ] All images have alt text
- [ ] Form fields have labels
- [ ] Buttons have accessible names
- [ ] ARIA labels on icon-only buttons
- [ ] Navigation landmarks present
- [ ] Live regions for dynamic content
- [ ] Focus order logical

### Keyboard Navigation

- [ ] Tab key moves focus logically
- [ ] Enter/Space activates buttons
- [ ] Escape closes dialogs
- [ ] Arrow keys work in dropdowns
- [ ] Focus indicators visible
- [ ] Skip navigation link present

### Color Contrast

Use a contrast checker tool:

- [ ] Normal text: ≥4.5:1
- [ ] Large text (18pt+): ≥3:1
- [ ] UI components: ≥3:1
- [ ] All 8 themes × 2 modes = 16 combinations

## Browser Compatibility Testing

### Desktop Browsers

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest, if on Mac)
- [ ] Edge (latest)

### Mobile Browsers

- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS)
- [ ] Firefox Mobile (Android)
- [ ] Samsung Internet (Android)

## Performance Testing

### Load Time

- [ ] Initial load <3 seconds on 4G
- [ ] Time to Interactive <5 seconds
- [ ] No layout shift (CLS <0.1)
- [ ] First Contentful Paint <1.8s

### Runtime Performance

- [ ] Smooth scrolling (60fps)
- [ ] No jank on theme switch
- [ ] Dialog animations smooth
- [ ] Menu slide-in smooth
- [ ] Table scrolling performant

## Automated Testing

### Playwright Tests

Run mobile-specific tests:

```bash
# Mobile viewport tests
npx playwright test --project="Mobile Chrome"

# All viewport tests
npx playwright test --project="iPhone SE"
npx playwright test --project="iPad"
npx playwright test --project="Desktop Chrome"
```

### Test Coverage

Ensure tests cover:

- [ ] Mobile menu open/close
- [ ] Theme switching
- [ ] Dark mode toggle
- [ ] Responsive table scrolling
- [ ] Touch interactions
- [ ] Form submissions
- [ ] Dialog interactions

## Manual Testing Scenarios

### Scenario 1: Invoice Creation on Mobile

1. Open app on mobile device
2. Tap hamburger menu
3. Navigate to Invoices
4. Tap "New Invoice" button
5. Fill form with mobile keyboard
6. Save invoice
7. Verify success

**Expected:** Smooth flow, no horizontal scroll, all fields accessible

### Scenario 2: Theme Switching

1. Open Theme Customizer
2. Switch through all 8 themes
3. Toggle dark mode
4. Adjust border radius
5. Change accent intensity
6. Close and reopen app

**Expected:** All settings persist, no visual glitches

### Scenario 3: Table Navigation on Mobile

1. Open Customers list
2. Swipe table to see all columns
3. Tap a customer row
4. View customer details
5. Close dialog
6. Search/filter customers

**Expected:** Smooth scrolling, dialog responsive, search works

## Bug Reporting Template

When reporting mobile/theme issues, include:

```
**Device:** [e.g., iPhone 12 Pro, iPad Pro 2021]
**OS Version:** [e.g., iOS 15.4, Android 12]
**Browser:** [e.g., Safari 15.4, Chrome 100]
**Viewport Size:** [e.g., 390×844px]
**Theme:** [e.g., Lavender, Dark Mode]
**Steps to Reproduce:**
1.
2.
3.
**Expected Behavior:**
**Actual Behavior:**
**Screenshot/Video:** [Attach if possible]
```

## Sign-Off Criteria

For release approval:

- [ ] All critical bugs fixed
- [ ] All 8 themes tested in light mode
- [ ] All 8 themes tested in dark mode
- [ ] Mobile layout tested on 3+ devices
- [ ] Tablet layout tested on 2+ devices
- [ ] Touch targets meet 44×44px minimum
- [ ] All tables scroll horizontally on mobile
- [ ] All dialogs responsive
- [ ] Accessibility audit passed
- [ ] Performance benchmarks met
- [ ] Automated tests passing

## Testing Resources

### Emulators & Simulators

- [Chrome DevTools](https://developer.chrome.com/docs/devtools/device-mode/)
- [Xcode Simulator](https://developer.apple.com/xcode/) (iOS)
- [Android Studio Emulator](https://developer.android.com/studio) (Android)

### Real Device Testing

- [BrowserStack](https://www.browserstack.com/) - Paid but comprehensive
- [LambdaTest](https://www.lambdatest.com/) - Free tier available
- Physical devices owned by team

### Accessibility Tools

- [axe DevTools](https://www.deque.com/axe/devtools/) - Chrome extension
- [WAVE](https://wave.webaim.org/) - Online checker
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Built into Chrome

### Contrast Checkers

- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Contrast Ratio](https://contrast-ratio.com/)

---

**Remember:** Test on real devices whenever possible. Emulators don't catch all touch and performance issues.
