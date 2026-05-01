# Accounting System — Complete Reference Documentation (Thai Compliance 2026)

## Workflow · Journal Entries · Database Architecture · Thai Process Policies

---

## 1. System Overview

This document covers the complete accounting workflow architecture for an ERP
system localized for Thailand. It spans Procure-to-Pay (P2P), Order-to-Cash
(O2C), and General Ledger integration, updated for 2026 **TFRS for NPAEs** and
**e-Tax Invoice** mandates.

| Cycle         | Direction | Sub-Ledgers   | Thai Statutory Requirement        |
| ------------- | --------- | ------------- | --------------------------------- |
| **Buy Side**  | Outbound  | AP, Inventory | Withholding Tax (WHT) P.N.D. 3/53 |
| **Sell Side** | Inbound   | AR, Revenue   | e-Tax Invoice & Output VAT Report |
| **GL Hub**    | Central   | All           | TFRS for NPAEs / TFRS 16          |

---

## 2. Buy Side — Procure-to-Pay (P2P)

### 2.2 Step-by-Step Details (Localized)

#### Step 4 — Invoice Verification & WHT Identification

In Thailand, the "Three-Way Match" must also identify the **Withholding Tax
(WHT)** category for services.

- **WHT Certificate:** If the vendor is providing a service, the system must
  flag the WHT rate (1%, 3%, or 5%).
- **Tax Invoice Verification:** Ensure the vendor's 13-digit Tax ID and Branch
  Code (00000 for Head Office) are present.

#### Step 5 — Payment & WHT Issuance

The accounting entry triggers at the point of payment for WHT.

- **Bis.50 Issuance:** The system must generate a Thai WHT Certificate (Bis.50)
  upon payment execution.
- **PromptPay:** Primary channel for B2B settlements to facilitate VAT refunds.

### 2.3 Journal Entries Reference

| Step        | Account               | Debit  | Credit  | Description              |
| ----------- | --------------------- | ------ | ------- | ------------------------ |
| **Invoice** | GR/IR Clearing        | 10,000 |         | Clear temp liability     |
|             | Input VAT (Deferred)  | 700    |         | 7% VAT (Pending payment) |
|             | Accounts Payable      |        | 10,700  |                          |
| **Payment** | Accounts Payable      | 10,700 |         | Settle liability         |
|             | **WHT Payable**       |        | **300** | **3% WHT (Service)**     |
|             | Cash / Bank           |        | 10,400  | Net payment              |
|             | Input VAT (Claimable) | 700    |         | Transfer from Deferred   |
|             | Input VAT (Deferred)  |        | 700     | Reclassify for PP.30     |

---

## 3. Sell Side — Order-to-Cash (O2C)

### 3.2 Step-by-Step Details (Localized)

#### Step 5 — Billing & e-Tax Invoice

Per 2026 mandates, manual paper invoices are largely replaced by **e-Tax
Invoices** for stimulus-eligible transactions.

- **Mandatory Fields:** Must include the 13-digit Tax ID of both parties and the
  "Head Office/Branch" designation.
- **Reporting:** Sales must be itemized in the **Output VAT Report** for monthly
  submission.

### 3.3 Journal Entries Reference

| Step        | Account             | Debit   | Credit  | Description                  |
| ----------- | ------------------- | ------- | ------- | ---------------------------- |
| **Invoice** | Accounts Receivable | 10,700  |         | Total Due                    |
|             | Sales Revenue       |         | 10,000  | Revenue                      |
|             | **Output VAT**      |         | **700** | **7% Statutory VAT**         |
| **Receipt** | Cash / Bank         | 10,400  |         | Net Cash                     |
|             | **WHT Prepaid**     | **300** |         | **Tax withheld by customer** |
|             | Accounts Receivable |         | 10,700  | Clear AR                     |

---

## 6. Database Architecture (Thai Localization)

### 6.1 Master Data (Enhanced)

- **`vendors` / `customers`**:
  - `tax_id_13`: 13-digit unique identifier.
  - `branch_code`: 5-digit code (e.g., "00000").
  - `is_vat_registered`: Boolean for VAT 20 status.
- **`tax_codes`**: Updated for 7% Standard VAT and specific WHT tiers (1%, 3%,
  5%).

### 6.6 General Ledger (Thai Compliance)

- **`gl_journal_entries`**: Added `thai_description` field for local audits.
- **`gl_account_balances`**: Compliant with **TFRS for NPAEs** (2026 update).

---

## 7. Process Documentation & Thai Policies

### 7.1 Buy Side Policies

- **DOC-B04: WHT Compliance:** Monthly submission of **P.N.D. 3** (Individuals)
  or **P.N.D. 53** (Corporates) by the 7th of the following month.
- **DOC-B05: VAT Claimability:** Input VAT must be claimed within 6 months of
  the invoice date.

### 7.2 Sell Side Policies

- **DOC-S04: e-Tax Invoice/e-Receipt:** 2026 stimulus schemes require electronic
  issuance via RD-approved platforms.
- **DOC-S05: VAT Reporting:** The **Output VAT Report** must be maintained in
  Thai and sorted chronologically.

### 7.3 General Ledger Policies

- **DOC-G04: Statutory Retention:** All supporting documents (Tax Invoices, WHT
  Certificates) must be kept for **5 to 7 years**.
- **DOC-G05: Language:** Books must be in **Thai** or English with a Thai
  translation.
- **DOC-G06: TFRS 16 Update:** 2026 rules for Sale-and-Leaseback transactions
  must be applied for lease liability measurements.

---

## 8. Quick Reference: Thai Statutory Reports

| Report Name    | Frequency | Target Authority | Purpose                                 |
| -------------- | --------- | ---------------- | --------------------------------------- |
| **PP.30**      | Monthly   | Revenue Dept     | VAT Return (Input vs. Output)           |
| **P.N.D. 53**  | Monthly   | Revenue Dept     | Corporate Withholding Tax Filing        |
| **Stock Card** | Real-time | Revenue Dept     | Thai-language inventory movement report |
| **P.N.D. 50**  | Annual    | Revenue Dept     | Corporate Income Tax Return             |

---

## 9. Development Checklists (Thai)

- [ ] Support 13-digit Tax ID validation.
- [ ] Implement Thai Baht (THB) as the functional currency.
- [ ] Auto-generate Thai Withholding Tax Certificates (Bis.50).
- [ ] Integrate with e-Tax Invoice API for RD submission.
- [ ] Ensure 7-year data retention for audit trails.

---

_Document Version: 3.0 — Thai Compliance 2026 | Classification: Internal_
