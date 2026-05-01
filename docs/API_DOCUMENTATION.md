# Thai Accounting ERP - Interactive API Documentation

## Overview

Welcome to the Thai Accounting ERP API documentation. This comprehensive guide
provides everything you need to integrate with our REST API, including
interactive examples, code snippets in multiple languages, and detailed
troubleshooting information.

**Base URL:** `http://localhost:3000/api` (Development)  
**Current Version:** 1.0.0  
**Last Updated:** March 16, 2026

---

## Quick Start

### Interactive API Explorer

Visit the interactive API documentation at: `/api/docs`

Features:

- 🔥 Live "Try It Now" functionality
- 📋 Copy-paste code examples
- 🔐 Built-in authentication tester
- 📊 Response visualization
- 🌐 Multi-language code samples

---

## Authentication

All API endpoints (except authentication endpoints) require authentication via
NextAuth session cookie.

### Authentication Methods

#### 1. Session Cookie (Browser)

```
Cookie: next-auth.session-token={token}
```

#### 2. API Token (Server-to-Server)

```
Authorization: Bearer {api_token}
X-API-Key: {your_api_key}
```

### Login Endpoint

```http
POST /api/auth/callback/credentials
Content-Type: application/json

{
  "email": "admin@thaiaccounting.com",
  "password": "admin123",
  "redirect": false
}
```

**Response:**

```json
{
  "success": true,
  "user": {
    "id": "user_001",
    "email": "admin@thaiaccounting.com",
    "name": "Administrator",
    "role": "ADMIN"
  },
  "sessionToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Code Examples - Authentication

#### cURL

```bash
# Login
curl -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@thaiaccounting.com",
    "password": "admin123",
    "redirect": false
  }' \
  -c cookies.txt

# Use session for subsequent requests
curl http://localhost:3000/api/invoices \
  -b cookies.txt
```

#### JavaScript (Fetch)

```javascript
// Login
const loginResponse = await fetch('/api/auth/callback/credentials', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@thaiaccounting.com',
    password: 'admin123',
    redirect: false,
  }),
  credentials: 'include',
});

const { sessionToken } = await loginResponse.json();

// Use in subsequent requests
const invoices = await fetch('/api/invoices', {
  headers: {
    Cookie: `next-auth.session-token=${sessionToken}`,
  },
});
```

#### JavaScript (Axios)

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true,
});

// Login
const login = await api.post('/auth/callback/credentials', {
  email: 'admin@thaiaccounting.com',
  password: 'admin123',
  redirect: false,
});

// Get invoices
const invoices = await api.get('/invoices');
```

#### Python (Requests)

```python
import requests

session = requests.Session()

# Login
response = session.post(
    'http://localhost:3000/api/auth/callback/credentials',
    json={
        'email': 'admin@thaiaccounting.com',
        'password': 'admin123',
        'redirect': False
    }
)

# Get invoices
invoices = session.get('http://localhost:3000/api/invoices')
print(invoices.json())
```

#### PHP

```php
<?php
$ch = curl_init();

// Login
$loginData = json_encode([
    'email' => 'admin@thaiaccounting.com',
    'password' => 'admin123',
    'redirect' => false
]);

curl_setopt($ch, CURLOPT_URL, 'http://localhost:3000/api/auth/callback/credentials');
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, $loginData);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

$response = curl_exec($ch);

// Extract cookies and use for subsequent requests
curl_setopt($ch, CURLOPT_URL, 'http://localhost:3000/api/invoices');
curl_setopt($ch, CURLOPT_POST, 0);
$invoices = curl_exec($ch);

curl_close($ch);
?>
```

#### Go

```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
    "net/http/cookiejar"
)

type LoginRequest struct {
    Email    string `json:"email"`
    Password string `json:"password"`
    Redirect bool   `json:"redirect"`
}

func main() {
    jar, _ := cookiejar.New(nil)
    client := &http.Client{
        Jar: jar,
    }

    // Login
    loginData := LoginRequest{
        Email:    "admin@thaiaccounting.com",
        Password: "admin123",
        Redirect: false,
    }

    jsonData, _ := json.Marshal(loginData)
    resp, _ := client.Post(
        "http://localhost:3000/api/auth/callback/credentials",
        "application/json",
        bytes.NewBuffer(jsonData),
    )
    resp.Body.Close()

    // Get invoices
    resp, _ = client.Get("http://localhost:3000/api/invoices")
    defer resp.Body.Close()

    fmt.Println("Status:", resp.Status)
}
```

---

## Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-03-16T10:00:00Z",
    "requestId": "req_123456"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "ข้อมูลไม่ถูกต้อง",
    "details": [{ "field": "email", "message": "รูปแบบอีเมลไม่ถูกต้อง" }]
  },
  "meta": {
    "timestamp": "2026-03-16T10:00:00Z",
    "requestId": "req_123456"
  }
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

## Error Codes & Troubleshooting

### HTTP Status Codes

| Code | Meaning             | Description                                    | Troubleshooting                                            |
| ---- | ------------------- | ---------------------------------------------- | ---------------------------------------------------------- |
| 200  | OK                  | Request successful                             | -                                                          |
| 201  | Created             | Resource created successfully                  | -                                                          |
| 204  | No Content          | Request successful, no content returned        | -                                                          |
| 400  | Bad Request         | Invalid input data or business logic violation | Check request body format, required fields, and data types |
| 401  | Unauthorized        | Not authenticated or invalid session           | Re-authenticate, check session token expiry                |
| 403  | Forbidden           | Authenticated but insufficient permissions     | Verify user role has required permissions                  |
| 404  | Not Found           | Resource does not exist                        | Check resource ID, verify resource exists                  |
| 409  | Conflict            | Resource state conflict (e.g., already posted) | Check resource status before operation                     |
| 422  | Validation Error    | Request validation failed                      | Check validation errors in response body                   |
| 429  | Too Many Requests   | Rate limit exceeded                            | Wait before retrying, check rate limit headers             |
| 500  | Server Error        | Internal server error                          | Contact support, retry with exponential backoff            |
| 503  | Service Unavailable | Server temporarily unavailable                 | Retry after delay, check system status                     |

### Application Error Codes

| Code                            | Description                 | Solution                                   |
| ------------------------------- | --------------------------- | ------------------------------------------ |
| `AUTH_INVALID_CREDENTIALS`      | อีเมลหรือรหัสผ่านไม่ถูกต้อง | ตรวจสอบอีเมลและรหัสผ่าน หรือรีเซ็ตรหัสผ่าน |
| `AUTH_SESSION_EXPIRED`          | เซสชันหมดอายุ               | เข้าสู่ระบบใหม่                            |
| `AUTH_INSUFFICIENT_PERMISSIONS` | สิทธิ์ไม่เพียงพอ            | ติดต่อผู้ดูแลระบบเพื่อขอสิทธิ์             |
| `VALIDATION_REQUIRED_FIELD`     | ฟิลด์ที่จำเป็นขาดหายไป      | ตรวจสอบฟิลด์ที่จำเป็นทั้งหมด               |
| `VALIDATION_INVALID_FORMAT`     | รูปแบบข้อมูลไม่ถูกต้อง      | ตรวจสอบรูปแบบข้อมูล (เช่น อีเมล, วันที่)   |
| `VALIDATION_INVALID_RANGE`      | ค่าอยู่นอกช่วงที่กำหนด      | ตรวจสอบช่วงค่าที่ยอมรับ                    |
| `RESOURCE_NOT_FOUND`            | ไม่พบข้อมูล                 | ตรวจสอบรหัสข้อมูล                          |
| `RESOURCE_ALREADY_EXISTS`       | ข้อมูลมีอยู่แล้ว            | ใช้รหัสใหม่หรืออัปเดตข้อมูลเดิม            |
| `RESOURCE_LOCKED`               | ข้อมูลถูกล็อก               | รอการปลดล็อกหรือติดต่อผู้ดูแลระบบ          |
| `BUSINESS_RULE_VIOLATION`       | ฝ่าฝืนกฎธุรกิจ              | ตรวจสอบเงื่อนไขทางธุรกิจ                   |
| `INSUFFICIENT_BALANCE`          | ยอดคงเหลือไม่เพียงพอ        | ตรวจสอบยอดคงเหลือในบัญชี                   |
| `DOCUMENT_ALREADY_POSTED`       | เอกสารโพสต์แล้ว             | ไม่สามารถแก้ไขเอกสารที่โพสต์แล้ว           |
| `DOCUMENT_CANCELLED`            | เอกสารถูกยกเลิก             | ไม่สามารถดำเนินการกับเอกสารที่ยกเลิก       |
| `INVENTORY_INSUFFICIENT`        | สต็อกสินค้าไม่เพียงพอ       | ตรวจสอบจำนวนสินค้าคงเหลือ                  |
| `RATE_LIMIT_EXCEEDED`           | เกินจำกัดการเรียก API       | รอก่อนเรียก API ใหม่                       |
| `MAINTENANCE_MODE`              | ระบบอยู่ในโหมดบำรุงรักษา    | รอจนกว่าระบบจะกลับมาทำงาน                  |

### Common Troubleshooting Scenarios

#### 1. Authentication Issues

```bash
# Problem: 401 Unauthorized
# Solution: Check session and re-authenticate

# Verify session
curl http://localhost:3000/api/auth/session \
  -b cookies.txt

# Re-authenticate if needed
curl -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@thaiaccounting.com","password":"admin123","redirect":false}' \
  -c cookies.txt
```

#### 2. Validation Errors

```bash
# Problem: 422 Validation Error
# Solution: Check validation errors and fix request

# Example: Missing required field
curl -X POST http://localhost:3000/api/invoices \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "customerId": "",
    "lines": []
  }'
# Response: {"success":false,"error":{"code":"VALIDATION_REQUIRED_FIELD","details":[{"field":"customerId","message":"กรุณาระบุลูกค้า"}]}}
```

#### 3. Rate Limiting

```bash
# Problem: 429 Too Many Requests
# Solution: Check rate limit headers and wait

# Headers returned:
# X-RateLimit-Limit: 60
# X-RateLimit-Remaining: 0
# X-RateLimit-Reset: 1647420000

# Wait and retry with exponential backoff
```

### Error Handling Examples

#### JavaScript (Axios with Interceptors)

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add any pre-request logic
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 - Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Attempt to refresh session
        await api.post('/auth/callback/credentials', {
          email: 'admin@thaiaccounting.com',
          password: 'admin123',
          redirect: false,
        });
        return api(originalRequest);
      } catch (refreshError) {
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle 429 - Rate Limit
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['x-ratelimit-retry-after'];
      console.warn(`Rate limited. Retry after ${retryAfter} seconds`);
      // Implement retry logic
    }

    // Handle 422 - Validation Error
    if (error.response?.status === 422) {
      const validationErrors = error.response.data.error.details;
      console.error('Validation errors:', validationErrors);
      // Display errors to user
    }

    return Promise.reject(error);
  }
);

export default api;
```

#### Python (Error Handling)

```python
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

class ThaiAccountingAPI:
    def __init__(self, base_url='http://localhost:3000'):
        self.base_url = base_url
        self.session = requests.Session()

        # Configure retry strategy
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)

    def login(self, email, password):
        try:
            response = self.session.post(
                f'{self.base_url}/api/auth/callback/credentials',
                json={
                    'email': email,
                    'password': password,
                    'redirect': False
                }
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 401:
                raise AuthenticationError("Invalid credentials")
            raise

    def create_invoice(self, invoice_data):
        try:
            response = self.session.post(
                f'{self.base_url}/api/invoices',
                json=invoice_data
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 422:
                errors = e.response.json().get('error', {}).get('details', [])
                raise ValidationError(errors)
            elif e.response.status_code == 409:
                raise ConflictError("Document already posted")
            raise

class AuthenticationError(Exception):
    pass

class ValidationError(Exception):
    pass

class ConflictError(Exception):
    pass
```

#### Go (Error Handling)

```go
package main

import (
    "encoding/json"
    "fmt"
    "net/http"
    "time"
)

type APIError struct {
    Success bool `json:"success"`
    Error   struct {
        Code    string `json:"code"`
        Message string `json:"message"`
        Details []struct {
            Field   string `json:"field"`
            Message string `json:"message"`
        } `json:"details"`
    } `json:"error"`
}

func (e *APIError) Error() string {
    return fmt.Sprintf("API Error %s: %s", e.Error.Code, e.Error.Message)
}

type Client struct {
    baseURL    string
    httpClient *http.Client
    jar        http.CookieJar
}

func NewClient(baseURL string) *Client {
    jar, _ := cookiejar.New(nil)
    return &Client{
        baseURL: baseURL,
        httpClient: &http.Client{
            Timeout: 30 * time.Second,
            Jar:     jar,
        },
    }
}

func (c *Client) handleError(resp *http.Response) error {
    if resp.StatusCode < 400 {
        return nil
    }

    var apiErr APIError
    if err := json.NewDecoder(resp.Body).Decode(&apiErr); err != nil {
        return fmt.Errorf("HTTP %d: %s", resp.StatusCode, resp.Status)
    }

    switch resp.StatusCode {
    case http.StatusUnauthorized:
        return fmt.Errorf("authentication required: %s", apiErr.Error.Message)
    case http.StatusForbidden:
        return fmt.Errorf("permission denied: %s", apiErr.Error.Message)
    case http.StatusNotFound:
        return fmt.Errorf("resource not found: %s", apiErr.Error.Message)
    case http.StatusTooManyRequests:
        retryAfter := resp.Header.Get("X-RateLimit-Retry-After")
        return fmt.Errorf("rate limited, retry after %s seconds", retryAfter)
    case http.StatusUnprocessableEntity:
        return fmt.Errorf("validation error: %v", apiErr.Error.Details)
    default:
        return &apiErr
    }
}
```

---

## Pagination

### Request Parameters

| Parameter | Type   | Default | Description               |
| --------- | ------ | ------- | ------------------------- |
| `page`    | number | 1       | Page number (1-indexed)   |
| `limit`   | number | 20      | Items per page (max: 100) |
| `sort`    | string | -       | Sort field                |
| `order`   | string | asc     | Sort order (asc, desc)    |

### Pagination Examples

#### Basic Pagination

```javascript
// Get page 2 with 50 items per page
const response = await fetch('/api/invoices?page=2&limit=50');
const data = await response.json();

console.log(data.pagination);
// {
//   page: 2,
//   limit: 50,
//   total: 247,
//   totalPages: 5,
//   hasNextPage: true,
//   hasPrevPage: true
// }
```

#### Cursor-Based Pagination (For Large Datasets)

```javascript
// Using cursor for better performance with large datasets
let cursor = null;
const allItems = [];

do {
  const url = cursor
    ? `/api/invoices?cursor=${cursor}&limit=100`
    : '/api/invoices?limit=100';

  const response = await fetch(url);
  const data = await response.json();

  allItems.push(...data.data);
  cursor = data.pagination.nextCursor;
} while (cursor);
```

#### Python Pagination Helper

```python
class PaginatedIterator:
    def __init__(self, client, endpoint, params=None, per_page=100):
        self.client = client
        self.endpoint = endpoint
        self.params = params or {}
        self.per_page = per_page
        self.current_page = 1
        self.total_pages = None

    def __iter__(self):
        return self

    def __next__(self):
        if self.total_pages is not None and self.current_page > self.total_pages:
            raise StopIteration

        params = {
            **self.params,
            'page': self.current_page,
            'limit': self.per_page
        }

        response = self.client.get(self.endpoint, params=params)
        data = response.json()

        self.total_pages = data['pagination']['totalPages']
        self.current_page += 1

        if not data['data']:
            raise StopIteration

        return data['data']

# Usage
for items in PaginatedIterator(client, '/api/invoices', {'status': 'DRAFT'}):
    for invoice in items:
        process_invoice(invoice)
```

---

## Rate Limiting

### Limits by Endpoint Category

| Category       | Limit        | Window     | Description            |
| -------------- | ------------ | ---------- | ---------------------- |
| Authentication | 5 requests   | 15 minutes | Login, password reset  |
| General API    | 60 requests  | 1 minute   | Standard API calls     |
| Reports        | 10 requests  | 1 minute   | Report generation      |
| Export         | 5 requests   | 5 minutes  | Data export operations |
| Webhooks       | 100 requests | 1 minute   | Webhook deliveries     |

### Rate Limit Headers

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1647423600
X-RateLimit-Retry-After: 45
```

### Handling Rate Limits

#### Client-Side Implementation

```javascript
class RateLimitHandler {
  async makeRequest(url, options) {
    try {
      const response = await fetch(url, options);

      if (response.status === 429) {
        const retryAfter = response.headers.get('X-RateLimit-Retry-After');
        await this.wait(parseInt(retryAfter) * 1000);
        return this.makeRequest(url, options); // Retry
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
```

---

## Role-Based Access Control

| Role           | Permissions            | Endpoints                                  |
| -------------- | ---------------------- | ------------------------------------------ |
| **ADMIN**      | Full access            | All endpoints including user management    |
| **ACCOUNTANT** | Full accounting access | All accounting modules, no user management |
| **USER**       | Create/view only       | Limited write access, no settings          |
| **VIEWER**     | Read-only              | GET requests only                          |

### Permission Matrix

| Endpoint                    | ADMIN | ACCOUNTANT | USER | VIEWER |
| --------------------------- | ----- | ---------- | ---- | ------ |
| GET /api/accounts           | ✅    | ✅         | ✅   | ✅     |
| POST /api/accounts          | ✅    | ✅         | ❌   | ❌     |
| DELETE /api/accounts        | ✅    | ❌         | ❌   | ❌     |
| GET /api/invoices           | ✅    | ✅         | ✅   | ✅     |
| POST /api/invoices          | ✅    | ✅         | ✅   | ❌     |
| POST /api/invoices/:id/void | ✅    | ✅         | ❌   | ❌     |
| GET /api/settings           | ✅    | ✅         | ✅   | ✅     |
| PUT /api/settings           | ✅    | ❌         | ❌   | ❌     |
| GET /api/users              | ✅    | ❌         | ❌   | ❌     |
| POST /api/users             | ✅    | ❌         | ❌   | ❌     |

---

## API Endpoints Reference

### Accounts API

#### List Accounts

```http
GET /api/accounts?page=1&limit=20&type=ASSET&search=ค่า
```

**Query Parameters:**

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `type` (string): Filter by account type (ASSET, LIABILITY, EQUITY, REVENUE,
  EXPENSE)
- `search` (string): Search by name or code
- `parentId` (string): Filter by parent account

**Code Examples:**

<details>
<summary>cURL</summary>

```bash
curl "http://localhost:3000/api/accounts?page=1&limit=20&type=ASSET" \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

</details>

<details>
<summary>JavaScript</summary>

```javascript
const response = await fetch('/api/accounts?page=1&limit=20&type=ASSET', {
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
});
const accounts = await response.json();
```

</details>

<details>
<summary>Python</summary>

```python
import requests

response = requests.get(
    'http://localhost:3000/api/accounts',
    params={'page': 1, 'limit': 20, 'type': 'ASSET'},
    cookies=session_cookies
)
accounts = response.json()
```

</details>

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
      "balance": 150000,
      "level": 2,
      "isDetail": true,
      "isActive": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

#### Create Account

```http
POST /api/accounts
```

**Request Body:**

```json
{
  "code": "1102",
  "name": "ลูกหนี้การค้า - ลูกค้ารายย่อย",
  "nameEn": "Accounts Receivable - Retail",
  "type": "ASSET",
  "parentId": "acc_001",
  "isDetail": true
}
```

**Validation Rules:**

- `code`: Required, unique, 4-10 characters
- `name`: Required, 1-200 characters
- `type`: Required, enum: ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE

---

### Invoices API

#### List Invoices

```http
GET /api/invoices?page=1&limit=20&status=DRAFT&customerId=xxx&startDate=2024-01-01&endDate=2024-12-31
```

**Query Parameters:**

- `page` (number): Page number
- `limit` (number): Items per page
- `status` (string): DRAFT, ISSUED, PARTIAL, PAID, CANCELLED
- `customerId` (string): Filter by customer
- `startDate` (date): Filter from date (YYYY-MM-DD)
- `endDate` (date): Filter to date (YYYY-MM-DD)
- `minAmount` (number): Minimum amount
- `maxAmount` (number): Maximum amount

#### Create Invoice

```http
POST /api/invoices
```

**Request Body:**

```json
{
  "customerId": "cust_001",
  "invoiceDate": "2024-03-15",
  "dueDate": "2024-04-15",
  "reference": "PO-12345",
  "notes": "หมายเหตุ",
  "lines": [
    {
      "productId": "prod_001",
      "description": "สินค้า A",
      "quantity": 10,
      "unitPrice": 1000,
      "discountPercent": 5,
      "vatRate": 7
    }
  ]
}
```

**Code Examples:**

<details>
<summary>cURL</summary>

```bash
curl -X POST http://localhost:3000/api/invoices \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "customerId": "cust_001",
    "invoiceDate": "2024-03-15",
    "dueDate": "2024-04-15",
    "lines": [
      {
        "description": "บริการที่ปรึกษา",
        "quantity": 1,
        "unitPrice": 50000,
        "vatRate": 7
      }
    ]
  }'
```

</details>

<details>
<summary>Python</summary>

```python
import requests

invoice_data = {
    "customerId": "cust_001",
    "invoiceDate": "2024-03-15",
    "dueDate": "2024-04-15",
    "lines": [
        {
            "description": "บริการที่ปรึกษา",
            "quantity": 1,
            "unitPrice": 50000,
            "vatRate": 7
        }
    ]
}

response = requests.post(
    'http://localhost:3000/api/invoices',
    json=invoice_data,
    cookies=session_cookies
)
print(response.json())
```

</details>

<details>
<summary>PHP</summary>

```php
<?php
$data = [
    'customerId' => 'cust_001',
    'invoiceDate' => '2024-03-15',
    'dueDate' => '2024-04-15',
    'lines' => [
        [
            'description' => 'บริการที่ปรึกษา',
            'quantity' => 1,
            'unitPrice' => 50000,
            'vatRate' => 7
        ]
    ]
];

$ch = curl_init('http://localhost:3000/api/invoices');
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

$response = curl_exec($ch);
curl_close($ch);

echo $response;
?>
```

</details>

#### Issue Invoice

```http
POST /api/invoices/:id/issue
```

Creates journal entries and marks invoice as ISSUED.

---

### Receipts API

#### List Receipts

```http
GET /api/receipts?page=1&limit=20&status=DRAFT&customerId=xxx
```

#### Create Receipt

```http
POST /api/receipts
```

**Request Body:**

```json
{
  "customerId": "cust_001",
  "receiptDate": "2024-03-15",
  "paymentMethod": "BANK_TRANSFER",
  "bankAccountId": "bank_001",
  "reference": "REF-123",
  "amount": 53500,
  "whtAmount": 0,
  "allocations": [
    {
      "invoiceId": "inv_001",
      "amount": 53500,
      "whtAmount": 0
    }
  ],
  "notes": "รับชำระค่าบริการ"
}
```

**Payment Methods:**

- `CASH` - เงินสด
- `BANK_TRANSFER` - โอนเงิน
- `CHEQUE` - เช็ค
- `CREDIT_CARD` - บัตรเครดิต

---

### Journal Entries API

#### List Journal Entries

```http
GET /api/journal?page=1&limit=20&status=POSTED&startDate=2024-01-01&endDate=2024-12-31
```

#### Create Journal Entry

```http
POST /api/journal
```

**Request Body:**

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

**Validation:** Total debits must equal total credits.

---

### Reports API

#### General Ledger Report

```http
GET /api/reports/general-ledger?startDate=2024-01-01&endDate=2024-03-31&accountId=xxx
```

#### Balance Sheet

```http
GET /api/reports/balance-sheet?asOf=2024-03-31
```

#### Income Statement

```http
GET /api/reports/income-statement?startDate=2024-01-01&endDate=2024-03-31
```

#### Trial Balance

```http
GET /api/reports/trial-balance?asOf=2024-03-31
```

#### VAT Report

```http
GET /api/reports/vat?month=3&year=2024&type=OUTPUT
```

**Report Types:**

- `OUTPUT` - ภาษีขาย (Output VAT)
- `INPUT` - ภาษีซื้อ (Input VAT)

---

### Customers API

#### List Customers

```http
GET /api/customers?page=1&limit=20&search=บริษัท&isActive=true
```

#### Create Customer

```http
POST /api/customers
```

**Request Body:**

```json
{
  "code": "CUST-001",
  "name": "บริษัท ตัวอย่าง จำกัด",
  "nameEn": "Example Company Ltd.",
  "taxId": "1234567890123",
  "branchCode": "00000",
  "address": "123 ถนนสุขุมวิท",
  "subDistrict": "คลองเตย",
  "district": "คลองเตย",
  "province": "กรุงเทพมหานคร",
  "postalCode": "10110",
  "phone": "02-123-4567",
  "email": "contact@example.com",
  "creditLimit": 100000,
  "creditDays": 30
}
```

---

### Settings API

#### Get Settings

```http
GET /api/settings
```

**Response:**

```json
{
  "success": true,
  "data": {
    "companyName": "บริษัท ตัวอย่าง จำกัด",
    "companyNameEn": "Example Company Ltd.",
    "taxId": "1234567890123",
    "vatRate": 7,
    "address": "123 ถนนสุขุมวิท กรุงเทพฯ 10110",
    "phone": "02-123-4567",
    "email": "info@example.com",
    "fiscalYearStart": "01-01",
    "currency": "THB",
    "dateFormat": "DD/MM/YYYY",
    "language": "th"
  }
}
```

#### Update Settings

```http
PUT /api/settings
```

---

## Status Codes Reference

### Invoice Status

| Status    | Thai        | Description                |
| --------- | ----------- | -------------------------- |
| DRAFT     | ฉบับร่าง    | Initial state, editable    |
| ISSUED    | ออกแล้ว     | Invoice issued to customer |
| PARTIAL   | ชำระบางส่วน | Partially paid             |
| PAID      | ชำระแล้ว    | Fully paid                 |
| CANCELLED | ยกเลิก      | Cancelled/voided           |

### Receipt/Payment Status

| Status    | Thai      | Description   |
| --------- | --------- | ------------- |
| DRAFT     | ฉบับร่าง  | Initial state |
| POSTED    | โพสต์แล้ว | Posted to GL  |
| CANCELLED | ยกเลิก    | Cancelled     |

### Journal Entry Status

| Status   | Thai      | Description   |
| -------- | --------- | ------------- |
| DRAFT    | ฉบับร่าง  | Initial state |
| POSTED   | โพสต์แล้ว | Posted to GL  |
| REVERSED | ยกเลิก    | Reversed      |

---

## Webhooks

### Configuration

Configure webhooks in Settings → Integrations → Webhooks

### Events

| Event               | Description          |
| ------------------- | -------------------- |
| `invoice.created`   | Invoice created      |
| `invoice.issued`    | Invoice issued       |
| `invoice.paid`      | Invoice paid         |
| `invoice.cancelled` | Invoice cancelled    |
| `receipt.created`   | Receipt created      |
| `receipt.posted`    | Receipt posted       |
| `payment.created`   | Payment created      |
| `payment.posted`    | Payment posted       |
| `journal.posted`    | Journal entry posted |

### Webhook Payload

```json
{
  "event": "invoice.created",
  "timestamp": "2026-03-16T10:00:00Z",
  "data": {
    "id": "inv_001",
    "number": "INV-202603-0001",
    "customerId": "cust_001",
    "amount": 53500,
    "status": "DRAFT"
  }
}
```

### Signature Verification

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
```

### Webhook Examples

#### Handling Webhooks in Express.js

```javascript
const express = require('express');
const crypto = require('crypto');
const app = express();

app.use(express.raw({ type: 'application/json' }));

app.post('/webhooks/thai-accounting', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const secret = process.env.WEBHOOK_SECRET;

  // Verify signature
  const expected = crypto
    .createHmac('sha256', secret)
    .update(req.body)
    .digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return res.status(401).send('Invalid signature');
  }

  const event = JSON.parse(req.body);

  // Handle different event types
  switch (event.event) {
    case 'invoice.created':
      handleInvoiceCreated(event.data);
      break;
    case 'invoice.paid':
      handleInvoicePaid(event.data);
      break;
    case 'receipt.posted':
      handleReceiptPosted(event.data);
      break;
    default:
      console.log('Unhandled event:', event.event);
  }

  res.status(200).send('OK');
});

function handleInvoiceCreated(data) {
  console.log('New invoice created:', data.number);
  // Sync to external system, send notification, etc.
}

function handleInvoicePaid(data) {
  console.log('Invoice paid:', data.number);
  // Update CRM, send thank you email, etc.
}

function handleReceiptPosted(data) {
  console.log('Receipt posted:', data.number);
  // Update accounting records
}
```

#### Python Webhook Handler (Flask)

```python
from flask import Flask, request, jsonify
import hmac
import hashlib
import os

app = Flask(__name__)
WEBHOOK_SECRET = os.environ.get('WEBHOOK_SECRET')

@app.route('/webhooks/thai-accounting', methods=['POST'])
def handle_webhook():
    signature = request.headers.get('X-Webhook-Signature')

    # Verify signature
    expected = hmac.new(
        WEBHOOK_SECRET.encode(),
        request.data,
        hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(signature, expected):
        return jsonify({'error': 'Invalid signature'}), 401

    event = request.json

    # Handle events
    handlers = {
        'invoice.created': handle_invoice_created,
        'invoice.paid': handle_invoice_paid,
        'receipt.posted': handle_receipt_posted,
    }

    handler = handlers.get(event['event'])
    if handler:
        handler(event['data'])

    return jsonify({'status': 'ok'}), 200

def handle_invoice_created(data):
    print(f"New invoice created: {data['number']}")
    # Implementation here

def handle_invoice_paid(data):
    print(f"Invoice paid: {data['number']}")
    # Implementation here

def handle_receipt_posted(data):
    print(f"Receipt posted: {data['number']}")
    # Implementation here

if __name__ == '__main__':
    app.run(port=5000)
```

#### Go Webhook Handler

```go
package main

import (
    "crypto/hmac"
    "crypto/sha256"
    "encoding/hex"
    "encoding/json"
    "io"
    "net/http"
    "os"
)

type WebhookEvent struct {
    Event     string          `json:"event"`
    Timestamp string          `json:"timestamp"`
    Data      json.RawMessage `json:"data"`
}

func webhookHandler(w http.ResponseWriter, r *http.Request) {
    secret := os.Getenv("WEBHOOK_SECRET")
    signature := r.Header.Get("X-Webhook-Signature")

    body, _ := io.ReadAll(r.Body)

    // Verify signature
    mac := hmac.New(sha256.New, []byte(secret))
    mac.Write(body)
    expected := hex.EncodeToString(mac.Sum(nil))

    if !hmac.Equal([]byte(signature), []byte(expected)) {
        http.Error(w, "Invalid signature", http.StatusUnauthorized)
        return
    }

    var event WebhookEvent
    if err := json.Unmarshal(body, &event); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }

    // Handle events
    switch event.Event {
    case "invoice.created":
        handleInvoiceCreated(event.Data)
    case "invoice.paid":
        handleInvoicePaid(event.Data)
    case "receipt.posted":
        handleReceiptPosted(event.Data)
    }

    w.WriteHeader(http.StatusOK)
}

func handleInvoiceCreated(data json.RawMessage) {
    // Implementation
}

func handleInvoicePaid(data json.RawMessage) {
    // Implementation
}

func handleReceiptPosted(data json.RawMessage) {
    // Implementation
}
```

---

## Postman Collection

### Import URL

```
https://api.thaiaccounting.com/postman-collection.json
```

### Collection Structure

```
Thai Accounting ERP API
├── 🔐 Authentication
│   ├── Login
│   ├── Logout
│   └── Session
├── 📊 Accounts
│   ├── List Accounts
│   ├── Create Account
│   ├── Update Account
│   └── Delete Account
├── 📄 Invoices
│   ├── List Invoices
│   ├── Create Invoice
│   ├── Get Invoice
│   ├── Update Invoice
│   ├── Delete Invoice
│   ├── Issue Invoice
│   └── Void Invoice
├── 💰 Receipts
├── 💳 Payments
├── 📒 Journal Entries
├── 👥 Customers
├── 🏢 Vendors
├── 📦 Products
├── 📈 Reports
└── ⚙️ Settings
```

### Environment Variables

```json
{
  "baseUrl": "http://localhost:3000",
  "apiVersion": "v1",
  "sessionToken": "{{session_token}}"
}
```

---

## API Changelog

### Version 1.0.0 (2026-03-16)

- 🎉 Initial stable release
- ✅ All core accounting modules
- ✅ Authentication & authorization
- ✅ Reports API
- ✅ Settings API
- ✅ Webhooks support

### Version 0.9.0 (2026-03-01)

- ➕ Added inventory management endpoints
- ➕ Added payroll endpoints
- ➕ Added banking endpoints
- 🔧 Improved error messages

### Version 0.8.0 (2026-02-15)

- ➕ Added fixed assets endpoints
- ➕ Added petty cash endpoints
- ➕ Added WHT endpoints
- 🔧 Performance improvements

### Version 0.7.0 (2026-02-01)

- ➕ Added credit/debit notes
- ➕ Added multi-currency support
- 🔧 Bug fixes

### Version 0.6.0 (2026-01-15)

- ➕ Initial beta release
- ➕ Core accounting features

---

## SDKs & Libraries

### Official SDKs

#### JavaScript/TypeScript

```bash
npm install @thaiaccounting/api-client
```

```javascript
import { ThaiAccountingClient } from '@thaiaccounting/api-client';

const client = new ThaiAccountingClient({
  baseUrl: 'http://localhost:3000',
  credentials: { email: 'admin@thaiaccounting.com', password: 'admin123' },
});

const invoices = await client.invoices.list({ page: 1, limit: 20 });
```

#### Python

```bash
pip install thaiaccounting-api
```

```python
from thaiaccounting import ThaiAccountingClient

client = ThaiAccountingClient(
    base_url='http://localhost:3000',
    email='admin@thaiaccounting.com',
    password='admin123'
)

invoices = client.invoices.list(page=1, limit=20)
```

---

## Support & Resources

- 📧 **Email:** api-support@thaiaccounting.com
- 📚 **Documentation:** https://docs.thaiaccounting.com
- 💬 **Community Forum:** https://community.thaiaccounting.com
- 🐛 **Issue Tracker:** https://github.com/thaiaccounting/erp/issues
- 📱 **Status Page:** https://status.thaiaccounting.com

---

**© 2026 Thai Accounting ERP. All rights reserved.**
