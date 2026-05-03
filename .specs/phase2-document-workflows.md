# Spec: Phase 2 — Document Workflow Completion

## Objective
Close critical gaps in document management workflows. Users currently cannot create stock adjustments from the UI, and cannot edit or change status of Purchase Orders, Purchase Invoices, and Expense Claims after creation. This makes the purchasing and expense workflows unusable for real business operations.

**User stories:**
- As an accountant, I want to record stock adjustments (initial stock, loss, damage) so inventory stays accurate.
- As a purchaser, I want to edit a Purchase Order and change its status (sent → confirmed → received → billed) so I can track procurement lifecycle.
- As an AP clerk, I want to edit a Purchase Invoice and record payments so I can manage payables.
- As an employee, I want to submit expense claims and see approval status changes.

## Tech Stack
- **Backend:** Python 3.12, FastAPI, SQLAlchemy 2.0, Alembic, PostgreSQL
- **Frontend:** Next.js 15, React 19, Tailwind CSS, TanStack Query, shadcn/ui
- **Test:** pytest (SQLite in-memory for tests)

## Commands
```bash
# Backend tests
cd backend && DATABASE_URL=sqlite:///./test.db JWT_SECRET_KEY=test-secret venv/bin/python -m pytest tests/ -q

# Frontend build
cd frontend && npm run build

# Deploy
./deploy.sh
```

## Project Structure
```
backend/src/api/v1/endpoints/
  stock_adjustments.py    # POST already exists
  purchase_orders.py      # PUT/status/convert exist
  purchase_invoices.py    # PUT/status exist
  expense_claims.py       # PUT/status exist

frontend/src/app/
  stock-adjustments/new/page.tsx          # NEW
  expenses/purchase-orders/[id]/edit/     # NEW
  expenses/purchase-invoices/[id]/edit/   # NEW
  expenses/expense-claims/[id]/edit/      # NEW
```

## Code Style
Follow existing patterns exactly:
- Backend: Pydantic schemas with `BaseModel`, `Field()` validators, `_build_*_response` helpers
- Frontend: React Hook Form style with `useState`, `useMutation`, `useQueryClient`, `AppLayout`
- Status transitions use backend `PUT /{id}/status` endpoint
- Soft delete only (never `db.delete()`)
- Company ID filter on every query

Example from existing invoice edit page:
```typescript
const updateInvoice = useMutation({
  mutationFn: (data: any) => api.put(`/invoices/${invoiceId}`, data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["invoices"] });
    router.push(`/income/invoices/${invoiceId}`);
  },
});
```

## Testing Strategy
- Add integration tests for each new backend endpoint or modified endpoint
- Test status transitions (valid and invalid)
- Test that cancelled/completed documents cannot be edited
- All tests in `backend/tests/integration/`
- Run full suite before commit: `pytest tests/ -q`

## Boundaries
- **Always:** Filter by `company_id`, check `deleted_at.is_(None)`, use `Decimal` for money
- **Ask first:** Database schema changes, new dependencies
- **Never:** Skip tests, use `db.delete()`, hardcode document numbers

## Success Criteria
- [ ] `/stock-adjustments/new` page exists and creates adjustments via `POST /api/v1/stock-adjustments`
- [ ] `/expenses/purchase-orders/[id]/edit` page exists with status transition buttons
- [ ] `/expenses/purchase-invoices/[id]/edit` page exists with status transition buttons
- [ ] `/expenses/expense-claims/[id]/edit` page exists with status transition buttons
- [ ] Detail pages for PO/PI/Claim have Edit button linking to edit page
- [ ] All 4 document types block editing when status is terminal (cancelled, paid, etc.)
- [ ] Backend tests pass (109 existing + new tests)
- [ ] Frontend builds without errors
- [ ] Deployed to VPS and health check passes

## Implementation Order
1. Stock Adjustment creation form (quickest, standalone)
2. Purchase Order edit + status (follow invoice pattern closely)
3. Purchase Invoice edit + status (follow PO pattern)
4. Expense Claim edit + status (approval workflow is unique)
5. Add "Edit" buttons to all detail pages
6. Write tests for new flows
7. Full test suite + build + deploy

## Open Questions
- None — all requirements are clear from existing codebase patterns.
