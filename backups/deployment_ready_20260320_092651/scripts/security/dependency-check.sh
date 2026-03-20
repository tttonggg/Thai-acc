#!/bin/bash
# Dependency Security Check Script
# Checks for known vulnerabilities in dependencies

set -e

echo "🔍 Checking dependencies for vulnerabilities..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if npm is available
if ! command -v npm &> /dev/null; then
  echo -e "${RED}❌ npm not found${NC}"
  exit 1
fi

# Run npm audit
echo ""
echo "Running npm audit..."
npm audit --audit-level=high || true

# Check for outdated packages
echo ""
echo "Checking for outdated packages..."
npm outdated || true

# Generate security report
echo ""
echo "Generating security report..."
npm audit --json > security-report.json 2>/dev/null || true

if [ -f "security-report.json" ]; then
  # Parse and display summary
  HIGH_VULNS=$(cat security-report.json | grep -o '"severity":"high"' | wc -l || echo 0)
  CRITICAL_VULNS=$(cat security-report.json | grep -o '"severity":"critical"' | wc -l || echo 0)
  MODERATE_VULNS=$(cat security-report.json | grep -o '"severity":"moderate"' | wc -l || echo 0)
  
  echo ""
  echo "=== Security Summary ==="
  echo -e "Critical: ${RED}$CRITICAL_VULNS${NC}"
  echo -e "High: ${YELLOW}$HIGH_VULNS${NC}"
  echo -e "Moderate: $MODERATE_VULNS"
  
  if [ "$CRITICAL_VULNS" -gt 0 ]; then
    echo -e "${RED}❌ Critical vulnerabilities found!${NC}"
    exit 1
  elif [ "$HIGH_VULNS" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  High severity vulnerabilities found${NC}"
    exit 0
  else
    echo -e "${GREEN}✅ No high or critical vulnerabilities found${NC}"
    exit 0
  fi
else
  echo -e "${GREEN}✅ No vulnerabilities found${NC}"
  exit 0
fi
