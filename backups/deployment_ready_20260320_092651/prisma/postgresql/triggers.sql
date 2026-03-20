-- Thai Accounting ERP System - PostgreSQL Triggers and Functions
-- โปรแกรมบัญชีมาตรฐานไทย - Triggers และ Functions สำหรับ PostgreSQL
-- Version: 2.0 - Database Perfection Phase

-- ============================================
-- 1. Auto-update updatedAt timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updatedAt column
DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN
        SELECT table_name
        FROM information_schema.columns
        WHERE column_name = 'updatedAt'
        AND table_schema = 'public'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS update_%s_updated_at ON "%s";', 
                      table_record.table_name, table_record.table_name);
        EXECUTE format('CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON "%s" 
                      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
                      table_record.table_name, table_record.table_name);
    END LOOP;
END $$;

-- ============================================
-- 2. Journal Entry Balance Validation
-- ============================================
CREATE OR REPLACE FUNCTION validate_journal_entry_balance()
RETURNS TRIGGER AS $$
DECLARE
    total_debit BIGINT;
    total_credit BIGINT;
    entry_status TEXT;
BEGIN
    -- Only validate when status changes to POSTED
    IF NEW.status = 'POSTED' AND (OLD.status IS NULL OR OLD.status != 'POSTED') THEN
        -- Calculate totals from journal lines
        SELECT COALESCE(SUM(debit), 0), COALESCE(SUM(credit), 0)
        INTO total_debit, total_credit
        FROM "JournalLine"
        WHERE "entryId" = NEW.id;
        
        -- Check if balanced
        IF total_debit != total_credit THEN
            RAISE EXCEPTION 'Journal entry is not balanced. Debit: %, Credit: %', 
                total_debit, total_credit;
        END IF;
        
        -- Check if at least one line exists
        IF total_debit = 0 AND total_credit = 0 THEN
            RAISE EXCEPTION 'Journal entry must have at least one line';
        END IF;
        
        -- Update totals
        NEW."totalDebit" = total_debit;
        NEW."totalCredit" = total_credit;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_journal_balance ON "JournalEntry";
CREATE TRIGGER trg_validate_journal_balance
    BEFORE UPDATE ON "JournalEntry"
    FOR EACH ROW
    EXECUTE FUNCTION validate_journal_entry_balance();

-- ============================================
-- 3. Prevent Deletion of Posted Documents
-- ============================================
CREATE OR REPLACE FUNCTION prevent_posted_deletion()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if document is posted
    IF OLD.status = 'POSTED' THEN
        RAISE EXCEPTION 'Cannot delete posted document. Status: %', OLD.status;
    END IF;
    
    -- Check if journal entry exists (indicates posted to GL)
    IF OLD."journalEntryId" IS NOT NULL THEN
        RAISE EXCEPTION 'Cannot delete document with posted journal entry';
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Apply to financial document tables
DROP TRIGGER IF EXISTS trg_prevent_invoice_deletion ON "Invoice";
CREATE TRIGGER trg_prevent_invoice_deletion
    BEFORE DELETE ON "Invoice"
    FOR EACH ROW
    EXECUTE FUNCTION prevent_posted_deletion();

DROP TRIGGER IF EXISTS trg_prevent_purchase_deletion ON "PurchaseInvoice";
CREATE TRIGGER trg_prevent_purchase_deletion
    BEFORE DELETE ON "PurchaseInvoice"
    FOR EACH ROW
    EXECUTE FUNCTION prevent_posted_deletion();

DROP TRIGGER IF EXISTS trg_prevent_receipt_deletion ON "Receipt";
CREATE TRIGGER trg_prevent_receipt_deletion
    BEFORE DELETE ON "Receipt"
    FOR EACH ROW
    EXECUTE FUNCTION prevent_posted_deletion();

DROP TRIGGER IF EXISTS trg_prevent_payment_deletion ON "Payment";
CREATE TRIGGER trg_prevent_payment_deletion
    BEFORE DELETE ON "Payment"
    FOR EACH ROW
    EXECUTE FUNCTION prevent_posted_deletion();

DROP TRIGGER IF EXISTS trg_prevent_journal_deletion ON "JournalEntry";
CREATE TRIGGER trg_prevent_journal_deletion
    BEFORE DELETE ON "JournalEntry"
    FOR EACH ROW
    EXECUTE FUNCTION prevent_posted_deletion();

-- ============================================
-- 4. Audit Trail Trigger
-- ============================================
CREATE TABLE IF NOT EXISTS "AuditLog" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
    old_data JSONB,
    new_data JSONB,
    changed_by UUID,
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_table_record ON "AuditLog"(table_name, record_id);
CREATE INDEX idx_audit_changed_at ON "AuditLog"(changed_at);

CREATE OR REPLACE FUNCTION create_audit_trail()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO "AuditLog" (table_name, record_id, action, old_data, changed_by)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD), current_setting('app.current_user_id', true)::UUID);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO "AuditLog" (table_name, record_id, action, old_data, new_data, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), current_setting('app.current_user_id', true)::UUID);
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO "AuditLog" (table_name, record_id, action, new_data, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW), current_setting('app.current_user_id', true)::UUID);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. Invoice Sequential Numbering Trigger
-- ============================================
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
    doc_prefix TEXT;
    current_num INT;
    fiscal_year INT;
    new_number TEXT;
BEGIN
    -- Only generate number if not provided
    IF NEW."invoiceNo" IS NULL OR NEW."invoiceNo" = '' THEN
        -- Get fiscal year from invoice date
        fiscal_year := EXTRACT(YEAR FROM NEW."invoiceDate");
        
        -- Handle fiscal year that starts in different month
        -- Assuming fiscal year starts in October (month 10)
        IF EXTRACT(MONTH FROM NEW."invoiceDate") >= 10 THEN
            fiscal_year := fiscal_year + 1;
        END IF;
        
        NEW."fiscalYear" := fiscal_year;
        
        -- Get document number configuration
        SELECT prefix, "currentNo" INTO doc_prefix, current_num
        FROM "DocumentNumber"
        WHERE type = 'INVOICE'
        FOR UPDATE;  -- Lock the row
        
        IF doc_prefix IS NULL THEN
            doc_prefix := 'INV';
            current_num := 0;
            INSERT INTO "DocumentNumber" (type, prefix, "currentNo")
            VALUES ('INVOICE', doc_prefix, 0);
        END IF;
        
        -- Increment and generate number
        current_num := current_num + 1;
        new_number := doc_prefix || '-' || fiscal_year::TEXT || '-' || LPAD(current_num::TEXT, 6, '0');
        
        -- Update counter
        UPDATE "DocumentNumber"
        SET "currentNo" = current_num
        WHERE type = 'INVOICE';
        
        NEW."invoiceNo" := new_number;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_invoice_number ON "Invoice";
CREATE TRIGGER trg_generate_invoice_number
    BEFORE INSERT ON "Invoice"
    FOR EACH ROW
    EXECUTE FUNCTION generate_invoice_number();

-- ============================================
-- 6. Stock Balance Auto-Update Trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_stock_balance()
RETURNS TRIGGER AS $$
DECLARE
    current_qty FLOAT;
    current_cost INT;
    new_total_cost BIGINT;
    new_unit_cost INT;
BEGIN
    -- Get current balance
    SELECT quantity, "unitCost", "totalCost"
    INTO current_qty, current_cost
    FROM "StockBalance"
    WHERE "productId" = NEW."productId" AND "warehouseId" = NEW."warehouseId"
    FOR UPDATE;
    
    -- If no existing balance, create one
    IF current_qty IS NULL THEN
        INSERT INTO "StockBalance" ("productId", "warehouseId", quantity, "unitCost", "totalCost")
        VALUES (
            NEW."productId",
            NEW."warehouseId",
            CASE WHEN NEW.type IN ('RECEIVE', 'TRANSFER_IN', 'ADJUST', 'INITIAL') THEN NEW.quantity
                 WHEN NEW.type IN ('ISSUE', 'TRANSFER_OUT', 'RETURN') THEN -NEW.quantity
                 ELSE 0 END,
            NEW."unitCost",
            NEW."totalCost"
        );
    ELSE
        -- Calculate new values
        IF NEW.type IN ('RECEIVE', 'TRANSFER_IN', 'ADJUST', 'INITIAL') THEN
            -- Adding stock
            new_total_cost := (current_qty * current_cost) + NEW."totalCost";
            current_qty := current_qty + NEW.quantity;
        ELSIF NEW.type IN ('ISSUE', 'TRANSFER_OUT', 'RETURN') THEN
            -- Removing stock
            new_total_cost := (current_qty * current_cost) - NEW."totalCost";
            current_qty := current_qty - NEW.quantity;
        END IF;
        
        -- Calculate new unit cost (weighted average)
        IF current_qty > 0 THEN
            new_unit_cost := (new_total_cost / current_qty)::INT;
        ELSE
            new_unit_cost := 0;
        END IF;
        
        -- Update balance
        UPDATE "StockBalance"
        SET quantity = current_qty,
            "unitCost" = new_unit_cost,
            "totalCost" = new_total_cost::INT,
            "updatedAt" = NOW()
        WHERE "productId" = NEW."productId" AND "warehouseId" = NEW."warehouseId";
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_stock_balance ON "StockMovement";
CREATE TRIGGER trg_update_stock_balance
    AFTER INSERT ON "StockMovement"
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_balance();

-- ============================================
-- 7. Customer Balance Update Trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_customer_balance()
RETURNS TRIGGER AS $$
DECLARE
    customer_credit_limit INT;
    total_outstanding INT;
BEGIN
    -- Only process when invoice is posted/issued
    IF NEW.status IN ('ISSUED', 'PARTIAL') AND (OLD IS NULL OR OLD.status = 'DRAFT') THEN
        -- Check credit limit
        SELECT "creditLimit" INTO customer_credit_limit
        FROM "Customer"
        WHERE id = NEW."customerId";
        
        -- Calculate total outstanding
        SELECT COALESCE(SUM("netAmount" - "paidAmount"), 0)
        INTO total_outstanding
        FROM "Invoice"
        WHERE "customerId" = NEW."customerId"
        AND status IN ('ISSUED', 'PARTIAL')
        AND id != NEW.id;
        
        total_outstanding := total_outstanding + NEW."netAmount";
        
        -- Warning if over credit limit
        IF customer_credit_limit > 0 AND total_outstanding > customer_credit_limit THEN
            RAISE WARNING 'Customer % is over credit limit. Outstanding: %, Limit: %',
                NEW."customerId", total_outstanding, customer_credit_limit;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_customer_balance ON "Invoice";
CREATE TRIGGER trg_update_customer_balance
    AFTER INSERT OR UPDATE ON "Invoice"
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_balance();

-- ============================================
-- 8. Prevent Future Date for Posted Documents
-- ============================================
CREATE OR REPLACE FUNCTION prevent_future_posted_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'POSTED' AND NEW.date > CURRENT_DATE THEN
        RAISE EXCEPTION 'Cannot post journal entry with future date: %', NEW.date;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_future_journal_date ON "JournalEntry";
CREATE TRIGGER trg_prevent_future_journal_date
    BEFORE UPDATE ON "JournalEntry"
    FOR EACH ROW
    EXECUTE FUNCTION prevent_future_posted_date();

-- ============================================
-- 9. VAT Record Auto-Create Trigger
-- ============================================
CREATE OR REPLACE FUNCTION create_vat_record()
RETURNS TRIGGER AS $$
DECLARE
    vat_type TEXT;
    doc_month INT;
    doc_year INT;
BEGIN
    -- Determine VAT type
    IF TG_TABLE_NAME = 'Invoice' THEN
        vat_type := 'OUTPUT';
    ELSIF TG_TABLE_NAME = 'PurchaseInvoice' THEN
        vat_type := 'INPUT';
    ELSE
        RETURN NEW;
    END IF;
    
    -- Extract tax month/year
    doc_month := EXTRACT(MONTH FROM NEW."invoiceDate");
    doc_year := EXTRACT(YEAR FROM NEW."invoiceDate");
    
    -- Create VAT record
    INSERT INTO "VatRecord" (
        type, "documentNo", "documentDate", "documentType", "referenceId",
        "subtotal", "vatRate", "vatAmount", "totalAmount",
        "taxMonth", "taxYear", "reportStatus"
    ) VALUES (
        vat_type,
        COALESCE(NEW."invoiceNo", NEW."vendorInvoiceNo"),
        NEW."invoiceDate",
        NEW.type,
        NEW.id,
        NEW.subtotal,
        NEW."vatRate",
        NEW."vatAmount",
        NEW."totalAmount",
        doc_month,
        doc_year,
        'PENDING'
    )
    ON CONFLICT (type, "documentNo", "taxYear", "taxMonth") DO UPDATE
    SET "subtotal" = EXCLUDED.subtotal,
        "vatAmount" = EXCLUDED."vatAmount",
        "totalAmount" = EXCLUDED."totalAmount",
        "updatedAt" = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_create_vat_invoice ON "Invoice";
CREATE TRIGGER trg_create_vat_invoice
    AFTER INSERT OR UPDATE ON "Invoice"
    FOR EACH ROW
    WHEN (NEW.status = 'ISSUED' OR NEW.status = 'PARTIAL' OR NEW.status = 'PAID')
    EXECUTE FUNCTION create_vat_record();

DROP TRIGGER IF EXISTS trg_create_vat_purchase ON "PurchaseInvoice";
CREATE TRIGGER IF NOT EXISTS trg_create_vat_purchase
    AFTER INSERT OR UPDATE ON "PurchaseInvoice"
    FOR EACH ROW
    WHEN (NEW.status = 'ISSUED' OR NEW.status = 'PARTIAL' OR NEW.status = 'PAID')
    EXECUTE FUNCTION create_vat_record();

-- ============================================
-- 10. Soft Delete Helper Function
-- ============================================
CREATE OR REPLACE FUNCTION soft_delete_record(record_id UUID, deleted_by UUID, table_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    EXECUTE format('UPDATE "%I" SET "isActive" = false, "deletedAt" = NOW(), "deletedBy" = $1 WHERE id = $2', table_name)
    USING deleted_by, record_id;
    
    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 11. Full-Text Search Update Trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'Customer' THEN
        NEW.search_vector := 
            setweight(to_tsvector('thai', COALESCE(NEW.name, '')), 'A') ||
            setweight(to_tsvector('thai', COALESCE(NEW.code, '')), 'A') ||
            setweight(to_tsvector('simple', COALESCE(NEW."taxId", '')), 'B') ||
            setweight(to_tsvector('thai', COALESCE(NEW.address, '')), 'C');
    ELSIF TG_TABLE_NAME = 'Product' THEN
        NEW.search_vector := 
            setweight(to_tsvector('thai', COALESCE(NEW.name, '')), 'A') ||
            setweight(to_tsvector('simple', COALESCE(NEW.code, '')), 'A') ||
            setweight(to_tsvector('thai', COALESCE(NEW.description, '')), 'B');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add search_vector columns if not exist
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

CREATE INDEX IF NOT EXISTS idx_customer_search ON "Customer" USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_product_search ON "Product" USING GIN(search_vector);

-- ============================================
-- 12. Connection Pool Check Function
-- ============================================
CREATE OR REPLACE FUNCTION get_connection_stats()
RETURNS TABLE (
    datname TEXT,
    numbackends INTEGER,
    xact_commit BIGINT,
    xact_rollback BIGINT,
    blks_read BIGINT,
    blks_hit BIGINT,
    tup_returned BIGINT,
    tup_fetched BIGINT,
    tup_inserted BIGINT,
    tup_updated BIGINT,
    tup_deleted BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.datname::TEXT,
        s.numbackends,
        s.xact_commit,
        s.xact_rollback,
        s.blks_read,
        s.blks_hit,
        s.tup_returned,
        s.tup_fetched,
        s.tup_inserted,
        s.tup_updated,
        s.tup_deleted
    FROM pg_stat_database s
    WHERE s.datname = current_database();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 13. Performance Monitoring Functions
-- ============================================
CREATE TABLE IF NOT EXISTS "QueryPerformanceLog" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_hash TEXT,
    query_text TEXT,
    execution_time_ms BIGINT,
    rows_affected BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_query_perf_hash ON "QueryPerformanceLog"(query_hash);
CREATE INDEX idx_query_perf_created ON "QueryPerformanceLog"(created_at);

CREATE OR REPLACE FUNCTION log_slow_query(
    p_query_hash TEXT,
    p_query_text TEXT,
    p_execution_time_ms BIGINT,
    p_rows_affected BIGINT DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
    IF p_execution_time_ms > 1000 THEN -- Log queries slower than 1 second
        INSERT INTO "QueryPerformanceLog" (query_hash, query_text, execution_time_ms, rows_affected)
        VALUES (p_query_hash, p_query_text, p_execution_time_ms, p_rows_affected);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 14. Data Validation Functions
-- ============================================
CREATE OR REPLACE FUNCTION validate_tax_id(tax_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    checksum INT := 0;
    weight INT[] := ARRAY[13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
    i INT;
    digit INT;
    check_digit INT;
BEGIN
    -- Check length
    IF LENGTH(tax_id) != 13 THEN
        RETURN FALSE;
    END IF;
    
    -- Check if all digits
    IF tax_id !~ '^[0-9]+$' THEN
        RETURN FALSE;
    END IF;
    
    -- Calculate checksum (Thai Tax ID validation)
    FOR i IN 1..12 LOOP
        digit := SUBSTRING(tax_id FROM i FOR 1)::INT;
        checksum := checksum + (digit * weight[i]);
    END LOOP;
    
    check_digit := (11 - (checksum % 11)) % 10;
    
    RETURN check_digit = SUBSTRING(tax_id FROM 13 FOR 1)::INT;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 15. Archive Old Records Function
-- ============================================
CREATE OR REPLACE FUNCTION archive_old_records(
    source_table TEXT,
    archive_table TEXT,
    date_column TEXT,
    days_old INT
)
RETURNS BIGINT AS $$
DECLARE
    archived_count BIGINT;
BEGIN
    -- Create archive table if not exists
    EXECUTE format('CREATE TABLE IF NOT EXISTS %I (LIKE %I INCLUDING ALL)', archive_table, source_table);
    
    -- Move old records
    EXECUTE format('
        WITH moved AS (
            DELETE FROM %I
            WHERE %I < NOW() - INTERVAL ''%s days''
            RETURNING *
        )
        INSERT INTO %I
        SELECT * FROM moved
    ', source_table, date_column, days_old, archive_table);
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 16. Database Health Check Function
-- ============================================
CREATE OR REPLACE FUNCTION get_database_health()
RETURNS TABLE (
    check_name TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- Check 1: Table bloat
    RETURN QUERY
    SELECT 
        'Table Bloat'::TEXT,
        CASE WHEN pg_relation_size(schemaname||'.'||relname) > 100000000 THEN 'WARNING' ELSE 'OK' END,
        relname || ': ' || pg_size_pretty(pg_relation_size(schemaname||'.'||relname))
    FROM pg_stat_user_tables
    WHERE pg_relation_size(schemaname||'.'||relname) > 10000000
    ORDER BY pg_relation_size(schemaname||'.'||relname) DESC
    LIMIT 10;
    
    -- Check 2: Long running queries
    RETURN QUERY
    SELECT 
        'Long Running Queries'::TEXT,
        'WARNING',
        'Query running for ' || EXTRACT(EPOCH FROM (NOW() - query_start))::INT || 's'
    FROM pg_stat_activity
    WHERE state = 'active'
    AND query_start < NOW() - INTERVAL '5 minutes'
    AND usename != 'postgres';
    
    -- Check 3: Connection count
    RETURN QUERY
    SELECT 
        'Connection Count'::TEXT,
        CASE WHEN count(*) > 80 THEN 'WARNING' ELSE 'OK' END,
        count(*)::TEXT || ' active connections'
    FROM pg_stat_activity
    WHERE state = 'active';
    
    -- Check 4: Unvacuumed tables
    RETURN QUERY
    SELECT 
        'AutoVacuum Status'::TEXT,
        CASE WHEN n_dead_tup > 10000 THEN 'WARNING' ELSE 'OK' END,
        relname || ': ' || n_dead_tup::TEXT || ' dead tuples'
    FROM pg_stat_user_tables
    WHERE n_dead_tup > 1000
    ORDER BY n_dead_tup DESC
    LIMIT 5;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;
