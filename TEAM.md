# PEAK Alternative — Agent Team Specification

> Powered by [OpenCode Ensemble](https://github.com/hueyexe/opencode-ensemble) v0.13.1
> Project: Thai Cloud Accounting SaaS (PEAK Alternative)

---

## Team Overview

**Team Name:** `peak-build`
**Objective:** Build a full-featured Thai cloud accounting platform as an alternative to PEAK (peakaccount.com).
**Lead:** You (the user) — coordinates the team, reviews plans, approves risky changes.

## Model Strategy

### Tier 1 — Main & Orchestrator Agents (Kimi K2.6)
These agents handle core architecture, business logic, UI/UX, and security. They get the best model.

| Agent | Role | Model |
|-------|------|-------|
| **architect** | System design & specs | `opencode-go/kimi-k2.6` |
| **backend** | API & business logic | `opencode-go/kimi-k2.6` |
| **frontend** | UI/UX implementation | `opencode-go/kimi-k2.6` |
| **security** | Auth & data protection | `opencode-go/kimi-k2.6` |

### Tier 2 — Supporting Agents (GLM 5.1)
These agents handle infrastructure, schema, testing, and integrations. GLM 5.1 is capable and cost-effective for these tasks.

| Agent | Role | Model |
|-------|------|-------|
| **database** | Schema & migrations | `opencode-go/glm-5.1` |
| **devops** | Docker, CI/CD, deploy | `opencode-go/glm-5.1` |
| **qa** | Testing & compliance | `opencode-go/glm-5.1` |
| **integrator** | External APIs & e-Tax | `opencode-go/glm-5.1` |

### Fallback Pool (when primary models hit limits)
- `opencode-go/kimi-k2.6`
- `opencode-go/glm-5.1`
- `opencode-go/qwen-3.6`
- `opencode-go/minimax-m2.7`
- `opencode-go/deepseek-4-pro`

---

## Agent Roster

### 1. Architect (`architect`) — Strategic Planner
**Model:** `opencode-go/kimi-k2.6` (primary — cost-effective & capable)
**Fallback Models:** `opencode-go/glm-5.1`, `opencode-go/qwen-3.6`, `opencode-go/minimax-m2.7`, `opencode-go/deepseek-4-pro`
**Agent Type:** `architect`

**Responsibilities:**
- Design overall system architecture (monolith vs microservices)
- Define API contracts and data flow between modules
- Create the master technical specification
- Review database schema designs
- Make technology stack decisions
- Ensure Thai accounting compliance (TFRS, Revenue Dept rules)

**Tasks:**
- Create system architecture document
- Define module boundaries (Dashboard, Income, Expense, Contacts, Products, Finance, Accounting, Documents, Settings)
- Design authentication & authorization flow
- Plan multi-tenancy strategy
- Define event-driven patterns for GL posting

**Outputs:**
- `/docs/architecture.md`
- `/docs/api-contracts.md`
- `/docs/tech-stack.md`

---

### 2. Backend (`backend`) — API & Business Logic
**Model:** `opencode-go/kimi-k2.6` (primary)
**Fallback Models:** `opencode-go/glm-5.1`, `opencode-go/qwen-3.6`, `opencode-go/minimax-m2.7`, `opencode-go/deepseek-4-pro`
**Agent Type:** `build`

**Responsibilities:**
- Implement RESTful API endpoints
- Build business logic for all 9 modules
- Handle Thai tax calculations (VAT 7%, WHT, Phor.Por.30, Phor.Ngor.Dor.1/3/53)
- Implement document numbering and workflows
- Build FIFO inventory costing
- Create e-Tax Invoice generation logic

**Tasks (by phase):**
- Phase 1: Auth, Company, User management
- Phase 2: Contacts (Customers/Suppliers)
- Phase 3: Products & Inventory
- Phase 4: Income documents (Quotation, Invoice, Receipt, Tax Invoice)
- Phase 5: Expense documents (PO, Expense Invoice, Receipt)
- Phase 6: Finance (Banking, Reconciliation)
- Phase 7: Accounting (Journal, Chart of Accounts, GL)
- Phase 8: Reports & Tax forms

**Outputs:**
- `/backend/` — Flask/FastAPI application
- `/backend/tests/` — Unit and integration tests

---

### 3. Frontend (`frontend`) — UI/UX Implementation
**Model:** `opencode-go/kimi-k2.6`
**Agent Type:** `build`

**Responsibilities:**
- Build React components matching PEAK design (see `/design.md`)
- Implement the 9-module navigation
- Create reusable component library (cards, tables, forms, dropdowns)
- Build dashboard with charts and summaries
- Implement Thai localization
- Create responsive layouts

**Tasks (by phase):**
- Phase 1: Design system & component library
- Phase 2: Auth pages (Login, Register, Onboarding)
- Phase 3: Dashboard layout & navigation
- Phase 4: Contacts module UI
- Phase 5: Products module UI
- Phase 6: Income & Expense document UIs
- Phase 7: Finance & Accounting UIs
- Phase 8: Settings & Reports

**Outputs:**
- `/frontend/` — React/Next.js application
- `/frontend/src/components/` — Reusable components
- `/frontend/src/pages/` — Module pages

---

### 4. Database (`database`) — Schema & Data Layer
**Model:** `opencode-go/glm-5.1`
**Agent Type:** `build`

**Responsibilities:**
- Design PostgreSQL schema
- Create migration files
- Implement Prisma/SQLAlchemy models
- Design indexing strategy for performance
- Plan data archival and retention
- Create seed data for testing

**Key Entities:**
- Companies / Branches
- Users & Permissions
- Contacts (Customers, Suppliers)
- Products & Services (with SKU, FIFO tracking)
- Chart of Accounts (Thai standard)
- Documents (Quotations, Invoices, Receipts, Tax Invoices, POs)
- Inventory Transactions
- Bank Accounts & Transactions
- Journal Entries
- Tax Records

**Outputs:**
- `/backend/prisma/schema.prisma` or `/backend/models.py`
- `/backend/migrations/`
- `/backend/seeders/`

---

### 5. DevOps (`devops`) — Infrastructure & CI/CD
**Model:** `opencode-go/glm-5.1`
**Agent Type:** `build`

**Responsibilities:**
- Set up Docker containers (frontend, backend, database, nginx)
- Create docker-compose for local development
- Set up GitHub Actions CI/CD pipeline
- Configure VPS deployment (following existing Thai ACC patterns)
- Set up logging and monitoring
- Configure SSL/certificates
- Database backup strategy

**Outputs:**
- `/Dockerfile`
- `/docker-compose.yml`
- `/.github/workflows/`
- `/deploy/` — Deployment scripts
- `/nginx.conf`

---

### 6. QA (`qa`) — Testing & Compliance
**Model:** `opencode-go/glm-5.1`
**Agent Type:** `build`

**Responsibilities:**
- Write unit tests for backend APIs
- Write integration tests for document workflows
- Create end-to-end tests for critical paths
- Validate Thai accounting compliance
- Test edge cases (tax calculations, FIFO, WHT)
- Performance testing for report generation

**Test Coverage Targets:**
- Auth & Permissions: 100%
- Document creation & posting: 100%
- Tax calculations: 100%
- Inventory FIFO: 100%
- GL posting: 100%

**Outputs:**
- `/backend/tests/unit/`
- `/backend/tests/integration/`
- `/frontend/tests/e2e/`
- `/docs/test-plan.md`

---

### 7. Security (`security`) — Auth & Data Protection
**Model:** `opencode-go/kimi-k2.6`
**Agent Type:** `build`

**Responsibilities:**
- Design JWT-based authentication
- Implement role-based access control (RBAC)
- Add audit logging for all document changes
- Ensure data encryption at rest and in transit
- Implement PIN code security (like PEAK)
- Review OWASP top 10 vulnerabilities
- Design API rate limiting

**Outputs:**
- `/backend/src/auth/`
- `/backend/src/middleware/security.py`
- `/docs/security-policy.md`

---

### 8. Integrator (`integrator`) — External APIs & e-Tax
**Model:** `opencode-go/kimi-k2.6`
**Agent Type:** `build`

**Responsibilities:**
- Research Thai bank API integrations (SCB, KBANK, BAY)
- Implement e-Tax Invoice API (Thai Revenue Department)
- Research PromptPay integration
- Design webhook system for bank notifications
- Plan LINE notification integration
- Research DBD e-Filing API

**Outputs:**
- `/backend/src/integrations/`
- `/docs/integration-specs.md`

---

## Team Workflow

### How to Spawn the Team

```
You: "Start building the PEAK alternative accounting system."

Lead creates team "peak-build", then spawns:
1. architect — "Design the full system architecture for a Thai cloud accounting SaaS"
2. backend — "Start implementing the backend API" (waits for architect)
3. frontend — "Build the React frontend" (waits for architect)
4. database — "Design the PostgreSQL schema" (runs parallel with architect)
5. devops — "Set up Docker and CI/CD" (runs parallel)
6. qa — "Write test plans" (waits for backend & frontend)
7. security — "Design auth and security" (runs parallel with architect)
8. integrator — "Research external API integrations" (runs parallel)
```

### Task Dependencies

```
[architect] ──> [backend] ──> [qa]
     │              │
     ├──> [frontend] ──> [qa]
     │
     ├──> [database] (parallel)
     ├──> [devops] (parallel)
     ├──> [security] (parallel)
     └──> [integrator] (parallel)
```

### Communication Patterns

- **Architect** sends specs to Backend, Frontend, Database
- **Backend** and **Frontend** coordinate on API contracts
- **Database** shares schema with Backend
- **QA** receives code from Backend and Frontend for testing
- **Security** reviews all auth-related code
- **Integrator** shares API documentation with Backend

---

## Module Breakdown for Parallel Work

| Module | Primary Agent | Supporting Agents | Complexity |
|--------|--------------|-------------------|------------|
| Auth & Settings | backend + frontend | security | Medium |
| Contacts (CRM) | backend + frontend | database | Low |
| Products & Inventory | backend + frontend | database | High |
| Income Documents | backend + frontend | security, qa | High |
| Expense Documents | backend + frontend | security, qa | High |
| Finance & Banking | backend + frontend | integrator | High |
| Accounting (GL) | backend + frontend | database, qa | Very High |
| Reports & Tax | backend + frontend | qa | High |
| Documents Storage | backend + frontend | devops | Medium |

---

## Key Design Constraints (from PEAK Analysis)

1. **Thai-first:** All labels, dates, currency in Thai format
2. **Tax Compliance:** VAT 7%, WHT certificates, e-Tax Invoice, Phor.Por.30
3. **FIFO Inventory:** Mandatory for Thai accounting
4. **Multi-branch:** Support multiple company branches
5. **Multi-currency:** Support THB and foreign currencies
6. **Document Workflows:** Quotation → Invoice → Receipt → Tax Invoice
7. **Bank Reconciliation:** Match bank statements with transactions
8. **Role-based Access:** Different permissions per user role
9. **Mobile Responsive:** Must work on tablets and phones
10. **API-first:** All features accessible via REST API

---

## Technology Stack (Recommended)

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Next.js 15 + Tailwind CSS + shadcn/ui |
| Backend | Python 3.12 + FastAPI + SQLAlchemy |
| Database | PostgreSQL 16 + Redis (caching) |
| Auth | JWT + bcrypt + role-based permissions |
| ORM | Prisma (if Node backend) or SQLAlchemy (if Python) |
| Testing | Pytest (backend) + Playwright (e2e) |
| Deployment | Docker + Docker Compose + VPS |
| CI/CD | GitHub Actions |
| Monitoring | Prometheus + Grafana |

---

## Project Structure

```
peak-acc/
├── .opencode/
│   └── ensemble.json          # Team configuration
├── opencode.json              # OpenCode plugin config
├── design.md                  # PEAK UI reference (existing)
├── TEAM.md                    # This file
├── docs/
│   ├── architecture.md
│   ├── api-contracts.md
│   ├── tech-stack.md
│   ├── security-policy.md
│   ├── integration-specs.md
│   └── test-plan.md
├── backend/
│   ├── src/
│   │   ├── auth/
│   │   ├── modules/
│   │   │   ├── contacts/
│   │   │   ├── products/
│   │   │   ├── income/
│   │   │   ├── expense/
│   │   │   ├── finance/
│   │   │   ├── accounting/
│   │   │   └── settings/
│   │   ├── integrations/
│   │   └── middleware/
│   ├── tests/
│   ├── migrations/
│   ├── seeders/
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── lib/
│   ├── tests/
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── nginx.conf
└── .github/workflows/
```

---

## Getting Started Checklist

- [ ] Install OpenCode Ensemble plugin (done — see `opencode.json`)
- [ ] Allow worktree permissions (done — see `~/.config/opencode/opencode.json`)
- [ ] Configure ensemble settings (done — see `.opencode/ensemble.json`)
- [ ] Restart OpenCode to load the plugin
- [ ] Spawn `architect` agent to create initial specs
- [ ] Review architecture document
- [ ] Spawn remaining agents based on dependencies
- [ ] Monitor dashboard at `http://localhost:4747`
- [ ] Review merged changes with `git diff`

---

## Useful Commands

```bash
# Check team status
opencode
> "Check team status"

# View specific teammate
opencode
> "Show me what backend is working on"

# Spawn with plan approval (for risky changes)
opencode
> "Spawn a security agent with plan approval to review auth"

# Merge teammate changes manually
opencode
> "Merge backend's branch"

# Clean up team when done
opencode
> "Clean up the peak-build team"
```

---

*Generated for OpenCode Ensemble v0.13.1*
