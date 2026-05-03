'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { get, set, del, keys } from 'idb-keyval';
import { usePWA } from '@/components/pwa/pwa-provider';

export interface PendingChange {
  id: string;
  timestamp: number;
  operation: 'create' | 'update' | 'delete';
  endpoint: string;
  data: unknown;
  retries: number;
  error?: string;
}

interface OfflineSyncContextType {
  isOnline: boolean;
  pendingChanges: PendingChange[];
  isSyncing: boolean;
  lastSyncTime: Date | null;
  queueChange: (
    operation: PendingChange['operation'],
    endpoint: string,
    data: unknown
  ) => Promise<void>;
  removePendingChange: (id: string) => Promise<void>;
  syncNow: () => Promise<void>;
  hasConflicts: boolean;
  conflicts: Conflict[];
  resolveConflict: (
    conflictId: string,
    resolution: 'local' | 'server' | 'merge',
    mergedData?: unknown
  ) => void;
}

export interface Conflict {
  id: string;
  change: PendingChange;
  serverData: unknown;
  localData: unknown;
}

const OfflineSyncContext = createContext<OfflineSyncContextType | null>(null);

const PENDING_CHANGES_KEY = 'pending_changes';
const CONFLICTS_KEY = 'sync_conflicts';

export function useOfflineSync() {
  const context = useContext(OfflineSyncContext);
  if (!context) {
    throw new Error('useOfflineSync must be used within OfflineSyncProvider');
  }
  return context;
}

interface OfflineSyncProviderProps {
  children: ReactNode;
  syncInterval?: number; // milliseconds
  maxRetries?: number;
}

export function OfflineSyncProvider({
  children,
  syncInterval = 30000,
  maxRetries = 3,
}: OfflineSyncProviderProps) {
  const { isOffline } = usePWA()
  const isOnline = !isOffline
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([])
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [conflicts, setConflicts] = useState<Conflict[]>([])

  // Load pending changes from IndexedDB on mount
  useEffect(() => {
    loadPendingChanges()
    loadConflicts()
  }, [])

  // Sync when coming back online
  useEffect(() => {
    if (isOnline && pendingChanges.length > 0) {
      syncNow()
    }
  }, [isOnline])

  // Periodic sync
  useEffect(() => {
    if (!isOnline) return

    const interval = setInterval(() => {
      if (pendingChanges.length > 0) {
        syncNow()
      }
    }, syncInterval)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, syncInterval])

  // Helper: load pending changes from IndexedDB
  const loadPendingChanges = async () => {
    try {
      const changes = await get<PendingChange[]>(PENDING_CHANGES_KEY);
      if (changes) {
        queueMicrotask(() => setPendingChanges(changes));
      }
    } catch (error) {
      console.error('Failed to load pending changes:', error);
    }
  };

  // Helper: load conflicts from IndexedDB
  const loadConflicts = async () => {
    try {
      const stored = await get<Conflict[]>(CONFLICTS_KEY);
      if (stored) {
        queueMicrotask(() => setConflicts(stored));
      }
    } catch (error) {
      console.error('Failed to load conflicts:', error);
    }
  };

  // Load pending changes and conflicts from IndexedDB on mount
  useEffect(() => {
    loadPendingChanges();
    loadConflicts();
  }, []);

  const savePendingChanges = async (changes: PendingChange[]) => {
    try {
      await set(PENDING_CHANGES_KEY, changes);
      queueMicrotask(() => setPendingChanges(changes));
    } catch (error) {
      console.error('Failed to save pending changes:', error);
    }
  };

  const saveConflicts = async (newConflicts: Conflict[]) => {
    try {
      await set(CONFLICTS_KEY, newConflicts);
      queueMicrotask(() => setConflicts(newConflicts));
    } catch (error) {
      console.error('Failed to save conflicts:', error);
    }
  };

  // Ref to hold latest syncNow so queueChange can call it without circular dependency
  const syncNowRef = useRef<() => Promise<void>>(async () => {});

  const syncNow = useCallback(async () => {
    if (isSyncing || !isOnline || pendingChanges.length === 0) return;

    queueMicrotask(() => setIsSyncing(true));
    const newConflicts: Conflict[] = [];
    const completed: string[] = [];

    for (const change of pendingChanges) {
      if (change.retries >= maxRetries) {
        continue;
      }

      try {
        const response = await fetch(change.endpoint, {
          method: getHttpMethod(change.operation),
          headers: { 'Content-Type': 'application/json' },
          body: change.data ? JSON.stringify(change.data) : undefined,
        });

        if (response.ok) {
          completed.push(change.id);
        } else if (response.status === 409) {
          const serverData = await response.json();
          newConflicts.push({
            id: crypto.randomUUID(),
            change,
            serverData: serverData.current,
            localData: change.data,
          });
          completed.push(change.id);
        } else {
          const updatedChange: PendingChange = {
            ...change,
            retries: change.retries + 1,
            error: `HTTP ${response.status}: ${response.statusText}`,
          };
          const updated = pendingChanges.map((c) => (c.id === change.id ? updatedChange : c));
          await savePendingChanges(updated);
          completed.push(change.id);
        }
      } catch (error) {
        const updatedChange: PendingChange = {
          ...change,
          retries: change.retries + 1,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
        const updated = pendingChanges.map((c) => (c.id === change.id ? updatedChange : c));
        await savePendingChanges(updated);
        completed.push(change.id);
      }
    }

    const remaining = pendingChanges.filter((c) => !completed.includes(c.id));
    await savePendingChanges(remaining);

    if (newConflicts.length > 0) {
      await saveConflicts([...conflicts, ...newConflicts]);
    }

    setLastSyncTime(() => new Date());
    queueMicrotask(() => setIsSyncing(false));
  }, [isSyncing, isOnline, pendingChanges, conflicts, maxRetries]);

  // Keep syncNowRef in sync with latest syncNow
  useEffect(() => { syncNowRef.current = syncNow; }, [syncNow]);

  const queueChange = useCallback(
    async (operation: PendingChange['operation'], endpoint: string, data: unknown) => {
      const change: PendingChange = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        operation,
        endpoint,
        data,
        retries: 0,
      };

      const updated = [...pendingChanges, change];
      await savePendingChanges(updated);

      // Try to sync immediately if online
      if (isOnline) {
        syncNowRef.current();
      }
    },
    [pendingChanges, isOnline]
  );

  const removePendingChange = useCallback(
    async (id: string) => {
      const updated = pendingChanges.filter((c) => c.id !== id);
      await savePendingChanges(updated);
    },
    [pendingChanges]
  );

  // Sync when coming online
  useEffect(() => {
    if (isOnline && pendingChanges.length > 0) {
      queueMicrotask(() => syncNow());
    }
  }, [isOnline, syncNow]);

  // Periodic sync
  useEffect(() => {
    if (!isOnline) return;

    const interval = setInterval(() => {
      if (pendingChanges.length > 0) {
        syncNow();
      }
    }, syncInterval);

    return () => clearInterval(interval);
  }, [isOnline, pendingChanges, syncInterval, syncNow]);

  const resolveConflict = useCallback(
    async (conflictId: string, resolution: 'local' | 'server' | 'merge', mergedData?: unknown) => {
      const conflict = conflicts.find((c) => c.id === conflictId);
      if (!conflict) return;

      let finalData: unknown;

      switch (resolution) {
        case 'local':
          finalData = conflict.localData;
          break;
        case 'server':
          finalData = conflict.serverData;
          break;
        case 'merge':
          finalData = mergedData || mergeData(conflict.localData, conflict.serverData);
          break;
      }

      // Queue the resolved change
      await queueChange(conflict.change.operation, conflict.change.endpoint, finalData);

      // Remove conflict
      const updatedConflicts = conflicts.filter((c) => c.id !== conflictId);
      await saveConflicts(updatedConflicts);
    },
    [conflicts, queueChange]
  );

  return (
    <OfflineSyncContext.Provider
      value={{
        isOnline,
        pendingChanges,
        isSyncing,
        lastSyncTime,
        queueChange,
        removePendingChange,
        syncNow,
        hasConflicts: conflicts.length > 0,
        conflicts,
        resolveConflict,
      }}
    >
      {children}
    </OfflineSyncContext.Provider>
  );
}

function getHttpMethod(operation: PendingChange['operation']): string {
  switch (operation) {
    case 'create':
      return 'POST';
    case 'update':
      return 'PUT';
    case 'delete':
      return 'DELETE';
    default:
      return 'POST';
  }
}

function mergeData(local: unknown, server: unknown): unknown {
  // Simple merge strategy - combine both objects
  if (typeof local === 'object' && typeof server === 'object' && local && server) {
    return { ...server, ...local, _conflictResolved: true };
  }
  return local;
}

// Sync status indicator component
export function SyncStatus() {
  const { isOnline, pendingChanges, isSyncing, lastSyncTime, hasConflicts, syncNow } =
    useOfflineSync();

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      {hasConflicts && (
        <span className="flex items-center gap-1 text-amber-600">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          มีข้อขัดแย้ง
        </span>
      )}
      {!isOnline && (
        <span className="flex items-center gap-1 text-amber-600">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
            />
          </svg>
          ออฟไลน์
        </span>
      )}
      {isSyncing && (
        <span className="flex items-center gap-1 text-blue-600">
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          กำลังซิงค์...
        </span>
      )}
      {pendingChanges.length > 0 && !isSyncing && (
        <button
          onClick={syncNow}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {pendingChanges.length} รายการรอซิงค์
        </button>
      )}
      {lastSyncTime && pendingChanges.length === 0 && (
        <span>ซิงค์ล่าสุด: {lastSyncTime.toLocaleTimeString('th-TH')}</span>
      )}
    </div>
  );
}

// Conflict resolution dialog
export function ConflictResolver() {
  const { conflicts, resolveConflict } = useOfflineSync();
  const [currentConflict, setCurrentConflict] = useState(conflicts[0]);

  if (!currentConflict) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-lg bg-background p-6 shadow-xl">
        <h3 className="mb-2 text-lg font-semibold">พบข้อขัดแย้งในการซิงค์</h3>
        <p className="mb-4 text-muted-foreground">
          ข้อมูลนี้มีการเปลี่ยนแปลงทั้งในเครื่องและบนเซิร์ฟเวอร์ กรุณาเลือกเวอร์ชันที่ต้องการเก็บ:
        </p>

        <div className="mb-6 space-y-4">
          <div className="rounded-lg border p-4">
            <h4 className="mb-2 font-medium">ข้อมูลในเครื่อง (Local)</h4>
            <pre className="max-h-32 overflow-auto rounded bg-muted p-2 text-xs">
              {JSON.stringify(currentConflict.localData, null, 2)}
            </pre>
            <button
              onClick={() => {
                resolveConflict(currentConflict.id, 'local');
                setCurrentConflict(conflicts[1]);
              }}
              className="mt-2 w-full rounded bg-primary py-2 text-sm text-primary-foreground"
            >
              ใช้ข้อมูลในเครื่อง
            </button>
          </div>

          <div className="rounded-lg border p-4">
            <h4 className="mb-2 font-medium">ข้อมูลบนเซิร์ฟเวอร์ (Server)</h4>
            <pre className="max-h-32 overflow-auto rounded bg-muted p-2 text-xs">
              {JSON.stringify(currentConflict.serverData, null, 2)}
            </pre>
            <button
              onClick={() => {
                resolveConflict(currentConflict.id, 'server');
                setCurrentConflict(conflicts[1]);
              }}
              className="mt-2 w-full rounded bg-secondary py-2 text-sm text-secondary-foreground"
            >
              ใช้ข้อมูลบนเซิร์ฟเวอร์
            </button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">เหลืออีก {conflicts.length} ข้อขัดแย้ง</p>
      </div>
    </div>
  );
}
