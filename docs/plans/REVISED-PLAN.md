# Revised Development Plan — Thai ACC (PEAK Alternative)

> **Last Updated:** 2026-04-30
> **Version:** 2.0 (with Project Cost Control Feature)

---

## Executive Summary

This plan revises the original 8-step iterative cycle to include **Project Cost Control** as a cross-cutting feature. Every transaction (quotation, invoice, receipt, purchase, expense, journal entry) can now be tagged with a `project_id`, enabling:

- Project-by-project revenue/cost reporting
- Budget vs actual tracking
- Profitability analysis per project
- WHT and VAT reporting by project

---

## Architecture Changes

### New Database Tables

| Table | Purpose | Cross-Cutting |
|-------|---------|---------------|
| `projects` | Project master data | **NEW** |
| `document_sequences` | Sequential doc numbering | NEW |
| `bank_accounts` | Cash/Bank/PromptPay accounts | NEW |
| `chart_of_accounts` | GL accounts (COA) | NEW |
| `journal_entries` | GL journal headers | NEW |
| `journal_entry_lines` | GL journal lines (with `project_id`) | NEW |
| `quotations` | Quotation header (with `project_id`) | NEW |
| `quotation_items` | Quotation line items | NEW |
| `invoices` | Invoice header (with `project_id`) | NEW |
| `invoice_items` | Invoice line items | NEW |
| `receipts` | Receipt header (with `project_id`) | NEW |

### Project ID Integration

`project_id` (UUID, nullable) is added to:
- ✅ Quotations
- ✅ Invoices
- ✅ Receipts
- ✅ Journal Entry Lines
- ⏳ Purchase Orders (future)
- ⏳ Expenses (future)
- ⏳ Inventory transactions (future)

### API Filters

All list endpoints now support `project_id` filter:
- `GET /quotations?project_id=...`
- `GET /invoices?project_id=...`
- `GET /receipts?project_id=...`
- `GET /journal-entries?project_id=...` (future)

---

## Revised Module Sequence

### Phase 1: Foundation ✅ COMPLETE
| Module | Status | Key Deliverables |
|--------|--------|-----------------|
| Settings | ✅ | Company profile, fiscal year, doc prefixes |
| Contacts | ✅ | Customer/vendor CRM with credit limit |
| Products | ✅ | SKU, inventory tracking, FIFO/AVG |
| Auth | ✅ | JWT login/register with company isolation |
| Projects | ✅ | **NEW** Project code, budget, cost tracking |

### Phase 2: Income Module ⏳ IN PROGRESS
| Module | Status | Key Deliverables |
|--------|--------|-----------------|
| Document Numbering | ✅ | Sequential {PREFIX}-{YEAR}-{SEQ:04d} |
| Quotations | ✅ | Draft→Sent→Accepted→Converted, project tag |
| Invoices | ✅ | Draft→Sent→Paid/Partial, auto-receipt, project tag |
| Receipts | ✅ | Cash/Bank/PromptPay, WHT, project tag |
| GL Posting | 🔄 | Skeleton ready, needs COA seeding |
| Tax Invoice | ⏳ | e-Tax Invoice format (RD spec) |

### Phase 3: Expense Module ⏳ PENDING
| Module | Status | Key Deliverables |
|--------|--------|-----------------|
| Purchase Orders | ⏳ | PO→Receive→Invoice matching |
| Expense Claims | ⏳ | Employee expenses, approval flow |
| Bills | ⏳ | AP management, due date tracking |

### Phase 4: Finance Module ⏳ PENDING
| Module | Status | Key Deliverables |
|--------|--------|-----------------|
| Cash/Bank | ⏳ | Multi-account, reconciliation |
| Checks | ⏳ | Check printing, tracking |
| PromptPay | ⏳ | QR code generation |

### Phase 5: Accounting Module ⏳ PENDING
| Module | Status | Key Deliverables |
|--------|--------|-----------------|
| Chart of Accounts | ⏳ | Standard Thai COA seeding |
| Journal Entries | ⏳ | Manual JE, auto-posting from docs |
| Financial Statements | ⏳ | BS, IS, Cash Flow, Trial Balance |
| Project Reports | ⏳ | **NEW** Revenue/cost/profit by project |

### Phase 6: Dashboard ⏳ PENDING
| Module | Status | Key Deliverables |
|--------|--------|-----------------|
| Dashboard | ⏳ | KPIs, charts, AR/AP aging |
| Project Dashboard | ⏳ | **NEW** Budget vs actual, project profitability |

---

## New Feature: Project Cost Control

### Use Cases
1. **Construction Company**: Track revenue/expenses per building project
2. **Consulting Firm**: Track billable hours and costs per client project
3. **Trading Company**: Track profit per import/export shipment

### Data Model
```
Project
├── project_code (unique per company)
├── name, description
├── start_date, end_date
├── budget_amount
├── actual_cost (auto-calculated from linked transactions)
├── status: active | completed | cancelled
└── contact_id (optional, link to client)
```

### Reporting Queries
```sql
-- Revenue by project
SELECT p.project_code, p.name, SUM(i.total_amount) as revenue
FROM projects p
LEFT JOIN invoices i ON i.project_id = p.id
WHERE p.company_id = ?
GROUP BY p.id;

-- Budget vs Actual
SELECT p.project_code, p.budget_amount, p.actual_cost,
       p.budget_amount - p.actual_cost as remaining
FROM projects p
WHERE p.company_id = ? AND p.status = 'active';
```

---

## Multi-Agent Parallel Execution Plan

For the remaining work, use parallel agents:

### Parallel Batch A (Backend)
| Agent | Task | Model |
|-------|------|-------|
| Agent A1 | Seed standard Thai COA + implement GL posting | GLM 5.1 |
| Agent A2 | Expense module (PO, bills, expenses) | GLM 5.1 |
| Agent A3 | Finance module (cash/bank, checks, PromptPay) | GLM 5.1 |

### Parallel Batch B (Frontend)
| Agent | Task | Model |
|-------|------|-------|
| Agent B1 | Income module UI (quotation form, invoice form, receipt form) | Kimi K2.6 |
| Agent B2 | Project module UI + project dashboard | Kimi K2.6 |
| Agent B3 | Dashboard + reports | Kimi K2.6 |

### Quality Gates
- Test coverage >= 80% before Review phase
- All endpoints must filter by `company_id`
- All monetary calculations use `Decimal`
- Project reports must balance (revenue - cost = profit)

---

## Next Immediate Actions

1. **Frontend Income Pages** — Create quotation/invoice/receipt forms
2. **COA Seeding** — Seed standard Thai chart of accounts
3. **GL Auto-Posting** — Connect invoice/receipt creation to GL entries
4. **Project Reports** — Build project profitability API + UI
5. **Testing** — Write pytest for all income endpoints

---

*Plan revised to include Project Cost Control feature as cross-cutting concern across all modules.*
