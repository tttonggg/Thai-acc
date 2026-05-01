# Webhook Events Documentation

Thai Accounting ERP System supports real-time webhook notifications for various
business events.

## Webhook Endpoint

All webhooks are sent as HTTP POST requests to your configured endpoint URL.

## Authentication

Each webhook request includes a signature header for verification:

```
X-Webhook-Signature: sha256=<hmac_signature>
```

To verify the signature:

```typescript
import crypto from 'crypto';

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
```

## Request Format

All webhook requests follow this structure:

```json
{
  "event": "INVOICE_CREATED",
  "timestamp": "2024-03-16T10:30:00.000Z",
  "data": {
    // Event-specific data
  }
}
```

## Available Events

### Invoice Events

#### INVOICE_CREATED

Triggered when a new invoice is created.

```json
{
  "event": "INVOICE_CREATED",
  "timestamp": "2024-03-16T10:30:00.000Z",
  "data": {
    "id": "clf...",
    "invoiceNo": "INV-202403-0001",
    "invoiceDate": "2024-03-16",
    "customerId": "clf...",
    "customerName": "ABC Company",
    "totalAmount": 107000,
    "status": "DRAFT"
  }
}
```

#### INVOICE_UPDATED

Triggered when an invoice is modified.

```json
{
  "event": "INVOICE_UPDATED",
  "timestamp": "2024-03-16T10:30:00.000Z",
  "data": {
    "id": "clf...",
    "invoiceNo": "INV-202403-0001",
    "changes": ["totalAmount", "lines"],
    "oldValues": { "totalAmount": 100000 },
    "newValues": { "totalAmount": 107000 }
  }
}
```

#### INVOICE_ISSUED

Triggered when an invoice status changes from DRAFT to ISSUED.

```json
{
  "event": "INVOICE_ISSUED",
  "timestamp": "2024-03-16T10:30:00.000Z",
  "data": {
    "id": "clf...",
    "invoiceNo": "INV-202403-0001",
    "issuedAt": "2024-03-16T10:30:00.000Z",
    "issuedBy": "user@example.com"
  }
}
```

#### INVOICE_PAID

Triggered when an invoice is fully paid.

```json
{
  "event": "INVOICE_PAID",
  "timestamp": "2024-03-16T10:30:00.000Z",
  "data": {
    "id": "clf...",
    "invoiceNo": "INV-202403-0001",
    "paidAmount": 107000,
    "paidAt": "2024-03-16T10:30:00.000Z",
    "receiptNo": "REC-202403-0001"
  }
}
```

#### INVOICE_VOIDED

Triggered when an invoice is voided/cancelled.

```json
{
  "event": "INVOICE_VOIDED",
  "timestamp": "2024-03-16T10:30:00.000Z",
  "data": {
    "id": "clf...",
    "invoiceNo": "INV-202403-0001",
    "voidedAt": "2024-03-16T10:30:00.000Z",
    "voidedBy": "user@example.com",
    "reason": "Customer request"
  }
}
```

### Receipt Events

#### RECEIPT_CREATED

Triggered when a new receipt is created.

```json
{
  "event": "RECEIPT_CREATED",
  "timestamp": "2024-03-16T10:30:00.000Z",
  "data": {
    "id": "clf...",
    "receiptNo": "REC-202403-0001",
    "receiptDate": "2024-03-16",
    "customerId": "clf...",
    "customerName": "ABC Company",
    "amount": 107000,
    "paymentMethod": "TRANSFER",
    "status": "DRAFT"
  }
}
```

#### RECEIPT_POSTED

Triggered when a receipt is posted to the general ledger.

```json
{
  "event": "RECEIPT_POSTED",
  "timestamp": "2024-03-16T10:30:00.000Z",
  "data": {
    "id": "clf...",
    "receiptNo": "REC-202403-0001",
    "postedAt": "2024-03-16T10:30:00.000Z",
    "journalEntryId": "clf..."
  }
}
```

### Payment Events

#### PAYMENT_CREATED

Triggered when a new payment is created.

```json
{
  "event": "PAYMENT_CREATED",
  "timestamp": "2024-03-16T10:30:00.000Z",
  "data": {
    "id": "clf...",
    "paymentNo": "PAY-202403-0001",
    "paymentDate": "2024-03-16",
    "vendorId": "clf...",
    "vendorName": "XYZ Supplier",
    "amount": 50000,
    "paymentMethod": "CHEQUE",
    "status": "DRAFT"
  }
}
```

#### PAYMENT_POSTED

Triggered when a payment is posted to the general ledger.

```json
{
  "event": "PAYMENT_POSTED",
  "timestamp": "2024-03-16T10:30:00.000Z",
  "data": {
    "id": "clf...",
    "paymentNo": "PAY-202403-0001",
    "postedAt": "2024-03-16T10:30:00.000Z",
    "journalEntryId": "clf..."
  }
}
```

### Journal Events

#### JOURNAL_ENTRY_POSTED

Triggered when a journal entry is posted.

```json
{
  "event": "JOURNAL_ENTRY_POSTED",
  "timestamp": "2024-03-16T10:30:00.000Z",
  "data": {
    "id": "clf...",
    "entryNo": "JV-202403-0001",
    "date": "2024-03-16",
    "description": "Monthly depreciation",
    "totalDebit": 100000,
    "totalCredit": 100000,
    "postedAt": "2024-03-16T10:30:00.000Z"
  }
}
```

### Customer Events

#### CUSTOMER_CREATED

Triggered when a new customer is created.

```json
{
  "event": "CUSTOMER_CREATED",
  "timestamp": "2024-03-16T10:30:00.000Z",
  "data": {
    "id": "clf...",
    "code": "CUST-001",
    "name": "ABC Company",
    "taxId": "1234567890123",
    "creditLimit": 1000000
  }
}
```

#### CUSTOMER_UPDATED

Triggered when a customer is modified.

```json
{
  "event": "CUSTOMER_UPDATED",
  "timestamp": "2024-03-16T10:30:00.000Z",
  "data": {
    "id": "clf...",
    "code": "CUST-001",
    "changes": ["creditLimit"],
    "oldValues": { "creditLimit": 500000 },
    "newValues": { "creditLimit": 1000000 }
  }
}
```

### Product Events

#### PRODUCT_CREATED

Triggered when a new product is created.

```json
{
  "event": "PRODUCT_CREATED",
  "timestamp": "2024-03-16T10:30:00.000Z",
  "data": {
    "id": "clf...",
    "code": "PROD-001",
    "name": "Product A",
    "type": "PRODUCT",
    "salePrice": 100000,
    "costPrice": 70000
  }
}
```

#### PRODUCT_UPDATED

Triggered when a product is modified.

```json
{
  "event": "PRODUCT_UPDATED",
  "timestamp": "2024-03-16T10:30:00.000Z",
  "data": {
    "id": "clf...",
    "code": "PROD-001",
    "changes": ["salePrice"],
    "oldValues": { "salePrice": 90000 },
    "newValues": { "salePrice": 100000 }
  }
}
```

### Inventory Events

#### STOCK_MOVEMENT

Triggered when stock is received, issued, or adjusted.

```json
{
  "event": "STOCK_MOVEMENT",
  "timestamp": "2024-03-16T10:30:00.000Z",
  "data": {
    "productId": "clf...",
    "productCode": "PROD-001",
    "productName": "Product A",
    "warehouseId": "clf...",
    "type": "ISSUE",
    "quantity": -10,
    "referenceId": "clf...",
    "referenceNo": "INV-202403-0001"
  }
}
```

Types: `RECEIVE`, `ISSUE`, `TRANSFER_IN`, `TRANSFER_OUT`, `ADJUST`

## Retry Policy

If your endpoint returns a non-2xx status code or times out, we will retry the
delivery:

- Maximum retries: 3
- Retry intervals: 1s, 2s, 4s (exponential backoff)

## Response Requirements

Your webhook endpoint should:

1. Return a 2xx status code within 30 seconds
2. Respond quickly (avoid processing the webhook payload synchronously)
3. Handle duplicate deliveries (use the `X-Webhook-ID` header for deduplication)

## Best Practices

1. **Verify signatures** - Always verify the webhook signature to ensure
   authenticity
2. **Process asynchronously** - Queue webhook payloads for background processing
3. **Handle retries** - Implement idempotent processing to handle duplicate
   deliveries
4. **Monitor failures** - Set up alerts for webhook delivery failures
5. **Use HTTPS** - Always use HTTPS endpoints for security

## Testing

You can test your webhook endpoint using the "Test" button in the webhook
management UI or by sending a test event:

```bash
curl -X POST https://your-api.com/webhook/test \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: test-signature" \
  -d '{
    "event": "TEST",
    "timestamp": "2024-03-16T10:30:00.000Z",
    "data": { "message": "Test webhook" }
  }'
```

## Support

For webhook-related issues, contact support at support@thaiaccounting.com
