// Phase E: UX Excellence - Component Exports

// Virtual Scrolling
export { VirtualTable, useVirtualList } from './virtual-scroll/virtual-table'
export type { VirtualTableColumn } from './virtual-scroll/virtual-table'

// Keyboard Shortcuts
export {
  useKeyboardShortcuts,
  KeyboardShortcutsHelp,
  useTableNavigation,
  commonShortcuts,
} from './keyboard-shortcuts/use-keyboard-shortcuts'

// Bulk Operations
export {
  BulkActionsToolbar,
  createCommonBulkActions,
  useBulkSelection,
} from './bulk-operations/bulk-actions-toolbar'

// Advanced Filters
export {
  AdvancedFilter,
  QuickFilterButton,
} from './filters/advanced-filter'
export type { FilterCondition, SavedFilterData } from './filters/advanced-filter'

// WebSocket & Real-time
export {
  WebSocketProvider,
  useWebSocket,
  useCollaboration,
  DocumentLockIndicator,
  UserPresenceIndicator,
} from './websocket/websocket-provider'

// Notifications
export {
  NotificationCenter,
  useNotifications,
  PersistentToast,
} from './notifications/notification-center'
export type { Notification, NotificationType } from './notifications/notification-center'

// Mobile Optimization
export {
  MobileFormField,
  TouchInput,
  MobileBottomSheet,
  SwipeableListItem,
  MobileNavDrawer,
  MobileDataList,
  MobileStepper,
  useIsMobile,
  ResponsiveContainer,
} from './mobile/mobile-optimized-form'

// PWA
export {
  PWAProvider,
  usePWA,
  InstallPrompt,
  OfflineIndicator,
  UpdateNotification,
} from './pwa/pwa-provider'

// Offline Sync
export {
  OfflineSyncProvider,
  useOfflineSync,
  SyncStatus,
  ConflictResolver,
} from './offline-sync/offline-sync-provider'

// Personalization
export {
  UserPreferencesDialog,
  useUserPreferences,
  getDensityClass,
  ThemeToggle,
} from './personalization/user-preferences'
export type { UserPreferences } from './personalization/user-preferences'

export {
  RecentItemsList,
  RecentItemsSidebar,
  useRecentItems,
  QuickAccessCard,
} from './personalization/recent-items'
export type { RecentItem } from './personalization/recent-items'

// Dashboard Customization
export {
  DashboardCustomizer,
  presetWidgets,
  defaultDashboardLayout,
} from './dashboard/dashboard-customizer'
export type { DashboardWidget } from './dashboard/dashboard-customizer'

// Enhanced Layout
export { EnhancedSidebar } from './layout/enhanced-sidebar'
