# Banking Module - Quick Reference

## Bank Accounts Management

### Adding a New Bank Account

1. Click "เพิ่มบัญชีธนาคาร" button
2. Fill in required fields (marked with \*):
   - รหัส (Code): e.g., BANK-001
   - ธนาคาร (Bank Name): e.g., ธ.กสิกรไทย
   - เลขที่บัญชี (Account Number): e.g., 123-4-56789-0
   - GL Account ID: Chart of account ID
3. Optional fields:
   - สาขา (Branch)
   - ชื่อบัญชี (Account Name)
4. Click "บันทึก" (Save)

### Editing a Bank Account

1. Click pencil icon on the bank account card
2. Modify fields as needed
3. Check/uncheck "บัญชีใช้งานอยู่" to activate/deactivate
4. Click "บันทึกการแก้ไข" (Save changes)

**Note**: Cannot deactivate if ON_HAND or DEPOSITED cheques exist

### Deleting a Bank Account

1. Click trash icon on the bank account card
2. Confirm deletion in dialog

**Restrictions**:

- Cannot delete if cheques exist
- Cannot delete if reconciliations exist
- Only unused accounts can be deleted

---

## Cheque Management

### Cheque Status Meanings

| Status    | Thai     | Meaning   | Can Edit? | Can Delete? |
| --------- | -------- | --------- | --------- | ----------- |
| ON_HAND   | ถืออยู่  | Holding   | ✅ Yes    | ✅ Yes      |
| DEPOSITED | นำฝาก    | Deposited | ❌ No     | ❌ No       |
| CLEARED   | ผ่านแล้ว | Cleared   | ❌ No     | ❌ No       |
| BOUNCED   | เด้ง     | Bounced   | ❌ No     | ❌ No       |
| CANCELLED | ยกเลิก   | Cancelled | ❌ No     | ❌ No       |

### Adding a New Cheque

1. Click "เพิ่มเช็ค" button
2. Fill in required fields:
   - เลขที่เช็ค (Cheque Number)
   - ประเภท (Type): เช็ครับ (RECEIVE) or เช็คจ่าย (PAY)
   - บัญชีธนาคาร (Bank Account)
   - จำนวนเงิน (Amount)
   - วันครบกำหนด (Due Date)
3. Optional:
   - ผู้รับ/จ่าย (Payee Name)
4. Click "บันทึก" (Save)

### Editing a Cheque

1. Click pencil icon in the "จัดการ" (Actions) column
2. Only available for ON_HAND cheques
3. Modify fields as needed
4. Click "บันทึกการแก้ไข" (Save changes)

### Deleting a Cheque

1. Click trash icon in the "จัดการ" (Actions) column
2. Only available for ON_HAND cheques
3. Confirm deletion in dialog

**Note**: Cannot delete if cheque has journal entry

### Changing Cheque Status

#### Deposit a Cheque (ON_HAND → DEPOSITED)

1. Find ON_HAND cheque
2. Click arrow (→) button
3. Status changes to "นำฝาก" (DEPOSITED)

#### Clear a Cheque (DEPOSITED → CLEARED)

1. Find DEPOSITED cheque
2. Click checkmark (✓) button
3. Status changes to "ผ่านแล้ว" (CLEARED)
4. GL journal entry automatically created

#### Bounce a Cheque (DEPOSITED → BOUNCED)

1. Find DEPOSITED cheque
2. Click X (✕) button
3. Status changes to "เด้ง" (BOUNCED)
4. Reversing GL journal entry automatically created

---

## Bank Reconciliation

### Steps to Reconcile

1. Go to "กระทบยอด" (Reconciliation) tab
2. Select bank account from dropdown
3. Enter:
   - วันที่รายการเดินบัญชี (Statement Date)
   - ยอดเงินตามรายการเดินบัญชี (Statement Balance)
4. Review uncleared cheques in left panel
5. Click cheques to select them for reconciliation
6. Selected cheques move to right panel
7. Verify:
   - ยอดเงินตามรายการเดินบัญชี (Statement Balance)
   - ยอดเงินตามสมุดบัญชี (Book Balance)
   - ผลต่าง (Difference) should be 0
8. Click "กระทบยอด" (Reconcile) button

### Understanding the Panels

- **Left Panel**: รายการที่ยังไม่กระทบยอด (Unreconciled items)
  - Shows all uncleared cheques
  - Click to select/deselect
  - Color: White cards

- **Right Panel**: รายการที่เลือกกระทบยอด (Selected for reconciliation)
  - Shows selected cheques
  - Checkmark icon indicates selection
  - Color: Blue cards

### Balance Comparison Cards

- **Green cards**: Everything matches (difference = 0)
- **Red cards**: There's a discrepancy (difference ≠ 0)

---

## Action Button Reference

### Bank Account Cards

| Icon | Action | Description                        |
| ---- | ------ | ---------------------------------- |
| ✏️   | Edit   | Open edit dialog                   |
| 🗑️   | Delete | Delete account (with confirmation) |

### Cheque Table Actions

| Icon | Color  | Action  | When Available        |
| ---- | ------ | ------- | --------------------- |
| ✏️   | Gray   | Edit    | ON_HAND status only   |
| 🗑️   | Red    | Delete  | ON_HAND status only   |
| →    | Yellow | Deposit | ON_HAND status only   |
| ✓    | Green  | Clear   | DEPOSITED status only |
| ✕    | Red    | Bounce  | DEPOSITED status only |

---

## Common Error Messages

### Bank Account Errors

| Error                                                      | Cause                 | Solution                          |
| ---------------------------------------------------------- | --------------------- | --------------------------------- |
| ไม่สามารถลบบัญชีได้ เนื่องจากมีเช็ค X รายการ               | Cheques exist         | Delete/process cheques first      |
| ไม่สามารถลบบัญชีได้ เนื่องจากมีรายการกระทบยอด X รายการ     | Reconciliations exist | Cannot delete reconciled accounts |
| ไม่สามารถระงับบัญชีได้ เนื่องจากมีเช็คที่ยังไม่ได้กระทบยอด | Pending cheques exist | Clear or bounce cheques first     |

### Cheque Errors

| Error                               | Cause                    | Solution                        |
| ----------------------------------- | ------------------------ | ------------------------------- |
| ไม่สามารถลบเช็คที่มีบันทึกบัญชีแล้ว | Cheque posted to GL      | Cannot delete processed cheques |
| ข้อมูลเช็คไม่ครบถ้วน                | Missing required fields  | Fill all required fields        |
| เช็คนี้ถูกประมวลผลแล้ว              | Cheque already processed | Cannot edit processed cheques   |

---

## Workflow Examples

### Example 1: Receive and Clear a Cheque

1. **Create Cheque**: Click "เพิ่มเช็ค", enter details, save → Status: ON_HAND
2. **Deposit Cheque**: Click arrow button → Status: DEPOSITED
3. **Clear Cheque**: Click checkmark button → Status: CLEARED, GL posted

### Example 2: Handle a Bounced Cheque

1. **Create Cheque**: Enter details, save → Status: ON_HAND
2. **Deposit Cheque**: Click arrow button → Status: DEPOSITED
3. **Bounce Cheque**: Click X button → Status: BOUNCED, GL reversed

### Example 3: Monthly Bank Reconciliation

1. **Get Bank Statement**: Receive statement from bank
2. **Go to Reconciliation Tab**: Select bank account
3. **Enter Statement Info**: Date and balance from statement
4. **Match Cheques**: Select cheques that appear on statement
5. **Verify Difference**: Should be 0.00
6. **Reconcile**: Click button to save

---

## Tips & Best Practices

### Bank Accounts

- Use consistent coding: BANK-001, BANK-002, etc.
- Always link to correct GL account (usually 11xx Asset accounts)
- Include branch name for multi-branch banks
- Keep inactive accounts for historical records

### Cheques

- Record payee name for easy reference
- Enter due dates to track ageing
- Deposit cheques promptly (ON_HAND → DEPOSITED)
- Clear cheques when bank confirms (DEPOSITED → CLEARED)
- Handle bounced cheques immediately to reverse GL

### Reconciliation

- Reconcile monthly for accurate cash balance
- Verify difference is 0 before submitting
- Keep bank statements for audit trail
- Review uncleared cheques regularly

---

## File Locations

### Components

- Bank Accounts: `/src/components/banking/banking-page.tsx` (BankAccountsTab)
- Cheques: `/src/components/banking/banking-page.tsx` (ChequeRegisterTab)
- Reconciliation: `/src/components/banking/banking-page.tsx` (ReconciliationTab)
- Edit Dialogs: `/src/components/banking/bank-account-edit-dialog.tsx`,
  `/src/components/banking/cheque-edit-dialog.tsx`

### API Routes

- Bank Accounts: `/src/app/api/bank-accounts/route.ts`,
  `/src/app/api/bank-accounts/[id]/route.ts`
- Cheques: `/src/app/api/cheques/route.ts`, `/src/app/api/cheques/[id]/route.ts`
- Reconciliation: `/src/app/api/bank-accounts/[id]/reconcile/route.ts`

---

## Support

For issues or questions:

1. Check error messages (in Thai)
2. Verify workflow status (cheque must be ON_HAND to edit)
3. Ensure no dependent records exist (for deletions)
4. Check browser console for technical errors
