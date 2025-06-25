#!/bin/bash

# Railway Staging Database Restore Script
# This script restores the staging database from a backup file

set -e

# Check if backup file is provided
if [ -z "$1" ]; then
    echo "❌ ERROR: Backup file path is required"
    echo ""
    echo "Usage: $0 <backup_file_path>"
    echo ""
    echo "Available backups:"
    ls -la /tmp/railway-backups/zenith_staging_backup_*.sql* 2>/dev/null || echo "No backups found in /tmp/railway-backups/"
    exit 1
fi

BACKUP_FILE="$1"

echo "🔄 Starting Railway staging database restore..."
echo "Backup file: $BACKUP_FILE"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ ERROR: Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Check if required environment variables are set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    exit 1
fi

# Confirm restore operation
echo ""
echo "⚠️  WARNING: This operation will completely replace the current staging database!"
echo "Database URL: $DATABASE_URL"
echo "Backup file: $BACKUP_FILE"
echo ""
read -p "Are you sure you want to continue? (type 'yes' to confirm): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Restore operation cancelled"
    exit 1
fi

# Extract database connection details from DATABASE_URL
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

# Set PostgreSQL password
export PGPASSWORD="$DB_PASS"

# Check if backup file is compressed
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "🗜️ Decompressing backup file..."
    DECOMPRESSED_FILE="${BACKUP_FILE%.gz}"
    gunzip -c "$BACKUP_FILE" > "$DECOMPRESSED_FILE"
    RESTORE_FILE="$DECOMPRESSED_FILE"
    echo "✅ Backup decompressed to: $RESTORE_FILE"
else
    RESTORE_FILE="$BACKUP_FILE"
fi

# Create pre-restore backup of current data
echo "💾 Creating pre-restore backup of current data..."
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
CURRENT_BACKUP="/tmp/railway-backups/pre_restore_backup_${TIMESTAMP}.sql"
mkdir -p /tmp/railway-backups

pg_dump \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --username="$DB_USER" \
  --dbname="$DB_NAME" \
  --no-password \
  --clean \
  --if-exists \
  --create \
  --format=plain \
  --file="$CURRENT_BACKUP"

if [ $? -eq 0 ]; then
    gzip "$CURRENT_BACKUP"
    echo "✅ Pre-restore backup created: ${CURRENT_BACKUP}.gz"
else
    echo "⚠️ Failed to create pre-restore backup, but continuing..."
fi

# Restore database
echo "🔄 Restoring database from backup..."
echo "This may take several minutes..."

# Drop all connections to the database
echo "🔌 Terminating active connections..."
psql \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --username="$DB_USER" \
  --dbname="postgres" \
  --no-password \
  --command="SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();" \
  || echo "⚠️ Could not terminate connections, but continuing..."

# Restore the database
echo "📥 Importing backup data..."
psql \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --username="$DB_USER" \
  --dbname="$DB_NAME" \
  --no-password \
  --file="$RESTORE_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Database restored successfully"
    
    # Clean up decompressed file if it was created
    if [[ "$BACKUP_FILE" == *.gz ]] && [ -f "$RESTORE_FILE" ]; then
        rm "$RESTORE_FILE"
        echo "🧹 Cleaned up temporary decompressed file"
    fi
    
    # Verify restore
    echo "🔍 Verifying database restore..."
    
    # Count records in main tables
    USER_COUNT=$(psql --host="$DB_HOST" --port="$DB_PORT" --username="$DB_USER" --dbname="$DB_NAME" --no-password --tuples-only --command="SELECT COUNT(*) FROM \"User\";" | xargs)
    PROJECT_COUNT=$(psql --host="$DB_HOST" --port="$DB_PORT" --username="$DB_USER" --dbname="$DB_NAME" --no-password --tuples-only --command="SELECT COUNT(*) FROM \"Project\";" | xargs)
    TEAM_COUNT=$(psql --host="$DB_HOST" --port="$DB_PORT" --username="$DB_USER" --dbname="$DB_NAME" --no-password --tuples-only --command="SELECT COUNT(*) FROM \"Team\";" | xargs)
    
    echo "📊 Restored Data Summary:"
    echo "- Users: $USER_COUNT"
    echo "- Projects: $PROJECT_COUNT"
    echo "- Teams: $TEAM_COUNT"
    
    # Log restore to database
    echo "📝 Logging restore operation..."
    node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    async function logRestore() {
      try {
        await prisma.auditLog.create({
          data: {
            action: 'database_restore',
            entityType: 'database',
            metadata: {
              environment: 'staging',
              backup_file: '$BACKUP_FILE',
              restore_time: new Date().toISOString(),
              users_count: $USER_COUNT,
              projects_count: $PROJECT_COUNT,
              teams_count: $TEAM_COUNT,
              pre_restore_backup: '${CURRENT_BACKUP}.gz',
            },
          },
        });
        console.log('✅ Restore operation logged');
      } catch (error) {
        console.error('❌ Failed to log restore:', error);
      } finally {
        await prisma.\$disconnect();
      }
    }
    
    logRestore();
    "
    
    echo ""
    echo "🎉 Database restore completed successfully!"
    echo ""
    echo "📊 Restore Summary:"
    echo "- Source backup: $BACKUP_FILE"
    echo "- Users restored: $USER_COUNT"
    echo "- Projects restored: $PROJECT_COUNT"
    echo "- Teams restored: $TEAM_COUNT"
    echo "- Pre-restore backup: ${CURRENT_BACKUP}.gz"
    echo ""
    echo "🚀 Staging database is ready for use!"
    
else
    echo "❌ Database restore failed"
    echo ""
    echo "🔄 To rollback to previous state:"
    echo "bash $0 ${CURRENT_BACKUP}.gz"
    exit 1
fi

# Unset password
unset PGPASSWORD