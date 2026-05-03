/**
 * Audit Logger Service with Tamper-Evident Hash Chain
 * Records all financial mutations and security events
 */

import { prisma } from './db';
import { createHash } from './encryption-service';
import { encrypt, decrypt } from './encryption-service';

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_FAILED'
  | 'POST'
  | 'VOID'
  | 'APPROVE'
  | 'REJECT'
  | 'EXPORT'
  | 'IMPORT'
  | 'VIEW'
  | 'MFA_SETUP'
  | 'MFA_DISABLE'
  | 'PASSWORD_RESET'
  | 'SESSION_TERMINATED'
  | 'PRIVILEGE_ESCALATION';

export interface AuditLogEntry {
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
  ipAddress: string;
  userAgent: string;
}

// Fields that should be encrypted in audit logs
const SENSITIVE_AUDIT_FIELDS = [
  'password',
  'mfaSecret',
  'token',
  'secret',
  'taxId',
  'bankAccount',
  'bankAccountNo',
  'idCardNumber',
  'socialSecurityNo',
  'signature',
];

/**
 * Sanitize sensitive data before logging
 */
function sanitizeForAudit(
  data: Record<string, unknown> | null | undefined
): Record<string, unknown> | null {
  if (!data) return null;

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_AUDIT_FIELDS.includes(key)) {
      sanitized[key] = value ? '[ENCRYPTED]' : null;
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeForAudit(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Get the last audit log hash for chain integrity
 */
async function getLastHash(): Promise<string | null> {
  const lastLog = await prisma.auditLog.findFirst({
    orderBy: { timestamp: 'desc' },
    select: { hash: true },
  });
  return lastLog?.hash || null;
}

/**
 * Create tamper-evident hash for audit entry
 */
function createAuditHash(
  entry: Omit<AuditLogEntry, 'ipAddress' | 'userAgent'>,
  prevHash: string | null,
  timestamp: Date
): string {
  const data = JSON.stringify({
    userId: entry.userId,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    beforeState: entry.beforeState,
    afterState: entry.afterState,
    timestamp: timestamp.toISOString(),
    prevHash,
  });
  return createHash(data);
}

/**
 * Log an audit event
 */
export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    const prevHash = await getLastHash();
    const timestamp = new Date();

    // Sanitize sensitive data
    const sanitizedBefore = sanitizeForAudit(entry.beforeState);
    const sanitizedAfter = sanitizeForAudit(entry.afterState);

    // Create tamper-evident hash
    const hash = createAuditHash(
      {
        userId: entry.userId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        beforeState: sanitizedBefore,
        afterState: sanitizedAfter,
      },
      prevHash,
      timestamp
    );

    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        beforeState: sanitizedBefore ? JSON.stringify(sanitizedBefore) : undefined,
        afterState: sanitizedAfter ? JSON.stringify(sanitizedAfter) : undefined,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        hash,
        prevHash,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - audit logging should not break business logic
    // But in production, you might want to alert administrators
  }
}

/**
 * Log financial mutations with full state tracking
 */
export async function logFinancialMutation<T extends Record<string, unknown>>(
  userId: string,
  entityType: string,
  entityId: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'POST' | 'VOID',
  beforeData: T | null,
  afterData: T | null,
  ipAddress: string,
  userAgent: string
): Promise<void> {
  await logAudit({
    userId,
    action,
    entityType,
    entityId,
    beforeState: beforeData,
    afterState: afterData,
    ipAddress,
    userAgent,
  });
}

/**
 * Verify audit log integrity
 * Returns true if all hashes are valid and chain is intact
 */
export async function verifyAuditIntegrity(): Promise<{
  valid: boolean;
  totalRecords: number;
  invalidRecords: Array<{ id: string; reason: string }>;
}> {
  const logs = await prisma.auditLog.findMany({
    orderBy: { timestamp: 'asc' },
  });

  const invalidRecords: Array<{ id: string; reason: string }> = [];
  let prevHash: string | null = null;

  for (const log of logs) {
    // Verify chain integrity
    if (log.prevHash !== prevHash) {
      invalidRecords.push({
        id: log.id,
        reason: 'Previous hash mismatch - chain broken',
      });
      continue;
    }

    // Verify entry hash
    const expectedHash = createAuditHash(
      {
        userId: log.userId,
        action: log.action as AuditAction,
        entityType: log.entityType,
        entityId: log.entityId,
        beforeState: log.beforeState as Record<string, unknown> | null,
        afterState: log.afterState as Record<string, unknown> | null,
      },
      log.prevHash,
      log.timestamp
    );

    if (log.hash !== expectedHash) {
      invalidRecords.push({
        id: log.id,
        reason: 'Hash mismatch - data may have been tampered',
      });
      continue;
    }

    prevHash = log.hash;
  }

  return {
    valid: invalidRecords.length === 0,
    totalRecords: logs.length,
    invalidRecords,
  };
}

/**
 * Get audit logs with filtering
 */
export async function getAuditLogs(filters: {
  userId?: string;
  action?: AuditAction;
  entityType?: string;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}): Promise<{
  logs: Array<{
    id: string;
    timestamp: Date;
    userId: string;
    userEmail: string;
    action: string;
    entityType: string;
    entityId: string;
    beforeState: Record<string, unknown> | null;
    afterState: Record<string, unknown> | null;
    ipAddress: string;
    userAgent: string;
    hash: string;
  }>;
  total: number;
}> {
  const where: Record<string, unknown> = {};

  if (filters.userId) where.userId = filters.userId;
  if (filters.action) where.action = filters.action;
  if (filters.entityType) where.entityType = filters.entityType;
  if (filters.entityId) where.entityId = filters.entityId;
  if (filters.startDate || filters.endDate) {
    where.timestamp = {};
    if (filters.startDate) (where.timestamp as Record<string, Date>).gte = filters.startDate;
    if (filters.endDate) (where.timestamp as Record<string, Date>).lte = filters.endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { email: true } } },
      orderBy: { timestamp: 'desc' },
      take: filters.limit ?? 50,
      skip: filters.offset ?? 0,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs: logs.map((log) => ({
      id: log.id,
      timestamp: log.timestamp,
      userId: log.userId,
      userEmail: (log as unknown as { user: { email: string } }).user?.email || 'Unknown',
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      beforeState: log.beforeState as Record<string, unknown> | null,
      afterState: log.afterState as Record<string, unknown> | null,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      hash: log.hash,
    })),
    total,
  };
}

/**
 * Log security events
 */
export async function logSecurityEvent(
  userId: string | null,
  action:
    | 'LOGIN'
    | 'LOGIN_FAILED'
    | 'LOGOUT'
    | 'MFA_SETUP'
    | 'MFA_DISABLE'
    | 'PASSWORD_RESET'
    | 'SESSION_TERMINATED'
    | 'PRIVILEGE_ESCALATION'
    | 'VIEW',
  details: Record<string, unknown>,
  ipAddress: string,
  userAgent: string
): Promise<void> {
  await logAudit({
    userId: userId || 'anonymous',
    action,
    entityType: 'SECURITY',
    entityId: userId || 'anonymous',
    beforeState: null,
    afterState: details,
    ipAddress,
    userAgent,
  });
}
