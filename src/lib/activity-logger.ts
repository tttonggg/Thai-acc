// Activity Logger
// บันทึกกิจกรรมของผู้ใช้ในระบบ

import { prisma } from './db';
import type { Prisma } from '@prisma/client';

export interface ActivityLogOptions {
  userId: string;
  action: string; // LOGIN, LOGOUT, CREATE, UPDATE, DELETE, POST, VIEW, EXPORT, etc.
  module: string; // invoices, payments, inventory, banking, assets, payroll, petty-cash, etc.
  recordId?: string; // ID of affected record
  details?: any; // Additional context (JSON data)
  ipAddress?: string;
  status?: 'success' | 'failed';
  errorMessage?: string;
}

/**
 * Log user activity to the database
 * This function is non-blocking - it runs in the background
 */
export async function logActivity(options: ActivityLogOptions): Promise<void> {
  const {
    userId,
    action,
    module,
    recordId,
    details,
    ipAddress,
    status = 'success',
    errorMessage,
  } = options;

  try {
    // Run asynchronously in the background
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        module,
        recordId,
        details: details ? JSON.parse(JSON.stringify(details)) : null,
        ipAddress: ipAddress || null,
        status,
        errorMessage,
      },
    });
  } catch (error) {
    // Silent fail - don't break the main operation if logging fails
    console.error('Failed to log activity:', error);
  }
}

/**
 * Log successful login
 */
export async function logLogin(userId: string, ipAddress?: string): Promise<void> {
  await logActivity({
    userId,
    action: 'LOGIN',
    module: 'auth',
    ipAddress,
    status: 'success',
  });
}

/**
 * Log failed login attempt
 */
export async function logFailedLogin(
  email: string,
  ipAddress?: string,
  errorMessage?: string
): Promise<void> {
  // For failed logins, we might not have a userId
  // In this case, we'll use a special system user ID or skip userId
  try {
    await prisma.activityLog.create({
      data: {
        userId: 'system', // Placeholder for failed logins
        action: 'LOGIN',
        module: 'auth',
        details: { email },
        ipAddress: ipAddress || null,
        status: 'failed',
        errorMessage: errorMessage || 'Invalid credentials',
      },
    });
  } catch (error) {
    console.error('Failed to log failed login:', error);
  }
}

/**
 * Log logout
 */
export async function logLogout(userId: string, ipAddress?: string): Promise<void> {
  await logActivity({
    userId,
    action: 'LOGOUT',
    module: 'auth',
    ipAddress,
    status: 'success',
  });
}

/**
 * Log CRUD operations
 */
export async function logCreate(
  userId: string,
  module: string,
  recordId: string,
  details?: any,
  ipAddress?: string
): Promise<void> {
  await logActivity({
    userId,
    action: 'CREATE',
    module,
    recordId,
    details,
    ipAddress,
    status: 'success',
  });
}

/**
 * Log CRUD operations with explicit transaction client
 */
export async function logCreateTx(
  tx: Prisma.TransactionClient,
  userId: string,
  module: string,
  recordId: string,
  details?: any,
  ipAddress?: string
): Promise<void> {
  await tx.activityLog.create({
    data: {
      userId,
      action: 'CREATE',
      module,
      recordId,
      details: details ? JSON.parse(JSON.stringify(details)) : null,
      ipAddress: ipAddress || null,
      status: 'success',
    },
  });
}

export async function logUpdate(
  userId: string,
  module: string,
  recordId: string,
  details?: any,
  ipAddress?: string
): Promise<void> {
  await logActivity({
    userId,
    action: 'UPDATE',
    module,
    recordId,
    details,
    ipAddress,
    status: 'success',
  });
}

export async function logDelete(
  userId: string,
  module: string,
  recordId: string,
  details?: any,
  ipAddress?: string
): Promise<void> {
  await logActivity({
    userId,
    action: 'DELETE',
    module,
    recordId,
    details,
    ipAddress,
    status: 'success',
  });
}

/**
 * Log GL posting
 */
export async function logPost(
  userId: string,
  module: string,
  recordId: string,
  details?: any,
  ipAddress?: string
): Promise<void> {
  await logActivity({
    userId,
    action: 'POST',
    module,
    recordId,
    details,
    ipAddress,
    status: 'success',
  });
}

/**
 * Log document view
 */
export async function logView(
  userId: string,
  module: string,
  recordId: string,
  ipAddress?: string
): Promise<void> {
  await logActivity({
    userId,
    action: 'VIEW',
    module,
    recordId,
    ipAddress,
    status: 'success',
  });
}

/**
 * Log export operation
 */
export async function logExport(
  userId: string,
  module: string,
  details?: any,
  ipAddress?: string
): Promise<void> {
  await logActivity({
    userId,
    action: 'EXPORT',
    module,
    details,
    ipAddress,
    status: 'success',
  });
}

/**
 * Log failed operation
 */
export async function logError(
  userId: string,
  action: string,
  module: string,
  errorMessage: string,
  details?: any,
  ipAddress?: string
): Promise<void> {
  await logActivity({
    userId,
    action,
    module,
    details,
    ipAddress,
    status: 'failed',
    errorMessage,
  });
}
