# Receipt Amount Helper Feature - Implementation Plan

**Date**: 2026-04-16 **Status**: Ready to implement

---

## User Requirements

Based on user feedback, the receipt form needs:

1. **Quick-fill buttons** next to payment method area (there's free space)
2. **Three options**:
   - จ่ายเต็มจำนวน (Pay Full) - Auto-fill total unpaid amount
   - Pay for specific invoice - Dropdown to select invoice from unpaid list
   - Custom amount - Manual input
3. **Partial payment tracking** - Store each payment per invoice and show
   remaining balance

---

## Implementation Plan

### Phase 1: Component Layout Changes

**File**: `src/components/receipts/receipt-form.tsx`

**Current Layout** (around line 500-600):

```tsx
<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
  <div className="space-y-2">
    <Label>ผู้รับเงิน</Label>
    <Select>...</Select>
  </div>
  <div className="space-y-2">
    <Label>วิธีการชำระเงิน</Label>
    <Select>...</Select>
  </div>
</div>
```

**New Layout** - Add Quick-Fill Section:

```tsx
<div className="space-y-4">
  {/* Existing: Payer & Payment Method fields */}
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
    <div>...</div> {/* Payer */}
    <div>...</div> {/* Payment Method */}
  </div>

  {/* NEW: Amount Quick-Fill Section */}
  <Card className="border-blue-200 bg-blue-50">
    <CardHeader>
      <CardTitle className="text-base">จำนวนเงินที่ต้องการชำระเงิน</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="mb-3 flex flex-wrap gap-2">
        <Button
          variant="default"
          size="sm"
          onClick={handlePayFull}
          className="flex-1"
        >
          ฿1,070.00 จ่ายเต็มจำนวน
        </Button>

        <Select onValueChange={handleSelectInvoice}>
          <SelectTrigger className="flex-[2]">
            <SelectValue placeholder="เลือกใบแจ้ง/ใบวาซื้อ..." />
          </SelectTrigger>
          <SelectContent>
            {unpaidInvoices.map((invoice) => (
              <SelectItem key={invoice.id} value={invoice.id}>
                {invoice.invoiceNo} - ค้างจ่าย ฿
                {invoice.balance.toLocaleString()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="number"
          placeholder="ระบุกจำนวน"
          value={customAmount}
          onChange={(e) => setCustomAmount(e.target.value)}
          className="flex-[2]"
        />
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">ยอดรวมที่จะจ่าย:</span>
        <span className="text-lg font-semibold">
          ฿{totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
        </span>
      </div>
    </CardContent>
  </Card>

  {/* Existing: Amount Input (now read-only or calculated) */}
  <div className="space-y-2">
    <Label>จำนวนเงิน</Label>
    <Input type="number" value={totalAmount} readOnly className="bg-gray-100" />
  </div>
</div>
```

---

### Phase 2: State Management

**Add to** `src/components/receipts/receipt-form.tsx`:

```typescript
// New state variables
const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
const [customAmount, setCustomAmount] = useState<string>('');

// Calculate totals from unpaid invoices
const totalUnpaid = unpaidInvoices.reduce((sum, inv) => sum + inv.balance, 0);

// Handle "Pay Full" - sum all unpaid invoices
const handlePayFull = () => {
  setTotalAmount(totalUnpaid);
  // Add all unpaid invoices to allocations
  const allocations = unpaidInvoices.map((invoice) => ({
    invoiceId: invoice.id,
    invoiceNo: invoice.invoiceNo,
    amount: invoice.balance, // Full balance
    whtCategory: 'SERVICE',
    whtRate: 3,
    whtAmount: Math.round((invoice.balance * 3) / 100),
  }));
  form.setValue('allocations', allocations);
};

// Handle "Select Invoice" - fill that invoice's balance
const handleSelectInvoice = (invoiceId: string) => {
  const invoice = unpaidInvoices.find((inv) => inv.id === invoiceId);
  if (invoice) {
    setTotalAmount(invoice.balance);
    setSelectedInvoiceId(invoiceId);

    // Create allocation for just this invoice
    const allocation = {
      invoiceId: invoice.id,
      invoiceNo: invoice.invoiceNo,
      amount: invoice.balance,
      whtCategory: 'SERVICE',
      whtRate: 3,
      whtAmount: Math.round((invoice.balance * 3) / 100),
    };
    form.setValue('allocations', [allocation]);
  }
};

// Handle "Custom Amount"
const handleCustomAmount = (amount: string) => {
  setCustomAmount(amount);
  setTotalAmount(parseFloat(amount) || 0);
  // Don't pre-fill allocations - let user manually allocate
  form.setValue('allocations', []);
};
```

---

### Phase 3: Display Unpaid Invoices

The receipt form already fetches unpaid invoices. Show them in a table:

```tsx
<Card className="mt-4">
  <CardHeader>
    <CardTitle>ใบแจ้ง/ใบวาซื้อที่ค้างจ่าย</CardTitle>
  </CardHeader>
  <CardContent>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>เลขที่</TableHead>
          <TableHead>ค้างจ่าย</TableHead>
          <TableHead>วันครบกำหนด</TableHead>
          <TableHead>สถานะ</TableHead>
          <TableHead>จัดจ่าย</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {unpaidInvoices.map((invoice) => (
          <TableRow
            key={invoice.id}
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => handleSelectInvoice(invoice.id)}
          >
            <TableCell>{invoice.invoiceNo}</TableCell>
            <TableCell>
              ฿
              {invoice.balance.toLocaleString('th-TH', {
                minimumFractionDigits: 2,
              })}
            </TableCell>
            <TableCell>
              {invoice.dueDate
                ? new Date(invoice.dueDate).toLocaleDateString('th-TH')
                : '-'}
            </TableCell>
            <TableCell>
              <Badge>{getStatusBadge(invoice.status)}</Badge>
            </TableCell>
            <TableCell>
              <Input
                type="number"
                placeholder="ระบุก"
                defaultValue={invoice.balance}
                onBlur={(e) => {
                  const amount = parseFloat(e.target.value) || 0;
                  if (amount > 0) {
                    handleCustomAmount(amount.toString());
                  }
                }}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </CardContent>
</Card>
```

---

### Phase 4: Database Schema (No Changes Needed)

**Check**: Does `Receipt` model support partial payments?

Current schema (should already have):

- `amount` - Total receipt amount
- `invoiceId` - Optional linked invoice
- `allocations` - JSON field with payment breakdown

If `allocations` field doesn't exist, add it:

```prisma
model Receipt {
  // ... existing fields

  allocations Json?  // Store payment breakdown: [{ invoiceId, amount, date }]

  // ... other fields
}
```

---

### Phase 5: API Changes

**No API changes needed** - The receipt creation already supports:

- Total amount field
- Invoice linkages
- Payment allocations

**Verify POST /api/receipts** handles:

```typescript
{
  amount: number,           // Total receipt amount in Baht
  invoiceId?: string,      // Optional: Link to invoice
  allocations: [{        // Payment breakdown
    invoiceId: string,
    amount: number,
    paidAmount: number
  }]
}
```

---

## Files to Modify

1. **`src/components/receipts/receipt-form.tsx`**
   - Add quick-fill section
   - Add state management
   - Add unpaid invoice table
   - Add event handlers

2. **`src/app/api/receipts/route.ts`** (if needed)
   - Verify allocations field exists
   - Handle partial payment tracking

---

## Testing Checklist

- [ ] "จ่ายเต็มจำนวน" button sums all unpaid invoices
- [ ] Dropdown shows unpaid invoices from database
- [ ] Selecting invoice fills its balance amount
- [ ] Custom input allows any amount
- [ ] Receipt properly saves with selected allocations
- [ ] Partial payments are tracked correctly
- [ ] Invoice balances update after payment

---

## Benefits

1. **Faster data entry** - One-click to pay all debts
2. **Accuracy** - No manual calculation needed
3. **Flexibility** - Choose specific invoice or custom amount
4. **Transparency** - See which invoices you're paying
5. **History** - Track partial payments per invoice

---

## Implementation Priority

**Medium** - Improves UX but not critical

- Can be done alongside other tasks
- No database schema changes expected
- Component-only changes
- 1-2 hours implementation time

---

**Status**: ✅ Plan ready, awaiting approval
