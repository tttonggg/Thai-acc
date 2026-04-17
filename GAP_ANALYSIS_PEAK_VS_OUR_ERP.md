# Thai Accounting ERP - Gap Analysis vs. PEAK Manual

## Executive Summary

This document compares the Thai Accounting ERP codebase against the PEAK accounting software manual (TH User Manual AFP.md) to identify functional gaps, workflow differences, and improvement opportunities.

**Scope**: All features except external API integrations and AI functions.

---

## Module Coverage Matrix

| PEAK Module | Our ERP | Status | Notes |
|-------------|---------|--------|-------|
| **Dashboard** | ✅ | Complete | KPIs, cash balance, AR/AP aging, revenue/expense summary |
| **รายรับ (Income)** | | | |
| - ใบเสนอราคา (Quotations) | ✅ | Complete | Approval flow, convert to invoice |
| - ใบแจ้งหนี้ (Invoices) | ✅ | Complete | Tax invoice (TIV), PDF export |
| - ใบวางบิล (Billing) | ⚠️ | Partial | No dedicated billing module |
| - ใบเสร็จรับเงิน (Receipts) | ✅ | Complete | Payment allocation, WHT |
| - ใบกำกับภาษี (Tax Invoice) | ✅ | Complete | TAS 700 compliant |
| - ใบลดหนี้ (Credit Notes) | ✅ | Complete | Refund/refund-to-bill |
| - ใบเพิ่มหนี้ (Debit Notes) | ✅ | Complete | Price adjustment |
| **รายจ่าย (Expense)** | | | |
| - ใบสั่งซื้อ (Purchase Orders) | ✅ | Complete | PR→PO workflow |
| - ใบรวมจ่าย (Batch Payments) | ⚠️ | Partial | No batch payment consolidation |
| - บันทึกค่าใช้จ่าย (Expense Recording) | ✅ | Complete | General expense |
| - บันทึกซื้อสินค้า (Purchase Recording) | ✅ | Complete | Inventory purchase |
| - บันทึกซื้อสินทรัพย์ (Asset Purchase) | ✅ | Complete | Via assets module |
| - บันทึกภาษีซื้อ (VAT Input) | ✅ | Complete | VAT tracking |
| - รับใบลดหนี้ (Debit Note Receipt) | ✅ | Complete | |
| - รับใบเพิ่มหนี้ (Credit Note Receipt) | ✅ | Complete | |
| **ผู้ติดต่อ (Contacts)** | | | |
| - ลูกค้า/คู่ค้า (Customer/Vendor) | ✅ | Complete | AR/AP management |
| - กลุ่มผู้ติดต่อ (Contact Groups) | ✅ | Complete | Custom groups |
| - วงเงินขายเชื่อ (Credit Limit) | ✅ | Complete | |
| **สินค้า (Products)** | | | |
| - สินค้า/บริการ (Products/Services) | ✅ | Complete | |
| - หน่วยสินค้า (Units) | ✅ | Complete | |
| - ต้นทุน FIFO (FIFO Costing) | ✅ | Complete | FIFO only |
| - ต้นทุนถัวเฉลี่ย (Avg Cost) | ❌ | Missing | |
| **คลังสินค้า (Inventory)** | | | |
| - คงเหลือ (Stock Balance) | ✅ | Complete | |
| - การเคลื่อนไหว (Movements) | ✅ | Complete | |
| - โอนคลัง (Transfers) | ✅ | Complete | |
| - ตรวจนับ (Stock Take) | ✅ | Complete | |
| - Batch/Lot Tracking | ❌ | Missing | |
| - Serial Number | ❌ | Missing | |
| - Expiry Date | ❌ | Missing | |
| **การเงิน (Banking)** | | | |
| - บัญชีธนาคาร (Bank Accounts) | ✅ | Complete | |
| - เช็ครับ/จ่าย (Cheques) | ✅ | Complete | |
| - สำรองจ่าย (Petty Cash) | ✅ | Complete | Via petty-cash module |
| - กระทบยอด (Bank Reconciliation) | ✅ | Complete | |
| - นำเช็คเข้า/ตัด (Cheque Processing) | ✅ | Complete | |
| **สินทรัพย์ (Assets)** | | | |
| - ทะเบียนทรัพย์ (Asset Register) | ✅ | Complete | |
| - ค่าเสื่อม (Depreciation) | ✅ | Complete | Straight-line only |
| - ซื้อ/ขายสินทรัพย์ (Buy/Sell) | ⚠️ | Partial | Disposal incomplete |
| - ประเมินมูลค่าใหม่ (Revaluation) | ❌ | Missing | |
| **บัญชี (Accounting)** | | | |
| - ผังบัญชี (Chart of Accounts) | ✅ | Complete | Thai standard 181 accounts |
| - สมุดรายวัน (Journals) | ✅ | Complete | RV, UV, PV, SV, JV |
| - บัญชีแยกประเภท (Ledger) | ✅ | Complete | |
| - งบทดลอง (Trial Balance) | ✅ | Complete | |
| - งบกำไรขาดทุน (Income Statement) | ✅ | Complete | |
| - งบแสดงฐานะ (Balance Sheet) | ✅ | Complete | |
| - งบกระแสเงินสด (Cash Flow) | ❌ | Missing | |
| - DBD e-Filing (XBRL) | ⚠️ | Partial | Export exists, not full integration |
| **ภาษี (Tax)** | | | |
| - ภาษีหัก ณ ที่จ่าย (WHT) | ✅ | Complete | PND3, PND53 |
| - ภาษีมูลค่าเพิ่ม (VAT) | ✅ | Complete | 7% calculation |
| - ภ.พ.30 (VAT Form) | ⚠️ | Partial | Report only, not full form |
| - ภ.ง.ด.1 (WHT Form) | ⚠️ | Partial | Basic only |
| - PP30 Filing | ❌ | Missing | No automated filing |
| **เงินเดือน (Payroll)** | | | |
| - พนักงาน (Employees) | ✅ | Complete | |
| - จ่ายเงินเดือน (Payroll Runs) | ✅ | Complete | |
| - ประกันสังคม (Social Security) | ⚠️ | Partial | 5% cap calculation |
| - ภาษีเงินได้ (Income Tax) | ⚠️ | Partial | Basic calculation |
| - โบนัส/ค่าจ้าง (Bonus/OT) | ⚠️ | Partial | Basic only |
| - พิมพ์ ภ.ง.ด.1 | ✅ | Complete | With 50 ทวิ |
| **รายงาน (Reports)** | | | |
| - รายงานอายุลูกหนี้ (AR Aging) | ✅ | Complete | |
| - รายงานอายุเจ้าหนี้ (AP Aging) | ✅ | Complete | |
| - รายงานสินค้าคงเหลือ (Stock Report) | ✅ | Complete | |
| - รายงานกำไรขั้นต้น (GP Report) | ✅ | Complete | |
| - รายงานเปรียบเทียบ (Comparison) | ⚠️ | Partial | Budget vs actual |
| - รายงานกลุ่มลูกค้า (Customer Group) | ✅ | Complete | |
| **ตั้งค่า (Settings)** | | | |
| - ตั้งค่าองค์กร (Organization) | ✅ | Complete | |
| - ตั้งค่าผู้ใช้ (User Management) | ✅ | Complete | RBAC |
| - ตั้งค่าเอกสาร (Document Settings) | ✅ | Complete | Numbering, formats |
| - ตั้งค่านโยบายบัญชี (Accounting Policy) | ✅ | Complete | |
| - Lock ข้อมูล (Data Lock) | ✅ | Complete | Period locking |

---

## Critical Gaps

### 1. Tax Filing Integration (PP30, e-Filing)

**Gap**: No automated tax form filing to Revenue Department.

**PEAK Workflow**:
- Create PP30 directly from VAT data
- Submit via e-Filing
- Track filing status

**Current State**:
- ✅ VAT calculation and reporting
- ❌ No PP30 form generation
- ❌ No e-Tax Invoice/RD3 integration

**Recommendation**:
```typescript
// Add tax filing service
interface TaxFilingService {
  generatePP30(period: TaxPeriod): PP30Form
  generatePND1(employees: Employee[]): PND1Form
  submitToRD(reference: string): Promise<TaxSubmissionResult>
}
```

---

### 2. Inventory Costing Methods

**Gap**: Only FIFO implemented, no weighted average or specific identification.

**PEAK Supports**:
- FIFO (First In First Out)
- Weighted Average
- Specific Identification

**Current State**:
- ✅ FIFO via `inventory-service.ts`
- ❌ No average cost method
- ❌ No batch costing

**Recommendation**:
```typescript
// Update inventory-service.ts
enum CostMethod {
  FIFO = 'FIFO',
  WEIGHTED_AVERAGE = 'WEIGHTED_AVERAGE',
  SPECIFIC_ID = 'SPECIFIC_ID'
}

interface InventorySettings {
  costMethod: CostMethod
  defaultWarehouse: string
}
```

---

### 3. Bank Statement Import

**Gap**: No electronic bank statement import for automated reconciliation.

**PEAK Workflow**:
1. Import OFX/CAMT from bank
2. Auto-match transactions
3. Suggest entries for unmatched
4. Approve reconciliation

**Current State**:
- ✅ Manual bank reconciliation
- ✅ Cheque tracking
- ❌ No bank statement import
- ❌ No auto-matching

---

### 4. Payroll Completeness

**Gap**: Social Security and provident fund not fully implemented.

**PEAK Workflow**:
- Calculate SSC (5% capped at ฿750)
- Generate 50 ทวิ file for bank
- PND1 form generation
- Provident fund tracking

**Current State**:
- ✅ Employee management
- ✅ Basic payroll runs
- ⚠️ SSC calculation (partial)
- ❌ Provident fund
- ❌ Leave management
- ❌ OT calculation engine

---

### 5. Cash Flow Statement

**Gap**: No cash flow statement report.

**PEAK Report Types**:
- Direct method cash flow
- Indirect method cash flow

**Current State**:
- ✅ Balance Sheet
- ✅ Income Statement
- ❌ Cash Flow Statement

---

## Workflow Differences

### Document Workflow Comparison

| Workflow | PEAK | Our ERP | Gap |
|----------|------|---------|-----|
| Quotation → Invoice | Convert button | Manual create | ⚠️ |
| Invoice → Receipt | Link payment | Via receipt module | ✅ |
| Purchase Request → PO | Convert button | Convert available | ✅ |
| PO → GRN → Invoice | 3-way matching | Separate modules | ⚠️ |
| WHT from Payment | Auto-calculate | Partial | ⚠️ |
| VAT from Invoice | Auto-post | Auto-post | ✅ |

### Recurring Document Feature

**Gap**: PEAK has "Recurring" (auto-generate monthly) for:
- Recurring invoices
- Recurring expenses
- Recurring receipts

**Current State**: No recurring document feature.

---

## Improvements by Priority

### High Priority

1. **PP30 Form Generation**
   - Current: VAT report only
   - Needed: Full PP30 with all fields

2. **Bank Statement Import**
   - Current: Manual reconciliation
   - Needed: CAMT/OFX import, auto-matching

3. **Social Security Full Integration**
   - Current: Basic calculation
   - Needed: SSO filing, 50 ทวิ support

4. **Cash Flow Statement**
   - Current: None
   - Needed: Direct/indirect method

### Medium Priority

5. **Inventory Batch/Lot Tracking**
   - Needed for food/pharma industries

6. **Accrual/Prepayment Management**
   - Month-end accruals

7. **Project/Job Costing**
   - For construction/services industry

8. **Budget vs Actual with Approval**

### Low Priority

9. **Asset Revaluation**

10. **Multi-company Consolidation**

11. **e-Tax Invoice RD3 Integration**

---

## Feature Checklist

### Core Accounting ✅
- [x] Chart of Accounts (181 Thai standard accounts)
- [x] Double-entry bookkeeping
- [x] Journal entries (RV, UV, PV, SV, JV)
- [x] Trial Balance
- [x] Income Statement
- [x] Balance Sheet
- [ ] Cash Flow Statement

### Tax ✅ (Partial)
- [x] VAT 7% calculation
- [x] WHT PND3/PND53
- [ ] PP30 automated filing
- [ ] RD3 integration

### Banking ✅
- [x] Bank accounts
- [x] Cheque management
- [x] Petty cash
- [x] Bank reconciliation
- [ ] Bank statement import

### Inventory ⚠️
- [x] Stock tracking
- [x] Stock movements
- [x] Stock transfers
- [x] Stock takes
- [ ] Batch/Lot tracking
- [ ] Serial number
- [ ] Expiry date

### Assets ⚠️
- [x] Asset register
- [x] Depreciation (straight-line)
- [ ] Declining balance
- [ ] Revaluation
- [ ] Maintenance tracking

### Payroll ⚠️
- [x] Employee management
- [x] Payroll runs
- [x] Payslips
- [x] PND1 form
- [ ] SSO full integration
- [ ] Provident fund
- [ ] Leave management

### Documents ✅
- [x] Quotations
- [x] Invoices
- [x] Receipts
- [x] Credit/Debit Notes
- [x] Purchase Orders
- [x] Purchase Requests
- [ ] Recurring documents

---

## Recommended Implementation Order

### Phase 1: Tax Compliance
1. PP30 form generation
2. WHT form improvements (PND2, PND3, PND53)
3. e-Tax invoice preparation (RD3)

### Phase 2: Banking
1. Bank statement import (CAMT format)
2. Auto-matching algorithm
3. Direct debit support

### Phase 3: Inventory Enhancement
1. Batch/lot tracking
2. Expiry date management
3. Weighted average costing option

### Phase 4: Payroll Completeness
1. SSO filing integration
2. Provident fund tracking
3. Leave management
4. OT calculation engine

### Phase 5: Advanced Reporting
1. Cash flow statement
2. Budget vs actual with approval workflow
3. Project costing reports
4. DBD XBRL export improvement

---

## Code Architecture Notes

### Strengths
1. Clean service layer pattern (`src/lib/*-service.ts`)
2. Consistent API response format
3. Proper Satang/Baht conversion throughout
4. Double-entry validation enforced
5. Thai accounting standards compliance (TFRS)

### Improvement Areas
1. No unified workflow engine for document approvals
2. Inventory cost method hardcoded to FIFO
3. Period locking is basic, no sub-period support
4. No audit trail export to Excel

---

*Generated: 2026-04-17*
*Source: PEAK TH User Manual AFP.md vs. Thai Accounting ERP codebase*