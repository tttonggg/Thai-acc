# Skill: API Contract Design

## Description
Design RESTful API contracts using OpenAPI 3.0 specification. Ensures backend and frontend agents agree on request/response formats before implementation.

## Trigger
Use when:
- Designing new API endpoints
- Adding modules that need backend-frontend integration
- Documenting existing APIs
- Onboarding new developers

## Assigned Model
`opencode-go/glm-5.1` (clean structured output, reasoning about API design)

## Detailed Instruction / SOP

### Step 1: Resource Identification
Identify resources from schema:
- /api/quotations - Quotation collection
- /api/quotations/{id} - Single quotation
- /api/quotations/{id}/items - Quotation line items
- /api/quotations/{id}/convert - Convert to invoice

### Step 2: Endpoint Design
For each endpoint, define:
- HTTP method + path
- Summary + description
- Request parameters (path, query, body)
- Response schemas (200, 400, 401, 404, 422, 500)
- Authentication requirements
- Thai-specific fields

### Step 3: Common Patterns
Standard response envelope:
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 150
  }
}
```

Error response:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      { "field": "contact_id", "message": "Contact not found" }
    ]
  }
}
```

### Step 4: Pagination
All list endpoints support:
- page (default: 1)
- per_page (default: 20, max: 100)
- sort (field name)
- order (asc/desc)
- filters (field=value)

### Step 5: Authentication
All endpoints require Bearer token:
```
Authorization: Bearer <jwt_token>
```
X-Company-ID header for multi-tenancy:
```
X-Company-ID: <company_uuid>
```

## Output Format
Save to: `/docs/design/{module}-api-contract.md`
