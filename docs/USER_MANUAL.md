# Thai Accounting ERP - User Manual

## Complete Guide for Thai SME Businesses

**Version:** 1.0.0  
**Last Updated:** March 16, 2026  
**Language:** English/Thai

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Chart of Accounts](#chart-of-accounts)
4. [Sales & Invoicing](#sales--invoicing)
5. [Receipts & Payments](#receipts--payments)
6. [Purchases & Expenses](#purchases--expenses)
7. [Journal Entries](#journal-entries)
8. [Inventory Management](#inventory-management)
9. [Fixed Assets](#fixed-assets)
10. [Banking & Cheques](#banking--cheques)
11. [Petty Cash](#petty-cash)
12. [Payroll](#payroll)
13. [Tax Management](#tax-management)
14. [Financial Reports](#financial-reports)
15. [Settings & Configuration](#settings--configuration)
16. [Troubleshooting](#troubleshooting)

---

## Getting Started

### System Requirements

- **Browser:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Screen Resolution:** Minimum 1366x768 (1920x1080 recommended)
- **Internet:** Stable connection for cloud features
- **PDF Viewer:** For report viewing and printing

### Login

1. Navigate to your application URL (e.g., `http://localhost:3000`)
2. Enter your email and password
3. Click "เข้าสู่ระบบ" (Login)

**Default Test Accounts:**
- Admin: `admin@thaiaccounting.com` / `admin123`
- Accountant: `accountant@thaiaccounting.com` / `acc123`
- User: `user@thaiaccounting.com` / `user123`

![Login Screen](../screenshots/01-login.png)

### First-Time Setup

After first login as Admin:

1. **Company Settings**
   - Go to Settings → Company
   - Enter company name, tax ID, address
   - Set VAT rate (default: 7%)
   - Upload company logo

2. **Chart of Accounts**
   - System comes with 181 pre-configured Thai standard accounts
   - Review and customize as needed
   - Add sub-accounts for detailed tracking

3. **Bank Accounts**
   - Add your company's bank accounts
   - Set opening balances
   - Configure cheque books

![Settings Screen](../screenshots/02-settings.png)

### Navigation Overview

The sidebar menu is organized into:

```
📊 Dashboard          - Overview of business metrics
📒 General Ledger     - Journal entries, chart of accounts
💰 Sales              - Invoices, receipts, customers
🛒 Purchases          - Purchase orders, payments, vendors
📦 Inventory          - Products, stock movements, warehouses
🏭 Fixed Assets       - Asset register, depreciation
🏦 Banking            - Bank accounts, cheques, reconciliation
💵 Petty Cash         - Funds, vouchers, reimbursements
👷 Payroll            - Employees, salary processing
📑 Tax                - VAT, WHT, reports
📈 Reports            - Financial statements
⚙️ Settings           - Configuration, users, backup
```

---

## Dashboard Overview

The dashboard provides a real-time snapshot of your business:

### Key Metrics (Dashboard Cards)

1. **ยอดขายวันนี้ (Today's Sales)**
   - Total sales for current day
   - Comparison with yesterday

2. **ลูกหนี้ค้างชำระ (Outstanding AR)**
   - Total unpaid customer invoices
   - Overdue amount highlighted

3. **เจ้าหนี้ค้างชำระ (Outstanding AP)**
   - Total unpaid vendor bills
   - Due soon alerts

4. **เงินสดคงเหลือ (Cash Position)**
   - Bank account balances
   - Petty cash balance

### Charts & Graphs

- **Monthly Revenue Trend** - Line chart showing 12-month sales
- **Expense Breakdown** - Pie chart of expense categories
- **Top Customers** - Bar chart of highest-value customers
- **Stock Alerts** - Low inventory warnings

![Dashboard](../screenshots/03-dashboard.png)

### Quick Actions

- Create New Invoice
- Record Receipt
- Add Journal Entry
- View Reports

---

## Chart of Accounts

### Understanding Thai Account Structure

The chart follows the Thai Accounting Standards with 5 main categories:

| Code Range | Category | Thai Name |
|------------|----------|-----------|
| 1000-1999 | Assets | สินทรัพย์ |
| 2000-2999 | Liabilities | หนี้สิน |
| 3000-3999 | Equity | ทุน |
| 4000-4999 | Revenue | รายได้ |
| 5000-5999 | Expenses | ค่าใช้จ่าย |

### Account Levels

```
1xxx - Level 1 (Summary Account)
  11xx - Level 2 (Group)
    1101 - Level 3 (Control Account)
      1101-01 - Level 4 (Detail Account)
```

### Common Accounts Reference

#### Assets (1000)
| Code | Name | Usage |
|------|------|-------|
| 1101 | เงินสด | Cash on hand |
| 1102 | เงินฝากธนาคาร | Bank deposits |
| 1201 | ลูกหนี้การค้า | Accounts receivable |
| 1501 | อาคาร | Buildings |
| 1502 | เครื่องจักร | Machinery |

#### Liabilities (2000)
| Code | Name | Usage |
|------|------|-------|
| 2101 | เจ้าหนี้การค้า | Accounts payable |
| 2201 | ภาษีมูลค่าเพิ่มค้างส่ง | VAT payable |
| 2301 | เงินกระแสรายวัน | Short-term loans |

#### Revenue (4000)
| Code | Name | Usage |
|------|------|-------|
| 4101 | รายได้จากการขาย | Sales revenue |
| 4102 | รายได้ค่าบริการ | Service revenue |
| 4201 | รายได้อื่น | Other income |

### Creating New Accounts

1. Go to **General Ledger → Chart of Accounts**
2. Click **+ New Account**
3. Fill in the form:
   - **รหัสบัญชี (Account Code):** Must be unique (4-10 digits)
   - **ชื่อบัญชี (Account Name):** Thai name
   - **Account Name (English):** English name (optional)
   - **ประเภท (Type):** Select from dropdown
   - **บัญชีหลัก (Parent Account):** For sub-accounts
   - **บัญชีย่อย (Detail Account):** Check if this is a posting account

![Chart of Accounts](../screenshots/04-chart-of-accounts.png)

---

## Sales & Invoicing

### Sales Workflow

```
Lead → Quotation → Invoice → Issue → Receipt → Post to GL
```

### Creating a Sales Invoice

1. Navigate to **Sales → Invoices**
2. Click **+ New Invoice**
3. Fill in the header:
   - **ลูกค้า (Customer):** Select or create new
   - **วันที่ใบแจ้งหนี้ (Invoice Date):** Default today
   - **วันครบกำหนด (Due Date):** Auto-calculated from credit terms
   - **เลขที่อ้างอิง (Reference):** Your PO number or reference

4. Add line items:
   - Select product or enter description
   - Enter quantity and unit price
   - Discount % (if applicable)
   - VAT rate (default 7%)

5. Review totals:
   - Subtotal
   - Discount
   - VAT amount
   - **รวมทั้งสิ้น (Total Amount)**

6. Save as **Draft** or **Issue** immediately

![Create Invoice](../screenshots/05-create-invoice.png)

### Invoice Status Flow

```
DRAFT → ISSUED → PARTIAL → PAID
   ↓       ↓
CANCELLED  VOID (if needed)
```

- **DRAFT (ฉบับร่าง):** Can edit everything
- **ISSUED (ออกแล้ว):** Posted to GL, can receive payment
- **PARTIAL (ชำระบางส่วน):** Partial payment received
- **PAID (ชำระแล้ว):** Fully paid

### Issuing an Invoice

Issuing creates the accounting entries:

```
Dr: ลูกหนี้การค้า (Accounts Receivable)  XXX
    Cr: รายได้ขาย (Sales Revenue)           XXX
    Cr: ภาษีขาย (Output VAT)                XXX
```

1. Open the invoice
2. Click **ออกใบแจ้งหนี้ (Issue)**
3. System generates journal entry automatically
4. Invoice number assigned (format: INV-YYYYMM-XXXX)

### Managing Customers

#### Adding a New Customer

1. Go to **Sales → Customers**
2. Click **+ New Customer**
3. Enter details:
   - **รหัสลูกค้า (Customer Code):** Your internal code
   - **ชื่อบริษัท/ลูกค้า (Name):** Customer name
   - **เลขประจำตัวผู้เสียภาษี (Tax ID):** 13-digit Thai tax ID
   - **สาขา (Branch):** 00000 for head office
   - **ที่อยู่ (Address):** Full address
   - **วงเงินเครดิต (Credit Limit):** Maximum credit allowed
   - **ระยะเวลาเครดิต (Credit Days):** Payment terms

![Customer Form](../screenshots/06-customer-form.png)

#### Customer Aging Report

View outstanding invoices by age:
- Current (not yet due)
- 1-30 days overdue
- 31-60 days
- 61-90 days
- 90+ days

---

## Receipts & Payments

### Recording a Receipt

When customer pays an invoice:

1. Go to **Sales → Receipts**
2. Click **+ New Receipt**
3. Select **ลูกค้า (Customer)**
4. Choose **วิธีการชำระเงิน (Payment Method):**
   - เงินสด (Cash)
   - โอนเงิน (Bank Transfer)
   - เช็ค (Cheque)
   - บัตรเครดิต (Credit Card)

5. Enter **จำนวนเงิน (Amount)**
6. Allocate to invoices:
   - System shows unpaid invoices
   - Enter amount to apply to each
   - Can split across multiple invoices

7. Click **Save** then **Post**

![Receipt Form](../screenshots/07-receipt-form.png)

### Withholding Tax (WHT)

If customer deducts withholding tax:

1. Enter **ภาษีหัก ณ ที่จ่าย (WHT Amount)**
2. Select WHT type:
   - **PND3:** For individuals
   - **PND53:** For companies
3. WHT certificate will be generated
4. Track in **Tax → WHT Certificates**

### Making Vendor Payments

1. Go to **Purchases → Payments**
2. Select **เจ้าหนี้ (Vendor)**
3. View unpaid purchase invoices
4. Enter payment amount for each
5. Select payment method
6. Post payment

---

## Purchases & Expenses

### Purchase Invoice Workflow

```
Purchase Order → Receive → Invoice → Payment → Post
```

### Recording a Purchase Invoice

1. Go to **Purchases → Purchase Invoices**
2. Click **+ New Purchase Invoice**
3. Select **เจ้าหนี้ (Vendor)**
4. Enter **เลขที่ใบกำกับภาษี (Tax Invoice Number)**
5. Add line items
6. Save and Post

### Expense Recording

For non-inventory expenses:

1. Go to **Purchases → Expenses**
2. Select expense account
3. Upload receipt/invoice image
4. Enter amount and VAT
5. Categorize expense

---

## Journal Entries

### When to Use Manual Journal Entries

- Adjustments and corrections
- Accruals and deferrals
- Depreciation
- Year-end closing entries
- Initial opening balances

### Creating a Journal Entry

1. Go to **General Ledger → Journal Entries**
2. Click **+ New Journal Entry**
3. Enter:
   - **วันที่ (Date):** Transaction date
   - **คำอธิบาย (Description):** Clear description
   - **เลขที่อ้างอิง (Reference):** Supporting document number

4. Add journal lines:
   - Select account
   - Enter description per line
   - Enter **เดบิต (Debit)** OR **เครดิต (Credit)**

5. Ensure **Total Debits = Total Credits**
6. Save and Post

![Journal Entry](../screenshots/08-journal-entry.png)

### Common Journal Entry Types

#### Monthly Depreciation
```
Dr: ค่าเสื่อมราคาสะสม - เครื่องจักร  XXX
    Cr: เครื่องจักร                           XXX
```

#### Accrued Expenses
```
Dr: ค่าใช้จ่ายเบ็ดเตล็ดค้างจ่าย  XXX
    Cr: ค่าใช้จ่ายค้างจ่าย                    XXX
```

---

## Inventory Management

### Setting Up Products

1. Go to **Inventory → Products**
2. Click **+ New Product**
3. Enter details:
   - **รหัสสินค้า (Product Code):** SKU
   - **ชื่อสินค้า (Name):** Product name
   - **หน่วย (Unit):** Piece, Box, Kg, etc.
   - **ราคาขาย (Sale Price):** Standard price
   - **ต้นทุน (Cost):** Unit cost
   - **คงเหลือขั้นต่ำ (Min Stock):** Reorder point

### Inventory Tracking Methods

System supports **Weighted Average Cost (WAC)**:

```
Average Cost = Total Inventory Value / Total Quantity
```

### Stock Movements

Track all inventory changes:

| Type | Description |
|------|-------------|
| IN | Purchase receipt, production, return |
| OUT | Sale, production consumption, adjustment |
| TRANSFER | Between warehouses |

### Stock Taking (Physical Count)

1. Go to **Inventory → Stock Take**
2. Create new stock take
3. Enter actual quantities
4. System calculates variances
5. Approve to adjust inventory

---

## Fixed Assets

### Asset Registration

1. Go to **Fixed Assets → Asset Register**
2. Click **+ New Asset**
3. Enter:
   - **รหัสทรัพย์สิน (Asset Code):** Unique identifier
   - **ชื่อทรัพย์สิน (Name):** Description
   - **ประเภท (Category):** Building, Machinery, Vehicle, etc.
   - **วันที่ซื้อ (Acquisition Date):** Purchase date
   - **ราคาซื้อ (Cost):** Acquisition cost
   - **ค่าซาก (Salvage Value):** Estimated residual value
   - **อายุการใช้งาน (Useful Life):** Years
   - **วิธีคิดค่าเสื่อม (Method):** Straight-line or Declining balance

### Depreciation Calculation

Monthly depreciation = (Cost - Salvage Value) / (Useful Life × 12)

System auto-calculates and posts monthly.

### Asset Disposal

1. Open asset record
2. Click **จำหน่าย (Dispose)**
3. Enter disposal date and amount
4. System calculates gain/loss

---

## Banking & Cheques

### Bank Account Setup

1. Go to **Banking → Bank Accounts**
2. Add each bank account:
   - Bank name
   - Account number
   - Account type (Savings/Current)
   - Opening balance
   - Opening date

### Cheque Management

#### Issuing Cheques

1. Go to **Banking → Cheques**
2. Click **+ New Cheque**
3. Select bank account
4. Enter payee name
5. Enter amount (in numbers and words)
6. Print cheque or save as pending

#### Cheque Status Tracking

| Status | Description |
|--------|-------------|
| Pending | Not yet cleared |
| Cleared | Funds deducted |
| Bounced | NSF - returned |
| Cancelled | Voided before clearing |

### Bank Reconciliation

1. Go to **Banking → Reconciliation**
2. Select bank account and statement date
3. Enter statement ending balance
4. Mark each transaction as cleared
5. Verify difference is zero
6. Complete reconciliation

![Bank Reconciliation](../screenshots/09-bank-reconciliation.png)

---

## Petty Cash

### Petty Cash Fund Setup

1. Go to **Petty Cash → Funds**
2. Create fund:
   - Fund name (e.g., "Office Petty Cash")
   - Custodian (person responsible)
   - Imprest amount (fixed fund amount)
   - Location

### Recording Expenses (Vouchers)

1. Go to **Petty Cash → Vouchers**
2. Click **+ New Voucher**
3. Select fund
4. Enter:
   - Payee
   - Description
   - Amount
   - Expense account
   - Supporting receipt number
5. Save

### Reimbursement

When fund is low:

1. Count remaining cash
2. Total all unreimbursed vouchers
3. Create reimbursement request
4. Withdraw from bank to replenish fund

---

## Payroll

### Employee Setup

1. Go to **Payroll → Employees**
2. Add new employee:
   - Employee code
   - Full name (TH/EN)
   - ID card number
   - Position and department
   - Hire date
   - Base salary
   - Bank account for transfer

### Monthly Payroll Process

1. **Prepare Payroll**
   - Go to **Payroll → Process Payroll**
   - Select period (month/year)
   - Review all employees

2. **Enter Variables**
   - Overtime hours
   - Commissions
   - Deductions
   - Advances

3. **Calculate**
   - System computes:
     - Gross salary
     - Social Security (employee 5%, max 750 THB)
     - Withholding tax (PND1)
     - Net pay

4. **Review & Post**
   - Verify all calculations
   - Post to GL

5. **Generate Payslips**
   - Individual PDF payslips
   - Bank transfer file

### Tax Calculations

#### Social Security (ประกันสังคม)
- Employee contribution: 5% of wages (max 750 THB/month)
- Employer contribution: 5% of wages (max 750 THB/month)

#### Withholding Tax (ภาษีเงินได้หัก ณ ที่จ่าย)
Based on progressive tax rates after deductions.

---

## Tax Management

### VAT (ภาษีมูลค่าเพิ่ม 7%)

#### Output VAT (ภาษีขาย)
- Collected from customers on sales
- Shown on sales invoices
- Must be remitted to Revenue Department

#### Input VAT (ภาษีซื้อ)
- Paid to vendors on purchases
- Shown on purchase invoices
- Can be deducted from output VAT

#### VAT Filing (P.P.30)

1. Go to **Tax → VAT Reports**
2. Select month/year
3. Review:
   - Sales with VAT (Output)
   - Purchases with VAT (Input)
   - Net VAT payable or refundable
4. Export report for filing

![VAT Report](../screenshots/10-vat-report.png)

### Withholding Tax (ภาษีหัก ณ ที่จ่าย)

#### PND3 (Individuals)
- Services: 3%
- Professional fees: 3%

#### PND53 (Companies)
- Services: 3%
- Rent: 5%
- Advertising: 2%

#### Issuing WHT Certificates

1. Go to **Tax → WHT Certificates**
2. Create new certificate
3. Select vendor
4. Enter tax details
5. Generate and print (50 Tawi form)

---

## Financial Reports

### Available Reports

1. **Trial Balance (งบทดลอง)**
   - All accounts with balances
   - Verifies debits = credits

2. **Balance Sheet (งบดุล)**
   - Assets = Liabilities + Equity
   - As of specific date

3. **Income Statement (งบกำไรขาดทุน)**
   - Revenue - Expenses = Net Income
   - For a period

4. **General Ledger (บัญชีแยกประเภท)**
   - Detailed transaction history per account

5. **Cash Flow Statement (งบกระแสเงินสด)**
   - Operating, Investing, Financing activities

### Generating Reports

1. Go to **Reports → [Report Type]**
2. Select parameters:
   - Date range or As-of date
   - Comparison period (optional)
3. Click **Generate**
4. View on screen or export

### Report Export Options

- **PDF:** For printing and sharing
- **Excel:** For further analysis
- **CSV:** For data import

![Financial Reports](../screenshots/11-financial-reports.png)

---

## Settings & Configuration

### Company Settings

**Path:** Settings → Company

- Company name (TH/EN)
- Tax ID (13 digits)
- Address
- Phone, Email
- Logo upload
- Fiscal year start month

### Accounting Settings

- Default VAT rate (7%)
- Decimal places for amounts
- Date format
- Currency format

### Numbering Formats

Configure document numbering patterns:

```
Format: {PREFIX}-{YYYY}{MM}-{0000}
Example: INV-202603-0001
```

Available for:
- Invoices
- Receipts
- Journal Entries
- Purchase Invoices
- etc.

### User Management

**Path:** Settings → Users

#### Roles:
- **ADMIN:** Full access
- **ACCOUNTANT:** All accounting functions
- **USER:** Create/view only
- **VIEWER:** Read-only

#### Adding Users:
1. Click **+ New User**
2. Enter name and email
3. Assign role
4. Set password
5. Save

---

## Troubleshooting

### Common Issues

#### 1. Cannot Login
**Problem:** "อีเมลหรือรหัสผ่านไม่ถูกต้อง"

**Solutions:**
- Check Caps Lock is off
- Verify email spelling
- Reset password (contact admin)
- Clear browser cache

#### 2. Invoice Won't Issue
**Problem:** "ไม่สามารถออกใบแจ้งหนี้ได้"

**Solutions:**
- Check customer is selected
- Verify at least one line item exists
- Ensure quantities and prices are positive
- Check if invoice is already issued

#### 3. Journal Entry Won't Balance
**Problem:** "ยอดเดบิตและเครดิตไม่เท่ากัน"

**Solutions:**
- Verify all amounts are entered
- Check debit/credit column selection
- Total debits must equal total credits

#### 4. Report Shows No Data
**Problem:** Empty report

**Solutions:**
- Check date range is correct
- Verify transactions are posted (not draft)
- Ensure fiscal period is open

#### 5. Cannot Post Receipt
**Problem:** "ไม่สามารถโพสต์ใบเสร็จได้"

**Solutions:**
- Verify invoice is issued
- Check amount doesn't exceed invoice balance
- Ensure bank account has sufficient funds

### Error Messages Reference

| Error | Meaning | Solution |
|-------|---------|----------|
| ข้อมูลไม่ถูกต้อง | Invalid data | Check required fields |
| ไม่มีสิทธิ์ | No permission | Contact admin |
| เอกสารซ้ำ | Duplicate document | Use unique number |
| ยอดเงินไม่พอ | Insufficient amount | Check allocation |
| บัญชีถูกล็อก | Account locked | Contact admin |

### Getting Help

1. **In-App Help:** Click ? icon in top navigation
2. **Documentation:** https://docs.thaiaccounting.com
3. **Email Support:** support@thaiaccounting.com
4. **Phone:** 02-XXX-XXXX (Business hours)

### Backup & Restore

**Manual Backup:**
1. Go to **Settings → Backup**
2. Click **Create Backup**
3. Download backup file

**Restore:**
1. Go to **Settings → Restore**
2. Upload backup file
3. Confirm restore

**⚠️ Warning:** Restore will replace all current data!

---

## Appendix

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+N | New document |
| Ctrl+S | Save |
| Ctrl+P | Print |
| Ctrl+F | Search |
| Esc | Cancel/Close |
| F5 | Refresh |

### Thai Tax Calendar

| Form | Due Date |
|------|----------|
| P.P.30 (VAT) | 15th of following month |
| PND3 | 7th of following month |
| PND53 | 7th of following month |
| PND1 | 7th of following month |
| Social Security | 15th of following month |
| Half-year PND51 | 31 August |
| Annual PND50 | 150 days after year-end |

### Glossary

| English | Thai | Description |
|---------|------|-------------|
| Accounts Payable | เจ้าหนี้การค้า | Money owed to vendors |
| Accounts Receivable | ลูกหนี้การค้า | Money owed by customers |
| Asset | สินทรัพย์ | Resources owned |
| Depreciation | ค่าเสื่อมราคา | Asset value reduction |
| Equity | ทุน | Owner's stake |
| Expense | ค่าใช้จ่าย | Costs incurred |
| Liability | หนี้สิน | Debts owed |
| Revenue | รายได้ | Income earned |
| VAT | ภาษีมูลค่าเพิ่ม | Value Added Tax |
| WHT | ภาษีหัก ณ ที่จ่าย | Withholding Tax |

---

**End of User Manual**

For the latest updates, visit: https://docs.thaiaccounting.com

© 2026 Thai Accounting ERP. All rights reserved.
