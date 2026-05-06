## A20: Notification Center UI — Notification Panel
**Spec file:** `.hermes/plans/2026-05-05-A20-notification-center-ui.md`
**Dev Cycle:** /spec → /plan → /build → /test → /review → /simplify → /ship
**Depends on:** T0
**Partial backend:** Socket.io exists, `src/components/websocket/` exists

---

## What
Build a notification panel UI that shows real-time notifications (Alt+T shortcut). The WebSocket infrastructure exists but needs a proper panel UI.

---

## Step 1: /spec

### Current State
- `Alt+T` shows some notification but UI is unclear
- WebSocket/socket.io exists but notification panel is incomplete

### Target State
- Bell icon in header with unread count badge
- Click → slide-out panel (right side) with notification list
- Notifications grouped by type:
  - 🔔 แจ้งเตือน (Reminders)
  - ⚠️ ต้องดำเนินการ (Action needed)
  - ✅ สำเร็จ (Success)
  - ❌ ข้อผิดพลาด (Errors)
- Mark as read on click
- "Mark all as read" button
- Notification types: overdue invoices, low stock, approval requests, recurring docs

### Notification Sources (existing or new)
1. **Overdue invoices** — "ใบวางบิล #INV-001 เกินกำหนด 7 วัน"
2. **Low stock alert** — "สินค้า กาแฟ เหลือ 5 ชิ้น"
3. **Approval requests** — "มีใบขอซื้อ #PR-001 รออนุมัติ"
4. **Recurring doc created** — "สร้างใบวางบิลอัตโนมัติ #INV-012"

---

## Step 2: /plan

### Tasks
1. Check existing WebSocket/notifications:
```bash
ls src/components/websocket/
grep -rn "notification\|socket" src/components/websocket/
```

2. Check notification model:
```bash
grep -A 20 "model Notification" prisma/schema.prisma
```

3. Create notification panel component:
   - `src/components/notifications/notification-panel.tsx`
   - Slide-out from right edge
   - Grouped notification list
   - Bell icon in header with unread badge

4. Create notification API:
   - `GET /api/notifications` — list notifications
   - `PUT /api/notifications/[id]/read` — mark as read
   - `PUT /api/notifications/read-all` — mark all read

5. Wire into layout header

### Files
```
src/app/api/notifications/route.ts
src/app/api/notifications/[id]/read/route.ts
src/app/api/notifications/read-all/route.ts
src/components/notifications/
  notification-panel.tsx
  notification-item.tsx
  notification-badge.tsx
```

### Thai ERP Checklist
- [ ] Satang amounts (N/A)
- [ ] Debit=credit (N/A)
- [ ] Period check (N/A)
- [ ] Prisma transaction (N/A)

---

## Step 3: /build

Check schema:
```bash
grep -A 30 "model Notification" prisma/schema.prisma
```

Build notification panel following existing shadcn/ui patterns.

---

## Step 4: /test

Manual:
1. Trigger notification (e.g., create overdue invoice scenario)
2. Bell icon shows badge with count
3. Click bell → panel slides out
4. Click notification → navigates to relevant page
5. Badge count decreases

```bash
bun run tsc --noEmit
```

---

## Step 5: /review

- [ ] Bell icon with unread count badge
- [ ] Panel slides out on click
- [ ] Notifications grouped by type
- [ ] Click notification → mark as read + navigate
- [ ] "Mark all as read" works
- [ ] Real-time updates via WebSocket (if available)

---

## Step 6: /ship

```bash
git add src/app/api/notifications/
git add src/components/notifications/
git commit -m "feat(A20): add notification center UI

- Notification panel triggered by bell icon or Alt+T
- Unread badge count on bell
- Grouped: reminders, action needed, success, errors
- Click to navigate + mark as read
- Mark all as read button
"
```
