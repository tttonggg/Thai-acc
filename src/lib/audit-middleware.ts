/**
 * Audit Middleware for Financial API Endpoints
 * Automatically logs all mutations (CREATE, UPDATE, DELETE, POST, VOID)
 */

import { NextRequest, NextResponse } from 'next/server';
import { logFinancialMutation } from './audit-logger';
import { getClientIp } from './api-auth';

export interface AuditContext {
  userId: string;
  entityType: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'POST' | 'VOID';
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
}

/**
 * Higher-order function to wrap API handlers with audit logging
 */
export function withAudit<
  T extends (request: NextRequest, ...args: any[]) => Promise<NextResponse>
>(
  handler: T,
  options: {
    entityType: string;
    getEntityId?: (request: NextRequest, response: NextResponse) => string | Promise<string>;
    extractBeforeState?: (request: NextRequest) => Promise<Record<string, unknown> | null>;
    extractAfterState?: (response: NextResponse) => Promise<Record<string, unknown> | null>;
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'POST' | 'VOID';
  }
): T {
  return (async (request: NextRequest, ...args: any[]) => {
    // Extract before state if applicable
    const beforeState = options.extractBeforeState 
      ? await options.extractBeforeState(request)
      : null;

    // Execute the handler
    const response = await handler(request, ...args);

    // Only log successful operations
    if (response.status >= 200 && response.status < 300) {
      try {
        const userHeader = request.headers.get('x-user-id');
        const userId = userHeader || 'system';
        const userAgent = request.headers.get('user-agent') || 'unknown';
        const ipAddress = getClientIp(request);

        // Get entity ID
        let entityId = 'unknown';
        if (options.getEntityId) {
          entityId = await options.getEntityId(request, response);
        } else {
          // Try to extract from URL params
          const url = new URL(request.url);
          const pathParts = url.pathname.split('/');
          entityId = pathParts[pathParts.length - 1] || 'unknown';
        }

        // Extract after state from response
        let afterState: Record<string, unknown> | null = null;
        if (options.extractAfterState) {
          afterState = await options.extractAfterState(response);
        } else {
          // Try to parse response body
          try {
            const clonedResponse = response.clone();
            const body = await clonedResponse.json();
            if (body.data) {
              afterState = body.data as Record<string, unknown>;
            }
          } catch {
            // Response body not JSON, skip
          }
        }

        await logFinancialMutation(
          userId,
          options.entityType,
          entityId,
          options.action,
          beforeState,
          afterState,
          ipAddress,
          userAgent
        );
      } catch (error) {
        console.error('Audit logging failed:', error);
        // Don't throw - audit logging should not break business logic
      }
    }

    return response;
  }) as T;
}

/**
 * Helper to extract entity ID from URL path
 */
export function extractEntityIdFromPath(request: NextRequest, position: number = -1): string {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  if (position < 0) {
    return pathParts[pathParts.length + position] || 'unknown';
  }
  return pathParts[position] || 'unknown';
}

/**
 * Helper to clone and parse response body
 */
export async function extractResponseBody<T>(
  response: NextResponse
): Promise<T | null> {
  try {
    const cloned = response.clone();
    const body = await cloned.json();
    return body as T;
  } catch {
    return null;
  }
}

/**
 * Audit wrapper specifically for POST (create) operations
 */
export function auditCreate<T extends (request: NextRequest) => Promise<NextResponse>>(
  handler: T,
  entityType: string
): T {
  return withAudit(handler, {
    entityType,
    action: 'CREATE',
    getEntityId: async (_, response) => {
      const body = await extractResponseBody<{ data?: { id?: string } }>(response);
      return body?.data?.id || 'unknown';
    },
  });
}

/**
 * Audit wrapper specifically for PUT/PATCH (update) operations
 */
export function auditUpdate<T extends (request: NextRequest) => Promise<NextResponse>>(
  handler: T,
  entityType: string,
  getEntityIdFn: (request: NextRequest) => string | Promise<string>
): T {
  return withAudit(handler, {
    entityType,
    action: 'UPDATE',
    getEntityId: async (request) => getEntityIdFn(request),
  });
}

/**
 * Audit wrapper specifically for DELETE operations
 */
export function auditDelete<T extends (request: NextRequest) => Promise<NextResponse>>(
  handler: T,
  entityType: string,
  getEntityIdFn: (request: NextRequest) => string | Promise<string>
): T {
  return withAudit(handler, {
    entityType,
    action: 'DELETE',
    getEntityId: async (request) => getEntityIdFn(request),
  });
}

/**
 * Audit wrapper specifically for POST/POSTING operations (journal entries, etc)
 */
export function auditPost<T extends (request: NextRequest) => Promise<NextResponse>>(
  handler: T,
  entityType: string,
  getEntityIdFn: (request: NextRequest) => string | Promise<string>
): T {
  return withAudit(handler, {
    entityType,
    action: 'POST',
    getEntityId: async (request) => getEntityIdFn(request),
  });
}

/**
 * Audit wrapper specifically for VOID operations
 */
export function auditVoid<T extends (request: NextRequest) => Promise<NextResponse>>(
  handler: T,
  entityType: string,
  getEntityIdFn: (request: NextRequest) => string | Promise<string>
): T {
  return withAudit(handler, {
    entityType,
    action: 'VOID',
    getEntityId: async (request) => getEntityIdFn(request),
  });
}
