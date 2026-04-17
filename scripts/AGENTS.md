# AGENTS.md - Thai Accounting ERP System - Scripts Directory

This file provides essential guidance for AI coding agents working on the **Scripts Directory** of the Thai Accounting ERP System. The scripts directory contains automation utilities for deployment, backup, testing, and security operations.

## Overview

The scripts directory is organized into three main categories:

1. **Deployment & Production Management** - Production deployment and server management scripts
2. **Backup & Recovery** - Database backup and restoration utilities  
3. **Security & Monitoring** - Security scanning and system monitoring tools

**Parent Reference**: See `../AGENTS.md` for comprehensive project documentation.

## Directory Structure

```
scripts/
├── backup/                    # Database backup automation
│   └── backup-database.sh     # Automated SQLite/PostgreSQL backup
├── deployment/               # Production deployment utilities
│   ├── blue-green-deploy.sh  # Blue-green deployment script
│   ├── rollback.sh            # Rollback to previous deployment
│   └── verify-deployment.sh  # Deployment verification
├── security/                 # Security and monitoring
│   ├── scan-secrets.sh       # Secret scanning in codebase
│   ├── dependency-check.sh    # Security dependency checking
│   └── generate-sbom.sh      # Software Bill of Materials generation
└── [standalone scripts]      # Main automation scripts
```

## Deployment & Production Management

### Production Server Management

**`start-production.sh`** - Production Server Start
- **Purpose**: Start production server in standalone mode
- **Features**: Database backup, environment verification, graceful startup
- **Usage**: `./scripts/start-production.sh`
- **Requirements**: `.next/standalone` build exists with `.env` configuration

**`stop-production.sh`** - Production Server Stop  
- **Purpose**: Gracefully stop production server
- **Features**: PID file management, safe shutdown
- **Usage**: `./scripts/stop-production.sh`

**`restart-production.sh`** - Production Server Restart
- **Purpose**: Restart production server with backup
- **Features**: Stop → backup → start sequence
- **Usage**: `./scripts/restart-production.sh`

### Production Build & Deployment

**`build-production.sh`** - Production Build Process
- **Purpose**: Complete production build automation
- **Features**: Clean build, Prisma client generation, standalone output setup
- **Output**: `.next/standalone/` directory with production dependencies
- **Usage**: `./scripts/build-production.sh`
- **Key Steps**: 
  1. Clean previous build
  2. Generate Prisma client
  3. Build Next.js in standalone mode
  4. Copy static files and database
  5. Install production dependencies
  6. Configure environment with absolute paths

**`deploy-production.sh`** - Production Deployment
- **Purpose**: Deploy application to production environment
- **Features**: Automated deployment with rollback capability
- **Usage**: `./scripts/deploy-production.sh`

**`deploy-vps.sh`** & **`vps-deploy.sh`** - VPS Deployment
- **Purpose**: Deploy to remote VPS server
- **Features**: Secure transfer, remote execution, tunnel management
- **Usage**: `./scripts/deploy-vps.sh` or `./scripts/vps-deploy.sh`

**`verify-deployment.sh`** - Deployment Verification
- **Purpose**: Verify production deployment health
- **Features**: Health checks, database connection, functionality tests
- **Usage**: `./scripts/verify-deployment.sh`

### Advanced Deployment

**`deployment/blue-green-deploy.sh`** - Blue-Green Deployment
- **Purpose**: Zero-downtime deployment strategy
- **Features**: Parallel deployment, traffic switching, rollback capability
- **Usage**: `./scripts/deployment/blue-green-deploy.sh`

**`deployment/rollback.sh`** - Deployment Rollback
- **Purpose**: Rollback to previous stable deployment
- **Features**: Automatic backup restore, version switching
- **Usage**: `./scripts/deployment/rollback.sh`

**`setup-devops.sh`** - DevOps Environment Setup
- **Purpose**: Initialize production environment
- **Features**: System dependencies, user setup, directory creation
- **Usage**: `./scripts/setup-devops.sh`

## Backup & Recovery

### Database Backup

**`backup/backup-database.sh`** - Comprehensive Database Backup
- **Purpose**: Automated SQLite/PostgreSQL backup with encryption
- **Features**: 
  - Multi-format backup (SQLite/PostgreSQL)
  - GPG encryption support
  - S3 cloud upload capability
  - Retention management (30 days)
  - Notification system (email/Slack)
- **Usage**: `./scripts/backup/backup-database.sh [full|incremental|list|restore|verify]`
- **Commands**:
  - `full`: Create full backup
  - `incremental`: Create incremental backup (PostgreSQL only)
  - `list`: List available backups
  - `restore <file>`: Restore from backup
  - `verify <file>`: Verify backup integrity
  - `cleanup`: Clean old backups
  - `config`: Show configuration

**`backup-restore.sh`** - Database Restoration
- **Purpose**: Restore database from backup files
- **Features**: Multi-format support (SQLite/PostgreSQL)
- **Usage**: `./scripts/backup-restore.sh <backup-file> [target-path]`

**`backup.sh`** - Simple Backup Script
- **Purpose**: Basic database backup utility
- **Features**: Quick backup creation
- **Usage**: `./scripts/backup.sh`

### Testing & Verification

**`verify-database.sh`** - Database Integrity Check
- **Purpose**: Verify database consistency and integrity
- **Features**: Schema validation, data integrity checks
- **Usage**: `./scripts/verify-database.sh`

**`test-disaster-recovery.sh`** - Disaster Recovery Testing
- **Purpose**: Test backup and restore procedures
- **Features**: Automated restore testing, performance measurement
- **Usage**: `./scripts/test-disaster-recovery.sh`

## Security & Monitoring

### Security Scanning

**`security/scan-secrets.sh`** - Secret Scanning
- **Purpose**: Scan codebase for potential secrets and vulnerabilities
- **Features**:
  - API key detection
  - Database credential scanning
  - Private key detection
  - Environment file validation
  - Gitignore verification
- **Usage**: `./scripts/security/scan-secrets.sh`
- **Patterns Scanned**: API keys, AWS keys, JWT secrets, passwords, database URLs

**`security/dependency-check.sh`** - Dependency Security Check
- **Purpose**: Scan npm dependencies for known vulnerabilities
- **Features**: Vulnerability database lookup, severity assessment
- **Usage**: `./scripts/security/dependency-check.sh`

**`security/generate-sbom.sh`** - Software Bill of Materials
- **Purpose**: Generate SBOM for production deployment
- **Features**: Dependency inventory, vulnerability scanning integration
- **Usage**: `./scripts/security/generate-sbom.sh`

### Health Monitoring

**`health-check.sh`** - Production Health Check
- **Purpose**: Monitor production server health
- **Features**: Response time, database connection, memory usage
- **Usage**: `./scripts/health-check.sh`

**`analyze-query-performance.sh`** - Query Performance Analysis
- **Purpose**: Analyze database query performance
- **Features**: Slow query detection, optimization suggestions
- **Usage**: `./scripts/analyze-query-performance.sh`

## Testing & Quality Assurance

### Test Execution

**`test-quick.sh`** - Quick Smoke Tests
- **Purpose**: Run high-priority smoke tests only (~2-3 minutes)
- **Features**: Dev server auto-start, playwright integration
- **Usage**: `./scripts/test-quick.sh`
- **Tests**: `@smoke` tagged tests only

**`test-full.sh`** - Full Test Suite
- **Purpose**: Run complete test suite (~15-20 minutes)
- **Features**: All test categories, comprehensive coverage
- **Usage**: `./scripts/test-full.sh`

**`test-module.sh`** - Module-Specific Tests
- **Purpose**: Run tests for specific module
- **Features**: Filter by module tag
- **Usage**: `./scripts/test-module.sh <module-name>`

**`run-e2e-tests.sh`** - E2E Test Execution
- **Purpose**: Run Playwright E2E tests
- **Features**: Multiple browsers, responsive testing
- **Usage**: `./scripts/run-e2e-tests.sh`

### Test Automation

**`test-automation.sh`** - Test Automation Manager
- **Purpose**: Automated test execution with scheduling
- **Features**: Test orchestration, result reporting
- **Usage**: `./scripts/test-automation.sh`

**`test-scheduler.sh`** - Test Scheduling
- **Purpose**: Schedule automated test runs
- **Features**: Cron-based scheduling, email notifications
- **Usage**: `./scripts/test-scheduler.sh`

**`run-automation-tests.sh`** - CI/CD Integration
- **Purpose**: Run tests in CI/CD pipeline
- **Features**: Integration with build systems
- **Usage**: `./scripts/run-automation-tests.sh`

### Test Reporting

**`generate-test-report.ts`** - Test Report Generation
- **Purpose**: Generate comprehensive test reports
- **Features**: HTML/PDF output, performance metrics
- **Usage**: `bun run scripts/generate-test-report.ts`

**`generate-playwright-report.ts`** - Playwright Report
- **Purpose**: Generate Playwright test reports
- **Features**: Visual reports, failure analysis
- **Usage**: `bun run scripts/generate-playwright-report.ts`

## Data Management & Migration

### Data Seeding

**`seed-simple.ts`** - Simple Test Data
- **Purpose**: Create test data for empty modules
- **Features**: Bank accounts, installment payments
- **Usage**: `bun run scripts/seed-simple.ts`

**`seed-comprehensive-data.ts`** - Comprehensive Data Seeding
- **Purpose**: Create extensive test data
- **Features**: All modules, realistic business scenarios
- **Usage**: `bun run scripts/seed-comprehensive-data.ts`

**`seed-test-data.ts`** - Test Data Generator
- **Purpose**: Generate specific test scenarios
- **Features**: Customizable data generation
- **Usage**: `bun run scripts/seed-test-data.ts`

**`seed-historical-data.ts`** - Historical Data Import
- **Purpose**: Import historical financial data
- **Features**: Time-series data, period-based imports
- **Usage**: `bun run scripts/seed-historical-data.ts`

### Data Migration

**`migrate-receipts.ts`** - Receipt Migration
- **Purpose**: Migrate legacy receipt data
- **Features**: Format conversion, validation
- **Usage**: `bun run scripts/migrate-receipts.ts`

**`backfill-vat-records.ts`** - VAT Records Backfill
- **Purpose**: Generate historical VAT records
- **Features**: Tax calculation, period-based generation
- **Usage**: `bun run scripts/backfill-vat-records.ts`

**`create-vat-input-account.ts`** - VAT Account Setup
- **Purpose**: Create VAT input tax accounts
- **Features**: Account generation, configuration
- **Usage**: `bun run scripts/create-vat-input-account.ts`

### Data Verification

**`verify-currency-fixes.ts`** - Currency Format Verification
- **Purpose**: Verify Satang currency format fixes
- **Features**: Data validation, conversion checking
- **Usage**: `bun run scripts/verify-currency-fixes.ts`

**`reset-database-satang.sh`** - Database Reset (Satang Format)
- **Purpose**: Reset database with correct Satang formatting
- **Features**: Clean slate, proper currency format
- **Usage**: `./scripts/reset-database-satang.sh`

## Utility & Maintenance

### System Setup

**`setup-thai-fonts.sh`** - Thai Font Installation
- **Purpose**: Install Thai fonts for PDF generation
- **Features**: Font download, system configuration
- **Usage**: `./scripts/setup-thai-fonts.sh`

**`fix-auth-imports.ts`** - Authentication Import Fixes
- **Purpose**: Fix authentication-related import issues
- **Features**: Migration support, backward compatibility
- **Usage**: `bun run scripts/fix-auth-imports.ts`

**`audit-modules.ts`** - Module Audit
- **Purpose**: Audit module completeness and consistency
- **Features**: Code review, documentation check
- **Usage**: `bun run scripts/audit-modules.ts`

### Issue Management

**`create-issues.sh`** - Issue Report Generation
- **Purpose**: Create GitHub issues from script outputs
- **Features**: Template-based issue creation
- **Usage**: `./scripts/create-issues.sh`

### Schema Management

**`prepare-schemas.js`** - Schema Preparation
- **Purpose**: Prepare database schemas for deployment
- **Features**: Schema optimization, compatibility checks
- **Usage**: `node scripts/prepare-schemas.js`

## Configuration & Environment

### Environment Setup

All scripts support configuration through environment variables and configuration files:

**Common Environment Variables**:
- `DATABASE_URL`: Database connection string
- `NEXTAUTH_URL`: Application URL
- `NEXTAUTH_SECRET`: Authentication secret
- `BACKUP_DIR`: Backup directory path
- `ENCRYPTION_ENABLED`: Enable GPG encryption
- `S3_BUCKET`: S3 bucket for cloud storage

**Configuration Files**:
- `scripts/backup/backup-config.env`: Backup-specific configuration
- `.env`: Environment variables (auto-copied to standalone builds)

### Logging & Monitoring

All scripts include comprehensive logging:
- Timestamped log entries
- Color-coded output for easy reading
- Error handling and alerting
- Progress indicators for long-running operations

Log files are stored in:
- `logs/` directory for production scripts
- `scripts/backup/backup.log` for backup operations

## Best Practices

### Script Execution
1. **Always run from project root**: `./scripts/[script-name]`
2. **Check prerequisites**: Ensure build dependencies are installed
3. **Backup before major operations**: Especially for database modifications
4. **Review output**: Always check script completion messages

### Security Considerations
1. **Secret scanning**: Run `scan-secrets.sh` before commits
2. **Dependency checks**: Regular security scans for vulnerabilities
3. **Environment management**: Keep `.env` files secure and ignored in git
4. **Backup encryption**: Enable GPG encryption for sensitive backups

### Testing Strategy
1. **Quick tests**: Use `test-quick.sh` for development feedback
2. **Full tests**: Run `test-full.sh` before production deployment
3. **Module tests**: Use `test-module.sh` for focused testing
4. **E2E tests**: Run `run-e2e-tests.sh` for end-to-end validation

### Production Deployment
1. **Build verification**: Always run `verify-deployment.sh` after deployment
2. **Health monitoring**: Regular `health-check.sh` execution
3. **Backup verification**: Test restore procedures regularly
4. **Rollback readiness**: Ensure rollback scripts are functional

## Troubleshooting

### Common Issues

**Build Issues**:
- Ensure `bun run db:generate` was run after schema changes
- Check Node.js version compatibility (18+)
- Verify standalone build exists before deployment

**Database Issues**:
- Run `verify-database.sh` to check integrity
- Use `backup-restore.sh` for recovery
- Check Satang format consistency

**Test Failures**:
- Run `test-quick.sh` first for quick feedback
- Check dev server availability
- Review playwright configuration

### Debug Commands

```bash
# Check server status
./scripts/health-check.sh

# Verify build
./scripts/verify-deployment.sh

# Test database integrity
./scripts/verify-database.sh

# Scan for issues
./scripts/security/scan-secrets.sh
```

---

**Related Documentation**: See `../AGENTS.md` for comprehensive project documentation

**Last Updated**: 2026-04-16