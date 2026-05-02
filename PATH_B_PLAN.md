# Path B Implementation Plan: Maximize Business Value

> **Production URL:** https://acc3.k56mm.uk/  
> **Version:** 0.3.0-alpha (target)  
> **Estimated Time:** ~90 minutes  

---

## Overview

Path B adds revenue-driving features for Thai ACC. These features open new market segments (import/export SMEs, product-selling businesses) and increase perceived value.

---

## Phase 1: Multi-Currency Foundation (~25 min)

### Why
- Thailand has significant import/export SME segment
- PEAK and FlowAccount handle multi-currency poorly
- Competitive advantage for cross-border businesses

### Database Changes
- [ ] Add `base_currency` to Company model (default "THB")
- [ ] Add `currency_code` + `exchange_rate` to Invoice model
- [ ] Add `currency_code` + `exchange_rate` to Quotation model
- [ ] Add `currency_code` + `exchange_rate` to PurchaseOrder model
- [ ] Add `currency_code` + `exchange_rate` to PurchaseInvoice model
- [ ] Add `currency_code` + `exchange_rate` to Receipt model
- [ ] Create ExchangeRate model (date, from_currency, to_currency, rate, source)
- [ ] Alembic migration

### API Changes
- [ ] Add currency fields to all document create/update schemas
- [ ] Add exchange rate lookup endpoint `GET /exchange-rates`
- [ ] Add exchange rate admin endpoint `POST /exchange-rates`
- [ ] Update GL posting to use base_currency amounts for journal entries

### Frontend Changes
- [ ] Add currency selector to invoice/quotation/PO/PI forms
- [ ] Display amounts in document currency + base currency
- [ ] Add exchange rate indicator in detail pages

### Supported Currencies
- THB (default base)
- USD (US Dollar)
- EUR (Euro)
- CNY (Chinese Yuan)
- JPY (Japanese Yen)
- GBP (British Pound)

---

## Phase 2: Inventory - Stock Adjustments (~20 min)

### Why
- Current product tracking is static (just quantity_on_hand)
- No way to record stock loss, damage, or initial stock
- Required for accurate inventory valuation

### Database Changes
- [ ] Create StockAdjustment model:
  - id, company_id, product_id
  - adjustment_type: initial, loss, damage, found, correction
  - quantity_change (positive/negative)
  - unit_cost, total_value
  - reason, reference_number
  - adjusted_by, approved_by
- [ ] Create StockMovement model (audit trail):
  - id, company_id, product_id
  - movement_type: sale, purchase, adjustment, return
  - quantity_before, quantity_change, quantity_after
  - unit_cost, total_value
  - reference_document_type, reference_document_id
- [ ] Alembic migration

### API Changes
- [ ] `POST /stock-adjustments` — Create adjustment
- [ ] `GET /stock-adjustments` — List with filters
- [ ] `GET /products/{id}/stock-movements` — Movement history
- [ ] Auto-update product.quantity_on_hand on adjustment
- [ ] GL posting for adjustments (Dr/Cr Inventory account)

### Frontend Changes
- [ ] Add "Adjust Stock" button on product detail page
- [ ] Stock movement history tab on product detail
- [ ] Stock adjustment form (type, qty, reason, cost)

---

## Phase 3: Inventory - FIFO Costing (~25 min)

### Why
- Thai tax law requires proper inventory valuation method
- FIFO is most common for Thai SMEs
- Enables accurate COGS calculation and profit reporting

### Database Changes
- [ ] Create InventoryBatch model (FIFO layers):
  - id, company_id, product_id
  - quantity, unit_cost, remaining_qty
  - purchase_date, purchase_invoice_id
  - is_active

### API Changes
- [ ] Update purchase invoice posting to create inventory batches
- [ ] Update invoice posting to consume FIFO batches (calculate COGS)
- [ ] Add `GET /products/{id}/fifo-layers` endpoint
- [ ] GL posting for COGS (Dr COGS, Cr Inventory when selling)

### Frontend Changes
- [ ] Show FIFO layers on product detail
- [ ] Show COGS breakdown on invoice detail
- [ ] Inventory valuation report page

### GL Impact
- Purchase: Dr Inventory (at cost), Cr AP
- Sale: Dr AR, Cr Sales; Dr COGS, Cr Inventory (FIFO cost)
- Adjustment: Dr/Cr Inventory, Cr/Dr Adjustment account

---

## Phase 4: Testing & Polish (~10 min)

- [ ] Add integration tests for multi-currency documents
- [ ] Add integration tests for stock adjustments
- [ ] Add integration tests for FIFO costing
- [ ] Update product detail page with inventory tabs
- [ ] Update reports to show base currency totals

---

## Implementation Order

```
Day 1 (25 min): Multi-currency DB + API
Day 1 (15 min): Multi-currency frontend
Day 2 (20 min): Stock adjustment DB + API + frontend
Day 2 (25 min): FIFO costing
Day 2 (10 min): Tests + deploy
```

## Business Impact

| Feature | Market Segment | Revenue Potential |
|---------|---------------|-------------------|
| Multi-currency | Import/export SMEs | High (untapped) |
| Stock adjustments | Retail/wholesale | Medium |
| FIFO costing | Product businesses | Medium (compliance) |

## Files to Modify

### Backend
- `models/company.py`
- `models/invoice.py`, `quotation.py`, `purchase_order.py`, `purchase_invoice.py`, `receipt.py`
- `models/exchange_rate.py` (new)
- `models/stock_adjustment.py` (new)
- `models/stock_movement.py` (new)
- `models/inventory_batch.py` (new)
- `services/gl_posting.py`
- `api/v1/endpoints/` — invoices, quotations, purchase_orders, purchase_invoices, receipts
- `api/v1/endpoints/exchange_rates.py` (new)
- `api/v1/endpoints/stock_adjustments.py` (new)

### Frontend
- `app/income/invoices/new/page.tsx` + InvoiceForm
- `app/expenses/purchase-invoices/new/page.tsx`
- `app/expenses/purchase-orders/new/page.tsx`
- `app/products/[id]/page.tsx`
- `lib/api.ts`
- `hooks/useApi.ts`

### Tests
- `tests/integration/test_multi_currency.py` (new)
- `tests/integration/test_inventory.py` (new)

## Notes

- Multi-currency: All GL entries remain in base currency (THB). Document amounts stored in original currency + exchange rate.
- FIFO: When invoice item has product_id, consume from oldest batch. If no batch found, use product.cost_price.
- Stock adjustments require admin role for corrections.
