# Thai Accounting ERP - Monitoring Guide

## Table of Contents

1. [Monitoring Overview](#monitoring-overview)
2. [System Monitoring](#system-monitoring)
3. [Application Monitoring](#application-monitoring)
4. [Database Monitoring](#database-monitoring)
5. [Log Management](#log-management)
6. [Alerting](#alerting)
7. [Performance Monitoring](#performance-monitoring)
8. [Uptime Monitoring](#uptime-monitoring)
9. [Security Monitoring](#security-monitoring)
10. [Dashboards](#dashboards)

---

## Monitoring Overview

Effective monitoring ensures the Thai Accounting ERP system remains available,
performant, and secure. This guide covers comprehensive monitoring strategies.

### Key Metrics to Monitor

| Category    | Metric           | Threshold |
| ----------- | ---------------- | --------- |
| System      | CPU Usage        | > 80%     |
| System      | Memory Usage     | > 85%     |
| System      | Disk Usage       | > 85%     |
| Application | Response Time    | > 2s      |
| Application | Error Rate       | > 1%      |
| Database    | Query Time       | > 1s      |
| Database    | Connection Count | > 80%     |

---

## System Monitoring

### Prometheus + Grafana Setup

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - '9090:9090'
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'

  grafana:
    image: grafana/grafana:latest
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
    ports:
      - '3001:3000'
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin

  node-exporter:
    image: prom/node-exporter:latest
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'

volumes:
  prometheus_data:
  grafana_data:
```

### Prometheus Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'thai-acc-app'
    static_configs:
      - targets: ['app:3000']
    metrics_path: '/api/metrics'

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']
```

### Basic System Monitoring Commands

```bash
# CPU and Memory
top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F% '{print $1}'
free -m | awk 'NR==2{printf "%.2f%%", $3*100/$2}'

# Disk Usage
df -h | awk '$NF=="/"{printf "%s", $5}'

# Network
netstat -tuln | grep :3000
```

---

## Application Monitoring

### Application Metrics Endpoint

```typescript
// app/api/metrics/route.ts
import { NextResponse } from 'next/server';
import {
  register,
  collectDefaultMetrics,
  Gauge,
  Counter,
  Histogram,
} from 'prom-client';

// Collect default metrics
collectDefaultMetrics();

// Custom metrics
const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
});

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

const activeUsers = new Gauge({
  name: 'active_users',
  help: 'Number of active users',
});

export async function GET() {
  const metrics = await register.metrics();
  return new NextResponse(metrics, {
    headers: {
      'Content-Type': register.contentType,
    },
  });
}
```

### Health Check Endpoint

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const checks = {
    database: false,
    disk: false,
    memory: false,
  };

  // Database check
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch {
    checks.database = false;
  }

  // Disk check (should have > 10% free)
  const diskUsage = getDiskUsage();
  checks.disk = diskUsage < 90;

  // Memory check
  const memUsage = getMemoryUsage();
  checks.memory = memUsage < 90;

  const allHealthy = Object.values(checks).every(Boolean);

  return NextResponse.json(
    {
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks,
      version: process.env.npm_package_version,
    },
    { status: allHealthy ? 200 : 503 }
  );
}
```

### PM2 Monitoring

```bash
# View PM2 status
pm2 status

# View logs
pm2 logs thai-accounting-erp

# Monitor real-time
pm2 monit

# Configure PM2 monitoring
pm2 ecosystem
```

---

## Database Monitoring

### SQLite Monitoring

```bash
# Database size
du -sh /home/thaiacc/erp/data/prod.db

# Check integrity
sqlite3 /home/thaiacc/erp/data/prod.db "PRAGMA integrity_check;"

# Analyze query performance
sqlite3 /home/thaiacc/erp/data/prod.db "PRAGMA optimize;"
```

### PostgreSQL Monitoring

```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity;

-- Slow queries
SELECT query, calls, mean_time, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Table sizes
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

---

## Log Management

### Centralized Logging with Loki

```yaml
# docker-compose.logging.yml
version: '3.8'

services:
  loki:
    image: grafana/loki:latest
    ports:
      - '3100:3100'
    volumes:
      - ./loki-config.yml:/etc/loki/local-config.yaml

  promtail:
    image: grafana/promtail:latest
    volumes:
      - /var/log:/var/log:ro
      - /home/thaiacc/erp/logs:/app/logs:ro
      - ./promtail-config.yml:/etc/promtail/config.yml
    command: -config.file=/etc/promtail/config.yml
```

### Log Rotation

```bash
# /etc/logrotate.d/thai-acc
/home/thaiacc/erp/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0644 thaiacc thaiacc
    postrotate
        pm2 reload thai-accounting-erp
    endscript
}
```

### Application Logging

```typescript
// lib/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'thai-acc' },
  transports: [
    new winston.transports.File({
      filename: '/var/log/thai-acc/error.log',
      level: 'error',
    }),
    new winston.transports.File({
      filename: '/var/log/thai-acc/combined.log',
    }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}
```

---

## Alerting

### AlertManager Configuration

```yaml
# alertmanager.yml
global:
  smtp_smarthost: 'localhost:587'
  smtp_from: 'alerts@your-domain.com'

route:
  receiver: 'default'
  routes:
    - match:
        severity: critical
      receiver: 'pagerduty'
    - match:
        severity: warning
      receiver: 'email'

receivers:
  - name: 'default'
    email_configs:
      - to: 'admin@your-domain.com'

  - name: 'pagerduty'
    pagerduty_configs:
      - service_key: '<your-pagerduty-key>'

  - name: 'email'
    email_configs:
      - to: 'team@your-domain.com'
```

### Alert Rules

```yaml
# alert-rules.yml
groups:
  - name: thai-acc-alerts
    rules:
      - alert: HighCPUUsage
        expr:
          100 - (avg by (instance)
          (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: 'High CPU usage detected'
          description: 'CPU usage is above 80% for more than 5 minutes'

      - alert: ApplicationDown
        expr: up{job="thai-acc-app"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: 'Application is down'
          description: 'Thai Accounting ERP application is not responding'

      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: 'High error rate'
          description: 'Error rate is above 5%'

      - alert: DiskSpaceLow
        expr: (node_filesystem_avail_bytes / node_filesystem_size_bytes) < 0.15
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: 'Low disk space'
          description: 'Disk space is below 15%'
```

### Simple Alert Script

```bash
#!/bin/bash
# simple-alert.sh

HEALTH_URL="https://your-domain.com/api/health"
ALERT_EMAIL="admin@your-domain.com"

response=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL")

if [ "$response" != "200" ]; then
    echo "Application is down! HTTP status: $response" | \
    mail -s "[ALERT] Thai Accounting ERP - Application Down" "$ALERT_EMAIL"
fi
```

---

## Performance Monitoring

### Web Vitals

```typescript
// lib/vitals.ts
import { getCLS, getFCP, getFID, getLCP, getTTFB } from 'web-vitals';

export function reportWebVitals(metric: any) {
  // Send to analytics
  const body = JSON.stringify(metric);
  const url = '/api/vitals';

  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, body);
  } else {
    fetch(url, { body, method: 'POST', keepalive: true });
  }
}

// In _app.tsx or layout.tsx
if (typeof window !== 'undefined') {
  getCLS(reportWebVitals);
  getFID(reportWebVitals);
  getFCP(reportWebVitals);
  getLCP(reportWebVitals);
  getTTFB(reportWebVitals);
}
```

### API Performance Tracking

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const start = Date.now();

  const response = NextResponse.next();

  const duration = Date.now() - start;

  // Log slow requests
  if (duration > 1000) {
    console.warn(`Slow request: ${request.url} took ${duration}ms`);
  }

  response.headers.set('X-Response-Time', `${duration}ms`);

  return response;
}
```

---

## Uptime Monitoring

### External Monitoring Services

```bash
# UptimeRobot
curl -s "https://api.uptimerobot.com/v2/newMonitor" \
  -X POST \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "api_key=your-api-key" \
  -d "format=json" \
  -d "type=1" \
  -d "url=https://your-domain.com/api/health" \
  -d "friendly_name=Thai Accounting ERP"

# Pingdom, StatusCake, etc.
```

### Self-Hosted Uptime Kuma

```bash
# Docker deployment
docker run -d \
  --restart=always \
  -p 3002:3001 \
  -v uptime-kuma:/app/data \
  --name uptime-kuma \
  louislam/uptime-kuma:1
```

---

## Security Monitoring

### Fail2Ban Integration

```bash
# Monitor application logs
sudo tee /etc/fail2ban/jail.local << 'EOF'
[thai-acc]
enabled = true
port = http,https
filter = thai-acc
logpath = /var/log/thai-acc/security.log
maxretry = 5
bantime = 3600
EOF
```

### Intrusion Detection with OSSEC

```bash
# Install OSSEC
wget https://github.com/ossec/ossec-hids/archive/refs/tags/3.7.0.tar.gz
tar -xzf 3.7.0.tar.gz
cd ossec-hids-3.7.0
sudo ./install.sh
```

---

## Dashboards

### Key Dashboard Panels

1. **System Overview**
   - CPU Usage
   - Memory Usage
   - Disk Usage
   - Network I/O

2. **Application Metrics**
   - Request Rate
   - Response Time
   - Error Rate
   - Active Users

3. **Business Metrics**
   - Invoices Created
   - Revenue
   - New Customers
   - Failed Logins

4. **Database Metrics**
   - Query Performance
   - Connection Pool
   - Table Sizes
   - Index Usage

### Grafana Dashboard JSON

```json
{
  "dashboard": {
    "title": "Thai Accounting ERP",
    "panels": [
      {
        "title": "Application Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])",
            "legendFormat": "Average Response Time"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])",
            "legendFormat": "Errors/sec"
          }
        ]
      }
    ]
  }
}
```

---

## Maintenance

### Daily Checks

- [ ] Review overnight alerts
- [ ] Check disk space
- [ ] Verify backup completion
- [ ] Review error logs

### Weekly Tasks

- [ ] Analyze performance trends
- [ ] Review security logs
- [ ] Update dashboards
- [ ] Test alert mechanisms

### Monthly Tasks

- [ ] Capacity planning review
- [ ] Update monitoring configurations
- [ ] Review and optimize queries
- [ ] Archive old logs

---

**Last Updated:** March 16, 2026  
**Monitoring System:** Prometheus + Grafana  
**Alert Channels:** Email, PagerDuty
