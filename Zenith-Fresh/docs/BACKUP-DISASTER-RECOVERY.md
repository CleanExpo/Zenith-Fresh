# Production Backup and Disaster Recovery Guide

## Overview

This guide provides comprehensive backup strategies and disaster recovery procedures for the Zenith Platform, ensuring business continuity, data protection, and rapid recovery from any catastrophic events.

## 🎯 Backup and DR Strategy

### Recovery Objectives
- **Recovery Time Objective (RTO)**: 2 hours maximum downtime
- **Recovery Point Objective (RPO)**: 15 minutes maximum data loss
- **Availability Target**: 99.9% uptime (8.77 hours downtime/year)
- **Data Retention**: 30 days operational, 7 years compliance

### Backup Architecture
```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│ Primary System  │───▶│ Local Backup │───▶│ Cloud Storage   │
│ (Production)    │    │ (Daily)      │    │ (AWS S3/GCS)    │
└─────────────────┘    └──────────────┘    └─────────────────┘
         │                       │                      │
         ▼                       ▼                      ▼
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│ Standby System  │    │ Hot Backup   │    │ Geo-redundant  │
│ (DR Site)       │    │ (Real-time)  │    │ Replication     │
└─────────────────┘    └──────────────┘    └─────────────────┘
         │                       │                      │
         ▼                       ▼                      ▼
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│ Monitoring &    │    │ Backup       │    │ Compliance      │
│ Alerting        │    │ Validation   │    │ Archive         │
└─────────────────┘    └──────────────┘    └─────────────────┘
```

## 🗄️ Database Backup Strategy

### 1. PostgreSQL Backup Configuration

**Automated Backup Script:**
```bash
#!/bin/bash
# /scripts/backup/postgres-backup.sh

set -e

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-zenith_platform}"
DB_USER="${DB_USER:-postgres}"
BACKUP_DIR="/backups/postgres"
S3_BUCKET="${BACKUP_S3_BUCKET:-zenith-platform-backups}"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="zenith_platform_${DATE}.sql"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Log function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$BACKUP_DIR/backup.log"
}

log "Starting PostgreSQL backup..."

# Create database dump
log "Creating database dump..."
pg_dump \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    --verbose \
    --clean \
    --if-exists \
    --create \
    --format=custom \
    --compress=9 \
    --file="$BACKUP_PATH"

if [ $? -eq 0 ]; then
    log "Database dump created successfully: $BACKUP_FILE"
else
    log "ERROR: Database dump failed"
    exit 1
fi

# Verify backup integrity
log "Verifying backup integrity..."
pg_restore --list "$BACKUP_PATH" > /dev/null

if [ $? -eq 0 ]; then
    log "Backup integrity verified"
else
    log "ERROR: Backup integrity check failed"
    exit 1
fi

# Compress backup
log "Compressing backup..."
gzip "$BACKUP_PATH"
BACKUP_PATH="${BACKUP_PATH}.gz"

# Upload to S3
if [ ! -z "$S3_BUCKET" ]; then
    log "Uploading backup to S3..."
    aws s3 cp "$BACKUP_PATH" "s3://$S3_BUCKET/postgres/$(date +%Y/%m/%d)/"
    
    if [ $? -eq 0 ]; then
        log "Backup uploaded to S3 successfully"
    else
        log "ERROR: S3 upload failed"
    fi
fi

# Upload to Google Cloud Storage (backup)
if [ ! -z "$GCS_BUCKET" ]; then
    log "Uploading backup to Google Cloud Storage..."
    gsutil cp "$BACKUP_PATH" "gs://$GCS_BUCKET/postgres/$(date +%Y/%m/%d)/"
    
    if [ $? -eq 0 ]; then
        log "Backup uploaded to GCS successfully"
    else
        log "ERROR: GCS upload failed"
    fi
fi

# Clean up old local backups
log "Cleaning up old local backups..."
find "$BACKUP_DIR" -name "zenith_platform_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Clean up old S3 backups
if [ ! -z "$S3_BUCKET" ]; then
    log "Cleaning up old S3 backups..."
    aws s3 ls "s3://$S3_BUCKET/postgres/" --recursive | \
    awk -v date="$(date -d "$RETENTION_DAYS days ago" +%Y-%m-%d)" '$1 < date {print $4}' | \
    xargs -I {} aws s3 rm "s3://$S3_BUCKET/{}"
fi

# Log backup size
BACKUP_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
log "Backup completed successfully. Size: $BACKUP_SIZE"

# Send notification
curl -X POST "$SLACK_WEBHOOK_URL" \
    -H 'Content-type: application/json' \
    --data "{\"text\":\"✅ Database backup completed successfully\\nFile: $BACKUP_FILE\\nSize: $BACKUP_SIZE\"}"

log "PostgreSQL backup process completed"
```

**Point-in-Time Recovery Setup:**
```bash
#!/bin/bash
# PostgreSQL WAL archiving configuration

# postgresql.conf settings
cat >> /etc/postgresql/14/main/postgresql.conf << EOF

# WAL archiving configuration
wal_level = replica
archive_mode = on
archive_command = 'rsync %p barman@backup-server:/var/lib/barman/zenith-platform/incoming/%f'
archive_timeout = 300  # 5 minutes

# Replication settings
max_wal_senders = 3
max_replication_slots = 3

# Checkpoint settings
checkpoint_completion_target = 0.9
checkpoint_timeout = 15min
max_wal_size = 4GB
min_wal_size = 1GB

EOF

# Restart PostgreSQL
systemctl restart postgresql
```

### 2. Redis Backup Configuration

**Redis Backup Script:**
```bash
#!/bin/bash
# /scripts/backup/redis-backup.sh

set -e

REDIS_HOST="${REDIS_HOST:-localhost}"
REDIS_PORT="${REDIS_PORT:-6379}"
REDIS_PASSWORD="${REDIS_PASSWORD}"
BACKUP_DIR="/backups/redis"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="redis_dump_${DATE}.rdb"

mkdir -p "$BACKUP_DIR"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$BACKUP_DIR/backup.log"
}

log "Starting Redis backup..."

# Create Redis snapshot
redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" BGSAVE

# Wait for background save to complete
while [ $(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" LASTSAVE) -eq $(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" LASTSAVE) ]; do
    sleep 1
done

# Copy dump file
cp /var/lib/redis/dump.rdb "$BACKUP_DIR/$BACKUP_FILE"

# Compress and upload
gzip "$BACKUP_DIR/$BACKUP_FILE"

# Upload to cloud storage
aws s3 cp "$BACKUP_DIR/${BACKUP_FILE}.gz" "s3://$S3_BUCKET/redis/$(date +%Y/%m/%d)/"

log "Redis backup completed: ${BACKUP_FILE}.gz"
```

## 📁 Application Backup Procedures

### 1. Application Code and Configuration

**Git Repository Backup:**
```bash
#!/bin/bash
# /scripts/backup/git-backup.sh

set -e

BACKUP_DIR="/backups/git"
DATE=$(date +%Y%m%d_%H%M%S)
REPO_URL="https://github.com/your-org/zenith-platform.git"

mkdir -p "$BACKUP_DIR"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "Starting Git repository backup..."

# Clone repository with all branches and tags
git clone --mirror "$REPO_URL" "$BACKUP_DIR/zenith-platform-${DATE}.git"

# Create archive
tar -czf "$BACKUP_DIR/zenith-platform-${DATE}.tar.gz" -C "$BACKUP_DIR" "zenith-platform-${DATE}.git"

# Upload to S3
aws s3 cp "$BACKUP_DIR/zenith-platform-${DATE}.tar.gz" "s3://$S3_BUCKET/git/$(date +%Y/%m/%d)/"

# Clean up
rm -rf "$BACKUP_DIR/zenith-platform-${DATE}.git"

log "Git repository backup completed"
```

### 2. Environment Configuration Backup

**Configuration Backup Script:**
```bash
#!/bin/bash
# /scripts/backup/config-backup.sh

set -e

BACKUP_DIR="/backups/config"
DATE=$(date +%Y%m%d_%H%M%S)
CONFIG_ARCHIVE="config-backup-${DATE}.tar.gz"

mkdir -p "$BACKUP_DIR"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "Starting configuration backup..."

# Create temporary directory for config files
TEMP_DIR=$(mktemp -d)

# Backup environment variables (excluding secrets)
env | grep -E '^(NEXT_|NODE_|DATABASE_|REDIS_|STRIPE_)' | \
    sed 's/=.*$/=***REDACTED***/' > "$TEMP_DIR/environment.txt"

# Backup Vercel configuration
if [ -f "vercel.json" ]; then
    cp vercel.json "$TEMP_DIR/"
fi

# Backup package.json and lock files
cp package.json "$TEMP_DIR/"
cp package-lock.json "$TEMP_DIR/" 2>/dev/null || true
cp yarn.lock "$TEMP_DIR/" 2>/dev/null || true

# Backup Next.js configuration
cp next.config.js "$TEMP_DIR/" 2>/dev/null || true

# Backup TypeScript configuration
cp tsconfig.json "$TEMP_DIR/" 2>/dev/null || true

# Backup Prisma schema
if [ -d "prisma" ]; then
    cp -r prisma "$TEMP_DIR/"
fi

# Backup SSL certificates (if any)
if [ -d "/etc/ssl/certs/zenith" ]; then
    cp -r "/etc/ssl/certs/zenith" "$TEMP_DIR/ssl-certs"
fi

# Create archive
tar -czf "$BACKUP_DIR/$CONFIG_ARCHIVE" -C "$TEMP_DIR" .

# Upload to S3
aws s3 cp "$BACKUP_DIR/$CONFIG_ARCHIVE" "s3://$S3_BUCKET/config/$(date +%Y/%m/%d)/"

# Clean up
rm -rf "$TEMP_DIR"

log "Configuration backup completed: $CONFIG_ARCHIVE"
```

### 3. File Storage Backup

**S3 Cross-Region Replication:**
```bash
#!/bin/bash
# /scripts/backup/s3-replication.sh

set -e

PRIMARY_BUCKET="zenith-platform-storage"
BACKUP_BUCKET="zenith-platform-storage-backup"
BACKUP_REGION="us-west-2"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "Starting S3 cross-region replication..."

# Sync primary bucket to backup bucket
aws s3 sync "s3://$PRIMARY_BUCKET" "s3://$BACKUP_BUCKET" \
    --region "$BACKUP_REGION" \
    --delete \
    --exclude "*.tmp" \
    --exclude "*/cache/*"

if [ $? -eq 0 ]; then
    log "S3 replication completed successfully"
else
    log "ERROR: S3 replication failed"
    exit 1
fi

# Verify sync
PRIMARY_COUNT=$(aws s3 ls "s3://$PRIMARY_BUCKET" --recursive | wc -l)
BACKUP_COUNT=$(aws s3 ls "s3://$BACKUP_BUCKET" --recursive | wc -l)

log "Primary bucket objects: $PRIMARY_COUNT"
log "Backup bucket objects: $BACKUP_COUNT"

if [ "$PRIMARY_COUNT" -eq "$BACKUP_COUNT" ]; then
    log "Object count verification passed"
else
    log "WARNING: Object count mismatch between buckets"
fi
```

## 🔄 Automated Backup Scheduling

### Cron Job Configuration

```bash
# /etc/crontab - Production backup schedule

# Database backups (every 6 hours)
0 */6 * * * root /scripts/backup/postgres-backup.sh >> /var/log/backup.log 2>&1

# Redis backups (every 4 hours)
0 */4 * * * root /scripts/backup/redis-backup.sh >> /var/log/backup.log 2>&1

# Configuration backup (daily at 2 AM)
0 2 * * * root /scripts/backup/config-backup.sh >> /var/log/backup.log 2>&1

# Git repository backup (daily at 3 AM)
0 3 * * * root /scripts/backup/git-backup.sh >> /var/log/backup.log 2>&1

# S3 replication (every 2 hours)
0 */2 * * * root /scripts/backup/s3-replication.sh >> /var/log/backup.log 2>&1

# Backup verification (daily at 4 AM)
0 4 * * * root /scripts/backup/verify-backups.sh >> /var/log/backup.log 2>&1

# Cleanup old logs (weekly)
0 5 * * 0 root find /var/log -name "backup.log.*" -mtime +30 -delete
```

### Backup Monitoring and Verification

```bash
#!/bin/bash
# /scripts/backup/verify-backups.sh

set -e

S3_BUCKET="zenith-platform-backups"
TODAY=$(date +%Y/%m/%d)
YESTERDAY=$(date -d "1 day ago" +%Y/%m/%d)

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] VERIFY: $1"
}

log "Starting backup verification..."

# Verify PostgreSQL backups
log "Verifying PostgreSQL backups..."
POSTGRES_BACKUPS=$(aws s3 ls "s3://$S3_BUCKET/postgres/$TODAY/" | wc -l)
if [ "$POSTGRES_BACKUPS" -gt 0 ]; then
    log "✅ PostgreSQL backups found for today: $POSTGRES_BACKUPS"
else
    log "❌ No PostgreSQL backups found for today"
    # Check yesterday's backups
    POSTGRES_BACKUPS_YESTERDAY=$(aws s3 ls "s3://$S3_BUCKET/postgres/$YESTERDAY/" | wc -l)
    if [ "$POSTGRES_BACKUPS_YESTERDAY" -eq 0 ]; then
        log "🚨 CRITICAL: No PostgreSQL backups found for today or yesterday"
        # Send critical alert
        curl -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-type: application/json' \
            --data '{"text":"🚨 CRITICAL: PostgreSQL backup verification failed"}'
    fi
fi

# Verify Redis backups
log "Verifying Redis backups..."
REDIS_BACKUPS=$(aws s3 ls "s3://$S3_BUCKET/redis/$TODAY/" | wc -l)
if [ "$REDIS_BACKUPS" -gt 0 ]; then
    log "✅ Redis backups found for today: $REDIS_BACKUPS"
else
    log "❌ No Redis backups found for today"
fi

# Verify configuration backups
log "Verifying configuration backups..."
CONFIG_BACKUPS=$(aws s3 ls "s3://$S3_BUCKET/config/$TODAY/" | wc -l)
if [ "$CONFIG_BACKUPS" -gt 0 ]; then
    log "✅ Configuration backups found for today: $CONFIG_BACKUPS"
else
    log "❌ No configuration backups found for today"
fi

# Test backup integrity
log "Testing backup integrity..."
LATEST_BACKUP=$(aws s3 ls "s3://$S3_BUCKET/postgres/$TODAY/" --recursive | tail -1 | awk '{print $4}')
if [ ! -z "$LATEST_BACKUP" ]; then
    # Download and test latest backup
    aws s3 cp "s3://$S3_BUCKET/$LATEST_BACKUP" /tmp/test_backup.sql.gz
    
    if gunzip -t /tmp/test_backup.sql.gz; then
        log "✅ Latest backup integrity verified"
    else
        log "❌ Latest backup integrity check failed"
    fi
    
    rm -f /tmp/test_backup.sql.gz
fi

log "Backup verification completed"
```

## 🚨 Disaster Recovery Procedures

### 1. Database Recovery Procedures

**PostgreSQL Point-in-Time Recovery:**
```bash
#!/bin/bash
# /scripts/recovery/postgres-recovery.sh

set -e

RECOVERY_TARGET_TIME="$1"  # Format: 2024-01-01 12:00:00
BACKUP_FILE="$2"
RECOVERY_DIR="/var/lib/postgresql-recovery"

if [ -z "$RECOVERY_TARGET_TIME" ] || [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 'YYYY-MM-DD HH:MM:SS' backup_file.sql.gz"
    exit 1
fi

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] RECOVERY: $1"
}

log "Starting PostgreSQL point-in-time recovery..."
log "Target time: $RECOVERY_TARGET_TIME"
log "Backup file: $BACKUP_FILE"

# Stop PostgreSQL service
log "Stopping PostgreSQL service..."
systemctl stop postgresql

# Backup current data directory
log "Backing up current data directory..."
mv /var/lib/postgresql/14/main /var/lib/postgresql/14/main.backup.$(date +%Y%m%d_%H%M%S)

# Create new data directory
log "Creating new data directory..."
mkdir -p /var/lib/postgresql/14/main
chown postgres:postgres /var/lib/postgresql/14/main

# Initialize new cluster
log "Initializing new PostgreSQL cluster..."
sudo -u postgres /usr/lib/postgresql/14/bin/initdb -D /var/lib/postgresql/14/main

# Download and restore base backup
log "Downloading backup file..."
aws s3 cp "s3://$S3_BUCKET/$BACKUP_FILE" /tmp/

log "Restoring base backup..."
gunzip /tmp/$(basename $BACKUP_FILE)
sudo -u postgres pg_restore -d postgres /tmp/$(basename $BACKUP_FILE .gz)

# Configure recovery
log "Configuring point-in-time recovery..."
cat > /var/lib/postgresql/14/main/recovery.signal << EOF
# Point-in-time recovery configuration
EOF

cat >> /var/lib/postgresql/14/main/postgresql.conf << EOF
# Recovery settings
restore_command = 'aws s3 cp s3://$S3_BUCKET/wal/%f %p'
recovery_target_time = '$RECOVERY_TARGET_TIME'
recovery_target_action = 'promote'
EOF

# Start PostgreSQL in recovery mode
log "Starting PostgreSQL in recovery mode..."
systemctl start postgresql

# Wait for recovery to complete
log "Waiting for recovery to complete..."
while ! sudo -u postgres psql -c "SELECT pg_is_in_recovery();" | grep -q "f"; do
    sleep 10
    log "Recovery in progress..."
done

log "PostgreSQL point-in-time recovery completed successfully"

# Verify database integrity
log "Verifying database integrity..."
sudo -u postgres psql -d zenith_platform -c "SELECT COUNT(*) FROM users;"

log "Database recovery verification completed"
```

**Redis Recovery:**
```bash
#!/bin/bash
# /scripts/recovery/redis-recovery.sh

set -e

BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 backup_file.rdb.gz"
    exit 1
fi

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] REDIS RECOVERY: $1"
}

log "Starting Redis recovery..."

# Stop Redis service
log "Stopping Redis service..."
systemctl stop redis

# Backup current dump file
log "Backing up current Redis dump..."
cp /var/lib/redis/dump.rdb /var/lib/redis/dump.rdb.backup.$(date +%Y%m%d_%H%M%S)

# Download and restore backup
log "Downloading backup file..."
aws s3 cp "s3://$S3_BUCKET/$BACKUP_FILE" /tmp/

log "Restoring Redis dump..."
gunzip /tmp/$(basename $BACKUP_FILE) -c > /var/lib/redis/dump.rdb
chown redis:redis /var/lib/redis/dump.rdb

# Start Redis service
log "Starting Redis service..."
systemctl start redis

# Verify Redis functionality
log "Verifying Redis functionality..."
redis-cli ping

log "Redis recovery completed successfully"
```

### 2. Application Recovery Procedures

**Full Application Recovery:**
```bash
#!/bin/bash
# /scripts/recovery/app-recovery.sh

set -e

BACKUP_DATE="$1"  # Format: YYYYMMDD

if [ -z "$BACKUP_DATE" ]; then
    echo "Usage: $0 YYYYMMDD"
    exit 1
fi

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] APP RECOVERY: $1"
}

log "Starting full application recovery for date: $BACKUP_DATE"

# Create recovery directory
RECOVERY_DIR="/tmp/zenith-recovery-$(date +%s)"
mkdir -p "$RECOVERY_DIR"

# Download configuration backup
log "Downloading configuration backup..."
aws s3 cp "s3://$S3_BUCKET/config/${BACKUP_DATE:0:4}/${BACKUP_DATE:4:2}/${BACKUP_DATE:6:2}/" "$RECOVERY_DIR/config/" --recursive

# Download latest git backup
log "Downloading git repository backup..."
aws s3 cp "s3://$S3_BUCKET/git/${BACKUP_DATE:0:4}/${BACKUP_DATE:4:2}/${BACKUP_DATE:6:2}/" "$RECOVERY_DIR/git/" --recursive

# Extract and deploy application
log "Extracting application code..."
cd "$RECOVERY_DIR/git"
tar -xzf *.tar.gz
cd zenith-platform-*.git

# Deploy to recovery location
log "Deploying application..."
APP_RECOVERY_DIR="/opt/zenith-recovery"
rm -rf "$APP_RECOVERY_DIR"
git clone --bare . "$APP_RECOVERY_DIR"

cd "$APP_RECOVERY_DIR"
git config --bool core.bare false
git reset --hard HEAD

# Install dependencies
log "Installing dependencies..."
npm ci --production

# Build application
log "Building application..."
npm run build

log "Application recovery completed. Ready for manual verification."
log "Recovery location: $APP_RECOVERY_DIR"
```

### 3. DNS and SSL Recovery

**DNS Failover Script:**
```bash
#!/bin/bash
# /scripts/recovery/dns-failover.sh

set -e

DOMAIN="your-domain.com"
BACKUP_IP="$1"

if [ -z "$BACKUP_IP" ]; then
    echo "Usage: $0 backup_ip_address"
    exit 1
fi

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] DNS FAILOVER: $1"
}

log "Starting DNS failover to backup IP: $BACKUP_IP"

# Update DNS records using Cloudflare API
ZONE_ID=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones?name=$DOMAIN" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json" | jq -r '.result[0].id')

# Get current A record
RECORD_ID=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records?type=A&name=$DOMAIN" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json" | jq -r '.result[0].id')

# Update A record to backup IP
curl -s -X PUT "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/$RECORD_ID" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json" \
    --data "{\"type\":\"A\",\"name\":\"$DOMAIN\",\"content\":\"$BACKUP_IP\",\"ttl\":300}"

log "DNS failover completed. Domain $DOMAIN now points to $BACKUP_IP"

# Send notification
curl -X POST "$SLACK_WEBHOOK_URL" \
    -H 'Content-type: application/json' \
    --data "{\"text\":\"🔄 DNS failover activated for $DOMAIN to $BACKUP_IP\"}"
```

## 📋 Disaster Recovery Testing

### Monthly DR Testing Schedule

```bash
#!/bin/bash
# /scripts/testing/dr-test.sh

set -e

TEST_TYPE="$1"  # full, database, application

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] DR TEST: $1"
}

case $TEST_TYPE in
    "database")
        log "Starting database recovery test..."
        
        # Test PostgreSQL backup restoration
        TEST_DB="zenith_platform_test_$(date +%s)"
        pg_restore -C -d postgres /path/to/latest/backup.sql.gz
        
        # Verify data integrity
        psql -d "$TEST_DB" -c "SELECT COUNT(*) FROM users;"
        
        # Cleanup test database
        dropdb "$TEST_DB"
        
        log "Database recovery test completed successfully"
        ;;
        
    "application")
        log "Starting application recovery test..."
        
        # Deploy to test environment
        /scripts/recovery/app-recovery.sh $(date +%Y%m%d)
        
        # Run health checks
        curl -f http://test-recovery.internal/api/health
        
        log "Application recovery test completed successfully"
        ;;
        
    "full")
        log "Starting full disaster recovery test..."
        
        # Test all components
        $0 database
        $0 application
        
        # Test DNS failover
        /scripts/recovery/dns-failover.sh 192.168.1.100
        
        log "Full disaster recovery test completed successfully"
        ;;
        
    *)
        echo "Usage: $0 {database|application|full}"
        exit 1
        ;;
esac
```

### DR Test Automation

```yaml
# .github/workflows/dr-testing.yml
name: Disaster Recovery Testing

on:
  schedule:
    - cron: '0 2 1 * *'  # Monthly on the 1st at 2 AM
  workflow_dispatch:

jobs:
  dr-test:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
    
    - name: Setup AWS CLI
      uses: aws-actions/configure-aws-credentials@v1
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-east-1
    
    - name: Test database backup restoration
      run: |
        # Download latest backup
        aws s3 cp s3://zenith-platform-backups/postgres/$(date +%Y/%m/%d)/ ./backups/ --recursive
        
        # Test restoration (dry run)
        pg_restore --list ./backups/*.sql.gz
    
    - name: Test application recovery
      run: |
        # Download configuration backup
        aws s3 cp s3://zenith-platform-backups/config/$(date +%Y/%m/%d)/ ./config/ --recursive
        
        # Verify configuration integrity
        tar -tzf ./config/*.tar.gz
    
    - name: Report results
      if: failure()
      uses: 8398a7/action-slack@v3
      with:
        status: failure
        text: 'Disaster recovery testing failed'
      env:
        SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

## 🔄 Business Continuity Plan

### Incident Response Team

| Role | Primary | Secondary | Contact |
|------|---------|-----------|---------|
| Incident Commander | John Doe | Jane Smith | +1-555-0101 |
| Technical Lead | Alice Johnson | Bob Wilson | +1-555-0102 |
| Database Admin | Charlie Brown | Diana Prince | +1-555-0103 |
| DevOps Engineer | Eve Adams | Frank Miller | +1-555-0104 |
| Communications | Grace Lee | Henry Ford | +1-555-0105 |

### Recovery Procedures by Scenario

#### Scenario 1: Database Corruption
```
Priority: P1 (Critical)
RTO: 30 minutes
RPO: 15 minutes

Steps:
1. Isolate corrupted database
2. Activate standby database
3. Update application connection strings
4. Verify application functionality
5. Investigate corruption cause
```

#### Scenario 2: Complete Data Center Failure
```
Priority: P1 (Critical)
RTO: 2 hours
RPO: 15 minutes

Steps:
1. Activate disaster recovery site
2. Restore from latest backups
3. Update DNS to point to DR site
4. Verify all services operational
5. Communicate with customers
```

#### Scenario 3: Application Deployment Failure
```
Priority: P2 (High)
RTO: 1 hour
RPO: 0 minutes

Steps:
1. Rollback to previous deployment
2. Verify rollback successful
3. Investigate deployment failure
4. Fix issues and redeploy
5. Monitor application stability
```

### Communication Templates

**Internal Incident Notification:**
```
Subject: [P1] Production Incident - Database Outage

Team,

We are experiencing a production incident affecting our primary database.

Incident Details:
- Start Time: 2024-01-01 10:30 UTC
- Impact: Complete service unavailability
- Estimated Resolution: 60 minutes
- Incident Commander: John Doe

Actions Taken:
- Activated incident response team
- Isolated affected systems
- Initiated database recovery procedures

Next Update: 15 minutes

War Room: https://zoom.us/incident-room
Status Page: https://status.zenith-platform.com
```

**Customer Communication:**
```
Subject: Service Disruption - Zenith Platform

Dear Valued Customers,

We are currently experiencing technical difficulties that may affect your ability to access the Zenith Platform.

Our engineering team is actively working to resolve this issue. We expect to have services fully restored within the next hour.

We apologize for any inconvenience and will provide updates as they become available.

For the latest updates, please visit: https://status.zenith-platform.com

Thank you for your patience.

The Zenith Platform Team
```

## 📊 Backup and Recovery Metrics

### Key Performance Indicators

```typescript
// lib/monitoring/backup-metrics.ts
export interface BackupMetrics {
  backupSuccessRate: number;      // % of successful backups
  backupDuration: number;         // Average backup time (minutes)
  backupSize: number;             // Average backup size (GB)
  recoveryTestSuccessRate: number; // % of successful recovery tests
  rto: number;                    // Actual recovery time (minutes)
  rpo: number;                    // Actual data loss (minutes)
}

export class BackupMonitoring {
  async getBackupMetrics(days: number = 30): Promise<BackupMetrics> {
    const metrics = await this.aggregateBackupData(days);
    
    return {
      backupSuccessRate: metrics.successfulBackups / metrics.totalBackups * 100,
      backupDuration: metrics.totalDuration / metrics.totalBackups,
      backupSize: metrics.totalSize / metrics.totalBackups,
      recoveryTestSuccessRate: metrics.successfulTests / metrics.totalTests * 100,
      rto: metrics.averageRecoveryTime,
      rpo: metrics.averageDataLoss
    };
  }

  async trackBackupEvent(
    type: 'database' | 'redis' | 'config' | 'application',
    status: 'success' | 'failure',
    duration: number,
    size?: number
  ) {
    const event = {
      type,
      status,
      duration,
      size,
      timestamp: Date.now()
    };

    await redis.lpush('backup:events', JSON.stringify(event));
    await redis.ltrim('backup:events', 0, 10000); // Keep last 10k events
  }

  private async aggregateBackupData(days: number) {
    // Implementation for aggregating backup metrics
    return {
      successfulBackups: 0,
      totalBackups: 0,
      totalDuration: 0,
      totalSize: 0,
      successfulTests: 0,
      totalTests: 0,
      averageRecoveryTime: 0,
      averageDataLoss: 0
    };
  }
}
```

## 📋 Disaster Recovery Checklist

### Pre-Incident Preparation
- [ ] All backup scripts are tested and automated
- [ ] Recovery procedures are documented and tested
- [ ] Incident response team contacts are updated
- [ ] DR site is provisioned and ready
- [ ] Monitoring and alerting systems are configured
- [ ] Communication templates are prepared
- [ ] Customer notification systems are ready

### During Incident Response
- [ ] Incident commander has been notified
- [ ] Incident response team has been assembled
- [ ] Initial assessment has been completed
- [ ] Recovery procedures have been initiated
- [ ] Internal teams have been notified
- [ ] Customer communication has been sent
- [ ] Progress updates are being provided

### Post-Incident Activities
- [ ] Services have been fully restored
- [ ] Data integrity has been verified
- [ ] Performance monitoring confirms normal operation
- [ ] Customer satisfaction has been confirmed
- [ ] Post-incident review has been scheduled
- [ ] Documentation has been updated
- [ ] Lessons learned have been documented

## 📞 Emergency Contacts

### 24/7 Emergency Response
- **Primary On-Call**: +1-555-0101
- **Secondary On-Call**: +1-555-0102
- **Database Emergency**: +1-555-0103
- **Infrastructure Emergency**: +1-555-0104

### External Services
- **AWS Support**: 1-800-AWS-1234
- **Cloudflare Support**: 1-888-993-5273
- **Vercel Support**: support@vercel.com
- **Railway Support**: team@railway.app

---

**Last Updated**: 2025-06-25  
**Version**: 1.0  
**Reviewed By**: Infrastructure Team, Security Team, Business Continuity Team