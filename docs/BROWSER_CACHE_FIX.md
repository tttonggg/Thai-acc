# Browser Cache Clear Instructions - March 19, 2026

## ⚠️ Issue: Changes Not Visible

If you're still seeing small form fields even after we fixed them, your browser
has cached the old JavaScript.

---

## 🔧 Solution: Hard Refresh Your Browser

### Chrome/Edge (Windows/Linux):

1. Press **Ctrl + Shift + R** OR
2. Press **Ctrl + F5**

### Chrome/Edge (Mac):

1. Press **Cmd + Shift + R**

### Firefox (Windows/Linux/Mac):

1. Press **Ctrl + Shift + R** (Windows/Linux) OR
2. Press **Cmd + Shift + R** (Mac)

### Safari (Mac):

1. Press **Cmd + Option + E** to empty cache
2. Then press **Cmd + R** to refresh

---

## 🧹 Alternative: Clear Site Data

### Chrome/Edge:

1. Press **F12** to open DevTools
2. Go to **Application** tab
3. Click **Clear site data** (or **Clear storage** → **Clear site data**)
4. Refresh the page with **F5**

### Firefox:

1. Press **F12** to open DevTools
2. Right-click the refresh button
3. Select **"Empty Cache and Hard Reload"**

---

## ✅ What You Should See After Hard Refresh

### Form Fields Should Be:

- **Height**: 44px (taller than before)
- **Font size**: 16px (more readable)
- **Easier to click** on all devices

### Before (OLD - 36px height):

```
┌─────────────────────┐
│ Vendor Dropdown     │ ← Too small!
└─────────────────────┘
```

### After (NEW - 44px height):

```
┌─────────────────────┐
│                     │
│ Vendor Dropdown     │ ← Better!
│                     │
└─────────────────────┘
```

---

## 🔍 Verify the Fix

After hard refresh:

1. **Open Purchase Invoice form**
2. **Right-click** on any form field
3. **Select "Inspect Element"**
4. **Check the Computed styles** for:
   - `height: 44px` (or `2.75rem`)
   - `font-size: 16px` (or `1rem`)

If you see these values, the fix is working! ✅

---

## 🚨 If Still Not Working

### Step 1: Check Dev Server is Running

```bash
# Check if dev server is running
ps aux | grep "next dev"

# If not running, start it:
bun run dev
```

### Step 2: Check for TypeScript Errors

```bash
# Look for red errors in terminal
bun run dev
```

### Step 3: Force Rebuild

```bash
# Stop dev server (Ctrl+C)
# Delete .next cache
rm -rf .next

# Restart dev server
bun run dev
```

### Step 4: Try Incognito/Private Mode

- Open **Incognito window** (Chrome) or **Private window** (Firefox/Safari)
- Go to `http://localhost:3000/purchases`
- If fields are correct in incognito, it's definitely a cache issue

---

## 📋 Technical Details

### What We Changed:

**File**: `/src/components/purchases/purchase-form.tsx`

**Before**:

```typescript
<Input
  placeholder="เลือกผู้ขาย"
/>
```

**After**:

```typescript
<Input
  placeholder="เลือกผู้ขาย"
  className="!h-11 text-base"  // ← !important forces override
/>
```

The `!h-11` uses `!important` to override the base component's `h-9` class.

### Why `!important`?

The shadcn/ui `Input` component has:

```typescript
className={cn(
  "flex h-9 w-full ...",  // ← h-9 is hardcoded here
  className  // Our custom class
)}
```

Tailwind applies classes left-to-right, so `h-9` would override our `h-11`.
Using `!h-11` (with `!important`) forces our style to take precedence.

---

## ✨ Status

**Fix Applied**: ✅ All purchase form fields now use `!h-11 text-base` **Files
Modified**: 2 files (~55 fields updated) **Requires**: Browser hard refresh to
see changes

---

## 💡 Quick Test

After hard refresh, try this:

1. Navigate to **ใบซื้อ (Purchase Invoice)** page
2. Click **สร้างใบซื้อใหม่** (Create New Purchase)
3. Check if:
   - ✅ Dialog title shows "สร้างใบซื้อ/ใบกำกับภาษีซื้อใหม่"
   - ✅ All dropdowns are 44px tall
   - ✅ All text inputs are 44px tall
   - ✅ Text is readable at 16px font size

If all 4 checks pass, you're done! 🎉
