'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Bell,
  Check,
  CheckCheck,
  Info,
  AlertCircle,
  AlertTriangle,
  CircleCheck,
  X,
  Trash2,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { th } from 'date-fns/locale'
import { useWebSocket } from '@/components/websocket/websocket-provider'

export type NotificationType = 'info' | 'success' | 'warning' | 'error'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  module?: string
  recordId?: string
  isRead: boolean
  readAt?: Date
  actionUrl?: string
  createdAt: Date
  metadata?: Record<string, unknown>
}

interface NotificationCenterProps {
  notifications: Notification[]
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  onDelete: (id: string) => void
  onClearAll: () => void
  onNotificationClick?: (notification: Notification) => void
  className?: string
}

const typeConfig: Record<NotificationType, { icon: React.ReactNode; color: string; bgColor: string }> = {
  info: {
    icon: <Info className="w-4 h-4" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  success: {
    icon: <CircleCheck className="w-4 h-4" />,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  warning: {
    icon: <AlertTriangle className="w-4 h-4" />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  error: {
    icon: <AlertCircle className="w-4 h-4" />,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
}

export function NotificationCenter({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClearAll,
  onNotificationClick,
  className,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const unreadCount = notifications.filter((n) => !n.isRead).length

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id)
    }
    onNotificationClick?.(notification)
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("relative", className)}
          aria-label={`การแจ้งเตือน ${unreadCount > 0 ? `(${unreadCount} ใหม่)` : ''}`}
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">การแจ้งเตือน</h3>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMarkAllAsRead}
                className="h-8 text-xs"
              >
                <CheckCheck className="w-4 h-4 mr-1" />
                อ่านทั้งหมด
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="h-8 text-xs text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                ล้าง
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <Bell className="w-10 h-10 mb-2 opacity-20" />
              <p className="text-sm">ไม่มีการแจ้งเตือน</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const config = typeConfig[notification.type]
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 hover:bg-muted/50 cursor-pointer transition-colors",
                      !notification.isRead && "bg-muted/30"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                          config.bgColor,
                          config.color
                        )}
                      >
                        {config.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn(
                            "font-medium text-sm",
                            !notification.isRead && "text-foreground"
                          )}>
                            {notification.title}
                          </p>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(notification.createdAt, {
                              addSuffix: true,
                              locale: th,
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                onMarkAsRead(notification.id)
                              }}
                              className="h-6 text-xs px-2"
                            >
                              <Check className="w-3 h-3 mr-1" />
                              อ่านแล้ว
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              onDelete(notification.id)
                            }}
                            className="h-6 text-xs px-2 text-destructive hover:text-destructive"
                          >
                            <X className="w-3 h-3 mr-1" />
                            ลบ
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="p-3 border-t bg-muted/30">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => setIsOpen(false)}
            >
              ดูการแจ้งเตือนทั้งหมด
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

// Real-time notification hook
export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const { subscribe, isConnected } = useWebSocket()

  useEffect(() => {
    if (!isConnected || !userId) return

    const unsubscribe = subscribe(`notifications:${userId}`, (data) => {
      const message = data as { type: string; notification: Notification }
      if (message.type === 'new_notification') {
        setNotifications((prev) => [message.notification, ...prev])
      } else if (message.type === 'notification_read') {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === message.notification.id ? { ...n, isRead: true } : n
          )
        )
      }
    })

    // Load initial notifications
    fetchNotifications()

    return unsubscribe
  }, [subscribe, isConnected, userId])

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`/api/notifications`, { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }

  const markAsRead = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, { credentials: 'include', 
        method: 'POST',
      })
      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === id ? { ...n, isRead: true, readAt: new Date() } : n
          )
        )
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch(`/api/notifications/read-all`, { credentials: 'include', 
        method: 'POST',
      })
      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true, readAt: new Date() }))
        )
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }, [])

  const deleteNotification = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, { credentials: 'include', 
        method: 'DELETE',
      })
      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }, [])

  const clearAll = useCallback(async () => {
    try {
      const response = await fetch(`/api/notifications`, { credentials: 'include', 
        method: 'DELETE',
      })
      if (response.ok) {
        setNotifications([])
      }
    } catch (error) {
      console.error('Failed to clear notifications:', error)
    }
  }, [])

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    }
    setNotifications((prev) => [newNotification, ...prev])
    return newNotification
  }, [])

  return {
    notifications,
    unreadCount: notifications.filter((n) => !n.isRead).length,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    addNotification,
    refresh: fetchNotifications,
  }
}

// Toast notification component with persistence
export function PersistentToast({
  notification,
  onDismiss,
  onAction,
}: {
  notification: Notification
  onDismiss: () => void
  onAction?: () => void
}) {
  const [isVisible, setIsVisible] = useState(true)
  const config = typeConfig[notification.type]

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onDismiss, 300)
    }, 5000)

    return () => clearTimeout(timer)
  }, [onDismiss])

  if (!isVisible) return null

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 p-4 rounded-lg shadow-lg border animate-in slide-in-from-right-full",
        config.bgColor,
        "border-l-4",
        notification.type === 'error' && "border-l-red-500",
        notification.type === 'warning' && "border-l-amber-500",
        notification.type === 'success' && "border-l-green-500",
        notification.type === 'info' && "border-l-blue-500"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("flex-shrink-0", config.color)}>{config.icon}</div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm">{notification.title}</h4>
          <p className="text-sm text-muted-foreground mt-0.5">
            {notification.message}
          </p>
          {notification.actionUrl && (
            <button
              onClick={onAction}
              className="text-sm text-primary hover:underline mt-2"
            >
              ดูรายละเอียด
            </button>
          )}
        </div>
        <button
          onClick={() => {
            setIsVisible(false)
            setTimeout(onDismiss, 300)
          }}
          className="flex-shrink-0 text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
