# PEAK Accounting System — Design Reference

> Extracted from 32 UI screenshots of PEAK (peakaccount.com), a Thai cloud accounting SaaS.
> Version observed: **2.185.0** (April 2025)

---

## 1. Overview

PEAK is a full-featured Thai cloud accounting platform targeting SMEs. It covers the full accounting lifecycle: sales documents, purchasing, inventory, banking, general ledger, tax reporting, payroll, and document storage. The UI is Thai-first with English language switch support.

**Pricing Tiers:** e-Document, BASIC, PRO, PRO Plus (Best Seller), PREMIUM

---

## 2. Visual Design Language

### 2.1 Color Palette
- **Primary Gradient:** Purple to Teal/Cyan — used in header, CTA buttons, active states
- **Primary Purple:** Main action buttons, links, active tabs
- **Primary Teal:** Secondary accents, success states
- **Background:** Light blue-grey (#F0F4F8) for page canvas
- **Card Background:** White with subtle shadow
- **Text Primary:** Dark grey
- **Text Secondary:** Medium grey
- **Success/Positive:** Green accents for income, savings
- **Danger/Negative:** Red accents for unverified states, warnings

### 2.2 Typography
- Clean sans-serif, Thai script optimized
- Large bold headings for page titles
- Medium weight for card titles
- Regular for body text

### 2.3 Component Style
- **Cards:** White background, rounded corners (8-12px), subtle box-shadow, no borders
- **Buttons:**
  - Primary: Purple gradient, white text, fully rounded (pill shape)
  - Secondary: White background, grey border, rounded
  - Ghost: Transparent with icon + text
- **Dropdowns/Menus:** White card style with shadow, hover state light purple tint
- **Tabs:** Underline style or pill style depending on context
- **Icons:** Line-style icons (outlined), consistent sizing

---

## 3. Global Navigation

### 3.1 Top Header Bar
- **Logo:** PEAK wordmark with triangular icon on the far left
- **Company Switcher:** Dropdown to switch between companies/books
- **Company Code:** Displayed with copy icon
- **Trial Badge:** Pill badge showing days remaining
- **Right Side:** Notification bell, Help (?), App grid launcher, Language toggle (EN), User avatar dropdown

### 3.2 Main Tab Navigation (Horizontal Pills)
Below the header, a white rounded card contains 9 main module tabs with icons:

1. **Dashboard** — Home/overview
2. **Income** — Revenue documents
3. **Expense** — Cost documents
4. **Contacts** — Customers & suppliers
5. **Products** — Inventory & services
6. **Finance** — Banking & cash
7. **Accounting** — GL & reports
8. **Documents** — Document storage
9. **Settings** — Configuration

Active tab: filled purple background with white text + icon.
Inactive tab: transparent with purple text + icon.

Each tab opens a dropdown menu on hover showing sub-modules.

---

## 4. Module Breakdown

### 4.1 Dashboard (Home)
**Layout:** Single scrollable page with multiple card sections.

**Sections:**
- **Updates Carousel:** Horizontal scrollable cards showing promotions, feature announcements, webinars
- **Revenue & Expense Summary:** Year selector, three metric cards (Revenue, Expense, Profit/Loss) with YoY comparison
- **Receivable/Payable Aging:** Three donut charts showing outstanding amounts by age
- **Cash/Bank Balance:** Cards per bank account showing current balance
- **Tax Cards:** Horizontal cards for different tax forms (Phor.Por.30, Phor.Ngor.Dor.1, 3, 53)

**Side Panel:** Document aging summary with dropdown filters.

---

### 4.2 Income (Revenue)
**Left Sidebar Menu:**
- Overview
- Quotations
- Invoices (goods, services)
- Receipts
- Tax Invoices
- Additional Document Types (expandable)
- Import Documents (Excel)

**Main Content:**
- Action buttons: "+ Create Invoice" dropdown, "Print Report"
- Filter bar: Document type dropdown, Year selector
- Empty state: Illustration + "No data" message
- Stats panel: Revenue summary metrics

**Create Dropdown Options:**
Quotation, Invoice, Receipt, Credit Note, Debit Note, etc.

---

### 4.3 Expense (Costs)
**Left Sidebar Menu:**
- Overview
- Purchase Orders
- Expense Invoices
- Asset Purchases
- Asset Sales
- Withholding Tax purchases
- Additional types
- Import Documents

**Main Content:**
- Tax cards for Phor.Ngor.Dor.1, 3, 53 (withholding tax)
- Action buttons: "+ Create Expense" dropdown
- Filter bar similar to Income
- Stats panel: Expense summary metrics

**Create Dropdown Options:**
Purchase Order, Invoice, Receipt, Credit Note, Debit Note, etc.

---

### 4.4 Contacts (CRM)
**Layout:** Split view with left group panel and right contact list.

**Left Sidebar — Contact Groups:**
- All
- Customers (green dot)
- Suppliers (orange dot)
- Inactive
- Custom Groups ("+ Add")

**Main Content:**
- Action buttons: "+ Add Contact", "+ Add to Group", "Import Contacts", "Print"
- Search bar: "Search by name, code"
- Table columns: Checkbox, No., Name/Logo, Code, Group, Actions dropdown
- Pagination: Items per page selector, page navigator

---

### 4.5 Products (Inventory)
**Tabs:** Products | Services

**Action Buttons:**
- "+ Add Product" (primary)
- "Import Products"
- "Print Report"

**Sub-tabs:** All | Inactive

**Table columns:**
- Image/Logo
- SKU
- Product Name
- Unit
- Stock Quantity
- Selling Price/Unit

**Product Menu (dropdown):**
- Products/Services
- Units
- Product Categories
- Stock Adjustments

---

### 4.6 Finance (Banking)
**Menu:**
- Overview
- Cash/Bank/e-Wallet
- Reconciliation
- Withholding Tax at Source (Receive)
- Withholding Tax at Source (Pay)
- Additional Features (expandable)
  - Checks Receive
  - Checks Pay

**Main Content:**
- Bank account cards with balances
- Calendar view: Money In/Out calendar with transaction type filters
- Transaction categories: Money In, Overdue Receivable, Expected Money In, Money Out, Overdue Payable, Expected Money Out
- Right panel: Reconciliation status

---

### 4.7 Accounting (General Ledger)
**Menu:**
- Daily Journal
- Special Journal
- Chart of Accounts
- Ledger
- Trial Balance
- Financial Statements
- Additional Features (expandable)

**Chart of Accounts Page:**
- Action buttons: "+ Add Account", "+ Add Journal Entry", "Print"
- Left: Hierarchical account tree (expandable)
  - Assets (11), Liabilities (2), Equity, Revenue, Expenses
- Right: Account details panel
  - Account code, name, type, category, tax rate, currency

---

### 4.8 Documents (Document Storage)
File repository for storing and organizing accounting documents.

---

### 4.9 Settings
**Left Sidebar Menu:**
- Company Info / Branch
- Company Info
- Business Type
- Company Logo
- Branches
- User Permissions
- Documents
- Account Settings
- Tax Settings
- Payment Methods
- Document Storage
- Payroll Opening Balance

**Company Info Page:**
- Package info card (current plan, user limit)
- Active package, expiration date
- Usage info: Users (1/10)
- Business type selector (startup, SME, etc.)
- Billing cycle selector (monthly/yearly)

---

## 5. Common UI Patterns

### 5.1 Page Header Pattern
- Breadcrumb navigation (e.g., Settings > User Settings)
- Page title (large bold)
- Primary action button (purple, left-aligned)
- Secondary action buttons (white outline)

### 5.2 Card Pattern
- White rounded rectangle
- Light shadow on hover
- Title at top left
- Action dropdown or button at top right
- Content below

### 5.3 Empty State Pattern
- Centered illustration or icon
- "No data available" message in Thai
- Optional CTA button to create first item

### 5.4 Filter Bar Pattern
- Dropdown selectors (document type, year, month)
- Year selector with calendar icon
- Compact, horizontally aligned

### 5.5 Stats/Summary Pattern
- Horizontal row of metric cards
- Large number value
- Small label below
- Color-coded (green = positive, red = negative, grey = neutral)
- YoY/MoM comparison badge

### 5.6 Form Pattern
- Two-column layout for settings forms
- Left sidebar navigation for settings categories
- Right panel shows active section
- Input fields: rounded borders, light grey background on focus

---

## 6. Feature Matrix (by Plan)

| Feature Category | BASIC | PRO | PRO Plus | PREMIUM |
|------------------|-------|-----|----------|---------|
| Users | 5 | 10 | 10 | 10 |
| Bank Channels | 5 | 10 | 25 | 50 |
| Employee Limit | 10 | 20 | Unlimited | Unlimited |
| e-Tax Invoice | No | No | Yes | Yes |
| FIFO Inventory | No | Yes | Yes | Yes |
| Excel Import/Export | No | Yes | Yes | Yes |
| AI Price Recommendations | Yes | Yes | Yes | Yes |
| API Access | No | No | Extra cost | Extra cost |
| PEAK Board (BI) | No | No | Yes | Yes |
| PEAK Payroll | Yes | Yes | Yes | Yes |
| PEAK Asset | No | Yes | Yes | Yes |
| PEAK Tax | No | Yes | Yes | Yes |
| LINE Integration | Yes | Yes | Yes | Yes |
| Mobile App | Yes | Yes | Yes | Yes |

---

## 7. Key Design Decisions

1. **Gradient Header:** Creates visual identity and distinguishes PEAK from competitors
2. **Tab-based Navigation:** Reduces cognitive load by grouping related functions
3. **Card-based Layout:** Consistent container pattern across all modules
4. **Split-pane for Settings:** Persistent left navigation reduces page switching
5. **Empty States with Illustrations:** Friendly onboarding for new users
6. **Contextual Create Buttons:** Dropdown menus reduce UI clutter while maintaining quick access
7. **Thai-first Language:** All labels, dates, and currency formatted for Thai accounting standards
8. **Tax Card Pattern:** Visual representation of pending tax obligations

---

## 8. Responsive / Layout Notes

- App appears designed primarily for desktop (width ~1440px)
- Left sidebar collapses or becomes overlay on smaller screens
- Cards reflow from 3-column to 2-column to 1-column
- Floating action buttons visible in bottom-right on some views
- Chat/support widget visible as floating button

---

*Document generated from visual analysis of PEAK Accounting UI screenshots.*
