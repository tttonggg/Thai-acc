# Purchase Request & Purchase Order E2E Tests

## Overview

ชุดทดสอบ E2E สำหรับระบบ Purchase Request (PR) และ Purchase Order (PO) ใน Thai
Accounting ERP

## Test Files

| File                                       | Description                                |
| ------------------------------------------ | ------------------------------------------ |
| `purchase-workflow.spec.ts`                | Main test file with all PR/PO test cases   |
| `helpers/purchase-helpers.ts`              | Reusable helper functions and API wrappers |
| `../tests/pages/purchase-requests.page.ts` | Page Object Model for PR module            |
| `../tests/pages/purchase-orders.page.ts`   | Page Object Model for PO module            |

## Test Coverage

### Purchase Request Tests

| Test ID    | Description                                 |
| ---------- | ------------------------------------------- |
| `[PR-001]` | Create new Purchase Request with line items |
| `[PR-002]` | Submit PR for approval                      |
| `[PR-003]` | Approve Purchase Request                    |
| `[PR-004]` | Reject Purchase Request                     |
| `[PR-005]` | Convert approved PR to PO                   |

### Purchase Order Tests

| Test ID    | Description               |
| ---------- | ------------------------- |
| `[PO-001]` | Create new Purchase Order |
| `[PO-002]` | Submit PO to vendor       |
| `[PO-003]` | Confirm Purchase Order    |
| `[PO-004]` | Mark PO as shipped        |
| `[PO-005]` | Receive PO items          |
| `[PO-006]` | Cancel Purchase Order     |

### Workflow Tests

| Test ID          | Description                |
| ---------------- | -------------------------- |
| `[WORKFLOW-001]` | Complete PR to PO workflow |

### Validation Tests

| Test ID            | Description                     |
| ------------------ | ------------------------------- |
| `[VALIDATION-001]` | PR line item calculations       |
| `[VALIDATION-002]` | PO status transition validation |

### Error Handling Tests

| Test ID       | Description                  |
| ------------- | ---------------------------- |
| `[ERROR-001]` | Create PR without line items |
| `[ERROR-002]` | Create PO without vendor     |

### Filter & Search Tests

| Test ID        | Description                 |
| -------------- | --------------------------- |
| `[FILTER-001]` | Filter PR by status         |
| `[SEARCH-001]` | Search for Purchase Request |

## Running the Tests

### Run all purchase workflow tests:

```bash
npx playwright test e2e/purchase-workflow.spec.ts
```

### Run specific test:

```bash
npx playwright test e2e/purchase-workflow.spec.ts --grep "[PR-001]"
```

### Run with UI mode:

```bash
npx playwright test e2e/purchase-workflow.spec.ts --ui
```

### Run with headed browser:

```bash
npx playwright test e2e/purchase-workflow.spec.ts --headed
```

## Test Data

Tests use unique test data generated with timestamps to avoid conflicts:

```typescript
const uniqueData = generateUniqueData('PR-001');
// Result: { reason: "PR-001 - ทดสอบ 1234567890", description: "สินค้าทดสอบ PR-001 1234567890" }
```

## API Helpers

The helper file provides convenient API functions:

```typescript
// Create test data
const vendor = await createTestVendor(page.request);
const product = await createTestProduct(page.request);

// PR operations
const pr = await createPurchaseRequestViaAPI(page.request, data);
await submitPRViaAPI(page.request, pr.id);
await approvePRViaAPI(page.request, pr.id);
await rejectPRViaAPI(page.request, pr.id, 'Reason');

// PO operations
const po = await createPurchaseOrderViaAPI(page.request, data);
await confirmPOViaAPI(page.request, po.id);
await shipPOViaAPI(page.request, po.id);
await receivePOViaAPI(page.request, po.id, receivedItems);
await cancelPOViaAPI(page.request, po.id, 'Reason');
```

## Page Object Models

### PurchaseRequestsPage

```typescript
const prPage = new PurchaseRequestsPage(page);
await prPage.goto();
await prPage.clickCreate();
await prPage.fillForm({ reason: '...', priority: 'HIGH', lines: [...] });
await prPage.addLineItem({ description: '...', quantity: 10, unitPrice: 1000 });
await prPage.save();
await prPage.submitPR(requestNo);
await prPage.approvePR(requestNo);
await prPage.rejectPR(requestNo, 'Reason');
await prPage.convertToPO(requestNo, vendorId);
```

### PurchaseOrdersPage

```typescript
const poPage = new PurchaseOrdersPage(page);
await poPage.goto();
await poPage.clickCreate();
await poPage.fillForm({ vendorId: '...', lines: [...] });
await poPage.addLineItem({ description: '...', quantity: 5, unitPrice: 2000 });
await poPage.save();
await poPage.submitPO(orderNo);
await poPage.confirmPO(orderNo);
await poPage.shipPO(orderNo, { trackingNumber: '...' });
await poPage.receivePO(orderNo, [{ receivedQty: 10 }]);
await poPage.cancelPO(orderNo, 'Reason');
```

## Screenshots

Tests automatically capture screenshots at key steps:

- `test-results/pr-001-initial.png`
- `test-results/pr-001-create-dialog.png`
- `test-results/pr-001-filled-form.png`
- `test-results/pr-001-saved.png`
- `test-results/failed-[test-name].png` (on failure)

## Test Users

Tests use the standard test accounts:

| Role       | Email                         | Password |
| ---------- | ----------------------------- | -------- |
| ADMIN      | admin@thaiaccounting.com      | admin123 |
| ACCOUNTANT | accountant@thaiaccounting.com | acc123   |

## PR/PO Workflow States

### Purchase Request Status Flow:

```
DRAFT → PENDING → APPROVED → CONVERTED
             ↘ REJECTED
```

### Purchase Order Status Flow:

```
DRAFT → SENT → CONFIRMED → SHIPPED → RECEIVED → CLOSED
                           ↘ CANCELLED
```

## Environment Requirements

- Application running at `http://localhost:3000`
- Database seeded with test data
- Test vendor and product created via API

## Troubleshooting

### Test fails with "Unauthorized"

Make sure the test user exists in the database:

```bash
bun run seed:fresh
```

### Test fails with "Vendor/Product not found"

The tests create test data automatically. If this fails, check:

1. API endpoints are accessible
2. Database permissions are correct
3. Application is running properly

### Screenshots not saving

Ensure the `test-results` directory exists and is writable:

```bash
mkdir -p test-results
chmod 755 test-results
```
