# Feature Plan: Bank Statement Import

> **Status:** Planned  
> **Priority:** High  
> **Estimated Effort:** 2-3 agent cycles  
> **Depends on:** Bank Reconciliation Module (completed)

---

## 1. Research Findings

### Existing Code
- **Model:** `backend/src/models/bank_account.py` — `BankAccount` with `gl_account_id` link to COA
- **Endpoints:** `backend/src/api/v1/endpoints/bank_accounts.py` — CRUD + reconciliation (`/transactions`, `/reconcile`)
- **Frontend:** `frontend/src/app/bank-accounts/[id]/page.tsx` — Transaction list with checkboxes, date filters, reconcile buttons
- **JE Lines:** `JournalEntryLine` has `is_reconciled`, `reconciled_at`, `reconciled_by`

### Gaps
- No way to import external bank statements (CSV/Excel)
- No auto-matching between bank transactions and GL entries
- Users must manually find and reconcile each transaction one by one

### User Value
- Reduces reconciliation time from hours to minutes
- Prevents missed transactions
- Provides audit trail of imported statements

---

## 2. Design

### 2.1 Database Schema

```
BankStatementImport
├── id (UUID, PK)
├── company_id (UUID, FK, index)
├── bank_account_id (UUID, FK, index)
├── file_name (string)
├── statement_date_from (date)
├── statement_date_to (date)
├── total_debit (Numeric 19,4)
├── total_credit (Numeric 19,4)
├── status (string: pending | processing | completed | failed)
├── error_message (text, nullable)
├── created_by (UUID)
├── created_at (datetime)
└── updated_at (datetime)

BankStatementLine
├── id (UUID, PK)
├── import_id (UUID, FK, index)
├── transaction_date (date, index)
├── description (text)
├── reference_number (string, nullable)
├── debit_amount (Numeric 19,4, default 0)
├── credit_amount (Numeric 19,4, default 0)
├── is_matched (string: Y/N, default N)
├── matched_je_line_id (UUID, FK, nullable)
├── match_score (float, nullable)  -- 0.0 to 1.0
├── created_at (datetime)
└── updated_at (datetime)
```

### 2.2 API Contract

```
POST /bank-accounts/{id}/statements/import
  Body: multipart/form-data (file: .csv or .xlsx)
  Response: BankStatementImport

GET /bank-accounts/{id}/statements
  Response: List[BankStatementImport]

GET /bank-accounts/{id}/statements/{import_id}/lines
  Query: ?unmatched_only=true|false
  Response: List[BankStatementLineWithSuggestions]
    -- each line includes suggested_matches: List[JournalEntryLineSummary]

POST /bank-accounts/{id}/statements/{import_id}/match
  Body: { line_id: UUID, je_line_id: UUID | null }
  Response: BankStatementLine

DELETE /bank-accounts/{id}/statements/{import_id}
  Response: 204
```

### 2.3 CSV Format Support

**Thai bank CSV formats:**
- **KBank:** Date, Description, Withdrawal, Deposit, Balance
- **SCB:** Transaction Date, Description, Debit, Credit, Balance
- **BBL:** Date, Transaction Details, Debit Amount, Credit Amount, Balance
- **Generic:** date, description, debit, credit (auto-detect headers)

**Parsing rules:**
- Auto-detect bank from filename or header row
- Parse Thai date formats: `DD/MM/YYYY` or `YYYY-MM-DD`
- Normalize amounts (remove commas, handle +/- signs)
- Skip header rows and footer rows

### 2.4 Auto-Matching Algorithm

```python
def find_matches(statement_line, je_lines, days_tolerance=3):
    candidates = []
    for je in je_lines:
        # Date match (within N days)
        date_diff = abs((statement_line.transaction_date - je.entry_date).days)
        if date_diff > days_tolerance:
            continue
        
        # Amount match
        stmt_amount = statement_line.debit_amount - statement_line.credit_amount
        je_amount = je.debit_amount - je.credit_amount
        if abs(stmt_amount - je_amount) < 0.01:
            score = 1.0 - (date_diff / days_tolerance) * 0.3
            candidates.append((je, score))
    
    return sorted(candidates, key=lambda x: x[1], reverse=True)[:5]
```

### 2.5 Frontend Components

**Bank Account Detail Page additions:**
- "Import Statement" button → opens upload modal
- "Statement Imports" section → table of past imports
- Click import → view lines with match suggestions
- Match UI: show statement line + suggested JE lines + "Match" button
- Unmatched filter toggle

---

## 3. Task Breakdown (Sliced for Agents)

### Batch 1: Backend (Parallel — 3 agents)

| Task | Agent | Files | Description |
|------|-------|-------|-------------|
| **B1** | Backend-Models | `models/bank_statement_import.py`, `models/bank_statement_line.py`, `models/__init__.py`, `alembic/versions/006_bank_statements.py` | Create SQLAlchemy models + migration. Follow BaseModel pattern (UUID PK, company_id, timestamps, soft delete). Add proper indexes. |
| **B2** | Backend-Service | `services/bank_statement_service.py` | CSV parser (KBank/SCB/BBL/generic), Excel parser, auto-matcher algorithm, amount normalization, Thai date parsing. |
| **B3** | Backend-Endpoints | `api/v1/endpoints/bank_accounts.py` (append), `api/v1/endpoints/__init__.py` if needed | Add 4 endpoints: import, list, lines, match. Use existing patterns (company_id filter, auth, HTTPException). |

### Batch 2: Frontend (Parallel — 2 agents)

| Task | Agent | Files | Description |
|------|-------|-------|-------------|
| **F1** | Frontend-API | `lib/api.ts`, `hooks/useApi.ts` | Add API client methods + TanStack Query hooks for statement import, list, lines, match. |
| **F2** | Frontend-UI | `app/bank-accounts/[id]/page.tsx` (edit), `app/bank-accounts/[id]/StatementImportModal.tsx`, `app/bank-accounts/[id]/StatementMatchPanel.tsx` | Add upload modal, import history table, match panel with suggested JE lines. Follow existing design system. |

### Batch 3: Tests (1 agent)

| Task | Agent | Files | Description |
|------|-------|-------|-------------|
| **T1** | QA | `tests/test_bank_statements.py` | Test import endpoint, CSV parsing, auto-matching, company isolation, soft delete. |

---

## 4. Quality Gates

- [ ] Models have company_id filter + indexes
- [ ] Endpoints filter by company_id + auth
- [ ] CSV parser handles KBank/SCB/BBL formats
- [ ] Auto-matcher scores by date proximity + amount exactness
- [ ] Frontend upload shows progress + validation
- [ ] Match UI shows amount, date, description for both sides
- [ ] Tests cover import, match, unmatch, delete
- [ ] Build passes (`npm run build`, `pytest tests/ -q`)
- [ ] Deploy succeeds, health check passes

---

## 5. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| CSV format variations | Support generic format + auto-detect headers; allow manual mapping |
| Large files (>1000 rows) | Process asynchronously (status: processing → completed) |
| Duplicate imports | Check for overlapping date ranges + warn user |
| Wrong matches | Show match score, allow manual override, show unmatched filter |

---

*Plan created by Orchestrator (Kimi K2.6) — 2026-05-01*
