#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# Thai ACC Pre-Deploy Verification
# Run this BEFORE deploy.sh or CI deploy to catch missing files.
# ============================================================

ERRORS=0

echo "========================================"
echo " Pre-Deploy File Check"
echo "========================================"

# --- Required committed files (must be tracked by git) ---
COMMITTED_FILES=(
  "backend/Dockerfile"
  "backend/requirements.txt"
  "frontend/Dockerfile"
  "frontend/package.json"
  "docker-compose.prod.yml"
  "nginx.prod.conf"
  "deploy.sh"
)

for f in "${COMMITTED_FILES[@]}"; do
  if [ ! -f "$f" ]; then
    echo "❌ MISSING: $f (required committed file)"
    ERRORS=$((ERRORS + 1))
  elif git check-ignore -q "$f" 2>/dev/null; then
    echo "🚨 GITIGNORED: $f is tracked but also matched by .gitignore!"
    ERRORS=$((ERRORS + 1))
  else
    echo "✅ $f"
  fi
done

# --- Required local files (gitignored but manually managed) ---
GITIGNORED_FILES=(
  ".env"
)

for f in "${GITIGNORED_FILES[@]}"; do
  if [ ! -f "$f" ]; then
    echo "❌ MISSING: $f (gitignored but required for deploy)"
    ERRORS=$((ERRORS + 1))
  else
    echo "✅ $f (gitignored, present locally)"
  fi
done

# --- Validate .env has required keys ---
if [ -f ".env" ]; then
  REQUIRED_KEYS=("DB_PASSWORD" "JWT_SECRET_KEY")
  for key in "${REQUIRED_KEYS[@]}"; do
    if ! grep -q "^${key}=" .env; then
      echo "❌ .env missing required key: $key"
      ERRORS=$((ERRORS + 1))
    fi
  done
fi

# --- Warn about files that SHOULD be gitignored but aren't ---
SENSITIVE_PATTERNS=("*.pem" "*.key" "id_rsa" ".env.local")
for pattern in "${SENSITIVE_PATTERNS[@]}"; do
  matches=$(find . -maxdepth 2 -name "$pattern" -not -path './.git/*' 2>/dev/null || true)
  if [ -n "$matches" ]; then
    for m in $matches; do
      if ! git check-ignore -q "$m" 2>/dev/null; then
        echo "⚠️  SENSITIVE & UNTRACKED: $m (should probably be gitignored)"
      fi
    done
  fi
done

# --- Summary ---
echo ""
if [ $ERRORS -eq 0 ]; then
  echo "========================================"
  echo " ✅ All checks passed. Safe to deploy."
  echo "========================================"
  exit 0
else
  echo "========================================"
  echo " ❌ $ERRORS problem(s) found. Fix before deploying."
  echo "========================================"
  exit 1
fi
