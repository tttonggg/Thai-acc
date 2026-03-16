# Troubleshooting Guide for Developers

This guide helps developers troubleshoot common issues when developing the Thai Accounting ERP system.

## Table of Contents

- [Development Environment](#development-environment)
- [Database Issues](#database-issues)
- [Build Issues](#build-issues)
- [Runtime Issues](#runtime-issues)
- [Testing Issues](#testing-issues)
- [Authentication Issues](#authentication-issues)
- [Performance Issues](#performance-issues)
- [Git Issues](#git-issues)

---

## Development Environment

### Issue: `bun install` fails

**Symptoms:**
```
error: Failed to install packages
```

**Solutions:**
```bash
# 1. Clear bun cache
bun pm cache rm

# 2. Delete node_modules
rm -rf node_modules bun.lockb

# 3. Reinstall
bun install

# 4. If still failing, use npm as fallback
npm install
```

### Issue: Port 3000 already in use

**Symptoms:**
```
Error: Port 3000 is already in use
```

**Solutions:**
```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9

# Or use different port
bun run dev -- --port 3001
```

### Issue: Environment variables not loading

**Symptoms:**
```
Error: DATABASE_URL is not defined
```

**Solutions:**
```bash
# 1. Check .env file exists
ls -la .env

# 2. Copy from example
cp .env.example .env

# 3. Fill in required values
# Edit .env with your values

# 4. Restart dev server
```

---

## Database Issues

### Issue: Prisma generate fails

**Symptoms:**
```
Error: @prisma/client did not initialize yet
```

**Solutions:**
```bash
# 1. Install Prisma CLI
bun add -D prisma

# 2. Generate client
bun run db:generate

# 3. If fails, delete generated folder
rm -rf node_modules/.prisma
bun run db:generate
```

### Issue: Migration fails

**Symptoms:**
```
Error: P3002 - Migration already applied
```

**Solutions:**
```bash
# 1. Check migration status
bunx prisma migrate status

# 2. Reset database (development only!)
bun run db:reset

# 3. Or resolve manually
bunx prisma migrate resolve --rolled-back "migration_name"
```

### Issue: Database is locked

**Symptoms:**
```
Error: database is locked (SQLite)
```

**Solutions:**
```bash
# 1. Stop all processes using the database
# 2. Wait a few seconds
# 3. Restart dev server

# Or delete WAL files
rm prisma/dev.db-journal
rm prisma/dev.db-wal
rm prisma/dev.db-shm
```

### Issue: Foreign key constraint fails

**Symptoms:**
```
Error: Foreign key constraint failed
```

**Solutions:**
```bash
# 1. Check related records exist
# 2. Check cascade delete settings
# 3. Delete child records first
# 4. Or temporarily disable foreign keys (SQLite only)
```

---

## Build Issues

### Issue: TypeScript compilation errors

**Symptoms:**
```
error TS2322: Type 'X' is not assignable to type 'Y'
```

**Solutions:**
```bash
# 1. Run type check
bun run type-check

# 2. Fix type errors
# Common issues:
# - Missing type annotations
# - Incorrect prop types
# - Any type usage

# 3. Regenerate types if needed
bun run db:generate
```

### Issue: Module not found

**Symptoms:**
```
Error: Cannot find module '@/components/ui/button'
```

**Solutions:**
```bash
# 1. Check tsconfig.json paths
# 2. Check file exists
ls src/components/ui/button.tsx

# 3. Clear Next.js cache
rm -rf .next

# 4. Restart dev server
```

### Issue: ESLint errors

**Symptoms:**
```
error: 'variable' is assigned but never used
```

**Solutions:**
```bash
# 1. Check lint errors
bun run lint

# 2. Auto-fix where possible
bun run lint:fix

# 3. Fix remaining manually
```

---

## Runtime Issues

### Issue: API route 404

**Symptoms:**
```
404: Cannot GET /api/invoices
```

**Solutions:**
```bash
# 1. Check file exists
ls src/app/api/invoices/route.ts

# 2. Check HTTP method
# Should be GET, POST, etc.

# 3. Check for typos in path

# 4. Restart dev server
```

### Issue: Session not working

**Symptoms:**
```
Session is null after login
```

**Solutions:**
```bash
# 1. Check NEXTAUTH_SECRET is set
# Must be at least 32 characters

# 2. Check NEXTAUTH_URL
# Must match your URL

# 3. Clear cookies
# Open DevTools → Application → Cookies → Clear

# 4. Check database session store
```

### Issue: Prisma Client in production

**Symptoms:**
```
Error: PrismaClient is not configured
```

**Solutions:**
```typescript
// lib/db.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

### Issue: Hydration mismatch

**Symptoms:**
```
Warning: Text content does not match server-rendered HTML
```

**Solutions:**
```tsx
// 1. Check for browser-only APIs
'use client';

// 2. Use dynamic import for client components
import dynamic from 'next/dynamic';

const ClientComponent = dynamic(
  () => import('./ClientComponent'),
  { ssr: false }
);

// 3. Use useEffect for browser-only code
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
```

---

## Testing Issues

### Issue: Tests fail with database error

**Symptoms:**
```
Error: Cannot connect to database
```

**Solutions:**
```bash
# 1. Check test database URL
# Usually different from dev database

# 2. Create test database
bun run db:reset

# 3. Run migrations
bun run db:migrate
```

### Issue: Playwright tests timeout

**Symptoms:**
```
Error: Test timeout of 30000ms exceeded
```

**Solutions:**
```bash
# 1. Increase timeout
# playwright.config.ts
export default {
  timeout: 60000,
};

# 2. Check if dev server is running
bun run dev

# 3. Run tests in headed mode to debug
bun run test:e2e -- --headed
```

### Issue: Vitest module resolution

**Symptoms:**
```
Error: Cannot find module '@/lib/utils'
```

**Solutions:**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

---

## Authentication Issues

### Issue: NextAuth callbacks not working

**Symptoms:**
```
Session does not contain custom properties
```

**Solutions:**
```typescript
// 1. Check JWT callback
callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.role = user.role;
    }
    return token;
  },
  async session({ session, token }) {
    if (session.user) {
      session.user.role = token.role;
    }
    return session;
  },
}

// 2. Add type declarations
// types/next-auth.d.ts
declare module 'next-auth' {
  interface Session {
    user: {
      role: string;
    } & DefaultSession['user'];
  }
}
```

### Issue: bcrypt module error

**Symptoms:**
```
Error: Cannot find module 'bcrypt'
```

**Solutions:**
```bash
# 1. Install bcrypt
bun add bcrypt
bun add -D @types/bcrypt

# 2. Or use bcryptjs for compatibility
bun add bcryptjs
bun add -D @types/bcryptjs
```

---

## Performance Issues

### Issue: Slow page load

**Symptoms:**
```
Page takes > 3 seconds to load
```

**Solutions:**
```bash
# 1. Check bundle size
bun run build
# Check .next/static chunks

# 2. Use dynamic imports
const HeavyComponent = dynamic(() => import('./Heavy'));

# 3. Optimize images
# Use next/image

# 4. Add database indexes
# Check slow queries with Prisma logging
```

### Issue: Memory leak

**Symptoms:**
```
JavaScript heap out of memory
```

**Solutions:**
```bash
# 1. Increase Node memory
export NODE_OPTIONS="--max-old-space-size=4096"

# 2. Check for infinite loops
# 3. Check for unsubscribed event listeners
# 4. Use React DevTools Profiler
```

---

## Git Issues

### Issue: Merge conflicts

**Solutions:**
```bash
# 1. Fetch latest
 git fetch origin

# 2. Rebase your branch
git rebase origin/main

# 3. Resolve conflicts
# Edit conflicting files

# 4. Continue rebase
git add .
git rebase --continue
```

### Issue: Large files in git history

**Solutions:**
```bash
# 1. Use git-lfs for large files
# 2. Or remove from history
git filter-branch --force --index-filter \
'git rm --cached --ignore-unmatch path/to/file' \
HEAD
```

---

## Debugging Tips

### Enable Debug Logging

```bash
# Prisma queries
DEBUG="prisma:*" bun run dev

# Next.js
DEBUG=* bun run dev
```

### VS Code Debugging

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "bun run dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

### Browser DevTools

1. **Network Tab**: Check API calls
2. **Console**: View errors and logs
3. **Application**: Check localStorage, cookies
4. **React DevTools**: Component inspection

---

## Getting Help

If you can't resolve the issue:

1. Check [GitHub Issues](https://github.com/thaiaccounting/erp/issues)
2. Search closed issues
3. Create a new issue with:
   - Error message
   - Steps to reproduce
   - Environment details
   - Screenshots if applicable

---

**Last Updated:** March 16, 2026
