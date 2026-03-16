# Thai Accounting ERP - API Documentation

## Overview

This document provides comprehensive API documentation for the Thai Accounting ERP system.

## Authentication

All API endpoints (except auth endpoints) require authentication via NextAuth session cookie.

### Session Cookie
```
Cookie: next-auth.session-token={token}
```

### Response Format

All API responses follow a standard format:

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message in Thai"
}
```

**With Pagination:**
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## Error Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 400 | Bad Request | Invalid input data or business logic violation |
| 401 | Unauthorized | Not authenticated or invalid session |
| 403 | Forbidden | Authenticated but insufficient permissions |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Resource state conflict (e.g., already posted) |
| 500 | Server Error | Internal server error |

## Role-Based Access

| Role | Permissions |
|------|-------------|
| ADMIN | Full access to all endpoints |
| ACCOUNTANT | Full access to accounting modules |
| USER | Create/view only, no settings access |
| VIEWER | Read-only access to all modules |

## Rate Limiting

- Authentication endpoints: 5 requests per 15 minutes
- API endpoints: 60 requests per minute
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`

---

## Accounts API

### List Accounts
```
GET /api/accounts
```
**Roles:** All authenticated users

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "acc_001",
      "code": "1101",
      "name": "ลูกหนี้การค้า",
      "nameEn": "Accounts Receivable",
      "type": "ASSET",
      "balance": 150000
    }
  ]
}
```

### Create Account
```
POST /api/accounts
```
**Roles:** ADMIN, ACCOUNTANT

**Request:**
```json
{
  "code": "1102",
  "name": "ลูกหนี้การค้า - ลูกค้ารายย่อย",
  "type": "ASSET",
  "parentId": "acc_001"
}
```

### Update Account
```
PUT /api/accounts/:id
```
**Roles:** ADMIN, ACCOUNTANT

### Delete Account
```
DELETE /api/accounts/:id
```
**Roles:** ADMIN only

---

## Invoices API

### List Invoices
```
GET /api/invoices?page=1&limit=20&status=DRAFT&customerId=xxx
```
**Roles:** All authenticated users

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `status`: Filter by status (DRAFT, ISSUED, PARTIAL, PAID, CANCELLED)
- `customerId`: Filter by customer

### Create Invoice
```
POST /api/invoices
```
**Roles:** ACCOUNTANT, ADMIN, USER

**Request:**
```json
{
  "customerId": "cust_001",
  "invoiceDate": "2024-03-15",
  "dueDate": "2024-04-15",
  "lines": [
    {
      "productId": "prod_001",
      "description": "สินค้า A",
      "quantity": 10,
      "unitPrice": 1000,
      "vatRate": 7
    }
  ]
}
```

### Get Invoice
```
GET /api/invoices/:id
```
**Roles:** All authenticated users (owner or ADMIN only)

### Update Invoice
```
PUT /api/invoices/:id
```
**Roles:** ACCOUNTANT, ADMIN (draft only)

### Delete/Cancel Invoice
```
DELETE /api/invoices/:id
```
**Roles:** ACCOUNTANT, ADMIN (draft only)

### Issue Invoice
```
POST /api/invoices/:id/issue
```
**Roles:** ACCOUNTANT, ADMIN

Creates journal entries and marks invoice as ISSUED.

### Void Invoice
```
POST /api/invoices/:id/void
```
**Roles:** ACCOUNTANT, ADMIN

Creates reversing journal entries.

---

## Receipts API

### List Receipts
```
GET /api/receipts
```
**Roles:** All authenticated users

### Create Receipt
```
POST /api/receipts
```
**Roles:** ACCOUNTANT, ADMIN

**Request:**
```json
{
  "customerId": "cust_001",
  "receiptDate": "2024-03-15",
  "paymentMethod": "CASH",
  "amount": 10000,
  "allocations": [
    {
      "invoiceId": "inv_001",
      "amount": 10000,
      "whtAmount": 0
    }
  ]
}
```

### Post Receipt
```
POST /api/receipts/:id/post
```
**Roles:** ACCOUNTANT, ADMIN

Creates journal entry and updates invoice paid amounts.

---

## Payments API

### List Payments
```
GET /api/payments
```
**Roles:** All authenticated users

### Create Payment
```
POST /api/payments
```
**Roles:** ACCOUNTANT, ADMIN

**Request:**
```json
{
  "vendorId": "vend_001",
  "paymentDate": "2024-03-15",
  "paymentMethod": "BANK_TRANSFER",
  "bankAccountId": "bank_001",
  "amount": 50000,
  "allocations": [
    {
      "invoiceId": "pur_001",
      "amount": 50000
    }
  ]
}
```

### Post Payment
```
POST /api/payments/:id/post
```
**Roles:** ACCOUNTANT, ADMIN

---

## Credit Notes API

### List Credit Notes
```
GET /api/credit-notes
```
**Roles:** All authenticated users

### Create Credit Note
```
POST /api/credit-notes
```
**Roles:** ACCOUNTANT, ADMIN

**Request:**
```json
{
  "customerId": "cust_001",
  "creditNoteDate": "2024-03-15",
  "invoiceId": "inv_001",
  "reason": "RETURN",
  "lines": [
    {
      "productId": "prod_001",
      "description": "คืนสินค้า A",
      "quantity": 2,
      "unitPrice": 1000
    }
  ]
}
```

---

## Debit Notes API

### List Debit Notes
```
GET /api/debit-notes
```
**Roles:** All authenticated users

### Create Debit Note
```
POST /api/debit-notes
```
**Roles:** ACCOUNTANT, ADMIN

---

## Journal Entries API

### List Journal Entries
```
GET /api/journal?page=1&limit=20
```
**Roles:** ACCOUNTANT, ADMIN

### Create Journal Entry
```
POST /api/journal
```
**Roles:** ACCOUNTANT, ADMIN

**Request:**
```json
{
  "date": "2024-03-15",
  "description": "ปรับปรุงบัญชี",
  "reference": "ADJ-001",
  "lines": [
    {
      "accountId": "acc_001",
      "description": "โอนเงิน",
      "debit": 10000,
      "credit": 0
    },
    {
      "accountId": "acc_002",
      "description": "โอนเงิน",
      "debit": 0,
      "credit": 10000
    }
  ]
}
```

### Post Journal Entry
```
POST /api/journal/:id/post
```
**Roles:** ACCOUNTANT, ADMIN

---

## Customers API

### List Customers
```
GET /api/customers
```
**Roles:** All authenticated users

### Create Customer
```
POST /api/customers
```
**Roles:** ACCOUNTANT, ADMIN, USER

**Request:**
```json
{
  "code": "CUST-001",
  "name": "บริษัท ตัวอย่าง จำกัด",
  "taxId": "1234567890123",
  "address": "123 ถนนสุขุมวิท",
  "phone": "02-123-4567",
  "email": "contact@example.com",
  "creditLimit": 100000
}
```

---

## Vendors API

### List Vendors
```
GET /api/vendors
```
**Roles:** All authenticated users

### Create Vendor
```
POST /api/vendors
```
**Roles:** ACCOUNTANT, ADMIN, USER

---

## Products API

### List Products
```
GET /api/products
```
**Roles:** All authenticated users

### Create Product
```
POST /api/products
```
**Roles:** ACCOUNTANT, ADMIN

**Request:**
```json
{
  "code": "PROD-001",
  "name": "สินค้าตัวอย่าง",
  "description": "รายละเอียดสินค้า",
  "unit": "ชิ้น",
  "salePrice": 100000,
  "cost": 80000,
  "vatRate": 7
}
```

---

## Reports API

### General Ledger Report
```
GET /api/reports/general-ledger?startDate=2024-01-01&endDate=2024-03-31&accountId=xxx
```

### Balance Sheet
```
GET /api/reports/balance-sheet?asOf=2024-03-31
```

### Income Statement
```
GET /api/reports/income-statement?startDate=2024-01-01&endDate=2024-03-31
```

### Trial Balance
```
GET /api/reports/trial-balance?asOf=2024-03-31
```

### VAT Report
```
GET /api/reports/vat?month=3&year=2024
```

---

## Settings API

### Get Settings
```
GET /api/settings
```
**Roles:** All authenticated users

### Update Settings
```
PUT /api/settings
```
**Roles:** ADMIN only

**Request:**
```json
{
  "companyName": "บริษัท ตัวอย่าง จำกัด",
  "taxId": "1234567890123",
  "vatRate": 7,
  "address": "123 ถนนสุขุมวิท กรุงเทพฯ 10110",
  "phone": "02-123-4567"
}
```

---

## Status Codes Reference

### Invoice Status
- `DRAFT` - ฉบับร่าง
- `ISSUED` - ออกแล้ว
- `PARTIAL` - ชำระบางส่วน
- `PAID` - ชำระแล้ว
- `CANCELLED` - ยกเลิก

### Receipt/Payment Status
- `DRAFT` - ฉบับร่าง
- `POSTED` - โพสต์แล้ว
- `CANCELLED` - ยกเลิก

### Journal Entry Status
- `DRAFT` - ฉบับร่าง
- `POSTED` - โพสต์แล้ว
- `REVERSED` - ยกเลิก

---

## Contact & Support

For API support, contact the development team.

**Last Updated:** March 16, 2024
**Version:** 1.0.0
