# Spec: Phase 5 — AP Payment Recording (ใบสำคัญจ่าย)

## Objective
Allow users to record payments against purchase invoices (AP). When a payment is recorded, the purchase invoice status updates (`received` → `partially_paid` → `paid`), and a GL journal entry is posted automatically.

**User story:** As an accountant, I want to record a payment to a vendor so that the purchase invoice is marked as paid and the cash/bank account is reduced.

## Data Model

### `payment_vouchers` table
- `id`: UUID PK
- `company_id`: UUID FK → companies
- `contact_id`: UUID FK → contacts (vendor)
- `voucher_number`: str (unique) — PV-YYYY-NNNN
- `payment_date`: date
- `payment_method`: str — `cash`, `bank_transfer`, `cheque`, `credit_card`, `promptpay`
- `bank_account_id`: UUID FK → bank_accounts (nullable)
- `currency_code`: str, default THB
- `exchange_rate`: Numeric(19,6), default 1
- `total_amount`: Numeric(19,4)
- `wht_amount`: Numeric(19,4), default 0
- `notes`: Text (nullable)
- `status`: str — `draft`, `posted`, `cancelled`
- `posted_at`: Date (nullable)
- Soft delete + audit fields

### `payment_voucher_lines` table
- `id`: UUID PK
- `payment_voucher_id`: UUID FK
- `purchase_invoice_id`: UUID FK → purchase_invoices
- `amount`: Numeric(19,4) — amount applied to this invoice
- `discount_taken`: Numeric(19,4), default 0
- Soft delete + audit fields

## GL Posting (on post)
- Dr. Accounts Payable (เจ้าหนี้การค้า 21000) — total_amount
- Cr. Cash/Bank (เงินสด/ธนาคาร 11000/11100) — (total_amount - wht_amount)
- Cr. WHT Payable (ภาษีหัก ณ ที่จ่าย 21400) — wht_amount (if > 0)

## API Endpoints
- `GET /payment-vouchers` — list with filters (status, contact_id, date range)
- `POST /payment-vouchers` — create draft
- `GET /payment-vouchers/{id}` — detail with lines + linked invoices
- `PUT /payment-vouchers/{id}` — update draft
- `DELETE /payment-vouchers/{id}` — soft delete
- `POST /payment-vouchers/{id}/post` — post + create GL + update PI status
- `POST /payment-vouchers/{id}/cancel` — cancel + reverse GL

## Status Transitions
```
draft → posted → cancelled
```
- `post`: validates total applied ≤ unpaid balance of each PI, creates JE, updates PI.status
- `cancel`: reverses JE, restores PI.status to previous

## PI Status Update Logic
```python
if pi.paid_amount + new_payment >= pi.total_amount:
    pi.status = "paid"
elif pi.paid_amount + new_payment > 0:
    pi.status = "partially_paid"
```

## Frontend
- Add "Payments" tab under `/expenses`
- List page with status filter, vendor filter, date range
- Create form: vendor selector, payment method, bank account selector, date, currency, line items (invoice selector + amount applied + discount)
- Auto-calc: show unpaid balance per invoice, validate amount ≤ balance
- Detail page with Post/Cancel actions, linked JE reference

## Document Numbering
- Prefix: `PV`
- Format: `PV-2026-0001`

## Tests
- Create payment voucher with 2 invoice lines
- Post updates PI status correctly
- GL balances (Dr AP = Cr Cash + Cr WHT)
- Cancel reverses GL and restores PI status
- Cannot post if amount > unpaid balance
- Company filtering

## Tech Stack
- FastAPI + SQLAlchemy (backend)
- React + TanStack Query (frontend)
- pytest (tests)

## Code Style
Follow existing patterns: `BaseModel` inheritance, soft delete, `company_id` filter, `DocumentNumberingService`, `GLPostingService`.

## Testing Strategy
- 10+ integration tests covering CRUD, post, cancel, GL posting, PI status update
- Run: `cd backend && DATABASE_URL=sqlite:///./test.db JWT_SECRET_KEY=test venv/bin/python -m pytest tests/integration/test_payment_vouchers.py -v`

## Boundaries
- Always: filter by `company_id`, soft delete, validate PI unpaid balance before post
- Ask first: adding WHT certificate fields (future scope)
- Never: allow posting if PI is not in `received`/`partially_paid`/`approved` status

## Success Criteria
- [ ] Can create draft payment voucher with multiple invoice lines
- [ ] Posting updates purchase invoice status and creates balanced GL entry
- [ ] Cancelling reverses GL and restores PI status
- [ ] Frontend list/create/detail pages work with real API
- [ ] All tests pass
