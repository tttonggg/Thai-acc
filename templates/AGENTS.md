<!-- Parent: ./AGENTS.md -->
<!-- Generated: 2026-04-17 -->

# templates/

## Purpose

CSV import templates for bulk data import into the Thai Accounting ERP system.

## Key Files

| File                     | Description                             |
| ------------------------ | --------------------------------------- |
| `accounts_template.csv`  | Chart of accounts import template       |
| `customers_template.csv` | Customer/AR master data import template |
| `products_template.csv`  | Product catalog import template         |
| `vendors_template.csv`   | Vendor/AP master data import template   |

## For AI Agents

### CSV Import Format

Each template follows the corresponding Prisma model structure with column
headers matching field names.

### Import Process

1. Download template CSV
2. Fill in data following the header format
3. Use admin data import page (`/api/import/*` routes)
4. Validate CSV format before import

### Template Structure

| Template  | Used By                         |
| --------- | ------------------------------- |
| accounts  | Chart of accounts bulk creation |
| customers | AR customer master              |
| products  | Product catalog                 |
| vendors   | AP vendor master                |
