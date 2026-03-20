#!/bin/bash

###############################################################################
# Database Verification Script
###############################################################################
# Verifies database integrity after test execution
# Usage: ./scripts/verify-database.sh
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}📊 DATABASE VERIFICATION${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Check if Prisma is available
if ! command -v npx prisma &> /dev/null; then
    echo -e "${RED}Error: Prisma CLI not found${NC}"
    exit 1
fi

# Database path
DB_PATH="prisma/dev.db"

if [ ! -f "$DB_PATH" ]; then
    echo -e "${RED}Error: Database not found at $DB_PATH${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Database found: $DB_PATH${NC}"
echo ""

# Get record counts
echo -e "${BLUE}Record Counts:${NC}"
echo ""

TABLES=(
    "User"
    "ChartOfAccount"
    "Customer"
    "Vendor"
    "Product"
    "Invoice"
    "PurchaseInvoice"
    "Receipt"
    "Payment"
    "JournalEntry"
    "JournalLine"
    "VatRecord"
    "WithholdingTax"
    "Warehouse"
    "StockBalance"
    "StockMovement"
    "Asset"
    "BankAccount"
    "Cheque"
    "PettyCashFund"
    "PettyCashVoucher"
    "Employee"
    "PayrollRun"
)

for table in "${TABLES[@]}"; do
    COUNT=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) as count FROM $table;" 2>/dev/null | grep -v "^count$" | head -n 2 | tail -n 1 || echo "0")
    printf "  %-25s %s\n" "$table:" "$COUNT"
done

echo ""

# Verify journal entry balances
echo -e "${BLUE}Journal Entry Balance Verification:${NC}"
echo ""

BALANCE_QUERY="
SELECT
    SUM(CASE WHEN debit > 0 THEN debit ELSE 0 END) as total_debit,
    SUM(CASE WHEN credit > 0 THEN credit ELSE 0 END) as total_credit
FROM JournalLine;
"

RESULT=$(npx prisma db execute --stdin <<< "$BALANCE_QUERY" 2>/dev/null || echo "0|0")

TOTAL_DEBIT=$(echo "$RESULT" | cut -d'|' -f1 | grep -E '^[0-9]+$' || echo "0")
TOTAL_CREDIT=$(echo "$RESULT" | cut -d'|' -f2 | grep -E '^[0-9]+$' || echo "0")

echo "  Total Debit:  $TOTAL_DEBIT"
echo "  Total Credit: $TOTAL_CREDIT"

if [ "$TOTAL_DEBIT" = "$TOTAL_CREDIT" ]; then
    echo -e "  ${GREEN}✅ Balanced${NC}"
else
    DIFFERENCE=$((TOTAL_DEBIT - TOTAL_CREDIT))
    echo -e "  ${RED}❌ Not balanced (difference: $DIFFERENCE)${NC}"
fi

echo ""

# Check for orphaned records
echo -e "${BLUE}Orphaned Record Check:${NC}"
echo ""

ORPHAN_ISSUES=0

# Check customers without company
CUSTOMERS_NO_COMPANY=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM Customer WHERE companyId IS NULL;" 2>/dev/null | grep -E '^[0-9]+$' || echo "0")
if [ "$CUSTOMERS_NO_COMPANY" -gt 0 ]; then
    echo -e "  ${RED}❌ $CUSTOMERS_NO_COMPANY customers without company${NC}"
    ORPHAN_ISSUES=$((ORPHAN_ISSUES + 1))
fi

# Check invoices without journal entry
INVOICES_NO_JE=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM Invoice WHERE journalEntryId IS NULL;" 2>/dev/null | grep -E '^[0-9]+$' || echo "0")
if [ "$INVOICES_NO_JE" -gt 0 ]; then
    echo -e "  ${RED}❌ $INVOICES_NO_JE invoices without journal entry${NC}"
    ORPHAN_ISSUES=$((ORPHAN_ISSUES + 1))
fi

# Check receipts without journal entry
RECEIPTS_NO_JE=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM Receipt WHERE journalEntryId IS NULL;" 2>/dev/null | grep -E '^[0-9]+$' || echo "0")
if [ "$RECEIPTS_NO_JE" -gt 0 ]; then
    echo -e "  ${RED}❌ $RECEIPTS_NO_JE receipts without journal entry${NC}"
    ORPHAN_ISSUES=$((ORPHAN_ISSUES + 1))
fi

# Check payments without journal entry
PAYMENTS_NO_JE=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM Payment WHERE journalEntryId IS NULL;" 2>/dev/null | grep -E '^[0-9]+$' || echo "0")
if [ "$PAYMENTS_NO_JE" -gt 0 ]; then
    echo -e "  ${RED}❌ $PAYMENTS_NO_JE payments without journal entry${NC}"
    ORPHAN_ISSUES=$((ORPHAN_ISSUES + 1))
fi

if [ $ORPHAN_ISSUES -eq 0 ]; then
    echo -e "  ${GREEN}✅ No orphaned records found${NC}"
fi

echo ""

# Summary
echo -e "${BLUE}================================================${NC}"
if [ $ORPHAN_ISSUES -eq 0 ] && [ "$TOTAL_DEBIT" = "$TOTAL_CREDIT" ]; then
    echo -e "${GREEN}✅ DATABASE VERIFICATION PASSED${NC}"
    EXIT_CODE=0
else
    echo -e "${RED}❌ DATABASE VERIFICATION FAILED${NC}"
    echo -e "  Issues found: $ORPHAN_ISSUES"
    EXIT_CODE=1
fi
echo -e "${BLUE}================================================${NC}"

exit $EXIT_CODE
