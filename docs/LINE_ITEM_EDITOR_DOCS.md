# Line Item Editor Component

**Location**: `/Users/tong/Thai-acc/src/components/invoices/line-item-editor.tsx`

A comprehensive React component for editing invoice line items with full audit history tracking, validation, and Thai tax compliance.

## Features

### ✅ Core Features

1. **Dual Mode Editing**
   - **Inline Mode**: Edit directly in the table row with expandable form
   - **Dialog Mode**: Edit in a modal dialog (future enhancement)

2. **Real-time Validation**
   - Field-level validation on blur
   - Thai language error messages
   - Visual error indicators
   - Form-level validation before save

3. **Audit History Tracking**
   - Complete edit history for each line item
   - Before/after value comparison
   - Colored diff indicators (green = increase, red = decrease)
   - Change reason tracking
   - User attribution (who made the change)

4. **Thai Tax Compliance**
   - Only DRAFT invoices can be edited
   - Automatic VAT calculation
   - Discount handling (percentage)
   - Thai currency formatting (฿1,234.56)

5. **Unsaved Changes Protection**
   - Browser beforeunload warning
   - Confirmation dialog on cancel
   - Visual "unsaved changes" badge

6. **Accessibility**
   - ARIA labels on all inputs
   - Keyboard navigation support
   - Focus management
   - Screen reader friendly

## Props Interface

```typescript
interface LineItemEditorProps {
  line: InvoiceLineWithProduct           // The line item to edit
  invoiceId: string                      // Parent invoice ID
  invoiceStatus: InvoiceStatus           // DRAFT, ISSUED, PARTIAL, PAID, CANCELLED
  onUpdate: (lineId: string, data: LineUpdateData) => Promise<void>
  onDelete?: (lineId: string) => Promise<void>  // Optional delete handler
  canEdit: boolean                       // Permission check
  showAuditButton?: boolean              // Show audit history button (default: true)
  products?: Product[]                   // Available products for lookup
  editMode?: 'inline' | 'dialog'         // Editing mode (default: 'inline')
}
```

## Type Definitions

### InvoiceLineWithProduct

```typescript
interface InvoiceLineWithProduct {
  id: string
  lineNo: number                    // Line number (1, 2, 3, ...)
  description: string               // Product/service description
  quantity: number                  // Quantity (must be > 0)
  unit: string                      // Unit (ชิ้น, ชุด, กล่อง, etc.)
  unitPrice: number                 // Price per unit (>= 0)
  discount: number                  // Discount percentage (0-100)
  vatRate: number                   // VAT rate (0, 7, 10)
  vatAmount: number                 // Calculated VAT amount
  amount: number                    // Net amount (after discount)
  productId?: string | null
  product?: Product | null
  auditTrail?: AuditEntry[]         // Edit history
}
```

### AuditEntry

```typescript
interface AuditEntry {
  id: string
  action: string                    // CREATED, UPDATED, DELETED
  field?: string                    // Field that changed
  oldValue?: string | null
  newValue?: string | null
  beforeQuantity?: number | null
  afterQuantity?: number | null
  quantityDiff?: number | null
  beforeUnitPrice?: number | null
  afterUnitPrice?: number | null
  unitPriceDiff?: number | null
  beforeDiscount?: number | null
  afterDiscount?: number | null
  discountDiff?: number | null
  beforeDescription?: string | null
  afterDescription?: string | null
  changeReason?: string | null
  changedById: string
  changedByName?: string
  createdAt: Date | string
}
```

### LineUpdateData

```typescript
interface LineUpdateData {
  description?: string
  quantity?: number
  unit?: string
  unitPrice?: number
  discount?: number
  changeReason?: string            // Why the change was made
}
```

## Usage Example

```typescript
import { LineItemEditor } from '@/components/invoices/line-item-editor'

function InvoiceLineItems({ invoice, lines, onLineUpdate, onLineDelete }) {
  const canEdit = invoice.status === 'DRAFT' && user.role !== 'VIEWER'

  return (
    <div className="space-y-2">
      {lines.map((line) => (
        <LineItemEditor
          key={line.id}
          line={line}
          invoiceId={invoice.id}
          invoiceStatus={invoice.status}
          onUpdate={onLineUpdate}
          onDelete={onLineDelete}
          canEdit={canEdit}
          showAuditButton={true}
          products={products}
          editMode="inline"
        />
      ))}
    </div>
  )
}
```

## Component States

### 1. View Mode (Read-only)

Displays the line item with:
- Line number and description
- Product information (if linked)
- Quantity, unit, unit price
- Discount percentage
- Net amount and VAT
- Action buttons (Edit, Audit History, Delete)
- "แก้ไขแล้ว" badge if previously edited

### 2. Edit Mode (Inline)

Expands to show editing form with:
- All editable fields
- Real-time validation errors
- Calculated totals preview
- Change reason input
- Save/Cancel buttons
- "มีการเปลี่ยนแปลง" badge for unsaved changes

### 3. Audit History Dialog

Shows chronological history of:
- All changes made to the line item
- Before/after values with color coding
- Quantity/unit price differences (+/- indicators)
- User who made the change
- Timestamp (Thai date format)
- Change reason (if provided)

## Validation Rules

### Description
- Required field
- Cannot be empty or whitespace
- Error: "กรุณาระบุรายการสินค้า"

### Quantity
- Must be > 0
- Must be integer (no decimals)
- Error: "จำนวนต้องมากกว่า 0" or "จำนวนต้องเป็นจำนวนเต็ม"

### Unit Price
- Must be >= 0
- Can have decimals (0.01 precision)
- Error: "ราคาต่อหน่วยต้องไม่ติดลบ"

### Discount
- Must be between 0-100%
- Integer values only
- Error: "ส่วนลดต้องไม่ติดลบ" or "ส่วนลดต้องไม่เกิน 100%"

## Thai Language Support

### Field Labels
- รายการสินค้า (Description)
- จำนวน (Quantity)
- หน่วย (Unit)
- ราคาต่อหน่วย (Unit Price)
- ส่วนลด (Discount)
- จำนวนเงิน (Amount)
- เหตุผลการแก้ไข (Change Reason)

### Error Messages
All validation errors displayed in Thai with clear, actionable messages.

### Date Formatting
Uses `formatThaiDate()` to display dates in Thai Buddhist calendar format (DD/MM/YYYY + 543).

### Currency Formatting
Uses `formatCurrency()` for Thai Baht formatting (฿ symbol, 2 decimal places).

## Audit Trail Features

### Visual Indicators
- **Green text**: Value increased (quantity, unit price)
- **Red text**: Value decreased (quantity, unit price)
- **Red text**: Discount increased (bad for revenue)
- **Green text**: Discount decreased (good for revenue)
- **Strikethrough**: Original value before change
- **Arrow (→)**: Visual separator between old/new

### Audit Entry Display
```typescript
// Example audit entry for quantity change
{
  action: "UPDATED",
  field: "quantity",
  beforeQuantity: 10,
  afterQuantity: 15,
  quantityDiff: 5,
  changedById: "user-123",
  changedByName: "สมชาย ใจดี",
  createdAt: "2026-03-18T10:30:00Z",
  changeReason: "ลูกค้าขอเพิ่มจำนวน"
}

// Displays as:
// แก้ไข | จำนวน
// 10 → 15 (+5)
// โดย: สมชาย ใจดี | เหตุผล: ลูกค้าขอเพิ่มจำนวน
```

## API Integration

### GET /api/invoices/[id]/lines/[lineId]
Fetches line item with audit trail:
```typescript
const response = await fetch(`/api/invoices/${invoiceId}/lines/${lineId}`)
const data = await response.json()
// Returns: { success: true, data: { ...line, auditTrail: [...] } }
```

### PUT /api/invoices/[id]/lines/[lineId]
Updates line item with audit logging:
```typescript
const response = await fetch(`/api/invoices/${invoiceId}/lines/${lineId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    description: 'New description',
    quantity: 10,
    unitPrice: 100,
    discount: 0,
    changeReason: 'Customer requested change'
  })
})
```

### DELETE /api/invoices/[id]/lines/[lineId]
Deletes line item (only for DRAFT invoices):
```typescript
const response = await fetch(`/api/invoices/${invoiceId}/lines/${lineId}`, {
  method: 'DELETE'
})
```

## Permission Checks

### Role-Based Access
- **ADMIN**: Can edit any invoice
- **ACCOUNTANT**: Can edit own invoices
- **USER**: Can edit own invoices
- **VIEWER**: Read-only (cannot edit)

### Status-Based Access
- **DRAFT**: Full edit access
- **ISSUED/PARTIAL/PAID**: Read-only (Thai tax compliance)
- **CANCELLED**: Read-only

### IDOR Protection
Component verifies:
- User owns the invoice (or is ADMIN)
- Invoice exists
- Line belongs to invoice
- Invoice is in DRAFT status (for edits)

## Calculations

### Amount Calculation
```typescript
beforeDiscount = quantity × unitPrice
discountAmount = beforeDiscount × (discount / 100)
afterDiscount = beforeDiscount - discountAmount
amount = afterDiscount  // Net amount
```

### VAT Calculation
```typescript
vatAmount = amount × (vatRate / 100)
total = amount + vatAmount
```

## Accessibility Features

### ARIA Labels
All inputs have descriptive `aria-label` attributes for screen readers.

### Keyboard Navigation
- Tab: Navigate between fields
- Enter: Save (when focused on Save button)
- Escape: Cancel edit
- Space: Toggle buttons

### Focus Management
- Focus moves to first input when entering edit mode
- Focus returns to Edit button after cancel
- Loading states prevent interaction during saves

## Best Practices

### When to Use
- Editing invoice line items in detail views
- Invoice edit forms with line item tables
- Audit trail review screens

### When NOT to Use
- Quick inline edits (use simpler component)
- Bulk editing multiple lines (use batch editor)
- Read-only display (use simpler display component)

### Performance Considerations
- Audit history fetched only when dialog opens
- Form state reset when line changes
- Validation debounced on field change
- Calculations memoized with useCallback

## Future Enhancements

### Planned Features
- [ ] Dialog mode for complex edits
- [ ] Product lookup with autocomplete
- [ ] Bulk editing multiple lines
- [ ] Copy line to new line
- [ ] Undo last edit
- [ ] Line item templates
- [ ] Advanced validation rules
- [ ] Integration with inventory system

### Stretch Goals
- [ ] Inline diff editor for description changes
- [ ] Rich text description support
- [ ] Line item attachments
- [ ] Line item notes/comments
- [ ] Approval workflow for edits
- [ ] Line item versioning

## Troubleshooting

### Issue: "Save button disabled"
**Cause**: Validation errors present
**Solution**: Fix validation errors (highlighted in red)

### Issue: "Cannot edit this invoice"
**Cause**: Invoice not in DRAFT status or user lacks permission
**Solution**: Ensure invoice.status === 'DRAFT' and user has edit permission

### Issue: "Audit history not loading"
**Cause**: API error or network issue
**Solution**: Check browser console and network tab for errors

### Issue: "Unsaved changes warning appears"
**Cause**: User made edits but didn't save
**Solution**: Save changes or click Cancel with confirmation

## Testing

### Manual Testing Checklist
- [ ] Edit description
- [ ] Edit quantity (valid and invalid)
- [ ] Edit unit price (valid and invalid)
- [ ] Edit discount (valid and invalid)
- [ ] Change unit
- [ ] View audit history
- [ ] Save with errors
- [ ] Save successfully
- [ ] Cancel with unsaved changes
- [ ] Cancel without changes
- [ ] Delete line item
- [ ] Try to edit ISSUED invoice (should fail)

### E2E Test Scenarios
```typescript
test('should edit line item successfully', async () => {
  await page.click('[data-testid="edit-line-1"]')
  await page.fill('[data-testid="line-description"]', 'Updated description')
  await page.fill('[data-testid="line-quantity"]', '10')
  await page.click('[data-testid="save-line"]')
  await expect(page.locator('text=บันทึกสำเร็จ')).toBeVisible()
})

test('should show validation errors', async () => {
  await page.click('[data-testid="edit-line-1"]')
  await page.fill('[data-testid="line-quantity"]', '0')
  await page.blur('[data-testid="line-quantity"]')
  await expect(page.locator('text=จำนวนต้องมากกว่า 0')).toBeVisible()
})

test('should display audit history', async () => {
  await page.click('[data-testid="audit-line-1"]')
  await expect(page.locator('text=ประวัติการแก้ไข')).toBeVisible()
  await expect(page.locator('[data-testid="audit-entry"]')).toHaveCount(3)
})
```

## Dependencies

### UI Components
- `@/components/ui/button`
- `@/components/ui/input`
- `@/components/ui/label`
- `@/components/ui/badge`
- `@/components/ui/dialog`
- `@/components/ui/select`

### Utilities
- `@/hooks/use-toast`
- `@/lib/thai-accounting` (formatThaiDate, formatCurrency)

### Icons
- `lucide-react`: Pencil, Save, X, History, Loader2, AlertCircle, CheckCircle2, Trash2

## License

This component is part of the Thai Accounting ERP System and follows the same license.

## Support

For issues or questions:
1. Check this documentation
2. Review the API route: `/api/invoices/[id]/lines/[lineId]/route.ts`
3. Check validation schemas: `/lib/validations.ts`
4. Review audit service: `/lib/audit-service.ts`

---

**Last Updated**: 2026-03-18
**Component Version**: 1.0.0
**Status**: Production Ready ✅
