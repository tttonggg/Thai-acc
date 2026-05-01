# DevOps & CI/CD Documentation

Complete DevOps implementation for Thai Accounting ERP System (Phase H).

## 📋 Table of Contents

1. [CI/CD Pipeline](#cicd-pipeline)
2. [Infrastructure as Code](#infrastructure-as-code)
3. [Monitoring & Alerting](#monitoring--alerting)
4. [Security Scanning](#security-scanning)
5. [Deployment Procedures](#deployment-procedures)

---

## CI/CD Pipeline

### GitHub Actions Workflows

| Workflow            | Purpose                     | Trigger                   |
| ------------------- | --------------------------- | ------------------------- |
| `ci-cd.yml`         | Full CI/CD pipeline         | Push to main/develop, PRs |
| `e2e-tests.yml`     | End-to-end tests            | Push to main/develop, PRs |
| `security-scan.yml` | Security scanning           | Push, PRs, Daily schedule |
| `nightly.yml`       | Nightly comprehensive tests | Daily at 2 AM UTC         |
| `release.yml`       | Release automation          | Tag push                  |

### Pipeline Stages

```
1. Code Quality
   ├── ESLint
   ├── Prettier
   ├── TypeScript type check
   └── Circular dependency check

2. Secret Detection
   └── GitLeaks scan

3. Unit Tests
   ├── Run tests with coverage
   ├── Upload to Codecov
   └── Enforce 90%+ coverage

4. Integration Tests
   ├── PostgreSQL service
   ├── Redis service
   └── API integration tests

5. E2E Tests
   ├── Build application
   ├── Playwright tests (chromium, firefox, webkit)
   └── Upload artifacts

6. Security Scanning
   ├── Trivy filesystem scan
   ├── npm audit
   └── Snyk scan

7. Build & Push
   ├── Multi-arch Docker build
   ├── Push to GHCR
   ├── Trivy container scan
   └── SBOM generation

8. Deploy Staging (Blue-Green)
   └── Automatic on develop branch

9. Deploy Production (Blue-Green)
   └── Manual approval on main branch
```

### Required Secrets

```bash
# GitHub Secrets
AWS_ACCESS_KEY_ID          # AWS credentials for EKS
AWS_SECRET_ACCESS_KEY      # AWS credentials for EKS
CODECOV_TOKEN             # Codecov coverage upload
SLACK_WEBHOOK_URL         # Deployment notifications
SENTRY_DSN                # Error tracking
SNYK_TOKEN                # Snyk vulnerability scanning
GITLEAKS_LICENSE          # GitLeaks secret detection
```

---

## Infrastructure as Code

### Terraform (AWS)

```bash
cd infrastructure/terraform

# Initialize
terraform init

# Plan
terraform plan -var-file=variables.tfvars

# Apply
terraform apply -var-file=variables.tfvars

# Destroy (careful!)
terraform destroy -var-file=variables.tfvars
```

### Components

| Resource     | Purpose                    |
| ------------ | -------------------------- |
| `vpc.tf`     | VPC, subnets, NAT gateways |
| `eks.tf`     | Kubernetes cluster         |
| `rds.tf`     | PostgreSQL database        |
| `alb.tf`     | Application load balancer  |
| `route53.tf` | DNS and SSL certificates   |
| `iam.tf`     | IAM roles and policies     |

### Kubernetes (Raw Manifests)

```bash
# Apply all manifests
kubectl apply -k infrastructure/k8s/

# Or apply individually
kubectl apply -f infrastructure/k8s/namespace.yml
kubectl apply -f infrastructure/k8s/configmap.yml
kubectl apply -f infrastructure/k8s/secret.yml
kubectl apply -f infrastructure/k8s/deployment.yml
kubectl apply -f infrastructure/k8s/service.yml
kubectl apply -f infrastructure/k8s/ingress.yml
kubectl apply -f infrastructure/k8s/hpa.yml
kubectl apply -f infrastructure/k8s/networkpolicy.yml
kubectl apply -f infrastructure/k8s/certificate.yml
```

### Helm

```bash
# Install/Upgrade
helm upgrade --install thai-erp ./infrastructure/helm \
  --namespace thai-erp \
  --create-namespace \
  --values ./infrastructure/helm/values-production.yaml

# Rollback
helm rollback thai-erp -n thai-erp

# Uninstall
helm uninstall thai-erp -n thai-erp
```

### Docker Compose

```bash
# Development
docker-compose up -d

# Production
docker-compose -f docker-compose.production.yml up -d

# With monitoring stack
docker-compose --profile monitoring up -d

# Database migration
docker-compose --profile migrate run --rm migrate

# Database seeding
docker-compose --profile seed run --rm seed
```

---

## Monitoring & Alerting

### Stack Components

| Component    | Purpose             | Port  |
| ------------ | ------------------- | ----- |
| Prometheus   | Metrics collection  | 9090  |
| Grafana      | Visualization       | 3001  |
| Alertmanager | Alert routing       | 9093  |
| Loki         | Log aggregation     | 3100  |
| Promtail     | Log shipping        | -     |
| Jaeger       | Distributed tracing | 16686 |
| Datadog      | APM and monitoring  | -     |

### Access URLs

```
Prometheus:  http://localhost:9090
Grafana:     http://localhost:3001 (admin/admin)
Alertmanager:http://localhost:9093
Jaeger:      http://localhost:16686
```

### Alert Rules

Located in `monitoring/alerts/alert-rules.yml`:

- **HighErrorRate**: Error rate > 5% for 5 minutes
- **ServiceDown**: Service unavailable for 1 minute
- **HighLatency**: 95th percentile latency > 1s
- **HighMemoryUsage**: Memory usage > 85%
- **DatabaseConnectionExhausted**: Connections > 95

### Notification Channels

- **Slack**: `#alerts`, `#platform-alerts`, `#business-alerts`
- **Email**: platform-team@, business-team@
- **PagerDuty**: Critical alerts

---

## Security Scanning

### Container Scanning (Trivy)

```bash
# Scan filesystem
trivy fs .

# Scan Docker image
trivy image thai-erp:latest

# Scan Kubernetes manifests
trivy config infrastructure/k8s/
```

### Secret Detection (GitLeaks)

```bash
# Scan entire history
gitleaks detect --source . --verbose

# Scan staged files only
gitleaks protect --verbose --staged
```

### Dependency Scanning

```bash
# npm audit
npm audit --audit-level=moderate

# Snyk
snyk test --severity-threshold=high

# Custom script
./scripts/security/dependency-check.sh
```

### SBOM Generation

```bash
# Generate SBOM
./scripts/security/generate-sbom.sh

# Output: sbom/sbom.spdx.json, sbom/sbom.cyclonedx.json
```

---

## Deployment Procedures

### Blue-Green Deployment

```bash
# Deploy to staging
./scripts/deployment/blue-green-deploy.sh staging <image-tag>

# Deploy to production
./scripts/deployment/blue-green-deploy.sh production <image-tag>

# Rollback
./scripts/deployment/rollback.sh production
```

### Manual Deployment Steps

1. **Pre-deployment Checks**

   ```bash
   # Run tests
   npm run ci:all

   # Security scan
   npm run security:scan

   # Build image
   docker build -t thai-erp:$TAG .
   ```

2. **Database Backup**

   ```bash
   # Create backup
   kubectl create job backup-$(date +%s) --from=cronjob/database-backup -n production
   ```

3. **Deploy**

   ```bash
   # Update image tag
   kubectl set image deployment/thai-erp thai-erp=thai-erp:$TAG -n production

   # Wait for rollout
   kubectl rollout status deployment/thai-erp -n production
   ```

4. **Verify**

   ```bash
   # Health check
   curl https://thai-erp.example.com/api/health

   # Smoke tests
   ./scripts/test-quick.sh
   ```

### Health Checks

```bash
# Basic health
curl https://thai-erp.example.com/api/health

# Readiness check
curl https://thai-erp.example.com/api/health?ready=true

# Liveness check
curl https://thai-erp.example.com/api/health?live=true

# Full diagnostic (authenticated)
curl -X POST https://thai-erp.example.com/api/health \
  -H "Authorization: Bearer $TOKEN"
```

---

## Environment Variables

### Required Environment Variables

```bash
# Application
NODE_ENV=production
PORT=3000
NEXTAUTH_URL=https://thai-erp.example.com
NEXTAUTH_SECRET=<random-secret>

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Redis
REDIS_URL=redis://host:6379

# Monitoring
SENTRY_DSN=https://...@sentry.io/...
DATADOG_API_KEY=...

# Storage
MINIO_ENDPOINT=minio
MINIO_ACCESS_KEY=...
MINIO_SECRET_KEY=...
```

---

## Troubleshooting

### Common Issues

1. **Build Fails**

   ```bash
   # Clear cache
   npm run clean
   rm -rf .next node_modules
   npm ci
   ```

2. **Database Connection Issues**

   ```bash
   # Check migrations
   npx prisma migrate status

   # Reset (dev only!)
   npx prisma migrate reset
   ```

3. **Kubernetes Pod Issues**

   ```bash
   # Check logs
   kubectl logs -f deployment/thai-erp -n production

   # Check events
   kubectl get events -n production --sort-by=.metadata.creationTimestamp

   # Describe pod
   kubectl describe pod <pod-name> -n production
   ```

4. **Helm Release Issues**

   ```bash
   # Get release history
   helm history thai-erp -n thai-erp

   # Rollback
   helm rollback thai-erp <revision> -n thai-erp
   ```

---

## Best Practices

1. **Always create database backups before production deployments**
2. **Use blue-green deployment for zero-downtime updates**
3. **Monitor error rates for 10 minutes after deployment**
4. **Keep old deployment for 1 hour before scaling down**
5. **Run security scans on every build**
6. **Maintain 90%+ test coverage**
7. **Use infrastructure as code for all environments**
8. **Rotate secrets regularly**
9. **Review and approve dependency updates**
10. **Document all infrastructure changes**

---

## Support

For DevOps support:

- Slack: #platform-team
- Email: devops@thai-erp.example.com
- On-call: PagerDuty rotation
