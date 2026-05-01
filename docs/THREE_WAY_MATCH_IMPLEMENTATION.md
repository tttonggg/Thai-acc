# Three-Way Match Validation Implementation

## Overview

Added three-way match validation to the purchase invoice workflow in
`/Users/tong/Thai-acc/src/components/purchases/purchase-form.tsx`. This critical
P2P compliance feature validates:

- **PO Qty** (ordered) vs **GRN Qty** (received) vs **Invoice Qty** (billed)
- **Price variance** between PO and Invoice

## Implementation Details

### 1. New Types Added

```typescript
interface PurchaseOrderLine {
  id: string;
  lineNo: number;
  productId?: string;
  description: string;
  quantity: number;
  receivedQty: number;
  unit: string;
  unitPrice: number;
}

interface PurchaseOrder {
  id: string;
  orderNo: string;
  vendorId: string;
  lines: PurchaseOrderLine[];
}

interface ThreeWayMatchResult {
  lineId: string;
  poQty: number;
  grnQty: number;
  invoiceQty: number;
  poPrice: number;
  invoicePrice: number;
  qtyVariancePercent: number;
  priceVariancePercent: number;
  status: 'MATCH' | 'WARNING' | 'BLOCKED';
  qtyIssue: string;
  priceIssue: string;
}
```

### 2. New State Variables

- `selectedPO`: Stores the selected Purchase Order data
- `matchResults`: Array of three-way match validation results
- `overrideReason`: Reason for overriding blocked validations
- `showOverrideDialog`: Controls the override dialog visibility

### 3. Key Functions

#### `fetchPODetails(poNumber: string)`

- Fetches PO details from `/api/purchase-orders?orderNo={poNumber}`
- Pre-fills invoice lines with PO quantities (remaining to be invoiced)
- Automatically populates descriptions, units, and prices from PO

#### `calculateThreeWayMatch()`

- Calculates quantity variance: `|PO Qty - Invoice Qty| / PO Qty × 100`
- Calculates price variance: `|PO Price - Invoice Price| / PO Price × 100`
- Determines status for each line based on tolerance thresholds
- Updates `matchResults` state with validation data

#### `hasBlockedItems()` / `hasWarningItems()`

- Helper functions to check if any line has BLOCKED or WARNING status
- Used to control UI messaging and form submission

#### `getMatchStatusBadge(status)`

- Returns appropriate badge component for each status:
  - ✅ MATCH (green)
  - ⚠️ WARNING (yellow)
  - 🔴 BLOCKED (red)

### 4. Validation Rules

#### Quantity Variance

- **Warning**: > 5% difference
- **Block**: > 10% difference
- **Example**: PO 100 units, Invoice 95 units = 5% variance (Warning)

#### Price Variance

- **Warning**: > 3% difference
- **Block**: > 5% difference
- **Example**: PO ฿100/unit, Invoice ฿104/unit = 4% variance (Warning)

### 5. UI Components

#### Three-Way Match Validation Panel

```typescript
<Card> // Color-coded border: red (blocked), yellow (warning), green (match)
  <CardHeader>
    <CardTitle>📊 ตรวจสอบ 3-Way Match</CardTitle>
  </CardHeader>
  <CardContent>
    <Table>
      <TableHeader>
        PO Qty | GRN Qty | Invoice Qty | PO Price | Invoice Price | Status
      </TableHeader>
      <TableBody>
        {matchResults.map(result => (
          <TableRow className={status-based-bg-color}>
            {/* Display quantities, prices, variances, and status badges */}
          </TableRow>
        ))}
      </TableBody>
    </Table>

    {/* Validation messages */}
    {hasBlockedItems() && <Alert>Cannot save - exceeds tolerance</Alert>}
    {hasWarningItems() && <Alert>Warning - within tolerance range</Alert>}
    {!hasBlockedItems() && !hasWarningItems() && <Alert>All checks passed</Alert>}

    {/* Actions for blocked items */}
    {hasBlockedItems() && (
      <Button onClick={openOverrideDialog}>Request Override</Button>
      <Button onClick=notifyProcurement>Return to Vendor</Button>
    )}
  </CardContent>
</Card>
```

#### Override Dialog

- Modal dialog for entering override reason when items are blocked
- Requires text explanation before allowing submission
- Stores reason in invoice metadata for audit trail
- Shows warning that override requires higher-level approval

### 6. Form Submission Changes

#### Metadata Attachment

```typescript
const payload = {
  ...formData,
  lines: lines.map(...),
  metadata: {
    threeWayMatch: {
      purchaseOrderId: selectedPO?.id,
      purchaseOrderNo: formData.poNumber,
      matchResults,
      hasBlockedItems: hasBlockedItems(),
      hasWarningItems: hasWarningItems(),
      overrideReason: overrideReason || null,
      validatedAt: new Date().toISOString(),
    }
  }
}
```

#### Validation Check

- Form submission blocked if `hasBlockedItems()` is true AND no override reason
  provided
- Error message: "มีรายการที่ไม่ผ่านการตรวจสอบ 3-way match
  กรุณาระบุเหตุผลในการอนุมัติ"

### 7. User Workflow

#### Normal Flow (All Match)

1. User enters PO number
2. System fetches PO details and pre-fills lines
3. Three-way match panel shows ✅ green (all match)
4. User can submit immediately

#### Warning Flow

1. User enters quantities/prices with minor variances (5-10% qty, 3-5% price)
2. Panel shows ⚠️ yellow warnings
3. User can still submit after reviewing warnings
4. Metadata records warnings for future reference

#### Blocked Flow

1. User enters quantities/prices with major variances (>10% qty, >5% price)
2. Panel shows 🔴 red blocked status
3. User must either:
   - Click "ขออนุมัติพิเศษ" → Enter reason → Submit
   - Click "แจ้งฝ่ายจัดซื้อ" → Notify procurement team
4. Override reason stored in audit trail

### 8. Thai Language Support

All UI text is in Thai:

- "ตรวจสอบ 3-Way Match" = Three-Way Match Validation
- "ปริมาณ" = Quantity
- "ราคา" = Price
- "ขออนุมัติพิเศษ" = Request Override
- "แจ้งฝ่ายจัดซื้อ" = Notify Procurement

### 9. Database Schema Compatibility

The implementation stores three-way match data in the `metadata` JSON field of
`PurchaseInvoice` model:

```prisma
model PurchaseInvoice {
  // ... existing fields ...
  metadata Json? // Stores threeWayMatch object
}
```

No schema migration required.

### 10. Future Enhancements

Potential improvements:

- [ ] Add GRN selection (currently shows receivedQty from PO)
- [ ] Create dedicated GRN API endpoint
- [ ] Add approval workflow for overrides (requires approval chain)
- [ ] Email notifications to procurement team
- [ ] Variance tolerance configuration per vendor
- [ ] Historical variance reporting
- [ ] Integration with procurement module

## Testing Checklist

- [ ] Normal flow: Enter PO number → Lines auto-fill → All match → Submit
- [ ] Warning flow: Modify qty/price → Yellow warning → Still submit
- [ ] Blocked flow: Modify qty/price significantly → Red blocked → Enter
      override → Submit
- [ ] Blocked flow without override: Verify form cannot be submitted
- [ ] Verify metadata is saved correctly in database
- [ ] Test PO number not found scenario
- [ ] Test multiple lines with mixed statuses
- [ ] Verify Thai language displays correctly
- [ ] Test mobile responsiveness of validation panel

## Files Modified

- `/Users/tong/Thai-acc/src/components/purchases/purchase-form.tsx` (Main
  implementation)

## Files Referenced

- `/Users/tong/Thai-acc/prisma/schema.prisma` (Database schema)
- `/Users/tong/Thai-acc/src/components/goods-receipt-notes/grn-form.tsx`
  (Reference for PO integration)
- `/Users/tong/Thai-acc/src/components/purchase-orders/purchase-order-view-dialog.tsx`
  (Reference for PO structure)
