-- ============================================
-- C1. Unique Constraints for Data Integrity
-- Thai Accounting ERP System - PostgreSQL
-- ============================================

-- ============================================
-- Document Numbering Uniqueness (Fiscal Year Based)
-- ============================================

-- Invoice number must be unique within a fiscal year
-- We use invoice_date to determine fiscal year
-- Note: In a real implementation, you might need a fiscal_year column
-- For now, we ensure invoice_no is unique globally (already in schema)
-- If you need per-year uniqueness, add a fiscal_year column first:

/*
ALTER TABLE invoices 
ADD COLUMN fiscal_year INTEGER 
GENERATED ALWAYS AS (
    CASE 
        WHEN EXTRACT(MONTH FROM invoice_date) >= 10 THEN EXTRACT(YEAR FROM invoice_date) + 1
        ELSE EXTRACT(YEAR FROM invoice_date)
    END
) STORED;

ALTER TABLE invoices 
ADD CONSTRAINT uq_invoice_no_fiscal_year 
UNIQUE (invoice_no, fiscal_year);
*/

-- Receipt number uniqueness within fiscal year
/*
ALTER TABLE receipts 
ADD COLUMN fiscal_year INTEGER 
GENERATED ALWAYS AS (
    CASE 
        WHEN EXTRACT(MONTH FROM receipt_date) >= 10 THEN EXTRACT(YEAR FROM receipt_date) + 1
        ELSE EXTRACT(YEAR FROM receipt_date)
    END
) STORED;

ALTER TABLE receipts 
ADD CONSTRAINT uq_receipt_no_fiscal_year 
UNIQUE (receipt_no, fiscal_year);
*/

-- ============================================
-- Business Entity Code Uniqueness
-- ============================================

-- Customer code must be unique (case-insensitive)
CREATE UNIQUE INDEX uq_customer_code_lower ON customers (LOWER(code));

-- Vendor code must be unique (case-insensitive)
CREATE UNIQUE INDEX uq_vendor_code_lower ON vendors (LOWER(code));

-- Product code must be unique (case-insensitive)
CREATE UNIQUE INDEX uq_product_code_lower ON products (LOWER(code));

-- Chart of Account code must be unique (case-insensitive)
CREATE UNIQUE INDEX uq_account_code_lower ON chart_of_accounts (LOWER(code));

-- Warehouse code must be unique (case-insensitive)
CREATE UNIQUE INDEX uq_warehouse_code_lower ON warehouses (LOWER(code));

-- Employee code must be unique (case-insensitive)
CREATE UNIQUE INDEX uq_employee_code_lower ON employees (LOWER(employee_code));

-- Asset code must be unique (case-insensitive)
CREATE UNIQUE INDEX uq_asset_code_lower ON assets (LOWER(code));

-- Bank account code must be unique (case-insensitive)
CREATE UNIQUE INDEX uq_bank_account_code_lower ON bank_accounts (LOWER(code));

-- Petty cash fund code must be unique (case-insensitive)
CREATE UNIQUE INDEX uq_petty_cash_code_lower ON petty_cash_funds (LOWER(code));

-- Entity code must be unique (case-insensitive)
CREATE UNIQUE INDEX uq_entity_code_lower ON entities (LOWER(code));

-- ============================================
-- Document Number Uniqueness
-- ============================================

-- Journal entry number must be unique
CREATE UNIQUE INDEX uq_journal_entry_no ON journal_entries (entry_no);

-- Invoice number must be unique
CREATE UNIQUE INDEX uq_invoice_no ON invoices (invoice_no);

-- Receipt number must be unique
CREATE UNIQUE INDEX uq_receipt_no ON receipts (receipt_no);

-- Payment number must be unique
CREATE UNIQUE INDEX uq_payment_no ON payments (payment_no);

-- Purchase invoice number must be unique
CREATE UNIQUE INDEX uq_purchase_invoice_no ON purchase_invoices (invoice_no);

-- Credit note number must be unique
CREATE UNIQUE INDEX uq_credit_note_no ON credit_notes (credit_note_no);

-- Debit note number must be unique
CREATE UNIQUE INDEX uq_debit_note_no ON debit_notes (debit_note_no);

-- Cheque number must be unique within a bank account
CREATE UNIQUE INDEX uq_cheque_no_bank ON cheques (cheque_no, bank_account_id);

-- Stock transfer number must be unique
CREATE UNIQUE INDEX uq_stock_transfer_no ON stock_transfers (transfer_no);

-- Stock take number must be unique
CREATE UNIQUE INDEX uq_stock_take_no ON stock_takes (stock_take_number);

-- Payroll run number must be unique
CREATE UNIQUE INDEX uq_payroll_run_no ON payroll_runs (run_no);

-- Petty cash voucher number must be unique
CREATE UNIQUE INDEX uq_petty_voucher_no ON petty_cash_vouchers (voucher_no);

-- ============================================
-- Tax ID Uniqueness
-- ============================================

-- Customer tax ID must be unique if provided (excluding NULLs)
CREATE UNIQUE INDEX uq_customer_tax_id ON customers (tax_id) WHERE tax_id IS NOT NULL;

-- Vendor tax ID must be unique if provided (excluding NULLs)
CREATE UNIQUE INDEX uq_vendor_tax_id ON vendors (tax_id) WHERE tax_id IS NOT NULL;

-- Employee tax ID must be unique if provided
CREATE UNIQUE INDEX uq_employee_tax_id ON employees (tax_id) WHERE tax_id IS NOT NULL;

-- Entity tax ID must be unique if provided
CREATE UNIQUE INDEX uq_entity_tax_id ON entities (tax_id) WHERE tax_id IS NOT NULL;

-- ============================================
-- Email Uniqueness
-- ============================================

-- User email must be unique (case-insensitive)
CREATE UNIQUE INDEX uq_user_email_lower ON users (LOWER(email));

-- Customer email must be unique if provided
CREATE UNIQUE INDEX uq_customer_email ON customers (email) WHERE email IS NOT NULL;

-- Vendor email must be unique if provided
CREATE UNIQUE INDEX uq_vendor_email ON vendors (email) WHERE email IS NOT NULL;

-- ============================================
-- Multi-Column Unique Constraints
-- ============================================

-- Stock balance must be unique per product per warehouse
-- (Already defined in schema with @@unique)
ALTER TABLE stock_balances 
ADD CONSTRAINT uq_stock_balance_product_warehouse 
UNIQUE (product_id, warehouse_id);

-- Warehouse zone must be unique per warehouse
-- (Already defined in schema with @@unique)
ALTER TABLE warehouse_zones 
ADD CONSTRAINT uq_warehouse_zone_code 
UNIQUE (warehouse_id, code);

-- Receipt allocation must be unique per receipt-invoice pair
ALTER TABLE receipt_allocations 
ADD CONSTRAINT uq_receipt_allocation 
UNIQUE (receipt_id, invoice_id);

-- Payment allocation must be unique per payment-invoice pair
ALTER TABLE payment_allocations 
ADD CONSTRAINT uq_payment_allocation 
UNIQUE (payment_id, invoice_id);

-- Budget must be unique per year per account
-- (Already defined in schema with @@unique)
ALTER TABLE budgets 
ADD CONSTRAINT uq_budget_year_account 
UNIQUE (year, account_id);

-- Accounting period must be unique per year-month
-- (Already defined in schema with @@unique)
ALTER TABLE accounting_periods 
ADD CONSTRAINT uq_accounting_period_year_month 
UNIQUE (year, month);

-- Currency code must be unique (case-insensitive)
CREATE UNIQUE INDEX uq_currency_code_lower ON currencies (LOWER(code));

-- Exchange rate must be unique per currency pair per date
ALTER TABLE exchange_rates 
ADD CONSTRAINT uq_exchange_rate_currency_date 
UNIQUE (from_currency, to_currency, date);

-- Document number type must be unique
-- (Already defined in schema with @unique)

-- API token hash must be unique
-- (Already defined in schema with @unique)

-- Idempotency keys must be unique
CREATE UNIQUE INDEX uq_invoice_idempotency ON invoices (idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE UNIQUE INDEX uq_receipt_idempotency ON receipts (idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE UNIQUE INDEX uq_payment_idempotency ON payments (idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE UNIQUE INDEX uq_journal_idempotency ON journal_entries (idempotency_key) WHERE idempotency_key IS NOT NULL;

-- ============================================
-- External Reference Uniqueness
-- ============================================

-- Customer external reference must be unique if provided
CREATE UNIQUE INDEX uq_customer_external_ref ON customers (external_ref_id) WHERE external_ref_id IS NOT NULL;

-- Vendor external reference must be unique if provided
CREATE UNIQUE INDEX uq_vendor_external_ref ON vendors (external_ref_id) WHERE external_ref_id IS NOT NULL;

-- Product external reference must be unique if provided
CREATE UNIQUE INDEX uq_product_external_ref ON products (external_ref_id) WHERE external_ref_id IS NOT NULL;

-- Employee external reference must be unique if provided
CREATE UNIQUE INDEX uq_employee_external_ref ON employees (external_ref_id) WHERE external_ref_id IS NOT NULL;

-- ============================================
-- Soft Delete Considerations
-- ============================================

-- For soft-deleted records, we might want to allow duplicate codes
-- after the original is "deleted". Uncomment if needed:

/*
-- Allow duplicate customer codes if original is soft-deleted
CREATE UNIQUE INDEX uq_customer_code_active ON customers (LOWER(code)) 
WHERE deleted_at IS NULL;

-- Allow duplicate vendor codes if original is soft-deleted
CREATE UNIQUE INDEX uq_vendor_code_active ON vendors (LOWER(code)) 
WHERE deleted_at IS NULL;

-- Allow duplicate product codes if original is soft-deleted
CREATE UNIQUE INDEX uq_product_code_active ON products (LOWER(code)) 
WHERE deleted_at IS NULL;

-- Allow duplicate employee codes if original is soft-deleted
CREATE UNIQUE INDEX uq_employee_code_active ON employees (LOWER(employee_code)) 
WHERE deleted_at IS NULL;

-- Allow duplicate asset codes if original is soft-deleted
CREATE UNIQUE INDEX uq_asset_code_active ON assets (LOWER(code)) 
WHERE deleted_at IS NULL;
*/
