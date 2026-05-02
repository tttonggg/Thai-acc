# Skill: Thai Compliance Validation

## Description
Validate that code and business logic comply with Thai Revenue Department regulations, TFRS standards, and accounting best practices.

## Trigger
Use when:
- Implementing tax-related features
- Creating financial reports
- Before deploying to production
- During code review
- After changes to accounting logic

## Assigned Model
`opencode-go/glm-5.1` (reasoning about rules and regulations)

## Detailed Instruction / SOP

### Step 1: VAT Compliance Checklist
- [ ] VAT rate is exactly 7%
- [ ] VAT calculation: round(subtotal * 0.07, 2)
- [ ] Tax Invoice must include seller/buyer tax IDs
- [ ] Tax Invoice must have sequential numbering
- [ ] e-Tax Invoice format follows RD specification
- [ ] VAT report (Phor.Por.30) data is correct

### Step 2: WHT Compliance Checklist
- [ ] WHT rates: Services 3%, Rent 5%, Advertising 2%, Transport 1%
- [ ] WHT certificates have correct format
- [ ] Phor.Ngor.Dor.1 (monthly) data is correct
- [ ] Phor.Ngor.Dor.3 (quarterly) data is correct
- [ ] Phor.Ngor.Dor.53 (yearly) data is correct

### Step 3: Document Numbering
- [ ] Numbers are sequential per company
- [ ] No gaps in numbering (unless voided)
- [ ] Format: {PREFIX}-{YEAR}-{SEQUENCE:04d}
- [ ] Prefixes: QT, IV, RE, TX, PO, EX

### Step 4: Double Entry Validation
For every transaction, verify:
```
Sum(Debits) == Sum(Credits)
```
Example validation:
```python
def validate_journal_entry(entry: JournalEntry) -> bool:
    total_dr = sum(line.debit_amount for line in entry.lines if line.debit_amount)
    total_cr = sum(line.credit_amount for line in entry.lines if line.credit_amount)
    return total_dr == total_cr and total_dr > 0
```

### Step 5: FIFO Inventory Validation
- [ ] Cost of goods sold uses oldest batch first
- [ ] Inventory valuation reflects actual remaining
- [ ] Negative inventory is prevented
- [ ] Batch tracking includes received_date

### Step 6: Audit Trail
- [ ] Every record has created_at, updated_at
- [ ] Every record has created_by, updated_by
- [ ] Deleted records use soft delete (deleted_at)
- [ ] Changes to financial records are logged

### Step 7: Report Validation
- [ ] Balance Sheet: Assets = Liabilities + Equity
- [ ] Income Statement: Revenue - Expenses = Profit
- [ ] Cash Flow Statement balances
- [ ] Trial Balance: sum of all accounts = 0

## Common Violations
1. **Rounding errors**: VAT not rounded to 2 decimal places
2. **Missing tax IDs**: Invoices without 13-digit tax ID
3. **Gaps in numbering**: Document sequences have holes
4. **Unbalanced entries**: Journal entries don't balance
5. **Negative inventory**: Selling more than available stock

## Output Format
Compliance report: `/docs/compliance/{feature}-validation.md`
