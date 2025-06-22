-- Zenith Fresh SaaS Database Initialization
-- Creates tables for user management, analytics, and system monitoring

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Users table for authentication and user management
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username CITEXT UNIQUE NOT NULL,
    email CITEXT UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'starter',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    subscription_plan VARCHAR(50) DEFAULT 'starter',
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    api_key UUID DEFAULT uuid_generate_v4(),
    settings JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}'
);

-- Website analysis results
CREATE TABLE IF NOT EXISTS website_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    website_url TEXT NOT NULL,
    analysis_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    results JSONB DEFAULT '{}',
    score INTEGER,
    recommendations JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'
);

-- System monitoring and health metrics
CREATE TABLE IF NOT EXISTS system_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_type VARCHAR(100) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    value NUMERIC,
    unit VARCHAR(50),
    tags JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- User sessions for authentication
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true
);

-- API usage tracking
CREATE TABLE IF NOT EXISTS api_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER,
    response_time_ms INTEGER,
    request_size INTEGER,
    response_size INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Website health check results
CREATE TABLE IF NOT EXISTS health_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    website_url TEXT NOT NULL,
    check_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    response_time_ms INTEGER,
    status_code INTEGER,
    error_message TEXT,
    results JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Competitive analysis data
CREATE TABLE IF NOT EXISTS competitive_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    primary_domain TEXT NOT NULL,
    competitor_domains TEXT[] NOT NULL,
    analysis_results JSONB DEFAULT '{}',
    insights JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'pending'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_api_key ON users(api_key);
CREATE INDEX IF NOT EXISTS idx_website_analyses_user_id ON website_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_website_analyses_created_at ON website_analyses(created_at);
CREATE INDEX IF NOT EXISTS idx_system_metrics_timestamp ON system_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_system_metrics_type_name ON system_metrics(metric_type, metric_name);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON api_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_timestamp ON api_usage(timestamp);
CREATE INDEX IF NOT EXISTS idx_health_checks_user_id ON health_checks(user_id);
CREATE INDEX IF NOT EXISTS idx_health_checks_timestamp ON health_checks(timestamp);
CREATE INDEX IF NOT EXISTS idx_competitive_analyses_user_id ON competitive_analyses(user_id);

-- Insert default master admin user
INSERT INTO users (
    username, 
    email, 
    password_hash, 
    role, 
    subscription_plan,
    subscription_expires_at,
    settings
) VALUES (
    'zenith_master',
    'admin@zenithfresh.com',
    '$2b$10$hashedpassword', -- This should be properly hashed in production
    'master_admin',
    'enterprise',
    NOW() + INTERVAL '10 years',
    '{"notifications": true, "api_access": "unlimited", "features": "all"}'
) ON CONFLICT (username) DO NOTHING;

-- Insert sample staff users
INSERT INTO users (
    username, 
    email, 
    password_hash, 
    role, 
    subscription_plan,
    settings
) VALUES 
(
    'staff_1',
    'staff1@zenithfresh.com',
    '$2b$10$hashedpassword',
    'staff_tester',
    'professional',
    '{"notifications": true, "api_access": "limited", "features": "premium"}'
),
(
    'qa_lead',
    'qa@zenithfresh.com',
    '$2b$10$hashedpassword',
    'staff_tester',
    'professional',
    '{"notifications": true, "api_access": "limited", "features": "premium"}'
) ON CONFLICT (username) DO NOTHING;

-- Insert sample system metrics
INSERT INTO system_metrics (metric_type, metric_name, value, unit, tags) VALUES
('performance', 'response_time', 150, 'ms', '{"endpoint": "/api/health"}'),
('usage', 'active_users', 25, 'count', '{"period": "daily"}'),
('system', 'cpu_usage', 45.5, 'percent', '{"server": "main"}'),
('system', 'memory_usage', 2048, 'MB', '{"server": "main"}')
ON CONFLICT DO NOTHING;