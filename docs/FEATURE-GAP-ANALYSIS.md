# Thai-Acc / Keerati — Feature Gap Analysis & User Empathy Report

**Research date:** 2026-05-04
**Scope:** Global SME ERP user pain points + live app UX audit + codebase inventory

---

## Part 1: What Global SME ERP Users Complain About (Primary Pain Points)

Ranked by complaint frequency (Reddit, G2, Capterra):

| # | Pain Point | Source |
|---|-----------|--------|
| 1 | **Overwhelming complexity** — too many features, confusing UI, requires accounting degree | r/smallbusiness, r/accounting |
| 2 | **Too expensive** — subscription fees for unused features, price hikes | G2, Capterra reviews |
| 3 | **Manual work** — bank rec, categorization, data entry all manual | r/entrepreneur, G2 |
| 4 | **Poor support** — long wait times, unhelpful agents | Capterra |
| 5 | **Integration failures** — bank连接, e-commerce, payroll doesn't sync | G2, Reddit |
| 6 | **Invoice/estimate friction** — can't create professional docs easily | r/smallbusiness |
| 7 | **Tax time nightmare** — categories don't match tax forms | Reddit |
| 8 | **Mobile limitations** — desktop features missing on mobile | G2 |
| 9 | **Steep learning curve** — requires tutorials/courses just to start | Capterra |
| 10 | **Inventory weakness** — inadequate for product businesses | G2 |

### Most Requested Features (Globally)

1. **AI-powered automation** — auto-categorization, smart reconciliation, voice entry
2. **Simpler UI** — clean, one-page dashboard, anyone can use
3. **Integrated payroll** — seamless, no third-party needed
4. **Professional invoicing** — templates, automatic payment reminders, QR payment
5. **Affordable pricing** — free/low-cost for micro-businesses
6. **Tax preparation tools** — built-in estimates, automatic category mapping to tax forms
7. **Inventory management** — simple but effective stock tracking
8. **Multi-currency** — for international transactions
9. **Time tracking** — project profitability analysis
10. **Clear reporting** — visual dashboards, not just numbers

### Why Users Switch ERP

1. Price increases (sudden, drastic)
2. Can't reach real support
3. Too complicated for their needs
4. Outgrew the software (missing features)
5. Can't export/migrate their data
6. Slow, crashes, performance issues
7. Bank/payment integration failures
8. Poor mobile experience

---

## Part 2: What's in Keerati (Thai-Acc) Today

### Modules Present ✅

**Core Accounting:**
- Chart of Accounts (ผังบัญชี)
- Journal Entries (รายวัน) with auto-JE
- Bank reconciliation (ธนาคาร)
- Multi-currency
- Accounting periods

**Sales:**
- Quotations (ใบเสนอราคา)
- Tax Invoices (ใบกำกับภาษี)
- Receipts (ใบเสร็จรับเงิน)
- Credit Notes (ใบลดหนี้)
- Customer management

**Purchasing:**
- Purchase Orders (ใบสั่งซื้อ)
- Payments (ใบจ่ายเงิน)
- Debit Notes (ใบเพิ่มหนี้)
- Vendor management

**Inventory:**
- Stock management (สินค้าคงคลัง)
- Stock takes
- Product management

**Banking:**
- Bank accounts
- Bank statement parsing
- Reconciliation

**Payroll:**
- SSC calculation (social security)
- PND1 tax (withholding)
- Employee management

**Tax:**
- VAT reporting
- WHT certificates (50TB, 3ยใ, etc.)
- Tax form generation

**Assets:**
- Fixed assets (ทรัพย์สินถาวร)
- Depreciation (auto/monthly)

**Reports:**
- Dashboard (ภาพรวมธุรกิจ)
- Sales reports
- Expense reports
- VAT reports
- AR/AP aging (ลูกหนี้/เจ้าหนี้ตามอายุ)
- Income vs Expense charts

**Settings:**
- Organization info
- Starting date
- Fiscal year
- Currency
- Invoice numbering
- VAT rate
- User management
- Role permissions (RBAC)
- Theme customization (ปรับแต่งธีม)

**Integrations/Advanced:**
- POS (Point of Sale)
- Data import
- PDF export
- Excel export
- Webhooks
- API access
- Activity logs
- Notifications (Alt+T)

---

## Part 3: Feature Gaps — What's Missing or Needs Improvement

### 🔴 HIGH Priority (User Pain Points / Common Complaints)

#### G1: Auto-Bank Reconciliation (CRITICAL)
**What it is:** System automatically matches bank statement lines to invoices/payments
**Why it matters:** #3 global complaint — manual bank rec is the #1 time sink for accountants
**Status in Keerati:** Basic reconcile UI exists (`banking-page.tsx`), but NO auto-matching engine. User must manually click each line.
**What users want:** Upload bank CSV → system auto-matches to invoices/payments with confidence score → user approves

#### G2: Approval Workflow / Document Approvals (CRITICAL)
**What it is:** PO, Invoice, Payment require manager approval before posting
**Why it matters:** Every SME with >2 employees needs this. PEAK AFP and SAP all have it.
**Status in Keerati:** `approval` mentioned in code but NO approval workflow UI or engine. `DocumentApproverConfig` schema exists (RBAC was done) but no UI to configure it.
**What users want:** Configurable multi-level approval chains (e.g., PO > ฿50,000 needs manager sign-off)

#### G3: Professional Invoice/Quote Templates
**What it is:** Branded PDF invoices with company logo, QR payment code, nice typography
**Why it matters:** #6 complaint — invoice creation is friction
**Status in Keerati:** Basic PDF export exists but templates are plain. No QR payment code on invoice.
**What users want:** 
- Auto-insert company logo
- QR code for PromptPay/bank transfer payment
- Professional Thai-language templates
- Email invoice directly from system

#### G4: Tax Form Auto-Fill (PND3, 50TB)
**What it is:** System pre-fills withholding tax forms (PND3, 50TB) from payment data
**Why it matters:** Thai tax compliance is complex. Manual form filling is error-prone.
**Status in Keerati:** WHT certificate generation exists, but PND3 auto-fill from transactions is manual/not integrated
**What users want:** Select month → system generates PND3 PDF with all payments pre-filled

#### G5: Dashboard Quick Actions / Home Page Widgets
**What it is:** One-click actions on dashboard — "New Invoice", "Record Expense", "Bank Rec"
**Why it matters:** Global #10 complaint — users want speed, not navigation
**Status in Keerati:** Dashboard shows charts but NO quick action buttons
**What users want:** Large buttons: "+ ใบวางบิล", "+ บันทึกรายจ่าย", "+ ดึงข้อมูลธนาคาร"

### 🟡 MEDIUM Priority (Competitive Features)

#### G6: Recurring Transactions
**What it is:** Set-and-forget recurring invoices, expenses, payments (e.g., monthly rent)
**Why it matters:** Saves hours of repetitive data entry
**Status in Keerati:** NOT found in codebase
**What users want:** "Repeat monthly on the 1st" — auto-create invoice from template

#### G7: Project/Job Costing
**What it is:** Track revenue and costs per project/job
**Why it matters:** Freelancers and SMEs track profitability per job
**Status in Keerati:** NOT found as a module
**What users want:** "New Project" → assign invoices/expenses to project → profit/loss per project report

#### G8: Petty Cash Management
**What it is:** Dedicated petty cash fund, replenishments
**Why it matters:** Common SME need
**Status in Keerati:** "เงินสดย่อย" card exists on dashboard but functionality unclear
**What users want:** Track petty cash disbursements, request replenishment

#### G9: Budget vs Actual
**What it is:** Set annual/monthly budgets, compare to actual
**Why it matters:** SMEs want to control spending
**Status in Keerati:** NOT found in codebase
**What users want:** Budget ฿500,000 for "ค่าเดินทาง" → monthly tracking → alert when 80% consumed

#### G10: Customer/Supplier Portal
**What it is:** Customers log in to see invoice status, pay online
**Why it matters:** Reduces "where's my invoice?" emails
**Status in Keerati:** NOT found
**What users want:** Customer portal with invoice list, one-click payment link

#### G11: Smart Search / Global Command Bar
**What it is:** Press `/` or `Ctrl+K` → search everything
**Why it matters:** Power users live here
**Status in Keerati:** NOT found
**What users want:** "Ctrl+K ค้นหา..." → type "ใบกำกับภาษี ลูกค้า กรกฎาคม" → instant results

#### G12: Email/SMS Invoice Reminders
**What it is:** Auto-send payment reminder at 7 days, 30 days overdue
**Why it matters:** collections is manual pain
**Status in Keerati:** NOT found
**What users want:** "Auto-send reminder email when invoice 7 days overdue"

### 🟢 LOWER Priority (Nice to Have)

#### G13: Payroll Payslip Generation
**What it is:** Generate professional payslip PDFs
**Status in Keerati:** Basic payroll exists but payslip PDF generation not evident
**What users want:** Employee → Generate Payslip → PDF with salary, deductions, SSC

#### G14: Multi-Branch Support
**What it is:** One database, multiple company branches
**Why it matters:** Growing SMEs open branches
**Status in Keerati:** Schema has `branchId` but UI not evident
**What users want:** Switch branch from dropdown — all reports filter by branch

#### G15: Audit Trail / Change History
**What it is:** See WHO changed WHAT and WHEN on any record
**Status in Keerati:** Activity logs exist but basic — no field-level change tracking
**What users want:** "Admin changed invoice #104 from ฿10,000 → ฿12,000 on May 3, 2026"

#### G16: Data Export API
**What it is:** REST/GraphQL API for third-party integrations
**Status in Keerati:** Basic API routes exist but no public API documentation
**What users want:** Developers want to build custom integrations

#### G17: Bank PromptPay/QR Payment Integration
**What it is:** Generate QR code on invoice for PromptPay transfer
**Why it matters:** Thailand standard for B2C payments
**Status in Keerati:** NOT found
**What users want:** Invoice includes QR code — customer scans with mobile banking app

#### G18: Stock Low-Alert / Reorder Point
**What it is:** Alert when stock falls below reorder point
**Status in Keerati:** Stock take exists but NO automatic low-stock alerts
**What users want:** "สินค้า กาแฟ เหลือ 5 ชิ้น — ต่ำกว่า reorder point"

#### G19: Depreciation Preview / What-If
**What it is:** See future depreciation schedule before buying asset
**Status in Keerati:** Depreciation runs monthly but no "what-if" projection
**What users want:** "If I buy ฿500,000 truck, what does depreciation look like over 5 years?"

#### G20: Document Attachment
**What it is:** Attach PDFs, images to any transaction
**Status in Keerati:** NOT found
**What users want:** Attach delivery note PDF to invoice, receipt image to expense

---

## Part 4: UX Empathy — What Feels Wrong to Users

Based on live app inspection + global patterns:

### UX Issues Found in App

| # | Issue | Location | Severity |
|---|-------|----------|----------|
| U1 | **Blocking "starting date" error** on first login | Login landing | 🔴 Critical |
| U2 | **Dashboard shows 0 for everything** — new user sees empty state, no guidance | Dashboard | 🔴 Critical |
| U3 | **No quick action buttons** on dashboard — must navigate through menus | Dashboard | 🟡 Medium |
| U4 | **Theme dialog opens automatically on load** and steals focus | Every page | 🟡 Medium |
| U5 | **No breadcrumbs** — user gets lost in deep pages | Deep pages | 🟡 Medium |
| U6 | **"0%" for month-over-month** — meaningless without prior period data | Dashboard cards | 🟡 Medium |
| U7 | **No empty state design** — "No Recent Transactions" is plain text | Dashboard | 🟡 Medium |
| U8 | **Sidebar collapsed by default** on wide screens | All pages | 🟢 Low |
| U9 | **No global search** (Ctrl+K) | All pages | 🟡 Medium |
| U10 | **Notifications panel** (Alt+T) — existence not discoverable | All pages | 🟢 Low |

### Specific Thai User Empathy Findings

Thai SME owners typically:
- **Are not accountants** — need "stupid simple" interfaces
- **Use LINE** — expect LINE notifications, not just in-app
- **Use mobile** — Thai mobile-first users expect decent mobile UI
- **Speak Thai** — all UI labels good, but error messages often untranslated
- **Have small teams** — 1-2 people doing everything, need speed not features
- **Fear making mistakes** — audit trail and undo are important
- **Have seasonal tax pressure** — March and September are stressful — need good tax prep UX

---

## Part 5: Recommended Priority Matrix

| Priority | User Impact | Dev Effort | Recommendation |
|----------|-------------|------------|----------------|
| G1 (Auto-bank rec) | 🔴 High | High | Phase 2 — critical for daily use |
| G2 (Approval workflow) | 🔴 High | Medium | Phase 1.5 — RBAC already done |
| G3 (Invoice templates + QR) | 🔴 High | Low | Phase 1 — quick win |
| G4 (Tax auto-fill) | 🔴 High | Medium | Phase 1 — clear Thai compliance need |
| G5 (Quick actions) | 🟡 Medium | Low | Phase 1 — trivial add |
| G7 (Project costing) | 🟡 Medium | Medium | Phase 2 |
| G11 (Global search) | 🟡 Medium | Medium | Phase 2 |
| G12 (Auto reminders) | 🟡 Medium | Medium | Phase 2 |
| G13 (Payslip PDF) | 🟡 Medium | Low | Phase 1 |
| G17 (PromptPay QR) | 🟡 Medium | Medium | Phase 2 |
| G18 (Stock alerts) | 🟡 Medium | Low | Phase 2 |
| G9 (Budget vs actual) | 🟡 Medium | Medium | Phase 3 |
| G6 (Recurring) | 🟢 Lower | Medium | Phase 3 |
| G10 (Customer portal) | 🟢 Lower | High | Phase 3+ |

---

## Part 6: Quick Wins (1-2 days each)

1. **Add QR payment field to invoice** — manual entry ok for now
2. **Quick action buttons on dashboard** — "+ สร้างใบวางบิล", "+ บันทึกรายจ่าย"
3. **Empty state redesigns** — add illustrations + "สร้างรายการแรก" CTAs
4. **Starting date guidance** — link directly to settings instead of blocking banner
5. **Ctrl+K search** — basic version with existing data
6. **Auto email reminder** — trigger on overdue invoice (needs email setup first)
7. **Payslip PDF template** — use existing PDF infrastructure

---

## Sources

- Reddit r/smallbusiness, r/accounting, r/entrepreneur (SME pain points)
- G2.com accounting software reviews
- Capterra accounting software reviews  
- PEAK AFP transition discussions (Thai market)
- Thai SME accounting software comparisons (web research)
- Live app inspection: Keerati ERP v1.0 at localhost:3000
