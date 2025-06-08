#!/bin/bash

# Automated Backup Script for DeployIO Production
# Handles database backups, configuration backups, and log archival

set -e

# Configuration
BACKUP_DIR="/opt/deployio/backups"
LOG_FILE="/var/log/deployio/backup.log"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30
APP_DIR="/opt/deployio"

# AWS S3 Configuration (optional)
S3_BUCKET="${S3_BACKUP_BUCKET:-}"
AWS_REGION="${AWS_REGION:-us-east-1}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a $LOG_FILE
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a $LOG_FILE
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a $LOG_FILE
}

# Create backup directories
setup_backup_dirs() {
    log "Setting up backup directories..."

    mkdir -p $BACKUP_DIR/{database,configs,logs,full}
    chown -R deployio:deployio $BACKUP_DIR

    success "Backup directories created"
}

# Backup MongoDB database
backup_database() {
    log "Starting database backup..."

    local db_backup_dir="$BACKUP_DIR/database"
    local backup_file="$db_backup_dir/mongodb_backup_$DATE.archive"

    cd $APP_DIR

    # Check if MongoDB container is running
    if ! docker-compose ps | grep -q mongodb; then
        error "MongoDB container is not running"
    fi

    # Create database backup
    docker-compose exec -T mongodb mongodump \
        --uri="mongodb://localhost:27017/deployio_prod" \
        --archive >$backup_file

    if [ $? -eq 0 ]; then
        # Compress backup
        gzip $backup_file
        backup_file="${backup_file}.gz"

        # Verify backup integrity
        if [ -f "$backup_file" ] && [ -s "$backup_file" ]; then
            local backup_size=$(du -h $backup_file | cut -f1)
            success "Database backup completed: $backup_file ($backup_size)"
        else
            error "Database backup verification failed"
        fi
    else
        error "Database backup failed"
    fi

    echo $backup_file
}

# Backup configuration files
backup_configs() {
    log "Starting configuration backup..."

    local config_backup_dir="$BACKUP_DIR/configs"
    local backup_file="$config_backup_dir/configs_backup_$DATE.tar.gz"

    cd $APP_DIR

    # Create configuration backup
    tar -czf $backup_file \
        .env.production \
        client/.env.production \
        fastapi_service/.env.production \
        docker-compose*.yml \
        scripts/ \
        2>/dev/null || warning "Some configuration files may be missing"

    if [ -f "$backup_file" ]; then
        local backup_size=$(du -h $backup_file | cut -f1)
        success "Configuration backup completed: $backup_file ($backup_size)"
    else
        error "Configuration backup failed"
    fi

    echo $backup_file
}

# Backup application logs
backup_logs() {
    log "Starting log backup..."

    local log_backup_dir="$BACKUP_DIR/logs"
    local backup_file="$log_backup_dir/logs_backup_$DATE.tar.gz"

    # Create log backup
    tar -czf $backup_file \
        /var/log/deployio/ \
        $APP_DIR/logs/ \
        2>/dev/null || warning "Some log files may be missing"

    if [ -f "$backup_file" ]; then
        local backup_size=$(du -h $backup_file | cut -f1)
        success "Log backup completed: $backup_file ($backup_size)"

        # Rotate logs after backup
        rotate_logs
    else
        error "Log backup failed"
    fi

    echo $backup_file
}

# Rotate application logs
rotate_logs() {
    log "Rotating application logs..."

    # Truncate large log files
    find /var/log/deployio/ -name "*.log" -size +100M -exec truncate -s 50M {} \;
    find $APP_DIR/logs/ -name "*.log" -size +100M -exec truncate -s 50M {} \; 2>/dev/null || true

    success "Log rotation completed"
}

# Create full system backup
backup_full_system() {
    log "Creating full system backup..."

    local full_backup_dir="$BACKUP_DIR/full"
    local backup_file="$full_backup_dir/full_backup_$DATE.tar.gz"

    cd $APP_DIR

    # Create full application backup (excluding node_modules and large files)
    tar -czf $backup_file \
        --exclude='node_modules' \
        --exclude='client/node_modules' \
        --exclude='client/dist' \
        --exclude='__pycache__' \
        --exclude='*.pyc' \
        --exclude='.git' \
        --exclude='logs' \
        . 2>/dev/null || warning "Some files excluded from full backup"

    if [ -f "$backup_file" ]; then
        local backup_size=$(du -h $backup_file | cut -f1)
        success "Full system backup completed: $backup_file ($backup_size)"
    else
        error "Full system backup failed"
    fi

    echo $backup_file
}

# Upload backups to AWS S3 (if configured)
upload_to_s3() {
    if [ -z "$S3_BUCKET" ]; then
        log "S3 backup not configured, skipping..."
        return
    fi

    log "Uploading backups to S3..."

    if ! command -v aws &>/dev/null; then
        warning "AWS CLI not installed, skipping S3 upload"
        return
    fi

    # Upload database backup
    local db_backup=$(find $BACKUP_DIR/database -name "*$DATE*" -type f | head -1)
    if [ -n "$db_backup" ]; then
        aws s3 cp $db_backup s3://$S3_BUCKET/database/ --region $AWS_REGION
        log "Database backup uploaded to S3"
    fi

    # Upload configuration backup
    local config_backup=$(find $BACKUP_DIR/configs -name "*$DATE*" -type f | head -1)
    if [ -n "$config_backup" ]; then
        aws s3 cp $config_backup s3://$S3_BUCKET/configs/ --region $AWS_REGION
        log "Configuration backup uploaded to S3"
    fi

    success "S3 upload completed"
}

# Cleanup old backups
cleanup_old_backups() {
    log "Cleaning up old backups..."

    # Remove local backups older than retention period
    find $BACKUP_DIR -type f -mtime +$RETENTION_DAYS -delete

    # Clean up empty directories
    find $BACKUP_DIR -type d -empty -delete

    # S3 cleanup (if configured)
    if [ -n "$S3_BUCKET" ] && command -v aws &>/dev/null; then
        local cutoff_date=$(date -d "$RETENTION_DAYS days ago" +%Y-%m-%d)
        aws s3 ls s3://$S3_BUCKET/ --recursive |
            awk '$1 < "'$cutoff_date'" {print $4}' |
            xargs -I {} aws s3 rm s3://$S3_BUCKET/{} 2>/dev/null || true
    fi

    success "Old backup cleanup completed"
}

# Verify backup integrity
verify_backups() {
    log "Verifying backup integrity..."

    local verification_failed=false

    # Verify database backup
    local db_backup=$(find $BACKUP_DIR/database -name "*$DATE*" -type f | head -1)
    if [ -n "$db_backup" ]; then
        if file $db_backup | grep -q "gzip"; then
            log "Database backup integrity: OK"
        else
            warning "Database backup integrity: FAILED"
            verification_failed=true
        fi
    fi

    # Verify config backup
    local config_backup=$(find $BACKUP_DIR/configs -name "*$DATE*" -type f | head -1)
    if [ -n "$config_backup" ]; then
        if tar -tzf $config_backup >/dev/null 2>&1; then
            log "Configuration backup integrity: OK"
        else
            warning "Configuration backup integrity: FAILED"
            verification_failed=true
        fi
    fi

    if [ "$verification_failed" = true ]; then
        error "Backup verification failed"
    else
        success "All backup verifications passed"
    fi
}

# Generate backup report
generate_report() {
    log "Generating backup report..."

    local report_file="$BACKUP_DIR/backup_report_$DATE.txt"

    cat >$report_file <<EOF
DeployIO Backup Report
Generated: $(date)
====================

Backup Summary:
- Database Backup: $(find $BACKUP_DIR/database -name "*$DATE*" -type f | head -1 | xargs ls -lh 2>/dev/null | awk '{print $5, $9}' || echo "Not found")
- Configuration Backup: $(find $BACKUP_DIR/configs -name "*$DATE*" -type f | head -1 | xargs ls -lh 2>/dev/null | awk '{print $5, $9}' || echo "Not found")
- Log Backup: $(find $BACKUP_DIR/logs -name "*$DATE*" -type f | head -1 | xargs ls -lh 2>/dev/null | awk '{print $5, $9}' || echo "Not found")
- Full Backup: $(find $BACKUP_DIR/full -name "*$DATE*" -type f | head -1 | xargs ls -lh 2>/dev/null | awk '{print $5, $9}' || echo "Not found")

Storage Usage:
$(du -sh $BACKUP_DIR/*)

Total Backup Size: $(du -sh $BACKUP_DIR | cut -f1)

System Information:
- Hostname: $(hostname)
- Disk Usage: $(df -h $BACKUP_DIR | tail -1)
- Uptime: $(uptime)

Application Status:
$(cd $APP_DIR && docker-compose ps)
EOF

    success "Backup report generated: $report_file"
}

# Send backup notification
send_notification() {
    local status=$1
    local message="DeployIO Backup $status on $(date)"

    # Log backup result
    echo "$message" >>/var/log/deployio/backup_history.log

    # Send Slack notification if webhook is configured
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$message\"}" \
            $SLACK_WEBHOOK_URL 2>/dev/null || log "Failed to send Slack notification"
    fi

    log "Backup notification sent"
}

# Main backup function
main() {
    log "Starting DeployIO backup process..."

    setup_backup_dirs

    # Perform backups
    backup_database
    backup_configs
    backup_logs
    backup_full_system

    # Upload to cloud (if configured)
    upload_to_s3

    # Verify and cleanup
    verify_backups
    cleanup_old_backups

    # Generate report
    generate_report

    success "🎉 DeployIO backup completed successfully!"
    send_notification "SUCCESSFUL"

    log "Backup summary:"
    log "- Backup location: $BACKUP_DIR"
    log "- Backup date: $DATE"
    log "- Total size: $(du -sh $BACKUP_DIR | cut -f1)"
}

# Trap errors
trap 'error "Backup failed at line $LINENO"; send_notification "FAILED"; exit 1' ERR

# Run main function
main "$@"
