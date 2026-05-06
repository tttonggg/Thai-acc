## A11: QR PromptPay on Invoice
**Spec file:** `.hermes/plans/2026-05-05-A11-qr-promptpay.md`
**Dev Cycle:** /spec → /plan → /build → /test → /review → /simplify → /ship
**Depends on:** A5 (Thai font must be done first — same PDF template)

---

## What
Generate a PromptPay QR code on invoice PDFs. Customer scans with mobile banking app to pay instantly.

---

## Step 1: /spec

### What is PromptPay QR
Thailand's national QR payment standard. Enables instant transfer using:
- Corporate QR (for business payments)
- Generate from: Company Tax ID + Amount + Invoice Ref

### QR Data Format (QR PromptPay)
```
00020101021129370016A0000006770101110113006681234567802TH
5303764540600000000000000000000000000000000000000000000000
5802TH6005กรุงเทพฯ000000000000000000000000000000000000000
6304
```

### API Options
1. **qrcode** npm package — generates QR image as base64 PNG
2. **promptpay-qr** — specialized for Thai PromptPay format

### What to Add to Invoice PDF
- QR code image (bottom-right of invoice)
- PromptPay logo next to QR
- Text: "สแกนจ่ายได้เลย" (Scan to pay)
- Company name + amount pre-filled in QR

### Implementation
```typescript
import { generatePayload } from 'promptpay-qr';
// or
import QRCode from 'qrcode';

const qrData = generatePayload({
  payload: {
    amount: 1391.00,
    companyName: 'บริษัท ตัวอย่าง จำกัด',
    merchantName: 'บริษัท ตัวอย่าง จำกัด',
    id: '0123456789012', // tax ID
  }
});
const qrImage = await QRCode.toDataURL(qrData);
```

---

## Step 2: /plan

### Tasks
1. Install dependency:
```bash
npm install promptpay-qr qrcode
```

2. Add QR generation to invoice PDF:
   - Modify `src/lib/pdfkit-generator.ts`
   - Add `addPromptPayQR(doc, { taxId, amount, companyName, invoiceRef })`
   - Embed QR image in PDF

3. Company PromptPay settings:
   - Company Tax ID must be in Settings
   - If not set, show placeholder

### Files
```
src/lib/pdfkit-generator.ts   # add QR method
src/app/api/invoices/[id]/pdf/route.ts  # pass amount + tax ID to QR
src/components/settings/company-settings.tsx  # add PromptPay ID field
```

### Dependencies
```bash
npm install promptpay-qr @types/qrcode
```

### Thai ERP Checklist
- [ ] Amount in Satang → converted to Baht for QR
- [ ] Debit=credit (N/A)
- [ ] Period check (N/A)
- [ ] Prisma transaction (N/A)
- [ ] QR code scannable — test with actual banking app

---

## Step 3: /build

Check if promptpay-qr or qrcode already installed:
```bash
cat package.json | grep -E "qrcode|promptpay"
```

Build QR function in pdfkit-generator.

---

## Step 4: /test

Manual:
1. Set company PromptPay ID in Settings (เลขพร้อมเพย์)
2. Open invoice → click PDF export
3. Open PDF → QR code visible
4. Scan with banking app → shows correct amount + company name

```bash
bun run tsc --noEmit
```

---

## Step 5: /review

- [ ] QR code appears on invoice PDF
- [ ] QR contains correct amount (Baht, 2 decimal places)
- [ ] QR contains company name
- [ ] QR scannable (test with app)
- [ ] If company PromptPay ID not set, QR not shown or shows placeholder

---

## Step 6: /ship

```bash
npm install promptpay-qr qrcode
git add src/lib/pdfkit-generator.ts src/app/api/invoices/
git add src/components/settings/
git commit -m "feat(A11): add PromptPay QR code to invoice PDF

- Generate QR code with company PromptPay ID + amount
- Embed in invoice PDF bottom-right
- Scan with any Thai banking app to pay instantly
- Requires: company PromptPay ID in Settings
"
```
