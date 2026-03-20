-- ============================================
-- C2. Query Optimization - Composite Indexes
-- Thai Accounting ERP System - PostgreSQL
-- ============================================

-- ============================================
-- 1. Invoice Query Optimization
-- ============================================

-- For invoice listing with customer info (most common query)
CREATE INDEX idx_invoices_customer_date ON invoices (customer_id, invoice_date DESC);

-- For outstanding invoices (AR aging)
CREATE INDEX idx_invoices_status_date ON invoices (status, invoice_date) 
WHERE status IN ('ISSUED', 'PARTIAL');

-- For due date tracking
CREATE INDEX idx_invoices_due_date ON invoices (due_date) 
WHERE status IN ('ISSUED', 'PARTIAL') AND paid_amount < total_amount;

-- For monthly reporting
CREATE INDEX idx_invoices_date_status ON invoices (invoice_date, status);

-- For deleted records filtering (common in all queries)
CREATE INDEX idx_invoices_active ON invoices (deleted_at) 
WHERE deleted_at IS NULL;

-- ============================================
-- 2. Purchase Invoice Query Optimization
-- ============================================

CREATE INDEX idx_purchase_invoices_vendor_date ON purchase_invoices (vendor_id, invoice_date DESC);

CREATE INDEX idx_purchase_invoices_status_date ON purchase_invoices (status, invoice_date)
WHERE status IN ('ISSUED', 'PARTIAL');

CREATE INDEX idx_purchase_invoices_active ON purchase_invoices (deleted_at)
WHERE deleted_at IS NULL;

-- ============================================
-- 3. Journal Entry Query Optimization
-- ============================================

-- For GL listing
CREATE INDEX idx_journal_entries_date_status ON journal_entries (date DESC, status);

-- For transaction lookup by document
CREATE INDEX idx_journal_entries_document ON journal_entries (document_type, document_id)
WHERE document_type IS NOT NULL;

-- For period closing
CREATE INDEX idx_journal_entries_date_status_posted ON journal_entries (date, status)
WHERE status = 'POSTED';

-- For deleted entries
CREATE INDEX idx_journal_entries_active ON journal_entries (deleted_at)
WHERE deleted_at IS NULL;

-- ============================================
-- 4. Journal Line Query Optimization
-- ============================================

-- For trial balance queries
CREATE INDEX idx_journal_lines_account_date ON journal_lines (account_id, created_at);

-- For account detail queries with entry info
CREATE INDEX idx_journal_lines_account_entry ON journal_lines (account_id, entry_id);

-- For balance calculation
CREATE INDEX idx_journal_lines_entry_account ON journal_lines (entry_id, account_id);

-- ============================================
-- 5. Receipt Query Optimization
-- ============================================

CREATE INDEX idx_receipts_customer_date ON receipts (customer_id, receipt_date DESC);

CREATE INDEX idx_receipts_status_date ON receipts (status, receipt_date);

CREATE INDEX idx_receipts_bank_date ON receipts (bank_account_id, receipt_date)
WHERE bank_account_id IS NOT NULL;

CREATE INDEX idx_receipts_active ON receipts (deleted_at)
WHERE deleted_at IS NULL;

-- ============================================
-- 6. Payment Query Optimization
-- ============================================

CREATE INDEX idx_payments_vendor_date ON payments (vendor_id, payment_date DESC);

CREATE INDEX idx_payments_status_date ON payments (status, payment_date);

CREATE INDEX idx_payments_bank_date ON payments (bank_account_id, payment_date)
WHERE bank_account_id IS NOT NULL;

CREATE INDEX idx_payments_active ON payments (deleted_at)
WHERE deleted_at IS NULL;

-- ============================================
-- 7. Customer/Vendor Query Optimization
-- ============================================

-- For search by name (partial matching)
CREATE INDEX idx_customers_name ON customers USING gin (name gin_trgm_ops);

CREATE INDEX idx_vendors_name ON vendors USING gin (name gin_trgm_ops);

-- For active customer/vendor listing
CREATE INDEX idx_customers_active ON customers (is_active, deleted_at)
WHERE is_active = TRUE AND deleted_at IS NULL;

CREATE INDEX idx_vendors_active ON vendors (is_active, deleted_at)
WHERE is_active = TRUE AND deleted_at IS NULL;

-- ============================================
-- 8. Product Query Optimization
-- ============================================

-- For inventory tracking
CREATE INDEX idx_products_inventory ON products (is_inventory, is_active)
WHERE is_inventory = TRUE;

-- For low stock alerts
CREATE INDEX idx_products_low_stock ON products (quantity, min_quantity)
WHERE is_inventory = TRUE AND quantity <= min_quantity;

-- For category filtering
CREATE INDEX idx_products_category ON products (category)
WHERE category IS NOT NULL;

-- For product search
CREATE INDEX idx_products_name ON products USING gin (name gin_trgm_ops);

-- ============================================
-- 9. Stock Movement Query Optimization
-- ============================================

-- For product history
CREATE INDEX idx_stock_movements_product_date ON stock_movements (product_id, date DESC);

-- For warehouse reports
CREATE INDEX idx_stock_movements_warehouse_date ON stock_movements (warehouse_id, date DESC);

-- For reference lookup
CREATE INDEX idx_stock_movements_reference ON stock_movements (reference_id, reference_no)
WHERE reference_id IS NOT NULL;

-- For type filtering
CREATE INDEX idx_stock_movements_type_date ON stock_movements (type, date DESC);

-- ============================================
-- 10. VAT Record Query Optimization
-- ============================================

-- For VAT report generation
CREATE INDEX idx_vat_records_type_month ON vat_records (type, tax_year, tax_month);

-- For document lookup
CREATE INDEX idx_vat_records_document ON vat_records (document_no, document_date);

-- For pending VAT records
CREATE INDEX idx_vat_records_pending ON vat_records (report_status, type)
WHERE report_status = 'PENDING';

-- ============================================
-- 11. Withholding Tax Query Optimization
-- ============================================

CREATE INDEX idx_withholding_taxes_type_month ON withholding_taxes (type, tax_year, tax_month);

CREATE INDEX idx_withholding_taxes_pending ON withholding_taxes (report_status, type)
WHERE report_status = 'PENDING';

-- ============================================
-- 12. Financial Report Query Optimization
-- ============================================

CREATE INDEX idx_financial_reports_type_dates ON financial_reports (type, start_date, end_date);

-- ============================================
-- 13. Activity Log Query Optimization
-- ============================================

-- For user activity reports
CREATE INDEX idx_activity_logs_user_date ON activity_logs (user_id, created_at DESC);

-- For module activity
CREATE INDEX idx_activity_logs_module_date ON activity_logs (module, created_at DESC);

-- For action filtering
CREATE INDEX idx_activity_logs_action ON activity_logs (action, created_at DESC);

-- ============================================
-- 14. Audit Log Query Optimization
-- ============================================

-- For entity audit trail
CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type, entity_id, timestamp DESC);

-- For user audit trail
CREATE INDEX idx_audit_logs_user ON audit_logs (user_id, timestamp DESC);

-- For recent audits
CREATE INDEX idx_audit_logs_timestamp ON audit_logs (timestamp DESC);

-- ============================================
-- 15. Bank & Cheque Query Optimization
-- ============================================

-- For cheque status tracking
CREATE INDEX idx_cheques_status_date ON cheques (status, due_date);

-- For bank reconciliation
CREATE INDEX idx_cheques_bank_status ON cheques (bank_account_id, status);

-- For pending cheques
CREATE INDEX idx_cheques_pending ON cheques (due_date)
WHERE status IN ('ON_HAND', 'DEPOSITED');

-- ============================================
-- 16. Payroll Query Optimization
-- ============================================

-- For monthly payroll reports
CREATE INDEX idx_payroll_runs_period ON payroll_runs (period_year, period_month);

-- For employee payroll history
CREATE INDEX idx_payrolls_employee ON payrolls (employee_id, created_at DESC);

-- ============================================
-- 17. Full-Text Search Indexes (if using text search)
-- ============================================

-- Add extension for trigram search (used above)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Full text search on invoices
CREATE INDEX idx_invoices_description_fts ON invoices 
USING gin (to_tsvector('thai', COALESCE(notes, '') || ' ' || COALESCE(internal_notes, '')));

-- Full text search on journal entries
CREATE INDEX idx_journal_entries_description_fts ON journal_entries
USING gin (to_tsvector('thai', COALESCE(description, '') || ' ' || COALESCE(notes, '')));

-- ============================================
-- 18. Partial Indexes for Common Queries
-- ============================================

-- Only active/open records
CREATE INDEX idx_invoices_open ON invoices (id, customer_id, total_amount, paid_amount)
WHERE status IN ('ISSUED', 'PARTIAL') AND deleted_at IS NULL;

-- Posted journal entries only
CREATE INDEX idx_journal_entries_posted ON journal_entries (id, date, entry_no)
WHERE status = 'POSTED' AND deleted_at IS NULL;

-- Uncleared cheques
CREATE INDEX idx_cheques_uncleared ON cheques (id, bank_account_id, amount, due_date)
WHERE status IN ('ON_HAND', 'DEPOSITED');

-- ============================================
-- 19. Index Maintenance
-- ============================================

-- Function to analyze all tables
CREATE OR REPLACE FUNCTION analyze_all_tables()
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ANALYZE %I', table_record.tablename);
    END LOOP;
END;
$$;

-- Function to rebuild indexes on a table
CREATE OR REPLACE FUNCTION rebuild_table_indexes(p_table_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    EXECUTE format('REINDEX TABLE %I', p_table_name);
    RETURN format('Rebuilt indexes for table: %s', p_table_name);
END;
$$;

-- ============================================
-- Comments
-- ============================================

COMMENT ON FUNCTION analyze_all_tables IS 'Runs ANALYZE on all tables to update statistics';
COMMENT ON FUNCTION rebuild_table_indexes IS 'Rebuilds all indexes on a specific table';
