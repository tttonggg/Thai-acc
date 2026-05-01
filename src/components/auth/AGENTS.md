<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-04-17 -->

# Authentication & User Management

## Purpose

Authentication UI — login page, permission guards, and user management (CRUD,
roles, permissions). Uses NextAuth.js v4 for auth state management.

## Key Files

| File                   | Description                                                            |
| ---------------------- | ---------------------------------------------------------------------- |
| `login-page.tsx`       | Login form with email/password, remember me, forgot password           |
| `permission-guard.tsx` | Role-based access control wrapper component                            |
| `user-management.tsx`  | User CRUD with role assignment (ADMIN, ACCOUNTANT, DATA_ENTRY, VIEWER) |

## For AI Agents

### Working In This Directory

**User Roles**

```typescript
enum UserRole {
  ADMIN = 'ADMIN', // Full system access
  ACCOUNTANT = 'ACCOUNTANT', // Can post transactions, manage all modules
  DATA_ENTRY = 'DATA_ENTRY', // Can create/edit but not post
  VIEWER = 'VIEWER', // Read-only access
}
```

**Permission Guard Pattern**

```typescript
import { PermissionGuard } from './permission-guard'

// Wrap protected content
<PermissionGuard requiredRole={['ADMIN', 'ACCOUNTANT']}>
  <ProtectedContent />
</PermissionGuard>
```

**Critical Invariants**

- Only ADMIN can manage users
- Password hashed with bcrypt (never stored plaintext)
- Session expires after 30 days of inactivity
- CSRF token required for all authenticated requests
- Rate limited: 5 failed login attempts = 15 min lockout

**When Adding Features**

1. Add permission check in API routes
2. Update role definitions
3. Add audit logging for auth events
4. Update NextAuth config if adding new provider
5. Add E2E test in `e2e/auth.spec.ts`

## Dependencies

### Internal

- `@/lib/auth` - NextAuth configuration
- `@/lib/api-utils` - `requireRole()`, `canEdit()`
- `@/components/ui/*` - Form, Button, Alert components
- `/api/auth/*` - NextAuth API routes
- `prisma/user` - User database model

### External

- `next-auth` v4 - Authentication
- `@tanstack/react-query` v5 - User data fetching
- `lucide-react` - Icons
