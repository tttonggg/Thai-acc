# Session Expired - Quick Fix Guide

## 🔴 Error: "Unexpected data format: {}" or "ไม่ได้รับอนุญาต"

### Root Cause: Your Session Has Expired ⏰

The API is returning:

```json
{
  "success": false,
  "error": "ไม่ได้รับอนุญาต - กรุณาเข้าสู่ระบบ"
}
```

**Translation**: "Not authorized - Please login"

---

## ✅ Quick Fix: Re-Login to Refresh Your Session

### Step 1: Log Out

1. Click your **avatar/profile icon** in the top-right corner
2. Click **"ออกจากระบบ"** (Logout)

### Step 2: Log In Again

Use these credentials:

- **Email**: `admin@thaiaccounting.com`
- **Password**: `admin123`

### Step 3: Hard Refresh (Important!)

After logging in, press:

- **Windows/Linux**: `Ctrl + Shift + R`
- **Mac**: `Cmd + Shift + R`

---

## 🧹 Alternative: Clear Browser Data

If re-login doesn't work:

### Chrome/Edge:

1. Press `F12` to open DevTools
2. Go to **Application** tab
3. Click **"Clear site data"**
4. Refresh the page
5. Log in again

### Firefox:

1. Press `F12` to open DevTools
2. Right-click the refresh button
3. Select **"Empty Cache and Hard Reload"**
4. Log in again

---

## 🔍 Verify the Fix

After re-logging in:

1. **Navigate to ใบซื้อ (Purchase Invoice)**
2. **Check for errors** - Console should show:
   ```
   Successfully loaded X purchases
   ```
3. **Check the page** - You should see your purchase invoices

---

## 💡 Why Sessions Expire

NextAuth.js sessions can expire due to:

1. **Time** - Sessions expire after a period (default: 30 days)
2. **Server restart** - Sometimes clears in-memory sessions
3. **Database** - Session database access issues
4. **Cookie** - Browser blocks or clears cookies

---

## ✨ What Should Work After Re-Login

### ✅ All Forms Should Have:

- **Proper sizing** (44px height, 16px font)
- **Correct titles** (e.g., "สร้างใบซื้อ/ใบกำกับภาษีซื้อใหม่")
- **Readable fields** (easy to interact with)

### ✅ All Pages Should Load:

- ✅ Purchase Invoices (ใบซื้อ)
- ✅ Debit Notes (ใบเพิ่มหนี้)
- ✅ Credit Notes (ใบลดหนี้)
- ✅ Receipts (ใบเสร็จรับเงิน)
- ✅ Payments (ใบจ่ายเงิน)

### ✅ No More Errors:

- ❌ "Unexpected data format: {}"
- ❌ "Fetch failed"
- ❌ "ไม่ได้รับอนุญาต" (Not authorized)

---

## 🚨 If Still Not Working After Re-Login

### Check 1: Dev Server Running

```bash
ps aux | grep "next dev"
```

If not running:

```bash
bun run dev
```

### Check 2: Database Connection

```bash
ls -lh prisma/dev.db
# Should be ~732KB or larger
```

If too small (<100KB):

```bash
bun run seed
```

### Check 3: Browser Console

1. Press `F12` to open DevTools
2. Go to **Console** tab
3. Look for red errors
4. Screenshot and share if needed

---

## 📋 Summary

**Problem**: Session expired → API returning authentication errors **Solution**:
Log out → Log in → Hard refresh **Status**: Ready to fix in 30 seconds! ⚡

---

## 🎯 Next Steps

1. **Log out** from the application
2. **Log in** with: `admin@thaiaccounting.com` / `admin123`
3. **Hard refresh**: `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R`
   (Mac)
4. **Test**: Navigate to ใบซื้อ page and verify it loads

That's it! You should be all set. 🎉
