# Thai Accounting ERP — UI Upgrade Plan

> Design system persisted in `design-system/thai-accounting-erp/MASTER.md` Dev
> server fix: `src/app/api/vendors/route.ts:97` — restored missing
> `if (error instanceof AuthError ||`

---

## Design System Decision

After analysis, the ERP uses a **pastel pink** light-mode theme with Quicksand
font. The skill recommends shifting to:

| Token             | Current                | Target                                    |
| ----------------- | ---------------------- | ----------------------------------------- |
| Font              | Quicksand              | IBM Plex Sans (financial, trustworthy)    |
| Primary           | `#ffb6c1` (light pink) | `#F59E0B` (amber-gold, trust signal)      |
| Background (dark) | `#1a1a2e` navy         | `#0F172A` slate-900 (OLED-optimized)      |
| Style             | Pastel playful         | Data-Dense Dashboard + optional OLED dark |
| Accent            | Pink pastels           | Amber gold + violet CTA                   |

**Approach:** Implement as a new default theme while keeping the existing theme
customizer (users can still switch). Light mode gets a clean professional
neutral base; dark mode gets the OLED-optimized deep slate.

---

## Phase 0 — Dev Server & Foundation (Pre-requisite)

### Task 0.1 — Fix dev server (DONE)

- **File:** `src/app/api/vendors/route.ts:97`
- **Fix:** Restored `if (error instanceof AuthError ||` on line 97
- **Status:** ✅ Complete — server returns 200

### Task 0.2 — Audit all API route catch blocks

- Grep every `route.ts` for `} catch (error` blocks missing `if (` on the
  condition line
- Pattern to check: any line starting with `(error instanceof` not preceded by
  `if`
- **Files:** All `src/app/api/**/route.ts`

---

## Phase 1 — Design Token & Font Overhaul

### Task 1.1 — Replace font: Quicksand → IBM Plex Sans

- **File:** `src/app/layout.tsx`
- Remove `Quicksand` and `JetBrains Mono` Google Font imports
- Add `IBM_Plex_Sans` import (weights 300/400/500/600/700, latin+thai subsets)
- Keep `JetBrains Mono` as mono fallback for code/numbers only
- Update CSS variable `--font-quicksand` → `--font-ibm-plex`
- Update `body` style fontFamily reference

### Task 1.2 — Redesign CSS variables: light mode

- **File:** `src/app/globals.css`
- Replace pastel-pink defaults in `:root` with professional neutral:
  ```css
  --background: #fafafa /* near-white neutral */ --foreground: #0f172a
    /* slate-900 */ --card: #ffffff --primary: #f59e0b
    /* amber-500, trust gold */ --primary-foreground: #1c0a00
    --secondary: #f1f5f9 /* slate-100 */ --secondary-foreground: #0f172a
    --muted: #f1f5f9 --muted-foreground: #64748b /* slate-500 */
    --accent: #8b5cf6 /* violet-500, CTA */ --accent-foreground: #ffffff
    --destructive: #ef4444 --border: #e2e8f0 /* slate-200 */ --input: #f8fafc
    --ring: #f59e0b --sidebar: #1e293b /* slate-800 — dark sidebar always */
    --sidebar-foreground: #f1f5f9 --sidebar-primary: #f59e0b
    --sidebar-accent: #334155 /* slate-700 */ --sidebar-border: #334155;
  ```

### Task 1.3 — Redesign CSS variables: dark mode

- **File:** `src/app/globals.css` — `.dark` block
- Update dark mode to OLED-optimized:
  ```css
  --background: #0f172a /* slate-900 */ --foreground: #f8fafc /* slate-50 */
    --card: #1e293b /* slate-800 */ --card-foreground: #f1f5f9
    --primary: #f59e0b /* same amber */ --muted: #1e293b
    --muted-foreground: #94a3b8 /* slate-400 */ --border: #334155
    /* slate-700 */ --sidebar: #020617 /* slate-950 */ --sidebar-accent: #1e293b
    --sidebar-border: #1e293b;
  ```

### Task 1.4 — Remove/replace pastel utility classes

- **File:** `src/app/globals.css`
- Remove: `.text-gradient-pastel`, `.bg-gradient-pastel`, `.bg-pastel-card`,
  `.hover-lift`, `.shadow-pastel`, `.shadow-pastel-lg`, `.border-pastel`,
  `.glass-pastel`
- Replace `.glass-pastel` with `.glass-card`:
  `bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-700/60`
- Remove `--color-pastel-*` custom tokens from `@theme`
- Add professional tokens: `--color-amber-*`, `--color-violet-*`,
  `--color-slate-*`

### Task 1.5 — Update theme color variants in themeStore

- **File:** `src/stores/` (find the theme store file)
- Replace 8 pastel variants with professional ERP themes: `default`
  (amber/slate), `blue` (corporate), `green` (growth), `violet` (tech), `rose`
  (alerts), `neutral` (minimal)
- Update `[data-theme="..."]` CSS blocks in `globals.css` to match

---

## Phase 2 — Sidebar Redesign

### Task 2.1 — Dark sidebar always-on (remove light sidebar)

- **File:** `src/components/layout/keerati-sidebar.tsx`
- The sidebar should always use dark theme (`--sidebar: #1e293b`) regardless of
  page light/dark mode — this is the standard ERP pattern (VS Code, Linear,
  Notion)
- Remove conditional sidebar background classes
- Apply `bg-[#1e293b]` / `dark:bg-[#020617]` directly

### Task 2.2 — Replace group color coding with neutral icons

- **File:** `src/components/layout/keerati-sidebar.tsx`
- Current: each menu group has a distinct color (rose, amber, emerald, blue,
  violet, cyan, indigo, slate)
- Target: single amber `--sidebar-primary` for active state; all inactive items
  use `--sidebar-foreground` at 70% opacity
- Keep group headers as small uppercase labels (Thai text)
- Active item: amber left border + amber text + amber icon + `bg-amber-500/10`
- Hover item: `bg-slate-700/50` (subtle)

### Task 2.3 — Improve sidebar typography & spacing

- **File:** `src/components/layout/keerati-sidebar.tsx`
- Group labels:
  `text-[10px] font-semibold tracking-widest uppercase text-slate-400 px-4 pt-4 pb-1`
- Menu items: `text-[13px] font-medium`
- Icon size: standardize to `w-4 h-4` (16px) with `mr-3`
- Collapsed sidebar: icon-only with tooltip (already built, just restyle)

### Task 2.4 — Sidebar header / user avatar section

- **File:** `src/components/layout/keerati-sidebar.tsx`
- Move company logo/name to top with `text-base font-semibold text-white`
- User avatar at bottom: show name + role badge + logout button
- Role badge: ADMIN=amber, ACCOUNTANT=blue, USER=slate, VIEWER=slate-muted

### Task 2.5 — Move theme customizer out of sidebar

- **File:** `src/components/layout/keerati-sidebar.tsx`
- Extract theme customizer `<Dialog>` to its own component
  `src/components/layout/theme-customizer.tsx`
- Access via a Settings gear icon at the bottom of the sidebar, not a full
  dialog trigger blocking nav
- Simplifies sidebar code by ~100 lines

---

## Phase 3 — Top Bar / Header

### Task 3.1 — Add a persistent top bar

- **File:** `src/app/page.tsx` (layout area)
- Add `<TopBar>` component: `src/components/layout/top-bar.tsx`
- Contents: breadcrumb (module name in Thai), global search `<Command>`,
  notifications bell, user menu
- Height: `h-14` (`56px`), `border-b border-slate-200 dark:border-slate-700`
- Background: `bg-white dark:bg-slate-900`

### Task 3.2 — Global Command Palette search

- **File:** `src/components/layout/top-bar.tsx`
- Use existing shadcn `<Command>` component (already installed)
- `Ctrl+K` / `Cmd+K` shortcut opens modal search
- Search across: module names, recent documents (invoices, customers)
- Navigate to module on selection via `setActiveModule()`

### Task 3.3 — Breadcrumb navigation

- **File:** `src/components/layout/top-bar.tsx`
- Use existing shadcn `<Breadcrumb>` component
- Map `activeModule` → Thai display name + parent group
- e.g. `หน้าหลัก` for dashboard, `งานขาย / ใบแจ้งหนี้` for invoices

---

## Phase 4 — Dashboard Page Upgrade

### Task 4.1 — KPI card redesign

- **File:** `src/components/dashboard/dashboard.tsx` (or wherever dashboard
  lives)
- Current: colored `rounded-xl` with icon + value
- Target: `Card` with `CardHeader` + `CardContent`, number in
  `text-2xl font-semibold tabular-nums`, trend badge using `Badge` variant
- Use `text-emerald-500` / `text-red-500` for up/down trends
- Add sparkline (tiny inline Recharts `LineChart`) inside each KPI card

### Task 4.2 — Dashboard chart redesign

- **File:** dashboard component
- Replace raw Tailwind color strings (`#ff6384`) with CSS variable tokens
- Recharts: set `stroke="hsl(var(--primary))"` and use `--chart-1` through
  `--chart-5` tokens
- Add `ResponsiveContainer` if not already wrapping all charts
- Revenue chart: `AreaChart` instead of `BarChart` for smoother feel
- Add `CartesianGrid strokeDasharray="3 3" className="stroke-muted"`

### Task 4.3 — Dashboard layout: 12-column grid

- **File:** dashboard component
- Replace flex-based layout with CSS Grid: `grid grid-cols-12 gap-4`
- KPI cards: `col-span-3` (4 across on desktop), `col-span-6` on tablet,
  `col-span-12` on mobile
- Revenue chart: `col-span-8`
- Pie/donut: `col-span-4`
- Recent activity table: `col-span-12`

### Task 4.4 — Recent activity table

- **File:** dashboard component
- Use shadcn `<Table>` with `TableHeader`, `TableBody`, `TableRow`, `TableCell`
- Status `<Badge>` variants: map document statuses to
  `default`/`secondary`/`destructive`/`outline`
- Add `<Skeleton>` loading states with same grid layout

---

## Phase 5 — Data Table Standardization

All list pages (Invoices, Customers, Vendors, Products, etc.) use ad-hoc Table
implementations. Standardize them.

### Task 5.1 — Create `<DataTable>` base component

- **File:** `src/components/ui/data-table.tsx` (new)
- Wraps shadcn `<Table>` with: column definitions, pagination, sort headers,
  empty state
- Props: `columns`, `data`, `isLoading`, `pagination`, `onPageChange`
- Loading state: `<Skeleton>` rows matching column count
- Empty state: icon + Thai message "ไม่พบข้อมูล"

### Task 5.2 — Create `<DataTableToolbar>` component

- **File:** `src/components/ui/data-table-toolbar.tsx` (new)
- Standard top-of-table bar: search `<Input>` + filter `<Select>` + action
  `<Button>` (+ Create)
- Consistent placement and styling across all modules

### Task 5.3 — Migrate Invoice list to DataTable

- **File:** `src/components/invoices/invoice-list.tsx` (or similar)
- Replace custom table markup with `<DataTable>` + `<DataTableToolbar>`
- Define columns array with `header`, `accessorKey`, `cell` renderers

### Task 5.4 — Migrate Customers list to DataTable

- **File:** `src/components/ar/` (customer list component)

### Task 5.5 — Migrate Vendors list to DataTable

- **File:** `src/components/ap/` (vendor list component)

### Task 5.6 — Migrate Products list to DataTable

- **File:** `src/components/products/`

### Task 5.7 — Migrate remaining list pages to DataTable

- Journal entries, Receipts, Payments, Purchase Orders, Purchase Invoices,
  Credit Notes, Debit Notes, Employees, Payroll, Assets, Bank Accounts, Cheques,
  Petty Cash Vouchers

---

## Phase 6 — Status Badge Standardization

### Task 6.1 — Create `<StatusBadge>` component

- **File:** `src/components/ui/status-badge.tsx` (new)
- Accepts `status: string` and
  `type: 'invoice' | 'payment' | 'document' | 'employee'`
- Returns correctly styled `<Badge>` without hardcoded Tailwind color strings
- Use shadcn Badge `variant` + `className` based on status map:
  ```ts
  DRAFT     → variant="outline"  className="text-slate-500"
  ISSUED    → variant="secondary" className="text-blue-600 bg-blue-50 dark:bg-blue-900/20"
  PAID      → variant="secondary" className="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20"
  CANCELLED → variant="destructive"
  POSTED    → variant="secondary" className="text-violet-600 bg-violet-50"
  REVERSED  → variant="outline"  className="text-orange-500"
  ```

### Task 6.2 — Replace all ad-hoc status badge color strings

- Find every `bg-gray-100 text-gray-800`, `bg-blue-100 text-blue-800` etc.
  inline badge pattern
- Replace with `<StatusBadge status={...} type={...} />`
- **Scope:** all feature component files

---

## Phase 7 — Form & Dialog Standardization

### Task 7.1 — Audit existing form dialog pattern

- Read `src/components/ui/form-dialog.tsx` (custom component found in ui/)
- Verify it uses `<Dialog>`, `<DialogContent>`, `<DialogHeader>`,
  `<DialogTitle>`, `<DialogFooter>` from shadcn correctly

### Task 7.2 — Standardize form layout inside dialogs

- All edit dialogs: use `<Form>` from react-hook-form + shadcn `<FormField>`,
  `<FormItem>`, `<FormLabel>`, `<FormControl>`, `<FormMessage>`
- Grid layout: `grid grid-cols-2 gap-4` for two-column forms on desktop
- Required field indicator: `<span className="text-destructive ml-0.5">*</span>`
  after label

### Task 7.3 — Loading & submit button state

- All submit buttons: `disabled={isSubmitting}` + show
  `<Loader2 className="animate-spin" />` icon when loading
- Use `useFormState` / `isPending` from react-hook-form

### Task 7.4 — Standardize delete confirmation dialog

- Read `src/components/ui/delete-confirm-dialog.tsx`
- Ensure it uses `<AlertDialog>` (not `<Dialog>`) from shadcn — correct semantic
  for destructive actions
- Button order: Cancel (left, `variant="outline"`) | Delete (right,
  `variant="destructive"`)

---

## Phase 8 — Print / PDF Visual Upgrade

### Task 8.1 — Invoice PDF layout upgrade

- **File:** wherever `pdfkit-generator.ts` or invoice PDF API route is called
- Font: IBM Plex Sans (download and register TTF in `public/fonts/`)
- Layout: add company logo space at top-right, Thai address block top-left
- Color: amber `#F59E0B` for header bar, dark slate `#0F172A` for text
- Table: alternating `#F8FAFC` / `#FFFFFF` rows

### Task 8.2 — Receipt PDF layout upgrade

- Same treatment as invoice PDF

---

## Phase 9 — Mobile Responsiveness

### Task 9.1 — Sidebar mobile drawer

- **File:** `src/components/layout/keerati-sidebar.tsx`
- On mobile (`< 768px`): sidebar is hidden, accessible via hamburger `<Sheet>`
  (shadcn Drawer)
- Top bar hamburger button triggers `<Sheet side="left">`
- Already have `<Sheet>` installed in `src/components/ui/`

### Task 9.2 — Table horizontal scroll on mobile

- All `<Table>` wrappers: add `<ScrollArea className="w-full">` (shadcn) or
  `overflow-x-auto`
- Ensure no horizontal page scroll bleeds past table container

### Task 9.3 — Form dialogs on mobile

- `<DialogContent>`: add `className="max-h-[90vh] overflow-y-auto"` +
  `sm:max-w-lg`
- Two-column grids collapse to single column: `grid-cols-1 sm:grid-cols-2`

---

## Phase 10 — Accessibility & Polish

### Task 10.1 — Focus ring standardization

- `src/app/globals.css`: define `--ring` properly and verify
  `focus-visible:ring-2 focus-visible:ring-ring` applied to all interactive
  elements via shadcn base styles
- Test Tab navigation through sidebar, forms, tables

### Task 10.2 — Reduced motion support

- `src/app/globals.css`: add `@media (prefers-reduced-motion: reduce)` block
  disabling transitions and animations

### Task 10.3 — ARIA labels for icon-only buttons

- Find all `<Button size="icon">` or `<button>` with only an icon child
- Add `aria-label="..."` in Thai to each

### Task 10.4 — Color contrast audit

- Run Lighthouse accessibility audit on: Login, Dashboard, Invoice List, Invoice
  Form
- Fix any contrast failures (target WCAG AA 4.5:1 for normal text)

### Task 10.5 — Sonner toast theming

- **File:** `src/app/layout.tsx`
- `<Toaster richColors position="top-right" />` — verify `richColors` is set
  (maps success/error/warning to proper colors)

---

## Phase 11 — Performance

### Task 11.1 — Lazy-load heavy module components

- **File:** `src/app/page.tsx`
- Convert static imports to `React.lazy()` + `<Suspense>` for non-default
  modules
- Priority: Reports, Payroll, Assets (heaviest data dependencies)
- Keep Dashboard, Invoices, Receipts as eager imports (critical path)

### Task 11.2 — Skeleton screens for all data-fetching views

- Every module that fetches on mount: add `<Skeleton>` layout matching real
  content
- Currently: some modules show blank or spinner — replace with content-shaped
  skeletons

### Task 11.3 — Virtualize long lists

- Invoice list, Journal entries, Activity log can have 1000+ rows
- Wrap `<Table>` body with `@tanstack/react-virtual` for large datasets
- Threshold: enable virtualization when `data.length > 200`

---

## Implementation Order (Recommended)

```
Phase 0  → Already done (dev server fix)
Phase 1  → Design tokens + font (breaks nothing, unblocks all visual work)
Phase 2  → Sidebar (high visual impact, self-contained)
Phase 3  → Top bar (new component, additive)
Phase 6  → Status badges (small, high ROI across all pages)
Phase 4  → Dashboard (visible showpiece)
Phase 5  → DataTable (enables Phase 5.x migrations)
Phase 5.3-5.7 → List page migrations (repetitive, parallelizable)
Phase 7  → Form standardization
Phase 9  → Mobile
Phase 10 → Accessibility
Phase 8  → PDF
Phase 11 → Performance
```

---

## Files That Will Change

| Phase | Primary Files                                                    |
| ----- | ---------------------------------------------------------------- |
| 1     | `src/app/layout.tsx`, `src/app/globals.css`                      |
| 2     | `src/components/layout/keerati-sidebar.tsx`                      |
| 3     | `src/app/page.tsx`, new `src/components/layout/top-bar.tsx`      |
| 4     | Dashboard component                                              |
| 5     | New `src/components/ui/data-table.tsx`, all list components      |
| 6     | New `src/components/ui/status-badge.tsx`, all feature components |
| 7     | All edit/create dialog components                                |
| 8     | PDF generation utilities                                         |
| 9     | Sidebar, all dialogs, all tables                                 |
| 10    | `globals.css`, all interactive components                        |
| 11    | `src/app/page.tsx`, all data-fetching components                 |

---

## Design System Reference

See `design-system/thai-accounting-erp/MASTER.md` for complete token reference.

**Font:** IBM Plex Sans —
`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap')`

**Colors:**

- Primary (amber/trust): `#F59E0B`
- CTA (violet/action): `#8B5CF6`
- Background dark: `#0F172A`
- Sidebar always-dark: `#1E293B`
- Text dark: `#F8FAFC`

**Effects:** Minimal glow, `backdrop-blur-md` for modals,
`transition-colors duration-150` for hover
