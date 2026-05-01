/**
 * Database Helper Functions
 *
 * Common query patterns and utilities for database operations
 * Helps reduce code duplication and prevent N+1 queries
 */

import { PrismaClient } from '@prisma/client';
import { NotFoundError, DatabaseError } from './errors';

// ============================================================================
// Pagination Helpers
// ============================================================================

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Apply pagination to a Prisma query
 */
export async function paginate<T>(
  query: any,
  params: PaginationParams
): Promise<PaginatedResult<T>> {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
  const skip = (page - 1) * pageSize;

  // Get total count
  const total = await query.count();

  // Apply pagination
  const data = await query.take(pageSize).skip(skip);

  const totalPages = Math.ceil(total / pageSize);

  return {
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/**
 * Apply sorting to a Prisma query
 */
export function applySorting(
  query: any,
  orderBy?: string,
  orderDirection: 'asc' | 'desc' = 'asc'
): any {
  if (!orderBy) return query;

  // Handle nested sorting (e.g., "customer.name")
  const orderByField = orderBy.split('.').reduce((obj, field, index, arr) => {
    if (index === arr.length - 1) {
      obj[field] = orderDirection;
    } else {
      obj[field] = {};
    }
    return obj[field];
  }, {} as any);

  return query.orderBy(orderByField);
}

// ============================================================================
// Common Query Patterns
// ============================================================================

/**
 * Find a record by ID or throw NotFoundError
 */
export async function findByIdOrThrow<T>(model: any, id: string, include?: any): Promise<T> {
  const record = await model.findUnique({
    where: { id },
    include,
  });

  if (!record) {
    throw new NotFoundError(model.name || 'Record', id);
  }

  return record as T;
}

/**
 * Find a record with related data (prevents N+1)
 */
export async function findWithRelations<T>(
  model: any,
  where: any,
  include: any
): Promise<T | null> {
  return await model.findFirst({
    where,
    include,
  });
}

/**
 * Find multiple records with related data (prevents N+1)
 */
export async function findManyWithRelations<T>(
  model: any,
  where?: any,
  include?: any,
  orderBy?: any,
  take?: number,
  skip?: number
): Promise<T[]> {
  return await model.findMany({
    where,
    include,
    orderBy,
    take,
    skip,
  });
}

// ============================================================================
// Transaction Helpers
// ============================================================================

/**
 * Execute a transaction with automatic retry on deadlock
 */
export async function transactionWithRetry<T>(
  prisma: PrismaClient,
  callback: (tx: PrismaClient) => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        return await callback(tx);
      });
    } catch (error: any) {
      // Retry on deadlock (code P2034)
      if (error.code === 'P2034' && attempt < maxRetries) {
        console.warn(
          `[Transaction] Deadlock detected, retrying (attempt ${attempt + 1}/${maxRetries})`
        );
        await new Promise((resolve) => setTimeout(resolve, 100 * attempt)); // Exponential backoff
        continue;
      }
      throw error;
    }
  }

  throw new DatabaseError('Transaction failed after maximum retries');
}

/**
 * Execute multiple operations in a transaction
 */
export async function executeTransaction<T>(
  prisma: PrismaClient,
  operations: ((tx: PrismaClient) => Promise<any>)[]
): Promise<T[]> {
  return await prisma.$transaction(operations.map((op) => async (tx) => await op(tx)));
}

// ============================================================================
// Batch Operations
// ============================================================================

/**
 * Create or update multiple records in a transaction
 */
export async function upsertBatch<T>(
  prisma: PrismaClient,
  model: string,
  records: Array<{
    where: any;
    create: any;
    update: any;
  }>
): Promise<T[]> {
  const results = await prisma.$transaction(
    records.map((record) => (prisma as any)[model].upsert(record))
  );

  return results as T[];
}

/**
 * Delete multiple records by IDs
 */
export async function deleteManyByIds(model: any, ids: string[]): Promise<{ count: number }> {
  return await model.deleteMany({
    where: {
      id: { in: ids },
    },
  });
}

// ============================================================================
// Query Building Helpers
// ============================================================================

/**
 * Build a "where" clause with optional filters
 */
export function buildWhereClause(filters: Record<string, any>): any {
  const where: any = {};

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }

    // Handle array values (IN clause)
    if (Array.isArray(value)) {
      where[key] = { in: value };
    }
    // Handle string search (contains)
    else if (typeof value === 'string' && key.includes('search')) {
      const field = key.replace('search', '').toLowerCase();
      where[field] = { contains: value, mode: 'insensitive' };
    }
    // Handle range queries (min/max)
    else if (key.startsWith('min')) {
      const field = key.replace('min', '').toLowerCase();
      where[field] = { gte: value };
    } else if (key.startsWith('max')) {
      const field = key.replace('max', '').toLowerCase();
      where[field] = { lte: value };
    }
    // Direct equality
    else {
      where[key] = value;
    }
  }

  return where;
}

/**
 * Build date range filter
 */
export function buildDateRangeFilter(field: string, startDate?: Date, endDate?: Date): any {
  const filter: any = {};

  if (startDate) {
    filter.gte = startDate;
  }

  if (endDate) {
    filter.lte = endDate;
  }

  return Object.keys(filter).length > 0 ? { [field]: filter } : {};
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Check if a record exists
 */
export async function exists(model: any, where: any): Promise<boolean> {
  const count = await model.count({ where });
  return count > 0;
}

/**
 * Check if a record exists and throw error if not
 */
export async function existsOrThrow(
  model: any,
  where: any,
  resource: string = 'Record'
): Promise<void> {
  const record = await model.findFirst({ where });

  if (!record) {
    throw new NotFoundError(resource);
  }
}

/**
 * Validate unique constraint
 */
export async function isUnique(
  model: any,
  field: string,
  value: any,
  excludeId?: string
): Promise<boolean> {
  const where: any = { [field]: value };

  if (excludeId) {
    where.id = { not: excludeId };
  }

  const count = await model.count({ where });
  return count === 0;
}

// ============================================================================
// Aggregation Helpers
// ============================================================================

/**
 * Get sum of a field
 */
export async function sumField(model: any, field: string, where?: any): Promise<number> {
  const result = await model.aggregate({
    where,
    _sum: { [field]: true },
  });

  return (result._sum[field] as number) || 0;
}

/**
 * Get average of a field
 */
export async function averageField(model: any, field: string, where?: any): Promise<number> {
  const result = await model.aggregate({
    where,
    _avg: { [field]: true },
  });

  return (result._avg[field] as number) || 0;
}

/**
 * Get count grouped by a field
 */
export async function countByField(
  model: any,
  field: string,
  where?: any
): Promise<Array<{ [key: string]: number; _count: number }>> {
  return await model.groupBy({
    by: [field],
    where,
    _count: true,
  });
}

// ============================================================================
// Soft Delete Helpers
// ============================================================================

/**
 * Soft delete a record (set deletedAt timestamp)
 */
export async function softDelete(model: any, id: string): Promise<any> {
  return await model.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

/**
 * Restore a soft-deleted record
 */
export async function restore(model: any, id: string): Promise<any> {
  return await model.update({
    where: { id },
    data: { deletedAt: null },
  });
}

/**
 * Find only non-deleted records
 */
export function findNotDeleted(model: any) {
  return model.findMany({
    where: { deletedAt: null },
  });
}

// ============================================================================
// Export all helpers
// ============================================================================

export const dbHelpers = {
  paginate,
  applySorting,
  findByIdOrThrow,
  findWithRelations,
  findManyWithRelations,
  transactionWithRetry,
  executeTransaction,
  upsertBatch,
  deleteManyByIds,
  buildWhereClause,
  buildDateRangeFilter,
  exists,
  existsOrThrow,
  isUnique,
  sumField,
  averageField,
  countByField,
  softDelete,
  restore,
  findNotDeleted,
};
