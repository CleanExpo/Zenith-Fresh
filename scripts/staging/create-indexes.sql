-- Railway Staging Database Performance Indexes
-- These indexes optimize query performance for the staging environment

-- Start transaction for atomic index creation
BEGIN;

-- User table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_btree ON "User" USING btree (email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON "User" USING btree (created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role ON "User" USING btree (role);

-- Project table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_user_id ON "Project" USING btree (user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_status ON "Project" USING btree (status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_created_at ON "Project" USING btree (created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_team_id ON "Project" USING btree (team_id);

-- Team table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_teams_subscription_status ON "Team" USING btree (subscription_status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_teams_created_at ON "Team" USING btree (created_at);

-- Analytics table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_user_id ON "Analytics" USING btree (user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_type ON "Analytics" USING btree (type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_created_at ON "Analytics" USING btree (created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_project_id ON "Analytics" USING btree (project_id);

-- Activity Log indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_logs_user_id ON "ActivityLog" USING btree (user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_logs_action ON "ActivityLog" USING btree (action);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_logs_created_at ON "ActivityLog" USING btree (created_at);

-- Audit Log indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_id ON "AuditLog" USING btree (user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_action ON "AuditLog" USING btree (action);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_entity_type ON "AuditLog" USING btree (entity_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_created_at ON "AuditLog" USING btree (created_at);

-- System Metrics indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_metrics_type ON "SystemMetrics" USING btree (type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_metrics_timestamp ON "SystemMetrics" USING btree (timestamp);

-- Mission table indexes (Agent Orchestrator)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_missions_client_id ON "Mission" USING btree (client_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_missions_status ON "Mission" USING btree (status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_missions_priority ON "Mission" USING btree (priority);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_missions_created_at ON "Mission" USING btree (created_at);

-- Mission Task indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mission_tasks_mission_id ON "MissionTask" USING btree (mission_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mission_tasks_status ON "MissionTask" USING btree (status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mission_tasks_agent_type ON "MissionTask" USING btree (agent_type);

-- Approval Request indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_approval_requests_client_id ON "ApprovalRequest" USING btree (client_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_approval_requests_status ON "ApprovalRequest" USING btree (status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_approval_requests_created_at ON "ApprovalRequest" USING btree (created_at);

-- Email Campaign indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_campaigns_status ON "EmailCampaign" USING btree (status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_campaigns_type ON "EmailCampaign" USING btree (type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_campaigns_created_at ON "EmailCampaign" USING btree (created_at);

-- Competitive Analysis indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_competitive_analyses_team_id ON "CompetitiveAnalysis" USING btree (team_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_competitive_analyses_status ON "CompetitiveAnalysis" USING btree (status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_competitive_analyses_created_at ON "CompetitiveAnalysis" USING btree (created_at);

-- WebsiteScan indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_website_scans_team_id_created_at ON "WebsiteScan" USING btree (team_id, created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_website_scans_status ON "WebsiteScan" USING btree (status);

-- CompetitiveReport indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_competitive_reports_team_id_created_at ON "CompetitiveReport" USING btree (team_id, created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_competitive_reports_status ON "CompetitiveReport" USING btree (status);

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_role ON "User" USING btree (email, role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_user_status ON "Project" USING btree (user_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_user_type_date ON "Analytics" USING btree (user_id, type, created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_missions_client_status_priority ON "Mission" USING btree (client_id, status, priority);

-- Partial indexes for specific query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_teams_active_subscriptions 
    ON "Team" USING btree (subscription_status) 
    WHERE subscription_status IN ('active', 'trialing');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_recent_activity 
    ON "User" USING btree (created_at) 
    WHERE created_at >= NOW() - INTERVAL '30 days';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pending_approvals 
    ON "ApprovalRequest" USING btree (status, created_at) 
    WHERE status = 'PENDING';

-- Text search indexes for better search performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_name_gin ON "Project" USING gin(to_tsvector('english', name));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_teams_name_gin ON "Team" USING gin(to_tsvector('english', name));

COMMIT;

-- Log index creation completion
INSERT INTO "AuditLog" (action, entity_type, metadata, created_at) 
VALUES (
    'index_creation', 
    'database', 
    '{"environment": "staging", "index_count": 35, "operation": "create_performance_indexes"}'::json,
    NOW()
);

-- Display index creation summary
SELECT 
    'Railway staging database indexes created successfully' as status,
    COUNT(*) as index_count
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%';