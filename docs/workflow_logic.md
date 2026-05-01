# Accounting System — Complete Reference Documentation

## Workflow · Journal Entries · Database Architecture · Process Policies

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Buy Side — Procure-to-Pay (P2P)](#2-buy-side--procure-to-pay-p2p)
   - 2.1 Workflow Chart
   - 2.2 Step-by-Step Details
   - 2.3 Journal Entries Reference
3. [Sell Side — Order-to-Cash (O2C)](#3-sell-side--order-to-cash-o2c)
   - 3.1 Workflow Chart
   - 3.2 Step-by-Step Details
   - 3.3 Journal Entries Reference
4. [General Ledger Integration](#4-general-ledger-integration)
   - 4.1 Integration Hub Diagram
   - 4.2 Data Flows by Source
   - 4.3 GL Outputs
   - 4.4 Sub-Ledger Reconciliation
5. [Document → Workflow → Database Relationship](#5-document--workflow--database-relationship)
   - 5.1 Buy Side Mapping
   - 5.2 Sell Side Mapping
6. [Database Architecture](#6-database-architecture)
   - 6.1 Master Data Tables
   - 6.2 Buy Side Transaction Tables
   - 6.3 Sell Side Transaction Tables
   - 6.4 Inventory Tables
   - 6.5 Payment & Bank Tables
   - 6.6 General Ledger Tables
   - 6.7 Supporting Tables
   - 6.8 Foreign Key Relationship Map
   - 6.9 End-to-End Flow: Document → Transaction → GL
7. [Process Documentation & Policies](#7-process-documentation--policies)
   - 7.1 Buy Side Policies
   - 7.2 Sell Side Policies
   - 7.3 General Ledger Policies
8. [Quick Reference Cards](#8-quick-reference-cards)
9. [Development Checklists](#9-development-checklists)
10. [Database Table Summary](#10-database-table-summary)

---

## 1. System Overview

### Scope

This document covers the complete accounting workflow architecture for a
standard ERP-grade accounting system, spanning two core operational cycles and
their general ledger integration.

| Cycle              | Full Name            | Direction           | Steps | Sub-Ledgers     |
| ------------------ | -------------------- | ------------------- | ----- | --------------- |
| **Buy Side**       | Procure-to-Pay (P2P) | Money flows out     | 6     | AP, Inventory   |
| **Sell Side**      | Order-to-Cash (O2C)  | Money flows in      | 7     | AR, Revenue     |
| **GL Integration** | General Ledger Hub   | Central aggregation | —     | All sub-ledgers |

### Key Metrics

| Metric                         | Value                 |
| ------------------------------ | --------------------- |
| Buy-Side Process Steps         | 6                     |
| Sell-Side Process Steps        | 7                     |
| Sub-Ledgers Integrated         | 3 (AP, AR, Inventory) |
| Journal Entry Types Documented | 13                    |
| Process Policies               | 9                     |
| Database Tables Required       | ~44                   |

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         ACCOUNTING SYSTEM ARCHITECTURE                          │
│                                                                                 │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌─────────────────┐  │
│  │  SOURCE      │───▶│  WORKFLOW    │───▶│  TRANSACTION │───▶│  GENERAL LEDGER │  │
│  │  DOCUMENTS   │    │  ENGINE      │    │  DATABASE    │    │  DATABASE       │  │
│  └─────────────┘    └──────────────┘    └─────────────┘    └─────────────────┘  │
│        │                   │                   │                    │           │
│        ▼                   ▼                   ▼                    ▼           │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌─────────────────┐  │
│  │  MASTER      │    │  RULES &     │    │  SUB-LEDGER │    │  REPORTING      │  │
│  │  DATA        │    │  VALIDATION  │    │  DATABASE   │    │  DATABASE       │  │
│  └─────────────┘    └──────────────┘    └─────────────┘    └─────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Cycle Summaries

**Procure-to-Pay (P2P) Cycle** The buy-side cycle covers the entire procurement
process from internal purchase requisition through vendor payment. It ensures
proper authorization, three-way matching (PO vs GRN vs Invoice), and accurate
accounts payable recording. Key controls include budget validation, approval
hierarchies, and segregation of duties between requisitioners and approvers.

**Order-to-Cash (O2C) Cycle** The sell-side cycle manages the complete sales
process from customer inquiry through cash collection. It includes credit
management, order fulfillment, shipping execution, invoicing, and accounts
receivable reconciliation. Critical controls involve credit limit checks,
pricing validation, delivery confirmation, and dunning procedures for overdue
receivables.

---

## 2. Buy Side — Procure-to-Pay (P2P)

### 2.1 Workflow Chart

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐     ┌───────────────────┐     ┌──────────────────┐     ┌────────────────┐
│  1. Purchase  │────▶│ 2. Vendor Select │────▶│ 3. Goods     │────▶│ 4. Invoice        │────▶│ 5. Payment       │────▶│ 6. GL Posting  │
│  Requisition  │     │    & PO          │     │    Receipt   │     │    Verification   │     │    Processing    │     │    & Close     │
└──────────────┘     └──────────────────┘     └──────────────┘     └───────────────────┘     └──────────────────┘     └────────────────┘
  Requesting          Procurement              Warehouse             Accounts Payable           Treasury                General
  Department          / Purchasing             / Receiving                                    / Finance               Accounting

  [No Entry]         [No Entry]              [INVENTORY           [AP RECOGNIZED             [PAYMENT                [PERIOD CLOSE
  (Encumbrance)      (Commitment)             POSTED]              (3-Way Match)]             SETTLED]                (Reconciliation)]
```

**Legend:**

- `────▶` Data / document flow direction
- `[UPPERCASE]` Accounting entry first occurs at this step
- Steps 1–2 have no journal entries (commitment/encumbrance only)

### 2.2 Step-by-Step Details

---

#### Step 1 — Purchase Requisition

| Field             | Detail                                                                                                          |
| ----------------- | --------------------------------------------------------------------------------------------------------------- |
| **Responsible**   | Requesting Department                                                                                           |
| **Description**   | Internal request for goods or services, initiating the procurement process                                      |
| **Key Documents** | Purchase Requisition Form, Budget Approval Record, Specification Sheet                                          |
| **Key Fields**    | Requisition ID, Requester, Department, Item Description, Quantity, Estimated Cost, Required Date, Justification |
| **GL Entry**      | _None_ — no accounting entry at this stage. Creates an encumbrance/reservation against the budget only.         |

**Internal Controls:**

- Budget availability check
- Manager approval workflow
- Duplicate requisition detection
- Policy compliance validation

**Exception Handling:** Requisition rejected if over budget and no override
approval. Routed back to requester for correction if incomplete.

---

#### Step 2 — Vendor Selection & Purchase Order

| Field             | Detail                                                                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Responsible**   | Procurement / Purchasing                                                                                                                         |
| **Description**   | Evaluate vendors, create and send purchase order                                                                                                 |
| **Key Documents** | Purchase Order (PO), Vendor Evaluation Sheet, Quotation Comparison, Contract/Agreement                                                           |
| **Key Fields**    | PO Number, Vendor ID, Line Items (Item, Qty, Price, Delivery Date), Payment Terms, Incoterms, Ship-to Address                                    |
| **GL Entry**      | _None_ — PO is a commitment document. Some systems record an encumbrance: `Dr: Encumbrance / Cr: Reserve for Encumbrance` for budgetary control. |

**Internal Controls:**

- Preferred vendor list enforcement
- Competitive bidding for amounts above threshold
- PO authorization limits (tiered approval)
- Terms & conditions review

**Exception Handling:** PO split to avoid approval thresholds (flagged). Vendor
not on approved list requires additional approval.

---

#### Step 3 — Goods Receipt

| Field             | Detail                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------------ |
| **Responsible**   | Warehouse / Receiving                                                                                        |
| **Description**   | Receive and inspect delivered goods against the purchase order                                               |
| **Key Documents** | Goods Receipt Note (GRN), Delivery Note from Vendor, Quality Inspection Report, Packing List                 |
| **Key Fields**    | GRN Number, PO Reference, Material/Item Code, Received Qty, Inspected By, Batch/Lot Number, Storage Location |
| **GL Entry**      | See [Section 2.3](#23-journal-entries-reference)                                                             |

**Internal Controls:**

- Physical count vs PO quantities
- Quality inspection (sampling or full)
- Damage/shortage documentation
- Barcode/RFID scan verification

**Exception Handling:** Quantity variance >5% flagged for review. Quality
rejection triggers return-to-vendor process. Partial delivery recorded
separately.

---

#### Step 4 — Invoice Verification

| Field             | Detail                                                                                              |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| **Responsible**   | Accounts Payable                                                                                    |
| **Description**   | Three-way match: PO vs GRN vs Vendor Invoice                                                        |
| **Key Documents** | Vendor Invoice, PO Copy, GRN Copy, Discrepancy Report (if any)                                      |
| **Key Fields**    | Invoice Number, Invoice Date, Vendor, PO Reference, Tax Amount, Net Amount, Due Date, Payment Terms |
| **GL Entry**      | See [Section 2.3](#23-journal-entries-reference)                                                    |

**Internal Controls:**

- Three-way match (PO–GRN–Invoice)
- Price tolerance check (±2% or configured)
- Quantity tolerance check (±5% or configured)
- Duplicate invoice detection
- Tax calculation verification

**Exception Handling:** Match discrepancy blocked for payment — sent to
procurement for resolution. Invoice parked for manual review. Credit note
processed for overcharges.

---

#### Step 5 — Payment Processing

| Field             | Detail                                                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Responsible**   | Treasury / Finance                                                                                                             |
| **Description**   | Authorize and execute vendor payment                                                                                           |
| **Key Documents** | Payment Proposal, Payment Run Log, Bank Transfer Confirmation, Remittance Advice                                               |
| **Key Fields**    | Payment Run ID, Vendor, Invoice References, Payment Amount, Payment Method, Bank Account, Payment Date, Check/Reference Number |
| **GL Entry**      | See [Section 2.3](#23-journal-entries-reference)                                                                               |

**Internal Controls:**

- Payment due date optimization (early payment discount evaluation)
- Dual authorization for payments above threshold
- Bank account validation (IBAN verification)
- Blocked vendor check (sanctions, legal holds)
- Payment medium generation (EFT, check, wire)

**Exception Handling:** Payment blocked if vendor on hold list. Partial payments
require approval. Foreign currency payments use spot rate on payment date with
gain/loss recorded.

---

#### Step 6 — GL Posting & Period Close

| Field             | Detail                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| **Responsible**   | General Accounting                                                                                     |
| **Description**   | Finalize entries, reconcile sub-ledgers, and close the period                                          |
| **Key Documents** | GL Journal, Trial Balance, Sub-Ledger Reconciliation Report, Period-End Close Checklist                |
| **Key Fields**    | Period, Journal Entry Number, Account, Amount, Posting Date, Document Reference, Reconciliation Status |
| **GL Entry**      | See [Section 2.3](#23-journal-entries-reference)                                                       |

**Internal Controls:**

- AP sub-ledger to GL control account reconciliation
- Review of GR/IR clearing account (should be zero at period end)
- Accrual review (received-not-invoiced)
- Cut-off verification (goods received before period end)
- Intercompany matching (if applicable)

**Exception Handling:** GR/IR not clearing indicates missing invoices or receipt
discrepancies — requires investigation before period close.

---

### 2.3 Journal Entries Reference

#### Standard Buy-Side Entries

| Step                | Account             | Debit  | Credit | Description                   |
| ------------------- | ------------------- | ------ | ------ | ----------------------------- |
| **PO Created**      | _(No entry)_        | —      | —      | Commitment / encumbrance only |
| **Goods Receipt**   | Inventory / Expense | 10,000 |        | Recognize asset or expense    |
|                     | GR/IR Clearing      |        | 10,000 | Recognize temporary liability |
| **Invoice Receipt** | GR/IR Clearing      | 10,000 |        | Clear temporary liability     |
|                     | Accounts Payable    |        | 10,000 | Record vendor liability       |
| **Payment**         | Accounts Payable    | 10,000 |        | Settle vendor liability       |
|                     | Cash / Bank         |        | 10,000 | Reduce cash                   |

#### With Price Variance

| Step                | Account          | Debit  | Credit | Description                 |
| ------------------- | ---------------- | ------ | ------ | --------------------------- |
| **Invoice Receipt** | GR/IR Clearing   | 10,000 |        | Clear at PO price           |
|                     | Price Variance   | 200    |        | Record unfavorable variance |
|                     | Accounts Payable |        | 10,200 | Invoice at actual price     |

> _If favorable variance (invoice < PO), Price Variance is credited._

#### With Early Payment Discount (2/10 Net 30)

| Step        | Account          | Debit  | Credit | Description                 |
| ----------- | ---------------- | ------ | ------ | --------------------------- |
| **Payment** | Accounts Payable | 10,000 |        | Full liability              |
|             | Cash / Bank      |        | 9,800  | Net payment (2% discount)   |
|             | Discount Taken   |        | 200    | Revenue — purchase discount |

#### Period-End Accrual (Goods Received, Invoice Not Received)

| Step        | Account             | Debit | Credit | Description           |
| ----------- | ------------------- | ----- | ------ | --------------------- |
| **Accrual** | Inventory / Expense | 5,000 |        | Record received goods |
|             | AP Accrual          |       | 5,000  | Estimated liability   |

#### GR/IR Clearing at Period End (Residual)

| Step          | Account          | Debit | Credit | Description           |
| ------------- | ---------------- | ----- | ------ | --------------------- |
| **Clearance** | Price Difference | 150   |        | Clear remaining GR/IR |
|               | GR/IR Clearing   |       | 150    | Must reach zero       |

---

## 3. Sell Side — Order-to-Cash (O2C)

### 3.1 Workflow Chart

```
┌────────────────┐     ┌──────────────┐     ┌──────────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐     ┌────────────────┐
│ 1. Sales       │────▶│ 2. Sales     │────▶│ 3. Order         │────▶│ 4. Goods     │────▶│ 5. Invoice   │────▶│ 6. Payment       │────▶│ 7. AR Recon &   │
│    Inquiry/    │     │    Order     │     │    Fulfillment   │     │    Issue     │     │    / Billing │     │    Collection    │     │    Close        │
│    Quote       │     │              │     │                  │     │              │     │              │     │                  │     │                │
└────────────────┘     └──────────────┘     └──────────────────┘     └──────────────┘     └──────────────┘     └──────────────────┘     └────────────────┘
  Sales/Pre-Sales       Sales Ops            Warehouse/Logistics      Warehouse/Inv        Billing/AR           Treasury/AR             General Acctg

  [No Entry]          [No Entry]          [No Entry]             [COGS POSTED         [REVENUE              [CASH RECEIVED         [PERIOD CLOSE
  (Commercial)         (Reservation)        (Physical)             (Inventory ↓)]        RECOGNIZED]           (AR Settled)]          (Reconciliation)]
```

### 3.2 Step-by-Step Details

---

#### Step 1 — Sales Inquiry / Quote

| Field             | Detail                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| **Responsible**   | Sales / Pre-Sales                                                                                      |
| **Description**   | Customer inquiry response and quotation preparation                                                    |
| **Key Documents** | Request for Quotation (RFQ), Sales Quotation, Product Catalog / Price List, Proposal Document          |
| **Key Fields**    | Quote Number, Customer, Valid Until, Line Items, Unit Price, Discount %, Payment Terms, Delivery Terms |
| **GL Entry**      | _None_ — Quotation is a commercial document with no accounting impact.                                 |

**Internal Controls:**

- Pricing authorization (discount limits by role)
- Product availability check (ATP — Available-to-Promise)
- Customer creditworthiness pre-check
- Quotation validity period enforcement

**Exception Handling:** Discount above authorized limit requires sales manager
approval. Custom pricing for new products requires cost validation from finance.

---

#### Step 2 — Sales Order

| Field             | Detail                                                                                                                                                      |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Responsible**   | Sales Operations                                                                                                                                            |
| **Description**   | Confirm order, check credit, and reserve stock                                                                                                              |
| **Key Documents** | Sales Order (SO), Customer PO, Confirmed Quote, Credit Check Result                                                                                         |
| **Key Fields**    | SO Number, Customer PO Number, Order Date, Requested Delivery Date, Line Items, Confirmed Qty, Net Value, Tax                                               |
| **GL Entry**      | _None_ — Sales order is a commitment. Some systems create a reservation: `Dr: Inventory Reserved / Cr: Inventory Available` (physical inventory unchanged). |

**Internal Controls:**

- Formal credit limit check (blocking if exceeded)
- Order-to-quote variance check
- Delivery date feasibility validation
- Backorder handling rules

**Exception Handling:** Credit block — order cannot proceed until credit
released by finance. Partial confirmation if stock insufficient. Order rejected
if terms unacceptable.

---

#### Step 3 — Order Fulfillment

| Field             | Detail                                                                                              |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| **Responsible**   | Warehouse / Logistics                                                                               |
| **Description**   | Pick, pack, and prepare shipment                                                                    |
| **Key Documents** | Pick List, Packing Slip, Shipping Label, Customs Documents (if international)                       |
| **Key Fields**    | Delivery Number, Pick List ID, Packed By, Shipment ID, Carrier, Tracking Number, Weight, Dimensions |
| **GL Entry**      | _None_ — Physical movement only. No accounting impact until goods issue is posted.                  |

**Internal Controls:**

- Pick list accuracy (item, qty, batch verification)
- Packing quality check
- Weight/dimension verification for shipping cost
- Hazardous material handling compliance

**Exception Handling:** Short pick triggers backorder creation. Damaged goods
during packing require adjustment. Shipping delay triggers customer
notification.

---

#### Step 4 — Goods Issue

| Field             | Detail                                                                                                                |
| ----------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Responsible**   | Warehouse / Inventory                                                                                                 |
| **Description**   | Post inventory reduction and recognize cost of goods sold                                                             |
| **Key Documents** | Goods Issue Document, Delivery Note, Material Movement Record                                                         |
| **Key Fields**    | Material Document Number, Delivery Reference, Material Code, Issued Qty, Movement Type, Storage Location, Cost Center |
| **GL Entry**      | See [Section 3.3](#33-journal-entries-reference)                                                                      |

**Internal Controls:**

- Delivery note vs sales order verification
- Serial number/batch tracking update
- Real-time inventory update
- Negative stock prevention (unless configured)

**Exception Handling:** Negative inventory blocked unless override authorized.
Batch-managed items require specific batch selection. Consignment stock treated
differently.

---

#### Step 5 — Invoice / Billing

| Field             | Detail                                                                                                           |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Responsible**   | Billing / Accounts Receivable                                                                                    |
| **Description**   | Generate and send customer invoice                                                                               |
| **Key Documents** | Sales Invoice, Proforma Invoice (if required), Tax Invoice, E-invoice (XML/EDI)                                  |
| **Key Fields**    | Invoice Number, Invoice Date, SO Reference, Customer, Tax ID, Line Items, Tax Breakdown, Due Date, Payment Terms |
| **GL Entry**      | See [Section 3.3](#33-journal-entries-reference)                                                                 |

**Internal Controls:**

- Invoice vs delivery note verification
- Pricing verification (contract price, discounts)
- Tax calculation compliance (VAT/GST rates by jurisdiction)
- Duplicate invoice prevention
- Revenue recognition criteria check (ASC 606 / IFRS 15)

**Exception Handling:** Revenue split if multiple performance obligations.
Billing block on disputed deliveries. Credit memo issued for returns or price
adjustments.

---

#### Step 6 — Payment Collection

| Field             | Detail                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| **Responsible**   | Treasury / AR                                                                                          |
| **Description**   | Receive and apply customer payment                                                                     |
| **Key Documents** | Bank Statement, Remittance Advice, Payment Allocation Report, Lockbox Report                           |
| **Key Fields**    | Payment Reference, Customer, Invoice Numbers Cleared, Amount, Payment Method, Bank Account, Value Date |
| **GL Entry**      | See [Section 3.3](#33-journal-entries-reference)                                                       |

**Internal Controls:**

- Automatic payment matching (algorithms for invoice-to-payment)
- Unapplied cash monitoring
- Dunning process for overdue invoices
- Customer dispute resolution workflow

**Exception Handling:** Short payment — residual left on customer account or
written off. Overpayment — create customer credit balance. Dishonored payment —
reverse and restart dunning.

---

#### Step 7 — AR Reconciliation & Period Close

| Field             | Detail                                                                                                            |
| ----------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Responsible**   | General Accounting / AR                                                                                           |
| **Description**   | Reconcile AR, run aging analysis, and close the period                                                            |
| **Key Documents** | AR Aging Report, Sub-Ledger Reconciliation, Bad Debt Provision Worksheet, Period-End Close Checklist              |
| **Key Fields**    | Period, Customer, Outstanding Balance, Aging Bucket, Provision Amount, Reconciliation Status, Confirmation Status |
| **GL Entry**      | See [Section 3.3](#33-journal-entries-reference)                                                                  |

**Internal Controls:**

- AR sub-ledger to GL control account reconciliation
- Aging analysis (30/60/90/120+ days)
- Bad debt provision calculation (expected credit loss model)
- Revenue cut-off review
- Customer balance confirmation (for significant balances)

**Exception Handling:** AR balance not reconciling — investigate unposted or
misposted entries. Abnormal aging spikes — escalate to credit management.
Significant provisions — management review required.

---

### 3.3 Journal Entries Reference

#### Standard Sell-Side Entries

| Step                 | Account             | Debit  | Credit | Description                           |
| -------------------- | ------------------- | ------ | ------ | ------------------------------------- |
| **SO Created**       | _(No entry)_        | —      | —      | Order confirmation / reservation only |
| **Goods Issue**      | Cost of Goods Sold  | 7,000  |        | Recognize COGS                        |
|                      | Inventory           |        | 7,000  | Reduce finished goods                 |
| **Invoice**          | Accounts Receivable | 11,900 |        | Record receivable (gross)             |
|                      | Sales Revenue       |        | 10,000 | Record revenue (net)                  |
|                      | Output Tax (VAT)    |        | 1,900  | Record output tax liability           |
| **Payment Received** | Cash / Bank         | 11,900 |        | Record cash inflow                    |
|                      | Accounts Receivable |        | 11,900 | Settle customer receivable            |

#### With Standard Costing Variance

| Step            | Account            | Debit | Credit | Description                              |
| --------------- | ------------------ | ----- | ------ | ---------------------------------------- |
| **Goods Issue** | Cost of Goods Sold | 7,000 |        | COGS at standard cost                    |
|                 | Inventory          |       | 7,000  | Inventory at standard cost               |
|                 | PPV — Sales        | 300   |        | Unfavorable variance (actual > standard) |

> _If favorable variance (actual < standard), PPV — Sales is credited._

#### With Customer Advance Received Earlier

| Step                 | Account             | Debit | Credit | Description        |
| -------------------- | ------------------- | ----- | ------ | ------------------ |
| **Advance Received** | Cash / Bank         | 5,000 |        | Receive prepayment |
|                      | Customer Advance    |       | 5,000  | Record liability   |
| **On Invoice**       | Customer Advance    | 5,000 |        | Clear advance      |
|                      | Accounts Receivable | 6,900 |        | Remaining balance  |
|                      | Sales Revenue       |       | 10,000 | Full revenue       |
|                      | Output Tax (VAT)    |       | 1,900  | Full tax           |

#### Bad Debt Provision & Write-Off

| Step          | Account                         | Debit | Credit | Description             |
| ------------- | ------------------------------- | ----- | ------ | ----------------------- |
| **Provision** | Bad Debt Expense                | 2,000 |        | Recognize expected loss |
|               | Allowance for Doubtful Accounts |       | 2,000  | Contra-asset            |
| **Write-Off** | Allowance for Doubtful Accounts | 2,000 |        | Use provision           |
|               | Accounts Receivable             |       | 2,000  | Remove receivable       |

#### Revenue Cut-Off Correction

| Step                        | Account          | Debit  | Credit | Description                 |
| --------------------------- | ---------------- | ------ | ------ | --------------------------- |
| **Reverse (wrong period)**  | Revenue          | 10,000 |        | Reverse incorrect period    |
|                             | Deferred Revenue |        | 10,000 | Defer to correct period     |
| **Recognize (next period)** | Deferred Revenue | 10,000 |        | Recognize in correct period |
|                             | Revenue          |        | 10,000 |                             |

---

## 4. General Ledger Integration

### 4.1 Integration Hub Diagram

```
                              ┌──────────────┐
                              │ Trial Balance │
                              │ Dr = Cr check │
                              └──────┬───────┘
                                     │
                                     ▼
┌──────────────┐              ┌──────────────┐              ┌──────────────┐
│ AP Sub-Ledger│──────────────│              │──────────────│ AR Sub-Ledger│
│ Vendor       │              │              │              │ Customer     │
│ Balances     │              │              │              │ Balances     │
└──────────────┘              │              │              └──────────────┘
                             │  GENERAL     │
┌──────────────┐              │  LEDGER      │              ┌──────────────┐
│ Inventory    │──────────────│              │──────────────│ Revenue      │
│ Stock        │              │  Central Hub │              │ Recognition  │
│ Valuation    │              │              │              └──────────────┘
└──────────────┘              │              │
                             │              │              ┌──────────────┐
┌──────────────┐              │              │──────────────│ Financial    │
│ Cash / Bank  │──────────────│              │              │ Statements   │
│ Payment Flows│              └──────────────┘              │ P&L, BS, CF  │
└──────────────┘                                            └──────────────┘

┌──────────────┐
│ Expenses     │──────────────┐
│ Cost         │              │
│ Recognition  │              │
└──────────────┘              │
           \                   │
            ──────────────────┘
```

### 4.2 Data Flows by Source

#### From Buy Side

| Sub-Ledger       | Data Sent to GL                               | Frequency                       |
| ---------------- | --------------------------------------------- | ------------------------------- |
| AP Sub-Ledger    | Vendor balance totals, invoice-level postings | Per invoice verification        |
| Inventory        | Asset value changes, stock movements          | Per goods receipt               |
| Expense Accounts | Departmental charges, cost center allocations | Per goods receipt or period-end |
| GR/IR Clearing   | Temporary liability clearing entries          | Per invoice match               |
| Cash / Bank      | Disbursement records, bank fee entries        | Per payment run                 |

#### From Sell Side

| Sub-Ledger       | Data Sent to GL                                 | Frequency           |
| ---------------- | ----------------------------------------------- | ------------------- |
| AR Sub-Ledger    | Customer balance totals, invoice-level postings | Per invoice         |
| Revenue          | Revenue recognition entries by product/segment  | Per invoice         |
| COGS / Inventory | Cost recognition and inventory reduction        | Per goods issue     |
| Tax Liability    | Output VAT/GST by jurisdiction                  | Per invoice         |
| Cash / Bank      | Receipt records, bank fee entries               | Per payment receipt |

### 4.3 GL Outputs

| Output                     | Description                                                 | Frequency                    |
| -------------------------- | ----------------------------------------------------------- | ---------------------------- |
| **Trial Balance**          | All GL accounts with debit/credit totals; validates Dr = Cr | Every posting run            |
| **Income Statement (P&L)** | Revenue, COGS, operating expenses, net income               | Monthly / Quarterly / Annual |
| **Balance Sheet**          | Assets, liabilities, equity at period end                   | Monthly / Quarterly / Annual |
| **Cash Flow Statement**    | Operating, investing, financing cash flows                  | Quarterly / Annual           |
| **AR Aging Report**        | Outstanding receivables by 30/60/90/120+ day buckets        | Weekly / Monthly             |
| **AP Aging Report**        | Outstanding payables by due date buckets                    | Weekly / Monthly             |

### 4.4 Sub-Ledger Reconciliation

> **CRITICAL CONTROL**
>
> The sum of AP sub-ledger balances **must equal** the AP control account in the
> GL. Similarly, AR sub-ledger **must reconcile** to the AR control account. Any
> discrepancy indicates posting errors, timing differences, or missing entries.
> Monthly reconciliation is a **mandatory control** before period-end close.

**Reconciliation Process:**

```
AP Sub-Ledger Total  ─────┐
                          ├──▶  Match?  ──── YES ──▶ [Reconciliation Complete]
GL AP Control Account ───┘                    │
                                               NO
                                               │
                                               ▼
                                    Investigate:
                                    - Unposted sub-ledger items
                                    - Direct GL postings (bypass)
                                    - Wrong period entries
                                    - Currency translation diffs
                                    - Deleted/voided documents
```

**Common Discrepancy Causes:**

| Cause                                                  | Impact                    | Resolution                             |
| ------------------------------------------------------ | ------------------------- | -------------------------------------- |
| Direct GL posting to AP control (bypassing sub-ledger) | GL ≠ Sub-ledger           | Reverse and post through sub-ledger    |
| Sub-ledger document in different period                | Timing difference         | Verify cut-off rules                   |
| Currency revaluation at different rates                | GL vs Sub-ledger variance | Re-run revaluation consistently        |
| Manual journal adjusting AP control                    | Unmatched entry           | Identify and reverse, re-post properly |
| Deleted sub-ledger document                            | Sub-ledger lower than GL  | Reinstate or post offsetting entry     |

---

## 5. Document → Workflow → Database Relationship

### 5.1 Buy Side Mapping

```
BUY SIDE — PROCURE TO PAY
═══════════════════════════

SOURCE DOCUMENT           WORKFLOW STEP           DATABASE TABLE
──────────────           ─────────────           ──────────────

┌──────────────┐
│ Purchase     │           ┌──────────────┐       ┌──────────────────────┐
│ Requisition  │──────────▶│ 1. Create    │──────▶│ purchase_requisitions│
│ (PR)         │           │    Request   │       │ purchase_req_lines   │
└──────────────┘           └──────┬───────┘       └──────────────────────┘
                                 │
                                 ▼
                         ┌──────────────┐       ┌──────────────────────┐
┌──────────────┐         │ 2. Approve   │──────▶│ approval_logs        │
│ Approval     │─────────▶│    PR        │       │ approval_rules       │
│ Record       │         │    Budget    │       └──────────────────────┘
│ (attached)   │         │    Check     │
└──────────────┘         └──────┬───────┘
                                 │
                                 ▼
                         ┌──────────────┐       ┌──────────────────────┐
┌──────────────┐         │ 3. Select    │──────▶│ vendors               │
│ Vendor       │─────────▶│    Vendor    │       │ vendor_quotations    │
│ Quotation    │         │    Create PO │       └──────────────────────┘
└──────────────┘         └──────┬───────┘       ┌──────────────────────┐
                                 │               │ purchase_orders      │
┌──────────────┐         ┌──────┴───────┐       │ po_lines             │
│ Purchase     │────────▶│              │──────▶│ po_terms             │
│ Order (PO)   │         │              │       └──────────────────────┘
└──────────────┘         └──────────────┘
                                 │
                                 ▼
                         ┌──────────────┐       ┌──────────────────────┐
┌──────────────┐         │ 4. Receive   │──────▶│ goods_receipts       │
│ Goods Receipt│────────▶│    Goods     │       │ gr_lines             │
│ Note (GRN)   │         │    (GRN)     │       └──────────────────────┘
└──────────────┘         └──────┬───────┘       ┌──────────────────────┐
                                 │               │ inventory_transactions│
┌──────────────┐         ┌──────┴───────┐       │ inventory_balances   │
│ Inspection   │─────────▶│ 5. 3-Way    │──────▶│ three_way_matches    │
│ Report       │         │    Match     │       └──────────────────────┘
└──────────────┘         └──────┬───────┘
                                 │
                                 ▼
                         ┌──────────────┐       ┌──────────────────────┐
┌──────────────┐         │ 6. Post      │──────▶│ ap_invoices          │
│ Vendor       │─────────▶│    AP        │       │ ap_invoice_lines     │
│ Invoice      │         │    Invoice   │       └──────────────────────┘
└──────────────┘         └──────┬───────┘       ┌──────────────────────┐
                                 │               │ gl_journal_entries   │
                                 │               │ gl_journal_lines     │
                                 │               └──────────────────────┘
                                 ▼
                         ┌──────────────┐       ┌──────────────────────┐
┌──────────────┐         │ 7. Pay       │──────▶│ payment_proposals    │
│ Payment      │─────────▶│    Vendor    │       │ payments             │
│ Voucher      │         │              │       │ payment_allocations  │
└──────────────┘         └──────┬───────┘       └──────────────────────┘
                                 │               ┌──────────────────────┐
┌──────────────┐         ┌──────┴───────┐       │ bank_transactions    │
│ Bank         │─────────▶│ 8. Reconcile │──────▶│ bank_statements      │
│ Statement    │         │    Bank      │       │ bank_reconciliations │
└──────────────┘         └──────────────┘       └──────────────────────┘
```

### 5.2 Sell Side Mapping

```
SELL SIDE — ORDER TO CASH
═════════════════════════

SOURCE DOCUMENT           WORKFLOW STEP           DATABASE TABLE
──────────────           ─────────────           ──────────────

┌──────────────┐
│ Customer     │           ┌──────────────┐       ┌──────────────────────┐
│ RFQ          │──────────▶│ 1. Receive   │──────▶│ sales_inquiries     │
└──────────────┘           │    Inquiry   │       │ sales_quotations    │
                          │    Quote     │       │ quotation_lines     │
                          └──────┬───────┘       └──────────────────────┘
                                 │
                                 ▼
                         ┌──────────────┐       ┌──────────────────────┐
┌──────────────┐         │ 2. Credit    │──────▶│ credit_checks        │
│ Credit       │─────────▶│    Check     │       │ credit_limits        │
│ Report       │         │    Customer  │       └──────────────────────┘
└──────────────┘         └──────┬───────┘
                                │
                                ▼
                        ┌──────────────┐       ┌──────────────────────┐
┌──────────────┐        │ 3. Create    │──────▶│ sales_orders         │
│ Customer     │───────▶│    Sales     │       │ so_lines             │
│ PO           │        │    Order     │       └──────────────────────┘
└──────────────┘        └──────┬───────┘       ┌──────────────────────┐
                                │               │ inventory_reservations│
                                ▼               └──────────────────────┘
                        ┌──────────────┐       ┌──────────────────────┐
┌──────────────┐        │ 4. Fulfill   │──────▶│ deliveries           │
│ Delivery     │───────▶│    Pick/Pack │       │ delivery_lines       │
│ Note         │        │    Ship      │       └──────────────────────┘
└──────────────┘        └──────┬───────┘
                               │
                               ▼
                       ┌──────────────┐       ┌──────────────────────┐
┌──────────────┐       │ 5. Goods     │──────▶│ goods_issues         │
│ Goods Issue  │──────▶│    Issue     │       │ gi_lines             │
│ Document     │       │    (GI)      │       └──────────────────────┘
└──────────────┘       └──────┬───────┘       ┌──────────────────────┐
                               │               │ inventory_transactions│
                               │               │ inventory_balances   │
                               ▼               └──────────────────────┘
                       ┌──────────────┐       ┌──────────────────────┐
┌──────────────┐       │ 6. Invoice   │──────▶│ ar_invoices         │
│ Sales        │──────▶│    Customer  │       │ ar_invoice_lines     │
│ Invoice      │       └──────┬───────┘       │ tax_details          │
└──────────────┘              │               └──────────────────────┘
                              │               ┌──────────────────────┐
                              │               │ gl_journal_entries   │
                              │               │ gl_journal_lines     │
                              │               └──────────────────────┘
                              ▼
                      ┌──────────────┐       ┌──────────────────────┐
┌──────────────┐      │ 7. Collect   │──────▶│ cash_receipts        │
│ Receipt      │─────▶│    Payment   │       │ receipt_allocations  │
└──────────────┘      └──────┬───────┘       └──────────────────────┘
                             │               ┌──────────────────────┐
                             │               │ bank_transactions    │
                             ▼               │ bank_statements      │
                     ┌──────────────┐       └──────────────────────┘
┌──────────────┐     │ 8. Reconcile │       ┌──────────────────────┐
│ Aging /      │────▶│    & Close   │──────▶│ ar_aging             │
│ Dunning      │     └──────────────┘       │ bad_debt_provisions  │
│ Reports      │                            └──────────────────────┘
└──────────────┘
```

---

## 6. Database Architecture

### 6.1 Master Data Tables

```
┌──────────────────────────────────────────────────────────────────┐
│                       MASTER DATA                                │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  chart_of_accounts                    vendors                    │
│  ┌────────────────────┐              ┌────────────────────┐      │
│  │ acct_id        PK  │              │ vendor_id      PK  │      │
│  │ code                │              │ name                │      │
│  │ name                │              │ tax_id              │      │
│  │ type                │              │ bank_account        │      │
│  │ │── ASSET           │              │ payment_term_id FK  │──────┼──▶ payment_terms
│  │ │── LIABILITY       │              │ currency_id FK      │──────┼──▶ currencies
│  │ │── EQUITY          │              │ status              │      │
│  │ │── REVENUE         │              └────────┬───────────┘      │
│  │ │── EXPENSE         │                       │                  │
│  │ parent_acct_id FK   │              vendor_bank_accounts       │
│  │ status              │              ┌────────────────────┐      │
│  └────────────────────┘              │ account_id      PK  │      │
│         │                            │ vendor_id FK        │──────┘
│         │                            │ bank_name           │      │
│         │                            │ account_number      │      │
│         │                            │ is_default          │      │
│         │                            └────────────────────┘      │
│         │                                                       │
│  customers                       items                           │
│  ┌────────────────────┐              ┌────────────────────┐      │
│  │ cust_id        PK  │              │ item_id        PK  │      │
│  │ name                │              │ code                │      │
│  │ tax_id              │              │ name                │      │
│  │ credit_limit        │              │ uom                 │      │
│  │ payment_term_id FK  │──────────────┼──▶ payment_terms    │      │
│  │ currency_id FK      │──────────────┼──▶ currencies       │      │
│  │ customer_group      │              │ category            │      │
│  │ status              │              │ cost_method         │      │
│  └────────┬───────────┘              │ standard_cost       │      │
│           │                          │ gl_acct_id FK       │──────┘
│           │                          │ tax_code_id FK      │──────┘
│  customer_bank_accounts              └────────┬───────────┘
│  ┌────────────────────┐                       │
│  │ account_id      PK  │              item_prices (price lists)
│  │ cust_id FK          │              ┌────────────────────┐
│  │ bank_name           │              │ price_id       PK  │
│  │ account_number      │              │ item_id FK          │
│  │ is_default          │              │ price_list          │
│  └────────────────────┘              │ unit_price          │
│                                      │ valid_from          │
│  tax_codes                            │ valid_to            │
│  ┌────────────────────┐              │ currency_id FK      │
│  │ tax_id         PK  │              └────────────────────┘
│  │ code                │
│  │ rate                │              warehouses
│  │ type                │              ┌────────────────────┐
│  │ │── INPUT VAT       │              │ wh_id          PK  │
│  │ │── OUTPUT VAT      │              │ name                │
│  │ │── WITHHOLDING     │              │ location            │
│  │ gl_acct_id FK       │              │ status              │
│  │ effective_date      │              └────────┬───────────┘
│  │ status              │                       │
│  └────────────────────┘              warehouse_locations
│                                      ┌────────────────────┐
│  currencies                           │ loc_id         PK  │
│  ┌────────────────────┐              │ wh_id FK           │
│  │ curr_id        PK  │              │ location_code      │
│  │ code                │              │ aisle              │
│  │ name                │              │ rack               │
│  │ exchange_rate       │              │ shelf              │
│  │ rate_date           │              │ bin                │
│  │ status              │              └────────────────────┘
│  └────────────────────┘
│                                                  payment_terms
│  cost_centers                                      ┌────────────────────┐
│  ┌────────────────────┐                            │ term_id        PK  │
│  │ cc_id          PK  │                            │ code                │
│  │ code                │                            │ description         │
│  │ name                │                            │ net_days            │
│  │ manager_id FK       │────────────────────────────│ discount_pct        │
│  │ status              │                            │ discount_days       │
│  └────────────────────┘                            └────────────────────┘
│
│  departments                     users
│  ┌────────────────────┐          ┌────────────────────┐
│  │ dept_id        PK  │          │ user_id        PK  │
│  │ name                │          │ username            │
│  │ cc_id FK            │          │ full_name           │
│  │ manager_id FK       │          │ email               │
│  │ status              │          │ role                │
│  └────────────────────┘          │ dept_id FK          │
│                                  │ status              │
│                                  │ last_login          │
│                                  └────────────────────┘
└──────────────────────────────────────────────────────────────────┘
```

### 6.2 Buy Side Transaction Tables

```
┌──────────────────────────────────────────────────────────────────┐
│                    BUY SIDE TRANSACTION TABLES                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  purchase_requisitions                 purchase_orders            │
│  ┌────────────────────┐               ┌────────────────────┐     │
│  │ req_id         PK  │               │ po_id          PK  │     │
│  │ req_number          │               │ po_number           │     │
│  │ dept_id FK          │──▶ departments│ vendor_id FK        │──▶ vendors
│  │ requester_id FK     │──▶ users      │ req_id FK           │──▶ purchase_reqs
│  │ req_date            │               │ po_date             │     │
│  │ required_date       │               │ payment_term_id FK  │     │
│  │ status              │               │ delivery_date       │     │
│  │ │── DRAFT           │               │ status              │     │
│  │ │── PENDING_APPROVAL│               │ │── DRAFT           │     │
│  │ │── APPROVED        │               │ │── SENT            │     │
│  │ │── REJECTED        │               │ │── PARTIAL_RCVD    │     │
│  │ │── CANCELLED       │               │ │── RECEIVED        │     │
│  │ total_amount        │               │ │── CLOSED          │     │
│  │ notes               │               │ total_amount        │     │
│  └────────┬───────────┘               │ currency_id FK      │     │
│           │                           └────────┬───────────┘     │
│           │ 1:N                                │ 1:N             │
│           ▼                                    ▼                 │
│  purchase_req_lines                   purchase_order_lines       │
│  ┌────────────────────┐               ┌────────────────────┐     │
│  │ line_id        PK  │               │ line_id        PK  │     │
│  │ req_id FK           │               │ po_id FK            │     │
│  │ item_id FK          │──▶ items      │ item_id FK          │──▶ items
│  │ quantity            │               │ quantity            │     │
│  │ estimated_price     │               │ unit_price          │     │
│  │ gl_acct_id FK       │──▶ chart_of   │ gl_acct_id FK       │──▶ chart_of
│  │ cost_center_id FK   │    accounts   │ cost_center_id FK   │     │
│  │ notes               │               │ delivery_date       │     │
│  └────────────────────┘               └────────────────────┘     │
│                                                                  │
│  goods_receipts (GRN)                                            │
│  ┌────────────────────┐                                         │
│  │ grn_id         PK  │                                         │
│  │ grn_number          │                                         │
│  │ po_id FK            │──▶ purchase_orders                      │
│  │ vendor_id FK        │──▶ vendors                             │
│  │ wh_id FK            │──▶ warehouses                         │
│  │ grn_date            │                                         │
│  │ received_by FK      │──▶ users                               │
│  │ status              │                                         │
│  │ │── DRAFT           │                                         │
│  │ │── POSTED          │                                         │
│  │ │── INSPECTED       │                                         │
│  │ total_qty_received  │                                         │
│  └────────┬───────────┘                                         │
│           │ 1:N                                                  │
│           ▼                                                      │
│  gr_lines                                                        │
│  ┌────────────────────┐                                         │
│  │ line_id        PK  │                                         │
│  │ grn_id FK           │                                         │
│  │ item_id FK          │──▶ items                                │
│  │ po_line_id FK       │──▶ purchase_order_lines                 │
│  │ qty_ordered         │                                         │
│  │ qty_received        │                                         │
│  │ qty_rejected        │                                         │
│  │ batch_no            │                                         │
│  │ wh_loc_id FK        │──▶ warehouse_locations                 │
│  │ unit_cost           │                                         │
│  └────────────────────┘                                         │
│                                                                  │
│  ap_invoices                                                     │
│  ┌────────────────────┐                                         │
│  │ inv_id         PK  │                                         │
│  │ inv_number          │                                         │
│  │ po_id FK            │──▶ purchase_orders                      │
│  │ vendor_id FK        │──▶ vendors                             │
│  │ inv_date            │                                         │
│  │ due_date            │                                         │
│  │ net_amount          │                                         │
│  │ tax_amount          │                                         │
│  │ total_amount        │                                         │
│  │ status              │                                         │
│  │ │── DRAFT           │                                         │
│  │ │── PARKED          │  ◀── blocked for review                 │
│  │ │── MATCHED         │                                         │
│  │ │── APPROVED        │                                         │
│  │ │── PAID            │                                         │
│  │ currency_id FK      │                                         │
│  └────────┬───────────┘                                         │
│           │ 1:N                                                  │
│           ▼                                                      │
│  ap_invoice_lines                                                 │
│  ┌────────────────────┐                                         │
│  │ line_id        PK  │                                         │
│  │ inv_id FK           │                                         │
│  │ item_id FK          │──▶ items                                │
│  │ po_line_id FK       │──▶ purchase_order_lines                 │
│  │ gr_line_id FK       │──▶ gr_lines                             │
│  │ quantity            │                                         │
│  │ unit_price          │                                         │
│  │ tax_code_id FK      │──▶ tax_codes                            │
│  │ gl_acct_id FK       │──▶ chart_of_accounts                    │
│  │ net_amount          │                                         │
│  │ tax_amount          │                                         │
│  └────────────────────┘                                         │
└──────────────────────────────────────────────────────────────────┘
```

### 6.3 Sell Side Transaction Tables

```
┌──────────────────────────────────────────────────────────────────┐
│                   SELL SIDE TRANSACTION TABLES                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  sales_quotations                      sales_orders              │
│  ┌────────────────────┐               ┌────────────────────┐     │
│  │ qt_id          PK  │               │ so_id          PK  │     │
│  │ qt_number           │               │ so_number           │     │
│  │ cust_id FK          │──▶ customers  │ qt_id FK            │──▶ sales_quotations
│  │ qt_date             │               │ cust_id FK          │──▶ customers
│  │ valid_until         │               │ cust_po_number      │     │
│  │ status              │               │ so_date             │     │
│  │ │── DRAFT           │               │ requested_date      │     │
│  │ │── SENT            │               │ confirmed_date      │     │
│  │ │── ACCEPTED        │               │ payment_term_id FK  │     │
│  │ │── REJECTED        │               │ status              │     │
│  │ │── EXPIRED         │               │ │── DRAFT           │     │
│  │ │── CONVERTED       │──▶ SO         │ │── CONFIRMED       │     │
│  │ total_amount        │               │ │── CREDIT_BLOCK    │     │
│  │ currency_id FK      │               │ │── PICKING         │     │
│  └────────┬───────────┘               │ │── SHIPPED         │     │
│           │ 1:N                        │ │── INVOICED        │     │
│           ▼                            │ │── CLOSED          │     │
│  quotation_lines                       │ total_amount        │     │
│  ┌────────────────────┐               │ currency_id FK      │     │
│  │ line_id        PK  │               └────────┬───────────┘     │
│  │ qt_id FK            │                        │ 1:N             │
│  │ item_id FK          │──▶ items               ▼                 │
│  │ quantity            │               sales_order_lines         │
│  │ unit_price          │               ┌────────────────────┐     │
│  │ discount_pct        │               │ line_id        PK  │     │
│  │ gl_acct_id FK       │──▶ chart_of   │ so_id FK            │     │
│  │ notes               │    accounts   │ item_id FK          │──▶ items
│  └────────────────────┘               │ quantity_ordered     │     │
│                                      │ quantity_confirmed   │     │
│                                      │ unit_price           │     │
│                                      │ discount_pct         │     │
│                                      │ gl_acct_id FK       │     │
│                                      └────────────────────┘     │
│                                                                  │
│  deliveries (shipping)                                           │
│  ┌────────────────────┐                                         │
│  │ delivery_id    PK  │                                         │
│  │ so_id FK            │──▶ sales_orders                        │
│  │ carrier             │                                         │
│  │ tracking_number     │                                         │
│  │ ship_date           │                                         │
│  │ delivery_date       │                                         │
│  │ wh_id FK            │──▶ warehouses                         │
│  │ status              │                                         │
│  └────────┬───────────┘                                         │
│           │ 1:N                                                  │
│           ▼                                                      │
│  delivery_lines                                                  │
│  ┌────────────────────┐                                         │
│  │ line_id        PK  │                                         │
│  │ delivery_id FK      │                                         │
│  │ so_line_id FK       │──▶ sales_order_lines                   │
│  │ item_id FK          │──▶ items                                │
│  │ qty_shipped         │                                         │
│  │ batch_no            │                                         │
│  └────────────────────┘                                         │
│                                                                  │
│  goods_issues (GI)                                               │
│  ┌────────────────────┐                                         │
│  │ gi_id          PK  │                                         │
│  │ gi_number          │                                         │
│  │ so_id FK            │──▶ sales_orders                        │
│  │ delivery_id FK      │──▶ deliveries                          │
│  │ cust_id FK          │──▶ customers                           │
│  │ wh_id FK            │──▶ warehouses                         │
│  │ gi_date             │                                         │
│  │ issued_by FK        │──▶ users                               │
│  │ status              │                                         │
│  │ total_qty_issued    │                                         │
│  └────────┬───────────┘                                         │
│           │ 1:N                                                  │
│           ▼                                                      │
│  gi_lines                                                        │
│  ┌────────────────────┐                                         │
│  │ line_id        PK  │                                         │
│  │ gi_id FK            │                                         │
│  │ item_id FK          │──▶ items                                │
│  │ so_line_id FK       │──▶ sales_order_lines                   │
│  │ qty_ordered         │                                         │
│  │ qty_issued          │                                         │
│  │ batch_no            │                                         │
│  │ wh_loc_id FK        │──▶ warehouse_locations                 │
│  │ unit_cost           │                                         │
│  └────────────────────┘                                         │
│                                                                  │
│  ar_invoices                                                     │
│  ┌────────────────────┐                                         │
│  │ inv_id         PK  │                                         │
│  │ inv_number          │                                         │
│  │ so_id FK            │──▶ sales_orders                        │
│  │ cust_id FK          │──▶ customers                           │
│  │ inv_date            │                                         │
│  │ due_date            │                                         │
│  │ net_amount          │                                         │
│  │ tax_amount          │                                         │
│  │ total_amount        │                                         │
│  │ status              │                                         │
│  │ │── DRAFT           │                                         │
│  │ │── POSTED          │                                         │
│  │ │── PARTIAL_PAID    │                                         │
│  │ │── PAID            │                                         │
│  │ │── OVERDUE         │                                         │
│  │ │── WRITE_OFF       │                                         │
│  │ currency_id FK      │                                         │
│  └────────┬───────────┘                                         │
│           │ 1:N                                                  │
│           ▼                                                      │
│  ar_invoice_lines                                                 │
│  ┌────────────────────┐                                         │
│  │ line_id        PK  │                                         │
│  │ inv_id FK           │                                         │
│  │ item_id FK          │──▶ items                                │
│  │ so_line_id FK       │──▶ sales_order_lines                   │
│  │ quantity            │                                         │
│  │ unit_price          │                                         │
│  │ discount_amt        │                                         │
│  │ tax_code_id FK      │──▶ tax_codes                            │
│  │ gl_acct_id FK       │──▶ chart_of_accounts                    │
│  │ net_amount          │                                         │
│  │ tax_amount          │                                         │
│  └────────────────────┘                                         │
└──────────────────────────────────────────────────────────────────┘
```

### 6.4 Inventory Tables

```
┌──────────────────────────────────────────────────────────────────┐
│                     INVENTORY TABLES                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  inventory_transactions          inventory_balances              │
│  (All stock movements)          (Current stock snapshot)         │
│                                                                  │
│  ┌────────────────────┐         ┌────────────────────┐           │
│  │ trans_id       PK  │         │ item_id      PK,FK │──▶ items  │
│  │ item_id FK          │──▶ items│ wh_id        PK,FK │──▶ wh     │
│  │ wh_id FK            │──▶ wh   │ wh_loc_id    PK,FK │──▶ loc   │
│  │ wh_loc_id FK        │──▶ loc  │ batch_no     PK    │           │
│  │ trans_type          │         │ qty_on_hand        │           │
│  │ │── GR              │  goods  │ qty_reserved       │           │
│  │ │── GI              │  receipt│ qty_available      │           │
│  │ │── ADJ_IN          │  goods  │   = on_hand        │           │
│  │ │── ADJ_OUT         │  issue  │     - reserved     │           │
│  │ │── TRANSFER_IN     │  adjust │ unit_cost          │           │
│  │ │── TRANSFER_OUT    │  transfer│ total_value        │           │
│  │ ref_doc_type        │         │   = on_hand        │           │
│  │ │── PO             │         │     × unit_cost     │           │
│  │ │── SO             │         │ last_trans_date     │           │
│  │ │── ADJ            │         └────────────────────┘           │
│  │ │── TRF            │                                        │
│  │ ref_doc_id          │  NOTE: inventory_balances is a          │
│  │ qty_in              │  materialized/aggregated view.          │
│  │ qty_out             │  qty_on_hand = SUM(qty_in) - SUM(qty_out)│
│  │ unit_cost           │  qty_reserved = from sales_orders       │
│  │ batch_no            │  qty_available = qty_on_hand - reserved │
│  │ trans_date          │                                        │
│  │ created_by FK       │──▶ users                                │
│  └────────────────────┘                                        │
└──────────────────────────────────────────────────────────────────┘
```

### 6.5 Payment & Bank Tables

```
┌──────────────────────────────────────────────────────────────────┐
│                  PAYMENT & BANK TABLES                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  payments (Pay Vendor)           cash_receipts (Receive from     │
│                                  Customer)                       │
│  ┌────────────────────┐          ┌────────────────────┐          │
│  │ pay_id         PK  │          │ rcpt_id       PK  │          │
│  │ pay_number          │          │ rcpt_number        │          │
│  │ vendor_id FK        │──▶ vendors│ cust_id FK          │──▶ customers
│  │ pay_date            │          │ rcpt_date          │          │
│  │ bank_acct_id FK     │          │ bank_acct_id FK     │          │
│  │ pay_method          │          │ rcpt_method        │          │
│  │ │── EFT             │          │ │── EFT             │          │
│  │ │── CHECK           │          │ │── CHECK           │          │
│  │ │── WIRE            │          │ │── CASH            │          │
│  │ │── CASH            │          │ │── WIRE            │          │
│  │ amount              │          │ amount             │          │
│  │ status              │          │ status             │          │
│  │ │── PROPOSED        │          │ │── RECORDED        │          │
│  │ │── APPROVED        │          │ │── ALLOCATED       │          │
│  │ │── PROCESSED       │          │ │── DEPOSITED       │          │
│  │ │── CANCELLED       │          │ │── REVERSED        │          │
│  │ currency_id FK      │          │ currency_id FK     │          │
│  └────────┬───────────┘          └────────┬───────────┘          │
│           │ 1:N                           │ 1:N                   │
│           ▼                               ▼                       │
│  payment_allocations              receipt_allocations            │
│  ┌────────────────────┐          ┌────────────────────┐          │
│  │ alloc_id      PK  │          │ alloc_id      PK  │          │
│  │ pay_id FK           │          │ rcpt_id FK          │          │
│  │ inv_id FK           │──▶ ap    │ inv_id FK           │──▶ ar    │
│  │ amount              │   invoices│ amount              │  invoices│
│  │ discount_taken      │          │ write_off           │          │
│  └────────────────────┘          └────────────────────┘          │
│                                                                  │
│  bank_transactions (All bank movements)                          │
│  ┌────────────────────┐                                        │
│  │ txn_id         PK  │                                        │
│  │ bank_acct_id FK     │                                        │
│  │ txn_date            │                                        │
│  │ txn_type            │                                        │
│  │ │── DEPOSIT         │                                        │
│  │ │── WITHDRAWAL      │                                        │
│  │ │── TRANSFER_IN     │                                        │
│  │ │── TRANSFER_OUT    │                                        │
│  │ │── FEE             │                                        │
│  │ │── INTEREST        │                                        │
│  │ ref_type            │                                        │
│  │ │── PAYMENT         │──▶ payments.id                         │
│  │ │── RECEIPT         │──▶ cash_receipts.id                    │
│  │ │── MANUAL          │                                        │
│  │ │── TRANSFER        │                                        │
│  │ ref_id              │                                        │
│  │ amount              │                                        │
│  │ balance_after       │                                        │
│  │ is_reconciled       │  boolean                               │
│  └────────┬───────────┘                                        │
│           │                                                       │
│           ▼                                                       │
│  bank_reconciliations                                            │
│  ┌────────────────────┐                                        │
│  │ recon_id      PK  │                                          │
│  │ bank_acct_id FK     │                                        │
│  │ stmt_date           │                                        │
│  │ stmt_balance        │  bank statement ending balance          │
│  │ book_balance        │  GL cash account balance                │
│  │ difference          │  stmt_balance - book_balance            │
│  │ status              │                                        │
│  │ │── DRAFT           │                                        │
│  │ │── IN_PROGRESS     │                                        │
│  │ │── MATCHED         │                                        │
│  │ │── RECONCILED      │                                        │
│  │ reconciled_by FK    │──▶ users                                │
│  │ reconciled_at       │                                        │
│  └────────────────────┘                                        │
└──────────────────────────────────────────────────────────────────┘
```

### 6.6 General Ledger Tables

```
┌──────────────────────────────────────────────────────────────────┐
│                   GENERAL LEDGER TABLES                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  gl_journal_entries (Header)                                     │
│  ┌──────────────────────────────────────────┐                   │
│  │ je_id                  PK               │                   │
│  │ je_number                                │  ◀── sequential    │
│  │ je_date                                  │     journal #     │
│  │ period                                   │  ◀── YYYY-MM      │
│  │ je_type                                  │                   │
│  │ │── AUTO           auto from sub-ledger  │                   │
│  │ │── MANUAL         manual journal entry  │                   │
│  │ │── REVERSAL       reversal entry        │                   │
│  │ │── RECLASS        reclassification      │                   │
│  │ │── CLOSING        period-end close      │                   │
│  │ ref_type                                 │                   │
│  │ │── AP_INV        AP invoice            │                   │
│  │ │── AP_PAY        AP payment            │                   │
│  │ │── AR_INV        AR invoice            │                   │
│  │ │── AR_RCPT       AR receipt            │                   │
│  │ │── GRN           goods receipt         │                   │
│  │ │── GI            goods issue           │                   │
│  │ │── ADJ           adjustment            │                   │
│  │ │── CLOSE         period close          │                   │
│  │ ref_id                                   │  ◀── FK to source │
│  │ description                             │     document      │
│  │ status                                  │                   │
│  │ │── DRAFT                              │                   │
│  │ │── POSTED         immutable after      │                   │
│  │ │── REVERSED       this status          │                   │
│  │ total_debit                             │                   │
│  │ total_credit                            │  ◀── must equal   │
│  │ created_by FK                           │──▶ users          │
│  │ posted_by FK                            │──▶ users          │
│  │ posted_at                               │                   │
│  └────────┬────────────────────────────────┘                   │
│           │ 1:N                                                    │
│           ▼                                                        │
│  gl_journal_lines (Debit/Credit Lines)                            │
│  ┌──────────────────────────────────────────┐                   │
│  │ line_id              PK                 │                   │
│  │ je_id FK                                 │──▶ gl_journal_    │
│  │ line_num                                 │    entries        │
│  │ acct_id FK                               │──▶ chart_of_     │
│  │ cost_center_id FK                        │    accounts      │
│  │ dept_id FK                               │──▶ departments   │
│  │ debit_amount                             │                   │
│  │ credit_amount                            │                   │
│  │ description                             │                   │
│  │                                          │                   │
│  │ CONSTRAINT: For each je_id,              │                   │
│  │   SUM(debit_amount)                      │                   │
│  │   = SUM(credit_amount)                   │                   │
│  └──────────────────────────────────────────┘                   │
│           │                                                        │
│           │ triggers / materialized view                         │
│           ▼                                                        │
│  gl_account_balances (Per account per period)                    │
│  ┌──────────────────────────────────────────┐                   │
│  │ acct_id        PK,FK                    │──▶ chart_of_accts │
│  │ cost_center_id PK,FK                    │──▶ cost_centers   │
│  │ period         PK                        │  ◀── YYYY-MM     │
│  │ opening_debit                           │                   │
│  │ opening_credit                          │                   │
│  │ movement_debit                          │  ◀── SUM from    │
│  │ movement_credit                         │    journal_lines │
│  │ closing_debit                           │  = opening +     │
│  │ closing_credit                          │    movement      │
│  └────────┬────────────────────────────────┘                   │
│           │                                                        │
│           │ aggregated                                              │
│           ▼                                                        │
│  gl_trial_balance (Per period, all accounts)                      │
│  ┌──────────────────────────────────────────┐                   │
│  │ acct_id        PK,FK                    │                    │
│  │ period         PK                        │                    │
│  │ acct_code                               │                    │
│  │ acct_name                               │                    │
│  │ acct_type                               │                    │
│  │ opening_debit                           │                    │
│  │ opening_credit                          │                    │
│  │ movement_debit                          │                    │
│  │ movement_credit                         │                    │
│  │ closing_debit                           │                    │
│  │ closing_credit                          │                    │
│  └──────────────────────────────────────────┘                   │
│                                                                  │
│  VALIDATION: SUM(closing_debit) = SUM(closing_credit)           │
└──────────────────────────────────────────────────────────────────┘
```

### 6.7 Supporting Tables

```
┌──────────────────────────────────────────────────────────────────┐
│                    SUPPORTING TABLES                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  three_way_matches                                               │
│  ┌────────────────────┐                                        │
│  │ match_id       PK  │                                        │
│  │ po_id FK            │──▶ purchase_orders                     │
│  │ grn_id FK           │──▶ goods_receipts                      │
│  │ inv_id FK           │──▶ ap_invoices                         │
│  │ qty_po              │                                        │
│  │ qty_grn             │                                        │
│  │ qty_inv             │                                        │
│  │ price_po            │                                        │
│  │ price_inv           │                                        │
│  │ qty_variance        │  qty_inv - qty_grn                     │
│  │ price_variance      │  price_inv - price_po                  │
│  │ match_status        │                                        │
│  │ │── MATCHED         │  within tolerance                      │
│  │ │── QTY_VARIANCE    │  qty exceeds tolerance                 │
│  │ │── PRICE_VARIANCE  │  price exceeds tolerance               │
│  │ │── BLOCKED         │  requires manual resolution            │
│  │ resolved_by FK      │──▶ users                               │
│  │ resolved_at         │                                        │
│  └────────────────────┘                                        │
│                                                                  │
│  approval_logs                                                   │
│  ┌────────────────────┐                                        │
│  │ log_id         PK  │                                        │
│  │ ref_type            │  PR / PO / INV / PAY / SO / ...       │
│  │ ref_id              │                                        │
│  │ sequence            │  approval step number                  │
│  │ approver_id FK      │──▶ users                               │
│  │ action              │  APPROVED / REJECTED / ESCALATED      │
│  │ comment             │                                        │
│  │ approved_at         │                                        │
│  └────────────────────┘                                        │
│                                                                  │
│  ar_aging (Materialized per period)                              │
│  ┌────────────────────┐                                        │
│  │ cust_id       PK,FK │──▶ customers                           │
│  │ period        PK    │  YYYY-MM                              │
│  │ current             │  not yet due                          │
│  │ bucket_30           │  1-30 days overdue                     │
│  │ bucket_60           │  31-60 days overdue                   │
│  │ bucket_90           │  61-90 days overdue                   │
│  │ bucket_120          │  90+ days overdue                     │
│  │ total_outstanding   │                                        │
│  └────────────────────┘                                        │
│                                                                  │
│  dunning_logs                                                   │
│  ┌────────────────────┐                                        │
│  │ dunning_id     PK  │                                        │
│  │ cust_id FK          │──▶ customers                           │
│  │ inv_id FK           │──▶ ar_invoices                         │
│  │ level               │  1 / 2 / 3 / 4 / 5                    │
│  │ sent_date           │                                        │
│  │ method              │  EMAIL / LETTER / PHONE / CERTIFIED   │
│  │ response            │  PAID / PROMISED / DISPUTED / IGNORED │
│  │ follow_up_date      │                                        │
│  └────────────────────┘                                        │
│                                                                  │
│  bad_debt_provisions                                            │
│  ┌────────────────────┐                                        │
│  │ prov_id        PK  │                                        │
│  │ cust_id FK          │──▶ customers                           │
│  │ period              │  YYYY-MM                              │
│  │ provision_amount    │                                        │
│  │ method              │  PERCENTAGE / SPECIFIC / AGING        │
│  │ basis               │  aging bucket or specific invoice     │
│  │ je_id FK            │──▶ gl_journal_entries                 │
│  │ approved_by FK      │──▶ users                               │
│  └────────────────────┘                                        │
│                                                                  │
│  credit_notes / debit_notes                                     │
│  ┌────────────────────┐                                        │
│  │ note_id        PK  │                                        │
│  │ note_type           │  CREDIT / DEBIT                       │
│  │ ref_inv_id FK       │──▶ ar_invoices or ap_invoices         │
│  │ cust_id FK          │  (if credit note to customer)         │
│  │ vendor_id FK        │  (if debit note to vendor)            │
│  │ amount              │                                        │
│  │ reason              │  RETURN / PRICE_ADJ / CANCEL / OTHER  │
│  │ je_id FK            │──▶ gl_journal_entries                 │
│  │ status              │  DRAFT / POSTED / APPLIED             │
│  └────────────────────┘                                        │
└──────────────────────────────────────────────────────────────────┘
```

### 6.8 Foreign Key Relationship Map

```
                         MASTER DATA
                   ┌──────────────────┐
                   │ chart_of_accounts│◀────────────────────────────┐
                   └──────────────────┘                             │
                   ┌──────────────────┐                             │
                   │ vendors          │◀──┬── purchase_orders       │
                   └──────────────────┘    ├── ap_invoices          │
                   ┌──────────────────┐    └── payments             │
                   │ customers        │◀──┬── sales_orders          │
                   └──────────────────┘    ├── ar_invoices          │
                   ┌──────────────────┐    └── cash_receipts        │
                   │ items            │◀──┬── po_lines             │
                   └──────────────────┘    ├── gr_lines             │
                   ┌──────────────────┐    ├── so_lines             │
                   │ warehouses       │◀──┬── gi_lines             │
                   └──────────────────┘    ├── inventory_trans      │
                   ┌──────────────────┐    └── inventory_balances  │
                   │ tax_codes        │◀──┴── ap_invoice_lines     │
                   └──────────────────┘       ar_invoice_lines
                   ┌──────────────────┐
                   │ cost_centers     │◀───────────────────────────┤
                   └──────────────────┘                             │
                   ┌──────────────────┐                             │
                   │ users            │◀───────────────────────────┤
                   └──────────────────┘                             │
                   ┌──────────────────┐                             │
                   │ payment_terms    │◀── purchase_orders          │
                   └──────────────────┘    sales_orders            │
                   ┌──────────────────┐                             │
                   │ currencies       │◀── purchase_orders          │
                   └──────────────────┘    sales_orders            │
                                                             ◀────┘
                    TRANSACTION TABLES
                   ┌──────────────────┐
                   │ purchase_reqs    │───▶ purchase_orders        │
                   │                  │───▶ approval_logs           │
                   └──────────────────┘
                   ┌──────────────────┐
                   │ purchase_orders  │───▶ goods_receipts──▶gr_lines
                   │                  │───▶ ap_invoices───▶ap_lines
                   └──────────────────┘       │
                   ┌──────────────────┐       │
                   │ three_way_matches│◀──────┘
                   └──────────────────┘
                   ┌──────────────────┐
                   │ ap_invoices      │───▶ payments──▶pay_allocs
                   └──────────────────┘
                   ┌──────────────────┐
                   │ sales_quotations │───▶ sales_orders
                   └──────────────────┘
                   ┌──────────────────┐
                   │ sales_orders     │───▶ deliveries──▶del_lines
                   │                  │───▶ goods_issues──▶gi_lines
                   │                  │───▶ ar_invoices──▶ar_lines
                   └──────────────────┘
                   ┌──────────────────┐
                   │ ar_invoices      │───▶ cash_receipts──▶rcpt_allocs
                   └──────────────────┘
                   ┌──────────────────┐
                   │ inventory_trans  │───▶ inventory_balances
                   └──────────────────┘
                   ┌──────────────────┐
                   │ bank_transactions│───▶ bank_reconciliations
                   └──────────────────┘

                    GENERAL LEDGER
                   ┌──────────────────┐
                   │ gl_journal_entries│◀── (ALL transaction tables
                   │                  │    via ref_type + ref_id)
                   └────────┬─────────┘
                            │ 1:N
                   ┌────────┴─────────┐
                   │ gl_journal_lines  │──▶ chart_of_accounts
                   │                  │──▶ cost_centers
                   │                  │──▶ departments
                   └────────┬─────────┘
                            │
                   ┌────────┴─────────┐
                   │ gl_account_      │
                   │ balances         │
                   └────────┬─────────┘
                            │
                   ┌────────┴─────────┐
                   │ gl_trial_balance  │
                   └──────────────────┘
```

### 6.9 End-to-End Flow: Document → Transaction → GL

```
BUY SIDE PATH:
===============

 Purchase Requisition
 ────────────────────▶ purchase_requisitions + lines
                       │
                       │  [NO GL ENTRY]
                       │
 Purchase Order
 ────────────────────▶ purchase_orders + lines
                       │
                       │  [OPTIONAL: Encumbrance JE]
                       │  Dr: Encumbrance  Cr: Reserve for Encumbrance
                       │
 Goods Receipt
 ────────────────────▶ goods_receipts + gr_lines
                  ──▶ inventory_transactions (type=GR)
                  ──▶ inventory_balances (qty_on_hand ↑)
                       │
                       │  [AUTO GL ENTRY]
                       │  ┌──────────────────────────────────┐
                       │  │ gl_journal_entries               │
                       │  │   ref_type = 'GRN'               │
                       │  │   ref_id = grn_id                │
                       │  └──────────┬───────────────────────┘
                       │             │
                       │  ┌──────────┴───────────────────────┐
                       │  │ gl_journal_lines                 │
                       │  │   Dr: Inventory    (10,000)      │
                       │  │   Cr: GR/IR Clearing (10,000)    │
                       │  └──────────────────────────────────┘
                       │
 Vendor Invoice
 ────────────────────▶ ap_invoices + ap_invoice_lines
                  ──▶ three_way_matches
                       │
                       │  [AUTO GL ENTRY]
                       │  ┌──────────────────────────────────┐
                       │  │ gl_journal_entries               │
                       │  │   ref_type = 'AP_INV'            │
                       │  │   ref_id = inv_id                │
                       │  └──────────┬───────────────────────┘
                       │             │
                       │  ┌──────────┴───────────────────────┐
                       │  │ gl_journal_lines                 │
                       │  │   Dr: GR/IR Clearing  (10,000)   │
                       │  │   Cr: Accounts Payable (10,000)  │
                       │  │   Cr: Input Tax VAT   (1,900)    │  (if taxable)
                       │  └──────────────────────────────────┘
                       │
 Payment
 ────────────────────▶ payments + payment_allocations
                  ──▶ bank_transactions (type=WITHDRAWAL)
                       │
                       │  [AUTO GL ENTRY]
                       │  ┌──────────────────────────────────┐
                       │  │ gl_journal_entries               │
                       │  │   ref_type = 'AP_PAY'            │
                       │  │   ref_id = pay_id                │
                       │  └──────────┬───────────────────────┘
                       │             │
                       │  ┌──────────┴───────────────────────┐
                       │  │ gl_journal_lines                 │
                       │  │   Dr: Accounts Payable (10,000)  │
                       │  │   Cr: Cash in Bank    (10,000)   │
                       │  └──────────────────────────────────┘
                       │
                       ▼
              gl_account_balances updated
                       │
                       ▼
              gl_trial_balance recalculated


SELL SIDE PATH:
===============

 Sales Quotation
 ────────────────────▶ sales_quotations + quotation_lines
                       │
                       │  [NO GL ENTRY]
                       │
 Sales Order
 ────────────────────▶ sales_orders + so_lines
                       │
                       │  [NO GL ENTRY]
                       │  (optional: inventory reservation)
                       │
 Goods Issue
 ────────────────────▶ goods_issues + gi_lines
                  ──▶ inventory_transactions (type=GI)
                  ──▶ inventory_balances (qty_on_hand ↓)
                       │
                       │  [AUTO GL ENTRY]
                       │  ┌──────────────────────────────────┐
                       │  │ gl_journal_entries               │
                       │  │   ref_type = 'GI'                │
                       │  │   ref_id = gi_id                 │
                       │  └──────────┬───────────────────────┘
                       │             │
                       │  ┌──────────┴───────────────────────┐
                       │  │ gl_journal_lines                 │
                       │  │   Dr: COGS           (7,000)     │
                       │  │   Cr: Inventory      (7,000)     │
                       │  └──────────────────────────────────┘
                       │
 Sales Invoice
 ────────────────────▶ ar_invoices + ar_invoice_lines
                       │
                       │  [AUTO GL ENTRY]
                       │  ┌──────────────────────────────────┐
                       │  │ gl_journal_entries               │
                       │  │   ref_type = 'AR_INV'            │
                       │  │   ref_id = inv_id                │
                       │  └──────────┬───────────────────────┘
                       │             │
                       │  ┌──────────┴───────────────────────┐
                       │  │ gl_journal_lines                 │
                       │  │   Dr: Accounts Receivable (11,900)│
                       │  │   Cr: Sales Revenue     (10,000) │
                       │  │   Cr: Output Tax VAT   (1,900)   │
                       │  └──────────────────────────────────┘
                       │
 Cash Receipt
 ────────────────────▶ cash_receipts + receipt_allocations
                  ──▶ bank_transactions (type=DEPOSIT)
                       │
                       │  [AUTO GL ENTRY]
                       │  ┌──────────────────────────────────┐
                       │  │ gl_journal_entries               │
                       │  │   ref_type = 'AR_RCPT'           │
                       │  │   ref_id = rcpt_id               │
                       │  └──────────┬───────────────────────┘
                       │             │
                       │  ┌──────────┴───────────────────────┐
                       │  │ gl_journal_lines                 │
                       │  │   Dr: Cash in Bank    (11,900)   │
                       │  │   Cr: Accounts Receivable(11,900) │
                       │  └──────────────────────────────────┘
                       │
                       ▼
              gl_account_balances updated
                       │
                       ▼
              gl_trial_balance recalculated
```

---

## 7. Process Documentation & Policies

### 7.1 Buy Side Policies

---

#### DOC-B01: Purchase Requisition Policy

All departmental purchase requests exceeding $500 must be submitted via the
approved requisition system. Requests require line-manager approval; amounts
above $5,000 require department-head approval; amounts above $25,000 require
VP/CFO approval.

**Approval Thresholds:**

| Amount Range     | Required Approver             | SLA             |
| ---------------- | ----------------------------- | --------------- |
| $0 – $500        | Auto-approved (within policy) | Immediate       |
| $501 – $5,000    | Line Manager                  | 2 business days |
| $5,001 – $25,000 | Department Head               | 3 business days |
| $25,001+         | VP / CFO                      | 5 business days |

Recurring requests should use blanket purchase orders. Emergency purchases
(defined as unplanned acquisitions needed within 24 hours) may bypass standard
approval but require post-purchase review within 5 business days. All
requisitions must reference a valid cost center and GL account code.

---

#### DOC-B02: Three-Way Matching Procedure

Invoice verification requires matching three documents:

| Document               | Confirms                               |
| ---------------------- | -------------------------------------- |
| **Purchase Order**     | Agreed price, quantity, and terms      |
| **Goods Receipt Note** | Actual quantity received and condition |
| **Vendor Invoice**     | Amount billed                          |

**Tolerance Thresholds:**

| Variance Type | Tolerance                               | Action if Exceeded      |
| ------------- | --------------------------------------- | ----------------------- |
| Price         | ±2% or $50 (whichever is greater)       | Block for manual review |
| Quantity      | ±5% or 2 units (whichever is greater)   | Block for manual review |
| Date          | Invoice date within 90 days of GRN date | Flag for investigation  |

Variances within tolerance are auto-cleared. Variances exceeding tolerance are
blocked and routed to procurement for resolution. **Blocked invoices cannot be
paid** until resolved and released.

---

#### DOC-B03: Vendor Management & Onboarding

New vendors must complete the vendor registration form including:

- Bank details (verified via bank confirmation letter)
- Tax identification (TIN, VAT registration)
- Insurance certificates
- W-9 / W-8BEN forms

**Vendor Classification:**

| Type      | Criteria                        | Due Diligence                        |
| --------- | ------------------------------- | ------------------------------------ |
| One-Time  | Single payment, limited data    | Minimal — basic ID verification      |
| Regular   | Ongoing relationship            | Full — financial review, references  |
| Strategic | Significant spend ($100K+/year) | Enhanced — annual review, site visit |

All vendors are screened against sanctions lists (OFAC, EU, UN) before first
payment and annually thereafter. Vendor performance scored quarterly on quality,
delivery, and pricing metrics.

---

### 7.2 Sell Side Policies

---

#### DOC-S01: Credit Management Policy

New customers undergo credit assessment before first order: review financial
statements, trade references, credit bureau reports, and payment history.

**Credit Limit Tiers:**

| Tier      | Limit     | Approval Authority | Review Frequency |
| --------- | --------- | ------------------ | ---------------- |
| Standard  | $10,000   | Credit Analyst     | Semi-annually    |
| Enhanced  | $50,000   | Credit Manager     | Semi-annually    |
| Strategic | $200,000+ | CFO                | Quarterly        |

Orders exceeding credit limit are **automatically blocked**. Credit limit
increases require approval:

- Standard → Enhanced: Credit Manager
- Enhanced → Strategic: CFO

**Default Payment Terms by Risk:**

| Customer Risk  | Terms             |
| -------------- | ----------------- |
| Low Risk       | Net 60            |
| Standard       | Net 30            |
| High Risk      | Net 15            |
| Very High Risk | Prepayment or COD |

---

#### DOC-S02: Revenue Recognition Guidelines (ASC 606 / IFRS 15)

Revenue recognized when (or as) performance obligations are satisfied.

**Recognition by Product Type:**

| Type                         | Recognition Point                   | Method                                    |
| ---------------------------- | ----------------------------------- | ----------------------------------------- |
| Physical goods               | Point of control transfer           | At goods issue / delivery confirmation    |
| Services                     | Over time                           | Output method or input method             |
| Software license (perpetual) | At point in time                    | Full amount at delivery                   |
| Software (SaaS)              | Over time                           | Straight-line over subscription period    |
| Bundles                      | Per distinct performance obligation | Allocate transaction price proportionally |

**Special Scenarios:**

| Scenario                                           | Treatment                                                            |
| -------------------------------------------------- | -------------------------------------------------------------------- |
| Significant financing component (>12 months terms) | Adjust for time value of money                                       |
| Returns and allowances                             | Estimate based on historical experience; reduce revenue              |
| Variable consideration                             | Constrained estimate included in transaction price                   |
| Contract modifications                             | Treated as separate contract if scope + price increase significantly |

---

#### DOC-S03: Dunning & Collections Procedure

Automated dunning process triggered by overdue payment:

| Level | Timing         | Method            | Action                                          |
| ----- | -------------- | ----------------- | ----------------------------------------------- |
| 1     | Day 1 overdue  | Email (automated) | Polite reminder                                 |
| 2     | Day 15 overdue | Email             | Reminder with invoice copies                    |
| 3     | Day 30 overdue | Formal letter     | Account placed on credit hold                   |
| 4     | Day 60 overdue | Phone + letter    | Management escalation; payment plan negotiation |
| 5     | Day 90 overdue | Certified letter  | External collection agency or legal action      |

Each dunning level must be documented with date, method, and customer response.
Account is reactivated only after full payment or signed payment plan with first
installment confirmed.

**Write-Off Authority:**

| Amount           | Authority  |
| ---------------- | ---------- |
| Up to $1,000     | AR Manager |
| $1,001 – $10,000 | Controller |
| $10,001+         | CFO        |

---

### 7.3 General Ledger Policies

---

#### DOC-G01: Period-End Close Schedule

**Monthly Close (5 Working Days):**

| Day       | Activity                                                                   |
| --------- | -------------------------------------------------------------------------- |
| **Day 1** | Cut-off: no more manual entries; last day for receipt/shipment posting     |
| **Day 2** | Sub-ledger reconciliation (AP, AR, Inventory)                              |
| **Day 3** | Accruals & prepayments; GR/IR clearance; intercompany matching             |
| **Day 4** | Journal review; consolidation entries; tax provisions                      |
| **Day 5** | Trial balance review; financial statement generation; management reporting |

**Additional Activities by Period Type:**

| Period      | Additional Activities                                                                     |
| ----------- | ----------------------------------------------------------------------------------------- |
| Quarter-End | Asset impairment review; deferred tax calculation; segment reporting                      |
| Year-End    | Full physical inventory count; year-end adjustments; audit preparation; statutory filings |

**Close SLA:** Financial statements delivered to management by Day 6 (monthly),
Day 8 (quarterly), Day 15 (annual).

---

#### DOC-G02: Chart of Accounts Structure

Account codes follow a segmented structure:

```
XX - XXXX - XXX
│     │      │
│     │      └── Segment 3: Cost Center / Location
│     └───────── Segment 2: Natural Account (4 digits)
└─────────────── Segment 1: Account Group (2 digits)
```

**Account Group Mapping:**

| Prefix | Classification       | Sub-Categories                                                        |
| ------ | -------------------- | --------------------------------------------------------------------- |
| **1X** | Assets               | 11 = Current Assets, 15 = Non-Current Assets                          |
| **2X** | Liabilities          | 21 = Current Liabilities, 25 = Non-Current Liabilities                |
| **3X** | Equity               | 31 = Share Capital, 32 = Retained Earnings, 35 = Other Reserves       |
| **4X** | Revenue              | 41 = Sales Revenue, 42 = Other Income                                 |
| **5X** | Cost of Goods Sold   | 51 = Direct Materials, 52 = Direct Labor, 53 = Manufacturing Overhead |
| **6X** | Operating Expenses   | 61 = Admin Expenses, 62 = Selling Expenses, 63 = R&D Expenses         |
| **7X** | Other Income/Expense | 71 = Interest Income, 72 = Interest Expense, 79 = Exceptional Items   |
| **8X** | Tax                  | 81 = Income Tax, 82 = Deferred Tax                                    |
| **9X** | Suspense/Interim     | 91 = Suspense Accounts, 99 = Interim/Year-End Close                   |

All accounts must be mapped to financial statement line items for automated
reporting. New account creation requires Controller approval.

---

#### DOC-G03: Audit Trail & Compliance Requirements

**Immutable Audit Trail — Every Transaction Must Record:**

| Data Point  | Description                                 |
| ----------- | ------------------------------------------- |
| Who         | User ID who created/modified the entry      |
| When        | Timestamp (date + time, including timezone) |
| Where       | Terminal/IP address                         |
| What Before | Previous field values (for modifications)   |
| What After  | New field values (for modifications)        |
| Why         | Reference to source document                |

**Core Rules:**

- Entries **cannot be deleted** — only reversed with reference to the original
  entry
- Retention period: **7 years minimum** (or per local regulation, whichever is
  longer)
- System access logged and reviewed quarterly

**SOX Compliance (if applicable):**

| Control                  | Implementation                                                            |
| ------------------------ | ------------------------------------------------------------------------- |
| Segregation of Duties    | Enforced at system level: requisitioner ≠ approver ≠ payer                |
| Access Controls          | Role-based; reviewed quarterly; terminated users disabled within 24 hours |
| Management Certification | CFO/CEO certify internal controls effectiveness quarterly                 |
| Change Management        | All system configuration changes require approval and documentation       |

**GDPR / Data Privacy:**

| Classification                 | Access                                      |
| ------------------------------ | ------------------------------------------- |
| Vendor/customer financial data | Restricted — need-to-know basis only        |
| Employee payroll data          | Restricted — HR and payroll team only       |
| Aggregate financial reports    | Internal — all employees with business need |

---

## 8. Quick Reference Cards

### Buy Side at a Glance

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROCURE-TO-PAY (P2P)                        │
├────────────┬────────────────────┬───────────────────────────────┤
│   Step     │  Key Action        │  GL Impact                    │
├────────────┼────────────────────┼───────────────────────────────┤
│ 1. Req     │  Request goods     │  Budget encumbrance only      │
│ 2. PO      │  Order from vendor │  Commitment only              │
│ 3. GRN     │  Receive goods     │  * Dr: Inventory             │
│            │                    │    Cr: GR/IR Clearing         │
│ 4. Invoice │  3-way match       │  * Dr: GR/IR Clearing         │
│            │                    │    Cr: Accounts Payable       │
│ 5. Pay     │  Disburse cash     │  * Dr: Accounts Payable       │
│            │                    │    Cr: Cash/Bank              │
│ 6. Close   │  Reconcile & close │  Accruals, GR/IR clearance    │
└────────────┴────────────────────┴───────────────────────────────┘
* = Journal entry posted
```

### Sell Side at a Glance

```
┌─────────────────────────────────────────────────────────────────┐
│                    ORDER-TO-CASH (O2C)                          │
├────────────┬────────────────────┬───────────────────────────────┤
│   Step     │  Key Action        │  GL Impact                    │
├────────────┼────────────────────┼───────────────────────────────┤
│ 1. Quote   │  Price & terms     │  No entry                     │
│ 2. SO      │  Confirm order     │  Reservation only             │
│ 3. Fulfill │  Pick, pack, ship  │  No entry                     │
│ 4. GI      │  Issue goods       │  * Dr: COGS                  │
│            │                    │    Cr: Inventory              │
│ 5. Invoice │  Bill customer     │  * Dr: Accounts Receivable    │
│            │                    │    Cr: Revenue + Tax          │
│ 6. Collect │  Receive payment   │  * Dr: Cash/Bank             │
│            │                    │    Cr: Accounts Receivable    │
│ 7. Close   │  Reconcile & close │  Bad debt provision, aging    │
└────────────┴────────────────────┴───────────────────────────────┘
* = Journal entry posted
```

### Key Account Pairs

| Buy Side          | Opposite Account  | Sell Side  | Opposite Account    |
| ----------------- | ----------------- | ---------- | ------------------- |
| AP Control        | Vendor Sub-Ledger | AR Control | Customer Sub-Ledger |
| Inventory (Asset) | COGS (Expense)    | Revenue    | AR (Asset)          |
| GR/IR Clearing    | AP Control        | —          | —                   |
| Cash (out)        | AP (settle)       | Cash (in)  | AR (settle)         |

### Document Flow Mapping

```
BUY SIDE                              SELL SIDE
─────────                             ─────────
Requisition -> PO                     RFQ -> Quote -> Sales Order
     |                                     |
     v                                     v
PO -> Goods Receipt (GRN)              Sales Order -> Delivery Note
     |                                     |
     v                                     v
PO + GRN -> Invoice Match              Delivery Note -> Sales Invoice
     |                                     |
     v                                     v
Invoice -> Payment Run                 Invoice -> Payment Receipt
     |                                     |
     v                                     v
Payment -> Bank Statement              Receipt -> Bank Statement
```

---

## 9. Development Checklists

### Checklist: Before Designing the Database

- [ ] Design Chart of Accounts covering all Account Types (Asset, Liability,
      Equity, Revenue, Expense)
- [ ] Define Account Code Format (e.g., XX-XXXX-XXX)
- [ ] Define Base Currency and Exchange Rate Table
- [ ] Define Tax Codes and applicable rates
- [ ] Define initial Payment Terms (Net 15, 30, 45, 60)
- [ ] Define Approval Matrix (amount thresholds → approvers)

### Checklist: Before Implementing Workflows

- [ ] Map every Status for every Document (DRAFT → PENDING → APPROVED → REJECTED
      → CANCELLED → CLOSED)
- [ ] Define Business Rules for 3-Way Match (tolerances)
- [ ] Define Rules for Credit Limit Check
- [ ] Define Dunning Levels and conditions for each level
- [ ] Define GL Auto-Posting Rules (which document → which accounts)
- [ ] Define Period Close Procedure and Lock Rules

### Checklist: Before Go-Live

- [ ] Test Sub-Ledger = GL Control Account (every sub-ledger)
- [ ] Test Trial Balance: Total Debit = Total Credit
- [ ] Test Inventory Balance = Sum of Transactions
- [ ] Test Bank Reconciliation Flow
- [ ] Test Audit Trail (every modification must be logged)
- [ ] Test Period Lock (closed period cannot accept backdated posts)
- [ ] Test Reverse Journal Entry
- [ ] Test Multi-Currency Transaction

---

## 10. Database Table Summary

| Group              | Count   | Tables                                                                                                                                                                                                           |
| ------------------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Master Data**    | 14      | chart_of_accounts, vendors, vendor_bank_accounts, customers, customer_bank_accounts, items, item_prices, warehouses, warehouse_locations, tax_codes, currencies, payment_terms, cost_centers, departments, users |
| **Buy Side**       | 8       | purchase_requisitions, purchase_req_lines, purchase_orders, po_lines, goods_receipts, gr_lines, ap_invoices, ap_invoice_lines                                                                                    |
| **Sell Side**      | 8       | sales_quotations, quotation_lines, sales_orders, so_lines, deliveries, delivery_lines, goods_issues, gi_lines, ar_invoices, ar_invoice_lines                                                                     |
| **Inventory**      | 2       | inventory_transactions, inventory_balances                                                                                                                                                                       |
| **Payment & Bank** | 6       | payments, payment_allocations, cash_receipts, receipt_allocations, bank_transactions, bank_reconciliations                                                                                                       |
| **General Ledger** | 4       | gl_journal_entries, gl_journal_lines, gl_account_balances, gl_trial_balance                                                                                                                                      |
| **Supporting**     | 6       | three_way_matches, approval_logs, ar_aging, dunning_logs, bad_debt_provisions, credit_debit_notes                                                                                                                |
| **Total**          | **~48** |                                                                                                                                                                                                                  |

---

_Document Version: 2.0 — Consolidated Reference | Classification: Internal |
Last Updated: 2025_
