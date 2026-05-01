import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { NextApiRequest } from 'next';

export interface SocketServer extends NetServer {
  io?: SocketIOServer;
}

export interface SocketWithIO extends NextApiRequest {
  socket: {
    server: SocketServer;
  };
}

// Socket.IO server instance
let io: SocketIOServer | null = null;

export function getIO(): SocketIOServer | null {
  return io;
}

export function initIO(server: NetServer): SocketIOServer {
  if (io) {
    return io;
  }

  io = new SocketIOServer(server, {
    path: '/api/socket/io',
    addTrailingSlash: false,
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Set up connection handling
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join room based on user ID for targeted notifications
    socket.on('join_user_room', (userId: string) => {
      socket.join(`user:${userId}`);
      console.log(`Socket ${socket.id} joined room user:${userId}`);
    });

    // Join module room for module-wide updates
    socket.on('join_module', (module: string) => {
      socket.join(`module:${module}`);
      console.log(`Socket ${socket.id} joined module:${module}`);
    });

    // Document collaboration
    socket.on('join_document', (data: { module: string; documentId: string }) => {
      const room = `${data.module}:${data.documentId}`;
      socket.join(room);
      socket.to(room).emit('user_joined', {
        socketId: socket.id,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('leave_document', (data: { module: string; documentId: string }) => {
      const room = `${data.module}:${data.documentId}`;
      socket.leave(room);
      socket.to(room).emit('user_left', {
        socketId: socket.id,
        timestamp: new Date().toISOString(),
      });
    });

    // Document editing lock
    socket.on(
      'acquire_lock',
      (data: { module: string; documentId: string; userId: string; userName: string }) => {
        const room = `${data.module}:${data.documentId}`;
        socket.to(room).emit('document_locked', {
          userId: data.userId,
          userName: data.userName,
        });
      }
    );

    socket.on('release_lock', (data: { module: string; documentId: string }) => {
      const room = `${data.module}:${data.documentId}`;
      socket.to(room).emit('document_unlocked');
    });

    // Cursor position for live collaboration
    socket.on(
      'cursor_move',
      (data: { module: string; documentId: string; cursor: { x: number; y: number } }) => {
        const room = `${data.module}:${data.documentId}`;
        socket.to(room).emit('cursor_update', {
          socketId: socket.id,
          cursor: data.cursor,
        });
      }
    );

    // Activity updates
    socket.on('activity', (data: { type: string; activity: unknown }) => {
      // Broadcast to all clients except sender
      socket.broadcast.emit('new_activity', data);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}

// Helper functions for emitting events
export function emitToUser(userId: string, event: string, data: unknown) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
}

export function emitToModule(module: string, event: string, data: unknown) {
  if (!io) return;
  io.to(`module:${module}`).emit(event, data);
}

export function emitToDocument(module: string, documentId: string, event: string, data: unknown) {
  if (!io) return;
  io.to(`${module}:${documentId}`).emit(event, data);
}

export function broadcast(event: string, data: unknown) {
  if (!io) return;
  io.emit(event, data);
}

// Presence tracking
const onlineUsers = new Map<string, { id: string; name: string; lastActive: Date }>();

export function trackUserPresence(userId: string, userName: string) {
  onlineUsers.set(userId, {
    id: userId,
    name: userName,
    lastActive: new Date(),
  });

  // Broadcast updated user list
  broadcastPresence();
}

export function removeUserPresence(userId: string) {
  onlineUsers.delete(userId);
  broadcastPresence();
}

export function updateUserActivity(userId: string) {
  const user = onlineUsers.get(userId);
  if (user) {
    user.lastActive = new Date();
    onlineUsers.set(userId, user);
  }
}

function broadcastPresence() {
  if (!io) return;

  const users = Array.from(onlineUsers.values()).map((u) => ({
    ...u,
    lastActive: u.lastActive.toISOString(),
  }));

  io.emit('presence_update', { users });
}

// Clean up inactive users periodically
setInterval(() => {
  const now = new Date();
  const inactiveThreshold = 5 * 60 * 1000; // 5 minutes

  let changed = false;
  onlineUsers.forEach((user, userId) => {
    if (now.getTime() - user.lastActive.getTime() > inactiveThreshold) {
      onlineUsers.delete(userId);
      changed = true;
    }
  });

  if (changed) {
    broadcastPresence();
  }
}, 60000); // Check every minute

// Notification helpers
export function sendNotification(
  userId: string,
  notification: {
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    data?: Record<string, unknown>;
  }
) {
  emitToUser(userId, 'notification', {
    ...notification,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  });
}

export function broadcastNotification(notification: {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  data?: Record<string, unknown>;
}) {
  broadcast('notification', {
    ...notification,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  });
}
