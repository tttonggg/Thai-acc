# AGENTS.md - Documentation Directory

This file provides guidance for AI coding agents working with the **Documentation Directory** (`docs/`) of the Thai Accounting ERP System.

## Purpose

The `docs/` directory contains comprehensive documentation for the Thai Accounting ERP System, including:

- **Architecture Decision Records** (adr/) - Technical rationale and design decisions
- **Database Documentation** (database/) - Database setup, migration guides, and technical specifications
- **User Tutorials** (tutorials/) - Step-by-step user guides and workflows

## Key Files

### Primary Documentation Files
- `README.md` - General project overview and getting started information
- `DEVELOPER_GUIDE.md` - Detailed development instructions
- `FAQ.md` - Frequently asked questions
- `USER_MANUAL.md` - Complete user manual
- `SECURITY_HARDENING.md` - Security implementation details
- `BACKUP_RESTORE.md` - Backup and restore procedures
- `DEPLOYMENT.md` - Deployment instructions
- `CONFIGURATION.md` - System configuration details

### Technical Specifications
- `DATABASE_SETUP.md` - Database setup procedures
- `MIGRATE_TO_POSTGRESQL.md` - PostgreSQL migration guide
- `WEBHOOK_EVENTS.md` - Webhook event documentation
- `GRAPHQL_API.md` - GraphQL API reference
- `PENTEST_REPORT.md` - Security penetration testing report
- `LOCAL_SETUP.md` - Local development setup guide

### Module-Specific Documentation
- `PR-PO-SYSTEM-DESIGN.md` - Purchase Request/Order system design
- `CREDIT-NOTE-BUTTON-LOCATION.md` - UI placement specifications
- `petty-cash-flowchart.md` - Petty cash workflow visualization
- `petty-cash-quick-reference.md` - Petty cash quick reference

### Integration Guides
- `DATA_IMPORT_GUIDE.md` - Data import procedures
- `DATA_IMPORT_SUMMARY.md` - Import operations summary
- `DATA_IMPORT_QUICKSTART.md` - Quick start guide for imports

### API Documentation
- `postman-collection.json` - Postman API collection for testing

## Subdirectories

### adr/ - Architecture Decision Records

**Purpose**: Technical rationale and design decisions for architectural choices.

**Contents**:
- `ADR-001-why-nextjs.md` - Decision to use Next.js framework
- `ADR-002-why-prisma.md` - Decision to use Prisma ORM
- `ADR-003-why-sqlite-postgres.md` - Database technology selection rationale
- `ADR-004-authentication-approach.md` - Authentication system architecture
- `ADR-005-ui-component-strategy.md` - UI component library decisions

**For AI Agents**: 
- Review ADRs before making architectural changes
- Understand the rationale behind existing technical decisions
- Follow the established patterns and conventions documented in ADRs
- Create new ADRs when introducing significant architectural changes

### database/ - Database Documentation

**Purpose**: Database-related documentation including setup, migration, and technical specifications.

**Contents**:
- `POSTGRESQL-MIGRATION-GUIDE.md` - Guide for migrating to PostgreSQL
- `CASCADING-RULES.md` - Database cascading rules and relationships

**For AI Agents**:
- Review database documentation before schema changes
- Understand migration procedures and requirements
- Follow established cascading rules when modifying database models
- Ensure all database changes are properly documented

### tutorials/ - User Tutorials

**Purpose**: Step-by-step user guides and workflow documentation.

**Contents**:
- `01-Getting-Started.md` - Initial system setup and first steps
- `02-Creating-Your-First-Invoice.md` - Invoice creation workflow
- `03-Managing-Receipts.md` - Receipt management procedures
- `04-Journal-Entries.md` - Journal entry creation and management
- `05-Financial-Reports.md` - Financial report generation and interpretation
- `06-Inventory-Management.md` - Inventory control procedures
- `07-Payroll.md` - Payroll processing workflows
- `08-Settings-and-Configuration.md` - System configuration guide
- `09-Backup-and-Restore.md` - Data backup and recovery procedures
- `10-Troubleshooting.md` - Common issues and solutions

**For AI Agents**:
- Review user tutorials to understand typical workflows
- Maintain consistency with documented procedures
- Update tutorials when workflows change
- Ensure new features are properly documented in tutorials

## For AI Agents

### When Working with Documentation

1. **Read Before Modifying**: Always read existing documentation files before making changes to understand context, conventions, and existing content.

2. **Maintain Consistency**: Follow the established structure, formatting, and style used across documentation files.

3. **Update Related Files**: When modifying functionality, update relevant documentation files (tutorials, technical specs, user manuals).

4. **Verify Accuracy**: Test any code examples or procedures documented in technical files to ensure they work correctly.

5. **Follow Version Control**: Include appropriate version information and dates when updating documentation.

### Documentation Standards

- **File Naming**: Use descriptive names with kebab-case (e.g., `getting-started-guide.md`)
- **Headings**: Use H1 for main title, H2 for sections, H3 for subsections
- **Code Blocks**: Use proper markdown syntax with language identifiers
- **Tables**: Use markdown table format for structured data
- **Links**: Use relative links for internal documentation

### Integration with Parent Documentation

This directory's AGENTS.md supplements the main project AGENTS.md (at `../AGENTS.md`) by providing:
- Directory-specific guidance for documentation-related tasks
- Context about documentation structure and organization
- Instructions for maintaining documentation consistency

### Common Tasks for AI Agents

1. **Adding New Documentation**: Create files in appropriate subdirectories following naming conventions
2. **Updating Tutorials**: Modify tutorial files when workflows change
3. **Technical Documentation**: Update ADRs and technical specs for architectural changes
4. **User Guides**: Create or update user documentation for new features
5. **API Documentation**: Maintain Postman collection and API references
6. **Database Documentation**: Update schema and migration documentation as needed

---

**Parent Reference**: ../AGENTS.md (Main project AGENTS.md)
**Related Files**: ../CLAUDE.md, ../README.md, various module-specific docs
**Last Updated**: 2026-04-16