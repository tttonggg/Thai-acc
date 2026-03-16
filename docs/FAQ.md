# Frequently Asked Questions (FAQ)

## Thai Accounting ERP - Quick Answers

**Version:** 1.0.0  
**Questions:** 50+  
**Categories:** 12

---

## 🔍 Search Guide

Quick find by category:
- [General](#general) - Questions 1-5
- [Authentication & Security](#authentication--security) - Questions 6-10
- [Getting Started](#getting-started) - Questions 11-15
- [Invoices & Sales](#invoices--sales) - Questions 16-22
- [Receipts & Payments](#receipts--payments) - Questions 23-27
- [Chart of Accounts](#chart-of-accounts) - Questions 28-32
- [Journal Entries](#journal-entries) - Questions 33-36
- [Inventory](#inventory) - Questions 37-40
- [Tax & VAT](#tax--vat) - Questions 41-45
- [Reports](#reports) - Questions 46-48
- [Payroll](#payroll) - Questions 49-52
- [Technical](#technical) - Questions 53-58

---

## General

### Q1: What is Thai Accounting ERP?
**A:** Thai Accounting ERP is a comprehensive accounting software designed specifically for Thai SME businesses. It complies with Thai Financial Reporting Standards (TFRS) and supports Thai tax requirements including VAT (7%), Withholding Tax (PND3/PND53), and Social Security calculations.

### Q2: Is this software suitable for my business size?
**A:** Yes! The system is designed for:
- Small businesses (1-10 employees)
- Medium businesses (11-50 employees)
- Growing businesses needing multi-user access

### Q3: Do I need accounting knowledge to use this software?
**A:** Basic accounting knowledge is helpful but not required. The system includes:
- Pre-configured Thai chart of accounts (181 accounts)
- Automated double-entry bookkeeping
- Built-in validation and error checking
- Comprehensive documentation and tutorials

### Q4: Can I use this for multiple companies?
**A:** The current version supports single-company deployment. For multiple companies, you can:
- Deploy separate instances
- Use the entity management feature (if available)
- Contact us for enterprise multi-company licensing

### Q5: What languages are supported?
**A:** The interface supports:
- Thai (fully localized)
- English
- Mixed Thai-English for reports and documents

---

## Authentication & Security

### Q6: I forgot my password. What should I do?
**A:** 
1. Contact your system administrator
2. Admin can reset password in Settings → Users
3. If you're the admin, you may need database access or contact support

### Q7: Can I change my password?
**A:** Yes:
1. Click your profile icon (top right)
2. Select "เปลี่ยนรหัสผ่าน" (Change Password)
3. Enter current password
4. Enter new password (minimum 8 characters)
5. Confirm new password

### Q8: What are the different user roles?
**A:**
| Role | Permissions |
|------|-------------|
| ADMIN | Full system access, user management, settings |
| ACCOUNTANT | All accounting functions, no user management |
| USER | Create/view documents, limited settings access |
| VIEWER | Read-only access to reports and documents |

### Q9: Is my data secure?
**A:** Yes, the system implements:
- bcrypt password hashing
- Session-based authentication
- CSRF protection
- Rate limiting on API endpoints
- Role-based access control

### Q10: Can I set up two-factor authentication (2FA)?
**A:** The current version uses session-based authentication. 2FA can be added via:
- NextAuth.js configuration
- Third-party MFA providers
- Enterprise SSO integration

---

## Getting Started

### Q11: What are the system requirements?
**A:**
- **Browser:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Screen:** 1366x768 minimum (1920x1080 recommended)
- **Internet:** Stable connection required
- **Server:** Node.js 18+ or Bun runtime

### Q12: How do I set up the system for the first time?
**A:** Follow these steps:
1. Log in with default admin credentials
2. Go to Settings → Company and enter your details
3. Review the chart of accounts
4. Add your bank accounts
5. Set up users and roles
6. Enter opening balances (if migrating)

### Q13: Can I import data from my old system?
**A:** Yes, data import is supported for:
- Chart of accounts
- Customers and vendors
- Products
- Opening balances

Use the Import feature in each module or contact support for bulk migration.

### Q14: What is the default fiscal year?
**A:** The default fiscal year is January-December. You can change this in:
Settings → Company → Fiscal Year Start

### Q15: How do I back up my data?
**A:**
1. Go to Settings → Backup
2. Click "Create Backup"
3. Download the backup file
4. Store securely

Automatic backups can be configured via scheduled tasks.

---

## Invoices & Sales

### Q16: What's the difference between Draft and Issued invoices?
**A:**
- **DRAFT:** Can be edited, no accounting impact
- **ISSUED:** Posted to GL, creates AR entry, generates invoice number

### Q17: Can I edit an issued invoice?
**A:** No, issued invoices cannot be edited to maintain audit integrity. Options:
1. Create a credit note for adjustments
2. Void the invoice and create a new one
3. Create a debit note for additional charges

### Q18: How do I void an invoice?
**A:**
1. Open the invoice
2. Click "ยกเลิก" (Void)
3. Enter reason for voiding
4. Confirm

Note: This creates reversing journal entries.

### Q19: Can I customize the invoice format?
**A:** Yes, you can:
- Upload company logo
- Customize header/footer text
- Select paper size (A4, A5)
- Choose language (Thai/English)

Go to Settings → Document Templates

### Q20: What invoice numbering formats are supported?
**A:** You can customize using placeholders:
- `{YYYY}` - Year (2026)
- `{MM}` - Month (03)
- `{DD}` - Day (16)
- `{0000}` - Sequential number

Example: `INV-{YYYY}{MM}-{0000}` → `INV-202603-0001`

### Q21: Can I add multiple line items to an invoice?
**A:** Yes, there's no limit to line items. Each line can have:
- Product or description
- Quantity
- Unit price
- Discount %
- VAT rate

### Q22: How do I handle deposits or advance payments?
**A:**
1. Create a receipt without invoice allocation (on-account)
2. Apply to invoice when ready
3. Or create a separate "Customer Deposits" liability account

---

## Receipts & Payments

### Q23: How do I record a customer payment?
**A:**
1. Go to Sales → Receipts
2. Click "+ New Receipt"
3. Select customer
4. Enter amount and payment method
5. Allocate to invoices
6. Save and post

### Q24: Can I split a payment across multiple invoices?
**A:** Yes, in the receipt form:
1. System shows all unpaid invoices
2. Enter allocation amount for each invoice
3. Total allocations must equal receipt amount

### Q25: How do I handle withholding tax (WHT)?
**A:**
1. When creating receipt, enter WHT amount
2. Select WHT type (PND3 for individuals, PND53 for companies)
3. System generates WHT certificate
4. Track in Tax → WHT Certificates

### Q26: What payment methods are supported?
**A:**
- เงินสด (Cash)
- โอนเงิน (Bank Transfer)
- เช็ค (Cheque)
- บัตรเครดิต (Credit Card)
- อื่นๆ (Other)

### Q27: Can I print a receipt?
**A:** Yes:
1. Open the receipt
2. Click "พิมพ์" (Print)
3. Choose format
4. Print or save as PDF

---

## Chart of Accounts

### Q28: Can I add my own accounts?
**A:** Yes:
1. Go to General Ledger → Chart of Accounts
2. Click "+ New Account"
3. Enter code (must be unique)
4. Enter Thai and English names
5. Select account type
6. Save

### Q29: What account code format should I use?
**A:** Follow Thai accounting standards:
- 1000-1999: Assets (สินทรัพย์)
- 2000-2999: Liabilities (หนี้สิน)
- 3000-3999: Equity (ทุน)
- 4000-4999: Revenue (รายได้)
- 5000-5999: Expenses (ค่าใช้จ่าย)

### Q30: What's the difference between summary and detail accounts?
**A:**
- **Summary Account:** Groups multiple accounts, cannot post transactions
- **Detail Account:** Actual posting account for transactions

Example:
- 1200 ลูกหนี้การค้า (Summary)
  - 1201 ลูกหนี้การค้า-ลูกค้าในประเทศ (Detail - can post)
  - 1202 ลูกหนี้การค้า-ลูกค้าต่างประเทศ (Detail - can post)

### Q31: Can I delete an account?
**A:** Only if:
- No transactions posted to it
- No sub-accounts under it
- Not a system-required account

If transactions exist, you should make it inactive instead.

### Q32: How do I set opening balances?
**A:**
1. Create a journal entry dated day before go-live
2. Debit asset accounts
3. Credit liability and equity accounts
4. Reference as "Opening Balances"
5. Post the entry

---

## Journal Entries

### Q33: When should I use manual journal entries?
**A:** Use for:
- Adjustments and corrections
- Accruals and deferrals
- Depreciation
- Year-end closing
- Opening balances
- Reclassification entries

### Q34: Why won't my journal entry balance?
**A:** Common reasons:
- Debit and credit totals don't match
- Missing amounts in some lines
- Sign errors (negative amounts)

Check: Total Debits must exactly equal Total Credits

### Q35: Can I edit a posted journal entry?
**A:** No, posted entries cannot be edited. To correct:
1. Create a reversing entry
2. Post the reversal
3. Create a new correct entry

This maintains audit trail integrity.

### Q36: What's the difference between Draft and Posted JE?
**A:**
- **Draft:** Can be edited, no GL impact, no JE number assigned
- **Posted:** Immutable, affects GL balances, has JE number

---

## Inventory

### Q37: What inventory costing method is used?
**A:** Weighted Average Cost (WAC):
```
Average Cost = Total Inventory Value / Total Quantity
```

This method is accepted by Thai Revenue Department.

### Q38: How do I adjust inventory quantities?
**A:**
1. Go to Inventory → Stock Adjustments
2. Select product and warehouse
3. Enter actual quantity
4. System calculates variance
5. Provide reason for adjustment
6. Post adjustment

### Q39: Can I track inventory by warehouse?
**A:** Yes, the system supports:
- Multiple warehouses/locations
- Stock transfers between warehouses
- Warehouse-specific stock reports
- Location-level stock tracking

### Q40: How do I handle damaged or obsolete stock?
**A:**
1. Create stock adjustment
2. Set adjustment type to "Damage" or "Obsolete"
3. Enter quantity to write off
4. System creates expense entry
5. Requires approval before posting

---

## Tax & VAT

### Q41: What VAT rate should I use?
**A:** Default is 7% (Thai standard rate). Can be set to:
- 7% - Standard rate
- 0% - Zero-rated (exports)
- Exempt - VAT not applicable

Configure in Settings → Accounting → Default VAT Rate

### Q42: How do I file VAT (P.P.30)?
**A:**
1. Go to Tax → VAT Reports
2. Select month and year
3. Choose report type:
   - OUTPUT (ภาษีขาย) - VAT collected
   - INPUT (ภาษีซื้อ) - VAT paid
4. Review the report
5. Export to file or print
6. Submit to Revenue Department by 15th of following month

### Q43: What's the difference between PND3 and PND53?
**A:**
| Form | For | Common Rates |
|------|-----|--------------|
| PND3 | Individuals | Services 3%, Rent 5% |
| PND53 | Companies | Services 3%, Rent 5%, Advertising 2% |

### Q44: How do I generate WHT certificates?
**A:**
1. Go to Tax → WHT Certificates
2. Click "New Certificate"
3. Select vendor
4. Enter tax details
5. Generate PDF (50 Tawi form)
6. Print and sign

### Q45: When is WHT not required?
**A:** WHT is not required when:
- Payment is less than 1,000 THB
- Payment to exempt entities
- Certain exempt income types
- Payments to government agencies

Always consult your accountant for specific cases.

---

## Reports

### Q46: Why does my report show no data?
**A:** Check:
- Date range is correct
- Transactions are posted (not draft)
- Fiscal period is open
- Correct filters applied

### Q47: Can I export reports to Excel?
**A:** Yes, all reports support export to:
- PDF (for printing/sharing)
- Excel (for analysis)
- CSV (for data import)

Click the export button in the report view.

### Q48: How often should I run financial reports?
**A:** Recommended schedule:
- **Daily:** Cash position, sales summary
- **Weekly:** AR aging, AP aging
- **Monthly:** P&L, Balance Sheet, Trial Balance
- **Quarterly:** Detailed analysis, budgets vs actual
- **Annually:** Year-end reports, tax filings

---

## Payroll

### Q49: How do I calculate social security?
**A:** Both employee and employer contribute 5%:
- Maximum contribution: 750 THB/month each
- Based on wages up to 15,000 THB
- System auto-calculates based on salary

### Q50: What's included in gross salary?
**A:** Gross salary typically includes:
- Base salary
- Fixed allowances
- Overtime
- Commissions
- Bonuses

Excludes: Reimbursements, non-cash benefits

### Q51: How do I process monthly payroll?
**A:**
1. Go to Payroll → Process Payroll
2. Select month/year
3. Review all employees
4. Enter variables (OT, deductions)
5. Calculate
6. Review payslips
7. Post to GL
8. Generate bank transfer file

### Q52: Can I adjust payroll after posting?
**A:** Best practice is to:
1. Create adjustment in next period
2. Or reverse and reprocess (with proper documentation)

Never edit posted payroll directly.

---

## Technical

### Q53: What browsers are supported?
**A:**
- Chrome 90+ ✅
- Firefox 88+ ✅
- Safari 14+ ✅
- Edge 90+ ✅
- Internet Explorer: Not supported ❌

### Q54: Can I use this offline?
**A:** The system requires internet connection for:
- Multi-user collaboration
- Cloud backup
- Tax rate updates

Offline mode is not currently supported.

### Q55: How do I update the system?
**A:**
1. Backup your database
2. Download latest version
3. Run database migrations
4. Restart server

Always test updates in staging environment first.

### Q56: What database does it use?
**A:** Default is SQLite for single-user/small deployments.
For production/multi-user, we recommend PostgreSQL.

### Q57: Can I integrate with other software?
**A:** Yes, via:
- REST API (for custom integrations)
- Webhooks (for real-time events)
- Import/Export (CSV, Excel)

### Q58: How do I report a bug?
**A:**
1. Go to Help → Report Issue
2. Describe the problem
3. Include steps to reproduce
4. Attach screenshots if possible
5. Submit

Or email: support@thaiaccounting.com

---

## Still Need Help?

### Contact Support
- 📧 Email: support@thaiaccounting.com
- 📞 Phone: 02-XXX-XXXX (Mon-Fri 9:00-18:00)
- 💬 Live Chat: Available on website
- 📚 Documentation: https://docs.thaiaccounting.com

### Community Resources
- 🎥 Video Tutorials: YouTube channel
- 📖 User Manual: Download PDF
- 👥 Community Forum: Ask other users
- 🎓 Training: Online courses available

---

*Last Updated: March 16, 2026*
