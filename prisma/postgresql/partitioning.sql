-- ============================================
-- C2. Table Partitioning for Performance
-- Thai Accounting ERP System - PostgreSQL
-- ============================================

-- ============================================
-- 1. Partition JournalEntry by Year
-- ============================================

-- Note: Partitioning existing tables requires recreating them
-- This script shows the structure for a new partitioned table

-- Drop existing table if exists (USE WITH CAUTION - backup data first!)
-- DROP TABLE IF EXISTS journal_entries CASCADE;

-- Create partitioned journal_entries table
CREATE TABLE journal_entries (
    id TEXT NOT NULL,
    entry_no TEXT NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    reference TEXT,
    document_type TEXT,
    document_id TEXT,
    total_debit INTEGER DEFAULT 0,
    total_credit INTEGER DEFAULT 0,
    status TEXT DEFAULT 'DRAFT',
    is_adjustment BOOLEAN DEFAULT FALSE,
    is_reversing BOOLEAN DEFAULT FALSE,
    reversing_id TEXT,
    created_by_id TEXT,
    approved_by_id TEXT,
    approved_at TIMESTAMP(3),
    idempotency_key TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP(3),
    deleted_by TEXT,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id, date)
) PARTITION BY RANGE (date);

-- Create partitions for recent and future years
CREATE TABLE journal_entries_2023 PARTITION OF journal_entries
    FOR VALUES FROM ('2023-01-01') TO ('2024-01-01');

CREATE TABLE journal_entries_2024 PARTITION OF journal_entries
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE journal_entries_2025 PARTITION OF journal_entries
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

CREATE TABLE journal_entries_2026 PARTITION OF journal_entries
    FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

-- Default partition for any dates outside defined ranges
CREATE TABLE journal_entries_default PARTITION OF journal_entries DEFAULT;

-- Create indexes on partitioned table
CREATE INDEX idx_journal_entries_date ON journal_entries (date);
CREATE INDEX idx_journal_entries_status ON journal_entries (status);
CREATE INDEX idx_journal_entries_created_by ON journal_entries (created_by_id);
CREATE INDEX idx_journal_entries_deleted_at ON journal_entries (deleted_at) WHERE deleted_at IS NOT NULL;

-- ============================================
-- 2. Partition JournalLine by Entry Date (via JournalEntry)
-- ============================================

-- Create partitioned journal_lines table
CREATE TABLE journal_lines (
    id TEXT NOT NULL,
    entry_id TEXT NOT NULL,
    entry_date DATE NOT NULL,  -- Added for partitioning
    line_no INTEGER,
    account_id TEXT NOT NULL,
    description TEXT,
    debit INTEGER DEFAULT 0,
    credit INTEGER DEFAULT 0,
    reference TEXT,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id, entry_date)
) PARTITION BY RANGE (entry_date);

-- Create partitions
CREATE TABLE journal_lines_2023 PARTITION OF journal_lines
    FOR VALUES FROM ('2023-01-01') TO ('2024-01-01');

CREATE TABLE journal_lines_2024 PARTITION OF journal_lines
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE journal_lines_2025 PARTITION OF journal_lines
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

CREATE TABLE journal_lines_2026 PARTITION OF journal_lines
    FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

CREATE TABLE journal_lines_default PARTITION OF journal_lines DEFAULT;

-- Create indexes
CREATE INDEX idx_journal_lines_entry_id ON journal_lines (entry_id);
CREATE INDEX idx_journal_lines_account_id ON journal_lines (account_id);
CREATE INDEX idx_journal_lines_created_at ON journal_lines (created_at);

-- ============================================
-- 3. Partition StockMovement by Date
-- ============================================

CREATE TABLE stock_movements (
    id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    warehouse_id TEXT NOT NULL,
    type TEXT NOT NULL,
    quantity FLOAT NOT NULL,
    unit_cost INTEGER NOT NULL,
    total_cost INTEGER NOT NULL,
    date DATE NOT NULL,
    reference_id TEXT,
    reference_no TEXT,
    source_channel TEXT,
    notes TEXT,
    created_by_id TEXT,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    currency TEXT DEFAULT 'THB',
    exchange_rate FLOAT DEFAULT 1.0,
    foreign_cost INTEGER,
    
    PRIMARY KEY (id, date)
) PARTITION BY RANGE (date);

-- Create monthly partitions for recent data
CREATE TABLE stock_movements_2024_q1 PARTITION OF stock_movements
    FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');

CREATE TABLE stock_movements_2024_q2 PARTITION OF stock_movements
    FOR VALUES FROM ('2024-04-01') TO ('2024-07-01');

CREATE TABLE stock_movements_2024_q3 PARTITION OF stock_movements
    FOR VALUES FROM ('2024-07-01') TO ('2024-10-01');

CREATE TABLE stock_movements_2024_q4 PARTITION OF stock_movements
    FOR VALUES FROM ('2024-10-01') TO ('2025-01-01');

CREATE TABLE stock_movements_2025_q1 PARTITION OF stock_movements
    FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');

CREATE TABLE stock_movements_2025_q2 PARTITION OF stock_movements
    FOR VALUES FROM ('2025-04-01') TO ('2025-07-01');

CREATE TABLE stock_movements_default PARTITION OF stock_movements DEFAULT;

-- Create indexes
CREATE INDEX idx_stock_movements_product ON stock_movements (product_id);
CREATE INDEX idx_stock_movements_warehouse ON stock_movements (warehouse_id);
CREATE INDEX idx_stock_movements_reference ON stock_movements (reference_id);
CREATE INDEX idx_stock_movements_date ON stock_movements (date);

-- ============================================
-- 4. Partition API Request Logs by Timestamp
-- ============================================

CREATE TABLE api_request_logs (
    id TEXT NOT NULL,
    timestamp TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id TEXT,
    session_id TEXT,
    api_version TEXT DEFAULT 'v1',
    method TEXT NOT NULL,
    path TEXT NOT NULL,
    query TEXT,
    status_code INTEGER,
    duration INTEGER,
    ip_address TEXT NOT NULL,
    user_agent TEXT,
    error TEXT,
    
    PRIMARY KEY (id, timestamp)
) PARTITION BY RANGE (timestamp);

-- Create monthly partitions
CREATE TABLE api_request_logs_2024_01 PARTITION OF api_request_logs
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE api_request_logs_2024_02 PARTITION OF api_request_logs
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

CREATE TABLE api_request_logs_2024_03 PARTITION OF api_request_logs
    FOR VALUES FROM ('2024-03-01') TO ('2024-04-01');

CREATE TABLE api_request_logs_2024_04 PARTITION OF api_request_logs
    FOR VALUES FROM ('2024-04-01') TO ('2024-05-01');

CREATE TABLE api_request_logs_2024_05 PARTITION OF api_request_logs
    FOR VALUES FROM ('2024-05-01') TO ('2024-06-01');

CREATE TABLE api_request_logs_2024_06 PARTITION OF api_request_logs
    FOR VALUES FROM ('2024-06-01') TO ('2024-07-01');

CREATE TABLE api_request_logs_2024_07 PARTITION OF api_request_logs
    FOR VALUES FROM ('2024-07-01') TO ('2024-08-01');

CREATE TABLE api_request_logs_2024_08 PARTITION OF api_request_logs
    FOR VALUES FROM ('2024-08-01') TO ('2024-09-01');

CREATE TABLE api_request_logs_2024_09 PARTITION OF api_request_logs
    FOR VALUES FROM ('2024-09-01') TO ('2024-10-01');

CREATE TABLE api_request_logs_2024_10 PARTITION OF api_request_logs
    FOR VALUES FROM ('2024-10-01') TO ('2024-11-01');

CREATE TABLE api_request_logs_2024_11 PARTITION OF api_request_logs
    FOR VALUES FROM ('2024-11-01') TO ('2024-12-01');

CREATE TABLE api_request_logs_2024_12 PARTITION OF api_request_logs
    FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');

CREATE TABLE api_request_logs_default PARTITION OF api_request_logs DEFAULT;

-- Create indexes
CREATE INDEX idx_api_logs_timestamp ON api_request_logs (timestamp);
CREATE INDEX idx_api_logs_user ON api_request_logs (user_id);
CREATE INDEX idx_api_logs_path ON api_request_logs (path);
CREATE INDEX idx_api_logs_status ON api_request_logs (status_code);

-- ============================================
-- 5. Partition Activity Logs by Created At
-- ============================================

CREATE TABLE activity_logs (
    id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    module TEXT NOT NULL,
    record_id TEXT,
    details JSONB,
    ip_address TEXT,
    status TEXT,
    error_message TEXT,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE activity_logs_2024_01 PARTITION OF activity_logs
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE activity_logs_2024_02 PARTITION OF activity_logs
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

CREATE TABLE activity_logs_2024_03 PARTITION OF activity_logs
    FOR VALUES FROM ('2024-03-01') TO ('2024-04-01');

CREATE TABLE activity_logs_2024_04 PARTITION OF activity_logs
    FOR VALUES FROM ('2024-04-01') TO ('2024-05-01');

CREATE TABLE activity_logs_2024_05 PARTITION OF activity_logs
    FOR VALUES FROM ('2024-05-01') TO ('2024-06-01');

CREATE TABLE activity_logs_2024_06 PARTITION OF activity_logs
    FOR VALUES FROM ('2024-06-01') TO ('2024-07-01');

CREATE TABLE activity_logs_default PARTITION OF activity_logs DEFAULT;

-- Create indexes
CREATE INDEX idx_activity_logs_user ON activity_logs (user_id);
CREATE INDEX idx_activity_logs_action ON activity_logs (action);
CREATE INDEX idx_activity_logs_module ON activity_logs (module);
CREATE INDEX idx_activity_logs_created ON activity_logs (created_at);

-- ============================================
-- 6. Function to Create New Partitions Automatically
-- ============================================

CREATE OR REPLACE FUNCTION create_monthly_partition(
    p_table_name TEXT,
    p_year INTEGER,
    p_month INTEGER
) RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    partition_name TEXT;
    start_date DATE;
    end_date DATE;
    create_sql TEXT;
BEGIN
    partition_name := p_table_name || '_' || p_year || '_' || LPAD(p_month::TEXT, 2, '0');
    start_date := make_date(p_year, p_month, 1);
    end_date := start_date + INTERVAL '1 month';
    
    create_sql := format(
        'CREATE TABLE IF NOT EXISTS %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L)',
        partition_name,
        p_table_name,
        start_date,
        end_date
    );
    
    EXECUTE create_sql;
    
    RETURN partition_name;
END;
$$;

-- Function to create yearly partition for journal entries
CREATE OR REPLACE FUNCTION create_yearly_partition(
    p_year INTEGER
) RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    partition_name TEXT;
BEGIN
    -- Journal entries partition
    partition_name := 'journal_entries_' || p_year;
    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I PARTITION OF journal_entries FOR VALUES FROM (%L) TO (%L)',
        partition_name,
        make_date(p_year, 1, 1),
        make_date(p_year + 1, 1, 1)
    );
    
    -- Journal lines partition
    partition_name := 'journal_lines_' || p_year;
    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I PARTITION OF journal_lines FOR VALUES FROM (%L) TO (%L)',
        partition_name,
        make_date(p_year, 1, 1),
        make_date(p_year + 1, 1, 1)
    );
    
    RETURN 'Partitions created for year ' || p_year;
END;
$$;

-- ============================================
-- 7. Scheduled Job to Create Future Partitions
-- ============================================

CREATE OR REPLACE FUNCTION maintain_partitions()
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    next_month DATE;
    next_year INTEGER;
    next_month_num INTEGER;
    current_year INTEGER;
BEGIN
    -- Get next month
    next_month := DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month');
    next_year := EXTRACT(YEAR FROM next_month);
    next_month_num := EXTRACT(MONTH FROM next_month);
    current_year := EXTRACT(YEAR FROM CURRENT_DATE);
    
    -- Create API logs partition for next month
    PERFORM create_monthly_partition('api_request_logs', next_year, next_month_num);
    PERFORM create_monthly_partition('activity_logs', next_year, next_month_num);
    
    -- Create stock movements partition for next quarter
    IF next_month_num IN (1, 4, 7, 10) THEN
        PERFORM create_monthly_partition('stock_movements', next_year, next_month_num);
    END IF;
    
    -- Create journal partitions for next year if needed
    IF next_year > current_year THEN
        PERFORM create_yearly_partition(next_year);
    END IF;
END;
$$;

-- ============================================
-- 8. Partition Maintenance Functions
-- ============================================

-- Function to detach old partitions (for archiving)
CREATE OR REPLACE FUNCTION detach_old_partition(
    p_table_name TEXT,
    p_partition_name TEXT
) RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    EXECUTE format(
        'ALTER TABLE %I DETACH PARTITION %I',
        p_table_name,
        p_partition_name
    );
    
    RETURN format('Partition %s detached from %s', p_partition_name, p_table_name);
END;
$$;

-- Function to attach partition back
CREATE OR REPLACE FUNCTION attach_partition(
    p_table_name TEXT,
    p_partition_name TEXT,
    p_start_date DATE,
    p_end_date DATE
) RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    EXECUTE format(
        'ALTER TABLE %I ATTACH PARTITION %I FOR VALUES FROM (%L) TO (%L)',
        p_table_name,
        p_partition_name,
        p_start_date,
        p_end_date
    );
    
    RETURN format('Partition %s attached to %s', p_partition_name, p_table_name);
END;
$$;

-- ============================================
-- Comments
-- ============================================

COMMENT ON FUNCTION create_monthly_partition IS 'Creates a monthly partition for a partitioned table';
COMMENT ON FUNCTION create_yearly_partition IS 'Creates yearly partitions for journal tables';
COMMENT ON FUNCTION maintain_partitions IS 'Scheduled function to create future partitions';
COMMENT ON FUNCTION detach_old_partition IS 'Detaches a partition for archiving';
COMMENT ON FUNCTION attach_partition IS 'Attaches a detached partition back to parent table';
