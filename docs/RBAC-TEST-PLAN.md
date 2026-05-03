# RBAC System Test Plan

## Overview
Test the complete RBAC implementation after deployment to VPS.

## Pre-Deployment Checklist

### 1. Code Verification
- [ ] All RBAC commits pushed to master
- [ ] Production build passes locally (`bun run build`)
- [ ] Type check passes (`bun run type-check`)

### 2. VPS Deployment
- [ ] Deploy latest code to VPS
- [ ] Verify DATABASE_URL is correct in `/root/.next/standalone/.env`
- [ ] Restart server and verify health endpoint
- [ ] Check server logs for errors

---

## Test Cases

### Phase 1: Authentication & Session

| Test | Steps | Expected Result |
|------|-------|-----------------|
| T1.1 Login with ADMIN | Login as admin@kpm.com | Success, JWT issued |
| T1.2 JWT expires in 1h | Login, wait 1 hour | Session expires, auto-logout |
| T1.3 Session invalidation | Change password, try old session | 401 error |

### Phase 2: Database Models

| Test | Steps | Expected Result |
|------|-------|-----------------|
| T2.1 Role table exists | Query `SELECT * FROM Role` | Returns role records |
| T2.2 Permission table exists | Query `SELECT * FROM Permission` | Returns permission records |
| T2.3 EmployeeRole junction works | Query Employee with roles | Returns linked roles |
| T2.4 UserEmployee link works | Query User with employee | Returns linked employee |

### Phase 3: canManageRoles Permission

| Test | Steps | Expected Result |
|------|-------|-----------------|
| T3.1 ADMIN can access roles | GET /api/admin/roles | 200 with roles list |
| T3.2 Non-admin blocked | Login as VIEWER, GET /api/admin/roles | 403 Forbidden |
| T3.3 Create role with audit | POST /api/admin/roles | Role created, audit log entry |

### Phase 4: Permission-Based Routes

| Test | Steps | Expected Result |
|------|-------|-----------------|
| T4.1 Journal read | Login ACCOUNTANT, GET /api/journal | 200 with journal entries |
| T4.2 Journal create | POST /api/journal | 201 created |
| T4.3 Journal post | POST /api/journal/[id]/post | Status changes to POSTED |
| T4.4 Unauthorized action | Try to void as VIEWER | 403 Forbidden |

### Phase 5: Job Title Integration

| Test | Steps | Expected Result |
|------|-------|-----------------|
| T5.1 JobTitle table works | Query `SELECT * FROM JobTitle` | Returns job title records |
| T5.2 Employee has jobTitleId | Query Employee | Shows linked job title |
| T5.3 Job title filter | Filter employees by job title | Returns matching employees |

---

## Test Execution

### Local Smoke Test
```bash
bun run test:quick
```

### Manual API Tests
```bash
# Login and get session
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kpm.com","password":"admin123"}'

# Test journal access (as ADMIN)
curl http://localhost:3000/api/journal \
  -H "Cookie: next-auth.session-token=..."

# Test permission check (should fail for non-admin)
curl http://localhost:3000/api/admin/roles \
  -H "Cookie: next-auth.session-token=..." # VIEWER token
```

---

## Deployment Commands

```bash
# 1. Push to git
git add . && git commit -m "RBAC implementation complete" && git push

# 2. SSH to VPS and pull
ssh -i ~/.ssh/test root@135.181.107.76
cd /root/.next/standalone && git pull

# 3. Restart server
fuser -k 3000/tcp 2>/dev/null; sleep 1
DATABASE_URL='file:/root/data/dev.db' node server.js &

# 4. Verify
curl http://localhost:3000/api/health
```

---

## Success Criteria

- [ ] All Phase 1-5 tests pass
- [ ] Health endpoint returns `{"status":"healthy"}`
- [ ] No errors in server logs
- [ ] Production login works at https://acc.k56mm.uk