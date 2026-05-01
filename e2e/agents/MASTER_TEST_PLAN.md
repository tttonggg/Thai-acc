# 🤖 MASTER TEST PLAN - Agent Swarm UI Testing

## Thai Accounting ERP - Complete Left Pane Menu Testing

**Server URL**: http://localhost:3000  
**Test Account**: admin@thaiaccounting.com / admin123  
**Date**: 2026-03-12  
**Framework**: Playwright + Multi-Agent Architecture

---

## 📊 HIERARCHICAL TEST STRUCTURE

### MAIN TASK: Complete UI Testing of All 16 Sidebar Menus

```
SUB TASK 1: Authentication & Access Control [AGENT_AUTH]
├── MICRO: Login with ADMIN role
├── MICRO: Verify all 16 menus visible
└── MICRO: Logout functionality

SUB TASK 2: Core Financial Modules [AGENT_FINANCE]
├── MICRO 2.1: Dashboard (ภาพรวม)
│   ├── NANO: Summary cards visibility
│   ├── NANO: Revenue vs Expense chart
│   ├── NANO: VAT chart
│   ├── NANO: AR/AP Aging charts
│   └── NANO: Quick Actions section
├── MICRO 2.2: Chart of Accounts (ผังบัญชี)
│   ├── NANO: Account tree display (181 accounts)
│   ├── NANO: Search functionality
│   ├── NANO: Add new account button
│   ├── NANO: Edit account button
│   ├── NANO: Delete account button
│   ├── NANO: Export CSV button
│   └── NANO: Import CSV button
├── MICRO 2.3: Journal Entries (บันทึกบัญชี)
│   ├── NANO: Journal entry form
│   ├── NANO: Add line button
│   ├── NANO: Remove line button
│   ├── NANO: Account selector
│   ├── NANO: Debit/Credit input
│   ├── NANO: Balance calculator
│   ├── NANO: Save button
│   └── NANO: Recent entries list
└── MICRO 2.4: Reports (รายงาน)
    ├── NANO: Trial Balance report
    ├── NANO: Balance Sheet report
    ├── NANO: Profit & Loss report
    └── NANO: Export options

SUB TASK 3: Sales & Receivables [AGENT_SALES]
├── MICRO 3.1: Invoices (ใบกำกับภาษี)
│   ├── NANO: Create new document button
│   ├── NANO: Document type selector (Tax/Receipt/Delivery/Credit/Debit)
│   ├── NANO: Search invoices
│   ├── NANO: Status filter
│   ├── NANO: View button
│   ├── NANO: Edit button
│   ├── NANO: Print button
│   └── NANO: Download PDF button
└── MICRO 3.2: Customers/AR (ลูกหนี้)
    ├── NANO: Customer list
    ├── NANO: Add customer button
    ├── NANO: Edit customer button
    ├── NANO: Delete customer button
    └── NANO: AR Aging view

SUB TASK 4: Purchasing & Payables [AGENT_PURCHASE]
└── MICRO 4.1: Vendors/AP (เจ้าหนี้)
    ├── NANO: Vendor list
    ├── NANO: Add vendor button
    ├── NANO: Edit vendor button
    ├── NANO: Delete vendor button
    └── NANO: AP Aging view

SUB TASK 5: Tax Modules [AGENT_TAX]
├── MICRO 5.1: VAT (ภาษีมูลค่าเพิ่ม)
│   ├── NANO: VAT Input report
│   ├── NANO: VAT Output report
│   ├── NANO: VAT Summary
│   └── NANO: PP30 report
└── MICRO 5.2: Withholding Tax (ภาษีหัก ณ ที่จ่าย)
    ├── NANO: WHT Report tab
    ├── NANO: WHT Management tab
    ├── NANO: PND3/PND53 filter
    └── NANO: 50 Tawi PDF download

SUB TASK 6: Expansion Modules [AGENT_MODULES]
├── MICRO 6.1: Inventory (สต็อกสินค้า)
│   ├── NANO: Stock Balance tab
│   ├── NANO: Stock Movements tab
│   └── NANO: Warehouses tab
├── MICRO 6.2: Banking (ธนาคาร)
│   ├── NANO: Bank Accounts tab
│   └── NANO: Cheque Register tab
├── MICRO 6.3: Fixed Assets (ทรัพย์สินถาวร)
│   ├── NANO: Asset list
│   ├── NANO: Add asset button
│   └── NANO: Depreciation schedule
├── MICRO 6.4: Payroll (เงินเดือน)
│   ├── NANO: Employee list tab
│   ├── NANO: Payroll runs tab
│   └── NANO: Add employee button
└── MICRO 6.5: Petty Cash (เงินสดย่อย)
    ├── NANO: Funds tab
    ├── NANO: Vouchers tab
    └── NANO: Create voucher button

SUB TASK 7: Administration [AGENT_ADMIN]
├── MICRO 7.1: Settings (ตั้งค่า)
│   ├── NANO: Company settings
│   ├── NANO: Document numbering
│   └── NANO: System preferences
└── MICRO 7.2: User Management (จัดการผู้ใช้)
    ├── NANO: User list
    ├── NANO: Add user button
    ├── NANO: Edit user button
    └── NANO: Role assignment

SUB TASK 8: UI-DB Alignment Verification [AGENT_VALIDATOR]
├── MICRO: Verify 181 Chart of Accounts in DB = UI
├── MICRO: Verify user roles match permissions
├── MICRO: Verify all modules have DB tables
└── MICRO: Generate alignment report
```

---

## 🎯 SIDEBAR MENU ITEMS (16 Total)

| #   | ID         | Label (TH)        | Label (EN)        | Role Access |
| --- | ---------- | ----------------- | ----------------- | ----------- |
| 1   | dashboard  | ภาพรวม            | Dashboard         | All         |
| 2   | accounts   | ผังบัญชี          | Chart of Accounts | All         |
| 3   | journal    | บันทึกบัญชี       | Journal Entries   | All         |
| 4   | invoices   | ใบกำกับภาษี       | Invoices          | All         |
| 5   | vat        | ภาษีมูลค่าเพิ่ม   | VAT               | All         |
| 6   | wht        | ภาษีหัก ณ ที่จ่าย | Withholding Tax   | All         |
| 7   | customers  | ลูกหนี้           | Customers/AR      | All         |
| 8   | vendors    | เจ้าหนี้          | Vendors/AP        | All         |
| 9   | inventory  | สต็อกสินค้า       | Inventory         | All         |
| 10  | banking    | ธนาคาร            | Banking           | All         |
| 11  | assets     | ทรัพย์สิน         | Fixed Assets      | All         |
| 12  | payroll    | เงินเดือน         | Payroll           | All         |
| 13  | petty-cash | เงินสดย่อย        | Petty Cash        | All         |
| 14  | reports    | รายงาน            | Reports           | All         |
| 15  | settings   | ตั้งค่า           | Settings          | ADMIN only  |
| 16  | users      | จัดการผู้ใช้      | User Management   | ADMIN only  |

---

## 🔧 TEST CONFIGURATION

```typescript
const CONFIG = {
  baseURL: 'http://localhost:3000',
  workers: 4,
  retries: 1,
  timeout: 60000,
  headers: { 'x-playwright-test': 'true' }, // Bypass rate limiting
};

const TEST_ACCOUNT = {
  email: 'admin@thaiaccounting.com',
  password: 'admin123',
  role: 'ADMIN',
};
```

---

## ✅ SUCCESS CRITERIA

1. All 16 sidebar menu items clickable and load their modules
2. All internal buttons within each module respond correctly
3. UI state matches database state (181 accounts, seeded data)
4. No console errors during navigation
5. All API calls return 200 status
6. Screenshots captured for visual verification
