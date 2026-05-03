# RBAC System — Role-Based Access Control

Thai SME Accounting System uses a two-tier authentication model (API key + JWT) with fine-grained role-based permissions.

## Authentication

### Two-Tier Model

| Tier | Header | Purpose |
|------|--------|---------|
| API Key | `X-API-Key` | Authenticates the application/tenant. Required on every request except `/health` and `/api/auth/login`. |
| JWT Token | `Authorization: Bearer <token>` | Authenticates the specific user. Required for permission-gated endpoints. Obtained via login. |

The frontend sends **both** headers on every request via `getHeaders()`.

### JWT Configuration

| Setting | Value |
|---------|-------|
| Algorithm | `HS256` (symmetric, single-service) |
| Secret | `JWT_SECRET_KEY` env var (RuntimeError if unset) |
| Expiry | 30 minutes |
| Refresh window | 24 hours from `iat` |

### Token Payload

```json
{
  "user_id": 1,
  "role_id": 3,
  "dept_id": 2,
  "permissions": ["p2p.pr.create", "gl.journal.post", "..."],
  "exp": "2026-05-02T12:30:00Z",
  "iat": "2026-05-02T12:00:00Z"
}
```

### Auth Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/auth/login` | None | Username + password → JWT + user + permissions. Rate-limited: 5 attempts/60s per IP. |
| POST | `/api/auth/refresh` | API Key | Accepts expired JWT (issued <24h ago), re-queries permissions from DB, returns new token. |
| GET | `/api/auth/me` | API Key | Returns current user profile with fresh permissions. |
| POST | `/api/auth/change-password` | API Key + JWT | Changes password. Extracts `user_id` from JWT (not request body). |
| POST | `/api/auth/logout` | API Key | Client-side token deletion. Returns success for API consistency. |
| GET | `/health` | None | Health check (no auth). |
| GET | `/api/status` | API Key | Application status and feature flags. |

### Login Flow

```
1. User submits username/password on LoginPage
2. POST /api/auth/login → backend authenticates, creates JWT (30-min expiry)
3. Response: { token, user: { user_id, username, full_name, ... }, permissions: [...] }
4. Frontend stores JWT in localStorage('thai_acc_jwt')
5. All subsequent API calls attach X-API-Key + Authorization: Bearer <token>
6. When token expires, POST /api/auth/refresh with expired token → new token
```

---

## Authorization

### Backend Decorators

Three decorators control endpoint access:

#### `@require_api_key`
Checks `X-API-Key` header. Returns 401 if invalid, 500 if unconfigured.

#### `@require_any_permission(*codes)`
The primary decorator used on all route endpoints. Behavior:
- **API key + JWT**: Checks user has `*.*` wildcard or any of the specified permission codes
- **API key only** (no JWT): Grants super admin access — useful for frontend before login

#### `@require_permission(code)`
Strict variant. Requires both API key AND JWT. API key alone returns 401 "JWT token required". Used for write operations where identity must be confirmed.

#### `@require_role(*allowed_roles)`
Restricts by user's role name (text field in `users` table).

### Wildcard Permissions

`*.*` grants access to all endpoints. Assigned to `super_admin` role only.

---

## Roles

### 11 System Roles

| # | Role | Scope |
|---|------|-------|
| 1 | `super_admin` | Full system access + manage roles/permissions |
| 2 | `admin` | All accounting + configuration (no role/permission management) |
| 3 | `accountant` | GL, reports, tax filing, receipt approval |
| 4 | `ap_accountant` | AP invoices, payments, vendor management |
| 5 | `ar_accountant` | AR invoices, receipts, customer management |
| 6 | `purchasing_staff` | Create PR, receive goods (NOT approve PO) |
| 7 | `purchasing_manager` | All purchasing + approve PO up to 25K |
| 8 | `warehouse_staff` | Goods receipt, stock card, inventory |
| 9 | `sales_staff` | Create quotes, sales orders |
| 10 | `sales_manager` | All sales + approve discounts |
| 11 | `viewer` | Read-only across all modules |

---

## Permissions

### 49 Permissions by Module

Format: `module.entity.action`

#### P2P (12)

| Code | Description |
|------|-------------|
| `p2p.pr.create` | Create purchase requisitions |
| `p2p.pr.read` | View purchase requisitions |
| `p2p.pr.approve` | Approve purchase requisitions |
| `p2p.po.create` | Create purchase orders |
| `p2p.po.read` | View purchase orders |
| `p2p.po.approve` | Approve purchase orders |
| `p2p.grn.create` | Create goods receipts |
| `p2p.grn.read` | View goods receipts |
| `p2p.ap_inv.create` | Create AP invoices |
| `p2p.ap_inv.read` | View AP invoices |
| `p2p.ap_inv.approve` | Approve AP invoices |
| `p2p.payment.create` | Create payments |

#### O2C (12)

| Code | Description |
|------|-------------|
| `o2c.quote.create` | Create quotations |
| `o2c.quote.read` | View quotations |
| `o2c.quote.approve` | Approve quotations |
| `o2c.so.create` | Create sales orders |
| `o2c.so.read` | View sales orders |
| `o2c.so.approve` | Approve sales orders |
| `o2c.delivery.create` | Create deliveries |
| `o2c.delivery.read` | View deliveries |
| `o2c.ar_inv.create` | Create AR invoices |
| `o2c.ar_inv.read` | View AR invoices |
| `o2c.ar_inv.approve` | Approve AR invoices |
| `o2c.receipt.create` | Create receipts |

#### Inventory (5)

| Code | Description |
|------|-------------|
| `inventory.item.create` | Create items |
| `inventory.item.read` | View items |
| `inventory.stock.create` | Create stock entries |
| `inventory.stock.read` | View stock |
| `inventory.stock.adjust` | Adjust stock quantities |

#### GL (5)

| Code | Description |
|------|-------------|
| `gl.journal.create` | Create journal entries |
| `gl.journal.read` | View journal entries |
| `gl.journal.post` | Post journal entries |
| `gl.period.close` | Close accounting periods |
| `gl.trial_balance.read` | View trial balance |

#### Bank (3)

| Code | Description |
|------|-------------|
| `bank.account.create` | Create bank accounts |
| `bank.account.read` | View bank accounts |
| `bank.payment.process` | Process payments |

#### Reports (5)

| Code | Description |
|------|-------------|
| `reports.p2p` | P2P reports |
| `reports.o2c` | O2C reports |
| `reports.gl` | GL reports and dashboard |
| `reports.tax` | Tax reports (PP.30, PND.53, Bis.50) |
| `reports.inventory` | Inventory reports |

#### Settings (4)

| Code | Description |
|------|-------------|
| `settings.company` | Company configuration |
| `settings.users` | User management |
| `settings.roles` | Role management |
| `settings.doc_config` | Document configuration |

#### Admin (3)

| Code | Description |
|------|-------------|
| `admin.roles` | Manage roles |
| `admin.permissions` | Manage permissions |
| `admin.audit` | View audit logs |

---

## Role-Permission Matrix

| Permission | super_admin | admin | accountant | ap_acc | ar_acc | purch_staff | purch_mgr | wh_staff | sales_staff | sales_mgr | viewer |
|-----------|:-----------:|:-----:|:----------:|:------:|:------:|:-----------:|:---------:|:--------:|:-----------:|:---------:|:------:|
| **P2P** | | | | | | | | | | | |
| p2p.pr.create | Y | Y | - | Y | - | Y | Y | - | - | - | - |
| p2p.pr.read | Y | Y | - | Y | - | Y | Y | - | - | - | Y |
| p2p.po.create | Y | Y | - | Y | - | - | Y | - | - | - | - |
| p2p.po.read | Y | Y | - | Y | - | Y | Y | - | - | - | Y |
| p2p.grn.create | Y | Y | - | Y | - | Y | Y | Y | - | - | - |
| p2p.grn.read | Y | Y | - | Y | - | Y | Y | Y | - | - | Y |
| p2p.ap_inv.* | Y | Y | - | Y | - | - | - | - | - | - | Y |
| p2p.payment.* | Y | Y | - | Y | - | - | - | - | - | - | - |
| **O2C** | | | | | | | | | | | |
| o2c.quote.* | Y | Y | - | - | Y | - | - | - | Y | Y | Y |
| o2c.so.* | Y | Y | - | - | Y | - | - | - | Y | Y | Y |
| o2c.delivery.* | Y | Y | - | - | Y | - | - | - | Y | Y | Y |
| o2c.ar_inv.approve | Y | Y | Y | - | Y | - | - | - | - | Y | - |
| o2c.receipt.create | Y | Y | Y | - | Y | - | - | - | - | Y | - |
| **Inventory** | Y | Y | - | - | - | - | - | Y | - | - | Y |
| **GL** | Y | Y | Y | - | - | - | - | - | - | - | Y |
| **Bank** | Y | Y | - | Y | - | - | - | - | - | - | - |
| **Reports** | Y | Y | Y | Y | Y | - | - | - | - | - | Y |
| **Settings** | Y | Y | Y | - | - | - | - | - | - | - | - |
| **Admin** | Y | - | - | - | - | - | - | - | - | - | - |

---

## Approval Rules

Amount-based approval chains (configurable in `document_approval_rules` table):

| Document | Amount | Required Role |
|----------|--------|---------------|
| AP Invoice | <= 10,000 | `ap_accountant` |
| AP Invoice | > 10,000 | `admin` |
| AR Invoice | <= 50,000 | `ar_accountant` |
| AR Invoice | > 50,000 | `admin` |
| Payment | <= 10,000 | `ap_accountant` |
| Payment | > 10,000 | `admin` |
| Sales Order | <= 50,000 | `sales_manager` |
| Sales Order | > 50,000 | `admin` |

---

## Frontend Integration

### Zustand Auth Store (`authStore.ts`)

```typescript
// State
{ isAuthenticated, apiKey, userId, role, fullName, company, token, permissions }

// Actions
login(username, password)    // POST /api/auth/login → stores JWT + permissions
logout()                     // Clears localStorage, resets state
hasPermission(code)          // Check '*.*' wildcard or exact match
hasAnyPermission(...codes)   // Check any of multiple codes
```

### PermissionGuard Component

```tsx
<PermissionGuard permission="p2p.po.create" fallback={<ReadOnlyView/>}>
  <CreatePOButton />
</PermissionGuard>
```

Renders children if user has the permission, otherwise renders fallback (defaults to null).

### usePermission Hook

```typescript
const canCreate = usePermission('p2p.po.create');
const canApprove = useAnyPermission('p2p.po.approve', 'admin.roles');
```

---

## Database Schema

### Tables

- **`roles`** — `role_id`, `name` (unique), `description`, `is_system`, `created_at`
- **`permissions`** — `permission_id`, `code` (unique, format: `module.entity.action`), `module`, `action`, `description`
- **`role_permissions`** — Junction table (`role_id`, `permission_id`), CASCADE delete
- **`document_approval_rules`** — Amount-based approval chains by doc type and department
- **`users`** — `user_id`, `username`, `password_hash` (bcrypt), `role_id` (FK), `dept_id` (FK), `status`

### Migrations

- `021_rbac_permissions.sql` — Creates roles, permissions, role_permissions tables + 49 permissions + 11 roles + seed data
- `030_audit_fix.sql` — Adds audit columns for RBAC tracking

---

## Security Hardening (Phase 16)

| Finding | Fix |
|---------|-----|
| JWT secret fallback | RuntimeError if env var missing |
| API key = super admin | `require_permission` now needs JWT too |
| 8-hour JWT expiry | Reduced to 30 minutes + refresh endpoint |
| No login rate limit | 5 attempts per 60 seconds per IP |
| Password IDOR | user_id from JWT, not request body |
| Error info leakage | Generic errors + server-side logging |
| Weak bcrypt rounds | Explicit `rounds=12` |
| JWT algorithm attack | Pinned to HS256 |
| Test blueprint exposed | Guarded by `FLASK_ENV=development` |
