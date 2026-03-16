#!/bin/bash

###############################################################################
# Thai Accounting ERP - Production Deployment Script
# Purpose: Build, configure, and deploy the application for production use
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="Thai-Accounting-ERP"
BUILD_DIR=".next/standalone"
PRODUCTION_DIR="/opt/thai-accounting"
BACKUP_DIR="/opt/thai-accounting/backups"
DB_NAME="dev.db"
LOG_DIR="/var/log/thai-accounting"
PID_FILE="/var/run/thai-accounting.pid"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  $APP_NAME Production Deployment${NC}"
echo -e "${BLUE}========================================${NC}\n"

###############################################################################
# Functions
###############################################################################

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    log_info "Checking system requirements..."

    # Check for Node.js/Bun
    if command -v bun &> /dev/null; then
        log_success "Bun runtime found: $(bun --version)"
    elif command -v node &> /dev/null; then
        log_success "Node.js found: $(node --version)"
    else
        log_error "Neither Bun nor Node.js found. Please install Bun."
        exit 1
    fi

    # Check available memory
    TOTAL_MEM=$(free -m | awk 'NR==2{printf "%.0f", $2 }')
    if [ "$TOTAL_MEM" -lt 512 ]; then
        log_warning "Low memory detected (${TOTAL_MEM}MB). Recommended: 1GB+"
    else
        log_success "Memory: ${TOTAL_MEM}MB"
    fi

    # Check disk space
    DISK_AVAILABLE=$(df -m . | awk 'NR==2{print $4}')
    if [ "$DISK_AVAILABLE" -lt 500 ]; then
        log_error "Insufficient disk space (${DISK_AVAILABLE}MB). Required: 500MB+"
        exit 1
    fi
    log_success "Disk space: ${DISK_AVAILABLE}MB available"
}

backup_database() {
    log_info "Backing up database..."

    if [ ! -f "prisma/$DB_NAME" ]; then
        log_warning "No database found to backup"
        return
    fi

    mkdir -p "$BACKUP_DIR"
    BACKUP_FILE="$BACKUP_DIR/${DB_NAME}.$(date +%Y%m%d_%H%M%S)"

    cp "prisma/$DB_NAME" "$BACKUP_FILE"
    log_success "Database backed up to: $BACKUP_FILE"

    # Keep only last 10 backups
    ls -t "$BACKUP_DIR"/${DB_NAME}.* 2>/dev/null | tail -n +11 | xargs -r rm --
    log_info "Retaining last 10 backups"
}

build_application() {
    log_info "Building application for production..."

    # Clean previous build
    log_info "Cleaning previous build..."
    rm -rf .next

    # Install dependencies
    log_info "Installing dependencies..."
    bun install

    # Generate Prisma client
    log_info "Generating Prisma client..."
    bun run db:generate

    # Run migrations
    log_info "Running database migrations..."
    bun run db:migrate || bun run db:push

    # Seed database if empty
    if [ ! -f "prisma/$DB_NAME" ] || [ $(sqlite3 "prisma/$DB_NAME" "SELECT COUNT(*) FROM User") -eq 0 ]; then
        log_info "Seeding database..."
        bun run seed
    fi

    # Build application
    log_info "Building Next.js application..."
    bun run build

    log_success "Application built successfully"
}

fix_database_url() {
    log_info "Fixing DATABASE_URL in standalone build..."

    STANDALONE_ENV="$BUILD_DIR/.env"

    if [ ! -f "$STANDALONE_ENV" ]; then
        log_error "Standalone .env not found at: $STANDALONE_ENV"
        exit 1
    fi

    # Get absolute path to database
    DB_ABSOLUTE_PATH="$(cd "$(dirname "$BUILD_DIR/$DB_NAME")" && pwd)/$(basename "$DB_NAME")"

    # Update DATABASE_URL to absolute path
    if grep -q "^DATABASE_URL=" "$STANDALONE_ENV"; then
        sed -i.bak "s|^DATABASE_URL=.*|DATABASE_URL=file:$DB_ABSOLUTE_PATH|" "$STANDALONE_ENV"
        log_success "DATABASE_URL updated to absolute path"
    else
        echo "DATABASE_URL=file:$DB_ABSOLUTE_PATH" >> "$STANDALONE_ENV"
        log_success "DATABASE_URL added to .env"
    fi

    # Copy database to standalone directory
    log_info "Copying database to standalone directory..."
    cp "prisma/$DB_NAME" "$BUILD_DIR/$DB_NAME"

    # Verify database exists
    if [ ! -f "$BUILD_DIR/$DB_NAME" ]; then
        log_error "Database copy failed"
        exit 1
    fi

    DB_SIZE=$(du -h "$BUILD_DIR/$DB_NAME" | cut -f1)
    log_success "Database copied (${DB_SIZE})"
}

deploy_to_production() {
    log_info "Deploying to production directory..."

    # Stop existing service
    if [ -f "$PID_FILE" ]; then
        log_info "Stopping existing service..."
        kill $(cat "$PID_FILE") 2>/dev/null || true
        rm -f "$PID_FILE"
        sleep 2
    fi

    # Create production directory
    sudo mkdir -p "$PRODUCTION_DIR"
    sudo mkdir -p "$LOG_DIR"

    # Copy build to production
    log_info "Copying build files..."
    sudo cp -r "$BUILD_DIR"/* "$PRODUCTION_DIR/"

    # Set permissions
    sudo chown -R $USER:$USER "$PRODUCTION_DIR"
    chmod +x "$PRODUCTION_DIR/server.js"

    log_success "Deployed to: $PRODUCTION_DIR"
}

create_startup_script() {
    log_info "Creating startup script..."

    cat > "$PRODUCTION_DIR/start.sh" << 'EOF'
#!/bin/bash

# Thai Accounting ERP - Production Startup Script

APP_NAME="Thai-Accounting-ERP"
PRODUCTION_DIR="/opt/thai-accounting"
LOG_DIR="/var/log/thai-accounting"
PID_FILE="/var/run/thai-accounting.pid"
PORT=3000

# Navigate to production directory
cd "$PRODUCTION_DIR" || exit 1

# Start the application
echo "Starting $APP_NAME..."
NODE_ENV=production nohup bun server.js > "$LOG_DIR/production.log" 2>&1 &
echo $! > "$PID_FILE"

echo "✓ $APP_NAME started successfully"
echo "  PID: $(cat $PID_FILE)"
echo "  Port: $PORT"
echo "  Logs: $LOG_DIR/production.log"
EOF

    chmod +x "$PRODUCTION_DIR/start.sh"
    log_success "Startup script created: $PRODUCTION_DIR/start.sh"
}

create_systemd_service() {
    log_info "Creating systemd service..."

    sudo tee /etc/systemd/system/thai-accounting.service > /dev/null << EOF
[Unit]
Description=Thai Accounting ERP
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$PRODUCTION_DIR
ExecStart=$(command -v bun) server.js
Restart=on-failure
RestartSec=10
StandardOutput=append:$LOG_DIR/production.log
StandardError=append:$LOG_DIR/production.log
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable thai-accounting.service

    log_success "Systemd service created and enabled"
}

verify_deployment() {
    log_info "Verifying deployment..."

    # Check if service is running
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null; then
            log_success "Service is running (PID: $PID)"
        else
            log_error "Service is not running"
            return 1
        fi
    else
        log_warning "PID file not found"
    fi

    # Check if port is listening
    if command -v netstat &> /dev/null; then
        if netstat -tuln | grep -q ":3000 "; then
            log_success "Port 3000 is listening"
        else
            log_warning "Port 3000 not listening yet"
        fi
    fi

    # Check database
    if [ -f "$PRODUCTION_DIR/$DB_NAME" ]; then
        DB_SIZE=$(du -h "$PRODUCTION_DIR/$DB_NAME" | cut -f1)
        log_success "Database exists (${DB_SIZE})"

        # Count users
        USER_COUNT=$(sqlite3 "$PRODUCTION_DIR/$DB_NAME" "SELECT COUNT(*) FROM User")
        log_success "Users in database: $USER_COUNT"

        # Count accounts
        ACCOUNT_COUNT=$(sqlite3 "$PRODUCTION_DIR/$DB_NAME" "SELECT COUNT(*) FROM ChartOfAccount")
        log_success "Chart of accounts: $ACCOUNT_COUNT"
    else
        log_error "Database not found"
        return 1
    fi

    return 0
}

print_deployment_summary() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  Deployment Complete!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "Application Details:"
    echo "  • Name: $APP_NAME"
    echo "  • Location: $PRODUCTION_DIR"
    echo "  • Database: $PRODUCTION_DIR/$DB_NAME"
    echo "  • Logs: $LOG_DIR/production.log"
    echo "  • PID File: $PID_FILE"
    echo ""
    echo "Service Management:"
    echo "  • Start:   sudo systemctl start thai-accounting"
    echo "  • Stop:    sudo systemctl stop thai-accounting"
    echo "  • Restart: sudo systemctl restart thai-accounting"
    echo "  • Status:  sudo systemctl status thai-accounting"
    echo "  • Logs:    sudo journalctl -u thai-accounting -f"
    echo ""
    echo "Manual Start (if systemd not available):"
    echo "  • cd $PRODUCTION_DIR"
    echo "  • ./start.sh"
    echo ""
    echo "URL: http://localhost:3000"
    echo ""
    echo "Default Admin Credentials:"
    echo "  • Email:    admin@thaiaccounting.com"
    echo "  • Password: admin123"
    echo ""
    echo -e "${YELLOW}IMPORTANT: Change default password after first login!${NC}"
    echo ""
}

###############################################################################
# Main Deployment Flow
###############################################################################

main() {
    # Parse command line arguments
    SKIP_BUILD=false
    SKIP_DEPLOY=false

    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            --skip-deploy)
                SKIP_DEPLOY=true
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --skip-build    Skip build step (use existing .next/standalone)"
                echo "  --skip-deploy   Skip deploy to /opt (build only)"
                echo "  --help          Show this help message"
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done

    # Run deployment steps
    check_requirements
    backup_database

    if [ "$SKIP_BUILD" = false ]; then
        build_application
    fi

    fix_database_url

    if [ "$SKIP_DEPLOY" = false ]; then
        deploy_to_production
        create_startup_script
        create_systemd_service

        # Start service
        log_info "Starting service..."
        sudo systemctl start thai-accounting
        sleep 3

        verify_deployment
    fi

    print_deployment_summary
}

# Run main function
main "$@"
