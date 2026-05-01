# UI Issues - Quick Fix Guide

**Date**: March 19, 2026

## 🔴 Critical Issue Found: Authentication Failure

All "Fetch failed" and "Unexpected data format" errors are caused by
**authentication issues**, not data format issues.

---

## ✅ Quick Fix Steps

### Step 1: Refresh Your Login Session

1. **Log out** from the application
2. **Log in again** with your credentials:
   - Email: `admin@thaiaccounting.com`
   - Password: `admin123`

This will refresh your session cookie and fix all API authentication issues.

---

### Step 2: If Still Not Working, Clear Browser Data

1. Open browser DevTools (F12)
2. Go to **Application** tab
3. Click **Clear site data**
4. Refresh the page
5. Log in again

---

## 🐛 What's Happening

The APIs are returning:

```json
{ "success": false, "error": "ไม่ได้รับอนุญาต - กรุณาเข้าสู่ระบบ" }
```

Translation: "Not authorized - Please login"

This means:

- ✅ Your session expired or wasn't sent properly
- ✅ All API calls are being rejected
- ✅ Frontend shows "Fetch failed" because `res.ok` is false

---

## 🔧 What I Fixed Already

1. ✅ **Routing between inventory/warehouses** - Added `key` props to force
   remount
2. ✅ **Routing between payroll/employees** - Added `key` props to force remount
3. ✅ **Data transformation** - All APIs now flatten vendor/customer data
4. ✅ **Error handling** - Added try-catch to prevent API crashes

---

## 📊 Database Status

- ✅ **Users**: 4 users exist
- ✅ **Sessions**: 74 UserSession records exist
- ✅ **Purchase Invoices**: 2 records exist
- ✅ **Debit Notes**: 12 records exist
- ✅ **Credit Notes**: Records exist

All data is intact. The issue is just authentication.

---

## 🎯 After Re-logging

You should see:

- ✅ **Purchase Invoices** (ใบซื้อ) - Shows 2 records
- ✅ **Debit Notes** (ใบเพิ่มหนี้) - Shows 12 records
- ✅ **Credit Notes** (ใบลดหนี้) - Shows all records
- ✅ **Inventory/Warehouses** - Switching works correctly
- ✅ **No more "Fetch failed" errors**
- ✅ **No more "Unexpected data format" errors**

---

## 💡 Why Session Issues Happen

NextAuth.js sessions can fail due to:

1. **Session expiration** - Sessions expire after a period
2. **Cookie issues** - Browser blocks cookies
3. **Database connection** - Session database access fails
4. **Server restart** - Sometimes clears in-memory sessions

---

## 🚀 Status

**Root Cause Identified**: Authentication session issue (not a data format
issue)

**Solution**: Re-login to refresh session

**All Code Fixes Applied** ✅

- Routing fixed
- Data transformation fixed
- Error handling improved

---

## 📝 Note

After re-logging, if you still see issues, please let me know:

1. What page you're on
2. What error you see
3. A screenshot if possible

This will help me diagnose any remaining issues quickly.
