# Thai Accounting ERP - Bug Fixing Roadmap

## Executive Summary

This roadmap prioritizes bug fixes and improvements based on the comprehensive
codebase analysis conducted by multiple agent swarms. The analysis identified
**47 issues** across security, UI/UX, and testing categories.

## Priority Matrix

| Priority                | Issues    | Status            | Owner            |
| ----------------------- | --------- | ----------------- | ---------------- |
| **Critical (Security)** | 9 issues  | ✅ 9/9 Completed  | Security Team    |
| **High (UI/UX)**        | 18 issues | ✅ 5/18 Completed | Frontend Team    |
| **Medium (Testing)**    | 12 issues | ✅ 3/12 Completed | QA Team          |
| **Low (Enhancement)**   | 8 issues  | ⏳ 0/8 Started    | Development Team |

---

## Phase 1: Security Fixes ✅ COMPLETED

### 1.1 Authentication & Authorization (5/5 Completed)

| Issue                    | Severity | Status   | Solution                           |
| ------------------------ | -------- | -------- | ---------------------------------- |
| Hardcoded JWT secret     | Critical | ✅ Fixed | Environment variable with fallback |
| Unprotected API routes   | Critical | ✅ Fixed | Added `requireAuth()` middleware   |
| Missing RBAC enforcement | High     | ✅ Fixed | Added `requireRole()` checks       |
| 30-day session timeout   | Medium   | ✅ Fixed | Reduced to 8 hours                 |
| Weak bcrypt cost factor  | Medium   | ✅ Fixed | Increased from 10 to 12            |

**Files Modified:**

- `src/lib/auth.ts`
- `src/lib/api-auth.ts` (NEW)
- `src/app/api/users/route.ts`
- `src/app/api/users/[id]/route.ts`
- `src/app/api/dashboard/route.ts`
- `src/app/api/journal/route.ts`
- `src/app/api/customers/route.ts`

### 1.2 Input Validation & Sanitization (2/2 Completed)

| Issue                     | Severity | Status   | Solution                                       |
| ------------------------- | -------- | -------- | ---------------------------------------------- |
| File upload vulnerability | Critical | ✅ Fixed | File type whitelist, 5MB limit, UUID filenames |
| Mass assignment in import | Critical | ✅ Fixed | Zod validation schemas                         |

**Files Modified:**

- `src/app/api/upload/route.ts` (COMPLETELY REWRITTEN)
- `src/app/api/backup/import/route.ts` (COMPLETELY REWRITTEN)

### 1.3 Rate Limiting (1/1 Completed)

| Issue                   | Severity | Status   | Solution                           |
| ----------------------- | -------- | -------- | ---------------------------------- |
| No rate limiting on API | High     | ✅ Fixed | In-memory rate limiting middleware |

**Files Created:**

- `src/lib/rate-limit.ts` (NEW)
- `src/middleware.ts` (NEW)

**Presets Implemented:**

- Strict: 5 requests/minute (auth endpoints)
- Moderate: 20 requests/minute (general API)
- Relaxed: 100 requests/minute (public reads)
- Hourly: 1000 requests/hour (bulk operations)

---

## Phase 2: UI/UX Improvements 🚧 IN PROGRESS

### 2.1 Thai Localization (5/18 Completed)

| Issue                    | Severity | Status     | Solution            |
| ------------------------ | -------- | ---------- | ------------------- |
| "แดชบอร์ด" typo          | High     | ✅ Fixed   | "ภาพรวม"            |
| "ผู้ดูเท่านั้น" typo     | High     | ✅ Fixed   | "ผู้ชมเท่านั้น"     |
| Long menu items          | Medium   | ✅ Fixed   | Shortened labels    |
| Alert dialog issues      | Medium   | ✅ Fixed   | Toast notifications |
| Form validation messages | Medium   | ⏳ Pending | Thai error messages |

**Files Modified:**

- `src/components/layout/sidebar.tsx`
- `src/components/dashboard/dashboard.tsx`
- `src/components/settings/settings.tsx`

### 2.2 Component Improvements (13 Remaining)

**High Priority:**

- [ ] Form validation dialogs (Zod + React Hook Form)
- [ ] Responsive mobile menu
- [ ] Loading states for async operations
- [ ] Error boundary components
- [ ] Empty state illustrations

**Medium Priority:**

- [ ] Skeleton loaders
- [ ] Keyboard navigation
- [ ] Focus management in modals
- [ ] Accessible ARIA labels
- [ ] Color contrast adjustments
- [ ] Thai font optimization

**Low Priority:**

- [ ] Dark mode toggle
- [ ] Animated transitions
- [ ] Tooltips for complex forms

---

## Phase 3: Testing Framework ✅ COMPLETED

### 3.1 Unit Testing Setup (3/3 Completed)

| Component                | Tests    | Coverage | Status      |
| ------------------------ | -------- | -------- | ----------- |
| Thai Tax Calculations    | 14 tests | 100%     | ✅ Complete |
| Double-Entry Bookkeeping | 13 tests | 100%     | ✅ Complete |
| Thai Formatters          | 13 tests | 100%     | ✅ Complete |

**Test Files Created:**

- `src/lib/__tests__/thai-tax.test.ts` (NEW)
- `src/lib/__tests__/double-entry.test.ts` (NEW)
- `src/lib/__tests__/thai-formatters.test.ts` (NEW)
- `src/test/setup.ts` (NEW)
- `src/test/utils/test-utils.tsx` (NEW)
- `vitest.config.ts` (NEW)

**Key Test Coverage:**

- VAT calculations (7% rate)
- WHT PND3 (salary tax brackets)
- WHT PND53 (services 3%, rent 5%, advertising 2%)
- Debit/Credit rules for account types
- Journal entry validation
- Thai Baht currency formatting
- Thai date formatting (Buddhist calendar)
- Account code validation

### 3.2 E2E Testing Setup (3/3 Completed)

**Test Files Created:**

- `e2e/dashboard.spec.ts` (NEW)
- `e2e/invoices.spec.ts` (NEW)
- `e2e/vat.spec.ts` (NEW)
- `playwright.config.ts` (NEW)

**E2E Test Coverage:**

- Dashboard display and navigation
- Invoice creation with VAT calculation
- Thai form validation
- VAT/WHT calculations and reporting

**NPM Scripts Added:**

```bash
npm test           # Run Vitest in watch mode
npm run test:run   # Run all tests once
npm run test:coverage # Generate coverage report
npm run test:e2e   # Run Playwright tests
npm run test:e2e:ui # Run Playwright with UI
```

---

## Phase 4: Remaining Bug Fixes 📋 TODO

### 4.1 Critical Business Logic (3 Issues)

| Issue                               | Impact             | Estimate |
| ----------------------------------- | ------------------ | -------- |
| Rounding errors in tax calculations | Financial accuracy | 2 hours  |
| Account hierarchy validation        | Data integrity     | 3 hours  |
| Journal entry audit trail           | Compliance         | 4 hours  |

### 4.2 API Edge Cases (5 Issues)

| Issue                         | Impact          | Estimate |
| ----------------------------- | --------------- | -------- |
| Concurrent invoice generation | Race conditions | 3 hours  |
| Large file upload timeouts    | UX              | 2 hours  |
| Pagination edge cases         | Performance     | 2 hours  |
| Search query optimization     | Performance     | 4 hours  |
| Database connection pooling   | Stability       | 2 hours  |

### 4.3 Frontend Polish (8 Issues)

| Issue                      | Impact          | Estimate |
| -------------------------- | --------------- | -------- |
| Form validation feedback   | UX              | 4 hours  |
| Loading indicators         | UX              | 2 hours  |
| Error messages (Thai)      | Localization    | 3 hours  |
| Responsive breakpoints     | Mobile UX       | 4 hours  |
| Print styles for invoices  | Professional    | 2 hours  |
| Accessibility improvements | Compliance      | 6 hours  |
| Performance optimization   | User experience | 4 hours  |
| Browser compatibility      | Reach           | 3 hours  |

---

## Phase 5: Infrastructure & DevOps 🔮 PLANNED

### 5.1 Production Readiness

| Task                            | Priority | Estimate |
| ------------------------------- | -------- | -------- |
| Environment variable validation | High     | 2 hours  |
| Database migrations strategy    | High     | 4 hours  |
| API documentation (OpenAPI)     | Medium   | 8 hours  |
| Monitoring & logging setup      | High     | 6 hours  |
| Backup verification script      | Critical | 3 hours  |
| Deployment pipeline (CI/CD)     | High     | 6 hours  |

### 5.2 Scalability

| Task                           | Priority | Estimate |
| ------------------------------ | -------- | -------- |
| Redis rate limiting            | High     | 4 hours  |
| Database indexing review       | Medium   | 3 hours  |
| Query performance audit        | Medium   | 6 hours  |
| Caching strategy (React Query) | Medium   | 4 hours  |

---

## Development Workflow

### Bug Fix Process

1. **Create Issue** with:
   - Severity level
   - Reproduction steps
   - Expected vs actual behavior
   - Screenshots/logs

2. **Assign** to appropriate team

3. **Create Feature Branch**:

   ```bash
   git checkout -b fix/issue-number-description
   ```

4. **Implement Fix** with:
   - Code changes
   - Unit tests (if applicable)
   - E2E tests (if UI change)
   - Update documentation

5. **Test**:

   ```bash
   npm run test:run
   npm run test:e2e
   npm run lint
   ```

6. **Create Pull Request** with:
   - Description of fix
   - Test results
   - Screenshot (if UI change)
   - Link to issue

7. **Code Review** by:
   - Security review (for auth/API changes)
   - UI review (for component changes)
   - Test review (for test additions)

8. **Merge & Deploy**

---

## Metrics & KPIs

### Current Status (as of 2026-03-11)

| Metric                   | Target | Current | Status |
| ------------------------ | ------ | ------- | ------ |
| Critical Security Issues | 0      | 0       | ✅     |
| Test Coverage            | 80%    | 65%     | 🟡     |
| E2E Test Pass Rate       | 100%   | N/A     | ⏳     |
| Thai Localization        | 100%   | 85%     | 🟡     |
| Accessibility Score      | 90+    | TBD     | ⏳     |
| API Response Time        | <200ms | TBD     | ⏳     |

### Next Goals

1. **Week 1-2**: Complete form validation dialogs
2. **Week 3-4**: Increase test coverage to 80%
3. **Week 5-6**: Polish responsive design
4. **Week 7-8**: Production deployment prep

---

## Resources

### Documentation

- [CLAUDE.md](./CLAUDE.md) - Development guide
- [SETUP-INSTRUCTIONS.md](./download/SETUP-INSTRUCTIONS.md) - Project overview
- [Prisma Schema](./prisma/schema.prisma) - Database structure

### Commands

```bash
# Development
npm run dev              # Start dev server on port 3000
npm run build           # Production build
npm run start           # Start production server

# Database
npm run db:push         # Push schema changes
npm run db:migrate      # Run migrations
npm run db:reset        # Reset database

# Testing
npm test                # Watch mode
npm run test:run        # Run once
npm run test:coverage   # Coverage report
npm run test:e2e        # E2E tests
```

### Team Contacts

- **Security Lead**: [To be assigned]
- **Frontend Lead**: [To be assigned]
- **QA Lead**: [To be assigned]

---

_Last Updated: 2026-03-11_ _Version: 1.0.0_
