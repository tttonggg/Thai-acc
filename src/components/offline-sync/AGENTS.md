<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-04-17 -->

# Offline Sync Capabilities

## Purpose
Offline data persistence and synchronization using IndexedDB, conflict detection/resolution, and background sync when connectivity is restored.

## Key Files
| File | Description |
|------|-------------|
| `offline-sync-provider.tsx` | OfflineSyncProvider, useOfflineSync hook, SyncStatus, ConflictResolver |
| `index.ts` | Barrel exports |

## For AI Agents

### Working In This Directory

**PendingChange Structure**
```typescript
interface PendingChange {
  id: string
  timestamp: number
  operation: 'create' | 'update' | 'delete'
  endpoint: string          // API endpoint
  data: unknown
  retries: number
  error?: string
}
```

**Conflict Structure**
```typescript
interface Conflict {
  id: string
  change: PendingChange     // The local change
  serverData: unknown      // Current server state
  localData: unknown       // Original local state
}
```

**OfflineSyncProvider**
```typescript
interface OfflineSyncProviderProps {
  children: ReactNode
  syncInterval?: number     // ms (default 30000)
  maxRetries?: number       // (default 3)
}
```

**useOfflineSync Hook**
```typescript
const {
  isOnline,               // boolean
  pendingChanges,          // PendingChange[]
  isSyncing,              // boolean
  lastSyncTime,           // Date | null
  queueChange,            // (op, endpoint, data) => Promise
  removePendingChange,    // (id: string) => Promise
  syncNow,                // () => Promise
  hasConflicts,            // boolean
  conflicts,               // Conflict[]
  resolveConflict,          // (id, 'local'|'server'|'merge', data?) => void
} = useOfflineSync()
```

**Sync Behavior**
1. When online: changes sync immediately
2. When offline: changes queued in IndexedDB
3. When back online: automatic sync via interval
4. On HTTP 409: conflict detected, requires manual resolution
5. Max retries exceeded: error stored, manual retry needed

**Storage**
- IndexedDB via `idb-keyval`
- Key `pending_changes` for pending operations
- Key `sync_conflicts` for unresolved conflicts

**Conflict Resolution Options**
- `local` - Use local data, overwrite server
- `server` - Discard local change, keep server
- `merge` - Combine both (simple object spread)

**SyncStatus Component**
Shows inline status indicator:
- Amber "มีข้อขัดแย้ง" if conflicts exist
- Amber "ออฟไลน์" if offline
- Blue spinner "กำลังซิงค์..." during sync
- Button with pending count "X รายการรอซิงค์"
- "ซิงค์ล่าสุด: HH:MM:SS" after successful sync

**ConflictResolver Component**
Modal dialog for manual conflict resolution with side-by-side comparison.

## Dependencies
- `idb-keyval` - IndexedDB wrapper
- `@/components/pwa/pwa-provider` - `usePWA()` for offline detection
- `@/components/ui/*` - shadcn/ui components
