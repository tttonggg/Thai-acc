/**
 * Audit Service for Financial Mutations
 * Provides comprehensive audit logging with tamper-evident hash chain
 */

import { prisma } from './db';
import { createHash } from './encryption';

export type AuditAction = 
  | 'CREATE' | 'UPDATE' | 'DELETE' 
  | 'POST' | 'VOID' | 'APPROVE' | 'REJECT'
  | 'EXPORT' | 'IMPORT' | 'VIEW'
  | 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED'
  | 'MFA_SETUP' | 'MFA_DISABLE' | 'PASSWORD_RESET'
  | 'SESSION_TERMINATED' | 'PRIVILEGE_ESCALATION';

export interface AuditLogEntry {
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
  ipAddress: string;
  userAgent: string;
  metadata?: Record<string, unknown>;
}

// Fields that should be masked in audit logs
const SENSITIVE_AUDIT_FIELDS = [
  'password', 'mfaSecret', 'token', 'secret', 
  'taxId', 'bankAccount', 'bankAccountNo',
  'idCardNumber', 'socialSecurityNo', 'signature'
];

/**
 * Sanitize sensitive data before logging
 */
function sanitizeForAudit(data: Record<string, unknown> | null | undefined): Record<string, unknown> | null {
  if (!data) return null;
  
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_AUDIT_FIELDS.includes(key)) {
      sanitized[key] = value ? '[REDACTED]' : null;
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeForAudit(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'object' && item !== null 
          ? sanitizeForAudit(item as Record<string, unknown>)
          : item
      );
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
 * Uses SHA-256 chain: hash(prevHash + currentData)
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
        beforeState: sanitizedBefore as any,
        afterState: sanitizedAfter as any,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        hash,
        prevHash,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - audit logging should not break business logic
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
  userAgent: string,
  metadata?: Record<string, unknown>
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
    metadata,
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
    logs: logs.map(log => ({
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
  action: 'LOGIN' | 'LOGIN_FAILED' | 'LOGOUT' | 'MFA_SETUP' | 'MFA_DISABLE' | 
          'PASSWORD_RESET' | 'SESSION_TERMINATED' | 'PRIVILEGE_ESCALATION',
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

/**
 * Export audit logs to syslog/SIEM format
 */
export function exportToSyslogFormat(logs: Array<{
  timestamp: Date;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  ipAddress: string;
}>): string[] {
  return logs.map(log => {
    // RFC 5424 syslog format
    const timestamp = log.timestamp.toISOString();
    const hostname = 'thai-accounting-erp';
    const appName = 'audit';
    const msgId = log.action;
    
    return `<14>${timestamp} ${hostname} ${appName} - ${msgId} [userId="${log.userId}" entityType="${log.entityType}" entityId="${log.entityId}" ip="${log.ipAddress}"] Audit event: ${log.action}`;
  });
}

/**
 * Export audit logs to JSON format for SIEM integration
 */
export function exportToJSON(logs: Array<{
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeState: unknown;
  afterState: unknown;
  ipAddress: string;
  userAgent: string;
  hash: string;
}>): string {
  return JSON.stringify(logs.map(log => ({
    ...log,
    timestamp: log.timestamp.toISOString(),
    siem_version: '1.0',
    source: 'thai-accounting-erp',
  })), null, 2);
}

/**
 * Helper function to log invoice mutations
 */
export async function logInvoiceMutation(
  userId: string,
  invoiceId: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'POST' | 'VOID',
  beforeData: unknown,
  afterData: unknown,
  ipAddress: string,
  userAgent: string
): Promise<void> {
  await logFinancialMutation(
    userId,
    'Invoice',
    invoiceId,
    action,
    beforeData as Record<string, unknown> | null,
    afterData as Record<string, unknown> | null,
    ipAddress,
    userAgent
  );
}

/**
 * Helper function to log receipt mutations
 */
export async function logReceiptMutation(
  userId: string,
  receiptId: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'POST' | 'VOID',
  beforeData: unknown,
  afterData: unknown,
  ipAddress: string,
  userAgent: string
): Promise<void> {
  await logFinancialMutation(
    userId,
    'Receipt',
    receiptId,
    action,
    beforeData as Record<string, unknown> | null,
    afterData as Record<string, unknown> | null,
    ipAddress,
    userAgent
  );
}

/**
 * Helper function to log payment mutations
 */
export async function logPaymentMutation(
  userId: string,
  paymentId: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'POST' | 'VOID',
  beforeData: unknown,
  afterData: unknown,
  ipAddress: string,
  userAgent: string
): Promise<void> {
  await logFinancialMutation(
    userId,
    'Payment',
    paymentId,
    action,
    beforeData as Record<string, unknown> | null,
    afterData as Record<string, unknown> | null,
    ipAddress,
    userAgent
  );
}

/**
 * Helper function to log journal entry mutations
 */
export async function logJournalMutation(
  userId: string,
  entryId: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'POST' | 'VOID',
  beforeData: unknown,
  afterData: unknown,
  ipAddress: string,
  userAgent: string
): Promise<void> {
  await logFinancialMutation(
    userId,
    'JournalEntry',
    entryId,
    action,
    beforeData as Record<string, unknown> | null,
    afterData as Record<string, unknown> | null,
    ipAddress,
    userAgent
  );
}

/**
 * Helper function to log customer mutations
 */
export async function logCustomerMutation(
  userId: string,
  customerId: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  beforeData: unknown,
  afterData: unknown,
  ipAddress: string,
  userAgent: string
): Promise<void> {
  await logFinancialMutation(
    userId,
    'Customer',
    customerId,
    action,
    beforeData as Record<string, unknown> | null,
    afterData as Record<string, unknown> | null,
    ipAddress,
    userAgent
  );
}

/**
 * Helper function to log vendor mutations
 */
export async function logVendorMutation(
  userId: string,
  vendorId: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  beforeData: unknown,
  afterData: unknown,
  ipAddress: string,
  userAgent: string
): Promise<void> {
  await logFinancialMutation(
    userId,
    'Vendor',
    vendorId,
    action,
    beforeData as Record<string, unknown> | null,
    afterData as Record<string, unknown> | null,
    ipAddress,
    userAgent
  );
}

/**
 * Helper function to log stock movement mutations
 */
export async function logStockMutation(
  userId: string,
  movementId: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  beforeData: unknown,
  afterData: unknown,
  ipAddress: string,
  userAgent: string
): Promise<void> {
  await logFinancialMutation(
    userId,
    'StockMovement',
    movementId,
    action,
    beforeData as Record<string, unknown> | null,
    afterData as Record<string, unknown> | null,
    ipAddress,
    userAgent
  );
}

/**
 * Helper function to log payroll mutations
 */
export async function logPayrollMutation(
  userId: string,
  payrollId: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'POST',
  beforeData: unknown,
  afterData: unknown,
  ipAddress: string,
  userAgent: string
): Promise<void> {
  await logFinancialMutation(
    userId,
    'Payroll',
    payrollId,
    action,
    beforeData as Record<string, unknown> | null,
    afterData as Record<string, unknown> | null,
    ipAddress,
    userAgent
  );
}
