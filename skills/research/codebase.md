# Skill: Codebase Explorer

## Description
Thoroughly analyze an existing codebase to understand structure, patterns, conventions, and find relevant code for new features.

## Trigger
Use when:
- Joining an existing project
- Adding features to existing code
- Refactoring or modernizing legacy code
- Finding where to add new functionality

## Assigned Model
`opencode-go/qwen-3.6` (1M token context for large codebases)

## Detailed Instruction / SOP

### Step 1: High-Level Structure
Analyze directory structure:
```
backend/
  src/
    auth/        ← JWT, roles, permissions
    modules/     ← Business logic per domain
    middleware/  ← Request processing
  tests/
frontend/
  src/
    components/  ← Reusable UI
    pages/       ← Route-level components
    hooks/       ← Custom React hooks
    lib/         ← Utilities
```

### Step 2: Convention Discovery
Identify patterns:
- Naming conventions (PascalCase, snake_case)
- File organization (feature-based vs layer-based)
- State management (Context, Zustand, Redux)
- API patterns (REST, tRPC, GraphQL)
- Testing patterns (unit, integration, e2e)

### Step 3: Find Relevant Code
For a new feature, locate:
- Similar existing features (copy patterns from)
- Shared utilities (reuse)
- Database models (extend from)
- API routes (add alongside)
- Frontend pages (navigate from)

### Step 4: Dependency Map
Map relationships:
```
User model ←── Auth module
    │
    ├──▶ Contact model
    ├──▶ Invoice model
    └──▶ Settings module
```

## Example Usage

```
Input: "Add quotation feature to existing Thai ACC system"

Explorer finds:
- Similar: Invoice module at /backend/src/modules/invoices/
- DB pattern: SQLAlchemy models in /backend/src/models/
- API pattern: FastAPI routers in /backend/src/routes/
- Frontend: React pages in /frontend/src/app/
- Auth: JWT middleware at /backend/src/middleware/auth.py
- Tests: Pytest in /backend/tests/

Recommendation: Copy invoice module structure, adapt for quotations
```

## Output Format
Save to: `/docs/research/codebase-analysis.md`
