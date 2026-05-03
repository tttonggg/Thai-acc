# Phase 4: Credit Notes / Debit Notes

## Objective
Implement Sales Credit Notes (ใบลดหนี้ขาย) and Sales Debit Notes (ใบเพิ่มหนี้ขาย) to allow correcting posted invoices.

## Scope
- **Sales Credit Notes**: Reduce AR (customer returns, post-invoice discounts)
- **Sales Debit Notes**: Increase AR (additional charges, price corrections)
- Both link optionally to existing Invoice
- GL auto-posting on confirm
- e-Tax compatible document numbers (CN-YYYY-NNNN, DN-YYYY-NNNN)

## Data Model

### `credit_notes` table
- `id`: UUID PK
- `company_id`: UUID FK → companies
- `contact_id`: UUID FK → contacts
- `invoice_id`: UUID FK → invoices (nullable)
- `document_number`: str (unique) — CN-2026-0001 or DN-2026-0001
- `issue_date`: date
- `note_type`: str — `sales_credit` or `sales_debit`
- `status`: str — `draft`, `confirmed`, `cancelled`
- `subtotal`: Numeric(19,4)
- `vat_rate`: Numeric(5,2), default 7
- `vat_amount`: Numeric(19,4)
- `total_amount`: Numeric(19,4)
- `reason`: Text (nullable)
- `currency_code`: str, default THB
- `exchange_rate`: Numeric(19,6), default 1
- `confirmed_at`: DateTime (nullable)
- Soft delete + audit fields

### `credit_note_items` table
- `id`: UUID PK
- `credit_note_id`: UUID FK
- `product_id`: UUID FK → products (nullable)
- `description`: str
- `quantity`: Numeric(19,4)
- `unit_price`: Numeric(19,4)
- `amount`: Numeric(19,4)

## GL Posting

### Sales Credit Note (confirmed)
- Dr. Sales Returns (41001) — subtotal
- Dr. VAT Output (21100) — vat_amount (negative/reversal)
- Cr. Accounts Receivable (11200) — total_amount

### Sales Debit Note (confirmed)
- Dr. Accounts Receivable (11200) — total_amount
- Cr. Sales Revenue (41000) — subtotal
- Cr. VAT Output (21100) — vat_amount

## API Endpoints
- `GET /credit-notes` — list with filters (type, status, contact_id, search)
- `POST /credit-notes` — create draft
- `GET /credit-notes/{id}` — detail with items
- `PUT /credit-notes/{id}` — update draft
- `DELETE /credit-notes/{id}` — soft delete
- `POST /credit-notes/{id}/confirm` — confirm + post GL
- `POST /credit-notes/{id}/cancel` — cancel (reverse GL if confirmed)

## Frontend
- Add nav item under "Income" → "Credit / Debit Notes"
- List page with type filter tabs
- Create form (link to invoice selector, line items, auto-calc)
- Detail page with status actions

## Document Numbering
- Prefix: `CN` (credit notes), `DN` (debit notes)
- Format: `{PREFIX}-{YEAR}-{SEQ:04d}`

## Tests
- Create credit note + debit note
- Confirm posts correct GL
- Cancel reverses GL
- Status transition validation
- Company filtering
