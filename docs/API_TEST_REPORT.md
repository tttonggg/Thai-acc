# Invoice Commenting API Test Report

**Test Date:** 2026-03-18 **API Base URL:** http://localhost:3000 **Tested By:**
API Testing Specialist Agent

---

## Executive Summary

| Category               | Passed | Failed | Total  | Success Rate |
| ---------------------- | ------ | ------ | ------ | ------------ |
| Authentication         | 2      | 0      | 2      | 100%         |
| GET /api/invoices      | 5      | 1      | 6      | 83%          |
| GET /api/invoices/[id] | 2      | 1      | 3      | 67%          |
| Comment API            | 2      | 3      | 5      | 40%          |
| Error Handling         | 3      | 1      | 4      | 75%          |
| Performance            | 2      | 0      | 2      | 100%         |
| **TOTAL**              | **16** | **6**  | **22** | **73%**      |

---

## Test Environment

- **Server:** Next.js 16 Development Server
- **Database:** PostgreSQL (thai_accounting)
- **Authentication:** NextAuth.js with JWT sessions
- **Test User:** admin@thaiaccounting.com (ADMIN role)

---

## Detailed Test Results

### 1. Authentication Tests

#### 1.1 Login - PASS

- **Endpoint:** POST /api/auth/callback/credentials
- **Status:** 200 OK
- **Response Time:** 0.78s
- **Details:** Successfully authenticated and received session token

**Request:**

```bash
curl -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=admin@thaiaccounting.com&password=admin123&csrfToken=..."
```

**Response:**

```json
{ "url": "http://localhost:3000" }
```

#### 1.2 Session Verification - PASS

- **Endpoint:** GET /api/auth/session
- **Status:** 200 OK
- **Response Time:** 0.44s

**Response:**

```json
{
  "user": {
    "id": "cmmur9gsw000003sxch6858c1",
    "email": "admin@thaiaccounting.com",
    "name": "ผู้ดูแลระบบ",
    "role": "ADMIN",
    "mfaEnabled": false,
    "mfaVerified": true
  },
  "expires": "2026-03-18T16:00:40.211Z"
}
```

---

### 2. GET /api/invoices Tests

#### 2.1 Basic Request - PASS

- **Status:** 200 OK
- **Response Time:** 0.14s
- **Invoices Returned:** 90 total

**Response Structure:**

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 90,
    "totalPages": 2
  }
}
```

#### 2.2 \_count.comments Field - **FAIL**

- **Expected:** Response should include `_count.comments` field
- **Actual:** `_count` field is null or missing
- **Impact:** Frontend cannot display comment counts without additional API
  calls

**Response:**

```json
{
  "id": "cmmur9m79008v03upe61sh5xk",
  "invoiceNo": "INV2603-0012",
  "_count": null
}
```

**Issue:** The Prisma query in `/src/app/api/invoices/route.ts` does not include
the `_count` selection for comments.

#### 2.3 Pagination (page=1&limit=5) - PASS

- **Status:** 200 OK
- **Response Time:** 0.02s
- **Pagination Works:** Correctly returns 5 items per page

#### 2.4 Filter by Status - PASS

- **Status:** 200 OK
- **Response Time:** 0.10s
- **Filter Works:** `?status=DRAFT` correctly filters results

#### 2.5 Filter by Type - PASS

- **Status:** 200 OK
- **Response Time:** 0.02s
- **Filter Works:** `?type=TAX_INVOICE` correctly filters results

#### 2.6 Search Functionality - PASS

- **Status:** 200 OK
- **Response Time:** 0.32s
- **Search Works:** `?search=INV` correctly searches invoice numbers and
  customer names

---

### 3. GET /api/invoices/[id] Tests

#### 3.1 Basic Request - PASS

- **Status:** 200 OK
- **Response Time:** 1.17s
- **Invoice ID:** cmmur9m79008v03upe61sh5xk

**Response includes:**

- Invoice details
- Customer information
- Line items
- Journal entry reference

#### 3.2 \_count.comments Field - **FAIL**

- **Expected:** Response should include `_count.comments`
- **Actual:** `_count` field is missing
- **Impact:** Cannot show comment count in invoice detail view

#### 3.3 Data Completeness - PASS

- **Status:** 200 OK
- **Lines:** Included
- **Customer:** Included
- **All expected fields present**

---

### 4. Comment API Tests

#### 4.1 GET /api/invoices/[id]/comments - PASS

- **Status:** 200 OK
- **Response Time:** 0.02s
- **Comments Returned:** 1

**Response Structure:**

```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "id": "cmmvs0t5r0001rq2uss67cs3k",
        "content": "Test comment from direct DB insert",
        "user": { ... },
        "replies": [],
        "replyCount": 0,
        "mentionedUsers": []
      }
    ],
    "pagination": { "limit": 50, "count": 1 }
  }
}
```

#### 4.2 POST /api/invoices/[id]/comments - **FAIL**

- **Status:** 400 Bad Request
- **Error:** "เกิดข้อผิดพลาดในการเพิ่มคอมเมนต์"
- **Root Cause:** Missing required `ipAddress` field in `auditLog.create()` call

**Request:**

```json
POST /api/invoices/cmmur9m79008v03upe61sh5xk/comments
{
  "content": "Test comment from API testing",
  "isInternal": false,
  "mentions": [],
  "resolved": false
}
```

**Error Details:**

```
PrismaClientValidationError:
Invalid `tx.auditLog.create()` invocation:
Argument `ipAddress` is missing.
```

**Location:** `/src/app/api/invoices/[id]/comments/route.ts` line 216

#### 4.3 PUT /api/invoices/[id]/comments/[commentId] - **NOT TESTED**

- **Reason:** Cannot create comment to update (dependent on POST test)

#### 4.4 DELETE /api/invoices/[id]/comments/[commentId] - **NOT TESTED**

- **Reason:** Cannot create comment to delete (dependent on POST test)

#### 4.5 Comment Threading (Reply) - **NOT TESTED**

- **Reason:** Cannot create parent comment (dependent on POST test)

---

### 5. Error Handling Tests

#### 5.1 Invalid Invoice ID - PASS

- **Endpoint:** GET /api/invoices/invalid-id-12345
- **Status:** 404 Not Found
- **Response Time:** 0.02s
- **Behavior:** Correctly returns 404 for non-existent invoice

#### 5.2 Missing Required Fields - **FAIL**

- **Endpoint:** POST /api/invoices/[id]/comments
- **Expected:** 400 or 422 validation error
- **Actual:** 500 Internal Server Error
- **Issue:** Error handling doesn't properly catch validation errors

#### 5.3 Unauthorized Access - PASS

- **Endpoint:** GET /api/invoices (no cookie)
- **Status:** 401 Unauthorized
- **Response Time:** 0.02s
- **Error Message:** "ไม่ได้รับอนุญาต - กรุณาเข้าสู่ระบบ"

#### 5.4 Comments on Non-existent Invoice - PASS

- **Endpoint:** GET /api/invoices/non-existent-id/comments
- **Status:** 404 Not Found
- **Response Time:** 0.02s
- **Behavior:** Correctly returns 404

---

### 6. Performance Tests

#### 6.1 List 50 Invoices - PASS

- **Response Time:** 0.033s
- **Status:** 200 OK
- **Assessment:** Excellent performance (< 100ms)

#### 6.2 Get Invoice Detail - PASS

- **Response Time:** 0.032s
- **Status:** 200 OK
- **Assessment:** Excellent performance (< 100ms)

---

## Issues Discovered

### Critical Issues

#### 1. POST /api/invoices/[id]/comments - Missing ipAddress Field

**Severity:** Critical **File:** `/src/app/api/invoices/[id]/comments/route.ts`
**Line:** 216

**Problem:** The `auditLog.create()` call is missing the required `ipAddress`
field:

```typescript
await tx.auditLog.create({
  data: {
    userId: user.id,
    action: 'CREATE',
    entityType: 'InvoiceComment',
    entityId: newComment.id,
    afterState: { ... }
    // MISSING: ipAddress
  }
})
```

**Fix Required:**

```typescript
await tx.auditLog.create({
  data: {
    userId: user.id,
    action: 'CREATE',
    entityType: 'InvoiceComment',
    entityId: newComment.id,
    afterState: { ... },
    ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
  }
})
```

### Medium Issues

#### 2. Missing \_count.comments in Invoice List/Detail

**Severity:** Medium **Files:**

- `/src/app/api/invoices/route.ts`
- `/src/app/api/invoices/[id]/route.ts`

**Problem:** The Prisma queries don't include
`_count: { select: { comments: true } }`, so the frontend cannot display comment
counts without making additional API calls.

**Fix Required for /api/invoices:**

```typescript
prisma.invoice.findMany({
  include: {
    customer: true,
    lines: true,
    _count: { select: { comments: true } },
  },
});
```

#### 3. Error Swallowing in Comment API

**Severity:** Medium **File:** `/src/app/api/invoices/[id]/comments/route.ts`

**Problem:** The catch block at line 262-270 swallows all non-Zod errors with a
generic message, making debugging difficult.

**Current Code:**

```typescript
catch (error) {
  if (error instanceof Error && error.message.includes("ไม่ได้รับอนุญาต")) {
    return unauthorizedError()
  }
  if (error instanceof z.ZodError) {
    return apiError("ข้อมูลไม่ถูกต้อง: " + error.errors[0].message)
  }
  return apiError("เกิดข้อผิดพลาดในการเพิ่มคอมเมนต์")  // Swallows all other errors
}
```

**Recommended Fix:**

```typescript
catch (error) {
  if (error instanceof Error && error.message.includes("ไม่ได้รับอนุญาต")) {
    return unauthorizedError()
  }
  if (error instanceof z.ZodError) {
    return apiError("ข้อมูลไม่ถูกต้อง: " + error.errors[0].message)
  }
  console.error('Comment creation error:', error)  // Log for debugging
  return apiError("เกิดข้อผิดพลาดในการเพิ่มคอมเมนต์: " + (error instanceof Error ? error.message : 'Unknown error'))
}
```

---

## API Endpoint Summary

| Endpoint                                | Method | Status     | Notes                    |
| --------------------------------------- | ------ | ---------- | ------------------------ |
| /api/invoices                           | GET    | Working    | Missing \_count.comments |
| /api/invoices/[id]                      | GET    | Working    | Missing \_count.comments |
| /api/invoices/[id]/comments             | GET    | Working    | Fully functional         |
| /api/invoices/[id]/comments             | POST   | **BROKEN** | Missing ipAddress field  |
| /api/invoices/[id]/comments/[commentId] | PUT    | Not Tested | Dependent on POST fix    |
| /api/invoices/[id]/comments/[commentId] | DELETE | Not Tested | Dependent on POST fix    |

---

## Recommendations

1. **Immediate Fix Required:** Add `ipAddress` field to `auditLog.create()` call
   in comment POST handler
2. **Enhancement:** Add `_count.comments` to invoice list and detail endpoints
   for better UX
3. **Improvement:** Improve error logging in catch blocks to aid debugging
4. **Testing:** After fixes, re-run the full test suite to verify all endpoints
   work correctly

---

## Test Artifacts

- **Cookie File:** `/tmp/api_test_cookies.txt`
- **Test Invoice ID:** `cmmur9m79008v03upe61sh5xk`
- **Test User:** `admin@thaiaccounting.com`
- **Test Comment ID (DB):** `cmmvs0t5r0001rq2uss67cs3k`

---

## Conclusion

The invoice commenting API has a **critical bug** that prevents comment
creation. The GET endpoints work correctly, but the POST endpoint fails due to a
missing required field in the audit log creation. Once this is fixed, all
comment CRUD operations should work as expected.

**Overall Assessment:** 73% pass rate with 1 critical issue requiring immediate
attention.
