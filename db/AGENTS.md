<!-- Parent: ./AGENTS.md -->
<!-- Generated: 2026-04-17 -->

# db/

## Purpose
Database utilities, analysis files, and custom database artifacts.

## Key Files
| File | Description |
|------|-------------|
| `custom.db` | Custom SQLite database file (299KB) for specific operations |
| `analysis_5.json` | Database analysis results or exports |

## For AI Agents

### Working In This Directory
- `custom.db` may contain cached or derived data
- `analysis_5.json` appears to be a structured data export
- For main database, see `prisma/dev.db` in project root

### Database Connections
The main development database is at `prisma/dev.db`. Production uses PostgreSQL.