# Feature Plan: Contact Transaction History

> **Status:** Research Complete  
> **Priority:** #1 (First Feature)  
> **Estimated Effort:** ~20 minutes  
> **Feature:** Add unified transaction history to contact detail page

---

## 1. Research Findings

### Current State
- **Contact Detail Page** (`frontend/src/app/contacts/[id]/page.tsx`): Shows only static info (name, tax_id, credit_limit, phone, email, address). No transaction data.
- **Contact Endpoints** (`backend/src/api/v1/endpoints/contacts.py`): CRUD only. No transaction endpoint.
- **Models with `contact_id`:**
  - `quotations` — sales quotes
  - `invoices` — bills to customer
  - `receipts` — payments received
  - `purchase_orders` — orders to vendor
  - `purchase_invoices` — bills from vendor
  - `expense_claims` — employee reimbursements
  - `projects` — linked client projects
  - `journal_entry_lines` — GL entries

### User Value
- See complete customer/vendor activity in one place
- Identify top customers by transaction volume
- Track outstanding invoices per contact
- Monitor purchase history with vendors

---

## 2. Design

### 2.1 API Contract

```
GET /contacts/{id}/transactions
  Response: ContactTransactionSummary

ContactTransactionSummary:
├── contact: ContactResponse
├── summary:
│   ├── total_invoiced: Decimal
│   ├── total_paid: Decimal
│   ├── total_outstanding: Decimal
│   ├── total_purchased: Decimal
│   ├── quotation_count: int
│   ├── invoice_count: int
│   ├── receipt_count: int
│   └── expense_claim_count: int
└── transactions: List[ContactTransaction]

ContactTransaction:
├── id: UUID
├── document_type: str  # quotation, invoice, receipt, purchase_order, purchase_invoice, expense_claim
├── document_number: str
├── document_date: date
├── status: str
├── description: str
├── amount: Decimal
├── currency: str  # "THB"
└── link: str  # URL path to detail page
```

### 2.2 Backend Implementation

Single endpoint queries 6 tables, unions results, sorts by date:

```python
@router.get("/{contact_id}/transactions")
def get_contact_transactions(
    contact_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify contact exists
    contact = db.query(Contact).filter(...).first()
    
    # Query each table for contact_id + company_id
    invoices = db.query(Invoice).filter(...).all()
    receipts = db.query(Receipt).filter(...).all()
    quotations = db.query(Quotation).filter(...).all()
    purchase_orders = db.query(PurchaseOrder).filter(...).all()
    purchase_invoices = db.query(PurchaseInvoice).filter(...).all()
    expense_claims = db.query(ExpenseClaim).filter(...).all()
    
    # Union into unified list, sort by date desc
    transactions = sorted(all_docs, key=lambda x: x.date, reverse=True)
    
    # Calculate summary stats
    total_invoiced = sum(inv.total_amount for inv in invoices)
    total_paid = sum(r.total_amount for r in receipts)
    
    return {
        "contact": contact,
        "summary": {...},
        "transactions": transactions[:100]  # Limit to latest 100
    }
```

### 2.3 Frontend Implementation

Add to contact detail page:
- Summary cards (total invoiced, total paid, outstanding, purchase volume)
- Transaction history table with:
  - Document type badge (color-coded)
  - Document number (clickable link)
  - Date
  - Status badge
  - Amount
  - Description
- Filter tabs: ทั้งหมด | ขาย | ซื้อ | เบิกจ่าย

---

## 3. Task Breakdown (Sliced for Agents)

### Batch 1: Backend (1 agent)

| Task | File | Description |
|------|------|-------------|
| **B1** | `backend/src/api/v1/endpoints/contacts.py` | Add `GET /{contact_id}/transactions` endpoint. Query 6 tables, union results, calculate summary stats. Return unified transaction list. |

### Batch 2: Frontend (1 agent)

| Task | File | Description |
|------|------|-------------|
| **F1** | `frontend/src/lib/api.ts` | Add `contactApi.getTransactions(id)` method |
| **F2** | `frontend/src/hooks/useApi.ts` | Add `useContactTransactions(id)` hook |
| **F3** | `frontend/src/app/contacts/[id]/page.tsx` | Add summary cards + transaction history table with type badges, status badges, clickable links, filter tabs |

### Batch 3: Tests (1 agent)

| Task | File | Description |
|------|------|-------------|
| **T1** | `backend/tests/integration/test_contacts.py` | Test transaction endpoint: returns correct data, filters by company_id, limits to 100, summary calculations correct |

---

## 4. Quality Gates

- [ ] Endpoint filters by `company_id`
- [ ] Soft delete check on all 6 tables (`deleted_at.is_(None)`)
- [ ] Summary calculations use `Decimal`
- [ ] Frontend shows type badges with correct colors
- [ ] All document numbers link to detail pages
- [ ] Filter tabs work correctly
- [ ] Build passes (`npm run build`, syntax check)
- [ ] Deploy succeeds, health check passes

---

## 5. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Large contact with 1000+ transactions | Limit to 100 most recent. Add pagination later if needed. |
| Slow query across 6 tables | Query all 6 in parallel (not JOIN). Each table has index on `contact_id`. |
| Missing model fields | Standardize on common fields: id, number, date, status, total_amount, description. |

---

*Plan created by Orchestrator (Kimi K2.6) — 2026-05-02*
