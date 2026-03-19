/**
 * Inventory Service - Comprehensive Unit Tests
 * Tests for stock movements, WAC costing, and COGS calculations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  recordStockMovement, 
  calculateCOGS, 
  getInventoryValuation 
} from '../inventory-service'

// Mock the prisma client
vi.mock('@/lib/db', () => ({
  default: {
    $transaction: vi.fn((callback: any) => callback({
      stockBalance: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
      },
      product: {
        findUnique: vi.fn(),
      },
      stockMovement: {
        create: vi.fn(),
      },
    })),
    stockBalance: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

describe('Inventory Service', () => {
  describe('Weighted Average Costing (WAC)', () => {
    it('should calculate new WAC for incoming stock', async () => {
      const mockTx = {
        stockBalance: {
          findUnique: vi.fn().mockResolvedValue({
            productId: 'prod-1',
            warehouseId: 'wh-1',
            quantity: 100,
            unitCost: 50,
            totalCost: 5000,
            product: { costingMethod: 'WEIGHTED_AVERAGE' },
          }),
          upsert: vi.fn().mockResolvedValue({
            quantity: 150,
            unitCost: 53.33,
            totalCost: 8000,
          }),
        },
        product: {
          findUnique: vi.fn().mockResolvedValue({ costingMethod: 'WEIGHTED_AVERAGE' }),
        },
        stockMovement: {
          create: vi.fn().mockResolvedValue({
            id: 'mov-1',
            type: 'RECEIVE',
            quantity: 50,
            unitCost: 60,
          }),
        },
      }

      const mockPrisma = (await import('@/lib/db')).default
      mockPrisma.$transaction.mockImplementation((callback: any) => callback(mockTx))

      const result = await recordStockMovement({
        productId: 'prod-1',
        warehouseId: 'wh-1',
        type: 'RECEIVE',
        quantity: 50,
        unitCost: 60,
      })

      expect(result.balance.quantity).toBe(150)
    })

    it('should reduce stock on outgoing movement', async () => {
      const mockTx = {
        stockBalance: {
          findUnique: vi.fn().mockResolvedValue({
            productId: 'prod-1',
            warehouseId: 'wh-1',
            quantity: 100,
            unitCost: 50,
            totalCost: 5000,
            product: { costingMethod: 'WEIGHTED_AVERAGE' },
          }),
          upsert: vi.fn().mockResolvedValue({
            quantity: 70,
            unitCost: 50,
            totalCost: 3500,
          }),
        },
        product: {
          findUnique: vi.fn().mockResolvedValue({ costingMethod: 'WEIGHTED_AVERAGE' }),
        },
        stockMovement: {
          create: vi.fn().mockResolvedValue({
            id: 'mov-1',
            type: 'ISSUE',
            quantity: 30,
            unitCost: 50,
          }),
        },
      }

      const mockPrisma = (await import('@/lib/db')).default
      mockPrisma.$transaction.mockImplementation((callback: any) => callback(mockTx))

      const result = await recordStockMovement({
        productId: 'prod-1',
        warehouseId: 'wh-1',
        type: 'ISSUE',
        quantity: 30,
        unitCost: 50,
      })

      expect(result.balance.quantity).toBe(70)
    })

    it('should throw error when insufficient stock', async () => {
      const mockTx = {
        stockBalance: {
          findUnique: vi.fn().mockResolvedValue({
            productId: 'prod-1',
            warehouseId: 'wh-1',
            quantity: 10,
            unitCost: 50,
            totalCost: 500,
            product: { costingMethod: 'WEIGHTED_AVERAGE' },
          }),
        },
        product: {
          findUnique: vi.fn().mockResolvedValue({ costingMethod: 'WEIGHTED_AVERAGE' }),
        },
      }

      const mockPrisma = (await import('@/lib/db')).default
      mockPrisma.$transaction.mockImplementation((callback: any) => callback(mockTx))

      await expect(recordStockMovement({
        productId: 'prod-1',
        warehouseId: 'wh-1',
        type: 'ISSUE',
        quantity: 30,
        unitCost: 50,
      })).rejects.toThrow('สต็อกไม่เพียงพอ')
    })

    it('should handle stock adjustment', async () => {
      const mockTx = {
        stockBalance: {
          findUnique: vi.fn().mockResolvedValue({
            productId: 'prod-1',
            warehouseId: 'wh-1',
            quantity: 100,
            unitCost: 50,
            totalCost: 5000,
            product: { costingMethod: 'WEIGHTED_AVERAGE' },
          }),
          upsert: vi.fn().mockResolvedValue({
            quantity: 95,
            unitCost: 50,
            totalCost: 4750,
          }),
        },
        product: {
          findUnique: vi.fn().mockResolvedValue({ costingMethod: 'WEIGHTED_AVERAGE' }),
        },
        stockMovement: {
          create: vi.fn(),
        },
      }

      const mockPrisma = (await import('@/lib/db')).default
      mockPrisma.$transaction.mockImplementation((callback: any) => callback(mockTx))

      const result = await recordStockMovement({
        productId: 'prod-1',
        warehouseId: 'wh-1',
        type: 'ADJUST',
        quantity: -5,
        unitCost: 50,
      })

      expect(result.balance.quantity).toBe(95)
    })

    it('should handle transfer in movement', async () => {
      const mockTx = {
        stockBalance: {
          findUnique: vi.fn().mockResolvedValue(null),
          upsert: vi.fn().mockResolvedValue({
            quantity: 50,
            unitCost: 40,
            totalCost: 2000,
          }),
        },
        product: {
          findUnique: vi.fn().mockResolvedValue({ costingMethod: 'WEIGHTED_AVERAGE' }),
        },
        stockMovement: {
          create: vi.fn().mockResolvedValue({
            id: 'mov-1',
            type: 'TRANSFER_IN',
            quantity: 50,
            unitCost: 40,
          }),
        },
      }

      const mockPrisma = (await import('@/lib/db')).default
      mockPrisma.$transaction.mockImplementation((callback: any) => callback(mockTx))

      const result = await recordStockMovement({
        productId: 'prod-1',
        warehouseId: 'wh-2',
        type: 'TRANSFER_IN',
        quantity: 50,
        unitCost: 40,
      })

      expect(result.balance.quantity).toBe(50)
    })
  })

  describe('COGS Calculation', () => {
    it('should calculate COGS based on current unit cost', async () => {
      const mockPrisma = (await import('@/lib/db')).default
      mockPrisma.stockBalance.findUnique.mockResolvedValue({
        productId: 'prod-1',
        warehouseId: 'wh-1',
        unitCost: 50,
        quantity: 100,
      })

      const cogs = await calculateCOGS('prod-1', 'wh-1', 10)
      expect(cogs).toBe(500) // 10 * 50
    })

    it('should return 0 when no stock balance exists', async () => {
      const mockPrisma = (await import('@/lib/db')).default
      mockPrisma.stockBalance.findUnique.mockResolvedValue(null)

      const cogs = await calculateCOGS('prod-1', 'wh-1', 10)
      expect(cogs).toBe(0)
    })

    it('should handle zero quantity', async () => {
      const mockPrisma = (await import('@/lib/db')).default
      mockPrisma.stockBalance.findUnique.mockResolvedValue({
        productId: 'prod-1',
        warehouseId: 'wh-1',
        unitCost: 50,
        quantity: 100,
      })

      const cogs = await calculateCOGS('prod-1', 'wh-1', 0)
      expect(cogs).toBe(0)
    })
  })

  describe('Inventory Valuation', () => {
    it('should calculate total inventory value', async () => {
      const mockPrisma = (await import('@/lib/db')).default
      mockPrisma.stockBalance.findMany.mockResolvedValue([
        {
          productId: 'prod-1',
          warehouseId: 'wh-1',
          quantity: 100,
          unitCost: 50,
          totalCost: 5000,
          product: { code: 'P001', name: 'Product 1' },
          warehouse: { code: 'W01', name: 'Warehouse 1' },
        },
        {
          productId: 'prod-2',
          warehouseId: 'wh-1',
          quantity: 50,
          unitCost: 100,
          totalCost: 5000,
          product: { code: 'P002', name: 'Product 2' },
          warehouse: { code: 'W01', name: 'Warehouse 1' },
        },
      ])

      const result = await getInventoryValuation('wh-1')

      expect(result.totalValue).toBe(10000)
      expect(result.summary.totalProducts).toBe(2)
      expect(result.summary.totalQty).toBe(150)
    })

    it('should calculate valuation for all warehouses when no warehouse specified', async () => {
      const mockPrisma = (await import('@/lib/db')).default
      mockPrisma.stockBalance.findMany.mockResolvedValue([
        {
          productId: 'prod-1',
          warehouseId: 'wh-1',
          quantity: 100,
          unitCost: 50,
          totalCost: 5000,
          product: { code: 'P001', name: 'Product 1' },
          warehouse: { code: 'W01', name: 'Warehouse 1' },
        },
        {
          productId: 'prod-1',
          warehouseId: 'wh-2',
          quantity: 50,
          unitCost: 50,
          totalCost: 2500,
          product: { code: 'P001', name: 'Product 1' },
          warehouse: { code: 'W02', name: 'Warehouse 2' },
        },
      ])

      const result = await getInventoryValuation()

      expect(result.totalValue).toBe(7500)
      expect(result.balances).toHaveLength(2)
    })

    it('should handle empty inventory', async () => {
      const mockPrisma = (await import('@/lib/db')).default
      mockPrisma.stockBalance.findMany.mockResolvedValue([])

      const result = await getInventoryValuation()

      expect(result.totalValue).toBe(0)
      expect(result.summary.totalProducts).toBe(0)
      expect(result.summary.totalQty).toBe(0)
    })
  })

  describe('Stock Movement Recording', () => {
    it('should include metadata in movement record', async () => {
      const mockTx = {
        stockBalance: {
          findUnique: vi.fn().mockResolvedValue({
            productId: 'prod-1',
            warehouseId: 'wh-1',
            quantity: 100,
            unitCost: 50,
            totalCost: 5000,
            product: { costingMethod: 'WEIGHTED_AVERAGE' },
          }),
          upsert: vi.fn().mockResolvedValue({
            quantity: 110,
            unitCost: 50,
            totalCost: 5500,
          }),
        },
        product: {
          findUnique: vi.fn().mockResolvedValue({ costingMethod: 'WEIGHTED_AVERAGE' }),
        },
        stockMovement: {
          create: vi.fn().mockImplementation((data: any) => Promise.resolve({
            id: 'mov-1',
            ...data.data,
          })),
        },
      }

      const mockPrisma = (await import('@/lib/db')).default
      mockPrisma.$transaction.mockImplementation((callback: any) => callback(mockTx))

      const metadata = { invoiceNo: 'INV-001', batchNo: 'B001' }
      await recordStockMovement({
        productId: 'prod-1',
        warehouseId: 'wh-1',
        type: 'RECEIVE',
        quantity: 10,
        unitCost: 50,
        referenceId: 'ref-1',
        referenceNo: 'REF-001',
        notes: 'Test receipt',
        sourceChannel: 'WEB',
        metadata,
      })

      expect(mockTx.stockMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            referenceId: 'ref-1',
            referenceNo: 'REF-001',
            notes: 'Test receipt',
            sourceChannel: 'WEB',
            metadata,
          }),
        })
      )
    })
  })
})
