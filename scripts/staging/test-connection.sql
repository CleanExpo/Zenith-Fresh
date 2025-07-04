-- Railway Staging Database Connection Test
-- This script tests the database connection and basic functionality

-- Test basic connection
SELECT 'Database connection successful' as status, NOW() as timestamp;

-- Test database version
SELECT version() as database_version;

-- Test SSL connection status
SELECT 
    CASE 
        WHEN ssl = 't' THEN 'SSL Enabled'
        ELSE 'SSL Disabled'
    END as ssl_status
FROM pg_stat_ssl WHERE pid = pg_backend_pid();

-- Test database permissions
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE schemaname = 'public' 
LIMIT 5;

-- Test if we can create a temporary table (write permissions)
CREATE TEMP TABLE test_permissions (
    id SERIAL PRIMARY KEY,
    test_data TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO test_permissions (test_data) VALUES ('Railway staging database test');

SELECT 'Write permissions verified' as status, COUNT(*) as test_records 
FROM test_permissions;

DROP TABLE test_permissions;

-- Show current database configuration
SELECT 
    name, 
    setting, 
    short_desc
FROM pg_settings 
WHERE name IN (
    'max_connections',
    'shared_buffers',
    'effective_cache_size',
    'maintenance_work_mem',
    'checkpoint_completion_target',
    'wal_buffers',
    'default_statistics_target',
    'random_page_cost',
    'effective_io_concurrency',
    'work_mem',
    'min_wal_size',
    'max_wal_size'
);

SELECT 'Railway staging database test completed successfully' as final_status;