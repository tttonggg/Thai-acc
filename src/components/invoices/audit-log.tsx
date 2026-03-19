'use client'

import { useState, useEffect } from 'react'
import {
  FileText,
  Clock,
  User,
  Filter,
  Plus,
  Minus,
  Edit,
  Trash2,
  Eye,
  ChevronDown,
  ChevronRight,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { formatThaiDate } from '@/lib/thai-accounting'
import { cn } from '@/lib/utils'

// ============================================
// Types & Interfaces
// ============================================

type AuditAction = 'CREATED' | 'UPDATED' | 'DELETED' | 'VIEW'
type EntityType = 'INVOICE' | 'LINE_ITEM' | 'ALL'

interface AuditLogFilters {
  actionType?: AuditAction | 'ALL'
  entityType?: EntityType
  startDate?: Date
  endDate?: Date
  userId?: string
}

interface AuditChangeDetail {
  fieldName: string
  fieldNameTh: string
  oldValue?: any
  newValue?: any
}

interface AuditLogEntry {
  id: string
  timestamp: Date
  userId: string
  userName: string
  userRole?: string
  action: AuditAction
  entityType: 'INVOICE' | 'LINE_ITEM'
  entityId: string
  changes?: AuditChangeDetail[]
  reason?: string
  ipAddress?: string
  lineItemInfo?: {
    lineNo: number
    description: string
  }
}

interface AuditLogProps {
  invoiceId: string
  entityType?: EntityType
  initialFilters?: AuditLogFilters
  maxHeight?: string
  showFilters?: boolean
  compact?: boolean
  onEntryClick?: (entry: AuditLogEntry) => void
}

// ============================================
// Helper Functions
// ============================================

function getActionConfig(action: AuditAction) {
  const configs = {
    CREATED: {
      label: 'สร้าง',
      labelEn: 'Created',
      icon: Plus,
      color: 'bg-green-500',
      badgeVariant: 'default' as const,
      textColor: 'text-green-700 dark:text-green-400'
    },
    UPDATED: {
      label: 'แก้ไข',
      labelEn: 'Updated',
      icon: Edit,
      color: 'bg-blue-500',
      badgeVariant: 'secondary' as const,
      textColor: 'text-blue-700 dark:text-blue-400'
    },
    DELETED: {
      label: 'ลบ',
      labelEn: 'Deleted',
      icon: Trash2,
      color: 'bg-red-500',
      badgeVariant: 'destructive' as const,
      textColor: 'text-red-700 dark:text-red-400'
    },
    VIEW: {
      label: 'ดู',
      labelEn: 'Viewed',
      icon: Eye,
      color: 'bg-gray-500',
      badgeVariant: 'outline' as const,
      textColor: 'text-gray-700 dark:text-gray-400'
    }
  }
  return configs[action]
}

function formatThaiDateTime(date: Date): string {
  const d = new Date(date)
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear() + 543
  const hours = d.getHours().toString().padStart(2, '0')
  const minutes = d.getMinutes().toString().padStart(2, '0')
  const seconds = d.getSeconds().toString().padStart(2, '0')
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
}

function formatValue(value: any): string {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'number') return value.toLocaleString('th-TH')
  if (typeof value === 'boolean') return value ? 'ใช่' : 'ไม่ใช่'
  return String(value)
}

function calculateDifference(oldValue: any, newValue: any): { value: number; isPositive: boolean } | null {
  if (typeof oldValue !== 'number' || typeof newValue !== 'number') return null
  const diff = newValue - oldValue
  return {
    value: Math.abs(diff),
    isPositive: diff > 0
  }
}

// ============================================
// Components
// ============================================

interface TimelineEntryProps {
  entry: AuditLogEntry
  isLast: boolean
  compact: boolean
  onClick?: (entry: AuditLogEntry) => void
}

function TimelineEntry({ entry, isLast, compact, onClick }: TimelineEntryProps) {
  const [expanded, setExpanded] = useState(!compact)
  const actionConfig = getActionConfig(entry.action)
  const ActionIcon = actionConfig.icon

  const hasChanges = entry.changes && entry.changes.length > 0

  return (
    <div className="relative group">
      {/* Vertical Line */}
      {!isLast && (
        <div className="absolute left-[19px] top-10 w-0.5 h-full bg-border" />
      )}

      <div className="flex gap-4 pb-6">
        {/* Icon Circle */}
        <div className="relative z-10 flex-shrink-0">
          <div
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center border-4 border-background',
              actionConfig.color
            )}
          >
            <ActionIcon className="h-4 w-4 text-white" />
          </div>
        </div>

        {/* Content */}
        <div
          className={cn(
            'flex-1 min-w-0 rounded-lg border p-4 transition-all',
            'hover:shadow-md cursor-pointer',
            expanded && 'bg-accent/50'
          )}
          onClick={() => {
            setExpanded(!expanded)
            onClick?.(entry)
          }}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={actionConfig.badgeVariant}>
                {actionConfig.label}
              </Badge>
              {entry.userRole && (
                <Badge variant="outline" className="text-xs">
                  {entry.userRole}
                </Badge>
              )}
              {entry.entityType === 'LINE_ITEM' && entry.lineItemInfo && (
                <span className="text-sm text-muted-foreground">
                  รายการที่ {entry.lineItemInfo.lineNo}: {entry.lineItemInfo.description}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span className="font-mono">
                {formatThaiDateTime(entry.timestamp)}
              </span>
            </div>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-2 text-sm mb-2">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium">{entry.userName}</span>
            {entry.ipAddress && (
              <span className="text-xs text-muted-foreground">
                ({entry.ipAddress})
              </span>
            )}
          </div>

          {/* Action Description */}
          <div className={cn(
            'text-sm mb-2',
            actionConfig.textColor,
            'font-medium'
          )}>
            {getActionDescription(entry)}
          </div>

          {/* Expandable Changes */}
          {hasChanges && (
            <div className="mt-3">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-0 text-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  setExpanded(!expanded)
                }}
              >
                {expanded ? (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    ซ่อนรายละเอียด ({entry.changes!.length} ฟิลด์)
                  </>
                ) : (
                  <>
                    <ChevronRight className="h-3 w-3 mr-1" />
                    ดูรายละเอียด ({entry.changes!.length} ฟิลด์)
                  </>
                )}
              </Button>

              {expanded && (
                <div className="mt-2 space-y-2 pl-2 border-l-2 border-muted">
                  {entry.changes!.map((change, idx) => (
                    <ChangeDetail
                      key={idx}
                      change={change}
                      action={entry.action}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reason */}
          {entry.reason && expanded && (
            <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
              <span className="font-medium">เหตุผล: </span>
              <span>{entry.reason}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface ChangeDetailProps {
  change: AuditChangeDetail
  action: AuditAction
}

function ChangeDetail({ change, action }: ChangeDetailProps) {
  const diff = calculateDifference(change.oldValue, change.newValue)
  const hasChange = change.oldValue !== change.newValue

  return (
    <div className="space-y-1">
      {/* Field Name */}
      <div className="text-xs font-medium text-muted-foreground">
        {change.fieldNameTh}
        {change.fieldName && (
          <span className="text-muted-foreground/70 ml-1">
            ({change.fieldName})
          </span>
        )}
      </div>

      {/* Values Comparison */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        {/* Before Value */}
        <div
          className={cn(
            'p-2 rounded bg-muted/30',
            action === 'DELETED' && 'line-through text-muted-foreground'
          )}
        >
          <div className="text-xs text-muted-foreground mb-1">ก่อนแก้ไข</div>
          <div className={cn(
            'font-mono',
            action === 'DELETED' && 'line-through'
          )}>
            {formatValue(change.oldValue)}
          </div>
        </div>

        {/* After Value */}
        <div
          className={cn(
            'p-2 rounded bg-muted/30',
            action === 'CREATED' && 'bg-green-50 dark:bg-green-950/20'
          )}
        >
          <div className="text-xs text-muted-foreground mb-1">หลังแก้ไข</div>
          <div className={cn(
            'font-mono',
            action === 'CREATED' && 'text-green-700 dark:text-green-400'
          )}>
            {formatValue(change.newValue)}
          </div>
        </div>
      </div>

      {/* Difference Indicator */}
      {diff && hasChange && (
        <div className="text-xs font-medium mt-1">
          {diff.isPositive ? (
            <span className="text-green-600 dark:text-green-400">
              +{diff.value.toLocaleString('th-TH')}
            </span>
          ) : (
            <span className="text-red-600 dark:text-red-400">
              -{diff.value.toLocaleString('th-TH')}
            </span>
          )}
          <span className="text-muted-foreground ml-1">
            (เปลี่ยนแปลง)
          </span>
        </div>
      )}
    </div>
  )
}

function getActionDescription(entry: AuditLogEntry): string {
  const actionConfig = getActionConfig(entry.action)

  if (entry.entityType === 'INVOICE') {
    switch (entry.action) {
      case 'CREATED':
        return 'สร้างใบกำกับภาษีใหม่'
      case 'UPDATED':
        return `แก้ไข${entry.changes?.length || 0}ฟิลด์`
      case 'DELETED':
        return 'ลบใบกำกับภาษี'
      case 'VIEW':
        return 'ดูรายละเอียดใบกำกับภาษี'
      default:
        return actionConfig.labelEn
    }
  } else if (entry.entityType === 'LINE_ITEM') {
    switch (entry.action) {
      case 'CREATED':
        return 'เพิ่มรายการใหม่'
      case 'UPDATED':
        return `แก้ไขรายการ (${entry.changes?.length || 0}ฟิลด์)`
      case 'DELETED':
        return 'ลบรายการ'
      case 'VIEW':
        return 'ดูรายการ'
      default:
        return actionConfig.labelEn
    }
  }

  return actionConfig.labelEn
}

// ============================================
// Main Component
// ============================================

export function AuditLog({
  invoiceId,
  entityType = 'ALL',
  initialFilters,
  maxHeight = '600px',
  showFilters = true,
  compact = false,
  onEntryClick
}: AuditLogProps) {
  const [entries, setEntries] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<AuditLogFilters>({
    actionType: initialFilters?.actionType || 'ALL',
    entityType: initialFilters?.entityType || entityType,
    startDate: initialFilters?.startDate,
    endDate: initialFilters?.endDate,
    userId: initialFilters?.userId
  })
  const [filteredEntries, setFilteredEntries] = useState<AuditLogEntry[]>([])

  // Fetch audit logs
  useEffect(() => {
    fetchAuditLogs()
  }, [invoiceId])

  // Apply filters
  useEffect(() => {
    applyFilters()
  }, [entries, filters])

  const fetchAuditLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (entityType !== 'ALL') {
        params.append('entityType', entityType)
      }

      const response = await fetch(
        `/api/invoices/${invoiceId}/audit?${params.toString()}`
      )
      const result = await response.json()

      if (response.ok) {
        // Transform API response to our format
        const transformedEntries = (result.data || []).map((entry: any) => ({
          id: entry.id,
          timestamp: new Date(entry.timestamp || entry.createdAt),
          userId: entry.changedById || entry.userId,
          userName: entry.changedByName || entry.userName || 'Unknown',
          userRole: entry.userRole,
          action: entry.action,
          entityType: entry.entityType || (entry.lineItemId ? 'LINE_ITEM' : 'INVOICE'),
          entityId: entry.entityId || entry.id,
          changes: entry.changes || parseChangesFromEntry(entry),
          reason: entry.reason,
          ipAddress: entry.ipAddress,
          lineItemInfo: entry.lineItem ? {
            lineNo: entry.lineItem.lineNo,
            description: entry.lineItem.description
          } : undefined
        } as AuditLogEntry))

        setEntries(transformedEntries)
      } else {
        console.error('Failed to fetch audit logs:', result.error)
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const parseChangesFromEntry = (entry: any): AuditChangeDetail[] => {
    const changes: AuditChangeDetail[] = []

    // Parse old and new values from API response
    if (entry.fieldName && (entry.oldValue !== undefined || entry.newValue !== undefined)) {
      changes.push({
        fieldName: entry.field,
        fieldNameTh: entry.fieldName,
        oldValue: entry.oldValue,
        newValue: entry.newValue
      })
    }

    return changes
  }

  const applyFilters = () => {
    let filtered = [...entries]

    // Filter by action type
    if (filters.actionType && filters.actionType !== 'ALL') {
      filtered = filtered.filter(e => e.action === filters.actionType)
    }

    // Filter by entity type
    if (filters.entityType && filters.entityType !== 'ALL') {
      filtered = filtered.filter(e => e.entityType === filters.entityType)
    }

    // Filter by date range
    if (filters.startDate) {
      filtered = filtered.filter(e => e.timestamp >= filters.startDate!)
    }
    if (filters.endDate) {
      const endDate = new Date(filters.endDate)
      endDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter(e => e.timestamp <= endDate)
    }

    // Filter by user
    if (filters.userId) {
      filtered = filtered.filter(e => e.userId === filters.userId)
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    setFilteredEntries(filtered)
  }

  const clearFilters = () => {
    setFilters({
      actionType: 'ALL',
      entityType: entityType,
      startDate: undefined,
      endDate: undefined,
      userId: undefined
    })
  }

  const uniqueUsers = Array.from(
    new Map(entries.map(e => [e.userId, e.userName])).entries()
  )

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            ประวัติการแก้ไข ({entries.length})
          </CardTitle>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAuditLogs}
              disabled={loading}
            >
              <RefreshCw className={cn(
                'h-4 w-4 mr-1',
                loading && 'animate-spin'
              )} />
              รีเฟรช
            </Button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-2 mt-4 p-4 bg-muted/30 rounded-lg">
            <Filter className="h-4 w-4 text-muted-foreground" />

            {/* Action Type Filter */}
            <Select
              value={filters.actionType}
              onValueChange={(value) =>
                setFilters(f => ({ ...f, actionType: value as AuditAction | 'ALL' }))
              }
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="กระทำการ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">ทั้งหมด</SelectItem>
                <SelectItem value="CREATED">สร้าง</SelectItem>
                <SelectItem value="UPDATED">แก้ไข</SelectItem>
                <SelectItem value="DELETED">ลบ</SelectItem>
                <SelectItem value="VIEW">ดู</SelectItem>
              </SelectContent>
            </Select>

            {/* Entity Type Filter */}
            <Select
              value={filters.entityType}
              onValueChange={(value) =>
                setFilters(f => ({ ...f, entityType: value as EntityType }))
              }
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="ประเภท" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">ทั้งหมด</SelectItem>
                <SelectItem value="INVOICE">ใบกำกับภาษี</SelectItem>
                <SelectItem value="LINE_ITEM">รายการ</SelectItem>
              </SelectContent>
            </Select>

            {/* User Filter */}
            {uniqueUsers.length > 0 && (
              <Select
                value={filters.userId || 'ALL'}
                onValueChange={(value) =>
                  setFilters(f => ({ ...f, userId: value === 'ALL' ? undefined : value }))
                }
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="ผู้ใช้" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">ทุกผู้ใช้</SelectItem>
                  {uniqueUsers.map(([userId, userName]) => (
                    <SelectItem key={userId} value={userId}>
                      {userName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Start Date Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-[140px] justify-start text-left font-normal',
                    !filters.startDate && 'text-muted-foreground'
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {filters.startDate ? (
                    formatThaiDate(filters.startDate)
                  ) : (
                    <span>จากวันที่</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.startDate}
                  onSelect={(date) =>
                    setFilters(f => ({ ...f, startDate: date || undefined }))
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {/* End Date Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-[140px] justify-start text-left font-normal',
                    !filters.endDate && 'text-muted-foreground'
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {filters.endDate ? (
                    formatThaiDate(filters.endDate)
                  ) : (
                    <span>ถึงวันที่</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.endDate}
                  onSelect={(date) =>
                    setFilters(f => ({ ...f, endDate: date || undefined }))
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {/* Clear Filters */}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-xs"
            >
              ล้างตัวกรอง
            </Button>

            {/* Filter Summary */}
            <div className="ml-auto text-xs text-muted-foreground">
              แสดง {filteredEntries.length} / {entries.length} รายการ
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">กำลังโหลด...</span>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            {entries.length === 0 ? (
              <>
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>ไม่มีประวัติการแก้ไข</p>
              </>
            ) : (
              <>
                <Filter className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>ไม่พบข้อมูลที่ตรงกับเงื่อนไข</p>
                <Button
                  variant="link"
                  size="sm"
                  onClick={clearFilters}
                  className="mt-2"
                >
                  ล้างตัวกรอง
                </Button>
              </>
            )}
          </div>
        ) : (
          <ScrollArea style={{ maxHeight }} className="pr-4">
            <div className="space-y-0">
              {filteredEntries.map((entry, idx) => (
                <TimelineEntry
                  key={entry.id}
                  entry={entry}
                  isLast={idx === filteredEntries.length - 1}
                  compact={compact}
                  onClick={onEntryClick}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
