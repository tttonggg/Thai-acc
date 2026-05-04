# Spec: Phase 6 — P.P.30 VAT Report (รายงานภาษีมูลค่าเพิ่ม)

## Objective
Generate the Thai monthly VAT filing report (P.P.30 / ภ.พ.30) automatically from invoice and purchase invoice data. This is a legal requirement for VAT-registered businesses in Thailand.

**User story:** As an accountant, I want to generate the P.P.30 report for a given month so I can file it with the Revenue Department.

## Report Structure (P.P.30)

### Section 1: Taxable Sales (Output VAT)
| Field | Source |
|-------|--------|
| 1. ยอดขายสินค้า/บริการที่ต้องเสียภาษี (มาตรฐาน 7%) | Invoices with vat_rate=7, status in (sent, paid, partially_paid) |
| 2. ภาษีขาย (Output VAT) | Sum of invoice.vat_amount |
| 3. ยอดขายสินค้า/บริการที่ได้รับยกเว้น | Invoices with vat_rate=0 |
| 4. ยอดขายสินค้า/บริการที่ไม่เข้าข่าย | (future scope) |
| 5. รวมยอดขาย (1+3+4) | Sum of all |

### Section 2: Taxable Purchases (Input VAT)
| Field | Source |
|-------|--------|
| 6. ยอดซื้อสินค้า/บริการที่มีสิทธิหักภาษีซื้อ | Purchase invoices with vat_rate=7, status in (received, approved, partially_paid, paid) |
| 7. ภาษีซื้อ (Input VAT) | Sum of purchase_invoice.vat_amount |
| 8. ยอดซื้อที่ได้รับยกเว้น | Purchase invoices with vat_rate=0 |

### Section 3: Tax Calculation
| Field | Calculation |
|-------|-------------|
| 9. ภาษีที่ต้องชำระ (Output - Input) | Field 2 - Field 7 |
| 10. ภาษีที่ชำระเกิน (Input > Output) | max(0, Field 7 - Field 2) |

## API Design

### `GET /accounting/reports/vat-pp30`
Query params:
- `year` (int, required) — Buddhist year (e.g. 2569)
- `month` (int, required) — 1-12

Response:
```json
{
  "year": 2569,
  "month": 5,
  "period_label": "พฤษภาคม 2569",
  "output_vat": {
    "taxable_sales_amount": "100000.00",
    "output_vat_amount": "7000.00",
    "exempt_sales_amount": "0.00",
    "non_taxable_sales_amount": "0.00",
    "total_sales_amount": "100000.00"
  },
  "input_vat": {
    "taxable_purchases_amount": "50000.00",
    "input_vat_amount": "3500.00",
    "exempt_purchases_amount": "0.00"
  },
  "net_vat": "3500.00",
  "vat_payable": "3500.00",
  "vat_credit": "0.00",
  "invoices": [...],
  "purchase_invoices": [...]
}
```

### `GET /accounting/reports/vat-pp30/download`
Returns Excel/PDF download (future scope — start with JSON).

## Business Rules
1. Only include documents where `company_id` matches current user
2. Only include non-deleted documents
3. For invoices: status must be `sent`, `paid`, or `partially_paid` (not `draft` or `cancelled`)
4. For purchase invoices: status must be `received`, `approved`, `partially_paid`, or `paid`
5. Date filter: `issue_date` for invoices, `bill_date` for purchase invoices
6. Year is Buddhist year: Gregorian year + 543
7. VAT rate is 7% by default; handle other rates gracefully

## Frontend
- Add "P.P.30" tab under `/reports`
- Month/year selector (dropdowns)
- Display report in table format matching the actual P.P.30 form layout
- Show detail drill-down: click a number to see the underlying invoices
- Export button (placeholder for Excel/PDF)

## GL Verification
- Cross-check: `output_vat` should match sum of JE lines where account_code = "21100" (VAT Output) for the period
- Cross-check: `input_vat` should match sum of JE lines where account_code = "21200" (VAT Input) for the period

## Tests
- Create invoices and purchase invoices in different months
- Verify P.P.30 report only includes correct month's data
- Verify draft invoices are excluded
- Verify net VAT calculation
- Verify Buddhist year conversion

## Code Style
- Backend: FastAPI endpoint in `accounting.py`
- Use existing `JournalEntry` / `JournalEntryLine` for verification queries
- Frontend: Add tab to existing `/reports` page

## Success Criteria
- [ ] P.P.30 report API returns correct output VAT, input VAT, and net VAT
- [ ] Report excludes draft/cancelled documents
- [ ] Frontend displays report in P.P.30 form layout
- [ ] Drill-down shows underlying invoice list
- [ ] All tests pass
