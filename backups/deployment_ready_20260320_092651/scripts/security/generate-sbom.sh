#!/bin/bash
# SBOM Generation Script
# Generates Software Bill of Materials

set -e

echo "📦 Generating Software Bill of Materials (SBOM)..."

OUTPUT_DIR="sbom"
mkdir -p "$OUTPUT_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Generate npm SBOM
echo "Generating npm SBOM..."
npm sbom --format=spdx-json > "$OUTPUT_DIR/sbom-npm-$TIMESTAMP.json" 2>/dev/null || {
  echo "npm sbom command not available, using alternative..."
  npm list --json --all > "$OUTPUT_DIR/dependencies-$TIMESTAMP.json" 2>/dev/null || true
}

# Generate package-lock SBOM (always works)
if [ -f "package-lock.json" ]; then
  echo "Copying package-lock.json..."
  cp package-lock.json "$OUTPUT_DIR/package-lock-$TIMESTAMP.json"
fi

# Generate human-readable report
echo "Generating human-readable report..."
{
  echo "# Software Bill of Materials"
  echo ""
  echo "Generated: $(date)"
  echo ""
  echo "## Application"
  echo "- Name: $(node -p "require('./package.json').name" 2>/dev/null || echo 'Unknown')"
  echo "- Version: $(node -p "require('./package.json').version" 2>/dev/null || echo 'Unknown')"
  echo ""
  echo "## Dependencies"
  echo ""
  echo "### Production Dependencies"
  npm list --production --depth=0 2>/dev/null || echo "Unable to list dependencies"
  echo ""
  echo "### Development Dependencies"
  npm list --development --depth=0 2>/dev/null || echo "Unable to list dependencies"
  echo ""
  echo "## Node Version"
  echo "- Node: $(node --version)"
  echo "- npm: $(npm --version)"
} > "$OUTPUT_DIR/README-$TIMESTAMP.md"

echo ""
echo "✅ SBOM generated in $OUTPUT_DIR/"
echo ""
ls -la "$OUTPUT_DIR/"
