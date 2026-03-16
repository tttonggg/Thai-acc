-- ============================================
-- C2. Materialized Views for Performance
-- Thai Accounting ERP System - PostgreSQL
-- ============================================

-- ============================================
-- 1. Monthly Account Balances (Most Important)
-- ============================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_monthly_balance AS
SELECT 
    jl.account_id,
    DATE_TRUNC('month', je.date) as month,
    SUM(jl.debit) as total_debit,
    SUM(jl.credit) as total_credit,
    SUM(jl.debit) - SUM(jl.credit) as net_balance,
    COUNT(*) as transaction_count,
    MIN(je.date) as first_transaction_date,
    MAX(je.date) as last_transaction_date
FROM journal_lines jl
JOIN journal_entries je ON jl.entry_id = je.id
WHERE je.status = 'POSTED'
  AND je.deleted_at IS NULL
GROUP BY jl.account_id, DATE_TRUNC('month', je.date)
ORDER BY month DESC, jl.account_id;

-- Create indexes on materialized view
CREATE UNIQUE INDEX idx_mv_monthly_balance_pk ON mv_monthly_balance (account_id, month);
CREATE INDEX idx_mv_monthly_balance_month ON mv_monthly_balance (month);
CREATE INDEX idx_mv_monthly_balance_account ON mv_monthly_balance (account_id);

-- ============================================
-- 2. Customer Aging Summary
-- ============================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_customer_aging AS
WITH invoice_aging AS (
    SELECT 
        i.customer_id,
        i.id as invoice_id,
        i.invoice_no,
        i.invoice_date,
        i.due_date,
        i.total_amount,
        i.paid_amount,
        i.total_amount - i.paid_amount as balance,
        CURRENT_DATE - i.invoice_date as days_outstanding,
        CASE 
            WHEN CURRENT_DATE - i.invoice_date <= 30 THEN 'current'
            WHEN CURRENT_DATE - i.invoice_date <= 60 THEN '30-60'
            WHEN CURRENT_DATE - i.invoice_date <= 90 THEN '60-90'
            ELSE '90+'
        END as aging_bucket
    FROM invoices i
    WHERE i.status IN ('ISSUED', 'PARTIAL')
      AND i.deleted_at IS NULL
      AND i.total_amount > i.paid_amount
)
SELECT 
    customer_id,
    SUM(CASE WHEN aging_bucket = 'current' THEN balance ELSE 0 END) as current_amount,
    SUM(CASE WHEN aging_bucket = '30-60' THEN balance ELSE 0 END) as amount_30_60,
    SUM(CASE WHEN aging_bucket = '60-90' THEN balance ELSE 0 END) as amount_60_90,
    SUM(CASE WHEN aging_bucket = '90+' THEN balance ELSE 0 END) as amount_90_plus,
    SUM(balance) as total_balance,
    COUNT(*) as invoice_count,
    MAX(days_outstanding) as oldest_days,
    CURRENT_TIMESTAMP as refreshed_at
FROM invoice_aging
GROUP BY customer_id;

CREATE UNIQUE INDEX idx_mv_customer_aging_pk ON mv_customer_aging (customer_id);
CREATE INDEX idx_mv_customer_aging_total ON mv_customer_aging (total_balance);

-- ============================================
-- 3. Vendor Aging Summary (AP)
-- ============================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_vendor_aging AS
WITH invoice_aging AS (
    SELECT 
        i.vendor_id,
        i.id as invoice_id,
        i.invoice_no,
        i.invoice_date,
        i.due_date,
        i.total_amount,
        i.paid_amount,
        i.total_amount - i.paid_amount as balance,
        CURRENT_DATE - i.invoice_date as days_outstanding,
        CASE 
            WHEN CURRENT_DATE - i.invoice_date <= 30 THEN 'current'
            WHEN CURRENT_DATE - i.invoice_date <= 60 THEN '30-60'
            WHEN CURRENT_DATE - i.invoice_date <= 90 THEN '60-90'
            ELSE '90+'
        END as aging_bucket
    FROM purchase_invoices i
    WHERE i.status IN ('ISSUED', 'PARTIAL')
      AND i.deleted_at IS NULL
      AND i.total_amount > i.paid_amount
)
SELECT 
    vendor_id,
    SUM(CASE WHEN aging_bucket = 'current' THEN balance ELSE 0 END) as current_amount,
    SUM(CASE WHEN aging_bucket = '30-60' THEN balance ELSE 0 END) as amount_30_60,
    SUM(CASE WHEN aging_bucket = '60-90' THEN balance ELSE 0 END) as amount_60_90,
    SUM(CASE WHEN aging_bucket = '90+' THEN balance ELSE 0 END) as amount_90_plus,
    SUM(balance) as total_balance,
    COUNT(*) as invoice_count,
    MAX(days_outstanding) as oldest_days,
    CURRENT_TIMESTAMP as refreshed_at
FROM invoice_aging
GROUP BY vendor_id;

CREATE UNIQUE INDEX idx_mv_vendor_aging_pk ON mv_vendor_aging (vendor_id);

-- ============================================
-- 4. Inventory Stock Summary
-- ============================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_inventory_summary AS
SELECT 
    p.id as product_id,
    p.code as product_code,
    p.name as product_name,
    p.category,
    p.unit,
    p.sale_price,
    p.cost_price,
    COALESCE(SUM(sb.quantity), 0) as total_quantity,
    COALESCE(SUM(sb.total_cost), 0) as total_cost,
    CASE 
        WHEN SUM(sb.quantity) > 0 THEN SUM(sb.total_cost) / SUM(sb.quantity)
        ELSE 0
    END as weighted_avg_cost,
    COUNT(DISTINCT sb.warehouse_id) as warehouse_count,
    SUM(CASE WHEN sb.quantity <= p.min_quantity THEN 1 ELSE 0 END) as low_stock_warehouses,
    CURRENT_TIMESTAMP as refreshed_at
FROM products p
LEFT JOIN stock_balances sb ON p.id = sb.product_id
WHERE p.is_active = TRUE 
  AND p.deleted_at IS NULL
  AND p.is_inventory = TRUE
GROUP BY p.id, p.code, p.name, p.category, p.unit, p.sale_price, p.cost_price, p.min_quantity;

CREATE UNIQUE INDEX idx_mv_inventory_summary_pk ON mv_inventory_summary (product_id);
CREATE INDEX idx_mv_inventory_summary_category ON mv_inventory_summary (category);
CREATE INDEX idx_mv_inventory_summary_low_stock ON mv_inventory_summary (low_stock_warehouses) WHERE low_stock_warehouses > 0;

-- ============================================
-- 5. Daily Revenue Summary
-- ============================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_revenue AS
SELECT 
    DATE_TRUNC('day', i.invoice_date) as date,
    COUNT(*) as invoice_count,
    SUM(i.subtotal) as total_subtotal,
    SUM(i.vat_amount) as total_vat,
    SUM(i.total_amount) as total_revenue,
    SUM(i.withholding_amount) as total_withholding,
    SUM(i.net_amount) as total_net,
    AVG(i.total_amount) as avg_invoice_amount,
    SUM(CASE WHEN i.status = 'PAID' THEN i.total_amount ELSE 0 END) as paid_amount,
    SUM(CASE WHEN i.status IN ('ISSUED', 'PARTIAL') THEN i.total_amount - i.paid_amount ELSE 0 END) as outstanding_amount,
    CURRENT_TIMESTAMP as refreshed_at
FROM invoices i
WHERE i.deleted_at IS NULL
  AND i.status != 'CANCELLED'
GROUP BY DATE_TRUNC('day', i.invoice_date)
ORDER BY date DESC;

CREATE UNIQUE INDEX idx_mv_daily_revenue_pk ON mv_daily_revenue (date);

-- ============================================
-- 6. Financial Dashboard Summary
-- ============================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_financial_summary AS
WITH monthly_data AS (
    SELECT 
        DATE_TRUNC('month', je.date) as month,
        SUM(CASE WHEN a.type = 'REVENUE' THEN jl.credit - jl.debit ELSE 0 END) as revenue,
        SUM(CASE WHEN a.type = 'EXPENSE' THEN jl.debit - jl.credit ELSE 0 END) as expenses,
        SUM(CASE WHEN a.type = 'ASSET' THEN jl.debit - jl.credit ELSE 0 END) as assets,
        SUM(CASE WHEN a.type = 'LIABILITY' THEN jl.credit - jl.debit ELSE 0 END) as liabilities,
        SUM(CASE WHEN a.type = 'EQUITY' THEN jl.credit - jl.debit ELSE 0 END) as equity
    FROM journal_lines jl
    JOIN journal_entries je ON jl.entry_id = je.id
    JOIN chart_of_accounts a ON jl.account_id = a.id
    WHERE je.status = 'POSTED'
      AND je.deleted_at IS NULL
    GROUP BY DATE_TRUNC('month', je.date)
)
SELECT 
    month,
    revenue,
    expenses,
    revenue - expenses as net_income,
    assets,
    liabilities,
    equity,
    assets - liabilities as working_capital,
    CASE 
        WHEN revenue > 0 THEN ((revenue - expenses) / revenue * 100)
        ELSE 0
    END as profit_margin,
    CURRENT_TIMESTAMP as refreshed_at
FROM monthly_data
ORDER BY month DESC
LIMIT 24; -- Last 24 months

CREATE UNIQUE INDEX idx_mv_financial_summary_pk ON mv_financial_summary (month);

-- ============================================
-- 7. VAT Summary by Month
-- ============================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_vat_summary AS
SELECT 
    tax_year,
    tax_month,
    SUM(CASE WHEN type = 'OUTPUT' THEN vat_amount ELSE 0 END) as output_vat,
    SUM(CASE WHEN type = 'INPUT' THEN vat_amount ELSE 0 END) as input_vat,
    SUM(CASE WHEN type = 'OUTPUT' THEN vat_amount ELSE 0 END) - 
    SUM(CASE WHEN type = 'INPUT' THEN vat_amount ELSE 0 END) as net_vat,
    SUM(CASE WHEN type = 'OUTPUT' THEN total_amount ELSE 0 END) as output_base,
    SUM(CASE WHEN type = 'INPUT' THEN total_amount ELSE 0 END) as input_base,
    COUNT(*) FILTER (WHERE type = 'OUTPUT') as output_documents,
    COUNT(*) FILTER (WHERE type = 'INPUT') as input_documents,
    CURRENT_TIMESTAMP as refreshed_at
FROM vat_records
GROUP BY tax_year, tax_month
ORDER BY tax_year DESC, tax_month DESC;

CREATE UNIQUE INDEX idx_mv_vat_summary_pk ON mv_vat_summary (tax_year, tax_month);

-- ============================================
-- 8. Top Customers by Revenue
-- ============================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_top_customers AS
SELECT 
    i.customer_id,
    c.name as customer_name,
    c.code as customer_code,
    COUNT(*) as invoice_count,
    SUM(i.total_amount) as total_revenue,
    AVG(i.total_amount) as avg_invoice_amount,
    SUM(i.paid_amount) as total_paid,
    SUM(i.total_amount - i.paid_amount) as outstanding_balance,
    MAX(i.invoice_date) as last_invoice_date,
    CURRENT_TIMESTAMP as refreshed_at
FROM invoices i
JOIN customers c ON i.customer_id = c.id
WHERE i.deleted_at IS NULL
  AND i.status != 'CANCELLED'
GROUP BY i.customer_id, c.name, c.code
ORDER BY total_revenue DESC;

CREATE UNIQUE INDEX idx_mv_top_customers_pk ON mv_top_customers (customer_id);
CREATE INDEX idx_mv_top_customers_revenue ON mv_top_customers (total_revenue DESC);

-- ============================================
-- 9. Product Sales Summary
-- ============================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_product_sales AS
SELECT 
    il.product_id,
    p.code as product_code,
    p.name as product_name,
    p.category,
    COUNT(DISTINCT il.invoice_id) as invoice_count,
    SUM(il.quantity) as total_quantity,
    SUM(il.amount) as total_sales,
    AVG(il.unit_price) as avg_unit_price,
    SUM(il.vat_amount) as total_vat,
    CURRENT_TIMESTAMP as refreshed_at
FROM invoice_lines il
JOIN invoices i ON il.invoice_id = i.id
JOIN products p ON il.product_id = p.id
WHERE i.deleted_at IS NULL
  AND i.status != 'CANCELLED'
  AND il.product_id IS NOT NULL
GROUP BY il.product_id, p.code, p.name, p.category
ORDER BY total_sales DESC;

CREATE UNIQUE INDEX idx_mv_product_sales_pk ON mv_product_sales (product_id);
CREATE INDEX idx_mv_product_sales_category ON mv_product_sales (category);

-- ============================================
-- 10. Bank Reconciliation Status
-- ============================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_bank_reconciliation_status AS
SELECT 
    ba.id as bank_account_id,
    ba.bank_name,
    ba.account_number,
    ba.account_name,
    COUNT(c.id) FILTER (WHERE c.status = 'ON_HAND') as cheques_on_hand,
    COUNT(c.id) FILTER (WHERE c.status = 'DEPOSITED') as cheques_deposited,
    COUNT(c.id) FILTER (WHERE c.status = 'CLEARED') as cheques_cleared,
    SUM(c.amount) FILTER (WHERE c.status = 'ON_HAND') as amount_on_hand,
    SUM(c.amount) FILTER (WHERE c.status = 'CLEARED' AND c.cleared_date >= CURRENT_DATE - INTERVAL '30 days') as cleared_30_days,
    (
        SELECT COALESCE(SUM(r.amount), 0)
        FROM receipts r
        WHERE r.bank_account_id = ba.id
        AND r.receipt_date >= CURRENT_DATE - INTERVAL '30 days'
    ) as receipts_30_days,
    CURRENT_TIMESTAMP as refreshed_at
FROM bank_accounts ba
LEFT JOIN cheques c ON ba.id = c.bank_account_id
WHERE ba.is_active = TRUE
GROUP BY ba.id, ba.bank_name, ba.account_number, ba.account_name;

CREATE UNIQUE INDEX idx_mv_bank_recon_pk ON mv_bank_reconciliation_status (bank_account_id);

-- ============================================
-- Refresh Functions
-- ============================================

CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_monthly_balance;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_customer_aging;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_vendor_aging;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_inventory_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_revenue;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_financial_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_vat_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_customers;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_product_sales;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_bank_reconciliation_status;
END;
$$;

-- Function to refresh specific view
CREATE OR REPLACE FUNCTION refresh_materialized_view(p_view_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    EXECUTE format('REFRESH MATERIALIZED VIEW CONCURRENTLY %I', p_view_name);
    RETURN format('Refreshed materialized view: %s', p_view_name);
EXCEPTION
    WHEN OTHERS THEN
        RETURN format('Error refreshing %s: %s', p_view_name, SQLERRM);
END;
$$;

-- ============================================
-- Scheduled Refresh (can be used with pg_cron)
-- ============================================

-- For real-time applications, consider using pg_cron:
-- SELECT cron.schedule('refresh-financial-views', '0 */6 * * *', 'SELECT refresh_all_materialized_views()');

-- Or create a trigger-based refresh for critical views:
CREATE OR REPLACE FUNCTION refresh_customer_aging_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Use pg_notify to trigger async refresh
    PERFORM pg_notify('refresh_view', 'mv_customer_aging');
    RETURN NULL;
END;
$$;

-- Trigger to refresh aging after invoice changes
-- CREATE TRIGGER trg_refresh_aging
--     AFTER INSERT OR UPDATE ON invoices
--     FOR EACH STATEMENT
--     EXECUTE FUNCTION refresh_customer_aging_trigger();

-- ============================================
-- Comments
-- ============================================

COMMENT ON MATERIALIZED VIEW mv_monthly_balance IS 'Monthly account balances for trial balance and financial reports';
COMMENT ON MATERIALIZED VIEW mv_customer_aging IS 'Customer AR aging summary for collection management';
COMMENT ON MATERIALIZED VIEW mv_vendor_aging IS 'Vendor AP aging summary for payment planning';
COMMENT ON MATERIALIZED VIEW mv_inventory_summary IS 'Real-time inventory stock summary with low stock indicators';
COMMENT ON MATERIALIZED VIEW mv_daily_revenue IS 'Daily revenue summary for dashboard and trend analysis';
COMMENT ON MATERIALIZED VIEW mv_financial_summary IS 'Monthly financial summary for dashboard and reporting';
COMMENT ON MATERIALIZED VIEW mv_vat_summary IS 'VAT summary by month for tax reporting';
COMMENT ON MATERIALIZED VIEW mv_top_customers IS 'Top customers by revenue for CRM and sales analysis';
COMMENT ON MATERIALIZED VIEW mv_product_sales IS 'Product sales summary for inventory and sales analysis';
COMMENT ON MATERIALIZED VIEW mv_bank_reconciliation_status IS 'Bank account and cheque status summary';
