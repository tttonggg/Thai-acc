<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-04-17 -->

# Notification Center

## Purpose
Real-time notification system with WebSocket integration, persistent toasts, notification management (mark read, delete, clear all), and module-specific navigation.

## Key Files
| File | Description |
|------|-------------|
| `notification-center.tsx` | Notification bell UI, popover list, persistent toast component |
| `index.ts` | Barrel exports |

## For AI Agents

### Working In This Directory

**Notification Structure**
```typescript
interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  module?: string           // e.g., 'invoice', 'payment'
  recordId?: string         // Navigate to this record
  isRead: boolean
  readAt?: Date
  actionUrl?: string        // Custom action URL
  createdAt: Date
  metadata?: Record<string, unknown>
}
```

**Notification Types & Styling**
```typescript
const typeConfig = {
  info: { icon: Info, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  success: { icon: CircleCheck, color: 'text-green-600', bgColor: 'bg-green-50' },
  warning: { icon: AlertTriangle, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  error: { icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-50' },
}
```

**WebSocket Integration**
```typescript
// Subscribe to user notifications
subscribe(`notifications:${userId}`, (data) => {
  // data.type === 'new_notification' | 'notification_read'
})
```

**useNotifications Hook**
```typescript
const {
  notifications,          // Notification[]
  unreadCount,           // number
  markAsRead,            // (id: string) => Promise
  markAllAsRead,          // () => Promise
  deleteNotification,    // (id: string) => Promise
  clearAll,              // () => Promise
  addNotification,       // (notification: Omit<Notification, 'id'|'createdAt'>) => Notification
  refresh,              // () => Promise
} = useNotifications(userId)
```

**Persistent Toast**
- Auto-dismisses after 5 seconds
- Left border color based on notification type
- Dismissible with X button
- Shows action button if `actionUrl` present

**API Endpoints**
- `GET /api/notifications` - Fetch all notifications
- `POST /api/notifications/:id/read` - Mark as read
- `POST /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete single
- `DELETE /api/notifications` - Clear all

## Dependencies
- `@/components/websocket/websocket-provider` - Real-time updates
- `date-fns` - Time formatting with Thai locale
- `lucide-react` - Icons
- `@radix-ui/react-popover` - Popover primitive
