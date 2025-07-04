#!/bin/bash

# Railway Staging Database Backup Script
# This script creates backups of the staging database for disaster recovery

set -e

echo "💾 Starting Railway staging database backup..."

# Configuration
BACKUP_DIR="/tmp/railway-backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="zenith_staging_backup_${TIMESTAMP}.sql"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

# Check if required environment variables are set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    exit 1
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "🗄️ Creating database backup..."
echo "Backup file: $BACKUP_PATH"

# Extract database connection details from DATABASE_URL
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

# Set PostgreSQL password
export PGPASSWORD="$DB_PASS"

# Create backup using pg_dump
echo "📦 Dumping database schema and data..."
pg_dump \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --username="$DB_USER" \
  --dbname="$DB_NAME" \
  --no-password \
  --verbose \
  --clean \
  --if-exists \
  --create \
  --format=plain \
  --file="$BACKUP_PATH"

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "✅ Database backup created successfully"
    
    # Get backup file size
    BACKUP_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
    echo "📊 Backup size: $BACKUP_SIZE"
    
    # Compress backup
    echo "🗜️ Compressing backup..."
    gzip "$BACKUP_PATH"
    COMPRESSED_PATH="${BACKUP_PATH}.gz"
    COMPRESSED_SIZE=$(du -h "$COMPRESSED_PATH" | cut -f1)
    echo "✅ Compressed backup size: $COMPRESSED_SIZE"
    
    # Upload to cloud storage (if configured)
    if [ ! -z "$GOOGLE_CLOUD_STORAGE_BUCKET" ]; then
        echo "☁️ Uploading backup to Google Cloud Storage..."
        gsutil cp "$COMPRESSED_PATH" "gs://$GOOGLE_CLOUD_STORAGE_BUCKET/backups/staging/"
        if [ $? -eq 0 ]; then
            echo "✅ Backup uploaded to cloud storage"
        else
            echo "⚠️ Failed to upload backup to cloud storage"
        fi
    fi
    
    # Log backup to database
    echo "📝 Logging backup to database..."
    node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    async function logBackup() {
      try {
        await prisma.auditLog.create({
          data: {
            action: 'database_backup',
            entityType: 'database',
            metadata: {
              environment: 'staging',
              backup_file: '$BACKUP_FILE',
              backup_size: '$BACKUP_SIZE',
              compressed_size: '$COMPRESSED_SIZE',
              backup_time: new Date().toISOString(),
              cloud_uploaded: process.env.GOOGLE_CLOUD_STORAGE_BUCKET ? true : false,
            },
          },
        });
        console.log('✅ Backup logged to database');
      } catch (error) {
        console.error('❌ Failed to log backup:', error);
      } finally {
        await prisma.\$disconnect();
      }
    }
    
    logBackup();
    "
    
    # Clean up old backups (keep last 7 days)
    echo "🧹 Cleaning up old backups..."
    find "$BACKUP_DIR" -name "zenith_staging_backup_*.sql.gz" -mtime +7 -delete
    
    echo ""
    echo "🎉 Database backup completed successfully!"
    echo ""
    echo "📊 Backup Summary:"
    echo "- File: $COMPRESSED_PATH"
    echo "- Size: $COMPRESSED_SIZE"
    echo "- Timestamp: $TIMESTAMP"
    echo "- Cloud Storage: ${GOOGLE_CLOUD_STORAGE_BUCKET:-'Not configured'}"
    echo ""
    echo "🔄 To restore this backup:"
    echo "gunzip $COMPRESSED_PATH"
    echo "psql \$DATABASE_URL < $BACKUP_PATH"
    
else
    echo "❌ Database backup failed"
    exit 1
fi

# Unset password
unset PGPASSWORD