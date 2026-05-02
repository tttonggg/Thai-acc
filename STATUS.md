# Thai ACC — Development Status

> **Last Updated:** 2026-05-02
> **Version:** 0.2.1-alpha

---

## ✅ Completed Modules

### Backend (50+ Python files)

| Module | Files | Status |
|--------|-------|--------|
| **Auth** | `core/security.py`, `api/v1/endpoints/auth.py` | JWT login/register, role-based access |
| **Company** | `models/company.py`, `api/v1/endpoints/companies.py` | CRUD, auto-COA seeding on create |
| **Contacts** | `models/contact.py`, `api/v1/endpoints/contacts.py` | CRUD, search, soft delete, **transaction history endpoint** |
| **Products** | `models/product.py`, `api/v1/endpoints/products.py` | CRUD, SKU validation, inventory tracking, **transaction history endpoint** |
| **Projects** | `models/project.py`, `api/v1/endpoints/projects.py` | CRUD, budget tracking, cost control, financials endpoint, **transaction history endpoint** |
| **Quotations** | `models/quotation.py`, `api/v1/endpoints/quotations.py` | Full lifecycle, status transitions, line items |
| **Invoices** | `models/invoice.py`, `api/v1/endpoints/invoices.py` | Create from quotation, due date auto-calc, status, **e-Tax XML + submit + history** |
| **Receipts** | `models/receipt.py`, `api/v1/endpoints/receipts.py` | Payment methods, WHT, invoice status update |
| **Purchase Orders** | `models/purchase_order.py`, `api/v1/endpoints/purchase_orders.py` | CRUD, status transitions, line items |
| **Purchase Invoices** | `models/purchase_invoice.py`, `api/v1/endpoints/purchase_invoices.py` | AP management, GL posting |
| **Expense Claims** | `models/expense_claim.py`, `api/v1/endpoints/expense_claims.py` | Categories, approval, GL posting |
| **GL** | `models/gl.py`, `services/gl_posting.py` | COA, journal entries, auto-posting from docs |
| **Accounting Reports** | `api/v1/endpoints/accounting.py` | Trial Balance, Income Statement, Balance Sheet, AR Aging, AP Aging |
| **Bank Accounts** | `models/bank_account.py`, `api/v1/endpoints/bank_accounts.py` | CRUD, transaction reconciliation |
| **Bank Statement Import** | `models/bank_statement_import.py`, `models/bank_statement_line.py`, `services/bank_statement_service.py` | CSV parser (KBank/SCB/BBL), auto-matcher, upload + match UI |
| **Document Numbering** | `models/document_sequence.py`, `services/document_numbering.py` | Sequential {PREFIX}-{YEAR}-{SEQ:04d} |
| **COA Seeding** | `utils/seed_coa.py` | 25 standard Thai GL accounts |
| **e-Tax Invoice** | `services/e_tax.py`, `models/e_tax_submission.py` | XML generation, open adapter pattern (Email + RD API), 4 endpoints |

**Key Features:**
- ✅ All endpoints filter by `company_id` (multi-tenant)
- ✅ JWT auth required on all protected routes
- ✅ Soft delete on all models (`deleted_at`)
- ✅ Audit trail (`created_by`, `updated_by`, timestamps)
- ✅ VAT 7% calculation: `round(subtotal * 0.07, 2)`
- ✅ WHT support (1%, 2%, 3%, 5%)
- ✅ Project ID tagging on all transactions
- ✅ GL double-entry auto-posting on invoice/receipt/purchase-invoice/expense-claim creation
- ✅ Document state machines with transition validation
- ✅ Decimal for all monetary values
- ✅ e-Tax Invoice XML generation conforming to RD spec
- ✅ Bank reconciliation with `is_reconciled` on JE lines
- ✅ AR/AP aging reports with bucket summaries

### Frontend (50+ files)

| Page | Path | Features |
|------|------|----------|
| **Dashboard** | `/` | KPIs (sales, received, AR, overdue), project widget, recent activity |
| **Contacts** | `/contacts` | List, search, type filter, credit limit display, **detail page with transaction history + summary cards**, edit form |
| **Products** | `/products` | List, search, category filter, stock levels, **detail page with transaction history + summary cards**, edit form |
| **Projects** | `/projects` | List with revenue/cost/profit columns, search, **detail page with financials panel + transaction history + budget progress**, edit form |
| **Income** | `/income` | Tabbed view: Quotations, Invoices (with e-Tax filter), Receipts |
| **Quotations** | Create, detail, edit | Dynamic line items, auto-calc, status transitions |
| **Invoices** | Create, detail (with e-Tax panel), edit | Quotation conversion, due date, print support, e-Tax status |
| **Receipts** | Create, detail | Payment form, WHT, invoice selector |
| **Expenses** | `/expenses` | Tabbed: Purchase Orders, Purchase Invoices, Expense Claims |
| **Accounting** | `/accounting` | Chart of Accounts, Journal Entries |
| **Reports** | `/reports` | Trial Balance, Income Statement, Balance Sheet, AR Aging, AP Aging |
| **Bank Accounts** | `/bank-accounts` | List, detail with reconciliation UI + statement import + auto-match |
| **Settings** | `/settings` | Company profile display |
| **Login/Register** | `/login`, `/register` | Auth with JWT storage |

**UI Features:**
- ✅ PEAK-inspired purple→teal gradient branding
- ✅ Thai font (Noto Sans Thai) + Inter
- ✅ Sidebar navigation with active states
- ✅ Responsive layout (desktop-first)
- ✅ Real API integration (no mock data)
- ✅ Thai Baht currency formatting
- ✅ Buddhist year date display
- ✅ Status badges with color coding
- ✅ e-Tax status badges and filter buttons
- ✅ Print support (`print:hidden` on sidebar/action buttons)
- ✅ Dashboard with KPI cards and project performance widget
- ✅ Contact detail: summary cards (invoiced/paid/outstanding/purchased) + transaction history table with filter tabs
- ✅ Product detail: stock alert + summary cards (sold/purchased quantities & amounts) + transaction history table with filter tabs
- ✅ Project detail: budget progress bar + financials summary (quoted/invoiced/received/cost/profit) + transaction history table with filter tabs

### Database (6 Migrations)

| Migration | Tables / Changes |
|-----------|-----------------|
| `001` | companies, users, contacts, products |
| `002` | projects, document_sequences, quotations, quotation_items, invoices, invoice_items, receipts, bank_accounts, chart_of_accounts, journal_entries, journal_entry_lines |
| `003` | purchase_orders, purchase_order_items, purchase_invoices, purchase_invoice_items, expense_claims |
| `004` | bank_accounts.gl_account_id, journal_entry_lines.is_reconciled, bank_account_transactions |
| `005` | invoices.e_tax_xml/timestamp/submitted_at/error, e_tax_submissions |
| `006` | bank_statement_imports, bank_statement_lines |

### Tests (6 Test Files)

| File | Coverage |
|------|----------|
| `test_quotations.py` | Create, list, status transitions, delete, VAT calc |
| `test_invoices.py` | Create, from quotation, status transitions, filters, calc |
| `test_receipts.py` | Create, invoice status update, WHT, delete reversal |
| `test_projects.py` | Create, duplicate code, filters, update, invoice tagging |
| `test_purchase_orders.py` | Create, status transitions, convert to PI, filters, calc |
| `test_purchase_invoices.py` | Create, status transitions, filters, calc |

### Deployment

| File | Purpose |
|------|---------|
| `docker-compose.prod.yml` | Production Docker Compose (port 3001) |
| `nginx.prod.conf` | Nginx reverse proxy |
| `deploy.sh` | VPS deployment script |
| `Dockerfile` (backend + frontend) | Multi-stage builds |

---

## ⏳ Feature Roadmap (Recommended Order)

> **Orchestrator analysis:** Ordered by business value × dependency chain × complexity

| # | Feature | Priority | Why This Order | Complexity | Est. Time |
|---|---------|----------|----------------|------------|-----------|
| **1** | **~~Contact Detail Enhancements~~** | ✅ Done | Unified transaction history across 6 document types. Summary cards. Filter tabs. | Low | ~20 min |
| **2** | **~~Product Detail Enhancements~~** | ✅ Done | Stock movement history. Sales/purchase summary cards. Filter tabs. | Low | ~20 min |
| **3** | **~~Project Detail Enhancements~~** | ✅ Done | Budget progress bar. Financials panel (quoted/invoiced/received/cost/profit/margin). Transaction history. | Medium | ~25 min |
| **4** | **Tests** | 🔥 High | PO, Purchase Invoice, Expense Claim, Accounting, Bank Reconciliation, e-Tax, Bank Statement. CI pipeline needs these. | Medium | ~30 min |
| **5** | **Multi-currency** | Medium | USD/EUR/CNY. Adds `currency_code` to invoices/POs. Exchange rates. Important for import/export SMEs. | Medium | ~30 min |
| **6** | **Dashboard Charts** | Medium | Revenue trends, expense breakdown. Visual appeal, decision support. | Medium | ~25 min |
| **7** | **SSL / Custom Domain** | Medium | Let's Encrypt. Production polish. Required before public launch. | Low | ~15 min |
| **8** | **Inventory Management** | Low | FIFO costing, stock adjustments, barcode. Advanced feature. | High | ~45 min |
| **9** | **Payroll** | Low | Thai SSO, P.N.D.1K. Complex regulatory. Save for last. | High | ~60 min |
| **10** | **Multi-company** | Low | Switch between company books. Enterprise feature. | High | ~40 min |
| **11** | **Audit Trail UI** | Low | View change history on documents. Compliance feature. | Medium | ~30 min |

### Why This Order?
1. **Contact/Product/Project details first** — These are "quick wins" that use existing data. Users immediately see the value of all modules working together.
2. **Tests next** — Once detail pages are done, the core feature set is stable. Tests lock in quality before adding complexity (multi-currency, inventory).
3. **Multi-currency** — Opens the product to import/export businesses. Medium complexity, high business value.
4. **Dashboard Charts + SSL** — Polish features. Make the product feel complete and production-ready.
5. **Inventory + Payroll + Multi-company** — Advanced features for later. High complexity, smaller user base.

---

## How to Run

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn src.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev
```

---

## VPS Production

- **URL:** `http://135.181.107.76:3001`
- **Health:** `http://135.181.107.76:3001/health`
- **API Docs:** `http://135.181.107.76:3001/docs`
- **Deploy:** `./deploy.sh`

---

*Thai ACC v0.2.1-alpha — PEAK Alternative with Project Cost Control + e-Tax Invoice + Bank Reconciliation + Accounting Reports + Contact/Product/Project Detail Enhancements*
