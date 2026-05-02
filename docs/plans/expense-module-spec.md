# Spec: Expense Module (รายจ่าย)

## Overview
Three document types for Thai SME expense management, mirroring the Income module structure.

## Document Types

### 1. Purchase Orders (ใบสั่งซื้อ)
- **Flow**: draft → sent → confirmed → received → billed → cancelled
- **Prefix**: PO (from company.purchase_order_prefix)
- **GL**: None (non-posting, like quotation)
- **Can convert to**: Purchase Invoice

### 2. Purchase Invoices / Bills (ใบแจ้งหนี้ซื้อ)
- **Flow**: draft → received → approved → partially_paid → paid → cancelled
- **Prefix**: EX (from company.expense_prefix)
- **GL Posting on create**:
  - Dr. Inventory (สินค้าคงเหลือ) / Expense account — subtotal
  - Dr. VAT Input (ภาษีมูลค่าเพิ่มซื้อ) — vat_amount
  - Cr. Accounts Payable (เจ้าหนี้การค้า) — total_amount

### 3. Expense Claims (ใบเบิกค่าใช้จ่าย)
- **Flow**: draft → submitted → approved → paid → rejected
- **Prefix**: EX (from company.expense_prefix, with /C suffix)
- **GL Posting on payment**:
  - Dr. Expense account (by category)
  - Cr. Cash/Bank — amount

## Database Schema

### purchase_orders
| Column | Type | Notes |
|--------|------|-------|
| company_id | UUID FK | filter |
| contact_id | UUID FK | vendor (type='vendor' or 'both') |
| project_id | UUID FK | nullable |
| po_number | string(50) | unique, sequential |
| order_date | date | |
| expected_date | date | nullable |
| status | string(20) | draft/sent/confirmed/received/billed/cancelled |
| subtotal | Numeric(19,4) | |
| vat_rate | Numeric(5,2) | default 7 |
| vat_amount | Numeric(19,4) | |
| total_amount | Numeric(19,4) | |
| discount_amount | Numeric(19,4) | default 0 |
| notes | Text | nullable |
| converted_to_purchase_invoice_id | UUID FK | nullable |

### purchase_order_items
| Column | Type | Notes |
|--------|------|-------|
| purchase_order_id | UUID FK | |
| product_id | UUID FK | nullable |
| description | string(500) | |
| quantity | Numeric(19,4) | |
| unit_price | Numeric(19,4) | |
| discount_percent | Numeric(5,2) | |
| amount | Numeric(19,4) | |

### purchase_invoices
| Column | Type | Notes |
|--------|------|-------|
| company_id | UUID FK | filter |
| contact_id | UUID FK | vendor |
| project_id | UUID FK | nullable |
| purchase_order_id | UUID FK | nullable |
| bill_number | string(50) | unique, sequential |
| bill_date | date | |
| due_date | date | |
| status | string(20) | draft/received/approved/partially_paid/paid/cancelled |
| subtotal | Numeric(19,4) | |
| vat_rate | Numeric(5,2) | default 7 |
| vat_amount | Numeric(19,4) | |
| total_amount | Numeric(19,4) | |
| discount_amount | Numeric(19,4) | default 0 |
| paid_amount | Numeric(19,4) | default 0 |
| notes | Text | nullable |

### purchase_invoice_items
Same structure as purchase_order_items.

### expense_claims
| Column | Type | Notes |
|--------|------|-------|
| company_id | UUID FK | filter |
| contact_id | UUID FK | nullable (vendor) |
| project_id | UUID FK | nullable |
| claim_number | string(50) | unique, sequential |
| employee_name | string(100) | |
| expense_date | date | |
| category | string(50) | travel/meal/office/supplies/transportation/other |
| description | string(500) | |
| amount | Numeric(19,4) | |
| vat_amount | Numeric(19,4) | default 0 |
| total_amount | Numeric(19,4) | |
| receipt_url | string(500) | nullable |
| status | string(20) | draft/submitted/approved/paid/rejected |
| approved_by | UUID FK | user, nullable |
| approved_at | datetime | nullable |
| notes | Text | nullable |

## API Endpoints (all under /api/v1/)

### Purchase Orders
- GET /purchase-orders — list (filters: status, contact_id, project_id, search)
- POST /purchase-orders — create
- GET /purchase-orders/{id} — detail with items
- PUT /purchase-orders/{id} — update (only if draft)
- PUT /purchase-orders/{id}/status — status transition
- DELETE /purchase-orders/{id} — soft delete
- POST /purchase-orders/{id}/convert — convert to purchase invoice

### Purchase Invoices
- GET /purchase-invoices — list (filters: status, contact_id, project_id, is_overdue, search)
- POST /purchase-invoices — create (can reference PO)
- GET /purchase-invoices/{id} — detail with items + receipts
- PUT /purchase-invoices/{id} — update (only if draft)
- PUT /purchase-invoices/{id}/status — status transition
- DELETE /purchase-invoices/{id} — soft delete

### Expense Claims
- GET /expense-claims — list (filters: status, category, search)
- POST /expense-claims — create
- GET /expense-claims/{id} — detail
- PUT /expense-claims/{id} — update (only if draft/submitted)
- PUT /expense-claims/{id}/status — approve/reject/pay
- DELETE /expense-claims/{id} — soft delete

## Frontend
- New sidebar item: "รายจ่าย" at /expenses
- Tabbed page: ใบสั่งซื้อ | ใบแจ้งหนี้ซื้อ | ใบเบิกค่าใช้จ่าย
- Create forms for each document type
- Detail pages for each
- Status action buttons on detail pages

## GL Integration
- Purchase Invoice creation → auto GL post (Dr. Inventory/Expense + VAT Input, Cr. AP)
- Expense Claim payment → auto GL post (Dr. Expense, Cr. Cash)
- Use existing GLPostingService pattern
