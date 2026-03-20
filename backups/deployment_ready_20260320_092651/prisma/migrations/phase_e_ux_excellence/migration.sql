-- Phase E: UX Excellence Migration
-- Add tables for user preferences, saved filters, notifications, recent items, document locks, and activity feed

-- User Preferences
CREATE TABLE IF NOT EXISTS "UserPreference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'system',
    "density" TEXT NOT NULL DEFAULT 'normal',
    "language" TEXT NOT NULL DEFAULT 'th',
    "pageSize" INTEGER NOT NULL DEFAULT 25,
    "dateFormat" TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
    "currencyFormat" TEXT NOT NULL DEFAULT 'THB',
    "dashboardLayout" TEXT,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserPreference_userId_unique" UNIQUE ("userId"),
    CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "UserPreference_userId_idx" ON "UserPreference"("userId");

-- Saved Filters
CREATE TABLE IF NOT EXISTS "SavedFilter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "filters" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "sortField" TEXT,
    "sortOrder" TEXT NOT NULL DEFAULT 'desc',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE INDEX IF NOT EXISTS "SavedFilter_userId_idx" ON "SavedFilter"("userId");
CREATE INDEX IF NOT EXISTS "SavedFilter_module_idx" ON "SavedFilter"("module");

-- Notifications
CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "module" TEXT,
    "recordId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" DATETIME,
    "actionUrl" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS "Notification_isRead_idx" ON "Notification"("isRead");
CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx" ON "Notification"("createdAt");

-- Recent Items
CREATE TABLE IF NOT EXISTS "RecentItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "recordType" TEXT NOT NULL,
    "recordName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "accessedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "RecentItem_userId_idx" ON "RecentItem"("userId");
CREATE INDEX IF NOT EXISTS "RecentItem_module_idx" ON "RecentItem"("module");
CREATE INDEX IF NOT EXISTS "RecentItem_accessedAt_idx" ON "RecentItem"("accessedAt");
CREATE UNIQUE INDEX IF NOT EXISTS "RecentItem_userId_module_recordId_key" ON "RecentItem"("userId", "module", "recordId");

-- Document Locks (Collaboration)
CREATE TABLE IF NOT EXISTS "DocumentLock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "module" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "lockedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "sessionId" TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS "DocumentLock_module_recordId_idx" ON "DocumentLock"("module", "recordId");
CREATE INDEX IF NOT EXISTS "DocumentLock_userId_idx" ON "DocumentLock"("userId");
CREATE INDEX IF NOT EXISTS "DocumentLock_expiresAt_idx" ON "DocumentLock"("expiresAt");
CREATE UNIQUE INDEX IF NOT EXISTS "DocumentLock_module_recordId_key" ON "DocumentLock"("module", "recordId");

-- Activity Feed
CREATE TABLE IF NOT EXISTS "ActivityFeed" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "userName" TEXT,
    "action" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "recordId" TEXT,
    "recordName" TEXT,
    "details" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "ActivityFeed_module_idx" ON "ActivityFeed"("module");
CREATE INDEX IF NOT EXISTS "ActivityFeed_createdAt_idx" ON "ActivityFeed"("createdAt");
CREATE INDEX IF NOT EXISTS "ActivityFeed_userId_idx" ON "ActivityFeed"("userId");

-- Clean up expired locks (run periodically)
DELETE FROM "DocumentLock" WHERE "expiresAt" < datetime('now');
