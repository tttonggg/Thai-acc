-- Thai Accounting ERP - Optimized Indexes for Common Queries
-- โปรแกรมบัญชีมาตรฐานไทย - Indexes ที่ปรับปรุงสำหรับ Query ทั่วไป
-- Version: 2.0 - Database Perfection Phase

-- ============================================
-- 1. Journal Entry Query Optimization
-- ============================================

-- Index for date range queries on journal entries
CREATE INDEX IF NOT EXISTS idx_journal_entry_date_status 
    ON "JournalEntry" (date, status) 
    WHERE "deletedAt" IS NULL;

-- Index for document lookups
CREATE INDEX IF NOT EXISTS idx_journal_entry_document 
    ON "JournalEntry" ("documentType", "documentId") 
    WHERE "documentType" IS NOT NULL;

-- Index for entry number searches
CREATE INDEX IF NOT EXISTS idx_journal_entry_number 
    ON "JournalEntry" ("entryNo" DESC);

-- Composite index for journal lines with account and date
CREATE INDEX IF NOT EXISTS idx_journal_line_account_date 
    ON "JournalLine" ("accountId", "createdAt" DESC);

-- ============================================
-- 2. Invoice Query Optimization
-- ============================================

-- Index for customer invoice lookups with status
CREATE INDEX IF NOT EXISTS idx_invoice_customer_status 
    ON "Invoice" ("customerId", status, "invoiceDate" DESC) 
    WHERE "deletedAt" IS NULL;

-- Index for date range queries on invoices
CREATE INDEX IF NOT EXISTS idx_invoice_date_range 
    ON "Invoice" ("invoiceDate", status) 
    WHERE "deletedAt" IS NULL;

-- Index for due date tracking (AR aging)
CREATE INDEX IF NOT EXISTS idx_invoice_due_date 
    ON "Invoice" ("dueDate") 
    WHERE status IN ('ISSUED', 'PARTIAL') AND "deletedAt" IS NULL;

-- Index for fiscal year reporting
CREATE INDEX IF NOT EXISTS idx_invoice_fiscal_year 
    ON "Invoice" ("fiscalYear", status) 
    WHERE "deletedAt" IS NULL;

-- Index for invoice number prefix searches
CREATE INDEX IF NOT EXISTS idx_invoice_number_trgm 
    ON "Invoice" USING GIN ("invoiceNo" gin_trgm_ops);

-- ============================================
-- 3. Purchase Invoice Query Optimization
-- ============================================

-- Index for vendor purchase lookups
CREATE INDEX IF NOT EXISTS idx_purchase_vendor_status 
    ON "PurchaseInvoice" ("vendorId", status, "invoiceDate" DESC) 
    WHERE "deletedAt" IS NULL;

-- Index for AP aging
CREATE INDEX IF NOT EXISTS idx_purchase_due_date 
    ON "PurchaseInvoice" ("dueDate") 
    WHERE status IN ('ISSUED', 'PARTIAL') AND "deletedAt" IS NULL;

-- ============================================
-- 4. Receipt and Payment Optimization
-- ============================================

-- Index for customer payment history
CREATE INDEX IF NOT EXISTS idx_receipt_customer_date 
    ON "Receipt" ("customerId", "receiptDate" DESC) 
    WHERE "deletedAt" IS NULL;

-- Index for vendor payment history
CREATE INDEX IF NOT EXISTS idx_payment_vendor_date 
    ON "Payment" ("vendorId", "paymentDate" DESC) 
    WHERE "deletedAt" IS NULL;

-- Index for bank account reconciliation
CREATE INDEX IF NOT EXISTS idx_receipt_bank_date 
    ON "Receipt" ("bankAccountId", "receiptDate") 
    WHERE status = 'POSTED';

CREATE INDEX IF NOT EXISTS idx_payment_bank_date 
    ON "Payment" ("bankAccountId", "paymentDate") 
    WHERE status = 'POSTED';

-- ============================================
-- 5. Product and Inventory Optimization
-- ============================================

-- Full-text search index for products
CREATE INDEX IF NOT EXISTS idx_product_search 
    ON "Product" USING GIN (
        to_tsvector('thai', name || ' ' || COALESCE(code, '') || ' ' || COALESCE(description, ''))
    );

-- Index for inventory products only
CREATE INDEX IF NOT EXISTS idx_product_inventory 
    ON "Product" ("isInventory", "isActive") 
    WHERE "isInventory" = true AND "isActive" = true;

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_product_category 
    ON "Product" (category, "isActive") 
    WHERE "deletedAt" IS NULL;

-- Index for stock balance lookups
CREATE INDEX IF NOT EXISTS idx_stock_balance_lookup 
    ON "StockBalance" ("productId", "warehouseId", quantity);

-- Index for stock movement history
CREATE INDEX IF NOT EXISTS idx_stock_movement_product_date 
    ON "StockMovement" ("productId", date DESC);

-- ============================================
-- 6. Customer and Vendor Search Optimization
-- ============================================

-- Full-text search for customers
CREATE INDEX IF NOT EXISTS idx_customer_search 
    ON "Customer" USING GIN (
        to_tsvector('thai', name || ' ' || COALESCE(code, '') || ' ' || COALESCE(address, ''))
    );

-- Index for customer code lookups
CREATE INDEX IF NOT EXISTS idx_customer_code_active 
    ON "Customer" (code, "isActive") 
    WHERE "deletedAt" IS NULL;

-- Full-text search for vendors
CREATE INDEX IF NOT EXISTS idx_vendor_search 
    ON "Vendor" USING GIN (
        to_tsvector('thai', name || ' ' || COALESCE(code, '') || ' ' || COALESCE(address, ''))
    );

-- ============================================
-- 7. VAT and Tax Reporting Optimization
-- ============================================

-- Index for VAT report generation
CREATE INDEX IF NOT EXISTS idx_vat_period_type 
    ON "VatRecord" ("taxYear", "taxMonth", type);

-- Index for withholding tax reports
CREATE INDEX IF NOT EXISTS idx_wht_period_type 
    ON "WithholdingTax" ("taxYear", "taxMonth", type);

-- Index for customer tax ID lookups
CREATE INDEX IF NOT EXISTS idx_vat_customer_tax 
    ON "VatRecord" ("customerTaxId", "taxYear", "taxMonth");

-- ============================================
-- 8. Activity Log Optimization
-- ============================================

-- Index for user activity queries
CREATE INDEX IF NOT EXISTS idx_activity_user_date 
    ON "ActivityLog" ("userId", "createdAt" DESC);

-- Index for module activity queries
CREATE INDEX IF NOT EXISTS idx_activity_module_date 
    ON "ActivityLog" (module, "createdAt" DESC);

-- Index for audit trail lookups
CREATE INDEX IF NOT EXISTS idx_activity_record 
    ON "ActivityLog" (module, "recordId", "createdAt" DESC);

-- Partial index for failed actions
CREATE INDEX IF NOT EXISTS idx_activity_failed 
    ON "ActivityLog" ("createdAt") 
    WHERE status = 'failed';

-- ============================================
-- 9. Financial Reporting Optimization
-- ============================================

-- Index for trial balance generation
CREATE INDEX IF NOT EXISTS idx_journal_line_account_period 
    ON "JournalLine" ("accountId", "createdAt") 
    WHERE "entryId" IN (
        SELECT id FROM "JournalEntry" WHERE status = 'POSTED'
    );

-- Index for GL account activity
CREATE INDEX IF NOT EXISTS idx_account_activity 
    ON "JournalLine" ("accountId", "createdAt" DESC);

-- ============================================
-- 10. Payroll Optimization
-- ============================================

-- Index for payroll run lookups
CREATE INDEX IF NOT EXISTS idx_payroll_run_period 
    ON "PayrollRun" ("periodYear", "periodMonth", status);

-- Index for employee payroll history
CREATE INDEX IF NOT EXISTS idx_payroll_employee_run 
    ON "Payroll" ("employeeId", "payrollRunId");

-- ============================================
-- 11. Asset Management Optimization
-- ============================================

-- Index for depreciation schedule queries
CREATE INDEX IF NOT EXISTS idx_depreciation_schedule 
    ON "DepreciationSchedule" ("assetId", date);

-- Index for unposted depreciation
CREATE INDEX IF NOT EXISTS idx_depreciation_unposted 
    ON "DepreciationSchedule" ("assetId", date) 
    WHERE posted = false;

-- ============================================
-- 12. Banking and Cheque Optimization
-- ============================================

-- Index for cheque status tracking
CREATE INDEX IF NOT EXISTS idx_cheque_status_date 
    ON "Cheque" (status, "dueDate") 
    WHERE status IN ('ON_HAND', 'DEPOSITED');

-- Index for bank reconciliation
CREATE INDEX IF NOT EXISTS idx_bank_recon_status 
    ON "BankReconciliation" ("bankAccountId", "statementDate" DESC);

-- ============================================
-- 13. Covering Indexes (Index-Only Scans)
-- ============================================

-- Covering index for customer list queries
CREATE INDEX IF NOT EXISTS idx_customer_list_covering 
    ON "Customer" ("isActive", "deletedAt", name, code, id);

-- Covering index for product list queries
CREATE INDEX IF NOT EXISTS idx_product_list_covering 
    ON "Product" ("isActive", "isInventory", name, code, id);

-- ============================================
-- 14. Partial Indexes for Common Filters
-- ============================================

-- Index for active customers only
CREATE INDEX IF NOT EXISTS idx_customer_active 
    ON "Customer" (name, id) 
    WHERE "isActive" = true AND "deletedAt" IS NULL;

-- Index for draft invoices (for editing)
CREATE INDEX IF NOT EXISTS idx_invoice_draft 
    ON "Invoice" ("customerId", "createdAt") 
    WHERE status = 'DRAFT';

-- Index for pending reconciliations
CREATE INDEX IF NOT EXISTS idx_recon_pending 
    ON "Reconciliation" (type, amount) 
    WHERE status = 'PENDING';

-- ============================================
-- 15. Composite Indexes for Complex Queries
-- ============================================

-- Index for invoice aging report
CREATE INDEX IF NOT EXISTS idx_invoice_aging 
    ON "Invoice" ("customerId", "dueDate", status, "netAmount", "paidAmount") 
    WHERE status IN ('ISSUED', 'PARTIAL') AND "deletedAt" IS NULL;

-- Index for sales by product report
CREATE INDEX IF NOT EXISTS idx_invoice_line_product_amount 
    ON "InvoiceLine" ("productId", amount) 
    WHERE "invoiceId" IN (
        SELECT id FROM "Invoice" WHERE status IN ('ISSUED', 'PARTIAL', 'PAID')
    );

-- ============================================
-- Index Maintenance Functions
-- ============================================

-- Function to get index statistics
CREATE OR REPLACE FUNCTION get_index_stats()
RETURNS TABLE (
    table_name TEXT,
    index_name TEXT,
    index_size TEXT,
    index_scans BIGINT,
    tuples_read BIGINT,
    tuples_fetched BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname || '.' || relname,
        indexrelname,
        pg_size_pretty(pg_relation_size(indexrelid)),
        idx_scan,
        idx_tup_read,
        idx_tup_fetch
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
    ORDER BY pg_relation_size(indexrelid) DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to find unused indexes
CREATE OR REPLACE FUNCTION get_unused_indexes()
RETURNS TABLE (
    table_name TEXT,
    index_name TEXT,
    index_size TEXT,
    last_scan TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname || '.' || relname,
        indexrelname,
        pg_size_pretty(pg_relation_size(indexrelid)),
        last_idx_scan
    FROM pg_stat_user_indexes
    WHERE idx_scan = 0
    AND schemaname = 'public'
    ORDER BY pg_relation_size(indexrelid) DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to rebuild all indexes on a table
CREATE OR REPLACE FUNCTION rebuild_table_indexes(table_name TEXT)
RETURNS VOID AS $$
DECLARE
    idx RECORD;
BEGIN
    FOR idx IN 
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = table_name 
        AND schemaname = 'public'
    LOOP
        EXECUTE 'REINDEX INDEX CONCURRENTLY "' || idx.indexname || '"';
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Query Plan Analysis
-- ============================================

-- Enable query statistics collection
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- View for slow queries
CREATE OR REPLACE VIEW v_slow_queries AS
SELECT 
    substring(query, 1, 100) as query_snippet,
    calls,
    round(total_exec_time::numeric, 2) as total_time_ms,
    round(mean_exec_time::numeric, 2) as avg_time_ms,
    round(stddev_exec_time::numeric, 2) as stddev_time_ms,
    rows as total_rows
FROM pg_stat_statements
WHERE mean_exec_time > 100  -- Queries taking more than 100ms on average
ORDER BY mean_exec_time DESC;

-- ============================================
-- Auto-Analyze Configuration
-- ============================================

-- Set autovacuum parameters for key tables
ALTER TABLE "JournalEntry" SET (autovacuum_vacuum_scale_factor = 0.1);
ALTER TABLE "JournalLine" SET (autovacuum_vacuum_scale_factor = 0.1);
ALTER TABLE "Invoice" SET (autovacuum_vacuum_scale_factor = 0.1);
ALTER TABLE "InvoiceLine" SET (autovacuum_vacuum_scale_factor = 0.1);
ALTER TABLE "StockMovement" SET (autovacuum_vacuum_scale_factor = 0.05);
ALTER TABLE "ActivityLog" SET (autovacuum_vacuum_scale_factor = 0.05);

-- Force analyze on key tables
ANALYZE "ChartOfAccount";
ANALYZE "Customer";
ANALYZE "Vendor";
ANALYZE "Product";
ANALYZE "JournalEntry";
ANALYZE "JournalLine";
ANALYZE "Invoice";
