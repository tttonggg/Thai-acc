-- ============================================
-- C1. Database Triggers
-- Thai Accounting ERP System - PostgreSQL
-- ============================================

-- ============================================
-- Trigger Function: Auto-update updatedAt
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply auto-update trigger to all tables with updatedAt

CREATE TRIGGER trg_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_system_settings_updated_at
    BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_chart_of_accounts_updated_at
    BEFORE UPDATE ON chart_of_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_journal_entries_updated_at
    BEFORE UPDATE ON journal_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_vendors_updated_at
    BEFORE UPDATE ON vendors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_invoice_lines_updated_at
    BEFORE UPDATE ON invoice_lines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_receipts_updated_at
    BEFORE UPDATE ON receipts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_credit_notes_updated_at
    BEFORE UPDATE ON credit_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_debit_notes_updated_at
    BEFORE UPDATE ON debit_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_purchase_invoices_updated_at
    BEFORE UPDATE ON purchase_invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_purchase_invoice_lines_updated_at
    BEFORE UPDATE ON purchase_invoice_lines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_vat_records_updated_at
    BEFORE UPDATE ON vat_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_withholding_taxes_updated_at
    BEFORE UPDATE ON withholding_taxes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_financial_reports_updated_at
    BEFORE UPDATE ON financial_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_document_numbers_updated_at
    BEFORE UPDATE ON document_numbers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_reconciliations_updated_at
    BEFORE UPDATE ON reconciliations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_warehouses_updated_at
    BEFORE UPDATE ON warehouses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_warehouse_zones_updated_at
    BEFORE UPDATE ON warehouse_zones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_stock_transfers_updated_at
    BEFORE UPDATE ON stock_transfers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_stock_takes_updated_at
    BEFORE UPDATE ON stock_takes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_assets_updated_at
    BEFORE UPDATE ON assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_bank_accounts_updated_at
    BEFORE UPDATE ON bank_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_cheques_updated_at
    BEFORE UPDATE ON cheques
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_bank_reconciliations_updated_at
    BEFORE UPDATE ON bank_reconciliations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_petty_cash_funds_updated_at
    BEFORE UPDATE ON petty_cash_funds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_payroll_runs_updated_at
    BEFORE UPDATE ON payroll_runs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_accounting_periods_updated_at
    BEFORE UPDATE ON accounting_periods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_currencies_updated_at
    BEFORE UPDATE ON currencies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_exchange_rates_updated_at
    BEFORE UPDATE ON exchange_rates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_tax_forms_updated_at
    BEFORE UPDATE ON tax_forms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_budgets_updated_at
    BEFORE UPDATE ON budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_entities_updated_at
    BEFORE UPDATE ON entities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_saved_filters_updated_at
    BEFORE UPDATE ON saved_filters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Trigger Function: Prevent Negative Stock
-- ============================================

CREATE OR REPLACE FUNCTION check_negative_stock()
RETURNS TRIGGER AS $$
DECLARE
    current_quantity FLOAT;
    new_quantity FLOAT;
BEGIN
    -- Get current quantity
    SELECT quantity INTO current_quantity
    FROM stock_balances
    WHERE product_id = NEW.product_id AND warehouse_id = NEW.warehouse_id;
    
    -- If no record exists, current quantity is 0
    IF current_quantity IS NULL THEN
        current_quantity := 0;
    END IF;
    
    -- Calculate new quantity
    new_quantity := current_quantity + NEW.quantity;
    
    -- Check if this would result in negative stock
    IF new_quantity < 0 THEN
        RAISE EXCEPTION 'Insufficient stock for product % in warehouse %. Available: %, Requested: %',
            NEW.product_id, NEW.warehouse_id, current_quantity, ABS(NEW.quantity);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to prevent negative stock on stock movements
CREATE TRIGGER trg_prevent_negative_stock
    BEFORE INSERT ON stock_movements
    FOR EACH ROW EXECUTE FUNCTION check_negative_stock();

-- ============================================
-- Trigger Function: Auto-calculate Invoice Totals
-- ============================================

CREATE OR REPLACE FUNCTION calculate_invoice_totals()
RETURNS TRIGGER AS $$
DECLARE
    v_subtotal INTEGER;
    v_vat_amount INTEGER;
    v_total_amount INTEGER;
    v_withholding_amount INTEGER;
    v_net_amount INTEGER;
    v_discount_amount INTEGER;
    v_vat_rate FLOAT;
BEGIN
    -- Calculate subtotal from lines
    SELECT COALESCE(SUM(amount), 0) INTO v_subtotal
    FROM invoice_lines
    WHERE invoice_id = NEW.id;
    
    -- Get VAT rate (default to 7%)
    v_vat_rate := COALESCE(NEW.vat_rate, 7);
    
    -- Calculate discount amount from percentage if provided
    IF NEW.discount_percent > 0 THEN
        v_discount_amount := ROUND(v_subtotal * NEW.discount_percent / 100);
    ELSE
        v_discount_amount := COALESCE(NEW.discount_amount, 0);
    END IF;
    
    -- Calculate VAT
    v_vat_amount := ROUND((v_subtotal - v_discount_amount) * v_vat_rate / 100);
    
    -- Calculate total
    v_total_amount := v_subtotal - v_discount_amount + v_vat_amount;
    
    -- Calculate withholding tax
    IF NEW.withholding_rate > 0 THEN
        v_withholding_amount := ROUND(v_subtotal * NEW.withholding_rate / 100);
    ELSE
        v_withholding_amount := 0;
    END IF;
    
    -- Calculate net amount
    v_net_amount := v_total_amount - v_withholding_amount;
    
    -- Update the invoice
    NEW.subtotal := v_subtotal;
    NEW.discount_amount := v_discount_amount;
    NEW.vat_amount := v_vat_amount;
    NEW.total_amount := v_total_amount;
    NEW.withholding_amount := v_withholding_amount;
    NEW.net_amount := v_net_amount;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to auto-calculate invoice totals
CREATE TRIGGER trg_invoice_calculate_totals
    BEFORE INSERT OR UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION calculate_invoice_totals();

-- ============================================
-- Trigger Function: Auto-calculate Purchase Invoice Totals
-- ============================================

CREATE OR REPLACE FUNCTION calculate_purchase_totals()
RETURNS TRIGGER AS $$
DECLARE
    v_subtotal INTEGER;
    v_vat_amount INTEGER;
    v_total_amount INTEGER;
    v_withholding_amount INTEGER;
    v_net_amount INTEGER;
    v_discount_amount INTEGER;
    v_vat_rate FLOAT;
BEGIN
    -- Calculate subtotal from lines
    SELECT COALESCE(SUM(amount), 0) INTO v_subtotal
    FROM purchase_invoice_lines
    WHERE purchase_id = NEW.id;
    
    -- Get VAT rate
    v_vat_rate := COALESCE(NEW.vat_rate, 7);
    
    -- Calculate discount
    IF NEW.discount_percent > 0 THEN
        v_discount_amount := ROUND(v_subtotal * NEW.discount_percent / 100);
    ELSE
        v_discount_amount := COALESCE(NEW.discount_amount, 0);
    END IF;
    
    -- Calculate VAT
    v_vat_amount := ROUND((v_subtotal - v_discount_amount) * v_vat_rate / 100);
    
    -- Calculate total
    v_total_amount := v_subtotal - v_discount_amount + v_vat_amount;
    
    -- Calculate withholding
    IF NEW.withholding_rate > 0 THEN
        v_withholding_amount := ROUND(v_subtotal * NEW.withholding_rate / 100);
    ELSE
        v_withholding_amount := 0;
    END IF;
    
    -- Calculate net
    v_net_amount := v_total_amount - v_withholding_amount;
    
    -- Update
    NEW.subtotal := v_subtotal;
    NEW.discount_amount := v_discount_amount;
    NEW.vat_amount := v_vat_amount;
    NEW.total_amount := v_total_amount;
    NEW.withholding_amount := v_withholding_amount;
    NEW.net_amount := v_net_amount;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to purchase invoices
CREATE TRIGGER trg_purchase_calculate_totals
    BEFORE INSERT OR UPDATE ON purchase_invoices
    FOR EACH ROW EXECUTE FUNCTION calculate_purchase_totals();

-- ============================================
-- Trigger Function: Update Stock Balance on Movement
-- ============================================

CREATE OR REPLACE FUNCTION update_stock_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update stock balance
    INSERT INTO stock_balances (product_id, warehouse_id, quantity, unit_cost, total_cost, updated_at)
    VALUES (
        NEW.product_id, 
        NEW.warehouse_id, 
        NEW.quantity,
        NEW.unit_cost,
        NEW.total_cost,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (product_id, warehouse_id) 
    DO UPDATE SET
        quantity = stock_balances.quantity + EXCLUDED.quantity,
        unit_cost = CASE 
            WHEN stock_balances.quantity + EXCLUDED.quantity = 0 THEN 0
            ELSE (stock_balances.total_cost + EXCLUDED.total_cost) / (stock_balances.quantity + EXCLUDED.quantity)
        END,
        total_cost = stock_balances.total_cost + EXCLUDED.total_cost,
        updated_at = CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to update stock balance
CREATE TRIGGER trg_update_stock_balance
    AFTER INSERT ON stock_movements
    FOR EACH ROW EXECUTE FUNCTION update_stock_balance();

-- ============================================
-- Trigger Function: Update Product Quantity on Stock Movement
-- ============================================

CREATE OR REPLACE FUNCTION update_product_quantity()
RETURNS TRIGGER AS $$
DECLARE
    total_qty FLOAT;
BEGIN
    -- Calculate total quantity across all warehouses
    SELECT COALESCE(SUM(quantity), 0) INTO total_qty
    FROM stock_balances
    WHERE product_id = NEW.product_id;
    
    -- Update product quantity
    UPDATE products 
    SET quantity = total_qty,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.product_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger
CREATE TRIGGER trg_update_product_quantity
    AFTER INSERT OR UPDATE ON stock_balances
    FOR EACH ROW EXECUTE FUNCTION update_product_quantity();

-- ============================================
-- Trigger Function: Audit Log - Track Changes
-- ============================================

CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    old_data JSONB;
    new_data JSONB;
    action_type TEXT;
    entity_type TEXT;
    prev_hash TEXT;
    new_hash TEXT;
BEGIN
    -- Determine action type
    IF TG_OP = 'INSERT' THEN
        action_type := 'CREATE';
        old_data := NULL;
        new_data := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        action_type := 'UPDATE';
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN
        action_type := 'DELETE';
        old_data := to_jsonb(OLD);
        new_data := NULL;
    END IF;
    
    -- Get entity type from table name
    entity_type := TG_TABLE_NAME;
    
    -- Get previous hash for chain
    SELECT hash INTO prev_hash
    FROM audit_logs
    ORDER BY timestamp DESC
    LIMIT 1;
    
    IF prev_hash IS NULL THEN
        prev_hash := '';
    END IF;
    
    -- Calculate new hash (simplified - in production use proper hashing)
    new_hash := encode(
        digest(
            prev_hash || entity_type || action_type || COALESCE(new_data::text, old_data::text) || CURRENT_TIMESTAMP::text,
            'sha256'
        ),
        'hex'
    );
    
    -- Insert audit log (requires pgcrypto extension)
    INSERT INTO audit_logs (
        timestamp,
        user_id,
        action,
        entity_type,
        entity_id,
        before_state,
        after_state,
        ip_address,
        user_agent,
        hash,
        prev_hash
    ) VALUES (
        CURRENT_TIMESTAMP,
        current_setting('app.current_user_id', true)::TEXT,
        action_type,
        entity_type,
        COALESCE(NEW.id, OLD.id)::TEXT,
        old_data,
        new_data,
        current_setting('app.client_ip', true)::TEXT,
        current_setting('app.user_agent', true)::TEXT,
        new_hash,
        prev_hash
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Note: Audit triggers should be applied selectively to important tables
-- Example for invoices:
-- CREATE TRIGGER trg_audit_invoices
--     AFTER INSERT OR UPDATE OR DELETE ON invoices
--     FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- ============================================
-- Trigger Function: Prevent Deletion of Posted Journal Entries
-- ============================================

CREATE OR REPLACE FUNCTION prevent_posted_deletion()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'POSTED' THEN
        RAISE EXCEPTION 'Cannot delete posted journal entry %', OLD.id;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger
CREATE TRIGGER trg_prevent_posted_deletion
    BEFORE DELETE ON journal_entries
    FOR EACH ROW EXECUTE FUNCTION prevent_posted_deletion();

-- ============================================
-- Trigger Function: Validate Accounting Period is Open
-- ============================================

CREATE OR REPLACE FUNCTION validate_accounting_period()
RETURNS TRIGGER AS $$
DECLARE
    period_status TEXT;
    entry_year INTEGER;
    entry_month INTEGER;
BEGIN
    -- Extract year and month from date
    entry_year := EXTRACT(YEAR FROM NEW.date);
    entry_month := EXTRACT(MONTH FROM NEW.date);
    
    -- Get period status
    SELECT status::TEXT INTO period_status
    FROM accounting_periods
    WHERE year = entry_year AND month = entry_month;
    
    -- If no period exists, allow (create on demand)
    IF period_status IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Check if period is closed or locked
    IF period_status IN ('CLOSED', 'LOCKED') THEN
        RAISE EXCEPTION 'Cannot create journal entry in closed/locked period %-%', entry_year, entry_month;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger
CREATE TRIGGER trg_validate_accounting_period
    BEFORE INSERT OR UPDATE ON journal_entries
    FOR EACH ROW EXECUTE FUNCTION validate_accounting_period();

-- ============================================
-- Trigger Function: Maintain Budget Variance
-- ============================================

CREATE OR REPLACE FUNCTION update_budget_variance()
RETURNS TRIGGER AS $$
DECLARE
    v_actual INTEGER;
    budget_record RECORD;
BEGIN
    -- Find affected budgets for the current year
    FOR budget_record IN 
        SELECT b.id, b.amount, b.alert_at
        FROM budgets b
        JOIN chart_of_accounts a ON b.account_id = a.id
        WHERE b.year = EXTRACT(YEAR FROM NEW.date)
    LOOP
        -- Calculate actual from journal lines
        SELECT COALESCE(SUM(jl.debit), 0) INTO v_actual
        FROM journal_lines jl
        JOIN journal_entries je ON jl.entry_id = je.id
        WHERE jl.account_id = budget_record.id
        AND je.status = 'POSTED'
        AND EXTRACT(YEAR FROM je.date) = budget_record.year;
        
        -- Update budget
        UPDATE budgets
        SET actual = v_actual,
            variance = budget_record.amount - v_actual,
            is_alerted = (v_actual >= budget_record.amount * budget_record.alert_at / 100),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = budget_record.id;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger (optional - can be resource intensive)
-- CREATE TRIGGER trg_update_budget_variance
--     AFTER INSERT OR UPDATE ON journal_entries
--     FOR EACH ROW WHEN (NEW.status = 'POSTED')
--     EXECUTE FUNCTION update_budget_variance();

-- ============================================
-- Comments on triggers
-- ============================================

COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically updates the updated_at timestamp on row modification';
COMMENT ON FUNCTION check_negative_stock() IS 'Prevents stock from going negative when creating stock movements';
COMMENT ON FUNCTION calculate_invoice_totals() IS 'Auto-calculates invoice totals from line items before insert/update';
COMMENT ON FUNCTION update_stock_balance() IS 'Updates stock balance records when stock movements are created';
COMMENT ON FUNCTION prevent_posted_deletion() IS 'Prevents deletion of posted journal entries';
COMMENT ON FUNCTION validate_accounting_period() IS 'Validates that journal entries are only created in open accounting periods';
