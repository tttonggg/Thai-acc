# AGENTS.md - Monitoring Stack

This file provides essential guidance for AI coding agents working on the **Thai ERP Monitoring Stack** - an integrated observability platform for the Thai Accounting ERP System.

## Overview

This directory contains a comprehensive monitoring stack built on the open-source observability ecosystem:

- **Prometheus** - Metrics collection and alerting
- **Grafana** - Visualization and dashboarding  
- **Loki** - Log aggregation and querying
- **Promtail** - Log collection and shipping
- **Alertmanager** - Alert routing and notifications

The stack provides full observability for the Thai ERP application, infrastructure, and business metrics.

## Architecture

```
├── alerts/              # Alert configurations and routing
│   ├── alert-rules.yml     # Prometheus alerting rules
│   └── alertmanager.yml    # Alert notification routing
├── grafana/            # Grafana configurations
│   ├── provisioning/       # Automated provisioning configs
│   │   ├── datasources/    # Data source configurations
│   │   │   └── datasources.yml    # Prometheus, Loki, Tempo, CloudWatch
│   │   └── dashboards/    # Dashboard provisioning
│   │       └── dashboards.yml      # Auto-import dashboard configurations
│   └── dashboards/        # Dashboard JSON definitions
│       └── thai-erp-overview.json  # Main system dashboard
├── prometheus/        # Prometheus configuration
│   └── prometheus.yml     # Main Prometheus config with scrape jobs
├── promtail/          # Promtail configuration
│   └── promtail-config.yml # Log collection and shipping to Loki
└── loki-config.yml    # Loki configuration for log storage
└── status-page.html   # Public system status page
```

## Technology Stack

| Component | Technology | Purpose | Key Features |
|-----------|------------|---------|-------------|
| Prometheus | Prometheus 2.x | Metrics collection | Time-series metrics, alerting |
| Grafana | Grafana 11.x | Visualization | Dashboards, alerts, data sources |
| Loki | Loki 3.x | Log aggregation | LogQL querying, retention policies |
| Promtail | Promtail 2.x | Log collection | Log shipping, parsing, labels |
| Alertmanager | Alertmanager 0.x | Alert routing | Notification, grouping, silencing |

## Configuration Details

### Prometheus Configuration

**Scrape Jobs** (`prometheus.yml`):
- **thai-erp**: Application metrics on `/api/metrics` endpoint (30s interval)
- **prometheus**: Self-monitoring (15s interval)
- **node-exporter**: Node system metrics
- **postgres**: PostgreSQL database metrics
- **redis**: Redis cache metrics
- **nginx-ingress**: Kubernetes ingress controller metrics
- **kubernetes**: Cluster-wide metrics (API servers, nodes, pods)

**Alerting Rules** (`alerts/alert-rules.yml`):
- **Critical**: Service down, database connections exhausted, disk space low
- **Warning**: High error rate, high latency, high memory/CPU usage
- **Info**: Business metrics (low invoice creation rate)
- **Evaluation**: 30s intervals with varying for durations

### Grafana Configuration

**Data Sources** (`grafana/provisioning/datasources/datasources.yml`):
- **Prometheus**: Default metrics source
- **Loki**: Log aggregation with Tempo integration
- **Tempo**: Distributed tracing (if configured)
- **CloudWatch**: AWS cloud metrics (optional)

**Dashboard Provisioning** (`grafana/provisioning/dashboards/dashboards.yml`):
- Auto-imports Thai ERP overview dashboard
- Maintains dashboard consistency across environments
- Links data sources to appropriate sources

### Loki & Promtail Configuration

**Loki** (`loki-config.yml`):
- File storage with boltdb-shipper
- Retention policies configured
- Alertmanager integration for alert-driven queries
- Analytics disabled for privacy

**Promtail** (`promtail-config.yml`):
- Docker container log collection
- System log collection
- JSON parsing and label extraction
- Shipping to Loki via HTTP

### Alert Routing

**Alertmanager** (`alerts/alertmanager.yml`):
- **Critical alerts**: Immediate PagerDuty notification
- **Platform team**: Grouped by severity
- **Business team**: Business metric alerts
- **Email/Slack**: General notifications
- **Repeat intervals**: 4-hour repeat for resolved alerts

### Status Page

**status-page.html**: Public-facing system status page
- Real-time system status display
- Service cards with metrics
- Recent incidents timeline
- Auto-refresh every 60 seconds
- Thai ERP branding

## Monitoring Strategy

### Application Metrics
- **HTTP Requests**: Request counts, status codes, response times
- **Database**: Connection counts, query performance
- **Cache**: Redis hit rates, memory usage
- **Business**: Invoice creation rates, transaction volumes

### Infrastructure Metrics
- **Node**: CPU, memory, disk usage
- **Network**: Request rates, bandwidth
- **Kubernetes**: Pod health, resource utilization
- **Storage**: Available disk space, I/O performance

### Log Aggregation
- **Application logs**: Structured JSON logs with labels
- **System logs**: Kernel, service, and application logs
- **Access logs**: Web server access and error logs
- **Audit logs**: Security and compliance logging

### Alert Management
- **Severity levels**: Critical, Warning, Info
- **Escalation paths**: Immediate attention for critical issues
- **Runbook integration**: Links to troubleshooting documentation
- **Silencing capabilities**: Maintenance windows and known issues

## Deployment Considerations

### Environment-Specific Configurations
- **Development**: Local monitoring stack with Docker Compose
- **Staging**: Full stack with production-like scaling
- **Production**: High-availability with persistent storage

### Performance Optimizations
- **Scrape intervals**: Optimized for each service type
- **Data retention**: Configured based on compliance requirements
- **Query optimization**: PromQL queries for efficient metric retrieval
- **Dashboard caching**: Grafana panel caching for improved load times

### Security Considerations
- **Access control**: Grafana authentication and authorization
- **Data encryption**: Secure transport between components
- **Network segmentation**: Dedicated monitoring network zone
- **Audit logging**: All configuration changes tracked

## Common Development Tasks

### Adding New Metrics
1. Implement metrics collection in application code
2. Add Prometheus endpoint if not exists
3. Configure appropriate scrape interval
4. Create dashboards for visualization
5. Set up alerting thresholds

### Creating Dashboards
1. Start with Thai ERP overview template
2. Add panels for new metrics
3. Configure appropriate time ranges
4. Set up alert annotations
5. Share with appropriate teams

### Alert Rule Management
1. Define clear SLA thresholds
2. Create meaningful alert messages
3. Configure appropriate escalation
4. Document runbook procedures
5. Regular threshold review

### Log Format Standards
1. Use JSON structured logging
2. Include relevant labels and timestamps
3. Avoid sensitive information in logs
4. Configure appropriate log levels
5. Implement log rotation policies

## Troubleshooting

### Common Issues
- **Metrics not scraping**: Check endpoint availability and permissions
- **Alerts not firing**: Verify alert rules and thresholds
- **Dashboards loading slowly**: Check data source connectivity and queries
- **Log shipping failures**: Verify Promtail configuration and Loki connectivity
- **Alert delivery problems**: Check Alertmanager routing and credentials

### Maintenance Procedures
- Regular alert rule review and optimization
- Dashboard performance tuning
- Log retention policy adjustments
- Configuration version control
- Backup and restore procedures

## Integration Points

### Application Integration
- **Next.js middleware**: Metrics endpoint in `/api/metrics`
- **Database monitoring**: PostgreSQL exporter integration
- **Cache monitoring**: Redis exporter integration
- **Custom metrics**: Business-specific KPIs

### External Systems
- **PagerDuty**: Critical alert escalation
- **Slack**: Team notifications
- **Email**: General alert distribution
- **CloudWatch**: AWS service monitoring

## Testing and Validation

### Health Checks
- Prometheus scrape targets availability
- Grafana dashboard loading
- Loki query functionality
- Alertmanager routing
- Promtail log shipping

### Alert Testing
- Alert rule validation
- Notification delivery testing
- Escalation path verification
- Runbook accessibility

## Performance Considerations

### Resource Requirements
- **Prometheus**: CPU/memory proportional to metrics volume
- **Grafana**: Memory for dashboards, CPU for query processing
- **Loki**: Storage for logs, CPU for indexing
- **Promtail**: Minimal resource usage
- **Alertmanager**: CPU for alert processing

### Scalability
- **Horizontal scaling**: Prometheus and Grafana can be scaled
- **Partitioning**: Loki can be partitioned by time or labels
- **Caching**: appropriate caching strategies for performance
- **Retention**: Data retention policies to manage storage

## Compliance and Security

### Data Privacy
- Log data sanitization
- Secure storage and transmission
- Access control implementation
- Audit logging for compliance

### Regulatory Requirements
- Data retention policies
- Access monitoring and logging
- Incident response procedures
- Regular security assessments

---

**System Status**: ✅ Monitoring Stack Operational

**Last Updated**: 2026-04-16

For questions or issues, refer to the main AGENTS.md file or run monitoring stack validation tests.