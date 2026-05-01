# Thai Accounting ERP - Master Implementation Plan

**Status**: Active Execution **Last Updated**: 2026-03-11 **Version**: 2.0.0

---

## Executive Summary

This master plan breaks down all missing functionality into **nano-tasks** that
can be executed by specialized agent swarms. Each task is designed to be
completed independently and tested separately.

### Current State Analysis

- ✅ **Backend API**: Complete and functional
- ✅ **Database Schema**: Complete with 73 accounts seeded
- ✅ **UI Components**: Beautiful shell but **NON-FUNCTIONAL**
- ❌ **Frontend-Backend Integration**: Missing
- ❌ **Document Creation**: Non-existent
- ❌ **Edit/Update Functions**: Non-existent
- ❌ **Export Functions**: Non-existent (except Chart of Accounts CSV)
- ❌ **Report Generation**: Static/hardcoded data only

---

## Task Organization by Department

### 📊 Phase 1: Foundation (ALL DEPARTMENTS - PARALLEL)

### 🔨 Phase 2: Core CRUD Features (Engineering + QA)

### 📋 Phase 3: Document Creation (Engineering + Design)

### 📤 Phase 4: Export & Reports (Engineering + QA)

### 🎨 Phase 5: Polish & Enhancement (Design + QA)

### 🔒 Phase 6: Security & Performance (Security + DevOps)

---

# DEPARTMENT 1: PRODUCT MANAGEMENT

## Product Manager Tasks

### Task 1.1: Define Real Data Requirements ✅

**Status**: Complete **Output**: `prisma/seed.ts` with 73 accounts, 4 users, 3
customers, 2 vendors

### Task 1.2: Create Test Data Strategy ⏳

**Micro-task 1.2.1**: Define invoice test data scenarios

- Create 10 sample invoices with different statuses (DRAFT, ISSUED, PAID,
  PARTIAL, CANCELLED)
- Include edge cases: zero VAT, exempt VAT, multiple line items
- Assign to: **Product Manager**
- Estimated: 1 hour
- Output: `SEED-DATA-INVOCES.md`

**Micro-task 1.2.2**: Define journal entry test data

- Create 20 sample journal entries covering all account types
- Include complex entries: multi-line, inter-company, accruals
- Assign to: **Product Manager**
- Estimated: 1 hour
- Output: `SEED-DATA-JOURNAL.md`

**Micro-task 1.2.3**: Define report test scenarios

- Trial balance with various balances
- Income statement with profit/loss scenarios
- Balance sheet with various asset/liability combinations
- Assign to: **Product Manager**
- Estimated: 30 minutes
- Output: `SEED-DATA-REPORTS.md`

### Task 1.3: Prioritize Feature Backlog ⏳

**Nano-task 1.3.1**: Rank all UI buttons by business impact

1. Invoice Create (CRITICAL - revenue)
2. Journal Entry Save (CRITICAL - accounting)
3. Export Buttons (HIGH - compliance)
4. Edit Functions (HIGH - data accuracy)
5. Report Generation (MEDIUM - visibility)
6. Purchase Orders (LOW - future)

- Assign to: **Product Manager**
- Output: `FEATURE-PRIORITY.md`

**Nano-task 1.3.2**: Create acceptance criteria for each feature

- Given/When/Then format
- Thai language requirements
- Regulatory compliance checks
- Assign to: **Product Manager**
- Output: `ACCEPTANCE-CRITERIA.md`

---

# DEPARTMENT 2: SOFTWARE ENGINEERING

## Backend Engineer Tasks

### Task 2.1: Enhance API for Frontend Consumption ✅ COMPLETE

**Status**: Authentication and rate limiting already implemented

### Task 2.2: Create Document Generation API ⏳

**Micro-task 2.2.1**: Invoice number generation endpoint

- Pattern: INV-YYYY-NNNN with auto-increment
- Check for gaps and reuse cancelled numbers
- Assign to: **Backend Engineer**
- File: `src/app/api/invoices/next-number/route.ts`
- Estimated: 2 hours

**Micro-task 2.2.2**: Journal entry auto-posting

- Validate debits = credits
- Generate journal entry number
- Post to ledger tables
- Assign to: **Backend Engineer**
- File: `src/app/api/journal/post/route.ts`
- Estimated: 3 hours

**Micro-task 2.2.3**: Report calculation endpoints

- Trial balance: Sum all accounts by type
- Income statement: Revenue - Expenses
- Balance sheet: Assets = Liabilities + Equity
- Assign to: **Backend Engineer**
- Files:
  - `src/app/api/reports/trial-balance/route.ts`
  - `src/app/api/reports/income-statement/route.ts`
  - `src/app/api/reports/balance-sheet/route.ts`
- Estimated: 4 hours

**Micro-task 2.2.4**: PDF generation endpoint

- Install: `npm install jspdf @types/jspdf`
- Create PDF service with Thai font support
- Assign to: **Backend Engineer**
- File: `src/lib/pdf-generator.ts`
- Estimated: 6 hours

**Micro-task 2.2.5**: Excel export endpoint

- Install: `npm install xlsx`
- Create Excel service with Thai language support
- Assign to: **Backend Engineer**
- File: `src/lib/excel-export.ts`
- Estimated: 4 hours

## Frontend Engineer Tasks

### Task 2.3: Implement Invoice Creation Form ⏳ CRITICAL

**Nano-task 2.3.1**: Create invoice form component

- File: `src/components/invoices/invoice-form.tsx`
- Fields: customer, date, items (dynamic), VAT calculation
- Assign to: **Frontend Engineer**
- Estimated: 4 hours

**Nano-task 2.3.2**: Implement item line management

- Add/remove lines
- Auto-calculate line totals
- Product search/selection
- Assign to: **Frontend Engineer**
- Estimated: 3 hours

**Nano-task 2.3.3**: Connect to backend API

- POST to `/api/invoices`
- Handle success/error
- Refresh list after creation
- Assign to: **Frontend Engineer**
- Estimated: 2 hours

**Nano-task 2.3.4**: Add form validation

- Required fields check
- VAT calculation validation
- Thai tax ID format (13 digits)
- Assign to: **Frontend Engineer**
- Estimated: 2 hours

**Nano-task 2.3.5**: Test invoice creation end-to-end

- Create test invoice
- Verify database save
- Verify display in list
- Assign to: **QA Engineer (Manual)**
- Estimated: 1 hour

### Task 2.4: Implement Journal Entry Save ⏳ CRITICAL

**Nano-task 2.4.1**: Connect Save button to API

- File: `src/components/journal/journal-entry.tsx`
- POST to `/api/journal`
- Handle validation errors
- Assign to: **Frontend Engineer**
- Estimated: 2 hours

**Nano-task 2.4.2**: Add real account dropdown

- Fetch from `/api/accounts`
- Display account code + name
- Searchable dropdown
- Assign to: **Frontend Engineer**
- Estimated: 2 hours

**Nano-task 2.4.3**: Implement balance check

- Disable Save if not balanced
- Show difference amount
- Auto-balance suggestions
- Assign to: **Frontend Engineer**
- Estimated: 3 hours

**Nano-task 2.4.4**: Test journal entry save

- Create balanced entry
- Create unbalanced entry (should fail)
- Verify ledger posting
- Assign to: **QA Engineer (Manual)**
- Estimated: 1 hour

### Task 2.5: Implement Edit Dialogs ⏳ HIGH

**Nano-task 2.5.1**: Create invoice edit dialog

- File: `src/components/invoices/invoice-edit-dialog.tsx`
- Pre-populate with existing data
- Assign to: **Frontend Engineer**
- Estimated: 4 hours

**Nano-task 2.5.2**: Implement customer/vendor edit

- Files:
  - `src/components/ar/customer-edit-dialog.tsx`
  - `src/components/ap/vendor-edit-dialog.tsx`
- Assign to: **Frontend Engineer**
- Estimated: 3 hours each

**Nano-task 2.5.3**: Test edit functionality

- Edit existing invoice
- Verify update saves
- Verify list updates
- Assign to: **QA Engineer (Manual)**
- Estimated: 2 hours

### Task 2.6: Implement Export Functions ⏳ HIGH

**Nano-task 2.6.1**: Connect invoice export to PDF

- Click handler in `invoice-list.tsx`
- Call `/api/invoices/[id]/export/pdf`
- Download file
- Assign to: **Frontend Engineer**
- Estimated: 2 hours

**Nano-task 2.6.2**: Connect report export buttons

- Files: `src/components/reports/reports.tsx`
- Handle all 8 report types
- Format selection (PDF/Excel)
- Assign to: **Frontend Engineer**
- Estimated: 4 hours

**Nano-task 2.6.3**: Test all export functions

- Export each report type
- Verify file format
- Verify Thai language display
- Assign to: **QA Engineer (Manual)**
- Estimated: 2 hours

### Task 2.7: Replace Static Data with API Calls ⏳ MEDIUM

**Nano-task 2.7.1**: Dashboard real data

- Fetch from `/api/dashboard`
- Update charts with real data
- Assign to: **Frontend Engineer**
- Estimated: 3 hours

**Nano-task 2.7.2**: Invoice list real data

- Fetch from `/api/invoices`
- Implement pagination
- Assign to: **Frontend Engineer**
- Estimated: 2 hours

**Nano-task 2.7.3**: Customer/Vendor lists

- Fetch from `/api/customers` and `/api/vendors`
- Update list components
- Assign to: **Frontend Engineer**
- Estimated: 2 hours each

## Full-Stack Engineer Tasks

### Task 2.8: Create Quotation System ⏳ LOW

**Micro-task 2.8.1**: Backend - Quotation API

- CRUD endpoints
- Convert quotation to invoice
- Assign to: **Full-Stack Engineer**
- Estimated: 4 hours

**Micro-task 2.8.2**: Frontend - Quotation form

- Similar to invoice form
- Add "Convert to Invoice" button
- Assign to: **Full-Stack Engineer**
- Estimated: 4 hours

### Task 2.9: Implement Receipt System ⏳ LOW

**Micro-task 2.9.1**: Backend - Receipt API

- CRUD endpoints
- Link to invoice
- Assign to: **Full-Stack Engineer**
- Estimated: 3 hours

**Micro-task 2.9.2**: Frontend - Receipt form

- Pre-fill from invoice
- Partial payment support
- Assign to: **Full-Stack Engineer**
- Estimated: 3 hours

---

# DEPARTMENT 3: UI/UX DESIGN

## UX Designer Tasks

### Task 3.1: Design Document Creation Workflows ⏳

**Nano-task 3.1.1**: Invoice creation flow diagram

- From button click to save
- Error states
- Success confirmation
- Assign to: **UX Designer**
- Output: `Figma link or diagram`
- Estimated: 2 hours

**Nano-task 3.1.2**: Journal entry workflow

- Multi-step process
- Balance checking
- Post confirmation
- Assign to: **UX Designer**
- Output: `Figma link or diagram`
- Estimated: 2 hours

### Task 3.2: Create Error State Designs ⏳

**Nano-task 3.2.1**: Form validation error patterns

- Thai error messages
- Visual indicators
- Inline help text
- Assign to: **UX Designer**
- Output: `DESIGN-SYSTEM-ERRORS.md`
- Estimated: 2 hours

**Nano-task 3.2.2**: API error handling UX

- Network errors
- Validation errors
- Permission errors
- Assign to: **UX Designer**
- Output: `ERROR-PATTERNS.md`
- Estimated: 1 hour

### Task 3.3: Design Loading States ⏳

**Nano-task 3.3.1**: Skeleton loaders

- Table rows
- Form fields
- Cards
- Assign to: **UX Designer**
- Output: `Figma components`
- Estimated: 2 hours

**Nano-task 3.3.2**: Progress indicators

- For long operations
- PDF generation
- Report calculation
- Assign to: **UX Designer**
- Output: `PROGRESS-DESIGN.md`
- Estimated: 1 hour

## UI Designer Tasks

### Task 3.4: Create Invoice Template Design ⏳

**Nano-task 3.4.1**: PDF invoice template

- Thai accounting standard format
- Company header
- Table layout
- Tax calculation display
- Assign to: **UI Designer**
- Output: `Figma + HTML template`
- Estimated: 4 hours

**Nano-task 3.4.2**: Report templates

- Trial balance
- Income statement
- Balance sheet
- Assign to: **UI Designer**
- Output: `Figma + HTML templates`
- Estimated: 6 hours

---

# DEPARTMENT 4: QUALITY ASSURANCE

## QA Engineer (Manual) Tasks

### Task 4.1: Create Test Cases ⏳

**Micro-task 4.1.1**: Document creation test cases

- Invoice: 15 test cases (happy path, edge cases, errors)
- Journal: 10 test cases
- Quotation: 8 test cases
- Receipt: 8 test cases
- Assign to: **QA Engineer (Manual)**
- Output: `TEST-CASES-DOCUMENTS.md`
- Estimated: 4 hours

**Micro-task 4.1.2**: Export function test cases

- PDF export: 5 test cases per document type
- Excel export: 5 test cases per report
- Assign to: **QA Engineer (Manual)**
- Output: `TEST-CASES-EXPORT.md`
- Estimated: 3 hours

**Micro-task 4.1.3**: Edit function test cases

- Invoice edit: 10 test cases
- Customer/Vendor edit: 5 each
- Assign to: **QA Engineer (Manual)**
- Output: `TEST-CASES-EDIT.md`
- Estimated: 2 hours

### Task 4.2: Execute Manual Tests ⏳

**Nano-task 4.2.1**: Test all buttons on invoice page

- Create, Edit, View, Print, Export, Delete
- Verify each works
- Assign to: **QA Engineer (Manual)**
- Output: `TEST-RESULTS-INVOICES.md`
- Estimated: 2 hours

**Nano-task 4.2.2**: Test all buttons on journal page

- Save, Edit, Delete, Calculate
- Assign to: **QA Engineer (Manual)**
- Output: `TEST-RESULTS-JOURNAL.md`
- Estimated: 1 hour

**Nano-task 4.2.3**: Test all export buttons

- Every export button on every page
- Assign to: **QA Engineer (Manual)**
- Output: `TEST-RESULTS-EXPORT.md`
- Estimated: 2 hours

### Task 4.3: Edge Case Testing ⏳

**Nano-task 4.3.1**: Boundary value tests

- Maximum line items
- Large amounts
- Special characters in Thai
- Assign to: **QA Engineer (Manual)**
- Output: `EDGE-CASE-RESULTS.md`
- Estimated: 3 hours

**Nano-task 4.3.2**: Negative scenario tests

- Unbalanced journal entries
- Invalid tax IDs
- Duplicate invoice numbers
- Assign to: **QA Engineer (Manual)**
- Output: `NEGATIVE-TEST-RESULTS.md`
- Estimated: 2 hours

## Automation QA Engineer Tasks

### Task 4.4: Create Automated Test Suite ⏳

**Micro-task 4.4.1**: Invoice creation E2E tests

- File: `e2e/invoice-creation.spec.ts`
- Cover: create, edit, delete, export
- Assign to: **Automation QA Engineer**
- Estimated: 4 hours

**Micro-task 4.4.2**: Journal entry E2E tests

- File: `e2e/journal-entry.spec.ts`
- Cover: save, balance check, post
- Assign to: **Automation QA Engineer**
- Estimated: 3 hours

**Micro-task 4.4.3**: Report generation E2E tests

- Files:
  - `e2e/reports/trial-balance.spec.ts`
  - `e2e/reports/income-statement.spec.ts`
  - `e2e/reports/balance-sheet.spec.ts`
- Assign to: **Automation QA Engineer**
- Estimated: 4 hours

**Micro-task 4.4.4**: API integration tests

- File: `src/lib/__tests__/api-integration.test.ts`
- Test all CRUD endpoints
- Assign to: **Automation QA Engineer**
- Estimated: 6 hours

---

# DEPARTMENT 5: DEVOPS & INFRASTRUCTURE

## DevOps Engineer Tasks

### Task 5.1: Setup Testing Infrastructure ⏳

**Nano-task 5.1.1**: Configure test database

- Separate test DB
- Auto-seed before tests
- Cleanup after tests
- Assign to: **DevOps Engineer**
- Output: `.env.test` configuration
- Estimated: 2 hours

**Nano-task 5.1.2**: CI/CD pipeline for tests

- GitHub Actions workflow
- Run tests on PR
- Coverage reporting
- Assign to: **DevOps Engineer**
- Output: `.github/workflows/test.yml`
- Estimated: 3 hours

### Task 5.2: Setup Staging Environment ⏳

**Nano-task 5.2.1**: Deploy staging server

- Vercel/Railway deployment
- Environment variables
- Database backup
- Assign to: **DevOps Engineer**
- Estimated: 2 hours

**Nano-task 5.2.2**: Automated backups

- Daily database backups
- 30-day retention
- Restore procedure
- Assign to: **DevOps Engineer**
- Output: `BACKUP-PROCEDURE.md`
- Estimated: 2 hours

---

# DEPARTMENT 6: DATA & AI

## Data Engineer Tasks

### Task 6.1: Create Comprehensive Seed Data ⏳

**Micro-task 6.1.1**: Generate realistic invoices

- 50 invoices over 6 months
- Various customers, statuses, amounts
- Assign to: **Data Engineer**
- Output: Updated `prisma/seed.ts`
- Estimated: 3 hours

**Micro-task 6.1.2**: Generate journal entries

- 100 entries matching invoices
- Manual adjustments, accruals
- Assign to: **Data Engineer**
- Output: Updated `prisma/seed.ts`
- Estimated: 4 hours

**Micro-task 6.1.3**: Generate customer/vendor data

- 20 customers with Thai tax IDs
- 10 vendors with contacts
- Assign to: **Data Engineer**
- Output: Updated `prisma/seed.ts`
- Estimated: 2 hours

## Business Intelligence Analyst Tasks

### Task 6.2: Create Dashboard Metrics ⏳

**Nano-task 6.2.1**: Define KPI calculations

- AR aging
- AP aging
- Cash flow
- Profitability
- Assign to: **BI Analyst**
- Output: `KPI-DEFINITIONS.md`
- Estimated: 2 hours

**Nano-task 6.2.2**: Create dashboard queries

- SQL queries for each metric
- Performance optimization
- Assign to: **BI Analyst**
- Output: `src/lib/dashboard-queries.ts`
- Estimated: 3 hours

---

# DEPARTMENT 7: SECURITY (AppSec)

## Security Engineer Tasks

### Task 7.1: Security Review ⏳

**Nano-task 7.1.1**: Review file upload security

- Verify current implementation
- Test bypass attempts
- Assign to: **Security Engineer**
- Output: `SECURITY-REVIEW-UPLOAD.md`
- Estimated: 2 hours

**Nano-task 7.1.2**: Review API authentication

- Check all endpoints
- Test authorization bypass
- Assign to: **Security Engineer**
- Output: `SECURITY-REVIEW-API.md`
- Estimated: 3 hours

### Task 7.2: Implement Security Headers ⏳

**Nano-task 7.2.1**: Add CSP headers

- Content Security Policy
- X-Frame-Options
- Assign to: **Security Engineer**
- File: `next.config.js`
- Estimated: 1 hour

**Nano-task 7.2.2**: Audit logging

- Track all CRUD operations
- User attribution
- Assign to: **Security Engineer**
- Output: `src/lib/audit-log.ts`
- Estimated: 3 hours

---

# DEPARTMENT 8: TECHNICAL DOCUMENTATION

## Technical Writer Tasks

### Task 8.1: API Documentation ⏳

**Nano-task 8.1.1**: Document all endpoints

- Swagger/OpenAPI spec
- Request/response examples
- Assign to: **Technical Writer**
- Output: `docs/API.md`
- Estimated: 6 hours

**Nano-task 8.1.2**: Create integration guide

- How to connect frontend
- Authentication flow
- Error handling
- Assign to: **Technical Writer**
- Output: `docs/INTEGRATION.md`
- Estimated: 3 hours

### Task 8.2: User Documentation ⏳

**Nano-task 8.2.1**: Create user manual

- Thai language
- Step-by-step guides
- Screenshots
- Assign to: **Technical Writer**
- Output: `docs/USER-MANUAL.md`
- Estimated: 8 hours

---

# DEPARTMENT 9: AGILE DELIVERY

## Scrum Master Tasks

### Task 9.1: Sprint Planning ⏳

**Nano-task 9.1.1**: Create Sprint 1 backlog

- Focus: Invoice creation
- 2-week sprint
- Assign to: **Scrum Master**
- Output: `SPRINT-1-BACKLOG.md`
- Estimated: 1 hour

**Nano-task 9.1.2**: Daily standup coordination

- Track progress
- Remove blockers
- Assign to: **Scrum Master**
- Ongoing: Daily 15 min

### Task 9.2: Task Tracking ⏳

**Nano-task 9.2.1**: Setup project board

- GitHub Projects or Jira
- Assign tasks
- Track status
- Assign to: **Scrum Master**
- Output: `Project board`
- Estimated: 2 hours

## Project Manager Tasks

### Task 9.3: Timeline Management ⏳

**Nano-task 9.3.1**: Create Gantt chart

- All tasks with dependencies
- Critical path
- Assign to: **Project Manager**
- Output: `PROJECT-TIMELINE.md`
- Estimated: 3 hours

**Nano-task 9.3.2**: Risk register

- Identify risks
- Mitigation strategies
- Assign to: **Project Manager**
- Output: `RISK-REGISTER.md`
- Estimated: 2 hours

---

# EXECUTION PHASES

## Phase 1: Foundation (Week 1) - ALL DEPARTMENTS PARALLEL

### Sprint 1.1: Critical Path

1. **Product Manager**: Define all requirements (Task 1.2, 1.3)
2. **Backend Engineer**: Create all missing API endpoints (Task 2.2)
3. **Frontend Engineer**: Invoice creation form (Task 2.3)
4. **Frontend Engineer**: Journal entry save (Task 2.4)
5. **QA Engineer**: Create test cases (Task 4.1)

**Deliverables**:

- Complete API documentation
- Working invoice creation
- Working journal entry save
- Test case suite

**Success Criteria**:

- Can create invoice from UI
- Can save journal entry from UI
- All tests documented

---

## Phase 2: Core CRUD (Week 2)

### Sprint 2.1: Edit & Update

1. **Frontend Engineer**: Invoice edit dialog (Task 2.5.1)
2. **Frontend Engineer**: Customer/Vendor edit (Task 2.5.2)
3. **QA Engineer**: Test edit functions (Task 4.2)

### Sprint 2.2: Real Data Integration

1. **Frontend Engineer**: Replace static data (Task 2.7)
2. **Data Engineer**: Enhanced seed data (Task 6.1)
3. **Automation QA**: Integration tests (Task 4.4.4)

**Deliverables**:

- Full CRUD for invoices
- Full CRUD for customers/vendors
- All lists using real data

---

## Phase 3: Documents & Exports (Week 3)

### Sprint 3.1: PDF Generation

1. **Backend Engineer**: PDF service (Task 2.2.4)
2. **UI Designer**: Invoice template (Task 3.4.1)
3. **Frontend Engineer**: Connect exports (Task 2.6.1)

### Sprint 3.2: Excel & Reports

1. **Backend Engineer**: Excel service (Task 2.2.5)
2. **Backend Engineer**: Report APIs (Task 2.2.3)
3. **Frontend Engineer**: Report exports (Task 2.6.2)
4. **UI Designer**: Report templates (Task 3.4.2)

**Deliverables**:

- Working PDF export
- Working Excel export
- Dynamic report generation

---

## Phase 4: Polish & Enhancement (Week 4)

### Sprint 4.1: UX Improvements

1. **UX Designer**: Error states (Task 3.2)
2. **UX Designer**: Loading states (Task 3.3)
3. **Frontend Engineer**: Implement UX designs

### Sprint 4.2: Testing & QA

1. **QA Engineer**: Execute all manual tests (Task 4.2, 4.3)
2. **Automation QA**: E2E test suite (Task 4.4)
3. **Security Engineer**: Security review (Task 7.1)

**Deliverables**:

- Comprehensive error handling
- Loading indicators
- Full test coverage
- Security audit complete

---

## Phase 5: Documentation & Deployment (Week 5)

### Sprint 5.1: Documentation

1. **Technical Writer**: API docs (Task 8.1)
2. **Technical Writer**: User manual (Task 8.2)
3. **Product Manager**: Acceptance criteria validation

### Sprint 5.2: Deployment

1. **DevOps Engineer**: CI/CD setup (Task 5.1.2)
2. **DevOps Engineer**: Staging deploy (Task 5.2)
3. **Scrum Master**: Final acceptance

**Deliverables**:

- Complete documentation
- Production deployment ready
- All acceptance criteria met

---

# AGENT SWARM COORDINATION

## Swarm 1: Critical Features (Priority 1)

**Agents**: Frontend Engineer, Backend Engineer, QA Engineer (Manual) **Tasks**:
2.3, 2.4, 4.1 **Duration**: Week 1 **Goal**: Working invoice creation and
journal entry save

## Swarm 2: Data Integration (Priority 2)

**Agents**: Frontend Engineer, Data Engineer, Automation QA **Tasks**: 2.7, 6.1,
4.4.4 **Duration**: Week 2 **Goal**: All UI using real data

## Swarm 3: Export System (Priority 3)

**Agents**: Backend Engineer, Frontend Engineer, UI Designer **Tasks**: 2.2.4,
2.2.5, 2.6, 3.4 **Duration**: Week 3 **Goal**: Complete export functionality

## Swarm 4: Quality & Polish (Priority 4)

**Agents**: UX Designer, QA Engineer, Security Engineer **Tasks**: 3.2, 3.3,
4.2, 4.3, 7.1 **Duration**: Week 4 **Goal**: Production-ready quality

## Swarm 5: Documentation & Deploy (Priority 5)

**Agents**: Technical Writer, DevOps Engineer, Project Manager **Tasks**: 8.1,
8.2, 5.1, 5.2 **Duration**: Week 5 **Goal**: Deploy to production

---

# SUCCESS METRICS

## Week 1 Metrics

- ✅ Can create invoice from UI
- ✅ Can save journal entry from UI
- ✅ Test cases documented

## Week 2 Metrics

- ✅ Edit functionality works
- ✅ All lists use real data
- ✅ Integration tests passing

## Week 3 Metrics

- ✅ PDF export works for all documents
- ✅ Excel export works for all reports
- ✅ Reports use real calculations

## Week 4 Metrics

- ✅ All manual tests passing
- ✅ E2E tests passing
- ✅ Security audit passed

## Week 5 Metrics

- ✅ Documentation complete
- ✅ Deployed to staging
- ✅ Ready for production

---

# NEXT STEPS

**IMMEDIATE ACTION REQUIRED:**

1. **Deploy Swarm 1** - Critical Features
   - Frontend Engineer: Invoice form (Task 2.3)
   - Frontend Engineer: Journal save (Task 2.4)
   - QA Engineer: Test cases (Task 4.1)

2. **Deploy Swarm 2** - Data Integration (parallel)
   - Data Engineer: Seed data (Task 6.1)
   - Frontend Engineer: Real data (Task 2.7)

3. **Begin Sprint Planning**
   - Scrum Master: Sprint 1 backlog (Task 9.1.1)
   - Project Manager: Timeline (Task 9.3.1)

---

_This master plan is a living document. Update as progress is made._ _All tasks
are designed to be independently testable and verifiable._
