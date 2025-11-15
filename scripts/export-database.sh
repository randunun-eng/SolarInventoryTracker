#!/bin/bash
# ElectroTrack Database Export Script
# This script exports your PostgreSQL database to a SQL file

# Get database connection details from environment
DB_URL="${DATABASE_URL}"

# Create backups directory if it doesn't exist
mkdir -p backups

# Generate filename with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="backups/electrotrack_backup_${TIMESTAMP}.sql"

# Export database using pg_dump
echo "Exporting database to ${BACKUP_FILE}..."

# Extract connection details from DATABASE_URL
# Format: postgres://user:password@host:port/database
pg_dump "${DB_URL}" > "${BACKUP_FILE}"

if [ $? -eq 0 ]; then
    echo "✅ Database exported successfully to ${BACKUP_FILE}"
    echo "📁 File size: $(du -h ${BACKUP_FILE} | cut -f1)"
else
    echo "❌ Database export failed"
    exit 1
fi

echo ""
echo "To restore this backup later, use:"
echo "psql \$DATABASE_URL < ${BACKUP_FILE}"
