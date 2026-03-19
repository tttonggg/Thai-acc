# 🔧 CRITICAL FIXES IMPLEMENTATION PLAN

**Date**: 2025-03-14
**Status**: IN PROGRESS
**Priority**: CRITICAL

---

## 📋 EXECUTIVE CHECKLIST

### Phase 1: CRITICAL FIXES (Complete within 24 hours)
- [ ] 1.1 Fix Document Number Generation Race Condition
- [ ] 1.2 Add Transaction Boundaries to GL Posting
- [ ] 1.3 Add Missing Authorization Checks
- [ ] 1.4 Implement Idempotency Keys
- [ ] 1.5 Add Pagination to All List Endpoints

### Phase 2: DATABASE UPDATES (Complete within 24 hours)
- [ ] 2.1 Add Idempotency Keys to Schema
- [ ] 2.2 Create Database Migration
- [ ] 2.3 Add Status Transition Constraints
- [ ] 2.4 Update Seed Data

### Phase 3: TESTING & VALIDATION (Complete within 48 hours)
- [ ] 3.1 Add Authorization Tests
- [ ] 3.2 Add Transaction Rollback Tests
- [ ] 3.3 Add Idempotency Tests
- [ ] 3.4 Add Pagination Tests
- [ ] 3.5 Run Full E2E Test Suite

### Phase 4: QUALITY IMPROVEMENTS (Complete within 1 week)
- [ ] 4.1 Standardize Error Messages
- [ ] 4.2 Add Confirmation Dialogs
- [ ] 4.3 Improve Loading States
- [ ] 4.4 Add Audit Logging

---

## 🎯 DETAILED TASK BREAKDOWN

### TASK 1.1: Fix Document Number Generation Race Condition

**File**: `src/lib/api-utils.ts`
**Lines**: 64-95
**Complexity**: Medium
**Time Estimate**: 30 minutes

**Steps**:
1. ✅ Read current implementation
2. ✅ Wrap `generateDocNumber()` in transaction
3. ✅ Use `SELECT FOR UPDATE` pattern
4. ✅ Add timeout configuration
5. ✅ Test with concurrent requests

**Acceptance Criteria**:
- [ ] 100 concurrent requests create 100 unique document numbers
- [ ] No duplicate numbers in stress test
- [ ] Transaction fails gracefully after timeout

**Files to Modify**:
- `src/lib/api-utils.ts`

---

### TASK 1.2: Add Transaction Boundaries to GL Posting

**Files**:
- `src/app/api/receipts/[id]/post/route.ts`
- `src/app/api/payments/[id]/post/route.ts`
- `src/app/api/invoices/[id]/post/route.ts`
- `src/app/api/cheques/[id]/clear/route.ts`

**Complexity**: High
**Time Estimate**: 2 hours

**Steps**:
1. ✅ Identify all GL posting endpoints
2. ✅ Wrap multi-step operations in `$transaction`
3. ✅ Add error handling for transaction failures
4. ✅ Test transaction rollback on errors
5. ✅ Verify data consistency after failures

**Acceptance Criteria**:
- [ ] All operations in GL posting are atomic
- [ ] Failed transactions leave no partial data
- [ ] Database remains consistent after errors
- [ ] Transactions complete within 10 second timeout

**Files to Modify**:
- `src/app/api/receipts/[id]/post/route.ts`
- `src/app/api/payments/[id]/post/route.ts`
- `src/app/api/invoices/[id]/post/route.ts`
- `src/app/api/cheques/[id]/clear/route.ts`

---

### TASK 1.3: Add Missing Authorization Checks

**Files**: Multiple API routes
**Complexity**: Medium
**Time Estimate**: 1 hour

**Steps**:
1. ✅ Audit all API routes for missing auth checks
2. ✅ Add `requireRole()` checks to sensitive endpoints
3. ✅ Add role checks to DELETE operations
4. ✅ Add role checks to POST operations
5. ✅ Test with different user roles

**Affected Endpoints**:
- `DELETE /api/invoices/[id]` - Require ADMIN/ACCOUNTANT
- `POST /api/journal/post` - Require ACCOUNTANT+
- `POST /api/receipts/[id]/post` - Require ACCOUNTANT+
- `POST /api/payments/[id]/post` - Require ACCOUNTANT+
- `POST /api/cheques/[id]/clear` - Require ACCOUNTANT+

**Acceptance Criteria**:
- [ ] VIEWER role cannot perform financial operations
- [ ] USER role cannot post journal entries
- [ ] ACCOUNTANT can post but not delete
- [ ] ADMIN can perform all operations

---

### TASK 1.4: Implement Idempotency Keys

**Files**: Multiple API routes + Schema
**Complexity**: High
**Time Estimate**: 2 hours

**Steps**:
1. ✅ Update Prisma schema with idempotency columns
2. ✅ Create database migration
3. ✅ Add idempotency middleware
4. ✅ Update API routes to check idempotency
5. ✅ Add idempotency tests

**Acceptance Criteria**:
- [ ] Duplicate requests with same key return same result
- [ ] Idempotency keys are stored in database
- [ ] Keys have unique constraint
- [ ] Expired keys are cleaned up

**Files to Modify**:
- `prisma/schema.prisma`
- `src/middleware/idempotency.ts`
- `src/app/api/receipts/route.ts`
- `src/app/api/payments/route.ts`
- `src/app/api/journal/post/route.ts`

---

### TASK 1.5: Add Pagination to All List Endpoints

**Files**: Multiple API routes
**Complexity**: Low
**Time Estimate**: 1 hour

**Affected Endpoints**:
- `GET /api/invoices`
- `GET /api/receipts`
- `GET /api/payments`
- `GET /api/purchases`
- `GET /api/customers`
- `GET /api/vendors`
- `GET /api/products`
- `GET /api/chart-of-accounts`

**Steps**:
1. ✅ Add pagination query parameters (page, limit)
2. ✅ Implement skip/take logic
3. ✅ Return total count and pagination metadata
4. ✅ Add max limit of 100 items per page
5. ✅ Update UI components to handle pagination

**Acceptance Criteria**:
- [ ] All list endpoints support pagination
- [ ] Maximum 100 items per page
- [ ] Pagination metadata includes total and totalPages
- [ ] Default limit is 50 items

---

## 🗂️ FILE MODIFICATION TRACKER

### Modified Files:
1. `src/lib/api-utils.ts` - Document number generation
2. `src/app/api/receipts/[id]/post/route.ts` - Transaction wrapper
3. `src/app/api/payments/[id]/post/route.ts` - Transaction wrapper
4. `src/app/api/invoices/[id]/route.ts` - Authorization check
5. `src/app/api/invoices/route.ts` - Pagination
6. `src/middleware/idempotency.ts` - New file
7. `prisma/schema.prisma` - Idempotency columns

### New Files:
1. `src/lib/constants/error-messages.ts` - Error message constants
2. `src/middleware/idempotency.ts` - Idempotency middleware
3. `tests/unit/idempotency.test.ts` - Idempotency tests

---

## ✅ VERIFICATION CHECKLIST

### Pre-Deployment:
- [ ] All critical bugs are fixed
- [ ] All tests pass (unit + E2E)
- [ ] Manual testing completed
- [ ] Code review completed
- [ ] Database migration tested

### Post-Deployment:
- [ ] Monitor for duplicate document numbers
- [ ] Check transaction logs for errors
- [ ] Verify pagination performance
- [ ] Confirm authorization working
- [ ] Test idempotency in production

---

## 📊 PROGRESS TRACKING

**Overall Progress**: 0/58 issues fixed (0%)

### Critical Issues: 0/8 fixed (0%)
- [ ] Bug #1: Document Number Generation
- [ ] Bug #2: Transaction Boundaries
- [ ] Bug #3: Authorization Checks
- [ ] Bug #4: Idempotency Keys
- [ ] Bug #5: Pagination
- [ ] Bug #6: Loading States
- [ ] Bug #7: Error Messages
- [ ] Bug #8: Confirmation Dialogs

### High Priority: 0/15 fixed (0%)
### Medium Priority: 0/23 fixed (0%)
### Low Priority: 0/12 fixed (0%)

---

## 🚨 RISK MITIGATION

### High Risk Operations:
1. **Database Schema Changes** - Backup before migration
2. **Transaction Logic** - Test thoroughly in development
3. **Authorization** - Verify with all user roles
4. **Idempotency** - Test with concurrent requests

### Rollback Plan:
1. Keep backup of original files
2. Create database backup before migration
3. Test rollback procedure
4. Have hotfix ready for immediate issues

---

**Last Updated**: 2025-03-14
**Next Review**: After Task 1.1 completion
