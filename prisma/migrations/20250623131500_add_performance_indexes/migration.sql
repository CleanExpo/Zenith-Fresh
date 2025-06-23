-- Add performance indexes for frequently queried fields
-- These indexes were identified as missing in the comprehensive audit

-- User email index (for authentication queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "User_email_idx" ON "User"("email");

-- Project indexes for dashboard and filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Project_userId_status_idx" ON "Project"("userId", "status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Project_teamId_idx" ON "Project"("teamId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Project_updatedAt_idx" ON "Project"("updatedAt" DESC);

-- TeamMember indexes for team operations
CREATE INDEX CONCURRENTLY IF NOT EXISTS "TeamMember_userId_teamId_idx" ON "TeamMember"("userId", "teamId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "TeamMember_teamId_idx" ON "TeamMember"("teamId");

-- Task indexes for project views
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Task_userId_status_idx" ON "Task"("userId", "status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Task_projectId_status_idx" ON "Task"("projectId", "status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Task_updatedAt_idx" ON "Task"("updatedAt" DESC);

-- ActivityLog indexes for dashboard activity feeds
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ActivityLog_userId_createdAt_idx" ON "ActivityLog"("userId", "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ActivityLog_projectId_createdAt_idx" ON "ActivityLog"("projectId", "createdAt" DESC);

-- Analytics indexes for performance tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Analytics_userId_createdAt_idx" ON "Analytics"("userId", "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Analytics_type_createdAt_idx" ON "Analytics"("type", "createdAt" DESC);

-- Notification indexes for real-time features
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Notification_userId_read_idx" ON "Notification"("userId", "read");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Notification_createdAt_idx" ON "Notification"("createdAt" DESC);

-- File indexes for project file management
CREATE INDEX CONCURRENTLY IF NOT EXISTS "File_userId_idx" ON "File"("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "File_projectId_idx" ON "File"("projectId");

-- Session indexes for authentication performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Session_userId_idx" ON "Session"("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Session_expires_idx" ON "Session"("expires");

-- Account indexes for OAuth operations
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Account_userId_idx" ON "Account"("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Account_provider_providerAccountId_idx" ON "Account"("provider", "providerAccountId");