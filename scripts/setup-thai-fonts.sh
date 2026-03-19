#!/bin/bash

###############################################################################
# Thai Font Setup Script for PDFKit
# สคริปต์ติดตั้งฟอนต์ภาษาไทยสำหรับ PDFKit
#
# This script helps set up Thai TTF fonts for PDFKit to use
# สคริปต์นี้ช่วยติดตั้งฟอนต์ TTF ภาษาไทยสำหรับให้ PDFKit ใช้งาน
###############################################################################

set -e  # Exit on error

FONTS_DIR="public/fonts"
BACKUP_DIR="backups/fonts-$(date +%Y%m%d_%H%M%S)"

echo "================================================"
echo "Thai Font Setup for PDFKit"
echo "ติดตั้งฟอนต์ภาษาไทยสำหรับ PDFKit"
echo "================================================"
echo ""

# Check if public/fonts directory exists
if [ ! -d "$FONTS_DIR" ]; then
  echo "Creating fonts directory..."
  mkdir -p "$FONTS_DIR"
fi

# Backup existing font files (even if they're HTML)
echo "Backing up existing font files to $BACKUP_DIR..."
mkdir -p "$BACKUP_DIR"
if ls $FONTS_DIR/*.ttf 1> /dev/null 2>&1; then
  cp $FONTS_DIR/*.ttf $BACKUP_DIR/
  echo "✅ Backup complete"
else
  echo "ℹ️  No existing font files found"
fi
echo ""

# Check for system fonts (macOS)
echo "Checking for Thai fonts on system..."
if [ "$(uname)" = "Darwin" ]; then
  # Check for TH Sarabun New in macOS system fonts
  SYSTEM_FONTS="/System/Library/Fonts/Supplemental"
  if [ -f "$SYSTEM_FONTS/THSarabunNew.ttc" ]; then
    echo "✅ Found THSarabunNew in system fonts"
    echo "   Location: $SYSTEM_FONTS/THSarabunNew.ttc"

    # Copy to public/fonts (note: TTC files need special handling)
    echo "⚠️  TTC files cannot be used directly by PDFKit"
    echo "   Need to extract TTF from TTC or use alternative source"
  fi
fi
echo ""

# Try to download from alternative sources
echo "Attempting to download Thai fonts..."
echo ""

# Method 1: Try Google Fonts direct download
echo "Method 1: Google Fonts (Sarabun)..."
FONT_URL="https://fonts.gstatic.com/s/sarabun/v15/DtVjJx26TKEr37c9YB5SbQBO.woff2"
if curl -f -s -o "$FONTS_DIR/Sarabun-Regular.woff2" "$FONT_URL" 2>/dev/null; then
  echo "✅ Downloaded Sarabun-Regular.woff2"
  echo "⚠️  Note: PDFKit needs TTF format, WOFF2 may not work"
else
  echo "❌ Failed to download from Google Fonts"
fi
echo ""

# Method 2: Use npm package (recommended)
echo "Method 2: NPM Font Package (Recommended)..."
echo "Run: npm install @fontsource/sarabun"
echo "Then copy files from: node_modules/@fontsource/sarabun/files/"
echo ""

# Method 3: Manual instructions
echo "Method 3: Manual Download (Most Reliable)..."
echo "-------------------------------------------"
echo "1. Visit: https://fonts.google.com/?subset=thai&family=Sarabun"
echo "2. Click 'Download family'"
echo "3. Extract the ZIP file"
echo "4. Copy TTF files to: $FONTS_DIR/"
echo "   - static/Sarabun-Regular.ttf -> $FONTS_DIR/THSarabunNew.ttf"
echo "   - static/Sarabun-Bold.ttf -> $FONTS_DIR/THSarabunNew-Bold.ttf"
echo ""

# Check if we have valid fonts now
echo "Checking font files..."
if ls $FONTS_DIR/*.ttf 1> /dev/null 2>&1; then
  echo "Found TTF files:"
  ls -lh $FONTS_DIR/*.ttf | awk '{print "  " $9 " (" $5 ")"}'

  # Check if they're actually TTF files
  echo ""
  echo "Verifying file formats..."
  for font in $FONTS_DIR/*.ttf; do
    filetype=$(file "$font" | cut -d: -f2 | xargs)
    if [[ "$filetype" == *"TrueType"* ]] || [[ "$filetype" == *"TTF"* ]]; then
      echo "✅ $(basename $font): Valid TTF file"
    else
      echo "❌ $(basename $font): $filetype"
    fi
  done
else
  echo "❌ No TTF files found in $FONTS_DIR/"
fi
echo ""

# Test with PDFKit
if ls $FONTS_DIR/*.ttf 1> /dev/null 2>&1; then
  echo "Testing PDFKit with fonts..."
  if npx tsx src/lib/__tests__/pdfkit-test.ts 2>/dev/null; then
    echo "✅ PDFKit test passed!"
  else
    echo "⚠️  PDFKit test failed - fonts may need conversion"
  fi
fi

echo ""
echo "================================================"
echo "Setup Complete"
echo "================================================"
echo ""
echo "Next Steps:"
echo "1. Ensure valid TTF files are in: $FONTS_DIR/"
echo "2. Run: npx tsx src/lib/__tests__/pdfkit-test.ts"
echo "3. Check generated PDF: pdfkit-thai-test.pdf"
echo ""
echo "For more information, see: PDFKIT_MIGRATION_GUIDE.md"
echo ""
