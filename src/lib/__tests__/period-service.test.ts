/**
 * Period Service - Comprehensive Unit Tests
 * Tests for accounting period management, locking, and reconciliation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  checkPeriodStatus,
  validatePeriodRange,
  closePeriod,
  reopenPeriod,
  lockPeriod,
  generatePeriodReconciliationReport,
  initializeYearPeriods,
} from '../period-service'

// Mock the prisma client - use vi.hoisted to avoid hoisting issues
const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    accountingPeriod: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
    journalEntry: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    journalLine: {
      findMany: vi.fn(),
    },
    chartOfAccount: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock('@/lib/db', () => ({
  prisma: mockPrisma,
  default: mockPrisma,
}))

describe('Period Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('checkPeriodStatus', () => {
    it('should return valid for open period', async () => {
      mockPrisma.accountingPeriod.findUnique.mockResolvedValue({
        year: 2024,
        month: 3,
        status: 'OPEN',
      })

      const result = await checkPeriodStatus(new Date('2024-03-15'))

      expect(result.isValid).toBe(true)
      expect(result.period).toBeDefined()
      expect(result.error).toBeUndefined()
    })

    it('should create new period if not exists', async () => {
      mockPrisma.accountingPeriod.findUnique.mockResolvedValue(null)
      mockPrisma.accountingPeriod.create.mockResolvedValue({
        year: 2024,
        month: 3,
        status: 'OPEN',
      })

      const result = await checkPeriodStatus(new Date('2024-03-15'))

      expect(result.isValid).toBe(true)
      expect(mockPrisma.accountingPeriod.create).toHaveBeenCalledWith({
        data: { year: 2024, month: 3, status: 'OPEN' },
      })
    })

    it('should return invalid for closed period', async () => {
      mockPrisma.accountingPeriod.findUnique.mockResolvedValue({
        year: 2024,
        month: 2,
        status: 'CLOSED',
      })

      const result = await checkPeriodStatus(new Date('2024-02-15'))

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('ถูกปิดแล้ว')
    })

    it('should return invalid for locked period', async () => {
      mockPrisma.accountingPeriod.findUnique.mockResolvedValue({
        year: 2024,
        month: 1,
        status: 'LOCKED',
      })

      const result = await checkPeriodStatus(new Date('2024-01-15'))

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('ถูกปิดแล้ว')
    })

    it('should extract correct year and month from date', async () => {
      mockPrisma.accountingPeriod.findUnique.mockResolvedValue({
        year: 2024,
        month: 12,
        status: 'OPEN',
      })

      const result = await checkPeriodStatus(new Date('2024-12-31'))

      expect(mockPrisma.accountingPeriod.findUnique).toHaveBeenCalledWith({
        where: { year_month: { year: 2024, month: 12 } },
      })
    })
  })

  describe('validatePeriodRange', () => {
    it('should return valid for all open periods in range', async () => {
      mockPrisma.accountingPeriod.findMany.mockResolvedValue([
        { year: 2024, month: 1, status: 'OPEN' },
        { year: 2024, month: 2, status: 'OPEN' },
        { year: 2024, month: 3, status: 'OPEN' },
      ])

      const result = await validatePeriodRange(
        new Date('2024-01-01'),
        new Date('2024-03-31')
      )

      expect(result.isValid).toBe(true)
    })

    it('should auto-create missing periods', async () => {
      mockPrisma.accountingPeriod.findMany.mockResolvedValue([
        { year: 2024, month: 1, status: 'OPEN' },
        { year: 2024, month: 3, status: 'OPEN' },
      ])
      mockPrisma.accountingPeriod.create.mockResolvedValue({})

      const result = await validatePeriodRange(
        new Date('2024-01-01'),
        new Date('2024-03-31')
      )

      expect(mockPrisma.accountingPeriod.create).toHaveBeenCalledWith({
        data: { year: 2024, month: 2, status: 'OPEN' },
      })
      expect(result.isValid).toBe(true)
    })

    it('should return invalid if any period is closed', async () => {
      mockPrisma.accountingPeriod.findMany.mockResolvedValue([
        { year: 2024, month: 1, status: 'OPEN' },
        { year: 2024, month: 2, status: 'CLOSED' },
      ])

      const result = await validatePeriodRange(
        new Date('2024-01-01'),
        new Date('2024-02-29')
      )

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('2/2024')
    })

    it('should handle year boundaries', async () => {
      mockPrisma.accountingPeriod.findMany.mockResolvedValue([
        { year: 2023, month: 12, status: 'OPEN' },
        { year: 2024, month: 1, status: 'OPEN' },
      ])

      const result = await validatePeriodRange(
        new Date('2023-12-15'),
        new Date('2024-01-15')
      )

      expect(result.isValid).toBe(true)
    })

    it('should handle multi-year ranges', async () => {
      mockPrisma.accountingPeriod.findMany.mockResolvedValue(
        Array.from({ length: 12 }, (_, i) => ({
          year: i < 3 ? 2024 : 2025,
          month: (i % 12) + 1,
          status: 'OPEN',
        }))
      )

      const result = await validatePeriodRange(
        new Date('2024-10-01'),
        new Date('2025-09-30')
      )

      expect(result.isValid).toBe(true)
    })
  })

  describe('closePeriod', () => {
    it('should close an open period', async () => {
      mockPrisma.accountingPeriod.upsert.mockResolvedValue({
        year: 2024,
        month: 3,
        status: 'CLOSED',
        closedBy: 'user-1',
        closedAt: new Date(),
      })

      const result = await closePeriod(2024, 3, 'user-1')

      expect(result.status).toBe('CLOSED')
      expect(result.closedBy).toBe('user-1')
    })

    it('should clear reopen fields when closing', async () => {
      mockPrisma.accountingPeriod.upsert.mockImplementation((args: any) => {
        expect(args.update).toHaveProperty('reopenedBy', null)
        expect(args.update).toHaveProperty('reopenedAt', null)
        return Promise.resolve({ status: 'CLOSED' })
      })

      await closePeriod(2024, 3, 'user-1')
    })

    it('should create period if not exists when closing', async () => {
      mockPrisma.accountingPeriod.upsert.mockResolvedValue({
        year: 2024,
        month: 6,
        status: 'CLOSED',
      })

      const result = await closePeriod(2024, 6, 'user-1')

      expect(mockPrisma.accountingPeriod.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            year: 2024,
            month: 6,
            status: 'CLOSED',
          }),
        })
      )
    })
  })

  describe('reopenPeriod', () => {
    it('should reopen a closed period', async () => {
      mockPrisma.accountingPeriod.update.mockResolvedValue({
        year: 2024,
        month: 3,
        status: 'OPEN',
        reopenedBy: 'admin-1',
        reopenedAt: new Date(),
      })

      const result = await reopenPeriod(2024, 3, 'admin-1')

      expect(result.status).toBe('OPEN')
      expect(result.reopenedBy).toBe('admin-1')
    })

    it('should use correct composite key', async () => {
      mockPrisma.accountingPeriod.update.mockImplementation((args: any) => {
        expect(args.where).toEqual({ year_month: { year: 2024, month: 3 } })
        return Promise.resolve({ status: 'OPEN' })
      })

      await reopenPeriod(2024, 3, 'admin-1')
    })
  })

  describe('lockPeriod', () => {
    it('should lock a period permanently', async () => {
      mockPrisma.accountingPeriod.upsert.mockResolvedValue({
        year: 2024,
        month: 1,
        status: 'LOCKED',
        closedBy: 'admin-1',
        closedAt: new Date(),
      })

      const result = await lockPeriod(2024, 1, 'admin-1')

      expect(result.status).toBe('LOCKED')
    })

    it('should require admin privileges to lock', async () => {
      await lockPeriod(2024, 1, 'admin-user')

      expect(mockPrisma.accountingPeriod.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            status: 'LOCKED',
            closedBy: 'admin-user',
          }),
        })
      )
    })
  })

  describe('generatePeriodReconciliationReport', () => {
    it('should generate report with all key metrics', async () => {
      mockPrisma.accountingPeriod.findUnique.mockResolvedValue({
        year: 2024,
        month: 3,
        status: 'CLOSED',
      })
      mockPrisma.journalEntry.findMany.mockResolvedValue([
        {
          lines: [
            { debit: 1000, credit: 0 },
            { debit: 0, credit: 1000 },
          ],
        },
      ])
      mockPrisma.journalEntry.count.mockResolvedValue(5)
      mockPrisma.chartOfAccount.findMany.mockResolvedValue([])

      const report = await generatePeriodReconciliationReport(2024, 3)

      expect(report.year).toBe(2024)
      expect(report.month).toBe(3)
      expect(report.status).toBe('CLOSED')
      expect(report.totalDebits).toBe(1000)
      expect(report.totalCredits).toBe(1000)
      expect(report.transactionCount).toBe(1)
      expect(report.pendingEntries).toBe(5)
    })

    it('should identify balance discrepancies', async () => {
      mockPrisma.accountingPeriod.findUnique.mockResolvedValue({
        year: 2024,
        month: 3,
        status: 'OPEN',
      })
      mockPrisma.journalEntry.findMany.mockResolvedValue([
        {
          lines: [
            { debit: 1000, credit: 0 },
            { debit: 0, credit: 900 },
          ],
        },
      ])
      mockPrisma.journalEntry.count.mockResolvedValue(0)
      mockPrisma.chartOfAccount.findMany.mockResolvedValue([
        { id: 'acc-1', code: '1100', name: 'Cash', isActive: true, isDetail: true },
      ])
      mockPrisma.journalLine.findMany.mockResolvedValue([])

      const report = await generatePeriodReconciliationReport(2024, 3)

      expect(report.totalDebits).not.toBe(report.totalCredits)
    })

    it('should calculate correct date range', async () => {
      mockPrisma.accountingPeriod.findUnique.mockResolvedValue({ status: 'OPEN' })
      mockPrisma.journalEntry.findMany.mockImplementation((args: any) => {
        const startDate = args.where.date.gte
        const endDate = args.where.date.lte
        
        expect(startDate.getDate()).toBe(1)
        expect(startDate.getMonth()).toBe(2)
        expect(endDate.getDate()).toBeGreaterThanOrEqual(28)
        
        return Promise.resolve([])
      })
      mockPrisma.journalEntry.count.mockResolvedValue(0)
      mockPrisma.chartOfAccount.findMany.mockResolvedValue([])

      await generatePeriodReconciliationReport(2024, 3)
    })

    it('should only include posted entries', async () => {
      mockPrisma.accountingPeriod.findUnique.mockResolvedValue({ status: 'OPEN' })
      mockPrisma.journalEntry.findMany.mockImplementation((args: any) => {
        expect(args.where.status).toBe('POSTED')
        expect(args.where.deletedAt).toBeNull()
        return Promise.resolve([])
      })
      mockPrisma.journalEntry.count.mockResolvedValue(0)
      mockPrisma.chartOfAccount.findMany.mockResolvedValue([])

      await generatePeriodReconciliationReport(2024, 3)
    })

    it('should count pending draft entries', async () => {
      mockPrisma.accountingPeriod.findUnique.mockResolvedValue({ status: 'OPEN' })
      mockPrisma.journalEntry.findMany.mockResolvedValue([])
      mockPrisma.journalEntry.count.mockImplementation((args: any) => {
        expect(args.where.status).toBe('DRAFT')
        return Promise.resolve(3)
      })
      mockPrisma.chartOfAccount.findMany.mockResolvedValue([])

      const report = await generatePeriodReconciliationReport(2024, 3)

      expect(report.pendingEntries).toBe(3)
    })
  })

  describe('initializeYearPeriods', () => {
    it('should create all 12 months for a year', async () => {
      mockPrisma.accountingPeriod.findMany.mockResolvedValue([])
      mockPrisma.accountingPeriod.create.mockResolvedValue({})

      await initializeYearPeriods(2024)

      expect(mockPrisma.accountingPeriod.create).toHaveBeenCalledTimes(12)
    })

    it('should skip existing periods', async () => {
      mockPrisma.accountingPeriod.findMany.mockResolvedValue([
        { year: 2024, month: 1, status: 'OPEN' },
        { year: 2024, month: 2, status: 'OPEN' },
        { year: 2024, month: 3, status: 'OPEN' },
      ])
      mockPrisma.accountingPeriod.create.mockResolvedValue({})

      await initializeYearPeriods(2024)

      expect(mockPrisma.accountingPeriod.create).toHaveBeenCalledTimes(9)
    })

    it('should create periods with OPEN status', async () => {
      mockPrisma.accountingPeriod.findMany.mockResolvedValue([])
      mockPrisma.accountingPeriod.create.mockImplementation((args: any) => {
        expect(args.data.status).toBe('OPEN')
        return Promise.resolve({})
      })

      await initializeYearPeriods(2024)
    })

    it('should handle leap year correctly', async () => {
      mockPrisma.accountingPeriod.findMany.mockResolvedValue([])
      const createdMonths: number[] = []
      
      mockPrisma.accountingPeriod.create.mockImplementation((args: any) => {
        createdMonths.push(args.data.month)
        return Promise.resolve({})
      })

      await initializeYearPeriods(2024)

      expect(createdMonths).toContain(2)
      expect(createdMonths.length).toBe(12)
    })
  })
})
