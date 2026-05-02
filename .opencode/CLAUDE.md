# CLAUDE.md — Current Agent Context for Thai ACC

> **For:** The current agent (Orchestrator/Builder hybrid)  
> **Last Updated:** 2026-05-01  
> **Current Task:** Update tools, then plan + execute next feature

---

## What You Are Doing Right Now

You are in the middle of a Thai ACC development session. The most recent completed work was:
- ✅ e-Tax Invoice module (backend + frontend, deployed)
- ✅ STATUS.md updated to v0.2.0-alpha
- ✅ AGENTS.md created with full project context
- ✅ `.opencode/prompts/` updated (orchestrator, backend, frontend, qa, reviewer)

**Next:** Research and plan the next feature. Use multi-tier agents with orchestrator pattern.

---

## Available Agent Team

You can spawn parallel agents via the `team_create` + `team_spawn` + `team_tasks_add` tools.

| Tier | Model | Role |
|------|-------|------|
| 1 (You) | Kimi K2.6 | Orchestrator + Planner + Reviewer |
| 2 (Feature Leads) | Sonnet | Analysis + planning. Read-only. Can spawn Tier 3. |
| 3 (Specialists) | Haiku | Focused implementation (one file/endpoint per task) |

**Rule:** Max 3 parallel agents to avoid rate limits. Slice tasks to one file per agent.

---

## Remaining Feature Backlog (Prioritized)

### Next Candidates
1. **Multi-currency** — USD, EUR, CNY alongside THB on invoices, POs, bank accounts
2. **Bank Statement Import** — Upload CSV/Excel for auto-matching with GL lines
3. **Contact/Product/Project detail enhancements** — Transaction history, stock movements, budget vs actual charts
4. **Tests** — pytest coverage for PO, purchase invoices, expense claims, accounting, bank reconciliation, e-Tax

### Medium Priority
5. **SSL** — Let's Encrypt for custom domain
6. **Mobile Optimization** — Responsive improvements
7. **Dashboard Charts** — Revenue trend charts, expense breakdown

### Low Priority
8. **Inventory Management** — FIFO costing, stock adjustments, barcode
9. **Payroll** — Thai social security, P.N.D.1K

---

## How to Execute Next Feature

### Step 1: Research (You + Researcher agent)
- Read existing code for similar patterns
- Identify files to modify
- Draft schema changes if needed

### Step 2: Design (You)
- Draft API contract
- Identify frontend components needed
- Identify backend endpoints needed
- Identify DB changes needed

### Step 3: Build (Parallel agents)
Spawn 2-3 agents in parallel:
- **Backend Agent**: Implement models + endpoints + services
- **Frontend Agent**: Implement pages + components + hooks
- **DB Agent**: Create migration

### Step 4: Test (QA Agent)
- Write tests
- Run test suite
- Validate compliance

### Step 5: Review (You)
- Check code quality
- Check security
- Verify builds pass

### Step 6: Deploy (DevOps Agent or You)
- Run `./deploy.sh`
- Verify health endpoint

---

## Critical Reminders

1. **Always read AGENTS.md first** before implementing anything new
2. **Always check STATUS.md** to see what's done
3. **Always follow existing patterns** — copy a similar module's structure
4. **Slice tasks small** — one file per agent task
5. **Never skip Test + Review**
6. **Deploy and verify** after every feature
7. **Update STATUS.md** after completing a feature

---

## Quick Reference

```bash
# Backend tests
cd backend && pytest tests/ -q

# Frontend build
cd frontend && npm run build

# Deploy
./deploy.sh

# Health check
curl http://135.181.107.76:3001/health

# VPS SSH
ssh -i ~/.ssh/test root@135.181.107.76
```

---

## Files That Change Often

| File | Why |
|------|-----|
| `STATUS.md` | Track completion |
| `AGENTS.md` | Agent context updates |
| `frontend/src/components/Sidebar.tsx` | New nav items |
| `frontend/src/lib/api.ts` | New API clients |
| `frontend/src/hooks/useApi.ts` | New TanStack Query hooks |
| `backend/src/main.py` | New router registration |

---

*Current agent context — updated after every session*
