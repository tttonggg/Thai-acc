# Invoice Form Component - Documentation

## Overview

The Invoice Form component (`/src/components/invoices/invoice-form.tsx`) is a comprehensive form for creating sales documents in the Thai Accounting ERP system. It supports multiple document types including Tax Invoices, Receipts, Delivery Orders, Credit Notes, and Debit Notes.

## Features Implemented

### 1. Form Fields

#### Customer Information
- **Customer Selection** (Required)
  - Dropdown populated from `/api/customers`
  - Displays customer code, name, and tax ID
  - Validation: Customer must be selected

- **Document Date**
  - Date picker with Thai format support
  - Defaults to today's date
  - Maximum date is today (cannot create future-dated documents)

- **Document Type**
  - Tax Invoice (ใบกำกับภาษี)
  - Receipt (ใบเสร็จรับเงิน)
  - Delivery Note (ใบส่งของ)
  - Credit Note (ใบลดหนี้)
  - Debit Note (ใบเพิ่มหนี้)

#### Reference Information
- **Reference Number** (Optional)
- **Purchase Order Number** (Optional)

#### Line Items (Dynamic)
Each line item includes:
- **Product Selection** (Optional)
  - Dropdown from `/api/products`
  - Auto-fills description, unit, and price
- **Description** (Required)
  - Manual input field
- **Quantity** (Required)
  - Must be > 0
  - Integer values supported
- **Unit**
  - Predefined options: ชิ้น, ชุด, กล่อง, แพ็ค, kg, ลิตร, เมตร, ครั้ง
- **Unit Price** (Required)
  - Must be >= 0
  - Supports 2 decimal places
- **Discount** (Optional)
  - Percentage-based (0-100%)
- **VAT Rate**
  - Options: 0%, 7%, 10%
  - Defaults to 7%
- **Line Total**
  - Auto-calculated: (Quantity × Price) - Discount

#### Totals Section
- **Subtotal**: Sum of all line totals
- **Discount**: Percentage or fixed amount
- **VAT**: Auto-calculated based on line VAT rates
- **Grand Total**: Subtotal - Discount + VAT
- **Withholding Tax** (Optional)
  - Rates: 0%, 1%, 3%, 5%
  - Deducted from grand total
- **Net Total**: Grand total - Withholding tax

#### Additional Information
- **Withholding Tax Rate** (Optional)
- **Notes** (Optional)

### 2. API Integration

#### Endpoints Used

1. **GET `/api/customers`**
   - Fetches active customers for dropdown
   - Returns: `{ success: true, data: Customer[] }`

2. **GET `/api/products`**
   - Fetches products for selection
   - Returns: `{ success: true, data: Product[] }`

3. **GET `/api/invoices/next-number?type={type}`**
   - Generates next invoice number based on type
   - Format: `{PREFIX}-{YYYYMM}-{####}`
   - Example: `INV-202603-0001`

4. **POST `/api/invoices`**
   - Creates new invoice
   - Payload:
     ```typescript
     {
       invoiceDate: string
       customerId: string
       type: 'TAX_INVOICE' | 'RECEIPT' | 'DELIVERY_NOTE' | 'CREDIT_NOTE' | 'DEBIT_NOTE'
       reference?: string
       poNumber?: string
       discountAmount: number
       discountPercent: number
       withholdingRate: number
       notes?: string
       lines: Array<{
         productId?: string
         description: string
         quantity: number
         unit: string
         unitPrice: number
         discount: number
         vatRate: number
         vatAmount: number
         amount: number
       }>
     }
     ```

### 3. Validation

#### Field-Level Validation
- **Customer**: Required selection
- **At least 1 line item**: Required
- **Line Item Description**: Required, cannot be empty
- **Quantity**: Must be > 0
- **Unit Price**: Must be >= 0
- **Thai Tax ID**: 13 digits if provided (backend validation)

#### Form-Level Validation
- All required fields must be filled
- At least one line item must exist
- Line items must have valid quantities and prices
- Customer must be selected

### 4. UI Components Used

```tsx
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
```

### 5. Thai Language Support

All UI text is in Thai:
- Labels: "ลูกค้า", "วันที่เอกสาร", "รายการสินค้า/บริการ"
- Buttons: "บันทึก", "ยกเลิก", "เพิ่มรายการ"
- Error messages: "กรุณาเลือกลูกค้า", "จำนวนต้องมากกว่า 0"
- Currency format: ฿1,234.56 (Thai Baht)

### 6. Automatic Calculations

```typescript
// Line total calculation
beforeDiscount = quantity × unitPrice
discountAmount = beforeDiscount × (discountPercent / 100)
afterDiscount = beforeDiscount - discountAmount
vatAmount = afterDiscount × (vatRate / 100)
lineTotal = afterDiscount

// Document totals
subtotal = sum of all line totals
totalVat = sum of all line VAT amounts
grandTotal = (subtotal - discount) + totalVat
withholdingAmount = grandTotal × (withholdingRate / 100)
netTotal = grandTotal - withholdingAmount
```

### 7. Responsive Design

- **Mobile**: Stacked layout, full-width inputs
- **Desktop**: Grid layout, optimized spacing
- **Dialog**: Max width 6xl, scrollable content
- **Table**: Responsive grid for line items

### 8. User Experience Features

#### Loading States
- Initial data fetch (customers, products, invoice number)
- Form submission (disabled state with spinner)
- Visual feedback during all async operations

#### Error Handling
- Field-level error messages
- Toast notifications for success/error
- Form-level validation summaries
- API error handling with fallbacks

#### Accessibility
- Proper ARIA labels
- Keyboard navigation support
- Focus management on dialog open/close
- Screen reader friendly

### 9. Component Props

```typescript
interface InvoiceFormProps {
  open: boolean                    // Dialog open state
  onClose: () => void             // Close handler
  onSuccess: () => void           // Success callback (refresh list)
  defaultType?: 'TAX_INVOICE' | 'RECEIPT' | 'DELIVERY_NOTE' | 'CREDIT_NOTE' | 'DEBIT_NOTE'
}
```

### 10. Integration Example

```tsx
import { InvoiceForm } from '@/components/invoices/invoice-form'

function InvoicePage() {
  const [isOpen, setIsOpen] = useState(false)
  const [invoiceType, setInvoiceType] = useState('TAX_INVOICE')

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        สร้างเอกสารใหม่
      </Button>

      <InvoiceForm
        open={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={() => {
          // Refresh invoice list
          console.log('Invoice created successfully')
        }}
        defaultType={invoiceType}
      />
    </>
  )
}
```

## Files Created/Modified

### Created Files
1. `/src/components/invoices/invoice-form.tsx` - Main form component
2. `/src/app/api/products/route.ts` - Products API endpoint
3. `/src/app/api/invoices/next-number/route.ts` - Invoice number generator

### Modified Files
1. `/src/components/invoices/invoice-list.tsx` - Integrated form component
2. `/src/app/api/reports/trial-balance/route.ts` - Fixed syntax error

## Usage Flow

1. **User clicks "สร้างเอกสารใหม่" (Create New Document)**
2. **Document type selection dialog appears**
3. **User selects document type**
4. **Invoice form dialog opens with:**
   - Pre-fetched customers, products
   - Auto-generated invoice number
   - Default date (today)
5. **User fills in form:**
   - Selects customer (required)
   - Adds line items (at least 1 required)
   - Adjusts discounts, VAT rates
   - Adds optional notes
6. **Real-time calculations update totals**
7. **User clicks "บันทึก" (Save)**
8. **Validation runs:**
   - All required fields checked
   - Business rules validated
9. **If valid:**
   - POST to `/api/invoices`
   - Success toast shown
   - Dialog closes
   - List refreshes
10. **If invalid:**
    - Error messages displayed
    - Form remains open for correction

## Testing Checklist

- [ ] Customer selection works
- [ ] Product selection auto-fills fields
- [ ] Add/remove line items
- [ ] Calculations update correctly
- [ ] VAT rates apply correctly
- [ ] Discount calculations work
- [ ] Withholding tax calculations work
- [ ] Form validation prevents invalid submissions
- [ ] API integration works end-to-end
- [ ] Toast notifications display correctly
- [ ] Responsive design on mobile
- [ ] Keyboard navigation works
- [ ] Loading states display correctly
- [ ] Error handling works properly

## Future Enhancements

Potential improvements for later iterations:
- [ ] Edit existing invoices
- [ ] Save as draft
- [ ] Line item templates
- [ ] Quick add product
- [ ] Attach files/attachments
- [ ] Preview before save
- [ ] Clone from previous invoice
- [ ] Batch line item import
- [ ] Advanced pricing rules
- [ ] Multi-currency support
