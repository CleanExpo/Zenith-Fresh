-- Performance optimization indexes for Zenith Platform

-- User lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON "users" ("email");
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON "users" ("stripeCustomerId");

-- Session management
CREATE INDEX IF NOT EXISTS idx_sessions_session_token ON "sessions" ("sessionToken");
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON "sessions" ("userId");
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON "sessions" ("expires");

-- Project access patterns
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON "projects" ("userId");
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON "projects" ("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_projects_user_created ON "projects" ("userId", "createdAt" DESC);

-- Website scans
CREATE INDEX IF NOT EXISTS idx_website_scans_project_id ON "website_scans" ("projectId");
CREATE INDEX IF NOT EXISTS idx_website_scans_status ON "website_scans" ("status");
CREATE INDEX IF NOT EXISTS idx_website_scans_created_at ON "website_scans" ("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_website_scans_url ON "website_scans" ("url");
CREATE INDEX IF NOT EXISTS idx_website_scans_project_created ON "website_scans" ("projectId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_website_scans_url_status ON "website_scans" ("url", "status");

-- Alerts
CREATE INDEX IF NOT EXISTS idx_alerts_scan_id ON "alerts" ("scanId");
CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON "alerts" ("isResolved");
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON "alerts" ("severity");
CREATE INDEX IF NOT EXISTS idx_alerts_scan_resolved ON "alerts" ("scanId", "isResolved");

-- Audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON "audit_logs" ("userId");
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON "audit_logs" ("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON "audit_logs" ("action");

-- Team management
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON "team_members" ("userId");
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON "team_members" ("teamId");
CREATE INDEX IF NOT EXISTS idx_team_members_role ON "team_members" ("role");
CREATE INDEX IF NOT EXISTS idx_team_projects_team_id ON "team_projects" ("teamId");
CREATE INDEX IF NOT EXISTS idx_team_projects_project_id ON "team_projects" ("projectId");

-- API performance
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON "api_keys" ("key");
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON "api_keys" ("userId");
CREATE INDEX IF NOT EXISTS idx_api_keys_expires_at ON "api_keys" ("expiresAt");

-- Security events
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON "security_events" ("userId");
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON "security_events" ("eventType");
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON "security_events" ("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_ip_address ON "security_events" ("ipAddress");

-- Partial indexes for common queries
CREATE INDEX IF NOT EXISTS idx_website_scans_pending ON "website_scans" ("projectId", "createdAt" DESC) 
WHERE "status" IN ('pending', 'running');

CREATE INDEX IF NOT EXISTS idx_alerts_unresolved ON "alerts" ("scanId", "severity") 
WHERE "isResolved" = false;

-- Analyze tables to update statistics
ANALYZE "users";
ANALYZE "sessions";
ANALYZE "projects";
ANALYZE "website_scans";
ANALYZE "alerts";
ANALYZE "audit_logs";