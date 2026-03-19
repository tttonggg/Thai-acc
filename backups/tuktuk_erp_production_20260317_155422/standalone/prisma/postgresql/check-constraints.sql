-- ============================================
-- C1. Data Integrity Constraints
-- Thai Accounting ERP System - PostgreSQL
-- ============================================

-- Check Constraint: Invoice amounts must be non-negative
ALTER TABLE invoices 
ADD CONSTRAINT chk_invoice_total_positive 
CHECK (total_amount >= 0);

ALTER TABLE invoices 
ADD CONSTRAINT chk_invoice_subtotal_positive 
CHECK (subtotal >= 0);

ALTER TABLE invoices 
ADD CONSTRAINT chk_invoice_vat_positive 
CHECK (vat_amount >= 0);

-- Check Constraint: Due date must be >= invoice date
ALTER TABLE invoices 
ADD CONSTRAINT chk_invoice_dates_valid 
CHECK (due_date IS NULL OR due_date >= invoice_date);

-- Check Constraint: Product prices must be non-negative
ALTER TABLE products 
ADD CONSTRAINT chk_product_sale_price_positive 
CHECK (sale_price >= 0);

ALTER TABLE products 
ADD CONSTRAINT chk_product_cost_price_positive 
CHECK (cost_price >= 0);

ALTER TABLE products 
ADD CONSTRAINT chk_product_quantity_positive 
CHECK (quantity >= 0);

-- Check Constraint: Journal lines must have non-negative debit/credit
ALTER TABLE journal_lines 
ADD CONSTRAINT chk_journal_line_debit_positive 
CHECK (debit >= 0);

ALTER TABLE journal_lines 
ADD CONSTRAINT chk_journal_line_credit_positive 
CHECK (credit >= 0);

-- Check Constraint: At least one of debit or credit must be zero (no both sides)
ALTER TABLE journal_lines 
ADD CONSTRAINT chk_journal_line_single_sided 
CHECK (
    (debit = 0 AND credit > 0) OR 
    (debit > 0 AND credit = 0) OR 
    (debit = 0 AND credit = 0)
);

-- Check Constraint: Receipt amounts must be non-negative
ALTER TABLE receipts 
ADD CONSTRAINT chk_receipt_amount_positive 
CHECK (amount >= 0);

ALTER TABLE receipts 
ADD CONSTRAINT chk_receipt_unallocated_positive 
CHECK (unallocated >= 0);

-- Check Constraint: Payment amounts must be non-negative
ALTER TABLE payments 
ADD CONSTRAINT chk_payment_amount_positive 
CHECK (amount >= 0);

ALTER TABLE payments 
ADD CONSTRAINT chk_payment_unallocated_positive 
CHECK (unallocated >= 0);

-- Check Constraint: Purchase invoice amounts must be non-negative
ALTER TABLE purchase_invoices 
ADD CONSTRAINT chk_purchase_total_positive 
CHECK (total_amount >= 0);

ALTER TABLE purchase_invoices 
ADD CONSTRAINT chk_purchase_dates_valid 
CHECK (due_date IS NULL OR due_date >= invoice_date);

-- Check Constraint: Credit/Debit Note amounts must be non-negative
ALTER TABLE credit_notes 
ADD CONSTRAINT chk_credit_note_total_positive 
CHECK (total_amount >= 0);

ALTER TABLE debit_notes 
ADD CONSTRAINT chk_debit_note_total_positive 
CHECK (total_amount >= 0);

-- Check Constraint: Stock quantities must be non-negative
ALTER TABLE stock_balances 
ADD CONSTRAINT chk_stock_balance_quantity_positive 
CHECK (quantity >= 0);

ALTER TABLE stock_balances 
ADD CONSTRAINT chk_stock_balance_cost_positive 
CHECK (unit_cost >= 0 AND total_cost >= 0);

-- Check Constraint: Invoice/Purchase line amounts must be non-negative
ALTER TABLE invoice_lines 
ADD CONSTRAINT chk_invoice_line_amount_positive 
CHECK (amount >= 0);

ALTER TABLE invoice_lines 
ADD CONSTRAINT chk_invoice_line_quantity_positive 
CHECK (quantity > 0);

ALTER TABLE purchase_invoice_lines 
ADD CONSTRAINT chk_purchase_line_amount_positive 
CHECK (amount >= 0);

ALTER TABLE purchase_invoice_lines 
ADD CONSTRAINT chk_purchase_line_quantity_positive 
CHECK (quantity > 0);

-- Check Constraint: Petty cash amounts must be non-negative
ALTER TABLE petty_cash_funds 
ADD CONSTRAINT chk_petty_cash_max_positive 
CHECK (max_amount >= 0);

ALTER TABLE petty_cash_funds 
ADD CONSTRAINT chk_petty_cash_balance_positive 
CHECK (current_balance >= 0);

ALTER TABLE petty_cash_vouchers 
ADD CONSTRAINT chk_petty_voucher_amount_positive 
CHECK (amount > 0);

-- Check Constraint: Cheque amounts must be non-negative
ALTER TABLE cheques 
ADD CONSTRAINT chk_cheque_amount_positive 
CHECK (amount > 0);

-- Check Constraint: Asset values must be non-negative
ALTER TABLE assets 
ADD CONSTRAINT chk_asset_purchase_cost_positive 
CHECK (purchase_cost > 0);

ALTER TABLE assets 
ADD CONSTRAINT chk_asset_salvage_positive 
CHECK (salvage_value >= 0);

ALTER TABLE assets 
ADD CONSTRAINT chk_asset_useful_life_positive 
CHECK (useful_life_years > 0);

-- Check Constraint: Payroll amounts must be non-negative
ALTER TABLE payrolls 
ADD CONSTRAINT chk_payroll_base_salary_positive 
CHECK (base_salary >= 0);

ALTER TABLE payrolls 
ADD CONSTRAINT chk_payroll_additions_positive 
CHECK (additions >= 0);

ALTER TABLE payrolls 
ADD CONSTRAINT chk_payroll_deductions_positive 
CHECK (deductions >= 0);

ALTER TABLE payrolls 
ADD CONSTRAINT chk_payroll_net_positive 
CHECK (net_pay >= 0);

-- Check Constraint: VAT rates must be valid (0-100%)
ALTER TABLE invoices 
ADD CONSTRAINT chk_vat_rate_valid 
CHECK (vat_rate >= 0 AND vat_rate <= 100);

ALTER TABLE products 
ADD CONSTRAINT chk_product_vat_rate_valid 
CHECK (vat_rate >= 0 AND vat_rate <= 100);

-- Check Constraint: Withholding rates must be valid (0-100%)
ALTER TABLE invoices 
ADD CONSTRAINT chk_wht_rate_valid 
CHECK (withholding_rate >= 0 AND withholding_rate <= 100);

-- Check Constraint: Exchange rates must be positive
ALTER TABLE exchange_rates 
ADD CONSTRAINT chk_exchange_rate_positive 
CHECK (rate > 0);

ALTER TABLE invoices 
ADD CONSTRAINT chk_invoice_exchange_rate_positive 
CHECK (exchange_rate > 0);

ALTER TABLE receipts 
ADD CONSTRAINT chk_receipt_exchange_rate_positive 
CHECK (exchange_rate > 0);

ALTER TABLE payments 
ADD CONSTRAINT chk_payment_exchange_rate_positive 
CHECK (exchange_rate > 0);

-- Check Constraint: Accounting period month and year must be valid
ALTER TABLE accounting_periods 
ADD CONSTRAINT chk_accounting_period_month_valid 
CHECK (month >= 1 AND month <= 12);

ALTER TABLE accounting_periods 
ADD CONSTRAINT chk_accounting_period_year_valid 
CHECK (year >= 2000 AND year <= 2100);

-- Check Constraint: Stock take variance calculation
ALTER TABLE stock_take_lines 
ADD CONSTRAINT chk_stock_take_variance_qty 
CHECK (variance_qty = actual_qty - expected_qty);

-- Check Constraint: Document number current number must be non-negative
ALTER TABLE document_numbers 
ADD CONSTRAINT chk_document_number_current_positive 
CHECK (current_no >= 0);

-- ============================================
-- Comment on constraints for documentation
-- ============================================

COMMENT ON CONSTRAINT chk_invoice_total_positive ON invoices IS 'Invoice total amount must be non-negative';
COMMENT ON CONSTRAINT chk_invoice_dates_valid ON invoices IS 'Due date must be on or after invoice date';
COMMENT ON CONSTRAINT chk_product_sale_price_positive ON products IS 'Product sale price must be non-negative';
COMMENT ON CONSTRAINT chk_journal_line_debit_positive ON journal_lines IS 'Journal line debit must be non-negative';
COMMENT ON CONSTRAINT chk_journal_line_credit_positive ON journal_lines IS 'Journal line credit must be non-negative';
COMMENT ON CONSTRAINT chk_journal_line_single_sided ON journal_lines IS 'Journal line must have either debit or credit, not both';
