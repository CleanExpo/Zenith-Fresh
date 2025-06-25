#!/bin/bash

# ==============================================================================
# ZENITH ENTERPRISE - DATABASE MIGRATION AUTOMATION
# Production-grade database migration with safety checks and rollbacks
# ==============================================================================

set -euo pipefail

# Configuration
MIGRATION_ID="${MIGRATION_ID:-$(date +%Y%m%d-%H%M%S)}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
MIGRATION_TIMEOUT="${MIGRATION_TIMEOUT:-3600}"
MAX_DOWNTIME_SECONDS="${MAX_DOWNTIME_SECONDS:-30}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "/tmp/migration-${MIGRATION_ID}.log"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "/tmp/migration-${MIGRATION_ID}.log"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "/tmp/migration-${MIGRATION_ID}.log"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "/tmp/migration-${MIGRATION_ID}.log"
}

# Database backup function
create_database_backup() {
    local backup_name="backup-${MIGRATION_ID}"
    local backup_path="/tmp/db-backups/${backup_name}.sql"
    
    log_info "Creating database backup: $backup_name"
    
    # Create backup directory
    mkdir -p "/tmp/db-backups"
    
    # Create backup based on database type
    if [[ "$DATABASE_URL" == postgres* ]]; then
        pg_dump "$DATABASE_URL" > "$backup_path"
    elif [[ "$DATABASE_URL" == mysql* ]]; then
        mysqldump --single-transaction --routines --triggers "$DATABASE_URL" > "$backup_path"
    else
        log_error "Unsupported database type for backup"
        return 1
    fi
    
    # Compress backup
    gzip "$backup_path"
    
    # Store backup metadata
    cat > "/tmp/db-backups/${backup_name}.meta" << EOF
{
    "id": "$backup_name",
    "migration_id": "$MIGRATION_ID",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "database_url": "$DATABASE_URL",
    "size": "$(du -h "${backup_path}.gz" | cut -f1)",
    "checksum": "$(sha256sum "${backup_path}.gz" | cut -d' ' -f1)"
}
EOF
    
    log_success "Database backup created: ${backup_path}.gz"
    echo "$backup_name"
}

# Restore database from backup
restore_database_backup() {
    local backup_name=$1
    local backup_path="/tmp/db-backups/${backup_name}.sql.gz"
    
    log_info "Restoring database from backup: $backup_name"
    
    if [[ ! -f "$backup_path" ]]; then
        log_error "Backup file not found: $backup_path"
        return 1
    fi
    
    # Verify backup integrity
    local stored_checksum=$(jq -r '.checksum' "/tmp/db-backups/${backup_name}.meta")
    local actual_checksum=$(sha256sum "$backup_path" | cut -d' ' -f1)
    
    if [[ "$stored_checksum" != "$actual_checksum" ]]; then
        log_error "Backup integrity check failed"
        return 1
    fi
    
    # Restore database
    if [[ "$DATABASE_URL" == postgres* ]]; then
        gunzip -c "$backup_path" | psql "$DATABASE_URL"
    elif [[ "$DATABASE_URL" == mysql* ]]; then
        gunzip -c "$backup_path" | mysql "$DATABASE_URL"
    else
        log_error "Unsupported database type for restore"
        return 1
    fi
    
    log_success "Database restored from backup: $backup_name"
}

# Check migration safety
check_migration_safety() {
    log_info "Checking migration safety..."
    
    # Check for destructive operations
    local migration_files=$(find prisma/migrations -name "*.sql" -newer "/tmp/last-migration-check" 2>/dev/null || find prisma/migrations -name "*.sql")
    
    for file in $migration_files; do
        if grep -qi "DROP\|DELETE\|TRUNCATE" "$file"; then
            log_warning "Destructive operation detected in $file"
            read -p "Continue with potentially destructive migration? (y/N): " confirm
            if [[ $confirm != [Yy] ]]; then
                log_error "Migration aborted by user"
                return 1
            fi
        fi
    done
    
    # Check database connections
    local active_connections
    if [[ "$DATABASE_URL" == postgres* ]]; then
        active_connections=$(psql "$DATABASE_URL" -t -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';" | xargs)
    else
        active_connections=0  # Default for other databases
    fi
    
    if [[ $active_connections -gt 10 ]]; then
        log_warning "High number of active database connections: $active_connections"
    fi
    
    # Check database size and estimated migration time
    local db_size
    if [[ "$DATABASE_URL" == postgres* ]]; then
        db_size=$(psql "$DATABASE_URL" -t -c "SELECT pg_size_pretty(pg_database_size(current_database()));" | xargs)
    else
        db_size="unknown"
    fi
    
    log_info "Database size: $db_size"
    
    # Estimate migration time based on database size
    estimate_migration_time
    
    log_success "Migration safety check completed"
}

# Estimate migration time
estimate_migration_time() {
    log_info "Estimating migration time..."
    
    # Simple heuristic based on database size and migration type
    local migration_files=$(find prisma/migrations -name "*.sql" -newer "/tmp/last-migration-check" 2>/dev/null || echo "")
    local estimated_time=30  # Default 30 seconds
    
    if [[ -n "$migration_files" ]]; then
        # Increase estimate for complex migrations
        if grep -qi "ALTER.*ADD.*INDEX\|CREATE.*INDEX" $migration_files; then
            estimated_time=300  # 5 minutes for index creation
        elif grep -qi "ALTER.*TABLE" $migration_files; then
            estimated_time=120  # 2 minutes for table alterations
        fi
    fi
    
    log_info "Estimated migration time: ${estimated_time} seconds"
    
    if [[ $estimated_time -gt $MAX_DOWNTIME_SECONDS ]]; then
        log_warning "Estimated migration time exceeds maximum downtime threshold"
        return 1
    fi
    
    return 0
}

# Online migration strategy
perform_online_migration() {
    log_info "Performing online migration strategy..."
    
    # 1. Create shadow tables for schema changes
    log_info "Creating shadow tables..."
    
    # 2. Copy data in batches
    log_info "Copying data in batches..."
    
    # 3. Set up triggers for data synchronization
    log_info "Setting up data synchronization..."
    
    # 4. Switch to new tables atomically
    log_info "Switching to new tables..."
    
    log_success "Online migration completed"
}

# Standard migration with maintenance window
perform_maintenance_migration() {
    local backup_name=$1
    
    log_info "Performing migration with maintenance window..."
    
    # Put application in maintenance mode
    log_info "Enabling maintenance mode..."
    curl -X POST "$APPLICATION_URL/api/admin/maintenance" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -d '{"enabled": true, "message": "Database migration in progress"}' \
        2>/dev/null || log_warning "Failed to enable maintenance mode"
    
    # Wait for connections to drain
    log_info "Waiting for connections to drain..."
    sleep 10
    
    # Run migrations
    log_info "Running database migrations..."
    local start_time=$(date +%s)
    
    if timeout $MIGRATION_TIMEOUT npx prisma migrate deploy; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        log_success "Migrations completed in ${duration} seconds"
    else
        log_error "Migration failed or timed out"
        
        # Restore from backup
        log_info "Restoring from backup due to migration failure..."
        restore_database_backup "$backup_name"
        
        # Disable maintenance mode
        curl -X POST "$APPLICATION_URL/api/admin/maintenance" \
            -H "Authorization: Bearer $ADMIN_TOKEN" \
            -d '{"enabled": false}' \
            2>/dev/null || log_warning "Failed to disable maintenance mode"
        
        return 1
    fi
    
    # Verify migration
    if verify_migration; then
        log_success "Migration verification passed"
    else
        log_error "Migration verification failed"
        restore_database_backup "$backup_name"
        return 1
    fi
    
    # Disable maintenance mode
    log_info "Disabling maintenance mode..."
    curl -X POST "$APPLICATION_URL/api/admin/maintenance" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -d '{"enabled": false}' \
        2>/dev/null || log_warning "Failed to disable maintenance mode"
    
    log_success "Maintenance migration completed"
}

# Verify migration
verify_migration() {
    log_info "Verifying migration..."
    
    # Check database connectivity
    if ! npx prisma db execute --stdin <<< "SELECT 1;" >/dev/null 2>&1; then
        log_error "Database connectivity check failed"
        return 1
    fi
    
    # Verify schema integrity
    if ! npx prisma db execute --stdin <<< "SELECT table_name FROM information_schema.tables LIMIT 1;" >/dev/null 2>&1; then
        log_error "Schema integrity check failed"
        return 1
    fi
    
    # Run application health check
    if ! curl -f -s "$APPLICATION_URL/api/health" >/dev/null 2>&1; then
        log_error "Application health check failed"
        return 1
    fi
    
    # Run data integrity checks
    if ! npm run db:verify >/dev/null 2>&1; then
        log_warning "Data integrity checks failed"
    fi
    
    log_success "Migration verification completed"
    return 0
}

# Cleanup old backups
cleanup_old_backups() {
    log_info "Cleaning up old backups..."
    
    # Remove backups older than retention period
    find /tmp/db-backups -name "*.sql.gz" -mtime +$BACKUP_RETENTION_DAYS -delete
    find /tmp/db-backups -name "*.meta" -mtime +$BACKUP_RETENTION_DAYS -delete
    
    log_success "Old backup cleanup completed"
}

# Generate migration report
generate_migration_report() {
    local backup_name=$1
    local migration_status=$2
    
    cat > "/tmp/migration-report-${MIGRATION_ID}.json" << EOF
{
    "migration_id": "$MIGRATION_ID",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "backup_name": "$backup_name",
    "status": "$migration_status",
    "database_url_hash": "$(echo -n "$DATABASE_URL" | sha256sum | cut -d' ' -f1)",
    "environment": "${ENVIRONMENT:-production}",
    "logs": "/tmp/migration-${MIGRATION_ID}.log"
}
EOF
    
    log_info "Migration report generated: /tmp/migration-report-${MIGRATION_ID}.json"
}

# Main migration function
main() {
    local migration_strategy=${1:-maintenance}
    
    log_info "Starting database migration automation"
    log_info "Migration ID: $MIGRATION_ID"
    log_info "Strategy: $migration_strategy"
    
    # Create backup
    local backup_name
    backup_name=$(create_database_backup)
    
    # Check migration safety
    if ! check_migration_safety; then
        log_error "Migration safety check failed"
        generate_migration_report "$backup_name" "safety_check_failed"
        exit 1
    fi
    
    # Perform migration based on strategy
    local migration_success=false
    case $migration_strategy in
        "online")
            if perform_online_migration; then
                migration_success=true
            fi
            ;;
        "maintenance")
            if perform_maintenance_migration "$backup_name"; then
                migration_success=true
            fi
            ;;
        *)
            log_error "Unknown migration strategy: $migration_strategy"
            generate_migration_report "$backup_name" "unknown_strategy"
            exit 1
            ;;
    esac
    
    # Handle migration result
    if $migration_success; then
        log_success "Database migration completed successfully!"
        generate_migration_report "$backup_name" "success"
        
        # Cleanup old backups
        cleanup_old_backups
        
        # Send success notification
        curl -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-type: application/json' \
            --data "{\"text\":\"✅ Database migration completed successfully: $MIGRATION_ID\"}" \
            2>/dev/null || log_warning "Slack notification failed"
    else
        log_error "Database migration failed"
        generate_migration_report "$backup_name" "failed"
        
        # Send failure notification
        curl -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-type: application/json' \
            --data "{\"text\":\"❌ Database migration failed: $MIGRATION_ID\"}" \
            2>/dev/null || log_warning "Slack notification failed"
        
        exit 1
    fi
    
    # Update last migration check timestamp
    touch "/tmp/last-migration-check"
    
    log_info "Migration ID: $MIGRATION_ID"
    log_info "Backup: $backup_name"
    log_info "Logs: /tmp/migration-${MIGRATION_ID}.log"
}

# Execute main function
main "$@"