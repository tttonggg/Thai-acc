# Thai ACC — Development Status

> **Last Updated:** 2026-05-01
> **Version:** 0.2.0-alpha

---

## ✅ Completed Modules

### Backend (50+ Python files)

| Module | Files | Status |
|--------|-------|--------|
| **Auth** | `core/security.py`, `api/v1/endpoints/auth.py` | JWT login/register, role-based access |
| **Company** | `models/company.py`, `api/v1/endpoints/companies.py` | CRUD, auto-COA seeding on create |
| **Contacts** | `models/contact.py`, `api/v1/endpoints/contacts.py` | CRUD, search, soft delete |
| **Products** | `models/product.py`, `api/v1/endpoints/products.py` | CRUD, SKU validation, inventory tracking |
| **Projects** | `models/project.py`, `api/v1/endpoints/projects.py` | CRUD, budget tracking, cost control, financials endpoint |
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
| **Contacts** | `/contacts` | List, search, type filter, credit limit display, detail page, edit form |
| **Products** | `/products` | List, search, category filter, stock levels, detail page, edit form |
| **Projects** | `/projects` | List with revenue/cost/profit columns, search, detail with financials panel, edit form |
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

### Database (6 Migrations)

| Migration | Tables / Changes |
|-----------|-----------------|
| `001` | companies, users, contacts, products |
| `002` | projects, document_sequences, quotations, quotation_items, invoices, invoice_items, receipts, bank_accounts, chart_of_accounts, journal_entries, journal_entry_lines |
| `003` | purchase_orders, purchase_order_items, purchase_invoices, purchase_invoice_items, expense_claims |
| `004` | bank_accounts.gl_account_id, journal_entry_lines.is_reconciled, bank_account_transactions |
| `005` | invoices.e_tax_xml/timestamp/submitted_at/error, e_tax_submissions |
| `006` | bank_statement_imports, bank_statement_lines |

### Tests (4 Test Files)

| File | Coverage |
|------|----------|
| `test_quotations.py` | Create, list, status transitions, delete, VAT calc |
| `test_invoices.py` | Create, from quotation, status transitions, filters, calc |
| `test_receipts.py` | Create, invoice status update, WHT, delete reversal |
| `test_projects.py` | Create, duplicate code, filters, update, invoice tagging |

### Deployment

| File | Purpose |
|------|---------|
| `docker-compose.prod.yml` | Production Docker Compose (port 3001) |
| `nginx.prod.conf` | Nginx reverse proxy |
| `deploy.sh` | VPS deployment script |
| `Dockerfile` (backend + frontend) | Multi-stage builds |

---

## ⏳ Remaining Work

### High Priority
1. **Multi-currency** — USD, EUR, CNY alongside THB on invoices, POs, bank accounts
2. **Contact/Product/Project detail enhancements** — Transaction history, stock movements, budget vs actual charts
3. **Tests** — pytest coverage for PO, purchase invoices, expense claims, accounting, bank reconciliation, e-Tax, bank statement import

### Medium Priority
5. **SSL** — Let's Encrypt for custom domain
6. **Mobile Optimization** — Responsive improvements for mobile
7. **API Documentation** — OpenAPI/Swagger enhancements
8. **Dashboard Charts** — Revenue trend charts, expense breakdown

### Low Priority
9. **Inventory Management** — FIFO costing, stock adjustments, barcode
10. **Payroll** — Thai social security, P.N.D.1K, bank payment files
11. **Multi-company** — Switch between company books
12. **Audit Trail UI** — View change history on documents

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

*Thai ACC v0.2.0-alpha — PEAK Alternative with Project Cost Control + e-Tax Invoice + Bank Reconciliation + Accounting Reports*
