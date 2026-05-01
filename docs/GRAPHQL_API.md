# GraphQL API Documentation

Thai Accounting ERP provides a GraphQL API for flexible data querying and
mutations.

## Endpoint

```
POST /api/graphql
```

## Authentication

GraphQL requests require authentication via session cookie or Bearer token:

```bash
curl -X POST http://localhost:3000/api/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"query": "query { me { id email name } }"}'
```

## Queries

### User Queries

#### Get current user

```graphql
query {
  me {
    id
    email
    name
    role
    lastLoginAt
  }
}
```

#### Get all users (Admin only)

```graphql
query {
  users {
    id
    email
    name
    role
    isActive
  }
}
```

### Invoice Queries

#### List invoices with pagination

```graphql
query GetInvoices($page: Int, $limit: Int, $status: InvoiceStatus) {
  invoices(page: $page, limit: $limit, status: $status) {
    edges {
      node {
        id
        invoiceNo
        invoiceDate
        totalAmount
        status
        customer {
          name
        }
      }
      cursor
    }
    pageInfo {
      hasNextPage
      totalCount
    }
  }
}
```

#### Get single invoice

```graphql
query GetInvoice($id: ID!) {
  invoice(id: $id) {
    id
    invoiceNo
    invoiceDate
    dueDate
    subtotal
    vatAmount
    totalAmount
    status
    customer {
      id
      name
      taxId
    }
    lines {
      id
      description
      quantity
      unitPrice
      amount
      product {
        code
        name
      }
    }
  }
}
```

### Customer Queries

#### List customers

```graphql
query {
  customers(page: 1, limit: 20) {
    edges {
      node {
        id
        code
        name
        taxId
        creditLimit
        totalReceivables
      }
    }
    pageInfo {
      totalCount
    }
  }
}
```

### Chart of Accounts Queries

#### Get accounts

```graphql
query {
  accounts(type: ASSET, isActive: true) {
    id
    code
    name
    type
    level
    balance
    children {
      id
      code
      name
    }
  }
}
```

### Journal Entry Queries

#### List journal entries

```graphql
query {
  journalEntries(
    status: POSTED
    startDate: "2024-03-01"
    endDate: "2024-03-31"
  ) {
    edges {
      node {
        id
        entryNo
        date
        description
        totalDebit
        totalCredit
        status
        lines {
          account {
            code
            name
          }
          debit
          credit
        }
      }
    }
  }
}
```

### Product Queries

#### List products

```graphql
query {
  products(type: PRODUCT, isActive: true) {
    id
    code
    name
    salePrice
    costPrice
    quantity
  }
}
```

## Mutations

### Invoice Mutations

#### Create invoice

```graphql
mutation CreateInvoice($input: CreateInvoiceInput!) {
  createInvoice(input: $input) {
    id
    invoiceNo
    totalAmount
    status
  }
}
```

Variables:

```json
{
  "input": {
    "customerId": "clf...",
    "invoiceDate": "2024-03-16",
    "dueDate": "2024-04-16",
    "lines": [
      {
        "productId": "clf...",
        "description": "Product A",
        "quantity": 2,
        "unitPrice": 50000
      }
    ]
  }
}
```

#### Issue invoice

```graphql
mutation IssueInvoice($id: ID!) {
  issueInvoice(id: $id) {
    id
    status
  }
}
```

#### Void invoice

```graphql
mutation VoidInvoice($id: ID!, $reason: String) {
  voidInvoice(id: $id, reason: $reason) {
    id
    status
  }
}
```

### Customer Mutations

#### Create customer

```graphql
mutation CreateCustomer($input: CreateCustomerInput!) {
  createCustomer(input: $input) {
    id
    code
    name
  }
}
```

#### Update customer

```graphql
mutation UpdateCustomer($id: ID!, $input: CreateCustomerInput!) {
  updateCustomer(id: $id, input: $input) {
    id
    name
    creditLimit
  }
}
```

### Journal Entry Mutations

#### Create journal entry

```graphql
mutation CreateJournalEntry($input: CreateJournalEntryInput!) {
  createJournalEntry(input: $input) {
    id
    entryNo
    date
    status
  }
}
```

Variables:

```json
{
  "input": {
    "date": "2024-03-16",
    "description": "Monthly accrual",
    "lines": [
      { "accountId": "clf...", "debit": 100000, "credit": 0 },
      { "accountId": "clf...", "debit": 0, "credit": 100000 }
    ]
  }
}
```

#### Post journal entry

```graphql
mutation PostJournalEntry($id: ID!) {
  postJournalEntry(id: $id) {
    id
    status
  }
}
```

### Product Mutations

#### Create product

```graphql
mutation CreateProduct($input: CreateProductInput!) {
  createProduct(input: $input) {
    id
    code
    name
    salePrice
  }
}
```

### Webhook Mutations

#### Create webhook

```graphql
mutation CreateWebhook($input: CreateWebhookInput!) {
  createWebhook(input: $input) {
    id
    name
    url
    events
  }
}
```

Variables:

```json
{
  "input": {
    "name": "CRM Integration",
    "url": "https://crm.example.com/webhooks",
    "events": ["INVOICE_CREATED", "INVOICE_PAID"]
  }
}
```

#### Test webhook

```graphql
mutation TestWebhook($id: ID!) {
  testWebhook(id: $id) {
    success
    statusCode
    responseTime
    error
  }
}
```

## Analytics Queries

### API Metrics

```graphql
query {
  apiMetrics {
    totalRequests
    requestsPerMinute
    errorRate
    averageDuration
    p50
    p95
    p99
    topUsers {
      userId
      userName
      requestCount
    }
    topPaths {
      path
      requestCount
      averageDuration
    }
  }
}
```

## Fragments

### Invoice Fragment

```graphql
fragment InvoiceFields on Invoice {
  id
  invoiceNo
  invoiceDate
  dueDate
  subtotal
  vatAmount
  totalAmount
  status
  customer {
    id
    name
  }
}
```

### Customer Fragment

```graphql
fragment CustomerFields on Customer {
  id
  code
  name
  taxId
  creditLimit
  creditDays
}
```

## Error Handling

GraphQL errors are returned in the `errors` array:

```json
{
  "data": null,
  "errors": [
    {
      "message": "Authentication required",
      "extensions": {
        "code": "UNAUTHENTICATED"
      }
    }
  ]
}
```

## Query Complexity

The API has query complexity limits to prevent abuse:

- Maximum complexity: 1000
- Maximum depth: 10

Complex queries may be rejected with:

```json
{
  "errors": [
    {
      "message": "Query too complex: 1500 (max: 1000)",
      "extensions": {
        "code": "QUERY_TOO_COMPLEX"
      }
    }
  ]
}
```

## Rate Limiting

GraphQL requests are subject to rate limiting:

- 100 requests per minute for authenticated users
- 20 requests per minute for anonymous users

## Playground

In development mode, the GraphQL Playground is available at:

```
/api/graphql
```

Open it in your browser to explore the schema and test queries interactively.

## Tools

### Using with Apollo Client

```typescript
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';

const client = new ApolloClient({
  link: createHttpLink({
    uri: '/api/graphql',
    credentials: 'include',
  }),
  cache: new InMemoryCache(),
});
```

### Using with curl

```bash
curl -X POST http://localhost:3000/api/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "query { invoices(limit: 5) { edges { node { invoiceNo totalAmount } } } }"}'
```

## Best Practices

1. **Use fragments** - Reuse field selections across queries
2. **Request only what you need** - Minimize payload size
3. **Use pagination** - Don't fetch large lists at once
4. **Handle errors** - Always check for errors in responses
5. **Cache appropriately** - Use DataLoader for N+1 prevention

## Schema Documentation

The complete schema is available via introspection:

```graphql
{
  __schema {
    types {
      name
      description
    }
  }
}
```
