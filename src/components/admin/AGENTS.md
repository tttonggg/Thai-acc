<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-04-17 -->

# Administration

## Purpose

Administrative panel components for system management, backup/restore, data
operations, and system health monitoring.

## Key Files

| File                      | Description                               |
| ------------------------- | ----------------------------------------- |
| `activity-log-page.tsx`   | User activity log viewer                  |
| `api-analytics.tsx`       | API usage analytics dashboard             |
| `backup-restore-page.tsx` | Backup creation and restoration interface |
| `data-export-page.tsx`    | Data export functionality                 |
| `data-import-page.tsx`    | Bulk data import interface                |
| `system-health-page.tsx`  | System health and performance monitoring  |
| `webhook-management.tsx`  | Webhook configuration and management      |
| `index.ts`                | Component exports                         |

## For AI Agents

### Working In This Directory

- Admin functions require ADMIN role permissions
- System health monitoring provides real-time metrics
- Backup/restore operations should be performed during off-peak hours
- Data export/import follows CSV template format

### Admin Features

1. **Activity Log**: Tracks all user actions with timestamps
2. **API Analytics**: Monitors API usage patterns and performance
3. **Backup/Restore**: Full database backup with point-in-time recovery
4. **Data Operations**: Bulk import/export for master data
5. **System Health**: CPU, memory, database connection status
6. **Webhooks**: Configure outbound HTTP callbacks for events

### Permission Requirements

- All admin functions require `ADMIN` role
- Backup operations may require additional confirmation
- Webhook configuration requires understanding of HTTP endpoints

## Dependencies

### Internal

- @/stores/auth-store - Permission checking
- @/lib/audit-logger - Activity logging
- @/lib/backup-service - Backup operations
- @/components/ui/\* - Dialog, Table, Form components

### External

- react-hook-form v7 - Form handling
- zod v4 - Schema validation
- @tanstack/react-query v5 - Data fetching
- lucide-react - Icons
