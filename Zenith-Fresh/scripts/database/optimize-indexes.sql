-- =====================================================
-- ZENITH PLATFORM - DATABASE OPTIMIZATION INDEXES
-- Production-Ready Index Optimization for High-Scale
-- =====================================================

-- Performance Monitoring Views
CREATE OR REPLACE VIEW v_query_performance AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    min_time,
    max_time,
    stddev_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements
ORDER BY total_time DESC;

-- Index Usage Analysis View
CREATE OR REPLACE VIEW v_index_usage AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan,
    CASE 
        WHEN idx_scan = 0 THEN 'UNUSED'
        WHEN idx_scan < 10 THEN 'LOW_USAGE'
        WHEN idx_scan < 100 THEN 'MEDIUM_USAGE'
        ELSE 'HIGH_USAGE'
    END as usage_level
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- =====================================================
-- CORE PERFORMANCE INDEXES
-- =====================================================

-- Website Analysis Performance Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_website_analyses_project_status_created 
ON website_analyses (projectId, status, createdAt DESC) 
WHERE status IN ('completed', 'running');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_website_analyses_url_created 
ON website_analyses (url, createdAt DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_website_analyses_score_created 
ON website_analyses (overallScore DESC, createdAt DESC) 
WHERE overallScore IS NOT NULL;

-- Performance Metrics Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_performance_metrics_load_time 
ON performance_metrics (pageLoadTime) 
WHERE pageLoadTime IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_performance_metrics_ttfb 
ON performance_metrics (timeToFirstByte) 
WHERE timeToFirstByte IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_performance_metrics_composite 
ON performance_metrics (pageLoadTime, timeToFirstByte, totalPageSize) 
WHERE pageLoadTime IS NOT NULL AND timeToFirstByte IS NOT NULL;

-- Core Web Vitals Optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_core_web_vitals_lcp_status 
ON core_web_vitals (lcpStatus, largestContentfulPaint) 
WHERE largestContentfulPaint IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_core_web_vitals_performance 
ON core_web_vitals (webVitalsScore DESC, createdAt DESC) 
WHERE webVitalsScore IS NOT NULL;

-- =====================================================
-- SECURITY & MONITORING INDEXES
-- =====================================================

-- Security Events High-Performance Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_events_ip_severity_time 
ON security_events (sourceIp, severity, createdAt DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_events_type_resolved 
ON security_events (type, resolved, createdAt DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_events_user_recent 
ON security_events (userId, createdAt DESC) 
WHERE userId IS NOT NULL AND createdAt > CURRENT_DATE - INTERVAL '30 days';

-- API Key Security Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_keys_hash_active 
ON api_keys (keyHash) 
WHERE isActive = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_keys_user_active 
ON api_keys (userId, isActive, createdAt DESC);

-- Rate Limiting Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rate_limit_user_endpoint 
ON rate_limit_configs (userId, endpoint, isActive) 
WHERE isActive = true;

-- =====================================================
-- USER & PROJECT MANAGEMENT INDEXES
-- =====================================================

-- User Activity Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_active 
ON users (email) 
WHERE email IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_tier_created 
ON users (tier, createdAt DESC);

-- Project Management Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_user_updated 
ON projects (userId, updatedAt DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_url_active 
ON projects (url) 
WHERE url IS NOT NULL;

-- Audit Log Performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_action_time 
ON audit_logs (userId, action, createdAt DESC) 
WHERE userId IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_recent 
ON audit_logs (createdAt DESC) 
WHERE createdAt > CURRENT_DATE - INTERVAL '90 days';

-- =====================================================
-- TEAM COLLABORATION INDEXES
-- =====================================================

-- Team Member Performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_team_members_user_team 
ON team_members (userId, teamId, role);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_team_members_team_role 
ON team_members (teamId, role, joinedAt DESC);

-- Team Activity Tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_team_activities_team_time 
ON team_activities (teamId, createdAt DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_team_activities_user_time 
ON team_activities (userId, createdAt DESC) 
WHERE userId IS NOT NULL;

-- Team Project Association
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_team_projects_team_created 
ON team_projects (teamId, createdAt DESC);

-- =====================================================
-- ANALYTICS & REPORTING INDEXES
-- =====================================================

-- Performance Trend Analysis
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_performance_trends_project_metric 
ON performance_trends (projectId, metricName, lastCalculated DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_performance_trends_url_trend 
ON performance_trends (url, trendDirection, trendStrength DESC) 
WHERE trendDirection IS NOT NULL;

-- Competitor Analysis
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_competitor_analysis_project_date 
ON competitor_analyses (projectId, analysisDate DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_competitor_analysis_score 
ON competitor_analyses (overallScore DESC, analysisDate DESC) 
WHERE overallScore IS NOT NULL;

-- Website Scan Performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_website_scans_project_status 
ON website_scans (projectId, status, createdAt DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_website_scans_performance_score 
ON website_scans (performanceScore DESC, createdAt DESC) 
WHERE performanceScore IS NOT NULL;

-- =====================================================
-- NOTIFICATION & ALERT INDEXES
-- =====================================================

-- Scan Alerts
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scan_alerts_severity_resolved 
ON scan_alerts (severity, isResolved, createdAt DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scan_alerts_scan_type 
ON scan_alerts (scanId, alertType, createdAt DESC);

-- Analysis Alerts
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analysis_alerts_severity_resolved 
ON analysis_alerts (severity, isResolved, createdAt DESC);

-- Alert Notifications
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alert_notifications_status 
ON alert_notifications (status, createdAt DESC);

-- =====================================================
-- SPECIALIZED INDEXES FOR HIGH-VOLUME OPERATIONS
-- =====================================================

-- JSON/JSONB Indexes for complex queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_details_gin 
ON audit_logs USING GIN (details) 
WHERE details IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_website_scans_results_gin 
ON website_scans USING GIN (results) 
WHERE results IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_performance_trends_daily_gin 
ON performance_trends USING GIN (daily) 
WHERE daily IS NOT NULL;

-- Partial indexes for active records only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scheduled_scans_active_next 
ON scheduled_scans (nextRun) 
WHERE isActive = true AND nextRun IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_team_invitations_pending 
ON team_invitations (email, expiresAt) 
WHERE status = 'PENDING' AND expiresAt > NOW();

-- =====================================================
-- MATERIALIZED VIEWS FOR COMPLEX ANALYTICS
-- =====================================================

-- Daily Performance Summary
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_performance_summary AS
SELECT 
    DATE(wa.createdAt) as analysis_date,
    COUNT(*) as total_analyses,
    AVG(wa.overallScore) as avg_overall_score,
    AVG(pm.pageLoadTime) as avg_load_time,
    AVG(cwv.largestContentfulPaint) as avg_lcp,
    AVG(cwv.firstInputDelay) as avg_fid,
    AVG(cwv.cumulativeLayoutShift) as avg_cls,
    COUNT(CASE WHEN wa.overallScore >= 90 THEN 1 END) as excellent_count,
    COUNT(CASE WHEN wa.overallScore BETWEEN 70 AND 89 THEN 1 END) as good_count,
    COUNT(CASE WHEN wa.overallScore < 70 THEN 1 END) as needs_improvement_count
FROM website_analyses wa
LEFT JOIN performance_metrics pm ON wa.id = pm.websiteAnalysisId
LEFT JOIN core_web_vitals cwv ON wa.id = cwv.websiteAnalysisId
WHERE wa.status = 'completed'
    AND wa.createdAt >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(wa.createdAt)
ORDER BY analysis_date DESC;

CREATE UNIQUE INDEX ON mv_daily_performance_summary (analysis_date);

-- Security Events Summary
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_security_summary AS
SELECT 
    DATE(createdAt) as event_date,
    type as event_type,
    severity,
    COUNT(*) as event_count,
    COUNT(DISTINCT sourceIp) as unique_ips,
    COUNT(CASE WHEN blocked THEN 1 END) as blocked_count
FROM security_events
WHERE createdAt >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(createdAt), type, severity
ORDER BY event_date DESC, event_count DESC;

CREATE INDEX ON mv_security_summary (event_date, event_type, severity);

-- =====================================================
-- MAINTENANCE PROCEDURES
-- =====================================================

-- Procedure to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_performance_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_performance_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_security_summary;
END;
$$ LANGUAGE plpgsql;

-- Procedure to analyze table statistics
CREATE OR REPLACE FUNCTION update_table_statistics()
RETURNS void AS $$
DECLARE
    table_name text;
BEGIN
    FOR table_name IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT LIKE 'pg_%'
    LOOP
        EXECUTE format('ANALYZE %I', table_name);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Procedure to check index usage
CREATE OR REPLACE FUNCTION check_unused_indexes()
RETURNS TABLE(
    schema_name text,
    table_name text,
    index_name text,
    index_size text,
    scans bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname::text,
        tablename::text,
        indexname::text,
        pg_size_pretty(pg_relation_size(indexrelid))::text,
        idx_scan
    FROM pg_stat_user_indexes
    WHERE idx_scan < 10
        AND schemaname = 'public'
    ORDER BY pg_relation_size(indexrelid) DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- AUTOMATED MAINTENANCE SCHEDULE
-- =====================================================

-- Create extension if not exists
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily statistics update (if pg_cron is available)
-- SELECT cron.schedule('update-stats', '0 2 * * *', 'SELECT update_table_statistics();');

-- Schedule weekly materialized view refresh
-- SELECT cron.schedule('refresh-views', '0 3 * * 0', 'SELECT refresh_performance_views();');

-- =====================================================
-- PERFORMANCE MONITORING QUERIES
-- =====================================================

-- Query to check index effectiveness
/*
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation,
    null_frac,
    avg_width
FROM pg_stats 
WHERE schemaname = 'public' 
    AND n_distinct > 100
ORDER BY n_distinct DESC;
*/

-- Query to find slow queries
/*
SELECT 
    query,
    calls,
    total_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 20;
*/

-- Query to check table sizes
/*
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY size_bytes DESC;
*/

-- =====================================================
-- COMPLETION NOTIFICATION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Database optimization indexes have been created successfully!';
    RAISE NOTICE 'Total indexes created: ~40 performance-optimized indexes';
    RAISE NOTICE 'Materialized views: 2 analytics views for reporting';
    RAISE NOTICE 'Maintenance procedures: 3 automated maintenance functions';
    RAISE NOTICE 'Next steps: Run ANALYZE on all tables and monitor pg_stat_statements';
END $$;