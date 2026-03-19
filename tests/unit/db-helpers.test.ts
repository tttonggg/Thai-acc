/**
 * Unit Tests for Database Helpers
 * Tests for src/lib/db-helpers.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  paginate,
  applySorting,
  findByIdOrThrow,
  buildWhereClause,
  buildDateRangeFilter,
  exists,
  isUnique,
} from '../../src/lib/db-helpers';
import { NotFoundError } from '../../src/lib/errors';

// Mock Prisma client
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
  },
  product: {
    findMany: vi.fn(),
    count: vi.fn(),
  },
  $transaction: vi.fn(),
};

describe('paginate', () => {
  it('should paginate results correctly', async () => {
    const mockData = Array.from({ length: 50 }, (_, i) => ({
      id: `user-${i}`,
      name: `User ${i}`,
    }));

    const mockQuery = {
      count: vi.fn().mockResolvedValue(50),
      take: vi.fn().mockReturnThis(),
      skip: vi.fn().mockResolvedValue(mockData.slice(0, 20)),
    };

    const result = await paginate(mockQuery, { page: 1, pageSize: 20 });

    expect(result.data).toHaveLength(20);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.pageSize).toBe(20);
    expect(result.pagination.total).toBe(50);
    expect(result.pagination.totalPages).toBe(3);
    expect(result.pagination.hasNext).toBe(true);
    expect(result.pagination.hasPrev).toBe(false);
  });

  it('should calculate pagination correctly', async () => {
    const mockQuery = {
      count: vi.fn().mockResolvedValue(100),
      take: vi.fn().mockReturnThis(),
      skip: vi.fn().mockResolvedValue([]),
    };

    const result = await paginate(mockQuery, { page: 5, pageSize: 15 });

    expect(result.pagination.page).toBe(5);
    expect(result.pagination.pageSize).toBe(15);
    expect(result.pagination.totalPages).toBe(7);
    expect(result.pagination.hasNext).toBe(true);
    expect(result.pagination.hasPrev).toBe(true);
  });

  it('should limit pageSize to 100', async () => {
    const mockQuery = {
      count: vi.fn().mockResolvedValue(1000),
      take: vi.fn().mockReturnThis(),
      skip: vi.fn().mockResolvedValue([]),
    };

    await paginate(mockQuery, { page: 1, pageSize: 200 });

    expect(mockQuery.take).toHaveBeenCalledWith(100);
  });

  it('should handle last page correctly', async () => {
    const mockQuery = {
      count: vi.fn().mockResolvedValue(25),
      take: vi.fn().mockReturnThis(),
      skip: vi.fn().mockResolvedValue([]),
    };

    const result = await paginate(mockQuery, { page: 2, pageSize: 20 });

    expect(result.pagination.hasNext).toBe(false);
    expect(result.pagination.hasPrev).toBe(true);
  });

  it('should handle empty results', async () => {
    const mockQuery = {
      count: vi.fn().mockResolvedValue(0),
      take: vi.fn().mockReturnThis(),
      skip: vi.fn().mockResolvedValue([]),
    };

    const result = await paginate(mockQuery, { page: 1, pageSize: 20 });

    expect(result.data).toHaveLength(0);
    expect(result.pagination.totalPages).toBe(0);
    expect(result.pagination.hasNext).toBe(false);
  });
});

describe('applySorting', () => {
  it('should not modify query without orderBy', () => {
    const mockQuery = { orderBy: vi.fn().mockReturnThis() };

    const result = applySorting(mockQuery);

    expect(result).toBe(mockQuery);
  });

  it('should apply simple sorting', () => {
    const mockQuery = { orderBy: vi.fn().mockReturnThis() };

    applySorting(mockQuery, 'name');

    expect(mockQuery.orderBy).toHaveBeenCalledWith({ name: 'asc' });
  });

  it('should apply descending sort', () => {
    const mockQuery = { orderBy: vi.fn().mockReturnThis() };

    applySorting(mockQuery, 'createdAt', 'desc');

    expect(mockQuery.orderBy).toHaveBeenCalledWith({ createdAt: 'desc' });
  });

  it('should handle nested sorting', () => {
    const mockQuery = { orderBy: vi.fn().mockReturnThis() };

    applySorting(mockQuery, 'customer.name');

    expect(mockQuery.orderBy).toHaveBeenCalledWith({
      customer: { name: 'asc' },
    });
  });
});

describe('findByIdOrThrow', () => {
  it('should return record when found', async () => {
    const mockUser = { id: '123', name: 'Test User' };
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);

    const result = await findByIdOrThrow(mockPrisma.user, '123');

    expect(result).toEqual(mockUser);
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: '123' },
      include: undefined,
    });
  });

  it('should throw NotFoundError when not found', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(findByIdOrThrow(mockPrisma.user, '999')).rejects.toThrow(
      NotFoundError
    );

    await expect(findByIdOrThrow(mockPrisma.user, '999')).rejects.toThrow(
      'User not found: 999'
    );
  });

  it('should include relations when specified', async () => {
    const mockUser = { id: '123', profile: { id: '456' } };
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);

    await findByIdOrThrow(mockPrisma.user, '123', { profile: true });

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: '123' },
      include: { profile: true },
    });
  });
});

describe('buildWhereClause', () => {
  it('should handle empty filters', () => {
    const result = buildWhereClause({});

    expect(result).toEqual({});
  });

  it('should ignore undefined and null values', () => {
    const result = buildWhereClause({
      name: 'Test',
      age: undefined,
      email: null,
    });

    expect(result).toEqual({ name: 'Test' });
  });

  it('should handle array values as IN clause', () => {
    const result = buildWhereClause({
      status: ['active', 'pending'],
    });

    expect(result).toEqual({ status: { in: ['active', 'pending'] } });
  });

  it('should handle search filters with contains', () => {
    const result = buildWhereClause({
      nameSearch: 'John',
    });

    expect(result).toEqual({
      name: { contains: 'John', mode: 'insensitive' },
    });
  });

  it('should handle min range filters', () => {
    const result = buildWhereClause({
      minPrice: 100,
    });

    expect(result).toEqual({ price: { gte: 100 } });
  });

  it('should handle max range filters', () => {
    const result = buildWhereClause({
      maxPrice: 500,
    });

    expect(result).toEqual({ price: { lte: 500 } });
  });

  it('should handle multiple filters', () => {
    const result = buildWhereClause({
      status: ['active'],
      minAge: 18,
      maxAge: 65,
      nameSearch: 'Test',
    });

    expect(result).toEqual({
      status: { in: ['active'] },
      age: { gte: 18, lte: 65 },
      name: { contains: 'Test', mode: 'insensitive' },
    });
  });
});

describe('buildDateRangeFilter', () => {
  it('should handle empty range', () => {
    const result = buildDateRangeFilter('createdAt');

    expect(result).toEqual({});
  });

  it('should handle startDate only', () => {
    const startDate = new Date('2024-01-01');
    const result = buildDateRangeFilter('createdAt', startDate);

    expect(result).toEqual({ createdAt: { gte: startDate } });
  });

  it('should handle endDate only', () => {
    const endDate = new Date('2024-12-31');
    const result = buildDateRangeFilter('createdAt', undefined, endDate);

    expect(result).toEqual({ createdAt: { lte: endDate } });
  });

  it('should handle full date range', () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-12-31');
    const result = buildDateRangeFilter('invoiceDate', startDate, endDate);

    expect(result).toEqual({
      invoiceDate: { gte: startDate, lte: endDate },
    });
  });
});

describe('exists', () => {
  it('should return true when record exists', async () => {
    mockPrisma.user.count.mockResolvedValue(1);

    const result = await exists(mockPrisma.user, { email: 'test@test.com' });

    expect(result).toBe(true);
    expect(mockPrisma.user.count).toHaveBeenCalledWith({
      where: { email: 'test@test.com' },
    });
  });

  it('should return false when record does not exist', async () => {
    mockPrisma.user.count.mockResolvedValue(0);

    const result = await exists(mockPrisma.user, { email: 'test@test.com' });

    expect(result).toBe(false);
  });
});

describe('isUnique', () => {
  it('should return true when field is unique', async () => {
    mockPrisma.user.count.mockResolvedValue(0);

    const result = await isUnique(mockPrisma.user, 'email', 'test@test.com');

    expect(result).toBe(true);
    expect(mockPrisma.user.count).toHaveBeenCalledWith({
      where: { email: 'test@test.com' },
    });
  });

  it('should return false when field is not unique', async () => {
    mockPrisma.user.count.mockResolvedValue(1);

    const result = await isUnique(mockPrisma.user, 'email', 'test@test.com');

    expect(result).toBe(false);
  });

  it('should exclude ID from uniqueness check', async () => {
    mockPrisma.user.count.mockResolvedValue(0);

    await isUnique(mockPrisma.user, 'email', 'test@test.com', 'user-123');

    expect(mockPrisma.user.count).toHaveBeenCalledWith({
      where: {
        email: 'test@test.com',
        id: { not: 'user-123' },
      },
    });
  });
});

describe('Transaction Helpers', () => {
  it('should handle successful transactions', async () => {
    const mockCallback = vi.fn().mockResolvedValue('success');
    mockPrisma.$transaction.mockImplementation((callback) =>
      callback(mockPrisma)
    );

    const { transactionWithRetry } = require('../../src/lib/db-helpers');

    const result = await transactionWithRetry(mockPrisma, mockCallback);

    expect(result).toBe('success');
    expect(mockCallback).toHaveBeenCalled();
  });

  it('should retry on deadlock', async () => {
    const mockError = { code: 'P2034' };
    const mockCallback = vi
      .fn()
      .mockRejectedValueOnce(mockError)
      .mockResolvedValue('success');

    mockPrisma.$transaction.mockImplementation((callback) =>
      callback(mockPrisma)
    );

    const { transactionWithRetry } = require('../../src/lib/db-helpers');

    const result = await transactionWithRetry(mockPrisma, mockCallback, 3);

    expect(result).toBe('success');
    expect(mockCallback).toHaveBeenCalledTimes(2);
  });
});

describe('Delete Helpers', () => {
  it('should delete multiple records by IDs', async () => {
    const { deleteManyByIds } = require('../../src/lib/db-helpers');

    const mockResult = { count: 5 };
    mockPrisma.user.deleteMany.mockResolvedValue(mockResult);

    const result = await deleteManyByIds(mockPrisma.user, [
      '1',
      '2',
      '3',
      '4',
      '5',
    ]);

    expect(result).toEqual(mockResult);
    expect(mockPrisma.user.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['1', '2', '3', '4', '5'] } },
    });
  });
});

describe('Aggregation Helpers', () => {
  it('should sum field values', async () => {
    const { sumField } = require('../../src/lib/db-helpers');

    mockPrisma.product.aggregate.mockResolvedValue({
      _sum: { price: 1000 },
    });

    const result = await sumField(mockPrisma.product, 'price');

    expect(result).toBe(1000);
    expect(mockPrisma.product.aggregate).toHaveBeenCalledWith({
      where: undefined,
      _sum: { price: true },
    });
  });

  it('should average field values', async () => {
    const { averageField } = require('../../src/lib/db-helpers');

    mockPrisma.product.aggregate.mockResolvedValue({
      _avg: { price: 50 },
    });

    const result = await averageField(mockPrisma.product, 'price');

    expect(result).toBe(50);
  });

  it('should count by field', async () => {
    const { countByField } = require('../../src/lib/db-helpers');

    mockPrisma.user.groupBy.mockResolvedValue([
      { role: 'admin', _count: 2 },
      { role: 'user', _count: 5 },
    ]);

    const result = await countByField(mockPrisma.user, 'role');

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ role: 'admin', _count: 2 });
  });
});

describe('Soft Delete Helpers', () => {
  it('should soft delete a record', async () => {
    const { softDelete } = require('../../src/lib/db-helpers');

    mockPrisma.user.update.mockResolvedValue({
      id: '123',
      deletedAt: new Date(),
    });

    const result = await softDelete(mockPrisma.user, '123');

    expect(result).toBeDefined();
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: '123' },
      data: { deletedAt: expect.any(Date) },
    });
  });

  it('should restore a soft-deleted record', async () => {
    const { restore } = require('../../src/lib/db-helpers');

    mockPrisma.user.update.mockResolvedValue({
      id: '123',
      deletedAt: null,
    });

    const result = await restore(mockPrisma.user, '123');

    expect(result).toBeDefined();
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: '123' },
      data: { deletedAt: null },
    });
  });

  it('should find only non-deleted records', async () => {
    const { findNotDeleted } = require('../../src/lib/db-helpers');

    mockPrisma.user.findMany.mockResolvedValue([
      { id: '1', deletedAt: null },
      { id: '2', deletedAt: null },
    ]);

    const result = await findNotDeleted(mockPrisma.user);

    expect(result).toHaveLength(2);
    expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
      where: { deletedAt: null },
    });
  });
});
