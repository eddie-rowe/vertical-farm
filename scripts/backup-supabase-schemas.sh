#!/bin/bash

# Comprehensive Schema Backup Script for Supabase
# This script creates a complete backup of the database schema including:
# - All tables, views, functions, triggers
# - RLS policies, indexes, constraints
# - Custom types and enums
# - Extensions and their configurations

set -e

# Configuration
PROJECT_ROOT="/Users/eddie.rowe/Repos/vertical-farm"
BACKUP_DIR="$PROJECT_ROOT/supabase/schemas"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/schema_backup_$TIMESTAMP.sql"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Comprehensive Schema Backup${NC}"
echo "Project: $PROJECT_ROOT"
echo "Backup Directory: $BACKUP_DIR"
echo "Timestamp: $TIMESTAMP"

# Create backup directory if it doesn't exist
#mkdir -p "$BACKUP_DIR"

# Change to project directory
cd "$PROJECT_ROOT"

# Check if project is linked
#echo -e "${YELLOW}🔗 Checking Supabase project status...${NC}"
#if ! supabase status > /dev/null 2>&1; then
#    echo -e "${RED}❌ Project not linked to Supabase${NC}"
#    echo "Please run 'supabase link --project-ref YOUR_PROJECT_ID' first"
#    exit 1
#fi

#echo -e "${GREEN}✅ Project is linked${NC}"

# Create comprehensive schema backup
echo -e "${YELLOW}📦 Creating comprehensive schema backup...${NC}"
supabase db dump -f "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Schema backup created successfully${NC}"
    echo "File: $BACKUP_FILE"
    
    # Display file size
    FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "Size: $FILE_SIZE"
    
    # Create metadata file
    METADATA_FILE="$BACKUP_DIR/schema_backup_${TIMESTAMP}_metadata.json"
    cat > "$METADATA_FILE" << EOF
{
  "backup_name": "schema_backup_$TIMESTAMP",
  "timestamp": "$TIMESTAMP",
  "date": "$(date -Iseconds)",
  "type": "comprehensive_schema_backup",
  "file": "schema_backup_$TIMESTAMP.sql",
  "size": "$FILE_SIZE",
  "project_root": "$PROJECT_ROOT",
  "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "git_branch": "$(git branch --show-current 2>/dev/null || echo 'unknown')"
}
EOF
    
    echo -e "${GREEN}✅ Metadata file created: $METADATA_FILE${NC}"
    
    # List recent backups
    echo -e "${BLUE}📋 Recent schema backups:${NC}"
    ls -lah "$BACKUP_DIR"/schema_backup_*.sql | tail -5
    
else
    echo -e "${RED}❌ Schema backup failed${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 Comprehensive schema backup completed successfully!${NC}" 