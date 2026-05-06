## A8: Recurring Document UI — Automated Recurring Billings
**Spec file:** `.hermes/plans/2026-05-05-A8-recurring-document-ui.md`
**Dev Cycle:** /spec → /plan → /build → /test → /review → /simplify → /ship
**Depends on:** T0
**Backend already exists:** `src/lib/recurring-document-service.ts` (611 lines)

---

## What
Build a UI page to configure recurring documents (auto-generate invoices/payments on schedule). Backend engine already exists — just need to create the UI to manage recurring templates.

---

## Step 1: /spec

### Backend Already Done
- `src/lib/recurring-document-service.ts` — recurring engine
- `src/app/api/recurring-documents/route.ts` — API endpoints
- Prisma has `RecurringDocument` model

### What UI Needs
1. **Recurring Document List** — shows all configured recurring templates:
   - Document type (Invoice, Receipt, Payment, Journal)
   - Template name/description
   - Frequency (daily, weekly, monthly, yearly)
   - Next run date
   - Status (active/paused)

2. **Create/Edit Recurring Template**:
   - Select document type
   - Set frequency (รายวัน/รายสัปดาห์/รายเดือน/รายปี)
   - Set start date, end date (optional)
   - Fill in document template (customer, items, amounts)
   - Active/Paused toggle

3. **Recurring Document Log** — history of auto-generated documents

### Recurring Frequency Options
| Thai | English |
|------|---------|
| รายวัน | Daily |
| รายสัปดาห์ | Weekly |
| รายเดือน | Monthly |
| ราย 3 เดือน | Quarterly |
| ราย 6 เดือน | Semi-annually |
| รายปี | Yearly |

### Use Cases
- Monthly rent payment (fixed expense)
- Monthly retainer invoice to client
- Quarterly tax payment reminder
- Annual subscription invoice

---

## Step 2: /plan

### Tasks
1. Check existing recurring-document API:
```bash
ls src/app/api/recurring-documents/
cat src/app/api/recurring-documents/route.ts | head -50
cat src/lib/recurring-document-service.ts | head -80
```

2. Create/verify API routes:
   - `GET /api/recurring-documents` — list all
   - `POST /api/recurring-documents` — create template
   - `PUT /api/recurring-documents/[id]` — update
   - `DELETE /api/recurring-documents/[id]` — delete
   - `POST /api/recurring-documents/[id]/pause` — pause
   - `POST /api/recurring-documents/[id]/resume` — resume

3. Create component `src/components/recurring/recurring-documents-page.tsx`
4. Add to sidebar under DOCUMENTS or REPORTS

### Files
```
src/app/api/recurring-documents/[id]/pause/route.ts
src/app/api/recurring-documents/[id]/resume/route.ts
src/components/recurring/
  recurring-documents-page.tsx
  recurring-form-dialog.tsx
  recurring-log-list.tsx
```

### Thai ERP Checklist
- [ ] All amounts in Satang
- [ ] Debit=credit (N/A for template)
- [ ] Period check (N/A for template setup)
- [ ] Prisma transaction (N/A)

---

## Step 3: /build

Check Prisma schema for RecurringDocument:
```bash
grep -A 20 "model RecurringDocument" prisma/schema.prisma
```

Build UI.

---

## Step 4: /test

Manual:
1. Navigate to Documents → เอกสารประจำ (Recurring)
2. Click "+ เพิ่มเอกสารประจำ"
3. Fill: Monthly rent invoice to "บริษัท ABC"
4. Set frequency: รายเดือน, day 1
5. Save → appears in list with "Active" status
6. Pause button works

```bash
bun run tsc --noEmit
```

---

## Step 5: /review

- [ ] CRUD for recurring templates works
- [ ] Frequency options all available
- [ ] Pause/Resume toggles correctly
- [ ] Shows next run date
- [ ] Auto-generated documents appear in regular document list

---

## Step 6: /ship

```bash
git add src/app/api/recurring-documents/
git add src/components/recurring/
git commit -m "feat(A8): add recurring document UI

- Recurring document management page
- Create/edit/pause/resume recurring templates
- Supports: daily, weekly, monthly, quarterly, yearly
- Auto-generates documents on schedule
"
```
