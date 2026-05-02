# CI/CD Pipeline — Thai ACC

> GitHub Actions workflows for automated testing, security scanning, and deployment.

---

## Workflows

### 1. Backend CI (`ci-backend.yml`)

**Triggers:** Push/PR to `main` or `develop` when `backend/**` changes

**Jobs:**
| Job | Description |
|-----|-------------|
| `lint-and-test` | Ruff lint + format check, mypy type check, pytest with PostgreSQL |
| `build-docker` | Builds backend Docker image (cached with Buildx) |

**PostgreSQL Service:**
- Uses Postgres 16 Alpine
- Runs migrations before tests
- Generates coverage report

### 2. Frontend CI (`ci-frontend.yml`)

**Triggers:** Push/PR to `main` or `develop` when `frontend/**` changes

**Jobs:**
| Job | Description |
|-----|-------------|
| `lint-and-build` | ESLint, TypeScript type check, Next.js build |
| `build-docker` | Builds frontend Docker image (cached with Buildx) |

### 3. Deploy (`deploy.yml`)

**Triggers:** Push to `main` or manual dispatch

**Steps:**
1. SSH into VPS (`135.181.107.76`)
2. Pull latest code from GitHub
3. Run `docker compose up -d --build`
4. Run Alembic migrations
5. Health check on `:3001/health`
6. Slack notification (success/failure)

**Required Secrets:**
| Secret | Description |
|--------|-------------|
| `VPS_SSH_KEY` | Private SSH key for VPS access |
| `SLACK_WEBHOOK_URL` | Slack webhook for deploy notifications |

### 4. Security Scan (`security.yml`)

**Triggers:** Push/PR to `main`, weekly schedule

**Jobs:**
| Job | Tool | Scans |
|-----|------|-------|
| `pip-audit` | pip-audit | Python dependencies for known CVEs |
| `npm-audit` | npm audit | Node.js dependencies for known CVEs |
| `detect-secrets` | TruffleHog | Committed secrets/credentials |
| `bandit` | Bandit | Python code for security issues |

---

## Branch Protection Rules (Recommended)

Set these in GitHub Repository Settings → Branches:

### `main` branch:
- [ ] Require pull request reviews before merging (1 reviewer)
- [ ] Require status checks to pass:
  - `Backend CI / lint-and-test`
  - `Frontend CI / lint-and-build`
  - `Security Scan / pip-audit`
  - `Security Scan / npm-audit`
- [ ] Require up-to-date branches before merging
- [ ] Restrict pushes that create files larger than 100MB

---

## Setting Up Secrets

Go to GitHub Repository Settings → Secrets and variables → Actions:

```
VPS_SSH_KEY          →  Your VPS private SSH key (~/.ssh/test)
SLACK_WEBHOOK_URL    →  Slack Incoming Webhook URL (optional)
```

---

## Local Testing of Workflows

Use [act](https://github.com/nektos/act) to test workflows locally:

```bash
# Test backend CI
act -j lint-and-test -W .github/workflows/ci-backend.yml

# Test frontend CI
act -j lint-and-build -W .github/workflows/ci-frontend.yml

# Test deploy (dry run)
act -j deploy -W .github/workflows/deploy.yml --secret-file .secrets
```

---

## Deployment Architecture

```
GitHub Push → GitHub Actions → SSH to VPS → Docker Compose → Production
                ↓                    ↓
           Run Tests          Pull Code
           Build Images       Build Images
           Security Scan      Run Migrations
                              Health Check
                              Slack Notify
```

---

## Rollback Procedure

If deployment fails:

```bash
ssh -i ~/.ssh/test root@135.181.107.76
cd /root/thai-acc
git log --oneline -5                    # Find last good commit
git reset --hard <last-good-commit>
docker compose up -d --build
```

Or via GitHub Actions:
1. Go to Actions tab → Deploy workflow
2. Click "Run workflow"
3. Select previous commit SHA

---

*Thai ACC CI/CD — Last Updated: 2026-05-02*
