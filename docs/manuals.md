```markdown
# Accounting App UI/UX Designer Narrative  
**& Comprehensive Backend + Middleware Specifications**  
*(Inspired by PEAK — Reference Only, Not a Copy)*

**Version:** 1.0  
**Date:** April 17, 2026  
**Audience:** UI/UX Designers + Backend/Middleware Engineering Teams  
**Purpose:** Provide a complete, visionary narrative to guide the design of a modern Thai-focused cloud accounting SaaS app for SMBs, while simultaneously detailing every backend and middleware component required to power **all** observed features.

---

## 1. Designer Narrative – The Vision

### 1.1 Core Philosophy
Imagine an accounting app that feels like a **trusted financial co-pilot** — not a dense ERP. Every screen must answer three questions instantly:  
1. “Where am I financially right now?”  
2. “What do I need to do next?”  
3. “How do I stay compliant with Thai regulations effortlessly?”

**Design Language** (inspired by but evolved from the reference):  
- **Primary palette**: Deep indigo (#4F46E5) + teal accents (#14B8A6) for trust + action. Soft neutral background (#F8FAFC).  
- **Typography**: Thai-optimized Noto Sans Thai + Inter. Clear hierarchy (24 px headings, 14 px body).  
- **Components**: Card-based layout, generous whitespace, subtle shadows, micro-animations on hover/save.  
- **Mobile-first + Desktop harmony**: Collapsible sidebar on desktop, bottom nav + floating action button on mobile.  
- **Accessibility**: WCAG 2.2 AA, high contrast, keyboard navigation, screen-reader friendly Thai labels.

### 1.2 Global Layout (Consistent Across All Modules)
- **Top Bar** (fixed): Logo | Search (global + context-aware) | Module switcher (icons + Thai labels) | Notifications (bell with badge) | User avatar → quick profile + company switcher.  
- **Left Sidebar** (collapsible): Top-level modules with badges for “new” or “needs attention”. Sub-menus expand on hover/click.  
- **Main Content Area**: Dynamic — tables for lists, kanban for workflows, dashboards for overview.  
- **Contextual Right Rail** (optional, toggleable): Quick stats, AI suggestions, recent documents.  
- **Floating Action Button (FAB)**: Always-visible purple “+ สร้าง” (Create) that opens context menu based on current module.

### 1.3 Key User Personas & Journeys (Multi-Angle View)
- **Owner/Founder** (CEO view): Dashboard-first, one-glance metrics, AI insights.  
- **Accountant/Bookkeeper**: Heavy table use, bulk actions, audit trails, double-entry journal flow.  
- **Sales/Inventory Manager**: Product catalog + stock alerts + barcode scanning (mobile).  
- **Freelancer/Small Shop**: Simplified invoice → LINE share → auto bank sync.  
- **Edge Cases**: Multi-company users, seasonal businesses, VAT-registered vs non-registered, Thai + English bilingual.

**Core Journey Example – “Sell Product → Get Paid → Reconcile”**  
1. Dashboard → quick “สร้างใบแจ้งหนี้” → auto-pull product + customer.  
2. Preview PDF → send via LINE/Email/SMS.  
3. Customer pays via QR → auto-match in Finance → update inventory FIFO.  
4. AI suggests next action (“Low stock on Item X — reorder?”).

---

## 2. Module-by-Module UI/UX Specifications (Reference Style, Not Copy)

### 2.1 Dashboard (หน้าหลัก)
- Hero metrics cards (4–6) with sparkline charts.  
- Two-column layout: Left = Cash flow graph + P&L summary; Right = “Things to do” (overdue invoices, low stock, tax deadlines).  
- Recent activity feed (infinite scroll).  
- **AI Widget**: “PEAK Smart Summary” — natural Thai sentence + one-click actions.

### 2.2 Income (รายรับ) & Expense (รายจ่าย)
- Unified “Documents” tabbed interface (Quotes, Invoices, Receipts, Credit/Debit Notes, Bills, Payments).  
- **List View**: Advanced filter bar (status, date range, contact, amount, tax type). Sortable columns. Bulk actions (print, email, mark paid).  
- **Create/Edit Form**: Modal or full-screen. Auto-numbering per series. Product/service picker (searchable). Real-time total + VAT calculation. Thai tax fields (ก.พ.30, ภ.ง.ด.1, etc.).  
- **Preview Pane**: Live PDF on the right (responsive). One-click “ส่งผ่าน LINE @PEAKConnect”.  
- **Nuance**: Draft vs Issued vs Paid states with color badges + timeline.

### 2.3 Contacts (ผู้ติดต่อ)
- Dual tabs: ลูกค้า / ผู้ขาย.  
- Kanban or table view. Quick filters + smart search (name, tax ID, phone).  
- Detail view: Transaction history, outstanding balance, credit limit, notes, attachment gallery.

### 2.4 Inventory / Products (สินค้า)
- Catalog grid + table toggle.  
- Columns: SKU, Name, Unit, Stock Qty, Cost (FIFO), Selling Price, Low-stock alert.  
- **Stock Movement History** sub-tab.  
- **Mobile UX**: Barcode scanner button → instant add/adjust stock.

### 2.5 Finance (การเงิน) & Accounting (บัญชี)
- Chart of Accounts tree view (draggable hierarchy).  
- Bank / e-Wallet cards with balance + last sync time.  
- Reconciliation view: Side-by-side bank statement import vs internal ledger.  
- Journal entry form with double-entry validation (debit = credit).

### 2.6 Documents & Reports (คลังเอกสาร)
- Folder-style or smart search.  
- e-Document status (Draft → Sent → Paid → Cancelled).  
- Export hub: Excel, PDF, e-Tax XML.

### 2.7 Settings & Package Management (ตั้งค่า)
- Vertical tabs matching the reference (ข้อมูลแพ็กเกจ, ตั้งค่าองค์กร, etc.).  
- **Feature Matrix Table** (exactly like reference screenshots but with your branding): Interactive toggles that show/hide features instantly based on plan.  
- User & permission management with role templates.

### 2.8 Advanced Modules (Payroll, Assets, Tax, API)
- Separate top-level icons with “PRO / PREMIUM” badges.  
- Payroll: Employee cards → salary calculator → payslip generator.  
- Assets: Depreciation schedule + barcode tagging.  
- Tax: One-click ก.พ.30 / ภ.ง.ด. forms with auto-fill from transactions.

---

## 3. Backend & Middleware Architecture – Every Feature Detailed

### 3.1 High-Level Architecture
- **Multi-tenant SaaS** (Company → Users → Roles).  
- **Microservices** (or well-modularized monolith):  
  - `auth-service`  
  - `billing-service` (plans & feature flags)  
  - `core-accounting-service`  
  - `inventory-service`  
  - `document-service` (PDF, e-Tax)  
  - `finance-service`  
  - `payroll-service`  
  - `integration-service` (LINE, banks, DBD)  
- **Database**: PostgreSQL (main) + Redis (cache/session) + S3-compatible (documents).  
- **Message Queue**: RabbitMQ / Kafka for async jobs (PDF gen, email, bank sync, reports).  
- **API Gateway**: Kong or Traefik + rate limiting + request validation.  
- **Auth**: JWT + Refresh tokens + Company-scoped claims + 2FA + PIN code.

### 3.2 Feature Flags & Subscription Gating (Critical)
- Table `plans` + `plan_features` (JSON or separate rows).  
- Middleware interceptor `FeatureGateMiddleware` checks user’s active plan before every endpoint.  
- Returns 403 with friendly Thai message + upgrade CTA.

### 3.3 Detailed Backend Requirements by Feature

| Feature (from screenshots) | Backend Models | Key Business Logic | APIs (REST + WebSocket where needed) | Middleware / Async Tasks | Edge Cases & Integrations |
|----------------------------|----------------|---------------------|---------------------------------------|--------------------------|---------------------------|
| **Package Comparison & Billing** | `plans`, `company_subscriptions`, `feature_flags` | Renewal cron, proration, downgrade protection | `/billing/plans`, `/billing/upgrade` | Stripe/Omise webhooks | Grace period, seat-based licensing |
| **Product / Inventory** | `products`, `stock_movements`, `inventory_batches` | FIFO cost calc, low-stock alerts | CRUD + `/inventory/adjust`, `/inventory/fifo-report` | Queue: stock-sync, low-stock email/LINE | Multi-warehouse, serial numbers, negative stock lock |
| **Income Documents (Invoice, Receipt, etc.)** | `documents` (polymorphic), `document_lines`, `tax_lines` | Auto-numbering per series, VAT 7%, e-Tax stamp | `/documents/create`, `/documents/send-line` | PDF generation queue, e-Tax API call | Credit notes, partial payments, currency (THB primary) |
| **Expense Documents** | Same `documents` table + type | Approval workflow (optional) | Same as above | Bank matching queue | Multi-approver, recurring expenses |
| **Contacts** | `contacts`, `contact_transactions` | Credit limit enforcement | CRUD + merge duplicates | Background enrichment (tax ID lookup) | Import from CSV/Excel |
| **Finance / Bank** | `accounts`, `transactions`, `bank_feeds` | Reconciliation engine | `/finance/reconcile`, `/finance/bank-sync` | Daily bank API polling (SCB, KBANK, BAY) | Multi-currency rounding, manual journal |
| **Accounting / Chart of Accounts** | `chart_of_accounts`, `journal_entries` (double-entry) | Auto-posting rules | `/accounting/journal`, `/accounting/trial-balance` | Real-time balance recalc | Year-end close, audit trail immutable |
| **Payroll** | `employees`, `payroll_runs`, `payslips` | Tax withholding, social security | `/payroll/run`, `/payroll/payslip-pdf` | Monthly cron + DBD/PND upload | Variable pay, multiple branches |
| **Assets** | `assets`, `depreciation_schedules` | Straight-line / declining balance | CRUD + depreciation cron | Monthly journal auto-post | Disposal, partial sale |
| **Tax (ก.พ.30, ภ.ง.ด., DBD e-Filing)** | `tax_filings` | Auto-fill from aggregated data | `/tax/generate-form`, `/tax/submit-dbd` | XML/JSON generation + API gateway to gov portals | Draft vs submitted, corrections |
| **Documents & e-Document** | `stored_documents` (S3) + metadata | Versioning, OCR fallback | `/documents/upload`, `/documents/ocr` | OCR queue (Thai support) | Lazada/Shopee/TikTok import |
| **AI Features** (price suggestion, stock forecast) | ML models (separate service) | Trained on historical data | `/ai/suggest-price`, `/ai/forecast-stock` | Inference queue | Privacy — anonymized training |
| **LINE @PEAKConnect & Mobile** | `line_integrations`, `push_tokens` | OAuth + webhook | Webhook endpoint + `/mobile/push` | Real-time notification service | Thai language templates |
| **Reports & Dashboard** | Materialized views + OLAP cache | Aggregations (daily/weekly) | `/reports/pnl`, `/dashboard/metrics` | Redis cached queries + export queue | Custom report builder |
| **Open API & Partners** | `api_keys`, `webhooks` | Rate limit per key | Full CRUD under `/v1/` | Webhook retry queue | Partner-specific scopes |
| **Settings & Permissions** | `roles`, `permissions`, `user_company_roles` | RBAC matrix | `/settings/permissions` | Audit log service | Company switcher security |

### 3.4 Middleware Stack (Explicit)
1. **Auth Middleware** — validates JWT + company context.  
2. **Feature Gate Middleware** — blocks disabled features.  
3. **Rate Limit + Security** — per IP / per user / per API key.  
4. **Request Validation** — Zod/Pydantic schemas (Thai error messages).  
5. **Logging & Observability** — OpenTelemetry + ELK stack.  
6. **Background Job Middleware** — Celery / BullMQ with dead-letter queues.  
7. **File & Document Middleware** — Virus scan + encryption at rest.  
8. **Thai Government Integration Gateway** — dedicated service with retry + circuit breaker for e-Tax/DBD.

### 3.5 Data Consistency & Edge Cases Handled
- **Event Sourcing** for journal entries (immutability).  
- **Optimistic locking** on stock adjustments.  
- **Soft deletes** everywhere + audit trail.  
- **Multi-company isolation** enforced at DB level (row-level security).  
- **Backup & Restore** per company.  
- **Data residency** option for Thai servers.

### 3.6 Tech Stack Recommendation (Production Ready)
- **Backend**: NestJS (TypeScript) or Laravel (PHP) — both excellent for Thai dev teams.  
- **Frontend**: Next.js 15 + Tailwind + shadcn/ui.  
- **Mobile**: React Native (shared components with web).  
- **Infra**: Docker + Kubernetes or Railway/Render for faster Thai startup iteration.  
- **CI/CD**: GitHub Actions with security scanning.

---

**Next Steps for Team**  
1. **Designers**: Start with Figma component library using the palette above + prototype the 5 core flows (Dashboard → Create Invoice → Pay → Reconcile → Report).  
2. **Backend**: Implement `core-accounting-service` + `billing-service` first (foundational).  
3. **Joint Workshop**: Map every screenshot feature to the tables above to ensure 100% coverage.

This document gives **both** the creative narrative designers need **and** the exhaustive technical blueprint engineers need — ready to build a best-in-class Thai accounting app that feels familiar yet delightfully modern.

Let me know which module to expand into full wireframes or API specs next!  
```
///////

