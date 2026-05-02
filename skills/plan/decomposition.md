# Skill: Task Decomposition

## Description
Break down large features into small, atomic, independently implementable tasks. Each task should be completable by a single agent in one work session.

## Trigger
Use when:
- A spec is ready and needs implementation tasks
- Tasks are too large for one agent
- Need to identify parallelizable work

## Assigned Model
`opencode-go/kimi-k2.6`

## Detailed Instruction / SOP

### Step 1: Identify Major Components
From the spec, identify:
- Database schema changes
- Backend API endpoints
- Frontend pages/components
- Integrations
- Tests needed

### Step 2: Decompose into Atomic Tasks
Each task must be:
- **Independent**: Can be worked on without blocking others
- **Small**: Completable in 1 agent session (~30-60 min)
- **Testable**: Has clear completion criteria
- **Assigned**: Has a clear owner agent

### Step 3: Identify Dependencies
Create a dependency graph:
```
DB Migration ──▶ Backend API ──▶ Frontend Component
     │
     └──▶ Seed Data
```

### Step 4: Parallel Grouping
Group tasks that can run in parallel:
- Group A (parallel): DB migration, API design doc
- Group B (parallel, depends on A): Backend implementation, Frontend mock
- Group C (depends on B): Integration, E2E tests

### Step 5: Estimate & Prioritize
- Assign effort estimate (S/M/L)
- Assign priority (P0/P1/P2)
- Identify critical path

## Example Usage

```
Input: Quotation system spec

Output tasks:
1. [DB] Create quotations table migration (S) → database agent
2. [DB] Create quotation_items table migration (S) → database agent
3. [BE] POST /api/quotations endpoint (M) → backend agent
4. [BE] GET /api/quotations/:id endpoint (S) → backend agent
5. [BE] PUT /api/quotations/:id/status endpoint (S) → backend agent
6. [FE] QuotationList page component (M) → frontend agent
7. [FE] QuotationForm component (M) → frontend agent
8. [FE] QuotationDetail page (M) → frontend agent
9. [TEST] Unit tests for quotation API (M) → qa agent
10. [TEST] E2E test for quotation flow (L) → qa agent
```

## Output Format
Save to: `/docs/plans/{feature-name}-tasks.md`
