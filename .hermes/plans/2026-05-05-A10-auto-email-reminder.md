## A10: Auto Email Reminder — Overdue Invoice Reminder
**Spec file:** `.hermes/plans/2026-05-05-A10-auto-email-reminder.md`
**Dev Cycle:** /spec → /plan → /build → /test → /review → /simplify → /ship
**Depends on:** T0 (needs email service)

---

## What
Automatically send email reminders when invoices become overdue (7 days, 14 days, 30 days past due date).

---

## Step 1: /spec

### How It Works
1. User enables "Auto reminder" on an invoice or globally in settings
2. Scheduler runs daily (or on login)
3. Checks all posted invoices where `dueDate < today` and `isPaid = false`
4. Sends email reminder based on days overdue:
   - **7 days**: แจ้งเตือน (Reminder)
   - **14 days**: เรียกชำระ (Please pay)
   - **30 days**: ขอติดตาม (Final notice)

### Email Content
```
Subject: [Keerati] ใบวางบิล #INV-001 ถึงกำหนดชำระ — เกิน 7 วัน

เรียน บริษัท ABC จำกัด

ใบวางบิล #INV-001 ลงวันที่ 1 พ.ค. 2569
มูลค่า: ฿1,391.00
กำหนดชำระ: 15 พ.ค. 2569
เกินกำหนด: 7 วัน

ยอดค้างชำระ: ฿1,391.00

กรุณาชำระเงินตามบัญชี:
ธนาคาร: กรุงเทพ เลขที่บัญชี: xxx-x-x-x

---
ส่งจาก Keerati Accounting
```

### Settings
- Global toggle: enable/disable auto reminders
- Per-invoice toggle: "ส่งแจ้งเตือนอัตโนมัติ" checkbox
- Reminder schedule: 7/14/30 days (configurable)

---

## Step 2: /plan

### Tasks
1. Install nodemailer:
```bash
npm install nodemailer @types/nodemailer
```

2. Create email service:
   - `src/lib/email-service.ts` — `sendEmail()`, `sendInvoiceReminder()`

3. Create email templates:
   - `src/lib/email-templates/reminder-7days.ts`
   - `src/lib/email-templates/reminder-14days.ts`
   - `src/lib/email-templates/reminder-30days.ts`

4. Create reminder scheduler:
   - `src/app/api/cron/check-overdue/route.ts` — called by scheduler
   - Or run on login (simpler for single-instance)

5. Add settings:
   - `src/components/settings/email-settings.tsx` — SMTP config + reminder toggles

6. Add per-invoice toggle:
   - Invoice form: "ส่งแจ้งเตือนอัตโนมัติ" checkbox

### Files
```
src/lib/email-service.ts
src/lib/email-templates/reminder.ts
src/app/api/cron/check-overdue/route.ts
src/app/api/invoices/[id]/route.ts  # add sendReminder flag
src/components/settings/email-settings.tsx
src/components/invoices/invoice-form-dialog.tsx
```

### Thai ERP Checklist
- [ ] All amounts in Satang → convert to Baht for email
- [ ] Debit=credit (N/A)
- [ ] Period check (N/A)
- [ ] Prisma transaction (N/A)

---

## Step 3: /build

Check if nodemailer or email service already exists:
```bash
grep -rn "nodemailer\|sendEmail\|email" src/lib/ | grep -v "emailAddress" | head -10
```

Build email service + reminder logic.

---

## Step 4: /test

Manual (requires SMTP config):
1. Set up email in Settings (SMTP)
2. Create invoice due in past, mark unpaid
3. Run `GET /api/cron/check-overdue`
4. Check email inbox for reminder
5. Verify correct reminder level (7/14/30 days)

```bash
bun run tsc --noEmit
```

---

## Step 5: /review

- [ ] Email service sends correctly (test with mailtrap)
- [ ] Reminder level correct (7/14/30 days)
- [ ] Email template professional with Thai text
- [ ] Per-invoice toggle stored correctly
- [ ] Global setting controls behavior

---

## Step 6: /ship

```bash
npm install nodemailer @types/nodemailer
git add src/lib/email-service.ts src/lib/email-templates/
git add src/app/api/cron/check-overdue/
git add src/components/settings/ src/components/invoices/
git commit -m "feat(A10): add auto email reminder for overdue invoices

- Nodemailer email service
- Automatic reminders at 7/14/30 days overdue
- Per-invoice 'auto reminder' toggle
- SMTP settings in company settings
- Professional Thai email templates
"
```
