# 🤖 Test Automation Setup

## Overview

Comprehensive test automation system for the Thai Accounting ERP project with:

- ✅ Multi-tier test execution (smoke, quick, full)
- ✅ Automated scheduling (hourly, daily, weekly)
- ✅ Parallel test execution
- ✅ Test result aggregation and reporting
- ✅ Coverage tracking and trends
- ✅ Slack/Discord notifications
- ✅ Historical test data
- ✅ CI/CD integration

---

## 🚀 Quick Start

### 1. Local Test Automation

```bash
# Run smoke tests (2-3 min)
./scripts/test-automation.sh smoke

# Run quick tests (5 min)
./scripts/test-automation.sh quick

# Run full test suite (15-20 min)
./scripts/test-automation.sh full

# Run specific module tests
./scripts/test-automation.sh module invoices

# Generate coverage report
./scripts/test-automation.sh coverage
```

### 2. Schedule Automated Tests

```bash
# Interactive scheduler
./scripts/test-scheduler.sh

# Quick setup (recommended schedules)
./scripts/test-scheduler.sh setup
```

### 3. View Test Reports

Test reports are automatically generated and saved to:
- **HTML Report**: `test-results/playwright-report/index.html`
- **JSON Results**: `test-results/results.json`
- **Test History**: `test-history/`
- **Coverage**: `coverage/index.html`

---

## 📋 Test Tiers

### Smoke Tests (2-3 minutes)
- Critical path only
- Authentication
- Navigation
- Core accounting workflows
- **Run**: Every commit, hourly

### Quick Tests (5 minutes)
- Smoke tests + critical features
- All 16 modules (basic checks)
- Database integrity
- **Run**: On PRs, daily

### Full Tests (15-20 minutes)
- Complete E2E suite
- All modules (comprehensive)
- Unit tests
- Coverage report
- **Run**: On merge to main, weekly

---

## 🔧 Configuration

### Environment Variables

```bash
# Test execution
PARALLEL_WORKERS=4           # Number of parallel workers
TEST_TIMEOUT=60000           # Test timeout in ms
RETRY_COUNT=2                # Test retry count

# Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
EMAIL_RECIPIENTS=team@example.com

# Server
SERVER_URL=http://localhost:3000
```

Add these to your `.env` file or export in your shell.

---

## 📅 Scheduling

### Predefined Schedules

```bash
./scripts/test-scheduler.sh setup
```

This offers:
1. **Hourly smoke tests** - Every hour at :00
2. **Daily quick tests** - 2 AM daily
3. **Weekly full tests** - Sunday 3 AM
4. **Monthly coverage** - 1st of month 4 AM

### Custom Schedules

```bash
./scripts/test-scheduler.sh
# Select option 3 (Custom schedule)
# Follow prompts to build your cron expression
```

### Cron Examples

```bash
# Every 6 hours
0 */6 * * * /path/to/test-automation.sh quick

# Weekdays at 9 AM
0 9 * * 1-5 /path/to/test-automation.sh quick

# Every 15 minutes
*/15 * * * * /path/to/test-automation.sh smoke
```

---

## 📊 Notifications

### Setup Slack Notifications

1. Create a Slack Incoming Webhook
2. Add to repository secrets: `SLACK_WEBHOOK_URL`
3. Notifications sent automatically

### Setup Discord Notifications

1. Create a Discord Webhook
2. Add to repository secrets: `DISCORD_WEBHOOK_URL`
3. Notifications sent automatically

### Notification Content

Notifications include:
- ✅/❌ Test status
- Branch and commit info
- Duration
- Direct link to results

---

## 📈 Test Reports

### Local Reports

```bash
# View latest HTML report
open test-results/playwright-report/index.html

# View coverage report
open coverage/index.html

# View test history
ls -la test-history/
```

### CI/CD Reports

Reports are automatically:
- Uploaded as workflow artifacts
- Published to GitHub Pages (main branch)
- Commented on PRs
- Sent via notifications

---

## 🔍 Advanced Usage

### Module-Specific Testing

```bash
# Test specific module
./scripts/test-automation.sh module invoices
./scripts/test-automation.sh module inventory
./scripts/test-automation.sh module payroll
```

### Parallel Execution

```bash
# Run with 8 workers
PARALLEL_WORKERS=8 ./scripts/test-automation.sh full

# Run with custom timeout
TEST_TIMEOUT=120000 ./scripts/test-automation.sh full
```

### Debug Mode

```bash
# Enable debug output
./scripts/test-automation.sh smoke --debug
```

### Clean Artifacts

```bash
# Clean old test results (older than 7 days)
./scripts/test-automation.sh clean

# Clean all test data
./scripts/test-automation.sh clean-all
```

---

## 📁 Directory Structure

```
test-results/              # Test execution results
├── results.json          # JSON test results
├── smoke-report.html     # Smoke test HTML report
├── quick-report.html     # Quick test HTML report
└── full-report.html      # Full test HTML report

test-history/             # Historical test data
├── smoke_20260317_120000.json
├── quick_20260317_130000.json
└── full_20260317_140000.json

test-artifacts/           # Screenshots, videos, traces
├── screenshots/
├── videos/
└── traces/

coverage/                 # Coverage reports
├── index.html
├── lcov.info
└── coverage-final.json

logs/                     # Execution logs
├── scheduled/
│   ├── smoke_scheduled.log
│   ├── quick_scheduled.log
│   └── full_scheduled.log
└── dev-server-*.log
```

---

## 🔄 CI/CD Integration

### GitHub Actions Workflows

**`.github/workflows/test-automation.yml`**:
- Triggered on push/PR
- Scheduled runs (daily/weekly)
- Manual trigger with options

**`.github/workflows/test-report.yml`**:
- Generates comprehensive reports
- Coverage trends analysis
- Flaky test detection

### Workflow Dispatch Options

Manual trigger from GitHub Actions UI:
1. Go to Actions → Test Automation
2. Click "Run workflow"
3. Select options:
   - **Test level**: smoke, quick, full
   - **Module**: specific module (optional)
   - **Notify**: send notifications (default: true)

---

## 🛠️ Troubleshooting

### Server Won't Start

```bash
# Check if port is in use
lsof -ti:3000 | xargs kill -9

# Start server manually
bun run dev

# Check logs
tail -f logs/dev-server-*.log
```

### Tests Failing Locally

```bash
# Clean all artifacts
./scripts/test-automation.sh clean-all

# Reset database
bun run db:reset
bun run seed

# Run tests again
./scripts/test-automation.sh quick
```

### Cron Jobs Not Running

```bash
# Check crontab
crontab -l | grep test-automation

# Check cron logs
grep CRON /var/log/syslog

# Test cron job manually
/run/user/1000/bin/test-automation.sh smoke
```

### Notifications Not Sending

```bash
# Verify webhook URLs
echo $SLACK_WEBHOOK_URL
echo $DISCORD_WEBHOOK_URL

# Test notification manually
curl -X POST $SLACK_WEBHOOK_URL \
  -H 'Content-Type: application/json' \
  -d '{"text":"Test notification"}'
```

---

## 📊 Test Metrics Tracking

### Viewing Statistics

```bash
# Show scheduled test statistics
./scripts/test-scheduler.sh stats

# View recent test history
ls -lt test-history/ | head -10

# Analyze trends
bun run ts-node scripts/generate-test-metrics.ts
```

### Historical Data

Test history is stored in `test-history/` as JSON:

```json
{
  "timestamp": "2026-03-17T12:00:00Z",
  "date": "2026-03-17",
  "test_type": "smoke",
  "exit_code": 0,
  "branch": "main",
  "commit": "abc123",
  "author": "Developer",
  "message": "Fix login bug"
}
```

---

## 🎯 Best Practices

### Before Committing

```bash
# Run quick tests
./scripts/test-automation.sh quick

# Run linter
bun run lint

# Type check
bun run type-check
```

### Before Merging

```bash
# Run full test suite
./scripts/test-automation.sh full

# Verify database
./scripts/verify-database.sh

# Check coverage
./scripts/test-automation.sh coverage
```

### Continuous Monitoring

- Schedule automated tests (hourly smoke, daily quick)
- Enable notifications
- Review test reports weekly
- Track coverage trends
- Address flaky tests immediately

---

## 📚 Additional Resources

- **Playwright Documentation**: https://playwright.dev
- **Vitest Documentation**: https://vitest.dev
- **GitHub Actions Documentation**: https://docs.github.com/actions
- **Cron Tutorial**: https://crontab.guru

---

## 🆘 Support

For issues or questions:
1. Check logs: `logs/scheduled/`
2. Review troubleshooting section
3. Open GitHub issue
4. Contact development team

---

**Last Updated**: 2026-03-17
**Version**: 1.0.0
