# Data Import - Quick Start Guide

## Prerequisites

- ✅ Admin user account
- ✅ Database schema updated (run `npx prisma db push` if needed)
- ✅ Prisma client generated (run `npx prisma generate`)

## Access the Feature

1. **Login** as admin user
2. **Navigate** to sidebar → "นำเข้าข้อมูล" (Data Import)
3. **Select** data type to import

## Quick Import (5 Steps)

### Step 1: Download Template

1. Click "ดาวน์โหลดไฟล์ตัวอย่าง" button
2. Open the CSV file in Excel or Google Sheets

### Step 2: Prepare Your Data

1. Fill in your data following the template format
2. Required fields: `code`, `name`
3. Save as CSV (UTF-8 encoding)

### Step 3: Upload File

1. Click or drag your CSV file to upload area
2. Wait for file validation

### Step 4: Validate & Preview

1. Ensure "โหมดตรวจสอบ (Dry Run)" is checked
2. Click "ตรวจสอบข้อมูล" button
3. Review preview:
   - 🟢 Green = Will create new
   - 🟡 Yellow = Will update existing
   - 🔴 Red = Error (fix in CSV)

### Step 5: Import

1. Uncheck "โหมดตรวจสอบ (Dry Run)"
2. Choose options:
   - ☑️ "อัปเดตข้อมูลที่มีอยู่" (recommended)
   - ☐ "ข้ามรายการซ้ำ" (if you want to skip)
3. Click "นำเข้าข้อมูล"
4. Confirm import
5. Wait for completion
6. Review results

## Example: Import 3 Customers

### CSV Content:

```csv
code,name,taxId,address,phone,email
C001,บริษัท ก. จำกัด,1234567890123,"123 ถ.สุขุมวิท",02-123-4567,sales@companyg.com
C002,บริษัท ข. จำกัด,9876543210987,"456 ถ.พหลโยธิน",02-234-5678,sales@companyk.com
C003,ห้างหุ้นส่วนจำกัด ค.,1112223334444,789 ถนนเยาวราช,02-345-6789,kgeneral@example.com
```

### Expected Result:

- Total: 3 records
- Created: 3 new customers
- Updated: 0
- Errors: 0

## Common Issues & Solutions

### Issue: "รหัสนี้มีอยู่แล้ว"

**Solution**:

- Check ☑️ "อัปเดตข้อมูลที่มีอยู่" to update existing
- Or check ☑️ "ข้ามรายการซ้ำ" to skip
- Or change the code in your CSV

### Issue: "กรุณาระบุ..." (Required field missing)

**Solution**: Ensure `code` and `name` columns have values for all rows

### Issue: Thai characters display incorrectly

**Solution**: Save CSV with UTF-8 encoding

- Excel: Save As → CSV UTF-8 (Comma delimited)
- Google Sheets: File → Download → Comma-separated values

### Issue: File won't upload

**Solution**:

- Check file size (max 5MB)
- Ensure file is .csv or .json format
- For Excel files: Save as CSV first

## Tips for Success

✅ **DO:**

- Use dry run first to validate
- Backup database before bulk import
- Import in batches (100 records at a time)
- Check preview results carefully
- Use provided templates

❌ **DON'T:**

- Import 1000+ records at once
- Skip dry run validation
- Import while others are using the system
- Close browser during import
- Ignore error messages

## Check Your Import

After import:

1. Go to the relevant module (e.g., "ลูกหนี้" for customers)
2. Search for your imported records
3. Verify data is correct
4. Check "ประวัติการนำเข้า" tab for details

## Need Help?

- Full Guide: `/docs/DATA_IMPORT_GUIDE.md`
- Templates: `/templates/`
- API: `/api/admin/import`

## Data Types Reference

| Type      | Thai Name | Required Fields  |
| --------- | --------- | ---------------- |
| customers | ลูกค้า    | code, name       |
| vendors   | ผู้ขาย    | code, name       |
| products  | สินค้า    | code, name       |
| accounts  | ผังบัญชี  | code, name, type |

## Supported File Formats

### CSV (Recommended)

```
code,name,phone
C001,Customer A,02-123-4567
C002,Customer B,02-234-5678
```

### JSON

```json
[
  { "code": "C001", "name": "Customer A", "phone": "02-123-4567" },
  { "code": "C002", "name": "Customer B", "phone": "02-234-5678" }
]
```

---

**Ready to import?** Go to: Sidebar → นำเข้าข้อมูล → Start importing!
