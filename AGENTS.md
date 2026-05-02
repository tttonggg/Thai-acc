# AGENTS.md — Thai ACC

> **For AI agents working on Thai ACC**  
> A Thai cloud accounting SaaS (PEAK Alternative). Full-stack with FastAPI + Next.js.  
> **Last Updated:** 2026-05-01

---

## 1. Project Overview

Thai ACC is a full-featured Thai cloud accounting platform for SMEs. It covers:
- Sales documents (quotations, invoices, receipts)
- Purchasing (purchase orders, purchase invoices)
- Expense claims
- Bank reconciliation
- General ledger + financial statements
- e-Tax Invoice compliance (Thai Revenue Department)
- Project cost control

**Tech Stack:**
- **Backend:** Python 3.14, FastAPI, SQLAlchemy 2.0, Alembic, PostgreSQL
- **Frontend:** Next.js 15, React 19, Tailwind CSS, TanStack Query, shadcn/ui
- **Deploy:** Docker Compose, nginx, VPS (`135.181.107.76:3001`)

---

## 2. Directory Structure

```
/Users/tong/peak-acc/
├── AGENTS.md                          # ← You are here
├── STATUS.md                          # Module completion status
├── design.md                          # PEAK UI reference (colors, layouts)
├── DEPLOY.md                          # Deployment instructions
├── docker-compose.prod.yml            # Production Docker setup
├── deploy.sh                          # VPS deployment script
├── .env                               # Production env vars
│
├── backend/
│   ├── src/
│   │   ├── main.py                    # FastAPI app entrypoint
│   │   ├── config.py                  # Pydantic Settings
│   │   ├── database.py                # SQLAlchemy engine/session
│   │   ├── core/
│   │   │   └── security.py            # JWT, password hashing
│   │   ├── models/                    # SQLAlchemy models
│   │   │   ├── base.py                # Base class, UUID PK, soft delete
│   │   │   ├── company.py
│   │   │   ├── user.py
│   │   │   ├── contact.py
│   │   │   ├── product.py
│   │   │   ├── project.py
│   │   │   ├── quotation.py + item
│   │   │   ├── invoice.py + item
│   │   │   ├── receipt.py
│   │   │   ├── purchase_order.py + item
│   │   │   ├── purchase_invoice.py + item
│   │   │   ├── expense_claim.py
│   │   │   ├── bank_account.py
│   │   │   ├── chart_of_account.py
│   │   │   ├── gl.py                  # JournalEntry + JournalEntryLine
│   │   │   ├── document_sequence.py
│   │   │   └── e_tax_submission.py
│   │   ├── api/v1/
│   │   │   ├── endpoints/             # FastAPI routers
│   │   │   │   ├── auth.py
│   │   │   │   ├── companies.py
│   │   │   │   ├── contacts.py
│   │   │   │   ├── products.py
│   │   │   │   ├── projects.py
│   │   │   │   ├── quotations.py
│   │   │   │   ├── invoices.py        # ← e-Tax endpoints here
│   │   │   │   ├── receipts.py
│   │   │   │   ├── purchase_orders.py
│   │   │   │   ├── purchase_invoices.py
│   │   │   │   ├── expense_claims.py
│   │   │   │   ├── accounting.py      # COA + JE + Reports
│   │   │   │   └── bank_accounts.py   # Reconciliation
│   │   │   └── deps.py                # DB session + auth deps
│   │   ├── schemas/                   # Pydantic models
│   │   ├── services/                  # Business logic
│   │   │   ├── document_numbering.py
│   │   │   ├── gl_posting.py          # Auto GL posting
│   │   │   └── e_tax.py               # XML generation
│   │   └── utils/seed_coa.py          # 25 Thai GL accounts
│   ├── tests/                         # pytest (SQLite in-memory)
│   ├── alembic/versions/              # Migrations 001–005
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── app/                       # Next.js App Router pages
│   │   │   ├── income/
│   │   │   │   ├── page.tsx           # Quotations/Invoices/Receipts tabs
│   │   │   │   ├── invoices/new/
│   │   │   │   ├── invoices/[id]/     # Detail with e-Tax panel
│   │   │   │   ├── invoices/[id]/edit/
│   │   │   │   ├── quotations/...
│   │   │   │   └── receipts/...
│   │   │   ├── expenses/              # PO / Bills / Claims
│   │   │   ├── accounting/            # COA + JE
│   │   │   ├── reports/               # 5 report tabs
│   │   │   ├── bank-accounts/         # List + reconciliation
│   │   │   ├── contacts/
│   │   │   ├── products/
│   │   │   ├── projects/
│   │   │   ├── settings/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── page.tsx               # Dashboard
│   │   ├── components/
│   │   │   ├── AppLayout.tsx          # Sidebar + auth guard
│   │   │   ├── Sidebar.tsx            # Navigation
│   │   │   └── ui/                    # shadcn components
│   │   ├── hooks/useApi.ts            # TanStack Query hooks
│   │   ├── lib/
│   │   │   ├── api.ts                 # Axios instance + API clients
│   │   │   └── utils.ts               # formatCurrency, formatThaiDate
│   │   └── app/globals.css
│   ├── next.config.js
│   └── Dockerfile
│
├── .opencode/                         # Agent orchestration config
│   ├── ARCHITECTURE.md                # 8-step cycle architecture
│   ├── ensemble.json                  # Model assignments
│   └── prompts/                       # Agent system prompts
│       ├── orchestrator.md
│       ├── planner.md
│       ├── researcher.md
│       ├── architect.md
│       ├── backend.md
│       ├── frontend.md
│       ├── database.md
│       ├── qa.md
│       ├── reviewer.md
│       ├── devops.md
│       └── feedback.md
│
└── skills/                            # Reusable agent skills
    ├── build/
    ├── design/
    ├── deploy/
    ├── feedback/
    ├── plan/
    ├── research/
    ├── review/
    └── test/
```

---

## 3. Key Patterns

### 3.1 Multi-Tenancy

**Every endpoint filters by `company_id`** from the JWT token:

```python
@router.get("/invoices")
def list_invoices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Invoice).filter(
        Invoice.company_id == current_user.company_id,
        Invoice.deleted_at.is_(None)
    ).all()
```

**NEVER** query without `company_id` filter. **ALWAYS** check `deleted_at.is_(None)`.

### 3.2 Soft Delete

All models inherit from `Base` which has `deleted_at: DateTime, nullable`. Never use `db.delete()` — set `deleted_at = datetime.utcnow()` instead.

### 3.3 Document Numbering

Use `DocumentNumberingService.get_next_number(prefix, db)`:
- Prefixes: `QT` (quotations), `IV` (invoices), `RE` (receipts), `TX` (tax invoices), `PO` (purchase orders), `EX` (expense claims)
- Format: `{PREFIX}-{YEAR}-{SEQUENCE:04d}` → e.g. `IV-2026-0001`

### 3.4 GL Auto-Posting

When a document is created/updated, `GLPostingService` auto-creates balanced journal entries:
- Invoice: Dr. AR, Dr. VAT Output, Cr. Sales Revenue
- Receipt: Dr. Cash/Bank, Cr. AR
- Purchase Invoice: Dr. Inventory/Expense, Dr. VAT Input, Cr. AP
- Expense Claim: Dr. Expense (by category), Cr. Cash/Bank

**Always verify:** `sum(debits) == sum(credits)`.

### 3.5 VAT Calculation

```python
vat_amount = round(subtotal * Decimal("0.07"), 2)
total_amount = subtotal + vat_amount - discount_amount
```

Use `Decimal("0.07")`, not `0.07` or `7/100`.

### 3.6 WHT Rates
- Services: 3%
- Rent: 5%
- Advertising: 2%
- Transport: 1%

### 3.7 Date Handling
- **Backend:** Store as `date` (ISO 8601: `YYYY-MM-DD`)
- **Frontend display:** Buddhist year `DD/MM/BBBB` via `formatThaiDate()`
- Example: 2026-05-01 → 01/05/2569

### 3.8 Currency
- Storage: `Numeric(19, 4)` in DB
- Display: `฿` symbol + 2 decimal places
- Function: `formatCurrency(amount)` in `frontend/src/lib/utils.ts`

### 3.9 e-Tax Invoice Status Flow

```
pending → generated → submitted → confirmed
   ↑______________↓_________________↑
   └──── failed ←──┘
```

Derived from fields:
- `pending`: `e_tax_xml` is NULL and `e_tax_error` is NULL
- `generated`: `e_tax_xml` is NOT NULL, `e_tax_submitted_at` is NULL
- `submitted`: `e_tax_submitted_at` is NOT NULL, `e_tax_timestamp` is NULL
- `confirmed`: `e_tax_timestamp` is NOT NULL
- `failed`: `e_tax_error` is NOT NULL

---

## 4. API Patterns

### 4.1 Response Structure

```json
{
  "id": "uuid",
  "company_id": "uuid",
  "created_at": "2026-05-01T10:00:00Z",
  "updated_at": "2026-05-01T10:00:00Z",
  "created_by": "uuid",
  "updated_by": "uuid"
}
```

### 4.2 List Endpoint Filters

All list endpoints support these query params:
- `status` — document status filter
- `contact_id` — filter by contact
- `project_id` — filter by project
- `search` — text search on document number
- `is_overdue` — boolean, filters due_date < today

Invoices additionally support:
- `e_tax_status` — `pending|generated|submitted|confirmed|failed`

### 4.3 Error Handling

```python
from fastapi import HTTPException

raise HTTPException(status_code=404, detail="Invoice not found")
raise HTTPException(status_code=400, detail="Cannot cancel paid invoice")
```

### 4.4 Auth

- Login → POST `/auth/login` → returns `{access_token, token_type, user}`
- Frontend stores `access_token` in `localStorage`
- All protected routes use `Authorization: Bearer <token>`
- Token payload contains `user_id`, `company_id`, `role`

---

## 5. Frontend Patterns

### 5.1 API Hooks (TanStack Query)

```typescript
// frontend/src/hooks/useApi.ts
export function useInvoices(params?) {
  return useQuery({
    queryKey: ["invoices", params],
    queryFn: () => invoiceApi.list(params).then((res) => res.data),
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: invoiceApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoices"] }),
  });
}
```

### 5.2 API Client

```typescript
// frontend/src/lib/api.ts
export const invoiceApi = {
  list: (params?) => api.get("/invoices", { params }),
  create: (data) => api.post("/invoices", data),
  update: (id, data) => api.put(`/invoices/${id}`, data),
  get: (id) => api.get(`/invoices/${id}`),
};
```

### 5.3 Form Pattern

- Use React Hook Form + Zod for validation
- Dynamic line items: array state with `append/remove`
- Auto-calculate totals on line item change
- Due date auto-calc from payment terms

### 5.4 Print Support

- Wrap non-print elements with `print:hidden`
- Add `print:block` for print-only headers
- Trigger via `window.print()`

### 5.5 Suspense Pattern (Next.js 15)

Any page using `useSearchParams()` must:
1. Extract the form into a client component
2. Wrap in `<Suspense>` in a server component page

---

## 6. Database Migrations

Use Alembic:
```bash
cd backend
alembic revision --autogenerate -m "description"
alembic upgrade head
```

Migration files: `backend/alembic/versions/`

**NEVER** modify existing migration files. Create new ones.

---

## 7. Testing

Run tests:
```bash
cd backend
pytest tests/ -q
```

Tests use SQLite in-memory with:
- `conftest.py` — shared fixtures (db session, test client, auth headers)
- `test_quotations.py`, `test_invoices.py`, `test_receipts.py`, `test_projects.py`

**When adding a new endpoint, add a test.**

---

## 8. Deployment

```bash
./deploy.sh
```

What deploy.sh does:
1. `git pull`
2. `docker compose up -d --build`
3. `alembic upgrade head`
4. Health check on `:3001/health`

VPS: `root@135.181.107.76`
Path: `/root/thai-acc`
Logs: `/root/thai-acc/logs/production.log`

---

## 9. Common Pitfalls

1. **Circular FK in PurchaseOrder/PurchaseInvoice** — Always add explicit `foreign_keys=[...]` in SQLAlchemy relationships
2. **Decimal arithmetic** — Always use `Decimal("0.07")`, never `0.07`
3. **`useSearchParams()` in Next.js 15** — Must wrap in Suspense, extract to client component
4. **Company ID filter** — Never forget to filter by `company_id` in queries
5. **Soft delete** — Never use `db.delete()`, set `deleted_at` instead
6. **GL balancing** — `sum(debits) == sum(credits)` always
7. **Document numbering** — Always use `DocumentNumberingService`, never hardcode
8. **Backend logger** — In blueprints use `current_app.logger`, not `app.logger`

---

## 10. How to Add a New Feature

1. **Read STATUS.md** — Check what's already done
2. **Check existing patterns** — Find a similar module and copy its structure
3. **Backend:**
   - Add model in `backend/src/models/`
   - Add endpoints in `backend/src/api/v1/endpoints/`
   - Add service logic in `backend/src/services/`
   - Add Pydantic schemas in `backend/src/schemas/`
   - Add migration with `alembic revision --autogenerate`
   - Add tests in `backend/tests/`
4. **Frontend:**
   - Add API client in `frontend/src/lib/api.ts`
   - Add hooks in `frontend/src/hooks/useApi.ts`
   - Add page in `frontend/src/app/`
   - Add nav item in `frontend/src/components/Sidebar.tsx`
5. **Update STATUS.md** — Mark module as complete
6. **Deploy** — Run `./deploy.sh`

---

## 11. Agent Work Cycle

This project uses an 8-step iterative cycle:

```
Plan → Research → Design → Build → Test → Review → Deploy → Feedback
```

For details see `.opencode/ARCHITECTURE.md`.

When working on a feature:
1. **Plan** — Understand scope, break into small tasks
2. **Research** — Check existing code for similar patterns
3. **Design** — Draft schema/API/frontend structure
4. **Build** — Implement backend + frontend in parallel
5. **Test** — Write and run tests
6. **Review** — Check for bugs, security, quality
7. **Deploy** — Run deploy script, verify health endpoint
8. **Feedback** — Update STATUS.md, note issues for next cycle

---

## 12. Skills Library

Reusable skills in `/Users/tong/peak-acc/skills/`:
- `build/fastapi.md` — FastAPI patterns
- `build/react.md` — React/Next.js patterns
- `build/thai-workflow.md` — Thai accounting GL posting logic
- `design/schema.md` — Database schema conventions
- `design/api-contract.md` — API design conventions
- `test/pytest.md` — Testing patterns
- `test/compliance.md` — Thai accounting compliance checks
- `review/code-review.md` — Code review checklist
- `review/security.md` — Security hardening
- `deploy/vps.md` — VPS deployment guide

---

*Thai ACC v0.2.0-alpha — For AI agents by AI agents*
