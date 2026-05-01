# Thai ERP — Gap Remediation Handoff

**Branch**: `phase-1-critical-fixes` **Created**: 2026-04-24 **Status**: READY
FOR IMPLEMENTATION

---

## Executive Summary

Gap analysis vs Technical Specification (ERP architecture doc) reveals **6
critical gaps**. This document tracks remediation work.

| Priority    | Gap                                                  | Impact                      |
| ----------- | ---------------------------------------------------- | --------------------------- |
| 🔴 CRITICAL | No Sales workflow (Quotation → SalesOrder → Invoice) | Cannot trace sales pipeline |
| 🔴 CRITICAL | No auto Journal Entry generation                     | Accounting not event-driven |
| 🟠 HIGH     | No immutability enforcement (posted docs)            | Data integrity risk         |
| 🟠 HIGH     | No `versionNo` audit trail                           | Cannot detect tampering     |
| 🟡 MEDIUM   | Flat Receipt/Payment/CN/DN (no lines)                | Limits detailed allocation  |
| 🟡 MEDIUM   | No DB-level negative stock check                     | Stock could go negative     |

---

## Implementation Order

```
[1] Audit Trail Foundation  → Add createdById/updatedById/versionNo to all models
        ↓
[2] Sales Workflow Schema   → Quotation, SalesOrder, Invoice→SO FK, SO→Quotation FK
        ↓
[3] Document Lines          → ReceiptLine, PaymentLine, CreditNoteLine, DebitNoteLine
        ↓
[4] Immutability + Reversal → State transition validation + reversal JE logic
        ↓
[5] Auto JE Generation      → Event-driven journal entry creation per doc type
        ↓
[6] DB Stock Constraint     → PostgreSQL CHECK for negative stock
```

---

## Task Files

| File                                                 | Content               |
| ---------------------------------------------------- | --------------------- |
| `.hermes/plans/2026-04-24-gap-remediation.md`        | Master task breakdown |
| `.hermes/plans/2026-04-24-audit-trail-foundation.md` | Task 1 detail         |
| `.hermes/plans/2026-04-24-sales-workflow-schema.md`  | Tasks 2-5 detail      |
| `.hermes/plans/2026-04-24-document-lines.md`         | Tasks 6-9 detail      |
| `.hermes/plans/2026-04-24-immutability-reversal.md`  | Tasks 10-11 detail    |
| `.hermes/plans/2026-04-24-auto-je-generation.md`     | Tasks 12-13 detail    |

---

## Completed Work

- [x] Gap analysis vs technical spec (schema + workflow)
- [x] Skills loaded: thai-erp-{spec,plan,build,test,review}
- [x] Task breakdown created
- [x] Task 1: Audit trail fields (createdById, updatedById, versionNo — 10
      models)
- [x] Task 2: Quotation + QuotationLine models + quotation-service.ts
- [x] Task 3: SalesOrder + SalesOrderLine models (schema only)
- [x] Task 4: Invoice → SalesOrder FK (@unique + named relation)
- [x] Tasks 6+7: ReceiptLine + PaymentLine (schema + services)
- [x] FK conflicts fixed (SalesOrder↔Invoice bidirectional relation resolved)
- [x] Prisma schema validates ✅, db:generate ✅, db:push ✅
- [x] sales-order-service.ts created (945 lines)
- [x] invoice-immutability-service.ts created (434 lines)
- [x] reversal-je-service.ts created (509 lines)
- [x] journal-entry-auto-service.ts created (178 lines, 5 functions)

## TODO

- [ ] Tasks 6+7 cont: verify ReceiptLine/PaymentLine FK relations
- [ ] Task 5: Chain validation rules (Quotation→SO→Invoice)
- [ ] Tasks 8+9: CN/DN lines + flat→lines migration
- [ ] Task 13: All other docs JE generation (CN/DN/GRN/Payment)
- [ ] Task 14: DB stock constraint (CHECK quantity >= 0)
