# Receipts Module - Quick Start Guide

## Setup Instructions

### 1. Update Database Schema

First, push the schema changes to your database:

```bash
# Option 1: Push schema without migration
npx prisma db push

# Option 2: Create and run migration
npx prisma migrate dev --name add_receipt_allocations
```

### 2. Create Receipts Page

Create `/Users/tong/Thai-acc/src/app/receipts/page.tsx`:

```tsx
import { ReceiptList } from '@/components/receipts'

export default function ReceiptsPage() {
  return <ReceiptList />
}
```

### 3. Add Navigation Menu Item

Update the sidebar menu in `/Users/tong/Thai-acc/src/app/page.tsx`:

Add to the `getMenuItems()` function:

```typescript
{
  title: 'ใบเสร็จรับเงิน',
  href: '/receipts',
  icon: DollarSign,
  roles: ['ADMIN', 'ACCOUNTANT', 'USER'],
},
```

### 4. Restart Development Server

```bash
npm run dev
# or
bun run dev
```

## Usage Guide

### Creating a New Receipt

1. **Navigate to Receipts Page**
   - Click "ใบเสร็จรับเงิน" in the sidebar

2. **Click "รับเงินใหม่" Button**
   - Opens the receipt form

3. **Fill in Payment Details:**
   - **วันที่รับเงิน**: Select date (default: today)
   - **ลูกค้า**: Select customer from dropdown
   - **วิธีการชำระเงิน**: Choose payment method
     - เงินสด (Cash)
     - โอนเงิน (Transfer) - requires bank account
     - เช็ค (Cheque) - requires bank account and cheque number
     - บัตรเครดิต (Credit Card)
     - อื่นๆ (Other)
   - **จำนวนเงินรับโดยสิ้นเชิง**: Enter total amount received
   - **หมายเหตุ**: Optional notes

4. **Allocate to Invoices:**
   - Unpaid invoices will appear in the allocation table
   - Click "+" button to allocate to an invoice
   - Enter allocation amount (cannot exceed invoice balance)
   - Set WHT rate if applicable (0%, 1%, 3%, 5%)
   - WHT amount is calculated automatically
   - Click "จัดจ่ายอัตโนมัติ" to auto-allocate to oldest invoices

5. **Review Summary:**
   - Check total allocations don't exceed received amount
   - Verify unallocated amount (customer credit)
   - Review WHT amounts

6. **Save Receipt:**
   - Click "บันทึก" to save as draft
   - Receipt will be created with auto-generated number (RCP-YYYYMM-####)

### Posting a Receipt (Creating Journal Entry)

1. **From Receipt List:**
   - Find the draft receipt
   - Click the green checkmark icon

2. **From Receipt View:**
   - Click "View" (eye icon)
   - Click "ลงบัญชี" button

3. **What Happens:**
   - Journal entry is created automatically
   - Invoice balances are updated
   - Invoice statuses are updated (Partial/Paid)
   - Receipt status changes to POSTED
   - Can no longer edit or delete

### Viewing Receipt Details

1. Click the "View" (eye icon) on any receipt
2. See all payment details
3. View invoice allocations
4. Check journal entry reference (if posted)
5. Download as HTML for printing

### Downloading/Printing Receipt

1. Click the "Download" icon on any receipt
2. HTML file will be downloaded
3. Open in browser and print to PDF
4. Professional Thai receipt format

### Editing Receipt (Draft Only)

1. Only draft receipts can be edited
2. Click "View" to open receipt
3. Make changes (if edit functionality is needed, add to view dialog)
4. Save changes
5. Note: Allocations can be modified

### Deleting Receipt (Draft Only)

1. Only draft receipts can be deleted
2. Click "View" to open receipt
3. Click "ลบ" (delete) button
4. Confirm deletion
5. Receipt and allocations are permanently deleted

## Common Workflows

### Workflow 1: Full Payment for Single Invoice

1. Create receipt for customer
2. Select payment method and enter full invoice amount
3. Allocate to invoice (set amount = invoice balance)
4. Save receipt
5. Post receipt
6. Invoice status automatically changes to PAID

### Workflow 2: Partial Payment

1. Create receipt for customer
2. Enter partial payment amount
3. Allocate to invoice (set amount < invoice balance)
4. Save receipt
5. Post receipt
6. Invoice status changes to PARTIAL

### Workflow 3: Payment with WHT Deduction

1. Create receipt for customer
2. Enter total amount received
3. Allocate to invoice
4. Set WHT rate (e.g., 3% for services)
5. WHT amount calculated automatically
6. Receipt creates WHT payable credit
7. Post receipt

### Workflow 4: Multiple Invoice Payment

1. Create receipt for customer
2. Enter total amount
3. Click "จัดจ่ายอัตโนมัติ" or manually allocate
4. Allocate to multiple invoices
5. WHT can be set per invoice
6. Save and post

### Workflow 5: Customer Credit (Unallocated)

1. Create receipt for customer
2. Enter amount received
3. Don't allocate to any invoices (or allocate partial amount)
4. Remaining amount shows as "เครดิตคงเหลือ"
5. Save and post
6. Customer has credit for future payments

## Validation Rules

### Payment Method Validation
- **CASH**: No additional fields required
- **TRANSFER**: Bank account required
- **CHEQUE**: Bank account + cheque number required
- **CREDIT**: No additional fields
- **OTHER**: No additional fields

### Allocation Validation
- Total allocations ≤ Received amount
- Allocation amount ≤ Invoice balance
- WHT rate: 0-100%
- WHT amount = Allocation amount × WHT rate / 100

### Status Rules
- **DRAFT**: Can be edited, deleted, posted
- **POSTED**: Cannot be edited or deleted
- **CANCELLED**: Cannot be edited or deleted

## GL Accounts Used

When posting a receipt, the following GL accounts are used:

| Account Type | Account Code | Account Name | Notes |
|--------------|--------------|--------------|-------|
| Debit | 1110 | เงินสด | For CASH payments |
| Debit | Bank GL | บัญชีธนาคาร | For TRANSFER/CHEQUE payments |
| Credit | 1120 | ลูกหนี้การค้า | For each invoice allocation |
| Credit | 2130 | ภาษีหัก ณ ที่จ่าย | If any WHT deducted |

## Troubleshooting

### Issue: Cannot see unpaid invoices
- **Solution**: Make sure customer has unpaid invoices with ISSUED or PARTIAL status

### Issue: Cannot allocate more than balance
- **Solution**: This is by design. Allocation cannot exceed invoice balance

### Issue: Total allocation exceeds received amount
- **Solution**: Reduce allocations or increase received amount

### Issue: Cannot post receipt
- **Solution**: Ensure at least one allocation is present

### Issue: Bank account dropdown empty
- **Solution**: Create bank accounts first via Bank Account module

### Issue: Receipt number already exists
- **Solution**: Auto-generation should prevent this. Check database for duplicates

## Testing Checklist

- [ ] Create cash receipt for single invoice
- [ ] Create transfer receipt for multiple invoices
- [ ] Create cheque receipt with cheque details
- [ ] Test WHT deduction (3%, 5%)
- [ ] Test partial payment
- [ ] Test auto-allocate functionality
- [ ] Post receipt and verify journal entry
- [ ] Check invoice balance updates
- [ ] Check invoice status changes
- [ ] Test customer credit (unallocated)
- [ ] Download and view receipt HTML
- [ ] Try editing draft receipt
- [ ] Try deleting draft receipt
- [ ] Verify posted receipt cannot be edited/deleted

## API Endpoints Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/receipts` | List all receipts |
| POST | `/api/receipts` | Create new receipt |
| GET | `/api/receipts/[id]` | Get single receipt |
| PUT | `/api/receipts/[id]` | Update receipt (draft only) |
| DELETE | `/api/receipts/[id]` | Delete receipt (draft only) |
| POST | `/api/receipts/[id]/post` | Post receipt to GL |
| GET | `/api/receipts/[id]/export/pdf` | Export receipt as HTML |
| GET | `/api/receipts/unpaid-invoices?customerId=xxx` | Get unpaid invoices |

## Support

For issues or questions:
1. Check the main documentation: `RECEIPTS-MODULE-COMPLETE.md`
2. Review the code in `/Users/tong/Thai-acc/src/components/receipts/`
3. Check API routes in `/Users/tong/Thai-acc/src/app/api/receipts/`
4. Verify database schema in `/Users/tong/Thai-acc/prisma/schema.prisma`

## Status

✅ Module Complete and Ready for Use!
