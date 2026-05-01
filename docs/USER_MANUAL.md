# Thai Accounting ERP - User Manual

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [System Overview](#2-system-overview)
3. [Dashboard](#3-dashboard)
4. [Chart of Accounts](#4-chart-of-accounts)
5. [Customers Management](#5-customers-management)
6. [Vendors Management](#6-vendors-management)
7. [Products Management](#7-products-management)
8. [Sales Invoices](#8-sales-invoices)
9. [Purchase Invoices](#9-purchase-invoices)
10. [Receipts](#10-receipts)
11. [Payments](#11-payments)
12. [Credit Notes](#12-credit-notes)
13. [Debit Notes](#13-debit-notes)
14. [Journal Entries](#14-journal-entries)
15. [Banking](#15-banking)
16. [Inventory Management](#16-inventory-management)
17. [Fixed Assets](#17-fixed-assets)
18. [Petty Cash](#18-petty-cash)
19. [Payroll](#19-payroll)
20. [Withholding Tax](#20-withholding-tax)
21. [Financial Reports](#21-financial-reports)
22. [Settings](#22-settings)
23. [Backup and Restore](#23-backup-and-restore)
24. [Troubleshooting](#24-troubleshooting)

---

## 1. Getting Started

### 1.1 System Requirements

- **Web Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Screen Resolution**: Minimum 1366x768
- **Internet Connection**: Stable connection required

### 1.2 First Time Login

1. Open your web browser and navigate to the application URL
2. Enter your email address and password
3. Click "เข้าสู่ระบบ" (Login)

**Default Test Accounts:** | Email | Password | Role |
|-------|----------|------| | admin@thaiaccounting.com | admin123 |
Administrator | | accountant@thaiaccounting.com | acc123 | Accountant | |
user@thaiaccounting.com | user123 | User |

### 1.3 Initial Setup

After first login, configure your company settings:

1. Go to **ตั้งค่า** (Settings) → **ข้อมูลบริษัท** (Company Info)
2. Fill in company information:
   - Company Name (Thai and English)
   - Tax ID (เลขประจำตัวผู้เสียภาษี)
   - Address
   - Phone and Email
3. Configure VAT rate (default: 7%)
4. Set fiscal year start date
5. Click **บันทึก** (Save)

---

## 2. System Overview

### 2.1 Navigation Menu

The left sidebar provides access to all modules:

```
📊 Dashboard - Overview and statistics
├── 🏦 Accounting
│   ├── ผังบัญชี (Chart of Accounts)
│   ├── ลูกหนี้ (Customers)
│   ├── เจ้าหนี้ (Vendors)
│   ├── สินค้า (Products)
│   ├── ใบกำกับภาษีขาย (Sales Invoices)
│   ├── ใบกำกับภาษีซื้อ (Purchase Invoices)
│   ├── ใบเสร็จรับเงิน (Receipts)
│   ├── ใบสำคัญจ่าย (Payments)
│   ├── ใบลดหนี้ (Credit Notes)
│   ├── ใบเพิ่มหนี้ (Debit Notes)
│   └── สมุดรายวัน (Journal Entries)
├── 💰 Banking
│   ├── บัญชีธนาคาร (Bank Accounts)
│   ├── เช็ค (Cheques)
│   └── กระเป๋าเงินสดย่อย (Petty Cash)
├── 📦 Inventory
│   ├── คลังสินค้า (Stock)
│   ├── รับสินค้า (Goods Receipt)
│   └── จ่ายสินค้า (Goods Issue)
├── 🏭 Assets
│   └── สินทรัพย์ถาวร (Fixed Assets)
├── 👥 Payroll
│   ├── พนักงาน (Employees)
│   └── เงินเดือน (Payroll)
├── 📑 Tax
│   └── ภาษีหัก ณ ที่จ่าย (Withholding Tax)
├── 📈 Reports
│   ├── สมุดบัญชีแยกประเภท (GL)
│   ├── งบดุล (Balance Sheet)
│   ├── งบกำไรขาดทุน (Income Statement)
│   ├── งบทดลอง (Trial Balance)
│   └── รายงานภาษี (Tax Reports)
└── ⚙️ Settings
```

### 2.2 User Roles and Permissions

| Role           | Description                                             |
| -------------- | ------------------------------------------------------- |
| **ADMIN**      | Full access to all features including user management   |
| **ACCOUNTANT** | Full accounting access, can post transactions           |
| **USER**       | Can create documents but cannot post or access settings |
| **VIEWER**     | Read-only access to reports and documents               |

---

## 3. Dashboard

### 3.1 Overview Widgets

The dashboard displays:

- **Today's Summary**: Sales, receipts, payments
- **Outstanding Invoices**: Amounts receivable and payable
- **Bank Balances**: Current balances for all bank accounts
- **Cash Position**: Cash and petty cash balances
- **Quick Actions**: Shortcuts to common tasks

### 3.2 Monthly Charts

- **Revenue Trend**: Monthly sales comparison
- **Expense Breakdown**: By category
- **Cash Flow**: Inflows and outflows

### 3.3 Alerts and Notifications

The system shows alerts for:

- Overdue invoices
- Low stock items
- Cheques pending clearance
- Unposted documents

---

## 4. Chart of Accounts

### 4.1 Understanding the Chart of Accounts

The system uses the Thai standard chart of accounts with 4 levels:

| Level | Type     | Example                                  |
| ----- | -------- | ---------------------------------------- |
| 1     | Category | 1 = Assets (สินทรัพย์)                   |
| 2     | Group    | 11 = Current Assets (สินทรัพย์หมุนเวียน) |
| 3     | Subgroup | 110 = Receivables (ลูกหนี้)              |
| 4     | Account  | 1101 = Trade Receivables (ลูกหนี้การค้า) |

### 4.2 Account Types

| Code | Type      | Thai       | Description                |
| ---- | --------- | ---------- | -------------------------- |
| 1xxx | ASSET     | สินทรัพย์  | What the company owns      |
| 2xxx | LIABILITY | หนี้สิน    | What the company owes      |
| 3xxx | EQUITY    | ทุน        | Owner's equity             |
| 4xxx | REVENUE   | รายได้     | Income from sales/services |
| 5xxx | EXPENSE   | ค่าใช้จ่าย | Operating expenses         |

### 4.3 Creating a New Account

1. Go to **ผังบัญชี** (Chart of Accounts)
2. Click **สร้างบัญชีใหม่** (Create New Account)
3. Fill in the form:
   - **รหัสบัญชี** (Account Code): Unique 4-digit code
   - **ชื่อบัญชี** (Account Name): Thai name
   - **ชื่อบัญชี (EN)** (Account Name EN): English name (optional)
   - **ประเภท** (Type): Select from dropdown
   - **บัญชีแม่** (Parent Account): Select parent if applicable
4. Click **บันทึก** (Save)

### 4.4 Account Balances

View account balances by:

- Clicking on an account to see transaction history
- Using filters to view by date range
- Exporting to Excel for further analysis

---

## 5. Customers Management

### 5.1 Adding a New Customer

1. Go to **ลูกหนี้** (Customers)
2. Click **สร้างลูกค้าใหม่** (Create New Customer)
3. Fill in customer information:
   - **รหัสลูกค้า** (Customer Code): Unique identifier
   - **ชื่อ** (Name): Company or individual name
   - **เลขประจำตัวผู้เสียภาษี** (Tax ID): 13 digits
   - **ที่อยู่** (Address): Full address
   - **โทรศัพท์** (Phone): Contact number
   - **อีเมล** (Email): Email address
   - **วงเงินเครดิต** (Credit Limit): Maximum credit amount
   - **เครดิต (วัน)** (Credit Days): Payment terms

### 5.2 Customer Statements

Generate customer statements:

1. Select customer
2. Click **ใบแจ้งยอด** (Statement)
3. Select date range
4. Click **พิมพ์** (Print) or **ส่งอีเมล** (Email)

### 5.3 Aging Report

View customer aging:

1. Go to **รายงาน** (Reports) → **อายุลูกหนี้** (AR Aging)
2. View balances by age: Current, 30, 60, 90, 90+ days

---

## 6. Vendors Management

### 6.1 Adding a New Vendor

1. Go to **เจ้าหนี้** (Vendors)
2. Click **สร้างผู้ขายใหม่** (Create New Vendor)
3. Fill in vendor information similar to customers
4. Add banking information for payments:
   - **ธนาคาร** (Bank Name)
   - **เลขที่บัญชี** (Account Number)
   - **ชื่อบัญชี** (Account Name)

### 6.2 Vendor Payments

Process payments to vendors:

1. Select vendor
2. View outstanding invoices
3. Select invoices to pay
4. Click **ชำระเงิน** (Make Payment)

---

## 7. Products Management

### 7.1 Adding Products

1. Go to **สินค้า** (Products)
2. Click **สร้างสินค้าใหม่** (Create New Product)
3. Fill in product details:
   - **รหัสสินค้า** (Product Code)
   - **ชื่อสินค้า** (Product Name)
   - **หมวดหมู่** (Category)
   - **หน่วย** (Unit): e.g., ชิ้น, กล่อง, กิโลกรัม
   - **ราคาขาย** (Sale Price)
   - **ราคาทุน** (Cost Price)
   - **อัตราภาษี** (VAT Rate): usually 7%

### 7.2 Inventory Tracking

For inventory items:

1. Check **ติดตามสต็อก** (Track Inventory)
2. Set **จำนวนต่ำสุด** (Minimum Quantity) for reorder alerts
3. Select **วิธีคิดต้นทุน** (Costing Method):
   - **FIFO** (First In, First Out)
   - **Weighted Average** (ค่าเฉลี่ยถ่วงน้ำหนัก)

### 7.3 Stock Adjustments

Adjust stock quantities:

1. Go to **คลังสินค้า** (Inventory)
2. Click **ปรับปรุงสต็อก** (Adjust Stock)
3. Select product and enter new quantity
4. Add reason for adjustment
5. Post the adjustment

---

## 8. Sales Invoices

### 8.1 Creating a Sales Invoice

1. Go to **ใบกำกับภาษีขาย** (Sales Invoices)
2. Click **สร้างใบกำกับภาษีใหม่** (Create New Invoice)
3. Select **ลูกค้า** (Customer)
4. Enter **วันที่** (Invoice Date) and **วันครบกำหนด** (Due Date)
5. Add invoice lines:
   - Select **สินค้า** (Product) or enter description
   - Enter **จำนวน** (Quantity)
   - Enter **ราคาต่อหน่วย** (Unit Price)
   - Enter **ส่วนลด %** (Discount %)
6. Review totals:
   - **รวมเงิน** (Subtotal)
   - **ภาษีมูลค่าเพิ่ม** (VAT)
   - **จำนวนเงินรวม** (Total)
7. Click **บันทึก** (Save)

### 8.2 Invoice Status Flow

```
DRAFT (ฉบับร่าง) → ISSUED (ออกแล้ว) → PARTIAL (ชำระบางส่วน) → PAID (ชำระแล้ว)
                                        ↓
                                    CANCELLED (ยกเลิก)
```

### 8.3 Issuing an Invoice

1. Open the invoice in DRAFT status
2. Click **ออกใบกำกับภาษี** (Issue Invoice)
3. System creates journal entries automatically
4. Invoice number is assigned

### 8.4 Printing Invoices

1. Open the invoice
2. Click **พิมพ์** (Print)
3. Select template:
   - Standard A4
   - Continuous form
   - Tax invoice (ใบกำกับภาษีอย่างเต็มอักษร)

---

## 9. Purchase Invoices

### 9.1 Creating a Purchase Invoice

1. Go to **ใบกำกับภาษีซื้อ** (Purchase Invoices)
2. Click **สร้างใบกำกับภาษีซื้อใหม่**
3. Select **ผู้ขาย** (Vendor)
4. Enter invoice details and lines
5. Save and post

### 9.2 Input VAT Tracking

The system automatically tracks input VAT for tax filing:

- Monthly VAT report shows all input VAT
- Links to purchase invoices for verification

---

## 10. Receipts

### 10.1 Creating a Receipt

1. Go to **ใบเสร็จรับเงิน** (Receipts)
2. Click **สร้างใบเสร็จใหม่**
3. Select **ลูกค้า** (Customer)
4. Select **วิธีการชำระเงิน** (Payment Method):
   - เงินสด (Cash)
   - โอนเงิน (Bank Transfer)
   - เช็ค (Cheque)
   - บัตรเครดิต (Credit Card)
5. Select **ใบกำกับภาษี** (Invoice) to allocate
6. Enter **จำนวนเงิน** (Amount)
7. Save and post

### 10.2 Withholding Tax on Receipts

If withholding tax applies:

1. Check **หักภาษี ณ ที่จ่าย** (Withholding Tax)
2. Select **ประเภท** (Type): PND3 or PND53
3. Enter **อัตราภาษี** (Rate): 1%, 3%, 5%, etc.
4. System calculates WHT amount automatically

---

## 11. Payments

### 11.1 Creating a Payment

1. Go to **ใบสำคัญจ่าย** (Payments)
2. Click **สร้างใบสำคัญจ่ายใหม่**
3. Select **ผู้ขาย** (Vendor)
4. Select **บัญชีธนาคาร** (Bank Account)
5. Select invoices to pay
6. Save and post

### 11.2 Partial Payments

For partial payments:

1. Enter payment amount less than invoice total
2. System updates invoice status to PARTIAL
3. Remaining balance shown on customer/vendor statement

---

## 12. Credit Notes

### 12.1 When to Use Credit Notes

Create credit notes for:

- Sales returns
- Price adjustments
- Billing corrections
- Discounts after invoice

### 12.2 Creating a Credit Note

1. Go to **ใบลดหนี้** (Credit Notes)
2. Click **สร้างใบลดหนี้ใหม่**
3. Select **ลูกค้า** and **ใบกำกับภาษีอ้างอิง** (Reference Invoice)
4. Select **เหตุผล** (Reason):
   - RETURN (คืนสินค้า)
   - DISCOUNT (ส่วนลด)
   - CORRECTION (แก้ไข)
   - OTHER (อื่นๆ)
5. Add credit note lines
6. Save and post

### 12.3 Allocating Credit Notes

Apply credit notes to invoices:

1. Open the credit note
2. Click **จัดสรร** (Allocate)
3. Select invoice to apply
4. Enter allocation amount

---

## 13. Debit Notes

### 13.1 When to Use Debit Notes

Create debit notes for:

- Additional charges
- Price increases
- Billing corrections (increase)

### 13.2 Creating a Debit Note

Process is similar to credit notes, but increases the amount owed.

---

## 14. Journal Entries

### 14.1 Understanding Journal Entries

Journal entries record financial transactions using double-entry bookkeeping:

- **เดบิต** (Debit) - Left side
- **เครดิต** (Credit) - Right side

Total debits must equal total credits.

### 14.2 Creating a Journal Entry

1. Go to **สมุดรายวัน** (Journal Entries)
2. Click **สร้างรายการใหม่**
3. Enter **วันที่** (Date)
4. Enter **คำอธิบาย** (Description)
5. Add journal lines:
   - Select **บัญชี** (Account)
   - Enter **เดบิต** (Debit) OR **เครดิต** (Credit)
   - Add **คำอธิบายรายการ** (Line Description)
6. Verify debits = credits
7. Save and post

### 14.3 Common Journal Entries

**Adjusting Entry:** | Account | Debit | Credit | |---------|-------|--------| |
ค่าใช้จ่ายสำนักงาน | 10,000 | | | เงินสดในมือ | | 10,000 |

**Accrual Entry:** | Account | Debit | Credit | |---------|-------|--------| |
ค่าใช้จ่ายเงินเดือน | 50,000 | | | ค่าใช้จ่ายเงินเดือนค้างจ่าย | | 50,000 |

---

## 15. Banking

### 15.1 Bank Accounts

Add bank accounts:

1. Go to **บัญชีธนาคาร** (Bank Accounts)
2. Click **สร้างบัญชีใหม่**
3. Enter:
   - **ธนาคาร** (Bank Name)
   - **สาขา** (Branch)
   - **เลขที่บัญชี** (Account Number)
   - **ประเภทบัญชี** (Account Type): กระแสรายวัน / ออมทรัพย์ / ฝากประจำ
   - **ยอดคงเหลือต้นงวด** (Opening Balance)

### 15.2 Bank Reconciliation

Reconcile bank statements:

1. Go to **บัญชีธนาคาร** → **กระทบยอด** (Reconcile)
2. Select bank account and statement date
3. Check off cleared transactions
4. Enter bank statement ending balance
5. Click **บันทึกการกระทบยอด**

### 15.3 Cheque Management

Register cheques:

1. Go to **เช็ค** (Cheques)
2. Select **เช็คจ่าย** (Cheques Issued) or **เช็ครับ** (Cheques Received)
3. Enter cheque details:
   - Cheque number
   - Bank
   - Date
   - Amount
   - Payee/Payer
4. Track clearance status

### 15.4 Petty Cash

Manage petty cash:

1. Go to **กระเป๋าเงินสดย่อย** (Petty Cash)
2. Set up petty cash float amount
3. Record expenses:
   - Date
   - Category
   - Amount
   - Receipt number
4. Replenish when balance is low

---

## 16. Inventory Management

### 16.1 Stock Movements

Track inventory movements:

- **รับสินค้า** (Goods Receipt): Receive from vendors
- **จ่ายสินค้า** (Goods Issue): Issue to production/customers
- **โอนย้าย** (Transfer): Move between locations

### 16.2 Creating Goods Receipt

1. Go to **คลังสินค้า** → **รับสินค้า**
2. Select **ผู้ขาย**
3. Add products and quantities
4. Enter unit cost
5. Save and post

### 16.3 Stock Valuation

View stock valuation:

1. Go to **รายงาน** → **มูลค่าสินค้าคงเหลือ**
2. Select costing method view
3. Export to Excel

### 16.4 Inventory Reports

Available reports:

- **รายงานสต็อกสินค้า** (Stock Balance Report)
- **รายงานการเคลื่อนไหวสินค้า** (Stock Movement Report)
- **รายงานสินค้าใกล้หมด** (Low Stock Report)

---

## 17. Fixed Assets

### 17.1 Registering Assets

1. Go to **สินทรัพย์ถาวร** (Fixed Assets)
2. Click **สร้างสินทรัพย์ใหม่**
3. Enter asset details:
   - Asset code and name
   - Category
   - Purchase date
   - Purchase cost
   - Useful life (years)
   - Depreciation method

### 17.2 Depreciation Methods

Supported methods:

- **Straight Line** (เส้นตรง)
- **Declining Balance** (ถ declining)

### 17.3 Running Depreciation

1. Go to **สินทรัพย์ถาวร** → **คำนวณค่าเสื่อม**
2. Select month/year
3. Preview depreciation entries
4. Post to GL

### 17.4 Asset Disposal

1. Open asset record
2. Click **จำหน่าย** (Dispose)
3. Enter disposal date and amount
4. System calculates gain/loss
5. Post disposal entry

---

## 18. Petty Cash

### 18.1 Setup

1. Go to **กระเป๋าเงินสดย่อย**
2. Set **วงเงิน** (Float Amount)
3. Assign **ผู้รับผิดชอบ** (Custodian)

### 18.2 Recording Expenses

1. Click **บันทึกค่าใช้จ่าย**
2. Enter:
   - Date
   - Category
   - Description
   - Amount
   - Receipt number
3. Save

### 18.3 Replenishment

When balance is low:

1. Click **เบิกเติมเงิน**
2. System calculates amount needed
3. Create payment voucher
4. Withdraw from bank

### 18.4 Reports

- **รายงานเงินสดย่อย** (Petty Cash Report)
- **สรุปตามหมวดหมู่** (Summary by Category)

---

## 19. Payroll

### 19.1 Employee Setup

1. Go to **พนักงาน** (Employees)
2. Click **สร้างพนักงานใหม่**
3. Enter:
   - Personal information
   - Salary details
   - Tax information
   - Social security number
   - Bank account for payment

### 19.2 Processing Payroll

1. Go to **เงินเดือน** (Payroll)
2. Select month/year
3. Click **คำนวณเงินเดือน**
4. Review calculations:
   - Basic salary
   - Allowances
   - Overtime
   - Deductions
   - Social security
   - Withholding tax (PND1)
5. Approve and post

### 19.3 Payroll Components

**Income:**

- เงินเดือนพื้นฐาน (Basic Salary)
- ค่าล่วงเวลา (Overtime)
- ค่าเดินทาง (Transportation)
- ค่าอาหาร (Meal Allowance)
- โบนัส (Bonus)

**Deductions:**

- ประกันสังคม (Social Security)
- ภาษีหัก ณ ที่จ่าย (Withholding Tax)
- เงินกู้ (Loan)
- ขาดลามาสาย (Absence)

### 19.4 Payroll Reports

- **สลิปเงินเดือน** (Payslip)
- **รายงานเงินเดือนสรุป** (Payroll Summary)
- **รายงานประกันสังคม** (Social Security Report)
- **รายงานภาษี ภ.ง.ด.1** (PND1 Report)

---

## 20. Withholding Tax

### 20.1 WHT on Payments

When paying vendors:

1. Check **หักภาษี ณ ที่จ่าย**
2. Select type:
   - **ภ.ง.ด.3** (PND3): For individuals
   - **ภ.ง.ด.53** (PND53): For corporations
3. Select income type (determines rate):
   - ค่าบริการ (Services): 3%
   - ค่าเช่า (Rent): 5%
   - ค่าบริการวิชาชีพ (Professional): 3%
   - ค่าจ้างทำของ (Contract): 1%
   - ค่าโฆษณา (Advertising): 2%

### 20.2 WHT Certificates

Generate WHT certificates:

1. Go to **ภาษีหัก ณ ที่จ่าย**
2. Select month/year
3. Click **ออกใบหัก ณ ที่จ่าย**
4. Print or email certificates

### 20.3 WHT Reports

- **รายงานภาษีหัก ณ ที่จ่าย** (WHT Report)
- **ภ.ง.ด.3** (PND3 Form)
- **ภ.ง.ด.53** (PND53 Form)

---

## 21. Financial Reports

### 21.1 General Ledger

View all transactions by account:

1. Go to **รายงาน** → **สมุดบัญชีแยกประเภท**
2. Select account
3. Select date range
4. View/print/export

### 21.2 Balance Sheet

Shows financial position:

- สินทรัพย์ (Assets)
- หนี้สิน (Liabilities)
- ทุน (Equity)

### 21.3 Income Statement

Shows financial performance:

- รายได้ (Revenue)
- ต้นทุนขาย (Cost of Goods Sold)
- ค่าใช้จ่าย (Expenses)
- กำไรสุทธิ (Net Profit)

### 21.4 Trial Balance

Lists all account balances:

- Opening balance
- Debit movement
- Credit movement
- Closing balance

### 21.5 VAT Reports

**ภาษีขาย (Output VAT):**

- Monthly summary
- By invoice
- For filing Por.Por.30

**ภาษีซื้อ (Input VAT):**

- Monthly summary
- By purchase invoice
- For filing Por.Por.30

### 21.6 Exporting Reports

All reports can be exported to:

- Excel (.xlsx)
- PDF
- CSV

---

## 22. Settings

### 22.1 Company Information

Configure:

- Company name (Thai/English)
- Tax ID
- Address
- Contact information
- Logo

### 22.2 Accounting Settings

- VAT rate (default 7%)
- Fiscal year start
- Currency
- Decimal places
- Date format

### 22.3 Document Numbering

Configure number formats:

- Invoice: INV-{YYYY}{MM}-{0000}
- Receipt: REC-{YYYY}{MM}-{0000}
- Journal: JV-{YYYY}{MM}-{0000}

### 22.4 User Management

Add/manage users:

1. Go to **ตั้งค่า** → **ผู้ใช้งาน**
2. Click **สร้างผู้ใช้ใหม่**
3. Enter:
   - Name
   - Email
   - Password
   - Role
4. Save

### 22.5 Permissions

Assign module permissions by role:

- View
- Create
- Edit
- Delete
- Post
- Export

---

## 23. Backup and Restore

### 23.1 Creating a Backup

1. Go to **ตั้งค่า** → **สำรองข้อมูล**
2. Click **สร้างการสำรองข้อมูล**
3. Select backup type:
   - Full backup (all data)
   - Data only (no attachments)
4. Download backup file

### 23.2 Scheduled Backups

Set up automatic backups:

1. Configure backup schedule
2. Set retention period
3. Choose storage location

### 23.3 Restoring from Backup

⚠️ **Warning**: Restore will overwrite current data!

1. Go to **ตั้งค่า** → **กู้คืนข้อมูล**
2. Select backup file
3. Verify backup information
4. Click **ยืนยันการกู้คืน**
5. Wait for restore to complete

### 23.4 Data Export

Export specific data:

- Customers
- Vendors
- Products
- Chart of Accounts
- Transactions (by date range)

---

## 24. Troubleshooting

### 24.1 Login Issues

**Problem**: Cannot log in **Solutions**:

1. Check email/password
2. Clear browser cache
3. Try incognito mode
4. Contact administrator

### 24.2 Document Posting Errors

**Problem**: Cannot post document **Solutions**:

1. Check document is in DRAFT status
2. Verify all required fields
3. Check account balances (for payments)
4. Verify stock availability (for inventory items)

### 24.3 Report Discrepancies

**Problem**: Report totals don't match **Solutions**:

1. Check for unposted documents
2. Verify date range
3. Check account mappings
4. Run trial balance first

### 24.4 Database Connection

**Problem**: Cannot connect to database **Solutions**:

1. Check DATABASE_URL in .env
2. Verify database file exists
3. Check file permissions
4. Restart server

### 24.5 Performance Issues

**Problem**: System running slowly **Solutions**:

1. Clear browser cache
2. Reduce date range in reports
3. Archive old data
4. Check server resources

### 24.6 Contact Support

For additional help:

- 📧 Email: support@thaiaccounting.com
- 📞 Phone: 02-xxx-xxxx
- 💬 Live Chat: Available during business hours

---

## Appendix

### A. Keyboard Shortcuts

| Shortcut | Action              |
| -------- | ------------------- |
| Ctrl + N | Create new document |
| Ctrl + S | Save                |
| Ctrl + P | Print               |
| Ctrl + F | Search              |
| Escape   | Close modal         |
| F1       | Help                |

### B. Glossary

| Thai         | English             | Description             |
| ------------ | ------------------- | ----------------------- |
| ผังบัญชี     | Chart of Accounts   | List of all accounts    |
| ลูกหนี้      | Accounts Receivable | Money owed by customers |
| เจ้าหนี้     | Accounts Payable    | Money owed to vendors   |
| ใบกำกับภาษี  | Tax Invoice         | VAT invoice             |
| ใบเสร็จ      | Receipt             | Payment received        |
| ใบสำคัญ      | Voucher             | Payment voucher         |
| สมุดรายวัน   | Journal             | Transaction log         |
| งบดุล        | Balance Sheet       | Financial position      |
| งบกำไรขาดทุน | Income Statement    | Financial performance   |

### C. VAT Quick Reference

| Transaction Type   | VAT Treatment               |
| ------------------ | --------------------------- |
| Domestic sales     | 7% output VAT               |
| Domestic purchases | 7% input VAT                |
| Exports            | 0% VAT (with documentation) |
| Imports            | 7% VAT (at customs)         |

---

**Document Version:** 1.0.0  
**Last Updated:** March 16, 2026  
**© 2026 Thai Accounting ERP**
