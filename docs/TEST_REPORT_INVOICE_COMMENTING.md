# Invoice Commenting Integration Test Report

**Date**: March 18, 2026 **Tester**: Playwright Automation Testing Specialist
**Application**: Thai Accounting ERP System **URL**: http://localhost:3000/
**Test File**: `/Users/tong/Thai-acc/e2e/invoice-commenting-integration.spec.ts`

---

## Executive Summary

**CRITICAL ISSUE FOUND**: The application has a severe runtime error that
prevents all functionality from working. The PrismaClient is being bundled for
the browser environment, which causes a fatal error on page load.

**Overall Test Status**: FAILED - Cannot proceed with feature testing due to
critical application error

---

## Critical Error Found

### Error Description

```
PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in ``).
```

### Screenshot

![Critical Error](test-results/01-login-complete-Phase-1--0e17e-and-verify-dashboard-access-ci-headless/test-failed-1.png)

The error appears as a red error dialog with the title "เกิดข้อผิดพลาด" (Error
Occurred) and prevents the login form from rendering.

### Impact

- **Severity**: CRITICAL
- **Affected Areas**: Entire application - users cannot log in or use any
  features
- **User Experience**: Complete application failure - white screen with error
  dialog

### Root Cause Analysis

The PrismaClient is being imported somewhere in the client-side code bundle.
PrismaClient is a server-side-only library and cannot run in the browser.
Possible causes:

1. **Accidental import in client component**: A 'use client' component may be
   importing from `@/lib/db` or `@/lib/db-helpers`
2. **Tree-shaking issue**: The bundler may be including server-only code in the
   client bundle
3. **Dynamic import failure**: A dynamic import may be resolving to server code
   in the client context

### Files Potentially Causing the Issue

Based on code analysis, these files import PrismaClient:

- `/src/lib/db.ts` - Main database client (server-only)
- `/src/lib/db-helpers.ts` - Database helper functions (server-only)
- `/src/lib/db-optimizer.ts` - Query optimizer (server-only)
- `/src/lib/db/connection-pool.ts` - Connection pooling (server-only)

**None of these should be imported in client components ('use client').**

---

## Test Results Summary

### Tests Attempted

| Test Suite                    | Tests  | Passed | Failed | Status     |
| ----------------------------- | ------ | ------ | ------ | ---------- |
| Authentication Testing        | 4      | 0      | 4      | FAILED     |
| Invoice List - Comment Badges | 3      | 0      | 3      | FAILED     |
| Invoice Edit Dialog - Tabs    | 3      | 0      | 3      | FAILED     |
| Comment Operations            | 4      | 0      | 4      | FAILED     |
| UI/UX Verification            | 5      | 0      | 5      | FAILED     |
| Error Handling                | 2      | 0      | 2      | FAILED     |
| Console Error Monitoring      | 1      | 0      | 1      | FAILED     |
| **TOTAL**                     | **22** | **0**  | **22** | **FAILED** |

### Error Pattern

All 22 tests failed with the same root cause:

```
Error: expect(locator).toBeVisible() failed
Locator: locator('input[type="email"]')
Expected: visible
Timeout: 20000ms
Error: element(s) not found
```

The login form input field could not be found because the PrismaClient error
prevents the page from rendering properly.

---

## Screenshots Captured

### 1. Login Page Error

**File**:
`test-results/01-login-complete-Phase-1--0e17e-and-verify-dashboard-access-ci-headless/test-failed-1.png`

**Description**: Shows the critical PrismaClient error dialog. The page
displays:

- Error title: "เกิดข้อผิดพลาด" (Error Occurred)
- Error message about PrismaClient not being able to run in browser
- Subtitle: "ระบบพบข้อผิดพลาดในการแสดงผล กรุณาลองใหม่อีกครั้ง" (System
  encountered a display error. Please try again.)
- A pink "โหลดหน้าใหม่" (Reload Page) button
- Next.js dev tools indicator showing "1 Issue"

---

## Features That Could Not Be Tested

Due to the critical error, the following features could not be verified:

### 1. Authentication

- [ ] Login with valid credentials
- [ ] Error handling for invalid credentials
- [ ] Session persistence across reloads
- [ ] Auth consistency (no intermittent failures)

### 2. Invoice List with Comment Badges

- [ ] Comment column in invoice table
- [ ] Comment badges showing count
- [ ] Empty state for invoices without comments

### 3. Invoice Edit Dialog

- [ ] Tab layout (Details + Comments)
- [ ] Tab switching functionality
- [ ] Comment count badge on tab

### 4. Comment Operations

- [ ] Add a test comment
- [ ] Reply to a comment
- [ ] Resolve/unresolve a comment
- [ ] Comment count updates

### 5. UI/UX Verification

- [ ] Login page styling
- [ ] Invoice list layout
- [ ] Edit dialog layout
- [ ] No infinite spinner
- [ ] Comments section styling

---

## Code Review Findings

### Invoice Commenting Implementation Status

Based on code analysis (files exist but could not be tested):

#### 1. Database Schema (COMPLETE)

- `InvoiceComment` model with threading, mentions, attachments, resolved status
- `InvoiceLineItemAudit` model for change tracking
- `RelatedDocument` model for document relationships
- `CommentNotification` model for user notifications

#### 2. API Endpoints (CREATED)

- `/api/invoices/[id]/comments` - List and create comments
- `/api/invoices/[id]/comments/[commentId]` - Update/delete/resolve comments
- `/api/invoices/[id]/lines/[lineId]` - Edit line items with audit
- `/api/invoices/[id]/audit` - Fetch audit log
- `/api/invoices/[id]/related` - Related documents

#### 3. Frontend Components (CREATED)

- `CommentSection` - Main comment section component
- `CommentInput` - Input with @mentions and attachments
- `CommentThread` - Nested comment display
- `LineItemEditor` - Inline line item editing
- `AuditLog` - Timeline-style audit display
- `RelatedDocuments` - Document relationship management

#### 4. Integration Points (PARTIAL)

- ✅ `InvoiceEditDialog` has tabs for Details and Comments
- ✅ `InvoiceList` has comment column with badges
- ❌ Could not verify actual functionality due to application error

---

## Recommendations

### Immediate Actions Required

1. **FIX PRISMA CLIENT BUNDLE ISSUE** (CRITICAL)
   - Investigate which client component is importing server-only code
   - Check for accidental imports of `@/lib/db` in 'use client' files
   - Add proper server/client separation
   - Consider using Next.js 13+ server components for database operations

2. **Verify Build Configuration**
   - Check webpack/turbopack configuration for proper externals
   - Ensure PrismaClient is marked as server-only
   - Review tree-shaking settings

3. **Add Runtime Checks**
   - Add environment detection to db.ts to prevent browser execution
   - Example:
   ```typescript
   if (typeof window !== 'undefined') {
     throw new Error('PrismaClient cannot be used in browser');
   }
   ```

### Testing Recommendations

Once the critical error is fixed:

1. **Re-run the complete test suite** at
   `/Users/tong/Thai-acc/e2e/invoice-commenting-integration.spec.ts`
2. **Verify all 22 tests pass** before deploying
3. **Add the test file to CI/CD pipeline** for regression testing
4. **Test on multiple browsers** (Chrome, Firefox, Safari)

### Code Quality Recommendations

1. **Add linting rules** to prevent server-only imports in client components
2. **Use TypeScript path mapping** to clearly separate server/client utilities
3. **Add integration tests** for the commenting feature
4. **Document the server/client boundaries** clearly in the codebase

---

## Test Script Details

**Test File Location**:
`/Users/tong/Thai-acc/e2e/invoice-commenting-integration.spec.ts`

**Test Credentials Used**:

- Email: `admin@thaiaccounting.com`
- Password: `admin123`

**Test Configuration**:

- Browser: Chromium (headless)
- Viewport: 1920x1080
- Timeout: 60 seconds per test
- Navigation timeout: 60 seconds

**Expected Screenshots** (would be generated after fix):

1. `01-login-success.png` - Dashboard after successful login
2. `02-login-error.png` - Error message for invalid credentials
3. `03-invoice-list.png` - Invoice list page
4. `04-comment-badges.png` - Comment badges in invoice list
5. `05-edit-dialog-tabs.png` - Edit dialog showing tabs
6. `06-comments-tab.png` - Comments tab active
7. `07-comment-tab-badge.png` - Comment count on tab
8. `08-comment-added.png` - After adding a comment
9. `09-comment-reply.png` - Reply to a comment
10. `10-comment-resolved.png` - Resolved comment state
11. `11-comment-unresolved.png` - Unresolved comment state
12. `12-comment-count-updated.png` - Updated badge count
13. `13-login-page-ui.png` - Login page styling
14. `14-invoice-list-layout.png` - Invoice list layout
15. `15-edit-dialog-layout.png` - Edit dialog layout
16. `16-no-spinner.png` - No loading spinner
17. `17-comments-section-ui.png` - Comments section styling
18. `18-network-error.png` - Network error handling
19. `19-unauthorized.png` - Unauthorized access handling
20. `20-console-check.png` - Console error check

---

## Conclusion

The Thai Accounting ERP System **cannot be tested** in its current state due to
a critical runtime error where PrismaClient is being bundled for the browser
environment. This is a fundamental application architecture issue that must be
resolved before any feature testing can proceed.

The invoice commenting feature appears to be fully implemented based on code
review (database schema, API endpoints, React components, and UI integration),
but its functionality cannot be verified until the PrismaClient bundle issue is
fixed.

**Priority**: Fix the PrismaClient browser bundle issue immediately before
proceeding with any further testing or deployment.

---

## Appendix: File Locations

### Test Files

- Test Script: `/Users/tong/Thai-acc/e2e/invoice-commenting-integration.spec.ts`
- Test Results: `/Users/tong/Thai-acc/test-results/`
- Screenshots: `/Users/tong/Thai-acc/test-results/screenshots/`

### Application Files (Invoice Commenting)

- Comment Section: `/src/components/invoices/comment-section.tsx`
- Comment Input: `/src/components/ui/comment-input.tsx`
- Comment Thread: `/src/components/ui/comment-thread.tsx`
- Invoice Edit Dialog: `/src/components/invoices/invoice-edit-dialog.tsx`
- Invoice List: `/src/components/invoices/invoice-list.tsx`

### Database Schema

- Prisma Schema: `/prisma/schema.prisma`

### API Routes

- Comments API: `/src/app/api/invoices/[id]/comments/route.ts`
- Individual Comment: `/src/app/api/invoices/[id]/comments/[commentId]/route.ts`
- Line Items: `/src/app/api/invoices/[id]/lines/[lineId]/route.ts`
- Audit Log: `/src/app/api/invoices/[id]/audit/route.ts`
- Related Documents: `/src/app/api/invoices/[id]/related/route.ts`

---

_Report generated by Playwright Automation Testing on March 18, 2026_
