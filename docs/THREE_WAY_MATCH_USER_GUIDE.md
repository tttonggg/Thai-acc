# Three-Way Match Validation - User Guide

## What is Three-Way Match?

Three-way matching is a critical control in P2P (Procure-to-Pay) that ensures:

1. **PO (Purchase Order)** - What you ordered
2. **GRN (Goods Receipt Note)** - What you received
3. **Invoice** - What you're being billed for

All three should match. This prevents overpayment, fraud, and processing errors.

## How to Use

### Step 1: Create Purchase Invoice with PO

1. Navigate to **การซื้อ (Purchases)** → Click **+ สร้างใบซื้อใหม่**
2. Fill in vendor and document details
3. **Enter PO Number** in the "เลขที่ PO" field

### Step 2: System Auto-Fills Lines

When you enter a valid PO number:

- ✅ System fetches PO details automatically
- ✅ Lines are pre-filled with PO data
- ✅ Quantities default to "remaining to invoice" (PO Qty - Already Received)
- ✅ Prices are copied from PO

### Step 3: Review Three-Way Match Panel

A validation panel appears showing:

| Column      | Description                          |
| ----------- | ------------------------------------ |
| ลำดับ       | Line number                          |
| รายการ      | Item description                     |
| PO          | Quantity ordered                     |
| รับแล้ว     | Quantity already received (from GRN) |
| ใบซื้อ      | Quantity on this invoice             |
| สถานะปริมาณ | Quantity variance status             |
| ราคา PO     | Unit price from PO                   |
| ราคาใบซื้อ  | Unit price on invoice                |
| สถานะ       | Overall match status                 |

### Step 4: Understand Status Colors

#### 🟢 Green (✅ ตรงกัน) - All Match

- Quantity variance ≤ 5%
- Price variance ≤ 3%
- **Action**: You can save immediately

#### 🟡 Yellow (⚠️ แจ้งเตือน) - Warning

- Quantity variance: 5-10%
- Price variance: 3-5%
- **Action**: Review carefully, but you can still save

#### 🔴 Red (🔴 ระงับ) - Blocked

- Quantity variance > 10%
- Price variance > 5%
- **Action**: Must take corrective action

### Step 5: Handle Blocked Items

When blocked (red), you have two options:

#### Option A: Request Override (ขออนุมัติพิเศษ)

1. Click **📝 ขออนุมัติพิเศษ (Override)** button
2. Enter detailed reason:
   - Why the variance occurred
   - Supporting documentation references
   - Approval reference (if applicable)
3. Click **ยืนยันเหตุผล**
4. Now you can save the invoice

**Example reasons:**

- "ราคาปรับตามราคาตลาด อ้างอิงใบเสนอราคาใหม่ #XXX"
- "ปริมาณเปลี่ยนตามการตรวจสอบจริง แนบใบรับสินค้า #XXX"
- "Vendor แจ้งเปลี่ยนรุ่นสินค้า อ้างอิงอีเมลวันที่ XX/XX/XX"

#### Option B: Return to Vendor (แจ้งฝ่ายจัดซื้อ)

1. Click **📧 แจ้งฝ่ายจัดซื้อ (Return to Vendor)**
2. System will notify procurement team to:
   - Verify PO accuracy
   - Check GRN quantities
   - Contact vendor for clarification

## Variance Calculation Examples

### Quantity Variance

| PO Qty | GRN Qty | Invoice Qty | Variance | Status     |
| ------ | ------- | ----------- | -------- | ---------- |
| 100    | 100     | 100         | 0%       | ✅ Match   |
| 100    | 100     | 95          | 5%       | ⚠️ Warning |
| 100    | 100     | 92          | 8%       | ⚠️ Warning |
| 100    | 100     | 89          | 11%      | 🔴 Blocked |

**Formula**: `|PO Qty - Invoice Qty| ÷ PO Qty × 100`

### Price Variance

| PO Price | Invoice Price | Variance | Status     |
| -------- | ------------- | -------- | ---------- |
| ฿100     | ฿100          | 0%       | ✅ Match   |
| ฿100     | ฿103          | 3%       | ✅ Match   |
| ฿100     | ฿104          | 4%       | ⚠️ Warning |
| ฿100     | ฿106          | 6%       | 🔴 Blocked |

**Formula**: `|PO Price - Invoice Price| ÷ PO Price × 100`

## Best Practices

### ✅ DO

- Always enter PO number when available
- Review warnings carefully before saving
- Provide detailed override reasons with documentation references
- Contact vendor if discrepancies are unclear
- Keep audit trail complete (no vague reasons like "ตกลงแล้ว")

### ❌ DON'T

- Don't override without investigating the variance
- Don't use generic override reasons ("อนุมัติแล้ว", "OK")
- Don't ignore warning messages (even if you can still save)
- Don't bypass the system by not entering PO number

## Common Scenarios

### Scenario 1: Partial Shipment

**Situation**: PO for 100 units, received 80 units (2 shipments of 40 each)

**First Invoice (40 units)**:

- PO Qty: 100
- GRN Qty: 40
- Invoice Qty: 40
- Variance: 40% vs PO → **Yellow Warning**
- **Action**: Accept and invoice (partial shipment is normal)

**Second Invoice (40 units)**:

- PO Qty: 100
- GRN Qty: 80
- Invoice Qty: 40
- Variance: Still within tolerance
- **Action**: Accept and invoice

**Note**: System tracks total received, not per invoice

### Scenario 2: Price Change

**Situation**: Vendor increases price due to market conditions

**Invoice shows**:

- PO Price: ฿100
- Invoice Price: ฿107
- Variance: 7% → **Red Blocked**

**Actions**:

1. Check if vendor provided price increase notice
2. Verify with procurement team
3. If approved, use override with reason:
   - "Vendor แจ้งขึ้นราคา อ้างอิงอีเมลวันที่ 14/04/2026
     อนุมัติโดยผู้จัดการฝ่ายจัดซื้อ"

### Scenario 3: Quantity Discrepancy

**Situation**: Vendor ships different quantity than ordered

**Invoice shows**:

- PO Qty: 100
- Invoice Qty: 110 (vendor sent extra)
- Variance: 10% → **Red Blocked**

**Actions**:

1. Check if extra units were actually received
2. Verify GRN quantity matches invoice
3. If correct, use override:
   - "Vendor ส่งสินค้าเกิน 10 หน่วย ตามใบรับสินค้า #XXX"
4. Consider updating PO to match actual quantity

## Troubleshooting

### Q: Panel doesn't appear when I enter PO number

**A**: Check that:

- PO number is correct (try searching in PO list)
- PO status is "OPEN" (not fully received/closed)
- Vendor on invoice matches vendor on PO

### Q: Can't see GRN Qty column

**A**: This is expected if:

- GRN module hasn't been implemented yet
- Shows receivedQty directly from PO instead
- System uses PO's receivedQty field

### Q: Override reason keeps getting rejected

**A**: Ensure:

- Reason is detailed (not just "OK")
- Includes reference numbers or dates
- Explains WHY variance occurred
- You have authority to approve overrides

### Q: Variance calculation seems wrong

**A**: Check:

- System calculates variance vs PO, not vs GRN
- Percentages are relative to PO values
- Price variance is per-unit, not total

## Audit & Compliance

All three-way match data is stored in invoice metadata:

```json
{
  "threeWayMatch": {
    "purchaseOrderId": "po_123",
    "purchaseOrderNo": "PO202603-001",
    "matchResults": [...],
    "hasBlockedItems": false,
    "hasWarningItems": true,
    "overrideReason": null,
    "validatedAt": "2026-04-14T10:30:00Z"
  }
}
```

**Access this data for**:

- Internal audit reports
- Vendor performance analysis
- Process improvement insights
- Compliance verification

## Configuration

**Current Tolerance Settings** (can be customized per vendor in future):

| Metric            | Warning | Block |
| ----------------- | ------- | ----- |
| Quantity Variance | > 5%    | > 10% |
| Price Variance    | > 3%    | > 5%  |

## Support

For questions or issues:

1. Check this guide first
2. Contact procurement team for PO/GRN issues
3. Contact IT team for system issues
4. Refer to `/THREE_WAY_MATCH_IMPLEMENTATION.md` for technical details

## Related Documentation

- [Three-Way Match Implementation Details](./THREE_WAY_MATCH_IMPLEMENTATION.md)
- [Purchase Order User Guide](./docs/purchase-orders.md)
- [Accounts Payable Workflow](./docs/accounts-payable.md)
