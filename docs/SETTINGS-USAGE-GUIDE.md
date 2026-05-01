# Settings Component - Quick Usage Guide

## Overview

The Settings component (ตั้งค่า) allows you to configure all aspects of the Thai
Accounting ERP system, including company information, document numbering, and
tax rates.

## Accessing Settings

1. Login to the system
2. Click "ตั้งค่า" (Settings) in the left sidebar
3. Navigate between tabs using the tabs at the top

## Tabs Overview

### 1. ข้อมูลบริษัท (Company Information)

**Purpose:** Configure your company profile for use in documents and reports

**Fields:**

- ชื่อบริษัท (ไทย) - Company name in Thai
- ชื่อบริษัท (อังกฤษ) - Company name in English
- เลขประจำตัวผู้เสียภาษี - Tax ID
- รหัสสาขา - Branch code (00000 for head office)
- ที่อยู่ - Address
- แขวง/ตำบล - Sub-district
- เขต/อำเภอ - District
- จังหวัด - Province
- รหัสไปรษณีย์ - Postal code
- โทรศัพท์ - Phone
- โทรสาร - Fax
- อีเมล - Email
- เว็บไซต์ - Website

**How to Save:**

1. Fill in the fields
2. Click "บันทึกข้อมูล" (Save) button at the bottom
3. Wait for success notification

**Logo Upload:**

1. Click "อัปโหลดโลโก้" (Upload Logo)
2. Select PNG or JPG file (max 2MB)
3. Click "บันทึกโลโก้" (Save Logo)
4. Logo will appear on invoices and reports

### 2. เอกสาร (Documents)

**Purpose:** Configure automatic document numbering for all document types

**Document Types:**

1. **ใบกำกับภาษี** (Tax Invoice) - Default: INV
2. **ใบเสร็จรับเงิน** (Receipt) - Default: RCP
3. **ใบจ่ายเงิน** (Payment) - Default: PAY
4. **บันทึกบัญชี** (Journal Entry) - Default: JE
5. **ใบลดหนี้** (Credit Note) - Default: CN
6. **ใบเพิ่มหนี้** (Debit Note) - Default: DN
7. **ใบซื้อ** (Purchase) - Default: PO
8. **เงินเดือน** (Payroll) - Default: PAYROLL
9. **เงินสดย่อย** (Petty Cash) - Default: PCV

**Fields for Each Document Type:**

- **คำนำหน้า (Prefix)** - Short code at the beginning (e.g., INV, RCP)
- **รูปแบบ (Format)** - Number format using placeholders:
  - `{prefix}` - Replaced with prefix
  - `{yyyy}` - 4-digit year (2024)
  - `{yy}` - 2-digit year (24)
  - `{mm}` - 2-digit month (01-12)
  - `{0000}` - 4-digit sequence (0001, 0002, ...)
  - `{000}` - 3-digit sequence (001, 002, ...)
  - `{00}` - 2-digit sequence (01, 02, ...)
- **รีเซ็ตรายเดือน (Reset Monthly)** - Reset sequence to 1 each month
- **รีเซ็ตรายปี (Reset Yearly)** - Reset sequence to 1 each year

**Example Formats:**

- `{prefix}-{yyyy}-{mm}-{0000}` → `INV-2024-03-0001`
- `{prefix}{yy}{mm}-{000}` → `INV2403-001`
- `{prefix}-{yyyy}-{0000}` → `INV-2024-0001` (yearly reset)

**How to Configure:**

1. For each document type, modify the prefix and format as needed
2. Toggle reset options as desired
3. Preview appears automatically on the right
4. Click "บันทึกรูปแบบเอกสาร" (Save Document Formats)
5. Wait for success notification

**Reset to Defaults:**

- Click "รีเซ็ตค่าเริ่มต้น" (Reset to Defaults) button
- This resets all formats to system defaults (doesn't save automatically)

### 3. ภาษี (Taxes)

**Purpose:** Configure default tax rates used throughout the system

#### VAT (ภาษีมูลค่าเพิ่ม)

- **อัตราภาษีมูลค่าเพิ่ม (VAT Rate)** - Standard rate: 7%
  - Range: 0-100%
  - Step: 0.01 (supports decimal places)

#### WHT PND53 (ภาษีหัก ณ ที่จ่าย ภงด.53)

Used for service payments, rent, etc.

1. **ค่าบริการ (Service)** - Default: 3%
2. **ค่าเช่า (Rent)** - Default: 5%
3. **ค่าบริการวิชาชีพ (Professional Services)** - Default: 3%
4. **ค่าจ้างทำของ (Contract Work)** - Default: 1%
5. **ค่าโฆษณา (Advertising)** - Default: 2%

**How to Configure:**

1. Change any tax rate as needed (0-100%)
2. Reference standard rates shown below each field
3. Click "บันทึกอัตราภาษี" (Save Tax Rates)
4. Wait for success notification

**Note:** These rates are used as defaults when creating invoices, payments,
etc. You can override them on individual documents.

### 4. สำรองข้อมูล (Backup)

**Purpose:** Backup and restore all system data

#### Export (ส่งออกข้อมูล)

1. Click "ส่งออกข้อมูล" (Export Data)
2. JSON file will download automatically
3. File name: `thai-erp-backup-YYYY-MM-DD.json`
4. Keep this file in a safe location

#### Import (นำเข้าข้อมูล)

1. Click "เลือกไฟล์สำรองข้อมูล" (Select Backup File)
2. Select previously exported JSON file
3. Click "นำเข้าข้อมูล" (Import Data)
4. Wait for completion
5. Success message shows what was imported

**Warning:** Importing will add data to your database. Make sure to backup
before importing!

## Best Practices

### Document Numbering

1. **Plan your prefixes** - Use meaningful, short codes
2. **Choose format wisely** - Consider if you need monthly/yearly tracking
3. **Test first** - Create test documents to verify format
4. **Keep it simple** - Complex formats are harder to manage

### Tax Rates

1. **Verify current rates** - Check with Thai Revenue Department
2. **Update annually** - Tax rates may change
3. **Document changes** - Note when and why you changed rates
4. **Test calculations** - Create test invoices after changing rates

### Company Information

1. **Keep it accurate** - Used on all documents and reports
2. **Update logo** - Keep company branding current
3. **Check spelling** - Especially important for Thai names

### Backup

1. **Backup regularly** - At least weekly
2. **Before updates** - Always backup before system updates
3. **Multiple locations** - Store backups in different places
4. **Test restores** - Verify your backups work

## Troubleshooting

### Save Button Not Working

- Check if you filled all required fields
- Look for error messages in red
- Try refreshing the page
- Check browser console for errors

### Document Numbers Not Generating

- Verify format includes `{0000}` or similar
- Check if reset toggles are set correctly
- Try resetting to defaults

### Tax Rates Not Applying

- Click save after changing rates
- Refresh the page
- Check individual document settings (may override defaults)

### Logo Not Uploading

- Check file size (max 2MB)
- Verify file format (PNG or JPG)
- Try a different file
- Check internet connection

### Backup Failing

- Check available disk space
- Verify database connection
- Try with smaller dataset
- Check browser console for errors

## Support

For issues or questions:

1. Check this guide first
2. Review error messages carefully
3. Check browser console (F12)
4. Contact system administrator

## Tips

### Keyboard Shortcuts

- `Tab` - Move between fields
- `Enter` - May save form (depends on browser)
- `Esc` - May cancel/close dialogs

### Performance

- Settings load once per session
- Saves are instant for small changes
- Large changes may take a few seconds

### Security

- Only admin users can access settings
- All changes are logged in database
- Backup files contain all data (keep secure!)

---

**Last Updated:** 2025-03-13 **Version:** 1.0 **Language:** Thai/English
