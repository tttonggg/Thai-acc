## A2: Starting Date Error Fix — Link to Settings
**File:** `src/app/page.tsx` (or wherever the blocking banner lives)
**Spec file:** `.hermes/plans/2026-05-05-A2-starting-date-error-fix.md`
**Dev Cycle:** /spec → /plan → /build → /test → /review → /ship
**Depends on:** T0

---

## What
The blocking "starting date required" error banner should link directly to Settings page instead of just showing an error. Currently it blocks the user with no clear CTA.

---

## Step 1: /spec

### Current Behavior
- User logs in → blocking error banner "Starting date required"
- User cannot do anything until they go to Settings manually
- No direct link to fix

### Target Behavior
- Error banner shows with a direct CTA button: "ไปตั้งค่าวันเริ่มต้น →"
- Click → navigates directly to Settings module/page
- After setting date, banner disappears

### Where to Find
Search for "starting date" or blocking banner in:
- `src/app/page.tsx` — main SPA entry
- `src/components/layout/` — layout components

### UX Reference
- `src/app/page.tsx` has `activeModule === 'settings'` pattern
- `navigateTo('settings')` function exists

---

## Step 2: /plan

### Tasks
1. Find the blocking banner component/code in `src/app/page.tsx`
2. Add a "Go to Settings" CTA button that calls `navigateTo('settings')`
3. Ensure banner only shows when starting date is not set

### Thai ERP Checklist
- [ ] Satang amounts (N/A)
- [ ] Debit=credit (N/A)
- [ ] Period check (N/A — this IS the period check trigger)

---

## Step 3: /build

```bash
# Find the starting date error
grep -n "starting" src/app/page.tsx
grep -n "starting" src/components/**/*.tsx
```

Expected pattern:
```typescript
{!hasStartingDate && (
  <div className="error-banner">
    กรุณาตั้งค่าวันที่เริ่มต้น
    <button onClick={() => navigateTo('settings')}>
      ไปตั้งค่าวันเริ่มต้น →
    </button>
  </div>
)}
```

---

## Step 4: /test

1. Create fresh DB or temporarily clear starting date
2. Login → see error banner with working link
3. Click link → navigates to settings
4. Set starting date → banner disappears

```bash
bun run tsc --noEmit
```

---

## Step 5: /review

- [ ] Error banner now has direct CTA to settings
- [ ] Clicking CTA navigates to settings module
- [ ] Banner disappears after starting date is set
- [ ] Thai text correctly translated

---

## Step 6: /ship

```bash
git add src/app/page.tsx
git commit -m "feat(A2): add settings link to starting date error banner

- Error banner now shows 'ไปตั้งค่าวันเริ่มต้น →' CTA
- Clicking navigates directly to settings module
- Removes UX friction for new users
"
```
