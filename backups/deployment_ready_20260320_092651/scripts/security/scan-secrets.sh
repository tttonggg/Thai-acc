#!/bin/bash
# Secret Scanning Script
# Scans for potential secrets in the codebase

set -e

echo "🔍 Scanning for secrets..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Patterns to search for (regex)
PATTERNS=(
  # API Keys
  'api[_-]?key[\s]*[=:][\s]*["\''][a-zA-Z0-9]{16,}["\'']'
  'apikey[\s]*[=:][\s]*["\''][a-zA-Z0-9]{16,}["\'']'
  
  # AWS Keys
  'AKIA[0-9A-Z]{16}'
  'aws[_-]?secret[_-]?access[_-]?key[\s]*[=:][\s]*["\''][^"\'']{40}["\'']'
  
  # Database URLs with passwords
  'mongodb(\+srv)?://[^:]+:[^@]+@'
  'postgres(ql)?://[^:]+:[^@]+@'
  'mysql://[^:]+:[^@]+@'
  
  # JWT Secrets
  'jwt[_-]?secret[\s]*[=:][\s]*["\''][^"\'']{8,}["\'']'
  
  # Private Keys
  '-----BEGIN (RSA |DSA |EC |OPENSSH )?PRIVATE KEY-----'
  
  # Passwords in URLs
  'https?://[^:]+:[^@]+@'
  
  # Generic secrets
  'password[\s]*[=:][\s]*["\''][^"\'"]{8,}["\'']'
  'secret[\s]*[=:][\s]*["\''][^"\'"]{8,}["\'']'
  'token[\s]*[=:][\s]*["\''][a-zA-Z0-9_\-]{20,}["\'']'
  
  # Environment variables
  'NEXTAUTH_SECRET[\s]*[=:][\s]*["\''][^"\'"]+["\'']'
)

# Files to exclude
EXCLUDE_PATTERNS=(
  'node_modules'
  '.git'
  '*.test.ts'
  '*.spec.ts'
  'test-results'
  'playwright-report'
  'coverage'
  '.next'
  'dist'
)

# Build exclude arguments
EXCLUDE_ARGS=""
for pattern in "${EXCLUDE_PATTERNS[@]}"; do
  EXCLUDE_ARGS="$EXCLUDE_ARGS --exclude-dir=$pattern"
done

FOUND_SECRETS=0

# Search for each pattern
for pattern in "${PATTERNS[@]}"; do
  echo "Checking pattern: ${pattern:0:50}..."
  
  # Use grep to search (rg would be faster but grep is standard)
  RESULTS=$(grep -r -n -E "$pattern" . $EXCLUDE_ARGS 2>/dev/null || true)
  
  if [ ! -z "$RESULTS" ]; then
    echo -e "${RED}⚠️  Potential secret found:${NC}"
    echo "$RESULTS"
    FOUND_SECRETS=$((FOUND_SECRETS + 1))
  fi
done

# Check for .env files
echo ""
echo "Checking for .env files..."
ENV_FILES=$(find . -name ".env*" -type f ! -path "*/node_modules/*" ! -path "*/.next/*" 2>/dev/null || true)

if [ ! -z "$ENV_FILES" ]; then
  echo -e "${YELLOW}⚠️  Found .env files:${NC}"
  echo "$ENV_FILES"
  echo -e "${YELLOW}Make sure these are in .gitignore!${NC}"
fi

# Check .gitignore
echo ""
echo "Checking .gitignore..."
if [ -f ".gitignore" ]; then
  if grep -q ".env" .gitignore; then
    echo -e "${GREEN}✓ .env files are ignored${NC}"
  else
    echo -e "${RED}✗ .env files are NOT in .gitignore!${NC}"
    FOUND_SECRETS=$((FOUND_SECRETS + 1))
  fi
  
  if grep -q "secrets" .gitignore || grep -q "credentials" .gitignore; then
    echo -e "${GREEN}✓ Secrets directories are ignored${NC}"
  fi
else
  echo -e "${RED}✗ No .gitignore file found!${NC}"
  FOUND_SECRETS=$((FOUND_SECRETS + 1))
fi

echo ""
if [ $FOUND_SECRETS -eq 0 ]; then
  echo -e "${GREEN}✅ No obvious secrets found in codebase${NC}"
  exit 0
else
  echo -e "${RED}❌ Found $FOUND_SECRETS potential security issues${NC}"
  exit 1
fi
