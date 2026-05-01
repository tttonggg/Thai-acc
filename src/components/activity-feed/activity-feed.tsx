'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';
import { useWebSocket } from '@/components/websocket/websocket-provider';
import {
  FileText,
  User,
  Package,
  Calculator,
  Landmark,
  Receipt,
  CreditCard,
  Banknote,
  Truck,
  Settings,
  Users,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';

export interface Activity {
  id: string;
  type: 'create' | 'update' | 'delete' | 'view' | 'approve' | 'reject' | 'print' | 'export';
  module: string;
  recordId: string;
  recordName: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface OnlineUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  currentModule?: string;
  lastActive: Date;
  isEditing?: {
    module: string;
    recordId: string;
    recordName: string;
  };
}

interface ActivityFeedProps {
  activities: Activity[];
  maxItems?: number;
  className?: string;
  showUser?: boolean;
}

const moduleIcons: Record<string, React.ReactNode> = {
  invoice: <FileText className="h-4 w-4" />,
  customer: <User className="h-4 w-4" />,
  vendor: <User className="h-4 w-4" />,
  product: <Package className="h-4 w-4" />,
  journal: <Calculator className="h-4 w-4" />,
  banking: <Landmark className="h-4 w-4" />,
  receipt: <Receipt className="h-4 w-4" />,
  payment: <CreditCard className="h-4 w-4" />,
  pettyCash: <Banknote className="h-4 w-4" />,
  purchase: <Truck className="h-4 w-4" />,
  settings: <Settings className="h-4 w-4" />,
  user: <Users className="h-4 w-4" />,
  default: <FileText className="h-4 w-4" />,
};

const moduleLabels: Record<string, string> = {
  invoice: 'ใบกำกับภาษี',
  customer: 'ลูกค้า',
  vendor: 'ผู้ขาย',
  product: 'สินค้า',
  journal: 'บันทึกบัญชี',
  banking: 'ธนาคาร',
  receipt: 'ใบเสร็จ',
  payment: 'ใบจ่ายเงิน',
  pettyCash: 'เงินสดย่อย',
  purchase: 'ซื้อ',
  settings: 'ตั้งค่า',
  user: 'ผู้ใช้',
};

const actionIcons: Record<string, React.ReactNode> = {
  create: <Plus className="h-3 w-3" />,
  update: <Edit className="h-3 w-3" />,
  delete: <Trash2 className="h-3 w-3" />,
  view: <Clock className="h-3 w-3" />,
  approve: <CheckCircle className="h-3 w-3" />,
  reject: <XCircle className="h-3 w-3" />,
  print: <FileText className="h-3 w-3" />,
  export: <FileText className="h-3 w-3" />,
};

const actionLabels: Record<string, string> = {
  create: 'สร้าง',
  update: 'แก้ไข',
  delete: 'ลบ',
  view: 'ดู',
  approve: 'อนุมัติ',
  reject: 'ไม่อนุมัติ',
  print: 'พิมพ์',
  export: 'ส่งออก',
};

const actionColors: Record<string, string> = {
  create: 'bg-green-100 text-green-800',
  update: 'bg-blue-100 text-blue-800',
  delete: 'bg-red-100 text-red-800',
  view: 'bg-gray-100 text-gray-800',
  approve: 'bg-green-100 text-green-800',
  reject: 'bg-amber-100 text-amber-800',
  print: 'bg-purple-100 text-purple-800',
  export: 'bg-cyan-100 text-cyan-800',
};

export function ActivityFeed({
  activities,
  maxItems = 50,
  className,
  showUser = true,
}: ActivityFeedProps) {
  const displayActivities = activities.slice(0, maxItems);

  if (displayActivities.length === 0) {
    return (
      <div className={cn('p-8 text-center text-muted-foreground', className)}>
        <Clock className="mx-auto mb-4 h-12 w-12 opacity-30" />
        <p>ไม่มีกิจกรรมล่าสุด</p>
      </div>
    );
  }

  return (
    <ScrollArea className={cn('h-[400px]', className)}>
      <div className="space-y-3 p-4">
        {displayActivities.map((activity) => {
          const icon = moduleIcons[activity.module] || moduleIcons.default;
          const moduleLabel = moduleLabels[activity.module] || activity.module;
          const actionIcon = actionIcons[activity.type];
          const actionLabel = actionLabels[activity.type];
          const actionColor = actionColors[activity.type];

          return (
            <div
              key={activity.id}
              className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50"
            >
              {/* Module Icon */}
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                {icon}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className={cn('text-xs', actionColor)}>
                    <span className="flex items-center gap-1">
                      {actionIcon}
                      {actionLabel}
                    </span>
                  </Badge>
                  <span className="text-sm text-muted-foreground">{moduleLabel}</span>
                </div>

                <p className="mt-1 truncate font-medium">{activity.recordName}</p>

                {showUser && (
                  <div className="mt-2 flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-[10px]">
                        {activity.user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">{activity.user.name}</span>
                  </div>
                )}

                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(activity.timestamp), {
                    addSuffix: true,
                    locale: th,
                  })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}

// Online users component
interface OnlineUsersProps {
  users: OnlineUser[];
  className?: string;
}

export function OnlineUsers({ users, className }: OnlineUsersProps) {
  if (users.length === 0) {
    return (
      <div className={cn('p-4 text-center text-muted-foreground', className)}>
        <p className="text-sm">ไม่มีผู้ใช้ออนไลน์</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <h4 className="px-4 text-sm font-medium text-muted-foreground">ออนไลน์ ({users.length})</h4>
      <ScrollArea className="h-[200px]">
        <div className="space-y-1 px-4">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
            >
              <div className="relative">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-green-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{user.name}</p>
                {user.isEditing ? (
                  <p className="truncate text-xs text-muted-foreground">
                    กำลังแก้ไข: {user.isEditing.recordName}
                  </p>
                ) : user.currentModule ? (
                  <p className="truncate text-xs text-muted-foreground">
                    ที่ {moduleLabels[user.currentModule] || user.currentModule}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">ออนไลน์</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// Combined activity feed with online users
interface ActivityFeedWithPresenceProps {
  activities: Activity[];
  onlineUsers: OnlineUser[];
  className?: string;
  maxActivities?: number;
}

export function ActivityFeedWithPresence({
  activities,
  onlineUsers,
  className,
  maxActivities = 50,
}: ActivityFeedWithPresenceProps) {
  return (
    <div className={cn('rounded-lg border bg-card', className)}>
      <div className="border-b p-4">
        <h3 className="flex items-center gap-2 font-semibold">
          <Clock className="h-4 w-4" />
          กิจกรรมล่าสุด
        </h3>
      </div>

      <OnlineUsers users={onlineUsers} className="border-b py-2" />

      <ActivityFeed activities={activities} maxItems={maxActivities} />
    </div>
  );
}

// Hook for real-time activity feed
export function useActivityFeed(userId?: string) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const { subscribe, isConnected } = useWebSocket();

  // Load initial data
  const loadActivities = async () => {
    try {
      const response = await fetch(`/api/activities`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        queueMicrotask(() =>
          setActivities(
            data.activities.map((a: Activity) => ({
              ...a,
              timestamp: new Date(a.timestamp),
            }))
          )
        );
        queueMicrotask(() =>
          setOnlineUsers(
            data.onlineUsers.map((u: OnlineUser) => ({
              ...u,
              lastActive: new Date(u.lastActive),
            }))
          )
        );
      }
    } catch (error) {
      console.error('Failed to load activities:', error);
    }
  };

  useEffect(() => {
    if (!isConnected) return;

    // Subscribe to activity updates
    const unsubscribeActivity = subscribe('activity', (data) => {
      const message = data as { type: string; activity: Activity };
      if (message.type === 'new_activity') {
        queueMicrotask(() => setActivities((prev) => [message.activity, ...prev].slice(0, 100)));
      }
    });

    // Subscribe to presence updates
    const unsubscribePresence = subscribe('presence', (data) => {
      const message = data as { type: string; users: OnlineUser[] };
      if (message.type === 'presence_update') {
        queueMicrotask(() =>
          setOnlineUsers(
            message.users.map((u) => ({
              ...u,
              lastActive: new Date(u.lastActive),
            }))
          )
        );
      }
    });

    // Load initial data
    loadActivities();

    return () => {
      unsubscribeActivity();
      unsubscribePresence();
    };
  }, [subscribe, isConnected]);

  const recordActivity = useCallback(
    async (activity: Omit<Activity, 'id' | 'timestamp' | 'user'>) => {
      if (!userId) return;

      try {
        await fetch(`/api/activities`, {
          credentials: 'include',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(activity),
        });
      } catch (error) {
        console.error('Failed to record activity:', error);
      }
    },
    [userId]
  );

  return {
    activities,
    onlineUsers,
    recordActivity,
    refresh: loadActivities,
  };
}

// Activity summary component
interface ActivitySummaryProps {
  activities: Activity[];
  className?: string;
}

export function ActivitySummary({ activities, className }: ActivitySummaryProps) {
  // Count activities by type
  const counts = activities.reduce(
    (acc, activity) => {
      acc[activity.type] = (acc[activity.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className={cn('grid grid-cols-4 gap-2', className)}>
      {Object.entries(actionLabels).map(([type, label]) => (
        <div key={type} className="rounded-lg bg-muted/50 p-2 text-center">
          <p className="text-2xl font-bold">{counts[type] || 0}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      ))}
    </div>
  );
}
