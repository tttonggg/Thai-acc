# AGENTS.md - Infrastructure Operations

This file provides essential guidance for AI coding agents working on **Thai
Accounting ERP Infrastructure** - DevOps, Docker, Kubernetes, and cloud
deployment configurations.

## Parent Reference

- **Parent**: [../AGENTS.md](../AGENTS.md) - Main project documentation

## Infrastructure Overview

The infrastructure directory contains complete DevOps and deployment
configurations for the Thai Accounting ERP system using modern cloud-native
technologies. The setup supports multi-environment deployments with blue-green
deployment strategies, automated scaling, and comprehensive monitoring.

## Directory Structure

```
infrastructure/
├── docker/                    # Docker configurations (if exists)
├── helm/                     # Kubernetes Helm charts
│   ├── Chart.yaml           # Chart metadata
│   ├── values.yaml          # Default values
│   ├── values-production.yaml # Production overrides
│   └── templates/           # Kubernetes templates
│       ├── _helpers.tpl     # Template helpers
│       ├── deployment.yaml  # Application deployment
│       ├── service.yaml     # Kubernetes service
│       ├── hpa.yaml         # Horizontal pod autoscaler
│       ├── secret.yaml      # Secret management
│       ├── pdb.yaml         # Pod disruption budget
│       ├── servicemonitor.yaml # Prometheus monitoring
│       ├── pvc.yaml         # Persistent volume claim
│       └── ingress.yaml     # Ingress configuration
├── k8s/                      # Kubernetes plain manifests
│   ├── namespace.yml        # Kubernetes namespace
│   ├── configmap.yml         # Configuration map
│   ├── secret.yml           # Kubernetes secrets
│   ├── deployment.yml       # Main deployment
│   ├── service.yml          # Service definition
│   ├── ingress.yml          # Ingress configuration
│   ├── hpa.yml              # Horizontal pod autoscaler
│   ├── pvc.yml              # Persistent volumes
│   ├── serviceaccount.yml   # Service account
│   ├── kustomization.yaml  # Kustomize configuration
│   ├── networkpolicy.yml    # Network policies
│   ├── certificate.yml      # TLS certificates
│   ├── datadog-agent.yml    # Datadog agent
│   └── patches/            # Kustomize patches
│       └── replicas.yaml    # Replica count patches
├── nginx/                    # NGINX reverse proxy
│   ├── nginx.conf           # Main NGINX configuration
│   └── includes/            # NGINX include files
│       └── ssl.conf         # SSL configuration
└── terraform/               # Infrastructure as Code
    ├── main.tf              # Main Terraform configuration
    ├── variables.tf         # Terraform variables
    ├── eks.tf               # EKS cluster configuration
    ├── vpc.tf               # VPC networking
    ├── rds.tf               # RDS database
    ├── iam.tf               # IAM roles and policies
    ├── route53.tf           # DNS configuration
    ├── alb.tf               # Application load balancer
    ├── s3.tf                # S3 storage
    ├── cloudfront.tf        # CloudFront CDN
    ├── outputs.tf           # Outputs and resources
    └── variables.tfvars.example # Variable example file
```

## Technology Stack

| Component                  | Technology                | Purpose                            |
| -------------------------- | ------------------------- | ---------------------------------- |
| **Containerization**       | Docker                    | Application containerization       |
| **Orchestration**          | Kubernetes                | Container orchestration            |
| **Package Management**     | Helm                      | Kubernetes package management      |
| **Infrastructure as Code** | Terraform                 | AWS infrastructure provisioning    |
| **Reverse Proxy**          | NGINX                     | Load balancing and SSL termination |
| **CDN**                    | AWS CloudFront            | Content delivery network           |
| **Database**               | AWS RDS                   | Managed PostgreSQL database        |
| **Monitoring**             | Prometheus + Grafana      | Application metrics                |
| **Container Registry**     | GitHub Container Registry | Image storage                      |
| **Load Balancer**          | AWS ALB                   | Application load balancing         |

## Deployment Strategies

### 1. Blue-Green Deployment

The infrastructure supports blue-green deployments for zero-downtime releases:

```yaml
# Two deployments available
thai-erp-blue   # Active production environment
thai-erp-green  # Staging/next environment

# NGINX routing based on deployment color
upstream app_blue { server app-blue:3000; }
upstream app_green { server app-green:3000; }

map $http_x_deployment_color $upstream_backend {
    default app_blue;
    green app_green;
    blue app_blue;
}
```

### 2. Canary Deployment

Traffic can be gradually shifted using NGINX configuration:

```nginx
# Percentage-based routing
location /api/canary {
    proxy_pass http://canary_upstream;
}

upstream canary_upstream {
    server app-blue:3000 weight=80;  # 80% traffic
    server app-green:3000 weight=20; # 20% traffic
}
```

### 3. Rolling Updates

Kubernetes handles rolling updates automatically:

```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1 # Max pods added
    maxUnavailable: 0 # Max pods unavailable
```

## Docker Deployment

### Development Build

```bash
# Build Docker image
bun run docker:build

# Run development container
bun run docker:run

# Full development stack
bun run docker:compose:up
```

### Production Build

```bash
# Standalone build for production
bun run build
# Output: .next/standalone/server.js

# Production Docker image
docker build -t thai-erp:latest .
```

**CRITICAL**: In standalone mode, update `.next/standalone/.env` with absolute
paths:

```env
DATABASE_URL=file:/absolute/path/to/.next/standalone/prisma/dev.db
```

## Kubernetes Deployment

### Prerequisites

```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/darwin/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/

# Install Helm
curl https://baltocdn.com/helm/signing.asc | gpg --dearmor | sudo tee /usr/share/keyrings/helm.gpg > /dev/null
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/helm.gpg] https://baltocdn.com/helm/stable/debian/ all main" | sudo tee /etc/apt/sources.list.d/helm-stable-debian.list
sudo apt-get update
sudo apt-get install helm

# Install terraform
sudo apt-get install terraform
```

### Deployment Commands

```bash
# Deploy using Helm
helm install thai-erp ./helm --namespace thai-erp --create-namespace

# Deploy using Kustomize
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -n thai-erp
kubectl get svc -n thai-erp
kubectl get ingress -n thai-erp

# View logs
kubectl logs -f deployment/thai-erp -n thai-erp

# Scale deployment
kubectl scale deployment thai-erp --replicas=5 -n thai-erp
```

### Monitoring and Health Checks

```bash
# Check application health
curl https://thai-erp.example.com/api/health

# Check NGINX health
curl http://nginx-service/thai-erp.example.com/health

# View pod resource usage
kubectl top pods -n thai-erp

# View deployment status
kubectl rollout status deployment/thai-erp -n thai-erp
```

## Terraform Infrastructure

### Backend Configuration

```terraform
terraform {
  backend "s3" {
    bucket         = "thai-erp-terraform-state"
    key            = "infrastructure/terraform.tfstate"
    region         = "ap-southeast-1"
    encrypt        = true
    dynamodb_table = "thai-erp-terraform-locks"
  }
}
```

### AWS Resources

The infrastructure creates:

1. **VPC Network** with public/private subnets
2. **EKS Cluster** for Kubernetes orchestration
3. **RDS PostgreSQL** database with automated backups
4. **Application Load Balancer** for HTTPS termination
5. **Route53 DNS** for domain management
6. **CloudFront CDN** for static assets
7. **S3 Storage** for file uploads and backups
8. **IAM Roles** with least privilege access

### Terraform Commands

```bash
# Initialize Terraform
terraform init

# Plan infrastructure changes
terraform plan

# Apply infrastructure changes
terraform apply

# Destroy infrastructure
terraform destroy

# Refresh state
terraform refresh

# Output infrastructure details
terraform output
```

### Variable Configuration

Copy `variables.tfvars.example` to `terraform.tfvars`:

```hcl
aws_region          = "ap-southeast-1"
environment        = "production"
domain_name        = "thai-erp.example.com"
eks_node_instance_types = ["t3.medium", "t3.large"]
rds_instance_class = "db.t3.medium"
enable_monitoring = true
enable_waf = true
```

## NGINX Configuration

### Key Features

- **SSL Termination**: HTTPS with Let's Encrypt certificates
- **Rate Limiting**: API and authentication endpoint protection
- **Caching**: Static asset aggressive caching
- **Load Balancing**: Blue-green deployment routing
- **Security Headers**: Comprehensive security policies
- **Health Checks**: Application monitoring endpoints

### Performance Optimizations

```nginx
# Static file caching
location /_next/static {
    expires 1y;
    add_header Cache-Control "public, immutable";
    access_log off;
}

# Gzip compression
gzip on;
gzip_comp_level 6;
gzip_types text/plain text/css application/json;

# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;
```

### Security Headers

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self';" always;
```

## Environment Variables

### Production Required

```env
# Application
NODE_ENV=production
PORT=3000
NEXT_TELEMETRY_DISABLED=1
LOG_LEVEL=info
LOG_FORMAT=json

# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@rds-endpoint:5432/thai_erp

# Authentication
NEXTAUTH_URL=https://thai-erp.example.com
NEXTAUTH_SECRET=32-character-secret-key

# Redis (if used)
REDIS_URL=redis://redis-cluster:6379

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
```

### Helm Values Override

```yaml
# Override in values-production.yaml
replicaCount: 5
resources:
  limits:
    cpu: 2000m
    memory: 2Gi
  requests:
    cpu: 500m
    memory: 1Gi

autoscaling:
  enabled: true
  minReplicas: 5
  maxReplicas: 15
  targetCPUUtilizationPercentage: 70
```

## Monitoring and Observability

### Prometheus Metrics

Application exposes metrics at `/api/metrics`:

```yaml
# Prometheus annotations
prometheus.io/scrape: 'true'
prometheus.io/port: '3000'
prometheus.io/path: '/api/metrics'
```

### Health Endpoints

- `/api/health` - Application health check
- `/api/health?ready=true` - Readiness probe
- `/health` - NGINX health check

### Logging

```nginx
# NGINX access logging
log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                '$status $body_bytes_sent "$http_referer" '
                '"$http_user_agent" "$http_x_forwarded_for" '
                'rt=$request_time';

access_log /var/log/nginx/access.log main;
```

## Security Considerations

### Kubernetes Security

```yaml
# Pod security context
podSecurityContext:
  runAsNonRoot: true
  runAsUser: 1001
  fsGroup: 1001

# Container security context
securityContext:
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
  capabilities:
    drop:
      - ALL
```

### Network Policies

```yaml
# Network policy example
kind: NetworkPolicy
metadata:
  name: thai-erp-network-policy
spec:
  podSelector:
    matchLabels:
      app: thai-erp
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: thai-erp
```

### AWS Security

- **VPC**: Private subnets for database tier
- **Security Groups**: Restricted access patterns
- **IAM**: Least privilege roles
- **WAF**: Web Application Firewall
- **CloudFront**: DDoS protection
- **RDS**: Automated backups and encryption

## Backup and Disaster Recovery

### Database Backup

```bash
# RDS automated backups (enabled by default)
# Daily backups with 7-day retention
# Point-in-time recovery available

# Manual backup via pg_dump
pg_dump thai_erp > backup.sql

# Backup to S3
aws s3 cp backup.sql s3://thai-erp-backups/
```

### Infrastructure Backup

```bash
# Terraform state backup
aws s3 cp terraform.tfstate s3://thai-erp-terraform-state-backups/

# Kubernetes configuration backup
kubectl get all -n thai-erp -o yaml > k8s-backup.yaml
```

## Common Deployment Tasks

### Updating Application

```bash
# 1. Build new image
bun run build
docker build -t thai-erp:latest .

# 2. Push to registry
docker push ghcr.io/thai-erp/thai-erp:latest

# 3. Deploy via Helm
helm upgrade thai-erp ./helm --namespace thai-erp

# 4. Monitor rollout
kubectl rollout status deployment/thai-erp -n thai-erp
```

### Scaling Applications

```bash
# Horizontal scaling
kubectl scale deployment thai-erp --replicas=8 -n thai-erp

# Auto-scaling (if HPA enabled)
kubectl autoscale deployment thai-erp --min=3 --max=10 --cpu-percent=70 -n thai-erp
```

### Emergency Rollback

```bash
# Rollback deployment
kubectl rollout undo deployment/thai-erp --to-revision=2 -n thai-erp

# Scale down problematic deployment
kubectl scale deployment thai-erp --replicas=0 -n thai-erp
```

## Troubleshooting

### Common Issues

1. **Database Connection**

   ```bash
   # Check database connectivity
   kubectl exec -it deployment/thai-erp -n thai-erp -- nslookup rds-endpoint
   ```

2. **Pod Failures**

   ```bash
   # Check pod events
   kubectl describe pod pod-name -n thai-erp
   kubectl logs pod-name -n thai-erp --previous
   ```

3. **NGINX Issues**
   ```bash
   # Check NGINX configuration
   docker exec nginx nginx -t
   docker exec nginx nginx -s reload
   ```

### Debug Commands

```bash
# Debug pod connectivity
kubectl exec -it pod-name -n thai-erp -- wget -qO- http://localhost:3000/api/health

# Check DNS resolution
kubectl exec -it pod-name -n thai-erp -- nslookup google.com

# Resource usage
kubectl top pods -n thai-erp --sort-by=cpu
```

## Development Guidelines

### Adding New Infrastructure

1. **Terraform**: Add new resources in appropriate `.tf` files
2. **Helm**: Update templates for new configurations
3. **K8s**: Update manifests in `k8s/` directory
4. **NGINX**: Add routing configurations for new services

### Security Best Practices

1. **Secret Management**: Use Kubernetes secrets or AWS Secrets Manager
2. **Network Security**: Implement network policies and security groups
3. **Least Privilege**: Use minimal IAM roles and permissions
4. **Regular Updates**: Keep dependencies updated for security patches

### Performance Optimization

1. **Resource Limits**: Set appropriate CPU/memory limits
2. **Caching**: Implement static asset caching
3. **Load Balancing**: Use multiple availability zones
4. **Monitoring**: Regular review of metrics and logs

---

**Infrastructure Status**: ✅ Production Ready

**Last Updated**: 2026-04-16

For questions or issues, refer to the main [../AGENTS.md](../AGENTS.md) for
general project guidance.
