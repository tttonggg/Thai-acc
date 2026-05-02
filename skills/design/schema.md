# Skill: Database Schema Design

## Description
Design PostgreSQL database schemas for Thai accounting systems. Includes table definitions, relationships, indexes, constraints, and Thai-specific data types.

## Trigger
Use when:
- Adding new modules (invoices, quotations, inventory)
- Refactoring existing schema
- Planning multi-tenancy (companies/branches)
- Designing for Thai accounting compliance

## Assigned Model
`opencode-go/glm-5.1` (clean SQL, strong reasoning about data relationships)

## Detailed Instruction / SOP

### Step 1: Entity Identification
Identify entities from requirements:
- Core entities (companies, users, contacts)
- Document entities (quotations, invoices, receipts)
- Product entities (products, services, inventory)
- Accounting entities (accounts, journals, entries)
- Tax entities (vat_records, wht_certificates)

### Step 2: Table Design
For each table, define:
```sql
CREATE TABLE quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    branch_id UUID REFERENCES branches(id),
    quotation_number VARCHAR(50) NOT NULL,
    contact_id UUID NOT NULL REFERENCES contacts(id),
    issue_date DATE NOT NULL,
    expiry_date DATE,
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    vat_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft, sent, accepted, expired, cancelled
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP, -- soft delete
    UNIQUE(company_id, quotation_number)
);
```

### Step 3: Relationship Design
- One-to-many: Company → Quotations
- Many-to-many: Quotations ↔ Products (via quotation_items)
- Self-referencing: Quotations → Invoices (converted_from)

### Step 4: Index Strategy
```sql
CREATE INDEX idx_quotations_company ON quotations(company_id);
CREATE INDEX idx_quotations_contact ON quotations(contact_id);
CREATE INDEX idx_quotations_status ON quotations(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_quotations_dates ON quotations(issue_date, expiry_date);
```

### Step 5: Constraints
- NOT NULL for required fields
- CHECK constraints (status in valid values, amounts >= 0)
- FOREIGN KEY with ON DELETE behavior
- UNIQUE constraints for document numbers per company

### Step 6: Audit Trail
Every table must have:
- `created_at`, `updated_at`
- `created_by`, `updated_by`
- `deleted_at` (soft delete)

## Thai-Specific Considerations
- **Document numbers**: Thai format (QT-2026-0001) with company prefix
- **Tax IDs**: 13-digit Thai tax ID validation
- **Currency**: DECIMAL(15,2) for THB (handles millions)
- **Dates**: Store as DATE/TIMESTAMP, display in Buddhist calendar
- **Multi-branch**: Every table has company_id + optional branch_id

## Output Format
Save to: `/docs/design/{module}-schema.md` + migration file
