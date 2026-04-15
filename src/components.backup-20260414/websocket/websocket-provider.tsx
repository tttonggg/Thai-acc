'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from 'react'

interface WebSocketContextType {
  socket: WebSocket | null
  isConnected: boolean
  lastMessage: WebSocketMessage | null
  sendMessage: (message: unknown) => void
  subscribe: (channel: string, callback: (data: unknown) => void) => () => void
}

interface WebSocketMessage {
  type: string
  channel?: string
  data: unknown
  timestamp: number
}

interface CollaborationUser {
  id: string
  name: string
  avatar?: string
  currentModule?: string
  editingDocument?: {
    module: string
    id: string
    name: string
  }
}

const WebSocketContext = createContext<WebSocketContextType | null>(null)

export function useWebSocket() {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider')
  }
  return context
}

interface WebSocketProviderProps {
  children: ReactNode
  url?: string
  autoReconnect?: boolean
  reconnectInterval?: number
}

export function WebSocketProvider({
  children,
  url = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
  autoReconnect = true,
  reconnectInterval = 3000,
}: WebSocketProviderProps) {
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  const reconnectTimerRef = useRef<NodeJS.Timeout>()
  const subscriptionsRef = useRef<Map<string, Set<(data: unknown) => void>>>(new Map())
  const socketRef = useRef<WebSocket | null>(null)

  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) return

    try {
      const ws = new WebSocket(url)
      socketRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket connected')
        setIsConnected(true)
        setSocket(ws)
      }

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          setLastMessage(message)

          // Notify subscribers
          if (message.channel) {
            const callbacks = subscriptionsRef.current.get(message.channel)
            callbacks?.forEach((cb) => cb(message.data))
          }

          // Notify global subscribers
          const globalCallbacks = subscriptionsRef.current.get('*')
          globalCallbacks?.forEach((cb) => cb(message))
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      ws.onclose = () => {
        console.log('WebSocket disconnected')
        setIsConnected(false)
        setSocket(null)
        socketRef.current = null

        if (autoReconnect) {
          reconnectTimerRef.current = setTimeout(connect, reconnectInterval)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
    } catch (error) {
      console.error('Failed to connect WebSocket:', error)
    }
  }, [url, autoReconnect, reconnectInterval])

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
    }
    socketRef.current?.close()
  }, [])

  useEffect(() => {
    connect()
    return disconnect
  }, [connect, disconnect])

  const sendMessage = useCallback((message: unknown) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket is not connected')
    }
  }, [])

  const subscribe = useCallback((channel: string, callback: (data: unknown) => void) => {
    if (!subscriptionsRef.current.has(channel)) {
      subscriptionsRef.current.set(channel, new Set())
    }
    subscriptionsRef.current.get(channel)!.add(callback)

    // Return unsubscribe function
    return () => {
      subscriptionsRef.current.get(channel)?.delete(callback)
    }
  }, [])

  return (
    <WebSocketContext.Provider
      value={{ socket, isConnected, lastMessage, sendMessage, subscribe }}
    >
      {children}
    </WebSocketContext.Provider>
  )
}

// Hook for real-time collaboration
export function useCollaboration(module?: string, documentId?: string) {
  const { subscribe, sendMessage, isConnected } = useWebSocket()
  const [activeUsers, setActiveUsers] = useState<CollaborationUser[]>([])
  const [editingUsers, setEditingUsers] = useState<CollaborationUser[]>([])
  const [documentLock, setDocumentLock] = useState<{ userId: string; userName: string } | null>(null)

  useEffect(() => {
    if (!isConnected) return

    // Subscribe to presence channel
    const unsubscribePresence = subscribe('presence', (data) => {
      const message = data as { type: string; users: CollaborationUser[] }
      if (message.type === 'presence_update') {
        setActiveUsers(message.users)
      }
    })

    // Subscribe to document-specific channel
    if (module && documentId) {
      const channel = `${module}:${documentId}`
      const unsubscribeDoc = subscribe(channel, (data) => {
        const message = data as { type: string; user: CollaborationUser; lock?: { userId: string; userName: string } }

        if (message.type === 'user_editing') {
          setEditingUsers((prev) => {
            const exists = prev.find((u) => u.id === message.user.id)
            if (exists) return prev
            return [...prev, message.user]
          })
        } else if (message.type === 'user_left') {
          setEditingUsers((prev) => prev.filter((u) => u.id !== message.user.id))
        } else if (message.type === 'document_locked') {
          setDocumentLock(message.lock || null)
        } else if (message.type === 'document_unlocked') {
          setDocumentLock(null)
        }
      })

      // Announce presence
      sendMessage({
        type: 'join_document',
        channel,
        module,
        documentId,
      })

      return () => {
        unsubscribePresence()
        unsubscribeDoc()
        sendMessage({
          type: 'leave_document',
          channel,
          module,
          documentId,
        })
      }
    }

    return unsubscribePresence
  }, [subscribe, sendMessage, isConnected, module, documentId])

  const acquireLock = useCallback(() => {
    if (module && documentId) {
      sendMessage({
        type: 'acquire_lock',
        channel: `${module}:${documentId}`,
        module,
        documentId,
      })
    }
  }, [sendMessage, module, documentId])

  const releaseLock = useCallback(() => {
    if (module && documentId) {
      sendMessage({
        type: 'release_lock',
        channel: `${module}:${documentId}`,
        module,
        documentId,
      })
    }
  }, [sendMessage, module, documentId])

  return {
    activeUsers,
    editingUsers,
    documentLock,
    acquireLock,
    releaseLock,
    isConnected,
  }
}

// Document lock indicator component
export function DocumentLockIndicator({
  lockedBy,
  onRequestAccess,
}: {
  lockedBy: { userId: string; userName: string } | null
  onRequestAccess?: () => void
}) {
  if (!lockedBy) return null

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
      <span className="font-medium">{lockedBy.userName}</span>
      <span>กำลังแก้ไขเอกสารนี้</span>
      {onRequestAccess && (
        <button
          onClick={onRequestAccess}
          className="ml-2 text-amber-600 hover:text-amber-700 underline"
        >
          ขอเข้าใช้งาน
        </button>
      )}
    </div>
  )
}

// User presence indicator
export function UserPresenceIndicator({
  users,
  maxDisplay = 3,
}: {
  users: CollaborationUser[]
  maxDisplay?: number
}) {
  if (users.length === 0) return null

  const displayUsers = users.slice(0, maxDisplay)
  const remaining = users.length - maxDisplay

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-muted-foreground mr-1">กำลังดู:</span>
      {displayUsers.map((user, i) => (
        <div
          key={user.id}
          className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium border-2 border-background"
          style={{ marginLeft: i > 0 ? '-8px' : 0, zIndex: maxDisplay - i }}
          title={user.name}
        >
          {user.name.charAt(0).toUpperCase()}
        </div>
      ))}
      {remaining > 0 && (
        <div
          className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-medium border-2 border-background"
          style={{ marginLeft: '-8px' }}
        >
          +{remaining}
        </div>
      )}
    </div>
  )
}
