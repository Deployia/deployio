#!/bin/bash

# Production Deployment Script for DeployIO
# This script handles secure production deployment with zero downtime

set -e

# Configuration
DEPLOY_USER="deployio"
APP_DIR="/opt/deployio"
BACKUP_DIR="/opt/deployio/backups"
LOG_FILE="/var/log/deployio/deployment.log"
DATE=$(date +%Y%m%d_%H%M%S)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if running as correct user
check_user() {
    if [ "$USER" != "$DEPLOY_USER" ]; then
        error "This script must be run as $DEPLOY_USER user"
    fi
}

# Create necessary directories
setup_directories() {
    log "Setting up directories..."
    sudo mkdir -p $BACKUP_DIR /var/log/deployio
    sudo chown -R $DEPLOY_USER:$DEPLOY_USER $BACKUP_DIR /var/log/deployio
}

# Pre-deployment checks
pre_deployment_checks() {
    log "Running pre-deployment checks..."

    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        error "Docker is not running"
    fi

    # Check if Docker Compose is available
    if ! command -v docker-compose &>/dev/null; then
        error "Docker Compose is not installed"
    fi

    # Check disk space (minimum 2GB free)
    available_space=$(df $APP_DIR | tail -1 | awk '{print $4}')
    if [ $available_space -lt 2097152 ]; then
        error "Insufficient disk space. At least 2GB required."
    fi

    # Check if environment files exist
    if [ ! -f "$APP_DIR/.env.production" ]; then
        error "Production environment file not found: $APP_DIR/.env.production"
    fi

    success "Pre-deployment checks passed"
}

# Backup current deployment
backup_current_deployment() {
    log "Creating backup of current deployment..."

    # Create backup directory
    backup_path="$BACKUP_DIR/deployment_backup_$DATE"
    mkdir -p $backup_path

    # Backup Docker Compose state
    cd $APP_DIR
    docker-compose ps >$backup_path/containers_state.txt
    docker-compose logs --tail=100 >$backup_path/containers_logs.txt

    # Backup database
    if docker-compose ps | grep -q mongodb; then
        log "Backing up MongoDB database..."
        docker-compose exec -T mongodb mongodump --uri="mongodb://localhost:27017/deployio_prod" --archive >$backup_path/mongodb_backup.archive
    fi

    # Backup configuration files
    cp -r $APP_DIR/.env* $backup_path/ 2>/dev/null || true
    cp $APP_DIR/docker-compose*.yml $backup_path/

    success "Backup created at $backup_path"
}

# Pull latest code
update_code() {
    log "Updating application code..."

    cd $APP_DIR

    # Stash any local changes
    git stash push -m "Auto-stash before deployment $DATE"

    # Fetch and pull latest changes
    git fetch origin
    git checkout main
    git pull origin main

    # Verify we have the latest commit
    current_commit=$(git rev-parse HEAD)
    log "Deployed commit: $current_commit"

    success "Code updated successfully"
}

# Build Docker images
build_images() {
    log "Building Docker images..."

    cd $APP_DIR

    # Use regular docker-compose file (your working setup)
    # No need to export COMPOSE_FILE, use default docker-compose.yml

    # Build with no cache for production
    docker-compose build --no-cache --parallel

    # Verify images were built
    if ! docker images | grep -q "deployio"; then
        error "Failed to build Docker images"
    fi

    success "Docker images built successfully"
}

# Run security scans
security_scan() {
    log "Running security scans..."

    # Scan built images with Trivy (if available)
    if command -v trivy &>/dev/null; then
        log "Scanning images for vulnerabilities..."
        trivy image --severity HIGH,CRITICAL deployio_backend:latest || warning "Backend image has vulnerabilities"
        trivy image --severity HIGH,CRITICAL deployio_fastapi:latest || warning "FastAPI image has vulnerabilities"
        trivy image --severity HIGH,CRITICAL deployio_frontend:latest || warning "Frontend image has vulnerabilities"
    else
        warning "Trivy not installed, skipping vulnerability scan"
    fi
}

# Deploy with zero downtime
deploy_zero_downtime() {
    log "Starting zero-downtime deployment..."

    cd $APP_DIR

    # Use regular docker-compose file (your working setup)
    # No need to export COMPOSE_FILE, use default docker-compose.yml

    # Scale up services (blue-green deployment)
    log "Scaling up new instances..."
    docker-compose up -d --scale backend=2 --scale fastapi=2 --scale frontend=2

    # Wait for services to be ready
    log "Waiting for services to be ready..."
    sleep 60

    # Health checks
    if health_check; then
        log "Health checks passed, completing deployment..."
        # Scale down to single instances
        docker-compose up -d --scale backend=1 --scale fastapi=1 --scale frontend=1
        # Remove old containers
        docker container prune -f
    else
        error "Health checks failed, rolling back..."
        rollback_deployment
    fi
}

# Health check function
health_check() {
    log "Running health checks..."

    # Check backend health
    if ! curl -f -s http://localhost:3000/api/v1/health >/dev/null; then
        error "Backend health check failed"
        return 1
    fi

    # Check FastAPI health
    if ! curl -f -s http://localhost:8000/health >/dev/null; then
        error "FastAPI health check failed"
        return 1
    fi

    # Check frontend (basic connectivity)
    if ! curl -f -s http://localhost:5173 >/dev/null; then
        error "Frontend health check failed"
        return 1
    fi

    # Check database connectivity
    if ! docker-compose exec -T backend node -e "require('./config/database.js')" >/dev/null 2>&1; then
        error "Database connectivity check failed"
        return 1
    fi

    success "All health checks passed"
    return 0
}

# Rollback function
rollback_deployment() {
    log "Rolling back deployment..."

    cd $APP_DIR

    # Stop current containers
    docker-compose down

    # Get latest backup
    latest_backup=$(ls -t $BACKUP_DIR/deployment_backup_* | head -1)

    if [ -n "$latest_backup" ]; then
        log "Restoring from backup: $latest_backup"

        # Restore configuration files
        cp $latest_backup/.env* $APP_DIR/

        # Restore database if backup exists
        if [ -f "$latest_backup/mongodb_backup.archive" ]; then
            log "Restoring database..."
            docker-compose up -d mongodb
            sleep 30
            docker-compose exec -T mongodb mongorestore --uri="mongodb://localhost:27017/deployio_prod" --archive <$latest_backup/mongodb_backup.archive
        fi

        # Start services
        docker-compose up -d

        success "Rollback completed"
    else
        error "No backup found for rollback"
    fi
}

# Post-deployment tasks
post_deployment() {
    log "Running post-deployment tasks..."

    # Database migrations (if any)
    cd $APP_DIR
    docker-compose exec -T backend npm run migrate 2>/dev/null || log "No migrations to run"

    # Clear application caches
    docker-compose exec -T backend npm run cache:clear 2>/dev/null || log "No cache clearing needed"

    # Cleanup old Docker images
    docker image prune -f

    # Update SSL certificates if needed
    if command -v certbot &>/dev/null; then
        sudo certbot renew --quiet || warning "SSL certificate renewal failed"
    fi

    success "Post-deployment tasks completed"
}

# Monitoring and alerting
setup_monitoring() {
    log "Setting up monitoring..."

    # Create monitoring script
    cat >/tmp/health_monitor.sh <<'EOF'
#!/bin/bash
BACKEND_URL="http://localhost:3000/api/v1/health"
FASTAPI_URL="http://localhost:8000/health"
FRONTEND_URL="http://localhost:5173"
LOG_FILE="/var/log/deployio/health.log"

check_service() {
    local url=$1
    local service=$2
    
    if curl -f -s $url > /dev/null; then
        echo "$(date): $service health OK" >> $LOG_FILE
    else
        echo "$(date): $service health FAILED" >> $LOG_FILE
        # Restart service if needed
        cd /opt/deployio && docker-compose restart $service
    fi
}

check_service $BACKEND_URL backend
check_service $FASTAPI_URL fastapi
check_service $FRONTEND_URL frontend
EOF

    sudo mv /tmp/health_monitor.sh /opt/deployio/scripts/health_monitor.sh
    sudo chmod +x /opt/deployio/scripts/health_monitor.sh
    sudo chown $DEPLOY_USER:$DEPLOY_USER /opt/deployio/scripts/health_monitor.sh

    # Add to crontab if not already present
    if ! crontab -l | grep -q "health_monitor.sh"; then
        (
            crontab -l 2>/dev/null
            echo "*/5 * * * * /opt/deployio/scripts/health_monitor.sh"
        ) | crontab -
        log "Health monitoring cron job added"
    fi
}

# Send deployment notification
send_notification() {
    local status=$1
    local message="DeployIO Deployment $status on $(date)"

    # Log deployment result
    echo "$message" >>/var/log/deployio/deployment_history.log

    # Send Slack notification if webhook is configured
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$message\"}" \
            $SLACK_WEBHOOK_URL 2>/dev/null || log "Failed to send Slack notification"
    fi

    log "Deployment notification sent"
}

# Main deployment function
main() {
    log "Starting DeployIO production deployment..."

    check_user
    setup_directories
    pre_deployment_checks
    backup_current_deployment
    update_code
    build_images
    security_scan
    deploy_zero_downtime
    post_deployment
    setup_monitoring

    success "🎉 DeployIO deployment completed successfully!"
    send_notification "SUCCESSFUL"

    log "Deployment summary:"
    log "- Application URL: https://deployio.tech"
    log "- Deployment time: $(date)"
    log "- Git commit: $(git rev-parse HEAD)"
    log "- Backup location: $BACKUP_DIR/deployment_backup_$DATE"
}

# Trap errors and perform cleanup
trap 'error "Deployment failed at line $LINENO"; send_notification "FAILED"; exit 1' ERR

# Run main function
main "$@"
