<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-17 -->

# logs/

## Purpose

Application log files including dev server logs, test logs, and scheduled task
logs.

## Key Files

| File             | Description                        |
| ---------------- | ---------------------------------- |
| `dev-server.log` | Main development server log (61KB) |
| `dev-server.pid` | Process ID file for dev server     |
| `server.log`     | Production server log              |
| `production.log` | Production runtime log             |
| `test-run-*.log` | E2E test execution logs            |

## Subdirectories

| Directory         | Purpose                       |
| ----------------- | ----------------------------- |
| `scheduled/`      | Scheduled task execution logs |
| `query-analysis/` | Database query analysis logs  |

## For AI Agents

### Log Analysis

- Dev server logs track development issues
- Production logs at `/root/thai-acc/server.log` on VPS
- Use logs for debugging failed deployments or test failures

### Log Rotation

Logs grow over time. For production, consider log rotation to prevent disk space
issues.

### Server PID

The `dev-server.pid` file contains the process ID of the running dev server.
