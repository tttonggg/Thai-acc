# Thai Accounting ERP - Task Breakdown

> **Strategy:** Smallest possible independent tasks
> **Goal:** Minimize errors, enable incremental testing
> **Format:** Each task = 1 file change + verification

---

## 📋 Task Structure

Each task includes:
- **ID:** Unique identifier (e.g., 1.1, 1.2)
- **File:** Single file to modify
- **Action:** Specific change to make
- **Lines:** Approximate lines to add/change
- **Time:** 5-30 minutes
- **Test:** How to verify it works
- **Dependencies:** What must be done first (if any)

---

## 🎨 Phase 1: Professional Theme (8 tasks, ~2 hours)

### Task 1.1: Add 'professional' to ThemeVariant type
**File:** `src/stores/theme-store.ts`
**Action:** Add `'professional'` to type union
**Lines:** +1
**Time:** 2 min

```typescript
// BEFORE:
export type ThemeVariant = 'default' | 'mint' | 'lavender' | 'peach' | 'sky' | 'lemon' | 'coral';

// AFTER:
export type ThemeVariant = 'default' | 'mint' | 'lavender' | 'peach' | 'sky' | 'lemon' | 'coral' | 'professional';
```

**Test:** File saves, no TypeScript errors
**Dependencies:** None

---

### Task 1.2: Add professional theme colors object
**File:** `src/stores/theme-store.ts`
**Action:** Add entry to `themeColors` object
**Lines:** +6
**Time:** 3 min

```typescript
// Add to themeColors object (after 'coral' entry):
professional: {
  name: 'Professional Amber',
  nameTh: 'อาชีพแอมเบอร์',
  color: '#F59E0B',
  gradient: 'linear-gradient(135deg, #FBBF24, #F59E0B)',
},
```

**Test:** File saves, no TypeScript errors
**Dependencies:** Task 1.1

---

### Task 1.3: Add professional theme light mode CSS
**File:** `src/app/globals.css`
**Action:** Add `[data-theme="professional"]` block
**Lines:** +40
**Time:** 10 min

**Location:** After line 526 (after Coral dark mode), before `@layer base`

```css
/* ============================================
   🏢 PROFESSIONAL THEME - LIGHT MODE
   ============================================ */
[data-theme="professional"] {
  --primary: #f59e0b;
  --primary-foreground: #1c0a00;
  --secondary: #f1f5f9;
  --secondary-foreground: #0f172a;
  --accent: #8b5cf6;
  --accent-foreground: #ffffff;
  --background: #fafafa;
  --foreground: #0f172a;
  --card: #ffffff;
  --card-foreground: #0f172a;
  --popover: #ffffff;
  --popover-foreground: #0f172a;
  --muted: #f1f5f9;
  --muted-foreground: #64748b;
  --destructive: #ef4444;
  --destructive-foreground: #ffffff;
  --border: #e2e8f0;
  --input: #f8fafc;
  --ring: #f59e0b;
  --sidebar: #1e293b;
  --sidebar-foreground: #f1f5f9;
  --sidebar-primary: #f59e0b;
  --sidebar-primary-foreground: #1c0a00;
  --sidebar-accent: #334155;
  --sidebar-accent-foreground: #f1f5f9;
  --sidebar-border: #334155;
  --sidebar-ring: #f59e0b;
  --chart-1: #f59e0b;
  --chart-2: #8b5cf6;
  --chart-3: #10b981;
  --chart-4: #ef4444;
  --chart-5: #3b82f6;
}
```

**Test:**
1. File saves
2. Start dev server: `bun run dev`
3. Open browser DevTools
4. Run: `document.documentElement.setAttribute('data-theme', 'professional')`
5. Check colors changed in computed styles

**Dependencies:** None

---

### Task 1.4: Add professional theme dark mode CSS
**File:** `src/app/globals.css`
**Action:** Add `.dark[data-theme="professional"]` block
**Lines:** +35
**Time:** 8 min

**Location:** After Task 1.3 CSS block

```css
/* ============================================
   🏢 PROFESSIONAL THEME - DARK MODE
   ============================================ */
.dark[data-theme="professional"] {
  --primary: #f59e0b;
  --primary-foreground: #1c0a00;
  --secondary: #1e293b;
  --secondary-foreground: #e2e8f0;
  --accent: #7c3aed;
  --accent-foreground: #ffffff;
  --background: #0f172a;
  --foreground: #f8fafc;
  --card: #1e293b;
  --card-foreground: #f1f5f9;
  --popover: #1e293b;
  --popover-foreground: #f1f5f9;
  --muted: #1e293b;
  --muted-foreground: #94a3b8;
  --destructive: #dc2626;
  --destructive-foreground: #ffffff;
  --border: #334155;
  --input: #1e293b;
  --ring: #f59e0b;
  --sidebar: #020617;
  --sidebar-foreground: #f8fafc;
  --sidebar-primary: #f59e0b;
  --sidebar-primary-foreground: #1c0a00;
  --sidebar-accent: #1e293b;
  --sidebar-accent-foreground: #f8fafc;
  --sidebar-border: #1e293b;
  --sidebar-ring: #f59e0b;
}
```

**Test:**
1. File saves
2. In browser DevTools:
   ```js
   document.documentElement.setAttribute('data-theme', 'professional');
   document.documentElement.classList.add('dark');
   ```
3. Check dark mode colors applied

**Dependencies:** Task 1.3

---

### Task 1.5: Verify theme appears in customizer
**File:** No change (verification only)
**Action:** Test theme switcher UI
**Time:** 5 min

**Steps:**
1. Start app: `bun run dev`
2. Login as admin
3. Open theme customizer (sidebar → ปรับแต่งธีม)
4. Click professional theme button
5. Verify colors change immediately

**Expected Result:**
- Professional theme button appears
- Clicking it changes colors to amber/slate
- Dark mode toggle still works
- No console errors

**Dependencies:** Tasks 1.1-1.4

---

### Task 1.6: Test all pages with professional theme
**File:** No change (verification only)
**Action:** Manual smoke test
**Time:** 10 min

**Test Checklist:**
- [ ] Dashboard loads with amber accents
- [ ] Invoice list shows amber primary buttons
- [ ] Sidebar has dark background (#1e293b)
- [ ] Cards have white background
- [ ] Text is readable (slate-900)
- [ ] Charts show amber/violet colors
- [ ] Dialog backgrounds correct

**Dependencies:** Task 1.5

---

### Task 1.7: Test dark mode with professional theme
**File:** No change (verification only)
**Action:** Toggle dark mode, verify
**Time:** 5 min

**Steps:**
1. Open theme customizer
2. Select professional theme
3. Toggle dark mode on
4. Check: background is slate-900 (#0f172a)
5. Check: text is light (slate-50)
6. Check: sidebar is slate-950 (#020617)
7. Navigate to different pages
8. Verify dark mode persists

**Dependencies:** Task 1.6

---

### Task 1.8: Git commit Phase 1
**File:** Git
**Action:** Commit professional theme
**Time:** 2 min

```bash
git add src/stores/theme-store.ts src/app/globals.css
git commit -m "feat: add professional amber theme option

- Add 'professional' to ThemeVariant type
- Add amber/slate color scheme for enterprise users
- Implement light mode with #F59E0B primary
- Implement dark mode with OLED-optimized #0F172A
- Keep all 7 pastel themes unchanged

Phase 1 of 8: Professional Theme
Reference: PROFESSIONAL_THEME_PLAN.md"
```

**Dependencies:** Tasks 1.1-1.7

---

## 📱 Phase 2: Mobile Sidebar Drawer (10 tasks, ~3 hours)

### Task 2.1: Import Sheet component
**File:** `src/app/page.tsx`
**Action:** Add Sheet import
**Lines:** +1
**Time:** 2 min

```typescript
// Add to imports (around line 40):
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
```

**Test:** File saves, no import errors
**Dependencies:** None

---

### Task 2.2: Add mobile menu state
**File:** `src/app/page.tsx`
**Action:** Add useState for mobile menu
**Lines:** +1
**Time:** 2 min

```typescript
// Add in HomePage component (after other useState):
const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
```

**Test:** File saves, no TypeScript errors
**Dependencies:** None

---

### Task 2.3: Add hamburger menu button
**File:** `src/app/page.tsx`
**Action:** Add menu button for mobile only
**Lines:** +20
**Time:** 10 min

**Location:** In return statement, before main layout div

```tsx
// Add before the main layout:
{session && (
  <div className="md:hidden fixed top-4 left-4 z-50">
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetTrigger asChild>
        <button
          className="p-2 bg-background border border-border rounded-lg shadow-sm"
          aria-label="เปิดเมนู"
        >
          <Menu size={24} className="text-foreground" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-80">
        <KeeratiSidebar
          activeModule={activeModule}
          setActiveModule={setActiveModule}
          userRole={userRole}
          userName={userName}
          onLogout={handleLogout}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />
      </SheetContent>
    </Sheet>
  </div>
)}
```

**Test:**
1. File saves
2. Check: Menu icon imports (need to add to imports)
3. Note: Task 2.4 will fix Menu import

**Dependencies:** Tasks 2.1, 2.2

---

### Task 2.4: Add Menu icon import
**File:** `src/app/page.tsx`
**Action:** Add Menu to lucide-react imports
**Lines:** +1
**Time:** 2 min

```typescript
// Add to lucide-react imports (around line 45):
import {
  // ... existing imports
  Menu,  // ADD THIS
} from 'lucide-react'
```

**Test:** File saves, no import errors
**Dependencies:** Task 2.3

---

### Task 2.5: Add onCloseMobile prop to sidebar
**File:** `src/components/layout/keerati-sidebar.tsx`
**Action:** Add optional callback prop
**Lines:** +3
**Time:** 3 min

```typescript
// Add to SidebarProps interface (around line 200):
interface SidebarProps {
  activeModule: Module
  setActiveModule: (module: Module) => void
  userRole?: string
  userName?: string
  onLogout?: () => void
  onCloseMobile?: () => void  // ADD THIS
}
```

**Test:** File saves, no TypeScript errors
**Dependencies:** None

---

### Task 2.6: Call onCloseMobile when navigating
**File:** `src/components/layout/keerati-sidebar.tsx`
**Action:** Close drawer on menu item click
**Lines:** +1
**Time:** 3 min

**Location:** Find handleModuleClick function or where setActiveModule is called

```typescript
// When module is clicked (find the onClick handler):
onClick={() => {
  setActiveModule(item.id)
  onCloseMobile?.()  // ADD THIS
}}
```

**Test:** File saves
**Dependencies:** Task 2.5

---

### Task 2.7: Hide sidebar on mobile, show on desktop
**File:** `src/app/page.tsx`
**Action:** Add responsive classes to sidebar wrapper
**Lines:** Change 1 line
**Time:** 2 min

**Location:** Find where KeeratiSidebar is rendered (not in Sheet)

```tsx
// BEFORE:
<div className="flex">

// AFTER:
<div className="flex hidden md:flex">
```

OR if sidebar needs conditional rendering:
```tsx
// Show regular sidebar on desktop only:
{session && (
  <div className="hidden md:block">
    <KeeratiSidebar
      activeModule={activeModule}
      setActiveModule={setActiveModule}
      userRole={userRole}
      userName={userName}
      onLogout={handleLogout}
    />
  </div>
)}
```

**Test:** File saves
**Dependencies:** None

---

### Task 2.8: Add top spacing for mobile menu button
**File:** `src/app/page.tsx`
**Action:** Add padding-top on mobile only
**Lines:** Change 1 line
**Time:** 2 min

**Location:** Find main content area

```tsx
// BEFORE:
<main className="flex-1">

// AFTER:
<main className="flex-1 md:pt-0 pt-16">
```

**Test:** File saves
**Dependencies:** None

---

### Task 2.9: Test mobile menu on real device
**File:** No change (verification only)
**Action:** Manual mobile test
**Time:** 15 min

**Test Steps:**
1. Open browser DevTools
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select iPhone SE (375×667)
4. Reload page
5. Verify: Sidebar hidden
6. Verify: Hamburger button visible (top-left)
7. Click hamburger button
8. Verify: Drawer opens from left
9. Verify: Sidebar visible inside drawer
10. Click menu item (e.g., Dashboard)
11. Verify: Drawer closes
12. Verify: Navigates to clicked module

**Desktop Check:**
1. Resize to >768px width
2. Verify: Sidebar visible normally
3. Verify: Hamburger button hidden

**Dependencies:** Tasks 2.1-2.8

---

### Task 2.10: Git commit Phase 2
**File:** Git
**Action:** Commit mobile drawer
**Time:** 2 min

```bash
git add src/app/page.tsx src/components/layout/keerati-sidebar.tsx
git commit -m "feat: add mobile sidebar drawer with Sheet component

- Add hamburger menu button for mobile (<768px)
- Wrap sidebar in Sheet drawer on mobile
- Auto-close drawer on navigation
- Keep regular sidebar on desktop (md+)
- Add top spacing for mobile menu button

Phase 2 of 8: Mobile Sidebar
Reference: PROFESSIONAL_THEME_PLAN.md"
```

**Dependencies:** Tasks 2.1-2.9

---

## 📊 Phase 3: Table Horizontal Scroll (20 tasks, ~1 hour)

### Task 3.1: Add ScrollArea to invoice list
**File:** `src/components/invoices/invoice-list.tsx`
**Action:** Wrap Table with ScrollArea
**Lines:** +3
**Time:** 3 min

```tsx
// Add import at top:
import { ScrollArea } from '@/components/ui/scroll-area'

// Wrap the Table:
<ScrollArea className="w-full">
  <Table>
    {/* existing table content */}
  </Table>
</ScrollArea>
```

**Test:**
1. File saves
2. Go to Invoice list
3. Resize browser to <768px
4. Verify: Table scrolls horizontally
5. Verify: Page doesn't scroll horizontally

**Dependencies:** None

---

### Task 3.2: Add ScrollArea to customer list
**File:** `src/components/ar/customer-list.tsx`
**Action:** Same as Task 3.1
**Lines:** +3
**Time:** 3 min

**Dependencies:** None

---

### Task 3.3: Add ScrollArea to vendor list
**File:** `src/components/ap/vendor-list.tsx`
**Action:** Same as Task 3.1
**Lines:** +3
**Time:** 3 min

**Dependencies:** None

---

### Task 3.4: Add ScrollArea to product list
**File:** `src/components/products/products-page.tsx`
**Action:** Same as Task 3.1
**Lines:** +3
**Time:** 3 min

**Dependencies:** None

---

### Task 3.5: Add ScrollArea to quotation list
**File:** `src/components/quotations/quotation-list.tsx`
**Action:** Same as Task 3.1
**Lines:** +3
**Time:** 3 min

**Dependencies:** None

---

### Task 3.6: Add ScrollArea to receipt list
**File:** `src/components/receipts/receipt-list.tsx`
**Action:** Same as Task 3.1
**Lines:** +3
**Time:** 3 min

**Dependencies:** None

---

### Task 3.7: Add ScrollArea to payment list
**File:** `src/components/payments/payment-list.tsx`
**Action:** Same as Task 3.1
**Lines:** +3
**Time:** 3 min

**Dependencies:** None

---

### Task 3.8: Add ScrollArea to credit note list
**File:** `src/components/credit-notes/credit-note-list.tsx`
**Action:** Same as Task 3.1
**Lines:** +3
**Time:** 3 min

**Dependencies:** None

---

### Task 3.9: Add ScrollArea to debit note list
**File:** `src/components/debit-notes/debit-note-list.tsx`
**Action:** Same as Task 3.1
**Lines:** +3
**Time:** 3 min

**Dependencies:** None

---

### Task 3.10: Add ScrollArea to purchase list
**File:** `src/components/purchases/purchase-list.tsx`
**Action:** Same as Task 3.1
**Lines:** +3
**Time:** 3 min

**Dependencies:** None

---

### Task 3.11: Add ScrollArea to purchase request list
**File:** `src/components/purchase-requests/purchase-request-list.tsx`
**Action:** Same as Task 3.1
**Lines:** +3
**Time:** 3 min

**Dependencies:** None

---

### Task 3.12: Add ScrollArea to purchase order list
**File:** `src/components/purchase-orders/purchase-order-list.tsx`
**Action:** Same as Task 3.1
**Lines:** +3
**Time:** 3 min

**Dependencies:** None

---

### Task 3.13: Add ScrollArea to employee list
**File:** `src/components/employees/employee-list.tsx` (if exists)
**Action:** Same as Task 3.1
**Lines:** +3
**Time:** 3 min

**Dependencies:** None

---

### Task 3.14: Add ScrollArea to payroll list
**File:** `src/components/payroll/payroll-page.tsx` (find table section)
**Action:** Same as Task 3.1
**Lines:** +3
**Time:** 3 min

**Dependencies:** None

---

### Task 3.15: Add ScrollArea to assets list
**File:** `src/components/assets/assets-page.tsx` (find table section)
**Action:** Same as Task 3.1
**Lines:** +3
**Time:** 3 min

**Dependencies:** None

---

### Task 3.16: Add ScrollArea to banking page
**File:** `src/components/banking/banking-page.tsx` (find table section)
**Action:** Same as Task 3.1
**Lines:** +3
**Time:** 3 min

**Dependencies:** None

---

### Task 3.17: Add ScrollArea to petty cash vouchers
**File:** `src/components/petty-cash/petty-cash-page.tsx` (find table section)
**Action:** Same as Task 3.1
**Lines:** +3
**Time:** 3 min

**Dependencies:** None

---

### Task 3.18: Add ScrollArea to warehouse list
**File:** `src/components/inventory/warehouse-list.tsx` (if exists)
**Action:** Same as Task 3.1
**Lines:** +3
**Time:** 3 min

**Dependencies:** None

---

### Task 3.19: Add ScrollArea to stock take list
**File:** `src/components/stock-takes/stock-take-list.tsx` (if exists)
**Action:** Same as Task 3.1
**Lines:** +3
**Time:** 3 min

**Dependencies:** None

---

### Task 3.20: Git commit Phase 3
**File:** Git
**Action:** Commit all table scroll changes
**Time:** 5 min

```bash
git add src/components/
git commit -m "feat: add horizontal scroll to all table lists

- Wrap all Table components with ScrollArea
- Enable horizontal scroll on mobile
- Prevent page-level horizontal scroll
- Affects 20+ list components

Phase 3 of 8: Table Horizontal Scroll
Reference: PROFESSIONAL_THEME_PLAN.md"
```

**Dependencies:** Tasks 3.1-3.19

---

## 🎯 Phase 4: Dialog Mobile Sizing (50 tasks, ~2 hours)

**Pattern:** Same task applied to 50+ dialog components

### Task 4.1: Fix invoice edit dialog
**File:** `src/components/invoices/invoice-edit-dialog.tsx`
**Action:** Add responsive classes to DialogContent
**Lines:** Change 1 line
**Time:** 2 min

```tsx
// BEFORE:
<DialogContent>

// AFTER:
<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
```

**Test:**
1. Open invoice edit dialog on mobile (375px)
2. Verify: Dialog fits in viewport
3. Verify: Content scrolls if needed
4. Verify: Desktop still shows lg width

**Dependencies:** None

---

### Task 4.2: Fix customer edit dialog
**File:** `src/components/ar/customer-edit-dialog.tsx`
**Action:** Same as Task 4.1
**Time:** 2 min

**Dependencies:** None

---

### Task 4.3-4.50: Repeat for all dialogs
**Files:** All edit/create dialog components
**Action:** Same pattern
**Time:** 2 min each

**Files to update:**
- `src/components/ap/vendor-edit-dialog.tsx`
- `src/components/products/product-edit-dialog.tsx`
- `src/components/assets/asset-edit-dialog.tsx`
- `src/components/banking/bank-account-edit-dialog.tsx`
- `src/components/banking/cheque-edit-dialog.tsx`
- `src/components/employees/employee-edit-dialog.tsx`
- `src/components/payroll/payroll-edit-dialog.tsx`
- `src/components/petty-cash/fund-edit-dialog.tsx`
- `src/components/petty-cash/voucher-edit-dialog.tsx`
- `src/components/inventory/warehouse-edit-dialog.tsx`
- `src/components/inventory/stock-adjustment-dialog.tsx`
- `src/components/inventory/stock-take-create-dialog.tsx`
- `src/components/settings/settings-dialog.tsx`
- `src/components/users/user-edit-dialog.tsx`
- And 30+ more...

**Batch script approach:**
```bash
# Find all dialog components:
grep -r "DialogContent" src/components/ --include="*.tsx" -l
```

---

### Task 4.51: Git commit Phase 4
**File:** Git
**Action:** Commit all dialog fixes
**Time:** 5 min

```bash
git add src/components/
git commit -m "feat: add mobile responsive sizing to all dialogs

- Add max-h-[90vh] and overflow-y-auto to all DialogContent
- Add sm:max-w-lg for desktop responsive width
- Ensures dialogs fit in mobile viewport
- Affects 50+ dialog components

Phase 4 of 8: Dialog Mobile Sizing
Reference: PROFESSIONAL_THEME_PLAN.md"
```

---

## 📝 Phase 5: Form Grid Collapse (30 tasks, ~1 hour)

**Pattern:** Change all `grid-cols-2` to responsive `grid-cols-1 sm:grid-cols-2`

### Task 5.1: Fix invoice form grid
**File:** `src/components/invoices/invoice-form.tsx`
**Action:** Find and replace grid classes
**Lines:** Change multiple lines
**Time:** 3 min

```bash
# In file, find all:
grid-cols-2

# Replace with:
grid-cols-1 sm:grid-cols-2
```

**Test:**
1. Open invoice form on mobile (375px)
2. Verify: Fields stack in single column
3. Open on desktop (>768px)
4. Verify: Fields in two columns

**Dependencies:** None

---

### Task 5.2-5.30: Repeat for all form components
**Files:** All components with form grids
**Action:** Same pattern
**Time:** 3 min each

**Files to update:**
- `src/components/invoices/invoice-form.tsx`
- `src/components/receipts/receipt-form.tsx`
- `src/components/payments/payment-form.tsx`
- `src/components/purchases/purchase-form.tsx`
- `src/components/customers/customer-edit-dialog.tsx` (form section)
- `src/components/vendors/vendor-edit-dialog.tsx` (form section)
- `src/components/employees/employee-edit-dialog.tsx` (form section)
- `src/components/products/product-edit-dialog.tsx` (form section)
- And 20+ more...

**Batch script approach:**
```bash
# Find all files with grid-cols-2:
grep -r "grid-cols-2" src/components/ --include="*.tsx" -l

# Manual search/replace in each file
```

---

### Task 5.31: Git commit Phase 5
**File:** Git
**Action:** Commit all form grid fixes
**Time:** 5 min

```bash
git add src/components/
git commit -m "feat: make all form grids responsive

- Change grid-cols-2 to grid-cols-1 sm:grid-cols-2
- Forms stack on mobile, 2-column on desktop
- Affects 30+ form components

Phase 5 of 8: Form Grid Collapse
Reference: PROFESSIONAL_THEME_PLAN.md"
```

---

## 🖱️ Phase 6: Touch Target Audit & Fix (100+ tasks, ~3 hours)

**Pattern:** Find all buttons/icon-buttons, ensure min 44×44px

### Task 6.1: Audit invoice list actions
**File:** `src/components/invoices/invoice-list.tsx`
**Action:** Find all buttons, check sizes
**Time:** 5 min

**Checklist:**
- [ ] Edit button ≥44px height
- [ ] Delete button ≥44px height
- [ ] View button ≥44px height
- [ ] Icon buttons have padding

**Fix pattern:**
```tsx
// BEFORE (too small):
<Button size="sm">Edit</Button>

// AFTER (touch-friendly):
<Button size="sm" className="min-h-[44px]">Edit</Button>

// OR for icon buttons:
<button className="p-3 min-w-[44px] min-h-[44px]">
  <Icon size={20} />
</button>
```

**Dependencies:** None

---

### Task 6.2-6.100: Audit and fix all interactive elements
**Files:** All components with buttons/links
**Action:** Same pattern
**Time:** 2-5 min per file

**Priority files:**
1. All list components (action buttons)
2. All forms (submit buttons)
3. All tables (row actions)
4. Navigation (menu items)
5. Toolbars (action buttons)

**Testing:**
- Visual check: Buttons look reasonably sized
- Manual check: Can easily tap with finger

---

### Task 6.101: Git commit Phase 6
**File:** Git
**Action:** Commit all touch target fixes
**Time:** 5 min

```bash
git add src/components/
git commit -m "feat: ensure all touch targets meet 44px minimum

- Add min-h-[44px] to all buttons
- Add padding to icon buttons for 44x44px touch area
- Improves mobile accessibility
- Affects 100+ interactive elements

Phase 6 of 8: Touch Target Audit
Reference: PROFESSIONAL_THEME_PLAN.md"
```

---

## 🎨 Phase 7: Status Badge Standardization (Optional, 20 tasks, ~1 hour)

### Task 7.1: Create StatusBadge component
**File:** `src/components/ui/status-badge.tsx`
**Action:** New component file
**Lines:** +80
**Time:** 15 min

```tsx
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
  type: 'invoice' | 'payment' | 'document' | 'employee'
  className?: string
}

export function StatusBadge({ status, type, className }: StatusBadgeProps) {
  const badgeConfig: Record<string, { variant: any; className: string }> = {
    DRAFT: { variant: 'outline', className: 'text-slate-500' },
    ISSUED: { variant: 'secondary', className: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
    PAID: { variant: 'secondary', className: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
    CANCELLED: { variant: 'destructive' },
    POSTED: { variant: 'secondary', className: 'text-violet-600 bg-violet-50' },
    REVERSED: { variant: 'outline', className: 'text-orange-500' },
  }

  const config = badgeConfig[status] || { variant: 'outline', className: '' }

  return (
    <Badge variant={config.variant} className={cn(config.className, className)}>
      {status}
    </Badge>
  )
}
```

**Test:** Component renders without errors
**Dependencies:** None

---

### Task 7.2-7.20: Replace inline badges with StatusBadge
**Files:** All components with status badges
**Action:** Find and replace hardcoded badge styles
**Time:** 3 min each

**Example:**
```tsx
// BEFORE:
<Badge className="bg-blue-100 text-blue-800">{status}</Badge>

// AFTER:
<StatusBadge status={status} type="invoice" />
```

---

## ✅ Phase 8: Testing & Documentation (5 tasks, ~2 hours)

### Task 8.1: Create automated contrast test
**File:** `e2e/contrast-audit.spec.ts`
**Action:** New test file
**Lines:** +50
**Time:** 20 min

```typescript
import { test, expect } from '@playwright/test';

test.describe('Color Contrast Audit', () => {
  const themes = ['default', 'mint', 'lavender', 'peach', 'sky', 'lemon', 'coral', 'professional'];
  const modes = ['light', 'dark'];

  themes.forEach(theme => {
    modes.forEach(mode => {
      test(`contrast: ${theme} theme in ${mode} mode`, async ({ page }) => {
        await page.goto('http://localhost:3000');

        // Set theme
        await page.evaluate(
          ({ theme, mode }) => {
            document.documentElement.setAttribute('data-theme', theme);
            if (mode === 'dark') document.documentElement.classList.add('dark');
          },
          { theme, mode }
        );

        // Wait for theme to apply
        await page.waitForTimeout(500);

        // Run accessibility scan
        const violations = await page.accessibility.scan().then(r => r.violations);

        // Filter for contrast violations only
        const contrastViolations = violations.filter(
          v => v.id === 'color-contrast' || v.id === 'color-contrast-enhanced'
        );

        expect(contrastViolations).toEqual([]);
      });
    });
  });
});
```

**Test:** Run `bun run test:contrast`
**Dependencies:** None

---

### Task 8.2: Manual mobile test checklist
**File:** No change (testing only)
**Action:** Test all phases on real device
**Time:** 30 min

**Checklist:**
- [ ] Professional theme appears in customizer
- [ ] Professional theme switches correctly
- [ ] Mobile drawer opens/closes
- [ ] All tables scroll horizontally
- [ ] All dialogs fit in viewport
- [ ] All forms stack on mobile
- [ ] All buttons tappable
- [ ] Dark mode works with professional theme
- [ ] All 8 themes work in light mode
- [ ] All 8 themes work in dark mode

---

### Task 8.3: Update CLAUDE.md
**File:** `CLAUDE.md`
**Action:** Document new theme and mobile features
**Lines:** +20
**Time:** 10 min

**Add to "Theme System" section:**
```markdown
### Theme Options (8 total)

#### Pastel Themes (7)
1. Pink Blossom (default)
2. Fresh Mint
3. Lavender Dream
4. Sweet Peach
5. Sky Blue
6. Lemon Zest
7. Coral Reef

#### Professional Theme (1)
8. Professional Amber - Enterprise-friendly design
   - Light mode: Amber primary (#F59E0B), slate background
   - Dark mode: OLED-optimized slate-900 (#0F172A)
   - Always-dark sidebar (#1E293B)
```

**Add to "Mobile Responsiveness" section:**
```markdown
### Mobile Support
- Sidebar drawer (<768px) with hamburger menu
- Horizontal scroll for all tables
- Responsive dialog sizing (max-h-90vh)
- Stacked form grids on mobile
- Touch targets ≥44px
```

---

### Task 8.4: Final smoke test
**File:** No change (testing only)
**Action:** Run full test suite
**Time:** 20 min

```bash
# Run smoke tests
bun run test:quick

# Run contrast audit
bun run test:contrast

# Manual verification
# - Login works
# - All modules accessible
# - Theme switcher works
# - Mobile drawer works
```

---

### Task 8.5: Git commit final changes
**File:** Git
**Action:** Commit tests and docs
**Time:** 2 min

```bash
git add e2e/ CLAUDE.md PROFESSIONAL_THEME_PLAN.md CONTRAST_AUDIT.md
git commit -m "test: add contrast audit and update documentation

- Add automated contrast test for all 8 themes
- Document professional theme in CLAUDE.md
- Add mobile responsiveness documentation

Phase 8 of 8: Testing & Documentation
Reference: PROFESSIONAL_THEME_PLAN.md"
```

---

## 📊 Task Summary

| Phase | Tasks | Files | Time | Risk |
|-------|-------|-------|------|------|
| 1 - Professional Theme | 8 | 2 | 2h | LOW |
| 2 - Mobile Drawer | 10 | 2 | 3h | MEDIUM |
| 3 - Table Scroll | 20 | 20+ | 1h | LOW |
| 4 - Dialog Sizing | 51 | 50+ | 2h | LOW |
| 5 - Form Grid | 31 | 30+ | 1h | LOW |
| 6 - Touch Targets | 101 | 100+ | 3h | LOW |
| 7 - Badges (optional) | 20 | 20+ | 1h | LOW |
| 8 - Testing | 5 | 3 | 2h | LOW |
| **TOTAL** | **246** | **~230** | **15h** | **LOW-MEDIUM** |

---

## 🚀 Recommended Execution Order

### Day 1: Foundation (3 hours)
- Tasks 1.1-1.8: Professional theme complete ✅
- Test thoroughly, commit

### Day 2: Mobile Critical (4 hours)
- Tasks 2.1-2.10: Mobile drawer complete ✅
- Tasks 3.1-3.20: Table scroll complete ✅
- Test on real device, commit

### Day 3: Polish (3 hours)
- Tasks 4.1-4.51: Dialog sizing (batch) ✅
- Tasks 5.1-5.31: Form grids (batch) ✅
- Test and commit

### Day 4-5: Optional Polish (5 hours)
- Tasks 6.1-6.101: Touch targets ✅
- Tasks 7.1-7.20: Status badges ✅
- Tasks 8.1-8.5: Testing & docs ✅

---

## ✅ Task Acceptance Criteria

Each task is complete when:
1. ✅ File saves without errors
2. ✅ No TypeScript errors
3. ✅ No console errors in browser
4. ✅ Visual verification passes
5. ✅ Git commit created

---

## 🔄 How to Use This Breakdown

1. **Start at Task 1.1**
2. **Complete one task** (5-30 min)
3. **Test it** (verify it works)
4. **Commit it** (git commit with task ID)
5. **Move to next task**

**Benefits:**
- ✅ Small changes = low risk
- ✅ Each commit tested independently
- ✅ Easy to rollback if needed
- ✅ Can stop at any task
- ✅ Clear progress tracking

---

**Ready to start? Begin with Task 1.1!** 🚀
